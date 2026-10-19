// src/components/Form/ReportColumnsField.tsx
// -----------------------------------------------------------------------------
// Seletor de colunas dos relatórios de Contas (Financeiro) — F-262/F-291/
// F-271/F-292, esteira 97-Esteiras/050, TASK-050-FE-00. Casca FINA sobre
// `CheckboxListField` (padrão `cerne`) — NÃO reimplementa o multi-select do
// zero; o componente já preserva ordem de seleção e já tem busca/contador/
// marcar-desmarcar-todos.
//
// A ORDEM do array `value` É A ORDEM das colunas no PDF/XLSX gerado pelo
// backend (`ReportViewModelData->columns`, preserva a ordem recebida do
// cliente) — este componente NUNCA ordena/reordena `value`, delega 100% do
// toggle para `CheckboxListField.handleToggle/handleToggleAll`.
//
// `catalog` é sempre um array LOCAL (fábrica de options client-side, ex.
// `expenseReportColumnOptions(languageGB)`), nunca um lookup remoto — por
// isso `isLoading`/`isError` são sempre `false` e a busca filtra o catálogo
// no CLIENTE (`searchValue` interno, case-insensitive).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { type SimpleGridProps } from '@chakra-ui/react';

import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';

import { columnsForm } from '@/constants/coluns-form';

export interface ReportColumnsFieldProps {
  label: string;
  catalog: CheckboxListItem<string>[];
  value: string[];
  onChange: (values: string[]) => void;
  columns?: SimpleGridProps['columns'];
  searchPlaceholder?: string;
  emptyMessage?: string;
  selectAllLabel?: string;
  deselectAllLabel?: string;
  /** Ícone de info ao lado do label (hover mostra o texto) — Lote 2
   *  (era `helperText` abaixo do campo; migrado para tooltip no label,
   *  repassado direto ao `CheckboxListField`). */
  tooltip?: string;
}

export function ReportColumnsField({
  label,
  catalog,
  value,
  onChange,
  columns = columnsForm.threeColumns,
  searchPlaceholder,
  emptyMessage,
  selectAllLabel,
  deselectAllLabel,
  tooltip,
}: ReportColumnsFieldProps) {
  const [searchValue, setSearchValue] = useState('');

  // Filtro CLIENT-SIDE — `catalog` é sempre um array local (fábrica de
  // options), nunca paginado/remoto (ver cabeçalho do arquivo).
  const items = useMemo(() => {
    if (!searchValue) return catalog;
    const term = searchValue.toLowerCase();
    return catalog.filter((item) => item.label.toLowerCase().includes(term));
  }, [catalog, searchValue]);

  return (
    <CheckboxListField
      label={label}
      tooltip={tooltip}
      items={items}
      selectedValues={value}
      onChange={onChange}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder={searchPlaceholder}
      selectAllLabel={selectAllLabel}
      deselectAllLabel={deselectAllLabel}
      // Reusa o próprio `label` (já traduzido pelo chamador) como prefixo
      // do contador — evita introduzir uma nova chave de i18n só para
      // este texto composto ("Colunas do Relatório: N").
      selectedCountLabel={label}
      emptyLabel={emptyMessage}
      isLoading={false}
      isError={false}
      columns={columns}
    />
  );
}
