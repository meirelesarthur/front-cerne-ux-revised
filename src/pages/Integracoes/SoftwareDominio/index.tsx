// src/pages/Integracoes/SoftwareDominio/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT) de Software Domínio (IntegrationDominio) —
// Integrações, F-121, 97-Esteiras/072, TASK-F121-FE-03. Rota
// `/integracoes/dominio` (guardada por `integration_dominios_view`,
// registrada em `src/router/index.tsx` — este arquivo não mexe em rota/menu,
// o item de menu `int-dom-soft` já existe).
//
// Molde: `src/pages/Integracoes/Compartilhamento/index.tsx` (grid flat V3
// real do projeto — `useCustomGridQuery` inline via `useIntegrationDominioList`,
// paginação REAL server-side 10/página). 4 colunas fiéis ao Resource da API
// (Emissor/Contador/Ativo/Ações) — as colunas UX "Conexão"/"Última
// sincronização" e a ação "Sincronizar agora" NÃO entram (sem lastro na API,
// contrato de tela §8-A). Exclusão via `useRequest` (`typesRequest:'apply'`)
// + `DeleteConfirmDialog`, `onError` GENÉRICO (o backend já devolve a
// `message` real do 422 do FK-guard).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertTriangle, FiEdit, FiEye, FiGlobe, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { integrationDominioEnabledOptions } from '@/constants/integracoes/integrationDominio/options';
import { queryKey } from '@/constants/query-key';

import { deleteIntegrationDominio } from '@/services/v2/Integrations/integration-dominio-service';

import type { IntegrationDominioListItem } from '@/@types/v2/Integrations/integrationDominio';

import { HeaderTable } from './HeaderTable';
import { useIntegrationDominioList } from './useIntegrationDominios';

import { PageHeader } from '@/components/ui/PageHeader';

export default function SoftwareDominioList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.integrationDominios;

  const canEdit = can('integration_dominios_edit');
  const canView = can('integration_dominios_view');
  const canDelete = can('integration_dominios_delete');
  const canCreate = can('integration_dominios_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: text.pluralLabel + queryKey.integrationDominios.list,
    }),
    [text.pluralLabel]
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const integrationDominiosList = useIntegrationDominioList(paginatedQuery, handlePaginatedQuery);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<IntegrationDominioListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      return await deleteIntegrationDominio(uuid);
    },
    queryKey: queryKey.integrationDominios.list,
    queryKey2: queryKey.integrationDominios.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" no V3 — "apply" é
    // o substituto canônico de `useDeleted`. `onError` NÃO customizado — o
    // backend já devolve a `message` real do 422 estruturado (FK-guard).
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deleteDialog.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (item: IntegrationDominioListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ uuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<IntegrationDominioListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.issue.razao_social, {
        id: 'issue',
        header: text.list.table.issuer,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.issue.razao_social}
          </Text>
        ),
        meta: { gridLabel: text.list.table.issuer },
      }),
      columnHelper.accessor((row) => row.contador.razao_social, {
        id: 'contador',
        header: text.list.table.accountant,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.contador.razao_social}
          </Text>
        ),
        meta: { gridLabel: text.list.table.accountant },
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.enabled,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.is_enabled ? 'green' : 'gray'} variant="subtle">
            {integrationDominioEnabledOptions.getLabel(row.original.is_enabled, languageGB)}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.enabled },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/integracoes/dominio/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/integracoes/dominio/${row.original.uuid}/editar`)}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB, text, canEdit, canView, canDelete]
  );

  const isLoading = checkLoadingStatus([integrationDominiosList]);
  const items = integrationDominiosList.data?.data?.items;
  // `isEmpty` só é verdadeiro em SUCESSO com lista vazia — falha de query
  // (403/500/rede) NUNCA cai aqui (4 estados obrigatórios: loading/empty/
  // error/success, sem mascarar erro real como "vazio").
  const isEmpty = !isLoading && !integrationDominiosList.isError && (items?.length ?? 0) === 0;
  const isErrorState = !isLoading && integrationDominiosList.isError;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid header={<HeaderTable />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          {isErrorState ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.error.message}</EmptyState.Title>
                </VStack>
                <Button
                  title={text.list.error.retry}
                  onClick={() => integrationDominiosList.refetch()}
                />
              </EmptyState.Content>
            </EmptyState.Root>
          ) : isEmpty ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiGlobe} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.emptyState.description}
                  </EmptyState.Description>
                </VStack>
                {canCreate && (
                  <Button
                    title={text.list.emptyState.cta}
                    onClick={() => navigate('/integracoes/dominio/novo')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table isLoading={isLoading} />
          )}
        </Box>
      </TableProvider>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteDialog.title}
        description={text.list.deleteDialog.description}
        confirmButtonText={text.list.deleteDialog.confirm}
        cancelButtonText={text.list.deleteDialog.cancel}
        hideQuestionMark
      />
    </ContainerGrid>
  );
}
