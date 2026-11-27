// src/pages/CadastrosBase/TiposServico/FilterSideTiposServico.tsx
// PROTÓTIPO (27/11/2026, não portar) — filtros da lista de Tipos de serviço: busca, uso, agrupador,
// status e "Gera execução". Mesma casca <FilterSide> e mesma re-hidratação ao abrir do
// FilterSideOperacoes.tsx.

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

import { type ServiceTypeUse } from './serviceTypeParams';
import { listPrototypeGrouperOptions, type ServiceTypeFilter, serviceTypeQueryKey } from './serviceTypeService';

interface FilterFormValues {
  search?: string;
  use: Option<ServiceTypeUse> | null;
  grouper_uuid: Option<string> | null;
  is_enabled: Option<string> | null;
  generates_execution: Option<string> | null;
}

const PRISTINE: FilterFormValues = {
  search: '',
  use: null,
  grouper_uuid: null,
  is_enabled: null,
  generates_execution: null,
};

export function FilterSideTiposServico({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ServiceTypeFilter>) {
  const text = languageGB.serviceTypes.serviceType.filter;
  const useText = languageGB.serviceTypes.serviceType.useOptions;

  const { data: groupers = [] } = useQuery({
    queryKey: [serviceTypeQueryKey.groupers],
    queryFn: listPrototypeGrouperOptions,
    staleTime: Infinity,
  });

  const useOptions: Option<ServiceTypeUse>[] = [
    { value: 'agricultura', label: useText.agriculture },
    { value: 'pecuaria', label: useText.livestock },
    { value: 'ambos', label: useText.both },
  ];
  const grouperOptions: Option<string>[] = groupers.map((g) => ({ value: g.uuid, label: `${g.code} — ${g.name}` }));
  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];
  const yesNoOptions: Option<string>[] = [
    { value: 'true', label: text.yes },
    { value: 'false', label: text.no },
  ];

  const toInternalValues = (raw?: ServiceTypeFilter | null): FilterFormValues => ({
    search: raw?.search ?? '',
    use: useOptions.find((o) => o.value === raw?.use) ?? null,
    grouper_uuid: raw?.grouper_uuid
      ? { value: raw.grouper_uuid, label: raw.grouper_label ?? raw.grouper_uuid }
      : null,
    is_enabled: enabledOptions.find((o) => o.value === raw?.is_enabled) ?? null,
    generates_execution: yesNoOptions.find((o) => o.value === raw?.generates_execution) ?? null,
  });

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    defaultValues: { ...PRISTINE, ...toInternalValues(filter) },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      use: data.use?.value || undefined,
      grouper_uuid: data.grouper_uuid?.value || undefined,
      // Só para mostrar o nome no filtro depois; nunca vai à API.
      grouper_label: data.grouper_uuid?.label,
      is_enabled: (data.is_enabled?.value as ServiceTypeFilter['is_enabled']) || undefined,
      generates_execution: (data.generates_execution?.value as ServiceTypeFilter['generates_execution']) || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({ ...PRISTINE, ...toInternalValues(filter) });
  }, [isOpen, groupers.length]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="use"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select label={text.use} placeholder={text.useAll} name={name} value={value} onChange={onChange} options={useOptions} />
            )}
          />

          <Controller
            name="grouper_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.grouper}
                placeholder={text.grouperAll}
                name={name}
                value={value}
                onChange={onChange}
                options={grouperOptions}
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

          <Controller
            name="generates_execution"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.generatesExecution}
                placeholder={text.generatesExecutionAll}
                name={name}
                value={value}
                onChange={onChange}
                options={yesNoOptions}
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
