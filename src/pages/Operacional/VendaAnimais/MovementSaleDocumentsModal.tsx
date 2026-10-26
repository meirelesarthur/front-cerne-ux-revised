// src/pages/Operacional/VendaAnimais/MovementSaleDocumentsModal.tsx
// -----------------------------------------------------------------------------
// Modal de Documentos (anexos) de Venda de Animais — ação A3 do dropdown
// (Tarefa 17.b, task-packet 17 §3/matriz FID-G3F #1). Copy-adapt da MECÂNICA
// de `Administrativo/Documentos/DocumentoAnexosSection.tsx` (`useFieldArray`
// + `FileUpload` por linha + lookup `uuid → anexo`), MAS com contrato
// PRÓPRIO — `documents[{old_document_uuid,description,date,file}]`, NÃO o
// `{uuid,name,file}` de `DocumentManagementForm` (Tarefa §1.1/DEC-022: NÃO é
// reuso direto do componente/tipo, é acoplado por tipo).
//
// Semântica DESTRUTIVA do diff (§1.4 da Tarefa) — a Action do servidor
// (`StoreMovementSaleDocumentsAction:79-84`) faz `detach()` + DELETE FÍSICO
// de todo `Document` da venda cujo uuid não apareça no payload. Por isso:
//   - o modal SEMPRE envia a lista COMPLETA atual (sem `olds[]`, sem
//     rastreio de "removidos" — mirror `DocumentoAnexosSection`);
//   - remover uma linha JÁ PERSISTIDA (`old_document_uuid` presente) exige
//     confirmação (`DeleteConfirmDialog tone="warning"`) — o servidor apaga
//     o arquivo físico ao salvar;
//   - remover uma linha NOVA (nunca persistida) sai direto — nada a apagar
//     no servidor;
//   - fechar o modal sem salvar NÃO dispara nenhuma request.
//
// Gate de ação: `mov_sale_view` (achado C do task-packet §3.1) — o
// endpoint de escrita é gateado pela permissão de LEITURA, mirror consciente
// do legado (decisão já tomada na camada API). O caller (`index.tsx`) passa
// a ação só quando `canView`.
//
// ---------------------------------------------------------------------------
// VERIFICAÇÃO DO DIFF VAZIO (§1.5 do task-packet, achado B da matriz
// FID-G3F §3.1) — resultado desta Tarefa
// ---------------------------------------------------------------------------
// Não havia ambiente com servidor da API acessível nesta sessão para um
// round-trip HTTP real (sem PHP/artisan disponível no ambiente de execução,
// sem container do `GB.Cerne.Api` no ar) — a verificação abaixo é uma
// ANÁLISE DE CÓDIGO direta contra a fonte real, não um teste HTTP ao vivo,
// e está registrada como tal no Histórico da Tarefa 17.
//
// `MovementSaleDocumentRequest::rules()` (real, `GB.Cerne.Api`) exige
// `'documents' => ['present', 'array']`. Em `multipart/form-data` — o ÚNICO
// wire-format possível aqui, por causa do upload de `file` — uma lista com
// ZERO linhas nunca produz a chave `documents` no corpo: não existe forma de
// o `FormData`/axios do navegador representar "array presente, porém vazio"
// via multipart (diferente de JSON, onde `{"documents":[]}` é perfeitamente
// válido). Confirmado também que o teste automatizado do backend
// (`MovementSaleControllerTest.php`, "stores/replaces/removes...") NUNCA
// exercita esse caso: ele usa o helper de teste do Laravel (`$this->post()`),
// que injeta o array PHP DIRETO na requisição de teste (bypassa a
// serialização real de wire multipart) e sempre mantém ≥1 documento em cada
// chamada. Ou seja, não há cobertura automatizada da remoção do ÚLTIMO
// anexo, e a análise de código aponta 422 ("The documents field must be
// present") como resultado quase certo de uma tentativa real via browser.
//
// Diante disso — e seguindo literalmente a instrução da Tarefa §1.5 para o
// caso de nenhum formato passar — o Salvar fica DESABILITADO com 0 linhas,
// exibindo o motivo (`documents.emptyDiffBlockedMessage`), e um Gap aditivo
// foi aberto ao Arquiteto da API
// (`CORE_WORKSPACE/02-Gaps_Backend_API/GAP-VD-13-...md`, ajuste trivial:
// `documents => ['sometimes','array']`). NUNCA foi simulada a remoção no
// cliente (SEM MOCK). Recomenda-se ao dono confirmar ao vivo contra um
// ambiente real assim que disponível.
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

import { movementSaleDocumentSchema } from '@/validations/schemas/MovementSales/movement-sale-document-schema';

import type { MovementSaleDetail, MovementSaleDocumentsForm } from '@/@types/v2/MovementSales';

