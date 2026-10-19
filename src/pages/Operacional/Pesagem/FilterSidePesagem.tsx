// src/pages/Operacional/Pesagem/FilterSidePesagem.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pesagem — Contrato B canônico
// (`FilterModalProps<T>`, seis props exatas), corpo em `<Form noPadding
// formFilter>` (contrato-tela-lane-c-pesagem-frontend.md §6.1, TASK-PES-FE-02
// regra 2: `Lote`/`Categoria` mutuamente exclusivos + `Responsável`).
//
// `Lote` — `SelectAsyncPaginate` sobre `listBatchOptions` (`Batches`, reuso
// integral, mirror `FilterSideSanitario.tsx`). `Categoria` —
// `SelectAsyncPaginate` sobre `listCategoryAnimalOptions` (reuso integral,
// endpoint SEM gate de permissão própria, mirror `FilterSideAnimal.tsx`).
// `Responsável` — `SelectAsyncPaginate` sobre `listUsers` (mesmo lookup já
// usado por `FilterSideSanitario.tsx`/`FilterSideWeaning.tsx` para o campo
// equivalente — reuso, não endpoint novo, contrato-tela §6.1). Regra 3 da
// Tarefa: SEM hardcode de id excluído — a correção já foi aplicada no
// backend (FID-G3A §5), o front simplesmente não reproduz nenhum filtro de
// exclusão especial sobre `listUsers`.
//
// Mutuamente exclusivos (Regra 2/contrato-tela §6.4/§8.3): selecionar Lote
// limpa Categoria e vice-versa — `onChange` de cada campo zera o outro via
// `setValue`, mesma técnica que a cascata do form principal (Tarefa 37) vai
// usar para o par `batch_uuid`/`category_uuid`.
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (Contrato B canônico). `batch_label`/
// `category_label`/`user_label` são companions DISPLAY-ONLY (mesma técnica de
// `FilterSideSanitario`/`FilterSideAnimal`) — nunca contam como filtro
// aplicado nem vão ao payload real (`WeighingFilterRequest`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { UserListItem } from '@/@types/v2/Users';
import type { WeighingFilterForm } from '@/@types/v2/Weighing';

interface FilterFormValues {
  batch: Option<string> | null;
  category: Option<string> | null;
  responsible: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  batch: null,
  category: null,
  responsible: null,
};

export function FilterSidePesagem({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<WeighingFilterForm>) {
  const filterText = languageGB.weighing.weighing.list.filter;

  function toInternalValues(rawFilter?: WeighingFilterForm | null): FilterFormValues {
    return {
      batch: rawFilter?.batch_uuid
        ? { value: rawFilter.batch_uuid, label: rawFilter.batch_label ?? rawFilter.batch_uuid }
        : null,
      category: rawFilter?.category_uuid
        ? {
            value: rawFilter.category_uuid,
            label: rawFilter.category_label ?? rawFilter.category_uuid,
          }
        : null,
      responsible: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
    };
  }

  const { control, handleSubmit, reset, setValue } = useForm<FilterFormValues>({
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
      category_uuid: data.category?.value || undefined,
      category_label: data.category?.label,
      user_uuid: data.responsible?.value || undefined,
      user_label: data.responsible?.label,
    } as WeighingFilterForm);
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
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // Regra 2 — mutuamente exclusivo: escolher Lote limpa Categoria.
                  if (option) setValue('category', null);
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.category}
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // Regra 2 — mutuamente exclusivo: escolher Categoria limpa Lote.
                  if (option) setValue('batch', null);
                }}
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

export default FilterSidePesagem;
