// src/pages/Operacional/TransferAbcBatch/TransferAbcCategoriesAllocation.tsx
// -----------------------------------------------------------------------------
// Rateio financeiro (`financial.categories[]`) da tela de CRIAÇÃO de
// Transferência ABC de Animais entre Lotes (TransferAbcBatch —
// 97-Esteiras/039, TASK-FE-039-ABC-03). Consumido por
// `CreateTransferAbcBatch.tsx` (`useFieldArray({ name: 'categories' })` vive
// no PAI, mesmo racional de `FarmTransferIncomeAllocation.tsx`).
//
// Mirror ESTRUTURAL de `FarmTransferIncomeAllocation.tsx` (cascata
// Categoria→Centro de Custo, auto-seleção do 1º centro quando a linha ainda
// não foi tocada), ACRESCIDO de `plan_account_uuid` (campo real do payload
// — `financial.categories.*.plan_account_uuid: nullable` — ausente no
// irmão) com a MESMA cascata Categoria→Conta (`getPlanAccountByCategory`,
// mirror `IncomeApportionmentTab.tsx`/`ExpenseApportionmentTab.tsx`).
//
// Filtro de `category_uuid` por TIPO (`category_types`: 1=Saídas,
// 2=Entradas, 3=Ambas) dirigido pelo discriminador `type` do cabeçalho —
// `type===1` (Entrada de animais, gera DESPESA) filtra Saídas+Ambas;
// `type===2` (Saída de animais, gera RECEITA) filtra Entradas+Ambas (mirror
// `TransferAbcTypeEnum` real: `Entrada` "gera despesa", `Saida` "gera
// receita", ver docblock do Enum na API) — ao contrário do irmão
// `FarmTransfer` (2 blocos fixos Income/Expense), aqui é 1 ÚNICO bloco cujo
// filtro de categoria muda com o `type`.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Alert, Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
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
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import {
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { getPlanAccountByCategory } from '@/services/v2/PlanAccounts/plan-account-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type {
  TransferAbcBatchForm,
  TransferAbcCategoryRowForm,
} from '@/@types/v2/Livestock/transferAbcBatch';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

export interface TransferAbcCategoriesFieldValues {
  categories: TransferAbcCategoryRowForm[];
}

