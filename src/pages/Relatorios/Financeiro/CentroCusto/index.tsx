// src/pages/Relatorios/Financeiro/CentroCusto/index.tsx
// -----------------------------------------------------------------------------
// Tela "Centro de Custo — Relatório" (F-247, TASK-052-247-FE-02, esteira
// 97-Esteiras/052). Rota `/relatorios/financeiro/centro-de-custo`,
// materializa o item de menu FILHO `rel-fin-centro-custo`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Contrato de tela SELADO (DEC-225) — 3 URIs sobre a MESMA Action
// (`/cost-center-report` PDF · `/excel` · `/preview` JSON), mirror
// ESTRUTURAL de `Relatorios/Financeiro/ApuracaoCusto/index.tsx` para a
// prévia (`{title,subtitle,columns,rows,kpis,filters}`, células JÁ
// formatadas pelo backend, NUNCA reformatadas no cliente) — DUAS diferenças
// deliberadas do molde:
//   (1) A prévia é a ÚNICA `useQuery` da tela e dispara AUTOMATICAMENTE
//       assim que os campos obrigatórios (`group`+`start_date`+`end_date`)
//       estão preenchidos (`enabled` reativo) — SEM botão "Filtrar" — mirror
//       do padrão de "prévia viva" já usado pelos lookups
//       (`useOptionsSelectQuery`/`useOptionsChecklistQuery`), mas aqui a
//       consulta É o dado de domínio da tela.
//   (2) 2 botões de download diretos (PDF/Excel) — SEM seletor "Tipo de
//       Relatório" client-side (`ApuracaoCusto` tem; esta tela não).
// Casco (`FormContainer`+`Form noPadding`+`SimpleGrid columnsForm.fourColumns`
// +`VStack` externo com `paddingX={formSpacing.paddingX} minW={0}`) mirror
// EXATO de `ApuracaoCusto`/`ProducaoArea`.
//
// `kpis`/`filters` do view-model são RENDERIZADOS (diferente de
// `ApuracaoCusto`/`ProductionArea`, que os deixam `unknown`/não-usados) —
// PRIMEIRA tela do projeto cujo contrato exige os 2 campos (roteiro selado
// §"Contrato de tela"). `filters` como chips (mirror `Wrap`+`Badge` de
// `CreateOrUpdateFinancialCategory.tsx`); `kpis` como cartões rótulo/valor/
// nota. Nenhum componente genérico de prévia existe ainda no repositório
// (`ApuracaoCusto`/`ProductionArea` compõem a tabela inline) — a composição
// abaixo estende a MESMA técnica (`Table.Root` + tokens `fg.muted`/
// `fg.error`), sem inventar nenhum padrão visual novo.
//
// `accounts[]` — `CheckboxListField` REMOTO sobre `listAccounts` (mirror
// `ContasAPagar`), NÃO `getAccountOptions` (esta função devolve os enums
// estáticos `{types,cnab_types}` do cadastro de Conta, formato incompatível
// com o lookup paginado do checklist — `listAccounts` é a fonte real de
// contas para multiseleção, já usada por `ApuracaoCusto`/`CashFlow` via
// `SelectAsyncPaginate`).
//
// `center_id` aceita centro GLOBAL (tenant nulo) OU do tenant — o backend
// resolve os dois universos em `/cost-centers/options` (mesma rota já usada
// por `ContasAPagar`), o front só passa `is_enabled:'true'`.
//
// Downloads: `useState` local (NUNCA `useMutation`, convenção explícita de
// binário), `downloadBlob`/`parseBlobError` (mirror `ContasAPagar`/
// `ApuracaoCusto`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, SimpleGrid, Table, Text, VStack, Wrap } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
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

import { configureSpacing } from '@/utils/config-padding';
import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { costCenterReportRegimeOptions } from '@/constants/Relatorios/cost-center-report/options/regime-options';

import { costCenterReportFilterSchemaResolver } from '@/validations/schemas/CostCenterReport/cost-center-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  downloadCostCenterReportExcel,
  downloadCostCenterReportPdf,
  getCostCenterReportPreview,
} from '@/services/v2/CostCenterReport/cost-center-report-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type {
  CostCenterReportFilterForm,
  CostCenterReportParams,
} from '@/@types/v2/CostCenterReport';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(): CostCenterReportFilterForm {
  return {
    group: null,
    start_date: null,
    end_date: null,
    accounts: [],
    proprietary_id: null,
    center_id: null,
    farm_id: null,
  };
}

