// src/pages/Financeiro/CashFlow/index.tsx
// -----------------------------------------------------------------------------
// Tela "Fluxo Bancário" (F-107, esteira 070, TASK-CF-FE-02). Rota
// `/financeiro/fluxo` (registrada em TASK-CF-FE-01, mirror EXATO
// `WarehouseTransfer`/`TASK-WT-FE-02`). Consome o único endpoint
// `GET /cashflow` (`CONTRATO_AUTOAPROVADO`), payload plano não-paginado.
//
// Esta Tarefa entrega o CASCO (`FormContainer`/`PageCard`, mirror
// `RelatorioConsolidado`) + o form de filtro (5 campos, ORDEM LEGADA EXATA
// `accounts[]→period→type→start_date→end_date`) + o fetch MANUAL
// (`useQuery` com `enabled:false`+`refetch()`, mirror CLM-06 — só busca ao
// clicar "Filtrar") + os estados loading/empty(pré-filtro)/error/empty
// (relatório vazio). A SAÍDA completa (cards+gráficos+tabela+drill-down) é
// `TASK-CF-FE-03`/`TASK-CF-FE-04` — aqui a área de resultado só confirma
// que o payload chegou (placeholder textual, mirror combinado autorizado
// pela própria Tarefa: "pode renderizar um placeholder textual... a
// substituir na Tarefa seguinte").
//
// DIVERGÊNCIA DELIBERADA de `RelatorioConsolidado`/`PartidaDobrada`: SEM
// `hasValidRange` — o botão "Filtrar" fica SEMPRE habilitado (`DIV-03`, a
// API aceita ausência de datas e devolve relatório vazio sem erro). Não
// copiar o padrão desses 2 vizinhos aqui.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Box,
  Flex,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { FiPrinter } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ChartCard } from '@/components/cards/ChartCard';
import { StatCard } from '@/components/cards/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { GroupedBarChart } from '@/components/charts/GroupedBarChart';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { QueryErrorState } from '@/components/QueryErrorState';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { cashFlowFilterSchemaResolver } from '@/validations/schemas/Financeiro/CashFlow/cash-flow-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { getCashFlowReport } from '@/services/v2/Financeiro/CashFlow/cash-flow-service';

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type {
  CashFlowBucket,
  CashFlowFilterParams,
  CashFlowPeriod,
  CashFlowType,
} from '@/@types/v2/Financeiro/cash-flow';

interface CashFlowFilterForm {
  accounts: Option<string>[];
  period: CashFlowPeriod;
  type: CashFlowType;
  start_date: string | null;
  end_date: string | null;
}

const pristineValues: CashFlowFilterForm = {
  accounts: [],
  period: 'diary',
  type: 'synthetic',
  start_date: null,
  end_date: null,
};

// Achatamento do filtro (F-107 frontend contract §6) — `accounts` (Option[]
// do RHF) vira array de uuids; ausência de datas vira `undefined` (nunca
// string vazia) para o service não enviar a query string à toa.
function toRequestFilter(filter: CashFlowFilterForm): CashFlowFilterParams {
  return {
    accounts: filter.accounts?.map((option) => option.value) ?? undefined,
    period: filter.period,
    type: filter.type,
    start_date: filter.start_date || undefined,
    end_date: filter.end_date || undefined,
  };
}

// Formatação de `Dt. Movimento` da tabela (F-107 frontend contract §4.3):
// `d/m/Y` diário, `m/Y` mensal, ano cru anual. O backend não recalcula nem
// muda — só a REPRESENTAÇÃO da data-chave do bucket é formatada aqui.
// LACUNA declarada (sem payload real de produção para os 3 `period` nesta
// sessão): o shape exato de `bucket.date` para `monthly`/`yearly` não é
// confirmável por tipo (`CashFlowBucket.date` é só `string`) — normaliza
// defensivamente `YYYY-MM`→`YYYY-MM-01` antes do pattern mensal; e exibe só
// o ANO no anual (o backend envia `Y-m-d` também no anual, então formata para
// `yyyy` em vez de mostrar a ISO crua). Se o payload real divergir, é
// correção de formatação, não reabertura de contrato.
function formatBucketDate(date: string, period: CashFlowPeriod | undefined): string {
  if (period === 'yearly') {
    // O backend envia a data-chave do bucket como `Y-m-d` também no anual
    // (ex.: "2023-01-01") — `return date` cru exibia a ISO na tela (fix lote
    // 070, 2026-09-02). Mostrar só o ANO (agrupamento anual). Defensivo: se já
    // vier "YYYY", devolve como está.
    return /^\d{4}$/.test(date) ? date : formatDate(date, 'yyyy');
  }
  if (period === 'monthly') {
    const normalized = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
    return formatDate(normalized, 'MM/yyyy');
  }
  return formatDate(date, 'dd/MM/yyyy');
}

