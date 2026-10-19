// src/components/ImportExport/ImportExportActions.tsx
// -----------------------------------------------------------------------------
// Ações de Import/Export de planilha (.xlsx) — COMPARTILHADO entre Contas a
// Pagar (Expense, `segment='expenses'`) e Contas a Receber (Income,
// `segment='incomes'`), esteira 036, Onda 3 sub-onda 3e (B-08). Mirror
// estrutural do precedente real já existente no fork —
// `CadastrosBase/PlanAccount/HeaderTable.tsx` (menu `Actions` com "Baixar
// modelo"/"Exportar"/"Importar") + `PlanAccountImportModal.tsx` (upload →
// submit → relatório de resultado) — adaptado ao contrato B-08, que é
// diferente do de PlanAccount/OpeningBalance:
//   - PlanAccount/OpeningBalance: all-or-nothing (422 com `errors.rows[]`
//     quando há linha inválida, nada é gravado).
//   - Este módulo (Expense/Income, B-08): SUCESSO PARCIAL — a resposta 200
//     sempre traz `imported` (linhas gravadas) + `errors[]` (linhas que
//     falharam SEM abortar o restante do lote). Por isso não há a etapa
//     "erro de linhas dentro do step upload" do precedente — aqui o
//     resultado (sucesso + erros) é SEMPRE mostrado junto, no step `result`.
//
// Permissões via PROPS (`canView`/`canImport`) — nunca `usePermissions`
// dentro deste componente compartilhado (o catálogo de permissões é
// `{segment}_view`/`{segment}_create`, resolvido pela PÁGINA consumidora,
// que já teria de chamar `can()` de qualquer forma para a tela toda).
//
// Invalidação de cache é responsabilidade do CONSUMIDOR (`onImportSuccess`),
// nunca deste componente — mesmo racional já documentado em
// `WriteOffCreateModal`/`DocumentPanel` ("a invalidação das queries é feita
// AQUI [na página], nunca dentro do componente compartilhado").
//
// Export SEMPRE recebe os MESMOS filtros aplicados na grid (`filterParams`,
// tipicamente `paginatedQuery.filter` da página consumidora) — a Tarefa exige
// exportar o que está FILTRADO, não o tenant inteiro (diferente do
// `exportPlanAccounts` do precedente, que não recebe filtro).
//
// Download de blob via `src/utils/downloadBlob.ts` (utilitário já existente,
// reaproveitado — não reinventado aqui).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { FiAlertTriangle, FiDownload, FiFileText, FiUpload } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import {
  downloadImportTemplate,
  exportData,
  importFile,
} from '@/services/v2/ImportExport/import-export-service';

import type { ImportExportResult, ImportExportSegment } from '@/@types/v2/ImportExport';

export interface ImportExportTexts {
  /** Rótulo acessível do gatilho do menu (`Actions`, "..." vertical). */
  tooltipLabel: string;
  downloadTemplate: string;
  export: string;
  downloadTemplateError: string;
  exportError: string;
  import: {
    menuLabel: string;
    title: string;
    subtitle: string;
    downloadShortcut: string;
    fileUpload: {
      label: string;
      hint: string;
      dropzoneTitle: string;
      dropzoneDraggingTitle: string;
      changeLabel: string;
      removeLabel: string;
      errorTypeMessage: string;
      errorSizeMessage: string;
    };
    cancelButton: string;
    submitButton: string;
    closeButton: string;
    /** Toast de sucesso — aceita `{count}` (substituído por `result.imported`). */
    successToast: string;
    /** Fallback quando a API não devolve mensagem específica (erro de rede/farm/permissão). */
    genericError: string;
    result: {
      importedLabel: string;
      errorsTitle: string;
      /** Linha de erro — aceita `{row}` e `{message}`. */
      rowTemplate: string;
    };
  };
}

export interface ImportExportActionsProps {
  segment: ImportExportSegment;
  /** Gate de `{segment}_view` — controla "Baixar modelo"/"Exportar" e a visibilidade do menu. */
  canView: boolean;
  /** Gate de `{segment}_create` — controla "Importar". */
  canImport: boolean;
  /** Filtros ATUAIS da grid (tipicamente `paginatedQuery.filter`) — repassados ao export. */
  filterParams?: Record<string, unknown>;
  /** Nome do arquivo baixado ao clicar "Baixar modelo" (ex.: `modelo-contas-a-pagar.xlsx`). */
  templateFileName: string;
  /** Nome do arquivo baixado ao clicar "Exportar" (ex.: `contas-a-pagar.xlsx`). */
  exportFileName: string;
  /** Chamado após import bem-sucedido — o CONSUMIDOR invalida a query da listagem aqui. */
  onImportSuccess?: () => void;
  texts: ImportExportTexts;
}

