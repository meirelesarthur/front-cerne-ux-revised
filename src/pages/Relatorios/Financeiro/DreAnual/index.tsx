// src/pages/Relatorios/Financeiro/DreAnual/index.tsx
// -----------------------------------------------------------------------------
// Tela "DRE Anual — Relatório" (F-258, TASK-DRE-FE-04, esteira 049). Rota
// `/relatorios/financeiro/dre-anual`, 2º item de menu FILHO
// (`rel-fin-dre-annual`) sob o grupo/submenu `rel-fin` ("Financeiro").
//
// Mirror EXATO da tela irmã (`Relatorios/Financeiro/Dre/index.tsx`), trocando
// o par de `DateInput` (`start_date`/`end_date`) por um par de `Select` de
// ano (`start_year`/`end_year`, fábrica `yearOptions`,
// `src/constants/options/years.ts`) — tudo mais (ausência de "Fazenda",
// ausência de cascata, ação única "Baixar PDF") é idêntico.
//
// Piso do range de ano: 2022 (constante de negócio, pendência leve NÃO
// bloqueante sobre a razão exata do número — `contrato-tela-dre-anual-fe.md`
// "Leitura do dev" / LC-FE-08. Ajustar aqui se o dev confirmar outro valor).
// Teto: ano corrente (`new Date().getFullYear()`, dinâmico — mirror do teto
// de validação do backend, nunca hardcode).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { yearOptions } from '@/constants/options/years';

import { dreAnnualReportFilterSchemaResolver } from '@/validations/schemas/Dre/dre-annual-report-filter-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { downloadDreAnnualReport } from '@/services/v2/Dre/dre-annual-report-service';
import type { DreTypeReport } from '@/services/v2/Dre/dre-report-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

// LC-FE-08 (contrato-tela-dre-anual-fe.md) — piso não confirmado, default
// aplicado enquanto o dev não corrigir. NÃO é um UX-GAP.
const DRE_ANNUAL_YEAR_FLOOR = 2022;

interface DreAnnualReportFilterForm {
  type_report: DreTypeReport | null;
  start_year: number | null;
  end_year: number | null;
  center_id: Option<string> | null;
}

// AJUSTE HOMOLOGAÇÃO 049 (item 1): Visão parte com "Sintético" (`type_report:
// 1`) pré-selecionado — a tela não abre mais com o Select vazio.
const pristineValues: DreAnnualReportFilterForm = {
  type_report: 1,
  start_year: null,
  end_year: null,
  center_id: null,
};

export default function DreAnualRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.dreAnnual.report;

  const typeReportOptions: Option<DreTypeReport>[] = [
    { value: 1, label: text.typeReportOptions.synthetic },
    { value: 2, label: text.typeReportOptions.analytical },
  ];

  const currentYear = new Date().getFullYear();
  const yearSelectOptions: Option<number>[] = yearOptions(DRE_ANNUAL_YEAR_FLOOR, currentYear);

  const { control, handleSubmit, watch } = useForm<DreAnnualReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: dreAnnualReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startYearValue = watch('start_year');
  const endYearValue = watch('end_year');
  const hasValidRange = !!startYearValue && !!endYearValue;

  function buildParams(data: DreAnnualReportFilterForm) {
    return {
      type_report: data.type_report as DreTypeReport,
      start_year: data.start_year as number,
      end_year: data.end_year as number,
      // Defesa em profundidade: nunca envia `center_id` quando o campo está
      // vazio (`undefined`, não `''`).
      center_id: data.center_id?.value || undefined,
    };
  }

  async function handleDownload(data: DreAnnualReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadDreAnnualReport(buildParams(data));
      downloadBlob(blob, 'dre-anual-relatorio.pdf');
    } catch (error) {
      // AJUSTE HOMOLOGAÇÃO 049 (item 2): `responseType:'blob'` entrega o
      // corpo do erro 422 como `Blob` — `parseBlobError` extrai o envelope
      // real `{message, errors}`. Prioridade: 1ª mensagem ESPECÍFICA de
      // `errors` por campo; só cai para o `message` genérico ("Os dados
      // informados são inválidos.") quando não há erro de campo.
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
              name="type_report"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.typeReport}
                  name={name}
                  isRequired
                  value={typeReportOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<DreTypeReport> | null) =>
                    onChange(option?.value ?? null)
                  }
                  options={typeReportOptions}
                  noClearable
                />
              )}
            />

            <Controller
              name="start_year"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.startYear}
                  name={name}
                  isRequired
                  value={yearSelectOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<number> | null) => onChange(option?.value ?? null)}
                  options={yearSelectOptions}
                  noClearable
                />
              )}
            />

            <Controller
              name="end_year"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.endYear}
                  name={name}
                  isRequired
                  value={yearSelectOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<number> | null) => onChange(option?.value ?? null)}
                  options={yearSelectOptions}
                  noClearable
                />
              )}
            />

            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.centerId}
                  placeholder={text.centerIdPlaceholder}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />
          </SimpleGrid>

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.yearRangeRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
