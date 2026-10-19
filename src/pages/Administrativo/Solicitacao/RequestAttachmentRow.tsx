// src/pages/Administrativo/Solicitacao/RequestAttachmentRow.tsx
// -----------------------------------------------------------------------------
// Bloco de UI "Anexos" do formulário único de Solicitação de Compras
// (RequestPurchase — Administrativo/Suprimentos, esteira 97-Esteiras/022,
// TASK-RP-FE-07). Mirror ESTRUTURAL de
// `EquipamentoAnexosTab.tsx` (`useFieldArray({name:'attachments'})` +
// `FileUpload` + `Input` de nome + 3 estados visuais vazio/novo/já-existente)
// — mesma leitura de "seção completa" registrada no cabeçalho de
// `RequestItemRow.tsx`. `TASK-RP-FE-09` (formulário único, ainda não
// construído) CONSOME este componente na aba "Anexos".
//
// Diff por `uuid` é responsabilidade do BACKEND (mesmo padrão de
// `SyncEquipmentAttachmentsAction`, aplicado aqui a
// `SyncRequestPurchaseAttachmentsAction`, contrato de API §... store/update):
// o front sempre envia o array `attachments` COMPLETO e atual
// (`RequestPurchasePayload.attachments`), uma linha removida do
// `useFieldArray` simplesmente some do array submetido — o backend
// interpreta ausência de `attachment_uuid` como remoção. Não há necessidade
// de rastrear "removidos" separadamente no front.
//
// `file_url` do anexo já persistido vem de `RequestPurchaseData.attachments`
// (`GET /request-purchases/{uuid}`, contrato §4) — o campo do `useForm`
// (`attachments.*`, `RequestAttachmentFormRow`) só guarda
// `{attachment_uuid, name, file}` (shape de escrita), então o estado
// "já-existente" do `FileUpload` é resolvido aqui por um lookup
// `attachment_uuid → file_url` contra `requestPurchaseData`, nunca
// inventado/mockado — mesma técnica de `persistedFileUrlByUuid` em
// `EquipamentoAnexosTab.tsx`.
//
// -- i18n do `FileUpload` (ADITIVO, ver `@/@types/language/module-request-
//    purchases`) — `TASK-RP-FE-03` não abriu chaves para os textos internos
//    do componente (dropzone/troca/substituição/erros); acrescentadas nesta
//    Tarefa em `attachmentsSection.fileUpload.*` (3 idiomas + tipo), mesma
//    classe de ADITIVO documentada já usada em `itemStatusOptions`
//    (TASK-RP-FE-02) — sem isso, o componente cairia nos defaults em inglês
//    hard-coded do `FileUpload.tsx` (violaria zero string literal).
//
// -- Execução 081 / T-081-FE-05 -----------------------------------------------
// Em F, E e U a lista de anexos é OBRIGATÓRIA (mín. 1 linha, descrição e
// arquivo por linha — PR-N01); os rótulos ganham asterisco e a última linha não
// sai. "Adicionar" fica bloqueado com a última linha incompleta e remover pede
// confirmação (legado IG10, textos literais). Descrição com máximo de 120.
// O comentário antigo sobre `attachments` ausente no detalhe caiu: a API passou
// a eager-load dos anexos (PR-E05).
//
// -- Aceite de arquivo (client-side) -----------------------------------------
// Contrato de API não fecha uma lista de extensões aceitas para anexo de
// Solicitação de Compra (`RequestPurchase-contrato.md` não documenta
// `mimes:` no Form Request de anexo) — lista abaixo é a mesma amplitude
// deliberada de `EquipamentoAnexosTab` (fotos, nota fiscal, contrato, laudo),
// sem travar o usuário; validação definitiva permanece no backend. Tamanho
// máximo (10MB) é o mesmo default do componente `FileUpload` — o contrato
// de API RequestPurchase (regra `attachments.*.file`) não abre uma chave de
// mensagem de tamanho dedicada (mesma lacuna de i18n já documentada em
// `request-purchase-schema.ts`, TASK-RP-FE-05, para o campo `nif`/`phone` —
// aqui não há sequer o limite normativo confirmado, então o default do
// componente é mantido sem reforço adicional).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { ATTACHMENT_NAME_MAX } from '@/validations/schemas/RequestPurchases/request-purchase-schema';

import type {
  RequestAttachmentRow as RequestAttachmentRowData,
  RequestPurchaseData,
  RequestPurchaseForm,
} from '@/@types/v2/RequestPurchases';

import {
  attachmentsRequired,
  canRemoveAttachment,
  emptyAttachmentRow,
  isAttachmentRowIncomplete,
} from './itemRowGuards';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface RequestAttachmentRowProps {
  control: Control<RequestPurchaseForm>;
  errors: FieldErrors<RequestPurchaseForm>;
  watch: UseFormWatch<RequestPurchaseForm>;
  isLoading: boolean;
  canSave: boolean;
  requestPurchaseData?: RequestPurchaseData;
}

// Mesma amplitude deliberada de `EquipamentoAnexosTab` (ver cabeçalho).
const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar';

