// src/pages/Relatorios/Agricultura/PrevisaoAreaReceita/index.tsx
// -----------------------------------------------------------------------------
// Tela "Prev. Área/Receita — Relatório" (F-280, TASK-MFA-FE-03, esteira 075).
// Rota `/relatorios/agricultura/previsao-area-receita`, materializa o item de
// menu FILHO `rel-agr-prev`, sob o grupo/submenu `rel-agr` ("Agricultura",
// `navigationTree.ts`) — 2º filho, ao lado de `rel-agr-apo` ("Apontamento
// Máquina").
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/Dre/index.tsx` +
// `Relatorios/Estoque/MovimentacaoEstoque/index.tsx` (`FormContainer` +
// footer + `<Form onSubmit={preventDefault}>` + `SimpleGrid
// columns={columnsForm.default}`, download via Blob + `downloadBlob`, erro
// 422-como-Blob tratado via `parseBlobError`) — SEM grid/prévia (contrato de
// tela §1, endpoint só expõe o binário PDF).
//
// 8 campos de filtro NA ORDEM EXATA do legado (contrato de tela §2): Ciclo
// de Produção (JS-only, cascata `usePrevisaoAreaReceitaProductionCycleCascade`),
// Área (multiselect local, `getAreasOptions` FLAT), Dt. Início, Dt. Fim,
// Variedade (SEM `is_enabled`, `CL-16`), Colheita (estático 1-4, `CL-17`),
// Semana Ano, Ano (pré-preenchido com o ano corrente, `CL-18`, NÃO
// obrigatório). Nenhum campo é obrigatório (`CL-37`) — o botão "Baixar PDF"
// NUNCA desabilita por campo vazio, só durante o download em andamento.
//
// Permissão `markings_prev_area_view` agora É enforced no servidor (`CL-05`
// corrigido) — rota GATEADA (mirror `rel-agr-apo`/`ApontamentoMaquina`,
// `GAP-APONT-01`), não só o atalho de menu.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { markingForecastAreaReportHarvestOrderOptions } from '@/constants/Relatorios/agricultura/marking-forecast-area-report/options';

import { markingForecastAreaReportFilterSchemaResolver } from '@/validations/schemas/PrevisaoAreaReceita/marking-forecast-area-report-filter-schema';

import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import { listProductionCycles } from '@/services/v2/ProductionCycles/production-cycle-service';
import {
  downloadMarkingForecastAreaReportPdf,
  getAreasOptions,
} from '@/services/v2/Relatorios/Agricultura/marking-forecast-area-report-service';

import type { Option } from '@/@types/option';
import type { CultivationOption } from '@/@types/v2/Cultivation/cultivation';
import type { ProductionCycle } from '@/@types/v2/ProductionCycles';
import type {
  MarkingForecastAreaReportFilterForm,
  MarkingForecastAreaReportParams,
} from '@/@types/v2/Relatorios/Agricultura/markingForecastAreaReport';

import { usePrevisaoAreaReceitaProductionCycleCascade } from './usePrevisaoAreaReceitaProductionCycleCascade';

function mapProductionCycleOption(item: ProductionCycle): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapVarietyOption(item: CultivationOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

const pristineValues: MarkingForecastAreaReportFilterForm = {
  production_cycle: null,
  areas: null,
  start_date: null,
  end_date: null,
  variety: null,
  order: null,
  week: '',
  year: String(new Date().getFullYear()), // CL-18 — pré-preenchido, não obrigatório
};

export default function PrevisaoAreaReceitaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.markingForecastAreaReport.report;

  const { control, handleSubmit, register, watch, setValue } =
    useForm<MarkingForecastAreaReportFilterForm>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: markingForecastAreaReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    });

  const { handleManualFieldChange } = usePrevisaoAreaReceitaProductionCycleCascade({
    watch,
    setValue,
  });

  // Lookup local de Áreas — `areas/options` é FLAT (sem paginação real),
  // mirror EXATO `CreateOrUpdateRainfall.tsx`/`FilterSideFeedlotDashboard.tsx`.
  const areasQuery = useQuery({
    queryKey: [
      queryKey.productionCycles.productionCycles,
      'marking-forecast-area-report-areas-options',
    ],
    queryFn: getAreasOptions,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const areaOptions: Option<string>[] = (areasQuery.data ?? []).map((area) => ({
    label: area.description,
    value: area.uuid,
  }));

  const harvestOrderOptions = markingForecastAreaReportHarvestOrderOptions(languageGB).options();

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: MarkingForecastAreaReportFilterForm): MarkingForecastAreaReportParams {
    return {
      areas: data.areas?.length ? data.areas.map((option) => option.value) : undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      variety_id: data.variety?.value || undefined,
      order: data.order?.value || undefined,
      week: data.week.trim() ? Number(data.week.trim()) : undefined,
      year: data.year.trim() ? Number(data.year.trim()) : undefined,
      // production_cycle NUNCA aqui — JS-only (CL-10), resolvido pela cascata.
    };
  }

  async function handleDownload(data: MarkingForecastAreaReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadMarkingForecastAreaReportPdf(buildParams(data));
      downloadBlob(blob, 'relatorio-previsao-area.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
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
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="production_cycle"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.productionCycle}
                placeholder={text.productionCyclePlaceholder}
                service={listProductionCycles}
                mapOptions={mapProductionCycleOption}
                findParams={() => ({})}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="areas"
            control={control}
            render={({ field }) => (
              <Select
                label={text.fields.areas}
                placeholder={text.areasPlaceholder}
                name={field.name}
                value={field.value ?? null}
                onChange={(options: Option<string>[] | null) => {
                  field.onChange(options ?? []);
                  handleManualFieldChange();
                }}
                options={areaOptions}
                multiple
                loading={areasQuery.isPending}
              />
            )}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {text.fields.startDate}
            </Text>
            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={(date) => {
                    onChange(date);
                    handleManualFieldChange();
                  }}
                />
              )}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {text.fields.endDate}
            </Text>
            <Controller
              name="end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={(date) => {
                    onChange(date);
                    handleManualFieldChange();
                  }}
                />
              )}
            />
          </Box>

          <Controller
            name="variety"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.variety}
                placeholder={text.varietyPlaceholder}
                service={listCultivationOptions}
                mapOptions={mapVarietyOption}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="order"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.fields.order}
                name={name}
                value={value}
                onChange={(option: Option<number> | null) => onChange(option ?? null)}
                options={harvestOrderOptions}
              />
            )}
          />

          <Input type="number" min={1} label={text.fields.week} {...register('week')} />

          <Input type="number" label={text.fields.year} {...register('year')} />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
