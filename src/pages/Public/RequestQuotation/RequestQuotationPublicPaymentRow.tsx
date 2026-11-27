// src/pages/Public/RequestQuotation/RequestQuotationPublicPaymentRow.tsx
// -----------------------------------------------------------------------------
// Conteúdo da seção "Condições de Pagamento" do formulário público do
// fornecedor (hash, RequestQuotation — esteira 97-Esteiras/035, TASK-CQ-FE-10).
// O título e a dica da seção ficam no `FormSection` de quem usa (o formulário).
// `useFieldArray` + adicionar + guarda "não remover a última linha" (CL-035,
// mirror `btn-add`/`btn-remove` global do legado).
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
//
// REPAGINAÇÃO (só apresentação; 27/11/2026): TABELA com edição na própria linha
// (kit `SimpleTable`), uma condição por linha — forma de pagamento, parcelas e
// intervalo editáveis; valor total e da parcela calculados; remover no fim da
// linha; "Adicionar condição" embaixo. Enter desce para o mesmo campo da linha de
// baixo (`tableKeyboard`). A rolagem lateral é a do próprio `SimpleTable`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { Icon } from '@/components/ui/Icon';
import { SimpleTable, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { requestQuotationPaymentMethodOptions } from '@/constants/RequestQuotations/options/request-quotation-payment-method-options';

import type { PublicRequestQuotationForm } from '@/@types/v2/RequestQuotations';

import { formatCurrency } from './publicQuotationProgress';
import { canAddPaymentRow, installmentAmount } from './publicQuotationTotals';
import { handleEnterMovesDown } from './tableKeyboard';

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

/** Valor da parcela da linha, reativo às parcelas digitadas. */
function InstallmentCell({
  control,
  index,
  grandTotal,
}: {
  control: Control<PublicRequestQuotationForm>;
  index: number;
  grandTotal: number;
}) {
  const installments = useWatch({ control, name: `payments.${index}.installments` });
  return (
    <Text as="span" fontSize="inherit" fontWeight="semibold" color="cardTextPrimary">
      {formatCurrency(installmentAmount(grandTotal, installments))}
    </Text>
  );
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

  const rows: SimpleTableRow[] = fields.map((field, index) => {
    const rowErrors = errors.payments?.[index];
    return {
      key: field.id,
      cells: {
        index: (
          <Text as="span" fontSize="inherit" color="cardTextSecondary" fontWeight="semibold">
            {index + 1}
          </Text>
        ),
        method: (
          <Box minW="200px">
            <Controller
              name={`payments.${index}.payment_method`}
              control={control}
              render={({ field: rowField }) => (
                <Select
                  name={rowField.name}
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
        ),
        installments: (
          <Box minW="100px">
            <Controller
              name={`payments.${index}.installments`}
              control={control}
              render={({ field: rowField }) => (
                <NumberInput
                  name={rowField.name}
                  aria-label={`${paymentsText.fields.installments} ${index + 1}`}
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
        ),
        interval: (
          <Box minW="100px">
            <Controller
              name={`payments.${index}.interval`}
              control={control}
              render={({ field: rowField }) => (
                <NumberInput
                  name={rowField.name}
                  aria-label={`${paymentsText.fields.interval} ${index + 1}`}
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
        ),
        total: (
          <Text as="span" fontSize="inherit" fontWeight="semibold" color="cardTextPrimary">
            {formatCurrency(grandTotal)}
          </Text>
        ),
        amount: <InstallmentCell control={control} index={index} grandTotal={grandTotal} />,
        remove: (
          <Box
            as="button"
            {...({ type: 'button', disabled } as Record<string, string | boolean>)}
            aria-label={`${paymentsText.removeButton} ${index + 1}`}
            title={paymentsText.removeButton}
            onClick={() => handleRemove(index)}
            color="feedBack.errorMain"
            p={2}
            borderRadius="md"
            _hover={{ bg: 'selectedBG' }}
          >
            <Icon name="delete" size="sm" />
          </Box>
        ),
      },
    };
  });

  return (
    <Box>
      {paymentsArrayError && (
        <Text role="alert" fontSize="xs" color="feedBack.errorMain" mb={3}>
          {paymentsArrayError}
        </Text>
      )}

      <Box onKeyDown={handleEnterMovesDown}>
        <SimpleTable
          ariaLabel={paymentsText.title}
          columns={[
            { key: 'index', header: '#' },
            { key: 'method', header: paymentsText.fields.paymentMethod },
            { key: 'installments', header: paymentsText.fields.installments },
            { key: 'interval', header: paymentsText.fields.interval },
            { key: 'total', header: paymentsText.fields.total, align: 'right' },
            { key: 'amount', header: paymentsText.fields.amount, align: 'right' },
            { key: 'remove', header: '', align: 'right' },
          ]}
          rows={rows}
        />
      </Box>

      <Flex mt={3}>
        <Button
          title={paymentsText.addButton}
          variant="outline"
          size="sm"
          type="button"
          onClick={handleAdd}
          disabled={disabled}
        />
      </Flex>

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
