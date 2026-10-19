// src/pages/Operacional/Budget/BudgetPaymentRow.tsx
// -----------------------------------------------------------------------------
// Linha do editor de PAGAMENTOS de Orçamento (Budget — Operacional / Vendas,
// F-018, 97-Esteiras/054, TASK-BG-FE-04). Consumida por
// `BudgetPaymentsEditor.tsx` (`fields.map`).
//
// Campos-base (`FLD-20..26`, mirror ESTRUTURAL `RequestQuotationPublicPaymentRow`):
//   payment_method · installments · interval (dias, sincronizado
//   bidirecionalmente com `due_date` a partir de `budgetDate`, IG-08/09) ·
//   due_date · total (EDITÁVEL — servidor valida a soma, GAP-BG-04, mas o
//   campo não é readonly, fiel ao legado).
//
// Bloco financeiro condicional (`installments > 1`, `FLD-27..34`, sem
// precedente 1:1 — composição NOVA sobre primitivos JÁ usados no resto da
// feature): has_input/input_date/input_value (IG-07) · qtd_installments
// (sincronizado com `installments`, CB-41) · first_installment ·
// int_installments (sincronizado com `interval`, CB-41) · fiscal_document ·
// tabela de parcelas GERADA (`useFieldArray` ANINHADO em
// `payments.${index}.installment_details.installments`, DECLARADO AQUI —
// regra de hooks, mesma disciplina de `RequisitionItemRow`/`BudgetItemRow`).
//
// A tabela é regenerada (`calcInstallments`, `@/utils/budgetInstallments`)
// toda vez que qtd_installments/first_installment/int_installments/total/
// input_value mudam; a edição manual de UMA parcela usa
// `adjustInstallmentsDifference` (IG-10) — reconcilia a soma ajustando a
// última parcela, recusando (toast + mantém valor anterior) se ela
// zerar/negativar.
//
// Todos os botões usam `type="button"` EXPLÍCITO (dentro do `<form>` do
// avô, mirror `BudgetItemRow`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  FieldErrors,
  UseFieldArrayRemove,
  useController,
  useFieldArray,
} from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DateInput } from '@/components/DateInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import {
  adjustInstallmentsDifference,
  calcInstallments,
  type BudgetInstallmentRow,
} from '@/utils/budgetInstallments';

import { budgetPaymentMethodOptions } from '@/constants/Budgets/options';
import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { BudgetForm, BudgetPaymentInstallmentDetailForm } from '@/@types/v2/Budgets';

import type { BudgetPaymentsFieldValues } from './BudgetPaymentsEditor';

export interface BudgetPaymentRowProps {
  control: Control<BudgetPaymentsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  /** `date` do orçamento (form PAI) — base do sincronismo `interval`<->
   *  `due_date` (IG-08/09). */
  budgetDate: string | null;
  errors: FieldErrors<BudgetForm>;
  languageGB: LanguageDate;
  disabled: boolean;
}

