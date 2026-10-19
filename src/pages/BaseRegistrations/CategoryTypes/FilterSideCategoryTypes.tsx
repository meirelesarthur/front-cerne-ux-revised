// src/pages/BaseRegistrations/CategoryTypes/FilterSideCategoryTypes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Tipos de Categoria — casca padronizada
// <FilterSide> + <Form formFilter>/<Form.BodyFilter>/<Form.FooterFilter>
// (mesmo padrão canônico de FilterSideDiagnosisPregnancy.tsx e
// FilterSideFazendas.tsx).
//
// Contrato real (TASK-CTY-01): search (Input, busca por `description`) +
// is_enabled (Select — Todos/Ativo/Inativo). SEM filtro de `do_movement`
// (não existe em CategoryType) — molde é FilterSideMotivosBaixa.tsx REMOVENDO
// o segundo Controller/Select de `do_movement`.
//
// RE-HIDRATAÇÃO (Contrato B — pristineFormValues + toInternalValues(filter)):
// prop `filter` (o index.tsx passa `filter={paginatedQuery.filter}`) +
// `useEffect` com deps `[isOpen]` APENAS (nunca `[filter]` sozinho — evitaria
// reset no meio de uma edição do usuário enquanto o drawer está aberto). Ao
// abrir (`isOpen === true`), reconstrói os campos do form a partir de
// `filter` — `search` direto (string), `is_enabled` convertido de volta
// para `Option<string> | null` via `find` na opção estática.
//
// Nenhum select assíncrono neste módulo (`is_enabled` é `Select` Chakra
// estático) — o requisito de "aplicar `_label` só se houver async" da
// checklist não se aplica aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CategoryTypeFilterForm } from '@/@types/v2/CategoryTypes';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `CategoryTypeFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
}

export function FilterSideCategoryTypes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CategoryTypeFilterForm>) {
  const text = languageGB.baseRegistrations.categoryType.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: CategoryTypeFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as CategoryTypeFilterForm['is_enabled']) || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
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
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            height="4"
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
