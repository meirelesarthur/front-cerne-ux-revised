// src/pages/CadastrosBase/Areas/AreasSubList.tsx
// -----------------------------------------------------------------------------
// Sub-lista de Áreas por Fazenda (SURF-01/02/03 do contrato de tela,
// TASK-FE-416, F-348/UT-000446) — renderizada via `Table.rowSubComponent` da
// listagem de Fazendas (`CadastrosBase/Fazendas/index.tsx`), SÓ quando a
// linha-pai é expandida.
//
// REFINAMENTO (2 pontos do dono, mesma esteira): `GET /api/v1/farms` agora
// devolve `areas: FarmAreaListItem[]` (subconjunto enxuto, EAGER `with()`,
// SEM paginação) em CADA Fazenda — esta sub-lista consome `farm.areas`
// DIRETO do objeto já carregado pela listagem-pai (`useFarmsList`), SEM
// chamada própria e SEM paginação local (mostra TODAS as áreas da fazenda).
// Mirror do MESMO padrão de `MaintenanceItemsSubRow` (itens já vêm no
// payload da listagem-pai) — a antiga busca LAZY por `farm_uuid`
// (`useFarmAreasSubList`) foi removida (`useAreas.tsx`).
//
// DESIGN (decisão do dono, retoque): a sub-lista deixa de ser um "card dentro
// de card" (mini-tabela com header pesado repetido) e passa a se apresentar
// como SUB-NÍVEL da Fazenda — fundo sutil (`bg.subtle`) + acento de borda à
// esquerda (`border.emphasized`) + indentação, header interno reduzido a
// rótulos muted/uppercase (sem borda pesada nem fundo próprio), mesmas
// colunas/rótulos e mesmo padrão de Badge de status da tabela-pai de
// Fazendas (`Fazendas/index.tsx`). Continua sendo uma `<table>` semântica
// (a11y — roles de linha/célula/columnheader preservados), só com a "pele"
// de header e moldura enxugada.
//
// ATENÇÃO: NÃO confundir com `useFarmAreaGeometries` (419) — hook usado pelo
// `AreaMapEditor` para checagem de sobreposição (geometrias das áreas
// irmãs); é outra necessidade, intocada por este retoque.
//
// Colunas: Nome (`description`) / Área total (ha) (`total_area`) / Ativo
// (`is_enabled`, `Badge`) / Ação (menu Visualizar/Editar/Excluir). Áreas
// INATIVAS aparecem na sub-lista (CLM-19, fidelidade — SEM filtro silencioso
// de `is_enabled`, matriz FID-G3F SURF-01 PRESERVAR).
//
// RBAC: reusa os slugs de Fazenda (`farms_view`/`farms_edit`/`farms_delete`,
// DEC-006, matriz FID-G3F SURF-03) — o legado NÃO tinha `@can` nas ações de
// Área (CLM-15); o destino ENDURECE (fail-closed), não replica o defeito.
//
// Exclusão de Área: `DELETE /api/v1/areas/{uuid}` já é CONSUMÍVEL JÁ e
// MATCHED (matriz FID-G3A A-05/FID-G3F SURF-08). Invalida
// `queryKey.cadastrosBase.areas` (módulo Área) E `queryKey.farms.farmsAdminList`
// (a listagem-pai, dona do `farm.areas` embutido consumido aqui) — sem a
// segunda invalidação a sub-lista ficaria com a área excluída "fantasma" até
// um refresh manual, já que ela não tem mais query própria para refetchar.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, Table as ChakraTable, Text } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { EmptyState } from '@/components/EmptyState';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { deleteArea } from '@/services/v2/BaseRegistrations/areas-service';

import type { FarmAreaListItem, FarmDetail } from '@/@types/v2/Farms/farm-admin';

import { areaCreateRoute, areaEditRoute, areaViewRoute } from './area-routes';

export interface AreasSubListProps {
  farm: FarmDetail;
}

