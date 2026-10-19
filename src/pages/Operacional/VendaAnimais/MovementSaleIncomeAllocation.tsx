// src/pages/Operacional/VendaAnimais/MovementSaleIncomeAllocation.tsx
// -----------------------------------------------------------------------------
// TASK-VD-FE-04 — Fundação compartilhada do subfluxo financeiro de Vendas
// (`GAP-VENDAS-FE-04` §2.8-§2.10/§4, `GAP-VENDAS-FE-05` §3). Bloco "Rateio"
// (Categoria/Centro de Custo/Valor) consumido pelas telas de Criar/Editar
// (Tarefa 22) e Finalizar (Tarefa 23) — esta Tarefa NÃO monta o componente em
// nenhuma tela.
//
// Copy-adapt de `src/pages/Administrativo/FarmTransfer/
// FarmTransferIncomeAllocation.tsx` (399 linhas, fonte primária — cascata
// Categoria→Centro de Custo, estado por linha chaveado por `field.id`,
// auto-seleção do 1º centro só se a linha não foi tocada manualmente) +
// comportamento de "adicionar bloqueado se a linha anterior estiver
// incompleta" / "remover com confirmação, nunca zero linhas" copy-adapt de
// `src/pages/Incomes/IncomeApportionmentTab.tsx` (`canAddRow`/
// `handleRequestRemove`/`DeleteConfirmDialog`) — comportamento exigido pelo
// Roteiro Cirúrgico (`GAP-VENDAS-FE-04` §4.22) mas AUSENTE na fonte primária
// (`FarmTransferIncomeAllocation.tsx` não bloqueia adicionar/remover); seguido
// aqui porque é item explícito do escopo desta Tarefa.
//
// PROIBIDO: `src/components/MovementAllocationEditor/MovementAllocationEditor.tsx`
// (617 linhas, 8 consumidores alheios, carrega `plan_account_uuid`/
// `harvest_uuid` inexistentes no payload de Vendas) — decisão idêntica já
// aprovada em `GAP-FARMTRANSFER-FE-03`.
//
// `useFieldArray({ name: 'financial_allocations' })` vive no FORMULÁRIO PAI
// (as telas 22/23) — este componente NUNCA instancia o próprio
// `useFieldArray`, recebendo `fields`/`append`/`remove` por props (contrato
// de `FarmTransferIncomeAllocation`).
//
// Cascata Categoria→Centro de Custo — `type_ids` do lado Receita
// (`FINANCIAL_CATEGORY_TYPE_ENTRADAS`/`_AMBAS`) são os MESMOS já confirmados
// por leitura direta do banco (`GAP-FARMTRANSFER-04`) para o lado Income de
// `FarmTransferIncomeAllocation.tsx` — Vendas é, também aqui, só o lado
// Receita; nenhum `type_id` novo inventado.
//
// Coluna "Conta Contábil" (VD-API-03/`GAP-API-FE-03`, VD-FE-04) — RESTAURADA:
// o backend passa a aceitar `financial.income_plan_accounts[]` e a devolver
// `plan_account_uuid` no rateio (`MovementSaleIncome.allocations[]`). Select
// pesquisável sobre `/plan-accounts/options` (`listPlanAccountOptions`, sem
// gate de permissão) com autofill por cascata (`getPlanAccountByCategory`,
// mesma mecânica de `IncomeApportionmentTab.tsx`) ao trocar a Categoria — o
// usuário pode sobrescrever a qualquer momento; OPCIONAL (rateio sem conta
// contábil continua válido, mirror legado).
//
// Reidratação de rótulos na edição — o Resource só devolve `uuid` cru (sem
// código/descrição embutidos) nas 3 colunas de lookup (Categoria/Centro/
// Conta Contábil); ao montar com linhas pré-populadas
// (`movementSaleIncomeAllocationsToForm`, `useMovementSales.tsx`), o rótulo
// nasce como o PRÓPRIO uuid (nunca inventado) e é resolvido para o rótulo
// real por 1 lookup cada (`getFinancialCategory`/`getCostCenter`/
// `getPlanAccount`), mesma mecânica de reidratação de
// `IncomeApportionmentTab.tsx`. Roda 1x ao montar (dependências vazias).
//
// Coluna `(%)` — UI PURO (nunca vai ao payload, `category_percent_values[]`
// do legado nunca é lido pelo servidor), bidirecional com `value`, mas
// recalculada SÓ no BLUR (evita flicker — decisão registrada em
// `IncomeApportionmentTab.tsx`), diferente de `FarmTransferIncomeAllocation`
// (que recalcula no `onValueChange`/change). Alinhamento das linhas com
// `align="flex-start"` (nunca `flex-end` — decisão registrada em
// `InvoiceApportionmentTab.tsx:168-175`: `flex-end` faz a mensagem de erro
// torcer a linha).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useRef, useState } from 'react';

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
import { AllocationCostCenterSelect } from '@/components/Form/AllocationCostCenterSelect';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { resolveCascadeCostCenter } from '@/utils/allocationCostCenter';

