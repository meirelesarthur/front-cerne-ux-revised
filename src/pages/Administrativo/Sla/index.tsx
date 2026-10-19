// src/pages/Administrativo/Sla/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de Parâmetros SLA (SupplyStatusSla — Administrativo /
// Suprimentos, TASK-FE-SLA-01). Rota: /administrativo/sla (path já cravado
// no menu — `navigationTree.ts:402` — não inventar outro).
//
// Satisfaz as 3 funcionalidades do MCP com 1 única tela (DEC-D do contrato
// de API): "Parâmetros SLA" (o módulo como um todo), "Supply Status Sla
// View" (a própria listagem, sem endpoint de detalhe) e "Supply Status Sla
// Edit" (edição inline de `max_hours` por linha).
//
// SEM paginação/filtro — 11 linhas fixas por fazenda ativa (DA-SLA-03 do
// contrato de API). Mirror ESTRUTURAL de `AccountingGroupers/index.tsx`
// (listagem sem paginação real, `Table.Root`/`Header`/`Body` PUROS do
// Chakra — NÃO `@/components/Table`, acoplado ao `TableProvider`) +
// `TenantParameters/index.tsx` (guard `hasFarm` de `farm.context` estrito,
// PRIMEIRA verificação, antes de qualquer render de grid ou disparo do GET).
//
// Modo view-only (`supply-status-sla_view` sem `supply-status-sla_edit`):
// mesma tela, o `IconButtonTable` "Editar" simplesmente nunca aparece em
// nenhuma linha (gate `canEdit` na coluna de ações, não na rota — a rota só
// exige `supply-status-sla_view`, ver `router/index.tsx`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, EmptyState, Icon, Table, Text, VStack } from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { QueryErrorState } from '@/components/QueryErrorState';
import { TableSkeleton } from '@/components/TableSkeleton';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { updateSupplyStatusSla } from '@/services/v2/SupplyStatusSlas/supply-status-sla-service';

import type { Response } from '@/@types/response-api';
import type { SupplyStatusSlaListItem } from '@/@types/v2/SupplyStatusSlas';

import { formatSlaRecordsCount } from './slaStatusDot';
import { SlaTableRow } from './SlaTableRow';
import { useSupplyStatusSlaList } from './useSupplyStatusSla';

export default function SlaList() {
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.supplyStatusSlas.supplyStatusSla;

  const canEdit = can('supply-status-sla_edit');

  const [editingUuid, setEditingUuid] = useState<string | null>(null);

  const slaList = useSupplyStatusSlaList(hasFarm);

  async function tryUpdateSla({
    uuid,
    maxHours,
  }: {
    uuid: string;
    maxHours: number;
  }): Promise<Response<SupplyStatusSlaListItem> | undefined> {
    return await updateSupplyStatusSla(uuid, { max_hours: maxHours });
  }

  const updateMutation = useRequest<SupplyStatusSlaListItem>({
    asyncFunction: tryUpdateSla,
    queryKey: queryKey.supplyStatusSlas.supplyStatusSlaList,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.savedToast,
    actionSuccess: () => setEditingUuid(null),
  });

  // Guard de farm ativa — PRIMEIRA verificação, antes de qualquer render de
  // grid ou disparo do GET (mirror `TenantParameters`, `farm.context`
  // estrito). Evita um 403 cru para o cenário esperado de usuário sem
  // fazenda selecionada.
  if (!hasFarm) {
    return (
      <ContainerGrid>
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

        <VStack align="flex-start" gap={2} p={4} mt={6} bg="bg.subtle" borderRadius="md">
          <Text fontWeight="medium">{text.list.noFarmState.title}</Text>
          <Text fontSize="sm" color="fg.muted">
            {text.list.noFarmState.description}
          </Text>
        </VStack>
      </ContainerGrid>
    );
  }

  const items = slaList.data ?? [];

  const isLoading = slaList.isLoading;
  const isError = slaList.isError;
  const isEmpty = !isLoading && !isError && items.length === 0;

  return (
    <ContainerGrid>
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

      <Box
        mt={4}
        px={4}
        py={3}
        borderRadius="md"
        bg="bg.subtle"
        border="1px solid"
        borderColor="borderGrid"
        role="note"
      >
        <Text fontSize="sm" color="fg.muted">
          {text.list.tenantNotice}
        </Text>
      </Box>

      <Box mt={6}>
        {isLoading ? (
          <TableSkeleton rows={11} columns={2} hasPagination={false} />
        ) : isError ? (
          <Box py={12} borderTop="1px solid" borderColor="borderGrid">
            <QueryErrorState
              message={text.list.error.message}
              retryLabel={text.list.error.retry}
              onRetry={() => slaList.refetch()}
              isRetrying={slaList.isFetching}
            />
          </Box>
        ) : isEmpty ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiClock} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                <EmptyState.Description>{text.list.emptyState.description}</EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.ScrollArea
            borderTop="1px"
            marginTop="6"
            borderTopRadius="md"
            borderColor="borderGrid"
          >
            <Table.Root
              variant="line"
              size="md"
              css={{
                border: 'none',
                '& th': {
                  bg: 'gridHeadSecondary',
                  color: 'textGridColor',
                  height: '10',
                  fontWeight: '500',
                  fontSize: '14px',
                  paddingY: '2',
                  paddingLeft: '4',
                  paddingRight: '4',
                },
              }}
            >
              <Table.Header>
                <Table.Row borderBottom="1px solid" borderColor="borderGrid">
                  <Table.ColumnHeader>{text.list.table.statusLabel}</Table.ColumnHeader>
                  <Table.ColumnHeader>{text.list.table.maxHours}</Table.ColumnHeader>
                  <Table.ColumnHeader width="112px" />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map((item) => (
                  <SlaTableRow
                    key={item.uuid}
                    item={item}
                    isEditing={editingUuid === item.uuid}
                    canEdit={canEdit}
                    isSaving={updateMutation.isPending && editingUuid === item.uuid}
                    onEditClick={() => setEditingUuid(item.uuid)}
                    onSave={(uuid, maxHours) => updateMutation.mutate({ uuid, maxHours })}
                    onCancel={() => setEditingUuid(null)}
                  />
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}
        {!isLoading && !isError && items.length > 0 && (
          <Text mt={3} fontSize="sm" color="fg.muted">
            {formatSlaRecordsCount(text.list.recordsCount, items.length)}
          </Text>
        )}
      </Box>
    </ContainerGrid>
  );
}
