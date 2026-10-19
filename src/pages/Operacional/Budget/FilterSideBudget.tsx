// src/pages/Operacional/Budget/FilterSideBudget.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Orçamentos (Budget — Operacional / Vendas,
// F-018, 97-Esteiras/054, TASK-BG-FE-02). Contrato B canônico de filtro
// (`<Form formFilter>`, `FilterModalProps<T>` 6 props exatas, re-hidratação
// em `[isOpen]`), mirror ESTRUTURAL de `FilterSideContratosVenda.tsx` (busca
// texto + 2 `SelectAsyncPaginate` + 2 `DateInput`), adaptado ao shape real
// de `BudgetFilterForm` (`@/@types/v2/Budgets`, TASK-BG-FE-01):
// `product`/`client` já são `Option<string> | null` diretos (sem par
// uuid+label separado, diferente de `SaleContractFilterForm`), e
// `start_date`/`end_date` são `Date | null` (não `string`) — a conversão
// para/de ISO (formato aceito por `DateInput`) acontece só NESTE arquivo,
// nas bordas de entrada/saída (`toInternalValues`/`onSubmit`).
//
// A conversão `Option`/`Date` → querystring crua (`ListBudgetsParams`)
// acontece em `Budget/index.tsx::toRequestFilter`, NÃO aqui (mesma separação
// de responsabilidade de `FilterSideRequisition`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { format, isValid, parse } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { categoryProductType } from '@/constants/CategoryProducts/category-product-type';

import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BudgetFilterForm } from '@/@types/v2/Budgets';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';

const DATE_FORMAT = 'yyyy-MM-dd';

// `DateInput` só aceita/devolve `string | null` (ISO) — `BudgetFilterForm`
// tipa `Date | null` (fundação, TASK-BG-FE-01). Conversão isolada aqui, nas
// duas bordas do drawer.
function toIsoDateString(date?: Date | null): string | null {
  return date ? format(date, DATE_FORMAT) : null;
}

function fromIsoDateString(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

// Forma INTERNA do form — datas em ISO (contrato de `DateInput`); o
// submit/re-hidratação converte para/de `Date` no boundary de
// `BudgetFilterForm`.
interface FilterFormValues {
  search: string;
  product: Option<string> | null;
  client: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  product: null,
  client: null,
  start_date: null,
  end_date: null,
};

function toInternalValues(rawFilter?: BudgetFilterForm | null): FilterFormValues {
  return {
    search: rawFilter?.search ?? '',
    product: rawFilter?.product ?? null,
    client: rawFilter?.client ?? null,
    start_date: toIsoDateString(rawFilter?.start_date),
    end_date: toIsoDateString(rawFilter?.end_date),
  };
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapClientOption(item: ClientListItem) {
  return { label: item.name, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export function FilterSideBudget({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BudgetFilterForm>) {
  const filterText = languageGB.budgets.budget.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mesma
  // disciplina de `FilterSideRequisition`/`FilterSideContratosVenda`).
  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      product: data.product ?? undefined,
      client: data.client ?? undefined,
      start_date: fromIsoDateString(data.start_date),
      end_date: fromIsoDateString(data.end_date),
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="product"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.product}
                placeholder={filterText.productPlaceholder}
                service={listProductOptions}
                mapOptions={mapProductOption}
                findParams={(search: string | { search: string }) => ({
                  ...findParamsFromSearch(search),
                  category_type: categoryProductType.production,
                })}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="client"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.client}
                placeholder={filterText.clientPlaceholder}
                service={listClients}
                mapOptions={mapClientOption}
                findParams={(search: string | { search: string }) => ({
                  ...findParamsFromSearch(search),
                  is_enabled: true,
                })}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value ?? null}
                onChange={onChange}
                placeholder={filterText.startDate}
              />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value ?? null}
                onChange={onChange}
                placeholder={filterText.endDate}
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

export default FilterSideBudget;
