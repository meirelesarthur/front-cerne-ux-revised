// src/pages/Relatorios/Pecuaria/NutricaoConsumoLote/index.tsx
// -----------------------------------------------------------------------------
// Tela "Nutrição/Lote — Relatório" (F-288, esteira
// CORE_WORKSPACE/97-Esteiras/053, TASK-288-FE-02). Rota
// `/relatorios/pecuaria/nutricao-consumo-lote`, materializa o item de menu
// FILHO `rel-pec-nut`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`).
//
// Mirror ESTRUTURAL DUPLO (roteiro-front-F288-nutricao.md
// §"Introspecção real do repositório"):
//   - `Relatorios/Pecuaria/ManejoLote/index.tsx` (F-279) — MESMO domínio de
//     dados/grupo de menu, casca `FormContainer` + footer 1 botão, `<Form
//     onSubmit={preventDefault}>` + `SimpleGrid columns={columnsForm.default}`,
//     2 `<Select>` SIMPLES independentes (`category`/`batch`, SEM cascata,
//     nenhum `useEffect` cruzado) + 2 `DateInput` obrigatórios com hint
//     textual, `useQuery` único para `/options`, `useState isDownloading`.
//   - `Relatorios/Estoque/LoteFornecedor/index.tsx` (F-324) +
//     `Relatorios/Financeiro/ContasAPagar/index.tsx` (F-262) — precedente
//     EXATO do campo `format`: `Controller name="format"` com `<Select
//     noClearable>`, `options={reportFormatOptions.options(languageGB)}`,
//     default `pdf`. Único botão de download (a API decide o binário pelo
//     parâmetro `format`, não por 2 rotas).
//
// NÃO confundir com a irmã `ManejoLoteRelatorio` (mesmo domínio de dados,
// mesmo grupo de menu) — rota/ícone DISTINTOS
// (`nutricao-consumo-lote`/`Wheat` vs. `manejo-lote`/`ClipboardList`).
//
// Referência UX (Passo UX): `ReportWorkspace`
// (`src/components/ui/ReportWorkspace.tsx`+`.stories.tsx`, `ux_root`
// GB.Cerne.UX, commit `866349051c36d59bc3a1850f855a08f7a368da92` — sem
// drift, confirmado nesta Tarefa via `git -C GB.Cerne.UX rev-parse HEAD`).
// Adaptação (não cópia 1:1) já documentada pelo irmão `ManejoLote`.
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

import { nutritionConsumptionReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/nutrition-consumption-report-filter-schema';

import {
  downloadNutritionConsumptionReport,
  getNutritionConsumptionReportOptions,
} from '@/services/v2/Relatorios/nutrition-consumption-report-service';

import type { Option } from '@/@types/option';
import type {
  NutritionConsumptionReportFilterForm,
  NutritionConsumptionReportParams,
} from '@/@types/v2/Relatorios/nutrition-consumption-report';

export default function NutricaoConsumoLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.nutritionConsumptionReport.report;

  const buildPristineValues = (): NutritionConsumptionReportFilterForm => ({
    category: null,
    batch: null,
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch } = useForm<NutritionConsumptionReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: nutritionConsumptionReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.nutritionConsumptionReportOptions],
    queryFn: getNutritionConsumptionReportOptions,
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

  function buildParams(
    data: NutritionConsumptionReportFilterForm
  ): NutritionConsumptionReportParams {
    return {
      category: data.category?.value || undefined,
      batch: data.batch?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: NutritionConsumptionReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadNutritionConsumptionReport(params);
      downloadBlob(blob, `nutricao-consumo-lote.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `ManejoLote`/`LoteFornecedor`).
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
