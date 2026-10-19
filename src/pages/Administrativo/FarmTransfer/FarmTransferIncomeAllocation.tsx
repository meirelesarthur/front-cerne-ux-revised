// src/pages/Administrativo/FarmTransfer/FarmTransferIncomeAllocation.tsx
// -----------------------------------------------------------------------------
// Bloco PRÓPRIO de rateio de RECEITA (fazenda de ORIGEM) do subfluxo
// financeiro opcional de Trans. Fazendas (FarmTransfer — Estoque, Tarefa 03,
// `GAP-FARMTRANSFER-FE-03`). Consumido por `CreateFarmTransfer.tsx`
// (`useFieldArray({ name: 'income_allocations' })` vive no PAI — este
// componente NUNCA instancia o próprio `useFieldArray`, mesmo racional já
// aplicado em `FarmTransferItemsEditor.tsx`/`WarehouseTransferItemsEditor.tsx`).
//
// Decisão registrada em `GAP-FARMTRANSFER-FE-03`: NÃO reaproveita
// `MovementAllocationEditor` (componente genérico de 8 telas alheias, só
// 1 lado, sem parcelas, com campos `plan_account_uuid`/`harvest_uuid`
// inexistentes nesta feature) — reproduz o MESMO IDIOMA de cálculo
// percent↔value já validado em produção (fórmula `CV-05`/`CL-31`:
// `percent = value/vl_total*100`; `value = percent/100*vl_total`), SEM os
// campos mortos.
//
// `GAP-FARMTRANSFER-04` (fidelidade pós-entrega, confirmado por leitura
// direta do banco `gbcerne`/`category_types`): `category_uuid` passa a
// filtrar por TIPO — Receita (`type_id=2`, "Entradas") + Ambas (`type_id=3`,
// neutro), mirror do legado `FinancialCategoryController@filter`
// (`whereIn('type_id', [$type, 3])`). `center_uuid` passa a operar em
// CASCATA por Categoria (`GET /cost-centers/by-category/{uuid}`,
// `listCostCentersByCategory`), idioma mecânico copiado de
// `IncomeApportionmentTab.tsx` (`costCenterOptionsByRow`/`touchedCenterByRow`/
// `runCascade`, auto-seleção do PRIMEIRO centro quando a linha ainda não foi
// tocada manualmente) — SEM a parte de Conta Contábil
// (`getPlanAccountByCategory`/`plan_account_uuid`, campo inexistente nesta
// feature) e SEM reidratação de edição (`FarmTransferCreateForm` não tem
// modo editar — `RT-06 NAO_APLICAVEL`, ver docblock de
// `@/@types/v2/FarmTransfers`).
//
// `income_centers`/`expense_centers` continuam compartilhando o MESMO
// catálogo tenant-scoped (sem filtro por fazenda) — reflexo OBSERVÁVEL, por
// construção, de `GAP-FARMTRANSFER-02` Opção B (já fechada na camada `api`,
// NÃO reaberto por esta correção): a cascata por Categoria filtra um
// SUBCONJUNTO desse mesmo catálogo, é ortogonal à ausência de filtro de
// fazenda.
// -----------------------------------------------------------------------------

import { ElementType, useRef } from 'react';

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
import { AllocationCostCenterSelect } from '@/components/Form/AllocationCostCenterSelect';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { resolveCascadeCostCenter } from '@/utils/allocationCostCenter';

import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type {
  FarmTransferAllocationRowForm,
  FarmTransferCreateForm,
} from '@/@types/v2/FarmTransfers';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';

export interface FarmTransferAllocationFieldValues {
  income_allocations: FarmTransferAllocationRowForm[];
}

export interface FarmTransferIncomeAllocationProps {
  control: Control<FarmTransferCreateForm>;
  fields: FieldArrayWithId<FarmTransferAllocationFieldValues, 'income_allocations', 'id'>[];
  append: UseFieldArrayAppend<FarmTransferAllocationFieldValues, 'income_allocations'>;
  remove: UseFieldArrayRemove;
  /** Necessário para a auto-seleção do 1º Centro de Custo da cascata (mirror `IncomeApportionmentTab.tsx`). */
  setValue: UseFormSetValue<FarmTransferCreateForm>;
  /** `vl_total` do cabeçalho financeiro — só para o cálculo cosmético de percentual/fechamento. */
  vlTotal: number;
  errors: FieldErrors<FarmTransferCreateForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

// `category_types` (banco `gbcerne`, GAP-FARMTRANSFER-04): 1=Saídas,
// 2=Entradas, 3=Ambas (neutro, incluído nos 2 lados do rateio).
const FINANCIAL_CATEGORY_TYPE_ENTRADAS = 2;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const findCategoryParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  type_ids: [FINANCIAL_CATEGORY_TYPE_ENTRADAS, FINANCIAL_CATEGORY_TYPE_AMBAS],
});

interface FarmTransferIncomeAllocationRowProps {
  control: Control<FarmTransferAllocationFieldValues>;
  index: number;
  rowId: string;
  remove: UseFieldArrayRemove;
  vlTotal: number;
  disabled: boolean;
  financialText: LanguageDate['farmTransfers']['farmTransfer']['form']['fields']['financial'];
  onCategoryChange: (rowId: string, index: number, categoryUuid: string | null) => void;
  onCenterTouched: (rowId: string) => void;
}

