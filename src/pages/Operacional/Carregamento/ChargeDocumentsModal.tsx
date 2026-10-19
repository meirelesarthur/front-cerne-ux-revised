// src/pages/Operacional/Carregamento/ChargeDocumentsModal.tsx
// -----------------------------------------------------------------------------
// Modal de Documentos (anexos PDF) do Carregamento — TASK-FE-CG-06, mirror
// ESTRUTURAL de `Operacional/VendaAnimais/MovementSaleDocumentsModal.tsx`
// (`useFieldArray` + `FileUpload` por linha + confirmação de remoção de
// linha já persistida), MAS com 2 diferenças reais confirmadas contra o
// backend (`ChargeController`/`ChargeDocumentRequest`/`ChargeDocumentItemData`):
//
//   1. Hidratação por ENDPOINT PRÓPRIO (`GET /charges/{uuid}/documents`,
//      `useChargeDocuments`) — `MovementSale` reusa o detalhe da venda, mas
//      `Charge` tem uma Action dedicada (`ListChargeDocumentsAction`).
//   2. `documents: []` é um diff PLENAMENTE representável aqui — o mirror
//      bloqueia o Salvar com 0 linhas porque nenhuma forma de `FormData`
//      multipart consegue enviar `documents` "presente e vazio". Este modal
//      NÃO tem esse bloqueio: `syncChargeDocuments` (`charge-service.ts`)
//      só monta multipart quando alguma linha carrega um `File` novo; sem
//      upload binário (inclusive 0 linhas), o mesmo diff viaja como JSON
//      puro (`{documents:[]}`), que `ChargeDocumentRequest::rules()`
//      (`'documents' => ['present','array']`) aceita normalmente — ver
//      docblock de `syncChargeDocuments`.
//
// Contrato de linha PRÓPRIO — `{document_uuid, description, date, file}`
// (`document_uuid`, NÃO `old_document_uuid` do mirror — nome real
// confirmado em `ChargeDocumentItemData`).
//
// Gate: abrir o modal e LER (`GET .../documents`) exige só `charge_view`
// (`ChargeController::middleware()`); SALVAR o diff (`POST`) exige
// `charge_edit` — diferente do mirror `MovementSale` (gateado por
// `movement_sales_view` nos dois verbos, achado C documentado lá). Por
// isso este modal recebe `canEdit` e desabilita o footer de escrita para
// quem só tem `charge_view` (visualização honesta, sem 403 surpresa).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { chargeDocumentSchema } from '@/validations/schemas/Carregamentos/charge-document-schema';

import type { ChargeDocumentItem, ChargeDocumentsForm } from '@/@types/v2/Carregamentos';

import { useChargeDocuments, useSyncChargeDocuments } from './useCarregamentos';

// Fidelidade ao contrato real (`ChargeDocumentRequest::rules()`,
// `mimes:pdf|max:2048`) — NUNCA relaxar para um `accept` genérico.
const DOCUMENT_FILE_ACCEPT = '.pdf';
const DOCUMENT_FILE_MAX_MB = 2;

export interface ChargeDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeUuid: string | null;
  chargeCode?: number;
  /** `charge_edit` — gate de ESCRITA (ver docblock de topo). */
  canEdit: boolean;
}

