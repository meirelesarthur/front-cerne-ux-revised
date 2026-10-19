// src/pages/Invoices/InvoiceXmlUploadModal.tsx
// -----------------------------------------------------------------------------
// Modal "Upload XML NFe" — TASK-FE-628 (DF-03, execução 035). Gate liberado
// pelo dono via task-packet (ver `CreateOrUpdateInvoice.tsx`) — fluxo
// completo (skeleton + integração real), depois que o Arquiteto API
// confirmou o endpoint em TASK-BE-624 (`POST /invoices/parse-xml`, 🔬 PARA
// TESTE) e o backend JÁ CONSTRUÍDO devolve um DRAFT (`InvoiceXmlDraft`, ver
// `@/@types/v2/Invoices`), SEM persistir nada — o usuário revisa/salva
// manualmente (fiel ao legado, `create.blade.php`/`session('invoice')`, mas
// stateless).
//
// SÓ na tela de CRIAÇÃO (o legado não oferece isso em `edit.blade.php`) —
// o caller (`CreateOrUpdateInvoice.tsx`) só monta este componente quando
// `!isEditing`.
//
// Mutation via `useMutation` (TanStack) DIRETO, mirror
// `PlanAccountImportModal.tsx` (Achado 3 do Roteiro daquela Tarefa, mesmo
// racional aqui): o `useRequest` genérico do projeto fecha o fluxo no
// sucesso e não permite diferenciar mensagem de negócio (`BusinessRuleException`,
// "Documento Fiscal já lançado"/"Este XML não é de NFe") de erro de campo —
// aqui só precisamos do 1º caso (mensagem única via `message` do envelope,
// `errors: []` sempre vazio nesta Action), então `onError` lê
// `resData?.message` direto (sem `extractApiFieldErrorMessage`, que só
// resolve erro POR CAMPO).
//
// Dialog nativo do Chakra v3 (mesmo primitivo de `PlanAccountImportModal.tsx`/
// `DeleteConfirmDialog.tsx`) — 1 etapa só (sem "resultado", diferente do
// import de planilha): sucesso fecha o modal e devolve o draft ao caller via
// `onImported`, que faz o `reset()` do form raiz.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Dialog, Portal, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { parseInvoiceXml } from '@/services/v2/Invoices/invoice-service';

import type { InvoiceXmlDraft } from '@/@types/v2/Invoices';

export interface InvoiceXmlUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (draft: InvoiceXmlDraft) => void;
}

export function InvoiceXmlUploadModal({ isOpen, onClose, onImported }: InvoiceXmlUploadModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.invoices.invoice.form.xmlImport;

  const [file, setFile] = useState<File | null>(null);

  function resetState() {
    setFile(null);
  }

  const parseMutation = useMutation({
    mutationFn: parseInvoiceXml,
    onSuccess: (data) => {
      toaster.success({ title: text.buttonLabel, description: text.successToast, duration: 6000 });
      onImported(data.data);
      resetState();
      onClose();
    },
    onError: (error) => {
      // `BusinessRuleException` (422 "Documento Fiscal já lançado"/"Este
      // XML não é de NFe"/erro de parse) sempre chega em `message`, `errors`
      // vazio — mirror do racional já documentado no cabeçalho do arquivo.
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      toaster.error({
        title: text.buttonLabel,
        description: resData?.message ?? text.genericError,
        duration: 7000,
      });
    },
  });

  const isSubmitting = parseMutation.isPending;

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
    if (!file) return;
    parseMutation.mutate(file);
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
              <Dialog.Title>{text.modalTitle}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text fontSize="sm" color="fg.muted" mb={4}>
                {text.modalSubtitle}
              </Text>

              <FileUpload
                label={text.fileUpload.label}
                hint={text.fileUpload.hint}
                accept=".xml"
                maxSizeMb={10}
                file={file}
                onFileSelected={handleFileSelected}
                onRemove={handleFileRemove}
                disabled={isSubmitting}
                dropzoneTitle={text.fileUpload.dropzoneTitle}
                dropzoneDraggingTitle={text.fileUpload.dropzoneDraggingTitle}
                changeLabel={text.fileUpload.changeLabel}
                removeLabel={text.fileUpload.removeLabel}
                errorTypeMessage={text.fileUpload.errorTypeMessage}
                errorSizeMessage={text.fileUpload.errorSizeMessage}
              />
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={text.cancelButton}
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              />
              <Button
                title={text.submitButton}
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
