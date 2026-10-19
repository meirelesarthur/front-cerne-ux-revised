// src/pages/Relatorios/GestaoFiscal/Faturamento/index.tsx
// -----------------------------------------------------------------------------
// Tela "Faturamento — Relatório" (F-286, TASK-054-286-FE-02, esteira
// 97-Esteiras/054). Rota `/relatorios/gestao-fiscal/faturamento`,
// consumindo `GET /api/v1/nfes-report` (binário PDF/Excel,
// `responseType:'blob'`), gate `nfe_product_report`. Materializa o item de
// menu FILHO `rel-gfi-faturamento`, sob o grupo/submenu `rel-gfi`
// ("Gestão Fiscal", `navigationTree.ts`), ao lado de "Partida Dobrada".
//
// Mirror estrutural TRIPLO (roteiro-front-F286-faturamento.md §1/§3):
//   - `Relatorios/Financeiro/ContasAPagar/index.tsx` — casca `FormContainer`
//     + footer, `useState isDownloading`, `handleSubmit(handleDownload)`,
//     `downloadBlob`+`parseBlobError` com priorização de erro de campo —
//     SEM o bloco `ReportColumnsField`/`watchedColumns` (D-FE-01: o backend
//     não aceita `columns[]`, as 16 colunas do relatório são fixas).
//   - `Relatorios/Frotas/Maquinas/index.tsx` — `useOptionsChecklistQuery`
//     para os 2 lookups remotos paginados (Clientes/Produtos) +
//     `useQuery`+`getMyFarms`+filtro client-side para Fazendas
//     (`farmItems`/`farmSearch`).
//   - `Fiscal/NfeEmitidas/NfeEmitModal.tsx` — Select de Emissor
//     (`issuerOptionLabel`, `getNfeIssuerOptions`, aqui via
//     `useOptionsSelectQuery` em vez de `useQuery` cru, mirror
//     `proprietaryQuery`/`farmQuery` de `ContasAPagar`).
//
// D-FE-01 — SEM `ReportColumnsField`: `NfeProductReportRequest` não aceita
// `columns[]` (roteiro-api-F286 §3); as 16 colunas são fixas no ViewModel
// bespoke do backend.
// D-FE-02 — `type` é domínio PRÓPRIO (`NfeProductReportType`, `0|1`,
// fábrica `nfeProductReportTypeOptions`) — NUNCA reusar `ReportFormat`/
// `reportFormatOptions` (domínio de string dos relatórios de
// Contas/Máquinas).
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão único
// "Gerar relatório" (o binário é gerado 100% no servidor).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { nfeProductReportTypeOptions } from '@/constants/Relatorios/nfe-product-report/options/nfe-product-report-type-options';
import { queryKey } from '@/constants/query-key';

import { nfeProductReportFilterSchemaResolver } from '@/validations/schemas/NfeProductReport/nfe-product-report-filter-schema';

import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { getIssuerReportOptions } from '@/services/v2/Issuers/issuer-service';
import { downloadNfeProductReport } from '@/services/v2/NfeProductReport/nfe-product-report-service';
import { listProductOptions } from '@/services/v2/Products/product-service';

import type { LanguageDate } from '@/@types/language';
import type {
  NfeProductReportFilterForm,
  NfeProductReportParams,
} from '@/@types/v2/NfeProductReport';
import type { NfeIssuerOption } from '@/@types/v2/Nfes';

// Mirror EXATO `NfeEmitModal.tsx::issuerOptionLabel` — mesma prioridade de
// campo (razão social → nome fantasia → uuid como último recurso).
function issuerOptionLabel(issuer: NfeIssuerOption): string {
  return issuer.razao_social ?? issuer.nome_fantasia ?? issuer.uuid;
}

function buildPristineValues(languageGB: LanguageDate): NfeProductReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    client_ids: [],
    farm_ids: [],
    product_ids: [],
    issuer_id: null,
    type: nfeProductReportTypeOptions.getOption(0, languageGB),
  };
}

