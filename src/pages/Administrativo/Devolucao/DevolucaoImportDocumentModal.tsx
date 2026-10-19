// src/pages/Administrativo/Devolucao/DevolucaoImportDocumentModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO do documento assinado de Devolução/Entrada — Tarefa 06
// (97-Esteiras/037). Mirror EXATO `RequisitionImportDocumentModal.tsx`
// (Dialog v3 headless, `Portal`, `useMutation` DIRETO — NÃO `useRequest`,
// precisa diferenciar a mensagem de domínio 422 via
// `extractApiFieldErrorMessage`). SINGLE-STEP — sem etapa `result`.
//
// `accept`/`maxSizeMb` mirror EXATO de
// `ImportDevolutionDocumentRequest::rules()` (`mimes:pdf,jpg,jpeg,png`,
// `max:5120` KB = 5MB).
//
// Invalida `queryKey.devolutions.devolutions` no sucesso (o `status` da
// linha muda de `pending` para `signed`).
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

import { importDevolutionDocument } from '@/services/v2/Devolutions/devolution-service';

export interface DevolucaoImportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  devolutionUuid: string | null;
}

export function DevolucaoImportDocumentModal({
  isOpen,
  onClose,
  devolutionUuid,
}: DevolucaoImportDocumentModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.devolutions.devolution;
  const importText = text.importDocumentModal;

  const [file, setFile] = useState<File | null>(null);

  function resetState() {
    setFile(null);
  }

  const importMutation = useMutation({
    mutationFn: ({ uuid, selectedFile }: { uuid: string; selectedFile: File }) =>
      importDevolutionDocument(uuid, selectedFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.devolutions.devolutions] });
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
    if (!file || !devolutionUuid) return;
    importMutation.mutate({ uuid: devolutionUuid, selectedFile: file });
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
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
