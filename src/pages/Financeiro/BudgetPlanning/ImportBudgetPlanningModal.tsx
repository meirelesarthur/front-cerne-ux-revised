// src/pages/Financeiro/BudgetPlanning/ImportBudgetPlanningModal.tsx
// -----------------------------------------------------------------------------
// Modal DEDICADO de importação (.xlsx) de Prev. Orçamentária (BudgetPlanning —
// F-106, esteira 97-Esteiras/067, TASK-PO-FE-09). Mirror ESTRUTURAL de
// `Administrativo/CorrecaoEstoque/StockCorrectionImportModal.tsx`/
// `Financeiro/ImportacaoMovBancarios/MovementSheetImportModal.tsx` (mesma
// família ABORT-ALL: `Dialog.Root` headless Chakra v3, `Portal`,
// `useMutation` DIRETO — NÃO `useRequest` genérico, porque o `onError`
// precisa diferenciar erro por LINHA (mostrado dentro do próprio modal) de
// erro por CAMPO (`year`/`file`) e de mensagem única (toast)).
//
// PROIBIDO reaproveitar `ImportExportActions.tsx` (Expense/Income) — seu
// contrato de resposta (sucesso parcial `{imported, errors[]}`) diverge do
// real de `POST /budget-plannings/import` (tudo-ou-nada, `201`/`422`,
// contrato de tela §8, `BudgetPlanningImportRequest`+`ImportBudgetPlanningAction`).
//
// Shape REAL do 422 confirmado por leitura direta do backend:
//   1. Falha de FORM REQUEST (`BudgetPlanningImportRequest::rules()`):
//      `errors.file[]` / `errors.year[]` (Laravel padrão) — mapeado por
//      campo via `setError` (RHF), mirror do 422 de
//      `CreateOrUpdateBudgetPlanning.tsx`.
//   2. Falha de CONTEÚDO da planilha (`ValidateBudgetPlanningImportRowsAction`,
//      via `BusinessRuleException('...', ['rows' => $messages])`):
//      `errors.rows: string[]` (mensagens já formatadas "Linha N: ..."), MESMO
//      shape de `StockCorrectionImportModal`/`RainfallImportModal` — NÃO o
//      formato `errors['row.<N>']` usado por `MovementSheetImportModal`
//      (família irmã, mas com contrato de erro diferente).
//   3. Qualquer outro erro (rede, 500, mensagem única) → toast genérico
//      (`extractApiFieldErrorMessage`/`message`).
//
// `year` é OBRIGATÓRIO e vai no `FormData` junto do arquivo — o import usa o
// ano DO FORMULÁRIO, não um ano inferido da planilha
// (`ImportBudgetPlanningAction::handle($rows, (int) $year)`, contrato §8
// risco 2). `useForm` simples (sem Yup pesado — só `required` nos 2 campos,
// Roteiro da Tarefa).
//
// "Baixar modelo" (A-07 do contrato legado) fica DENTRO do modal (não no
// dropdown do Header) — mirror fiel do legado
// (`067/CONTRATOS/prev-orcamentaria-legacy-contract.DRAFT.md` A-06/A-07).
//
// Decisão do Executor (ambas aceitáveis pela Tarefa): sucesso fecha o modal e
// PERMANECE na listagem (não navega para o registro criado) — mais simples,
// evita acoplar este modal a uma rota de destino; a listagem já invalida e
// mostra o novo registro na próxima página/consulta.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  downloadBudgetPlanningTemplate,
  importBudgetPlanning,
} from '@/services/v2/Financeiro/budget-planning-service';

import type { ImportBudgetPlanningRequest } from '@/@types/v2/Financeiro/budgetPlanning';

export interface ImportBudgetPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportBudgetPlanningFormValues {
  year: number | null;
  file: File | null;
}

const defaultFormValues: ImportBudgetPlanningFormValues = {
  year: new Date().getFullYear(),
  file: null,
};

export function ImportBudgetPlanningModal({ isOpen, onClose }: ImportBudgetPlanningModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.financial.budgetPlanning;
  const importText = text.import;

  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ImportBudgetPlanningFormValues>({ defaultValues: defaultFormValues });

  function resetState() {
    reset(defaultFormValues);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: (payload: ImportBudgetPlanningRequest) => importBudgetPlanning(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.financial.budgetPlannings] });
      toaster.success({
        title: text.singularLabel,
        description: importText.success,
        duration: 7000,
      });
      resetState();
      onClose();
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const fieldErrors = resData?.errors as Record<string, string[]> | undefined;

      // 1) Erro de CONTEÚDO da planilha — array de mensagens por linha
      // (`errors.rows`, `ValidateBudgetPlanningImportRowsAction`). Fica
      // visível dentro do próprio modal — permanece na tela.
      const rows = fieldErrors?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        setRowErrors(rows);
        return;
      }
      setRowErrors([]);

      // 2) Erro por CAMPO (`errors.file`/`errors.year`, FormRequest padrão) —
      // mapeado individualmente via `setError` (RHF), mirror do 422 de
      // `CreateOrUpdateBudgetPlanning.tsx`.
      let handledByField = false;
      if (fieldErrors?.year?.[0]) {
        setError('year', { type: 'server', message: fieldErrors.year[0] });
        handledByField = true;
      }
      if (fieldErrors?.file?.[0]) {
        setError('file', { type: 'server', message: fieldErrors.file[0] });
        handledByField = true;
      }
      if (handledByField) return;

      // 3) Mensagem única/genérica — toast (rede, 500, negócio sem payload
      // estruturado).
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
      const blob = await downloadBudgetPlanningTemplate();
      downloadBlob(blob, 'previsao-orcamentaria-modelo.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: importText.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  function onSubmit(data: ImportBudgetPlanningFormValues) {
    if (!data.file || !data.year) return;
    setRowErrors([]);
    importMutation.mutate({ file: data.file, year: data.year });
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

                <Controller
                  name="year"
                  control={control}
                  rules={{ required: importText.yearRequired }}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      label={importText.yearLabel}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={field.value ?? ''}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '');
                        field.onChange(digits === '' ? null : Number(digits));
                      }}
                      onBlur={field.onBlur}
                      error={error?.message}
                      isRequired
                      disabled={isSubmitting}
                    />
                  )}
                />

                <Controller
                  name="file"
                  control={control}
                  rules={{ required: importText.fileRequired }}
                  render={({ field, fieldState: { error } }) => (
                    <FileUpload
                      label={importText.fileUpload.label}
                      hint={importText.fileUpload.hint}
                      accept=".xlsx"
                      maxSizeMb={10}
                      file={field.value}
                      onFileSelected={field.onChange}
                      onRemove={() => field.onChange(null)}
                      disabled={isSubmitting}
                      error={error?.message}
                      dropzoneTitle={importText.fileUpload.dropzoneTitle}
                      dropzoneDraggingTitle={importText.fileUpload.dropzoneDraggingTitle}
                      changeLabel={importText.fileUpload.changeLabel}
                      removeLabel={importText.fileUpload.removeLabel}
                      errorTypeMessage={importText.fileUpload.errorTypeMessage}
                      errorSizeMessage={importText.fileUpload.errorSizeMessage}
                    />
                  )}
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
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={importText.cancelButton}
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              />
              <Button
                title={importText.submitButton}
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting || !!errors.year || !!errors.file}
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

export default ImportBudgetPlanningModal;
