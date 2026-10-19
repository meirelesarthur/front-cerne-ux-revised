// src/pages/Relatorios/Pecuaria/EvolucaoRebanho/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) de EVOLUÇÃO/REBANHO — Relatórios > Pecuária
// (Tarefa 27, spa-contract-evolucao-rebanho.md §5). Substitui
// `evolution-animals.report` do legado. SEM prévia — o servidor devolve o
// binário pronto na mesma resposta (`GET /evolutions/report`), mirror
// estrutural de `Administrativo/SaldoEstoque/SaldoEstoqueRelatorio.tsx` (2
// exports, sem prévia) + `Relatorios/Suprimentos/index.tsx` (rodapé do
// `FormContainer`, `parseDownloadError`).
//
// Defeitos preservados AS-IS (DEC-027, `GAP-EVO-01`/`GAP-EVO-02`,
// `GAP-EVO-FE-02`/`GAP-EVO-FE-04`) — NÃO "conserte": sem filtro de fazenda
// client-side (o relatório devolve dados de TODAS as fazendas, divergindo
// da listagem da Tarefa 26, que filtra pela fazenda ativa), sem gate de
// permissão na rota (ver router/index.tsx).
//
// Ajuste UX (esteira 060, teste manual do dono): os avisos de "PDF só
// suporta até 90 dias" e "este relatório considera todas as fazendas do
// grupo" foram REMOVIDOS — o cap de 90 dias e o escopo por fazenda ativa já
// foram corrigidos no backend, os textos ficaram obsoletos. Os 2 botões
// separados ("Gerar PDF" + "Exportar Excel") viraram 1 select de Formato +
// 1 único botão "Gerar relatório", mirror estrutural de
// `Relatorios/Pecuaria/AnaliseMovimentacaoLote/index.tsx` (`type`/
// `downloadButton`) — a lógica de download (blob) de cada formato é
// preservada EXATAMENTE, só o gatilho de UI foi unificado.
//
// Loading ÚNICO (`isDownloading`, `useState` local + try/catch/finally) —
// NUNCA mutation TanStack para binário, convenção do fork. `parseDownloadError`
// converte o `Blob` do 422 para texto/JSON antes de ler `message` (axios não
// parseia o corpo de erro com `responseType: 'blob'`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';
import { evolutionReportFormatOptions } from '@/constants/evolutions/options/evolution-report-format-options';

import { evolutionReportFilterSchema } from '@/validations/schemas/Evolutions/evolution-report-filter-schema';

import {
  downloadEvolutionsReportPdf,
  downloadEvolutionsReportXlsx,
} from '@/services/v2/Evolutions/evolution-service';

import type { LanguageDate } from '@/@types/language';
import type { EvolutionReportFilterForm } from '@/@types/v2/Evolutions';

// Com `responseType: 'blob'`, um erro JSON (422) chega como `Blob`, não como
// objeto já parseado pelo axios — converte de volta para texto/JSON antes de
// ler `message` (mirror de `Relatorios/Suprimentos/index.tsx::parseDownloadError`).
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

function buildPristineValues(languageGB: LanguageDate): EvolutionReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    format: evolutionReportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function EvolucaoRebanhoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.evolutions.evolution.report;

  const { control, handleSubmit, watch } = useForm<EvolutionReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(evolutionReportFilterSchema(languageGB)) as any,
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botão desabilitado até as 2 datas estarem preenchidas (mirror
  // `hasValidTrigger` de `Relatorios/Suprimentos/index.tsx`) — a validação
  // `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  async function handleDownload(data: EvolutionReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = { start_date: data.start_date as string, end_date: data.end_date as string };

      // Formato decide qual função de download chamar — só de UI, NUNCA
      // enviado como querystring literal (a API usa `type=1` para Excel,
      // `CL-19`, preservado em `evolution-service.ts`).
      const isExcel = data.format?.value === 'excel';
      const blob = isExcel
        ? await downloadEvolutionsReportXlsx({ ...params, type: 1 })
        : await downloadEvolutionsReportPdf(params);

      downloadBlob(blob, isExcel ? 'evolucao-rebanho.xlsx' : 'evolucao-rebanho.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      const { message } = await parseDownloadError(error);
      toaster.error({ title: text.pageTitle, description: message || text.toasts.genericError });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.downloadButton}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={!hasValidRange || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filter.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isDownloading} />
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isDownloading} />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="format"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.format}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={evolutionReportFormatOptions.options(languageGB)}
                    noClearable
                    isDisabled={isDownloading}
                  />
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
