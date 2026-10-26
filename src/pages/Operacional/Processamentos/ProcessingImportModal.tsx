// src/pages/Operacional/Processamentos/ProcessingImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORT de planilha (.xlsx) + download de modelo — TASK-FE-039-
// PROC-11 (resolve gap #16). Mirror ESTRUTURAL de
// `Operacional/Nascimentos/BirthAnimalImportModal.tsx` (Dialog nativo Chakra
// v3, `FileUpload`, `useMutation` direto, erro 422 com `errors.rows[]`
// mantém a etapa de upload).
//
// DIVERGÊNCIA deliberada do mirror (sucesso): a planilha de Processamentos
// FINALIZA o processamento inteiro — não há "etapa de resultado" com
// contagem, o `actionSuccess` fecha o modal INTEIRO e navega ao Detalhe
// (mesmo efeito visível do `finish` manual), mirror do `actionSuccess` de
// `FinishProcessing.tsx`, não do resumo de `BirthAnimalImportModal`.
//
// Restrito a origem Compra (`type` FQCN `App\Models\MovementPurchase`, normalizado por `isMovementPurchaseOrigin`) + `PENDING` (RW-F do
// roteiro de API) — o gate de visibilidade do BOTÃO que abre este modal é
// responsabilidade do caller (`FinishProcessing.tsx`); aqui dentro não há
// checagem de tipo redundante.
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
  downloadProcessingTemplate,
  importProcessingSpreadsheet,
} from '@/services/v2/Processamentos/processing-service';

import type { ProcessingDetail } from '@/@types/v2/Processamentos/processing';

export interface ProcessingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  uuid: string;
  /** Sucesso do import — mirror `actionSuccess` do `finish` manual (invalida queries, navega ao Detalhe, toast). Chamado ANTES do modal fechar. */
  onImported: (data: ProcessingDetail) => void;
}

export function ProcessingImportModal({
  isOpen,
  onClose,
  uuid,
  onImported,
}: ProcessingImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.processamentos.processing;
  const importText = text.form.importModal;

  const [file, setFile] = useState<File | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setFile(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: (selectedFile: File) => importProcessingSpreadsheet(uuid, selectedFile),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.processamentos.processings] });
      queryClient.invalidateQueries({ queryKey: [queryKey.processamentos.processing] });
      toaster.success({
        title: text.singularLabel,
        description: importText.successToast,
        duration: 7000,
      });
      resetState();
      onImported(response.data);
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const rows = resData?.errors?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        setRowErrors(rows);
        return; // permanece na etapa de upload, mostra a caixa de erros ali
      }
      toaster.error({
        title: text.singularLabel,
        description: resData?.message ?? languageGB.common.errorLog.unknownError,
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
      const blob = await downloadProcessingTemplate();
      downloadBlob(blob, 'modelo-processamentos.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: importText.downloadTemplateError });
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

                <FileUpload
                  label={importText.fileUpload.label}
                  hint={importText.fileUpload.hint}
                  accept=".xlsx,.xls"
                  maxSizeMb={5}
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
                        {importText.rowErrorsTitle}
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
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={importText.cancelButton}
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              />
              <Button
                title={importText.submitButton}
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!file || isSubmitting}
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
