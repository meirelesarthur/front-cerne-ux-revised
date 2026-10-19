// src/pages/Operacional/Reproducao/EstacaoDeMonta/FilterSideEstacaoDeMonta.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Estação de Monta — Contrato B canônico
// (`FilterModalProps<T>`, seis props exatas), mirror mecânico de
// `Administrativo/Faltas/FilterSideFaltas.tsx`, reduzido a 1 único campo
// "Responsável" (contrato de tela §4.3 — `BreedingSeasonFilterData` só tem
// `userUuid`/`perPage`, sem busca textual).
//
// `user-options` é PLANO (sem paginação, sem `meta`) — `Select` + `useQuery`,
// NUNCA `SelectAsyncPaginate` (armadilha confirmada da Tarefa 12).
//
// Re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]` (checklist item 1 do padrão do projeto).
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

import { listBreedingSeasonUserOptions } from '@/services/v2/BreedingSeasons/breeding-season-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BreedingSeasonFilterForm } from '@/@types/v2/BreedingSeasons';

interface FilterFormValues {
  user_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  user_uuid: null,
};

export function FilterSideEstacaoDeMonta({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BreedingSeasonFilterForm>) {
  const text = languageGB.breedingSeasons.breedingSeason.list.filter;

  // `user-options` é PLANO (sem `meta`/paginação) — `useQuery` direto,
  // NUNCA `SelectAsyncPaginate` (o endpoint não pagina, Tarefa 12).
  const userOptionsQuery = useQuery({
    queryKey: [queryKey.breedingSeasons.breedingSeason, 'user-options'],
    queryFn: listBreedingSeasonUserOptions,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const userOptions: Option<string>[] = (userOptionsQuery.data ?? []).map((item) => ({
    label: item.name,
    value: item.uuid,
  }));

  function toInternalValues(rawFilter?: BreedingSeasonFilterForm | null): FilterFormValues {
    // Sem endpoint de detalhe avulso para resolver o label a partir do uuid
    // isolado — resolve pela própria lista de opções já carregada (mesma
    // técnica tolerante de `FilterSideFaltas`, aqui com fonte finita).
    const matched = rawFilter?.user_uuid
      ? userOptions.find((option) => option.value === rawFilter.user_uuid)
      : undefined;

    return {
      user_uuid:
        matched ??
        (rawFilter?.user_uuid ? { value: rawFilter.user_uuid, label: rawFilter.user_uuid } : null),
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
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

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      user_uuid: data.user_uuid?.value || undefined,
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
            name="user_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={text.responsible}
                options={userOptions}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                loading={userOptionsQuery.isLoading}
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

export default FilterSideEstacaoDeMonta;
