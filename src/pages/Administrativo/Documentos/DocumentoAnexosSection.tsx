// src/pages/Administrativo/Documentos/DocumentoAnexosSection.tsx
// -----------------------------------------------------------------------------
// Seção "Anexos" do formulário de Documentos (DocumentManagement) —
// Administrativo / Gestão Documentos, Tarefa 13. Adaptação DIRETA de
// `CadastrosBase/Inventario/EquipamentoAnexosTab.tsx`: mesma infraestrutura
// `App\Models\Attachment` — remove a casca de aba (Documentos não tem outras
// seções, cabe tudo numa página só) e NÃO recebe `equipmentData`, mas mantém
// 100% a lógica (`useFieldArray({name:'attachments'})`, `FileUpload` por
// linha com lookup `uuid → file_url`, `IconButtonTable` de remover, botão
// "Adicionar").
//
// Diff por `uuid` é responsabilidade do BACKEND
// (`SyncDocumentManagementAttachmentsAction`, mirror
// `SyncEquipmentAttachmentsAction`): o front sempre envia o array
// `attachments` COMPLETO e atual — uma linha removida do `useFieldArray`
// simplesmente deixa de aparecer no array submetido, e o backend interpreta
// a ausência do `uuid` como remoção. Não há necessidade de rastrear
// "removidos" separadamente no front.
//
// `file_url` do anexo já persistido vem de `documentManagementData.attachments`
// (`GET /document-managements/{uuid}`) — o campo do `useForm`
// (`attachments.*`) só guarda `{uuid, name, file}`, então o "estado
// já-existente" do `FileUpload` é resolvido aqui por um lookup `uuid → file_url`
// contra `documentManagementData`, nunca inventado/mockado.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  DocumentManagementAttachmentRow,
  DocumentManagementData,
  DocumentManagementForm,
} from '@/@types/v2/Documentos';

import type { Control, UseFormWatch } from 'react-hook-form';

export interface DocumentoAnexosSectionProps {
  control: Control<DocumentManagementForm>;
  watch: UseFormWatch<DocumentManagementForm>;
  isLoading: boolean;
  canSave: boolean;
  documentManagementData?: DocumentManagementData;
}

// Aceite client-side deliberadamente amplo — o contrato de API não documenta
// restrição de tipo de arquivo além de `max:10240` KB por arquivo (mirror
// `EquipamentoAnexosTab`/`ATTACHMENT_ACCEPT`).
const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar';

export function DocumentoAnexosSection({
  control,
  watch,
  isLoading,
  canSave,
  documentManagementData,
}: DocumentoAnexosSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.baseRegistrations.documentManagements.form;
  const attachmentText = languageGB.baseRegistrations.documentManagements.attachmentRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });

  const isDisabled = !canSave || isLoading;

  // Lookup `uuid → file_url` do `GET /document-managements/{uuid}` — a linha
  // do RHF (`attachments.*`) não carrega `file_url` (shape de escrita); o
  // link/estado "já-existente" do `FileUpload` é resolvido aqui, contra o
  // dado real do detalhe, nunca inventado.
  const persistedFileUrlByUuid = useMemo(() => {
    const map: Record<string, string | null> = {};
    (documentManagementData?.attachments ?? []).forEach((row: DocumentManagementAttachmentRow) => {
      map[row.uuid] = row.file_url;
    });
    return map;
  }, [documentManagementData]);

  function handleAdd() {
    append({ uuid: null, name: '', file: null });
  }

  return (
    <Box pt={4}>
      <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
          <Text fontSize="sm" fontWeight="semibold">
            {text.sections.attachments}
          </Text>
          <Button
            title={attachmentText.addButton}
            variant="outline"
            type="button"
            onClick={handleAdd}
            disabled={isDisabled}
          />
        </Flex>

        {fields.length === 0 ? (
          <Box py={2}>
            <Text fontSize="sm" color="fg.muted">
              {attachmentText.emptyLabel}
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={4}>
            {fields.map((field, index) => {
              // `uuid`/`name` lidos via `watch` (não `field` do useFieldArray
              // direto) para refletir edições ao vivo do próprio Controller
              // de `name` na resolução do `currentFileName` abaixo.
              const rowUuid = watch(`attachments.${index}.uuid`);
              const rowName = watch(`attachments.${index}.name`);
              const currentFileUrl = rowUuid ? (persistedFileUrlByUuid[rowUuid] ?? null) : null;

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
                      render={({ field: fileField }) => (
                        <FileUpload
                          label={text.fields.attachmentFile}
                          file={fileField.value ?? null}
                          onFileSelected={(file) => fileField.onChange(file)}
                          onRemove={() => fileField.onChange(null)}
                          currentFileUrl={currentFileUrl}
                          currentFileName={rowName || undefined}
                          accept={ATTACHMENT_ACCEPT}
                          disabled={isDisabled}
                          dropzoneTitle={attachmentText.dropzoneTitle}
                          dropzoneDraggingTitle={attachmentText.dropzoneDragging}
                          changeLabel={attachmentText.changeLabel}
                          removeLabel={attachmentText.clearFileLabel}
                          replaceLabel={attachmentText.replaceLabel}
                          existingFileLabel={attachmentText.existingFileLabel}
                          errorTypeMessage={attachmentText.errorType}
                          errorSizeMessage={attachmentText.errorSize}
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
                          label={text.fields.attachmentName}
                          name={nameField.name}
                          maxLength={255}
                          value={nameField.value ?? ''}
                          onChange={(event) => nameField.onChange(event.target.value)}
                          placeholder={attachmentText.defaultName}
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
                    onClick={() => remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
