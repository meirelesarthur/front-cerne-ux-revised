// src/pages/BaseRegistrations/ParameterWeights/FilterSideParameterWeights.tsx
// Drawer de FILTRO da listagem de Parâmetros / Peso (search + período
// date_from/date_to). Casca `<FilterSide>` → `<Form noPadding formFilter>` →
// `Form.BodyFilter`/`Form.FooterFilter` — mirror exato de
// `FilterSideDiagnosisPregnancy.tsx` (re-hidratação/reset) combinado com o
// par `DateInput`+`Field` de `FilterSideFuncionarios.tsx`/
// `FilterSideInventario.tsx` (único precedente de `DateInput` em filtro).
//
// PRIMEIRA tela do projeto com filtro `date_from`/`date_to` funcional — não
// existe `DateRangePicker` pronto (`grep -rln "date_from" src/` → 0
// resultados antes desta Tarefa); a solução é 2 instâncias de `DateInput`
// (ISO string, standalone), cada uma envolvida por `<Field label="De"|"Até">`
// externo (o `DateInput` não tem wrapper de label próprio).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { ParameterWeightsFilterForm } from '@/@types/v2/BaseRegistrations/parameterWeights';

// Forma INTERNA do form (só deste componente) — datas nullable para o
// `DateInput` controlado; o submit converte `null`/'' para `undefined` no
// shape externo `ParameterWeightsFilterForm`.
interface FilterFormValues {
  search?: string;
  date_from: string | null;
  date_to: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  date_from: null,
  date_to: null,
};

export function FilterSideParameterWeights({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ParameterWeightsFilterForm>) {
  const filterText = languageGB.baseRegistrations.parameterWeight.filter;

  function toInternalValues(rawFilter?: ParameterWeightsFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      date_from: rawFilter?.date_from ?? null,
      date_to: rawFilter?.date_to ?? null,
    };
  }

  const { control, register, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const dateFrom = watch('date_from');
  const dateTo = watch('date_to');
  // Validação client-side NÃO bloqueante (contrato §3.3): se ambos
  // preenchidos, avisa quando `date_to < date_from` — comparação lexicográfica
  // válida para strings ISO `yyyy-MM-dd`. Não impede o submit.
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      date_from: data.date_from || undefined,
      date_to: data.date_to || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`, checklist item 1).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="date_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.dateFrom}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="date_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.dateTo}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {filterText.dateRangeInvalid}
            </Text>
          )}
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
