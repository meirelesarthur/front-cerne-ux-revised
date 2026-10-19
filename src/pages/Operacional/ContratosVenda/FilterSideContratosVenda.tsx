// src/pages/Operacional/ContratosVenda/FilterSideContratosVenda.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Contratos de Venda (Operacional /
// Agricultura, esteira 036, TASK-FE-036-205) — mesma casca `<FilterSide>` +
// `<Form formFilter>`/`Form.BodyFilter`/`Form.FooterFilter`, mirror mecânico
// de `Financeiro/Contrato/FilterSideContrato.tsx`.
//
// Contrato de tela (§3/TASK-FE-036-205): `search` (Input, ILIKE em
// `number`/`code`) + `client_uuid` (`SelectAsyncPaginate`, `listClients`) +
// `product_uuid` (`SelectAsyncPaginate`, `listProductOptions`, filtro
// `category_type: categoryProductType.production`) + `start_date`/
// `end_date` (2× `DateInput`, filtro de `date`).
//
// `listProductOptions`/`categoryProductType` (endpoint dedicado
// `/products/options`) — RECONCILIADO após merge com `origin/develop`
// (`GAP-FE-036-202`, indisponíveis na base antiga da branch; resolvido pelo
// rebase trazendo os módulos reais, mirror `ContractItemRow.tsx` de
// `Financeiro/Contrato`, exceto que ali o filtro é `input`, aqui é
// `production`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
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
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { SaleContractFilterForm } from '@/@types/v2/SaleContracts';

// Forma INTERNA do form (só deste componente) — os 2 Selects trabalham com
// `Option`, o submit converte para `SaleContractFilterForm` (uuid cru),
// mesmo padrão de `FilterSideContrato`.
interface FilterFormValues {
  search: string;
  client_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  client_uuid: null,
  product_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideContratosVenda({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<SaleContractFilterForm>) {
  const text = languageGB.saleContracts.saleContract.filter;

  // `SC2-A06` (2ª auditoria): reidratar com o próprio uuid como label fazia
  // o drawer reexibir o UUID cru em vez do nome escolhido. Agora usa o
  // companion `client_label`/`product_label` (DISPLAY-ONLY, persistidos
  // junto do filtro em `onSubmit` abaixo — mesmo padrão de
  // `FilterSideEstoqueInicial.tsx`/`OpeningBalanceFilterForm`); o uuid cru
  // só é usado como último recurso se o filtro foi aplicado antes desta
  // correção (label ainda não persistido).
  function toInternalValues(rawFilter?: SaleContractFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      client_uuid: rawFilter?.client_uuid
        ? { value: rawFilter.client_uuid, label: rawFilter.client_label ?? rawFilter.client_uuid }
        : null,
      product_uuid: rawFilter?.product_uuid
        ? {
            value: rawFilter.product_uuid,
            label: rawFilter.product_label ?? rawFilter.product_uuid,
          }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
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
      client_uuid: data.client_uuid?.value || undefined,
      // `client_label`/`product_label` — DISPLAY-ONLY, persistidos junto do
      // filtro só para a reidratação de `toInternalValues` acima (`SC2-A06`).
      client_label: data.client_uuid?.label || undefined,
      product_uuid: data.product_uuid?.value || undefined,
      product_label: data.product_uuid?.label || undefined,
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
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (mirror `FilterSideContrato`).
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
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="client_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.client}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: true,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.product}
                service={listProductOptions}
                mapOptions={(item: ProductOptionItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  category_type: categoryProductType.production,
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
              <DateInput value={value ?? null} onChange={onChange} placeholder={text.startDate} />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} placeholder={text.endDate} />
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
