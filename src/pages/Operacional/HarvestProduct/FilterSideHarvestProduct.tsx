// src/pages/Operacional/HarvestProduct/FilterSideHarvestProduct.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Colheita de Frutas — Contrato B canônico
// (`FilterModalProps<HarvestProductFilterRequest>`, 6 props exatas), corpo em
// `<Form noPadding formFilter>`, mirror `FilterSideEventos.tsx` (Select +
// 2×DateInput). `productUuid` fica DE FORA da UI por padrão (D4 do contrato
// §7.10 — decisão de escopo, não fidelidade obrigatória).
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (get_pwa_grid_query_pattern, Contrato B).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';

import { queryKey } from '@/constants/query-key';

import {
  getAreasOptions,
  getClientsOptions,
} from '@/services/v2/HarvestProduct/harvestProduct-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { HarvestProductFilterRequest } from '@/@types/v2/HarvestProduct';

interface FilterFormValues {
  areaUuid: Option<string> | null;
  clientUuid: Option<string> | null;
  dateStart: string | null;
  dateEnd: string | null;
}

const pristineFormValues: FilterFormValues = {
  areaUuid: null,
  clientUuid: null,
  dateStart: null,
  dateEnd: null,
};

export function FilterSideHarvestProduct({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<HarvestProductFilterRequest>) {
  const text = languageGB.harvestProduct.filter;

  const areasQuery = useQuery({
    queryKey: [queryKey.harvestProducts.harvestProducts, 'areas-options'],
    queryFn: getAreasOptions,
    enabled: isOpen,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const areaOptions: Option<string>[] = (areasQuery.data ?? []).map((area) => ({
    value: area.uuid,
    label: area.description,
  }));

  const clientsQuery = useQuery({
    queryKey: [queryKey.harvestProducts.harvestProducts, 'clients-options'],
    queryFn: getClientsOptions,
    enabled: isOpen,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const clientOptions: Option<string>[] = (clientsQuery.data ?? []).map((client) => ({
    value: client.uuid,
    label: client.name ?? '—',
  }));

  function toInternalValues(rawFilter?: HarvestProductFilterRequest | null): FilterFormValues {
    return {
      areaUuid: rawFilter?.areaUuid
        ? (areaOptions.find((option) => option.value === rawFilter.areaUuid) ?? null)
        : null,
      clientUuid: rawFilter?.clientUuid
        ? (clientOptions.find((option) => option.value === rawFilter.clientUuid) ?? null)
        : null,
      dateStart: rawFilter?.dateStart ?? null,
      dateEnd: rawFilter?.dateEnd ?? null,
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

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      areaUuid: data.areaUuid?.value || undefined,
      clientUuid: data.clientUuid?.value || undefined,
      dateStart: data.dateStart || undefined,
      dateEnd: data.dateEnd || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
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
            name="areaUuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.area}
                name={name}
                value={value}
                onChange={onChange}
                options={areaOptions}
                loading={areasQuery.isLoading}
              />
            )}
          />

          <Controller
            name="clientUuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.client}
                name={name}
                value={value}
                onChange={onChange}
                options={clientOptions}
                loading={clientsQuery.isLoading}
              />
            )}
          />

          <Controller
            name="dateStart"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateStart}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="dateEnd"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateEnd}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={text.clearAllFilters}
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
          <Button title={text.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}

export default FilterSideHarvestProduct;