// Componente PRÓPRIO por linha — hooks (`useController`) SÓ podem viver
// dentro de um componente/custom hook, nunca soltos dentro de um `.map()`
// no corpo do componente pai (regra do eslint-plugin-react-hooks). Mirror
// do racional já aplicado em `FarmTransferItemRow`
// (`FarmTransferItemsEditor.tsx`).
function FarmTransferIncomeAllocationRow({
  control,
  index,
  rowId,
  remove,
  vlTotal,
  disabled,
  financialText,
  onCategoryChange,
  onCenterTouched,
}: FarmTransferIncomeAllocationRowProps) {
  const { field: categoryField, fieldState: categoryFieldState } = useController({
    control,
    name: `income_allocations.${index}.category_uuid`,
  });
  const { field: centerField, fieldState: centerFieldState } = useController({
    control,
    name: `income_allocations.${index}.center_uuid`,
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
        {/* Cascata Categoria→Centro de Custo (GAP-FARMTRANSFER-04) — deixa
            de ser `SelectAsyncPaginate` (catálogo completo, paginado) e vira
            `Select` síncrono alimentado pelas opções já carregadas pela
            cascata (0..n itens vinculados à Categoria desta linha), mirror
            EXATO de `IncomeApportionmentTab.tsx`. */}
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

      <Box w={{ base: 'full', sm: '160px' }}>
        <Controller
          name={`income_allocations.${index}.value`}
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

      {/* Percentual — cosmético, mirror `MovementAllocationEditor` (fórmula
          `CV-05`). Editar o % recalcula o Valor DESTA linha; editar o Valor
          recalcula o % (Controller acima). */}
      <Box w={{ base: 'full', sm: '140px' }}>
        <Controller
          name={`income_allocations.${index}.value`}
          control={control}
          render={({ field: rowField }) => {
            const rowValue = Number(rowField.value) || 0;
            const rowPercent = vlTotal > 0 ? (rowValue / vlTotal) * 100 : 0;
            return (
              <PercentInput
                name={`${rowField.name}-percent`}
                label={financialText.percent}
                value={rowPercent}
                maxValue={100}
                disabled={disabled || vlTotal <= 0}
                onValueChange={(percent) => {
                  const newValue = vlTotal > 0 ? Number(((percent / 100) * vlTotal).toFixed(2)) : 0;
                  rowField.onChange(newValue);
                }}
              />
            );
          }}
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

export function FarmTransferIncomeAllocation({
  control,
  fields,
  append,
  remove,
  setValue,
  vlTotal,
  errors,
  languageGB,
  disabled = false,
}: FarmTransferIncomeAllocationProps) {
  const financialText = languageGB.farmTransfers.farmTransfer.form.fields.financial;

  const genericControl = control as unknown as Control<FarmTransferAllocationFieldValues>;
  const arrayError = (errors as any)?.income_allocations?.message as string | undefined;

  // Refs (leitura pós-await sem closure velha). `autoCenterByRow`: último centro
  // AUTO-selecionado por linha — só ele pode ser trocado por nova pré-seleção;
  // escolha do usuário / centro salvo (edição) nunca é sobrescrito.
  const autoCenterByRow = useRef<Record<string, string>>({});
  const touchedCenterByRow = useRef<Record<string, boolean>>({});
  const rowsRef = useRef<any[]>([]);

  const watchedRows = useWatch({ control: genericControl, name: 'income_allocations' }) ?? [];
  rowsRef.current = watchedRows;
  const totalAllocated = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const difference = totalAllocated - vlTotal;
  const isBalanced = Math.abs(difference) < 0.01;

  // Cascata Categoria→Centro de Custo (GAP-FARMTRANSFER-04) — estado por
  // LINHA (chaveado pelo `field.id` do `useFieldArray`), mirror mecânico de
  // `IncomeApportionmentTab.tsx` (`costCenterOptionsByRow`/
  // `touchedCenterByRow`), sem a parte de Conta Contábil.

  function handleCenterTouched(rowId: string) {
    touchedCenterByRow.current[rowId] = true;
  }

  // `by-category` só PRÉ-SELECIONA o 1º centro; as opções vêm do catálogo do contratante (`AllocationCostCenterSelect`, scope=allocation).
  async function runCascade(rowId: string, index: number, categoryUuid: string) {
    const preselected = await resolveCascadeCostCenter(categoryUuid);
    if (!preselected || touchedCenterByRow.current[rowId]) return;
    const current = rowsRef.current[index]?.center_uuid?.value as string | undefined;
    if (current && current !== autoCenterByRow.current[rowId]) return;
    autoCenterByRow.current[rowId] = preselected.value;
    setValue(`income_allocations.${index}.center_uuid`, preselected, { shouldDirty: true });
  }

  function handleCategoryChange(rowId: string, index: number, categoryUuid: string | null) {
    if (!categoryUuid) return;
    void runCascade(rowId, index, categoryUuid);
  }

  function handleAdd() {
    append({ category_uuid: null, center_uuid: null, value: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={1}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {financialText.incomeSectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {financialText.incomeSectionHint}
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
            <FarmTransferIncomeAllocationRow
              key={field.id}
              control={genericControl}
              index={index}
              rowId={field.id}
              remove={remove}
              vlTotal={vlTotal}
              disabled={disabled}
              financialText={financialText}
              onCategoryChange={handleCategoryChange}
              onCenterTouched={handleCenterTouched}
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

export default FarmTransferIncomeAllocation;
