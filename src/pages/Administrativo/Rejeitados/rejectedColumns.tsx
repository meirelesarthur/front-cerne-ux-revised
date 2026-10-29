// src/pages/Administrativo/Rejeitados/rejectedColumns.tsx
// -----------------------------------------------------------------------------
// Colunas da lista "Rejeitados/Cancelados" (execução 081, T-081-FE-07; contrato
// LEGADO-SUPRIMENTOS-04, RC01..RC09). Ordem do legado: bolinha de status,
// Código, Dt. Pedido, Descrição/Chamado, Duração, Solicitante, Responsável
// Atual, Fazenda e Ação. Tipo, Status e Prioridade seguem disponíveis pelo
// painel de colunas (acréscimo do novo mantido, D-01).
// Ações do legado (AR01/AR02): Visualizar e Relatório SLA.
// -----------------------------------------------------------------------------

import { Badge, Flex, Icon, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { FiClock, FiEye } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { StatusTag } from '@/components/ui/StatusTag';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { requestPurchasePriorityColor } from '@/constants/RequestPurchases/request-purchase-priority';
import type { RequestPurchasePriority } from '@/constants/RequestPurchases/request-purchase-priority';
import {
  requestPurchaseStatusDotToken,
} from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import type { RequestPurchaseListItem } from '@/@types/v2/RequestPurchases';

type RequestPurchaseText = {
  list: { table: { type: string; status: string; priority: string } };
  supply: {
    columns: {
      code: string;
      requestDate: string;
      description: string;
      duration: string;
      requester: string;
      responsible: string;
      farm: string;
      action: string;
    };
    filters: { status: string };
    actions: { view: string; slaReport: string };
  };
};

export interface RejectedColumnsOptions {
  text: RequestPurchaseText;
  /** Gate de "Visualizar" (`rejected-requests_view` no legado + destino). */
  canView: boolean;
  /** Gate de "Relatório SLA" (`status-sla_report_view`). */
  canSla: boolean;
  onView: (uuid: string) => void;
  onSlaReport: (uuid: string) => void;
  /** Cabeçalho da coluna de situação (`defaltStrings.statusColumn`); sem ele usa o texto da lista. */
  statusHeader?: string;
}

const columnHelper = createColumnHelper<RequestPurchaseListItem>();

export function buildRejectedColumns({
  text,
  canView,
  canSla,
  onView,
  onSlaReport,
  statusHeader,
}: RejectedColumnsOptions) {
  return [
    // Situação escrita na linha (tag colorida): substitui a bolinha + a legenda acima do grid.
    columnHelper.accessor('status_label', {
      header: statusHeader ?? text.list.table.status,
      enableHiding: false,
      cell: ({ row }) => (
        <StatusTag
          label={row.original.status_label}
          color={requestPurchaseStatusDotToken[row.original.status as RequestPurchaseStatus]}
        />
      ),
      meta: {
        ...styleColumTable.md,
        gridLabel: statusHeader ?? text.list.table.status,
        gridOrder: 'fixed-start',
      },
    }),
    columnHelper.accessor('code', {
      header: text.supply.columns.code,
      cell: ({ row }) => (
        <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
          {row.original.code ?? '—'}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.supply.columns.code },
    }),
    columnHelper.accessor('request_date', {
      header: text.supply.columns.requestDate,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {formatDate(row.original.request_date)}
        </Text>
      ),
      meta: { ...styleColumTable.date, gridLabel: text.supply.columns.requestDate },
    }),
    // "Descrição/Chamado" lê `description` (não `justification`), como o legado.
    columnHelper.accessor('description', {
      header: text.supply.columns.description,
      enableHiding: false,
      cell: ({ row }) => (
        <Flex align="center" gap={2}>
          <Icon as={FileText} color="blue.400" boxSize={4} flexShrink={0} />
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description ?? '—'}
          </Text>
        </Flex>
      ),
      meta: { gridLabel: text.supply.columns.description },
    }),
    columnHelper.accessor('duration_label', {
      header: text.supply.columns.duration,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {row.original.duration_label ?? '—'}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.supply.columns.duration },
    }),
    columnHelper.accessor((row) => row.user?.name ?? '', {
      id: 'requester',
      header: text.supply.columns.requester,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted" lineClamp="1">
          {row.original.user?.name ?? '—'}
        </Text>
      ),
      meta: { ...styleColumTable.md, gridLabel: text.supply.columns.requester },
    }),
    columnHelper.accessor((row) => row.responsible?.name ?? '', {
      id: 'responsible',
      header: text.supply.columns.responsible,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted" lineClamp="1">
          {row.original.responsible?.name ?? '—'}
        </Text>
      ),
      meta: { ...styleColumTable.md, gridLabel: text.supply.columns.responsible },
    }),
    columnHelper.accessor((row) => row.farm?.description ?? '', {
      id: 'farm',
      header: text.supply.columns.farm,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted" lineClamp="1">
          {row.original.farm?.description ?? '—'}
        </Text>
      ),
      meta: { ...styleColumTable.md, gridLabel: text.supply.columns.farm },
    }),
    // Acréscimos do novo (D-01 manter): Tipo, Status e Prioridade.
    columnHelper.accessor('type_label', {
      header: text.list.table.type,
      cell: ({ row }) => (
        <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
          {row.original.type_label}
        </Badge>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
    }),
    columnHelper.accessor('priority_label', {
      header: text.list.table.priority,
      cell: ({ row }) => (
        <Badge
          colorPalette={
            requestPurchasePriorityColor[row.original.priority as RequestPurchasePriority] ?? 'gray'
          }
          variant="subtle"
          py={1}
          px={3}
        >
          {row.original.priority_label}
        </Badge>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.table.priority },
    }),
    columnHelper.display({
      id: 'acoes',
      header: '',
      enableHiding: false,
      cell: ({ row }) =>
        canView || canSla ? (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item icon={<Icon as={FiEye} />} onClick={() => onView(row.original.uuid)}>
                  {text.supply.actions.view}
                </Actions.Item>
              )}
              {canSla && (
                <Actions.Item
                  icon={<Icon as={FiClock} />}
                  onClick={() => onSlaReport(row.original.uuid)}
                >
                  {text.supply.actions.slaReport}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ) : null,
      meta: {
        ...styleColumTable.sm,
        gridLabel: text.supply.columns.action,
        gridOrder: 'fixed-end',
        gridDataColumn: false,
      },
    }),
  ];
}
