// src/pages/Administrativo/BaixaEstoque/FilterSideBaixaEstoque.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Baixa de Estoque — casca `<FilterSide>` +
// `<Form noPadding formFilter>` (Contrato B canônico, `FilterModalProps
// <StockWriteoffFilterForm>`). Só `start_date`/`end_date` (par `DateInput`,
// mirror EXATO `FilterSideCorrecaoEstoque.tsx`) — SEM `search`/`code` (a API
// não expõe busca textual nesta listagem, `StockWriteoffFilterForm` só tem
// `start_date`/`end_date`, contrato de tela §2.3).
//
// Rotulagem deliberada (contrato de tela §2.3): "Data de cadastro (de/até)",
// NÃO "data da baixa" — o filtro é sobre `created_at` (D7), não a `date` de
// referência da própria baixa.
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (Contrato B).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { StockWriteoffFilterForm } from '@/@types/v2/StockWriteoffs';

interface FilterFormValues {
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: null,
  end_date: null,
};

export function FilterSideBaixaEstoque({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<StockWriteoffFilterForm>) {
  const filterText = languageGB.stockWriteoffs.stockWriteoff.filter;

  function toInternalValues(rawFilter?: StockWriteoffFilterForm | null): FilterFormValues {
    return {
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  // Validação client-side NÃO bloqueante (mirror `FilterSideCorrecaoEstoque`):
  // se ambos preenchidos, avisa quando `end_date < start_date` — comparação
  // lexicográfica válida para strings ISO `yyyy-MM-dd`. Não impede o submit.
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE [isOpen] (nunca `filter`, Contrato B).
  useEffect(() => {
    if (!isOpen) return;

    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    });
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
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
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
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
