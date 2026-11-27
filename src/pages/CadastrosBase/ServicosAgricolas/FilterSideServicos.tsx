// src/pages/CadastrosBase/ServicosAgricolas/FilterSideServicos.tsx
// PROTÓTIPO (27/11/2026, não portar) — filtros da lista de Serviços: busca, tipo de serviço e status.

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';

import { listServiceTypeOptions, serviceTypeQueryKey } from '../TiposServico/serviceTypeService';
import type { ServiceFilter } from './serviceService';

interface FilterFormValues {
  search?: string;
  service_type_uuid: Option<string> | null;
  is_enabled: Option<string> | null;
}

const PRISTINE: FilterFormValues = { search: '', service_type_uuid: null, is_enabled: null };

export function FilterSideServicos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ServiceFilter>) {
  const text = languageGB.serviceTypes.service.filter;

  const { data: types = [] } = useQuery({
    queryKey: [serviceTypeQueryKey.options],
    queryFn: listServiceTypeOptions,
  });

  const typeOptions: Option<string>[] = types.map((t) => ({ value: t.uuid, label: t.name }));
  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const toInternalValues = (raw?: ServiceFilter | null): FilterFormValues => ({
    search: raw?.search ?? '',
    service_type_uuid: raw?.service_type_uuid
      ? { value: raw.service_type_uuid, label: raw.service_type_label ?? raw.service_type_uuid }
      : null,
    is_enabled: enabledOptions.find((o) => o.value === raw?.is_enabled) ?? null,
  });

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    defaultValues: { ...PRISTINE, ...toInternalValues(filter) },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      service_type_uuid: data.service_type_uuid?.value || undefined,
      // Só para mostrar o nome no filtro depois; nunca vai à API.
      service_type_label: data.service_type_uuid?.label,
      is_enabled: (data.is_enabled?.value as ServiceFilter['is_enabled']) || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(PRISTINE);
  }

  function handleCancel() {
    reset({ ...PRISTINE, ...toInternalValues(filter) });
    onClose();
  }

  useEffect(() => {
    reset({ ...PRISTINE, ...toInternalValues(filter) });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="service_type_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.serviceType}
                placeholder={text.serviceTypeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
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
          <Button title={languageGB.defaltStrings.cancel} variant="secondary" onClick={handleCancel} type="button" />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
