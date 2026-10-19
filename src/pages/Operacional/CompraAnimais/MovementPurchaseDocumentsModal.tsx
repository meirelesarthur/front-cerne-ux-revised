// src/pages/Operacional/CompraAnimais/MovementPurchaseDocumentsModal.tsx
// -----------------------------------------------------------------------------
// Modal de Documentos (anexos) de Compra de Animais — TASK-CP-08 (contrato
// §4.5/§5, SCR-DOCUMENTS/FORM-DOCUMENTS/SIDEEFFECT-DOCUMENTS-STORE). Mirror
// ESTRUTURAL de `VendaAnimais/MovementSaleDocumentsModal.tsx` — mesma
// composição visual (`CustomDialog`+`useFieldArray`+`FileUpload` por linha,
// `file` fora do Yup, lista sempre completa, confirmação ao remover linha já
// persistida), MAS o WIRE FORMAT enviado ao servidor DIVERGE (ver docblock de
// `movement-purchase-service.ts::buildMovementPurchaseDocumentsFormData` —
// arrays paralelos por índice, não `documents[i][chave]` aninhado). Essa
// divergência é tratada inteiramente na camada de service; este componente
// só monta a lista de `MovementPurchaseDocumentRow[]` (shape de TELA, igual
// a Vendas) e delega ao hook.
//
// `accept=".pdf"` + `maxSizeMb=2` (`MovementPurchaseDocumentRequest::rules()`
// real, `mimes:pdf`+`max:2048` KB — CLM-20 corrigida, validado também no
// servidor).
//
// 0 linhas bloqueia Salvar — `description`/`anexo` são `['required','array']`
// no `MovementPurchaseDocumentRequest` real; em `multipart/form-data` (único
// wire-format possível aqui, por causa do upload de `file`) uma lista com
// ZERO linhas nunca produz as chaves `description[]`/`anexo[]` no corpo —
// mesma limitação real já confirmada e documentada para Vendas
// (`MovementSaleDocumentsModal.tsx`, `GAP-VD-13`). Mesma solução: bloquear o
// Salvar com o motivo explícito, nunca simular a remoção do último anexo
// (SEM MOCK).
//
// Remover uma linha JÁ PERSISTIDA (`old_document_uuid` presente) exige
// confirmação (`DeleteConfirmDialog tone="warning"`) — o servidor apaga o
// arquivo físico ao salvar (`StoreMovementPurchaseDocumentsAction`, detach +
// delete de todo `Document` cujo uuid não apareça em `old_document[]`).
// Remover uma linha NOVA sai direto. Fechar o modal sem salvar não dispara
// nenhuma request.
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

import { resolveStorageUrl } from '@/utils/resolveStorageUrl';

import { movementPurchaseDocumentSchema } from '@/validations/schemas/MovementPurchases/movement-purchase-document-schema';

import type {
  MovementPurchaseDetail,
  MovementPurchaseDocumentsForm,
} from '@/@types/v2/MovementPurchases';

import {
  useMovementPurchaseDetail,
  useStoreMovementPurchaseDocuments,
} from './useMovementPurchases';

// Fidelidade ao legado (mesmo limite físico do documento de Vendas, `SCR-H4`
// equivalente) — NUNCA relaxar para o `ATTACHMENT_ACCEPT` genérico.
const DOCUMENT_FILE_ACCEPT = '.pdf';
const DOCUMENT_FILE_MAX_MB = 2;

export interface MovementPurchaseDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementPurchaseUuid: string | null;
  movementPurchaseCode?: string;
}

