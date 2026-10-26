// src/pages/CadastrosBase/PlanAccount/FilterSidePlanAccount.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Plano de Contas (mesma casca global
// <FilterSide> de CentroCusto/FilterSideCentroCusto.tsx, com os filtros reais
// do contrato — Seção 3.1 do PlanAccount-contrato):
// search (Input) + condition (Select — Devedor/Credor/Ambos) + class (Select
// — Sintético/Analítico) + type (Select — CAPEX/OPEX) + is_enabled (Select —
// Ativo/Inativo) + parent_uuid (SelectAsyncPaginate contra `listPlanAccounts`,
// rótulo "Conta-pai" — permite entrar direto numa subárvore específica).
//
// O componente @/components/Form/Select trabalha com `Option` (label/value),
// não com a string crua que o backend espera — por isso o form RHF usa
// `Option | null` internamente e o `onSubmit` converte para o shape cru de
// `PlanAccountFilterForm` antes de chamar `handleFilterChange` (mesma
// convenção de `FilterSideCentroCusto.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listPlanAccounts } from '@/services/v2/PlanAccounts/plan-account-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { PlanAccountFilterForm, PlanAccountListItem } from '@/@types/v2/PlanAccounts';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `PlanAccountFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  condition: Option<string> | null;
  /** Enum int-backed no backend (TASK-PA-FIX-02) — value numérico 1|2, label continua Sintético/Analítico. */
  class: Option<number> | null;
  /** Enum int-backed no backend (TASK-PA-FIX-02) — value numérico 1|2, label continua CAPEX/OPEX. */
  type: Option<number> | null;
  is_enabled: Option<string> | null;
  parent_uuid: Option<string> | null;
}

export function FilterSidePlanAccount({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter: appliedFilter,
  languageGB,
}: FilterModalProps<PlanAccountFilterForm>) {
  const pristineFormValues: FilterFormValues = {
    search: '',
    condition: null,
    class: null,
    type: null,
    is_enabled: null,
    parent_uuid: null,
  };

  const filter = languageGB.planAccounts.planAccount.filter;

  const conditionOptions: Option<string>[] = [
    { value: '1', label: filter.conditionOptions.debtor },
    { value: '2', label: filter.conditionOptions.creditor },
    { value: '3', label: filter.conditionOptions.both },
  ];

  // Enum int-backed no backend (SYNTHETIC=1/ANALYTICAL=2/CAPEX=1/OPEX=2) —
  // TASK-PA-FIX-02: value numérico enviado à API, label continua o rótulo de UI.
  const classOptions: Option<number>[] = [
    { value: 1, label: filter.classOptions.synthetic },
    { value: 2, label: filter.classOptions.analytical },
  ];

  const typeOptions: Option<number>[] = [
    { value: 1, label: filter.typeOptions.capex },
    { value: 2, label: filter.typeOptions.opex },
  ];

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filter.enabledOptions.active },
    { value: 'false', label: filter.enabledOptions.inactive },
  ];

  // `parent_uuid` guarda o par `{ label, value }` do `SelectAsyncPaginate`
  // usando o campo companheiro `parent_label` (display-only, gravado pelo
  // próprio `onSubmit()` abaixo) — mesmo padrão de `specie_uuid`/`specie_label`
  // em `FilterSideEstagioReprodutivo.tsx`. Fallback ao próprio uuid só para
  // filtros salvos ANTES desta correção (localStorage sem `parent_label`),
  // sem quebrar/deixar o campo em branco.
  function toInternalValues(rawFilter?: PlanAccountFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      condition: conditionOptions.find((o) => o.value === rawFilter?.condition) ?? null,
      class: classOptions.find((o) => o.value === rawFilter?.class) ?? null,
      type: typeOptions.find((o) => o.value === rawFilter?.type) ?? null,
      is_enabled: enabledOptions.find((o) => o.value === rawFilter?.is_enabled) ?? null,
      parent_uuid: rawFilter?.parent_uuid
        ? {
            value: rawFilter.parent_uuid,
            label: rawFilter.parent_label ?? rawFilter.parent_uuid,
          }
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(appliedFilter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      condition: (data.condition?.value as PlanAccountFilterForm['condition']) || undefined,
      // Numérico (TASK-PA-FIX-02) — `Number(...)` é defesa extra caso o
      // Select alguma vez force string; o `value` do Option já é number.
      class:
        data.class?.value != null
          ? (Number(data.class.value) as PlanAccountFilterForm['class'])
          : undefined,
      type:
        data.type?.value != null
          ? (Number(data.type.value) as PlanAccountFilterForm['type'])
          : undefined,
      is_enabled: (data.is_enabled?.value as PlanAccountFilterForm['is_enabled']) || undefined,
      parent_uuid: data.parent_uuid?.value || undefined,
      parent_label: data.parent_uuid?.label || undefined, // display-only, NUNCA vai pra querystring
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
      ...toInternalValues(appliedFilter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(appliedFilter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filter.title}
          </Text>

          <Input
            label={filter.search}
            placeholder={filter.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="condition"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filter.condition}
                placeholder={filter.conditionAll}
                name={name}
                value={value}
                onChange={onChange}
                options={conditionOptions}
              />
            )}
          />

          <Controller
            name="class"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filter.class}
                placeholder={filter.classAll}
                name={name}
                value={value}
                onChange={onChange}
                options={classOptions}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filter.type}
                placeholder={filter.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filter.isEnabled}
                placeholder={filter.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />

          <Controller
            name="parent_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filter.parentUuid}
                placeholder={filter.parentUuidPlaceholder}
                service={listPlanAccounts}
                mapOptions={(item: PlanAccountListItem) => ({
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
