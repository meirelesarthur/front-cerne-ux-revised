// src/pages/Administrativo/Fabrica/FoodBeat/FilterSideFoodBeat.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Batida (FoodBeat — Fábrica, TASK-FB-FE-05).
// Contrato B canônico de filtro (mirror `FilterSideFabrica.tsx`/
// `FilterSideSaldoInicial.tsx`) — `<Form formFilter>` (`Form.BodyFilter`/
// `Form.FooterFilter`), NUNCA `<VStack as="form">` cru.
//
// `FilterModalProps<FoodBeatFilterForm>` — 6 props exatas (`TASK-FB-FE-01`).
// DIFERENTE de `FilterSideFabrica.tsx` (que declara um `FilterFormValues`
// interno com `Option` e CONVERTE para o `FoodFilterForm` externo, flat
// strings, no submit): `FoodBeatFilterForm` (`@/@types/v2/FoodBeats`, já
// travado pela fundação `TASK-FB-FE-01`) já é `{ product_uuid?: Option|null,
// user_uuid?: Option|null, start_date?, end_date? }` — o form RHF interno
// USA o próprio `FoodBeatFilterForm` como tipo, sem um tipo intermediário. A
// vantagem: a re-hidratação ao reabrir o drawer é EXATA (o próprio `Option`
// completo — label+value — já vem persistido em `paginatedQuery.filter`,
// sem o limite do par uuid+`*_label` companion que `FilterSideFabrica.tsx`
// precisa aceitar para o Produto).
//
// A conversão `Option` → querystring crua (`ListFoodBeatsParams`) acontece
// em `FoodBeat/index.tsx::toRequestFilter` (mirror `FabricaList::toRequestFilter`),
// NÃO aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { FoodBeatFilterForm } from '@/@types/v2/FoodBeats';
import type { UserListItem } from '@/@types/v2/Users';

// Select de Ração/Produto — mirror EXATO de `listProductOptions` com
// `food_eligibility: 'food'` (mesma reconciliação já usada por
// `FilterSideFabrica.tsx`, categorias elegíveis `[36,53,44,56]`). O filtro
// de Batida cobre os DOIS ramos (Ração via `food.product`/Produto via
// `product`, OR server-side — ver "Riscos" da ficha), por isso reusa a MESMA
// elegibilidade "food" (Ração), não "feedstock" (matéria-prima).
async function listFoodBeatProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions({ ...params, food_eligibility: 'food' });
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapUserOption(item: UserListItem) {
  return { label: item.name, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const pristineFormValues: FoodBeatFilterForm = {
  product_uuid: null,
  user_uuid: null,
  start_date: '',
  end_date: '',
};

export function FilterSideFoodBeat({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FoodBeatFilterForm>) {
  const filterText = languageGB.foodBeats.foodBeat.filter;

  const { control, handleSubmit, reset, watch } = useForm<FoodBeatFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto,
  // mesma disciplina de `FilterSideSaldoInicial.tsx`/`FilterSideFabrica.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  function onSubmit(data: FoodBeatFilterForm) {
    handleFilterChange({
      product_uuid: data.product_uuid ?? undefined,
      user_uuid: data.user_uuid ?? undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...filter });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="product_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.product}
                placeholder={filterText.productPlaceholder}
                service={listFoodBeatProductOptions}
                mapOptions={mapProductOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="user_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.user}
                placeholder={filterText.userPlaceholder}
                service={listUsers}
                mapOptions={mapUserOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={filterText.startDate}
                maxDate={watchedEndDate ? new Date(`${watchedEndDate}T00:00:00`) : undefined}
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={filterText.endDate}
                minDate={watchedStartDate ? new Date(`${watchedStartDate}T00:00:00`) : undefined}
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

export default FilterSideFoodBeat;
