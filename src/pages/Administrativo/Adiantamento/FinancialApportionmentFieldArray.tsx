// src/pages/Administrativo/Adiantamento/FinancialApportionmentFieldArray.tsx
// -----------------------------------------------------------------------------
// Sub-card "Rateio por Categoria" (`financial.categories[]` = apropriação de
// custo, `{ category_uuid, value ABSOLUTO, center_uuid }`) do bloco "Gerar
// Financeiro" — TASK-FE-FINANCEIRO-adiant (97-Esteiras/034, D2-REV). Mirror
// mecânico de `Financeiro/ContasAPagar/ExpenseApportionmentTab.tsx`
// (**melhor espelho** — value-based, Σ==total, percent↔valor,
// autofill de centro), com 2 divergências conscientes (FID-G3F §4.3/§9.3):
//   - SEM `plan_account_uuid` (DEC-FIN-B — fiel ao legado, que nunca gravava
//     plano de contas neste rateio).
//   - `category_uuid`/`center_uuid` do RHF são STRING crua (uuid), não
//     `Option` — convenção do NÚCLEO do Advance (`employee_uuid`/
//     `event_uuid`), não a do Expense. O rótulo de exibição vive numa cache
//     `useState<Record<string, Option>>` LIFTED para
//     `CreateOrUpdateAdiantamento.tsx` (props `pickedCategoryOptions`/
//     `pickedCenterOptions`), semeada por `advance-financial-hydrate.ts` no
//     EDIT.
//
// Soma reativa (Σ==amount, 0.01) — `watch('financial.categories')` +
// `watch('amount')`; validação vive no `advance-schema.ts`
// ('financial-categories-sum'); este componente só EXIBE.
// `percent` é UI-only (nunca vai no wire) — `recalcPercentFromValue`/
// `recalcValueFromPercent` no blur, mirror EXATO do Expense.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import {
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { Option } from '@/@types/option';
import type { AdvanceForm } from '@/@types/v2/Advances';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface FinancialApportionmentFieldArrayProps {
  control: Control<AdvanceForm>;
  errors: FieldErrors<AdvanceForm>;
  watch: UseFormWatch<AdvanceForm>;
  setValue: UseFormSetValue<AdvanceForm>;
  isLoading: boolean;
  canSave: boolean;
  /** Cache de exibição LIFTED (mirror `ExpenseApportionmentTab`, mas
   *  compartilhada com o `fillForm` de `CreateOrUpdateAdiantamento.tsx` —
   *  semeada por `advance-financial-hydrate.ts` no EDIT). */
  pickedCategoryOptions: Record<string, Option>;
  setPickedCategoryOptions: Dispatch<SetStateAction<Record<string, Option>>>;
  pickedCenterOptions: Record<string, Option>;
  setPickedCenterOptions: Dispatch<SetStateAction<Record<string, Option>>>;
}

/** Tolerância de exibição — mirror EXATO do schema (`advance-schema.ts`,
 *  'financial-categories-sum') e do backend (`AdvanceRequest::after()`). */