// `Table.rowSubComponent` clona o elemento retornado com um `row` extra
// (`cloneElement(rowSubComponent({ row }), { row })`, `Table.tsx`) — mirror
// EXATO de `MaintenanceItemsSubRow`, que também não declara essa prop
// (ignorada por design, sem custo de tipagem: `cloneElement` sem generics
// aceita qualquer prop adicional).
export function AreasSubList({ farm }: AreasSubListProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.areas.area.list;

  const canView = can('farms_view');
  const canEdit = can('farms_edit');
  const canDelete = can('farms_delete');
  const canCreateArea = can('farms_create');

  // Refinamento — sem query própria: `farm.areas` já vem completo (SEM
  // paginação) no payload da listagem-pai (`GET /farms`, `with('areas')`).
  //
  // ACHADO-2 (E2E comparativo, TASK-FE-417 correção): o backend NÃO garante
  // ordem (`with('areas')` eager sem `orderBy`) — a sub-lista chegava fora de
  // ordem (ex. "Pasto 02, 03, 04, 05, 01, 10, 11"), divergindo do legado
  // (ordenado). Ordenação client-side por `description` ascendente
  // (`localeCompare` com `numeric: true` — mesma fidelidade do legado para
  // nomes com sufixo numérico, "Pasto 2" antes de "Pasto 10"), SEM tocar a
  // API (task-packet: "NÃO precisa mexer na API").
  const items: FarmAreaListItem[] = [...(farm.areas ?? [])].sort((a, b) =>
    a.description.localeCompare(b.description, 'pt-BR', { numeric: true, sensitivity: 'base' })
  );
  const isEmpty = items.length === 0;

  const [toDelete, setToDelete] = useState<FarmAreaListItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const deleteMutation = useRequest({
    asyncFunction: async ({ areaUuid }: { areaUuid: string }) => deleteArea(areaUuid),
    queryKey: queryKey.cadastrosBase.areas,
    // A sub-lista não tem mais query própria — o dado exibido (`farm.areas`)
    // pertence à listagem-pai de Fazendas. Invalidar `farmsAdminList` é o que
    // de fato tira a área excluída da tela (refetch `useCustomGridQuery`,
    // `networkMode: "online"`/`staleTime: 0`, `get_pwa_grid_query_pattern`).
    queryKey2: queryKey.farms.farmsAdminList,
    typesRequest: 'update',
    entityName: languageGB.areas.area.singularLabel,
    personalizedMessage: text.deletedToast,
    actionSuccess: () => {
      setIsDeleteOpen(false);
      setToDelete(null);
    },
  });

  function handleDeleteClick(area: FarmAreaListItem) {
    setToDelete(area);
    setIsDeleteOpen(true);
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ areaUuid: toDelete.uuid });
    }
  }

  const isDeleting = deleteMutation.isPending;

  if (isEmpty) {
    return (
      <Box
        bg="bg.subtle"
        borderRadius="md"
        borderLeftWidth="3px"
        borderLeftColor="border.emphasized"
      >
        <EmptyState
          variant="empty"
          message={text.emptyState.title}
          description={text.emptyState.description}
          action={
            canCreateArea
              ? {
                  label: languageGB.farms.farm.list.actions.addArea,
                  onClick: () => navigate(areaCreateRoute(farm.uuid)),
                }
              : undefined
          }
        />
      </Box>
    );
  }

  return (
    <Box
      bg="bg.subtle"
      borderRadius="md"
      borderLeftWidth="3px"
      borderLeftColor="border.emphasized"
      overflow="hidden"
    >
      <Box overflowX="auto">
        <ChakraTable.Root size="sm">
          <ChakraTable.Header>
            <ChakraTable.Row>
              <ChakraTable.ColumnHeader
                border="none"
                pl={6}
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
              >
                {text.table.description}
              </ChakraTable.ColumnHeader>
              <ChakraTable.ColumnHeader
                border="none"
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
              >
                {text.table.totalArea}
              </ChakraTable.ColumnHeader>
              <ChakraTable.ColumnHeader
                border="none"
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
              >
                {text.table.active}
              </ChakraTable.ColumnHeader>
              <ChakraTable.ColumnHeader border="none" />
            </ChakraTable.Row>
          </ChakraTable.Header>
          <ChakraTable.Body>
            {items.map((area) => (
              <ChakraTable.Row key={area.uuid} borderTopWidth="1px" borderColor="border.subtle">
                <ChakraTable.Cell pl={6} border="none">
                  <Text fontWeight="medium" fontSize="sm">
                    {area.description}
                  </Text>
                </ChakraTable.Cell>
                <ChakraTable.Cell border="none">
                  <Text fontSize="sm" color="fg.muted">
                    {area.total_area?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha
                  </Text>
                </ChakraTable.Cell>
                <ChakraTable.Cell border="none">
                  <Badge
                    colorPalette={area.is_enabled ? 'green' : 'gray'}
                    variant="subtle"
                    py={1}
                    px={3}
                  >
                    {area.is_enabled ? text.table.activeLabel : text.table.inactiveLabel}
                  </Badge>
                </ChakraTable.Cell>
                <ChakraTable.Cell border="none">
                  <Flex justify="flex-end">
                    <Actions size="sm">
                      {canView && (
                        <Actions.Item
                          icon={<Icon as={FiEye} />}
                          onClick={() => navigate(areaViewRoute(farm.uuid, area.uuid))}
                        >
                          {text.actions.view}
                        </Actions.Item>
                      )}
                      {canEdit && (
                        <Actions.Item
                          icon={<Icon as={FiEdit} />}
                          onClick={() => navigate(areaEditRoute(farm.uuid, area.uuid))}
                        >
                          {text.actions.edit}
                        </Actions.Item>
                      )}
                      {canDelete && (
                        <>
                          <Actions.Separator />
                          <Actions.Item
                            icon={<Icon as={FiTrash2} />}
                            onClick={() => handleDeleteClick(area)}
                            tone="danger"
                            disabled={isDeleting}
                          >
                            {text.actions.delete}
                          </Actions.Item>
                        </>
                      )}
                    </Actions>
                  </Flex>
                </ChakraTable.Cell>
              </ChakraTable.Row>
            ))}
          </ChakraTable.Body>
        </ChakraTable.Root>
      </Box>

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.description}
      />
    </Box>
  );
}
