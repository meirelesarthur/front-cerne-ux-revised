// src/pages/Operacional/Appropriations/FilterSideAppropriations.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Apontamentos (Appropriation) — TASK-FE-2706.
// Contrato B completo (`FilterModalProps<T>`, 6 props exatas), re-hidratação
// em `[isOpen]` — mirror `FilterSidePlanos.tsx`/`FilterSideInventario.tsx`.
//
// 3 filtros do contrato de tela: Área (`SelectAsyncPaginate`, `listAreas` —
// exige `farm_uuid`, injetado via closure a partir da fazenda ativa, mirror
// `listAreasForActiveFarm` de `InvoiceItemsTab.tsx`), Dt. início/Dt. fim
// (`DateInput`, mirror `FilterSideInventario.tsx` para o padrão de range de
// data). Status (bulk, 3 opções fixas) incluído como filtro adicional — o
// service (`AppropriationFilterData`) já aceita `status`, sem custo extra.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useAuth } from '@/hooks/useAuth';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AppropriationFilterForm, AppropriationStatusValue } from '@/@types/v2/Appropriations';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';

interface FilterFormValues {
  area_uuid: Option<string> | null;
  status: Option<AppropriationStatusValue> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  area_uuid: null,
  status: null,
  start_date: null,
  end_date: null,
};

interface FilterSideAppropriationsProps extends FilterModalProps<AppropriationFilterForm> {
  filtersApplied?: number;
}

export function FilterSideAppropriations({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideAppropriationsProps) {
  const text = languageGB.appropriations.appropriation.list.filter;
  const legend = languageGB.appropriations.appropriation.list.statusLegend;
  const { activeFarmUuid } = useAuth();

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`) — injetado
  // via closure a partir da fazenda ativa, mirror `listAreasForActiveFarm`
  // de `Invoices/InvoiceItemsTab.tsx`.
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  const statusOptions: Option<AppropriationStatusValue>[] = [
    { value: 'O', label: legend.opened },
    { value: 'F', label: legend.finished },
    { value: 'A', label: legend.appropriated },
  ];

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mirror
  // `FilterSideInventario.tsx`/`FilterSidePlanos.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      area_uuid: filter?.area_uuid
        ? { value: filter.area_uuid, label: filter.area_label ?? filter.area_uuid }
        : null,
      status: filter?.status
        ? (statusOptions.find((option) => option.value === filter.status) ?? null)
        : null,
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: AppropriationFilterForm = {
      area_uuid: data.area_uuid?.value || undefined,
      area_label: data.area_uuid?.label,
      status: data.status?.value || undefined,
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
            name="area_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.area}
                placeholder={text.areaPlaceholder}
                service={listAreasForActiveFarm}
                mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
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
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.status}
                placeholder={text.statusAll}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
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
