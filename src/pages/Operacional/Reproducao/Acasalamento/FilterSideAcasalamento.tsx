// src/pages/Operacional/Reproducao/Acasalamento/FilterSideAcasalamento.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Acasalamento — Contrato B canônico
// (`FilterModalProps<T>`, seis props exatas), corpo em `<Form noPadding
// formFilter>` (regra 5 da Tarefa 03, contrato de tela §6.1). Dois campos:
// `Responsável` (`EP-BM-14`, `listResponsibleOptions`) e `Lote de Reprodução`
// (`listBatchOptions` de `BreedingBatch`, mesmo lookup consumido por
// `LoteReproducao/CreateOrUpdateLoteReproducao.tsx`, sem
// `exclude_breeding_batch_uuid` — não há contexto de edição num filtro).
// Ambos os lookups são PLANOS (sem paginação/`meta`) — `useQuery` direto,
// NUNCA `SelectAsyncPaginate`.
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (checklist do padrão do projeto). `filter`
// (prop) é o tipo WIRE `BreedingMatingFilterRequest` (`user_uuid`/
// `breeding_batch_uuid`); o formulário interno usa o tipo Option-based
// `BreedingMatingFilterForm` (já definido na Tarefa 02, reusado aqui).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';

import { queryKey } from '@/constants/query-key';

import { listBatchOptions } from '@/services/v2/BreedingBatch/breeding-batch-service';
import { listResponsibleOptions } from '@/services/v2/BreedingMating/breeding-mating-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  BreedingMatingFilterForm,
  BreedingMatingFilterRequest,
} from '@/@types/v2/BreedingMating';

const pristineFormValues: BreedingMatingFilterForm = {
  responsible: null,
  breeding_batch: null,
};

export function FilterSideAcasalamento({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BreedingMatingFilterRequest>) {
  const text = languageGB.breedingMatings.breedingMating.list.filter;

  // `responsible-options` (`EP-BM-14`) — PLANO, sem `meta`/paginação.
  const responsibleOptionsQuery = useQuery({
    queryKey: [queryKey.breedingMatings.breedingMating, 'responsible-options'],
    queryFn: listResponsibleOptions,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // `batch-options` (`BreedingBatch`, reuso integral) — PLANO, sem
  // `exclude_breeding_batch_uuid` (não há registro em edição num filtro).
  const batchOptionsQuery = useQuery({
    queryKey: [queryKey.breedingBatches.breedingBatch, 'batch-options'],
    queryFn: () => listBatchOptions(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const responsibleOptions: Option<string>[] = (responsibleOptionsQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  // Mesma composição de rótulo de `mapBatchOption` (`CreateOrUpdateLoteReproducao.tsx`)
  // — `${code} — ${description}` desambigua lotes com descrições parecidas.
  const batchOptions: Option<string>[] = (batchOptionsQuery.data ?? []).map((item) => ({
    label: `${item.code} — ${item.description}`,
    value: item.uuid,
  }));

  function toInternalValues(
    rawFilter?: BreedingMatingFilterRequest | null
  ): BreedingMatingFilterForm {
    // Sem endpoint de detalhe avulso para resolver o label a partir do uuid
    // isolado — resolve pela própria lista de opções já carregada (mesma
    // técnica tolerante de `FilterSideEstacaoDeMonta`).
    const responsibleMatched = rawFilter?.user_uuid
      ? responsibleOptions.find((option) => option.value === rawFilter.user_uuid)
      : undefined;

    const breedingBatchMatched = rawFilter?.breeding_batch_uuid
      ? batchOptions.find((option) => option.value === rawFilter.breeding_batch_uuid)
      : undefined;

    return {
      responsible:
        responsibleMatched ??
        (rawFilter?.user_uuid ? { value: rawFilter.user_uuid, label: rawFilter.user_uuid } : null),
      breeding_batch:
        breedingBatchMatched ??
        (rawFilter?.breeding_batch_uuid
          ? { value: rawFilter.breeding_batch_uuid, label: rawFilter.breeding_batch_uuid }
          : null),
    };
  }

  const { control, handleSubmit, reset } = useForm<BreedingMatingFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: BreedingMatingFilterForm) {
    handleFilterChange({
      user_uuid: data.responsible?.value || undefined,
      breeding_batch_uuid: data.breeding_batch?.value || undefined,
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

          <Controller
            name="breeding_batch"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={text.breedingBatch}
                options={batchOptions}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                loading={batchOptionsQuery.isLoading}
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

export default FilterSideAcasalamento;
