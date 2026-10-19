// src/pages/Operacional/CompraAnimais/MovementPurchaseExpenseAllocation.tsx
// -----------------------------------------------------------------------------
// 088 D3-FE-T3 — bloco "Rateio" da Compra de Animais, reescrito para o contrato
// legado (EF:431-475 cascata, EF:606-686 valor ↔ %, EF:349-429 adicionar/remover).
//
// Linha: Categoria Financeira | Conta Contábil | Centro de Custo | % | Valor.
//  - Cascata (IG-06) ao trocar a categoria: a Conta Contábil é SUBSTITUÍDA pelo
//    1º item de `/plan-accounts/options?category_uuid` (conditions[]=1,3, class=2,
//    is_enabled) — sem conta, limpa; o Centro só é PRÉ-SELECIONADO (1º de
//    by-category) e nunca sobrescreve escolha manual nem centro hidratado.
//  - Blur do valor/% (IG-03/IG-04) usa o módulo puro `movementPurchaseFinancialMath`
//    (centavos inteiros): soma excede → mensagem do legado e linha zerada;
//    Σ% = 100 → redistribui (maiores restos); total 0 → aviso, sem NaN.
//  - Adicionar bloqueado com linha incompleta (Conta vazia NÃO bloqueia);
//    remover pede confirmação e nunca deixa zero linhas; remover não recalcula.
//  - Rodapé derivado: Valor total / Rateado / % rateado + aviso de diferença.
//
// O total vem do campo `total` do form (`useWatch`). Estado das linhas no RHF
// em reais (`value`/`percent` `number`); validação em
// `movement-purchase-allocation-schema.ts`.
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react';

import { Alert, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { AllocationCostCenterSelect } from '@/components/Form/AllocationCostCenterSelect';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { resolveCascadeCostCenter } from '@/utils/allocationCostCenter';

import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listPlanAccountOptions } from '@/services/v2/PlanAccounts/plan-account-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type {
  MovementPurchaseFinAllocationRow,
  MovementPurchaseForm,
} from '@/@types/v2/MovementPurchases';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

import {
  applyPercentBlur,
  applyValueBlur,
  fromCents,
  percentOf,
  sumCents,
  toCents,
  type AllocationMathRow,
  type AllocationWarning,
} from './movementPurchaseFinancialMath';

export interface MovementPurchaseExpenseAllocationProps {
  control: Control<MovementPurchaseForm>;
  /** Só `id` é usado (chave estável de cada linha do `useFieldArray`). */
  fields: Array<{ id: string }>;
  append: UseFieldArrayAppend<MovementPurchaseForm, 'financial_allocations'>;
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<MovementPurchaseForm>;
  errors: FieldErrors<MovementPurchaseForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

// `category_types` (banco `gbcerne`): 1=Saídas, 2=Entradas, 3=Ambas — DESPESA = Saídas+Ambas.
const FINANCIAL_CATEGORY_TYPE_SAIDAS = 1;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;
// `plan_accounts.condition`: 1=Devedor, 2=Credor, 3=Ambos — despesa usa Devedor+Ambos.
const PLAN_ACCOUNT_CONDITIONS = [1, 3];
const PLAN_ACCOUNT_CLASS_ANALYTICAL = 2;

const findCategoryParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  type_ids: [FINANCIAL_CATEGORY_TYPE_SAIDAS, FINANCIAL_CATEGORY_TYPE_AMBAS],
  is_enabled: 'true' as const,
  cost_center_scoped: true,
});

const findPlanAccountParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  conditions: PLAN_ACCOUNT_CONDITIONS,
  class: PLAN_ACCOUNT_CLASS_ANALYTICAL as 2,
  is_enabled: 'true' as const,
});

