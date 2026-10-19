// src/pages/Operacional/FeedlotYards/FilterSideFeedlotYards.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pátios (mesma casca global <FilterSide> de
// CentroCusto/FilterSideCentroCusto.tsx — sibling estrutural PRIMÁRIO).
//
// Contrato B (`FilterModalProps<FeedlotYardFilterForm>`, seis props exatas).
// Campos: `code` (text), `name` (text), `is_active` (Select Sim/Não via
// `feedlotYardStatusOptions`). Re-hidratação por `[isOpen]` (não `[filter]`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { feedlotYardStatusOptions } from '@/constants/FeedlotYards/options/feedlot-yard-status-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FeedlotYardFilterForm } from '@/@types/v2/FeedlotYards';

interface FilterSideFeedlotYardsProps extends FilterModalProps<FeedlotYardFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — `is_active` trabalha com
// `Option<boolean>` (o próprio contrato de `FeedlotYardFilterForm`), o
// submit converte para `FeedlotYardFilterRequest` (boolean cru) no
// `handleFilterChange`.
interface FilterFormValues {
  code: string;
  name: string;
  is_active: Option<boolean> | null;
}

export function FilterSideFeedlotYards({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideFeedlotYardsProps) {
  const text = languageGB.feedlotYards.feedlotYard.filter;
  const statusOptions = feedlotYardStatusOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    code: '',
    name: '',
    is_active: null,
  };

  function toInternalValues(rawFilter?: FeedlotYardFilterForm | null): FilterFormValues {
    return {
      code: rawFilter?.code ?? '',
      name: rawFilter?.name ?? '',
      is_active: rawFilter?.is_active ?? null,
    };
  }

  const { register, control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    // `FeedlotYardFilterForm.is_active` guarda o `Option<boolean>` INTEIRO
    // (mesmo contrato do estado do `paginatedQuery.filter`) — a conversão
    // para o `boolean` cru do `FeedlotYardFilterRequest` acontece só no
    // ponto de chamada do serviço (`index.tsx`, `useFeedlotYardsList`).
    handleFilterChange({
      code: data.code.trim() || undefined,
      name: data.name.trim() || undefined,
      is_active: data.is_active ?? undefined,
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
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.code} placeholder={text.codePlaceholder} {...register('code')} />

          <Input label={text.name} placeholder={text.namePlaceholder} {...register('name')} />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isActive}
                placeholder={text.isActiveAll}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
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
