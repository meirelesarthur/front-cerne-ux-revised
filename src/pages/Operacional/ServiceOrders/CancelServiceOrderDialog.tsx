// src/pages/Operacional/ServiceOrders/CancelServiceOrderDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo "Cancelar OS" (execução 086, FE-01) — `POST /service-orders/{uuid}/
// cancel` com `cancellation_reason` obrigatório (5..1000, schema derivado da
// tradução em `validations/schemas/ServiceOrders/service-order-cancel-schema`).
// Usado pela Lista de OS e pelo detalhe; quem decide se o diálogo pode abrir
// é `canCancelServiceOrder` (permissão `service-orders_cancel` + status 1/2).
//
// Casca de submit externo (`get_pwa_form_query_pattern`): `<Form id>` + botão
// `form="id"` no rodapé. Mutação via `useRequest` (toast i18n de sucesso/erro
// — o 422 de negócio da API aparece no toast); sucesso invalida lista,
// detalhe, Minhas OS, Monitoramento e Avaliações
// (`invalidateServiceOrderStatusQueries`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';
import { SERVICE_ORDER_CANCELLATION_REASON_MAX } from '@/constants/serviceOrders/service-order-cancel-rules';

import { cancelServiceOrderSchemaResolver } from '@/validations/schemas/ServiceOrders/service-order-cancel-schema';

import { cancelServiceOrder } from '@/services/v2/ServiceOrders/service-order-service';

import type { CancelServiceOrderForm, CancelServiceOrderPayload } from '@/@types/v2/ServiceOrders';

import { invalidateServiceOrderStatusQueries } from './invalidateServiceOrderQueries';

const FORM_ID = 'cancel-service-order-form';

const DEFAULT_VALUES: CancelServiceOrderForm = { cancellation_reason: '' };

export interface CancelServiceOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** OS alvo (`null` = nenhuma selecionada, diálogo fechado). */
  serviceOrder: { uuid: string; code: string } | null;
  /** Chamado após o sucesso (já com o diálogo fechado). */
  onSuccess?: () => void;
}

export function CancelServiceOrderDialog({
  isOpen,
  onClose,
  serviceOrder,
  onSuccess,
}: CancelServiceOrderDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.serviceOrders.serviceOrder;
  const dialogText = text.cancel;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelServiceOrderForm>({
    resolver: cancelServiceOrderSchemaResolver(languageGB),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  // O motivo digitado nunca "vaza" de uma OS para outra.
  useEffect(() => {
    if (!isOpen) reset(DEFAULT_VALUES);
  }, [isOpen, reset]);

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  const cancelMutation = useRequest({
    asyncFunction: async (payload: CancelServiceOrderPayload) =>
      cancelServiceOrder(serviceOrder!.uuid, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.serviceOrders.serviceOrders,
    queryKey2: queryKey.serviceOrders.serviceOrder,
    typesRequest: 'update',
    personalizedMessage: dialogText.successToast,
    actionSuccess: () => {
      invalidateServiceOrderStatusQueries(queryClient);
      handleClose();
      onSuccess?.();
    },
  });

  const isSubmitting = cancelMutation.isPending;

  // `mutate` (não `mutateAsync`): o erro de negócio (422) já vira toast no
  // `useRequest.onError` — sem rejeição não tratada no submit do RHF.
  function onSubmit(data: CancelServiceOrderForm) {
    if (!serviceOrder) return;
    cancelMutation.mutate({ cancellation_reason: data.cancellation_reason.trim() });
  }

  return (
    <CustomDialog
      isOpen={isOpen && !!serviceOrder}
      onClose={handleClose}
      title={dialogText.title}
      size="md"
      footer={
        <Flex gap={3}>
          <Button
            title={dialogText.close}
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <Button
            title={dialogText.confirm}
            type="submit"
            form={FORM_ID}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </Flex>
      }
    >
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {dialogText.description.replace('{code}', serviceOrder?.code ?? '')}
      </Text>

      <Form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noPadding>
        <Textarea
          label={dialogText.reasonLabel}
          placeholder={dialogText.reasonPlaceholder}
          maxLength={SERVICE_ORDER_CANCELLATION_REASON_MAX}
          isRequired
          {...register('cancellation_reason')}
          error={errors.cancellation_reason?.message}
          disabled={isSubmitting}
        />
      </Form>
    </CustomDialog>
  );
}
