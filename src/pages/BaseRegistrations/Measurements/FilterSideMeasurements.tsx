// src/pages/BaseRegistrations/Measurements/FilterSideMeasurements.tsx
// -----------------------------------------------------------------------------
// Drawer de BUSCA da listagem de Un. de Medida (mesma casca global
// <FilterSide> de Vacinas/FilterSideVacinas.tsx e Racas/FilterSideRacas.tsx).
//
// Acréscimo pós-migração (decisão explícita do dev no E2E) — o legado NÃO
// tinha busca (Doc Bruta §4/§13). Enxuto de propósito: SÓ `search` (Sigla OU
// Descrição, `MeasurementFilterData` no backend, ILIKE). SEM `is_enabled`
// (Measurement não tem status/ativo) e SEM FK (catálogo flat, sem
// relacionamento) — únicas diferenças estruturais em relação a
// FilterSideVacinas, que também tem Status + Espécie.
//
// Re-hidratação (mesmo padrão de FilterSideVacinas/FilterSideRacas): o form
// lê `appliedFilter` só na transição fechado→aberto (deps `[isOpen]`,
// closure fresca no render em que o efeito dispara) — ver `useEffect` abaixo.
//
// Contrato B canônico (`FilterModalProps<MeasurementFilterForm>` — mesmo
// padrão de BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx
// e de Racas/FilterSideRacas.tsx): re-hidratação via `toInternalValues(filter)`
// (prop, não mais `appliedFilter` local), `pristineFormValues`, par
// `handleResetFilters`/`handleResetFiltersOnClose` e `useEffect` com deps
// `[isOpen]`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { MeasurementFilterForm } from '@/@types/v2/Measurements';

// Forma INTERNA do form — só `search` (campo único desta tela).
interface FilterFormValues {
  search?: string;
}

export function FilterSideMeasurements({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MeasurementFilterForm>) {
  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: MeasurementFilterForm | null): FilterFormValues {
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

  const text = languageGB.baseRegistrations.measurement.filter;

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
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
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