import { getCostCenter } from '@/services/v2/CostCenters/cost-center-service';
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
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { MovementSaleAllocationRowForm, MovementSaleForm } from '@/@types/v2/MovementSales';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

export interface MovementSaleAllocationFieldValues {
  financial_allocations: MovementSaleAllocationRowForm[];
}

export interface MovementSaleIncomeAllocationProps {
  control: Control<MovementSaleForm>;
  fields: FieldArrayWithId<MovementSaleAllocationFieldValues, 'financial_allocations', 'id'>[];
  append: UseFieldArrayAppend<MovementSaleAllocationFieldValues, 'financial_allocations'>;
  remove: UseFieldArrayRemove;
  /** Necessário para a auto-seleção do 1º Centro de Custo da cascata (mirror `FarmTransferIncomeAllocation`). */
  setValue: UseFormSetValue<MovementSaleForm>;
  /** `total` da venda (recalculado por `MovementSaleTotalsBlock`) — só para o cálculo cosmético de percentual/fechamento. */
  vlTotal: number;
  errors: FieldErrors<MovementSaleForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

// `category_types` (banco `gbcerne`, GAP-FARMTRANSFER-04): 1=Saídas,
// 2=Entradas, 3=Ambas (neutro, incluído no lado Receita).
const FINANCIAL_CATEGORY_TYPE_ENTRADAS = 2;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const findCategoryParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  type_ids: [FINANCIAL_CATEGORY_TYPE_ENTRADAS, FINANCIAL_CATEGORY_TYPE_AMBAS],
});

