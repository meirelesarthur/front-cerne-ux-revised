// src/pages/Operacional/Pedidos/OrderPaymentsEditor.tsx
// -----------------------------------------------------------------------------
// Bloco de PAGAMENTO/PARCELAS do formulário de CRIAÇÃO/EDIÇÃO de Pedido
// (Order — Operacional / Vendas, F-051, 97-Esteiras/043, PED-FE-05).
// Consumido por `CreateOrUpdateOrder.tsx`, montado logo após a `Textarea` de
// observação (F-019/F-020, ordem fiel ao legado — `note` vem antes de
// `payment_method` no formulário real).
//
// Mirror ESTRUTURAL de `Budget/BudgetPaymentsEditor.tsx`+`BudgetPaymentRow.tsx`
// (mesmo racional de `useFieldArray` para o cronograma + `calcInstallments`/
// `adjustInstallmentsDifference` de `@/utils/budgetInstallments`), MAS
// ADAPTADO à diferença estrutural do contrato de Pedidos: o pagamento do
// Pedido é um bloco ÚNICO (não repetível como `Budgets.payments[]`) — por
// isso `payment_method`/`installments`/`due_date`/`interval` vivem
// DIRETAMENTE no `OrderForm` (`useController` simples, sem `useFieldArray`
// de payments), e SINCRONIZAM 1:1 com os campos homônimos de
// `installment_details` (`qtt_installments`/`first_installment`/
// `installment_interval`) — F-024/025/026 descrevem UM único input visível
// que grava nos DOIS lugares do payload (colunas `orders.*` E o JSON
// `installment_details`, contrato-api §3.3/exact_select).
//
// `installment_details` (has_input/input_date/input_value/fiscal_document/
// cronograma) É o único `useFieldArray` real desta tela (`installments[]`,
// F-028/F-029) — DECLARADO AQUI (não em `OrderInstallmentRow`, que é
// apresentacional puro, sem hooks de formulário) porque não há um nível de
// linha "pagamento" para aninhar dentro (ao contrário de
// `BudgetPaymentRow`, que precisa do `useFieldArray` aninhado por viver
// dentro de `payments.${index}`).
//
// Fidelidade (IG-010..014/017, CV-012/013/014, contrato-tela §6.2):
//   - IG-010: `has_input` alterna obrigatoriedade de `input_date`/
//     `input_value` (Yup `.when()`, `order-schema.ts`) — limpa os 2 quando
//     desligado.
//   - IG-011/012: recompute do cronograma (`calcInstallments`) em TODA
//     mudança de installments/due_date/interval/input_value/input_date.
//   - PARADA-DEF-C (corrige CLM-025): recompute TAMBÉM dispara quando o
//     `total` do cabeçalho muda (`useWatch` PRÓPRIO sobre `items`/`freight` +
//     `@/utils/orderTotals.computeOrderTotals`, MESMA fonte de
//     `OrderFooterTotals`/`tryPersistOrder` em `CreateOrUpdateOrder.tsx`) —
//     o legado não re-disparava, aqui corrige.
//   - IG-013/CV-014: edição manual de UMA parcela reconcilia a soma via
//     `adjustInstallmentsDifference`, ajustando a última; recusa (toast) se
//     ela zerar/negativar — nunca deixa a última ≤0.
//   - IG-017: bounds de data 1900-12-31..2100-12-31 — validados no schema
//     (`order-schema.ts`, `withDateBounds`), não nesta camada de UI.
//   - IG-014 (Enter = blur sem submit) vive em `OrderInstallmentRow.tsx`
//     (campo de valor da parcela).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, FieldErrors, useController, useFieldArray, useWatch } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { adjustInstallmentsDifference, calcInstallments } from '@/utils/budgetInstallments';
import type { BudgetInstallmentRow } from '@/utils/budgetInstallments';
import { computeOrderTotals } from '@/utils/orderTotals';

