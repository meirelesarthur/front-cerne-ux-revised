// src/pages/CadastrosBase/Inventario/EquipamentoAnexosTab.tsx
// -----------------------------------------------------------------------------
// Aba "Anexos" do formulário de Inventário (Equipment — Cadastros Base /
// Bens-Ativos, execução 026, TASK-FE-1009). RN-9 (Doc Bruta §7 / contrato §8):
// N arquivos dinâmicos (adicionar/remover), cada um com `name` (descrição
// livre, default `'Não Informado'` no submit — `CreateOrUpdateEquipamento.tsx`
// já aplica esse fallback via `formText.attachmentRow.defaultName`, ver
// `tryPersistEquipment`) + arquivo.
//
// `features` (multiselect) JÁ IMPLEMENTADO na aba "Identificação" por
// `TASK-FE-1005` (ver `CreateOrUpdateEquipamento.tsx`, Controller
// `name="features"`) — o stub original desta Tarefa já registrava essa
// decisão ("NÃO duplicar aqui"). Este arquivo não reimplementa Features.
//
// Composição (sem precedente pronto — 2 padrões combinados, mirror da
// Tarefa): `useFieldArray({ name: 'attachments' })` (mesmo mecanismo de
// `ApportionmentsSection` de `CostCenter`) + `FileUpload`
// (`src/components/Form/FileUpload.tsx`, já usado em
// `PlanAccountImportModal.tsx`) por linha, que já resolve os 3 estados
// visuais (vazio/novo-arquivo/já-existente) nativamente.
//
// Diff por `uuid` é responsabilidade do BACKEND (`SyncEquipmentAttachmentsAction`,
// TASK-BE-702): o front sempre envia o array `attachments` COMPLETO e atual
// (`EquipmentPayload.attachments`, `@/@types/v2/Equipments`) — uma linha
// removida do `useFieldArray` simplesmente deixa de aparecer no array
// submetido, e o backend interpreta a ausência do `uuid` como remoção (mirror
// do `array_diff($existingIds, $request->olds)` do legado). Não há
// necessidade de rastrear "removidos" separadamente no front.
//
// `file_url` do anexo já persistido vem de `equipmentData.attachments`
// (`GET /equipments/{uuid}`, eager-load `attachments` — premissa §14.2/Doc
// Bruta) — o campo do `useForm` (`attachments.*`) só guarda
// `{uuid, name, file}` (mirror `EquipmentPayload`), então o "estado
// já-existente" do `FileUpload` é resolvido aqui por um lookup `uuid → file_url`
// contra `equipmentData`, nunca inventado/mockado.
//
// Contrato consumido: Equipment-Frontend-Contrato.md §8 (Anexos) + Doc Bruta
// §7 (RN-9) + `equipment-schema.ts` (`attachments`, TASK-FE-1003 — CONSUMIDO,
// não reescrito).
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

import type { EquipmentAttachmentRow, EquipmentData, EquipmentForm } from '@/@types/v2/Equipments';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface EquipamentoAnexosTabProps {
  control: Control<EquipmentForm>;
  errors: FieldErrors<EquipmentForm>;
  watch: UseFormWatch<EquipmentForm>;
  setValue: UseFormSetValue<EquipmentForm>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
  equipmentData?: EquipmentData;
}

// Aceite client-side deliberadamente amplo — RN-9/Doc Bruta não documentam
// restrição de tipo de arquivo no legado (`<input type="file"
// name="attachments[]">` sem `accept`, `EquipmentRequest::rules()` não valida
// mime). Lista cobre os formatos reais de "anexo" de bens/ativos (fotos, nota
// fiscal, contrato, laudo) sem travar o usuário — validação definitiva
// permanece no backend.
const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar';

export function EquipamentoAnexosTab({
  control,
  watch,
  isLoading,
  canSave,
  equipmentData,
}: EquipamentoAnexosTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipments.equipment.form;
  const attachmentText = text.attachmentRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });

  const isDisabled = !canSave || isLoading;

  // Lookup `uuid → file_url` do `GET /equipments/{uuid}` (whenLoaded) — a
  // linha do RHF (`attachments.*`) não carrega `file_url` (shape de escrita,
  // mirror `EquipmentPayload.attachments`); o link/estado "já-existente" do
  // `FileUpload` é resolvido aqui, contra o dado real do detalhe, nunca
  // inventado.
  const persistedFileUrlByUuid = useMemo(() => {
    const map: Record<string, string | null> = {};
    (equipmentData?.attachments ?? []).forEach((row: EquipmentAttachmentRow) => {
      map[row.uuid] = row.file_url;
    });
    return map;
  }, [equipmentData]);

  function handleAdd() {
    append({ uuid: null, name: '', file: null });
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
