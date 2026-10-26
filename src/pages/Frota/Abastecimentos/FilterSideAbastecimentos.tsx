// src/pages/Frota/Abastecimentos/FilterSideAbastecimentos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Abastecimentos (Supply) — Tarefa 40.
// Contrato B completo (`FilterModalProps<SupplyFilterForm>`, mirror
// `FilterSideAppropriations.tsx`), re-hidratação em `[isOpen]`.
//
// Campos (contrato de API §4 `SupplyFilterData`, mirror FM-01/02/03, FID-G3F
// §3): Equipamento (`SelectAsyncPaginate` + `listEquipmentCatalogOptions`,
// SEM filtro de família — FID-G3F D2) e Dt. início/Dt. fim (`DateInput`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { SupplyFilterForm } from '@/@types/v2/Supplies';

interface FilterFormValues {
  equipment_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  equipment_uuid: null,
  start_date: null,
  end_date: null,
};

interface FilterSideAbastecimentosProps extends FilterModalProps<SupplyFilterForm> {
  filtersApplied?: number;
}

export function FilterSideAbastecimentos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideAbastecimentosProps) {
  const text = languageGB.supplies.supply.list.filter;

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mirror
  // `FilterSideAppropriations.tsx`/`get_pwa_grid_query_pattern` §"Contrato B").
  useEffect(() => {
    if (!isOpen) return;
    reset({
      equipment_uuid: filter?.equipment_uuid
        ? { value: filter.equipment_uuid, label: filter.equipment_label ?? filter.equipment_uuid }
        : null,
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: SupplyFilterForm = {
      equipment_uuid: data.equipment_uuid?.value || undefined,
      equipment_label: data.equipment_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
    handleFilterChange(applied);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

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

          <Controller
            name="equipment_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.equipment}
                placeholder={text.equipmentPlaceholder}
                service={listEquipmentCatalogOptions}
                mapOptions={(item: EquipmentOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
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
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
