// src/pages/Operacional/Planejamentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Planejamentos (Planning, raiz da árvore de
// Planejamento de Cultura/Variedade) — TASK-FE-PLAN-01 (execução
// `97-Esteiras/007`). Domínio PRÓPRIO `Operacional/Planejamentos`, Modelo A
// (CRUD simples, `get_pwa_screen_and_router_pattern`) — SEM painel de filtro
// (`FM-01`: o legado não tem nenhum filtro de busca nesta tela, só paginação
// padrão de 10/página e legenda estática de cores de status).
//
// Ação "Editar" navega para `/operacional/planejamentos/{uuid}` — rota ÚNICA
// de edição (form raiz + árvore embutida, Decisão de arquitetura FID-G3F),
// registrada por `TASK-FE-PLAN-02` (onda 1, PARALELA a esta Tarefa — a
// tela-destino pode ainda não existir no momento desta entrega).
//
// Coluna "responsável" (LM-04): `employee?.name ?? user?.name` — fallback
// fiel ao legado (funcionário tem prioridade sobre quem criou o registro).
// Implementado contra o CONTRATO ALVO (`GAP-PLAN-FE-01`, `[AVALIADO]`,
// `TASK-PLAN-01` `## Adendo v4`) — hoje `employee` só devolve `uuid` sem
// `name`; enquanto o Adendo v4 não estiver testável, o payload real cai
// sempre no fallback `user.name`. NUNCA renderiza `uuid` cru.
//
// Exclusão via `ModalAction` (Pattern 6, `get_pwa_complex_screen_
// compositions_pattern`) — NUNCA exclui direto no `onClick` da linha. A
// mensagem de erro de FK específica ("cultivos vinculados") é o CONTRATO
// ALVO do Adendo v4 (`GAP-PLAN-FE-02`, `[AVALIADO]`) — hoje a API real
// sempre devolve `204` mesmo com cultivo vinculado; o `useRequest.onError`
// genérico já lê `err.response.data.message` sem tratamento dedicado (mirror
// `Invoices/index.tsx`/`ServiceOrders/index.tsx` — não é erro por campo, é
// regra de negócio única), então nenhum código novo é necessário aqui: a
// mensagem específica aparecerá automaticamente assim que o Adendo v4 estiver
// testável.
//
// "Imprimir"/"Duplicar": só os itens do dropdown + guarda de permissão
// (`plannings_view`/`plannings_create`, mirror `PlanningController::
// middleware()`). Wiring real ativado por `TASK-FE-PLAN-08` (fecha o ciclo):
//   - "Duplicar" — `POST .../duplicate` via `useRequest` (`typesRequest:
//     'create'`, invalida a listagem), `actionSuccess` navega direto para a
//     edição do clone (`data.uuid`) — mirror `Fabrica/index.tsx::
//     duplicateMutation`, exceto pela navegação (aqui o clone tem árvore
//     própria a revisar, diferente de Food que só dá refresh in-place).
//   - "Imprimir" — leitura binária síncrona (`responseType: 'blob'`, SEM
//     TanStack mutation — não há estado de servidor a invalidar), loading
//     local por `uuid` (spinner/disable só na linha clicada, nunca global).
//     Abre o PDF numa NOVA ABA (`URL.createObjectURL`+`window.open`, revoga
//     10s depois) — NUNCA força download direto pro disco; correção EST-03/
//     item 7 (rejeição de Design), mirror `Pedidos/index.tsx::handlePrint` /
//     `Requisition/index.tsx::handleOpenBlobInNewTab`. Erro (403/404) cai num
//     catch genérico com toast — NUNCA lê `err.response.data` como JSON (é
//     `Blob`, armadilha 1 do Roteiro).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCopy, FiEdit, FiFileText, FiPrinter, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { ModalAction } from '@/components/ModalAction';
import { Table } from '@/components/Table';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deletePlanning,
  downloadPlanningReport,
  duplicatePlanning,
  getPlannings,
} from '@/services/v2/Operacional/Planejamentos/planning-service';

