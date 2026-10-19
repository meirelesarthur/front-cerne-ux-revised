// src/pages/Frota/Manutencoes/GenerateFinancialApportionmentFieldArray.tsx
// -----------------------------------------------------------------------------
// Rateio (categoria/centro de custo) DENTRO de 1 bloco de fornecedor — Tarefa
// 45. `useFieldArray('providers.{index}.categories')`, mirror da INTERAÇÃO
// de `Financeiro/ContasAPagar/ExpenseApportionmentTab.tsx` — fechamento
// EXATO contra `total` do bloco (tolerância 0), SEM a cascata
// categoria→conta contábil (`plan_account_uuid` fora do DTO backend desta
// feature, `GenerateMaintenanceFinancialProviderData` reusa
// `ExpenseApportionmentRowData` sem esse campo listado) e SEM percentual
// (mirror simplificado, só valor).
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { GenerateFinancialForm } from '@/@types/v2/Maintenances';

import type { Control, UseFormWatch } from 'react-hook-form';

export interface GenerateFinancialApportionmentFieldArrayProps {
  providerIndex: number;
  control: Control<GenerateFinancialForm>;
  watch: UseFormWatch<GenerateFinancialForm>;
  isDisabled: boolean;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function GenerateFinancialApportionmentFieldArray({
  providerIndex,
  control,
  watch,
  isDisabled,
}: GenerateFinancialApportionmentFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.generateFinancial.apportionment;

  const { fields, append, remove } = useFieldArray({
    control,
    name: `providers.${providerIndex}.categories`,
  });

  const total = Number(watch(`providers.${providerIndex}.total`)) || 0;
  const categories = watch(`providers.${providerIndex}.categories`) ?? [];
  const sumValue = categories.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isSumExact = Math.round(sumValue * 100) === Math.round(total * 100);

  return (
    <Box pt={2}>
      <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={3}>
        {text.title}
      </Text>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={3}>
        <Text fontSize="sm" color="fg.muted">
          {text.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumExact ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(sumValue)} / {formatCurrencyBRL(total)}
          </Badge>
        )}
      </Flex>

      {!isSumExact && fields.length > 0 && (
        <Text fontSize="xs" color="orange.600" mb={3}>
          {text.sumNotClosed}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={3} mb={3}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`providers.${providerIndex}.categories.${index}.category_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.category}
                      placeholder={text.placeholders.category}
                      service={listFinancialCategoryOptions}
                      mapOptions={(item: FinancialCategoryOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        is_enabled: 'true' as const,
                        type_id: 1,
                      })}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
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
                  name={`providers.${providerIndex}.categories.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.center}
                      placeholder={text.placeholders.center}
                      service={listCostCenterOptions}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '180px' }}>
                <Controller
                  name={`providers.${providerIndex}.categories.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.fields.value}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={text.removeButton}
                mensegerTooltip={text.removeButton}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled || fields.length <= 1}
                onClick={() => remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={() => append({ category_uuid: null, center_uuid: null, value: null })}
        disabled={isDisabled}
      />
    </Box>
  );
}