export interface TransferAbcCategoriesAllocationProps {
  control: Control<TransferAbcBatchForm>;
  fields: FieldArrayWithId<TransferAbcCategoriesFieldValues, 'categories', 'id'>[];
  append: UseFieldArrayAppend<TransferAbcCategoriesFieldValues, 'categories'>;
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<TransferAbcBatchForm>;
  /** `vl_total` do cabeçalho (Σ `animals[].total_value`) — cálculo cosmético de percentual/fechamento. */
  vlTotal: number;
  /** Discriminador do cabeçalho — dirige o filtro de tipo de categoria financeira. */
  transferType: 1 | 2 | null;
  errors: FieldErrors<TransferAbcBatchForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

const FINANCIAL_CATEGORY_TYPE_SAIDAS = 1;
const FINANCIAL_CATEGORY_TYPE_ENTRADAS = 2;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mapCostCenterToOption(item: CostCenterRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapPlanAccountToOption(item: PlanAccountRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

interface TransferAbcCategoryRowProps {
  control: Control<TransferAbcCategoriesFieldValues>;
  index: number;
  rowId: string;
  remove: UseFieldArrayRemove;
  transferType: 1 | 2 | null;
  disabled: boolean;
  financialText: LanguageDate['livestock']['transferAbcBatch']['form']['fields']['financial'];
  planAccountOptions: PlanAccountRef[];
  onCategoryChange: (rowId: string, index: number, categoryUuid: string | null) => void;
  onCenterTouched: (rowId: string) => void;
  onPlanAccountTouched: (rowId: string) => void;
}

// Componente PRÓPRIO por linha — `useController` só pode viver dentro de um
// componente, nunca soltos dentro de um `.map()` (regra eslint-plugin-react-hooks).
function TransferAbcCategoryRow({
  control,
  index,
  rowId,
  remove,
  transferType,
  disabled,
  financialText,
  planAccountOptions,
  onCategoryChange,
  onCenterTouched,
  onPlanAccountTouched,
}: TransferAbcCategoryRowProps) {
  const { field: categoryField, fieldState: categoryFieldState } = useController({
    control,
    name: `categories.${index}.category_uuid`,
  });
  const { field: centerField, fieldState: centerFieldState } = useController({
    control,
    name: `categories.${index}.center_uuid`,
  });
  const { field: planAccountField } = useController({
    control,
    name: `categories.${index}.plan_account_uuid`,
  });

  const findCategoryParams = (search: string | { search: string }) => ({
    search: typeof search === 'string' ? search : search.search,
    type_ids:
      transferType === 1
        ? [FINANCIAL_CATEGORY_TYPE_SAIDAS, FINANCIAL_CATEGORY_TYPE_AMBAS]
        : [FINANCIAL_CATEGORY_TYPE_ENTRADAS, FINANCIAL_CATEGORY_TYPE_AMBAS],
  });

  // Universo do Centro de Custo = catálogo completo tenant-scoped
  // (`/cost-centers/options`), não o vínculo por categoria — mirror do
  // legado IG-006/CL-028 (`by-category` só serve para pré-hidratar).
  const findCostCenterParams = (search: string | { search: string }) => ({
    search: typeof search === 'string' ? search : search.search,
    only_analytic: true,
    is_enabled: 'true' as const,
  });

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
        <SelectAsyncPaginate
          name={centerField.name}
          label={financialText.costCenter}
          placeholder={financialText.costCenterPlaceholder}
          service={listCostCenterOptions}
          mapOptions={mapCostCenterToOption}
          findParams={findCostCenterParams}
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
        <Select
          name={planAccountField.name}
          label={financialText.planAccount}
          placeholder={financialText.planAccountPlaceholder}
          value={planAccountField.value ?? null}
          onChange={(option: Option<string> | null) => {
            onPlanAccountTouched(rowId);
            planAccountField.onChange(option ?? null);
          }}
          options={planAccountOptions.map(mapPlanAccountToOption)}
          isDisabled={disabled}
        />
      </Box>

      <Box w={{ base: 'full', sm: '160px' }}>
        <Controller
          name={`categories.${index}.value`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <MoneyInput
              name={rowField.name}
              label={financialText.value}
              value={rowField.value ?? null}
              onValueChange={(nextValue) => rowField.onChange(nextValue)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
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
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}

export function TransferAbcCategoriesAllocation({
  control,
  fields,
  append,
  remove,
  setValue,
  vlTotal,
  transferType,
  errors,
  languageGB,
  disabled = false,
}: TransferAbcCategoriesAllocationProps) {
  const financialText = languageGB.livestock.transferAbcBatch.form.fields.financial;

  const genericControl = control as unknown as Control<TransferAbcCategoriesFieldValues>;
  const arrayError = (errors as any)?.categories?.message as string | undefined;

  const watchedRows = useWatch({ control: genericControl, name: 'categories' }) ?? [];
  const totalAllocated = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const difference = totalAllocated - vlTotal;
  const isBalanced = Math.abs(difference) < 0.01;

  const [touchedCenterByRow, setTouchedCenterByRow] = useState<Record<string, boolean>>({});
  const [planAccountOptionsByRow, setPlanAccountOptionsByRow] = useState<
    Record<string, PlanAccountRef[]>
  >({});
  const [touchedPlanAccountByRow, setTouchedPlanAccountByRow] = useState<Record<string, boolean>>(
    {}
  );

  function handleCenterTouched(rowId: string) {
    setTouchedCenterByRow((prev) => ({ ...prev, [rowId]: true }));
  }

  function handlePlanAccountTouched(rowId: string) {
    setTouchedPlanAccountByRow((prev) => ({ ...prev, [rowId]: true }));
  }

  async function runCascade(rowId: string, index: number, categoryUuid: string) {
    // Só hidrata o PRIMEIRO centro vinculado à categoria (mirror legado
    // IG-006/CL-028) — o universo do select vem do catálogo completo
    // (`listCostCenterOptions`), nunca deste lookup por categoria.
    const centersResponse = await listCostCentersByCategory(categoryUuid);
    const centers = centersResponse.data ?? [];

    if (!touchedCenterByRow[rowId] && centers.length > 0) {
      setValue(`categories.${index}.center_uuid`, mapCostCenterToOption(centers[0]), {
        shouldDirty: true,
      });
    }

    const planAccountResponse = await getPlanAccountByCategory(categoryUuid);
    const planAccount = planAccountResponse.data ?? null;
    setPlanAccountOptionsByRow((prev) => ({ ...prev, [rowId]: planAccount ? [planAccount] : [] }));

    if (!touchedPlanAccountByRow[rowId] && planAccount) {
      setValue(`categories.${index}.plan_account_uuid`, mapPlanAccountToOption(planAccount), {
        shouldDirty: true,
      });
    }
  }

  function handleCategoryChange(rowId: string, index: number, categoryUuid: string | null) {
    if (!categoryUuid) {
      setPlanAccountOptionsByRow((prev) => ({ ...prev, [rowId]: [] }));
      return;
    }
    void runCascade(rowId, index, categoryUuid);
  }

  function handleAdd() {
    append({ category_uuid: null, center_uuid: null, plan_account_uuid: null, value: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={1}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {financialText.allocationSectionTitle}
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
            <TransferAbcCategoryRow
              key={field.id}
              control={genericControl}
              index={index}
              rowId={field.id}
              remove={remove}
              transferType={transferType}
              disabled={disabled}
              financialText={financialText}
              planAccountOptions={planAccountOptionsByRow[field.id] ?? []}
              onCategoryChange={handleCategoryChange}
              onCenterTouched={handleCenterTouched}
              onPlanAccountTouched={handlePlanAccountTouched}
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
    </Box>
  );
}

export default TransferAbcCategoriesAllocation;
