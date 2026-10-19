// src/pages/Operacional/Carregamento/ChargeReportModal.tsx
// -----------------------------------------------------------------------------
// Modal GENÉRICO dos 2 relatórios PDF de Carregamentos (por produto/semanal),
// TASK-FE-CG-07 — mirror `Operacional/Weaning/WeaningReportModal.tsx` (form
// dentro de `Dialog.Root`, Chakra v3, download SÍNCRONO via blob), MAS
// parametrizado por `{title, downloadFn, filename}` — reusado 2x pelo
// `HeaderTable.tsx` (mesma permissão DIFERENTE por instância, `charge_
// product_report`/`charge_week_report`, gate já resolvido pelo CALLER antes
// de renderizar o botão que abre este modal). Diferente do mirror, SEM
// select de `format` — os 2 relatórios de Carregamento são sempre PDF
// (`ChargeReportController`/`DomPDF::stream()` no servidor).
//
// Parâmetros REAIS confirmados por leitura direta de `ChargeReportController`/
// `ChargeReportRequest` (fork `GB.Cerne.Api`): `start_date`/`end_date`,
// ambos `required|date`, `end_date >= start_date`. `content-type` da
// resposta de sucesso é `application/pdf` — um 422/500 devolve JSON, mas o
// `responseType:'blob'` da requisição também entrega ESSE corpo como
// `Blob` (nunca como objeto parseado); `resolveBlobErrorMessage` abaixo lê o
// `Blob` como texto e faz o parse manual só quando o `Content-Type` indica
// JSON, mirror do racional já documentado em `extractApiErrorMessage.ts`.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Dialog, Portal, SimpleGrid, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { toaster } from '@/components/ui/toaster';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { chargeReportSchemaResolver } from '@/validations/schemas/Carregamentos/charge-report-schema';

import type { LanguageDate } from '@/@types/language';
import type { ChargeReportParams } from '@/@types/v2/Carregamentos';

interface ChargeReportFormValues {
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: ChargeReportFormValues = {
  start_date: null,
  end_date: null,
};

// Lê o corpo de erro de uma requisição `responseType:'blob'` como JSON,
// quando o servidor devolveu um erro de negócio (422/500, `Content-Type:
// application/json`) em vez do PDF esperado. Cai no fallback genérico
// (`extractApiErrorMessage`/`fallbackMessage`) para qualquer outro caso —
// nunca lança, nunca trava o toast de erro.
async function resolveBlobErrorMessage(error: unknown, fallbackMessage: string): Promise<string> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    const blob = error.response.data;
    if (blob.type.includes('json')) {
      try {
        const parsed = JSON.parse(await blob.text());
        const fieldErrors = parsed?.errors;
        if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
          const firstMessages = Object.values(fieldErrors)[0];
          if (Array.isArray(firstMessages) && typeof firstMessages[0] === 'string') {
            return firstMessages[0];
          }
        }
        if (typeof parsed?.message === 'string') return parsed.message;
      } catch {
        // Corpo não era JSON válido — cai no fallback abaixo, sem travar o toast.
      }
    }
  }
  return extractApiErrorMessage(error) ?? fallbackMessage;
}

export interface ChargeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** `downloadChargeReportByProduct`/`downloadChargeWeekReport`
   *  (`charge-report-service.ts`) — injetado pelo caller, mirror
   *  `downloadWeaningReport` do modal original, mas parametrizado. */
  downloadFn: (params: ChargeReportParams) => Promise<Blob>;
  /** Nome do arquivo baixado (ex.: `relatorio-carregamentos-por-produto.pdf`,
   *  mirror do nome real usado em `DomPDF::stream()` no servidor). */
  filename: string;
  languageGB: LanguageDate;
}

export function ChargeReportModal({
  isOpen,
  onClose,
  title,
  downloadFn,
  filename,
  languageGB,
}: ChargeReportModalProps) {
  const text = languageGB.carregamentos.charge.reports;
  const [isDownloading, setIsDownloading] = useState(false);

  const { control, handleSubmit, watch, reset } = useForm<ChargeReportFormValues>({
    resolver: chargeReportSchemaResolver(languageGB),
    defaultValues: pristineFormValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(pristineFormValues);
  }, [isOpen, reset]);

  const reportMutation = useMutation({
    mutationFn: downloadFn,
    onMutate: () => setIsDownloading(true),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      onClose();
    },
    onError: async (error) => {
      setIsDownloading(false);
      const description = await resolveBlobErrorMessage(error, text.errorToast);
      toaster.error({ title, description, duration: 7000 });
    },
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const canSubmit = !!startDate && !!endDate;

  function onSubmit(data: ChargeReportFormValues) {
    if (!data.start_date || !data.end_date) return;
    reportMutation.mutate({ start_date: data.start_date, end_date: data.end_date });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isDownloading) onClose();
      }}
      lazyMount
      unmountOnExit
      // Mesmo FIX de homologação de `WeaningReportModal.tsx` (GAP-OS-05) — o
      // calendário do `DateInput` escapa via portal próprio; sem
      // `persistentElements`, o Dialog v3 trata o clique num dia como
      // clique-fora e fecha o modal antes de aplicar a data.
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
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <SimpleGrid columns={2} gap={4}>
                    <Controller
                      name="start_date"
                      control={control}
                      render={({ field: { value, onChange }, fieldState }) => (
                        <Field
                          label={text.fields.startDate}
                          isRequired
                          errorText={fieldState.error?.message}
                        >
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
                      render={({ field: { value, onChange }, fieldState }) => (
                        <Field
                          label={text.fields.endDate}
                          isRequired
                          errorText={fieldState.error?.message}
                        >
                          <DateInput
                            value={value ?? null}
                            onChange={onChange}
                            disabled={isDownloading}
                          />
                        </Field>
                      )}
                    />
                  </SimpleGrid>
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
