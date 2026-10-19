// src/pages/Operacional/FeedingPhase/feeding-phase-columns.tsx
// -----------------------------------------------------------------------------
// Fábrica de colunas da grid de Fases de Alimentação (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-02). Colunas
// LIST-01..06 (`feeding-phases-contrato-tela-frontend.md` §4.3): code, name,
// user.name (Funcionário Responsável), created_at, updated_at, ações
// (view/edit/delete por permissão). Mirror estrutural de `diet-columns.tsx`.
// -----------------------------------------------------------------------------

import { Flex, Icon, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import type { LanguageDate } from '@/@types/language';
import type { FeedingPhaseListItem } from '@/@types/v2/FeedingPhases';

export interface UseFeedingPhaseColumnsParams {
  languageGB: LanguageDate;
  canEdit: boolean;
  canDelete: boolean;
  /** Navega para `CreateOrUpdateFeedingPhase` — MESMA rota serve Ver/Editar
   *  (sem rota `show` dedicada, mirror Diet: o modo é decidido dentro do
   *  form por `!canSave`, contrato §2 nota SURF-SHOW). */
  onOpen: (feedingPhase: FeedingPhaseListItem) => void;
  onDelete: (feedingPhase: FeedingPhaseListItem) => void;
  isDeleting: boolean;
}

export function useFeedingPhaseColumns({
  languageGB,
  canEdit,
  canDelete,
  onOpen,
  onDelete,
  isDeleting,
}: UseFeedingPhaseColumnsParams) {
  const text = languageGB.feedingPhases.feedingPhase;
  const columnHelper = createColumnHelper<FeedingPhaseListItem>();

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
    columnHelper.accessor('name', {
      header: text.list.columns.name,
      enableHiding: false,
      cell: ({ row }) => (
        <Text fontWeight="medium" lineClamp="1">
          {row.original.name}
        </Text>
      ),
      meta: { gridLabel: text.list.columns.name },
    }),
    columnHelper.accessor((row) => row.user?.name ?? '', {
      id: 'responsible',
      header: text.list.columns.responsible,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {row.original.user?.name ?? '—'}
        </Text>
      ),
      meta: { gridLabel: text.list.columns.responsible },
    }),
    columnHelper.accessor('created_at', {
      header: text.list.columns.createdAt,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {row.original.created_at
            ? formatDate(row.original.created_at, 'dd/MM/yyyy HH:mm:ss')
            : '—'}
        </Text>
      ),
      meta: { ...styleColumTable.date, gridLabel: text.list.columns.createdAt },
    }),
    columnHelper.accessor('updated_at', {
      header: text.list.columns.updatedAt,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {row.original.updated_at
            ? formatDate(row.original.updated_at, 'dd/MM/yyyy HH:mm:ss')
            : '—'}
        </Text>
      ),
      meta: { ...styleColumTable.date, gridLabel: text.list.columns.updatedAt },
    }),
    columnHelper.display({
      id: 'acoes',
      header: '',
      enableHiding: false,
      cell: ({ row }) => (
        <Flex justify="flex-end">
          <Actions size="sm">
            {/* Ver/Editar são mutuamente exclusivos (mesma rota, mirror
                Diet) — quem tem edição vê "Editar"; quem só tem visualização
                (rota já gated por `feeding-phases_view`) vê "Ver". */}
            {canEdit ? (
              <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onOpen(row.original)}>
                {text.list.actions.edit}
              </Actions.Item>
            ) : (
              <Actions.Item icon={<Icon as={FiEye} />} onClick={() => onOpen(row.original)}>
                {text.list.actions.view}
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
