// src/pages/Financeiro/MercadoPago/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Financeiro Mercado Pago — SaaS-admin, domínio
// "Financeiro" (execução 031, TASK-FE-031-45). Rota: /financeiro/mercado-pago
// (guardada por `finan_view`, wiring real da rota é TASK-FE-031-46 — este
// arquivo não mexe em rota/menu).
//
// Tela 100% READ-ONLY (contrato-front-financeiro-mercado-pago.md §5, decisão
// do dono): SEM botão "Novo", SEM ação de linha, SEM coluna "AÇÃO" — a
// imagem de evidência mostra uma 10ª coluna "AÇÃO" que NÃO é replicada aqui
// (divergência deliberada, contrato §2). Mirror estrutural de
// `CadastrosBase/SaldoInicial/index.tsx` (`useCustomGridQuery` inline, sem
// hook local, regra 5 do protocolo v2) + `GridSettings`
// (`useGridSettings`/`GridSettingsFloatingPanel`, regra 8 do protocolo).
//
// Endpoint SEM `X-Farm-Id` (SaaS-admin, is_farm:false) — ver comentário de
// cabeçalho de `financialMercadoPago-service.ts` para o racional completo.
// `per_page` inicial = 10 (contrato de API §2 — divergência intencional do
// legado, que usava 20; não é bug, não é para "corrigir").
//
// Estado vazio: o backend SEMPRE retorna `data: []` hoje (placeholder, sem
// billing migrado) — este é o estado DEFAULT esperado em produção, não um
// caso de borda raro. Texto EXATO da imagem de evidência: "Nenhuma
// informação encontrada." — SEM CTA (não há permissão de criação nesta tela).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';
import { useMemo } from 'react';

import { Badge, Box, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCreditCard } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { listFinancialMercadoPago } from '@/services/v2/Financeiro/financialMercadoPago-service';
import type { ListFinancialMercadoPagoParams } from '@/services/v2/Financeiro/financialMercadoPago-service';

import type {
  FinancialMercadoPagoFilterForm,
  FinancialMercadoPagoListItem,
  FinancialMercadoPagoPaymentMethod,
  FinancialMercadoPagoStatus,
} from '@/@types/v2/Financeiro/financialMercadoPago';

import { FilterSideMercadoPago } from './FilterSideMercadoPago';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `SALDO_INICIAL_STORAGE_KEY`, DEC-007 §12).
const FINANCEIRO_MERCADO_PAGO_STORAGE_KEY =
  'FinanceiroMercadoPago' + queryKey.financial.mercadoPagoTransactions;

// `value` (decimal do legado) — formatação BRL local, mesmo padrão de
// `SaldoInicial/index.tsx`/`Funcoes/index.tsx` (não criar util compartilhado
// novo só para isso, instrução explícita do contrato §3).
function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Badge por status — mesma convenção de `Afiliados/index.tsx`
// (`partnerStatusBadgeVariant`), aqui local (enum de 4 valores, só esta
// tela usa) em vez de um dicionário compartilhado novo.
const STATUS_BADGE_VARIANT: Record<FinancialMercadoPagoStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

export default function FinancialMercadoPagoList() {
  const { languageGB } = useLanguage();
  const text = languageGB.financial.mercadoPago.list;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FINANCEIRO_MERCADO_PAGO_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FinancialMercadoPagoFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const financialMercadoPagoList = useCustomGridQuery<
    FinancialMercadoPagoListItem,
    ListFinancialMercadoPagoParams
  >({
    asyncFunction: listFinancialMercadoPago,
    queryKey: queryKey.financial.mercadoPagoTransactions,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ListFinancialMercadoPagoParams),
  });

  const columnHelper = createColumnHelper<FinancialMercadoPagoListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('nome', {
        header: text.table.nome,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.nome}
          </Text>
        ),
        meta: { gridLabel: text.table.nome },
      }),
      columnHelper.accessor('contratante', {
        header: text.table.contratante,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.contratante}
          </Text>
        ),
        meta: { gridLabel: text.table.contratante },
      }),
      columnHelper.accessor('plano', {
        header: text.table.plano,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.plano}
          </Text>
        ),
        meta: { gridLabel: text.table.plano },
      }),
      columnHelper.accessor('cpf_cnpj', {
        header: text.table.cpfCnpj,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.cpf_cnpj}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.cpfCnpj },
      }),
      columnHelper.accessor('transaction_id', {
        header: text.table.transactionId,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" color="fg.muted">
            {row.original.transaction_id}
          </Text>
        ),
        meta: { gridLabel: text.table.transactionId },
      }),
      columnHelper.accessor('payment_method', {
        header: text.table.paymentMethod,
        // Rótulo SEMPRE traduzido — nunca o valor cru (pix/boleto/cartao),
        // contrato de tela §3.
        cell: ({ row }) => {
          const paymentMethodLabel: Record<FinancialMercadoPagoPaymentMethod, string> = {
            pix: text.table.paymentMethodOptions.pix,
            boleto: text.table.paymentMethodOptions.boleto,
            cartao: text.table.paymentMethodOptions.cartao,
          };
          return <Text fontSize="sm">{paymentMethodLabel[row.original.payment_method]}</Text>;
        },
        meta: { ...styleColumTable.sm, gridLabel: text.table.paymentMethod },
      }),
      columnHelper.accessor('value', {
        header: text.table.value,
        cell: ({ row }) => <Text fontWeight="medium">{formatCurrencyBRL(row.original.value)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.table.value },
      }),
      columnHelper.accessor('date', {
        header: text.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {new Date(row.original.date).toLocaleDateString('pt-BR')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.date },
      }),
      columnHelper.accessor('status', {
        header: text.table.status,
        // Rótulo traduzido, mesmo mapa do filtro (contrato de tela §3) — sem
        // tradução no payload da API.
        cell: ({ row }) => {
          const statusLabel: Record<FinancialMercadoPagoStatus, string> = {
            pending: languageGB.financial.mercadoPago.list.filter.statusOptions.pending,
            approved: languageGB.financial.mercadoPago.list.filter.statusOptions.approved,
            rejected: languageGB.financial.mercadoPago.list.filter.statusOptions.rejected,
            cancelled: languageGB.financial.mercadoPago.list.filter.statusOptions.cancelled,
          };
          return (
            <Badge
              colorPalette={STATUS_BADGE_VARIANT[row.original.status]}
              variant="subtle"
              py={1}
              px={3}
            >
              {statusLabel[row.original.status]}
            </Badge>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.table.status },
      }),
    ],
    [languageGB, text]
  );

  const gridSettings = useGridSettings<FinancialMercadoPagoListItem>({
    storageKey: FINANCEIRO_MERCADO_PAGO_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([financialMercadoPagoList]);
  const isError = financialMercadoPagoList.isError;
  const items = financialMercadoPagoList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.pageTitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={isError}
            error={financialMercadoPagoList.error}
            isEmpty={isEmpty}
            onRetry={() => financialMercadoPagoList.refetch()}
            isRetrying={financialMercadoPagoList.isFetching}
            retryLabel={text.error.retry}
            emptyIcon={FiCreditCard as ElementType}
            emptyTitle={text.emptyState.title}
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideMercadoPago
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />
    </ContainerGrid>
  );
}
