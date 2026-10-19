// src/pages/Invoices/InvoiceApportionmentTab.tsx
// -----------------------------------------------------------------------------
// Aba "Rateio" do formulário de Invoice — TASK-FE-2766. `useFieldArray` +
// `SelectAsyncPaginate` (Categoria Financeira) + `SelectAsyncPaginate`
// (Centro de Custo, REAL e OBRIGATÓRIO no contrato — `categories.*.
// center_uuid`, achado real diferente do packet original, que o modelava
// como opcional) + `NumberInput` (percentual) + Valor calc readonly (=
// `percentage% × vl_total`, MESMO `vl_total` de `InvoiceItemsTab.tsx`/
// `InvoiceInstallmentsTab.tsx` — 3ª fórmula consumindo a mesma fonte, nunca
// recalculada) + Badge de soma — mirror EXATO de
// `EquipamentoRateioCentroCustoTab.tsx`.
//
// "Conta Contábil" (`plan_account_uuid`) — OMITIDA da UI nesta v1 (decisão
// default do Arquiteto, confirmada pelo contrato real: sem `Rule::exists`,
// sem relação Model `FinancialCategory`→`PlanAccount`, não derivável).
//
// Seção "Baixa" (`automatic_writeoff`/`account_uuid`/`movement_date`) —
// OMITIDA por completo nesta v1 (default recomendado pelo Arquiteto: menos
// código morto que renderizar 3 controles desabilitados) — confirmado pelo
// contrato real: aceitos pelo `InvoiceRequest` mas SEM efeito nenhum
// (`AutomaticWriteOffAction`/GAP-BE-524 não materializada nesta v1).
//
// WRITE-ONLY (achado real) — o rateio NUNCA volta do backend e é IGNORADO no
// PUT. Em EDIÇÃO esta aba fica desabilitada/informativa, mesmo racional de
// `InvoiceInstallmentsTab.tsx`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { Option } from '@/@types/option';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { InvoiceForm, InvoiceItemForm } from '@/@types/v2/Invoices';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface InvoiceApportionmentTabProps {
  control: Control<InvoiceForm>;
  errors: FieldErrors<InvoiceForm>;
  watch: UseFormWatch<InvoiceForm>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
}

const APPORTIONMENT_SUM_TOLERANCE = 0.01;
const APPORTIONMENT_SUM_TARGET = 100;

/**
 * Recalcula o Vl. Total do documento — mesma fórmula de
 * `InvoiceItemsTab.tsx`/`InvoiceInstallmentsTab.tsx`.
 * @param {UseFormWatch<InvoiceForm>} watch - `watch` do form raiz.
 * @return {number} Vl. Total calculado no client (preview).
 */
