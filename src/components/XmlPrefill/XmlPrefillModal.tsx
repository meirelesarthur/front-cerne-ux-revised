// src/components/XmlPrefill/XmlPrefillModal.tsx
// -----------------------------------------------------------------------------
// Modal COMPARTILHADO de Upload/Prefill de XML — TASK-FE-036-341. Mirror
// estrutural quase 1:1 de `src/pages/Invoices/InvoiceXmlUploadModal.tsx`
// (TASK-FE-628/DF-03, já implementado e em produção para Nota de Entrada) —
// generaliza esse padrão para os 2 segmentos (`incomes`/`expenses`, B-05) em
// vez de reescrever do zero.
//
// Diferenças propositais vs. o precedente de Invoice (o resto é MIRROR
// direto, não reinventado):
//   - `segment`-aware: `onImported` é tipado a partir do `segment` recebido
//     (`ExpenseXmlDraft` quando `segment='expenses'`, `IncomeXmlDraft` quando
//     `segment='incomes'`, Tarefa 340) via generics — o consumidor NÃO faz
//     type-cast manual, o componente já sabe qual shape devolver.
//   - Textos via PROP `texts` (não `useLanguage` direto) — mesmo racional já
//     estabelecido pelo módulo COMPARTILHADO irmão desta mesma sub-onda
//     (`components/ImportExport/ImportExportActions.tsx`, `ImportExportTexts`
//     via prop): um componente compartilhado por 2 features não deve
//     depender do namespace de i18n de UMA delas. O consumidor passa
//     `texts={text.form.xmlImport}` (mirror `texts={{ ...text.list.excel }}`
//     de `pages/Incomes/index.tsx:688-691`).
//   - `accept=".xml"` no `FileUpload` (mesmo que o servidor aceite
//     `mimes:xml,txt` por leniência de sniffing — não expor essa leniência no
//     seletor de arquivo), `maxSizeMb={10}` (mesmo limite de Invoice,
//     `max:10240` confirmado idêntico no backend para os 2 segmentos).
//   - `useMutation` (TanStack) DIRETO, não `useRequest` genérico do projeto —
//     mesmo racional já documentado no cabeçalho de
//     `InvoiceXmlUploadModal.tsx` linhas 16-24: erros de negócio do parse
//     (XML corrompido/tipo errado — Expense rejeita NFe, Income não
//     reconhece o documento) chegam só em `message`, `errors` sempre vazio
//     nesta Action.
//
// Nenhum import de `@/services/v2/Incomes/**`/`@/services/v2/Financeiro/
// Expenses/**` — módulo genérico por `segment`, sem acoplamento a nenhuma das
// 2 features consumidoras (esta e a fatia irmã de CaP).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Dialog, Portal, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { parseXml } from '@/services/v2/XmlPrefill/xml-prefill-service';

import type { Response } from '@/@types/response-api';
import type { ExpenseXmlDraft, IncomeXmlDraft, XmlPrefillSegment } from '@/@types/v2/XmlPrefill';

// `parseXml` é sobrecarregado por segmento LITERAL (Tarefa 340) — dentro
// deste componente genérico o `segment` recebido é `S extends
// XmlPrefillSegment` (não um literal fixo), então o TS não consegue
// escolher a sobrecarga sozinho a partir da união. Este alias expõe a
// ASSINATURA DE IMPLEMENTAÇÃO (a mesma que o `parseXml` real cumpre em
// runtime) — nenhuma suposição de shape nova, só contorna a limitação de
// overload+generic do TypeScript nesta borda.
const parseXmlBySegment = parseXml as (
  segment: XmlPrefillSegment,
  file: File
) => Promise<Response<ExpenseXmlDraft | IncomeXmlDraft>>;

export interface XmlPrefillTexts {
  buttonLabel: string;
  modalTitle: string;
  modalSubtitle: string;
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
  submitButton: string;
  cancelButton: string;
  successToast: string;
  genericError: string;
}

/** `S extends 'expenses'` devolve `ExpenseXmlDraft`; qualquer outro segmento (`'incomes'`) devolve `IncomeXmlDraft`. */
type XmlDraftFor<S extends XmlPrefillSegment> = S extends 'expenses'
  ? ExpenseXmlDraft
  : IncomeXmlDraft;

export interface XmlPrefillModalProps<S extends XmlPrefillSegment> {
  isOpen: boolean;
  onClose: () => void;
  segment: S;
  onImported: (draft: XmlDraftFor<S>) => void;
  texts: XmlPrefillTexts;
}

export function XmlPrefillModal<S extends XmlPrefillSegment>({
  isOpen,
  onClose,
  segment,
  onImported,
  texts,
}: XmlPrefillModalProps<S>) {
  const [file, setFile] = useState<File | null>(null);

  function resetState() {
    setFile(null);
  }

  const parseMutation = useMutation({
    // `data.data` chega tipado como a união dos 2 drafts — resolvida para
    // `XmlDraftFor<S>` só no `onImported` abaixo (fronteira pública do
    // componente), nunca aqui dentro.
    mutationFn: (selectedFile: File) => parseXmlBySegment(segment, selectedFile),
    onSuccess: (data) => {
      toaster.success({
        title: texts.buttonLabel,
        description: texts.successToast,
        duration: 6000,
      });
      onImported(data.data as XmlDraftFor<S>);
      resetState();
      onClose();
    },
    onError: (error) => {
      // `BusinessRuleException` (422 "Este XML não é de NFSe"/"Este XML não
      // é de NFe/NFSe"/erro de parse) sempre chega em `message`, `errors`
      // vazio — mirror do racional já documentado no cabeçalho do arquivo.
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      toaster.error({
        title: texts.buttonLabel,
        description: resData?.message ?? texts.genericError,
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
              <Dialog.Title>{texts.modalTitle}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text fontSize="sm" color="fg.muted" mb={4}>
                {texts.modalSubtitle}
              </Text>

              <FileUpload
                label={texts.fileUpload.label}
                hint={texts.fileUpload.hint}
                accept=".xml"
                maxSizeMb={10}
                file={file}
                onFileSelected={handleFileSelected}
                onRemove={handleFileRemove}
                disabled={isSubmitting}
                dropzoneTitle={texts.fileUpload.dropzoneTitle}
                dropzoneDraggingTitle={texts.fileUpload.dropzoneDraggingTitle}
                changeLabel={texts.fileUpload.changeLabel}
                removeLabel={texts.fileUpload.removeLabel}
                errorTypeMessage={texts.fileUpload.errorTypeMessage}
                errorSizeMessage={texts.fileUpload.errorSizeMessage}
              />
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={texts.cancelButton}
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              />
              <Button
                title={texts.submitButton}
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
