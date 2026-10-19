// src/pages/Operacional/Weaning/WeaningReportModal.tsx
// -----------------------------------------------------------------------------
// Modal de exportação do Relatório de Desmama (PDF/XLSX) — TASK-WN-FE-05.
// Mirror `Operacional/Appropriations/RevertAppropriationStatusModal.tsx`
// (form dentro de `Dialog.Root`, Chakra v3).
//
// Parâmetros reais confirmados por leitura direta de
// `WeaningController::report()`/`GenerateWeaningReportAction` (fork
// `GB.Cerne.Api`): `start_date`/`end_date`/`format` — todos obrigatórios,
// `format` explícito `'pdf'|'xlsx'` (corrige OQ-10 por construção — nunca
// índice de array). Download SÍNCRONO via blob (sem AsyncJob/202 — a Action
// real gera o PDF/XLSX na mesma requisição), mirror do padrão de download
// blob já usado em `services/v2/Invoices/invoice-service.ts`.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Dialog, Portal, SimpleGrid, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { weaningReportFormatOptions } from '@/constants/weaning/options/weaning-report-format-options';
import type { WeaningReportFormatValue } from '@/constants/weaning/options/weaning-report-format-options';

import { downloadWeaningReport } from '@/services/v2/Weaning/weaning-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export interface WeaningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageGB: LanguageDate;
}

interface WeaningReportFormValues {
  start_date: string | null;
  end_date: string | null;
  format: Option<WeaningReportFormatValue> | null;
}

const pristineFormValues: WeaningReportFormValues = {
  start_date: null,
  end_date: null,
  format: null,
};

function extensionFor(format: WeaningReportFormatValue): string {
  return format === 'xlsx' ? 'xlsx' : 'pdf';
}

export function WeaningReportModal({ isOpen, onClose, languageGB }: WeaningReportModalProps) {
  const text = languageGB.weaning.weaning.report;
  const [isDownloading, setIsDownloading] = useState(false);

  const { control, handleSubmit, watch, reset } = useForm<WeaningReportFormValues>({
    defaultValues: pristineFormValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(pristineFormValues);
  }, [isOpen]);

  const reportMutation = useMutation({
    mutationFn: downloadWeaningReport,
    onMutate: () => setIsDownloading(true),
    onSuccess: (blob, variables) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-desmama.${extensionFor(variables.format)}`;
      link.click();
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      onClose();
    },
    onError: (error) => {
      setIsDownloading(false);
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? text.errorToast,
        duration: 7000,
      });
    },
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const format = watch('format');
  const canSubmit = !!startDate && !!endDate && !!format;

  function onSubmit(data: WeaningReportFormValues) {
    if (!data.start_date || !data.end_date || !data.format) return;
    reportMutation.mutate({
      start_date: data.start_date,
      end_date: data.end_date,
      format: data.format.value,
    });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isDownloading) onClose();
      }}
      lazyMount
      unmountOnExit
      // FIX de homologação — o calendário do `DateInput` (react-datepicker)
      // escapa via `portalId="date-input-portal"` (GAP-OS-05) para um nó
      // fora da árvore do `Dialog.Content` (irmão direto de `document.body`).
      // O Dialog v3 (Zag/Ark) é `modal` por padrão: ao abrir, aplica
      // `pointer-events: none` no `<body>` e só EXCETUA os nós listados em
      // `persistentElements` — sem essa exceção, o clique num dia do
      // calendário atravessa o próprio calendário (pointer-events bloqueado)
      // e acerta o `Dialog.Backdrop` por trás, disparando `onOpenChange`
      // como clique-fora e fechando o modal antes de aplicar a data.
      // `persistentElements` resolve os dois lados do mesmo mecanismo:
      // mantém `pointer-events: auto` no portal do calendário E marca esse
      // nó como "dentro" para o dismissable-layer não tratar o clique como
      // outside-interact. Resolvido em runtime (função, não ref) — o nó só
      // existe depois que o `DatePicker` abre pela 1ª vez.
      persistentElements={[() => document.getElementById('date-input-portal')]}
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <SimpleGrid columns={2} gap={4}>
                    <Controller
                      name="start_date"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Field label={text.fields.startDate} isRequired>
                          <DateInput
                            value={value ?? null}
                            onChange={onChange}
                            disabled={isDownloading}
                          />
                        </Field>
                      )}
                    />
                    <Controller
                      name="end_date"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Field label={text.fields.endDate} isRequired>
                          <DateInput
                            value={value ?? null}
                            onChange={onChange}
                            disabled={isDownloading}
                          />
                        </Field>
                      )}
                    />
                  </SimpleGrid>

                  <Controller
                    name="format"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        label={text.fields.format}
                        isRequired
                        isDisabled={isDownloading}
                        options={weaningReportFormatOptions.options(languageGB)}
                        value={field.value ?? null}
                        onChange={(option) => field.onChange(option ?? null)}
                      />
                    )}
                  />
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={text.cancelButton}
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={isDownloading}
                />
                <Button
                  title={text.submitButton}
                  type="submit"
                  loading={isDownloading}
                  disabled={!canSubmit}
                />
              </Dialog.Footer>
            </Form>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