// Data do drill-down (`movement.date`, TASK-CF-FE-04 §Componentes — mirror
// LST-06, `toLocaleDateString('pt-BR')`). `T00:00:00` evita o bug de fuso
// horário (data-calendário pura interpretada como meia-noite UTC vira o dia
// anterior em fusos negativos como `America/Sao_Paulo`) — mesma técnica já
// usada em `WriteoffExpenseModal.tsx::addDays`, não invenção nova.
function formatMovementDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

export default function CashFlowReportPage() {
  const { languageGB } = useLanguage();
  const text = languageGB.financial.cashFlow;

  const periodOptions: Option<CashFlowPeriod>[] = [
    { value: 'diary', label: text.filter.periodOptions.diary },
    { value: 'monthly', label: text.filter.periodOptions.monthly },
    { value: 'yearly', label: text.filter.periodOptions.yearly },
  ];

  const typeOptions: Option<CashFlowType>[] = [
    { value: 'synthetic', label: text.filter.typeOptions.synthetic },
    { value: 'analytical', label: text.filter.typeOptions.analytical },
  ];

  const { control, handleSubmit, reset } = useForm<CashFlowFilterForm>({
    mode: 'onChange',
    resolver: cashFlowFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [appliedFilters, setAppliedFilters] = useState<CashFlowFilterParams | null>(null);

  // Reset ao trocar de fazenda (lote 070, 2026-09-02): `accounts` é
  // farm-specific; sem resetar, a seleção da fazenda ANTERIOR persiste e o
  // "Filtrar" envia uuids de conta de outra fazenda → 422. Ao mudar o
  // `activeFarmUuid` (AuthContext / header X-Farm-Id), limpa o form e o
  // relatório aplicado (a próxima abertura do Select busca contas da nova farm).
  const { activeFarmUuid } = useAuth();
  useEffect(() => {
    reset(pristineValues);
    setAppliedFilters(null);
  }, [activeFarmUuid]);

  const reportQuery = useQuery({
    queryKey: [queryKey.financial.cashFlow, appliedFilters],
    queryFn: () => getCashFlowReport(appliedFilters!).then((response) => response.data),
    // Só busca no clique de "Filtrar" — mirror CLM-06. NUNCA fetch
    // automático no mount/na troca de campo.
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useQueryError([reportQuery]);

  // Drill-down (TASK-CF-FE-04) — modal "Movimentações da Data". `bucket.
  // movements[]` só vem embutido quando `filters.type==='analytical'`
  // (SUR-16/17, sem 2ª chamada de API). `onClick` ligado SOMENTE à `<tr>` da
  // tabela do relatório (React declarativo corrige `DIV-08`, o listener
  // global `$('tr').on('click')` do legado — mesmo efeito observável, sem
  // decisão de produto nova).
  const drillDownDisclosure = useDisclosure();
  const [selectedBucket, setSelectedBucket] = useState<CashFlowBucket | null>(null);

  function handleRowClick(bucket: CashFlowBucket) {
    if (appliedFilters?.type !== 'analytical' || !Array.isArray(bucket.movements)) return;
    setSelectedBucket(bucket);
    drillDownDisclosure.onOpen();
  }

  function handleFiltrar(data: CashFlowFilterForm) {
    setAppliedFilters(toRequestFilter(data));
  }

  // Dispara o fetch manual reagindo à mudança de `appliedFilters` — a query
  // fica `enabled:false`, então `refetch()` é o único acionador possível.
  useEffect(() => {
    if (appliedFilters) reportQuery.refetch();
    // Disparo manual controlado só por `appliedFilters` (mirror CLM-06) —
    // `reportQuery`/`reportQuery.refetch` deliberadamente fora do array de
    // dependências (nenhuma regra `exhaustive-deps` ativa neste projeto).
  }, [appliedFilters]);

  function handleLimpar() {
    reset(pristineValues);
    setAppliedFilters(null);
  }

  // GAP-CF-FE-02 — `reportQuery` fica `enabled:false` PERMANENTEMENTE até o 1º
  // "Filtrar" (mirror CLM-06). Em TanStack Query v5, uma query nunca disparada
  // tem `status:'pending'` (`isPending:true`) INDEPENDENTE de `enabled`, então
  // `checkLoadingStatus` (que testa `isPending`) prendia `isLoading` em `true`
  // para sempre no 1º carregamento — escondia o empty pré-filtro obrigatório
  // (contrato §4). `isFetching` reflete o fetch REAL (dispara só no
  // `refetch()` do `useEffect` acima) — `false` enquanto a query nunca buscou,
  // `true` durante o fetch, `false` de novo ao concluir (sucesso ou erro).
  // NÃO usar `checkLoadingStatus`/`isPending` aqui — ver GAP-CF-FE-02.
  const isLoading = reportQuery.isFetching;
  const hasBeenFiltered = appliedFilters !== null;
  const hasReport = !!reportQuery.data && hasBeenFiltered && !reportQuery.isError;
  const isReportEmpty = hasReport && (reportQuery.data?.buckets?.length ?? 0) === 0;

  return (
    <FormContainer title={text.pageTitle} subtitle={text.pageSubtitle}>
      <VStack align="stretch" gap={6}>
        <Form onSubmit={(event) => event.preventDefault()}>
          <VStack align="stretch" gap={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              {/* FLT-01 — accounts[] "Conta Bancária" (SelectAsyncPaginate
                  isMulti, mirror CreateOrUpdateBatch::category_uuids — NÃO
                  o `SelectMulti` genérico, que não existe neste
                  repositório). */}
              <Controller
                name="accounts"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filter.accountLabel}
                    placeholder={text.filter.accountPlaceholder}
                    isMulti
                    // cacheUniqs por fazenda (lote 070, 2026-09-02): o
                    // react-select-async-paginate CACHEIA as opções carregadas;
                    // sem isto, ao trocar de fazenda o select segue mostrando as
                    // contas da fazenda ANTERIOR (cache), o usuário re-seleciona
                    // uma delas e o backend rejeita (422 accounts.0 inválido).
                    // Mudar `activeFarmUuid` limpa o cache e re-busca as contas
                    // da nova fazenda. Complementa o reset do form (valor) acima.
                    cacheUniqs={[activeFarmUuid]}
                    service={(params) => listAccounts({ ...params, is_enabled: 'true' })}
                    mapOptions={(item: AccountListItem) => ({
                      label: `${item.code} - ${item.description}`,
                      value: item.uuid,
                    })}
                    value={field.value ?? []}
                    onChange={(options: any) => field.onChange(options ?? [])}
                  />
                )}
              />

              {/* FLT-02 — period "Periodicidade" (Select local, default
                  'diary', mirror CLM-15). */}
              <Controller
                name="period"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.periodLabel}
                    name={name}
                    value={periodOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<CashFlowPeriod> | null) =>
                      onChange(option?.value ?? 'diary')
                    }
                    options={periodOptions}
                    noClearable
                  />
                )}
              />

              {/* FLT-03 — type "Tipo" (Select local, default 'synthetic',
                  mirror CLM-18). */}
              <Controller
                name="type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.typeLabel}
                    name={name}
                    value={typeOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<CashFlowType> | null) =>
                      onChange(option?.value ?? 'synthetic')
                    }
                    options={typeOptions}
                    noClearable
                  />
                )}
              />
            </SimpleGrid>

            <SimpleGrid columns={columnsForm.default} gap={6}>
              {/* FLT-04 — start_date "Dt. Início" (DateInput ISO, OPCIONAL —
                  DIV-03, sem par obrigatório com end_date). */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.filter.startDateLabel}
                </Text>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput value={value ?? null} onChange={onChange} />
                  )}
                />
              </Box>

              {/* FLT-05 — end_date "Dt. Fim" (DateInput ISO, `maxDate={hoje}`
                  ADITIVO — mirror da guarda `before_or_equal:today` já
                  existente na API, DIV-09/IA-01). */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.filter.endDateLabel}
                </Text>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput value={value ?? null} onChange={onChange} maxDate={new Date()} />
                  )}
                />
              </Box>
            </SimpleGrid>

            {/* ACT-01/ACT-02 — "Filtrar" SEMPRE habilitado (SEM
                `hasValidRange`, DIV-03) + "Limpar". */}
            <Flex width="full" justifyContent="flex-end" gap={3}>
              <Button
                title={text.filter.clearButton}
                type="button"
                variant="outline"
                onClick={handleLimpar}
                disabled={reportQuery.isFetching}
              />
              <Button
                title={text.filter.filterButton}
                type="button"
                onClick={handleSubmit(handleFiltrar)}
                loading={reportQuery.isFetching}
              />
            </Flex>
          </VStack>
        </Form>

        {/* Estados obrigatórios da área de saída (get_spa_ux_fidelity_pattern
            §3): loading / empty (pré-filtro) / error / empty (relatório
            vazio) / success (placeholder — saída completa em
            TASK-CF-FE-03/04). */}
        <Skeleton loading={isLoading}>
          {!hasBeenFiltered && !isLoading && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyBeforeFilter}</Text>
            </Box>
          )}

          {hasBeenFiltered && reportQuery.isError && (
            <QueryErrorState
              error={reportQuery.error}
              onRetry={() => reportQuery.refetch()}
              isRetrying={reportQuery.isFetching}
              retryLabel={text.retryButton}
            />
          )}

          {isReportEmpty && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyReport}</Text>
            </Box>
          )}

          {hasReport && !isReportEmpty && reportQuery.data && (
            /* px (lote 070, 2026-09-02): recuo horizontal do bloco do relatório
               (cabeçalho "Resultado do período" + Imprimir + cards/tabela) para
               que título e botão não fiquem colados nas bordas — decisão do dono
               (opção C). Aplicado ao VStack inteiro para header e conteúdo
               permanecerem alinhados. */
            <VStack align="stretch" gap={6} px={{ base: 4, md: 6 }} py={4}>
              {/* ACT-03/INT-03 — "Imprimir" (window.print nativo + `@media
                  print` isolando a área do relatório, mirror `isset($data)`
                  do legado — visível só com relatório carregado, FORA de
                  `.cashflow-print-area` para nunca aparecer na folha
                  impressa). */}
              <Flex width="full" align="center" justifyContent="space-between">
                <Text fontSize="md" fontWeight="semibold">
                  {text.resultTitle}
                </Text>
                <Button
                  title={text.printButton}
                  icon={FiPrinter as ElementType}
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                />
              </Flex>

              <Box className="cashflow-print-area">
                <VStack align="stretch" gap={6}>
                  {/* §4.1 — Cards "Saldos" (2 `StatCard`, equivalente real
                      do `KpiStatCard` do design system `cerne` — esse nome
                      não existe neste repositório). */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                    <StatCard
                      title={text.cards.cashierLabel}
                      value={formatCurrencyBRL(reportQuery.data.balance_cashier)}
                    />
                    <StatCard
                      title={text.cards.accountsLabel}
                      value={formatCurrencyBRL(reportQuery.data.balance_accounts)}
                    />
                  </SimpleGrid>

                  {/* §4.2 — 2 gráficos via `@chakra-ui/charts`+`recharts`
                      (`DonutChart`/`GroupedBarChart`, já adaptados ao `cerne`
                      neste repositório — reutilizados, não reescritos). */}
                  <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                    <ChartCard title={text.charts.incomeExpenseTitle}>
                      {/* Estado-vazio (lote 070, 2026-09-02): quando o período
                          filtrado não tem entradas nem saídas, o `DonutChart`
                          cai no seu guarda `isEmpty` e renderiza uma caixa em
                          branco (parece "não desenhado"). Mostrar mensagem
                          clara em vez do branco — comportamento fiel ao legado
                          (período sem movimento = sem gráfico), só que legível. */}
                      {reportQuery.data.income_expense_result.incomes === 0 &&
                      reportQuery.data.income_expense_result.expenses === 0 ? (
                        <Flex align="center" justify="center" minH="220px">
                          <Text color="fg.muted" fontSize="sm">
                            {text.emptyReport}
                          </Text>
                        </Flex>
                      ) : (
                        <DonutChart
                          data={[
                            {
                              label: text.table.incomesColumn,
                              value: reportQuery.data.income_expense_result.incomes,
                            },
                            {
                              label: text.table.expensesColumn,
                              value: reportQuery.data.income_expense_result.expenses,
                            },
                          ]}
                          valueFormat={(value) => formatCurrencyBRL(value)}
                        />
                      )}
                    </ChartCard>
                    <ChartCard title={text.charts.balanceTitle}>
                      <GroupedBarChart
                        labels={[text.charts.initialBalanceLabel, text.charts.finalBalanceLabel]}
                        series={[
                          {
                            name: text.charts.balanceTitle,
                            data: [reportQuery.data.start_balance, reportQuery.data.total.balance],
                          },
                        ]}
                        yFormat={(value) => formatCurrencyBRL(value)}
                        showLegend={false}
                      />
                    </ChartCard>
                  </SimpleGrid>

                  {/* §4.3 — Tabela + linha Total (`payload.total`, NUNCA
                      recalculada no front — `DIV-07`/`CLC-06`). §4.4 —
                      drill-down: `onClick` só ativo quando
                      `type==='analytical'` E `bucket.movements` presente. */}
                  <Table.Root size="sm" variant="outline" striped>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>{text.table.dateColumn}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">
                          {text.table.incomesColumn}
                        </Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">
                          {text.table.expensesColumn}
                        </Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">
                          {text.table.balanceDayColumn}
                        </Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">
                          {text.table.balanceColumn}
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {reportQuery.data.buckets.map((bucket) => {
                        const isClickable =
                          appliedFilters?.type === 'analytical' && Array.isArray(bucket.movements);
                        return (
                          <Table.Row
                            key={bucket.date}
                            onClick={() => handleRowClick(bucket)}
                            cursor={isClickable ? 'pointer' : 'default'}
                            _hover={isClickable ? { bg: 'bg.muted' } : undefined}
                          >
                            <Table.Cell>
                              {formatBucketDate(bucket.date, appliedFilters?.period)}
                            </Table.Cell>
                            <Table.Cell textAlign="end">
                              {formatCurrencyBRL(bucket.incomes)}
                            </Table.Cell>
                            <Table.Cell textAlign="end">
                              {formatCurrencyBRL(bucket.expenses)}
                            </Table.Cell>
                            <Table.Cell textAlign="end">
                              {formatCurrencyBRL(bucket.balance_day)}
                            </Table.Cell>
                            <Table.Cell textAlign="end">
                              {formatCurrencyBRL(bucket.balance)}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                    <Table.Footer>
                      <Table.Row fontWeight="bold">
                        <Table.Cell>{text.table.totalRowLabel}</Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(reportQuery.data.total.incomes)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(reportQuery.data.total.expenses)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(reportQuery.data.total.balance_day)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(reportQuery.data.total.balance)}
                        </Table.Cell>
                      </Table.Row>
                    </Table.Footer>
                  </Table.Root>
                </VStack>
              </Box>
            </VStack>
          )}
        </Skeleton>

        {/* `@media print` restringe a árvore impressa à `.cashflow-print-area`
            (cards+gráficos+tabela) — filtro/botões/menu/sidebar ficam FORA
            dela e são ocultados por `visibility:hidden` global; técnica
            padrão de "imprimir só este elemento" (não um mecanismo novo),
            auto-contida neste arquivo (sem editar `DashboardLayout`/
            `NavRail`/`Header`, fora do escopo desta Tarefa). */}
        <style>
          {`@media print {
            body * { visibility: hidden; }
            .cashflow-print-area, .cashflow-print-area * { visibility: visible; }
            .cashflow-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
          }`}
        </style>

        {/* TASK-CF-FE-04 — modal de drill-down "Movimentações da Data".
            `CustomDialog` (wrapper `Dialog.Root` v3 já provado em produção,
            `get_pwa_ui_components_pattern §20.3`) — reutilizado, não Dialog
            cru. */}
        <CustomDialog
          isOpen={drillDownDisclosure.open}
          onClose={() => {
            drillDownDisclosure.onClose();
            setSelectedBucket(null);
          }}
          title={text.drilldown.title}
          scrollableBody
        >
          {selectedBucket && (selectedBucket.movements?.length ?? 0) > 0 ? (
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{text.drilldown.dateColumn}</Table.ColumnHeader>
                  <Table.ColumnHeader>{text.drilldown.noteColumn}</Table.ColumnHeader>
                  <Table.ColumnHeader>{text.drilldown.typeColumn}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {text.drilldown.valueColumn}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {selectedBucket.movements!.map((movement, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- payload embutido sem id próprio (SUR-16/17)
                  <Table.Row key={`${movement.date}-${index}`}>
                    <Table.Cell>{formatMovementDate(movement.date)}</Table.Cell>
                    <Table.Cell>{movement.note ?? text.drilldown.notInformed}</Table.Cell>
                    <Table.Cell>
                      {movement.type === 'E'
                        ? text.drilldown.incomeLabel
                        : text.drilldown.expenseLabel}
                    </Table.Cell>
                    <Table.Cell textAlign="end">{formatCurrencyBRL(movement.value)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Box py={6} textAlign="center">
              <Text color="fg.muted">{text.emptyReport}</Text>
            </Box>
          )}
        </CustomDialog>
      </VStack>
    </FormContainer>
  );
}