export function RequestAttachmentRow({
  control,
  errors,
  watch,
  isLoading,
  canSave,
  requestPurchaseData,
}: RequestAttachmentRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form;
  const attachmentText = text.attachmentsSection;
  const fileUploadText = attachmentText.fileUpload;

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });

  const isDisabled = !canSave || isLoading;

  const selectedType = watch('type')?.value ?? null;
  const isRequired = attachmentsRequired(selectedType);
  const guardText = text.guards;
  const [indexToRemove, setIndexToRemove] = useState<number | null>(null);

  // Lookup `attachment_uuid → file_url` do `GET /request-purchases/{uuid}`
  // (eager-loaded) — a linha do RHF não carrega `file_url` (shape de
  // escrita); resolvido aqui contra o dado real do detalhe, nunca inventado.
  const persistedFileUrlByUuid = useMemo(() => {
    const map: Record<string, string | null> = {};
    (requestPurchaseData?.attachments ?? []).forEach((row: RequestAttachmentRowData) => {
      map[row.uuid] = row.file_url;
    });
    return map;
  }, [requestPurchaseData]);

  // IG10 — bloqueia "Adicionar" com a última linha incompleta.
  function handleAdd() {
    const rows = watch('attachments') ?? [];
    if (rows.length > 0 && isAttachmentRowIncomplete(rows[rows.length - 1])) {
      toaster.warning({
        title: guardText.addBlockedTitle,
        description: guardText.addBlockedDescription,
      });
      return;
    }
    append(emptyAttachmentRow());
  }

  // IG10 — remover confirma; em F/E/U a última linha não sai.
  function handleRemoveRequest(index: number) {
    if (!canRemoveAttachment(selectedType, fields.length)) {
      toaster.warning({
        title: guardText.lastItemTitle,
        description: guardText.lastItemDescription,
      });
      return;
    }
    setIndexToRemove(index);
  }

  function handleRemoveConfirm() {
    if (indexToRemove !== null) remove(indexToRemove);
    setIndexToRemove(null);
  }

  return (
    <Box pt={4}>
      <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
          <Text fontSize="sm" fontWeight="semibold">
            {text.tabs.attachments}
          </Text>
          <Button
            title={attachmentText.addButton}
            variant="outline"
            size="sm"
            type="button"
            onClick={handleAdd}
            disabled={isDisabled}
          />
        </Flex>

        {(errors.attachments?.message as string | undefined) && (
          <Text fontSize="xs" color="fg.error" mb={4}>
            {errors.attachments?.message as string}
          </Text>
        )}

        {fields.length === 0 ? (
          <Box py={2}>
            <Text fontSize="sm" color="fg.muted">
              {attachmentText.emptyLabel}
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={4}>
            {fields.map((field, index) => {
              // `attachment_uuid`/`name` lidos via `watch` (não `field` do
              // useFieldArray direto) para refletir edições ao vivo do
              // próprio Controller de `name` na resolução do
              // `currentFileName` abaixo — mesma técnica de
              // `EquipamentoAnexosTab`.
              const rowAttachmentUuid = watch(`attachments.${index}.attachment_uuid`);
              const rowName = watch(`attachments.${index}.name`);
              const currentFileUrl = rowAttachmentUuid
                ? (persistedFileUrlByUuid[rowAttachmentUuid] ?? null)
                : null;

              return (
                <Flex
                  key={field.id}
                  gap={3}
                  align="flex-end"
                  wrap="wrap"
                  pb={4}
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`attachments.${index}.file`}
                      control={control}
                      render={({ field: fileField, fieldState: fileState }) => (
                        <FileUpload
                          label={
                            isRequired
                              ? `${attachmentText.fields.file} *`
                              : attachmentText.fields.file
                          }
                          error={fileState.error?.message}
                          file={fileField.value ?? null}
                          onFileSelected={(file) => fileField.onChange(file)}
                          onRemove={() => fileField.onChange(null)}
                          currentFileUrl={currentFileUrl}
                          currentFileName={rowName || undefined}
                          accept={ATTACHMENT_ACCEPT}
                          disabled={isDisabled}
                          dropzoneTitle={fileUploadText.dropzoneTitle}
                          dropzoneDraggingTitle={fileUploadText.dropzoneDraggingTitle}
                          changeLabel={fileUploadText.changeFileLabel}
                          removeLabel={fileUploadText.removeFileLabel}
                          replaceLabel={fileUploadText.replaceFileLabel}
                          existingFileLabel={fileUploadText.existingFileLabel}
                          errorTypeMessage={fileUploadText.errorTypeMessage}
                          errorSizeMessage={fileUploadText.errorSizeMessage}
                        />
                      )}
                    />
                  </Box>

                  <Box flex="1" minW="220px">
                    <Controller
                      name={`attachments.${index}.name`}
                      control={control}
                      render={({ field: nameField, fieldState }) => (
                        <Input
                          label={attachmentText.fields.name}
                          name={nameField.name}
                          maxLength={ATTACHMENT_NAME_MAX}
                          isRequired={isRequired}
                          value={nameField.value ?? ''}
                          onChange={(event) => nameField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>

                  <IconButtonTable
                    aria-label={attachmentText.removeButton}
                    mensegerTooltip={attachmentText.removeButton}
                    size="sm"
                    color="red.500"
                    variant="ghost"
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleRemoveRequest(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Box>

      <DeleteConfirmDialog
        isOpen={indexToRemove !== null}
        onClose={() => setIndexToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title={guardText.removeConfirmTitle}
        description={guardText.removeConfirmDescription}
        confirmButtonText={guardText.removeConfirm}
        cancelButtonText={guardText.removeCancel}
        warningText=""
        hideQuestionMark
        tone="warning"
      />
    </Box>
  );
}
