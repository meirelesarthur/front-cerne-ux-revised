// src/pages/Administrativo/Requisition/RequisitionImportDocumentModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO do documento assinado de Requisição/Saída — Tarefa 06
// (97-Esteiras/002, fluxo de assinatura, GAP-REQUISICAO-FE-03 Ponto C).
// Mirror ESTRUTURAL de `CorrecaoEstoque/StockCorrectionImportModal.tsx`
// (Dialog v3 headless, `Portal`, `useMutation` DIRETO — NÃO `useRequest`,
// mesma razão do precedente: precisa diferenciar a mensagem de domínio 422
// via `extractApiFieldErrorMessage`), COM 1 divergência deliberada
// (Tarefa 06, Roteiro §Ponto C):
//
//   SINGLE-STEP — SEM a etapa `result` do precedente. Sucesso só fecha o
//   modal, invalida a query da LISTAGEM (`queryKey.requisitions.requisitions`
//   — o `status` da linha muda de `pending` para `signed`) e mostra um toast
//   de sucesso. Não há nenhum dado de retorno relevante para mostrar (o
//   endpoint não devolve um `code`/contagem como o irmão de planilha).
//
// `accept`/`maxSizeMb` mirror EXATO de
// `ImportRequisitionDocumentRequest::rules()` (`mimes:pdf,jpg,jpeg,png`,
// `max:5120` KB = 5MB) — NÃO os limites de `.xlsx`/10MB do irmão.
//
// 422 de domínio (Requisição já `signed`, `ImportRequisitionDocumentAction`)
// devolve `message` única (sem `errors.rows[]` como o irmão) —
// `extractApiFieldErrorMessage` cai no fallback de `resData?.message`. A
// ação "Importar" nem deveria estar visível nesse estado (gating por
// `status.value` no `index.tsx`), mas o servidor é a guarda real.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Dialog, Flex, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { importRequisitionDocument } from '@/services/v2/Requisitions/requisition-service';

export interface RequisitionImportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisitionUuid: string | null;
}

export function RequisitionImportDocumentModal({
  isOpen,
  onClose,
  requisitionUuid,
}: RequisitionImportDocumentModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.requisitions.requisition;
  const importText = text.importDocumentModal;

  const [file, setFile] = useState<File | null>(null);

  function resetState() {
    setFile(null);
  }

  const importMutation = useMutation({
    mutationFn: ({ uuid, selectedFile }: { uuid: string; selectedFile: File }) =>
      importRequisitionDocument(uuid, selectedFile),
    onSuccess: () => {
      // Mirror `StockCorrectionImportModal` — invalida a query da LISTAGEM
      // (chave prefixo, `useCustomGridQuery` monta `[queryKey, page, ...]`) para
      // a linha refletir o novo `status` (`pending` → `signed`) sem reload manual.
      queryClient.invalidateQueries({ queryKey: [queryKey.requisitions.requisitions] });
      toaster.success({
        title: text.singularLabel,
        description: importText.importSuccessToast,
        duration: 7000,
      });
      resetState();
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? importText.genericErrorToast,
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

  function handleFileSelected(selected: File | null) {
    setFile(selected);
  }

  function handleFileRemove() {
    setFile(null);
  }

  function handleSubmit() {
    if (!file || !requisitionUuid) return;
    importMutation.mutate({ uuid: requisitionUuid, selectedFile: file });
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
                <Text fontSize="sm" color="fg.muted">
                  {importText.subtitle}
                </Text>

                <FileUpload
                  label={importText.fileUpload.label}
                  hint={importText.fileUpload.hint}
                  accept=".pdf,.jpg,.jpeg,.png"
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
