// src/pages/Relatorios/Financeiro/EstoqueFinanceiro/index.tsx
// -----------------------------------------------------------------------------
// Tela "Estoque Financeiro — Relatório" (F-241, TASK-013-241-FE-03, esteira
// 97-Esteiras/013). Rota `/relatorios/financeiro/estoque-financeiro`,
// materializa o item de menu FILHO `rel-fin-estoque-financeiro`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Referência UX (padrão estabelecido em produção, NÃO mockup do Storybook —
// correção do dono 2026-09-08,
// `97-Esteiras/013/ROTEIROS/roteiro-front-F241-estoque-financeiro.md` v2
// §0.0/§1): mirror ESTRUTURAL de
// `Relatorios/Financeiro/FluxoCaixaMensal/index.tsx` (F-240) @
// `875ca2e77826169d1f1eb151ed4917b9f0779eaf` — `FormContainer` + footer com
// 1 único botão "Gerar relatório", `useState isDownloading` (NUNCA
// `useMutation` para binário), `downloadBlob`+`parseBlobError`, prioridade
// de mensagem específica de campo sobre a genérica — REDUZIDO a exatamente
// 3 campos (2 datas + `format`, CL-16): sem `group`/`accounts`/
// `last_balance`/`proprietary_id`/`center_id`/`farm_id`/`report_type` — este
// relatório não tem esses filtros.
//
// `DE-01` FECHADA (2026-09-08) = download-only puro: SEM prévia, SEM
// tabela, SEM 2º botão. A tabela do legado só existe *dentro* do PDF/Excel
// gerado pela API (EV-12/EV-14) — o front nunca renderiza linha.
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

import { cashflowProductReportFilterSchemaResolver } from '@/validations/schemas/CashflowProductReport/cashflow-product-report-filter-schema';

import { downloadCashflowProductReport } from '@/services/v2/CashflowProductReport/cashflow-product-report-service';

import type { LanguageDate } from '@/@types/language';
import type {
  CashflowProductReportFilterForm,
  CashflowProductReportParams,
} from '@/@types/v2/CashflowProductReport';

function buildPristineValues(languageGB: LanguageDate): CashflowProductReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function EstoqueFinanceiroRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.cashflowProductReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CashflowProductReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: cashflowProductReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const formatOptions = reportFormatOptions.options(languageGB);

  function buildParams(data: CashflowProductReportFilterForm): CashflowProductReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: CashflowProductReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadCashflowProductReport(params);
      downloadBlob(blob, `estoque-financeiro.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `FluxoCaixaMensal`/`ContasAPagar`/`CentroCusto`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.downloadError,
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
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.start_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_date?.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={formatOptions}
                  noClearable
                  error={errors.format?.message}
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
