// src/pages/Operacional/Diet/DietBeat/diet-beat-columns.tsx
// -----------------------------------------------------------------------------
// Fábrica de colunas da grid de Batida (DietBeat — Operacional/Pecuária,
// TASK-FE-DIET-05). Colunas LM-DB-01..07 (`arquitetura-frontend-dieta.md`
// §3): code, date, dieta (product_description), vagão
// (equipment_description), operador (user_name), total
// (item_diet_beats_sum_total, R$), ações.
//
// `total` chega `null` no ÍNDICE (ver nota de topo de `@/@types/v2/DietBeats`
// — o backend usa `withSum`, que NÃO conta como relação `items` carregada
// para o `DietBeatResource`) — exibido como estado de UI honesto ('—'),
// SEM MOCK, em vez de fabricar um valor.
// -----------------------------------------------------------------------------

import { Flex, Icon, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import type { LanguageDate } from '@/@types/language';
import type { DietBeatListItem } from '@/@types/v2/DietBeats';

function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface UseDietBeatColumnsParams {
  languageGB: LanguageDate;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (dietBeat: DietBeatListItem) => void;
  onDelete: (dietBeat: DietBeatListItem) => void;
  isDeleting: boolean;
}

export function useDietBeatColumns({
  languageGB,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isDeleting,
}: UseDietBeatColumnsParams) {
  const text = languageGB.dietBeats.dietBeat;
  const columnHelper = createColumnHelper<DietBeatListItem>();

  const columns = [
    columnHelper.accessor('code', {
      header: text.list.columns.code,
      cell: ({ row }) => (
        <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
          {row.original.code}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.columns.code },
    }),
    columnHelper.accessor('date', {
      header: text.list.columns.date,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
        </Text>
      ),
      meta: { ...styleColumTable.date, gridLabel: text.list.columns.date },
    }),
    columnHelper.accessor((row) => row.diet?.product?.description ?? row.diet?.code ?? '', {
      id: 'diet',
      header: text.list.columns.diet,
      enableHiding: false,
      cell: ({ row }) => (
        <Text fontWeight="medium" lineClamp="1">
          {row.original.diet?.product?.description ?? row.original.diet?.code ?? '—'}
        </Text>
      ),
      meta: { gridLabel: text.list.columns.diet },
    }),
    columnHelper.accessor((row) => row.equipment?.description ?? '', {
      id: 'equipment',
      header: text.list.columns.equipment,
      cell: ({ row }) => <Text fontSize="sm">{row.original.equipment?.description ?? '—'}</Text>,
      meta: { gridLabel: text.list.columns.equipment },
    }),
    columnHelper.accessor((row) => row.user?.name ?? '', {
      id: 'user',
      header: text.list.columns.user,
      cell: ({ row }) => <Text fontSize="sm">{row.original.user?.name ?? '—'}</Text>,
      meta: { gridLabel: text.list.columns.user },
    }),
    columnHelper.accessor('total_cost', {
      header: text.list.columns.total,
      cell: ({ row }) => (
        <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
          {formatMoney(row.original.total_cost)}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.columns.total },
    }),
    columnHelper.display({
      id: 'acoes',
      header: '',
      enableHiding: false,
      cell: ({ row }) => (
        <Flex justify="flex-end">
          <Actions size="sm">
            {canEdit && (
              <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(row.original)}>
                {text.list.actions.edit}
              </Actions.Item>
            )}
            {canDelete && (
              <Actions.Item
                icon={<Icon as={FiTrash2} />}
                onClick={() => onDelete(row.original)}
                tone="danger"
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
  ];

  return columns;
}
