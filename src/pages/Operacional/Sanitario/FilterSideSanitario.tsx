// src/pages/Operacional/Sanitario/FilterSideSanitario.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Sanitário — Contrato B canônico
// (`FilterModalProps<T>`, seis props exatas), corpo em `<Form noPadding
// formFilter>` (contrato-tela-lane-c-sanitario-frontend.md §6.1, TASK-SAN-FE-02
// regra 2: SÓ `batch_uuid`/`user_uuid`, nenhum outro filtro — mirror AC-10).
//
// `Lote` — `SelectAsyncPaginate` sobre `listBatchOptions` (`Batches`, reuso
// integral, mirror `FilterSideSeparations.tsx`/`FilterSideAnimal.tsx`).
// `Responsável` — `SelectAsyncPaginate` sobre `listUsers` (`Users`, reuso
// integral do MESMO lookup já usado por `FilterSideWeaning.tsx` para o campo
// equivalente) — contrato-tela §6.1: "opções de GET /users/options ou
// equivalente já existente — reuso, não endpoint novo".
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (Contrato B canônico). `batch_label`/
// `user_label` são companions DISPLAY-ONLY (mesma técnica de
// `FilterSideSeparations`/`FilterSideWeaning`) — nunca contam como filtro
// aplicado nem vão ao payload real (`SanitaryFilterRequest`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { SanitaryFilterForm } from '@/@types/v2/Sanitaries';
import type { UserListItem } from '@/@types/v2/Users';

interface FilterFormValues {
  batch: Option<string> | null;
  responsible: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  batch: null,
  responsible: null,
};

export function FilterSideSanitario({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<SanitaryFilterForm>) {
  const filterText = languageGB.sanitary.sanitary.list.filter;

  function toInternalValues(rawFilter?: SanitaryFilterForm | null): FilterFormValues {
    return {
      batch: rawFilter?.batch_uuid
        ? { value: rawFilter.batch_uuid, label: rawFilter.batch_label ?? rawFilter.batch_uuid }
        : null,
      responsible: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      batch_uuid: data.batch?.value || undefined,
      batch_label: data.batch?.label,
      user_uuid: data.responsible?.value || undefined,
      user_label: data.responsible?.label,
    } as SanitaryFilterForm);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="batch"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.batch}
                service={listBatchOptions}
                mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
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
            name="responsible"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.responsible}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
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

export default FilterSideSanitario;
