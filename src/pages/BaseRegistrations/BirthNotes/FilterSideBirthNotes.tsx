// src/pages/BaseRegistrations/BirthNotes/FilterSideBirthNotes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Observação Nascimento (mesma casca global
// <FilterSide> de FilterSideTecnicasDiagnostico.tsx/FilterSideMotivosBaixa.tsx).
//
// Contrato real (TASK-FE-101, mirror 1:1 de FilterSideTecnicasDiagnostico.tsx):
// **1 único campo** — `search` (Input, busca por `description`). SEM Select
// de `is_enabled`: `BirthNoteFilterData` (backend) aceita `is_enabled` como
// filtro aditivo, mas NENHUMA tela desta rodada o consome (D2 do Maestro —
// diretriz não-negociável, só busca por descrição).
//
// RE-HIDRATAÇÃO — Contrato B (mirror FilterSideDiagnosisPregnancy.tsx): prop
// `filter` + pristineFormValues/toInternalValues + `useEffect` com deps
// `[isOpen]` APENAS, reconstruindo o form a partir do filtro REALMENTE
// aplicado na grid ao reabrir o drawer.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { BirthNoteFilterForm } from '@/@types/v2/BaseRegistrations/birthNote';

// Forma INTERNA do form (só deste componente) — único campo, sem conversão
// para `Option` (não há nenhum Select neste drawer).
interface FilterFormValues {
  search?: string;
}

export function FilterSideBirthNotes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BirthNoteFilterForm>) {
  const filterText = languageGB.baseRegistrations.birthNote.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: BirthNoteFilterForm | null): FilterFormValues {
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
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
