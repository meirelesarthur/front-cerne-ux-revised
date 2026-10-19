// src/pages/Operacional/ChargeBillIncomes/columns.tsx
// -----------------------------------------------------------------------------
// Definição das 6 colunas da listagem de Contas a Receber — TASK-CBI-FE-02
// (contrato de tela §4, fiel a `index.blade.php`/list_manifest COL-01..06).
// Ordem EXATA: Código · Dt. Vencimento · Fornecedor · Rateio Produto · Valor ·
// Ações. Formatação/fallbacks: `formatDate` (DD/MM/YYYY), `toLocaleString`
// pt-BR (moeda), fallback "Todos Associados"/"Todos" quando provider/
// cultivation são `null` (COL-03/COL-04).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import type { LanguageDate } from '@/@types/language';
import type { ChargeBillIncomeListItem } from '@/@types/v2/ChargeBillIncome';

import { ChargeBillIncomeActionsMenu } from './ChargeBillIncomeActionsMenu';

interface UseChargeBillIncomeColumnsProps {
  languageGB: LanguageDate;
  onView: (item: ChargeBillIncomeListItem) => void;
  onEdit: (item: ChargeBillIncomeListItem) => void;
  onDelete: (item: ChargeBillIncomeListItem) => void;
  isDeleting?: boolean;
}

const columnHelper = createColumnHelper<ChargeBillIncomeListItem>();

export function useChargeBillIncomeColumns({
  languageGB,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
}: UseChargeBillIncomeColumnsProps) {
  const text = languageGB.chargeBillIncomes.chargeBillIncome.list;

  return useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.columns.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('due_date', {
        header: text.columns.dueDate,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.due_date)}</Text>,
        enableSorting: false,
        meta: styleColumTable.date,
      }),
      // COL-03 — fallback "Todos Associados" quando `provider` é `null`.
      columnHelper.accessor((row) => row.provider?.name, {
        id: 'provider',
        header: text.columns.provider,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.provider?.name ?? text.fallback.provider}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.md,
      }),
      // COL-04 — fallback "Todos" quando `cultivation` é `null`.
      columnHelper.accessor((row) => row.cultivation?.name, {
        id: 'cultivation',
        header: text.columns.cultivation,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.cultivation?.name ?? text.fallback.cultivation}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('amount', {
        header: text.columns.amount,
        cell: ({ row }) => (
          <Text fontSize="sm" fontVariantNumeric="tabular-nums">
            {row.original.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'acoes',
        header: text.columns.actions,
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <ChargeBillIncomeActionsMenu
            chargeBillIncome={row.original}
            languageGB={languageGB}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [languageGB, text, onView, onEdit, onDelete, isDeleting]
  );
}
