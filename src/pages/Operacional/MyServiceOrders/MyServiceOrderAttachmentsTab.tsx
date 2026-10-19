// src/pages/Operacional/MyServiceOrders/MyServiceOrderAttachmentsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Anexos" do form de execução de Minhas OS (MyServiceOrder) — esteira
// 063 (TASK-MOS-FE-07). Mirror 1:1 `CadastrosBase/Inventario/
// EquipamentoAnexosTab.tsx` (contrato de tela §3, FLD-38..40): STANDALONE
// nesta wave, ainda não montado em nenhum form (TASK-MOS-FE-05, fora desta
// wave, importa e monta este componente dentro de um `Tabs.Content`).
//
// `useFieldArray({ name: 'attachments' })` + `FileUpload` por linha (`file`
// via `Controller`) + `Input` de `name` (obrigatório só quando há `file`
// novo na mesma linha, mirror schema TASK-MOS-FE-03/`required_with:
// attachments.*.file` do `MyServiceOrderExecutionRequest` real).
//
// Diff por `uuid` é responsabilidade do BACKEND
// (`SyncMyServiceOrderAttachmentsAction`, já confirmado no `01-contrato-fatia`
// §2 RT-03): o front SEMPRE envia o array `attachments` COMPLETO e atual —
// uma linha removida do `useFieldArray` simplesmente deixa de aparecer no
// array submetido; o front NUNCA calcula "o que foi removido".
//
// Lookup `uuid → url` do `GET /my-service-orders/{uuid}`
// (`MyServiceOrderDetail.attachments`) — a linha do RHF (`attachments.*`) não
// carrega `url` (shape de escrita, mirror `MyServiceOrderAttachmentRow`); o
// estado "já-existente" do `FileUpload` é resolvido aqui contra o dado real
// do detalhe (prop `myServiceOrderData`), nunca inventado/mockado.
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
  MyServiceOrderAttachment,
  MyServiceOrderDetail,
  MyServiceOrderExecutionForm,
} from '@/@types/v2/MyServiceOrders';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface MyServiceOrderAttachmentsTabProps {
  control: Control<MyServiceOrderExecutionForm>;
  errors?: FieldErrors<MyServiceOrderExecutionForm>;
  watch: UseFormWatch<MyServiceOrderExecutionForm>;
  isLoading?: boolean;
  canSave?: boolean;
  myServiceOrderData?: MyServiceOrderDetail;
}

// Restrição vinda da API (`MyServiceOrderExecutionRequest`: ATTACHMENT_MIMES e
// ATTACHMENT_MAX_KB = 10240 — TASK-090-API-06/DEC-400) e EXCLUSIVA desta tela;
// as demais telas de anexo mantêm constante própria.
const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt';
const ATTACHMENT_MAX_SIZE_MB = 10;

export function MyServiceOrderAttachmentsTab({
  control,
  watch,
  isLoading = false,
  canSave = true,
  myServiceOrderData,
}: MyServiceOrderAttachmentsTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.myServiceOrders.myServiceOrder.form;
  const attachmentText = text.attachmentRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });

  const isDisabled = !canSave || isLoading;

  // Lookup `uuid → url` do `GET /my-service-orders/{uuid}` — a linha do RHF
  // (`attachments.*`) não carrega `url` (mirror `persistedFileUrlByUuid` do
  // molde), nunca inventado.
  const persistedFileUrlByUuid = useMemo(() => {
    const map: Record<string, string | null> = {};
    (myServiceOrderData?.attachments ?? []).forEach((row: MyServiceOrderAttachment) => {
      map[row.uuid] = row.url;
    });
    return map;
  }, [myServiceOrderData]);

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
              {attachmentText.defaultName}
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
                      render={({ field: fileField, fieldState }) => (
                        <FileUpload
                          label={text.fields.attachmentFile}
                          file={fileField.value ?? null}
                          onFileSelected={(file) => fileField.onChange(file)}
                          onRemove={() => fileField.onChange(null)}
                          currentFileUrl={currentFileUrl}
                          currentFileName={rowName || undefined}
                          accept={ATTACHMENT_ACCEPT}
                          maxSizeMb={ATTACHMENT_MAX_SIZE_MB}
                          hint={attachmentText.hint}
                          error={fieldState.error?.message}
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
                          maxLength={100}
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
