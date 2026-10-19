// src/pages/Relatorios/Suprimentos/Ans/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) "ANS" — Relatórios > Suprimentos (F-229,
// lote 076, `F-229-ans-report-contrato-api.md`). Mirror ESTRUTURAL EXATO de
// `Relatorios/Pecuaria/CusteioAnimal/index.tsx` (mesma dupla de botões
// `Baixar PDF`/`Baixar Excel` via `downloadBlob`, loading POR BOTÃO
// independente, `try/catch/finally`, casca `FormContainer` + `<Form>` cru +
// `SimpleGrid`, `D-FE-14` — SEM `<Form formFilter>`, esse modo é do drawer de
// filtro de GRID), MAS sem nenhum campo além do par de datas obrigatório
// (`AnsReportRequest::rules()` real só valida `start_date`/`end_date`/
// `report_type` — sem `animal`/lookup nenhum).
//
// `report_type` vai como STRING (`'pdf'`/`'excel'`) implícito por botão —
// mesma convenção do irmão, NÃO reproduz índice numérico legado (contrato
// §4, divergência documentada: `report_type`, não `type`/`format`).
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

import { ansReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/ans-report-filter-schema';

import {
  downloadAnsReportPdf,
  downloadAnsReportXlsx,
  type AnsReportParams,
} from '@/services/v2/Relatorios/ans-report-service';

// Form values desta tela (page-scoped, não compartilhado).
interface AnsReportFilterForm {
  start_date: string | null;
  end_date: string | null;
}

const pristineValues: AnsReportFilterForm = {
  start_date: null,
  end_date: null,
};

export default function AnsRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.ansReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnsReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: ansReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `CusteioAnimal`/`FiscalNaoFiscal`) — a validação
  // `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: AnsReportFilterForm): AnsReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleExportPdf(data: AnsReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadAnsReportPdf(buildParams(data));
      downloadBlob(blob, 'ans.pdf');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `CusteioAnimal/index.tsx`).
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
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: AnsReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadAnsReportXlsx(buildParams(data));
      downloadBlob(blob, 'ans.xlsx');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
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
            title={text.exportPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
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

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.periodRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
