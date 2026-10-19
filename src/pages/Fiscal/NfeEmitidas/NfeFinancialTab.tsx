// src/pages/Fiscal/NfeEmitidas/NfeFinancialTab.tsx
// -----------------------------------------------------------------------------
// Aba "Financeiro" do form de NFe Emitida — TASK-FE-036-D2-2 (SUPERA
// TASK-FE-036-D2/GAP-FE-036-401, decisão do dono DEC-123). Só renderiza
// quando "Gerar financeiro? = Sim" (`has_financial===true`, mesmo padrão de
// exibição condicional já usado pelo bloco ICMS manual/`type_debt`/
// `type_credit` de `CreateOrUpdateNfe.tsx`).
//
// REGRA DE OURO da Tarefa: reuso direto dos componentes já em produção de
// Income/Expense — NÃO recriar cálculo de parcela nem cascata de rateio.
// Concretamente:
//   - Linhas do form (`financial_installments`/`financial_categories`)
//     reaproveitam LITERALMENTE `IncomeInstallmentForm`/
//     `IncomeApportionmentForm` (`@/@types/v2/Nfes`, `import type` de
//     `@/@types/v2/Incomes` — ver comentário do arquivo de tipos).
//   - Parcelamento: MESMO algoritmo de `IncomeInstallmentsTab.tsx`
//     (`addDays` + `distributeWithoutReconciling`, tolerância `count*0.01`,
//     já validada no backend — GAP-FE-036-302). O contrato da Tarefa
//     esclarece que essa É a MESMA política independente do `tipo` da NF-e
//     ("MESMA política de arredondamento sem reconciliação... os DOIS já
//     têm a mesma forma de campo") — por isso um ÚNICO gerador serve os 2
//     tipos, sem duplicar a UI de "Possui entrada" (Income-only, fora do
//     escopo mínimo desta Tarefa — não pedido pelo DoD/Cenários).
//   - Rateio: mirror `IncomeApportionmentTab.tsx` (cascata Categoria→Centro
//     de Custo→Conta Contábil, percentual↔valor no blur, soma=100%,
//     tolerância 0.01) — o contrato de API desta fatia (`NfeRequest`,
//     TASK-BE-036-D2A) fecha em `percentage` (0-100), forma IDÊNTICA a
//     `IncomeCategoryData`, NUNCA a forma em REAIS/tolerância-zero de
//     `ExpenseApportionmentData` — por isso o rateio usa o MESMO
//     comportamento para os 2 tipos de NF-e (achado documentado, não
//     "esquecimento" do texto "mirror Expense" da Tarefa).
//
// Cabeçalho do bloco — `financial_type_title_uuid` (`/type-titles/options`,
// mesmo serviço/ungated já usado por Income/Invoice) e
// `financial_proprietary_uuid` (`listProprietaries`, mesmo serviço/
// `is_enabled:true` já usado por `CreateOrUpdateIncome.tsx`).
//
// LACUNA DECLARADA (SEM MOCK) — reidratação na edição: `NfeResource` HOJE
// (`TASK-BE-036-D2A`/`D2B`, doc explícita "response inalterado nesta
// Tarefa") NÃO devolve o bloco financeiro no `GET /nfes/{uuid}` — os títulos
// (`Income`/`Expense`) são criados no backend mas não voltam na leitura desta
// fatia. `NfeDetail.financial_*` foi modelado como `Optional` (mirror
// `IncomePayload.xml_key`) só para a reidratação ativar SOZINHA se/quando uma
// fatia futura expuser o bloco — até lá, editar uma NFe com financeiro já
// gerado reabre a aba VAZIA (o usuário precisa reinformar parcelamento/
// rateio a cada PUT, já que o backend sempre apaga e recria os títulos).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  getPlanAccountByCategory,
  listPlanAccountOptions,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { Option } from '@/@types/option';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { NfeForm as NfeFormType } from '@/@types/v2/Nfes';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

