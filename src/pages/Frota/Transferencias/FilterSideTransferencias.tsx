// src/pages/Frota/Transferencias/FilterSideTransferencias.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Transferência de Máquinas — TASK-ETR-FE-02.
// Contrato B completo (`FilterModalProps<EquipmentTransferFilterForm>`,
// mirror `FilterSideAbastecimentos.tsx`), re-hidratação em `[isOpen]`.
//
// DOIS campos e NADA mais (`FI-01`/`FI-02`, contrato-tela §FE-10): período
// (`start_date`/`end_date`). O legado NÃO tem busca textual, filtro de
// status ou de fazenda — PROIBIDO inventá-los (a API aceita exatamente
// `start_date`/`end_date`/`page`/`per_page`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { EquipmentTransferFilterForm } from '@/@types/v2/EquipmentTransfers';

interface FilterFormValues {
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: null,
  end_date: null,
};

interface FilterSideTransferenciasProps extends FilterModalProps<EquipmentTransferFilterForm> {
  filtersApplied?: number;
}

export function FilterSideTransferencias({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideTransferenciasProps) {
  const text = languageGB.equipmentTransfers.equipmentTransfer.filter;

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // `get_pwa_grid_query_pattern`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
  }, [isOpen]);

  const startDate = watch('start_date');

  function onSubmit(data: FilterFormValues) {
    const applied: EquipmentTransferFilterForm = {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
    handleFilterChange(applied);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  minDate={startDate ? new Date(startDate) : undefined}
                />
              </Field>
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
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
