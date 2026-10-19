// src/pages/Administrativo/Recebimentos/ConfirmarRecebimentoPage.tsx
// -----------------------------------------------------------------------------
// Tela de escrita "Confirmar Recebimento" (RequestReceipt — Administrativo /
// Suprimentos). `GET /request-receipts/{uuid}` (hidratação) + `PUT
// /request-receipts/{uuid}` (confirmação) — rota
// `/administrativo/recebimentos/:uuid/confirmar` (`request-receipts_edit`).
//
// Execução 081, T-081-FE-10 (LEGADO-SUPRIMENTOS-09, FLD-01..FLD-11):
//  - abre com Data Recebimento = `receipt_date_suggested` (hoje), Status do Pedido =
//    "Compra Recebida" e itens em "P" com data de hoje (`receiptDefaults`);
//  - "Parcial" ("Recebida Parcial") mantém o responsável e pode ser reaberto; anexos
//    só são obrigatórios no Total;
//  - os anexos do pedido nunca são apagados: a tela só ACRESCENTA linhas (a API
//    também só acrescenta);
//  - volta para a lista de Recebimentos após o sucesso e invalida todas as listas.
//
// `useCustomFormQueryByGuid` + `fillForm` nomeada com guarda `!isEmpty(dirtyFields)
// || resetForce` (Lei 2). Itens chaveados por `uuid`, NUNCA índice (CLM-13).
// -----------------------------------------------------------------------------

import { Box } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { queryKey } from '@/constants/query-key';
import { requestItemStatusOptions } from '@/constants/RequestPurchases/options/request-item-status-options';
import { confirmReceiptCompletionOptions } from '@/constants/RequestReceipts/options/confirm-receipt-completion-options';

import { confirmReceiptSchemaResolver } from '@/validations/schemas/RequestReceipts/confirm-receipt-schema';

import {
  confirmRequestReceipt,
  getRequestReceipt,
} from '@/services/v2/RequestReceipts/request-receipt-service';

import type {
  ConfirmReceiptForm,
  ConfirmReceiptItemPayload,
  ConfirmReceiptRequest,
  RequestReceiptData,
} from '@/@types/v2/RequestReceipts';

import { buildConfirmReceiptDefaults } from './receiptDefaults';
import { receiptRoutes } from './receiptsActions';
import { RequestReceiptAttachmentsFieldArray } from './RequestReceiptAttachmentsFieldArray';
import { RequestReceiptItemsFieldArray } from './RequestReceiptItemsFieldArray';

export default function ConfirmarRecebimentoPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { languageGB } = useLanguage();
  const text = languageGB.requestReceipts.requestReceipt;

  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    formState: { dirtyFields, isSubmitting, errors },
  } = useForm<ConfirmReceiptForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: confirmReceiptSchemaResolver(languageGB),
    defaultValues: {
      code: null,
      responsible: null,
      receipt_date: null,
      nfe: '',
      purchase_status: null,
      receipt_note: '',
      items: [],
      attachments: [],
    },
  });

  // Lei 2 — função nomeada com guarda de `dirtyFields`, `reset()` SOMENTE
  // aqui (nunca em `useEffect` inline).
  function fillConfirmReceiptForm(data: RequestReceiptData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset(
        buildConfirmReceiptDefaults(data, {
          today: todayLocalIso(),
          loggedUserName: user?.username ?? null,
          itemStatusOption: (value) => requestItemStatusOptions.getOption(value, languageGB),
          completionOption: (value) => confirmReceiptCompletionOptions.getOption(value, languageGB),
        })
      );
    }
  }

  const requestReceiptQuery = useCustomFormQueryByGuid<RequestReceiptData>({
    registrationId: uuid,
    asyncFunction: getRequestReceipt,
    queryKey: queryKey.requestReceipts.requestReceipt,
    fillForm: fillConfirmReceiptForm,
  });

  const isLoading = checkLoadingStatus([requestReceiptQuery as any]);

  async function tryConfirmReceipt(data: ConfirmReceiptForm) {
    const items: ConfirmReceiptItemPayload[] = data.items.map((item) => ({
      uuid: item.uuid,
      status: item.status.value,
      delivery_date: item.delivery_date as string,
    }));

    const attachments = data.attachments
      .filter((row) => !!row.file)
      .map((row) => ({ name: row.name?.trim() || '', file: row.file as File }));

    const payload: ConfirmReceiptRequest = {
      nfe: data.nfe,
      purchase_status: data.purchase_status!.value,
      receipt_date: data.receipt_date as string,
      receipt_note: data.receipt_note?.trim() || null,
      items,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    return confirmRequestReceipt(uuid as string, payload);
  }

  const confirmMutation = useRequest({
    asyncFunction: tryConfirmReceipt,
    entityName: text.singularLabel,
    queryKey: queryKey.requestReceipts.requestReceiptsList,
    queryKey2: queryKey.requestReceipts.requestReceipt,
    typesRequest: 'update',
    personalizedMessage: text.confirm.submitToast,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient);
      navigate(receiptRoutes.list);
    },
  });

  async function onSubmit(data: ConfirmReceiptForm) {
    await confirmMutation.mutateAsync(data);
  }

  const purchaseStatusValue = watch('purchase_status');
  const attachmentsRequired =
    purchaseStatusValue?.value === confirmReceiptCompletionOptions.values.total;
  const isSaving = confirmMutation.isPending || isSubmitting;
  const completionOptions = confirmReceiptCompletionOptions.options(languageGB);

  return (
    <FormContainer
      title={text.confirm.pageTitle}
      subtitle={text.confirm.pageSubtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(receiptRoutes.list)}
            disabled={isSaving}
          />
          <Button
            title={languageGB.defaltStrings.save}
            type="submit"
            form="confirm-receipt-form"
            loading={isSaving}
            disabled={isSaving || isLoading}
          />
        </>
      }
    >
      <Form id="confirm-receipt-form" onSubmit={handleSubmit(onSubmit)} noPadding>
        <Box
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
          gap={4}
          mb={6}
        >
          <InputReadOnly label={text.confirm.fields.code} value={watch('code') ?? '—'} />
          <InputReadOnly
            label={text.confirm.fields.responsible}
            value={watch('responsible') ?? '—'}
          />

          <Controller
            name="receipt_date"
            control={control}
            render={({ field }) => (
              <Field
                label={text.confirm.fields.receiptDate}
                isRequired
                errorText={errors.receipt_date?.message}
              >
                <DateInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={isSaving}
                />
              </Field>
            )}
          />

          <Input
            label={text.confirm.fields.nfe}
            maxLength={9}
            disabled={isSaving}
            isRequired
            error={errors.nfe?.message}
            {...register('nfe')}
          />

          <Controller
            name="purchase_status"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.confirm.fields.purchaseStatus}
                value={field.value}
                onChange={field.onChange}
                options={completionOptions}
                isDisabled={isSaving}
                isRequired
                noClearable
                error={errors.purchase_status?.message}
              />
            )}
          />

          <Box gridColumn={{ base: '1', md: 'span 2' }}>
            <Textarea
              label={text.confirm.fields.receiptNote}
              maxLength={600}
              disabled={isSaving}
              error={errors.receipt_note?.message}
              {...register('receipt_note')}
            />
          </Box>
        </Box>

        <Box mb={8}>
          <RequestReceiptItemsFieldArray control={control} isDisabled={isSaving} />
        </Box>

        <RequestReceiptAttachmentsFieldArray
          control={control}
          watch={watch}
          isDisabled={isSaving}
          isRequired={attachmentsRequired}
        />
      </Form>
    </FormContainer>
  );
}
