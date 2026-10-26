// src/pages/Administrativo/EntradaInsumos/FilterSideEntradaInsumos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Entrada de Insumos — Contrato B canônico
// de filtro (mirror `FilterSideInvoice.tsx`). 3 campos: proprietário
// (`proprietary_id`, VALOR uuid — risco (a) do roteiro), data de/até
// (`start_date`/`end_date`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { InputEntryFilterForm } from '@/@types/v2/InputEntries';

interface FilterFormValues {
  proprietary_id: Option<string> | null;
  start_date?: string | null;
  end_date?: string | null;
}

export function FilterSideEntradaInsumos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<InputEntryFilterForm>) {
  const filterText = languageGB.inputEntries.inputEntry.filter;

  const pristineFormValues: FilterFormValues = {
    proprietary_id: null,
    start_date: null,
    end_date: null,
  };

  function toInternalValues(rawFilter?: InputEntryFilterForm | null): FilterFormValues {
    return {
      proprietary_id: null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
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
      proprietary_id: data.proprietary_id?.value || undefined,
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

          <Controller
            name="proprietary_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.proprietary}
                service={listProprietaries}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
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

          <Text fontSize="sm" fontWeight="medium">
            {filterText.startDate}
          </Text>
          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
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
