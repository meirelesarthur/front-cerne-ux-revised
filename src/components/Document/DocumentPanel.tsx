// src/components/Document/DocumentPanel.tsx
// -----------------------------------------------------------------------------
// Componente COMPARTILHADO de gestão de Documentos Anexos de 1 título — lista
// (`GET /{segment}/{uuid}/documents`) + upload (`POST .../documents`) +
// remoção (`DELETE .../documents/{documentUuid}`) — TASK-FE-036-338, ONDA 3
// sub-onda 3c. Consumido tanto por Contas a Receber (`segment='incomes'`,
// TASK-FE-036-339) quanto pela fatia irmã de Contas a Pagar
// (`segment='expenses'`, embutido num Drawer — CaP não tem tela de Detalhe
// própria). NÃO DUPLICAR — nenhum import de `@/services/v2/Incomes/**`/
// `@/services/v2/Financeiro/Expenses/**`/`usePermissions` aqui dentro: as 3
// permissões (`incomedocument_view/create/delete` — nunca `incomes_edit`,
// Tarefa 337) chegam como PROPS booleanas já resolvidas pelo CONSUMIDOR.
//
// UM painel só (diferente da Baixa, que precisou de 2 componentes) — os 3
// verbos são simples o bastante para caber numa composição única, mirror da
// própria página única de gestão do legado ("Documentos", DOC-BRUTA-B06 §C.3).
//
// Adaptação deliberada vs. o legado (registrada, NÃO é fidelidade quebrada): o
// legado sincronizava tudo num único POST ao clicar "Salvar" (sem AJAX, sem
// persistência imediata). A API migrada é REST de verdade — 1 upload = 1
// POST imediato, 1 remoção = 1 DELETE imediato, SEM "modo de rascunho" (mirror
// do padrão já estabelecido por `WriteOffActiveList`).
//
// Documento é COMPARTILHÁVEL entre títulos (Tarefa 337) — o DELETE só faz
// `detach()` do título corrente. O texto de confirmação de remoção é NEUTRO
// (nunca "excluído permanentemente"), porque o documento pode sobreviver no(s)
// outro(s) título(s) vinculado(s).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, EmptyState, Flex, Icon, Link, Skeleton, Table, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiInbox } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { documentSchemaResolver } from '@/validations/schemas/Document/document-schema';

import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from '@/services/v2/Document/document-service';

import type { DocumentListItem, DocumentSegment, DocumentUploadForm } from '@/@types/v2/Document';

export interface DocumentPanelProps {
  segment: DocumentSegment;
  titleUuid: string;
  /** `incomedocument_view`/`expensedocument_view` já resolvido pelo consumidor. */
  canView: boolean;
  /** `incomedocument_create`/`expensedocument_create` já resolvido pelo consumidor. */
  canUpload: boolean;
  /** `incomedocument_delete`/`expensedocument_delete` já resolvido pelo consumidor. */
  canDelete: boolean;
  /** Disparado após upload/remoção com sucesso — o CONSUMIDOR decide o que invalidar (ex.: `documents_count`). */
  onChanged?: () => void;
}

function todayIso(): string {
  return todayLocalIso();
}

