// src/pages/CadastrosBase/CategoriasAnimais/FilterSideCategoriasAnimais.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Categorias Animais — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">`). Mirror de composição real:
// `Produtos/Classes/FilterSideClasses.tsx` (precedente mais recente do fork a
// usar `formFilter`), `FilterModalProps` (isOpen/onClose/handleReset/
// handleFilterChange/filter/languageGB).
//
// Contrato real (`CategoryAnimal-Frontend-Contrato.md` §3.4): `search`
// (Input) + Espécie (`SelectAsyncPaginate` + `listSpecies`, envia
// `specie_uuid` — decisão do Maestro sobre GAP-FE-150, mirror
// `FilterSideRacas.tsx`) + `gender` (Select via `genderOptions.options`) +
// `is_enabled` (Select via `statusOptions`, reaproveitando a fábrica GLOBAL —
// decisão do Contrato §2, evita duplicar um array Ativa/Inativa local).
//
// Re-hidratação ao reabrir — mesmo padrão de `FilterSideFazendas.tsx`/
// `FilterSideRacas.tsx`/`FilterSideClasses.tsx`: um único `useEffect([isOpen])`
// reconstrói o form a partir de `filter` (`paginatedQuery.filter`).
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

import { statusOptions } from '@/constants/options/statusOptions';
import { genderOptions } from '@/constants/pecuaria/categoryAnimal/options/gender-options';

import { listSpecies } from '@/services/v2/Species/species-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CategoryAnimalFilterForm, CategoryAnimalGender } from '@/@types/v2/CategoryAnimals';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

// Forma INTERNA do form — os Selects trabalham com `Option`, o submit
// converte para `CategoryAnimalFilterForm` (strings cruas), mesmo padrão de
// `FilterSideFazendas.tsx`/`FilterSideRacas.tsx`/`FilterSideClasses.tsx`.
interface FilterFormValues {
  search: string;
  specie_uuid: Option<string> | null;
  gender: Option<CategoryAnimalGender> | null;
  is_enabled: Option<boolean> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  specie_uuid: null,
  gender: null,
  is_enabled: null,
};

export function FilterSideCategoriasAnimais({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CategoryAnimalFilterForm>) {
  const text = languageGB.categoryAnimals.categoryAnimal.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — reconstrói a partir de `filter`
  // (`paginatedQuery.filter`), único useEffect, deps `[isOpen]` (mesma
  // disciplina de `FilterSideFazendas.tsx`/`FilterSideRacas.tsx`/
  // `FilterSideClasses.tsx`: reagir a `filter` clobaria o que o usuário está
  // digitando com o drawer aberto).
  //
  // `specie_uuid`: `CategoryAnimalFilterForm` também persiste `specie_label`
  // (display-only), então a re-hidratação reconstrói o par `{ label, value }`
  // completo do `SelectAsyncPaginate` com o NOME da Espécie, sem precisar de
  // fetch novo. FALLBACK para o próprio uuid como label quando `specie_label`
  // não existir (mesmo padrão de `FilterSideRacas.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      search: filter?.search ?? '',
      specie_uuid: filter?.specie_uuid
        ? { value: filter.specie_uuid, label: filter.specie_label ?? filter.specie_uuid }
        : null,
      gender: filter?.gender ? genderOptions.getOption(filter.gender, languageGB) : null,
      is_enabled:
        filter?.is_enabled === 'true' || filter?.is_enabled === 'false'
          ? statusOptions.getOption(filter.is_enabled === 'true', languageGB)
          : null,
    });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: CategoryAnimalFilterForm = {
      search: data.search?.trim() || undefined,
      // Server-side (decisão do Maestro sobre GAP-FE-150) — vai à
      // querystring de /category-animals.
      specie_uuid: data.specie_uuid?.value || undefined,
      // DISPLAY-ONLY — só para re-hidratar o label no drawer; NUNCA enviado
      // à API.
      specie_label: data.specie_uuid?.label,
      gender: data.gender?.value || undefined,
      is_enabled: data.is_enabled
        ? (String(data.is_enabled.value) as CategoryAnimalFilterForm['is_enabled'])
        : undefined,
    };
    handleFilterChange(applied);
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
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="specie_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.specie}
                placeholder={text.specieAll}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (não `?? undefined`) — mantém o componente
                // CONTROLADO ao limpar (mesma correção de
                // `FilterSideRacas.tsx`, TASK-BREED-FILTER-CLEAR-FIX).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="gender"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.gender}
                placeholder={text.genderAll}
                name={name}
                value={value}
                onChange={onChange}
                options={genderOptions.options(languageGB)}
              />
            )}
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
                options={statusOptions.options(languageGB)}
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
            variant="outline"
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
