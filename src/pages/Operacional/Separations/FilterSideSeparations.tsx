// src/pages/Operacional/Separations/FilterSideSeparations.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Apartação — Contrato B canônico
// (`FilterModalProps<T>`), mirror `Operacional/Nascimentos/FilterSideNascimentos.tsx`.
//
// 1 campo real (frontend-contract-apartacao.md §5): `batch` (SelectAsyncPaginate
// single sobre `GET /batches/options?statuses[]=ACTIVE&statuses[]=PENDING` —
// mirror `LK-03` do legado, filtro mais amplo que o do form).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { SeparationFilterRequest } from '@/@types/v2/Separations';

// `batch_label` é companion DISPLAY-ONLY de re-hidratação do
// `SelectAsyncPaginate` (mesma regra de `Nascimentos`/`VendaAnimais`) — não
// faz parte do `SeparationFilterRequest` real enviado ao servidor.
interface FilterFormValues {
  batch: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  batch: null,
};

export function FilterSideSeparations({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<SeparationFilterRequest & { batch_label?: string }>) {
  const filterText = languageGB.separations.separation.filter;

  function toInternalValues(
    rawFilter?: (SeparationFilterRequest & { batch_label?: string }) | null
  ): FilterFormValues {
    return {
      batch: rawFilter?.batch_uuid
        ? { value: rawFilter.batch_uuid, label: rawFilter.batch_label ?? rawFilter.batch_uuid }
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
    } as SeparationFilterRequest & { batch_label?: string });
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
                service={(params) =>
                  listBatchOptions({ ...params, statuses: ['ACTIVE', 'PENDING'] })
                }
                mapOptions={(item: BatchOption) => ({
                  label: item.label,
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
