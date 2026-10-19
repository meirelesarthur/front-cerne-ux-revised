// src/pages/Administrativo/Recebimentos/FilterSideRecebimentos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Recebimentos (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-01).
// Contrato B (`FilterModalProps<RequestReceiptFilterForm>`), 8 campos
// (FM-01..08): `search` + `status` (fábrica restrita {7,8,9}) +
// `start_date`/`end_date` + `user_uuid` (solicitante) + `farm_uuid` +
// `type` (reuso `requestPurchaseTypeOptions`, 11 valores) +
// `responsible_uuid` — mirror EXATO de `FilterSideSolicitacao.tsx`
// (`Administrativo/Solicitacao`), adaptado ao subconjunto de status/campos
// de Recebimentos.
//
// Mesma casca `<Form formFilter>` (`Form.BodyFilter`/`Form.FooterFilter`),
// RE-HIDRATA via `useEffect([isOpen])` — NUNCA `<VStack as="form">` cru.
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

import { requestPurchaseTypeOptions } from '@/constants/RequestPurchases/options/request-purchase-type-options';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';
import { requestReceiptStatusOptions } from '@/constants/RequestReceipts/options/request-receipt-status-options';

// `listFarms` de `farm-admin-service.ts` (CRUD administrativo, `GET /farms`,
// paginado REAL) — mirror `FilterSideSolicitacao.tsx`.
import { listFarms as listFarmOptions } from '@/services/v2/Farms/farm-admin-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FarmDetail } from '@/@types/v2/Farms/farm-admin';
import type { RequestReceiptFilterForm } from '@/@types/v2/RequestReceipts';
import type { UserListItem } from '@/@types/v2/Users';

interface FilterFormValues {
  search?: string;
  status: Option<RequestPurchaseStatus> | null;
  start_date: string | null;
  end_date: string | null;
  user_uuid: Option<string> | null;
  farm_uuid: Option<string> | null;
  type: Option<RequestPurchaseType> | null;
  responsible_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  status: null,
  start_date: null,
  end_date: null,
  user_uuid: null,
  farm_uuid: null,
  type: null,
  responsible_uuid: null,
};

export function FilterSideRecebimentos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<RequestReceiptFilterForm>) {
  const text = languageGB.requestReceipts.requestReceipt.filter;
  const statusOptions = requestReceiptStatusOptions.options(languageGB);
  const typeOptions = requestPurchaseTypeOptions.options(languageGB);

  function toInternalValues(rawFilter?: RequestReceiptFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      status: statusOptions.find((option) => option.value === rawFilter?.status) ?? null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
      user_uuid: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
      farm_uuid: rawFilter?.farm_uuid
        ? { value: rawFilter.farm_uuid, label: rawFilter.farm_label ?? rawFilter.farm_uuid }
        : null,
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      responsible_uuid: rawFilter?.responsible_uuid
        ? {
            value: rawFilter.responsible_uuid,
            label: rawFilter.responsible_label ?? rawFilter.responsible_uuid,
          }
        : null,
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

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      status: data.status?.value ?? undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      user_uuid: data.user_uuid?.value || undefined,
      user_label: data.user_uuid?.label,
      farm_uuid: data.farm_uuid?.value || undefined,
      farm_label: data.farm_uuid?.label,
      type: data.type?.value || undefined,
      responsible_uuid: data.responsible_uuid?.value || undefined,
      responsible_label: data.responsible_uuid?.label,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`).
  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.status}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.type}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateFrom}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateTo}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
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
            name="farm_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.farm}
                service={listFarmOptions}
                mapOptions={(item: FarmDetail) => ({ label: item.description, value: item.uuid })}
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
            name="responsible_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.responsible}
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
