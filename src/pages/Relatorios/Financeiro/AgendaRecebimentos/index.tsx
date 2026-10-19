// src/pages/Relatorios/Financeiro/AgendaRecebimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Agenda/Recebimentos — Relatório" (F-304, TASK-055-F304-FE-01, esteira
// 97-Esteiras/055). Rota `/relatorios/financeiro/agenda-recebimentos`
// (ligada na TASK-055-F304-FE-02), materializa o item de menu FILHO NOVO
// `rel-fin-agenda-recebimentos`, sob o grupo/submenu `rel-fin` ("Financeiro",
// `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/ContasAReceber/index.tsx`
// (F-271, lado Receita: Cliente + Categoria `type_id=2`, casca
// `FormContainer`+footer, submit externo via `handleSubmit`, campos
// Proprietário/Fazenda/Centro de Custo/Formato) combinado com o dispatch
// PDF-inline × Excel-download de `Relatorios/Estoque/Recebimentos/index.tsx`
// (F-305, `useMutation` + `onSuccess(blob, variables)` decide
// `URL.createObjectURL`+`window.open('_blank')` para PDF vs `downloadBlob`
// para Excel).
//
// Divergências adjudicadas (roteiro §4, NÃO inventar):
//   1. `format='pdf'|'xlsx'` (fábrica `reportFormatOptions` compartilhada,
//      domínio `ReportFormat`) — NÃO o `type='pdf'|'excel'` inline do F-305.
//   2. Dispatch por `format` no `onSuccess(blob, variables)` — mirror F-305,
//      NÃO ContasAReceber (que sempre usa `downloadBlob`, inclusive PDF).
//   3. Datas de vencimento OPCIONAIS (fiel ao legado, CF304-05) — botão
//      "Gerar relatório" NUNCA exige período (diferente do F-305).
//   4. SEM seletor de colunas — as 8 colunas do relatório são FIXAS e
//      renderizadas 100% no servidor (diferente de ContasAReceber/
//      ContasAPagar, que oferecem `ReportColumnsField`).
//
// Services 100% REUSADOS — nenhum lookup novo (roteiro §5): `listClientOptions`,
// `listFinancialCategoryOptions`, `listProprietaryOptions`, `listFarms`,
// `listCostCenterOptions`.
//
// Resposta é SEMPRE `responseType:'blob'`, inclusive erro 422 — tratado via
// `parseBlobError` (NUNCA `extractApiErrorMessage`, que não sabe ler `Blob`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
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

import { receiptScheduleReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/receipt-schedule-report-filter-schema';

import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  downloadReceiptScheduleReport,
  type ReceiptScheduleReportParams,
} from '@/services/v2/Relatorios/receipt-schedule-report-service';

import type { Option } from '@/@types/option';
import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

interface AgendaRecebimentosFormValues {
  clients: string[];
  farm: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  proprietary_id: Option<string> | null;
  center_id: Option<string> | null;
  categories: string[];
  format: Option<ReportFormat> | null;
}

function buildPristineValues(languageGB: LanguageDate): AgendaRecebimentosFormValues {
  return {
    clients: [],
    farm: null,
    start_date: null,
    end_date: null,
    proprietary_id: null,
    center_id: null,
    categories: [],
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function AgendaRecebimentosRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.receiptScheduleReport.report;

  const { control, handleSubmit } = useForm<AgendaRecebimentosFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: receiptScheduleReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  // ---- Clientes (CheckboxListField remoto, mirror ContasAReceber/F-271,
  // LAC-FE-02) — SEM item sintético. `listClientOptions` devolve
  // `{uuid, name}` (NÃO `{uuid, label}`). --------------------------------
  const [clientsSearch, setClientsSearch] = useState('');
  const clientsQuery = useOptionsChecklistQuery({
    asyncFunction: listClientOptions,
    queryKey: queryKey.cadastrosBase.clients,
    search: clientsSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.name }),
  });

  // ---- Categorias Financeiras (CheckboxListField remoto, Receitas —
  // `type_id: 2`, mirror ContasAReceber). ---------------------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { type_id: 2, class: 2, is_enabled: 'true' },
  });

  // ---- Proprietário Gestor / Fazenda (Select estático, lookup SEM
  // paginação, mirror ContasAReceber). ------------------------------------
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

  const reportMutation = useMutation({
    mutationFn: (params: ReceiptScheduleReportParams) => downloadReceiptScheduleReport(params),
    onSuccess: (blob, variables) => {
      if (variables.format === 'pdf') {
        // PDF abre INLINE em nova aba — NUNCA `downloadBlob`, que forçaria
        // download e quebraria a fidelidade `inline` do legado (RN-15).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'agenda de recebimentos.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ContasAReceber/index.tsx`/`Recebimentos/index.tsx`).
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
    },
  });

  const isGenerating = reportMutation.isPending;

  function buildParams(data: AgendaRecebimentosFormValues): ReceiptScheduleReportParams {
    return {
      clients: data.clients.length > 0 ? data.clients : undefined,
      farm: data.farm?.value || undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      center_id: data.center_id?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      format: data.format!.value,
    };
  }

  function onSubmit(data: AgendaRecebimentosFormValues) {
    reportMutation.mutate(buildParams(data));
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          {/* Clientes — CheckboxListField REMOTO (busca server-side). */}
          <Box>
            <Controller
              name="clients"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.client}
                  items={clientsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={clientsSearch}
                  onSearchChange={setClientsSearch}
                  searchPlaceholder={text.searchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.client}
                  emptyLabel={text.empty}
                  errorLabel={text.error}
                  retryLabel={text.retry}
                  isLoading={clientsQuery.isLoading}
                  isError={clientsQuery.isError}
                  onRetry={clientsQuery.refetch}
                  columns={columnsForm.threeColumns}
                  isDisabled={isGenerating}
                />
              )}
            />
          </Box>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="farm"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                  isDisabled={isGenerating}
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
            </Box>

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.costCenter}
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
                  isReadOnly={isGenerating}
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
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
          </SimpleGrid>

          {/* Categorias Financeiras — CheckboxListField REMOTO, só
              categorias de Receitas (`type_id: 2`). */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.category}
                  items={categoriesQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={text.searchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.category}
                  emptyLabel={text.empty}
                  errorLabel={text.error}
                  retryLabel={text.retry}
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  onRetry={categoriesQuery.refetch}
                  columns={columnsForm.threeColumns}
                  isDisabled={isGenerating}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