function mapPlanAccountToOption(item: PlanAccountRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

interface MovementSaleIncomeAllocationRowProps {
  control: Control<MovementSaleAllocationFieldValues>;
  index: number;
  rowId: string;
  vlTotal: number;
  disabled: boolean;
  financialText: LanguageDate['movementSales']['movementSale']['form']['financial']['allocation'];
  onCategoryChange: (rowId: string, index: number, categoryUuid: string | null) => void;
  onCenterTouched: (rowId: string) => void;
  onRequestRemove: (index: number) => void;
}

// Componente PRÓPRIO por linha — hooks (`useController`) SÓ podem viver
// dentro de um componente/custom hook, nunca soltos dentro de um `.map()` no
// corpo do componente pai (regra do eslint-plugin-react-hooks). Mirror do
// racional já aplicado em `FarmTransferIncomeAllocationRow`.
function MovementSaleIncomeAllocationRow({
  control,
  index,
  rowId,
  vlTotal,
  disabled,
  financialText,
  onCategoryChange,
  onCenterTouched,
  onRequestRemove,
}: MovementSaleIncomeAllocationRowProps) {
  const { field: categoryField, fieldState: categoryFieldState } = useController({
    control,
    name: `financial_allocations.${index}.category_uuid`,
  });
  const { field: centerField, fieldState: centerFieldState } = useController({
    control,
    name: `financial_allocations.${index}.center_uuid`,
  });
  // VD-API-03 (`GAP-API-FE-03`) — Conta Contábil, OPCIONAL (sem
  // `fieldState.error` relevante — nunca `.required()` no schema).
  const { field: planAccountField } = useController({
    control,
    name: `financial_allocations.${index}.plan_account_uuid`,
  });
  const { field: valueField, fieldState: valueFieldState } = useController({
    control,
    name: `financial_allocations.${index}.value`,
  });

  // Percentual — UI PURO, bidirecional com `value`, recalculado SÓ no BLUR
  // (buffer local enquanto o usuário digita, evita flicker — decisão
  // `IncomeApportionmentTab.tsx`). `category_percent_values[]` do legado
  // nunca é lido pelo servidor — nunca entra no payload.
  const [percentDraft, setPercentDraft] = useState<number | null>(null);
  const rowValue = Number(valueField.value) || 0;
  const derivedPercent = vlTotal > 0 ? (rowValue / vlTotal) * 100 : 0;
  const displayedPercent = percentDraft ?? derivedPercent;

  function commitPercentDraft() {
    if (percentDraft === null) return;
    const nextValue = vlTotal > 0 ? Number(((percentDraft / 100) * vlTotal).toFixed(2)) : 0;
    valueField.onChange(nextValue);
    setPercentDraft(null);
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
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
        <AllocationCostCenterSelect
          name={centerField.name}
          label={financialText.costCenter}
          placeholder={financialText.costCenterPlaceholder}
          value={centerField.value ?? null}
          onChange={(option) => {
            onCenterTouched(rowId);
            centerField.onChange(option ?? null);
          }}
          error={centerFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box flex="1" minW="220px">
        {/* Conta Contábil (VD-API-03/`GAP-API-FE-03`) — select pesquisável
            sobre `/plan-accounts/options` (sem gate de permissão), com
            autofill por cascata ao trocar a Categoria (`onCategoryChange` →
            `runCascade`); OPCIONAL, o usuário pode sobrescrever a qualquer
            momento (mirror `IncomeApportionmentTab.tsx`). */}
        <SelectAsyncPaginate
          name={planAccountField.name}
          label={financialText.planAccount}
          placeholder={financialText.planAccountPlaceholder}
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
          label={financialText.value}
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
          label={financialText.percent}
          value={displayedPercent}
          maxValue={100}
          disabled={disabled || vlTotal <= 0}
          onValueChange={setPercentDraft}
          onBlur={commitPercentDraft}
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

export function MovementSaleIncomeAllocation({
  control,
  fields,
  append,
  remove,
  setValue,
  vlTotal,
  errors,
  languageGB,
  disabled = false,
}: MovementSaleIncomeAllocationProps) {
  const financialText = languageGB.movementSales.movementSale.form.financial.allocation;

  const genericControl = control as unknown as Control<MovementSaleAllocationFieldValues>;
  const arrayError = (errors as any)?.financial_allocations?.message as string | undefined;

  // Refs (leitura pós-await sem closure velha). `autoCenterByRow`: último centro
  // AUTO-selecionado por linha — só ele pode ser trocado por nova pré-seleção;
  // escolha do usuário / centro salvo (edição) nunca é sobrescrito.
  const autoCenterByRow = useRef<Record<string, string>>({});
  const touchedCenterByRow = useRef<Record<string, boolean>>({});
  const rowsRef = useRef<any[]>([]);

  const watchedRows = useWatch({ control: genericControl, name: 'financial_allocations' }) ?? [];
  rowsRef.current = watchedRows;
  const totalAllocated = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const difference = totalAllocated - vlTotal;
  const isBalanced = Math.abs(difference) < 0.01;

  // Cascata Categoria→Centro de Custo — estado por LINHA (chaveado pelo
  // `field.id` do `useFieldArray`), mirror mecânico de
  // `FarmTransferIncomeAllocation.tsx`.

  function handleCenterTouched(rowId: string) {
    touchedCenterByRow.current[rowId] = true;
  }

  // VD-API-03 (`GAP-API-FE-03`) — cascata agora busca TAMBÉM a Conta
  // Contábil vinculada à categoria (`getPlanAccountByCategory`, mirror
  // `IncomeApportionmentTab.runCascade`), em paralelo com os Centros de
  // Custo. `plan_account_uuid` é sempre reescrito ao trocar de categoria
  // (autofill do NOVO vínculo, ou `null` se não houver — sem "touched",
  // mirror legado: o usuário pode sobrescrever manualmente depois, mas uma
  // TROCA de categoria sempre reflete o vínculo mais recente).
  async function runCascade(rowId: string, index: number, categoryUuid: string) {
    // `by-category` só PRÉ-SELECIONA o centro; opções vêm do catálogo do contratante (scope=allocation).
    const [preselected, planAccountResponse] = await Promise.all([
      resolveCascadeCostCenter(categoryUuid),
      getPlanAccountByCategory(categoryUuid),
    ]);

    if (preselected && !touchedCenterByRow.current[rowId]) {
      const current = rowsRef.current[index]?.center_uuid?.value as string | undefined;
      if (!current || current === autoCenterByRow.current[rowId]) {
        autoCenterByRow.current[rowId] = preselected.value;
        setValue(`financial_allocations.${index}.center_uuid`, preselected, {
          shouldDirty: true,
        });
      }
    }

    const planAccount = planAccountResponse.data;
    setValue(
      `financial_allocations.${index}.plan_account_uuid`,
      planAccount ? mapPlanAccountToOption(planAccount) : null,
      { shouldDirty: true }
    );
  }

  function handleCategoryChange(rowId: string, index: number, categoryUuid: string | null) {
    if (!categoryUuid) {
      setValue(`financial_allocations.${index}.plan_account_uuid`, null);
      return;
    }
    void runCascade(rowId, index, categoryUuid);
  }

  // Reidratação de RÓTULOS na edição (VD-FE-04) — o Resource só devolve
  // `uuid` cru nas 3 colunas de lookup; `movementSaleIncomeAllocationsToForm`
  // (`useMovementSales.tsx`) nasce com `label === value` (uuid) como
  // marcador de "não resolvido". Para cada linha já populada ao montar,
  // resolve o rótulo real por 1 lookup direto (NUNCA sobrescreve o `uuid`
  // selecionado — só o texto exibido), mesma mecânica de
  // `IncomeApportionmentTab.tsx`. Roda 1x ao montar (dependências vazias).
  useEffect(() => {
    fields.forEach((field, index) => {
      const category = (field as unknown as MovementSaleAllocationRowForm).category_uuid;
      if (category && category.label === category.value) {
        getFinancialCategory(category.value).then((response) => {
          const detail = response.data;
          setValue(`financial_allocations.${index}.category_uuid`, {
            label: `${detail.code} — ${detail.description}`,
            value: category.value,
          });
        });
      }

      const center = (field as unknown as MovementSaleAllocationRowForm).center_uuid;
      if (center && center.label === center.value) {
        getCostCenter(center.value).then((response) => {
          const detail = response.data;
          setValue(`financial_allocations.${index}.center_uuid`, {
            label: `${detail.code} — ${detail.description}`,
            value: center.value,
          });
        });
      }

      const planAccount = (field as unknown as MovementSaleAllocationRowForm).plan_account_uuid;
      if (planAccount && planAccount.label === planAccount.value) {
        getPlanAccount(planAccount.value).then((response) => {
          const detail = response.data;
          setValue(`financial_allocations.${index}.plan_account_uuid`, {
            label: `${detail.code} — ${detail.description}`,
            value: planAccount.value,
          });
        });
      }
    });
    // Roda só ao montar — mesmo racional documentado acima; dependências
    // vazias de propósito.
  }, []);

  // Adicionar bloqueado se a última linha estiver incompleta — item de
  // escopo explícito desta Tarefa (`GAP-VENDAS-FE-04` §4.22), copy-adapt de
  // `IncomeApportionmentTab.tsx.canAddRow` (ausente na fonte primária
  // `FarmTransferIncomeAllocation.tsx`).
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
      toaster.warning({ description: financialText.addRowBlockedMessage });
      return;
    }
    append({ category_uuid: null, center_uuid: null, value: null });
  }

  // Remover — confirmação + nunca deixar zero linhas (mirror legado
  // `main.js:720-739`, copy-adapt de `IncomeApportionmentTab.tsx`).
  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);

  function handleRequestRemove(index: number) {
    if (fields.length <= 1) {
      toaster.warning({ description: financialText.removeRowBlockedMessage });
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
            {financialText.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {financialText.sectionHint}
          </Text>
        </Box>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {financialText.sumLabel}:
          </Text>
          <Badge colorPalette={isBalanced ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalAllocated)} / {formatCurrencyBRL(vlTotal)}
          </Badge>
        </Flex>
      </Flex>

      {!isBalanced && fields.length > 0 && (
        <Alert.Root status="warning" borderRadius="md" mt={3} mb={2}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{financialText.sumHint}</Alert.Title>
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
            {financialText.emptyRows}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mt={4} mb={4}>
          {fields.map((field, index) => (
            <MovementSaleIncomeAllocationRow
              key={field.id}
              control={genericControl}
              index={index}
              rowId={field.id}
              vlTotal={vlTotal}
              disabled={disabled}
              financialText={financialText}
              onCategoryChange={handleCategoryChange}
              onCenterTouched={handleCenterTouched}
              onRequestRemove={handleRequestRemove}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={financialText.addRow}
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
        title={financialText.removeRowConfirmTitle}
        confirmButtonText={financialText.removeRow}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}

export default MovementSaleIncomeAllocation;
