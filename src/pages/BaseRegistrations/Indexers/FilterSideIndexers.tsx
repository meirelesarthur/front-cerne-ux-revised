// src/pages/BaseRegistrations/Indexers/FilterSideIndexers.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Indexadores (mesma casca global <FilterSide>
// de `FilterSideObservacaoNascimento.tsx`, mirror 1:1).
//
// Contrato real (TASK-FE-211): **1 único campo** — `search` (Input, busca
// por `description` OU `descriptive` — D9 do contrato de API §10, decisão
// puramente de backend; a UI não muda). SEM Select de `is_enabled`:
// `IndexerFilterData` (backend) aceita `is_enabled` como filtro aditivo, mas
// NENHUMA tela desta rodada o consome (mesma decisão de fidelidade de
// `BirthNote`).
//
// RE-HIDRATAÇÃO — mesmo padrão CORRETO já usado em
// `FilterSideObservacaoNascimento.tsx`: prop `appliedFilter` + `useEffect`
// com deps `[isOpen]` APENAS, reconstruindo o form a partir do filtro
// REALMENTE aplicado na grid ao reabrir o drawer.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { IndexerFilterForm } from '@/@types/v2/BaseRegistrations/indexer';

// Forma INTERNA do form (só deste componente) — único campo, sem conversão
// para `Option` (não há nenhum Select neste drawer).
interface FilterFormValues {
  search?: string;
}

export function FilterSideIndexers({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<IndexerFilterForm>) {
  const filterLabels = languageGB.baseRegistrations.indexer.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: IndexerFilterForm | null): FilterFormValues {
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
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterLabels.title}
          </Text>

          <Input
            label={filterLabels.search}
            placeholder={filterLabels.searchPlaceholder}
            {...register('search')}
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
