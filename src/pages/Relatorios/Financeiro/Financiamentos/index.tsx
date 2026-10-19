// src/pages/Relatorios/Financeiro/Financiamentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Financeiro > Financiamentos" (F-265, execução
// 97-Esteiras/078, TASK-F265-F03). Rota `/relatorios/financeiro/
// financiamentos`, materializa o item de menu FILHO
// `rel-fin-financiamentos`, filho do grupo `rel-fin` ("Financeiro",
// `navigationTree.ts`).
//
// Mirror ESTRUTURAL de `Relatorios/Estoque/SaidasCentroCusto/index.tsx`
// (F-301) — casca `FormContainer` + footer com 2 botões PDF/Excel via
// `SimpleGrid`, `DateInput` via `Controller` — porém MAIS ENXUTO: F-265 é o
// relatório mais simples do lote, **SEM selects** (sem `center`/
// `warehouse`/`product`), portanto SEM `useQuery` de options e SEM
// `useEffect` de reset por fazenda (guardrail farm-scoped não se aplica —
// não há nenhum campo farm-scoped no filtro).
//
// 2 campos de filtro fiéis ao legado (contrato §Filtro): `start_date`/
// `end_date` OBRIGATÓRIOS (RN-04). `report_type` NÃO é um campo do form —
// os 2 botões do footer fixam o literal `pdf`/`excel` (FRONT-04, decisão já
// resolvida DEC-049: 2 botões, não um Select "Tipo de Relatório").
//
// Endpoint DELIVERED (evidência viva `routes/api.php:2274`, reconciliação
// obrigatória do plano): `GET /reports/financings` (COM prefixo `reports/`,
// DIFERENTE do path raiz do F-301). Nome do arquivo Excel FIXO do legado:
// `relatorio_financiamentos.xlsx`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { financingsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/financings-report-filter-schema';

import {
  downloadFinancingsReportExcel,
  downloadFinancingsReportPdf,
  toFinancingsReportParams,
} from '@/services/v2/Relatorios/financings-report-service';

import type { FinancingsReportFormValues } from '@/@types/v2/Relatorios/financings-report';

const pristineValues: FinancingsReportFormValues = {
  start_date: null,
  end_date: null,
};

export default function FinanciamentosRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.financingsReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancingsReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: financingsReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `SaidasCentroCusto`).
  async function notifyDownloadError(error: unknown) {
    const parsed = await parseBlobError(error);
    const fieldMessage = parsed.errors
      ? Object.values(parsed.errors)
          .flat()
          .find((message): message is string => typeof message === 'string')
      : undefined;
    toaster.error({
      title: text.pageTitle,
      description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
    });
  }

  async function handleDownloadPdf(values: FinancingsReportFormValues) {
    const params = toFinancingsReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadFinancingsReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `SaidasCentroCusto`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: FinancingsReportFormValues) {
    const params = toFinancingsReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadFinancingsReportExcel(params);
      downloadBlob(blob, `${text.exportFileName}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
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
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
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
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
