// src/pages/Administrativo/Autorizacao/EditRequestAuthorizationItemDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Editar Item" — único campo editável (`quantity`), acionado pela
// seção de Itens da tela de detalhe de Autorização (Administrativo /
// Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-03). `PUT
// /request-authorizations/{uuid}/items/{itemUuid}` (`updateRequestAuthorizationItem`,
// TASK-AUTH-FE-01) — schema já pronto (`request-authorization-item-update-schema.ts`).
//
// Mirror `CustomDialog` (mesma casca já usada por `VoltarEtapaDialog.tsx`) —
// `useForm` + `useRequest` (invalida o detalhe da Autorização, mesma `queryKey`
// consumida pelo container).
//
// Execução 081, T-081-FE-06: a API recalcula as cotações (itens, valor total, desconto
// e pagamentos) ao editar a quantidade; por isso também invalida a lista de cotações.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Flex } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Input } from '@/components/Form/Input';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import requestAuthorizationItemUpdateSchemaResolver from '@/validations/schemas/RequestAuthorizations/request-authorization-item-update-schema';

import { updateRequestAuthorizationItem } from '@/services/v2/RequestAuthorizations/request-authorization-service';

import type { RequestAuthorizationItemUpdatePayload } from '@/@types/v2/RequestAuthorizations';
import type { RequestItemRow } from '@/@types/v2/RequestPurchases';

export interface EditRequestAuthorizationItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da Autorização (rota) — necessário para compor o endpoint. */
  authorizationUuid: string;
  /** Linha selecionada na grade — `null` = nenhum item em edição (dialog
   *  fechado). */
  item: RequestItemRow | null;
}

interface ItemFormValues {
  quantity: number | null;
}

export function EditRequestAuthorizationItemDialog({
  isOpen,
  onClose,
  authorizationUuid,
  item,
}: EditRequestAuthorizationItemDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization;
  const detailText = text.detail;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: requestAuthorizationItemUpdateSchemaResolver(languageGB) as any,
    defaultValues: { quantity: item?.quantity ?? null },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ quantity: item?.quantity ?? null });
    }
  }, [isOpen, item, reset]);

  const updateMutation = useRequest({
    asyncFunction: async (payload: RequestAuthorizationItemUpdatePayload) =>
      updateRequestAuthorizationItem(authorizationUuid, item!.uuid, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestAuthorizations.requestAuthorization,
    // Execução 081 (T-081-API-02): editar a quantidade recalcula as cotações da solicitação.
    queryKey2: queryKey.requestQuotations.requestQuotationsByPurchase,
    typesRequest: 'update',
    personalizedMessage: detailText.editItem.toast,
    actionSuccess: () => onClose(),
  });

  function onSubmit(values: ItemFormValues) {
    if (!item) return;
    updateMutation.mutate({ quantity: Number(values.quantity) });
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={detailText.editItem.title}
      footer={
        <Flex gap={3}>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
          />
          <Button
            title={detailText.editItem.submit}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
          />
        </Flex>
      }
    >
      <Input
        {...register('quantity', { valueAsNumber: true })}
        name="quantity"
        label={detailText.editItem.quantityLabel}
        type="number"
        isRequired
        error={errors.quantity?.message as string | undefined}
        disabled={updateMutation.isPending}
      />
    </CustomDialog>
  );
}
