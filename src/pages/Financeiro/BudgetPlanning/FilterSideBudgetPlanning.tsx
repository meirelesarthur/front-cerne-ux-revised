// src/pages/Financeiro/BudgetPlanning/FilterSideBudgetPlanning.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Prev. Orçamentária (BudgetPlanning — F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-06) — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>`, Contrato B do
// filtro (`get_pwa_grid_query_pattern`) — SEIS props exatas
// (`FilterModalProps<BudgetPlanningFilterRequest>`, não ampliar o tipo).
//
// Mirror estrutural de `Financeiro/Congelamentos/FilterSideCongelamentos.tsx`
// (mesmo par Select + re-hidratação em `[isOpen]`) — aqui SÓ o campo `year`:
// contrato de tela §6 ("sem outro filtro" — `BudgetPlanningIndexRequest` só
// aceita `year`, mirror fiel do legado que não tinha `filter_manifest` de UI).
// NÃO adicionar campo de filtro que a API rejeita (risco documentado na
// Tarefa).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';

import { budgetPlanningYearFilterOptions } from '@/constants/financeiro/budgetPlanning/options/year-filter-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type {
  BudgetPlanningFilterForm,
  BudgetPlanningFilterRequest,
} from '@/@types/v2/Financeiro/budgetPlanning';

const pristineFormValues: BudgetPlanningFilterForm = {
  year: null,
};

// Janela fixa (ano corrente −5..+1, `TASK-PO-FE-03`) — sem tradução aplicável
// (rótulo = o próprio ano), calculada 1x por módulo (mirror do racional de
// `financialFreezeMonthOptions`, mas sem dependência de `languageGB`).
const yearOptions = budgetPlanningYearFilterOptions();

function toInternalValues(
  rawFilter?: BudgetPlanningFilterRequest | null
): BudgetPlanningFilterForm {
  if (rawFilter?.year == null) return { year: null };

  return {
    year: yearOptions.find((option) => option.value === rawFilter.year) ?? {
      label: String(rawFilter.year),
      value: rawFilter.year,
    },
  };
}

export function FilterSideBudgetPlanning({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BudgetPlanningFilterRequest>) {
  const text = languageGB.financial.budgetPlanning.list.filter;

  const { control, handleSubmit, reset } = useForm<BudgetPlanningFilterForm>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação SOMENTE em `[isOpen]` — mirror `FilterSideCongelamentos.tsx`
  // / `FilterSideDepreciacao.tsx`. Reagir a `[filter]` apagaria o que o
  // usuário está escolhendo dentro do drawer aberto.
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: BudgetPlanningFilterForm) {
    handleFilterChange({ year: data.year?.value ?? undefined });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Controller
            name="year"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.yearLabel}
                name={name}
                value={value}
                onChange={onChange}
                options={yearOptions}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={text.clearButton}
            variant="ghost"
            p="0"
            color="semanticNeutral.900"
            height="4"
            marginTop="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={onClose}
            type="button"
          />
          <Button title={text.filterButton} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
