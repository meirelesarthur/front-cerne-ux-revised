// src/pages/CadastrosBase/Racas/FilterSideRacas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Raças (mesma casca global <FilterSide> de
// CentroCusto/FilterSideCentroCusto.tsx e Perfil/FilterSidePerfil.tsx).
//
// Contrato real (TASK-BREED-FRONT-PAG): search (Input, param `search`) +
// is_enabled (Select — Ativa/Inativa, param `is_enabled`) + Espécie
// (SelectAsyncPaginate, `listSpecies`) — o `specie.uuid` selecionado agora
// alimenta `specie_uuid` na querystring de `/breeds` (filtro SERVER-SIDE,
// funciona corretamente combinado com paginação — ver `useBreeds.tsx`/
// `breed-service.ts`), nunca `specie_id`.
//
// Contrato B canônico (`FilterModalProps<BreedFilterForm>` — mesmo padrão de
// BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx):
// re-hidratação via `toInternalValues(filter)` (prop, não mais `appliedFilter`
// local), `pristineFormValues`, par `handleResetFilters`/
// `handleResetFiltersOnClose` e `useEffect` com deps `[isOpen]`.
//
// `specie_uuid` (TASK-BREED-FILTER-FIX — resolve a limitação PRAGMÁTICA
// anterior, mesma do `parent_uuid` em PlanAccount): `BreedFilterForm` também
// persiste `specie_label` (display-only, ver `breed.d.ts`), então
// `toInternalValues` reconstrói o par `{ label, value }` completo do
// `SelectAsyncPaginate` com o NOME da Espécie, sem precisar de fetch novo.
// FALLBACK para o próprio uuid como label quando `specie_label` não existir
// (compat com filtros já persistidos no localStorage antes deste fix).
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
import type { BreedFilterForm } from '@/@types/v2/Breeds/breed';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `BreedFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  specie_uuid: Option<string> | null;
}

export function FilterSideRacas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BreedFilterForm>) {
  const filterText = languageGB.breeds.breed.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    specie_uuid: null,
  };

  function toInternalValues(rawFilter?: BreedFilterForm | null): FilterFormValues {
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
      is_enabled: (data.is_enabled?.value as BreedFilterForm['is_enabled']) || undefined,
      // Server-side (TASK-BREED-FRONT-PAG) — vai à querystring de /breeds.
      specie_uuid: data.specie_uuid?.value || undefined,
      // DISPLAY-ONLY (TASK-BREED-FILTER-FIX) — só para re-hidratar o label no
      // drawer; NUNCA enviado à API (ver breed.d.ts / useBreeds.tsx).
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
                // TASK-BREED-FILTER-CLEAR-FIX: `?? null` (NÃO `?? undefined`).
                // `handleResetFilters()` põe `field.value = null`; se cair em
                // `undefined` aqui, o <AsyncPaginate> vira NÃO-CONTROLADO e
                // mantém a última seleção interna do react-select — o campo
                // Espécie parecia "não limpar" no botão Limpar. Com `null`
                // o componente permanece controlado e esvazia corretamente.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // TASK-BREED-FILTER-FIX — o Drawer.Body do FilterSide (overflow
                // auto) recorta o menu não-portalizado. Portaliza SÓ esta
                // instância no <body>, fora do fluxo do drawer.
                // TASK-BREED-FILTER-FIX-2 — NÃO passar `position="fixed"` aqui:
                // essa prop é injetada no style do menu INTERNO
                // (SelectComponent.ts → menu.position), não no wrapper do
                // portal. Com o menu portalizado, ele deve continuar
                // `position:absolute` (default) ancorado ao wrapper — forçar
                // "fixed" faz o `top:100%` virar 100% da viewport e o menu
                // abre fora da tela. `position` cai no default "absolute"
                // (SelectAsyncPaginate.tsx: position || "absolute").
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
            height="4"
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
