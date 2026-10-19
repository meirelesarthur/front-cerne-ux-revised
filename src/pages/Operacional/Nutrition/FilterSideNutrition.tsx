// src/pages/Operacional/Nutrition/FilterSideNutrition.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Nutrição (Nutrition — Operacional, F-050,
// esteira 066, TASK-NT-FE-02). Contrato B canônico de filtro (mirror
// `FilterSideFoodBeat.tsx`/`FilterSideCentroCusto.tsx`) — `<Form formFilter>`
// (`Form.BodyFilter`/`Form.FooterFilter`), NUNCA `<VStack as="form">` cru.
//
// `NutritionFilterForm` (`@/@types/v2/Nutritions`, travado pela fundação
// TASK-NT-FE-01) já é Option-based ({ start_date?, end_date?, product_uuid?:
// Option|null, batch_uuid?: Option|null, employee_uuid?: Option|null }) — o
// form RHF interno usa o próprio tipo, sem wrapper intermediário (mirror
// `FilterSideFoodBeat.tsx`, NÃO o padrão `toInternalValues` de
// `FilterSideCentroCusto.tsx`, que só é necessário quando o tipo externo é
// flat/string).
//
// 3 campos além das datas — FLT-01/02/04/05 (start_date/end_date/
// product_uuid/batch_uuid) + FLT-03 (employee_uuid, `CLM-08`):
//
//   - `product_uuid`: lookup PRÓPRIO de Nutrição (`getProducts`,
//     `nutrition-lookup-service.ts`, `DA-NT-05`/LK-02) — Collection PLANA
//     (SEM paginação/`meta`), por isso `Select` nativo + `useQuery` (busca
//     1 vez, filtra client-side pelo próprio Chakra Select), **NUNCA**
//     `SelectAsyncPaginate` (documentado explicitamente no cabeçalho do
//     lookup-service consumido — precedência sobre qualquer boilerplate
//     genérico de tarefa que sugira paginação nesta busca específica).
//   - `batch_uuid`: `SelectAsyncPaginate` sobre `listBatchOptions`
//     (`Batches`, reuso do catálogo já migrado — real paginação/busca
//     server-side, mirror `FilterSideSanitario.tsx`/`FilterSideAnimal.tsx`).
//   - `employee_uuid`: `SelectAsyncPaginate` sobre `listEmployeeOptions`
//     (`CadastrosBase/Employee`, reuso do catálogo já migrado) — decisão
//     SRF-02 do Arquiteto (ficha): filtro preservado na API mesmo sem
//     `<select>` confirmado na view legada (`CLM-08`, LACUNA de UI); optamos
//     por INCLUIR o campo no drawer (reversível: remover só este Controller
//     se o dono decidir omitir, sem tocar service/schema).
//
// Re-hidratação obrigatória — `useEffect(() => reset(...), [isOpen])`
// (Checklist de nova tela / Contrato B, `get_pwa_grid_query_pattern`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { queryKey } from '@/constants/query-key';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';
import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { getProducts } from '@/services/v2/Nutritions/nutrition-lookup-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { NutritionFilterForm, ProductLookupItem } from '@/@types/v2/Nutritions';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapBatchOption(item: BatchOption): Option {
  return { label: item.label, value: item.uuid };
}

function mapEmployeeOption(item: EmployeeOption): Option {
  return { label: item.name, value: item.uuid };
}

const pristineFormValues: NutritionFilterForm = {
  start_date: '',
  end_date: '',
  product_uuid: null,
  batch_uuid: null,
  employee_uuid: null,
};

export function FilterSideNutrition({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<NutritionFilterForm>) {
  const filterText = languageGB.nutritions.nutrition.filter;

  const { control, handleSubmit, reset, watch } = useForm<NutritionFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  // Lookup PRÓPRIO de Nutrição (LK-02) — Collection plana, busca 1 vez
  // (habilitada só quando o drawer está aberto, evita fetch antecipado).
  const productsQuery = useQuery({
    queryKey: [queryKey.nutritions.nutritions, 'lookups', 'products'],
    queryFn: getProducts,
    enabled: isOpen,
  });

  const productOptions: Option[] = (productsQuery.data ?? []).map((item: ProductLookupItem) => ({
    label: item.description,
    value: item.uuid,
  }));

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  function onSubmit(data: NutritionFilterForm) {
    handleFilterChange({
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      product_uuid: data.product_uuid ?? undefined,
      batch_uuid: data.batch_uuid ?? undefined,
      employee_uuid: data.employee_uuid ?? undefined,
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

          <Controller
            name="product_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={filterText.product}
                placeholder={filterText.productPlaceholder}
                options={productOptions}
                loading={productsQuery.isLoading}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.batch}
                placeholder={filterText.batchPlaceholder}
                service={listBatchOptions}
                mapOptions={mapBatchOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          {/* FLT-03/CLM-08 — filtro preservado na API mesmo sem <select>
              confirmado no legado (LACUNA de UI); decisão do Arquiteto
              (ficha desta Tarefa): incluir, por ser reversível e não
              remover uma capacidade que o backend já expõe. */}
          <Controller
            name="employee_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.employee}
                placeholder={filterText.employeePlaceholder}
                service={listEmployeeOptions}
                mapOptions={mapEmployeeOption}
                findParams={findParamsFromSearch}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
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

export default FilterSideNutrition;
