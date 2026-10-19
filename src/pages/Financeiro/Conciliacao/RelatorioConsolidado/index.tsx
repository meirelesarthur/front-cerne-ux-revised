// src/pages/Financeiro/Conciliacao/RelatorioConsolidado/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatório de Conciliação de Contas Consolidadas" (F-213, feature_id
// f250f22d). Migrada originalmente em SURF-033/034/TASK-MES-FE-11; REWORK de
// 3 ajustes do dono nesta Tarefa (lote 079,
// 97-Esteiras/079/ROTEIROS/F-213-plano-frontend-rework.md — feature NUNCA
// commitada/entregue antes deste rework, sem usuário/bookmark a preservar):
//
//   1. MENU + ROTA: item novo "Relatórios › Financeiro › Conciliação de
//      Contas" (`navigationTree.ts`/`navigationPermissions.ts`,
//      `rel-fin-conciliacao-contas`). Rota ALINHADA para
//      `/relatorios/financeiro/conciliacao-de-contas` (mirror dos ~30
//      irmãos de `rel-fin`), substituindo `/financeiro/conciliacao-
//      consolidada` (sobrepõe DEC-177 "sem item de menu" — decisão do dono
//      nesta Tarefa). PASTA DO ARQUIVO MANTIDA aqui (decisão de menor risco:
//      só 1 arquivo — `router/index.tsx` — referenciava o import; mover a
//      pasta não trazia benefício de fidelidade adicional e ampliava o
//      diff sem necessidade).
//   2. FIX PDF/EXCEL (bug #2): o download agora chama
//      `/account-reconciliation-report/generated` (rota `generated()`, a
//      única que devolve binário) — antes chamava por engano
//      `/account-reconciliation-report` (rota `report()`, JSON), entregando
//      um "PDF" que era na verdade o corpo JSON da prévia. Ver
//      `account-reconciliation-report-service.ts`.
//   3. TABELA EM TELA (fidelidade ao legado, `AM-01`/`LM-01`): botão NOVO
//      "Filtrar" busca `GET /account-reconciliation-report` (JSON, mesmos
//      filtros) e renderiza a prévia como TABELA na própria tela — mirror
//      ESTRUTURAL de `Relatorios/Financeiro/ApuracaoCusto/index.tsx` (fetch
//      manual `useQuery({enabled:false})`+`refetch()`, `Table.Root` Chakra,
//      sem paginação — prévia síncrona). Botões "Exportar PDF"/"Exportar
//      Excel" (mantidos separados, já fiéis ao legado — `report_type`)
//      passam a só aparecer com `hasGeneratedReport` (filtrou + sem erro +
//      com linhas), mirror `ApuracaoCusto`/legado `@if(isset($data))`.
//      Colunas/linhas computadas por `buildPreviewViewModel.ts`, mirror
//      LITERAL de `GenerateAccountReconciliationReportAction::buildColumns()/
//      buildRows()` (API já migrada) — ver comentário de cabeçalho daquele
//      arquivo para as decisões de fidelidade herdadas (Participante,
//      "Tipo de Movimento", `value` nunca `allocation_value`).
//
//      DECISÃO DE COMPORTAMENTO (server-side filter): a tabela já renderizada
//      reflete o `condition` do FILTRO APLICADO (`appliedFilters.condition`),
//      NÃO o valor ao vivo do select (`watch('condition')`) — trocar o
//      select sem reclicar "Filtrar" não deve mudar colunas/linhas já
//      exibidas (mirror do comportamento real do legado, filtro
//      server-side). Usar `watch('condition')` diretamente (como uma leitura
//      apressada do plano de rework poderia sugerir) quebraria esse
//      contrato: mudaria as colunas ANTES do refetch, exibindo
//      Categoria/Centro vazios para linhas que vieram de uma busca
//      `condition=0`.
//
// Mirror estrutural original de `Relatorios/Pecuaria/EvolucaoRebanho/
// index.tsx` (FormContainer + filtro + export PDF/Excel) — mantido para os
// campos de filtro; a casca de botões/tabela agora segue `ApuracaoCusto`.
//
// AJUSTE PONTUAL (lote 079, pedido do dono): botões "Filtrar"/"Exportar
// Excel"/"Exportar PDF" coladas na borda direita — mesma causa-raiz e mesmo
// fix já documentados no cabeçalho de `ApuracaoCusto/index.tsx` (refinamento
// item 1 daquele arquivo): sem `footer` na `FormContainer`,
// `!hasFooter → <Box>{children}</Box>` não injeta padding nenhum, e o
// `<Form>` só aplica `configureSpacing().formSpacing.paddingX` a si mesmo —
// o `VStack` externo (botões + tabela) ficava sem respiro lateral algum.
// Corrigido aplicando o MESMO token `formSpacing.paddingX` no `VStack`
// externo + `noPadding` no `<Form>` (evita padding duplicado nos campos).
//
// AJUSTE ADICIONAL (mesmo lote/pedido): grade do filtro trocada de
// `columnsForm.default` (`lg:4`) para `columnsForm.threeColumns`
// (`base:1,sm:1,md:2,lg:3`) — token JÁ em uso em ~15 relatórios irmãos
// (`EstoqueRebanho`, `PesagemLote`, `CusteioAnimal` etc.) para grade de
// filtro de 3 campos por linha ocupando 100% da largura do `SimpleGrid`
// (sem `maxW` estreito). REFINAMENTO no mesmo pedido: `provider_uuid`
// (Fornecedor) sobe para a 2ª linha (junto de `start_date`/`end_date`,
// fechando 3 campos) — 1ª linha = account_uuid/condition/order_by, 2ª linha
// = start_date/end_date/provider_uuid, 3ª linha = só client_uuid. ORDEM
// relativa dos campos preservada (Fornecedor continua logo antes de
// Cliente); `periodRequiredHint` segue logo após a linha das datas (agora a
// mesma linha do Fornecedor), mantendo a adjacência semântica com o par de
// datas.
//
// Campos (contrato-meses-norm.md FLD-073 a FLD-080, `account_report`):
//   - `account_uuid` opcional (FLD-073, default "todas").
//   - `start_date`/`end_date` — par OBRIGATÓRIO (FLD-074/075, validado pelo
//     schema Yup) — botões desabilitados até as 2 datas presentes (mirror
//     `hasValidRange`).
//   - `condition` (FLD-076/FIL-012) — toggle 0/1 que acrescenta os joins de
//     categoria+centro (NÃO uma escolha exclusiva categoria-OU-centro).
//   - `provider_uuid`/`client_uuid` — opcionais (FLD-077/078).
//   - `order_by` (FLD-079/FIL-015) — enum FECHADO 'asc'/'desc' (mirror
//     `ORDER BY date,id`) — NUNCA exposto como campo de texto livre.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Skeleton, Table, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { configureSpacing } from '@/utils/config-padding';
import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { accountReconciliationReportFilterSchemaResolver } from '@/validations/schemas/OfxImport/account-reconciliation-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import {
  downloadAccountReconciliationReportPdf,
  downloadAccountReconciliationReportXlsx,
  getAccountReconciliationReportPreview,
  type AccountReconciliationReportParams,
} from '@/services/v2/OfxImport/account-reconciliation-report-service';

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';

