// src/pages/Relatorios/Financeiro/RazaoCategoria/index.tsx
// -----------------------------------------------------------------------------
// Tela "Razão Categoria — Relatório" (F-273, `LedgerCategoryReportController`
// da API, execução 059, `CONTRATO-F273-razao-categoria.md`, TASK-273-FE-01).
// Rota `/relatorios/financeiro/razao-categoria`, materializa o item de menu
// FILHO NOVO `rel-fin-razao-categoria`, sob o grupo/submenu `rel-fin`
// ("Financeiro", `navigationTree.ts`) — ver "BLOCO DE FIAÇÃO" na entrega
// desta Tarefa para o registro central (router/navtree/navperm/i18n), NÃO
// aplicado aqui (arquivos globais compartilhados, fora do escopo desta
// Tarefa em modo writer-paralelo).
//
// Contrato de tela — download-only PURO, SEM grid/prévia (`SURF-GRID-001`
// não se aplica — o backend não expõe `/preview`, só `/ledger-category-
// report?format=pdf|xlsx`, MESMO endpoint, mirror ESTRUTURAL de
// `Relatorios/Financeiro/FluxoCaixaMensal/index.tsx` — `FormContainer` +
// footer com 1 único botão "Gerar relatório", `useState isDownloading`
// (NUNCA `useMutation` para binário, convenção explícita já usada por todos
// os irmãos de relatório: `ContasAPagar`/`Consolidado`/`CentroCusto`/
// `FluxoCaixaMensal`), `downloadBlob`+`parseBlobError`, prioridade de
// mensagem específica de campo sobre a genérica.
//
// Sem página-modelo dedicada no Storybook `cerne` para este conjunto exato
// de campos — UX-GAP parcial, NÃO bloqueante (mesma situação declarada em
// `JurosRecebidos/index.tsx`): o casco (`FormContainer`+`Form`+`SimpleGrid
// columnsForm.fourColumns`+`VStack`) e cada campo individual (`DateInput`/
// `Select`/`SelectAsyncPaginate`/`CheckboxListField`) SÃO os componentes
// canônicos do design system, já aprovados e em produção nos 5+ irmãos
// citados acima — a "adaptação" desta tela é a COMPOSIÇÃO desses
// componentes já existentes ao contrato de 7 campos de `LedgerCategoryReportRequest`,
// não a invenção de layout novo.
//
// Campos e técnica de cada um (fonte: `LedgerCategoryReportRequest::rules()`,
// API real, lida diretamente):
//   `start_date`/`end_date` — OBRIGATÓRIOS (contrato de API), `DateInput`
//     com asterisco visual, mirror EXATO de `FluxoCaixaMensal`/`CentroCusto`.
//   `farm_id` — OPCIONAL, tenant-scoped. `Select` estático + `useOptionsSelectQuery`
//     sobre `listFarms()` (`/farms/current-tenant`), mirror `FluxoCaixaMensal`.
//     Sub-filtro TENANT-WIDE do formulário — NUNCA um substituto do contexto
//     de fazenda ativa (`X-Farm-Id`, que vai automaticamente pelo header do
//     client, `get_spa_api_client_pattern §2`).
//   `proprietary_id` — OPCIONAL. `Select` estático + `useOptionsSelectQuery`
//     sobre `listProprietaryOptions(undefined, 'farm')`, mirror EXATO da
//     técnica já usada por `FluxoCaixaMensal`/`CentroCusto` para este mesmo
//     campo (convenção de front estabelecida para o Select "Proprietário" em
//     telas de relatório, independente da nuance de escopo do pivot
//     `proprietary_tenant` no backend — a API valida/rejeita via 422 quando
//     aplicável, o front não duplica essa regra).
//   `center_id` — OPCIONAL, aceita centro GLOBAL (`tenant_id` nulo) OU do
//     tenant (mirror `CostCenterTenantScope`, docblock do
//     `LedgerCategoryReportRequest`). `SelectAsyncPaginate` sobre
//     `listCostCenterOptions` (`/cost-centers/options`, `only_analytic:true`,
//     `is_enabled:'true'`, `farm_uuid:activeFarmUuid`), `cacheUniqs=[activeFarmUuid]`
//     — mirror EXATO de `FluxoCaixaMensal`/`CentroCusto`.
//   `categories[]` — OPCIONAL, uuid[] de `financial_categories` (bi-modal
//     global/tenant, mesmo racional bi-modal de `center_id`, ver docblock do
//     `LedgerCategoryReportFilterData`). `CheckboxListField` REMOTO
//     (`useOptionsChecklistQuery` sobre `listFinancialCategoryOptions`,
//     endpoint `/financial-categories/options`, ENXUTO/sem gate de
//     `financialcategories_view`) — mirror ESTRUTURAL da técnica `accounts[]`
//     de `FluxoCaixaMensal`/`CentroCusto` (mesmo componente, fonte de dados
//     trocada de Contas para Categorias Financeiras).
//   `format` — OBRIGATÓRIO ('pdf'|'xlsx'), `Select` + `reportFormatOptions`
//     (fábrica COMPARTILHADA, `@/constants/Relatorios/accounts-reports/
//     options/report-format-options`), default `'pdf'`, `noClearable` —
//     mirror EXATO de todos os irmãos de relatório.
//
// Resposta é SEMPRE `responseType:'blob'`, inclusive erro 422 — tratado via
// `parseBlobError` (NUNCA `extractApiErrorMessage`, que não sabe ler `Blob`).
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
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { ledgerCategoryReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/ledger-category-report-filter-schema';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { downloadLedgerCategoryReport } from '@/services/v2/Relatorios/ledger-category-report-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type {
  LedgerCategoryReportFilterForm,
  LedgerCategoryReportParams,
} from '@/@types/v2/Relatorios/ledger-category-report';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(languageGB: LanguageDate): LedgerCategoryReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    farm_id: null,
    proprietary_id: null,
    center_id: null,
    categories: [],
    // mirror dos irmãos de relatório — default 'pdf', editável antes de gerar.
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function RazaoCategoriaRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.ledgerCategoryReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LedgerCategoryReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: ledgerCategoryReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação, mirror
  // `FluxoCaixaMensal`/`CentroCusto`) -----------------------------------------
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

  // ---- Categorias Financeiras (`CheckboxListField` remoto — endpoint
  // ENXUTO `/financial-categories/options`, mirror técnica `accounts` de
  // `FluxoCaixaMensal`/`CentroCusto`) -----------------------------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item: FinancialCategoryOption) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    // ERRO-04b — endpoint filtra `is_enabled` opt-in (sem o parâmetro devolve
    // também categorias desabilitadas, que o legado escondia).
    extraParams: { is_enabled: 'true' },
  });

  const formatOptions = reportFormatOptions.options(languageGB);

  function buildParams(data: LedgerCategoryReportFilterForm): LedgerCategoryReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      farm_id: data.farm_id?.value || undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: LedgerCategoryReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadLedgerCategoryReport(params);
      downloadBlob(blob, `razao-categoria.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `FluxoCaixaMensal`/`CentroCusto`/`ContasAPagar`).
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
            title={text.generateButton}
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
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
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

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  placeholder={text.farmPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                />
              )}
            />

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            {/* Centro de Custo — escopado pela fazenda ATIVA (header
                `X-Farm-Id`, `activeFarmUuid`) + só Analíticos
                (`only_analytic`), mirror `FluxoCaixaMensal`/`CentroCusto`.
                `cacheUniqs` invalida o cache de options ao trocar de
                fazenda. */}
            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.costCenter}
                  placeholder={text.costCenterPlaceholder}
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
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={formatOptions}
                  noClearable
                  error={errors.format?.message}
                />
              )}
            />

            {/* Categorias Financeiras — `CheckboxListField` REMOTO
                (`useOptionsChecklistQuery` sobre
                `listFinancialCategoryOptions`, busca server-side), ocupa o
                restante da linha (mirror técnica `accounts` de
                `FluxoCaixaMensal`/`CentroCusto`). */}
            <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 4' }}>
              <Controller
                name="categories"
                control={control}
                render={({ field }) => (
                  <CheckboxListField
                    label={text.fields.categories}
                    items={categoriesQuery.items}
                    selectedValues={field.value}
                    onChange={field.onChange}
                    searchValue={categoriesSearch}
                    onSearchChange={setCategoriesSearch}
                    searchPlaceholder={text.lookupSearchPlaceholder}
                    selectAllLabel={text.selectAll}
                    deselectAllLabel={text.deselectAll}
                    selectedCountLabel={text.fields.categories}
                    emptyLabel={text.lookupEmptyMessage}
                    isLoading={categoriesQuery.isLoading}
                    isError={categoriesQuery.isError}
                    onRetry={categoriesQuery.refetch}
                    columns={columnsForm.threeColumns}
                  />
                )}
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
