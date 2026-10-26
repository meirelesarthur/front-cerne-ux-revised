// src/pages/CadastrosBase/EstoqueInicial/OpeningBalanceImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xlsx) do Estoque Inicial — TASK-FE-1047
// (execução 026). Mirror EXATO de `PlanAccountImportModal.tsx` (Dialog nativo
// Chakra v3, step 'upload'|'result', FileUpload, useMutation direto — NÃO
// `useRequest` genérico) — COM 1 divergência estrutural deliberada, registrada
// abaixo, autorizada pelo próprio Roteiro da Tarefa ("se o shape vier
// diferente, ajustar só o parsing do onError do useMutation, sem mudar a UI
// do modal").
//
// DIVERGÊNCIA (fonte: OpeningBalance-contrato.md §7.2 + tipos já publicados em
// TASK-FE-1040, `@/@types/v2/OpeningBalances` — `OpeningBalanceImportResult`):
//   - `PlanAccountRowsImport`/`ImportPlanAccountAction` é ABORT-ALL: linha
//     inválida → 422 com `errors.rows: string[]`, NADA é gravado.
//   - `OpeningBalanceRowsImport`/`ImportOpeningBalanceAction` NÃO é atômico
//     (contrato §7.2: "o legado não envolve o loop em DB::transaction() —
//     uma falha na linha N aborta o restante, mas as linhas 1..N-1 já
//     processadas permanecem persistidas"). Por isso os erros de linha vêm
//     DENTRO do payload de SUCESSO (200) — `OpeningBalanceImportResult.errors:
//     { row, message }[]` — e não de um 422 `errors.rows`.
//   - Consequência no `onSuccess`: se `errors.length > 0`, o modal PERMANECE
//     na etapa 'upload' (mesma UX de "corrigir e reenviar" do mirror — seguro
//     porque `Stock`/`OpeningBalance` usam `updateOrCreate` chaveado por
//     produto+armazém+fazenda, reenviar a mesma planilha corrigida não
//     duplica as linhas já importadas) — MAS a lista já é invalidada quando
//     `imported > 0` (dado real já persistido, a grid deve refletir isso
//     mesmo com o modal ainda aberto). Se `errors.length === 0`, segue o
//     fluxo normal do mirror (toast de sucesso, etapa 'result').
//
//   CORREÇÃO (Executor, 2026-07-31, TASK-FE-1047): o payload real de
//   `OpeningBalanceImportResultData.php` é `{ imported, errors }` — os
//   campos `created`/`updated` presumidos aqui e no tipo
//   `OpeningBalanceImportResult` NUNCA existiram no backend. Corrigido nos
//   3 pontos de consumo (onSuccess, invalidação de cache, etapa 'result')
//   e no tipo (`@/@types/v2/OpeningBalances`).
//   - `onError` (mensagem ÚNICA) continua para os casos que SÃO erro HTTP de
//     verdade — sem contexto de fazenda, sem permissão (gate duplo
//     `openingbalances_create` E `_edit`, §3), arquivo inválido (fora do
//     `mimes:xlsx`/`max:10240`, já barrado client-side pelo `FileUpload`, mas
//     o backend é a fonte da verdade).
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
  downloadOpeningBalanceImportTemplate,
  importOpeningBalances,
} from '@/services/v2/OpeningBalances/opening-balance-service';

import type { OpeningBalanceImportResult } from '@/@types/v2/OpeningBalances';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

export interface OpeningBalanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpeningBalanceImportModal({ isOpen, onClose }: OpeningBalanceImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.openingBalances.openingBalance;
  const importText = text.excel.import;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OpeningBalanceImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: importOpeningBalances,
    onSuccess: (response) => {
      const data = response.data;
      const hasRowErrors = data.errors.length > 0;

      // Não-atomicidade real do backend (§7.2): linhas anteriores à que
      // falhou já foram persistidas — invalida a lista sempre que algo foi
      // de fato gravado, mesmo que o modal continue aberto para correção.
      // Correção do Executor (2026-07-31, TASK-FE-1047): o payload real só
      // tem `imported` (nunca `created`/`updated` — ver
      // `OpeningBalanceImportResultData.php`).
      if (data.imported > 0) {
        queryClient.invalidateQueries({ queryKey: [queryKey.openingBalances.openingBalancesList] });
      }

      if (hasRowErrors) {
        setRowErrors(
          data.errors.map(
            (rowError) =>
              `${importText.rowErrors.rowPrefix.replace('{row}', String(rowError.row))} ${rowError.message}`
          )
        );
        return; // permanece na etapa 'upload', mostra a caixa de erro ali
      }

      toaster.success({
        title: text.singularLabel,
        description: importText.importSuccessToast,
        duration: 7000,
      });
      setResult(data);
      setRowErrors([]);
      setStep('result');
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
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
      const blob = await downloadOpeningBalanceImportTemplate();
      downloadBlob(blob, 'modelo-estoque-inicial.xlsx');
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
                        {result?.imported ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.imported}
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
