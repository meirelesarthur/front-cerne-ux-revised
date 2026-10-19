// src/pages/Operacional/Marcacao/FilterSideMarking.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Marcação — Contrato B canônico
// (`FilterModalProps<T>`), mirror `FilterSideAppropriations.tsx`/
// `FilterSideWeaning.tsx`.
//
// 9 filtros reais (`MarkingFilterData` confirmado por leitura direta do
// `api_root` — NÃO os 9 assumidos originalmente pela arquitetura front, que
// incluíam `farm_uuid`; o filtro por fazenda foi DELIBERADAMENTE não
// reintroduzido, `GAP-MC-02`/`DEC-070`): Área, Safra, Variedade, Responsável
// (todos `SelectAsyncPaginate`), Status, Cor (`Select` estático), Data
// inicial/Data final (`DateInput`), Semana (`Input` numérico).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useAuth } from '@/hooks/useAuth';

import type { MarkingStatusValue } from '@/constants/marcacao/marking/marking-status';
import { markingColorOptions } from '@/constants/marcacao/marking/options/marking-color-options';
import { markingStatusOptions } from '@/constants/marcacao/marking/options/marking-status-options';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { CultivationOption } from '@/@types/v2/Cultivation/cultivation';
import type { Harvest } from '@/@types/v2/Harvests';
import type { MarkingFilterForm } from '@/@types/v2/Marcacao/marking';
import type { UserListItem } from '@/@types/v2/Users';

interface FilterFormValues {
  area_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  variety_uuid: Option<string> | null;
  user_uuid: Option<string> | null;
  status: Option<MarkingStatusValue> | null;
  color: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  week: string;
}

const pristineFormValues: FilterFormValues = {
  area_uuid: null,
  harvest_uuid: null,
  variety_uuid: null,
  user_uuid: null,
  status: null,
  color: null,
  start_date: null,
  end_date: null,
  week: '',
};

export function FilterSideMarking({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MarkingFilterForm>) {
  const text = languageGB.marcacao.marking.filter;
  const { activeFarmUuid } = useAuth();

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`) — injetado
  // via closure a partir da fazenda ativa, mirror `listAreasForActiveFarm`
  // de `FilterSideAppropriations.tsx`. Sem `search` — `ListAreasParams` real
  // não aceita busca textual (SEM MOCK de uma capacidade que a API não tem).
  function listAreasForActiveFarm(params: { page?: number; per_page?: number }) {
    return listAreas({
      page: params.page,
      per_page: params.per_page,
      farm_uuid: activeFarmUuid ?? '',
    });
  }

  function toInternalValues(rawFilter?: MarkingFilterForm | null): FilterFormValues {
    return {
      area_uuid: rawFilter?.area_uuid
        ? { value: rawFilter.area_uuid, label: rawFilter.area_label ?? rawFilter.area_uuid }
        : null,
      harvest_uuid: rawFilter?.harvest_uuid
        ? {
            value: rawFilter.harvest_uuid,
            label: rawFilter.harvest_label ?? rawFilter.harvest_uuid,
          }
        : null,
      variety_uuid: rawFilter?.variety_uuid
        ? {
            value: rawFilter.variety_uuid,
            label: rawFilter.variety_label ?? rawFilter.variety_uuid,
          }
        : null,
      user_uuid: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
      status: rawFilter?.status
        ? markingStatusOptions.getOption(rawFilter.status, languageGB)
        : null,
      color: rawFilter?.color ? markingColorOptions.getOption(rawFilter.color, languageGB) : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
      week: rawFilter?.week != null ? String(rawFilter.week) : '',
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const parsedWeek = data.week.trim() ? Number(data.week.trim()) : undefined;
    handleFilterChange({
      area_uuid: data.area_uuid?.value || undefined,
      area_label: data.area_uuid?.label,
      harvest_uuid: data.harvest_uuid?.value || undefined,
      harvest_label: data.harvest_uuid?.label,
      variety_uuid: data.variety_uuid?.value || undefined,
      variety_label: data.variety_uuid?.label,
      user_uuid: data.user_uuid?.value || undefined,
      user_label: data.user_uuid?.label,
      status: data.status?.value ?? null,
      color: data.color?.value ?? null,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      week: parsedWeek != null && !Number.isNaN(parsedWeek) ? parsedWeek : null,
    } as MarkingFilterForm);
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

          <Controller
            name="area_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.area}
                service={listAreasForActiveFarm}
                mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
                findParams={() => ({})}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="harvest_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.harvest}
                service={listHarvestOptions}
                mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="variety_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.variety}
                service={listCultivationOptions}
                mapOptions={(item: CultivationOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="user_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.user}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
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
                name={name}
                value={value}
                onChange={onChange}
                options={markingStatusOptions.options(languageGB)}
              />
            )}
          />

          <Controller
            name="color"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.color}
                name={name}
                value={value}
                onChange={onChange}
                options={markingColorOptions.options(languageGB)}
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

          <Input type="number" min={1} label={text.week} {...register('week')} />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