// Mirror EXATO de `IncomeInstallmentsTab.tsx`/`income-schema.ts` — intervalo
// fixo em dias a partir da 1ª data (NÃO preserva mesmo dia do mês).
function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// Mirror EXATO de `IncomeInstallmentsTab.tsx` (GAP-FE-036-302) — cada
// parcela arredonda ISOLADA, sem reconciliar o resíduo na última posição. A
// soma PODE divergir do total dentro da tolerância `count * 0.01` (mesma
// tolerância validada no backend), comportamento INTENCIONAL.
function distributeWithoutReconciling(total: number, count: number): number[] {
  if (count <= 0) return [];
  const share = Math.round((total / count) * 100) / 100;
  return new Array(count).fill(share);
}

// Mirror EXATO de `IncomeApportionmentTab.tsx`.
const APPORTIONMENT_SUM_TOLERANCE = 0.01;
const APPORTIONMENT_SUM_TARGET = 100;

export interface NfeFinancialTabProps {
  control: Control<NfeFormType>;
  errors: FieldErrors<NfeFormType>;
  watch: UseFormWatch<NfeFormType>;
  setValue: UseFormSetValue<NfeFormType>;
  isLoading: boolean;
  canSave: boolean;
  /** Total da NF-e (mesma fórmula de `NfeItemsTab.tsx`/`nfe-schema.ts`
   *  `nfe-total-must-be-positive`) — base da distribuição das parcelas e do
   *  preview de valor do rateio. */
  totalAmount: number;
}

