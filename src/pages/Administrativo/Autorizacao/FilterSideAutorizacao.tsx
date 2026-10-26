// src/pages/Administrativo/Autorizacao/FilterSideAutorizacao.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Autorização (TASK-AUTH-FE-02) — Contrato B
// (`FilterModalProps<RequestAuthorizationFilterForm>`), 5 campos APENAS
// (`search`/`type`/`status`/`start_date`/`end_date`, mirror `RequestAuthorizationFilterData`
// real) — molde ENXUTO de `FilterSideSolicitacao.tsx`, NÃO os 4 campos de
// relação daquele componente (`farm_uuid`/`user_uuid`/`priority`/
// `responsible_uuid`, fora do filtro real desta fila).
//
// `status` usa a fábrica RESTRITA de `TASK-AUTH-FE-01`
// (`requestAuthorizationStatusOptions`, subconjunto {3,4,11}, BR-01);
// `type` usa `requestPurchaseTypeOptions` (reuso, todos os 11 tipos — sem
// restrição, mirror legado).
//
// Mesma casca de `FilterSideSolicitacao.tsx` (`<Form formFilter>`,
// `Form.BodyFilter`/`Form.FooterFilter`, RE-HIDRATA via
// `useEffect([isOpen])` — NUNCA `<VStack as="form">` cru).
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

import { requestAuthorizationStatusOptions } from '@/constants/RequestAuthorizations/options/request-authorization-status-options';
import { requestPurchaseTypeOptions } from '@/constants/RequestPurchases/options/request-purchase-type-options';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { RequestAuthorizationFilterForm } from '@/@types/v2/RequestAuthorizations';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `RequestAuthorizationFilterForm` (strings/
// números crus), mirror `FilterSideSolicitacao.tsx`.
interface FilterFormValues {
  search?: string;
  type: Option<RequestPurchaseType> | null;
  status: Option<RequestPurchaseStatus> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  type: null,
  status: null,
  start_date: null,
  end_date: null,
};

export function FilterSideAutorizacao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<RequestAuthorizationFilterForm>) {
  const text = languageGB.requestAuthorizations.requestAuthorization;
  const typeOptions = requestPurchaseTypeOptions.options(languageGB);
  const statusOptions = requestAuthorizationStatusOptions.options(languageGB);

  function toInternalValues(rawFilter?: RequestAuthorizationFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      status: statusOptions.find((option) => option.value === rawFilter?.status) ?? null,
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

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      type: (data.type?.value as RequestAuthorizationFilterForm['type']) || undefined,
      status: data.status?.value ?? undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.filter.title}
          </Text>

          <Input
            label={text.filter.search}
            placeholder={text.filter.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.filter.type}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.filter.status}
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
              <Field label={text.filter.dateFrom}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.filter.dateTo}>
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
