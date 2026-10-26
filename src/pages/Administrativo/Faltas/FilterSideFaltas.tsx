// src/pages/Administrativo/Faltas/FilterSideFaltas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Registro de Faltas — Contrato B (`FilterModalProps<T>`,
// seis props exatas), mirror mecânico de `Adiantamento/FilterSideAdiantamento.tsx`
// (mesmo `SelectAsyncPaginate listEmployees`) + `Eventos/FilterSideEventos.tsx`
// (par `DateInput` de intervalo, aqui sobre `date` — a data da própria
// Falta, NÃO `created_at`). Filtros reais do backend (`AbsenceFilterData`):
// `employee_uuid`, `event_uuid`, `start_date`, `end_date`.
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (checklist item 1 do padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listEventOptions } from '@/services/v2/Events/event-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AbsenceFilterForm } from '@/@types/v2/Absences';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { EventOption } from '@/@types/v2/Events';

// Forma INTERNA do form — os Selects trabalham com `Option`, as datas ficam
// nullable para o `DateInput` controlado; o submit converte tudo para o
// shape externo `AbsenceFilterForm` (uuid/strings crus).
interface FilterFormValues {
  employee_uuid: Option<string> | null;
  event_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  employee_uuid: null,
  event_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideFaltas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AbsenceFilterForm>) {
  const text = languageGB.absences.absence.list.filter;

  function toInternalValues(rawFilter?: AbsenceFilterForm | null): FilterFormValues {
    return {
      // Sem endpoint de detalhe avulso para resolver um label amigável a
      // partir do uuid — mesma técnica tolerante de `FilterSideAdiantamento`
      // (o uuid cru é usado como label provisório até o usuário digitar e o
      // `SelectAsyncPaginate` resolver a opção real).
      employee_uuid: rawFilter?.employee_uuid
        ? { value: rawFilter.employee_uuid, label: rawFilter.employee_uuid }
        : null,
      event_uuid: rawFilter?.event_uuid
        ? { value: rawFilter.event_uuid, label: rawFilter.event_uuid }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  // Validação client-side NÃO bloqueante (mirror `FilterSideEventos`): se
  // ambos preenchidos, avisa quando `end_date < start_date` — comparação
  // lexicográfica válida para strings ISO `yyyy-MM-dd`. Não impede o submit.
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      employee_uuid: data.employee_uuid?.value || undefined,
      event_uuid: data.event_uuid?.value || undefined,
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

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
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

          <Controller
            name="event_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.event}
                service={listEventOptions}
                mapOptions={(item: EventOption) => ({
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
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {text.dateRangeInvalid}
            </Text>
          )}
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
