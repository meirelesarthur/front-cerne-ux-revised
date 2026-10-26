// src/pages/Administrativo/Recebimentos/FinalizarPedidoPage.tsx
// -----------------------------------------------------------------------------
// Tela de escrita curta "Finalizar Pedido" (Informar Pagamento) —
// RequestReceipt, Administrativo / Suprimentos, esteira 97-Esteiras/040,
// TASK-RCB-FE-04. `GET /request-receipts/{uuid}/inform-payment` (hidratação)
// + `PUT /request-receipts/{uuid}/inform-payment` (finaliza, status→9) —
// rota `/administrativo/recebimentos/:uuid/finalizar`
// (`request-purchases_financial`).
//
// A API corrigiu o bug de "sem validação server" (CLM-35) — o front espelha
// a validação (client + server): `final_date`/`nfe` obrigatórios.
//
// Execução 081, T-081-FE-10 (LEGADO-SUPRIMENTOS-09, FI-01..FI-06): o campo
// Responsável mostra o usuário logado (como o legado); o Status é sempre "Pedido
// Finalizado" (9); após o sucesso volta para a lista de Recebimentos e invalida
// todas as listas de Suprimentos.
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
import { requestPurchaseStatus } from '@/constants/RequestReceipts/request-receipt-status';

import { informPaymentSchemaResolver } from '@/validations/schemas/RequestReceipts/inform-payment-schema';

import {
  finalizeRequestReceipt,
  getRequestReceiptInformPayment,
} from '@/services/v2/RequestReceipts/request-receipt-service';

import type {
  FinalizeReceiptForm,
  FinalizeReceiptRequest,
  RequestReceiptInformPaymentContext,
} from '@/@types/v2/RequestReceipts';

import { receiptRoutes } from './receiptsActions';

export default function FinalizarPedidoPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { languageGB } = useLanguage();
  const text = languageGB.requestReceipts.requestReceipt;

  const finalizedStatusOption = {
    label: text.informPayment.statusOptions.pedidoFinalizado,
    value: requestPurchaseStatus.pedidoFinalizado,
  };

  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    formState: { dirtyFields, isSubmitting, errors },
  } = useForm<FinalizeReceiptForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: informPaymentSchemaResolver(languageGB),
    defaultValues: {
      code: null,
      final_date: null,
      status: finalizedStatusOption,
      nfe: '',
      finalization_note: '',
    },
  });

  // Lei 2 — função nomeada com guarda de `dirtyFields`.
  function fillInformPaymentForm(data: RequestReceiptInformPaymentContext, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        code: data.code,
        final_date: data.final_date ?? todayLocalIso(),
        status: finalizedStatusOption,
        nfe: data.nfe ?? '',
        finalization_note: '',
      });
    }
  }

  const informPaymentQuery = useCustomFormQueryByGuid<RequestReceiptInformPaymentContext>({
    registrationId: uuid,
    asyncFunction: getRequestReceiptInformPayment,
    queryKey: queryKey.requestReceipts.requestReceipt,
    fillForm: fillInformPaymentForm,
  });

  const isLoading = checkLoadingStatus([informPaymentQuery as any]);

  async function tryFinalizeReceipt(data: FinalizeReceiptForm) {
    const payload: FinalizeReceiptRequest = {
      final_date: data.final_date as string,
      status: data.status?.value ?? requestPurchaseStatus.pedidoFinalizado,
      nfe: data.nfe,
      finalization_note: data.finalization_note?.trim() || null,
    };
    return finalizeRequestReceipt(uuid as string, payload);
  }

  const finalizeMutation = useRequest({
    asyncFunction: tryFinalizeReceipt,
    entityName: text.singularLabel,
    queryKey: queryKey.requestReceipts.requestReceiptsList,
    queryKey2: queryKey.requestReceipts.requestReceipt,
    typesRequest: 'update',
    personalizedMessage: text.informPayment.submitToast,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient);
      navigate(receiptRoutes.list);
    },
  });

  async function onSubmit(data: FinalizeReceiptForm) {
    await finalizeMutation.mutateAsync(data);
  }

  const isSaving = finalizeMutation.isPending || isSubmitting;

  return (
    <FormContainer
      title={text.informPayment.pageTitle}
      subtitle={text.informPayment.pageSubtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(receiptRoutes.list)}
            disabled={isSaving}
          />
          <Button
            title={languageGB.defaltStrings.save}
            type="submit"
            form="inform-payment-form"
            loading={isSaving}
            disabled={isSaving || isLoading}
          />
        </>
      }
    >
      <Form id="inform-payment-form" onSubmit={handleSubmit(onSubmit)} noPadding>
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          <InputReadOnly label={text.confirm.fields.code} value={watch('code') ?? '—'} />
          <InputReadOnly label={text.confirm.fields.responsible} value={user?.username ?? '—'} />

          <Controller
            name="final_date"
            control={control}
            render={({ field }) => (
              <Field
                label={text.informPayment.fields.finalDate}
                isRequired
                errorText={errors.final_date?.message}
              >
                <DateInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={isSaving}
                />
              </Field>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.informPayment.fields.status}
                value={field.value}
                onChange={field.onChange}
                options={[finalizedStatusOption]}
                isDisabled
                noClearable
              />
            )}
          />

          <Input
            label={text.informPayment.fields.nfe}
            maxLength={9}
            disabled={isSaving}
            isRequired
            error={errors.nfe?.message}
            {...register('nfe')}
          />

          <Box gridColumn={{ base: '1', md: 'span 2' }}>
            <Textarea
              label={text.informPayment.fields.finalizationNote}
              disabled={isSaving}
              {...register('finalization_note')}
            />
          </Box>
        </Box>
      </Form>
    </FormContainer>
  );
}
