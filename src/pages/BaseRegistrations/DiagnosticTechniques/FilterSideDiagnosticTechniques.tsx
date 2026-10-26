// src/pages/BaseRegistrations/DiagnosticTechniques/FilterSideDiagnosticTechniques.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Técnicas Diagnóstico (mesma casca global
// <FilterSide> de BaseRegistrations/DiagnosisPregnancy).
//
// Contrato real (âncora legado `index.blade.php` — sem filtro nenhum no
// legado): **1 único campo** — `search` (Input, busca por `description`). SEM
// Select de `is_enabled`: `DiagnosticTechniqueFilterForm` (backend) só aceita
// `search` — um Select de status aqui filtraria 100% client-side sem lastro no
// contrato, fora de escopo.
//
// RE-HIDRATAÇÃO — Contrato B canônico (mesmo padrão de
// FilterSideDiagnosisPregnancy.tsx): prop `filter` + `useEffect` com deps
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
import type { DiagnosticTechniqueFilterForm } from '@/@types/v2/BaseRegistrations/diagnosticTechnique';

// Forma INTERNA do form (só deste componente) — único campo, sem conversão
// para `Option` (não há nenhum Select neste drawer).
interface FilterFormValues {
  search?: string;
}

export function FilterSideDiagnosticTechniques({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DiagnosticTechniqueFilterForm>) {
  const filterText = languageGB.baseRegistrations.diagnosticTechnique.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: DiagnosticTechniqueFilterForm | null): FilterFormValues {
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