import {
  buildAccountReconciliationColumns,
  buildAccountReconciliationRows,
} from './buildPreviewViewModel';

interface AccountReconciliationReportFilterForm {
  account_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  condition: 0 | 1;
  provider_uuid: Option<string> | null;
  client_uuid: Option<string> | null;
  order_by: 'asc' | 'desc';
}

const pristineValues: AccountReconciliationReportFilterForm = {
  account_uuid: null,
  start_date: null,
  end_date: null,
  condition: 0,
  provider_uuid: null,
  client_uuid: null,
  order_by: 'desc',
};

function findParamsFromSearch(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

// Mirror `EvolucaoRebanho/index.tsx::parseDownloadError` — erro 422 chega
// como `Blob` quando `responseType:'blob'`.
async function parseDownloadErrorMessage(error: unknown): Promise<string | null> {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : null;
  const data = error.response?.data as unknown;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      return parsed.message ?? null;
    } catch {
      return null;
    }
  }
  return (data as { message?: string })?.message ?? null;
}

export default function RelatorioConsolidado() {
  const { languageGB } = useLanguage();
  const text = languageGB.financial.ofxImport.consolidatedReport;

  // Espaçamento à direita dos botões "Filtrar"/"Exportar PDF"/"Exportar
  // Excel" (ajuste pontual, lote 079) — mirror EXATO `ApuracaoCusto/
  // index.tsx` (refinamento item 1 daquele arquivo): sem `footer` na
  // `FormContainer`, `!hasFooter → <Box>{children}</Box>` não injeta padding
  // nenhum, e o `<Form>` só aplica `formSpacing.paddingX` a si mesmo — os
  // botões/tabela fora dele colavam na borda do `PageCard`. Corrigido
  // aplicando o MESMO token `formSpacing.paddingX` no `VStack` externo +
  // `noPadding` no `<Form>` (evita padding duplicado).
  const { formSpacing } = configureSpacing();

  const conditionOptions: Option<0 | 1>[] = [
    { value: 0, label: text.conditionOptions.withoutCategory },
    { value: 1, label: text.conditionOptions.withCategory },
  ];

  const orderByOptions: Option<'asc' | 'desc'>[] = [
    { value: 'desc', label: text.orderByOptions.recent },
    { value: 'asc', label: text.orderByOptions.oldest },
  ];

  const { control, handleSubmit, watch } = useForm<AccountReconciliationReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: accountReconciliationReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AccountReconciliationReportParams | null>(
    null
  );

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: AccountReconciliationReportFilterForm
  ): AccountReconciliationReportParams {
    return {
      account_uuid: data.account_uuid?.value,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      condition: data.condition,
      provider_uuid: data.provider_uuid?.value,
      client_uuid: data.client_uuid?.value,
      order_by: data.order_by,
    };
  }

  // Prévia em tabela (Fatia 3, F-213) — fetch MANUAL (`enabled:false`+
  // `refetch()`), mirror EXATO `ApuracaoCusto/index.tsx` — só busca ao
  // clicar "Filtrar".
  const previewQuery = useQuery({
    queryKey: [queryKey.relatorios.accountReconciliationPreview, appliedFilters],
    queryFn: () => getAccountReconciliationReportPreview(appliedFilters!),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useQueryError([previewQuery]);

  useEffect(() => {
    if (appliedFilters) previewQuery.refetch();
    // Disparo manual controlado só por `appliedFilters` (mirror
    // `ApuracaoCusto`/`CustoProducao`) — `previewQuery`/`previewQuery.refetch`
    // deliberadamente fora do array de dependências (nenhuma regra
    // `exhaustive-deps` ativa neste projeto).
  }, [appliedFilters]);

  function handleFiltrar(data: AccountReconciliationReportFilterForm) {
    setAppliedFilters(buildParams(data));
  }

  const hasBeenFiltered = appliedFilters !== null;
  // `condition` da tabela JÁ RENDERIZADA vem do FILTRO APLICADO, não do
  // valor ao vivo do select — ver nota de cabeçalho do arquivo (comportamento
  // server-side: só reflete após novo "Filtrar").
  const previewCondition = appliedFilters?.condition ?? 0;
  const previewRows = previewQuery.data ?? [];
  const isReportEmpty = hasBeenFiltered && !previewQuery.isError && previewRows.length === 0;
  // "Exportar PDF"/"Exportar Excel" só aparecem com relatório GERADO
  // (mirror `ApuracaoCusto`/legado `@if(isset($data))`) — mesma condição de
  // sucesso-com-dados que renderiza a tabela abaixo.
  const hasGeneratedReport = hasBeenFiltered && !previewQuery.isError && previewRows.length > 0;

  const previewColumns = buildAccountReconciliationColumns(previewCondition, text.table);
  const previewViewRows = buildAccountReconciliationRows(previewRows, previewCondition, languageGB);

  async function handleExportPdf(data: AccountReconciliationReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadAccountReconciliationReportPdf(buildParams(data));
      downloadBlob(blob, 'conciliacao-consolidada.pdf');
    } catch (error) {
      const message = await parseDownloadErrorMessage(error);
      toaster.error({ title: text.pageTitle, description: message || text.downloadError });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: AccountReconciliationReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadAccountReconciliationReportXlsx(buildParams(data));
      downloadBlob(blob, 'conciliacao-consolidada.xlsx');
    } catch (error) {
      const message = await parseDownloadErrorMessage(error);
      toaster.error({ title: text.pageTitle, description: message || text.downloadError });
    } finally {
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer title={text.pageTitle} subtitle={text.pageSubtitle}>
      <VStack align="stretch" gap={6} paddingX={formSpacing.paddingX}>
        <Form noPadding onSubmit={(event) => event.preventDefault()}>
          <VStack align="stretch" gap={6}>
            <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
              <Controller
                name="account_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.accountLabel}
                    placeholder={text.accountPlaceholder}
                    service={listAccounts}
                    mapOptions={(item: AccountListItem) => ({
                      label: `${item.bank} — ${item.agency}/${item.account}`,
                      value: item.uuid,
                    })}
                    findParams={findParamsFromSearch}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                  />
                )}
              />

              <Controller
                name="condition"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.conditionLabel}
                    name={name}
                    value={conditionOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<0 | 1> | null) => onChange(option?.value ?? 0)}
                    options={conditionOptions}
                    noClearable
                  />
                )}
              />

              <Controller
                name="order_by"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.orderByLabel}
                    name={name}
                    value={orderByOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<'asc' | 'desc'> | null) =>
                      onChange(option?.value ?? 'desc')
                    }
                    options={orderByOptions}
                    noClearable
                  />
                )}
              />
            </SimpleGrid>

            <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.startDate}
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
                  {text.endDate}
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
                name="provider_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.providerLabel}
                    placeholder={text.providerPlaceholder}
                    service={listProviders}
                    mapOptions={(item: ProviderListItem) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={findParamsFromSearch}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                  />
                )}
              />
            </SimpleGrid>

            {!hasValidRange && (
              <Text fontSize="sm" color="fg.muted">
                {text.periodRequiredHint}
              </Text>
            )}

            <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
              <Controller
                name="client_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.clientLabel}
                    placeholder={text.clientPlaceholder}
                    service={listClients}
                    mapOptions={(item: ClientListItem) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={findParamsFromSearch}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                  />
                )}
              />
            </SimpleGrid>
          </VStack>
        </Form>

        {/* "Filtrar" (Fatia 3, F-213) — dispara a prévia JSON e mostra a
            tabela abaixo. "Exportar PDF"/"Exportar Excel" (fix bug #2, Fatia
            2) empilhados logo abaixo, só visíveis com `hasGeneratedReport` —
            mirror ESTRUTURAL `ApuracaoCusto/index.tsx`. */}
        <VStack align="stretch" gap={3} width="full">
          <Flex width="full" justifyContent="flex-end">
            <Button
              title={text.filterButton}
              type="button"
              onClick={handleSubmit(handleFiltrar)}
              loading={previewQuery.isFetching}
              disabled={!hasValidRange}
            />
          </Flex>

          {hasGeneratedReport && (
            <Flex width="full" justifyContent="flex-end" gap={3}>
              <Button
                title={text.downloadPdfButton}
                icon={Download as any}
                type="button"
                onClick={handleSubmit(handleExportPdf)}
                loading={isExportingPdf}
                disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
              />
              <Button
                title={text.downloadExcelButton}
                icon={FileSpreadsheet as any}
                type="button"
                onClick={handleSubmit(handleExportXlsx)}
                loading={isExportingXlsx}
                disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
              />
            </Flex>
          )}
        </VStack>

        {/* Prévia em tabela (Fatia 3, F-213) — estados obrigatórios mirror
            `ApuracaoCusto` (antes de filtrar / loading / erro+retry / vazio /
            sucesso). Colunas fixas + 2 condicionais (`condition=1`), mirror
            `GenerateAccountReconciliationReportAction::buildColumns()`. */}
        <Skeleton loading={previewQuery.isFetching} minW={0}>
          {!hasBeenFiltered && !previewQuery.isFetching && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyBeforeFilter}</Text>
            </Box>
          )}

          {hasBeenFiltered && previewQuery.isError && (
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

          {isReportEmpty && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyState}</Text>
            </Box>
          )}

          {hasGeneratedReport && (
            <Box w="100%" maxW="100%" minW={0} overflowX="auto" pb={2}>
              <Table.Root size="sm" variant="outline" width="max-content" minW="full">
                <Table.Header>
                  <Table.Row>
                    {previewColumns.map((column) => (
                      <Table.ColumnHeader
                        key={column.key}
                        textAlign={column.align}
                        whiteSpace="nowrap"
                      >
                        {column.label}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {previewViewRows.map((row, index) => (
                    // eslint-disable-next-line react/no-array-index-key -- payload sem id próprio por linha
                    <Table.Row key={index}>
                      {previewColumns.map((column) => (
                        <Table.Cell key={column.key} textAlign={column.align} whiteSpace="nowrap">
                          {row.cells[column.key] ?? '-'}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
              {/* Contagem de registros (mirror "N. Registros:" do legado) —
                  total CLIENT-SIDE (o envelope não traz `meta`, é
                  `rows.length` da resposta já carregada). */}
              <Text fontSize="sm" color="fg.muted" mt={2}>
                {text.recordsCount(previewViewRows.length)}
              </Text>
            </Box>
          )}
        </Skeleton>
      </VStack>
    </FormContainer>
  );
}
