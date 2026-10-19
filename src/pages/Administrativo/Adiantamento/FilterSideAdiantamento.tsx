// src/pages/Administrativo/Adiantamento/FilterSideAdiantamento.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Adiantamento Salarial — Contrato B
// (`FilterModalProps<T>`), mirror mecânico de
// `Financeiro/Contrato/FilterSideContrato.tsx` (mesmo `SelectAsyncPaginate
// listEmployees` direto, sem hook dedicado). Único filtro do backend
// (`AdvanceFilterData`): `employee_uuid`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AdvanceFilterForm } from '@/@types/v2/Advances';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';

// Forma INTERNA do form — o Select trabalha com `Option`, o submit converte
// para `AdvanceFilterForm` (uuid cru), mesmo padrão de `FilterSideContrato`.
interface FilterFormValues {
  employee_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  employee_uuid: null,
};

export function FilterSideAdiantamento({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AdvanceFilterForm>) {
  const text = languageGB.advances.advance.list.filter;

  function toInternalValues(rawFilter?: AdvanceFilterForm | null): FilterFormValues {
    return {
      // Sem endpoint de detalhe avulso para resolver um label amigável a
      // partir do uuid — mesma técnica tolerante de `FilterSideContrato`
      // (o uuid cru é usado como label provisório até o usuário digitar e
      // o `SelectAsyncPaginate` resolver a opção real).
      employee_uuid: rawFilter?.employee_uuid
        ? { value: rawFilter.employee_uuid, label: rawFilter.employee_uuid }
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      employee_uuid: data.employee_uuid?.value || undefined,
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
            {languageGB.advances.advance.list.pageTitle}
          </Text>

          <Controller
            name="employee_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.employee}
                service={listEmployees}
                mapOptions={(item: EmployeeListItem) => ({
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
