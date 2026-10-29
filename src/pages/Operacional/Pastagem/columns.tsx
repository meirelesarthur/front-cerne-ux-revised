// src/pages/Operacional/Pastagem/columns.tsx
// -----------------------------------------------------------------------------
// Colunas da listagem de Pastagem (TASK-PAST-FE-02) — 7 colunas (LM-01..07):
// status-dot, código, data, requisitante, armazém, dt. criação, ações.
// Ações condicionais pela máquina de estados O→F→A (DEC-FE-08): Visualizar
// (sempre), Finalizar/Editar (`status==O`), Apropriar (`status==F`), Excluir
// (sempre, mirror Appropriations — sem guarda de status própria).
//
// OBSERVAÇÃO (não é Gap, ver `@/@types/v2/Pastures` cabeçalho): a coluna
// "Armazém" (fallback `inputs_warehouse` → `productions_warehouse`) hoje
// sempre renderiza "—" — `PastureRepository::listWithFilters()` não faz
// eager-load dessas 2 relações no `index()`. UI honesta (SEM MOCK): nunca
// inventa um valor, só mostra o fallback textual.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Flex, Icon, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiPieChart, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { StatusTag } from '@/components/ui/StatusTag';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { PASTURE_STATUS_META } from '@/constants/pastures/pasture-status';

import type { LanguageDate } from '@/@types/language';
import type { PastureListItem } from '@/@types/v2/Pastures';

interface BuildPastureColumnsParams {
  languageGB: LanguageDate;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onView: (pasture: PastureListItem) => void;
  onEditOrFinish: (pasture: PastureListItem) => void;
  onAppropriate: (pasture: PastureListItem) => void;
  onDelete: (pasture: PastureListItem) => void;
}

const columnHelper = createColumnHelper<PastureListItem>();

export function buildPastureColumns({
  languageGB,
  canView,
  canEdit,
  canDelete,
  isDeleting,
  onView,
  onEditOrFinish,
  onAppropriate,
  onDelete,
}: BuildPastureColumnsParams) {
  const text = languageGB.pastures.pasture.list;
  const statusLegend = languageGB.pastures.pasture.list.statusLegend;

  return [
    columnHelper.accessor('status', {
      header: languageGB.defaltStrings.statusColumn,
      enableHiding: false,
      cell: ({ row }) => {
        const status = row.original.status;
        const label =
          status === 'O'
            ? statusLegend.opened
            : status === 'F'
              ? statusLegend.finished
              : statusLegend.appropriated;
        return <StatusTag label={label} color={PASTURE_STATUS_META[status].badgeColor} />;
      },
      meta: { ...styleColumTable.md, gridLabel: languageGB.defaltStrings.statusColumn },
    }),
    columnHelper.accessor('code', {
      header: text.table.code,
      cell: ({ row }) => (
        <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
          {row.original.code}
        </Text>
      ),
      meta: { ...styleColumTable.sm, gridLabel: text.table.code },
    }),
    columnHelper.accessor('date', {
      header: text.table.date,
      cell: ({ row }) => <Text fontSize="sm">{row.original.date}</Text>,
      meta: { ...styleColumTable.date, gridLabel: text.table.date },
    }),
    columnHelper.accessor('requester', {
      header: text.table.requester,
      cell: ({ row }) => <Text fontSize="sm">{row.original.requester ?? '—'}</Text>,
      meta: { gridLabel: text.table.requester },
    }),
    columnHelper.display({
      id: 'warehouse',
      header: text.table.warehouse,
      cell: () => <Text fontSize="sm">—</Text>,
      meta: { gridLabel: text.table.warehouse },
    }),
    columnHelper.accessor('created_at', {
      header: text.table.createdAt,
      // Pedido do dono — formata dd/MM/yyyy (mesmo helper `formatDate`,
      // pattern default, já usado nas demais listagens do projeto para
      // colunas de data só-dia, ex. `BaseRegistrations/Grazings/index.tsx`).
      // Fallback '—' preservado quando `created_at` é nulo/vazio OU quando
      // `formatDate` não conseguir parsear (retorna string vazia nesse
      // caso, nunca lança).
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        const formatted = createdAt ? formatDate(createdAt) : '';
        return <Text fontSize="sm">{formatted || '—'}</Text>;
      },
      meta: { ...styleColumTable.date, gridLabel: text.table.createdAt },
    }),
    columnHelper.display({
      id: 'acoes',
      header: '',
      enableHiding: false,
      cell: ({ row }) => {
        const pasture = row.original;
        const canEditRow = canEdit && pasture.status === 'O';
        const canAppropriateRow = canEdit && pasture.status === 'F';
        return (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye as ElementType} />}
                  onClick={() => onView(pasture)}
                >
                  {text.actions.view}
                </Actions.Item>
              )}
              {canEditRow && (
                <Actions.Item
                  icon={<Icon as={FiEdit as ElementType} />}
                  onClick={() => onEditOrFinish(pasture)}
                >
                  {text.actions.edit}
                </Actions.Item>
              )}
              {canAppropriateRow && (
                <Actions.Item
                  icon={<Icon as={FiPieChart as ElementType} />}
                  onClick={() => onAppropriate(pasture)}
                >
                  {text.actions.appropriate}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2 as ElementType} />}
                    onClick={() => onDelete(pasture)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.actions.delete}
                  </Actions.Item>
                </>
              )}
            </Actions>
          </Flex>
        );
      },
      meta: {
        ...styleColumTable.sm,
        gridLabel: languageGB.defaltStrings.actions,
        gridOrder: 'fixed-end',
        gridDataColumn: false,
      },
    }),
  ];
}