function addDaysIso(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDaysIso(baseIso: string, targetIso: string): number {
  const base = new Date(`${baseIso}T00:00:00`).getTime();
  const target = new Date(`${targetIso}T00:00:00`).getTime();
  return Math.round((target - base) / 86_400_000);
}

function defaultInstallmentDetails(
  seed: Partial<BudgetPaymentInstallmentDetailForm>
): BudgetPaymentInstallmentDetailForm {
  return {
    has_input: false,
    input_date: null,
    input_value: null,
    qtd_installments: null,
    first_installment: null,
    int_installments: 0,
    fiscal_document: true,
    installments: [],
    ...seed,
  };
}

export function BudgetPaymentRow({
  control,
  index,
  remove,
  budgetDate,
  errors,
  languageGB,
  disabled,
}: BudgetPaymentRowProps) {
  const text = languageGB.budgets.budget;
  const paymentText = text.form.fields.payment;
  const financialText = paymentText.installmentDetails;

  const { field: paymentMethodField, fieldState: paymentMethodFieldState } = useController({
    control,
    name: `payments.${index}.payment_method`,
  });
  const { field: installmentsField, fieldState: installmentsFieldState } = useController({
    control,
    name: `payments.${index}.installments`,
  });
  const { field: intervalField, fieldState: intervalFieldState } = useController({
    control,
    name: `payments.${index}.interval`,
  });
  const { field: dueDateField, fieldState: dueDateFieldState } = useController({
    control,
    name: `payments.${index}.due_date`,
  });
  const { field: totalField, fieldState: totalFieldState } = useController({
    control,
    name: `payments.${index}.total`,
  });
  const { field: installmentDetailsField } = useController({
    control,
    name: `payments.${index}.installment_details`,
  });

  // `useFieldArray` ANINHADO — vive AQUI (componente da LINHA), nunca no
  // editor pai (regra de hooks + Roteiro `TASK-BG-FE-04`). O cast do `name`
  // é pragmático (mesmo racional de `as unknown as`/`as any` já usado em
  // `BudgetItemsEditor`/`CreateOrUpdateBudget`) — o caminho é 100% real
  // (`payments.${index}.installment_details.installments`), só o TS não
  // resolve o tipo do array aninhado atrás de um campo nullable sem ajuda.
  const {
    fields: installmentFields,
    replace: replaceInstallments,
    update: updateInstallment,
  } = useFieldArray({
    control: control as any,
    name: `payments.${index}.installment_details.installments` as any,
  });

  const paymentRowErrors = (errors as any)?.payments?.[index];
  const financialErrors = paymentRowErrors?.installment_details as
    Record<string, { message?: string } | undefined> | undefined;

  const installmentsValue = Number(installmentsField.value) || 0;
  const showFinancialBlock = installmentsValue > 1;

  const details = installmentDetailsField.value as BudgetPaymentInstallmentDetailForm | null;
  const totalValue = Number(totalField.value) || 0;

  // FLD-27..34 — seeda o bloco financeiro na 1ª vez que fica visível
  // (`installments` passa de <=1 para >1) — nunca reseta um bloco já
  // preenchido (Estados de UI do Roteiro: "só ESCONDE, não limpa").
  useEffect(() => {
    if (!showFinancialBlock || details) return;
    installmentDetailsField.onChange(
      defaultInstallmentDetails({
        qtd_installments: installmentsValue,
        first_installment: dueDateField.value || budgetDate || null,
        int_installments: Number(intervalField.value) || 0,
      })
    );
  }, [showFinancialBlock, details]);

  // CV-06/SH-07 — regenera a tabela de parcelas toda vez que a "receita"
  // (qtd_installments/first_installment/int_installments/total/input_value/
  // has_input) muda (Roteiro, `## src/utils/budgetInstallments.ts`).
  useEffect(() => {
    if (!showFinancialBlock || !details) return;
    const rows = calcInstallments({
      total: totalValue,
      inputValue: details.has_input ? details.input_value : null,
      qtdInstallments: Number(details.qtd_installments) || 0,
      firstInstallment: details.first_installment,
      intervalDays: Number(details.int_installments) || 0,
    });
    replaceInstallments(rows as any);
  }, [
    showFinancialBlock,
    totalValue,
    details?.has_input,
    details?.input_value,
    details?.qtd_installments,
    details?.first_installment,
    details?.int_installments,
  ]);

  // IG-08/09 — interval -> due_date (a partir da data do orçamento).
  function handleIntervalChange(value: number | null) {
    intervalField.onChange(value);
    const numericInterval = Number(value) || 0;
    if (budgetDate) {
      dueDateField.onChange(addDaysIso(budgetDate, numericInterval));
    }
    // CB-41 — mantém `int_installments` do bloco financeiro alinhado.
    if (details) {
      installmentDetailsField.onChange({ ...details, int_installments: numericInterval });
    }
  }

  // IG-08/09 — due_date -> interval (a partir da data do orçamento).
  function handleDueDateChange(value: string | null) {
    dueDateField.onChange(value ?? '');
    if (budgetDate && value) {
      const days = diffDaysIso(budgetDate, value);
      if (days >= 0) {
        intervalField.onChange(days);
        if (details) {
          installmentDetailsField.onChange({ ...details, int_installments: days });
        }
      }
    }
  }

  // CB-41 — installments (topo) -> qtd_installments (bloco financeiro).
  function handleInstallmentsChange(value: number | null) {
    installmentsField.onChange(value);
    const numeric = Number(value) || 0;
    if (details) {
      installmentDetailsField.onChange({ ...details, qtd_installments: numeric });
    }
  }

  // CB-41 — qtd_installments (bloco financeiro) -> installments (topo).
  function handleQtdInstallmentsChange(value: number | null) {
    installmentDetailsField.onChange({
      ...(details ?? defaultInstallmentDetails({})),
      qtd_installments: value,
    });
    installmentsField.onChange(value ?? 0);
  }

  // CB-41 — int_installments (bloco financeiro) -> interval (topo) -> due_date.
  function handleIntInstallmentsChange(value: number | null) {
    const numericValue = Number(value) || 0;
    installmentDetailsField.onChange({
      ...(details ?? defaultInstallmentDetails({})),
      int_installments: value,
    });
    intervalField.onChange(numericValue);
    if (budgetDate) {
      dueDateField.onChange(addDaysIso(budgetDate, numericValue));
    }
  }

  // IG-07 — has_input alterna a obrigatoriedade de input_date/input_value
  // (Yup `.when()`, `budget-schema.ts`) — limpa os 2 campos quando desligado
  // (mirror "limpa e desobriga se valor!=1").
  function handleHasInputChange(value: boolean) {
    const current = details ?? defaultInstallmentDetails({});
    installmentDetailsField.onChange({
      ...current,
      has_input: value,
      input_date: value ? current.input_date : null,
      input_value: value ? current.input_value : null,
    });
  }

  function patchInstallmentDetails(patch: Partial<BudgetPaymentInstallmentDetailForm>) {
    installmentDetailsField.onChange({ ...(details ?? defaultInstallmentDetails({})), ...patch });
  }

  // IG-10 — `value_installments` editado manualmente: reconcilia a soma
  // ajustando a última parcela; recusa (toast + mantém valor anterior) se
  // ela zerar/negativar.
  function handleInstallmentValueChange(rowIndex: number, newValue: number | null) {
    const currentRows: BudgetInstallmentRow[] = (details?.installments ?? []).map((row) => ({
      date: row.date,
      value: row.value,
    }));
    const targetTotal = details?.has_input
      ? totalValue - (Number(details.input_value) || 0)
      : totalValue;

    const result = adjustInstallmentsDifference(
      currentRows,
      rowIndex,
      Number(newValue) || 0,
      targetTotal
    );

    if (result === currentRows) {
      toaster.error({
        title: financialText.sectionTitle,
        description: financialText.adjustRefusedToast,
      });
      return;
    }

    replaceInstallments(result as any);
  }

  function handleInstallmentDateChange(rowIndex: number, value: string | null) {
    const current = installmentFields[rowIndex] as unknown as BudgetInstallmentRow;
    updateInstallment(rowIndex, { ...current, date: value ?? '' } as any);
  }

  const paymentMethodOptions = budgetPaymentMethodOptions.options(languageGB);
  const yesNoOptions = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];
  const fiscalDocumentOptions = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  return (
    <Box
      p={4}
      bg="bg.panel"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.subtle"
      position="relative"
    >
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="2" minW="220px">
          <Select
            name={paymentMethodField.name}
            label={paymentText.paymentMethod}
            options={paymentMethodOptions}
            value={paymentMethodField.value ?? null}
            onChange={(option) => paymentMethodField.onChange(option ?? null)}
            error={paymentMethodFieldState.error?.message}
            isRequired
            isDisabled={disabled}
          />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={installmentsField.name}
            label={paymentText.installments}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={installmentsValue}
            onValueChange={handleInstallmentsChange}
            error={installmentsFieldState.error?.message}
            isRequired
            disabled={disabled}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <NumberInput
            name={intervalField.name}
            label={paymentText.interval}
            allowDot={false}
            decimalPlaces={0}
            min={0}
            value={Number(intervalField.value) || 0}
            onValueChange={handleIntervalChange}
            error={intervalFieldState.error?.message}
            isRequired
            disabled={disabled}
          />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            {paymentText.dueDate}
          </Text>
          <DateInput
            value={dueDateField.value ?? null}
            onChange={handleDueDateChange}
            disabled={disabled}
          />
          {dueDateFieldState.error?.message && (
            <Text fontSize="xs" color="fg.error" mt={1}>
              {dueDateFieldState.error.message}
            </Text>
          )}
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <MoneyInput
            name={totalField.name}
            label={paymentText.total}
            value={totalValue}
            onValueChange={(value) => totalField.onChange(value)}
            error={totalFieldState.error?.message}
            isRequired
            disabled={disabled}
          />
        </Box>

        <Flex direction="column" gap="1.5">
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {paymentText.removePayment}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={paymentText.removePayment}
            mensegerTooltip={paymentText.removePayment}
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

      {paymentRowErrors?.installment_details?.message && (
        <Text fontSize="xs" color="fg.error" mt={2}>
          {paymentRowErrors.installment_details.message as string}
        </Text>
      )}

      {/* Bloco financeiro condicional (`installments > 1`, FLD-27..34) — sem
          precedente 1:1, composição NOVA sobre primitivos já usados no resto
          da feature (Roteiro `TASK-BG-FE-04`). */}
      {showFinancialBlock && details && (
        <Box mt={4} pt={4} borderTop="1px dashed" borderColor="border.subtle">
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {financialText.sectionTitle}
          </Text>

          <SimpleGrid columns={columnsForm.threeColumns} gap={4} mb={4}>
            <Select
              name={`payments.${index}.installment_details.has_input`}
              label={financialText.hasInput}
              options={yesNoOptions}
              value={yesNoOptions.find((option) => option.value === details.has_input) ?? null}
              onChange={(option) => handleHasInputChange(!!option?.value)}
              isDisabled={disabled}
            />

            {details.has_input && (
              <>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    {financialText.inputDate}
                  </Text>
                  <DateInput
                    value={details.input_date ?? null}
                    onChange={(value) => patchInstallmentDetails({ input_date: value })}
                    disabled={disabled}
                  />
                  {financialErrors?.input_date?.message && (
                    <Text fontSize="xs" color="fg.error" mt={1}>
                      {financialErrors.input_date.message}
                    </Text>
                  )}
                </Box>

                <MoneyInput
                  name={`payments.${index}.installment_details.input_value`}
                  label={financialText.inputValue}
                  value={details.input_value ?? null}
                  onValueChange={(value) => patchInstallmentDetails({ input_value: value })}
                  error={financialErrors?.input_value?.message}
                  disabled={disabled}
                />
              </>
            )}

            <NumberInput
              name={`payments.${index}.installment_details.qtd_installments`}
              label={financialText.qtdInstallments}
              allowDot={false}
              decimalPlaces={0}
              min={1}
              value={details.qtd_installments}
              onValueChange={handleQtdInstallmentsChange}
              error={financialErrors?.qtd_installments?.message}
              disabled={disabled}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {financialText.firstInstallment}
              </Text>
              <DateInput
                value={details.first_installment ?? null}
                onChange={(value) => patchInstallmentDetails({ first_installment: value })}
                disabled={disabled}
              />
              {financialErrors?.first_installment?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {financialErrors.first_installment.message}
                </Text>
              )}
            </Box>

            <NumberInput
              name={`payments.${index}.installment_details.int_installments`}
              label={financialText.intInstallments}
              allowDot={false}
              decimalPlaces={0}
              min={0}
              value={details.int_installments}
              onValueChange={handleIntInstallmentsChange}
              disabled={disabled}
            />

            <Select
              name={`payments.${index}.installment_details.fiscal_document`}
              label={financialText.fiscalDocument}
              options={fiscalDocumentOptions}
              value={
                fiscalDocumentOptions.find((option) => option.value === details.fiscal_document) ??
                null
              }
              onChange={(option) => patchInstallmentDetails({ fiscal_document: !!option?.value })}
              isDisabled={disabled}
            />
          </SimpleGrid>

          {installmentFields.length > 0 && (
            <Flex direction="column" gap={2}>
              <Flex gap={3} fontSize="xs" color="fg.muted" fontWeight="medium">
                <Box flex="1" minW="140px">
                  {financialText.installmentsTable.date}
                </Box>
                <Box flex="1" minW="140px">
                  {financialText.installmentsTable.value}
                </Box>
              </Flex>
              {installmentFields.map((rowField, rowIndex) => {
                const row = rowField as unknown as BudgetInstallmentRow & { id: string };
                return (
                  <Flex key={row.id} gap={3} align="flex-start" wrap="wrap">
                    <Box flex="1" minW="140px">
                      <DateInput
                        value={row.date ?? null}
                        onChange={(value) => handleInstallmentDateChange(rowIndex, value)}
                        disabled={disabled}
                      />
                    </Box>
                    <Box flex="1" minW="140px">
                      <MoneyInput
                        name={`payments.${index}.installment_details.installments.${rowIndex}.value`}
                        value={row.value ?? null}
                        onValueChange={(value) => handleInstallmentValueChange(rowIndex, value)}
                        disabled={disabled}
                      />
                    </Box>
                  </Flex>
                );
              })}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}

export default BudgetPaymentRow;
