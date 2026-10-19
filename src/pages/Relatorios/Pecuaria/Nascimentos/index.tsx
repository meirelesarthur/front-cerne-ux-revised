// src/pages/Relatorios/Pecuaria/Nascimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Nascimentos — Relatório" GENÉRICO (F-236, esteira
// CORE_WORKSPACE/97-Esteiras/053, TASK-053-236-FE-02). Rota
// `/relatorios/pecuaria/nascimentos`, materializa o item de menu FILHO
// `rel-pec-nascimentos`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`).
//
// Casco mirror `Relatorios/Pecuaria/ManejoLote/index.tsx` (F-279, esteira
// 051) — `FormContainer` + `Form` cru (sem `formFilter`, D-FE-14: esta tela
// não tem grid) + footer com 1 botão, download via Blob + `downloadBlob` +
// `parseBlobError`. Select de `format` (`reportFormatOptions`, `noClearable`,
// default `pdf`) reaproveitado DIRETO de
// `Relatorios/Financeiro/ContasAPagar/index.tsx` (F-262, esteira 050) — o
// molde `ManejoLote` não tem esse campo (só PDF).
//
// Distinto do irmão SISBOV (F-235, esteira 052, `nascimentos-sisbov`): este
// relatório é PDF+Excel (`format`), datas OBRIGATÓRIAS (`start_date`/
// `end_date`) e tem filtro de categoria (`category_uuid`, alimentado por
// `GET /birth-report/options`) — contrato de tela diferente, não reaproveitar
// a tela irmã além da casca.
//
// SEM CASCATA: categoria/formato/datas são 3 filtros INDEPENDENTES entre si
// (contrato legado, dimensão "cascatas" = `NAO_APLICAVEL`). Nenhum
// `useEffect` de preenchimento cruzado nesta tela.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
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
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { birthReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/birth-report-filter-schema';

import {
  downloadBirthReport,
  getBirthReportOptions,
} from '@/services/v2/Relatorios/birth-report-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BirthReportFilterForm, BirthReportParams } from '@/@types/v2/Relatorios/birth-report';

function buildPristineValues(languageGB: LanguageDate): BirthReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    category_uuid: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function NascimentosRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.birthReport.report;

  const { control, handleSubmit, watch } = useForm<BirthReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: birthReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // Categorias — `useQuery` cru (mirror `ManejoLote`): 1 único lookup sem
  // paginação, sem hook orquestrador dedicado; não há ID de contexto/edição,
  // é filtro efêmero de tela de relatório.
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.birthReportOptions],
    queryFn: getBirthReportOptions,
  });

  const categories = optionsQuery.data?.categories ?? [];
  const categoryOptions: Option<string>[] = categories.map((category) => ({
    value: category.uuid,
    label: category.label,
  }));

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: BirthReportFilterForm): BirthReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      category_uuid: data.category_uuid?.value || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: BirthReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadBirthReport(buildParams(data));
      downloadBlob(blob, `nascimentos.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `ManejoLote`/`ContasAPagar`).
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
            title={text.downloadButton}
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
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
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
            </Box>

            <Controller
              name="category_uuid"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.category}
                  placeholder={text.categoryPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={categoryOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
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
