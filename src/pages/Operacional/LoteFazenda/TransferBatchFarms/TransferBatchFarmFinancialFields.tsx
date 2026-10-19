// src/pages/Operacional/LoteFazenda/TransferBatchFarms/TransferBatchFarmFinancialFields.tsx
// -----------------------------------------------------------------------------
// Bloco de PARCELAS + RATEIO (entrada/saída) da tela financeira (SCR-FIN,
// 97-Esteiras/041, TASK-FE-041-LF-02) — subcomponente compartilhado
// (`plano-front-lote-fazenda.md §4 SCR-FIN`), consumido por
// `TransferBatchFarmFinancial.tsx`.
//
// Mirror FUNCIONAL FORTE de `TransferAbcBatch/TransferAbcInstallments.tsx` +
// `TransferAbcCategoriesAllocation.tsx` — MESMA fórmula de geração de
// parcelas (`distributeEqually`, resíduo na última) e MESMA cascata
// Categoria→Centro de Custo (auto-hidrata o 1º centro vinculado). Divergência
// deliberada vs. o irmão: DOIS rateios INDEPENDENTES (`income_categories` —
// Receita na fazenda ORIGEM, `expense_categories` — Despesa na fazenda
// DESTINO), cada um precisando fechar o MESMO `vl_total` (double-entry,
// mirror `TransferBatchFarmFinancialRequest::rules()`), em vez de um único
// `categories[]` com filtro de tipo por discriminador. SEM `plan_account_uuid`
// — a Request de Lote/Fazenda não tem esse campo (diferente do irmão ABC).
//
// `namePrefix` (TASK-FE-041-LF-06, ADITIVO): `InstallmentsBlock` e
// `AllocationBlock` nasceram presos ao form TOP-LEVEL de `SCR-FIN`
// (`TransferBatchFarmFinancialForm`). Para reuso pelo `create` (SCR-CREATE),
// que embute o MESMO bloco em `financial.*` (`TransferBatchFarmForm.financial`,
// TASK-BE-041-LF-06), os paths de campo agora aceitam um prefixo opcional
// (`''` = comportamento ORIGINAL de `SCR-FIN`, sem nenhuma mudança de
// comportamento; `'financial.'` = uso aninhado do `create`). `control`/
// `errors`/`setValue` foram alargados para `any` só neste ponto de fronteira
// (mesmo padrão de cast já usado internamente em `AllocationRow`) — NUNCA
// duplicar este JSX/regra em outro arquivo.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Alert, Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormSetValue,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useAuth } from '@/hooks/useAuth';

