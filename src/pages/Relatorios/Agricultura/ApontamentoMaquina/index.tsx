// src/pages/Relatorios/Agricultura/ApontamentoMaquina/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) de Apontamento Máquina — Relatórios >
// Agricultura (Tarefa 46, frontend-contract-apontamento-maquina.md §8).
// Substitui `appropriation-equipments-report` do legado. SEM prévia — o
// servidor devolve o binário pronto na mesma resposta (`GET
// /appropriation-equipments-report`), mirror ESTRUTURAL de
// `Relatorios/Pecuaria/EvolucaoRebanho/index.tsx` (2 campos de data, sem 3º
// filtro).
//
// Diferente de `EvolucaoRebanho`: esta rota TEM guard de permissão (mirror
// `Relatorios/Pecuaria/SanitarioLote/index.tsx`, ver router/index.tsx) — a
// API corrigiu a autorização por construção (`GAP-APONT-01`), então o front
// replica o guard em vez de preservar o "sem RequirePermission" daquele
// precedente. O gate em si vive no arquivo de rotas, não nesta página.
//
// Loading POR BOTÃO (`isExportingPdf`/`isExportingXlsx`, `useState` local +
// try/catch/finally) — NUNCA mutation TanStack para binário, convenção do
// fork. `parseDownloadError` converte o `Blob` do 422 para texto/JSON antes
// de ler `message` (axios não parseia o corpo de erro com
// `responseType: 'blob'`), mirror EXATO `EvolucaoRebanhoRelatorio`/
// `SanitarioLoteRelatorio`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { isAxiosError } from 'axios';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';

import { appropriationEquipmentReportFilterSchema } from '@/validations/schemas/Appropriations/appropriation-equipment-report-filter-schema';

import {
  downloadAppropriationEquipmentsReportPdf,
  downloadAppropriationEquipmentsReportXlsx,
} from '@/services/v2/Appropriations/appropriation-service';

import type { AppropriationEquipmentReportFilterForm } from '@/@types/v2/Appropriations';

const pristineValues: AppropriationEquipmentReportFilterForm = {
  start_date: null,
  end_date: null,
};

// Com `responseType: 'blob'`, um erro JSON (422) chega como `Blob`, não como
// objeto já parseado pelo axios — converte de volta para texto/JSON antes de
// ler `message` (mirror `EvolucaoRebanhoRelatorio::parseDownloadError`, que
// por sua vez espelha `Relatorios/Suprimentos/index.tsx`).
function extractErrorMessage(parsed: unknown): string | null {
  const body = parsed as { message?: string; errors?: Record<string, string[]> } | undefined;
  const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
  return firstFieldError ?? body?.message ?? null;
}

async function parseDownloadError(
  error: unknown
): Promise<{ status: number | null; message: string | null }> {
  if (!isAxiosError(error)) {
    return { status: null, message: error instanceof Error ? error.message : null };
  }

  const status = error.response?.status ?? null;
  const data = error.response?.data as unknown;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return { status, message: extractErrorMessage(parsed) };
    } catch {
      return { status, message: null };
    }
  }

  return { status, message: extractErrorMessage(data) };
}

export default function ApontamentoMaquinaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.appropriations.appropriation.report;

  const { control, handleSubmit, watch } = useForm<AppropriationEquipmentReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(appropriationEquipmentReportFilterSchema(languageGB)) as any,
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `EvolucaoRebanhoRelatorio`) — a validação
  // `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  async function handleExportPdf(data: AppropriationEquipmentReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadAppropriationEquipmentsReportPdf({
        start_date: data.start_date as string,
        end_date: data.end_date as string,
      });
      downloadBlob(blob, 'apontamento-maquina.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      const { message } = await parseDownloadError(error);
      toaster.error({ title: text.pageTitle, description: message || text.toasts.genericError });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: AppropriationEquipmentReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadAppropriationEquipmentsReportXlsx({
        start_date: data.start_date as string,
        end_date: data.end_date as string,
        type: 1,
      });
      downloadBlob(blob, 'apontamento-maquina.xlsx');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      const { message } = await parseDownloadError(error);
      toaster.error({ title: text.pageTitle, description: message || text.toasts.genericError });
    } finally {
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.exportPdf}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsx}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
            loading={isExportingXlsx}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.twoColumns} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filter.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filter.endDate}
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>
          </SimpleGrid>

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.hint.datesRequired}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