import { columnsForm } from '@/constants/coluns-form';
import {
  fiscalDocumentOptions,
  hasInputOptions,
  orderPaymentMethodOptions,
} from '@/constants/Orders/options';

import type { LanguageDate } from '@/@types/language';
import type { OrderForm, OrderInstallmentDetailsForm } from '@/@types/v2/Orders';

import { OrderInstallmentRow } from './OrderInstallmentRow';

export interface OrderPaymentsEditorProps {
  /** `control` do `useForm` do formulário PAI (`OrderForm`, PED-FE-03). */
  control: Control<OrderForm>;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<OrderForm>;
  languageGB: LanguageDate;
  /** `true` em CRIAÇÃO — default de `fiscal_document` (F-027, "create 1"). */
  isCreating: boolean;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

function defaultInstallmentDetails(
  seed: Partial<OrderInstallmentDetailsForm>,
  isCreating: boolean
): OrderInstallmentDetailsForm {
  return {
    has_input: false,
    input_date: null,
    input_value: null,
    qtt_installments: null,
    first_installment: null,
    installment_interval: 0,
    fiscal_document: isCreating,
    installments: [],
    ...seed,
  };
}

export function OrderPaymentsEditor({
  control,
  errors,
  languageGB,
  isCreating,
  disabled = false,
}: OrderPaymentsEditorProps) {
  const text = languageGB.orders.order;
  const paymentText = text.form.fields.payment;

  // CV-004..007 — MESMO cálculo do rodapé (`OrderFooterTotals`,
  // `CreateOrUpdateOrder.tsx`) e do payload (`tryPersistOrder`), via
  // `@/utils/orderTotals` (extraído nesta Tarefa para os 3 nunca divergirem
  // entre si). `useWatch` PRÓPRIO (mirror `BudgetPaymentsEditor`'s
  // `useWatch('items')`/`freight`) — PARADA-DEF-C (corrige CLM-025): o
  // recompute do cronograma abaixo depende deste `total` reativo.
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const freight = Number(useWatch({ control, name: 'freight' })) || 0;
  const { total } = computeOrderTotals(watchedItems, freight);

  const { field: paymentMethodField, fieldState: paymentMethodFieldState } = useController({
    control,
    name: 'payment_method',
  });
  const { field: installmentsField, fieldState: installmentsFieldState } = useController({
    control,
    name: 'installments',
  });
  const { field: intervalField, fieldState: intervalFieldState } = useController({
    control,
    name: 'interval',
  });
  const { field: dueDateField, fieldState: dueDateFieldState } = useController({
    control,
    name: 'due_date',
  });
  const { field: installmentDetailsField } = useController({
    control,
    name: 'installment_details',
  });

  // `useFieldArray` do cronograma — ÚNICO nível aninhado real desta tela
  // (ver cabeçalho: sem "linha de pagamento" para aninhar dentro, ao
  // contrário de `BudgetPaymentRow`). Cast pragmático (mesmo racional já
  // usado em `BudgetPaymentRow`/`BudgetItemsEditor`) — o caminho é 100% real
  // (`installment_details.installments`), só o TS não resolve o tipo do
  // array aninhado atrás de um campo nullable sem ajuda.
  const {
    fields: installmentFields,
    replace: replaceInstallments,
    update: updateInstallment,
  } = useFieldArray({
    control: control as any,
    name: 'installment_details.installments' as any,
  });

  const details = installmentDetailsField.value as OrderInstallmentDetailsForm | null;
  const detailsErrors = (errors as any)?.installment_details as
    Record<string, { message?: string } | undefined> | undefined;

  // T2 (Onda G, execução 065) — erros por linha do cronograma
  // (`installment_details.installments[i].date`/`.value`, `order-schema.ts`,
  // IG-017/F-028/F-029). Antes desta correção `OrderInstallmentRow` não
  // recebia `error` nenhum — o único ponto GENUINAMENTE silencioso do form
  // (plano §3, `onda-G-pedidos-salvar-plano.md`).
  const installmentRowErrors = (detailsErrors as any)?.installments as
    Array<{ date?: { message?: string }; value?: { message?: string } } | undefined> | undefined;

  const installmentsValue = Number(installmentsField.value) || 0;

  // Seeda `installment_details` assim que fica `null` — 1ª renderização em
  // CRIAÇÃO (`defaultValues.installment_details: null`, PED-FE-03), ou
  // EDIÇÃO de um Pedido legado sem cronograma persistido
  // (`fillOrderForm`/`data.installment_details` ausente). Nunca reseta um
  // bloco já preenchido (Estados de UI: "só ESCONDE/inicializa, não limpa").
  useEffect(() => {
    if (details) return;
    installmentDetailsField.onChange(
      defaultInstallmentDetails(
        {
          qtt_installments: installmentsValue || 1,
          first_installment: dueDateField.value || null,
          installment_interval: Number(intervalField.value) || 0,
        },
        isCreating
      )
    );
  }, [details]);

  // CV-012/013/014 — regenera o cronograma toda vez que a "receita" muda:
  // qtt_installments/first_installment/installment_interval/input_value/
  // input_date/has_input (IG-011/012) **e** `total` do cabeçalho
  // (PARADA-DEF-C, corrige CLM-025 — o legado não re-disparava quando
  // total/freight/discount mudavam depois do cronograma já gerado).
  useEffect(() => {
    if (!details) return;
    const rows = calcInstallments({
      total,
      inputValue: details.has_input ? details.input_value : null,
      qtdInstallments: Number(details.qtt_installments) || 0,
      firstInstallment: details.first_installment,
      intervalDays: Number(details.installment_interval) || 0,
    });
    replaceInstallments(rows as any);
  }, [
    total,
    details?.has_input,
    details?.input_value,
    details?.input_date,
    details?.qtt_installments,
    details?.first_installment,
    details?.installment_interval,
  ]);

  function patchDetails(patch: Partial<OrderInstallmentDetailsForm>) {
    installmentDetailsField.onChange({
      ...(details ?? defaultInstallmentDetails({}, isCreating)),
      ...patch,
    });
  }

  // F-024 — `installments` (único input visível) espelha
  // `installment_details.qtt_installments` (mesma UI, CLM-008 compartilhado).
  function handleInstallmentsChange(value: number | null) {
    installmentsField.onChange(value);
    patchDetails({ qtt_installments: value });
  }

  // F-025 — `due_date` (único input visível) É a `first_installment` do
  // cronograma (mesma UI, mesmo valor — "primeiro vencimento e coluna
  // orders.due_date").
  function handleDueDateChange(value: string | null) {
    dueDateField.onChange(value ?? '');
    patchDetails({ first_installment: value });
  }

  // F-026 — `interval` (único input visível) espelha
  // `installment_details.installment_interval`.
  function handleIntervalChange(value: number | null) {
    intervalField.onChange(value);
    patchDetails({ installment_interval: value });
  }

  // IG-010 — `has_input` alterna obrigatoriedade de `input_date`/
  // `input_value` (Yup `.when()`) — limpa os 2 quando desligado.
  function handleHasInputChange(value: boolean) {
    patchDetails({
      has_input: value,
      input_date: value ? (details?.input_date ?? null) : null,
      input_value: value ? (details?.input_value ?? null) : null,
    });
  }

  // IG-013/CV-014 — `value_installments` editado manualmente: reconcilia a
  // soma ajustando a última parcela; recusa (toast + mantém valor anterior)
  // se ela zerar/negativar.
  function handleInstallmentValueChange(rowIndex: number, newValue: number) {
    const currentRows: BudgetInstallmentRow[] = (details?.installments ?? []).map((row) => ({
      date: row.date,
      value: row.value,
    }));
    const targetTotal = details?.has_input ? total - (Number(details.input_value) || 0) : total;

    const result = adjustInstallmentsDifference(
      currentRows,
      rowIndex,
      Number(newValue) || 0,
      targetTotal
    );

    if (result === currentRows) {
      toaster.error({
        title: paymentText.sectionTitle,
        description: paymentText.adjustRefusedToast,
      });
      return;
    }

    replaceInstallments(result as any);
  }

  function handleInstallmentDateChange(rowIndex: number, value: string | null) {
    const current = installmentFields[rowIndex] as unknown as BudgetInstallmentRow;
    updateInstallment(rowIndex, { ...current, date: value ?? '' } as any);
  }

  const paymentMethodOptions = orderPaymentMethodOptions.options(languageGB);
  const hasInputSelectOptions = hasInputOptions.options(languageGB);
  const fiscalDocumentSelectOptions = fiscalDocumentOptions.options(languageGB);

  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {paymentText.sectionTitle}
      </Text>

      <SimpleGrid columns={columnsForm.threeColumns} gap={4} mb={4}>
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

        <Select
          name="installment_details.has_input"
          label={paymentText.hasInput}
          options={hasInputSelectOptions}
          value={
            hasInputSelectOptions.find(
              (option) => option.value === (details?.has_input ?? false)
            ) ?? null
          }
          onChange={(option) => handleHasInputChange(!!option?.value)}
          isDisabled={disabled}
        />

        {details?.has_input && (
          <>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {paymentText.inputDate}
              </Text>
              <DateInput
                value={details.input_date ?? null}
                onChange={(value) => patchDetails({ input_date: value })}
                disabled={disabled}
              />
              {detailsErrors?.input_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {detailsErrors.input_date.message}
                </Text>
              )}
            </Box>

            <MoneyInput
              name="installment_details.input_value"
              label={paymentText.inputValue}
              value={details.input_value ?? null}
              onValueChange={(value) => patchDetails({ input_value: value })}
              error={detailsErrors?.input_value?.message}
              disabled={disabled}
            />
          </>
        )}

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

