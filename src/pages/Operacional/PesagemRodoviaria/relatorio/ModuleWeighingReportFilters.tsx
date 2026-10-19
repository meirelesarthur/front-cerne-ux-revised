// src/pages/Operacional/PesagemRodoviaria/relatorio/ModuleWeighingReportFilters.tsx
// -----------------------------------------------------------------------------
// Formulário de filtro do Relatório (FE-SCR-06, TASK-MWG-FE-09, retrabalho
// TASK-MWG-FE-10) — datas (OBRIGATÓRIAS, `DateInput`/`Controller`, mirror
// `CusteioAnimal/index.tsx:226-258`/`PrevisaoAreaReceita/index.tsx:221-258`),
// tipo, categoria, armazém, produto (`select2_ajax`, DV-008 fechado — mesma
// fonte `listProductOptions` da listagem), cliente. Os 5 filtros de domínio
// são OPCIONAIS (`FM-008..FM-012`, intocados) — não é grid paginada, sem
// persistência de página.
// -----------------------------------------------------------------------------

import { Box, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { moduleWeighingCategoryOptions } from '@/constants/ModuleWeighing/options/module-weighing-category-options';
import { moduleWeighingTypeOptions } from '@/constants/ModuleWeighing/options/module-weighing-type-options';

import { moduleWeighingReportFilterSchemaResolver } from '@/validations/schemas/ModuleWeighing/report-filter-schema';

import { listOrderClientOptions } from '@/services/v2/Orders/order-service';
import type { OrderClientOptionItem } from '@/services/v2/Orders/order-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import type { UseFormReturn } from 'react-hook-form';

export interface ModuleWeighingReportFilterValues {
  startDate: string | null;
  endDate: string | null;
  type: Option<number> | null;
  category: Option<string> | null;
  warehouse: Option<string> | null;
  product: Option<string> | null;
  client: Option<string> | null;
}

export function emptyReportFilterValues(): ModuleWeighingReportFilterValues {
  return {
    startDate: null,
    endDate: null,
    type: null,
    category: null,
    warehouse: null,
    product: null,
    client: null,
  };
}

export function useModuleWeighingReportFilterForm(): UseFormReturn<ModuleWeighingReportFilterValues> {
  const { languageGB } = useLanguage();
  return useForm<ModuleWeighingReportFilterValues>({
    mode: 'onChange',
    resolver: moduleWeighingReportFilterSchemaResolver(languageGB),
    defaultValues: emptyReportFilterValues(),
  });
}

export interface ModuleWeighingReportFiltersProps {
  form: UseFormReturn<ModuleWeighingReportFilterValues>;
}

function findParams(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export function ModuleWeighingReportFilters({ form }: ModuleWeighingReportFiltersProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing.report.filters;
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={1}>
          {text.startDate}
          <Text as="span" color="fg.error">
            {' '}
            *
          </Text>
        </Text>
        <Controller
          name="startDate"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DateInput value={value ?? null} onChange={onChange} />
          )}
        />
        {errors.startDate?.message && (
          <Text color="fg.error" fontSize="xs" mt={1}>
            {errors.startDate.message}
          </Text>
        )}
      </Box>

      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={1}>
          {text.endDate}
          <Text as="span" color="fg.error">
            {' '}
            *
          </Text>
        </Text>
        <Controller
          name="endDate"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DateInput value={value ?? null} onChange={onChange} />
          )}
        />
        {errors.endDate?.message && (
          <Text color="fg.error" fontSize="xs" mt={1}>
            {errors.endDate.message}
          </Text>
        )}
      </Box>

      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Select
            label={text.type}
            name={field.name}
            options={moduleWeighingTypeOptions.options(languageGB)}
            value={field.value}
            onChange={(option) => field.onChange(option ?? null)}
          />
        )}
      />

      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <Select
            label={text.category}
            name={field.name}
            options={moduleWeighingCategoryOptions.options(languageGB)}
            value={field.value}
            onChange={(option) => field.onChange(option ?? null)}
          />
        )}
      />

      <Controller
        name="warehouse"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.warehouse}
            service={listWarehouseOptions}
            mapOptions={(item: WarehouseOption) => ({
              label: `${item.initials} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={findParams}
            value={field.value ?? null}
            onChange={(option: any) => field.onChange(option ?? null)}
          />
        )}
      />

      <Controller
        name="product"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.product}
            service={listProductOptions}
            mapOptions={(item: ProductOption) => ({
              label: `${item.code} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={findParams}
            value={field.value ?? null}
            onChange={(option: any) => field.onChange(option ?? null)}
          />
        )}
      />

      <Controller
        name="client"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.client}
            service={listOrderClientOptions}
            mapOptions={(item: OrderClientOptionItem) => ({
              label: item.name ?? item.uuid,
              value: item.uuid,
            })}
            findParams={findParams}
            value={field.value ?? null}
            onChange={(option: any) => field.onChange(option ?? null)}
          />
        )}
      />
    </>
  );
}

export default ModuleWeighingReportFilters;
