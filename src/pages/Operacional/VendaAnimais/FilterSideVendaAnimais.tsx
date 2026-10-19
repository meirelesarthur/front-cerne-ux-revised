// src/pages/Operacional/VendaAnimais/FilterSideVendaAnimais.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Venda de Animais — Contrato B canônico
// (`FilterModalProps<T>`), mirror `FilterSideRomaneios.tsx`.
//
// 5 campos (frontend-contract-vendas.md §5.2, `GAP-VD-02`, decisão do dono já
// tomada): `type_sale` é o ÚNICO filtro efetivamente aplicado pelo servidor
// (`MovementSaleRepository::listWithFilters()`); `search`/`client_uuid`/
// `start_date`/`end_date` são preservados MORTOS — aparecem normalmente na
// UI (mesma UX do legado, o usuário pode preenchê-los), o resultado
// simplesmente não muda. NÃO remover nem simular que funcionam de outra
// forma — é réplica fiel de comportamento real documentado, não um bug
// desta migração.
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
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { movementSaleTypeOptions } from '@/constants/GestaoAnimal/MovementSale/options';

import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { MovementSaleFilterForm, MovementSaleType } from '@/@types/v2/MovementSales';

interface FilterFormValues {
  type_sale: Option<MovementSaleType> | null;
  search: string;
  client_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  type_sale: null,
  search: '',
  client_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideVendaAnimais({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MovementSaleFilterForm>) {
  const filterText = languageGB.movementSales.movementSale.filter;
  const typeOptions = movementSaleTypeOptions.options(languageGB);

  function toInternalValues(rawFilter?: MovementSaleFilterForm | null): FilterFormValues {
    return {
      type_sale: rawFilter?.type_sale
        ? (typeOptions.find((option) => option.value === rawFilter.type_sale) ?? null)
        : null,
      search: rawFilter?.search ?? '',
      client_uuid: rawFilter?.client_uuid
        ? { value: rawFilter.client_uuid, label: rawFilter.client_label ?? rawFilter.client_uuid }
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
      type_sale: data.type_sale?.value || undefined,
      search: data.search?.trim() || undefined,
      client_uuid: data.client_uuid?.value || undefined,
      client_label: data.client_uuid?.label,
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

          <Controller
            name="type_sale"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.typeSale}
                placeholder={filterText.typeSaleAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Input label={filterText.search} {...register('search')} />

          <Controller
            name="client_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.client}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({
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
