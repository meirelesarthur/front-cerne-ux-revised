// src/pages/Operacional/FeedingPhase/FilterSideFeedingPhase.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Fases de Alimentação (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-02). Contrato B
// canônico de filtro (mirror `FilterSideDiet.tsx`) — `<Form formFilter>`
// (`Form.BodyFilter`/`Form.FooterFilter`), seis props exatas, re-hidratação
// em `[isOpen]`.
//
// Campos (FLT-01..03, contrato de tela §4.4): `name` (texto), `diet_uuid`
// (SelectAsyncPaginate reusando `listDietOptionsPaginated` — SEM MOCK),
// `change_rule` (select estático PD/PP + "Todas"). Os 3 filtros eram
// quebrados no legado — a API já os corrigiu (contrato de migração §5); o
// front só envia os 3 campos.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { feedingPhaseChangeRuleOptions } from '@/constants/feeding-phase/options';

import { listDietOptionsPaginated } from '@/services/v2/Diets/diet-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FeedingPhaseChangeRule, FeedingPhaseFilterForm } from '@/@types/v2/FeedingPhases';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `FeedingPhaseFilterForm` (strings/uuid
// crus), mirror `FilterSideDiet.tsx`.
interface FilterFormValues {
  name: string;
  diet: Option<string> | null;
  changeRule: Option<FeedingPhaseChangeRule> | null;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export function FilterSideFeedingPhase({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FeedingPhaseFilterForm>) {
  const filterText = languageGB.feedingPhases.feedingPhase.filter;

  const changeRuleOptions = feedingPhaseChangeRuleOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    name: '',
    diet: null,
    changeRule: null,
  };

  // Sem `*_label` companion persistido (mesma limitação aceita de
  // `FilterSideDietBeat.tsx`/`FilterSideFabrica.tsx`) — ao reabrir o drawer
  // com filtro já aplicado, o Select assíncrono de Dieta reabre vazio;
  // `name`/`changeRule` re-hidratam normalmente.
  function toInternalValues(rawFilter?: FeedingPhaseFilterForm | null): FilterFormValues {
    return {
      name: rawFilter?.name ?? '',
      diet: null,
      changeRule:
        changeRuleOptions.find((option) => option.value === rawFilter?.change_rule) ?? null,
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
      name: data.name.trim() || undefined,
      diet_uuid: data.diet?.value || undefined,
      change_rule: data.changeRule?.value || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado —
  // exceção documentada da Lei 2 (Contrato B, não é `fillForm` de dado de
  // servidor).
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
            label={filterText.name}
            placeholder={filterText.namePlaceholder}
            {...register('name')}
          />

          <Controller
            name="diet"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.diet}
                placeholder={filterText.dietAll}
                service={listDietOptionsPaginated}
                mapOptions={(item: Option<string>) => item}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="changeRule"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.changeRule}
                placeholder={filterText.changeRuleAll}
                name={name}
                value={value}
                onChange={onChange}
                options={changeRuleOptions}
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