export function ImportExportActions({
  segment,
  canView,
  canImport,
  filterParams,
  templateFileName,
  exportFileName,
  onImportSuccess,
  texts,
}: ImportExportActionsProps) {
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportExportResult | null>(null);

  function resetImportState() {
    setStep('upload');
    setFile(null);
    setResult(null);
  }

  function handleOpenImportModal() {
    resetImportState();
    setIsImportModalOpen(true);
  }

  const importMutation = useMutation({
    mutationFn: (selectedFile: File) => importFile(segment, selectedFile),
    onSuccess: (response) => {
      toaster.success({
        title: texts.import.title,
        description: texts.import.successToast.replace('{count}', String(response.data.imported)),
        duration: 7000,
      });
      setResult(response.data);
      setStep('result');
      onImportSuccess?.();
    },
    onError: (error) => {
      toaster.error({
        title: texts.import.title,
        description: extractApiErrorMessage(error) ?? texts.import.genericError,
        duration: 7000,
      });
    },
  });

  const isSubmitting = importMutation.isPending;

  function handleCloseImportModal() {
    if (isSubmitting) return;
    resetImportState();
    setIsImportModalOpen(false);
  }

  function handleFileSelected(selected: File | null) {
    setFile(selected);
  }

  function handleFileRemove() {
    setFile(null);
  }

  function handleSubmitImport() {
    if (!file) return;
    importMutation.mutate(file);
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadImportTemplate(segment);
      downloadBlob(blob, templateFileName);
    } catch {
      toaster.error({ title: texts.downloadTemplate, description: texts.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportData(segment, filterParams);
      downloadBlob(blob, exportFileName);
    } catch {
      toaster.error({ title: texts.export, description: texts.exportError });
    } finally {
      setIsExporting(false);
    }
  }

  if (!canView && !canImport) return null;

  const errors = result?.errors ?? [];

  return (
    <>
      <Actions tooltipLabel={texts.tooltipLabel}>
        {canView && (
          <Actions.Item
            icon={<Icon as={FiDownload} />}
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {texts.downloadTemplate}
          </Actions.Item>
        )}
        {canView && (
          <Actions.Item
            icon={<Icon as={FiFileText} />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {texts.export}
          </Actions.Item>
        )}
        {canImport && (
          <Actions.Item icon={<Icon as={FiUpload} />} onClick={handleOpenImportModal}>
            {texts.import.menuLabel}
          </Actions.Item>
        )}
      </Actions>

      <Dialog.Root
        open={isImportModalOpen}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open) handleCloseImportModal();
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
                <Dialog.Title>{texts.import.title}</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                {step === 'upload' ? (
                  <Flex direction="column" gap={4}>
                    <Flex align="center" justify="space-between" gap={3}>
                      <Text fontSize="sm" color="fg.muted" flex={1}>
                        {texts.import.subtitle}
                      </Text>
                      <Button
                        title={texts.import.downloadShortcut}
                        variant="outline"
                        icon={FiDownload as ElementType}
                        onClick={handleDownloadTemplate}
                        loading={isDownloadingTemplate}
                        disabled={isDownloadingTemplate || isSubmitting}
                        flexShrink={0}
                      />
                    </Flex>

                    <FileUpload
                      label={texts.import.fileUpload.label}
                      hint={texts.import.fileUpload.hint}
                      accept=".xlsx"
                      maxSizeMb={10}
                      file={file}
                      onFileSelected={handleFileSelected}
                      onRemove={handleFileRemove}
                      disabled={isSubmitting}
                      dropzoneTitle={texts.import.fileUpload.dropzoneTitle}
                      dropzoneDraggingTitle={texts.import.fileUpload.dropzoneDraggingTitle}
                      changeLabel={texts.import.fileUpload.changeLabel}
                      removeLabel={texts.import.fileUpload.removeLabel}
                      errorTypeMessage={texts.import.fileUpload.errorTypeMessage}
                      errorSizeMessage={texts.import.fileUpload.errorSizeMessage}
                    />
                  </Flex>
                ) : (
                  <Flex direction="column" gap={4}>
                    <Box p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {result?.imported ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {texts.import.result.importedLabel}
                      </Text>
                    </Box>

                    {errors.length > 0 && (
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
                            {texts.import.result.errorsTitle}
                          </Text>
                        </Flex>
                        <Box as="ul" pl={5} m={0} display="flex" flexDirection="column" gap={1}>
                          {errors.map((rowError, index) => (
                            <Text
                              as="li"
                              key={`${index}-${rowError.row}`}
                              fontSize="xs"
                              color="fg.muted"
                            >
                              {texts.import.result.rowTemplate
                                .replace('{row}', String(rowError.row))
                                .replace('{message}', rowError.message)}
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
                      title={texts.import.cancelButton}
                      variant="outline"
                      onClick={handleCloseImportModal}
                      disabled={isSubmitting}
                    />
                    <Button
                      title={texts.import.submitButton}
                      onClick={handleSubmitImport}
                      loading={isSubmitting}
                      disabled={!file || isSubmitting}
                    />
                  </>
                ) : (
                  <Button title={texts.import.closeButton} onClick={handleCloseImportModal} />
                )}
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
