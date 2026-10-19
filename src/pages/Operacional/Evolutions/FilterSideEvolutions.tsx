// src/pages/Operacional/Evolutions/FilterSideEvolutions.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Evolução/Rebanho — Contrato B canônico
// (`FilterModalProps<T>`), mirror `Operacional/Separations/FilterSideSeparations.tsx`.
//
// 3 campos (contrato de tela §4.4): Animal (`SelectAsyncPaginate` sobre
// `listAnimalOptions`, PAGINADO — 146.496 linhas reais, é o componente
// CERTO aqui, inverso da armadilha da feature irmã Touros/Sêmen/Embrião) +
// Data inicial/final (`DateInput`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { EvolutionFilterRequest } from '@/@types/v2/Evolutions';

// `animal_label` é companion DISPLAY-ONLY de re-hidratação do
// `SelectAsyncPaginate` (mesma regra de `batch_label` em Separations) — não
// faz parte do payload real enviado ao servidor.
interface FilterFormValues {
  animal: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  animal: null,
  start_date: null,
  end_date: null,
};

export function FilterSideEvolutions({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<EvolutionFilterRequest>) {
  const filterText = languageGB.evolutions.evolution.filter;

  function toInternalValues(rawFilter?: EvolutionFilterRequest | null): FilterFormValues {
    return {
      animal: rawFilter?.animal_uuid
        ? { value: rawFilter.animal_uuid, label: rawFilter.animal_label ?? rawFilter.animal_uuid }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
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
      animal_uuid: data.animal?.value || undefined,
      animal_label: data.animal?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    });
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
            name="animal"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.animal}
                service={listAnimalOptions}
                mapOptions={(item: AnimalOptionListItem) => ({
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

          <Text fontSize="sm" fontWeight="medium" mt="4">
            {filterText.startDate}
          </Text>
          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium" mt="4">
            {filterText.endDate}
          </Text>
          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
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
