// src/pages/CadastrosBase/Vacinas/FilterSideVacinas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Vacinas (mesma casca global <FilterSide> de
// Racas/FilterSideRacas.tsx).
//
// Contrato real: search (Input, param `search`) + is_enabled (Select —
// Ativa/Inativa, param `is_enabled`) + Espécie (SelectAsyncPaginate,
// `listSpecies`) — o `specie.uuid` selecionado alimenta `specie_uuid` na
// querystring de `/vaccines` (filtro SERVER-SIDE), nunca `specie_id`.
//
// Contrato B canônico (`FilterModalProps<VaccineFilterForm>` — mesmo padrão de
// BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx e
// CadastrosBase/Racas/FilterSideRacas.tsx): re-hidratação via
// `toInternalValues(filter)` (prop, não mais `appliedFilter` local),
// `pristineFormValues`, par `handleResetFilters`/`handleResetFiltersOnClose` e
// `useEffect` com deps `[isOpen]`.
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
import type { SpeciesListItem } from '@/@types/v2/Species/species';
import type { VaccineFilterForm } from '@/@types/v2/Vaccines';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `VaccineFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  specie_uuid: Option<string> | null;
}

export function FilterSideVacinas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<VaccineFilterForm>) {
  const filterText = languageGB.vaccines.vaccine.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    specie_uuid: null,
  };

  function toInternalValues(rawFilter?: VaccineFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      specie_uuid: rawFilter?.specie_uuid
        ? { value: rawFilter.specie_uuid, label: rawFilter.specie_label ?? rawFilter.specie_uuid }
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as VaccineFilterForm['is_enabled']) || undefined,
      // Server-side — vai à querystring de /vaccines.
      specie_uuid: data.specie_uuid?.value || undefined,
      // DISPLAY-ONLY — só para re-hidratar o label no drawer; NUNCA enviado à
      // API (ver @types/v2/Vaccines / useVaccines.tsx).
      specie_label: data.specie_uuid?.label,
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
            name="specie_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.specie}
                placeholder={filterText.specieAll}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (NÃO `?? undefined`) — `handleResetFilters()` põe
                // `field.value = null`; com `undefined` o <AsyncPaginate> vira
                // NÃO-CONTROLADO e mantém a última seleção interna (mesmo fix
                // de FilterSideRacas.tsx).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // O Drawer.Body (overflow auto) recorta o menu não-portalizado.
                // Portaliza SÓ esta instância no <body>, fora do fluxo do
                // drawer, mantendo `position` no default "absolute" (mesmo fix
                // de FilterSideRacas.tsx).
                menuPortalTarget={document.body}
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
            color="semanticNeutral.900"
            height="4"
            marginTop="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
