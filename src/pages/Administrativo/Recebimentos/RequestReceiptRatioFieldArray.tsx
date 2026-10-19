// src/pages/Administrativo/Recebimentos/RequestReceiptRatioFieldArray.tsx
// -----------------------------------------------------------------------------
// Subregistro "Rateio" da tela Gerar Financeiro (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-03).
// Molde `Administrativo/Autorizacao/RequestAuthorizationRatioFieldArray.tsx`
// (cascata categoria→centro), ADAPTADO com 2 divergências conscientes
// (§5.4 do contrato de arquitetura):
//   - Cascata categoria→centro E categoria→conta contábil (IG-04): ao
//     escolher `category_uuid`, auto-popula `center_uuid`
//     (`listCostCentersByCategory`, primeiro item) E `plan_account_uuid`
//     (`getPlanAccountByCategory`, pode devolver `null` — sem vínculo).
//   - `value`(MoneyInput)/`percent`(PercentInput) com cálculo mútuo no blur
//     (IG-06/07) + redistribuição do resíduo de arredondamento quando a
//     soma já está a ≤0.01 de 100%/`vl_total` (IG-10, tolerância CALC-04) —
//     absorve o resíduo na linha que acabou de ser editada, nunca inventa
//     uma linha nova.
//
// Execução 081 (T-081-FE-10): centros de custo analíticos, habilitados e da
// FAZENDA DA SOLICITAÇÃO (`farm_uuid`); o total do rateio precisa fechar com o
// Valor Total (checado no submit da página, "O total do rateio difere do valor
// total."). Σ=100% continua aviso visual (Badge) — mirror
// EXATO da decisão já documentada no molde original ("Soma de % NÃO bloqueia
// o submit — só o JS legado avisava"), reuso confirmado pelo arquiteto.
// -----------------------------------------------------------------------------

import { Dispatch, SetStateAction } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Control, Controller, useFieldArray, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

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
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';
import type { GenerateFinancialForm } from '@/@types/v2/RequestReceipts';

const RATIO_SUM_TOLERANCE = 0.01;

export interface RequestReceiptRatioFieldArrayProps {
  control: Control<GenerateFinancialForm>;
  watch: UseFormWatch<GenerateFinancialForm>;
  setValue: UseFormSetValue<GenerateFinancialForm>;
  vlTotal: number;
  /** Fazenda da solicitação: os centros de custo aceitos são os (analíticos e
   *  habilitados) dela (T-081-API-05). Ausente = sem filtro de fazenda; a API
   *  valida de qualquer forma. */
  farmUuid?: string;
  isDisabled: boolean;
  pickedCategoryOptions: Record<string, Option>;
  setPickedCategoryOptions: Dispatch<SetStateAction<Record<string, Option>>>;
  pickedCenterOptions: Record<string, Option>;
  setPickedCenterOptions: Dispatch<SetStateAction<Record<string, Option>>>;
  pickedPlanAccountOptions: Record<string, Option>;
  setPickedPlanAccountOptions: Dispatch<SetStateAction<Record<string, Option>>>;
}

