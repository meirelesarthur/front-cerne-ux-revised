// src/pages/CadastrosBase/Estados/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL — padrão
// do projeto 10/página, per_page enviado dinamicamente ao back conforme
// pageSize do grid —, SEM filtro, SEM ações) de ESTADOS (State) — Cadastros
// Base / Geografia.
// Rota: /cadastros-base/estados (guardada por `states_view`, registrada em
// TASK-FE-024 — este arquivo não mexe em rota/menu).
//
// Fidelidade ao legado (TASK-FE-022, âncora `../agro365/resources/views/
// states/index.blade.php`): grade legada com EXATAMENTE 2 colunas
// (Nome | Sigla), SEM ação de linha, SEM filtro. Estrutura aqui é esse mesmo
// grid, estilizado no `cerne`/componentizado no padrão real do projeto
// (mirror técnico de CadastrosBase/Cidades/index.tsx quanto à paginação —
// AJUSTE-FE-ESTADOS-001 —, MENOS filtro/ações/delete/navegação — nenhum
// desses existe no legado nem na API nova, que só expõe `only(['index','show'])`):
//   - grid via useStatesList (paginação REAL — o back passou a devolver
//     `ApiResponse::paginated` com meta real, em paralelo a esta Tarefa;
//     mesmo racional de useCitiesList/Cidades);
//   - SEM HeaderTable (nenhum botão de ação à direita do título — não há
//     permissão `states_create`, único gate do módulo é `states_view`);
//   - SEM FilterSide (legado não tinha filtro, não solicitado no escopo desta
//     feature — State não tem pai/cascata, diferente de City→State);
//   - SEM coluna de Ações (zero rota de escrita no legado nem na API nova);
//   - SEM clique-para-detalhe (não existe tela de detalhe/edição de Estado).
//
// Paginação: `TableProvider`/`Table` (componente compartilhado) já renderizam
// `Pagination`+`SelectPagination` (5/10/25/50/100) sempre que `pagination` é
// passado — nenhuma mudança de JSX necessária aqui, o comportamento muda
// puramente pela paginação real vinda de `listStates` (state-service.ts).
// -----------------------------------------------------------------------------

import { ElementType, useMemo } from 'react';

import { Badge, Box, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiMapPin } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type { StateListItem } from '@/@types/v2/States';

import { useStatesList } from './useStates';

import { PageHeader } from '@/components/ui/PageHeader';

export default function EstadosList() {
  const { languageGB } = useLanguage();
  const text = languageGB.states.state;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseEstados' + queryKey.states.list,
    }),
    []
  );

  // pageSize 10 = paginação REAL (AJUSTE-FE-ESTADOS-001) — per_page dinâmico,
  // enviado ao back conforme o pageSize escolhido no grid (5/10/25/50/100).
  // SEM filtro — não solicitado no escopo desta feature/Tarefa (State não tem
  // pai/cascata, mantido por consistência de padrão da família Grid).
  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const statesList = useStatesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const columnHelper = createColumnHelper<StateListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: text.list.table.title,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.title}
          </Text>
        ),
      }),
      columnHelper.accessor('letter', {
        header: text.list.table.letter,
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
            {row.original.letter}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [text]
  );

  const isLoading = checkLoadingStatus([statesList]);
  const items = statesList.data?.data?.items;
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={statesList.isError}
            error={statesList.error}
            isEmpty={isEmpty}
            onRetry={() => statesList.refetch()}
            isRetrying={statesList.isFetching}
            emptyIcon={FiMapPin as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={false}
          />
        </Box>
      </TableProvider>
    </ContainerGrid>
  );
}
