// src/pages/Relatorios/Financeiro/ContasTributarias/index.tsx
// -----------------------------------------------------------------------------
// Tela "Contas Tributárias — Relatório" (F-327, esteira 060,
// TASK-F327-FRONT-01, ROTEIRO-F327-FRONT.md). Rota
// `/relatorios/financeiro/contas-tributarias`, gate de permissão
// `tax_accounts_report` (slug do backend, `PermissionTree.php:3780`).
//
// Casca download-only: `FormContainer` + `<Form onSubmit={preventDefault}>`
// + `SimpleGrid` — mirror ESTRUTURAL de
// `Relatorios/Financeiro/ContasPagas/index.tsx` (período+formato+download)
// e `Relatorios/Estoque/WeighingStockClientReport/index.tsx` (selects
// async). NÃO tem grid/preview/seleção de coluna — as 7 colunas de saída
// são fixas no backend (D-NEW-02: NÃO exibir fornecedor/número da despesa
// como coluna, a tela é só filtros + download).
//
// 6 campos: Período Início/Fim (obrigatórios), Tributação (`is_taxation`,
// opcional, Todas/Sim/Não), Centro de Custo (`cost_center`, opcional,
// `SelectAsyncPaginate`), Fornecedor (`provider`, opcional,
// `SelectAsyncPaginate`), Formato (`format`, obrigatório).
//
// LANDMINES aplicadas (ROTEIRO-F327-FRONT.md §3.C/§3.F, D-NEW-01):
//   1. Chaves EXATAS `cost_center`/`provider` (SEM sufixo `_uuid`) — VALOR é
//      o uuid — ver `buildParams` abaixo e `tax-accounts-report-service.ts`.
//   2. `is_taxation` é boolean — "Não" (`false`) é enviado explicitamente
//      (nunca descartado como falsy); "Todas" (`null`) omite a chave.
//   3. `listCostCenterOptions` chamado com `only_analytic:'true'` +
//      `is_enabled:'true'` (senão o backend responde 422 em `cost_center`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid, VStack } from '@chakra-ui/react';
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
import { taxAccountsReportFormatOptions } from '@/constants/Relatorios/tax-accounts-report/options/tax-accounts-report-format-options';
import { taxAccountsReportTaxationOptions } from '@/constants/Relatorios/tax-accounts-report/options/tax-accounts-report-taxation-options';

import { taxAccountsReportFilterSchemaResolver } from '@/validations/schemas/TaxAccountsReport/tax-accounts-report-filter-schema';

import {
  listProviderOptions,
  type ProviderOptionItem,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { downloadTaxAccountsReport } from '@/services/v2/TaxAccountsReport/tax-accounts-report-service';

import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  TaxAccountsReportFilterForm,
  TaxAccountsReportParams,
} from '@/@types/v2/TaxAccountsReport';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// usado em `WeighingStockClientReport`/`PesagemEntradaSaida`/`JurosPagos`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapCostCenterOption(item: CostCenterRef) {
  return { label: `${item.code} — ${item.description}`.trim(), value: item.uuid };
}

function mapProviderOption(item: ProviderOptionItem) {
  return { label: item.label ?? '', value: item.uuid };
}

export default function ContasTributariasRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.taxAccountsReport.report;

  const buildPristineValues = (): TaxAccountsReportFilterForm => ({
    start_date: null,
    end_date: null,
    is_taxation: null,
    cost_center: null,
    provider: null,
    format: taxAccountsReportFormatOptions.getOption('pdf', languageGB),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaxAccountsReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: taxAccountsReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: TaxAccountsReportFilterForm): TaxAccountsReportParams {
    // LANDMINE 1 — `is_taxation` é boolean: "Não" (`false`) DEVE ser
    // enviado. Nunca usar `?.value || undefined` (descartaria `false`).
    // Teste explícito por null/undefined:
    const taxationOption = data.is_taxation?.value;
    const isTaxationValue =
      taxationOption === undefined || taxationOption === null ? undefined : taxationOption;

    return {
      start_date: data.start_date!, // DateInput já entrega ISO 'YYYY-MM-DD' — repassar direto
      end_date: data.end_date!,
      is_taxation: isTaxationValue,
      // LANDMINE 2 — value é o UUID (não id numérico); chave sem `_uuid`;
      // omitido quando vazio:
      cost_center: data.cost_center?.value || undefined,
      provider: data.provider?.value || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: TaxAccountsReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadTaxAccountsReport(params);
      downloadBlob(blob, `contas-tributarias.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
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
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.startDate}
                  isRequired
                  value={value ?? null}
                  onChange={onChange}
                  error={errors.start_date?.message as string | undefined}
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
                  error={errors.end_date?.message as string | undefined}
                />
              )}
            />

            <Controller
              name="is_taxation"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.isTaxation}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={taxAccountsReportTaxationOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="cost_center"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.costCenter}
                  // D-NEW-01 — `only_analytic:'true'` + `is_enabled:'true'`
                  // OBRIGATÓRIOS: sem eles o usuário pode escolher um centro
                  // que o relatório rejeita com 422 (`class!=2` ou
                  // desabilitado).
                  service={(params) =>
                    listCostCenterOptions({ ...params, only_analytic: true, is_enabled: 'true' })
                  }
                  mapOptions={mapCostCenterOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="provider"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.provider}
                  service={listProviderOptions}
                  mapOptions={mapProviderOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
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
                  options={taxAccountsReportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
