// src/pages/Relatorios/Pecuaria/CustoTotalReproducao/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba OU Excel download)
// de Custo Total de Reprodução — Relatórios > Pecuária (F-328, esteira
// CORE_WORKSPACE/97-Esteiras/008, TASK-FE-CTR-01). Consome
// `GET /api/v1/total-cost-of-reproduction-report`
// (contrato-front-custo-total-reproducao.md §2), permissão
// `total-cost-of-reproduction-report_view` (rota + menu, TASK-FE-CTR-02).
// Sem grid on-screen (`CL-15`) — a tabela é renderizada pelo Blade do
// servidor, já entregue e aprovada em `TASK-CTR-03`.
//
// Mirror ESTRUTURAL DUPLO (contrato de tela §2, "Precedente estrutural"):
//   - `Relatorios/Pecuaria/HistoricoReprodutivo/index.tsx` — casca
//     `FormContainer`, `<Form onSubmit={preventDefault}>` (NÃO o drawer
//     `Form.BodyFilter`/`FooterFilter`, esta tela não tem grid), hint textual
//     sob o grid, e o branch PDF em nova aba (`window.open`, NUNCA
//     `downloadBlob` — a API responde `Content-Disposition: inline`,
//     `GbCerneSnappyReport.php:89-99`, e o legado submetia com
//     `target="_blank"`; `downloadBlob` forçaria download e quebraria a
//     fidelidade observável).
//   - `Relatorios/Pecuaria/NutricaoConsumoLote/index.tsx` — campo `format`
//     (`'pdf'|'xlsx'`, `reportFormatOptions`, NUNCA índice de array — esta
//     API é `format`, não `type: 0|1` como o irmão de domínio
//     `HistoricoReprodutivo`), `useState isDownloading` (não `useMutation`),
//     e `parseBlobError` no `catch` (erro 422 chega como `Blob` por causa de
//     `responseType:'blob'`; prioridade: 1ª mensagem de campo de `errors`,
//     só depois o `message` genérico).
//
// Rótulos "Data Inicial"/"Data Final"/"Tipo de Relatório" são os do Blade
// DESTA tela (`report.blade.php:21,24,27`) — NÃO os do irmão
// `HistoricoReprodutivo` ("Data de Início"/"Data de Fim", rótulos do Blade
// *dele*).
//
// Sem 4º campo `farm_id` (contexto de sessão do legado, ignorado pelo
// próprio controller legado, `CL-08`) — a tenancy vai no header
// `X-Farm-Id` (uuid), anexado automaticamente pelo interceptor de
// `src/services/api.ts:69` via `api.V2`. Sem query de opções — o único
// select é estático. ZERO cálculo/agregação/formatação numérica nesta
// tela (os 3 defeitos de cálculo preservados do legado, GAP-CTR-02/03/04,
// vivem no servidor por decisão do dono — o front exibe o que a API
// devolve, sem tentar corrigir nada).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { totalCostOfReproductionReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/total-cost-of-reproduction-report-filter-schema';

import { downloadTotalCostOfReproductionReport } from '@/services/v2/Relatorios/total-cost-of-reproduction-report-service';

import type { TotalCostOfReproductionReportFilterForm } from '@/@types/v2/Relatorios/total-cost-of-reproduction-report';

export default function CustoTotalReproducaoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.totalCostOfReproductionReport.report;

  const buildPristineValues = (): TotalCostOfReproductionReportFilterForm => ({
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch } = useForm<TotalCostOfReproductionReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: totalCostOfReproductionReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  async function handleDownload(data: TotalCostOfReproductionReportFilterForm) {
    setIsDownloading(true);
    try {
      const format = data.format!.value;
      const blob = await downloadTotalCostOfReproductionReport({
        start_date: data.start_date as string,
        end_date: data.end_date as string,
        format,
      });

      if (format === 'pdf') {
        // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
        // downloadBlob (forçaria download, quebrando a fidelidade ao
        // legado que submetia com `target="_blank"`).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'custo-total-reproducao.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `NutricaoConsumoLote`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.errorToast,
      });
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
            title={text.submitButton}
            icon={Download as any}
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
                {text.filters.startDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
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
                {text.filters.endDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
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
                render={({ field }) => (
                  <Select
                    label={text.fields.reportType}
                    name={field.name}
                    value={field.value}
                    onChange={(option) => field.onChange(option ?? null)}
                    options={reportFormatOptions.options(languageGB)}
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
