// src/pages/Operacional/Diet/DietBeat/FilterSideDietBeat.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Batida (DietBeat — Operacional/Pecuária,
// TASK-FE-DIET-05). Contrato B canônico de filtro — `<Form formFilter>`,
// seis props exatas, re-hidratação em `[isOpen]`. Mirror
// `FilterSideFoodBeat.tsx` (o `FoodBeatFilterForm` interno já é
// `Option`-based; aqui a forma EXTERNA `DietBeatFilterForm`
// (`@/@types/v2/DietBeats`) é FLAT (strings cruas, `?equipment_uuid/?date/
// ?diet_uuid`), então este componente declara um `FilterFormValues` interno
// `Option`-based e CONVERTE no submit — mirror `FilterSideDiet.tsx`/
// `FilterSideFabrica.tsx`).
//
// Campos (FM-DB-01..03): `equipment_id` (SelectAsyncPaginate,
// `listEquipmentCatalogOptions` — GAP-DIET-FE-01, reuso do endpoint
// genérico `/equipments/options`, SEM filtro de feature DIETBEAT — já
// registrado, sem improviso), `date`, `diet_id` (SelectAsyncPaginate
// `listDietOptionsPaginated`, `/diets/diet-options`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listDietOptionsPaginated } from '@/services/v2/Diets/diet-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { DietBeatFilterForm } from '@/@types/v2/DietBeats';
import type { EquipmentOption } from '@/@types/v2/Equipments';

function mapEquipmentOption(item: EquipmentOption) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapDietOption(item: Option<string>) {
  return { label: item.label, value: item.value };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `DietBeatFilterForm` (strings cruas).
interface FilterFormValues {
  equipment_id: Option<string> | null;
  diet_id: Option<string> | null;
  date: string;
}

export function FilterSideDietBeat({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DietBeatFilterForm>) {
  const filterText = languageGB.dietBeats.dietBeat.filter;

  const pristineFormValues: FilterFormValues = {
    equipment_id: null,
    diet_id: null,
    date: '',
  };

  // Sem `*_label` companion persistido (mesma limitação aceita de
  // `FilterSideFabrica.tsx`) — ao reabrir o drawer com filtro já aplicado,
  // os Selects assíncronos reabrem vazios; `date` re-hidrata normalmente.
  function toInternalValues(rawFilter?: DietBeatFilterForm | null): FilterFormValues {
    return {
      equipment_id: null,
      diet_id: null,
      date: rawFilter?.date ?? '',
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      equipment_uuid: data.equipment_id?.value || undefined,
      diet_uuid: data.diet_id?.value || undefined,
      date: data.date || undefined,
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

  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="equipment_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.equipment}
                placeholder={filterText.equipmentPlaceholder}
                service={listEquipmentCatalogOptions}
                mapOptions={mapEquipmentOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="diet_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.diet}
                placeholder={filterText.dietPlaceholder}
                service={listDietOptionsPaginated}
                mapOptions={mapDietOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={filterText.date}
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
