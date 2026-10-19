// src/pages/Public/RequestQuotation/RequestQuotationPublicPaymentRow.tsx
// -----------------------------------------------------------------------------
// Seção "Condições de Pagamento" do formulário público do fornecedor (hash,
// RequestQuotation — esteira 97-Esteiras/035, TASK-CQ-FE-10). Mirror
// ESTRUTURAL de `RequestAttachmentRow.tsx` (Administrativo/Solicitacao) —
// `useFieldArray` + botão adicionar + estado vazio + guarda "não remover a
// última linha" (CL-035, mirror `btn-add`/`btn-remove` global do legado).
//
// Campos por linha (Form Request real, `RequestQuotationPublicSubmissionRequest
// ::rules()`): payment_method (enum) · installments (integer >=1) · interval
// (integer >=0, dias) · total · amount.
//
// Igual ao legado (T-081-FE-03, Q30/Q32/Q35/Q36): "Valor Total" é SOMENTE
// LEITURA e igual ao total geral da cotação (`tt_value`); "Valor/Parcela" =
// total / parcelas (2 casas), derivado na renderização; "Adicionar" exige a
// condição anterior completa; remover pede confirmação e nunca remove a última.
// O servidor recalcula os dois valores (T-081-API-08).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { requestQuotationPaymentMethodOptions } from '@/constants/RequestQuotations/options/request-quotation-payment-method-options';

import type { PublicRequestQuotationForm } from '@/@types/v2/RequestQuotations';

import { canAddPaymentRow, installmentAmount } from './publicQuotationTotals';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface RequestQuotationPublicPaymentRowProps {
  control: Control<PublicRequestQuotationForm>;
  errors: FieldErrors<PublicRequestQuotationForm>;
  watch: UseFormWatch<PublicRequestQuotationForm>;
  /** Total geral da cotação (soma das linhas), mostrado como "Valor Total" de cada condição. */
  grandTotal: number;
  disabled: boolean;
}

function emptyPaymentRow() {
  return {
    payment_method: null,
    installments: null,
    interval: null,
    total: null,
    amount: null,
  };
}

export function RequestQuotationPublicPaymentRow({
  control,
  errors,
  watch,
  grandTotal,
  disabled,
}: RequestQuotationPublicPaymentRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;
  const paymentsText = text.paymentsSection;

  const { fields, append, remove } = useFieldArray({ control, name: 'payments' });

  const paymentMethodOptions = requestQuotationPaymentMethodOptions.options(languageGB);

  const [indexToRemove, setIndexToRemove] = useState<number | null>(null);

  function handleAdd() {
    if (!canAddPaymentRow(watch('payments') ?? [])) {
      toaster.warning({ title: paymentsText.title, description: paymentsText.incompleteRow });
      return;
    }
    append(emptyPaymentRow());
  }

  function handleRemove(index: number) {
    // Guarda "não remover a última linha" (mirror `btn-remove` do legado); as
    // demais pedem confirmação ("Você está certo?").
    if (fields.length <= 1) {
      toaster.error({ title: paymentsText.title, description: paymentsText.cannotRemoveLastRow });
      return;
    }
    setIndexToRemove(index);
  }

  function handleConfirmRemove() {
    if (indexToRemove !== null) remove(indexToRemove);
    setIndexToRemove(null);
  }

  const paymentsArrayError = errors.payments?.message as string | undefined;

  return (
    <Box pt={2}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {paymentsText.title}
        </Text>
        <Button
          title={paymentsText.addButton}
          icon={FiPlus as ElementType}
          variant="outline"
          size="sm"
          type="button"
          onClick={handleAdd}
          disabled={disabled}
        />
      </Flex>

      {paymentsArrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {paymentsArrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {paymentsText.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4}>
          {fields.map((field, index) => {
            const rowErrors = errors.payments?.[index];
            // Leitura reativa das parcelas da MESMA linha: "Valor/Parcela" é
            // derivado do total geral e das parcelas mais recentes.
            const currentInstallments = watch(`payments.${index}.installments`);

            return (
              <Flex
                key={field.id}
                gap={3}
                align="flex-end"
                wrap="wrap"
                pb={4}
                borderBottom="1px solid"
                borderColor="border.subtle"
                _last={{ border: 'none', pb: 0 }}
              >
                <Box flex="2" minW="200px">
                  <Controller
                    name={`payments.${index}.payment_method`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Select
                        name={rowField.name}
                        label={paymentsText.fields.paymentMethod}
                        placeholder={paymentsText.placeholders.paymentMethod}
                        options={paymentMethodOptions}
                        value={rowField.value ?? undefined}
                        onChange={(option) => rowField.onChange(option ?? null)}
                        error={rowErrors?.payment_method?.message as string | undefined}
                        isRequired
                        isDisabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '130px' }}>
                  <Controller
                    name={`payments.${index}.installments`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={paymentsText.fields.installments}
                        value={rowField.value}
                        onValueChange={(value) => rowField.onChange(value)}
                        min={1}
                        decimalPlaces={0}
                        error={rowErrors?.installments?.message as string | undefined}
                        isRequired
                        disabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '130px' }}>
                  <Controller
                    name={`payments.${index}.interval`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={paymentsText.fields.interval}
                        value={rowField.value}
                        onValueChange={(value) => rowField.onChange(value)}
                        min={0}
                        decimalPlaces={0}
                        error={rowErrors?.interval?.message as string | undefined}
                        isRequired
                        disabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '160px' }}>
                  <MoneyInput
                    name={`payments.${index}.total`}
                    label={paymentsText.fields.total}
                    value={grandTotal}
                    readOnly
                    disabled
                  />
                </Box>

                <Box w={{ base: 'full', sm: '160px' }}>
                  <MoneyInput
                    name={`payments.${index}.amount`}
                    label={paymentsText.fields.amount}
                    value={installmentAmount(grandTotal, currentInstallments)}
                    readOnly
                    disabled
                  />
                </Box>

                <IconButtonTable
                  aria-label={paymentsText.removeButton}
                  mensegerTooltip={paymentsText.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      <DeleteConfirmDialog
        isOpen={indexToRemove !== null}
        onClose={() => setIndexToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={paymentsText.removeConfirm.title}
        description={paymentsText.removeConfirm.text}
        hideQuestionMark
        warningText=""
        tone="warning"
      />
    </Box>
  );
}
