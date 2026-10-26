// src/pages/CadastrosBase/Autorizadores/FilterSideAutorizadores.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Autorizadores (mesma casca global
// <FilterSide> de FilterSideCentroCusto.tsx, versão enxuta — SLICE 1 (Lote
// 06 / esteira 089, Frente C, F-141): só `search` (contrato do task-packet
// §5 — "Filtro drawer: só search").
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { RequestAuthorizerFilterForm } from '@/@types/v2/RequestAuthorizers';

interface FilterSideAutorizadoresProps extends FilterModalProps<RequestAuthorizerFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

interface FilterFormValues {
  search?: string;
}

export function FilterSideAutorizadores({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideAutorizadoresProps) {
  const text = languageGB.requestAuthorizers.requestAuthorizer.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: RequestAuthorizerFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
    };
  }

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />
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
