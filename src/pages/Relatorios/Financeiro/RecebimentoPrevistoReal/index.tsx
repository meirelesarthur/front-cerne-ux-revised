// src/pages/Relatorios/Financeiro/RecebimentoPrevistoReal/index.tsx
// -----------------------------------------------------------------------------
// Tela "Recebimento Previsto × Real — Relatório" (F-297, TASK-079-297-FE-02,
// esteira 97-Esteiras/079). Rota
// `/relatorios/financeiro/recebimento-previsto-real`, materializa o item de
// menu FILHO `rel-fin-rec-prev-real`, sob o grupo/submenu `rel-fin`
// ("Financeiro", `navigationTree.ts`).
//
// Mirror ESTRUTURAL EXATO de `Relatorios/Financeiro/PagamentoPrevistoReal/
// index.tsx` (F-289, lado Despesa) — mesma casca (FormContainer + footer,
// sem grid/prévia), mesmo download via Blob + `downloadBlob`, erro
// 422-como-Blob tratado via `parseBlobError` (mesma prioridade: mensagem
// específica de `errors` por campo sobre o `message` genérico), MESMO botão
// único "Gerar Relatório". Diverge em 3 pontos (plano-frontend §"Leitura do
// dev"):
//   1. `clients[]` (lookup `listClientOptions`, mirror `ContasAReceber`/
//      F-271) no lugar de `providers[]`/`listProviderOptions`.
//   2. `categories[]` via `listFinancialCategoryOptions` com
//      `extraParams: { type_id: 2, is_enabled: 'true' }` (mirror F-271,
//      Risco 3 do plano) — não o `type_ids:[1,3]` excludente de F-289.
//   3. `center_id` via `listCostCenterOptions` FARM-SCOPED (`cacheUniqs`/
//      `farm_uuid`, mirror F-289 — decisão do plano, Risco 2: seguir o
//      padrão mais seguro, não o mais recente do sibling F-271).
//
// `start_date`/`end_date` são OBRIGATÓRIOS (schema mirror `Dre`/F-289, não o
// par opcional de `expense-report-filter-schema.ts`). Campo `condition`
// (`S`=Sem Categoria / `C`=Com Categoria), fábrica `recPrevRealConditionOptions`
// (mirror `pagPrevRealConditionOptions`).
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
import { queryKey } from '@/constants/query-key';
import { recPrevRealConditionOptions } from '@/constants/Relatorios/accounts-reports/options/rec-prev-real-report-condition-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { recPrevRealReportFilterSchemaResolver } from '@/validations/schemas/AccountsReports/rec-prev-real-report-filter-schema';

import { downloadRecPrevRealReport } from '@/services/v2/AccountsReports/rec-prev-real-report-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type {
  RecPrevRealReportFilterForm,
  RecPrevRealReportParams,
} from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(languageGB: LanguageDate): RecPrevRealReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    clients: [],
    proprietary_id: null,
    center_id: null,
    categories: [],
    farm_id: null,
    condition: recPrevRealConditionOptions.getOption('S', languageGB),
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

// Categorias de Receita (mirror `ContasAReceber`/F-271, plano-frontend
// §Risco 3): `type_id: 2` — segue o precedente local do domínio Receita, não
// o `type_ids:[1,3]` excludente do irmão Despesa (F-289).
const FINANCIAL_CATEGORY_TYPE_RECEITAS = 2;

export default function RecebimentoPrevistoRealRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const shared = languageGB.accountsReports.shared;
  const text = languageGB.accountsReports.recPrevReal;

  const { control, handleSubmit } = useForm<RecPrevRealReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: recPrevRealReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Clientes (CheckboxListField remoto, mirror `ContasAReceber`/F-271) —
  // `listClientOptions` devolve `{uuid, name}` (NÃO `{uuid, label}`). --------
  const [clientsSearch, setClientsSearch] = useState('');
  const clientsQuery = useOptionsChecklistQuery({
    asyncFunction: listClientOptions,
    queryKey: queryKey.cadastrosBase.clients,
    search: clientsSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.name }),
  });

  // ---- Categorias (CheckboxListField remoto) — `type_id: 2` (Receitas,
  // mirror F-271, plano-frontend §Risco 3). ---------------------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: {
      type_id: FINANCIAL_CATEGORY_TYPE_RECEITAS,
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

  function buildParams(data: RecPrevRealReportFilterForm): RecPrevRealReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      clients: data.clients.length > 0 ? data.clients : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      // Defesa em profundidade (mirror `pag-prev-real-report-service.ts`):
      // nunca envia `farm_id` quando o campo está vazio.
      farm_id: data.farm_id?.value || undefined,
      condition: data.condition?.value ?? undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: RecPrevRealReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadRecPrevRealReport(buildParams(data));
      downloadBlob(blob, `recebimento-previsto-real.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: shared.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror F-289).
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
                  options={recPrevRealConditionOptions.options(languageGB)}
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

          {/* Clientes — CheckboxListField REMOTO (mirror `ContasAReceber`/
              F-271, busca server-side). */}
          <Box>
            <Controller
              name="clients"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.clients}
                  items={clientsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={clientsSearch}
                  onSearchChange={setClientsSearch}
                  searchPlaceholder={shared.lookupSearchPlaceholder}
                  selectAllLabel={shared.selectAll}
                  deselectAllLabel={shared.deselectAll}
                  selectedCountLabel={text.fields.clients}
                  emptyLabel={shared.lookupEmptyMessage}
                  isLoading={clientsQuery.isLoading}
                  isError={clientsQuery.isError}
                  onRetry={clientsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias — CheckboxListField REMOTO, só categorias de
              Receitas (`type_id: 2`, mirror F-271). */}
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
