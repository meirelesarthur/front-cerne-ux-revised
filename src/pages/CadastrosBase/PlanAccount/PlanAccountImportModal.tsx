// src/pages/CadastrosBase/PlanAccount/PlanAccountImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xlsx) do Plano de Contas — TASK-PA-08.
//
// Fiel ao layout do `PlanoContasImportModal.tsx` do UX oficial (`ux_root`,
// commit `f4507327`) — download do modelo + instruções + aviso + upload +
// submissão + lista de erros — MAS com 2 correções de conteúdo (Roteiro
// ROTEIRO-02, Achado 2):
//
//   1. O aviso do UX descreve um replace-total client-side do mock (contas
//      ausentes some do sistema, sem ressalva) — comportamento que a API real
//      NÃO tem. O backend faz EXCLUSÃO SEGURA (`ImportPlanAccountAction`/
//      DEC-016): contas ausentes só são excluídas se não estiverem em uso; as
//      em uso são preservadas e reportadas em `data.preserved[]`. O texto
//      abaixo (i18n, `excel.import.warning.*`) reflete o comportamento REAL —
//      não copia a redação do mock do UX.
//   2. O relatório de `preserved[]` é elemento NOVO sem precedente direto no
//      UX (mock não tem esse conceito) — reaproveita o MESMO padrão visual
//      da caixa de erro do UX (`AlertTriangle`/caixa colorida + lista), só
//      trocando o tom (warning) e o conteúdo (`code — description (motivo)`).
//
// Usa `Dialog` nativo do Chakra v3 diretamente (mesmo primitivo de
// `src/components/DeleteConfirmDialog.tsx` — sem wrapper `Modal` genérico
// novo, catálogo real do projeto não tem um wrapper amplo o bastante para
// este layout de 3 etapas).
//
// Máquina de estados: `step: 'upload' | 'result'` — a etapa "erro de linhas"
// NÃO é um step à parte: `rowErrors` é mostrado dentro da própria etapa
// `upload` (permite corrigir o arquivo e reenviar sem perder o contexto),
// mensagens de erro ÚNICAS (sem farm-context, sem permissão, arquivo
// inválido) vão via `toaster.error`.
//
// Mutation via `useMutation` (TanStack) DIRETO, NÃO `useRequest` genérico
// (Achado 3 do Roteiro): `useRequest.onError` é FIXO (só toast de
// `resData.message`) e `actionSuccess` fecha o fluxo — este caso precisa (a)
// diferenciar `errors.rows[]` de mensagem única e (b) manter o modal aberto
// no sucesso para mostrar o relatório. Mesma primitiva por baixo
// (`useMutation`), só sem o wrapper que não cobre este caso — decisão
// técnica registrada no Roteiro, não um desvio de padrão.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { queryKey } from '@/constants/query-key';

