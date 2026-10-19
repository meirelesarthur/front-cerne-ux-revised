// src/pages/Financeiro/ImportacaoMovBancarios/FilterSideImportacaoMovBancarios.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Importação Mov. Bancários — casca
// `<FilterSide>` + `<Form noPadding formFilter>` (Contrato B canônico,
// `FilterModalProps<MovementSheetFilterForm>`). Só `start_date`/`end_date`
// (par `DateInput`, mirror EXATO de `FilterSideCorrecaoEstoque.tsx`) — SEM
// `search` (a API não expõe busca textual nesta listagem,
// `MovementSheetFilterData` só tem `start_date`/`end_date`/`per_page`,
// contrato de API §7).
//
// Rotulagem (decisão 5, TASK-064-MOV-FE-01): filtro sobre `date` (Dt.
// Emissão do lote) — o formulário morto do legado (CLM-14) agora tem efeito
// real no Repository.
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (checklist item 1 do padrão do projeto).
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
import type { MovementSheetFilterForm } from '@/@types/v2/MovementSheets';

interface FilterFormValues {
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: null,
  end_date: null,
};

export function FilterSideImportacaoMovBancarios({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MovementSheetFilterForm>) {
  const filterText = languageGB.movementSheets.movementSheet.filter;

  function toInternalValues(rawFilter?: MovementSheetFilterForm | null): FilterFormValues {
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
  // lexicográfica válida para strings ISO `yyyy-MM-dd`. Não impede o submit
  // (o backend também valida via `after_or_equal:start_date`).
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE [isOpen] (nunca `filter`, checklist item 1).
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