import {
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type {
  TransferBatchFarmCategoryRowForm,
  TransferBatchFarmInstallmentRowForm,
} from '@/@types/v2/LoteFazenda/transferBatchFarm';

const FINANCIAL_CATEGORY_TYPE_SAIDAS = 1;
const FINANCIAL_CATEGORY_TYPE_ENTRADAS = 2;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mapCostCenterToOption(item: CostCenterRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function distributeEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const roundedShare = Math.round((total / count) * 100) / 100;
  const shares = new Array(count).fill(roundedShare);
  const distributed = roundedShare * count;
  const remainder = Math.round((total - distributed) * 100) / 100;
  shares[count - 1] = Math.round((shares[count - 1] + remainder) * 100) / 100;
  return shares;
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// Leitura de erro por path PONTILHADO (`'installments'` OU `'financial.installments'`,
// TASK-FE-041-LF-06) — `FieldErrors` é aninhado por chave, nunca indexável por
// string com ponto (`errors['financial.installments']` seria sempre `undefined`).
function getNestedError(errors: unknown, path: string): { message?: string } | undefined {
  return path.split('.').reduce<any>((acc, key) => acc?.[key], errors);
}

// ---- Parcelas ---------------------------------------------------------------

interface InstallmentsBlockProps {
  control: Control<any>;
  fields: { id: string }[];
  replace: (rows: TransferBatchFarmInstallmentRowForm[]) => void;
  vlTotal: number;
  /** Item 4 (reprovação AD F-022) — "Possui entrada?" front-only (mirror `calcInstallments()` legado). */
  hasInput?: boolean;
  /** Valor da entrada, subtraído de `vlTotal` na geração das parcelas quando `hasInput=true`. */
  inputValue?: number;
  errors: FieldErrors<any>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** '' (default) = paths TOP-LEVEL de `SCR-FIN`; 'financial.' = uso aninhado no `create` (TASK-FE-041-LF-06). */
  namePrefix?: string;
}

function InstallmentsBlock({
  control,
  fields,
  replace,
  vlTotal,
  hasInput = false,
  inputValue = 0,
  errors,
  languageGB,
  disabled = false,
  namePrefix = '',
}: InstallmentsBlockProps) {
  const text = languageGB.loteFazenda.transferBatchFarm.form.fields.financial;
  const arrayError = getNestedError(errors, `${namePrefix}installments`)?.message;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const qtdInstallments = useWatch({ control, name: `${namePrefix}qtd_installments` as any });
  const firstInstallmentDate = useWatch({
    control,
    name: `${namePrefix}first_installment_date` as any,
  });
  const intInstallments = useWatch({ control, name: `${namePrefix}int_installments` as any });

  const watchedRows = (useWatch({ control, name: `${namePrefix}installments` as any }) ??
    []) as TransferBatchFarmInstallmentRowForm[];
  const totalInstallments = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);

  // Item 4 (reprovação AD F-022) — saldo a financiar = `vl_total - entrada`
  // (mirror `calcInstallments()` legado, `transfer_form.blade.php:574-679`).
  // `has_input=Não`/`Selecione` preserva o comportamento anterior (net = vlTotal).
  const netTotal = vlTotal - (hasInput ? inputValue : 0);
  const isSumComplete = Math.abs(totalInstallments - netTotal) <= 0.01;

  const canGenerate =
    !!qtdInstallments && Number(qtdInstallments) > 0 && !!firstInstallmentDate && netTotal > 0;

  function executeGenerate() {
    if (!canGenerate) return;
    const shares = distributeEqually(netTotal, Number(qtdInstallments) || 0);
    const rows: TransferBatchFarmInstallmentRowForm[] = shares.map((value, index) => ({
      due_date: addDays(firstInstallmentDate as string, index * (Number(intInstallments) || 0)),
      value,
    }));
    replace(rows);
    setIsConfirmOpen(false);
  }

  function handleGenerateClick() {
    if (fields.length > 0) {
      setIsConfirmOpen(true);
    } else {
      executeGenerate();
    }
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.installmentsSectionTitle}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
        <Controller
          name={`${namePrefix}qtd_installments` as any}
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.installmentsCount}
              allowDot={false}
              decimalPlaces={0}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`${namePrefix}first_installment_date` as any}
          control={control}
          render={({ field, fieldState }) => (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.firstInstallmentDate}
              </Text>
              <DateInput
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={disabled}
              />
              {fieldState.error?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {fieldState.error.message}
                </Text>
              )}
            </Box>
          )}
        />

        <Controller
          name={`${namePrefix}int_installments` as any}
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.installmentsInterval}
              allowDot={false}
              decimalPlaces={0}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Button
        type="button"
        title={text.generateInstallments}
        variant="outline"
        size="sm"
        onClick={handleGenerateClick}
        disabled={disabled || !canGenerate}
      />

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mt={4} mb={4}>
        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {text.installmentsSumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(netTotal)}
            </Badge>
          </Flex>
        )}
      </Flex>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyInstallments}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.installmentDate}
                </Text>
                <Controller
                  name={`${namePrefix}installments.${index}.due_date` as any}
                  control={control}
                  render={({ field: rowField }) => (
                    <DateInput
                      value={rowField.value ?? null}
                      onChange={rowField.onChange}
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`${namePrefix}installments.${index}.value` as any}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={text.installmentValue}
                      allowDot
                      decimalPlaces={2}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
              </Box>
            </Flex>
          ))}
        </Flex>
      )}

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeGenerate}
        title={text.regenerateInstallmentsConfirmTitle}
        description={text.regenerateInstallmentsConfirmDescription}
        confirmButtonText={text.generateInstallments}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}

// ---- Rateio (entrada OU saída) ----------------------------------------------

export interface TransferBatchFarmCategoriesFieldValues {
  rows: TransferBatchFarmCategoryRowForm[];
}

