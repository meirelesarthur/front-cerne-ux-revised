// src/pages/Operacional/DiscountTable/discount-table-columns.tsx
// -----------------------------------------------------------------------------
// Fábrica de colunas da grid de Descontos/Classificação (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-02). Colunas ORDEM/ROTULOS
// exatos do contrato de tela §4.4: Código, Nome, Tipo de Cálculo, Produtos,
// Ação (view/edit/delete por permissão). Mirror estrutural de
// `feeding-phase-columns.tsx`.
//
// "Tipo de Cálculo": label via `calculationBaseOptions.getLabel` (i18n
// local, Lei 10) — NÃO usa `item.calculation_base.label` do servidor (fixo
// em PT-BR pelo enum PHP, não segue o idioma ativo da SPA).
//
// "Produtos": `item.products` já vem CONCATENADO pelo backend
// (`DiscountTableListResource`, LM-04) — string pronta, SEM segunda
// request/join no front (SEM MOCK).
//
// Ver/Editar são mutuamente exclusivos (mesma rota — `CreateOrUpdateDiscountTable`,
// mirror FeedingPhase/Diet): quem tem edição vê "Editar"; quem só tem
// visualização (rota já gated por `discount-tables_view`) vê "Ver".
// -----------------------------------------------------------------------------

import { Flex, Icon, Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import { styleColumTable } from '@/utils/style-colum-table';

import { calculationBaseOptions } from '@/constants/discount-table/options';

import type { LanguageDate } from '@/@types/language';
import type { DiscountTableListItem } from '@/@types/v2/DiscountTables';

export interface UseDiscountTableColumnsParams {
  languageGB: LanguageDate;
  canEdit: boolean;
  canDelete: boolean;
  /** Navega para `CreateOrUpdateDiscountTable` — MESMA rota serve Ver/Editar
   *  (sem rota `show` dedicada, mirror FeedingPhase/Diet: o modo é decidido
   *  dentro do form por `!canSave`). */
  onOpen: (discountTable: DiscountTableListItem) => void;
  onDelete: (discountTable: DiscountTableListItem) => void;
  isDeleting: boolean;
}

export function useDiscountTableColumns({
  languageGB,
  canEdit,
  canDelete,
  onOpen,
  onDelete,
  isDeleting,
}: UseDiscountTableColumnsParams) {
  const text = languageGB.discountTables.discountTable;
  const columnHelper = createColumnHelper<DiscountTableListItem>();

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
    columnHelper.accessor(
      (row) => calculationBaseOptions.getLabel(row.calculation_base.value, languageGB),
      {
        id: 'calculation_base',
        header: text.list.columns.calculationBase,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {calculationBaseOptions.getLabel(row.original.calculation_base.value, languageGB)}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.calculationBase },
      }
    ),
    columnHelper.accessor('products', {
      header: text.list.columns.products,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted" lineClamp="1">
          {row.original.products || '—'}
        </Text>
      ),
      meta: { gridLabel: text.list.columns.products },
    }),
    columnHelper.display({
      id: 'acoes',
      header: '',
      enableHiding: false,
      cell: ({ row }) => (
        <Flex justify="flex-end">
          <Actions size="sm">
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
