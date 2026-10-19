// src/pages/Operacional/Nascimentos/FilterSideNascimentos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Nascimentos — Contrato B canônico
// (`FilterModalProps<T>`), mirror `Operacional/Romaneios/FilterSideRomaneios.tsx`/
// `Operacional/VendaAnimais/FilterSideVendaAnimais.tsx`.
//
// 4 campos reais (frontend-contract-nascimentos.md §5.2):
//   `identification` (texto livre, busca mãe OU bezerro, mirror FM1) ·
//   `breed_uuid` (SelectAsyncPaginate SEM `specie_uuid` — mirror legado FM2,
//   diferente do select do formulário) · `start_date` · `end_date`.
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
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listBreedOptions } from '@/services/v2/Breeds/breed-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BirthAnimalFilterForm } from '@/@types/v2/BirthAnimals';
import type { BreedOptionItem } from '@/@types/v2/Breeds/breed';

// `breed_label` é companion DISPLAY-ONLY de re-hidratação do
// `SelectAsyncPaginate` (mesma regra de `Romaneios`/`VendaAnimais`) — não faz
// parte do `BirthAnimalFilterForm` real enviado ao servidor.
interface FilterFormValues {
  identification: string;
  breed_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  identification: '',
  breed_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideNascimentos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BirthAnimalFilterForm & { breed_label?: string }>) {
  const filterText = languageGB.birthAnimals.birthAnimal.filter;

  function toInternalValues(
    rawFilter?: (BirthAnimalFilterForm & { breed_label?: string }) | null
  ): FilterFormValues {
    return {
      identification: rawFilter?.identification ?? '',
      breed_uuid: rawFilter?.breed_uuid
        ? { value: rawFilter.breed_uuid, label: rawFilter.breed_label ?? rawFilter.breed_uuid }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, register } = useForm<FilterFormValues>({
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
      identification: data.identification?.trim() || undefined,
      breed_uuid: data.breed_uuid?.value || undefined,
      breed_label: data.breed_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    } as BirthAnimalFilterForm & { breed_label?: string });
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

          <Input label={filterText.identification} {...register('identification')} />

          <Controller
            name="breed_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.breed}
                service={listBreedOptions}
                mapOptions={(item: BreedOptionItem) => ({
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

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
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
