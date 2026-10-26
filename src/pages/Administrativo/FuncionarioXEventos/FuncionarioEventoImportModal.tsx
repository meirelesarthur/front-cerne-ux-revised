// src/pages/Administrativo/FuncionarioXEventos/FuncionarioEventoImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xlsx) de Funcionário x Eventos —
// TASK-FE-FXE-01. Mirror ESTRUTURAL de
// `CorrecaoEstoque/StockCorrectionImportModal.tsx` (Dialog v3 headless,
// `Portal`, máquina de estados `step: 'upload' | 'result'`, `useMutation`
// DIRETO — NÃO `useRequest`, mesma razão documentada no precedente: precisa
// diferenciar `errors.rows[]` de mensagem única e manter o modal aberto no
// sucesso para mostrar o resultado), com 1 divergência deliberada (contrato
// de tela §Riscos, TASK-FE-FXE-01 Roteiro passo 1):
//
//   A etapa `result` mostra as 5 métricas de `EmployeeEventImportResult`
//   (`employees_processed`/`rows_processed`/`created`/`updated`/`deleted` —
//   shape confirmado por leitura direta de `EmployeeEventImportResultResource`,
//   diferente do resultado enxuto de Correção de Estoque).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  downloadEmployeeEventsTemplate,
  importEmployeeEvents,
} from '@/services/v2/EmployeeEvents/employee-event-service';

import type { EmployeeEventImportResult } from '@/@types/v2/EmployeeEvents';

export interface FuncionarioEventoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FuncionarioEventoImportModal({
  isOpen,
  onClose,
}: FuncionarioEventoImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.employeeEvents.employeeEvent;
  const importText = text.importModal;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EmployeeEventImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: importEmployeeEvents,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.employeeEvents.employeeEventsList] });
      // [FIX esteira 113] mirror da invalidação em `MatrizVinculosFuncionario
      // .tsx::syncMutation` — a importação também grava vínculos de
      // Funcionário x Eventos (`POST /employee-events/import`), então precisa
      // invalidar o mesmo prefixo `queryKey.earnings.earning` para não deixar
      // a Apuração Mensal semear de um cache desatualizado (ver comentário
      // completo no irmão).
      queryClient.invalidateQueries({ queryKey: [queryKey.earnings.earning] });
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
      const blob = await downloadEmployeeEventsTemplate();
      downloadBlob(blob, 'modelo-funcionario-eventos.xlsx');
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
                <SimpleGrid columns={{ base: 2, md: 5 }} gap={3}>
                  <Box p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.employees_processed ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.employeesProcessedLabel}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.rows_processed ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.rowsProcessedLabel}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.created ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.createdLabel}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.updated ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.updatedLabel}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.deleted ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.deletedLabel}
                    </Text>
                  </Box>
                </SimpleGrid>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {step === 'upload' ? (
                <>
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