        <Box>
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

        <NumberInput
          name={intervalField.name}
          label={paymentText.interval}
          allowDot={false}
          decimalPlaces={0}
          min={0}
          value={Number(intervalField.value) || 0}
          onValueChange={handleIntervalChange}
          error={intervalFieldState.error?.message}
          disabled={disabled}
        />

        <Select
          name="installment_details.fiscal_document"
          label={paymentText.fiscalDocument}
          options={fiscalDocumentSelectOptions}
          value={
            fiscalDocumentSelectOptions.find(
              (option) => option.value === (details?.fiscal_document ?? isCreating)
            ) ?? null
          }
          onChange={(option) => patchDetails({ fiscal_document: !!option?.value })}
          isDisabled={disabled}
        />
      </SimpleGrid>

      {installmentFields.length > 0 && (
        <Flex direction="column" gap={2}>
          <Flex gap={3} fontSize="xs" color="fg.muted" fontWeight="medium">
            <Box flex="1" minW="140px">
              {paymentText.installmentsTable.date}
            </Box>
            <Box flex="1" minW="140px">
              {paymentText.installmentsTable.value}
            </Box>
          </Flex>
          {installmentFields.map((rowField, rowIndex) => {
            const row = rowField as unknown as BudgetInstallmentRow & { id: string };
            return (
              <OrderInstallmentRow
                key={row.id}
                index={rowIndex}
                date={row.date}
                value={row.value}
                onDateChange={handleInstallmentDateChange}
                onValueChange={handleInstallmentValueChange}
                disabled={disabled}
                error={{
                  date: installmentRowErrors?.[rowIndex]?.date?.message,
                  value: installmentRowErrors?.[rowIndex]?.value?.message,
                }}
              />
            );
          })}
        </Flex>
      )}
    </Box>
  );
}

export default OrderPaymentsEditor;
