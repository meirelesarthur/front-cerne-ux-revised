// src/_examples/pages/cadastros/recursos/FilterSideRecursos.tsx
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — drawer de FILTRO da listagem de recursos.
//
// Reaproveita o componente GLOBAL <FilterSide> (@/components/FilterSide) como
// casca do drawer — só injeta o CONTEÚDO específico da feature (campos de
// filtro + rodapé limpar/cancelar/aplicar). Espelha o `FilterSideAgents.tsx`
// real do Rank: componente CONTROLADO via contrato canônico `FilterModalProps`
// (handleFilterChange / handleReset / filter) — o estado do filtro NÃO vive
// aqui, vive no `paginatedQuery.filter` da tela de listagem.
//
// Componentes REUTILIZADOS (não recriados): @/components/FilterSide, @/components/Form.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { Switch } from '@/components/ui/switch';

import type { FilterModalProps } from '@/@types/filter-modal';

import type { ResourceFilterForm } from '@/_examples/types/resource';

export function FilterSideRecursos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ResourceFilterForm>) {
  const pristineFormValues: ResourceFilterForm = {
    name: '',
    status: null,
    includeDeleted: false,
  };

  const { control, register, handleSubmit, reset } = useForm<ResourceFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  const statusOptions = [
    { value: 'active', label: languageGB.examples.resource.list.table.active },
    {
      value: 'inactive',
      label: languageGB.examples.resource.list.table.inactive,
    },
  ];

  function onSubmit(data: ResourceFilterForm) {
    handleFilterChange({ ...data });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...filter,
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...filter,
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {languageGB.examples.resource.filter.title}
          </Text>

          <Input
            label={languageGB.examples.resource.filter.name}
            placeholder={languageGB.examples.resource.filter.namePlaceholder}
            {...register('name')}
          />

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={languageGB.examples.resource.filter.status}
                placeholder={languageGB.examples.resource.filter.status}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="includeDeleted"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  {languageGB.examples.resource.filter.includeDeleted}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                />
              </Flex>
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
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
