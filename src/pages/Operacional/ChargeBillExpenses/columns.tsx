// src/pages/Operacional/ChargeBillExpenses/columns.tsx
// -----------------------------------------------------------------------------
// Definição das 6 colunas da listagem de Contas a Pagar — TASK-CBE-05,
// esteira 97-Esteiras/062 (contrato de tela §2.1, COL-01..06). Ordem EXATA:
// Código · Dt. Vencimento · Fornecedor · Rateio Produto · Valor · Ação.
// Formatação/fallbacks: `formatDate` (DD/MM/YYYY), `toLocaleString` pt-BR
// (moeda), fallback "Todos Associados"/"Todos" quando provider/cultivation
// são `null`. `branch` NUNCA aparece em coluna (list_manifest note, fiel).
// Mirror `ChargeBillIncomes/columns.tsx` (gêmeo).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Text } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';

import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import type { LanguageDate } from '@/@types/language';
import type { ChargeBillExpenseListItem } from '@/@types/v2/ChargeBillExpense';

import { ChargeBillExpenseActionsMenu } from './ChargeBillExpenseActionsMenu';

interface UseChargeBillExpenseColumnsProps {
  languageGB: LanguageDate;
  onView: (item: ChargeBillExpenseListItem) => void;
  onEdit: (item: ChargeBillExpenseListItem) => void;
  onDelete: (item: ChargeBillExpenseListItem) => void;
  isDeleting?: boolean;
}

const columnHelper = createColumnHelper<ChargeBillExpenseListItem>();

export function useChargeBillExpenseColumns({
  languageGB,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
}: UseChargeBillExpenseColumnsProps) {
  const text = languageGB.chargeBillExpenses.chargeBillExpense.list;

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
          <ChargeBillExpenseActionsMenu
            chargeBillExpense={row.original}
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