import {
  downloadPlanAccountImportTemplate,
  importPlanAccounts,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { PlanAccountImportResult } from '@/@types/v2/PlanAccounts';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

export interface PlanAccountImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanAccountImportModal({ isOpen, onClose }: PlanAccountImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.planAccounts.planAccount;
  const importText = text.excel.import;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PlanAccountImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: importPlanAccounts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.planAccounts.list] });
      toaster.success({
        title: text.singularLabel,
        description: importText.importSuccessToast,
        duration: 7000,
      });
      setResult(data.data);
      setRowErrors([]);
      setStep('result');
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const rows = resData?.errors?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        setRowErrors(rows);
        return; // permanece na etapa 'upload', mostra a caixa de erro ali
      }
      toaster.error({
        title: text.singularLabel,
        description: extractApiFieldErrorMessage(error) ?? resData?.message ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isSubmitting = importMutation.isPending;

  function handleClose() {
    if (isSubmitting) return;
    resetState();
    onClose();
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadPlanAccountImportTemplate();
      downloadBlob(blob, 'modelo-plano-de-contas.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  function handleFileSelected(selected: File | null) {
    setFile(selected);
    setRowErrors([]);
  }

  function handleFileRemove() {
    setFile(null);
    setRowErrors([]);
  }

  function handleSubmit() {
    if (!file) return;
    importMutation.mutate(file);
  }

  const preservedCount = result?.preserved.length ?? 0;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      size="lg"
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
              <Dialog.Title>{importText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {step === 'upload' ? (
                <Flex direction="column" gap={4}>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Text fontSize="sm" color="fg.muted" flex={1}>
                      {importText.subtitle}
                    </Text>
                    <Button
                      title={importText.downloadShortcut}
                      variant="outline"
                      icon={FiDownload as ElementType}
                      onClick={handleDownloadTemplate}
                      loading={isDownloadingTemplate}
                      disabled={isDownloadingTemplate || isSubmitting}
                      flexShrink={0}
                    />
                  </Flex>

                  <Text fontSize="sm" color="fg.default">
                    {importText.instructions}
                  </Text>

                  <Flex
                    align="flex-start"
                    gap={3}
                    p={4}
                    bg="orange.500/10"
                    border="1px solid"
                    borderColor="orange.500/30"
                    borderRadius="lg"
                  >
                    <Icon
                      as={FiAlertTriangle}
                      color="orange.400"
                      boxSize={5}
                      flexShrink={0}
                      mt="1px"
                    />
                    <Flex direction="column" gap={1}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {importText.warning.title}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.warning.description}
                      </Text>
                    </Flex>
                  </Flex>

                  <FileUpload
                    label={importText.fileUpload.label}
                    hint={importText.fileUpload.hint}
                    accept=".xlsx"
                    maxSizeMb={10}
                    file={file}
                    onFileSelected={handleFileSelected}
                    onRemove={handleFileRemove}
                    disabled={isSubmitting}
                    dropzoneTitle={importText.fileUpload.dropzoneTitle}
                    dropzoneDraggingTitle={importText.fileUpload.dropzoneDraggingTitle}
                    changeLabel={importText.fileUpload.changeLabel}
                    removeLabel={importText.fileUpload.removeLabel}
                    errorTypeMessage={importText.fileUpload.errorTypeMessage}
                    errorSizeMessage={importText.fileUpload.errorSizeMessage}
                  />

                  {rowErrors.length > 0 && (
                    <Flex
                      direction="column"
                      gap={2}
                      p={4}
                      bg="red.500/10"
                      border="1px solid"
                      borderColor="red.500/30"
                      borderRadius="lg"
                    >
                      <Flex align="center" gap={2}>
                        <Icon as={FiAlertTriangle} color="fg.error" boxSize={4} />
                        <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                          {importText.rowErrors.title}
                        </Text>
                      </Flex>
                      <Box as="ul" pl={5} m={0} display="flex" flexDirection="column" gap={1}>
                        {rowErrors.map((rowError, index) => (
                          <Text as="li" key={`${index}-${rowError}`} fontSize="xs" color="fg.muted">
                            {rowError}
                          </Text>
                        ))}
                      </Box>
                    </Flex>
                  )}
                </Flex>
              ) : (
                <Flex direction="column" gap={4}>
                  <Flex gap={3}>
                    <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {result?.created ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.created}
                      </Text>
                    </Box>
                    <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {result?.updated ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.updated}
                      </Text>
                    </Box>
                    <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {result?.deleted ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.deleted}
                      </Text>
                    </Box>
                  </Flex>

                  {preservedCount > 0 && (
                    <Flex
                      direction="column"
                      gap={2}
                      p={4}
                      bg="orange.500/10"
                      border="1px solid"
                      borderColor="orange.500/30"
                      borderRadius="lg"
                    >
                      <Flex align="center" gap={2}>
                        <Icon as={FiAlertTriangle} color="orange.400" boxSize={4} />
                        <Text fontSize="sm" fontWeight="semibold">
                          {importText.result.preservedTitle.replace(
                            '{count}',
                            String(preservedCount)
                          )}
                        </Text>
                      </Flex>
                      <Box as="ul" pl={5} m={0} display="flex" flexDirection="column" gap={1}>
                        {result?.preserved.map((item) => (
                          <Text as="li" key={item.code} fontSize="xs" color="fg.muted">
                            {item.code} — {item.description} ({item.motivo})
                          </Text>
                        ))}
                      </Box>
                    </Flex>
                  )}
                </Flex>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {step === 'upload' ? (
                <>
                  <Button
                    title={importText.cancelButton}
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  />
                  <Button
                    title={importText.submitButton}
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!file || isSubmitting}
                  />
                </>
              ) : (
                <Button title={importText.closeButton} onClick={handleClose} />
              )}
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
