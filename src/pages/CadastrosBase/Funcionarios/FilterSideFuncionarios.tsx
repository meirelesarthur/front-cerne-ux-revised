// src/pages/CadastrosBase/Funcionarios/FilterSideFuncionarios.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Funcionários — `<Form formFilter>` +
// `Form.BodyFilter`/`Form.FooterFilter` (NUNCA `<VStack as="form">` cru,
// instrução explícita da ficha). Mirror de composição:
// `Fornecedores/FilterSideFornecedores.tsx` (casca do form) +
// `Inventario/FilterSideInventario.tsx` (par `start_date`/`end_date` via
// `DateInput`+`Field`, mesmo componente/wrapper).
//
// Contrato real (Employee-FrontEnd-contrato.md `## 3.5`, DA-EMP-04): SEM
// filtro de FK — `search` (Input, nif/name) + `startDate`/`endDate`
// (DateInput, sobre `created_at`) + `isEnabled` (Select Ativo/Inativo,
// `EmployeeFilterData.isEnabled` usa `WithCast(bool)` no backend, checklist
// item 8). Checklist item 13 (companion `_label` de select assíncrono
// persistente) N/A — não há select de FK nesta tela.
//
// `EmployeeFilterForm` (`@/@types/v2/CadastrosBase/employee`, TASK-EMP-FE-01)
// já guarda `isEnabled` como `Option<boolean> | null` COMPLETO — usado DIRETO
// como forma interna do form (mesmo padrão de `ProviderFilterForm`).
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

export function FilterSideFuncionarios({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<EmployeeFilterForm>) {
  const filterText = languageGB.employees.employee.filter;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: filterText.enabledOptions.active },
    { value: false, label: filterText.enabledOptions.inactive },
  ];

  // Re-resolve `isEnabled` pela LISTA ESTÁTICA de opções (por `.value`),
  // nunca confiando no `label` eventualmente persistido em
  // `paginatedQuery.filter` (ex.: o filtro PADRÃO da tela, aplicado antes de
  // o usuário abrir o drawer, guarda `isEnabled.label: ''` — ver
  // `defaultFilter` em `index.tsx`, mirror `FilterSideFornecedores.tsx`).
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
  // drawer abre — deps SOMENTE `[isOpen]` (checklist item 1 — nunca
  // `filter`, senão todo refetch da grid, que troca a referência do objeto,
  // reabriria o efeito e sobrescreveria (clobber) o que o usuário está
  // digitando/selecionando dentro do drawer já aberto).
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
                // Armadilha #16 do checklist: `?? null`, NUNCA `?? undefined`
                // — o componente controlado vira NÃO-controlado com
                // `undefined` e mantém a última seleção.
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