import { useMovementSaleDetail, useStoreMovementSaleDocuments } from './useMovementSales';

// Fidelidade ao legado (`SCR-H4`, `documents/create.blade.php:221-486`) —
// PDF-only + 2 MB, NUNCA relaxar para o `ATTACHMENT_ACCEPT` genérico de
// `DocumentoAnexosSection` (Tarefa §1.1).
const DOCUMENT_FILE_ACCEPT = '.pdf';
const DOCUMENT_FILE_MAX_MB = 2;

export interface MovementSaleDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementSaleUuid: string | null;
  movementSaleCode?: string;
}

export function MovementSaleDocumentsModal({
  isOpen,
  onClose,
  movementSaleUuid,
  movementSaleCode,
}: MovementSaleDocumentsModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale;
  const documentsText = text.documents;

  // Fonte ÚNICA de hidratação (§1.3 — não existe `GET .../documents`
  // dedicado, retorna 405) — reaproveita o hook já existente, só habilitado
  // enquanto o modal está aberto. `useMovementSaleDetail` tipa o retorno como
  // `Response<MovementSaleDetail>` (mirror `useCustomFormQueryByGuid`), mas
  // em runtime é o objeto do `useQuery` — mesmo cast `as any` já usado em
  // `MovementSaleDetalhe.tsx` para os campos de status da query.
  const saleQuery = useMovementSaleDetail(isOpen ? (movementSaleUuid ?? undefined) : undefined);
  const detail = saleQuery.data as MovementSaleDetail | undefined;
  const isLoadingDetail = isOpen && ((saleQuery as any).isLoading || (saleQuery as any).isPending);
  const hasLoadError = isOpen && (saleQuery as any).isError;

  const { control, handleSubmit, reset, watch } = useForm<MovementSaleDocumentsForm>({
    resolver: yupResolver(movementSaleDocumentSchema(languageGB)),
    defaultValues: { documents: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  // Hidratação — só a partir do detalhe real (`detail.documents`), nunca
  // fabricada. Reset também ao fechar, para a próxima abertura não herdar
  // estado de uma venda anterior.
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
  // do `FileUpload` contra o dado real do detalhe, nunca inventado (mirror
  // `DocumentoAnexosSection.persistedFileUrlByUuid`).
  const persistedAnexoByUuid: Record<string, string | null> = {};
  (detail?.documents ?? []).forEach((row) => {
    persistedAnexoByUuid[row.uuid] = row.anexo;
  });

  // Confirmação de remoção de linha JÁ PERSISTIDA (§1.4 — apaga arquivo
  // físico ao salvar). Linha nova sai direto, sem confirmação.
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

  const storeDocumentsMutation = useStoreMovementSaleDocuments({
    actionSuccess: () => {
      onClose();
    },
  });

  const isSaving = storeDocumentsMutation.isPending;

  // §1.5 — 0 linhas nunca é um diff representável em multipart real (ver
  // docblock de topo + Histórico da Tarefa). Bloquear o Salvar aqui, com o
  // motivo explícito, é a única alternativa honesta (SEM MOCK) até a API
  // relaxar a regra (`GAP-VD-13`).
  const isEmptyDiffBlocked = fields.length === 0;

  function onSubmit(data: MovementSaleDocumentsForm) {
    // `file` FORA do Yup (mesmo racional de `equipment-schema.ts`) —
    // `required` só quando a linha é NOVA (`old_document_uuid` ausente).
    const nextFileErrors: Record<number, string> = {};
    data.documents.forEach((row, index) => {
      if (!row.old_document_uuid && !row.file) {
        nextFileErrors[index] = documentsText.validation.fileRequired;
      }
    });
    setFileErrors(nextFileErrors);
    if (Object.keys(nextFileErrors).length > 0) return;

    if (!movementSaleUuid || isEmptyDiffBlocked) return;
    storeDocumentsMutation.mutate({ uuid: movementSaleUuid, documents: data.documents });
  }

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          movementSaleCode
            ? documentsText.titleTemplate.replace('{code}', movementSaleCode)
            : documentsText.title
        }
        size="lg"
        scrollableBody
        footer={
          <Flex gap={3}>
            <Button title={languageGB.defaltStrings.cancel} variant="secondary" onClick={onClose} />
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
              onClick={() => (saleQuery as any).refetch()}
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
                      {/* Linha 1 — arquivo atual/novo (chip próprio já traz
                          Substituir/Remover) + ação de remover a linha. Fica
                          isolada em sua própria linha para o chip nunca
                          disputar espaço horizontal com Descrição/Data (era a
                          causa da sobreposição visual reportada). */}
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

                      {/* Linha 2 — Descrição + Data, em grid próprio (nunca
                          compete por largura com o chip de arquivo acima). */}
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
