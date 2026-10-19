// src/pages/Public/RequestQuotation/RequestQuotationPublicForm.tsx
// -----------------------------------------------------------------------------
// Formulário PÚBLICO do fornecedor (hash, RequestQuotation — esteira
// 97-Esteiras/035, TASK-CQ-FE-10). Consumido por `index.tsx` quando
// `quotation.status !== recebida` — o estado "já enviada" é resolvido pelo
// PAI (`index.tsx`), este componente nunca decide sozinho se deve renderizar.
//
// `useMutation` DIRETO (mirror `RequestQuotationSavingDialog.tsx` — NUNCA
// `useRequest`, que invalida `queryKey`/usa `languageGB.defaltStrings.*`
// pensado para a app autenticada; aqui o tratamento de erro é DELIBERADAMENTE
// distinto por status — 409/429/422/404, roteiro API §9.1).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/`@/stores/*Farm*`/
// `@/services/api` neste arquivo nem em nenhum componente do subtree
// `src/pages/Public/**` (checável por grep/lint de import).
// -----------------------------------------------------------------------------

import { Alert, Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import requestQuotationPublicSchemaResolver, {
  REQUEST_QUOTATION_PUBLIC_FILE_MAX_SIZE_MB,
} from '@/validations/schemas/RequestQuotations/request-quotation-public-schema';

import { submitPublicRequestQuotation } from '@/services/v2/RequestQuotations/request-quotation-public-service';

import type {
  PublicApiErrorBody,
  PublicRequestQuotationData,
  PublicRequestQuotationForm,
  PublicRequestQuotationSubmissionPayload,
} from '@/@types/v2/RequestQuotations';

import { installmentAmount, totalAmount } from './publicQuotationTotals';
import { RequestQuotationPublicItemRow } from './RequestQuotationPublicItemRow';
import { RequestQuotationPublicPaymentRow } from './RequestQuotationPublicPaymentRow';

export interface RequestQuotationPublicFormProps {
  hash: string;
  quotation: PublicRequestQuotationData;
  /** Acionado após POST bem-sucedido OU 409 (`QUOTATION_ALREADY_SUBMITTED`)
   *  — em AMBOS os casos o PAI (`index.tsx`) deve reconsultar o `GET` (a
   *  fonte da verdade de `status` é sempre o servidor, nunca um estado local
   *  otimista deste componente). */
  onSubmittedOrAlreadySubmitted: () => void;
}

function buildDefaultValues(quotation: PublicRequestQuotationData): PublicRequestQuotationForm {
  return {
    reponsible: null,
    expiration_date: null,
    file: null,
    items: quotation.items.map((item) => ({
      request_item_uuid: item.request_item_uuid,
      description: item.description,
      quantity: item.quantity,
      // Legado: a marca começa vazia (o fornecedor informa).
      brand: '',
      unitary_value: null,
      observation: null,
      amount: 0,
    })),
    // CL-035 — a lista de condições de pagamento nunca começa vazia (mesma
    // guarda "não remover a última linha" também vale para o estado
    // inicial).
    payments: [
      { payment_method: null, installments: null, interval: null, total: null, amount: null },
    ],
  };
}

export function RequestQuotationPublicForm({
  hash,
  quotation,
  onSubmittedOrAlreadySubmitted,
}: RequestQuotationPublicFormProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<PublicRequestQuotationForm>({
    resolver: requestQuotationPublicSchemaResolver(languageGB, quotation.requires_file),
    defaultValues: buildDefaultValues(quotation),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: PublicRequestQuotationSubmissionPayload) =>
      submitPublicRequestQuotation(hash, payload),
    onSuccess: () => {
      toaster.success({ title: text.pageTitle, description: text.submittedToast, duration: 7000 });
      onSubmittedOrAlreadySubmitted();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data as PublicApiErrorBody | undefined;

        // 409 — `QUOTATION_ALREADY_SUBMITTED` (roteiro API §9.1/§10.1):
        // outra submissão venceu a corrida entre o `GET` e este `POST`. O
        // servidor é a autoridade — reconsulta e deixa o PAI trocar para o
        // banner "já enviada" a partir do `status` real, nunca um texto fixo
        // aqui.
        if (status === 409) {
          toaster.error({
            title: text.pageTitle,
            description: body?.message || text.alreadySubmittedState.title,
            duration: 9000,
          });
          onSubmittedOrAlreadySubmitted();
          return;
        }

        // 429 — `throttle:quotation-public` (10 req/min/IP). NUNCA decidir
        // um cooldown/retry automático aqui (roteiro API §9.1/TASK-CQ-API-11).
        if (status === 429) {
          toaster.error({
            title: text.pageTitle,
            description: text.rateLimitedError,
            duration: 9000,
          });
          return;
        }

        // 422 — validação server-side (dot-notation, ex.
        // `items.0.unitary_value`) OU `BusinessRuleException` (item fora da
        // RequestPurchase, `errors: null`). Mapeamento por campo mirror
        // `RequestQuotationSavingDialog.tsx` — a mensagem literal do backend
        // SEMPRE vence sobre qualquer preview client-side.
        if (status === 422) {
          const fieldErrors = body?.errors;
          Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
            if (messages?.[0]) {
              setError(field as never, { type: 'server', message: messages[0] });
            }
          });
          toaster.error({
            title: text.pageTitle,
            description: body?.message || text.errorFallback,
            duration: 9000,
          });
          return;
        }

        toaster.error({
          title: text.pageTitle,
          description: body?.message || text.errorFallback,
          duration: 9000,
        });
        return;
      }

      toaster.error({ title: text.pageTitle, description: text.errorFallback, duration: 9000 });
    },
  });

  function onSubmit(data: PublicRequestQuotationForm) {
    if (!data.reponsible || !data.expiration_date) return; // guarda defensiva — schema já exige

    // `total_value` = total geral (soma das linhas), nunca digitado pelo
    // fornecedor. O servidor recalcula (T-081-API-08); aqui vale só o preview.
    const totalValue = totalAmount(data.items);

    // Legado: total geral <= 0 é recusado ("O valor deve ser maior que zero").
    if (totalValue <= 0) {
      setError('root.totalValue', { type: 'validate', message: text.validation.totalValueMin });
      return;
    }

    const payload: PublicRequestQuotationSubmissionPayload = {
      reponsible: data.reponsible,
      expiration_date: data.expiration_date,
      total_value: totalValue,
      items: data.items.map((item) => ({
        request_item_uuid: item.request_item_uuid,
        unitary_value: item.unitary_value ?? 0,
        brand: item.brand ?? '',
        observation: item.observation || null,
      })),
      payments: data.payments.map((paymentRow) => ({
        payment_method: paymentRow.payment_method?.value ?? 0,
        installments: paymentRow.installments ?? 0,
        interval: paymentRow.interval ?? 0,
        // "Valor Total" da condição = total geral; parcela = total / parcelas.
        amount: installmentAmount(totalValue, paymentRow.installments),
        total: totalValue,
      })),
      file: data.file,
    };

    submitMutation.mutate(payload);
  }

  const isSubmitting = submitMutation.isPending;

  // Total geral exibido ("Vl.Total"), derivado dos preços digitados.
  const grandTotal = totalAmount(watch('items') ?? []);
  const itemLabel =
    quotation.request_purchase?.type === 'P' ? text.fields.itemProduct : text.fields.itemService;

  return (
    <Form noPadding onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap={6}>
        <Textarea
          label={text.fields.quotationNote}
          name="note"
          value={quotation.note ?? ''}
          readOnly
          rows={3}
        />

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {itemLabel}
          </Text>
          {quotation.items.map((item, index) => (
            <RequestQuotationPublicItemRow
              key={item.request_item_uuid}
              control={control}
              errors={errors}
              setValue={setValue}
              index={index}
              item={item}
              itemLabel={itemLabel}
              disabled={isSubmitting}
            />
          ))}
          <Flex justify="flex-end" mt={4}>
            <Box w={{ base: 'full', sm: '200px' }}>
              <MoneyInput
                name="total_value"
                label={text.fields.totalValue}
                value={grandTotal}
                error={errors.root?.totalValue?.message}
                readOnly
                disabled
              />
            </Box>
          </Flex>
        </Box>

        <RequestQuotationPublicPaymentRow
          control={control}
          errors={errors}
          watch={watch}
          grandTotal={grandTotal}
          disabled={isSubmitting}
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Controller
            name="reponsible"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.fields.reponsible}
                name={field.name}
                placeholder={text.placeholders.reponsible}
                maxLength={120}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                error={fieldState.error?.message}
                isRequired
                disabled={isSubmitting}
              />
            )}
          />

          <Controller
            name="expiration_date"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                label={text.fields.expirationDate}
                errorText={fieldState.error?.message}
                isRequired
              >
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  minDate={new Date()}
                />
              </Field>
            )}
          />
        </SimpleGrid>

        {quotation.requires_file && (
          <Alert.Root status="warning" borderRadius="md">
            <Alert.Indicator />
            <Alert.Title>{text.requiresFileAlert}</Alert.Title>
          </Alert.Root>
        )}

        {quotation.requires_file && (
          <Controller
            name="file"
            control={control}
            render={({ field, fieldState }) => (
              <FileUpload
                label={text.fields.file}
                file={field.value}
                onFileSelected={(file) => field.onChange(file)}
                onRemove={() => field.onChange(null)}
                accept=".pdf"
                maxSizeMb={REQUEST_QUOTATION_PUBLIC_FILE_MAX_SIZE_MB}
                disabled={isSubmitting}
                error={fieldState.error?.message}
                dropzoneTitle={text.fileUpload.dropzoneTitle}
                dropzoneDraggingTitle={text.fileUpload.dropzoneDraggingTitle}
                changeLabel={text.fileUpload.changeFileLabel}
                removeLabel={text.fileUpload.removeFileLabel}
                replaceLabel={text.fileUpload.replaceFileLabel}
                existingFileLabel={text.fileUpload.existingFileLabel}
                errorTypeMessage={text.fileUpload.errorTypeMessage}
                errorSizeMessage={text.fileUpload.errorSizeMessage}
              />
            )}
          />
        )}

        <Flex justify="flex-end">
          <Button
            title={text.submitButton}
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </Flex>
      </Flex>
    </Form>
  );
}