function mapPlanAccountToOption(item: PlanAccountRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const EMPTY_ROW: MovementPurchaseFinAllocationRow = {
  category: null,
  plan_account: null,
  center: null,
  percent: null,
  value: null,
};

// Linha completa para adicionar outra (legado IG-11): categoria, centro, % e valor;
// a Conta Contábil é opcional.
export function isAllocationRowComplete(
  row: Partial<MovementPurchaseFinAllocationRow> | undefined | null
): boolean {
  return (
    !!row?.category?.value &&
    !!row?.center?.value &&
    row?.percent !== null &&
    row?.percent !== undefined &&
    row?.value !== null &&
    row?.value !== undefined
  );
}

interface RowProps {
  control: Control<MovementPurchaseForm>;
  index: number;
  rowId: string;
  disabled: boolean;
  financialText: LanguageDate['movementPurchases']['movementPurchase']['form']['financial']['allocation'];
  onCategoryChange: (rowId: string, index: number, categoryUuid: string | null) => void;
  onCenterTouched: (rowId: string) => void;
  onAccountTouched: (rowId: string) => void;
  onCellChange: (index: number, patch: Partial<MovementPurchaseFinAllocationRow>) => void;
  onValueBlur: (index: number) => void;
  onPercentBlur: (index: number) => void;
  onRequestRemove: (index: number) => void;
}

// Componente PRÓPRIO por linha — `useController` não pode viver dentro de `.map()`.
function MovementPurchaseExpenseAllocationRow({
  control,
  index,
  rowId,
  disabled,
  financialText,
  onCategoryChange,
  onCenterTouched,
  onAccountTouched,
  onCellChange,
  onValueBlur,
  onPercentBlur,
  onRequestRemove,
}: RowProps) {
  const { field: categoryField, fieldState: categoryState } = useController({
    control,
    name: `financial_allocations.${index}.category`,
  });
  const { field: accountField } = useController({
    control,
    name: `financial_allocations.${index}.plan_account`,
  });
  const { field: centerField, fieldState: centerState } = useController({
    control,
    name: `financial_allocations.${index}.center`,
  });
  const { field: percentField, fieldState: percentState } = useController({
    control,
    name: `financial_allocations.${index}.percent`,
  });
  const { field: valueField, fieldState: valueState } = useController({
    control,
    name: `financial_allocations.${index}.value`,
  });

  return (
    <Flex gap={3} align="flex-start" wrap="wrap" data-testid={`allocation-row-${index}`}>
      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={categoryField.name}
          label={financialText.category}
          placeholder={financialText.categoryPlaceholder}
          service={listFinancialCategoryOptions}
          mapOptions={(item: FinancialCategoryOption) => ({
            label: `${item.code} — ${item.description}`,
            value: item.uuid,
          })}
          findParams={findCategoryParams}
          value={categoryField.value ?? null}
          onChange={(selected) => {
            const option = (selected as Option<string> | null) ?? null;
            categoryField.onChange(option);
            onCellChange(index, { category: option });
            onCategoryChange(rowId, index, option?.value ?? null);
          }}
          error={categoryState.error?.message}
          isRequired
          isDisabled={disabled}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </Box>

      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={accountField.name}
          label={financialText.account}
          placeholder={financialText.accountPlaceholder}
          service={listPlanAccountOptions}
          mapOptions={mapPlanAccountToOption}
          findParams={findPlanAccountParams}
          value={accountField.value ?? null}
          onChange={(selected) => {
            const option = (selected as Option<string> | null) ?? null;
            onAccountTouched(rowId);
            accountField.onChange(option);
            onCellChange(index, { plan_account: option });
          }}
          isDisabled={disabled}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </Box>

      <Box flex="1" minW="220px">
        <AllocationCostCenterSelect
          name={centerField.name}
          label={financialText.costCenter}
          placeholder={financialText.costCenterPlaceholder}
          value={centerField.value ?? null}
          onChange={(option) => {
            onCenterTouched(rowId);
            centerField.onChange(option ?? null);
            onCellChange(index, { center: option ?? null });
          }}
          error={centerState.error?.message}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box w={{ base: 'full', sm: '130px' }}>
        <PercentInput
          name={percentField.name}
          label={financialText.percent}
          value={percentField.value ?? null}
          maxValue={100}
          error={percentState.error?.message}
          isRequired
          disabled={disabled}
          onValueChange={(next) => {
            percentField.onChange(next);
            onCellChange(index, { percent: next });
          }}
          onBlur={() => onPercentBlur(index)}
        />
      </Box>

      <Box w={{ base: 'full', sm: '160px' }}>
        <MoneyInput
          name={valueField.name}
          label={financialText.value}
          value={valueField.value ?? null}
          error={valueState.error?.message}
          isRequired
          disabled={disabled}
          onValueChange={(next) => {
            valueField.onChange(next);
            onCellChange(index, { value: next });
          }}
          onBlur={() => onValueBlur(index)}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {financialText.removeRow}
        </Flex>
        <IconButtonTable
          aria-label={financialText.removeRow}
          mensegerTooltip={financialText.removeRow}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => onRequestRemove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPercent = (value: number) =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export function MovementPurchaseExpenseAllocation({
  control,
  fields,
  append,
  remove,
  setValue,
  errors,
  languageGB,
  disabled = false,
}: MovementPurchaseExpenseAllocationProps) {
  const form = languageGB.movementPurchases.movementPurchase.form.financial;
  const financialText = form.allocation;
  const messages = form.messages;

  const arrayError =
    errors.financial_allocations?.message ?? errors.financial_allocations?.root?.message;

  const watchedRows = useWatch({ control, name: 'financial_allocations' }) ?? [];
  const watchedTotal = useWatch({ control, name: 'total' });
  const totalCents = toCents(Number(watchedTotal) || 0);

  // Refs (leitura pós-await/blur sem closure velha). `rowsRef` recebe a edição
  // imediatamente (antes do re-render do `useWatch`).
  const rowsRef = useRef<MovementPurchaseFinAllocationRow[]>([]);
  rowsRef.current = watchedRows;
  const totalCentsRef = useRef(0);
  totalCentsRef.current = totalCents;
  // Centro: último AUTO-selecionado por linha (só ele pode ser trocado pela pré-seleção).
  const autoCenterByRow = useRef<Record<string, string>>({});
  const touchedCenterByRow = useRef<Record<string, boolean>>({});
  // Token por linha: resposta tardia da cascata de conta não vence escolha posterior.
  const accountRequestByRow = useRef<Record<string, number>>({});

  function handleCellChange(index: number, patch: Partial<MovementPurchaseFinAllocationRow>) {
    const next = rowsRef.current.slice();
    next[index] = { ...(next[index] ?? EMPTY_ROW), ...patch };
    rowsRef.current = next;
  }

  function writeRow(index: number, patch: Partial<MovementPurchaseFinAllocationRow>) {
    handleCellChange(index, patch);
    (Object.keys(patch) as (keyof MovementPurchaseFinAllocationRow)[]).forEach((key) => {
      setValue(`financial_allocations.${index}.${key}`, patch[key] as never, {
        shouldDirty: true,
      });
    });
  }

  function handleCenterTouched(rowId: string) {
    touchedCenterByRow.current[rowId] = true;
  }
  function handleAccountTouched(rowId: string) {
    // invalida cascata de conta em voo
    accountRequestByRow.current[rowId] = (accountRequestByRow.current[rowId] ?? 0) + 1;
  }

  async function runCenterCascade(rowId: string, index: number, categoryUuid: string) {
    const preselected = await resolveCascadeCostCenter(categoryUuid);
    if (!preselected || touchedCenterByRow.current[rowId]) return;
    const current = rowsRef.current[index]?.center?.value as string | undefined;
    if (current && current !== autoCenterByRow.current[rowId]) return;
    autoCenterByRow.current[rowId] = preselected.value;
    writeRow(index, { center: preselected });
  }

  // IG-06: troca de categoria SUBSTITUI a conta pelo 1º item da lista da categoria;
  // sem conta (ou falha) limpa. Categoria vazia limpa a conta.
  async function runAccountCascade(rowId: string, index: number, categoryUuid: string | null) {
    const ticket = (accountRequestByRow.current[rowId] ?? 0) + 1;
    accountRequestByRow.current[rowId] = ticket;
    if (!categoryUuid) {
      writeRow(index, { plan_account: null });
      return;
    }
    let account: Option<string> | null = null;
    try {
      const response = await listPlanAccountOptions({
        category_uuid: categoryUuid,
        conditions: PLAN_ACCOUNT_CONDITIONS,
        class: PLAN_ACCOUNT_CLASS_ANALYTICAL,
        is_enabled: 'true',
      });
      const first = response.data?.items?.[0];
      account = first ? mapPlanAccountToOption(first) : null;
    } catch {
      account = null;
    }
    if (accountRequestByRow.current[rowId] !== ticket) return;
    writeRow(index, { plan_account: account });
  }

  function handleCategoryChange(rowId: string, index: number, categoryUuid: string | null) {
    void runAccountCascade(rowId, index, categoryUuid);
    if (categoryUuid) void runCenterCascade(rowId, index, categoryUuid);
  }

  function warn(warning: AllocationWarning | undefined) {
    if (!warning) return;
    toaster.warning({
      description:
        warning === 'FILL_TOTAL_FIRST' ? messages.fillTotalFirst : messages.allocationExceeds,
    });
  }

  function applyMathResult(
    index: number,
    compute: (
      rows: AllocationMathRow[],
      idx: number,
      total: number
    ) => ReturnType<typeof applyValueBlur>
  ) {
    const current = rowsRef.current;
    const mathRows: AllocationMathRow[] = current.map((row) => ({
      valueCents: toCents(row?.value),
      percent: Number(row?.percent) || 0,
    }));
    const result = compute(mathRows, index, totalCentsRef.current);
    result.rows.forEach((mathRow, i) => {
      const before = mathRows[i];
      if (mathRow.valueCents === before.valueCents && mathRow.percent === before.percent) return;
      writeRow(i, { value: fromCents(mathRow.valueCents), percent: mathRow.percent });
    });
    warn(result.warning);
  }

  // IG-03 / IG-04.
  const handleValueBlur = (index: number) => applyMathResult(index, applyValueBlur);
  const handlePercentBlur = (index: number) => applyMathResult(index, applyPercentBlur);

  function handleAdd() {
    const last = watchedRows[watchedRows.length - 1];
    if (watchedRows.length > 0 && !isAllocationRowComplete(last)) {
      toaster.warning({ description: messages.fillRowBeforeAdd });
      return;
    }
    append({ ...EMPTY_ROW });
  }

  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);

  // Legado IG-12: confirma e, só então, nunca deixa zero linhas. Não recalcula.
  function handleConfirmRemove() {
    const index = rowIndexToRemove;
    setRowIndexToRemove(null);
    if (index === null) return;
    if (fields.length <= 1) {
      toaster.warning({ description: messages.minOneRow });
      return;
    }
    remove(index);
  }

  const allocatedCents = sumCents(watchedRows.map((row) => toCents(row?.value)));
  const allocatedPercent = sumCents(
    watchedRows.map((row) => Math.round(percentOf(toCents(row?.value), totalCents) * 100))
  );
  const hasDifference = fields.length > 0 && allocatedCents !== totalCents;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold">
        {financialText.sectionTitle}
      </Text>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mt={2} role="alert">
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2} mt={2}>
          <Text fontSize="sm" color="fg.muted">
            {financialText.emptyRows}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mt={4} mb={4}>
          {fields.map((field, index) => (
            <MovementPurchaseExpenseAllocationRow
              key={field.id}
              control={control}
              index={index}
              rowId={field.id}
              disabled={disabled}
              financialText={financialText}
              onCategoryChange={handleCategoryChange}
              onCenterTouched={handleCenterTouched}
              onAccountTouched={handleAccountTouched}
              onCellChange={handleCellChange}
              onValueBlur={handleValueBlur}
              onPercentBlur={handlePercentBlur}
              onRequestRemove={setRowIndexToRemove}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={financialText.addRow}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />

      <Flex gap={6} wrap="wrap" mt={4} fontSize="sm" data-testid="allocation-footer">
        <Text>
          {financialText.totalLabel}: <strong>{formatBRL(fromCents(totalCents))}</strong>
        </Text>
        <Text>
          {financialText.allocatedLabel}: <strong>{formatBRL(fromCents(allocatedCents))}</strong>
        </Text>
        <Text>
          {financialText.percentTotalLabel}:{' '}
          <strong>{formatPercent(allocatedPercent / 100)}</strong>
        </Text>
      </Flex>

      {hasDifference && (
        <Alert.Root status="warning" borderRadius="md" mt={3}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{financialText.differenceWarning}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      <DeleteConfirmDialog
        isOpen={rowIndexToRemove !== null}
        onClose={() => setRowIndexToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={messages.removeConfirmTitle}
        description={messages.removeConfirmText}
        confirmButtonText={financialText.removeRow}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}

export default MovementPurchaseExpenseAllocation;
