// src/pages/BaseRegistrations/Contratantes/FilterSideContratantes.tsx
// Drawer de FILTRO da listagem de Contratantes — TASK-072-FE-07 (I10), filtros
// do legado `tenants/index.blade.php` sobre o contrato real `TenantIndexRequest`
// (API v1.2): search, status, assinatura, mês de vigência, dia de vencimento,
// data de adesão, período de criação (de/até), atribuição e plano.
//
// Contrato B canônico (`FilterModalProps<TenantsFilterForm>`, seis props):
// re-hidratação por `toInternalValues(filter)` (mapper puro) num `useEffect`
// com deps `[isOpen]` (nunca `[filter]`), `pristineFormValues`, "limpar" não
// fecha o drawer, "cancelar" restaura o aplicado e fecha. Validação
// (`end_date >= start_date`, limite do `search`) pelo schema do módulo.

import { useEffect, useMemo } from 'react';

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

import {
  TENANT_FILTER_SEARCH_MAX_LENGTH,
  tenantFilterPristineValues,
  toFilterRequest,
  toInternalValues,
} from '@/constants/BaseRegistrations/mappers/tenant-filter-mapper';
import { tenantDueDayOptions } from '@/constants/BaseRegistrations/options/tenant-due-day-options';
import { tenantDueMonthOptions } from '@/constants/BaseRegistrations/options/tenant-due-month-options';
import { tenantSignatureOptions } from '@/constants/BaseRegistrations/options/tenant-signature-options';
import { tenantStatusOptions } from '@/constants/BaseRegistrations/options/tenant-status-options';

import { tenantFilterSchemaResolver } from '@/validations/schemas/BaseRegistrations/tenant-filter-schema';

import { listAllPlanRoles } from '@/services/v2/Planos/planRole-service';
import { listPlatformRoleOptions } from '@/services/v2/Roles/role-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type {
  TenantsFilterForm,
  TenantsFilterFormInternal,
} from '@/@types/v2/BaseRegistrations/tenant';
import type { PlanRoleOptionItem } from '@/@types/v2/Planos';
import type { RoleOptionItem } from '@/@types/v2/Roles';

const pristineFormValues = tenantFilterPristineValues;

function searchParams(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export function FilterSideContratantes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<TenantsFilterForm>) {
  const filterText = languageGB.baseRegistrations.tenant.filter;

  const statusOptions = useMemo(() => tenantStatusOptions.options(languageGB), [languageGB]);
  const signatureOptions = useMemo(() => tenantSignatureOptions.options(languageGB), [languageGB]);
  const dueMonthOptions = useMemo(() => tenantDueMonthOptions.options(languageGB), [languageGB]);
  const dueDayOptions = useMemo(() => tenantDueDayOptions.options(languageGB), [languageGB]);
  const resolver = useMemo(() => tenantFilterSchemaResolver(languageGB), [languageGB]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantsFilterFormInternal>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver,
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter, languageGB),
    },
  });

  function onSubmit(data: TenantsFilterFormInternal) {
    handleFilterChange(toFilterRequest(data));
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter, languageGB),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter, languageGB),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            maxLength={TENANT_FILTER_SEARCH_MAX_LENGTH}
            error={errors.search?.message}
            {...register('search')}
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
            name="signature"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.signature}
                placeholder={filterText.signatureAll}
                name={name}
                value={value}
                onChange={onChange}
                options={signatureOptions}
              />
            )}
          />

          <Controller
            name="due_month"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.dueMonth}
                placeholder={filterText.dueMonthAll}
                name={name}
                value={value}
                onChange={onChange}
                options={dueMonthOptions}
              />
            )}
          />

          <Controller
            name="due_day"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.dueDay}
                placeholder={filterText.dueDayAll}
                name={name}
                value={value}
                onChange={onChange}
                options={dueDayOptions}
              />
            )}
          />

          <Controller
            name="dt_accession"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={filterText.dtAccession}
                invalid={!!errors.dt_accession}
                errorText={errors.dt_accession?.message}
              >
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={filterText.startDate}
                invalid={!!errors.start_date}
                errorText={errors.start_date?.message}
              >
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={filterText.endDate}
                invalid={!!errors.end_date}
                errorText={errors.end_date?.message}
              >
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="role_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.role}
                placeholder={filterText.roleAll}
                service={listPlatformRoleOptions}
                // Mesmo rótulo do formulário (legado rotula pela descrição).
                mapOptions={(item: RoleOptionItem) => ({
                  label: item.description ?? item.name,
                  value: item.uuid,
                })}
                findParams={searchParams}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="plan_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.plan}
                placeholder={filterText.planAll}
                service={listAllPlanRoles}
                mapOptions={(item: PlanRoleOptionItem) => ({ label: item.nome, value: item.uuid })}
                findParams={searchParams}
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
