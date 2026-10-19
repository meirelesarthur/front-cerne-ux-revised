// src/pages/Operacional/CompraAnimais/FilterSideCompraAnimais.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Compra de Animais — Contrato B canônico
// (`FilterModalProps<T>`), mirror `FilterSideVendaAnimais.tsx`.
//
// 4 campos (contrato-frontend-compras-movimento.md §5/§6, FLT-01..04) —
// DIFERENTE do achado de Vendas (`GAP-VD-02`): os 4 filtros
// (`search`/`provider_uuid`/`start_date`/`end_date`) SÃO todos efetivamente
// aplicados pelo servidor (`MovementPurchaseRepository::listWithFilters()`,
// confirmado contra o código real — ver docblock de
// `@/@types/v2/MovementPurchases`, achado #4). Nenhum filtro "preservado
// morto" nesta tela.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type { MovementPurchaseFilterForm } from '@/@types/v2/MovementPurchases';

interface FilterFormValues {
  search: string;
  provider_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  provider_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideCompraAnimais({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MovementPurchaseFilterForm>) {
  const filterText = languageGB.movementPurchases.movementPurchase.filter;

  function toInternalValues(rawFilter?: MovementPurchaseFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      provider_uuid: rawFilter?.provider_uuid
        ? {
            value: rawFilter.provider_uuid,
            label: rawFilter.provider_label ?? rawFilter.provider_uuid,
          }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, register } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (mirror Contrato B
  // canônico, `get_pwa_grid_query_pattern`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      provider_uuid: data.provider_uuid?.value || undefined,
      provider_label: data.provider_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Input label={filterText.search} {...register('search')} />

          <Controller
            name="provider_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.provider}
                service={listProviders}
                mapOptions={(item: ProviderListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
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
