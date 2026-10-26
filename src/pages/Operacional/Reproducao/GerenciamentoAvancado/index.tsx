// src/pages/Operacional/Reproducao/GerenciamentoAvancado/index.tsx
// -----------------------------------------------------------------------------
// Tela de GESTÃO/LISTAGEM (100% LEITURA) "Gerenciamento Avançado"
// (AdvancedReproductive — Operacional / Reprodução, F-011, 97-Esteiras/056,
// TASK-AR-FE-02). Referência UX: roteiro-cirurgico-frontend-advanced-
// reproductive.md §1 — UX-GAP declarado (tela greenfield, sem desenho 1:1 no
// design system `cerne`); desenho derivado de fidelidade estrutural ao Blade
// legado (filtro → indicadores → grid) + componentes JÁ adaptados no
// `frontend_root` (`StatCard`, `Form`/`FilterSide`, `Table`/`TableProvider`,
// `Actions`, `EmptyState` — mirror `EstacaoDeMonta/index.tsx` +
// `Financeiro/ContasAPagar/index.tsx`).
//
// Sem rota/menu (TASK-AR-FE-03, fora do escopo desta Tarefa). Sem
// CreateOrUpdate/mutação — tela 100% leitura (roteiro §6.5). Sem botão "Novo
// Acasalamento" no header (FUP-AR-07 — sem flag de autorização no contrato de
// API e sem alvo na SPA).
//
// Filtro: 6 campos, ORDEM EXATA do contrato (§2/§5) — ver
// `FilterSideGerenciamentoAvancado.tsx`.
//
// 3 indicadores (`StatCard`): Animais / Taxa de Prenhez (formatada BR —
// vírgula, 2 casas — só na apresentação; a API já entrega número puro) /
// Nascimentos. Populados do MESMO payload da listagem
// (`data?.data?.indicators`) — NUNCA uma 2ª chamada de rede (roteiro §6.1).
//
// Grid: 6 colunas, ORDEM EXATA do contrato — Animal(identification) ·
// Categoria(category_description) · Tipo Acasalamento
// (breeding_mating_type_label) · Última Atualização(last_update_label) ·
// Status(reproductive_status_label) · Ações. Sem coluna de ordenação
// clicável (API não expõe `sort`, mirror `EstacaoDeMontaList`). Paginação 15
// (server-side — `pageSize` NÃO sobrescrito no cliente).
//
// Ações de linha (dropdown `Actions`/`Actions.Item`) — as 7 flags
// `actions.can_*` do payload controlam VISIBILIDADE; NUNCA recalcula a
// regra em JS (DEC-005) e NUNCA `usePermissions().can(...)` aqui — o
// servidor já combina permissão+condição em cada `can_*` (roteiro §6.6).
//
// EXCEÇÃO (F-225/Tarefa 48, ACT-FA225-02): "Ficha Animal"
// (`can_view_animal_record`) é entrada secundária do relatório
// `animal-record-report` (mesma rota da Tarefa 47), via `useMutation` +
// `downloadAnimalRecordReport` (reuso do service da Tarefa 47) → blob →
// `window.open` inline em nova aba. Leitura pura, sem invalidação de query
// desta grade (SEM-01).
//
// CORREÇÃO PONTUAL (EST-03, rejeição AF/AD lote 3, "Gerenciamento
// Avançado"): "Ver Acasalamento"/"Editar Acasalamento"/"Excluir" foram
// LIBERADAS — a tela de Acasalamento (F-016) já foi migrada nesta mesma
// branch e a rota real existe em `src/router/index.tsx`
// (`/operacional/acasalamento/:uuid`, `:uuid/editar`,
// `DELETE /breeding-matings/{uuid}`, já em uso por
// `Acasalamento/index.tsx`). "Diagnóstico da Gestação" também foi
// LIBERADA — a rota `/operacional/acasalamento/:uuid/diagnostico-gestacao`
// já existe migrada (mesma navegação usada pelo próprio
// `AcasalamentoActionsMenu`). "Próxima Etapa"
// (`can_advance_protocol_step`) e "Finalizar"
// (`can_finish_breeding_mating`) CONTINUAM desabilitadas com tooltip —
// fora do escopo desta correção (não fazem parte do apontamento
// rejeitado). O alvo de navegação é sempre `row.original.breeding_mating_uuid`
// (uuid real do Acasalamento por trás da linha, não `animal_uuid`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  FiActivity,
  FiArrowRightCircle,
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiFileText,
  FiHeart,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';
import { StatCard } from '@/components/cards/StatCard';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { downloadAnimalRecordReport } from '@/services/v2/Animals/animal-record-report-service';
import { deleteBreedingMating } from '@/services/v2/BreedingMating/breeding-mating-service';

