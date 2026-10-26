// src/pages/Administrativo/FuncionarioXEventos/FilterSideFuncionarioXEventos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da Tela 1 (listagem-picker de Funcionários) — TASK-FE-FXE-01.
// Cópia DIRETA de `CadastrosBase/Funcionarios/FilterSideFuncionarios.tsx`
// (contrato de tela §2, Contrato B `FilterModalProps<EmployeeFilterForm>` —
// MESMO tipo `EmployeeFilterForm` de `@/@types/v2/CadastrosBase/employee`,
// SEM tipo novo, DA-EE-FE-01) — só os textos mudam (bloco próprio
// `employeeEvents.employeeEvent.filter`, não `employees.employee.filter`, já
// que esta tela vive em outro módulo/rota).
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

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { EmployeeFilterForm } from '@/@types/v2/CadastrosBase/employee';

const pristineFormValues: EmployeeFilterForm = {
  search: '',
  startDate: null,
  endDate: null,
  isEnabled: null,
};

export function FilterSideFuncionarioXEventos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<EmployeeFilterForm>) {
  const filterText = languageGB.employeeEvents.employeeEvent.filter;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: filterText.enabledOptions.active },
    { value: false, label: filterText.enabledOptions.inactive },
  ];

  // Re-resolve `isEnabled` pela LISTA ESTÁTICA de opções (por `.value`),
  // nunca confiando no `label` eventualmente persistido em
  // `paginatedQuery.filter` (mirror `FilterSideFuncionarios.tsx` — o filtro
  // PADRÃO da tela guarda `isEnabled.label: ''`, ver `defaultFilter` em
  // `index.tsx`).
  function toInternalValues(rawFilter?: EmployeeFilterForm | null): EmployeeFilterForm {
    return {
      search: rawFilter?.search ?? '',
      startDate: rawFilter?.startDate ?? null,
      endDate: rawFilter?.endDate ?? null,
      isEnabled: enabledOptions.find((o) => o.value === rawFilter?.isEnabled?.value) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<EmployeeFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: EmployeeFilterForm) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      isEnabled: data.isEnabled ?? undefined,
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

  // Re-hidrata o form a partir do filtro REALMENTE aplicado sempre que o
  // drawer abre — deps SOMENTE `[isOpen]` (mirror `FilterSideFuncionarios.tsx`
  // — nunca `filter`, senão todo refetch da grid reabriria o efeito e
  // sobrescreveria o que o usuário está digitando/selecionando).
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="startDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="endDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="isEnabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isEnabled}
                placeholder={filterText.isEnabledAll}
                name={name}
                // Armadilha #16 do checklist: `?? null`, NUNCA `?? undefined`.
                value={value ?? null}
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