export function DocumentPanel({
  segment,
  titleUuid,
  canView,
  canUpload,
  canDelete,
  onChanged,
}: DocumentPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.document.panel;
  const queryClient = useQueryClient();

  // Query key PRÓPRIA deste componente — NUNCA a constante de query-key de
  // Income/Expense (mirror `WriteOffActiveList`).
  const documentsQueryKey = ['documents-panel', segment, titleUuid];

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: async () => {
      const response = await listDocuments(segment, titleUuid);
      return response.data;
    },
    enabled: canView && isValidGuid(titleUuid),
    retry: false,
  });

  const isLoading = documentsQuery.isLoading || documentsQuery.isPending;
  const items = documentsQuery.data ?? [];

  function invalidateList() {
    queryClient.invalidateQueries({ queryKey: documentsQueryKey });
  }

  // ---- Upload — POST /{segment}/{titleUuid}/documents ----
  const [file, setFile] = useState<File | null>(null);
  const [fileServerError, setFileServerError] = useState<string | undefined>(undefined);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting: isValidating },
  } = useForm<DocumentUploadForm>({
    resolver: documentSchemaResolver(languageGB),
    defaultValues: { description: '', date: todayIso() },
  });

  function handleFileSelected(selected: File | null) {
    setFile(selected);
    setFileServerError(undefined);
  }

  function handleFileRemove() {
    setFile(null);
    setFileServerError(undefined);
  }

  // `useMutation` DIRETO (NÃO `useRequest`): o componente compartilhado não
  // conhece `queryKey` de Income/Expense — quem invalida a lista do próprio
  // título é este painel (`documentsQueryKey`, próprio); o CONSUMIDOR invalida
  // o que for dele (ex.: `documents_count`) via `onChanged`.
  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentUploadForm) => {
      return uploadDocument(segment, titleUuid, {
        file: file as File,
        description: data.description,
        date: data.date ?? undefined,
      });
    },
    onSuccess: () => {
      toaster.success({
        title: text.upload.sectionTitle,
        description: text.upload.uploadedToast,
        duration: 6000,
      });
      reset({ description: '', date: todayIso() });
      setFile(null);
      setFileServerError(undefined);
      invalidateList();
      onChanged?.();
    },
    onError: (error) => {
      // 422 de MIME/tamanho (`errors.file`) — feedback JUNTO ao FileUpload
      // (reaproveita o `error` do campo), não um toast genérico (DoD da
      // Tarefa 338). Qualquer outro erro (404 do título, 403, etc.) cai no
      // toast genérico da API, mirror `WriteOffCreateModal`.
      const fileFieldMessage = isAxiosError(error)
        ? ((error.response?.data as any)?.errors?.file?.[0] as string | undefined)
        : undefined;
      if (fileFieldMessage) {
        setFileServerError(fileFieldMessage);
        return;
      }
      const message = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({ title: text.upload.sectionTitle, description: message, duration: 7000 });
    },
  });

  function onSubmitUpload(data: DocumentUploadForm) {
    if (!file) return;
    uploadMutation.mutate(data);
  }

  const isUploading = uploadMutation.isPending || isValidating;

  // ---- Remoção — DELETE /{segment}/{titleUuid}/documents/{documentUuid} ----
  const [documentToDelete, setDocumentToDelete] = useState<DocumentListItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (documentUuid: string) => deleteDocument(segment, titleUuid, documentUuid),
    onSuccess: () => {
      toaster.success({
        title: text.title,
        description: text.list.removedToast,
        duration: 6000,
      });
      setDocumentToDelete(null);
      invalidateList();
      onChanged?.();
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({ title: text.title, description: message, duration: 7000 });
      setDocumentToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  // Defensivo (Roteiro da Tarefa 338) — o gate real fica na integração
  // (Tarefa 339), que nem deveria montar o componente com `canView=false`.
  if (!canView) return null;

  return (
    <VStack align="stretch" gap={6}>
      {canUpload && (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {text.upload.sectionTitle}
          </Text>
          <form onSubmit={handleSubmit(onSubmitUpload)}>
            <Flex direction="column" gap={4}>
              <FileUpload
                label={text.upload.fileUpload.label}
                hint={text.upload.fileUpload.hint}
                accept=".pdf"
                maxSizeMb={2}
                file={file}
                onFileSelected={handleFileSelected}
                onRemove={handleFileRemove}
                disabled={isUploading}
                dropzoneTitle={text.upload.fileUpload.dropzoneTitle}
                dropzoneDraggingTitle={text.upload.fileUpload.dropzoneDraggingTitle}
                changeLabel={text.upload.fileUpload.changeLabel}
                removeLabel={text.upload.fileUpload.removeLabel}
                errorTypeMessage={text.upload.fileUpload.errorTypeMessage}
                errorSizeMessage={text.upload.fileUpload.errorSizeMessage}
                error={fileServerError}
              />

              <Flex gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        name={field.name}
                        label={text.upload.fields.description}
                        placeholder={text.upload.placeholders.description}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                        maxLength={50}
                        disabled={isUploading}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '200px' }}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field label={text.upload.fields.date} errorText={fieldState.error?.message}>
                        <DateInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isUploading}
                        />
                      </Field>
                    )}
                  />
                </Box>
              </Flex>

              <Flex justify="flex-end">
                <Button
                  title={text.upload.submitButton}
                  type="submit"
                  loading={isUploading}
                  disabled={isUploading || !file}
                />
              </Flex>
            </Flex>
          </form>
        </Box>
      )}

      <Box>
        {isLoading ? (
          <VStack align="stretch" gap={2}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </VStack>
        ) : items.length === 0 ? (
          <EmptyState.Root size="sm">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiInbox} boxSize={6} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                <EmptyState.Description>{text.list.emptyState.description}</EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root size="sm" variant="outline" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{text.list.columns.description}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.list.columns.date}</Table.ColumnHeader>
                <Table.ColumnHeader />
                <Table.ColumnHeader />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.uuid}>
                  <Table.Cell>{item.description || '—'}</Table.Cell>
                  <Table.Cell>{item.date ? formatDate(item.date) : '—'}</Table.Cell>
                  <Table.Cell>
                    {item.url ? (
                      // Link público direto (Tarefa 337 confirmou: `url` já é
                      // usável sem lógica extra de assinatura/token).
                      <Link href={item.url} target="_blank" rel="noopener noreferrer" fontSize="sm">
                        {text.list.downloadLabel}
                      </Link>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    {canDelete && (
                      <Flex justify="flex-end">
                        <Button
                          title={text.list.removeAction}
                          variant="ghost"
                          size="sm"
                          colorPalette="red"
                          disabled={isDeleting}
                          onClick={() => setDocumentToDelete(item)}
                        />
                      </Flex>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Texto NEUTRO (Tarefa 337) — o documento pode estar compartilhado com
          outro título e sobreviver ao `detach` desta remoção. */}
      <DeleteConfirmDialog
        isOpen={documentToDelete !== null}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() => {
          if (documentToDelete) deleteMutation.mutate(documentToDelete.uuid);
        }}
        isLoading={isDeleting}
        title={text.list.removeConfirmTitle}
        description={text.list.removeConfirmDescription}
        confirmButtonText={text.list.removeAction}
        hideQuestionMark
        tone="warning"
        colorPalette="orange"
      />
    </VStack>
  );
}
