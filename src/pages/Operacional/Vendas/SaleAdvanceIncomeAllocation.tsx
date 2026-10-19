// src/pages/Operacional/Vendas/SaleAdvanceIncomeAllocation.tsx
// -----------------------------------------------------------------------------
// Rateio do Adiantamento da Venda COMERCIAL (Sale — venda de PRODUTOS,
// Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-08, `S-SUB-003`/
// `S-LIST-003`/`FM007`). Copy-adapt EXATO de
// `Operacional/VendaAnimais/MovementSaleIncomeAllocation.tsx` (fonte
// primária, já resolve cascata Categoria→Centro→Conta Contábil, reidratação
// de rótulos por `uuid` e `(%)` recalculado só no BLUR) cruzado com
// `Incomes/IncomeApportionmentTab.tsx` (`canAddRow`, remoção com
// confirmação, autofill de conta contábil pela categoria).
//
// PROIBIDO: `src/components/MovementAllocationEditor/MovementAllocationEditor.tsx`
// (617 linhas, 8 consumidores alheios, campos que não existem no payload de
// adiantamento) — decisão já aprovada em `GAP-FARMTRANSFER-FE-03`.
//
// `useFieldArray({ name: 'allocations' })` vive no FORMULÁRIO PAI
// (`SaleAdvanceIncome.tsx`) — este componente NUNCA instancia o próprio
// `useFieldArray`, recebendo `fields`/`append`/`remove` por props.
//
// Cascata Categoria→Centro de Custo — lado Receita (`FINANCIAL_CATEGORY_
// TYPE_ENTRADAS`/`_AMBAS`), mesmos `type_ids` já confirmados em
// `MovementSaleIncomeAllocation.tsx`/`FarmTransferIncomeAllocation.tsx`.
//
// TASK-FE-VENDAS-ADV-01 (rejeição QA, 063-est03-9-reprovacoes) — Centro de
// Custo NÃO é mais alimentado pela cascata: o Select usa `SelectAsyncPaginate`
// sobre `listCostCenterOptions` (`/cost-centers/options?only_analytic=true&
// is_enabled=true&farm_uuid=X`) como fonte PRINCIPAL — universo COMPLETO de
// centros analíticos/habilitados da fazenda ativa, igual ao legado
// (`SaleAdvanceIncomeController::advanceIncome`). A cascata
// (`listCostCentersByCategory`) SOBREVIVE só para pré-selecionar o 1º centro
// vinculado à Categoria quando ela muda — nunca mais para popular/filtrar a
// lista de opções (mismatch de padrão corrigido; ver roteiro
// `vendas-f061-roteiro.md §1-2`).
//
// `category_percent_values[]` do legado nunca é lido pelo servidor — a
// coluna `(%)` é UI PURO, jamais vai ao payload (`allocations[].value`
// apenas). `(%)` recalculado SÓ no BLUR (evita flicker).
//
// Reidratação de rótulos na edição — o Resource só devolve `uuid` cru nas 3
// colunas de lookup; ao montar com linhas pré-populadas, o rótulo nasce como
// o PRÓPRIO uuid (nunca inventado) e é resolvido por 1 lookup cada
// (`getFinancialCategory`/`getCostCenter`/`getPlanAccount`). Roda 1x ao
// montar (dependências vazias).
//
// Alinhamento das linhas com `align="flex-start"` (nunca `flex-end` —
// `flex-end` faz a mensagem de erro torcer a linha, mirror
// `InvoiceApportionmentTab.tsx`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Alert, Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
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
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import {
  getCostCenter,
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import {
  getFinancialCategory,
  listFinancialCategoryOptions,
} from '@/services/v2/FinancialCategories/financial-category-service';
import {
  getPlanAccount,
  getPlanAccountByCategory,
  listPlanAccountOptions,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';
import type { SaleAdvanceIncomeAllocationRowForm, SaleAdvanceIncomeForm } from '@/@types/v2/Sales';

export interface SaleAdvanceIncomeAllocationFieldValues {
  allocations: SaleAdvanceIncomeAllocationRowForm[];
}

export interface SaleAdvanceIncomeAllocationProps {
  control: Control<SaleAdvanceIncomeForm>;
  fields: FieldArrayWithId<SaleAdvanceIncomeAllocationFieldValues, 'allocations', 'id'>[];
  append: UseFieldArrayAppend<SaleAdvanceIncomeAllocationFieldValues, 'allocations'>;
  remove: UseFieldArrayRemove;
  /** Necessário para a auto-seleção do 1º Centro de Custo da cascata. */
  setValue: UseFormSetValue<SaleAdvanceIncomeForm>;
  /** `amount` do título (`SaleAdvanceIncome.tsx`) — só para o cálculo
   *  cosmético de percentual/fechamento (IG013/IG016). */
  amount: number;
  errors: FieldErrors<SaleAdvanceIncomeForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** TASK-FE-VENDAS-ADV-01 — escopa `/cost-centers/options` pela fazenda
   *  ativa (`SaleAdvanceIncome.tsx::activeFarmUuid`). `null`/`undefined`
   *  preserva o fallback tenant-scoped do próprio backend. */
  farmUuid?: string | null;
}

// `category_types` (banco `gbcerne`): 1=Saídas, 2=Entradas, 3=Ambas
// (neutro, incluído no lado Receita) — mirror `MovementSaleIncomeAllocation`.
const FINANCIAL_CATEGORY_TYPE_ENTRADAS = 2;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const findCategoryParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  type_ids: [FINANCIAL_CATEGORY_TYPE_ENTRADAS, FINANCIAL_CATEGORY_TYPE_AMBAS],
});