import type { PlanningListItem } from '@/@types/v2/Operacional/planning';

import { HeaderTable } from './HeaderTable';
import { getPlanningStatusBadgeColor } from './planningStatus';

const PLANNINGS_STORAGE_KEY = 'OperacionalPlanejamentos' + queryKey.plannings.plannings;
const PLANNINGS_ROUTE = '/operacional/planejamentos';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PlanejamentosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.plannings.planning;

  const canCreate = can('plannings_create');
  const canEdit = can('plannings_edit');
  const canDelete = can('plannings_delete');
  // `report` (Imprimir) exige `plannings_view` no backend
  // (`PlanningController::middleware()`, `only: ['index','show','report']`)
  // — mesma permissão que já gate ia a própria rota da listagem.
  const canPrint = can('plannings_view');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: PLANNINGS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const [toDelete, setToDelete] = useState<PlanningListItem | null>(null);
  const {
    open: isOpenDeleteModal,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useDisclosure();

  const planningsList = useCustomGridQuery<PlanningListItem, any>({
    asyncFunction: getPlannings,
    queryKey: queryKey.plannings.plannings,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  // `typesRequest: 'update'` (não existe variante 'delete' em `TypesRequest`,
  // `useRequest.tsx`) — mirror EXATO `Invoices/index.tsx`/`ServiceOrders/
  // index.tsx`. O toast de sucesso é sobrescrito por `personalizedMessage`; o
  // de erro já lê `resData.message` (`useRequest.onError` genérico) — sem
  // tratamento dedicado, é regra de negócio única (FK de cultivos
  // vinculados), não erro por campo.
  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanning(uuid),
    queryKey: queryKey.plannings.plannings,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteModal();
      setToDelete(null);
    },
  });

  function handleDeleteClick(planning: PlanningListItem) {
    setToDelete(planning);
    onOpenDeleteModal();
  }

  // ---- Duplicar (SUR-07) ------------------------------------------------
  // `typesRequest: 'create'` (cria um novo Planning) — invalida a listagem
  // (`queryKey.plannings.plannings`) para o clone aparecer na próxima
  // paginação, e navega DIRETO para a edição do clone (`data.uuid`, mirror
  // do Roteiro — diferente de `Fabrica/index.tsx`, que só dá refresh
  // in-place, porque aqui o clone tem uma árvore própria digna de revisão
  // imediata).
  const duplicateMutation = useRequest<PlanningListItem>({
    asyncFunction: async ({ uuid }: { uuid: string }) => duplicatePlanning(uuid),
    queryKey: queryKey.plannings.plannings,
    typesRequest: 'create',
    entityName: text.singularLabel,
    personalizedMessage: text.list.duplicatedToast,
    actionSuccess: (data) => {
      navigate(`${PLANNINGS_ROUTE}/${data.uuid}`);
    },
  });

  function handleDuplicateClick(planning: PlanningListItem) {
    duplicateMutation.mutate({ uuid: planning.uuid });
  }

  // ---- Imprimir PDF (SUR-08 — correção EST-03/item 7, rejeição de Design) ---
  // Leitura pura via blob — SEM TanStack mutation (nenhum estado de servidor
  // a invalidar). "Imprimir" abre o PDF numa NOVA ABA via `URL.createObjectURL`
  // + `window.open` (revoga a Object URL 10s depois, já carregada) — NUNCA
  // força download direto pro disco (`downloadBlob`), mirror EXATO do padrão
  // consolidado de "Imprimir" em listagens com relatório PDF assíncrono
  // (`Pedidos/index.tsx::handlePrint`, `Requisition/index.tsx::
  // handleOpenBlobInNewTab`) — o usuário decide se imprime ou salva pelo
  // próprio visualizador de PDF do navegador; não há botão de export/download
  // separado nesta tela (rejeição de Design não pediu um). Estado local por
  // `uuid` (spinner/disable só na linha clicada, nunca global). Erro
  // (403/404) → toast genérico; a resposta é `Blob` — NUNCA tentar ler
  // `err.response.data` como JSON (armadilha 1 do Roteiro).
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);

  async function handlePrintReport(planning: PlanningListItem) {
    setDownloadingReportUuid(planning.uuid);
    try {
      const blob = await downloadPlanningReport(planning.uuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.reportErrorToast });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  const columnHelper = createColumnHelper<PlanningListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status_label', {
        header: languageGB.defaltStrings.statusColumn,
        enableHiding: false,
        cell: ({ row }) => (
          <StatusTag
            label={row.original.status_label}
            color={getPlanningStatusBadgeColor(row.original.status)}
          />
        ),
        meta: { ...styleColumTable.md, gridLabel: languageGB.defaltStrings.statusColumn },
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor((row) => row.harvest?.description ?? '', {
        id: 'harvest',
        header: text.list.table.harvest,
        cell: ({ row }) => <Text fontSize="sm">{row.original.harvest?.description ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.harvest },
      }),
      // LM-04 — fallback `employee?.name ?? user?.name`, NUNCA `uuid` cru
      // (contrato ALVO, GAP-PLAN-FE-01/Adendo v4 — ver docblock do arquivo).
      columnHelper.accessor((row) => row.employee?.name ?? row.user?.name ?? '', {
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => {
          const responsibleName = row.original.employee?.name ?? row.original.user?.name;
          return <Text fontSize="sm">{responsibleName || '—'}</Text>;
        },
        meta: { gridLabel: text.list.table.responsible },
      }),
      columnHelper.accessor('planning_total', {
        header: text.list.table.planningTotal,
        cell: ({ row }) => <Text fontSize="sm">{formatCurrency(row.original.planning_total)}</Text>,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.planningTotal },
      }),
      columnHelper.accessor('planning_area', {
        header: text.list.table.planningArea,
        cell: ({ row }) => <Text fontSize="sm">{formatCurrency(row.original.planning_area)}</Text>,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.planningArea },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`${PLANNINGS_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canCreate && (
                <Actions.Item
                  icon={<Icon as={FiCopy} />}
                  onClick={() => handleDuplicateClick(row.original)}
                  disabled={duplicateMutation.isPending}
                >
                  {text.list.actions.duplicate}
                </Actions.Item>
              )}
              {canPrint && (
                <Actions.Item
                  icon={<Icon as={FiPrinter} />}
                  onClick={() => handlePrintReport(row.original)}
                  disabled={downloadingReportUuid === row.original.uuid}
                >
                  {text.list.actions.print}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={deleteMutation.isPending}
                  >
                    {text.list.actions.delete}
                  </Actions.Item>
                </>
              )}
            </Actions>
          </Flex>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [
      navigate,
      canEdit,
      canCreate,
      canPrint,
      canDelete,
      deleteMutation.isPending,
      duplicateMutation.isPending,
      downloadingReportUuid,
      text,
      languageGB,
    ]
  );

  const isLoading = checkLoadingStatus([planningsList]);
  const items = planningsList.data?.data?.items;
  const isEmpty = !isLoading && !planningsList.isError && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid
          header={
            <HeaderTable
              languageGB={languageGB}
              canCreate={canCreate}
              onCreate={() => navigate(`${PLANNINGS_ROUTE}/novo`)}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={planningsList.isError}
            error={planningsList.error}
            isEmpty={isEmpty}
            onRetry={() => planningsList.refetch()}
            isRetrying={planningsList.isFetching}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={text.list.emptyState.title}
            emptyDescription={text.list.emptyState.description}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${PLANNINGS_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <ModalAction
        isOpen={isOpenDeleteModal}
        onClose={onCloseDeleteModal}
        asyncFunction={() => toDelete && deleteMutation.mutate(toDelete.uuid)}
        clearData={() => setToDelete(null)}
        languageGB={languageGB}
        header={
          toDelete
            ? `${text.list.deleteConfirm.header} — ${toDelete.code}`
            : text.list.deleteConfirm.header
        }
        body={text.list.deleteConfirm.body}
      />
    </ContainerGrid>
  );
}
