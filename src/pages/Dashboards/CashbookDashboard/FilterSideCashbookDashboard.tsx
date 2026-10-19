// src/pages/Dashboards/CashbookDashboard/FilterSideCashbookDashboard.tsx
// Drawer de filtro da dashboard Livro Caixa (execução 048, TASK-03-FE) —
// Contrato B canônico (`FilterModalProps<T>`), 3 campos: Ano (`FLT-01`,
// Select estático ano atual até -5), Proprietário (`FLT-02`, Option async
// escopado à fazenda — mirror `CashBookDashboardRequest::rules()['proprietary_id']`,
// `scope: 'farm'`) e Tipo de movimentação (`FLT-03`, Select estático A/E/S).
// `filter` é a forma Option-based (mesmo racional de `AssetsDashboardFilterForm`).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { cashbookOperationOptions } from '@/constants/dashboards/cashbookDashboard/options/cashbook-operation-options';
import { cashbookYearOptions } from '@/constants/dashboards/cashbookDashboard/options/cashbook-year-options';

import { cashbookDashboardFilterSchema } from '@/validations/schemas/Dashboards/cashbookDashboard-filter-schema';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { CashbookDashboardFilterForm } from '@/@types/v2/Dashboards/cashbookDashboard';

const pristineFormValues: CashbookDashboardFilterForm = {
  year: null,
  proprietary: null,
  operation: null,
};

interface FilterSideCashbookDashboardProps extends FilterModalProps<CashbookDashboardFilterForm> {
  filtersApplied?: number;
}

interface ListProprietaryOptionsParams extends PaginationQueryParams {
  search?: string;
}

interface ProprietaryOptionItem {
  uuid: string;
  label: string;
}

/**
 * Adapta `listProprietaryOptions` (array direto, escopo `'farm'` — mirror
 * `CashBookDashboardRequest`, pivot `farm_proprietary`) ao contrato
 * `service` de `SelectAsyncPaginate`, mesma técnica de
 * `FilterSideAssetsDashboard.listProprietaryOptionsPaginated`.
 * @param {ListProprietaryOptionsParams} params - Parâmetros de busca (`search`) vindos do `SelectAsyncPaginate`.
 * @return {Promise<ResponsePagination<ProprietaryOptionItem[]>>} Envelope paginado de página única.
 */
async function listFarmProprietaryOptionsPaginated(
  params: ListProprietaryOptionsParams
): Promise<ResponsePagination<ProprietaryOptionItem[]>> {
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export function FilterSideCashbookDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideCashbookDashboardProps) {
  const text = languageGB.dashboards.cashbookDashboard.filter;
  const yearOptions = cashbookYearOptions.options();
  const operationOptions = cashbookOperationOptions.options(languageGB);

  function toInternalValues(
    rawFilter?: CashbookDashboardFilterForm | null
  ): CashbookDashboardFilterForm {
    return {
      year: rawFilter?.year ?? null,
      proprietary: rawFilter?.proprietary ?? null,
      operation: rawFilter?.operation ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<CashbookDashboardFilterForm>({
    resolver: yupResolver(cashbookDashboardFilterSchema()),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: CashbookDashboardFilterForm) {
    handleFilterChange(data);
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
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="year"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.year}
                name={name}
                value={value}
                onChange={onChange}
                options={yearOptions}
              />
            )}
          />

          <Controller
            name="proprietary"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.proprietary}
                placeholder={text.proprietaryAllPlaceholder}
                service={listFarmProprietaryOptionsPaginated}
                mapOptions={(item: ProprietaryOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="operation"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.operation}
                name={name}
                value={value}
                onChange={onChange}
                options={operationOptions}
                noClearable
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
