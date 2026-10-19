// src/pages/Operacional/Diet/diet-columns.tsx
// -----------------------------------------------------------------------------
// Fábrica de colunas da grid de Dieta (Diet — Operacional/Pecuária,
// TASK-FE-DIET-02). Colunas LM-DIETS-01..07 (`arquitetura-frontend-dieta.md`
// §3): code, date, product_description, objective (label enum), estimated_cost
// (money 2), cost_per_kg (money 3), ações (view/edit/delete por permissão).
// Extraído do `index.tsx` para arquivo próprio (mirror da convenção
// `diet-beat-columns.tsx`, TASK-FE-DIET-05) — mesmo padrão visual/estrutural
// de `Fabrica/index.tsx` (Food), adaptado aos campos reais de Diet.
// -----------------------------------------------------------------------------

import { Badge, Flex, Icon, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { dietObjectiveLabel } from '@/constants/diet/diet-objective';

import type { LanguageDate } from '@/@types/language';
import type { DietListItem } from '@/@types/v2/Diets';

function formatMoney(value: number | string | null | undefined, decimals: number): string {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export interface UseDietColumnsParams {
  languageGB: LanguageDate;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (diet: DietListItem) => void;
  onDelete: (diet: DietListItem) => void;
  isDeleting: boolean;
}

export function useDietColumns({
  languageGB,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isDeleting,
}: UseDietColumnsParams) {
  const text = languageGB.diets.diet;
  const objectiveLabels = dietObjectiveLabel(languageGB);
  const columnHelper = createColumnHelper<DietListItem>();

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
    columnHelper.accessor((row) => row.product?.description ?? '', {
      id: 'product',
      header: text.list.columns.product,
      enableHiding: false,
      cell: ({ row }) => (
        <Text fontWeight="medium" lineClamp="1">
          {row.original.product?.description ?? '—'}
        </Text>
      ),
      meta: { gridLabel: text.list.columns.product },
    }),
    columnHelper.accessor('objective', {
      header: text.list.columns.objective,
      cell: ({ row }) => (
        <Badge colorPalette="blue" variant="subtle">
          {row.original.objective_label || objectiveLabels[row.original.objective]}
        </Badge>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.columns.objective },
    }),
    columnHelper.accessor('estimated_cost', {
      header: text.list.columns.estimatedCost,
      cell: ({ row }) => (
        <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
          {formatMoney(row.original.estimated_cost, 2)}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.columns.estimatedCost },
    }),
    columnHelper.accessor('cost_per_kg', {
      header: text.list.columns.costPerKg,
      cell: ({ row }) => (
        <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
          {formatMoney(row.original.cost_per_kg, 3)}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.list.columns.costPerKg },
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
