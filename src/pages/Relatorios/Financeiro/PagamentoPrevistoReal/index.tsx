// src/pages/Relatorios/Financeiro/PagamentoPrevistoReal/index.tsx
// -----------------------------------------------------------------------------
// Tela "Pagamento Previsto × Real — Relatório" (F-289, TASK-289-FE-02,
// esteira 97-Esteiras/054). Rota `/relatorios/financeiro/pagamento-previsto-real`,
// materializa o item de menu FILHO `rel-fin-pag-prev-real`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/ContasAPagar/index.tsx` (F-262)
// — FormContainer + footer, sem grid/prévia, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError`, prioriza a
// mensagem específica de `errors` por campo sobre o `message` genérico.
//
// Diverge do molde `ContasAPagarRelatorio` DE PROPÓSITO:
//   - SEM `ReportColumnsField`/`watchedColumns` — as colunas (10 base + 3 de
//     categoria quando `condition='C'`) são fixas, decididas 100% no backend
//     (`PagPrevRealReportColumnEnum::baseKeys()`/`categoryKeys()`, RN-06).
//   - SEM item sintético TRIBUTO na lista de Fornecedores (D-FE-05 é
//     exclusivo de F-262, não citado no contrato legado de F-289).
//   - SEM `extraParams: { type_id: 1 }` no lookup de Categorias — RN-07 só
//     liga o filtro (a API já corrige o defeito do legado, roteiro API
//     §7.5), o front não adiciona restrição nova de tipo.
//   - `start_date`/`end_date` são OBRIGATÓRIOS aqui (schema mirror `Dre`,
//     não o par opcional de `expense-report-filter-schema.ts`).
//   - Campo novo `condition` (`S`=Sem Categoria / `C`=Com Categoria),
//     fábrica `pagPrevRealConditionOptions` (mirror `reportFormatOptions`).
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Gerar
// Relatório" (o binário é gerado 100% no servidor, `responseType:'blob'`
// obrigatório).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { pagPrevRealConditionOptions } from '@/constants/Relatorios/accounts-reports/options/pag-prev-real-report-condition-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import { queryKey } from '@/constants/query-key';

import { pagPrevRealReportFilterSchemaResolver } from '@/validations/schemas/AccountsReports/pag-prev-real-report-filter-schema';

import { downloadPagPrevRealReport } from '@/services/v2/AccountsReports/pag-prev-real-report-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type { PagPrevRealReportFilterForm, PagPrevRealReportParams } from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(languageGB: LanguageDate): PagPrevRealReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    providers: [],
    proprietary_id: null,
    center_id: null,
    categories: [],
    farm_id: null,
    condition: pagPrevRealConditionOptions.getOption('S', languageGB),
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

// Domínio `category_types` (mirror `FarmTransferExpenseAllocation.tsx`,
// GAP-FARMTRANSFER-04): 1=Saídas, 2=Entradas, 3=Ambas (neutro). PLANO-FIX §3
// F-289/DECISÃO DE ESCOPO #5 — o legado filtra `type_id != 2`; o options não
// tem "not equal", então o front envia `type_ids[]` excludente (Saídas +
// Ambas, tudo exceto Entradas).
const FINANCIAL_CATEGORY_TYPE_SAIDAS = 1;
const FINANCIAL_CATEGORY_TYPE_AMBAS = 3;

export default function PagamentoPrevistoRealRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const shared = languageGB.accountsReports.shared;
  const text = languageGB.accountsReports.pagPrevReal;

  const { control, handleSubmit } = useForm<PagPrevRealReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: pagPrevRealReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Fornecedores (CheckboxListField remoto) — SEM item sintético
  // TRIBUTO (D-FE-05 é exclusivo de F-262). -------------------------------
  const [providersSearch, setProvidersSearch] = useState('');
  const providersQuery = useOptionsChecklistQuery({
    asyncFunction: listProviderOptions,
    queryKey: queryKey.cadastrosBase.providers,
    search: providersSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.label }),
  });

  // ---- Categorias (CheckboxListField remoto) — `class:2` (Custeio) +
  // `type_ids[]` excludente (Saídas+Ambas, exceto Entradas — PLANO-FIX §3
  // F-289/DECISÃO #5, mirror legado `type_id != 2`). ----------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: {
      class: 2,
      type_ids: [FINANCIAL_CATEGORY_TYPE_SAIDAS, FINANCIAL_CATEGORY_TYPE_AMBAS],
      is_enabled: 'true',
    },
  });

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação) -----
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(undefined, 'farm'),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.list,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  function buildParams(data: PagPrevRealReportFilterForm): PagPrevRealReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      providers: data.providers.length > 0 ? data.providers : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      // Defesa em profundidade (mirror `expense-report-service.ts`): nunca
      // envia `farm_id` quando o campo está vazio.
      farm_id: data.farm_id?.value || undefined,
      condition: data.condition?.value ?? undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: PagPrevRealReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadPagPrevRealReport(buildParams(data));
      downloadBlob(blob, `pagamento-previsto-real.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: shared.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `ContasAPagarRelatorio`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? shared.downloadError,
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
            title={shared.generateButton}
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
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
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
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.proprietary}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                />
              )}
            />

            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={shared.fields.costCenter}
                  cacheUniqs={[activeFarmUuid]}
                  service={(params) =>
                    listCostCenterOptions({
                      ...params,
                      only_analytic: true,
                      is_enabled: 'true',
                      farm_uuid: activeFarmUuid ?? undefined,
                    })
                  }
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.condition}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={pagPrevRealConditionOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Fornecedores — CheckboxListField REMOTO (`useOptionsChecklistQuery`,
              busca server-side). SEM item sintético TRIBUTO (exclusivo de F-262). */}
          <Box>
            <Controller
              name="providers"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.providers}
                  items={providersQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={providersSearch}
                  onSearchChange={setProvidersSearch}
                  searchPlaceholder={shared.lookupSearchPlaceholder}
                  selectAllLabel={shared.selectAll}
                  deselectAllLabel={shared.deselectAll}
                  selectedCountLabel={text.fields.providers}
                  emptyLabel={shared.lookupEmptyMessage}
                  isLoading={providersQuery.isLoading}
                  isError={providersQuery.isError}
                  onRetry={providersQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias — CheckboxListField REMOTO, SEM restrição de tipo
              (RN-07 só liga o filtro no servidor, não adiciona restrição nova). */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={shared.fields.categories}
                  items={categoriesQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={shared.lookupSearchPlaceholder}
                  selectAllLabel={shared.selectAll}
                  deselectAllLabel={shared.deselectAll}
                  selectedCountLabel={shared.fields.categories}
                  emptyLabel={shared.lookupEmptyMessage}
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  onRetry={categoriesQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