export default function CentroCustoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.costCenterReport.report;
  const shared = languageGB.accountsReports.shared;
  // Mesmo token de espaçamento horizontal que `<Form>` já aplica internamente
  // — reaproveitado no `VStack` externo para os botões/área de resultado
  // alinharem com os campos do form (mirror `ApuracaoCusto`/`ProducaoArea`).
  const { formSpacing } = configureSpacing();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CostCenterReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: costCenterReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // ---- Contas (CheckboxListField remoto — `listAccounts`, mirror
  // `ContasAPagar`) — tenant inteiro, sem cascata por fazenda ativa. -------
  const [accountsSearch, setAccountsSearch] = useState('');
  const accountsQuery = useOptionsChecklistQuery({
    asyncFunction: listAccounts,
    queryKey: queryKey.cadastrosBase.accounts,
    search: accountsSearch,
    mapItem: (item: AccountListItem) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    extraParams: { is_enabled: 'true' },
  });

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação, mirror
  // `ContasAPagar`) --------------------------------------------------------
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

  const regimeOptions = costCenterReportRegimeOptions.options(languageGB);

  function buildParams(data: CostCenterReportFilterForm): CostCenterReportParams | null {
    if (!data.group || !data.start_date || !data.end_date) return null;
    return {
      group: data.group.value,
      start_date: data.start_date,
      end_date: data.end_date,
      accounts: data.accounts.length ? data.accounts : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      farm_id: data.farm_id?.value || undefined,
    };
  }

  // Forma achatada dos filtros — recalculada a cada render a partir do
  // `watch()` (react-hook-form), entra na `queryKey` da prévia. `null`
  // enquanto `group`/período não estão preenchidos — vira o guard de
  // `enabled` abaixo (contrato de tela: prévia/download bloqueados até os
  // campos obrigatórios estarem completos).
  const watchedValues = watch();
  const previewParams = buildParams(watchedValues);

  // Prévia — a ÚNICA `useQuery` da tela (contrato de tela selado). Dispara
  // automaticamente quando `enabled` fica `true` e refaz sozinha quando
  // `previewParams` muda (a forma achatada entra na `queryKey`) — SEM botão
  // "Filtrar" (diferente de `ApuracaoCusto`, que usa fetch manual).
  const previewQuery = useQuery({
    queryKey: [queryKey.relatorios.costCenterReportPreview, previewParams],
    queryFn: () => getCostCenterReportPreview(previewParams!),
    enabled: previewParams !== null,
    refetchOnWindowFocus: false,
  });

  const hasRequiredFilled = previewParams !== null;
  const isReportEmpty =
    hasRequiredFilled && !previewQuery.isError && (previewQuery.data?.rows.length ?? 0) === 0;
  const hasReport =
    hasRequiredFilled && !previewQuery.isError && (previewQuery.data?.rows.length ?? 0) > 0;

  async function handleDownloadPdf(data: CostCenterReportFilterForm) {
    const params = buildParams(data);
    if (!params) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadCostCenterReportPdf(params);
      downloadBlob(blob, 'relatorio-de-centro-de-custo.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ContasAPagar`/`ApuracaoCusto`).
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
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadExcel(data: CostCenterReportFilterForm) {
    const params = buildParams(data);
    if (!params) return;
    setIsDownloadingExcel(true);
    try {
      const blob = await downloadCostCenterReportExcel(params);
      downloadBlob(blob, 'relatorio-de-centro-de-custo.xlsx');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
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
      setIsDownloadingExcel(false);
    }
  }

  return (
    <FormContainer title={text.pageTitle} subtitle={text.pageSubtitle}>
      <VStack align="stretch" gap={6} paddingX={formSpacing.paddingX} minW={0}>
        <Form noPadding onSubmit={(event) => event.preventDefault()}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.regime}
                  placeholder={text.regimePlaceholder}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option: Option<'C' | 'O'> | null) => field.onChange(option ?? null)}
                  options={regimeOptions}
                  noClearable
                  error={errors.group?.message}
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
                (`only_analytic`), mirror `cost_center_uuids` de
                `ApuracaoCusto` (PLANO-FIX §2.5/§3 F-247). `cacheUniqs`
                invalida o cache de options ao trocar de fazenda. */}
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

            {/* Contas — `CheckboxListField` REMOTO (`useOptionsChecklistQuery`
                sobre `listAccounts`, busca server-side), ocupa o restante da
                linha (mirror técnica `cost_center_ids`/`area_uuids` de
                `CustoProducao`/`ProducaoArea`). */}
            <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 3' }}>
              <Controller
                name="accounts"
                control={control}
                render={({ field }) => (
                  <CheckboxListField
                    label={text.fields.accounts}
                    items={accountsQuery.items}
                    selectedValues={field.value}
                    onChange={field.onChange}
                    searchValue={accountsSearch}
                    onSearchChange={setAccountsSearch}
                    searchPlaceholder={shared.lookupSearchPlaceholder}
                    selectAllLabel={shared.selectAll}
                    deselectAllLabel={shared.deselectAll}
                    selectedCountLabel={text.fields.accounts}
                    emptyLabel={shared.lookupEmptyMessage}
                    isLoading={accountsQuery.isLoading}
                    isError={accountsQuery.isError}
                    onRetry={accountsQuery.refetch}
                    columns={columnsForm.threeColumns}
                  />
                )}
              />
            </Box>
          </SimpleGrid>
        </Form>

        {/* 2 downloads diretos (SEM "Tipo de Relatório" client-side,
            diferente de `ApuracaoCusto`) — bloqueados até `group`+período
            preenchidos (mesmo guard da prévia, `hasRequiredFilled`). */}
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            variant="outline"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isDownloadingPdf}
            disabled={!hasRequiredFilled || isDownloadingPdf || isDownloadingExcel}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isDownloadingExcel}
            disabled={!hasRequiredFilled || isDownloadingPdf || isDownloadingExcel}
          />
        </Flex>

        {/* Prévia — view-model genérico do servidor, SEM reformatar
            (contrato de tela selado). Estados obrigatórios: loading
            (skeleton implícito via `previewQuery.isFetching` no botão/
            mensagem), empty ANTES do filtro, error (retry), empty do
            relatório, success (tabela + kpis + filters). */}
        <Box>
          {!hasRequiredFilled && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyBeforeFilter}</Text>
            </Box>
          )}

          {hasRequiredFilled && previewQuery.isError && (
            <Box py={10} textAlign="center">
              <Text color="fg.error" mb={3}>
                {text.previewError}
              </Text>
              <Button
                title={text.retryButton}
                type="button"
                variant="outline"
                onClick={() => previewQuery.refetch()}
              />
            </Box>
          )}

          {hasRequiredFilled && !previewQuery.isError && isReportEmpty && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyReport}</Text>
            </Box>
          )}

          {hasReport && previewQuery.data && (
            <VStack align="stretch" gap={4} opacity={previewQuery.isFetching ? 0.6 : 1}>
              <Box>
                <Text fontSize="lg" fontWeight="semibold">
                  {previewQuery.data.title}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {previewQuery.data.subtitle}
                </Text>
              </Box>

              {previewQuery.data.filters.length > 0 && (
                <Wrap gap={2}>
                  {previewQuery.data.filters.map((filter) => (
                    <Badge key={filter.label} variant="subtle" colorPalette="gray" py={1} px={2}>
                      {filter.label}: {filter.value}
                    </Badge>
                  ))}
                </Wrap>
              )}

              {previewQuery.data.kpis.length > 0 && (
                <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
                  {previewQuery.data.kpis.map((kpi) => (
                    <Box
                      key={kpi.label}
                      borderWidth="1px"
                      borderColor="borderGrid"
                      borderRadius="md"
                      p={3}
                    >
                      <Text fontSize="xs" color="fg.muted">
                        {kpi.label}
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
                        {kpi.value}
                      </Text>
                      {kpi.note && (
                        <Text fontSize="xs" color="fg.muted">
                          {kpi.note}
                        </Text>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              )}

              <Box w="100%" maxW="100%" minW={0} overflowX="auto" pb={2}>
                <Table.Root
                  size="sm"
                  variant="outline"
                  width="max-content"
                  minW={`max(100%, ${previewQuery.data.columns.length * 110}px)`}
                >
                  <Table.Header>
                    <Table.Row>
                      {previewQuery.data.columns.map((column) => (
                        <Table.ColumnHeader
                          key={column.key}
                          textAlign={column.align}
                          minW="110px"
                          whiteSpace="nowrap"
                        >
                          {column.label}
                        </Table.ColumnHeader>
                      ))}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {previewQuery.data.rows.map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- payload sem id próprio por linha
                      <Table.Row
                        key={index}
                        fontWeight={
                          row.variant === 'total'
                            ? 'bold'
                            : row.variant === 'group'
                              ? 'semibold'
                              : 'normal'
                        }
                      >
                        {previewQuery.data!.columns.map((column, columnIndex) => {
                          const isNegative = (row.negativeCells ?? []).includes(column.key);
                          const level = row.level ?? 0;
                          return (
                            <Table.Cell
                              key={column.key}
                              textAlign={column.align}
                              minW="110px"
                              whiteSpace="nowrap"
                              color={isNegative ? 'fg.error' : undefined}
                              paddingLeft={
                                columnIndex === 0 && level > 0 ? `${level * 16 + 12}px` : undefined
                              }
                            >
                              {row.cells[column.key] ?? '—'}
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </VStack>
          )}
        </Box>
      </VStack>
    </FormContainer>
  );
}