export function RequestReceiptRatioFieldArray({
  control,
  watch,
  setValue,
  vlTotal,
  farmUuid,
  isDisabled,
  pickedCategoryOptions,
  setPickedCategoryOptions,
  pickedCenterOptions,
  setPickedCenterOptions,
  pickedPlanAccountOptions,
  setPickedPlanAccountOptions,
}: RequestReceiptRatioFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestReceipts.requestReceipt.financial.ratio;

  const { fields, append, remove } = useFieldArray({ control, name: 'ratio' });

  const watchedRows = watch('ratio') ?? [];
  const totalPercent = watchedRows.reduce((sum, row) => sum + (Number(row?.percent) || 0), 0);
  const isSumComplete = Math.abs(totalPercent - 100) <= RATIO_SUM_TOLERANCE;

  function closingGapPercent(index: number, percent: number): number {
    const others = watchedRows.reduce(
      (sum, row, i) => (i === index ? sum : sum + (Number(row?.percent) || 0)),
      0
    );
    const total = others + percent;
    if (total !== 100 && Math.abs(total - 100) <= RATIO_SUM_TOLERANCE) {
      return Math.round((100 - others) * 100) / 100;
    }
    return percent;
  }

  function handlePercentBlur(index: number, percent: number | null) {
    if (percent === null || !vlTotal) return;
    const closedPercent = closingGapPercent(index, percent);
    const value = Math.round((closedPercent / 100) * vlTotal * 100) / 100;
    setValue(`ratio.${index}.percent`, closedPercent, { shouldDirty: true });
    setValue(`ratio.${index}.value`, value, { shouldDirty: true });
  }

  function handleValueBlur(index: number, value: number | null) {
    if (value === null || !vlTotal) return;
    const percent = Math.round((value / vlTotal) * 100 * 100) / 100;
    const closedPercent = closingGapPercent(index, percent);
    const closedValue =
      closedPercent === percent ? value : Math.round((closedPercent / 100) * vlTotal * 100) / 100;
    setValue(`ratio.${index}.percent`, closedPercent, { shouldDirty: true });
    setValue(`ratio.${index}.value`, closedValue, { shouldDirty: true });
  }

  // Cascata categoria→centro E categoria→conta contábil (IG-04).
  async function handleCategoryChange(index: number, option: Option<string> | null) {
    setValue(`ratio.${index}.category_uuid`, option, { shouldDirty: true });

    if (!option) {
      setValue(`ratio.${index}.center_uuid`, null, { shouldDirty: true });
      setValue(`ratio.${index}.plan_account_uuid`, null, { shouldDirty: true });
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
        setValue(`ratio.${index}.center_uuid`, centerOption, { shouldDirty: true });
        setPickedCenterOptions((prev) => ({ ...prev, [centerOption.value]: centerOption }));
      } else {
        setValue(`ratio.${index}.center_uuid`, null, { shouldDirty: true });
      }
    } catch {
      setValue(`ratio.${index}.center_uuid`, null, { shouldDirty: true });
    }

    try {
      const planAccountResponse = await getPlanAccountByCategory(option.value);
      const planAccount = planAccountResponse.data as PlanAccountRef | null;
      if (planAccount) {
        const planAccountOption: Option<string> = {
          label: `${planAccount.code} — ${planAccount.description}`,
          value: planAccount.uuid,
        };
        setValue(`ratio.${index}.plan_account_uuid`, planAccountOption, { shouldDirty: true });
        setPickedPlanAccountOptions((prev) => ({
          ...prev,
          [planAccountOption.value]: planAccountOption,
        }));
      } else {
        setValue(`ratio.${index}.plan_account_uuid`, null, { shouldDirty: true });
      }
    } catch {
      setValue(`ratio.${index}.plan_account_uuid`, null, { shouldDirty: true });
    }
  }

  return (
    <Box>
      <Text fontWeight="bold" color="brandColorText" mb={4}>
        {text.title}
      </Text>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.sumLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {totalPercent.toFixed(2)}%
          </Badge>
        )}
      </Flex>

      {fields.length > 0 && !isSumComplete && (
        <Text fontSize="xs" color="orange.500" mb={4}>
          {text.sumWarning}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`ratio.${index}.category_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.categoryLabel}
                      service={listFinancialCategoryOptions}
                      mapOptions={(item: FinancialCategoryOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        class: 2,
                      })}
                      value={
                        rowField.value?.value
                          ? pickedCategoryOptions[rowField.value.value]
                          : undefined
                      }
                      onChange={(option: any) => handleCategoryChange(index, option ?? null)}
                      isDisabled={isDisabled}
                      disablePortal
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`ratio.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      key={farmUuid ?? 'no-farm'}
                      name={rowField.name}
                      label={text.centerLabel}
                      service={listCostCenterOptions}
                      mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                        is_enabled: 'true' as const,
                        farm_uuid: farmUuid,
                      })}
                      value={
                        rowField.value?.value
                          ? pickedCenterOptions[rowField.value.value]
                          : undefined
                      }
                      onChange={(option: any) => {
                        rowField.onChange(option ?? null);
                        if (option)
                          setPickedCenterOptions((prev) => ({ ...prev, [option.value]: option }));
                      }}
                      isDisabled={isDisabled}
                      disablePortal
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`ratio.${index}.plan_account_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.planAccountLabel}
                      service={listPlanAccountOptions}
                      mapOptions={(item: PlanAccountRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={
                        rowField.value?.value
                          ? pickedPlanAccountOptions[rowField.value.value]
                          : undefined
                      }
                      onChange={(option: any) => {
                        rowField.onChange(option ?? null);
                        if (option)
                          setPickedPlanAccountOptions((prev) => ({
                            ...prev,
                            [option.value]: option,
                          }));
                      }}
                      isDisabled={isDisabled}
                      disablePortal
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '150px' }}>
                <Controller
                  name={`ratio.${index}.percent`}
                  control={control}
                  render={({ field: rowField }) => (
                    <PercentInput
                      name={rowField.name}
                      label={text.percentLabel}
                      maxValue={100}
                      value={rowField.value ?? null}
                      onValueChange={rowField.onChange}
                      onBlur={() => handlePercentBlur(index, rowField.value ?? null)}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '160px' }}>
                <Controller
                  name={`ratio.${index}.value`}
                  control={control}
                  render={({ field: rowField }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.valueLabel}
                      value={rowField.value ?? null}
                      onValueChange={rowField.onChange}
                      onBlur={() => handleValueBlur(index, rowField.value ?? null)}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Flex direction="column" gap="1.5">
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {text.removeRowButton}
                </Flex>
                <IconButtonTable
                  aria-label={text.removeRowButton}
                  mensegerTooltip={text.removeRowButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={() => remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.addRowButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            category_uuid: null,
            center_uuid: null,
            plan_account_uuid: null,
            value: null,
            percent: null,
          })
        }
        disabled={isDisabled}
      />
    </Box>
  );
}
