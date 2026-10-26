// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/FilterSideDiagnosticoGestacao.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Diagnóstico de Gestação — Contrato B
// canônico (`FilterModalProps<T>`, seis props exatas), corpo em `<Form
// noPadding formFilter>`, mirror `Acasalamento/FilterSideAcasalamento.tsx`
// (TASK-BM-FE-03) e `DeathAnimals/FilterSideDeathAnimals.tsx` (par de datas).
//
// Três campos (regra 6/contrato de tela §6.6): `Dt. Inicial`/`Dt. Final`
// (`InputDate` sob `Controller`, mirror `AcasalamentoHeaderFields.tsx` —
// value:Date|null↔ISO 'yyyy-MM-dd') e `Responsável` (`Select`, MESMO lookup
// `EP-BM-14`/`listResponsibleOptions` já consumido pelo filtro de
// Acasalamento — contrato de tela §5.4/§6.6, "Lookup do filtro Responsável:
// EP-BM-14").
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]`. `filter` (prop) é o tipo WIRE
// `PregnancyDiagnosisFilterRequest` (`start_date`/`end_date`/`user_uuid`).
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

import { listResponsibleOptions } from '@/services/v2/BreedingMating/breeding-mating-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  PregnancyDiagnosisFilterForm,
  PregnancyDiagnosisFilterRequest,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

const pristineFormValues: PregnancyDiagnosisFilterForm = {
  start_date: null,
  end_date: null,
  responsible: null,
};

export function FilterSideDiagnosticoGestacao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<PregnancyDiagnosisFilterRequest>) {
  const text = languageGB.breedingMatings.pregnancyDiagnosis.list.filter;

  // `responsible-options` (`EP-BM-14`) — PLANO, sem `meta`/paginação. MESMO
  // lookup do filtro de Acasalamento (contrato de tela §6.6).
  const responsibleOptionsQuery = useQuery({
    queryKey: [queryKey.breedingMatings.breedingMating, 'responsible-options'],
    queryFn: listResponsibleOptions,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const responsibleOptions: Option<string>[] = (responsibleOptionsQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  function toInternalValues(
    rawFilter?: PregnancyDiagnosisFilterRequest | null
  ): PregnancyDiagnosisFilterForm {
    const responsibleMatched = rawFilter?.user_uuid
      ? responsibleOptions.find((option) => option.value === rawFilter.user_uuid)
      : undefined;

    return {
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
      responsible:
        responsibleMatched ??
        (rawFilter?.user_uuid ? { value: rawFilter.user_uuid, label: rawFilter.user_uuid } : null),
    };
  }

  const { control, handleSubmit, reset } = useForm<PregnancyDiagnosisFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação — deps SOMENTE `[isOpen]` (nunca `filter`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: PregnancyDiagnosisFilterForm) {
    handleFilterChange({
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      user_uuid: data.responsible?.value || undefined,
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
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput
                  value={value ?? null}
                  onChange={(newValue) => onChange(newValue ?? null)}
                />
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
                  onChange={(newValue) => onChange(newValue ?? null)}
                />
              </Field>
            )}
          />

          <Controller
            name="responsible"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={text.responsible}
                options={responsibleOptions}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                loading={responsibleOptionsQuery.isLoading}
              />
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

export default FilterSideDiagnosticoGestacao;