const FINANCIAL_CATEGORIES_SUM_TOLERANCE = 0.01;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FinancialApportionmentFieldArray({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  pickedCategoryOptions,
  setPickedCategoryOptions,
  pickedCenterOptions,
  setPickedCenterOptions,
}: FinancialApportionmentFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.advances.advance.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'financial.categories' });

  const isDisabled = !canSave || isLoading;

  const amount = Number(watch('amount')) || 0;

  const watchedCategories = watch('financial.categories') ?? [];
  const totalValue = watchedCategories.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isSumComplete = Math.abs(totalValue - amount) <= FINANCIAL_CATEGORIES_SUM_TOLERANCE;

  const arrayError = errors.financial?.categories?.message as string | undefined;

  // Percentual do rateio — cálculo bidirecional %↔valor, recalculado SÓ no
  // `onBlur` (mirror `ExpenseApportionmentTab.recalcPercentFromValue/
  // recalcValueFromPercent`), nunca a cada tecla. `percent` é UI-only.
  function recalcPercentFromValue(index: number) {
    if (!amount) return;
    const row = (watch('financial.categories') ?? [])[index];
    const percent = Math.round(((Number(row?.value) || 0) / amount) * 10000) / 100;
    setValue(`financial.categories.${index}.percent`, percent);
  }

  function recalcValueFromPercent(index: number) {
    if (!amount) return;
    const row = (watch('financial.categories') ?? [])[index];
    const value = Math.round(((Number(row?.percent) || 0) / 100) * amount * 100) / 100;
    setValue(`financial.categories.${index}.value`, value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  // Guarda "não remover última linha" (mirror `ExpenseApportionmentTab`) —
  // nunca deixa o rateio ficar vazio por remoção.
  function handleRemoveRow(index: number) {
    if (fields.length <= 1) {
      toaster.warning({
        title: text.apportionmentRow.removeButton,
        description: text.apportionmentRow.emptyLabel,
      });
      return;
    }
    remove(index);
  }

  // Cascata categoria→centro (FID-G3F §7.2, default REPLICAR autofill) —
  // disparada só no onChange do Controller da linha. SEM plan_account
  // (DEC-FIN-B) — diferença consciente vs. `ExpenseApportionmentTab`.
  async function handleCategoryChange(index: number, option: Option<string> | null) {
    setValue(`financial.categories.${index}.category_uuid`, option?.value ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!option) {
      setValue(`financial.categories.${index}.center_uuid`, '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setPickedCategoryOptions((prev) => ({ ...prev, [option.value]: option }));

    try {
      const costCentersResponse = await listCostCentersByCategory(option.value);
      const costCenters = (costCentersResponse.data as CostCenterRef[]) ?? [];
      const firstCenter = costCenters[0];
      if (firstCenter) {
        const centerOption: Option<string> = {
          label: `${firstCenter.code} — ${firstCenter.description}`,
          value: firstCenter.uuid,
        };
        setValue(`financial.categories.${index}.center_uuid`, centerOption.value, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setPickedCenterOptions((prev) => ({ ...prev, [centerOption.value]: centerOption }));
      } else {
        setValue(`financial.categories.${index}.center_uuid`, '', {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } catch {
      // Erro na cascata NUNCA bloqueia o formulário (mirror legado).
      setValue(`financial.categories.${index}.center_uuid`, '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.apportionmentRow.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalValue)} / {formatCurrencyBRL(amount)}
          </Badge>
        )}
      </Flex>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.apportionmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`financial.categories.${index}.category_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.financialCategory}
                      service={listFinancialCategoryOptions}
                      mapOptions={(item: FinancialCategoryOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        class: 2, // ANALÍTICA (FinancialCategoryClass::ANALYTICAL)
                      })}
                      value={rowField.value ? pickedCategoryOptions[rowField.value] : undefined}
                      onChange={(option: any) => handleCategoryChange(index, option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`financial.categories.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.costCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={rowField.value ? pickedCenterOptions[rowField.value] : undefined}
                      onChange={(option: any) => {
                        rowField.onChange(option?.value ?? '');
                        if (option) {
                          setPickedCenterOptions((prev) => ({ ...prev, [option.value]: option }));
                        }
                      }}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '160px' }}>
                <Controller
                  name={`financial.categories.${index}.percent`}
                  control={control}
                  render={({ field: rowField }) => (
                    <PercentInput
                      name={rowField.name}
                      label={text.fields.apportionmentPercent}
                      maxValue={100}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      onBlur={() => recalcValueFromPercent(index)}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '180px' }}>
                <Controller
                  name={`financial.categories.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.fields.apportionmentValue}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      onBlur={() => recalcPercentFromValue(index)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Flex direction="column" gap="1.5">
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {text.apportionmentRow.removeButton}
                </Flex>
                <IconButtonTable
                  aria-label={text.apportionmentRow.removeButton}
                  mensegerTooltip={text.apportionmentRow.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled || fields.length <= 1}
                  onClick={() => handleRemoveRow(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.apportionmentRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            category_uuid: '',
            center_uuid: '',
            value: null,
            percent: null,
          })
        }
        disabled={isDisabled}
      />
    </Box>
  );
}
