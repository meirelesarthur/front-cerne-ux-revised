// src/pages/Dashboards/UserAnalysis/FilterSideUserAnalysis.tsx
// Drawer de filtro da dashboard Análise de Usuários (execução 046,
// TASK-UA-FE-03; atualizado por PLANO-ADMIN-USER-ANALYSIS §4) — Contrato B
// canônico (`FilterModalProps<T>`), mirror `FilterSideCharge.tsx`. Campo
// Período (`UA-FILTER-01`) + campo Contratante (`tenant_uuid`), este último
// VISÍVEL SÓ para `Gestor_Plataf` — mirror mecânico do `Controller
// name="role_uuid"` de `FilterSideUsuario.tsx` (mesmo cuidado
// `value={field.value ?? null}`, mesma poda real no `onSubmit`, mesmo
// `usePermissions().hasRole('Gestor_Plataf')`).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { usePermissions } from '@/hooks/usePermissions';

import { userAnalysisPeriodOptions } from '@/constants/dashboards/userAnalysis/options/user-analysis-period-options';

import { userAnalysisFilterSchema } from '@/validations/schemas/Dashboards/userAnalysis-filter-schema';

import { listTenantOptions } from '@/services/v2/Tenants/tenant-options-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  UserAnalysisFilterRequest,
  UserAnalysisPeriod,
} from '@/@types/v2/Dashboards/userAnalysis';
import type { TenantOptionItem } from '@/@types/v2/Tenants';

interface FilterFormValues {
  period: Option<UserAnalysisPeriod> | null;
  tenant_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = { period: null, tenant_uuid: null };

interface FilterSideUserAnalysisProps extends FilterModalProps<UserAnalysisFilterRequest> {
  filtersApplied?: number;
}

export function FilterSideUserAnalysis({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideUserAnalysisProps) {
  const { hasRole } = usePermissions();
  // Só o admin de plataforma escolhe contratante — usuário comum é
  // farm-scoped (comportamento atual, inalterado).
  const isGestorPlataforma = hasRole('Gestor_Plataf');

  const text = languageGB.dashboards.userAnalysis.filter;
  const periodOptions = userAnalysisPeriodOptions.options(languageGB);

  function toInternalValues(rawFilter?: UserAnalysisFilterRequest | null): FilterFormValues {
    return {
      period: rawFilter?.period
        ? userAnalysisPeriodOptions.getOption(rawFilter.period, languageGB)
        : null,
      tenant_uuid: rawFilter?.tenant_uuid
        ? {
            value: rawFilter.tenant_uuid,
            label: rawFilter.tenant_uuid_label ?? rawFilter.tenant_uuid,
          }
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    resolver: yupResolver(userAnalysisFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      period: data.period?.value,
      // Poda real, não só visual — nunca vai ao payload para usuário comum,
      // mesmo com valor residual de uma sessão anterior como Gestor_Plataf.
      tenant_uuid: isGestorPlataforma ? (data.tenant_uuid?.value ?? undefined) : undefined,
      tenant_uuid_label: isGestorPlataforma ? data.tenant_uuid?.label : undefined,
    });
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

          {/* Só existe para o admin de plataforma — usuário comum é
              farm-scoped, sem noção de contratante. */}
          {isGestorPlataforma && (
            <Controller
              name="tenant_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.tenant}
                  placeholder={text.tenantPlaceholder}
                  service={listTenantOptions}
                  mapOptions={(item: TenantOptionItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  // `?? null`, NUNCA `?? undefined` — armadilha documentada
                  // em `FilterSideUsuario.tsx`/`FilterSideFuncoes.tsx`.
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          <Controller
            name="period"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.period}
                name={name}
                value={value}
                onChange={onChange}
                options={periodOptions}
                noClearable
              />
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