export function NfeFinancialTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  totalAmount,
}: NfeFinancialTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.nfes.nfe.form.financialTab;
  const isDisabled = !canSave || isLoading;

  // ---- Cabeçalho do bloco ----
  const typeTitleField = (
    <Controller
      name="financial_type_title_uuid"
      control={control}
      render={({ field }) => (
        <SelectAsyncPaginate
          name={field.name}
          label={text.fields.typeTitle}
          placeholder={text.placeholders.typeTitle}
          service={listTypeTitleOptions}
          mapOptions={(item: TypeTitleOptionItem) => ({
            label: item.description,
            value: item.uuid,
          })}
          findParams={(search: string | { search: string }) => ({
            search: typeof search === 'string' ? search : search.search,
          })}
          value={field.value ?? undefined}
          onChange={(option: any) => field.onChange(option ?? null)}
          error={errors.financial_type_title_uuid?.message as string | undefined}
          isRequired
          isDisabled={isDisabled}
        />
      )}
    />
  );

  const proprietaryField = (
    <Controller
      name="financial_proprietary_uuid"
      control={control}
      render={({ field }) => (
        <SelectAsyncPaginate
          name={field.name}
          label={text.fields.proprietary}
          placeholder={text.placeholders.proprietary}
          service={listProprietaries}
          mapOptions={(item: ProprietaryListItem) => ({ label: item.name, value: item.uuid })}
          findParams={(search: string | { search: string }) => ({
            search: typeof search === 'string' ? search : search.search,
            is_enabled: true,
          })}
          value={field.value ?? undefined}
          onChange={(option: any) => field.onChange(option ?? null)}
          isDisabled={isDisabled}
        />
      )}
    />
  );

  // ---- Parcelamento (mirror IncomeInstallmentsTab.tsx) ----
  const {
    fields: installmentFields,
    replace: replaceInstallments,
    remove: removeInstallment,
  } = useFieldArray({ control, name: 'financial_installments' });

  const [qtdInstallments, setQtdInstallments] = useState<number | null>(2);
  const [firstDueDate, setFirstDueDate] = useState<string | null>(null);
  const [intervalDays, setIntervalDays] = useState<number | null>(30);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

  function doGenerateInstallments() {
    const count = Number(qtdInstallments) || 0;
    const shares = distributeWithoutReconciling(Number(totalAmount || 0), count);
    const rows = shares.map((value, index) => ({
      due_date: firstDueDate ? addDays(firstDueDate, index * (Number(intervalDays) || 0)) : null,
      value,
    }));
    replaceInstallments(rows);
    setIsRegenerateConfirmOpen(false);
  }

  function handleGenerateInstallmentsClick() {
    if (installmentFields.length > 0) {
      setIsRegenerateConfirmOpen(true);
    } else {
      doGenerateInstallments();
    }
  }

  const watchedInstallments = watch('financial_installments') ?? [];
  const installmentsSum = watchedInstallments.reduce(
    (acc, item) => acc + (Number(item?.value) || 0),
    0
  );
  const isInstallmentsSumComplete =
    watchedInstallments.length === 0 ||
    Math.abs(installmentsSum - Number(totalAmount || 0)) <= watchedInstallments.length * 0.01;
  const installmentsArrayError = (errors.financial_installments as any)?.message as
    string | undefined;

  // ---- Rateio (mirror IncomeApportionmentTab.tsx) ----
  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategoryRow,
  } = useFieldArray({ control, name: 'financial_categories' });

  const [categoryOptionsCache, setCategoryOptionsCache] = useState<Record<string, Option<string>>>(
    {}
  );
  const [centerOptionsCache, setCenterOptionsCache] = useState<Record<string, Option<string>>>({});
  const [planAccountOptionsCache, setPlanAccountOptionsCache] = useState<
    Record<string, Option<string>>
  >({});
  const [touchedCenterByRow, setTouchedCenterByRow] = useState<Record<string, boolean>>({});
  const [valueDraftByRow, setValueDraftByRow] = useState<Record<string, number>>({});

  async function runCategoryCascade(categoryUuid: string) {
    const [planAccountResponse, costCentersResponse] = await Promise.all([
      getPlanAccountByCategory(categoryUuid),
      listCostCentersByCategory(categoryUuid),
    ]);

    const planAccount = planAccountResponse.data;
    if (planAccount) {
      setPlanAccountOptionsCache((prev) => ({
        ...prev,
        [planAccount.uuid]: {
          label: `${planAccount.code} — ${planAccount.description}`,
          value: planAccount.uuid,
        },
      }));
    }

    const centers = costCentersResponse.data ?? [];
    if (centers.length > 0) {
      setCenterOptionsCache((prev) => {
        const next = { ...prev };
        centers.forEach((center) => {
          next[center.uuid] = {
            label: `${center.code} — ${center.description}`,
            value: center.uuid,
          };
        });
        return next;
      });
    }

    return { planAccount, centers };
  }

  function handleCategoryChange(index: number, rowId: string, option: Option<string> | null) {
    setValue(`financial_categories.${index}.category_uuid`, option?.value ?? null, {
      shouldDirty: true,
    });
    setValue(`financial_categories.${index}.plan_account_uuid`, null);

    if (option) {
      setCategoryOptionsCache((prev) => ({ ...prev, [option.value]: option }));
      runCategoryCascade(option.value).then(({ planAccount, centers }) => {
        setValue(`financial_categories.${index}.plan_account_uuid`, planAccount?.uuid ?? null, {
          shouldDirty: true,
        });
        if (!touchedCenterByRow[rowId] && centers.length > 0) {
          setValue(`financial_categories.${index}.center_uuid`, centers[0].uuid, {
            shouldDirty: true,
          });
        }
      });
    }
  }

  function handlePlanAccountChange(index: number, option: Option<string> | null) {
    if (option) {
      setPlanAccountOptionsCache((prev) => ({ ...prev, [option.value]: option }));
    }
    setValue(`financial_categories.${index}.plan_account_uuid`, option?.value ?? null, {
      shouldDirty: true,
    });
  }

  const watchedCategories = watch('financial_categories') ?? [];
  const totalPercentage = watchedCategories.reduce(
    (sum, item) => sum + (Number(item?.percentage) || 0),
    0
  );
  const isPercentageSumComplete =
    Math.abs(totalPercentage - APPORTIONMENT_SUM_TARGET) <= APPORTIONMENT_SUM_TOLERANCE;
  const categoriesArrayError = (errors.financial_categories as any)?.message as string | undefined;

  function canAddCategoryRow(): boolean {
    if (watchedCategories.length === 0) return true;
    const last = watchedCategories[watchedCategories.length - 1];
    return (
      !!last?.category_uuid &&
      !!last?.center_uuid &&
      last?.percentage !== null &&
      last?.percentage !== undefined
    );
  }

  function handleAddCategoryRow() {
    if (!canAddCategoryRow()) {
      toaster.warning({ description: text.apportionment.addRowBlockedMessage });
      return;
    }
    appendCategory({
      category_uuid: null,
      plan_account_uuid: null,
      center_uuid: null,
      percentage: null,
    });
  }

  const [categoryRowIndexToRemove, setCategoryRowIndexToRemove] = useState<number | null>(null);

  function handleRequestRemoveCategoryRow(index: number) {
    if (categoryFields.length <= 1) {
      toaster.warning({ description: text.apportionment.removeRowBlockedMessage });
      return;
    }
    setCategoryRowIndexToRemove(index);
  }

  function handleConfirmRemoveCategoryRow() {
    if (categoryRowIndexToRemove !== null) {
      removeCategoryRow(categoryRowIndexToRemove);
      setCategoryRowIndexToRemove(null);
    }
  }

  return (
    <Box pt={4}>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.sectionHint}
      </Text>

      <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
        {typeTitleField}
        {proprietaryField}
      </SimpleGrid>

      {/* ---- Parcelamento ---- */}
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.installments.sectionTitle}
      </Text>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.installments.sectionHint}
      </Text>

      <Flex gap={4} wrap="wrap" mb={4} align="flex-end">
        <NumberInput
          name="financial_qtd_installments"
          label={text.installments.qtdInstallments}
          value={qtdInstallments}
          onValueChange={(value) => setQtdInstallments(value ?? 1)}
          min={1}
          disabled={isDisabled}
        />
        <Field label={text.installments.firstDueDate}>
          <DateInput value={firstDueDate} onChange={setFirstDueDate} disabled={isDisabled} />
        </Field>
        <NumberInput
          name="financial_interval_days"
          label={text.installments.intervalDays}
          value={intervalDays}
          onValueChange={(value) => setIntervalDays(value ?? 0)}
          min={0}
          disabled={isDisabled}
        />
        <Button
          title={text.installments.generateButton}
          variant="outline"
          onClick={handleGenerateInstallmentsClick}
          disabled={isDisabled}
        />
      </Flex>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.installments.sumLabel}
        </Text>
        {installmentFields.length > 0 && (
          <Flex align="center" gap={2}>
            <Badge colorPalette={isInstallmentsSumComplete ? 'green' : 'orange'} variant="subtle">
              {installmentsSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Badge>
            <Text fontSize="xs" color="fg.muted">
              ({text.installments.sumHint})
            </Text>
          </Flex>
        )}
      </Flex>

      {installmentsArrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {installmentsArrayError}
        </Text>
      )}

      {installmentFields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.installments.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={6}>
          {installmentFields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Controller
                  name={`financial_installments.${index}.due_date`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Field label={text.installments.columns.dueDate}>
                      <DateInput
                        value={rowField.value}
                        onChange={rowField.onChange}
                        disabled={isDisabled}
                      />
                    </Field>
                  )}
                />
              </Box>
              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`financial_installments.${index}.value`}
                  control={control}
                  render={({ field: rowField }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.installments.columns.value}
                      value={rowField.value}
                      onValueChange={rowField.onChange}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>
              <IconButtonTable
                aria-label={text.installments.removeRowLabel}
                mensegerTooltip={text.installments.removeRowLabel}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => removeInstallment(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <DeleteConfirmDialog
        isOpen={isRegenerateConfirmOpen}
        onClose={() => setIsRegenerateConfirmOpen(false)}
        onConfirm={doGenerateInstallments}
        title={text.installments.regenerateConfirmTitle}
        description={text.installments.regenerateConfirmDescription}
        confirmButtonText={text.installments.generateButton}
        tone="warning"
        colorPalette="orange"
      />

      {/* ---- Rateio ---- */}
      <Text fontSize="sm" fontWeight="semibold" mt={2} mb={2}>
        {text.apportionment.sectionTitle}
      </Text>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.apportionment.sectionHint}
        </Text>
        {categoryFields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {text.apportionment.sumLabel}:
            </Text>
            <Badge colorPalette={isPercentageSumComplete ? 'green' : 'orange'} variant="subtle">
              {totalPercentage.toFixed(2)}%
            </Badge>
            {!isPercentageSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({text.apportionment.sumHint})
              </Text>
            )}
          </Flex>
        )}
      </Flex>

      {categoriesArrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {categoriesArrayError}
        </Text>
      )}

      {categoryFields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.apportionment.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {categoryFields.map((field, index) => {
            const rowId = field.id;
            const percentage = watchedCategories[index]?.percentage ?? 0;
            const previewValue = (Number(percentage) / 100) * Number(totalAmount || 0);
            const displayedValue = valueDraftByRow[rowId] ?? previewValue;
            const planAccountUuid = watchedCategories[index]?.plan_account_uuid ?? null;

            return (
              <Flex key={rowId} gap={3} align="flex-end" wrap="wrap">
                <Box flex="1" minW="220px">
                  <Controller
                    name={`financial_categories.${index}.category_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={text.apportionment.fields.category}
                        placeholder={text.apportionment.placeholders.category}
                        service={listFinancialCategoryOptions}
                        mapOptions={(item: FinancialCategoryOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={rowField.value ? categoryOptionsCache[rowField.value] : undefined}
                        onChange={(option: any) => handleCategoryChange(index, rowId, option)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <Box flex="1" minW="200px">
                  <Controller
                    name={`financial_categories.${index}.center_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={text.apportionment.fields.center}
                        placeholder={text.apportionment.placeholders.center}
                        service={listCostCenterOptions}
                        mapOptions={(item: CostCenterRef) => ({
                          label: `${item.code} — ${item.description}`,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          only_analytic: true,
                        })}
                        value={rowField.value ? centerOptionsCache[rowField.value] : undefined}
                        onChange={(option: any) => {
                          setTouchedCenterByRow((prev) => ({ ...prev, [rowId]: true }));
                          if (option) {
                            setCenterOptionsCache((prev) => ({ ...prev, [option.value]: option }));
                          }
                          rowField.onChange(option?.value ?? null);
                        }}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <Box flex="1" minW="200px">
                  <SelectAsyncPaginate
                    name={`financial_categories.${index}.plan_account_uuid`}
                    label={text.apportionment.fields.planAccount}
                    placeholder={text.apportionment.placeholders.planAccount}
                    service={listPlanAccountOptions}
                    mapOptions={(item: PlanAccountRef) => ({
                      label: `${item.code} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={planAccountUuid ? planAccountOptionsCache[planAccountUuid] : undefined}
                    onChange={(option: any) => handlePlanAccountChange(index, option ?? null)}
                    isDisabled={isDisabled}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '140px' }}>
                  <Controller
                    name={`financial_categories.${index}.percentage`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <NumberInput
                        name={rowField.name}
                        label={text.apportionment.fields.percentage}
                        value={rowField.value ?? null}
                        onValueChange={(value) => {
                          rowField.onChange(value);
                          setValueDraftByRow((prev) => {
                            if (!(rowId in prev)) return prev;
                            const next = { ...prev };
                            delete next[rowId];
                            return next;
                          });
                        }}
                        min={0}
                        max={100}
                        allowDot
                        decimalPlaces={2}
                        error={fieldState.error?.message}
                        isRequired
                        disabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '160px' }}>
                  <MoneyInput
                    name={`financial_categories.${index}.value`}
                    label={text.apportionment.fields.valuePreview}
                    value={displayedValue}
                    onValueChange={(value) =>
                      setValueDraftByRow((prev) => ({ ...prev, [rowId]: value }))
                    }
                    onBlur={() => {
                      if (!(rowId in valueDraftByRow)) return;
                      const draftValue = valueDraftByRow[rowId];
                      const nextPercentage =
                        Number(totalAmount || 0) > 0
                          ? Math.round((draftValue / Number(totalAmount)) * 10000) / 100
                          : 0;
                      setValue(`financial_categories.${index}.percentage`, nextPercentage, {
                        shouldDirty: true,
                      });
                      setValueDraftByRow((prev) => {
                        const next = { ...prev };
                        delete next[rowId];
                        return next;
                      });
                    }}
                    disabled={isDisabled}
                  />
                </Box>

                <IconButtonTable
                  aria-label={text.apportionment.removeRowLabel}
                  mensegerTooltip={text.apportionment.removeRowLabel}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={() => handleRequestRemoveCategoryRow(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Button
        title={text.apportionment.addRowLabel}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAddCategoryRow}
        disabled={isDisabled}
      />

      <DeleteConfirmDialog
        isOpen={categoryRowIndexToRemove !== null}
        onClose={() => setCategoryRowIndexToRemove(null)}
        onConfirm={handleConfirmRemoveCategoryRow}
        title={text.apportionment.removeRowConfirmTitle}
        confirmButtonText={text.apportionment.removeRowLabel}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}
