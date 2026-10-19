// src/pages/CadastrosBase/Embalagens/FilterSideEmbalagens.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Embalagens — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">`). Mirror de composição real:
// `Classes/FilterSideClasses.tsx` (precedente mais recente de catálogo
// simples com filtro server-side por FK).
//
// Contrato real (`Package-Frontend-Contrato.md` §3.4): `search` (Input) +
// `measurement_uuid` (SelectAsyncPaginate via `listMeasurements`, JÁ
// EXISTENTE — sem endpoint `/measurements/active` dedicado, Measurement não
// tem `is_enabled`). SEM campo `is_enabled`/status (Package não tem esse
// conceito).
//
// Re-hidratação ao reabrir — mesmo padrão de `FilterSideClasses.tsx`: um
// único `useEffect([isOpen])` reconstrói o form a partir de `filter`
// (`paginatedQuery.filter`), incluindo o padrão de `measurement_label`
// display-only para re-hidratar o label sem novo fetch.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { PackageFilterForm } from '@/@types/v2/Packages';

// GET /measurements/options é FLAT (catálogo global, `meta` sempre `null`) —
// `pageSize` MAIOR que o volume real evita 2ª página fantasma. Constante
// LOCAL própria deste arquivo (mesma decisão de
// CreateOrUpdateEmbalagem.tsx — não importar entre módulos por uma constante
// trivial).
const FLAT_CATALOG_PAGE_SIZE = 200;

// Forma INTERNA do form — o Select trabalha com `Option`, o submit converte
// para `PackageFilterForm` (strings cruas), mesmo padrão de
// `FilterSideClasses.tsx`.
interface FilterFormValues {
  search: string;
  measurement_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  measurement_uuid: null,
};

export function FilterSideEmbalagens({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<PackageFilterForm>) {
  const text = languageGB.packages.package.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — reconstrói a partir de `filter`
  // (`paginatedQuery.filter`), único useEffect, deps `[isOpen]` (mesma
  // disciplina de `FilterSideClasses.tsx`: reagir a `filter` clobaria o que
  // o usuário está digitando com o drawer aberto).
  //
  // `measurement_uuid`: `PackageFilterForm` também persiste
  // `measurement_label` (display-only), então a re-hidratação reconstrói o
  // par `{ label, value }` completo do `SelectAsyncPaginate` com o NOME da
  // Unidade de Medida, sem precisar de fetch novo. FALLBACK para o próprio
  // uuid como label quando `measurement_label` não existir.
  useEffect(() => {
    if (!isOpen) return;
    reset({
      search: filter?.search ?? '',
      measurement_uuid: filter?.measurement_uuid
        ? {
            value: filter.measurement_uuid,
            label: filter.measurement_label ?? filter.measurement_uuid,
          }
        : null,
    });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      measurement_uuid: data.measurement_uuid?.value || undefined,
      // DISPLAY-ONLY — só para re-hidratar o label no drawer; NUNCA enviado
      // à API (ver Packages/index.d.ts / usePackages.tsx).
      measurement_label: data.measurement_uuid?.label,
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
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="measurement_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.measurement}
                placeholder={text.measurementAll}
                service={listMeasurementOptions}
                pageSize={FLAT_CATALOG_PAGE_SIZE}
                mapOptions={(item: MeasurementOption) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (não `?? undefined`) — mantém o componente
                // CONTROLADO ao limpar (mesma correção de
                // `FilterSideClasses.tsx`).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
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