interface AllocationRowProps {
  control: Control<any>;
  /** Nome REAL do array no form raiz (`income_categories`/`expense_categories`, ou `financial.income_categories`/`financial.expense_categories` quando embutido no `create`, TASK-FE-041-LF-06) — os paths dos campos desta linha são derivados daqui, NUNCA de um nome genérico. */
  name: string;
  index: number;
  rowId: string;
  remove: UseFieldArrayRemove;
  categoryTypeIds: number[];
  disabled: boolean;
  financialText: LanguageDate['loteFazenda']['transferBatchFarm']['form']['fields']['financial'];
  onCategoryChange: (rowId: string, index: number, categoryUuid: string | null) => void;
  onCenterTouched: (rowId: string) => void;
}

function AllocationRow({
  control,
  name,
  index,
  rowId,
  remove,
  categoryTypeIds,
  disabled,
  financialText,
  onCategoryChange,
  onCenterTouched,
}: AllocationRowProps) {
  const { activeFarmUuid } = useAuth();

  const { field: categoryField, fieldState: categoryFieldState } = useController({
    control,
    name: `${name}.${index}.category_uuid` as any,
  });
  const { field: centerField, fieldState: centerFieldState } = useController({
    control,
    name: `${name}.${index}.center_uuid` as any,
  });

  const findCategoryParams = (search: string | { search: string }) => ({
    search: typeof search === 'string' ? search : search.search,
    type_ids: categoryTypeIds,
  });

  // Item 2 (reprovação AD F-022) — escopa o Centro de Custo pela fazenda
  // ATIVA (`farm_uuid`, F-245, já suportado end-to-end pela API); sem isso a
  // API devolve TODOS os centros analíticos do tenant.
  const findCostCenterParams = (search: string | { search: string }) => ({
    search: typeof search === 'string' ? search : search.search,
    only_analytic: true,
    is_enabled: 'true' as const,
    farm_uuid: activeFarmUuid ?? undefined,
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

      <Box w={{ base: 'full', sm: '160px' }}>
        <Controller
          name={`${name}.${index}.value` as any}
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

export interface AllocationBlockProps {
  sectionTitle: string;
  control: Control<any>;
  /** `'income_categories'`/`'expense_categories'` (`SCR-FIN`) ou `'financial.income_categories'`/`'financial.expense_categories'` (`create`, TASK-FE-041-LF-06). */
  name: string;
  fields: FieldArrayWithId<any, string, 'id'>[];
  append: (row: TransferBatchFarmCategoryRowForm) => void;
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<any>;
  vlTotal: number;
  /** Rateio de Receita (fazenda origem) usa categorias "Entradas"; Despesa (destino) usa "Saídas" — mirror `TransferAbcTypeEnum`. */
  kind: 'income' | 'expense';
  errors: FieldErrors<any>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function AllocationBlock({
  sectionTitle,
  control,
  name,
  fields,
  append,
  remove,
  setValue,
  vlTotal,
  kind,
  errors,
  languageGB,
  disabled = false,
}: AllocationBlockProps) {
  const financialText = languageGB.loteFazenda.transferBatchFarm.form.fields.financial;
  const categoryTypeIds =
    kind === 'income'
      ? [FINANCIAL_CATEGORY_TYPE_ENTRADAS, FINANCIAL_CATEGORY_TYPE_AMBAS]
      : [FINANCIAL_CATEGORY_TYPE_SAIDAS, FINANCIAL_CATEGORY_TYPE_AMBAS];

  const arrayError = getNestedError(errors, name)?.message;

  const watchedRows = (useWatch({ control, name: name as any }) ??
    []) as TransferBatchFarmCategoryRowForm[];
  const totalAllocated = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isBalanced = Math.abs(totalAllocated - vlTotal) < 0.01;

  const [touchedCenterByRow, setTouchedCenterByRow] = useState<Record<string, boolean>>({});

  function handleCenterTouched(rowId: string) {
    setTouchedCenterByRow((prev) => ({ ...prev, [rowId]: true }));
  }

  async function runCascade(rowId: string, index: number, categoryUuid: string) {
    const centersResponse = await listCostCentersByCategory(categoryUuid);
    const centers = centersResponse.data ?? [];
    if (!touchedCenterByRow[rowId] && centers.length > 0) {
      setValue(`${name}.${index}.center_uuid` as any, mapCostCenterToOption(centers[0]), {
        shouldDirty: true,
      });
    }
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
        <Text fontSize="sm" fontWeight="semibold">
          {sectionTitle}
        </Text>
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
            <AllocationRow
              key={field.id}
              control={control}
              name={name}
              index={index}
              rowId={field.id}
              remove={remove}
              categoryTypeIds={categoryTypeIds}
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

export { InstallmentsBlock };
