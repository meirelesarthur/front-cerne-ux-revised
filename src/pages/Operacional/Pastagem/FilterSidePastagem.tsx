// src/pages/Operacional/Pastagem/FilterSidePastagem.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pastagem — TASK-PAST-FE-02. Contrato B
// completo (`FilterModalProps<T>`, 6 props exatas), re-hidratação em
// `[isOpen]` — mirror `FilterSideAppropriations.tsx`.
//
// Filtro real de `PastureFilterData`: `user_uuid` (Requisitante — quem
// criou o registro, relação `Pasture.user()`, NÃO o `employee_uuid` do
// cabeçalho do form), `start_date`/`end_date`.
//
// OBSERVAÇÃO (não é Gap): `listUsers` (`GET /users`) é a única listagem do
// backend sobre a relação `user()` — exige `users_view` (permissão
// administrativa). Perfis operacionais sem essa permissão verão o Select
// sem opções (403 tratado pelo `SelectAsyncPaginate` como "sem resultados"),
// degradação honesta (SEM MOCK), reportada ao Tester.
//
// CLM-10 ("exceto id=6") NÃO foi replicado — o id numérico legado não tem
// mapeamento confirmado para um uuid nesta migração; sem essa evidência, o
// Executor não infere/oculta um uuid por suposição.
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

import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { PastureFilterForm } from '@/@types/v2/Pastures';
import type { UserListItem } from '@/@types/v2/Users';

interface FilterFormValues {
  user_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  user_uuid: null,
  start_date: null,
  end_date: null,
};

interface FilterSidePastagemProps extends FilterModalProps<PastureFilterForm> {
  filtersApplied?: number;
}

export function FilterSidePastagem({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSidePastagemProps) {
  const text = languageGB.pastures.pasture.list.filter;

  function listUsersOptions(params: { search?: string; page?: number; per_page?: number }) {
    return listUsers({ ...params });
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      user_uuid: filter?.user_uuid
        ? { value: filter.user_uuid, label: filter.user_label ?? filter.user_uuid }
        : null,
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: PastureFilterForm = {
      user_uuid: data.user_uuid?.value || undefined,
      user_label: data.user_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
    handleFilterChange(applied);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      user_uuid: filter?.user_uuid
        ? { value: filter.user_uuid, label: filter.user_label ?? filter.user_uuid }
        : null,
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
    onClose();
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

          <Controller
            name="user_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.requester}
                placeholder={text.requesterPlaceholder}
                service={listUsersOptions}
                mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
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