export function ChargeDocumentsModal({
  isOpen,
  onClose,
  chargeUuid,
  chargeCode,
  canEdit,
}: ChargeDocumentsModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.carregamentos.charge;
  const documentsText = text.documents;

  // Endpoint DEDICADO (§1 do docblock de topo) — só habilitado enquanto o
  // modal está aberto, mirror `useMovementSaleDetail(isOpen ? uuid : undefined)`.
  const documentsQuery = useChargeDocuments(isOpen ? (chargeUuid ?? undefined) : undefined);
  const documents = documentsQuery.data as ChargeDocumentItem[] | undefined;
  const isLoadingDocuments = isOpen && (documentsQuery.isLoading || documentsQuery.isPending);
  const hasLoadError = isOpen && documentsQuery.isError;

  const { control, handleSubmit, reset, watch } = useForm<ChargeDocumentsForm>({
    resolver: yupResolver(chargeDocumentSchema(languageGB)),
    defaultValues: { documents: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  // Hidratação — só a partir do dado real do endpoint dedicado, nunca
  // fabricada. Reset também ao fechar, para a próxima abertura não herdar
  // estado de um carregamento anterior.
  useEffect(() => {
    if (isOpen && documents) {
      reset({
        documents: documents.map((row) => ({
          document_uuid: row.uuid,
          description: row.description ?? '',
          date: row.date,
          file: null,
        })),
      });
    }
    if (!isOpen) {
      reset({ documents: [] });
    }
  }, [isOpen, documents, reset]);

  // Lookup `uuid → url` — resolve `currentFileUrl` do `FileUpload` contra o
  // dado real do endpoint dedicado (`ChargeDocumentItem.url` já vem
  // ABSOLUTA/pronta do `DocumentResource`, sem precisar de
  // `resolveStorageUrl` — diferente do mirror `MovementSale`, cujo `anexo`
  // é um caminho relativo cru).
  const persistedUrlByUuid: Record<string, string | null> = {};
  (documents ?? []).forEach((row) => {
    persistedUrlByUuid[row.uuid] = row.url;
  });

  // Confirmação de remoção de linha JÁ PERSISTIDA — apaga o arquivo físico
  // no servidor ao salvar. Linha nova sai direto, sem confirmação.
  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});

  function handleRequestRemove(index: number) {
    const row = watch(`documents.${index}`);
    if (row?.document_uuid) {
      setRowIndexToRemove(index);
    } else {
      remove(index);
    }
  }

  function handleConfirmRemove() {
    if (rowIndexToRemove !== null) {
      remove(rowIndexToRemove);
      setRowIndexToRemove(null);
    }
  }

  function handleAdd() {
    append({ document_uuid: null, description: '', date: null, file: null });
  }

  const syncDocumentsMutation = useSyncChargeDocuments({
    actionSuccess: () => {
      onClose();
    },
  });

  const isSaving = syncDocumentsMutation.isPending;

  function onSubmit(data: ChargeDocumentsForm) {
    // `file` FORA do Yup — `required` só quando a linha é NOVA
    // (`document_uuid` ausente), mesmo racional de `equipment-schema.ts`.
    const nextFileErrors: Record<number, string> = {};
    data.documents.forEach((row, index) => {
      if (!row.document_uuid && !row.file) {
        nextFileErrors[index] = documentsText.validation.fileRequired;
      }
    });
    setFileErrors(nextFileErrors);
    if (Object.keys(nextFileErrors).length > 0) return;

    if (!chargeUuid) return;
    syncDocumentsMutation.mutate({ uuid: chargeUuid, documents: data.documents });
  }

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          chargeCode
            ? documentsText.titleTemplate.replace('{code}', String(chargeCode))
            : documentsText.title
        }
        size="lg"
        scrollableBody
        // FIX de homologação (mirror EXATO `ChargeReportModal.tsx:156`/
        // `Weaning/WeaningReportModal.tsx:133`, GAP-OS-05) — o calendário do
        // `DateInput` escapa via portal próprio (`portalId="date-input-portal"`,
        // fora da árvore do `Dialog.Content`); sem `persistentElements`, o
        // Dialog v3 trata o clique num dia como clique-fora e fecha o modal
        // antes de aplicar a data. `ChargeDocumentsModal` usa `CustomDialog`
        // (não o `Dialog.Root` cru dos 2 irmãos acima) — o passthrough
        // opcional foi adicionado em `CustomDialog.tsx` para poder aplicar o
        // MESMO fix aqui sem duplicar a estrutura de `Dialog.Root`.
        persistentElements={[() => document.getElementById('date-input-portal')]}
        footer={
          <Flex gap={3}>
            <Button title={languageGB.defaltStrings.cancel} variant="outline" onClick={onClose} />
            {canEdit && (
              <Button
                title={languageGB.defaltStrings.save}
                onClick={handleSubmit(onSubmit)}
                loading={isSaving}
                disabled={isSaving || isLoadingDocuments || hasLoadError}
              />
            )}
          </Flex>
        }
      >
        {isLoadingDocuments ? (
          <VStack align="stretch" gap={3}>
            <Skeleton height="60px" borderRadius="lg" />
            <Skeleton height="60px" borderRadius="lg" />
          </VStack>
        ) : hasLoadError ? (
          <VStack gap={3} py={6}>
            <Icon as={FiAlertTriangle} boxSize={8} color="feedBack.errorMain" />
            <Text color="fg.muted">{documentsText.loadError}</Text>
            <Button
              variant="outline"
              title={documentsText.retry}
              onClick={() => documentsQuery.refetch()}
            />
          </VStack>
        ) : (
          <Box>
            <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
              <Text fontSize="sm" fontWeight="semibold">
                {documentsText.sectionLabel}
              </Text>
              {canEdit && (
                <Button
                  title={documentsText.addButton}
                  variant="outline"
                  type="button"
                  onClick={handleAdd}
                  disabled={isSaving}
                />
              )}
            </Flex>

            {fields.length === 0 ? (
              <Box py={2}>
                <Text fontSize="sm" color="fg.muted">
                  {documentsText.emptyLabel}
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap={4}>
                {fields.map((field, index) => {
                  const rowUuid = watch(`documents.${index}.document_uuid`);
                  const currentFileUrl = rowUuid ? (persistedUrlByUuid[rowUuid] ?? null) : null;

                  return (
                    <Box
                      key={field.id}
                      p={4}
                      border="1px solid"
                      borderColor="border.subtle"
                      borderRadius="lg"
                    >
                      {/* Linha 1 — arquivo atual/novo, SOZINHO na própria
                          linha, largura cheia do card. FIX de homologação
                          (item #2, execução 045): antes dividia a largura com
                          o botão "Remover documento" num `Flex align="flex-
                          end"` — no idioma pt-BR os rótulos "Alterar
                          arquivo"/"Remover arquivo" do chip do `FileUpload`
                          não cabiam no espaço reduzido e o "X" do botão
                          "Remover arquivo" ultrapassava a borda do card. */}
                      <Controller
                        name={`documents.${index}.file`}
                        control={control}
                        render={({ field: fileField }) => (
                          <FileUpload
                            label={documentsText.fields.file}
                            file={fileField.value ?? null}
                            onFileSelected={(file) => {
                              fileField.onChange(file);
                              setFileErrors((prev) => {
                                if (!(index in prev)) return prev;
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }}
                            onRemove={() => fileField.onChange(null)}
                            currentFileUrl={currentFileUrl}
                            accept={DOCUMENT_FILE_ACCEPT}
                            maxSizeMb={DOCUMENT_FILE_MAX_MB}
                            disabled={isSaving || !canEdit}
                            error={fileErrors[index]}
                            dropzoneTitle={documentsText.dropzoneTitle}
                            dropzoneDraggingTitle={documentsText.dropzoneDraggingTitle}
                            changeLabel={documentsText.changeLabel}
                            removeLabel={documentsText.removeFileLabel}
                            replaceLabel={documentsText.replaceLabel}
                            existingFileLabel={documentsText.existingFileLabel}
                            errorTypeMessage={documentsText.errorType}
                            errorSizeMessage={documentsText.errorSize}
                          />
                        )}
                      />

                      {/* Linha 2 — Descrição + Data, em grid próprio (nunca
                          compete por largura com o chip de arquivo acima). */}
                      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} mt={3}>
                        <Controller
                          name={`documents.${index}.description`}
                          control={control}
                          render={({ field: descField, fieldState }) => (
                            <Input
                              label={documentsText.fields.description}
                              name={descField.name}
                              maxLength={50}
                              value={descField.value ?? ''}
                              onChange={(event) => descField.onChange(event.target.value)}
                              error={fieldState.error?.message}
                              disabled={isSaving || !canEdit}
                            />
                          )}
                        />

                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={1}>
                            {documentsText.fields.date}
                          </Text>
                          <Controller
                            name={`documents.${index}.date`}
                            control={control}
                            render={({ field: dateField }) => (
                              <DateInput
                                value={dateField.value ?? null}
                                onChange={dateField.onChange}
                                disabled={isSaving || !canEdit}
                              />
                            )}
                          />
                        </Box>
                      </SimpleGrid>

                      {/* Linha 3 — ação de remover a linha, na PRÓPRIA linha
                          à direita, mirror do padrão de remover-linha já
                          usado no módulo (`ChargeItemRow.tsx`/
                          `ChargeExpenseRow.tsx`: `Flex justify="flex-end"
                          mt={3}` após o conteúdo da linha, nunca espremido ao
                          lado de outro controle). */}
                      {canEdit && (
                        <Flex justify="flex-end" mt={3}>
                          <IconButtonTable
                            aria-label={documentsText.removeRowButton}
                            mensegerTooltip={documentsText.removeRowButton}
                            size="sm"
                            color="red.500"
                            variant="ghost"
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleRequestRemove(index)}
                          >
                            <Icon as={FiTrash2} />
                          </IconButtonTable>
                        </Flex>
                      )}
                    </Box>
                  );
                })}
              </Flex>
            )}
          </Box>
        )}
      </CustomDialog>

      <DeleteConfirmDialog
        isOpen={rowIndexToRemove !== null}
        onClose={() => setRowIndexToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={documentsText.removeRowConfirm.title}
        description={documentsText.removeRowConfirm.description}
        warningText={documentsText.removeRowConfirm.warning}
        confirmButtonText={documentsText.removeRowConfirm.confirm}
        hideQuestionMark
        tone="warning"
        colorPalette="orange"
      />
    </>
  );
}
