// src/pages/Operacional/Carregamento/FilterSideCharge.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Carregamentos — Contrato B canônico
// (`FilterModalProps<T>`), mirror `FilterSideRomaneios.tsx`/
// `FilterSideMarking.tsx`.
//
// 7 filtros reais (`ChargeIndexRequest::rules()`, filter_manifest FM-01..07,
// leitura direta do backend): Cliente, Responsável, Produto (todos
// `SelectAsyncPaginate`), Área (`SelectAsyncPaginate`, exige `farm_uuid` —
// mirror `listAreasForActiveFarm` de `FilterSideMarking.tsx`), Status
// (`Select` estático), Dt. Início/Dt. Fim (`DateInput`).
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

import { chargeStatusOptions } from '@/constants/carregamentos/charge/options';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ChargeFilterForm, ChargeStatus } from '@/@types/v2/Carregamentos';
import type { ProductOption } from '@/@types/v2/Products';
import type { UserListItem } from '@/@types/v2/Users';

interface FilterFormValues {
  client_uuid: Option<string> | null;
  user_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  status: Option<ChargeStatus> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  client_uuid: null,
  user_uuid: null,
  product_uuid: null,
  area_uuid: null,
  status: null,
  start_date: null,
  end_date: null,
};

export function FilterSideCharge({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ChargeFilterForm>) {
  const filterText = languageGB.carregamentos.charge.filter;
  const statusOptions = chargeStatusOptions.options(languageGB);
  const { activeFarmUuid } = useAuth();

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`) — injetado
  // via closure a partir da fazenda ativa, mirror `listAreasForActiveFarm`
  // de `FilterSideMarking.tsx`. Sem `search` — `ListAreasParams` real não
  // aceita busca textual (SEM MOCK de uma capacidade que a API não tem).
  function listAreasForActiveFarm(params: { page?: number; per_page?: number }) {
    return listAreas({
      page: params.page,
      per_page: params.per_page,
      farm_uuid: activeFarmUuid ?? '',
    });
  }

  function toInternalValues(rawFilter?: ChargeFilterForm | null): FilterFormValues {
    return {
      client_uuid: rawFilter?.client_uuid
        ? { value: rawFilter.client_uuid, label: rawFilter.client_label ?? rawFilter.client_uuid }
        : null,
      user_uuid: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
      product_uuid: rawFilter?.product_uuid
        ? {
            value: rawFilter.product_uuid,
            label: rawFilter.product_label ?? rawFilter.product_uuid,
          }
        : null,
      area_uuid: rawFilter?.area_uuid
        ? { value: rawFilter.area_uuid, label: rawFilter.area_label ?? rawFilter.area_uuid }
        : null,
      status: rawFilter?.status
        ? (statusOptions.find((option) => option.value === rawFilter.status) ?? null)
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      client_uuid: data.client_uuid?.value || undefined,
      client_label: data.client_uuid?.label,
      user_uuid: data.user_uuid?.value || undefined,
      user_label: data.user_uuid?.label,
      product_uuid: data.product_uuid?.value || undefined,
      product_label: data.product_uuid?.label,
      area_uuid: data.area_uuid?.value || undefined,
      area_label: data.area_uuid?.label,
      status: data.status?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
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
            {filterText.title}
          </Text>

          <Controller
            name="client_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.client}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
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
                label={filterText.user}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
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
            name="product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.product}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
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
            name="area_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.area}
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
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.status}
                placeholder={filterText.statusAll}
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
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />
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
