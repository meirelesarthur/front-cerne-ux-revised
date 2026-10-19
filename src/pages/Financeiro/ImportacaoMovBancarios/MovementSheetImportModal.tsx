// src/pages/Financeiro/ImportacaoMovBancarios/MovementSheetImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xls/.xlsx) de Import. Mov. Bancários — F-112,
// TASK-064-MOV-FE-02. Mirror ESTRUTURAL de `RainfallImportModal.tsx`/
// `StockCorrectionImportModal.tsx` (família ABORT-ALL): `Dialog.Root` headless
// Chakra v3, `Portal`, máquina de estados `step: 'upload' | 'result'`,
// `useMutation` DIRETO — NÃO `useRequest` genérico (mesmo racional documentado
// nos 2 precedentes: `useRequest.onError` é FIXO, só toast de `message`, e este
// caso precisa diferenciar erro por linha — mostrado dentro do próprio modal —
// de mensagem única — toast).
//
// NÃO é mirror de `ImportExportActions`/`ImportExportSegment` (Incomes/Expenses,
// sucesso-parcial 200 sempre) — o backend desta feature (`ImportMovementSheetAction`)
// é ABORT-ALL: a Fase 1 valida TODAS as linhas antes de qualquer escrita; se
// alguma falhar, 422 com ZERO persistência (nem a transação chega a abrir).
//
// ⚠️ Shape REAL do 422 confirmado por leitura direta do backend
// (`ImportMovementSheetAction::handle()` + `MovementSheetImportTest.php`) —
// DIVERGE do shape assumido pelo roteiro como default (`errors.rows: string[]`):
// aqui é o formato FLAT padrão do Laravel, `ValidationException::withMessages`
// com chave `row.<N>` por linha inválida — ex.: `errors['row.2'] = ['Categoria
// financeira (X) não encontrada.']`. O `onError` abaixo filtra as chaves que
// começam com `row.` e monta "Linha N: mensagem" (mesmo texto de exibição que o
// roteiro sugeriu, só a extração é diferente — chaves `row.*`, não um array
// `rows`).
//
// Sucesso (200): `Response<MovementSheetImportResult>` = `{imported, movementSheet:
// {uuid, code, date, userUuid, userName}}` — SEM os 3 blocos
// created/updated/deleted/preserved (não existem neste contrato) e SEM
// `rows_processed` (conceito de StockCorrection, não se aplica). O passo
// `result` mostra `imported` (contagem) + `movementSheet.code` (recibo do lote).
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
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  downloadMovementSheetTemplate,
  importMovementSheets,
} from '@/services/v2/MovementSheets/movement-sheet-service';

import type { MovementSheetImportResult } from '@/@types/v2/MovementSheets';

export interface MovementSheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Extrai as mensagens de erro por linha do envelope 422 flat do Laravel
// (`errors['row.<N>'] = string[]`) — mirror do racional documentado no
// cabeçalho: shape REAL confirmado no backend, não `errors.rows: string[]`.
function extractRowErrors(errors: Record<string, string[]> | null | undefined): string[] {
  if (!errors) return [];

  return Object.entries(errors)
    .filter(([key]) => key.startsWith('row.'))
    .map(([key, messages]) => {
      const rowNumber = key.split('.')[1] ?? '';
      return `Linha ${rowNumber}: ${messages.join(' ')}`;
    });
}

export function MovementSheetImportModal({ isOpen, onClose }: MovementSheetImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.movementSheets.movementSheet;
  const importText = text.importModal;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MovementSheetImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: importMovementSheets,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.movementSheets.movementSheetsList] });
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
      const rows = extractRowErrors(resData?.errors);
      if (rows.length > 0) {
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
      const blob = await downloadMovementSheetTemplate();
      downloadBlob(blob, 'movimentos-bancarios-modelo.xlsx');
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
                <Flex gap={3}>
                  <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.imported ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.importedLabel}
                    </Text>
                  </Box>
                  <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.movementSheet.code ?? '—'}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.movementSheetCodeLabel}
                    </Text>
                  </Box>
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
