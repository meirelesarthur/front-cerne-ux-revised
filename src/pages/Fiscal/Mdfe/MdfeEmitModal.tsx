// src/pages/Fiscal/Mdfe/MdfeEmitModal.tsx
// -----------------------------------------------------------------------------
// Modal "Emitir MDF-e" — T-DEF02-FE-01 (D3). O emissor é ESCOLHIDO na emissão
// (legado `MdfeController::emitir` / `MdfeEmiteController`, obrigatório): Select
// de emissor obrigatório, opções de `GET /mdfes/issuer-options`, pré-selecionado
// com o emissor já gravado no MDF-e quando ele estiver entre os elegíveis (nunca
// força um emissor fora da lista). Mirror estrutural de `NfeEmitModal.tsx`
// (Dialog v3 headless + react-hook-form; a `mutation` é instanciada no host —
// `MdfeEmissionPanel.tsx` — cujo `actionSuccess` fecha este modal). Mensagens 422
// da API ("Informe o emissor do MDF-e.", "… não está habilitado para emitir …")
// chegam em `errorMessage` e aparecem no modal.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';

import type { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { listMdfeIssuerOptions } from '@/services/v2/Fiscal/mdfe-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MdfeData, MdfeEmitPayload, MdfeIssuerOption } from '@/@types/v2/Fiscal/Mdfe';

export interface MdfeEmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  mdfeDetail: MdfeData;
  languageGB: LanguageDate;
  mutation: ReturnType<typeof useRequest<MdfeData>>;
  onConfirm: (payload: MdfeEmitPayload) => void;
  /** Mensagem de erro (422/SEFAZ) da última tentativa de emissão. */
  errorMessage?: string;
}

interface EmitFormValues {
  issuer_uuid: Option<string> | null;
}

function issuerOptionLabel(issuer: MdfeIssuerOption): string {
  return issuer.razao_social ?? issuer.nome_fantasia ?? issuer.uuid;
}

export function MdfeEmitModal({
  isOpen,
  onClose,
  mdfeDetail,
  languageGB,
  mutation,
  onConfirm,
  errorMessage,
}: MdfeEmitModalProps) {
  const modalText = languageGB.mdfes.mdfe.emission.emitModal;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmitFormValues>({ mode: 'onChange', defaultValues: { issuer_uuid: null } });

  const issuerOptionsQuery = useQuery({
    queryKey: [queryKey.mdfes.issuerOptions],
    queryFn: async () => (await listMdfeIssuerOptions()).data,
    enabled: isOpen,
  });

  const issuerOptions: Option<string>[] = (issuerOptionsQuery.data ?? []).map((issuer) => ({
    label: issuerOptionLabel(issuer),
    value: issuer.uuid,
  }));

  const watchedIssuerUuid = watch('issuer_uuid')?.value;

  // Form nasce limpo a cada abertura (o componente não desmonta entre aberturas).
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      reset({ issuer_uuid: null });
      hasAutoSelectedRef.current = false;
    }
  }, [isOpen, reset]);

  // Pré-seleciona o emissor do MDF-e SE estiver entre os elegíveis (1x por abertura).
  useEffect(() => {
    if (
      isOpen &&
      !hasAutoSelectedRef.current &&
      issuerOptionsQuery.data &&
      mdfeDetail.issue?.uuid
    ) {
      const match = issuerOptionsQuery.data.find(
        (issuer) => issuer.uuid === mdfeDetail.issue?.uuid
      );
      if (match) {
        setValue('issuer_uuid', { label: issuerOptionLabel(match), value: match.uuid });
      }
      hasAutoSelectedRef.current = true;
    }
  }, [isOpen, issuerOptionsQuery.data, mdfeDetail.issue?.uuid, setValue]);

  function submit(data: EmitFormValues) {
    if (!data.issuer_uuid?.value) return;
    onConfirm({ issuer_uuid: data.issuer_uuid.value });
  }

  function handleClose() {
    reset({ issuer_uuid: null });
    onClose();
  }

  const hasNoIssuersAvailable = issuerOptionsQuery.isSuccess && issuerOptions.length === 0;
  const isConfirmDisabled =
    mutation.isPending ||
    issuerOptionsQuery.isLoading ||
    issuerOptionsQuery.isError ||
    !watchedIssuerUuid;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) handleClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{modalText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text fontSize="sm" color="fg.muted">
                  {modalText.description}
                </Text>

                {issuerOptionsQuery.isError && (
                  <Text fontSize="sm" color="fg.error">
                    {modalText.loadIssuersError}
                  </Text>
                )}

                {hasNoIssuersAvailable && (
                  <Text fontSize="sm" color="fg.error">
                    {modalText.noIssuersAvailable}
                  </Text>
                )}

                {errorMessage && (
                  <Text fontSize="sm" fontWeight="semibold" color="fg.error" role="alert">
                    {errorMessage}
                  </Text>
                )}

                <Controller
                  name="issuer_uuid"
                  control={control}
                  rules={{ required: modalText.issuerRequired }}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={modalText.issuerLabel}
                      placeholder={modalText.issuerPlaceholder}
                      name={name}
                      value={value}
                      onChange={onChange}
                      options={issuerOptions}
                      error={errors.issuer_uuid?.message}
                      isRequired
                      isDisabled={mutation.isPending || issuerOptionsQuery.isLoading}
                      loading={issuerOptionsQuery.isLoading}
                      disablePortal
                    />
                  )}
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="outline"
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
              />
              <Button
                title={modalText.confirmButton}
                type="button"
                onClick={handleSubmit(submit)}
                loading={mutation.isPending}
                disabled={isConfirmDisabled}
              />
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
