// src/pages/Fiscal/CteManifestacao/ConsultarDocumentosDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Consultar novos documentos" (CteManifestacao — domínio Fiscal,
// execução 045, Onda 2, TASK-CTE-FE-12, `E17 POST /cte-manifestacoes/
// consultar`, S42-S44). Padrão 14 (`get_pwa_complex_screen_compositions_
// pattern`) — Dialog v3 completo (`Portal + Backdrop + Positioner`),
// `useMutation` DIRETO (não `useRequest`): o toast de sucesso precisa da
// mensagem COM CONTAGEM dinâmica que o próprio backend já compõe
// (`"{count} documento(s) sincronizado(s)."`, `CteManifestacaoController::
// consultar()`) — mirror `Fiscal/Dfe/BuscarDfe.tsx` (mesma exceção
// documentada lá: `useMutation` direto quando o toast depende do delta).
//
// Único campo: `issue_id` (Select assíncrono de emissores, LK21). GAP-CTE-
// FE-04 (ver `@/@types/v2/Fiscal/cteManifestacao`): o valor enviado é o
// `uuid` do emissor (única fonte real do SPA) — `SyncCteManifestacoesRequest`
// real exige `integer, exists:issues,id`; documentado, não mascarado.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { extractSefazErrorMessage } from '@/utils/extractSefazErrorMessage';

import { queryKey } from '@/constants/query-key';

import { consultarManifestacoes } from '@/services/v2/Fiscal/cte-manifestacao-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ConsultarManifestacoesRequest } from '@/@types/v2/Fiscal/cteManifestacao';
import type { IssuerListItem } from '@/@types/v2/Issuers';

export interface ConsultarDocumentosDialogProps {
  isOpen: boolean;
  onClose: () => void;
  languageGB: LanguageDate;
}

interface ConsultarDocumentosFormValues {
  issue_id: Option<string> | null;
}

const CONSULTAR_FORM_ID = 'cte-manifestacao-consultar-form';

export function ConsultarDocumentosDialog({
  isOpen,
  onClose,
  languageGB,
}: ConsultarDocumentosDialogProps) {
  const text = languageGB.cteManifestacoes.cteManifestacao.consultarDialog;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, watch } = useForm<ConsultarDocumentosFormValues>({
    mode: 'onChange',
    defaultValues: { issue_id: null },
  });

  const issuerOption = watch('issue_id');

  useEffect(() => {
    if (isOpen) reset({ issue_id: null });
  }, [isOpen]);

  function handleClose() {
    reset({ issue_id: null });
    onClose();
  }

  const consultarMutation = useMutation({
    mutationFn: (payload: ConsultarManifestacoesRequest) => consultarManifestacoes(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.cteManifestacoes.cteManifestacoesList] });

      // Toast usa o `message` REAL do backend ("N documento(s)
      // sincronizado(s)."), nunca recomposto no front (fonte única da contagem).
      toaster.success({
        title: languageGB.cteManifestacoes.cteManifestacao.pluralLabel,
        description: response?.message || text.title,
      });

      handleClose();
    },
    onError: (error) => {
      // Erros de operação SEFAZ trazem `errors: { cStat, motivo }` — priorizar o
      // `motivo` claro (ex.: "Emissor sem certificado digital configurado.") em
      // vez do `cStat` cru ("000"). Ver `extractSefazErrorMessage`.
      toaster.error({
        title: languageGB.cteManifestacoes.cteManifestacao.pluralLabel,
        description: extractSefazErrorMessage(error) || text.errorMessage,
      });
    },
  });

  function onSubmit(data: ConsultarDocumentosFormValues) {
    if (!data.issue_id?.value) return;
    consultarMutation.mutate({ issue_id: data.issue_id.value });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !consultarMutation.isPending) handleClose();
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
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Form id={CONSULTAR_FORM_ID} noPadding onSubmit={handleSubmit(onSubmit)}>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    {text.description}
                  </Text>

                  <Controller
                    name="issue_id"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.issuer}
                        placeholder={text.issuerPlaceholder}
                        helperText={text.issuerRequired}
                        service={listIssuers}
                        mapOptions={(item: IssuerListItem) => ({
                          label: item.razao_social,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? undefined}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isReadOnly={consultarMutation.isPending}
                        disablePortal
                      />
                    )}
                  />
                </VStack>
              </Form>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={text.cancelButton}
                variant="outline"
                type="button"
                onClick={handleClose}
                disabled={consultarMutation.isPending}
              />
              <Button
                title={text.submitButton}
                type="submit"
                form={CONSULTAR_FORM_ID}
                loading={consultarMutation.isPending}
                disabled={!issuerOption?.value}
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

export default ConsultarDocumentosDialog;
