// src/pages/Frota/Revisoes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, SEM
// filtro, SEM ações) de REVISÕES AGENDADAS (ScheduledReview) — Gestão de
// Frota.
// Rota: `/frota/revisoes` (guardada por `scheduled-reviews_view`, registrada
// na Tarefa 51 — este arquivo não mexe em rota/menu; o menu `fro-rev` já
// existe e já está gateado, contrato §FE-02).
//
// Fidelidade ao legado (TASK-REVAG-FE-01, contrato-tela-revisoes-agendadas-
// frontend.md): grade legada com EXATAMENTE 3 colunas (Máq./Equipamento |
// Km/Horímetro | Data Revisão), SEM ação de linha, SEM filtro, SEM busca,
// SEM ordenação clicável. Clone estrutural de CadastrosBase/Estados/index.tsx
// (mirror técnico quanto à paginação real 10/página e à ausência de
// HeaderTable/FilterSide/coluna de ações — nenhum desses existe no legado
// nem na API nova, `filter_manifest` vazio, TGT-07):
//   - grid via useScheduledReviewsList (paginação REAL — `ApiResponse::
//     paginated` com meta real);
//   - SEM HeaderTable (nenhum botão de ação à direita do título — não há
//     permissão de escrita, único gate do módulo é `scheduled-reviews_view`);
//   - SEM FilterSide (legado não tinha filtro, `filter_manifest` vazio);
//   - SEM coluna de Ações (zero rota de escrita no legado nem na API nova);
//   - SEM clique-para-detalhe (não existe tela de detalhe de Revisão).
//
// Paginação: `TableProvider`/`Table` (componente compartilhado) já renderizam
// `Pagination`+`SelectPagination` sempre que `pagination` é passado —
// nenhuma mudança de JSX necessária aqui.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, EmptyState, Icon, Text, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { CalendarClock } from 'lucide-react';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type { ScheduledReviewListItem } from '@/@types/v2/ScheduledReviews';

import { useScheduledReviewsList } from './useRevisoes';

export default function RevisoesList() {
  const { languageGB } = useLanguage();
  const text = languageGB.scheduledReviews.scheduledReview;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'FrotaRevisoes' + queryKey.scheduledReviews.scheduledReviews,
    }),
    []
  );

  // pageSize 10 = paginação REAL — per_page enviado ao back conforme o
  // pageSize escolhido no grid. SEM filtro — endpoint não aceita nenhum
  // (TGT-07, contrato §FE-05).
  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const scheduledReviewsList = useScheduledReviewsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const columnHelper = createColumnHelper<ScheduledReviewListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('equipment_description', {
        header: text.list.table.equipment,
        cell: ({ row }) => <Text lineClamp="1">{row.original.equipment_description ?? '—'}</Text>,
      }),
      columnHelper.accessor('hour_meter_km', {
        header: text.list.table.hourMeterKm,
        cell: ({ row }) => <Text fontSize="sm">{row.original.hour_meter_km.toFixed(1)}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.date ? formatDate(row.original.date) : '—'}</Text>
        ),
        meta: styleColumTable.date,
      }),
    ],
    [text]
  );

  const isLoading = checkLoadingStatus([scheduledReviewsList]);
  const items = scheduledReviewsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid>
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {isEmpty ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={CalendarClock} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.titleEmpty}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table isLoading={isLoading} />
          )}
        </Box>
      </TableProvider>
    </ContainerGrid>
  );
}
