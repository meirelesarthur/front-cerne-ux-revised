// src/pages/BaseRegistrations/BodyScores/FilterSideBodyScores.tsx
// Drawer de FILTRO da listagem de Escore Corporal — mirror `FilterSideRacas.tsx`
// (Espécie via `SelectAsyncPaginate`), SEM o Select de status.
//
// Contrato real (BodyScore-contrato.md `## 3`, `BodyScoreFilterData`): o DTO de
// filtro do backend só aceita `search` e `specie_uuid`. Diferente de
// `DiagnosisPregnancy`/`Racas` (que filtram por `is_enabled`), NÃO existe
// filtro de status no backend — adicionar um Select aqui seria um campo morto
// (a querystring seria ignorada, dando falsa sensação de filtro funcionando).
//
// Contrato B canônico (`FilterModalProps<BodyScoresFilterForm>` — mesmo padrão
// de `FilterSideDiagnosisPregnancy.tsx`/`FilterSideRacas.tsx`): re-hidratação
// via `toInternalValues(filter)`, `pristineFormValues`, par
// `handleResetFilters`/`handleResetFiltersOnClose` e `useEffect` com deps
// `[isOpen]`. `specie_label` (display-only, ver `bodyScore/index.d.ts`) é
// persistido para re-hidratar o label do `SelectAsyncPaginate` sem novo fetch
// (mirror `BreedFilterForm.specie_label`).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listSpecies } from '@/services/v2/Species/species-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BodyScoresFilterForm } from '@/@types/v2/BaseRegistrations/bodyScore';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `BodyScoresFilterForm` (string crua).
interface FilterFormValues {
  search?: string;
  specie_uuid: Option<string> | null;
}

export function FilterSideBodyScores({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BodyScoresFilterForm>) {
  const filterText = languageGB.baseRegistrations.bodyScore.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
    specie_uuid: null,
  };

  function toInternalValues(rawFilter?: BodyScoresFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      specie_uuid: rawFilter?.specie_uuid
        ? { value: rawFilter.specie_uuid, label: rawFilter.specie_label ?? rawFilter.specie_uuid }
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      // Server-side (contrato §3) — vai à querystring de /body-scores.
      specie_uuid: data.specie_uuid?.value || undefined,
      // DISPLAY-ONLY — só para re-hidratar o label no drawer; NUNCA enviado à
      // API (ver bodyScore/index.d.ts / bodyScore-service.ts).
      specie_label: data.specie_uuid?.label,
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

          <Controller
            name="specie_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.specie}
                placeholder={filterText.specieAll}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (NÃO `?? undefined`) — mesma correção documentada
                // em `FilterSideRacas.tsx` (TASK-BREED-FILTER-CLEAR-FIX):
                // `handleResetFilters()` põe `field.value = null`; caindo em
                // `undefined` o <AsyncPaginate> vira NÃO-CONTROLADO e mantém a
                // última seleção interna.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // Portaliza no <body> — o Drawer.Body do FilterSide (overflow
                // auto) recorta o menu não-portalizado. Sem `position="fixed"`
                // direto na prop de estilo (cai no default "absolute" do
                // SelectAsyncPaginate — mesma nota de `FilterSideRacas.tsx`).
                menuPortalTarget={document.body}
                menuPosition="fixed"
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
