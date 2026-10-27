// src/pages/CadastrosBase/Pessoas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT) de PESSOAS UNIFICADO (Person) — Cadastros Base.
// Rota: /cadastros-base/pessoas (guardada por `people_view`, wiring real em
// TASK-FE-306). Item de menu `cad-pes-uni` JÁ EXISTE
// (navigationTree.ts:136/navigationPermissions.ts:62).
//
// Referência UX: GB.Cerne.UX/src/pages/cadastros/pessoas/PessoasLista.tsx
// (commit f450732) — design dedicado, adaptado ao catálogo real do
// `GB.Cerne.FrontEnd` (ContainerGrid/HeaderGrid/Table/TableProvider, não os
// PageContainer/PageCard/PageHeader do protótipo).
//
// 4 divergências protótipo × contrato REAL (sigo sempre o contrato):
//   1. Barra de KPIs (Total/PF/PJ/Com Acesso) do protótipo é calculada
//      client-side sobre o dataset COMPLETO — com paginação real server-side
//      só temos `meta.total`. NÃO replicada nesta entrega (métrica enganosa
//      com paginação real); usa-se só o contador padrão do HeaderGrid.
//   2. Busca real NÃO inclui e-mail — `PersonRepository::
//      listWithAnyRoleInTenant()` só compara `name`/`nickname`/`nif`
//      normalizado. Placeholder fiel: "Buscar por nome, apelido ou CPF/CNPJ".
//   3. Exclusão é SEMPRE soft-delete incondicional (`DeletePersonAction` só
//      chama `$person->delete()`, sem checagem de vínculo) — 204 sempre.
//      `DeleteConfirmDialog` usa mensagem de aviso GENÉRICA, nunca uma
//      mensagem de erro de vínculo.
//   4. ⚠️ ACHADO DESTA RODADA (não estava documentado nas 3 divergências
//      originais da Tarefa) — a coluna "Papéis" planejada NÃO é implementável
//      com dado real: `PersonController::index` serializa via `PersonResource`
//      (§11 do contrato), que expõe SÓ identidade civil (uuid/name/nickname/
//      nif/email/phone/address/number/district/zip_code/city) — SEM nenhum
//      campo de papel/`is_enabled`. Só `PersonDetailResource` (GET
//      /people/{uuid}, show) carrega os papéis, via eager-load caro demais
//      para replicar por linha numa grid paginada. Reproduzir a coluna exigiria
//      um campo novo e leve no `PersonResource` (ex.: `active_roles:
//      RoleKey[]`, mesmo padrão barato já usado em `type_label` de
//      PaymentTerm) — fora do escopo deste agente (fronteira: não escreve
//      backend). Decisão desta entrega: OMITIR a coluna "Papéis" (Regra 9 —
//      não fabricar dado ausente) e sinalizar como achado para o dev
//      roteirar um TASK-BE cirúrgico companheiro antes do Gate de Feature,
//      caso a coluna seja considerada essencial.
//
// Paginação: default 10, seletor 5/10/25/50/100 via `Pagination`/`Table`
// padrão do projeto (componente já embutido em `Table`/`TableProvider`,
// mesmo precedente de TiposTitulo/CondicoesPagamento) — `per_page` real
// (TASK-BE-330 CONCLUÍDO, backend não força mais 15 fixo).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiTrash2, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePersonList } from '@/hooks/usePeople';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deletePerson } from '@/services/v2/People/person-service';

import type { PersonFilterForm, PersonListItem } from '@/@types/v2/People';

import { FilterSidePessoas } from './FilterSidePessoas';
import { HeaderTable } from './HeaderTable';
import { maskNif } from './nif';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function PessoasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.people.person;

  const canCreate = can('people_create');
  const canEdit = can('people_edit');
  const canDelete = can('people_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBasePessoas' + queryKey.people.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PersonFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<PersonListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const personList = usePersonList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ personUuid }: { personUuid: string }) => {
      return await deletePerson(personUuid);
    },
    queryKey: queryKey.people.list,
    queryKey2: queryKey.people.detail,
    // Exclusão é SEMPRE soft-delete incondicional (contrato §12 Decisão de
    // Negócio 1) — `useRequest` não tem variante "delete", "update" é a
    // mesma convenção usada por PaymentTerm/TypeTitle para a mesma operação.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (person: PersonListItem) => {
    setToDelete(person);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ personUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<PersonListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Box minW={0}>
            <Text fontWeight="medium" lineClamp="1">
              {row.original.name}
            </Text>
            {row.original.city && (
              <Text fontSize="xs" color="fg.muted" lineClamp="1">
                {row.original.city.name}
                {row.original.city.state ? ` — ${row.original.city.state.uf}` : ''}
              </Text>
            )}
          </Box>
        ),
      }),
      columnHelper.accessor('nif', {
        header: text.list.table.document,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {maskNif(row.original.nif)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('email', {
        header: text.list.table.email,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.email || '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // Coluna "Papéis" OMITIDA — `PersonResource` (listagem) não expõe
      // dados de papel/`is_enabled`, só identidade civil (ver achado #4 no
      // cabeçalho do arquivo). Não fabricar dado ausente (Regra 9).
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/pessoas/${row.original.uuid}`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/pessoas/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([personList]);
  const items = personList.data?.data?.items;
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
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={personList.isError}
            error={personList.error}
            isEmpty={isEmpty}
            onRetry={() => personList.refetch()}
            isRetrying={personList.isFetching}
            emptyIcon={FiUsers}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/pessoas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSidePessoas
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.name}
        warningText={text.list.deleteDialog.warning}
      />
    </ContainerGrid>
  );
}
