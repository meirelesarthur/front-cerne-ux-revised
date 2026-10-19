// src/pages/Financeiro/OfxImport/Report/index.tsx
// -----------------------------------------------------------------------------
// Tela "Meses Conciliados" (RECONSTRUÍDA, TASK-065-OFX-FE-03,
// 97-Esteiras/065). Rota: `/financeiro/meses-conciliados` (guardada
// `import_ofx`, item de menu `fin-cnc-mes` já existente em
// `navigationTree.ts:2146` — não conflitado pelo merge, path mantido).
//
// ACHADO (não é a tela DELES mantida — reconstrução): a tela `Conciliacao/
// MesesConciliados/` DELES consumia `GET /ofx-report` (form de
// filtro conta+período + download PDF) — endpoint REMOVIDO pelo backend
// reconciliado (`routes/api.php`, comentário explícito). O único endpoint
// sobrevivente é `GET /ofx-imports/report` (`OfxImportReportController`),
// JSON agregado, SEM parâmetro nenhum (`OfxReportRequest::rules()` vazio —
// agrega TODO o tenant do farm.context atual) e SEM paginação. Por isso
// esta tela é DELIBERADAMENTE mais simples que a original: SEM form de
// filtro, SEM export PDF/Excel — só uma tabela read-only (mês/ano →
// quantidade de movimentos conciliados). Ver `97-Esteiras/065/ROTEIROS/
// arquitetura-reconciliacao-ofx-frontend.md §3`.
//
// AD_REJECTED (lote-2, item 1, UT-000322) — "Tabela está muito diferente do
// componente padrão de DataTable": a primeira versão usava `Table.Root`
// Chakra puro direto na tela. Correção (execução 018): casca real de
// LISTAGEM do `cerne` — `ContainerGrid` + `HeaderGrid` + `TableProvider`/
// `Table` (mirror `CadastrosBase/Estados/index.tsx`, grid FLAT mais próxima
// deste caso — 2 colunas, sem filtro). SEM `pagination`/`setPagination`
// passados ao `TableProvider`: o endpoint não pagina (`meta: null`, ACHADO
// acima) — `Table` já suporta esse caso (rodapé sem controles de página,
// mesmo comportamento de outras grids do projeto sem paginação real).
// -----------------------------------------------------------------------------

import { ElementType, useMemo } from 'react';

import { Box, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { getOfxImportsReport } from '@/services/v2/Financeiro/OfxImports/ofx-import-service';

import type { OfxImportReportItem } from '@/@types/v2/Financeiro/ofxImport/report';

export default function OfxImportsReport() {
  const { languageGB } = useLanguage();
  const text = languageGB.ofxImports.ofxImport.report;

  // GET puro, SEM parâmetro, SEM polling — mirror `getOfxReconciliationPreview`
  // (`OfxReconciliationTab.tsx`). `refetchOnWindowFocus: false` (agregado
  // mensal não muda a cada foco de janela, mirror do mesmo precedente).
  const reportQuery = useQuery({
    queryKey: [queryKey.financial.ofxImportsReport],
    queryFn: getOfxImportsReport,
    select: (response) => response.data,
    refetchOnWindowFocus: false,
  });

  const items = reportQuery.data ?? [];
  // TanStack Query v5: `isPending` = carga inicial sem dados ainda em cache
  // (mirror `get_pwa_grid_query_pattern`, seção "isPending vs isLoading").
  const isLoading = reportQuery.isPending;
  const isEmpty = !isLoading && !reportQuery.isError && items.length === 0;

  const columnHelper = createColumnHelper<OfxImportReportItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('month_year', {
        header: text.table.monthYear,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.month_year}
          </Text>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: text.table.quantity,
        cell: ({ row }) => <Text textAlign="end">{row.original.quantity}</Text>,
      }),
    ],
    [text]
  );

  return (
    <ContainerGrid>
      <TableProvider data={items} columns={defaultColumns} enableMultiRowSelection={false}>
        <HeaderGrid>
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={reportQuery.isError}
            error={reportQuery.error}
            isEmpty={isEmpty}
            onRetry={() => reportQuery.refetch()}
            isRetrying={reportQuery.isFetching}
            retryLabel={text.retry}
            emptyIcon={FiCalendar as ElementType}
            emptyTitle={text.emptyState.title}
            emptyDescription={text.emptyState.description}
            canCreate={false}
          />
        </Box>
      </TableProvider>
    </ContainerGrid>
  );
}
