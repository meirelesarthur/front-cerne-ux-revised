// src/pages/Administrativo/Eventos/FilterSideEventos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Eventos — casca `<FilterSide>` +
// `<Form noPadding formFilter>` (Contrato B canônico, `FilterModalProps
// <EventFilterForm>`). Campos: `search` (mirror `FilterSideFuncoes`) +
// `is_enabled` (Select Todos/Ativo/Inativo, mirror `FilterSideFuncoes`) +
// `start_date`/`end_date` (par `DateInput`, mirror EXATO de
// `FilterSideParameterWeights.tsx` — única tela do projeto com esse padrão de
// período pronto).
//
// Rotulagem deliberada (contrato de tela §2): "Data de cadastro (de/até)",
// NÃO "período do evento" — o filtro é sobre `created_at`, não uma data de
// vigência do próprio Evento (Doc Bruta regra 9).
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (checklist item 1 do padrão do projeto).
// `is_enabled` SEMPRE `??`, nunca `||` (checklist item 19 — `false` é falsy).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { EventFilterForm } from '@/@types/v2/Events';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, as datas ficam nullable para o `DateInput` controlado; o submit
// converte tudo para o shape externo `EventFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  is_enabled: null,
  start_date: null,
  end_date: null,
};

export function FilterSideEventos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<EventFilterForm>) {
  // Var local de i18n renomeada p/ `filterText` — evita colisão com a prop
  // `filter` do Contrato B (`FilterModalProps<EventFilterForm>`).
  const filterText = languageGB.events.event.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  function toInternalValues(rawFilter?: EventFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: rawFilter?.is_enabled
        ? (enabledOptions.find((option) => option.value === rawFilter.is_enabled) ?? null)
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
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

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  // Validação client-side NÃO bloqueante (mirror `FilterSideParameterWeights`):
  // se ambos preenchidos, avisa quando `end_date < start_date` — comparação
  // lexicográfica válida para strings ISO `yyyy-MM-dd`. Não impede o submit.
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE [isOpen] (nunca `filter`, checklist item 1):
  // reagir a `filter` clobaria o que o usuário está digitando no drawer aberto.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      // `??`, NUNCA `||` — checklist item 19 (`false` é falsy e seria
      // descartado por `||`, quebrando o filtro "Inativo").
      is_enabled: (data.is_enabled?.value as EventFilterForm['is_enabled']) ?? undefined,
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

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isEnabled}
                placeholder={filterText.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.dateFrom}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
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
