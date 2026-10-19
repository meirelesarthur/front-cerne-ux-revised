// src/pages/Relatorios/Pecuaria/ManejoLote/index.tsx
// -----------------------------------------------------------------------------
// Tela "Manejo/Lote — Relatório" (F-279, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-279-FE-02). Rota
// `/relatorios/pecuaria/manejo-lote`, materializa o item de menu FILHO
// `rel-pec-man`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`). Fan-out do canário
// `Relatorios/Agricultura/ProducaoCusteioArea/index.tsx` (F-298).
//
// Casco mirror `Relatorios/Financeiro/Dre/index.tsx` (F-259, esteira 049) —
// `FormContainer` + `footer` com 1 botão "Baixar PDF", SEM prévia (contrato
// de API só expõe binário), download via Blob + `downloadBlob` +
// `parseBlobError` — mesmo arquétipo do canário F-298 (contrato de API de
// F-279 também é 1 único GET, PDF inline, sem endpoint de prévia).
//
// Referência UX: `EstoqueConsolidadoReportPage.tsx` (commit `86634905`,
// roteiro-front-F279 §"Passo UX obrigatório") — adaptação documentada:
// `MultiSelectField`/`FormSelect`/`ReportWorkspace` do Storybook NÃO são
// importados 1:1; `category`/`batch` são `<Select>` SIMPLES (sem
// `multiple`) — o legado usa `select2` de valor único para os 2 filtros
// (contrato legado §6 `field_manifest`, FM-01/FM-02), nunca picklist
// múltiplo (diferente do irmão F-298, que usa `<Select multiple>` para
// `areas[]`).
//
// SEM CASCATA (diferente do canário F-298, que tem IG-01/IG-02 client-side
// sobre `/options`): `category`/`batch`/datas são 3 filtros INDEPENDENTES
// entre si (contrato legado §6, dimensão "cascatas" = `NAO_APLICAVEL`, prova
// de ausência já fechada pelo Extrator). Nenhum `useEffect` de preenchimento
// cruzado nesta tela.
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

import { managementBatchReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/management-batch-report-filter-schema';

import {
  downloadManagementBatchReportPdf,
  getManagementBatchReportOptions,
} from '@/services/v2/Relatorios/management-batch-report-service';

import type { Option } from '@/@types/option';
import type {
  ManagementBatchReportFilterForm,
  ManagementBatchReportParams,
} from '@/@types/v2/Relatorios/management-batch-report';

const pristineValues: ManagementBatchReportFilterForm = {
  category: null,
  batch: null,
  start_date: null,
  end_date: null,
};

export default function ManejoLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.managementBatchReport.report;

  const { control, handleSubmit, watch } = useForm<ManagementBatchReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: managementBatchReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.managementBatchReportOptions],
    queryFn: getManagementBatchReportOptions,
  });

  const categories = optionsQuery.data?.categories ?? [];
  const batches = optionsQuery.data?.batches ?? [];

  const categoryOptions: Option<string>[] = categories.map((category) => ({
    value: category.uuid,
    label: category.label,
  }));

  const batchOptions: Option<string>[] = batches.map((batch) => ({
    value: batch.uuid,
    label: batch.label,
  }));

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: ManagementBatchReportFilterForm): ManagementBatchReportParams {
    return {
      category: data.category?.value || undefined,
      batch: data.batch?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: ManagementBatchReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadManagementBatchReportPdf(buildParams(data));
      downloadBlob(blob, 'manejo-lote.pdf');
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
            title={text.downloadPdfButton}
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
            <Controller
              name="category"
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
              name="batch"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={batchOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

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
