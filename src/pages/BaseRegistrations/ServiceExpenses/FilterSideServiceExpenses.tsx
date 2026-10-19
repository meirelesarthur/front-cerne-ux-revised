// src/pages/BaseRegistrations/ServiceExpenses/FilterSideServiceExpenses.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Serviços (mirror 1:1 de
// Estorno/FilterSideEstorno.tsx — mesma casca global <FilterSide>).
//
// Contrato real (ServiceExpense-contrato.md v1.1 §15): search (Input) +
// is_enabled (Select — Ativo/Inativo). SEM filtro para os 3 campos exclusivos
// (pay_team/has_commission/commission) — não pedido pelo contrato de API §7.
// Ambos vão como query params reais de `ServiceExpenseFilterForm` — nunca
// filtro client-side.
//
// O componente @/components/Form/Select trabalha com `Option` (label/value),
// não com a string crua que o backend espera — por isso o form RHF usa
// `Option | null` internamente e o `submit` converte para o shape cru de
// `ServiceExpenseFilterForm` antes de chamar `handleFilterChange`.
//
// FIX pós-E2E (TASK-FE-141 / ERRO-FE-008): este drawer era mirror mecânico de
// Estorno/ construído ANTES da correção `TASK-FILTER-REHYDRATE-01` existir
// (ou sem herdá-la) — sempre reabria com os campos em branco mesmo quando um
// filtro já estava aplicado na listagem (o filtro em si já persiste via
// `usePaginatedQueryStorage`; só a UI do drawer não lia esse estado de volta).
// Replica 1:1 o padrão já validado em
// `CentroCusto/FilterSideCentroCusto.tsx`: recebe `appliedFilter` do `index.tsx`
// pai e usa um `useEffect` com deps `[isOpen]` (DE PROPÓSITO — ver comentário
// no efeito abaixo) para `reset()` o form a partir do filtro já aplicado toda
// vez que o drawer transiciona de fechado→aberto.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ServiceExpenseFilterForm } from '@/@types/v2/BaseRegistrations/serviceExpense';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `ServiceExpenseFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
}

export function FilterSideServiceExpenses({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ServiceExpenseFilterForm>) {
  const text = languageGB.baseRegistrations.serviceExpense.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: ServiceExpenseFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as ServiceExpenseFilterForm['is_enabled']) || undefined,
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

  // Re-hidratação (TASK-FILTER-REHYDRATE-01 / TASK-FE-141): ao reabrir o
  // drawer, reconstrói os valores do form a partir do filtro JÁ APLICADO na
  // listagem (persistido no localStorage por
  // `userPaginatedQuery`/`usePaginatedQueryStorage`).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    // Deps propositalmente restritas a `isOpen` — ver comentário acima.
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
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