export default function FaturamentoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.nfeProductReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NfeProductReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: nfeProductReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Clientes (CheckboxListField REMOTO, busca server-side debounced) —
  // `has:'nfes'` (PLANO-FIX §2.1/§3 F-286) estreita ao universo com NFe
  // emitida (opt-in, sem regressão nos demais consumidores). -------------
  const [clientsSearch, setClientsSearch] = useState('');
  const clientsQuery = useOptionsChecklistQuery({
    asyncFunction: listClientOptions,
    queryKey: queryKey.cadastrosBase.clients,
    search: clientsSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.name }),
    extraParams: { has: 'nfes' },
  });

  // ---- Produtos (CheckboxListField REMOTO, busca server-side debounced) —
  // `has:'nfes'` (PLANO-FIX §2.2/§3 F-286), mesmo racional acima. ---------
  const [productsSearch, setProductsSearch] = useState('');
  const productsQuery = useOptionsChecklistQuery({
    asyncFunction: listProductOptions,
    queryKey: queryKey.products.options,
    search: productsSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { has: 'nfes' },
  });

  // ---- Fazendas (CheckboxListField sobre lookup FLAT, sem paginação —
  // `listFarms()`/`GET /farms/current-tenant`, PLANO-FIX §3 F-286 Classe A —
  // universo do TENANT, não só as fazendas do usuário logado, mirror
  // `MaquinasRelatorio`, busca filtrada no cliente). `farm_ids[]` é um
  // filtro de ESTREITAMENTO do relatório — nunca amplia escopo
  // (roteiro-api-F286 §2). -------------------------------------------------
  const [farmSearch, setFarmSearch] = useState('');
  const farmsQuery = useQuery({
    queryKey: [queryKey.farms.list],
    queryFn: listFarms,
  });
  useQueryError([farmsQuery]);
  const allFarmItems = useMemo(
    () => (farmsQuery.data ?? []).map((farm) => ({ value: farm.uuid, label: farm.description })),
    [farmsQuery.data]
  );
  const farmItems = useMemo(
    () =>
      allFarmItems.filter((item) =>
        item.label.toLowerCase().includes(farmSearch.trim().toLowerCase())
      ),
    [allFarmItems, farmSearch]
  );

  // ---- Emissor (Select estático, lookup SEM paginação — mirror
  // `NfeEmitModal`/`proprietaryQuery` de `ContasAPagar`, via
  // `useOptionsSelectQuery` em vez de `useQuery` cru). PLANO-FIX §2.7/§3
  // F-286 — troca `/nfes/issuer-options` (emissão, força `issues_nfe=true`)
  // por `/issuers/report-options` (tenant+is_enabled+pivot farm, SEM
  // issues_nfe), chave própria (`queryKey.issuers.reportOptions`). --------
  const issuerQuery = useOptionsSelectQuery({
    asyncFunction: () => getIssuerReportOptions().then((response) => response.data),
    queryKey: queryKey.issuers.reportOptions,
    mapOption: (issuer: NfeIssuerOption) => ({
      value: issuer.uuid,
      label: issuerOptionLabel(issuer),
    }),
  });

  function buildParams(data: NfeProductReportFilterForm): NfeProductReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      client_ids: data.client_ids.length > 0 ? data.client_ids : undefined,
      farm_ids: data.farm_ids.length > 0 ? data.farm_ids : undefined,
      product_ids: data.product_ids.length > 0 ? data.product_ids : undefined,
      issuer_id: data.issuer_id?.value || undefined,
      type: data.type?.value ?? undefined,
    };
  }

  async function handleDownload(data: NfeProductReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadNfeProductReport(params);
      downloadBlob(blob, `faturamento.${params.type === 1 ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `ContasAPagar`/`Máquinas`).
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
              name="issuer_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.issuerId}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={issuerQuery.options}
                  loading={issuerQuery.isLoading}
                  placeholder={text.issuerPlaceholder}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.type}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={nfeProductReportTypeOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Clientes — CheckboxListField REMOTO (`listClientOptions`, LAC-FE-02). */}
          <Box>
            <Controller
              name="client_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.clientIds}
                  items={clientsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={clientsSearch}
                  onSearchChange={setClientsSearch}
                  searchPlaceholder={text.clientsSearchPlaceholder}
                  selectAllLabel={text.clientsSelectAll}
                  deselectAllLabel={text.clientsDeselectAll}
                  selectedCountLabel={text.clientsSelectedCount}
                  emptyLabel={text.clientsEmptyLabel}
                  isLoading={clientsQuery.isLoading}
                  isError={clientsQuery.isError}
                  onRetry={clientsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Produtos — CheckboxListField REMOTO (`listProductOptions`). */}
          <Box>
            <Controller
              name="product_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.productIds}
                  items={productsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={productsSearch}
                  onSearchChange={setProductsSearch}
                  searchPlaceholder={text.productsSearchPlaceholder}
                  selectAllLabel={text.productsSelectAll}
                  deselectAllLabel={text.productsDeselectAll}
                  selectedCountLabel={text.productsSelectedCount}
                  emptyLabel={text.productsEmptyLabel}
                  isLoading={productsQuery.isLoading}
                  isError={productsQuery.isError}
                  onRetry={productsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Fazendas — CheckboxListField sobre lookup FLAT (`listFarms()`,
              universo do tenant), opcional; filtro de ESTREITAMENTO (nunca
              amplia escopo). */}
          <Box>
            <Controller
              name="farm_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.farmIds}
                  items={farmItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={farmSearch}
                  onSearchChange={setFarmSearch}
                  searchPlaceholder={text.farmsSearchPlaceholder}
                  selectAllLabel={text.farmsSelectAll}
                  deselectAllLabel={text.farmsDeselectAll}
                  selectedCountLabel={text.farmsSelectedCount}
                  emptyLabel={text.farmsEmptyLabel}
                  isLoading={farmsQuery.isLoading}
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
