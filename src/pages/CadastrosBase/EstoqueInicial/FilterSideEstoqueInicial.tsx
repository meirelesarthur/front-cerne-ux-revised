// src/pages/CadastrosBase/EstoqueInicial/FilterSideEstoqueInicial.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de ESTOQUE INICIAL — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">` cru), mirror mecânico de
// `Produtos/Catalogo/FilterSideCatalogo.tsx`. TASK-FE-1042 (execução 026).
//
// Contrato de tela (§5): 3 campos — `search` (Input, produto/lote) +
// `product_uuid` (`SelectAsyncPaginate`) + `warehouse_uuid`
// (`SelectAsyncPaginate`, via `listWarehouseOptions`, já existe). Persistido
// como par uuid+label (mirror `ProductFilterForm.group_uuid/group_label`)
// para re-hidratar o drawer ao reabrir.
//
// ⚠️ `products/options` NÃO EXISTE ainda no fork (GAP de backend, contrato
// §7.2/§10 — dependência externa de `TASK-BE-705`). Interim documentado no
// task-packet: o Select de Produto aponta para `listProducts` (paginado,
// já existe, `product-service.ts`), com `mapOptions` extraindo
// `{uuid, code, description}` — funciona, só mais pesado (payload cheio em
// vez do lookup enxuto). TROCAR para `listProductOptions` assim que
// `TASK-BE-705` publicar `GET /products/options` — só este arquivo muda
// (findParams/mapOptions do Select), nenhum outro consumidor depende do
// service aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProducts } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { OpeningBalanceFilterForm } from '@/@types/v2/OpeningBalances';
import type { ProductListItem } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

// Forma INTERNA do form — os 2 Selects trabalham com `Option`, o submit
// converte para `OpeningBalanceFilterForm` (strings cruas + `*_label`
// companion), mesmo padrão de `FilterSideCatalogo.tsx`.
interface FilterFormValues {
  search: string;
  product_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  product_uuid: null,
  warehouse_uuid: null,
};

export function FilterSideEstoqueInicial({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<OpeningBalanceFilterForm>) {
  const text = languageGB.openingBalances.openingBalance.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Re-hidratação ao (re)abrir o drawer — reconstrói os 2 pares
  // `{label,value}` a partir de `filter` (`paginatedQuery.filter`), único
  // useEffect, deps `[isOpen]` (reagir a `filter` clobaria o que o usuário
  // está digitando com o drawer aberto — mesma disciplina de
  // `FilterSideCatalogo.tsx`).
  function toInternalValues(rawFilter?: OpeningBalanceFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      product_uuid: rawFilter?.product_uuid
        ? { value: rawFilter.product_uuid, label: rawFilter.product_label ?? rawFilter.product_uuid }
        : null,
      warehouse_uuid: rawFilter?.warehouse_uuid
        ? { value: rawFilter.warehouse_uuid, label: rawFilter.warehouse_label ?? rawFilter.warehouse_uuid }
        : null,
    };
  }

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: OpeningBalanceFilterForm = {
      search: data.search?.trim() || undefined,
      product_uuid: data.product_uuid?.value || undefined,
      product_label: data.product_uuid?.label,
      warehouse_uuid: data.warehouse_uuid?.value || undefined,
      warehouse_label: data.warehouse_uuid?.label,
    };
    handleFilterChange(applied);
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
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.product}
                placeholder={text.productPlaceholder}
                // Interim `listProducts` — ver nota de topo do arquivo
                // (`products/options` ainda não existe, GAP de backend).
                service={listProducts}
                mapOptions={(item: ProductListItem) => ({
                  label: `${item.code} — ${item.description}`,
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
            name="warehouse_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.warehouse}
                placeholder={text.warehousePlaceholder}
                service={listWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: `${item.initials} — ${item.description}`,
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
            variant="secondary"
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