export function MovementPurchaseDocumentsModal({
  isOpen,
  onClose,
  movementPurchaseUuid,
  movementPurchaseCode,
}: MovementPurchaseDocumentsModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementPurchases.movementPurchase;
  const documentsText = text.documents;

  // Fonte ÚNICA de hidratação (não existe `GET .../documents` dedicado) —
  // só habilitado enquanto o modal está aberto, mesmo racional de
  // `MovementSaleDocumentsModal.tsx`.
  const purchaseQuery = useMovementPurchaseDetail(
    isOpen ? (movementPurchaseUuid ?? undefined) : undefined
  );
  const detail = purchaseQuery.data as MovementPurchaseDetail | undefined;
  const isLoadingDetail =
    isOpen && ((purchaseQuery as any).isLoading || (purchaseQuery as any).isPending);
  const hasLoadError = isOpen && (purchaseQuery as any).isError;

  const { control, handleSubmit, reset, watch } = useForm<MovementPurchaseDocumentsForm>({
    resolver: yupResolver(movementPurchaseDocumentSchema(languageGB)),
    defaultValues: { documents: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  // Hidratação — só a partir do detalhe real (`detail.documents`), nunca
  // fabricada. Reset também ao fechar, para a próxima abertura não herdar
  // estado de uma compra anterior.
  useEffect(() => {
    if (isOpen && detail) {
      reset({
        documents: (detail.documents ?? []).map((row) => ({
          old_document_uuid: row.uuid,
          description: row.description ?? '',
          date: row.date,
          file: null,
        })),
      });
    }
    if (!isOpen) {
      reset({ documents: [] });
    }
  }, [isOpen, detail, reset]);

  // Lookup `uuid → anexo` (caminho cru do servidor) — resolve `currentFileUrl`
  // do `FileUpload` contra o dado real do detalhe, nunca inventado.
  const persistedAnexoByUuid: Record<string, string | null> = {};
  (detail?.documents ?? []).forEach((row) => {
    persistedAnexoByUuid[row.uuid] = row.anexo;
  });

  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});

  function handleRequestRemove(index: number) {
    const row = watch(`documents.${index}`);
    if (row?.old_document_uuid) {
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
    append({ old_document_uuid: null, description: '', date: null, file: null });
  }

  const storeDocumentsMutation = useStoreMovementPurchaseDocuments({
    actionSuccess: () => {
      onClose();
    },
  });

  const isSaving = storeDocumentsMutation.isPending;

  // 0 linhas nunca é um diff representável em multipart real (ver docblock de
  // topo) — bloquear o Salvar aqui, com o motivo explícito, é a única
  // alternativa honesta (SEM MOCK).
  const isEmptyDiffBlocked = fields.length === 0;

  function onSubmit(data: MovementPurchaseDocumentsForm) {
    // `file` FORA do Yup — `required` só quando a linha é NOVA
    // (`old_document_uuid` ausente), mirror `MovementSaleDocumentsModal`.
    const nextFileErrors: Record<number, string> = {};
    data.documents.forEach((row, index) => {
      if (!row.old_document_uuid && !row.file) {
        nextFileErrors[index] = documentsText.validation.fileRequired;
      }
    });
    setFileErrors(nextFileErrors);
    if (Object.keys(nextFileErrors).length > 0) return;

    if (!movementPurchaseUuid || isEmptyDiffBlocked) return;
    storeDocumentsMutation.mutate({ uuid: movementPurchaseUuid, documents: data.documents });
  }

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          movementPurchaseCode
            ? documentsText.titleTemplate.replace('{code}', movementPurchaseCode)
            : documentsText.title
        }
        size="lg"
        scrollableBody
        // FIX de homologação (mirror `ChargeReportModal.tsx`/
        // `WeaningReportModal.tsx`, GAP-OS-05) — o calendário do `DateInput`
        // (react-datepicker, linha "Data" abaixo) escapa via
        // `portalId="date-input-portal"` para um nó FORA da árvore do
        // `Dialog.Content`. Sem esta exceção, o Dialog v3 (Zag/Ark) — que é
        // `modal` e aplica `pointer-events: none` no `<body>` — trata o
        // clique num dia do calendário como clique-fora e fecha o modal
        // antes de aplicar a data.
        persistentElements={[() => document.getElementById('date-input-portal')]}
        footer={
          <Flex gap={3}>
            <Button title={languageGB.defaltStrings.cancel} variant="outline" onClick={onClose} />
            <Button
              title={languageGB.defaltStrings.save}
              onClick={handleSubmit(onSubmit)}
              loading={isSaving}
              disabled={isSaving || isEmptyDiffBlocked || isLoadingDetail || hasLoadError}
            />
          </Flex>
        }
      >
        {isLoadingDetail ? (
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
              onClick={() => (purchaseQuery as any).refetch()}
            />
          </VStack>
        ) : (
          <Box>
            <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
              <Text fontSize="sm" fontWeight="semibold">
                {documentsText.sectionLabel}
              </Text>
              <Button
                title={documentsText.addButton}
                variant="outline"
                type="button"
                onClick={handleAdd}
                disabled={isSaving}
              />
            </Flex>

            {isEmptyDiffBlocked && (
              <Flex
                align="flex-start"
                gap={2}
                mb={4}
                p={3}
                bg="feedBack.warn"
                borderRadius="lg"
                role="alert"
              >
                <Icon as={FiAlertTriangle} color="feedBack.warnMain" mt={0.5} flexShrink={0} />
                <Text fontSize="xs" color="feedBack.warnMain">
                  {documentsText.emptyDiffBlockedMessage}
                </Text>
              </Flex>
            )}

            {fields.length === 0 ? (
              <Box py={2}>
                <Text fontSize="sm" color="fg.muted">
                  {documentsText.emptyLabel}
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap={4}>
                {fields.map((field, index) => {
                  const rowOldUuid = watch(`documents.${index}.old_document_uuid`);
                  const currentFileUrl = rowOldUuid
                    ? resolveStorageUrl(persistedAnexoByUuid[rowOldUuid])
                    : null;

                  return (
                    <Box
                      key={field.id}
                      p={4}
                      border="1px solid"
                      borderColor="border.subtle"
                      borderRadius="lg"
                    >
                      {/* Linha 1 — arquivo atual/novo + ação de remover a
                          linha, isolada em sua própria linha (mirror
                          `MovementSaleDocumentsModal`). */}
                      <Flex gap={3} align="flex-end" mb={3}>
                        <Box flex="1" minW={0}>
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
                                disabled={isSaving}
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
                        </Box>

                        <IconButtonTable
                          aria-label={documentsText.removeRowButton}
                          mensegerTooltip={documentsText.removeRowButton}
                          size="sm"
                          color="red.500"
                          variant="ghost"
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleRequestRemove(index)}
                          flexShrink={0}
                        >
                          <Icon as={FiTrash2} />
                        </IconButtonTable>
                      </Flex>

                      {/* Linha 2 — Descrição + Data. */}
                      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
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
                              disabled={isSaving}
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
                                disabled={isSaving}
                              />
                            )}
                          />
                        </Box>
                      </SimpleGrid>
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
