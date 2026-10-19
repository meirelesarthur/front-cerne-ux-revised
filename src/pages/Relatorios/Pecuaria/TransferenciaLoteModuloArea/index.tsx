// src/pages/Relatorios/Pecuaria/TransferenciaLoteModuloArea/index.tsx
// -----------------------------------------------------------------------------
// Tela "Transf/Lote/Módulo/Área — Relatório" (F-329, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-329-plano-front.md). Rota
// `/relatorios/pecuaria/transferencia-lote-modulo-area`, materializa o item
// de menu FILHO `rel-pec-tba`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`). Mirror ESTRUTURAL EXATO de
// `Relatorios/Pecuaria/ManejoLote/index.tsx` (F-279, esteira 051) —
// REMOVENDO o campo/Controller `category` e o universo
// `categories`/`categoryOptions` correspondente (contrato legado §2 desta
// tela só lista `start_date`/`end_date`/`batch_id`, sem universo de
// categoria).
//
// Casco mirror `FormContainer` + `footer` com 1 botão "Baixar PDF", SEM
// prévia (contrato de API só expõe binário), download via Blob +
// `downloadBlob` + `parseBlobError` — mesmo par de backend do próprio
// `ManejoLote` (`BatchRepositoryInterface::listOptions`, citado no
// `mirror_direto` de `F-329-plano-api.md`).
//
// SEM CASCATA: `batch_id`/datas são filtros INDEPENDENTES entre si (contrato
// legado §2). Nenhum `useEffect` de preenchimento cruzado nesta tela.
//
// SÓ PDF — sem seletor de formato (contrato de API confirma "SEM
// `report_type`"). Filename PRÓPRIO (`transferencia-lote-modulo-area.pdf`),
// NÃO reproduzindo o defeito cosmético do legado (`ficha_animal.pdf`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { transferBatchGrazingAreaReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/transfer-batch-grazing-area-report-filter-schema';

import {
  downloadTransferBatchGrazingAreaReportPdf,
  getTransferBatchGrazingAreaReportOptions,
} from '@/services/v2/Relatorios/transfer-batch-grazing-area-report-service';

import type { Option } from '@/@types/option';
import type {
  TransferBatchGrazingAreaReportFilterForm,
  TransferBatchGrazingAreaReportParams,
} from '@/@types/v2/Relatorios/transfer-batch-grazing-area-report';

const pristineValues: TransferBatchGrazingAreaReportFilterForm = {
  start_date: null,
  end_date: null,
  batch_id: null,
};

export default function TransferenciaLoteModuloAreaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.transferBatchGrazingAreaReport.report;

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<TransferBatchGrazingAreaReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: transferBatchGrazingAreaReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.transferBatchGrazingAreaReportOptions],
    queryFn: getTransferBatchGrazingAreaReportOptions,
  });

  const batches = optionsQuery.data?.batches ?? [];

  const batchOptions: Option<string>[] = batches.map((batch) => ({
    value: batch.uuid,
    label: batch.label,
  }));

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: TransferBatchGrazingAreaReportFilterForm
  ): TransferBatchGrazingAreaReportParams {
    return {
      batch_id: data.batch_id?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: TransferBatchGrazingAreaReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadTransferBatchGrazingAreaReportPdf(buildParams(data));
      downloadBlob(blob, 'transferencia-lote-modulo-area.pdf');
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
            disabled={!isValid || isDownloading}
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                  />
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                  />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="batch_id"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <SelectCombobox
                  label={text.fields.batchId}
                  placeholder={text.batchIdPlaceholder}
                  name={name}
                  value={value ?? null}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={batchOptions}
                  loading={optionsQuery.isPending}
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
