// src/pages/CadastrosBase/EstagioReprodutivo/FilterSideEstagioReprodutivo.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Estágio Reprodutivo (mesma casca global
// <FilterSide> de FilterSideEspecies.tsx, ACRESCENTANDO um Select assíncrono
// de Espécie — padrão NOVO, nenhum precedente real no projeto usa
// `SelectAsyncPaginate` dentro de um drawer de filtro).
//
// Contrato real (TASK-CATYMT-01): search (Input, busca por `description`) +
// is_enabled (Select — Todos/Ativo/Inativo) + specie (SelectAsyncPaginate,
// server-side real via `specie_uuid`).
//
// O `paginatedQuery.filter` persistido guarda só `specie_uuid` (string crua,
// vai na querystring) — não guarda o `label`/description da Espécie. Por
// isso o `CategoryMatrixFilterForm` ganha um campo denormalizado
// `specie_label`, só de exibição, preenchido no submit a partir do `label` do
// Option escolhido — NUNCA enviado à API (ver category-matrix-service.ts).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listSpecies } from '@/services/v2/Species/species-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CategoryMatrixFilterForm } from '@/@types/v2/CategoryMatrices/category-matrix';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `CategoryMatrixFilterForm` (shape cru).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  specie: Option<string> | null; // { label: description, value: uuid } | null
}

export function FilterSideEstagioReprodutivo({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CategoryMatrixFilterForm>) {
  const text = languageGB.categoryMatrix.categoryMatrix.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    specie: null,
  };

  function toInternalValues(rawFilter?: CategoryMatrixFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      specie: rawFilter?.specie_uuid
        ? {
            value: rawFilter.specie_uuid,
            label: rawFilter.specie_label ?? rawFilter.specie_uuid,
          }
        : null,
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
      is_enabled: (data.is_enabled?.value as CategoryMatrixFilterForm['is_enabled']) || undefined,
      specie_uuid: data.specie?.value || undefined,
      specie_label: data.specie?.label || undefined, // display-only, NUNCA vai pra querystring
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

          <Controller
            name="specie"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.specie}
                placeholder={text.speciePlaceholder}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: 'true',
                })}
                value={field.value ?? null} // ⚠️ ARMADILHA #3 — NUNCA ?? undefined
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body} // ⚠️ ARMADILHA #2 — obrigatório dentro do Drawer/FilterSide
                menuPosition="fixed"
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
