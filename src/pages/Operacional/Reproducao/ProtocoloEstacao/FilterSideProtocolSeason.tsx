// src/pages/Operacional/Reproducao/ProtocoloEstacao/FilterSideProtocolSeason.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Protocolos/Estação — Contrato B canônico
// (`FilterModalProps<T>`, seis props exatas), corpo em `<Form noPadding
// formFilter>`.
//
// Filtros: Nome (Input texto), Responsável (Select PLANO via
// `listBreedingSeasonUserOptions` — endpoint sem paginação, molde
// `EstacaoDeMonta/FilterSideEstacaoDeMonta.tsx`) e Estação de Monta
// (`SelectAsyncPaginate` via `listBreedingSeasons` — molde
// `CreateOrUpdateProtocolSeason.tsx`), além das datas já existentes.
//
// Os selects guardam `Option<string>` no estado do filtro (re-hidratação do
// label); a conversão para `.value` cru acontece no `index.tsx` antes de
// chamar o service (mirror `FeedlotSectors`).
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (get_pwa_grid_query_pattern, Contrato B).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { queryKey } from '@/constants/query-key';

import {
  listBreedingSeasonUserOptions,
  listBreedingSeasons,
} from '@/services/v2/BreedingSeasons/breeding-season-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BreedingSeasonListItem } from '@/@types/v2/BreedingSeasons';
import type { ProtocolSeasonFilterForm } from '@/@types/v2/Operacional/Reproducao/protocolSeason';

interface FilterFormValues {
  name: string;
  user_uuid: Option<string> | null;
  breeding_season_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  name: '',
  user_uuid: null,
  breeding_season_uuid: null,
  start_date: null,
  end_date: null,
};

// Estação de Monta: normalização do termo digitado + mapeamento uuid+label,
// mirror `CreateOrUpdateProtocolSeason.tsx` (`listBreedingSeasons` paginado).
function mapBreedingSeasonOption(item: BreedingSeasonListItem): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export function FilterSideProtocolSeason({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ProtocolSeasonFilterForm>) {
  const text = languageGB.protocolSeasons.protocolSeason.list.filter;

  // Responsável: `user-options` é PLANO (sem paginação) — `Select` + `useQuery`,
  // NUNCA `SelectAsyncPaginate` (mesmo pool de responsáveis do módulo).
  const userOptionsQuery = useQuery({
    queryKey: [queryKey.protocolSeasons.protocolSeason, 'user-options'],
    queryFn: listBreedingSeasonUserOptions,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const userOptions: Option<string>[] = (userOptionsQuery.data ?? []).map((item) => ({
    label: item.name,
    value: item.uuid,
  }));

  function toInternalValues(rawFilter?: ProtocolSeasonFilterForm | null): FilterFormValues {
    return {
      name: rawFilter?.name ?? '',
      user_uuid: rawFilter?.user_uuid ?? null,
      breeding_season_uuid: rawFilter?.breeding_season_uuid ?? null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      name: data.name.trim() || null,
      user_uuid: data.user_uuid ?? null,
      breeding_season_uuid: data.breeding_season_uuid ?? null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.name} placeholder={text.namePlaceholder} {...register('name')} />

          <Controller
            name="user_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={text.responsible}
                options={userOptions}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                loading={userOptionsQuery.isLoading}
              />
            )}
          />

          <Controller
            name="breeding_season_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.breedingSeason}
                service={listBreedingSeasons}
                pageSize={200}
                mapOptions={mapBreedingSeasonOption as any}
                findParams={findParamsFromSearch}
                // `null` (nunca `undefined`) para o "Limpar filtros" esvaziar de
                // forma controlada — react-select trata `undefined` como
                // não-controlado e manteria a seleção (SelectAsyncPaginate.tsx:54).
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} placeholder={text.startDate} />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} placeholder={text.endDate} />
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}

export default FilterSideProtocolSeason;
