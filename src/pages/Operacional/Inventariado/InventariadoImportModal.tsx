// src/pages/Operacional/Inventariado/InventariadoImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xls/.xlsx) de Inventariado (S2 do
// contrato de tela) — TASK-INV-FE-03. Mirror ESTRUTURAL de
// `Administrativo/CorrecaoEstoque/StockCorrectionImportModal.tsx` (Dialog v3
// headless, `Portal`, máquina de estados `step: 'upload' | 'result'`,
// `useMutation` DIRETO — NÃO `useRequest`, precisa diferenciar
// `errors.rows[]` de mensagem única e manter o modal aberto no sucesso para
// mostrar o resultado).
//
// Etapa `result` — render RESILIENTE ([PARA ANÁLISE] §7.2 do contrato de
// tela): a API devolve o MESMO shape do detalhe (`InventoriedDetail`,
// `InventoriedController::import()` → `InventoriedDetailResource`), então o
// resumo mostra os 4 contadores agregados client-side a partir de
// `result.animals[]` (nenhum campo de contagem próprio no envelope de
// sucesso) — se `animals` vier vazio, mostra só o toast de sucesso.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { inventoriedAnimalStatusColorToken } from '@/constants/inventoried/inventoried-status';
import { queryKey } from '@/constants/query-key';

import {
  downloadInventoriedTemplate,
  importInventoried,
} from '@/services/v2/Inventoried/inventoried-service';

import type { InventoriedImportResult } from '@/@types/v2/Inventoried';

export interface InventariadoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InventariadoImportModal({ isOpen, onClose }: InventariadoImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.inventoried.inventoried;
  const importText = text.importModal;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InventoriedImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: importInventoried,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.inventoried.inventoriedList] });
      toaster.success({
        title: text.singularLabel,
        description: importText.successToast,
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
        description:
          extractApiFieldErrorMessage(error) ??
          resData?.message ??
          languageGB.common.errorLog.unknownError,
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
      const blob = await downloadInventoriedTemplate();
      downloadBlob(blob, 'modelo-inventariado.xlsx');
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

  // Resumo enxuto agregado client-side a partir de `result.animals[]`
  // (render resiliente — ver nota de cabeçalho).
  const resultCounts = useMemo(() => {
    const animals = result?.animals ?? [];
    return {
      animalsCount: animals.length,
      inBatch: animals.filter((animal) => animal.status.value === 1).length,
      outOfBatch: animals.filter((animal) => animal.status.value === 2).length,
      missing: animals.filter((animal) => animal.status.value === 3).length,
    };
  }, [result]);

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

                  <FileUpload
                    label={importText.fileUpload.label}
                    hint={importText.fileUpload.hint}
                    accept=".xls,.xlsx"
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
                <Flex direction="column" gap={3}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {importText.result.title}
                  </Text>
                  <Flex gap={3} wrap="wrap">
                    <Box
                      flex={1}
                      minW="100px"
                      p={3}
                      borderRadius="lg"
                      bg="bg.subtle"
                      textAlign="center"
                    >
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {resultCounts.animalsCount}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.animalsCountLabel}
                      </Text>
                    </Box>
                    <Box
                      flex={1}
                      minW="100px"
                      p={3}
                      borderRadius="lg"
                      bg="bg.subtle"
                      textAlign="center"
                    >
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={inventoriedAnimalStatusColorToken[1]}
                      >
                        {resultCounts.inBatch}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.inBatchLabel}
                      </Text>
                    </Box>
                    <Box
                      flex={1}
                      minW="100px"
                      p={3}
                      borderRadius="lg"
                      bg="bg.subtle"
                      textAlign="center"
                    >
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={inventoriedAnimalStatusColorToken[2]}
                      >
                        {resultCounts.outOfBatch}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.outOfBatchLabel}
                      </Text>
                    </Box>
                    <Box
                      flex={1}
                      minW="100px"
                      p={3}
                      borderRadius="lg"
                      bg="bg.subtle"
                      textAlign="center"
                    >
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={inventoriedAnimalStatusColorToken[3]}
                      >
                        {resultCounts.missing}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.missingLabel}
                      </Text>
                    </Box>
                  </Flex>
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
