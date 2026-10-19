// src/pages/Relatorios/Bens/DepreciacaoAcumulada/index.tsx
// -----------------------------------------------------------------------------
// Tela "Depreciação Acumulada — Relatório" (F-216,
// CONTRATO-F216-depreciacao-acumulada.md §6). Rota
// `/relatorios/bens/depreciacao-acumulada` (PENDENTE DE FIAÇÃO — ver bloco de
// fiação do relatório de entrega), materializaria o item de menu FILHO
// `rel-ben-depreciacao-acumulada`, sob o grupo/submenu `rel-ben` ("Bens /
// Ativo", `navigationTree.ts`), ao lado de `rel-ben-inventario`
// ("Inventário").
//
// Mirror ESTRUTURAL DIRETO de `Relatorios/Bens/Inventario/index.tsx` —
// casca `FormContainer` + footer, `<Form onSubmit={preventDefault}>`,
// `SimpleGrid columns={columnsForm.default}`, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError` — prioriza
// mensagem de campo sobre mensagem genérica.
//
// DIVERGE do irmão `Inventario` (contrato real lido em
// `AccumulatedDepreciationReportController.php`/`AccumulatedDepreciationReportRequest.php`,
// GB.Cerne.Api, nesta Tarefa):
//   - SEM `proprietary` (não existe no contrato desta tela);
//   - SEM `type` (PDF/Excel) — o Controller é PDF-only incondicional
//     (`GbCerneSnappyReport::download`, sem ramo Excel) → 1 único botão
//     "Baixar PDF", SEM seletor de formato;
//   - os 4 filtros (`family`/`status`/`start_date`/`end_date`) são TODOS
//     OBRIGATÓRIOS (`AccumulatedDepreciationReportRequest::rules()`, sem
//     `nullable`/`sometimes`) — botão desabilitado até os 4 estarem
//     preenchidos (mirror do mecanismo de `statusValue`/`hasValidRange` já
//     usado em `Inventario`/`CusteioAreaPecuaria`).
//
// `family` é catálogo GLOBAL (`/family-equipments/options`, mesma fábrica de
// opções do irmão `Inventario`) — NÃO farm-scoped, portanto SEM reset por
// `activeFarmUuid`. SEM campo "Fazenda" (a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client — NUNCA reintroduzir um seletor de
// fazenda aqui).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { accumulatedDepreciationStatusOptions } from '@/constants/Relatorios/accumulated-depreciation-status';

import { accumulatedDepreciationReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/accumulated-depreciation-report-filter-schema';

import { listFamilyEquipmentOptions } from '@/services/v2/BaseRegistrations/familyEquipment-service';
import {
  downloadAccumulatedDepreciationReport,
  type AccumulatedDepreciationReportParams,
} from '@/services/v2/Relatorios/accumulated-depreciation-report-service';

import type { Option } from '@/@types/option';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';

interface AccumulatedDepreciationReportFilterForm {
  family: Option<string> | null;
  status: 1 | 2 | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineValues: AccumulatedDepreciationReportFilterForm = {
  family: null,
  status: null,
  start_date: null,
  end_date: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `Inventario/index.tsx`/`JurosPagos/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function DepreciacaoAcumuladaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.accumulatedDepreciationReport.report;

  const { control, handleSubmit, watch } = useForm<AccumulatedDepreciationReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: accumulatedDepreciationReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const familyValue = watch('family');
  const statusValue = watch('status');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Os 4 filtros são TODOS obrigatórios no contrato de API — botão só libera
  // com os 4 preenchidos (mirror do mecanismo `hasValidRange` de
  // `CusteioAreaPecuaria/index.tsx`, estendido aos 4 campos desta tela).
  const hasAllRequiredFilters =
    !!familyValue && !!statusValue && !!startDateValue && !!endDateValue;

  function buildParams(
    data: AccumulatedDepreciationReportFilterForm
  ): AccumulatedDepreciationReportParams {
    return {
      family: data.family!.value,
      status: data.status!,
      start_date: data.start_date!,
      end_date: data.end_date!,
    };
  }

  async function handleDownload(data: AccumulatedDepreciationReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadAccumulatedDepreciationReport(buildParams(data));
      // PDF-only (contrato real do Controller, sem ramo Excel) — nome de
      // arquivo fixo, sem decisão de extensão pelo front.
      downloadBlob(blob, 'depreciacao-acumulada.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO
      // `Inventario`/`Dre`/`MovimentacaoEstoque`).
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
            disabled={!hasAllRequiredFilters || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="family"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.family}
                  isRequired
                  // ERRO-04a — endpoint `/family-equipments/options` filtra
                  // `is_enabled` opt-in (sem o parâmetro devolve também
                  // famílias desabilitadas, que o legado escondia); mesmo
                  // filtro do irmão `Inventario`/RazaoCategoria (ERRO-04b).
                  service={(params) =>
                    listFamilyEquipmentOptions({ ...params, is_enabled: 'true' })
                  }
                  mapOptions={(item: FamilyEquipmentOption) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.status}
                  name={name}
                  isRequired
                  value={
                    accumulatedDepreciationStatusOptions
                      .options(languageGB)
                      .find((option) => option.value === value) ?? null
                  }
                  onChange={(option: Option<1 | 2> | null) => onChange(option?.value ?? null)}
                  options={accumulatedDepreciationStatusOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.startDate}
                  isRequired
                  value={value ?? null}
                  onChange={onChange}
                  maxDate={endDateValue ? new Date(`${endDateValue}T00:00:00`) : undefined}
                />
              )}
            />

            <Controller
              name="end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.endDate}
                  isRequired
                  value={value ?? null}
                  onChange={onChange}
                  minDate={startDateValue ? new Date(`${startDateValue}T00:00:00`) : undefined}
                />
              )}
            />
          </SimpleGrid>

          {!hasAllRequiredFilters && (
            <Text fontSize="sm" color="fg.muted">
              {text.periodRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