function mapCostCenterToOption(item: CostCenterRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapPlanAccountToOption(item: PlanAccountRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

interface SaleAdvanceIncomeAllocationRowProps {
  control: Control<SaleAdvanceIncomeAllocationFieldValues>;
  index: number;
  rowId: string;
  amount: number;
  disabled: boolean;
  allocationText: LanguageDate['sales']['sale']['advanceIncome']['allocation'];
  /** TASK-FE-VENDAS-ADV-01 — universo farm-scoped, não mais filtrado por
   *  categoria (ver header do arquivo). */
  farmUuid?: string | null;
  onCategoryChange: (rowId: string, index: number, categoryUuid: string | null) => void;
  onCenterTouched: (rowId: string) => void;
  onRequestRemove: (index: number) => void;
}

// Componente PRÓPRIO por linha — hooks (`useController`) SÓ podem viver
// dentro de um componente/custom hook, nunca soltos dentro de um `.map()` no
// corpo do componente pai (regra do eslint-plugin-react-hooks), mirror
// `MovementSaleIncomeAllocationRow`.
function SaleAdvanceIncomeAllocationRow({
  control,
  index,
  rowId,
  amount,
  disabled,
  allocationText,
  farmUuid,
  onCategoryChange,
  onCenterTouched,
  onRequestRemove,
}: SaleAdvanceIncomeAllocationRowProps) {
  const { field: categoryField, fieldState: categoryFieldState } = useController({
    control,
    name: `allocations.${index}.category_uuid`,
  });
  const { field: centerField, fieldState: centerFieldState } = useController({
    control,
    name: `allocations.${index}.center_uuid`,
  });
  // Conta Contábil, OPCIONAL (sem `fieldState.error` relevante — nunca
  // `.required()` no schema).
  const { field: planAccountField } = useController({
    control,
    name: `allocations.${index}.plan_account_uuid`,
  });
  const { field: valueField, fieldState: valueFieldState } = useController({
    control,
    name: `allocations.${index}.value`,
  });

  // Percentual — UI PURO, bidirecional com `value`, recalculado SÓ no BLUR
  // (buffer local enquanto o usuário digita, evita flicker).
  // `category_percent_values[]` do legado nunca é lido pelo servidor — nunca
  // entra no payload.
  const [percentDraft, setPercentDraft] = useState<number | null>(null);
  const rowValue = Number(valueField.value) || 0;
  const derivedPercent = amount > 0 ? (rowValue / amount) * 100 : 0;
  const displayedPercent = percentDraft ?? derivedPercent;

  function commitPercentDraft() {
    if (percentDraft === null) return;
    const nextValue = amount > 0 ? Number(((percentDraft / 100) * amount).toFixed(2)) : 0;
    valueField.onChange(nextValue);
    setPercentDraft(null);
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={categoryField.name}
          label={allocationText.category}
          placeholder={allocationText.categoryPlaceholder}
          service={listFinancialCategoryOptions}
          mapOptions={(item: FinancialCategoryOption) => ({
            label: `${item.code} — ${item.description}`,
            value: item.uuid,
          })}
          findParams={findCategoryParams}
          value={categoryField.value ?? null}
          onChange={(option: any) => {
            categoryField.onChange(option ?? null);
            onCategoryChange(rowId, index, option?.value ?? null);
          }}
          error={categoryFieldState.error?.message}
          isRequired
          isDisabled={disabled}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </Box>

      <Box flex="1" minW="220px">
        {/* TASK-FE-VENDAS-ADV-01 — universo farm-scoped (fazenda+ancestrais,
            `class=2` analítico, `is_enabled=true`), igual ao legado
            (`SaleAdvanceIncomeController::advanceIncome`). A cascata
            Categoria→Centro (`onCategoryChange`/`runCascade`) só faz
            `setValue` de PRÉ-SELEÇÃO — nunca filtra/esvazia esta lista. */}
        <SelectAsyncPaginate
          name={centerField.name}
          label={allocationText.costCenter}
          placeholder={allocationText.costCenterPlaceholder}
          cacheUniqs={[farmUuid]}
          service={(params) =>
            listCostCenterOptions({
              ...params,
              only_analytic: true,
              is_enabled: 'true',
              farm_uuid: farmUuid ?? undefined,
            })
          }
          mapOptions={mapCostCenterToOption}
          findParams={(search: string | { search: string }) => ({
            search: typeof search === 'string' ? search : search.search,
          })}
          value={centerField.value ?? null}
          onChange={(option: any) => {
            onCenterTouched(rowId);
            centerField.onChange(option ?? null);
          }}
          error={centerFieldState.error?.message}
          isRequired
          isDisabled={disabled}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </Box>

      <Box flex="1" minW="220px">
        {/* Conta Contábil — select pesquisável sobre `/plan-accounts/
            options` (sem gate de permissão), com autofill por cascata ao
            trocar a Categoria; OPCIONAL, o usuário pode sobrescrever a
            qualquer momento. */}
        <SelectAsyncPaginate
          name={planAccountField.name}
          label={allocationText.planAccount}
          placeholder={allocationText.planAccountPlaceholder}
          service={listPlanAccountOptions}
          mapOptions={(item: PlanAccountRef) => mapPlanAccountToOption(item)}
          findParams={(search: string | { search: string }) => ({
            search: typeof search === 'string' ? search : search.search,
          })}
          value={planAccountField.value ?? null}
          onChange={(option: any) => planAccountField.onChange(option ?? null)}
          isDisabled={disabled}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </Box>

      <Box w={{ base: 'full', sm: '160px' }}>
        <MoneyInput
          name={valueField.name}
          label={allocationText.value}
          value={valueField.value ?? null}
          onValueChange={(nextValue) => valueField.onChange(nextValue)}
          error={valueFieldState.error?.message}
          isRequired
          disabled={disabled}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <PercentInput
          name={`${valueField.name}-percent`}
          label={allocationText.percent}
          value={displayedPercent}
          maxValue={100}
          disabled={disabled || amount <= 0}
          onValueChange={setPercentDraft}
          onBlur={commitPercentDraft}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {allocationText.removeRow}
        </Flex>
        <IconButtonTable
          aria-label={allocationText.removeRow}
          mensegerTooltip={allocationText.removeRow}
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

export function SaleAdvanceIncomeAllocation({
  control,
  fields,
  append,
  remove,
  setValue,
  amount,
  errors,
  languageGB,
  disabled = false,
  farmUuid,
}: SaleAdvanceIncomeAllocationProps) {
  const allocationText = languageGB.sales.sale.advanceIncome.allocation;

  const genericControl = control as unknown as Control<SaleAdvanceIncomeAllocationFieldValues>;
  const arrayError = (errors as any)?.allocations?.message as string | undefined;

  const watchedRows = useWatch({ control: genericControl, name: 'allocations' }) ?? [];
  const totalAllocated = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const difference = totalAllocated - amount;
  const isBalanced = Math.abs(difference) < 0.01;

  // TASK-FE-VENDAS-ADV-01 — a cascata Categoria→Centro de Custo NÃO alimenta
  // mais a lista de opções (agora `SelectAsyncPaginate`/`listCostCenterOptions`,
  // universo farm-scoped completo, ver Row acima); `touchedCenterByRow`
  // sobrevive só para não sobrescrever uma escolha MANUAL do usuário quando a
  // Categoria muda de novo (papel que já tinha antes).
  const [touchedCenterByRow, setTouchedCenterByRow] = useState<Record<string, boolean>>({});

  function handleCenterTouched(rowId: string) {
    setTouchedCenterByRow((prev) => ({ ...prev, [rowId]: true }));
  }

  // Cascata — SÓ pré-seleção (`center_uuid`) + autofill de Conta Contábil
  // (`plan_account_uuid`) vinculados à Categoria. NUNCA mais popula/filtra a
  // lista de opções do Select de Centro de Custo (bug corrigido — a lista é
  // sempre o universo farm-scoped completo, ver `listCostCenterOptions` na
  // Row). `plan_account_uuid` é sempre reescrito ao trocar de categoria
  // (autofill do NOVO vínculo, ou `null` se não houver — sem "touched", o
  // usuário pode sobrescrever manualmente depois, mas uma TROCA de categoria
  // sempre reflete o vínculo mais recente).
  async function runCascade(rowId: string, index: number, categoryUuid: string) {
    const [costCentersResponse, planAccountResponse] = await Promise.all([
      listCostCentersByCategory(categoryUuid),
      getPlanAccountByCategory(categoryUuid),
    ]);

    const centers = costCentersResponse.data ?? [];

    // Auto-seleciona o PRIMEIRO centro só se a linha ainda não foi tocada
    // manualmente.
    if (!touchedCenterByRow[rowId] && centers.length > 0) {
      setValue(`allocations.${index}.center_uuid`, mapCostCenterToOption(centers[0]), {
        shouldDirty: true,
      });
    }

    const planAccount = planAccountResponse.data;
    setValue(
      `allocations.${index}.plan_account_uuid`,
      planAccount ? mapPlanAccountToOption(planAccount) : null,
      { shouldDirty: true }
    );
  }

  function handleCategoryChange(rowId: string, index: number, categoryUuid: string | null) {
    if (!categoryUuid) {
      // Universo do Select de Centro de Custo é farm-scoped, independente da
      // Categoria — limpar a categoria só reseta o autofill de Conta
      // Contábil (papel que já tinha), NUNCA esvazia a lista de centros.
      setValue(`allocations.${index}.plan_account_uuid`, null);
      return;
    }
    void runCascade(rowId, index, categoryUuid);
  }

  // Reidratação de RÓTULOS na edição — o Resource só devolve `uuid` cru nas
  // 3 colunas de lookup; para cada linha já populada ao montar, resolve o
  // rótulo real por 1 lookup direto (NUNCA sobrescreve o `uuid` selecionado
  // — só o texto exibido). Roda 1x ao montar (dependências vazias).
  useEffect(() => {
    fields.forEach((field, index) => {
      const category = (field as unknown as SaleAdvanceIncomeAllocationRowForm).category_uuid;
      if (category && category.label === category.value) {
        getFinancialCategory(category.value).then((response) => {
          const detail = response.data;
          setValue(`allocations.${index}.category_uuid`, {
            label: `${detail.code} — ${detail.description}`,
            value: category.value,
          });
        });
      }

      const center = (field as unknown as SaleAdvanceIncomeAllocationRowForm).center_uuid;
      if (center && center.label === center.value) {
        getCostCenter(center.value).then((response) => {
          const detail = response.data;
          setValue(`allocations.${index}.center_uuid`, {
            label: `${detail.code} — ${detail.description}`,
            value: center.value,
          });
        });
      }

      const planAccount = (field as unknown as SaleAdvanceIncomeAllocationRowForm)
        .plan_account_uuid;
      if (planAccount && planAccount.label === planAccount.value) {
        getPlanAccount(planAccount.value).then((response) => {
          const detail = response.data;
          setValue(`allocations.${index}.plan_account_uuid`, {
            label: `${detail.code} — ${detail.description}`,
            value: planAccount.value,
          });
        });
      }
    });
    // Roda só ao montar — mesmo racional documentado acima; dependências
    // vazias de propósito.
  }, []);

  // `canAddRow` — adicionar bloqueado se a última linha estiver incompleta.
  function canAddRow(): boolean {
    if (watchedRows.length === 0) return true;
    const last = watchedRows[watchedRows.length - 1];
    return (
      !!last?.category_uuid &&
      !!last?.center_uuid &&
      last?.value !== null &&
      last?.value !== undefined
    );
  }

  function handleAdd() {
    if (!canAddRow()) {
      toaster.warning({ description: allocationText.addRowBlockedMessage });
      return;
    }
    append({ category_uuid: null, center_uuid: null, plan_account_uuid: null, value: null });
  }

  // Remover — confirmação + nunca deixar zero linhas.
  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);

  function handleRequestRemove(index: number) {
    if (fields.length <= 1) {
      toaster.warning({ description: allocationText.removeRowBlockedMessage });
      return;
    }
    setRowIndexToRemove(index);
  }

  function handleConfirmRemove() {
    if (rowIndexToRemove !== null) {
      remove(rowIndexToRemove);
      setRowIndexToRemove(null);
    }
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={1}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {allocationText.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {allocationText.sectionHint}
          </Text>
        </Box>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {allocationText.sumLabel}:
          </Text>
          <Badge colorPalette={isBalanced ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalAllocated)} / {formatCurrencyBRL(amount)}
          </Badge>
        </Flex>
      </Flex>

      {!isBalanced && fields.length > 0 && (
        <Alert.Root status="warning" borderRadius="md" mt={3} mb={2}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{allocationText.sumHint}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mt={2}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2} mt={2}>
          <Text fontSize="sm" color="fg.muted">
            {allocationText.emptyRows}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mt={4} mb={4}>
          {fields.map((field, index) => (
            <SaleAdvanceIncomeAllocationRow
              key={field.id}
              control={genericControl}
              index={index}
              rowId={field.id}
              amount={amount}
              disabled={disabled}
              allocationText={allocationText}
              farmUuid={farmUuid}
              onCategoryChange={handleCategoryChange}
              onCenterTouched={handleCenterTouched}
              onRequestRemove={handleRequestRemove}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={allocationText.addRow}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />

      <DeleteConfirmDialog
        isOpen={rowIndexToRemove !== null}
        onClose={() => setRowIndexToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={allocationText.removeRowConfirmTitle}
        confirmButtonText={allocationText.removeRow}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}

export default SaleAdvanceIncomeAllocation;