// TASK-FE-687/DF-29 — exportada (era local) para ser reaproveitada pelo
// `useEffect` de auto-preenchimento do Rateio em `CreateOrUpdateInvoice.tsx`
// (Tipo Rateio = Por Produto), sem duplicar a heurística de Vl. Total.
export function computeVlTotal(watch: UseFormWatch<InvoiceForm>): number {
  const items = (watch('items') ?? []) as InvoiceItemForm[];
  const vlItems = items.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0;
    const amount = Number(item?.amount) || 0;
    const discount = Number(item?.discount) || 0;
    return total + (quantity * amount - discount);
  }, 0);
  const vlFreight = Number(watch('vl_freight')) || 0;
  const vlIpi = Number(watch('vl_ipi')) || 0;
  const vlDiscount = Number(watch('vl_discount')) || 0;
  const vlSafe = Number(watch('vl_safe')) || 0;
  const vlExpense = Number(watch('vl_expense')) || 0;
  return vlItems + vlFreight + vlIpi - vlDiscount + vlSafe + vlExpense;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function InvoiceApportionmentTab({
  control,
  errors,
  watch,
  isLoading,
  canSave,
  isEditing,
}: InvoiceApportionmentTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.invoices.invoice.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });

  const isDisabled = !canSave || isLoading || isEditing;

  const vlTotal = computeVlTotal(watch);

  const [pickedCategoryOptions, setPickedCategoryOptions] = useState<
    Record<string, Option<string>>
  >({});
  const [pickedCostCenterOptions, setPickedCostCenterOptions] = useState<
    Record<string, Option<string>>
  >({});

  const watchedCategories = watch('categories') ?? [];
  const totalPercentage = watchedCategories.reduce(
    (sum, row) => sum + (Number(row?.percentage) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalPercentage - APPORTIONMENT_SUM_TARGET) <= APPORTIONMENT_SUM_TOLERANCE;

  const sumError = errors.categories?.message as string | undefined;

  if (isEditing) {
    return (
      <Box pt={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.hints.writeOnlyDisabledInEdit}
        </Text>
      </Box>
    );
  }

  return (
    <Box pt={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.apportionmentRow.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {totalPercentage.toFixed(2)}%
          </Badge>
        )}
      </Flex>

      {sumError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {sumError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.apportionmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const percentage = Number(watch(`categories.${index}.percentage`)) || 0;
            const apportionedValue = (percentage / 100) * vlTotal;

            return (
              // TASK-FE-650 (DF-22) — `align="flex-end"` (base da linha)
              // fazia a mensagem de erro do campo Percentual (única coluna
              // sem `align="flex-end"` estável, `Field`/`NumberInput` cresce
              // para baixo ao exibir erro) empurrar as demais colunas para
              // baixo, "torcendo" a linha. `align="flex-start"` ancora todas
              // as colunas pelo TOPO (mirror EXATO da correção já aplicada
              // em `CreateSaldoInicial.tsx`, mesmo bug de alinhamento) —
              // estável com ou sem erro em qualquer campo da linha.
              <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
                <Box flex="1" minW="220px">
                  <Controller
                    name={`categories.${index}.category_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={formText.fields.financialCategory}
                        placeholder={formText.placeholders.financialCategory}
                        service={listFinancialCategoryOptions}
                        mapOptions={(item: FinancialCategoryOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={
                          rowField.value
                            ? (pickedCategoryOptions[rowField.value.value] ?? rowField.value)
                            : undefined
                        }
                        onChange={(option: any) => {
                          rowField.onChange(option ?? null);
                          if (option) {
                            setPickedCategoryOptions((prev) => ({
                              ...prev,
                              [option.value]: option,
                            }));
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

                <Box flex="1" minW="220px">
                  <Controller
                    name={`categories.${index}.center_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={formText.fields.costCenter}
                        placeholder={formText.placeholders.costCenter}
                        service={listCostCenterOptions}
                        mapOptions={(item: {
                          uuid: string;
                          code: string;
                          description: string;
                        }) => ({
                          label: `${item.code} — ${item.description}`,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          only_analytic: true,
                        })}
                        value={
                          rowField.value
                            ? (pickedCostCenterOptions[rowField.value.value] ?? rowField.value)
                            : undefined
                        }
                        onChange={(option: any) => {
                          rowField.onChange(option ?? null);
                          if (option) {
                            setPickedCostCenterOptions((prev) => ({
                              ...prev,
                              [option.value]: option,
                            }));
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
                    name={`categories.${index}.percentage`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <NumberInput
                        name={rowField.name}
                        label={formText.fields.percentage}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
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

                <Box w={{ base: 'full', sm: '180px' }}>
                  <InputReadOnly
                    label={formText.fields.apportionedValue}
                    value={formatCurrencyBRL(apportionedValue)}
                  />
                </Box>

                <Flex direction="column" gap="1.5">
                  {/* Spacer invisível — mesma marcação do label real do
                      `Field` (mirror `CreateSaldoInicial.tsx`), só para
                      reservar a mesma altura de linha de label das outras
                      colunas agora que `align="flex-start"` ancora pelo
                      TOPO. Não é lido por leitor de tela — o nome
                      acessível do botão vem do `aria-label` abaixo. */}
                  <Flex alignItems="center" fontSize="14px" visibility="hidden">
                    {formText.apportionmentRow.removeButton}
                  </Flex>
                  <IconButtonTable
                    aria-label={formText.apportionmentRow.removeButton}
                    mensegerTooltip={formText.apportionmentRow.removeButton}
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
            );
          })}
        </Flex>
      )}

      <Button
        title={formText.apportionmentRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={() => append({ category_uuid: null, percentage: null, center_uuid: null })}
        disabled={isDisabled}
      />
    </Box>
  );
}