import type {
  AdvancedReproductiveFilterForm,
  AdvancedReproductiveListItem,
} from '@/@types/v2/AdvancedReproductive';

import { FilterSideGerenciamentoAvancado } from './FilterSideGerenciamentoAvancado';
import { useGerenciamentoAvancadoList } from './useGerenciamentoAvancado';

import { PageHeader } from '@/components/ui/PageHeader';

const GERENCIAMENTO_AVANCADO_STORAGE_KEY =
  'OperacionalReproducaoGerenciamentoAvancado' +
  queryKey.advancedReproductive.advancedReproductiveList;

// Rota real de Acasalamento (F-016, já migrada nesta branch) — mirror do
// mesmo literal usado em `Acasalamento/index.tsx` (`ACASALAMENTO_LIST_ROUTE`).
// Esta tela NÃO possui rota própria de Acasalamento; só navega para ela.
const ACASALAMENTO_ROUTE = '/operacional/acasalamento';

// Apresentação — formatação BR (vírgula, 2 casas) do número puro que a API
// devolve em `indicators.pregnancy_rate` (roteiro §"Indicadores"/DTO
// `AdvancedReproductiveIndicators.pregnancy_rate`). NUNCA reformata/consome
// como string pré-formatada, NUNCA recalcula a taxa — só apresentação do
// valor que já chega pronto do servidor.
function formatPregnancyRate(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export default function GerenciamentoAvancadoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const text = languageGB.advancedReproductive.advancedReproductive.list;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 15,
      storageKey: GERENCIAMENTO_AVANCADO_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AdvancedReproductiveFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // ---- Estado de exclusão do Acasalamento por trás da linha — mirror
  //      `Acasalamento/index.tsx` (1 useDisclosure + 1 selectedItem,
  //      mutação real fora do `onClick` da linha). --------------------------
  const [toDelete, setToDelete] = useState<AdvancedReproductiveListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const gerenciamentoAvancadoList = useGerenciamentoAvancadoList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const isLoading = checkLoadingStatus([gerenciamentoAvancadoList]);
  const items = gerenciamentoAvancadoList.data?.data?.items;
  const indicators = gerenciamentoAvancadoList.data?.data?.indicators;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  // Entrada secundária AC-02 (Tarefa 48, ACT-FA225-02) — leitura pura, sem
  // invalidação de query desta grade (SEM-01). Reusa o service criado pela
  // Tarefa 47; NUNCA um 2º `api.V2.get` para o mesmo endpoint.
  const animalRecordReportMutation = useMutation({
    mutationFn: (animalUuid: string) => downloadAnimalRecordReport({ animal_uuid: animalUuid }),
    onSuccess: (blob) => {
      // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
      // downloadBlob (forçaria download, quebrando a fidelidade a AC-02).
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      toaster.success({
        title: text.actions.viewAnimalRecord,
        description: text.actions.viewAnimalRecordSuccessToast,
      });
    },
    onError: (error) => {
      toaster.error({
        title: text.actions.viewAnimalRecord,
        description: extractApiErrorMessage(error) || text.actions.viewAnimalRecordErrorToast,
      });
    },
  });

  // "Excluir" (EST-03, rejeição AF/AD lote 3) — MESMO endpoint real já usado
  // por `Acasalamento/index.tsx` (`DELETE /breeding-matings/{uuid}`), MESMO
  // `useMutation` direto (não `useRequest`, toast usa `message` do próprio
  // envelope). Invalida a listagem DESTA tela (`advancedReproductiveList`,
  // §6.1 — nunca uma 2ª chamada fora de invalidação de mutação).
  const deleteBreedingMatingMutation = useMutation({
    mutationFn: async (uuid: string) => deleteBreedingMating(uuid),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.advancedReproductive.advancedReproductiveList],
      });

      toaster.success({
        title: text.actions.deleteBreedingMating,
        description: response?.message ?? text.actions.deleteBreedingMating,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.actions.deleteBreedingMating,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeletingBreedingMating = deleteBreedingMatingMutation.isPending;

  function handleDeleteBreedingMatingClick(item: AdvancedReproductiveListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDeleteBreedingMating() {
    if (toDelete) deleteBreedingMatingMutation.mutate(toDelete.breeding_mating_uuid);
  }

  const columnHelper = createColumnHelper<AdvancedReproductiveListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('identification', {
        header: text.table.identification,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.identification}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('category_description', {
        header: text.table.category,
        cell: ({ row }) => <Text fontSize="sm">{row.original.category_description || '—'}</Text>,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('breeding_mating_type_label', {
        header: text.table.breedingMatingType,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.breeding_mating_type_label || '—'}</Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('last_update_label', {
        header: text.table.lastUpdate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.last_update_label || '—'}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('reproductive_status_label', {
        header: text.table.reproductiveStatus,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.reproductive_status_label || '—'}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const { actions } = row.original;
          const disabledReason = text.actions.disabledReason;

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {actions.can_view_animal_record && (
                  <Actions.Item
                    icon={<Icon as={FiFileText} />}
                    disabled={animalRecordReportMutation.isPending}
                    onClick={() => animalRecordReportMutation.mutate(row.original.animal_uuid)}
                  >
                    {text.actions.viewAnimalRecord}
                  </Actions.Item>
                )}
                {actions.can_view_breeding_mating && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() =>
                      navigate(`${ACASALAMENTO_ROUTE}/${row.original.breeding_mating_uuid}`)
                    }
                  >
                    {text.actions.viewBreedingMating}
                  </Actions.Item>
                )}
                {actions.can_edit_breeding_mating && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() =>
                      navigate(`${ACASALAMENTO_ROUTE}/${row.original.breeding_mating_uuid}/editar`)
                    }
                  >
                    {text.actions.editBreedingMating}
                  </Actions.Item>
                )}
                {actions.can_advance_protocol_step && (
                  <Actions.Item
                    icon={<Icon as={FiArrowRightCircle} />}
                    disabled
                    disabledReason={disabledReason}
                  >
                    {text.actions.advanceProtocolStep}
                  </Actions.Item>
                )}
                {actions.can_finish_breeding_mating && (
                  <Actions.Item
                    icon={<Icon as={FiCheckCircle} />}
                    disabled
                    disabledReason={disabledReason}
                  >
                    {text.actions.finishBreedingMating}
                  </Actions.Item>
                )}
                {actions.can_view_pregnancy_diagnosis && (
                  <Actions.Item
                    icon={<Icon as={FiActivity} />}
                    onClick={() =>
                      navigate(
                        `${ACASALAMENTO_ROUTE}/${row.original.breeding_mating_uuid}/diagnostico-gestacao`
                      )
                    }
                  >
                    {text.actions.viewPregnancyDiagnosis}
                  </Actions.Item>
                )}
                {actions.can_delete_breeding_mating && (
                  <>
                    <Actions.Separator />
                    <Actions.Item
                      icon={<Icon as={FiTrash2} />}
                      tone="danger"
                      disabled={isDeletingBreedingMating}
                      onClick={() => handleDeleteBreedingMatingClick(row.original)}
                    >
                      {text.actions.deleteBreedingMating}
                    </Actions.Item>
                  </>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: text.table.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [
      text,
      navigate,
      animalRecordReportMutation.isPending,
      animalRecordReportMutation.mutate,
      isDeletingBreedingMating,
    ]
  );

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
          header={<ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
        >
          <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
        </HeaderGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={6}>
          <Skeleton loading={isLoading}>
            <StatCard
              title={text.indicators.animalsCount}
              value={indicators?.animals_count ?? 0}
              icon={<Icon as={FiUsers} boxSize={5} />}
            />
          </Skeleton>
          <Skeleton loading={isLoading}>
            <StatCard
              title={text.indicators.pregnancyRate}
              value={formatPregnancyRate(indicators?.pregnancy_rate)}
              icon={<Icon as={FiTrendingUp} boxSize={5} />}
            />
          </Skeleton>
          <Skeleton loading={isLoading}>
            <StatCard
              title={text.indicators.birthAnimalsCount}
              value={indicators?.birth_animals_count ?? 0}
              icon={<Icon as={FiHeart} boxSize={5} />}
            />
          </Skeleton>
        </SimpleGrid>

        <Box mt={6}>
          {isEmpty && !gerenciamentoAvancadoList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiHeart} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>
                    {filtersApplied > 0
                      ? text.emptyState.titleFiltered
                      : text.emptyState.titleEmpty}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {filtersApplied > 0
                      ? text.emptyState.descriptionFiltered
                      : text.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
                {/* Tela 100% leitura — SEM CTA de criação; só "Limpar
                    filtros" quando o vazio é resultado de filtro aplicado
                    (roteiro §1). */}
                {filtersApplied > 0 && (
                  <Button
                    title={text.emptyState.clearFiltersCta}
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilter}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={gerenciamentoAvancadoList.isError}
              error={gerenciamentoAvancadoList.error}
              onRetry={() => gerenciamentoAvancadoList.refetch()}
              isRetrying={gerenciamentoAvancadoList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideGerenciamentoAvancado
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* "Excluir" — mesmo padrão destrutivo vigente de
          `Acasalamento/index.tsx` (só `title`+`itemName`+`tone`, descrição/
          aviso ficam no default do componente). */}
      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDeleteBreedingMating}
        isLoading={isDeletingBreedingMating}
        title={text.actions.deleteDialog.title}
        itemName={toDelete?.identification}
        tone="danger"
      />
    </ContainerGrid>
  );
}
