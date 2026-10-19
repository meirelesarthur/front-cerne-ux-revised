// src/pages/Operacional/PesagemRodoviaria/FilterSideModuleWeighing.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Pesagem Rodoviária (ModuleWeighing,
// FE-SCR-01, TASK-MWG-FE-02) — Contrato B canônico (`FilterModalProps<T>`,
// seis props exatas), mirror `Operacional/Pesagem/FilterSidePesagem.tsx`
// (feature irmã ANIMAL).
//
// 5 filtros (`FM-001..FM-005`): responsável (user), equipamento, armazém,
// produto, fornecedor — todos via `SelectAsyncPaginate`.
//
// DV-008 FECHADO aqui (mirror do relatório, `TASK-MWG-FE-09`): o filtro de
// produto usa a MESMA fonte AJAX que o relatório (`listProductOptions`,
// `LK-025`) — nunca o lookup vazio que o legado usava na listagem.
//
// Re-hidratação via `toInternalValues(filter)` num único `useEffect` com
// deps `[isOpen]` — nunca `[filter]` (Contrato B canônico, `*_label`
// companions DISPLAY-ONLY, nunca contam como filtro aplicado nem vão ao
// payload real).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listUsers } from '@/services/v2/Users/user-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { ModuleWeighingFilterForm } from '@/@types/v2/ModuleWeighing/module-weighing';
import type { ProductOption } from '@/@types/v2/Products';
import type { UserListItem } from '@/@types/v2/Users';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

interface FilterFormValues {
  responsible: Option<string> | null;
  equipment: Option<string> | null;
  warehouse: Option<string> | null;
  product: Option<string> | null;
  provider: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  responsible: null,
  equipment: null,
  warehouse: null,
  product: null,
  provider: null,
};

export function FilterSideModuleWeighing({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ModuleWeighingFilterForm>) {
  const filterText = languageGB.moduleWeighing.moduleWeighing.list.filter;

  function toInternalValues(rawFilter?: ModuleWeighingFilterForm | null): FilterFormValues {
    return {
      responsible: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
      equipment: rawFilter?.equipment_uuid
        ? {
            value: rawFilter.equipment_uuid,
            label: rawFilter.equipment_label ?? rawFilter.equipment_uuid,
          }
        : null,
      warehouse: rawFilter?.warehouse_uuid
        ? {
            value: rawFilter.warehouse_uuid,
            label: rawFilter.warehouse_label ?? rawFilter.warehouse_uuid,
          }
        : null,
      product: rawFilter?.product_uuid
        ? {
            value: rawFilter.product_uuid,
            label: rawFilter.product_label ?? rawFilter.product_uuid,
          }
        : null,
      provider: rawFilter?.provider_uuid
        ? {
            value: rawFilter.provider_uuid,
            label: rawFilter.provider_label ?? rawFilter.provider_uuid,
          }
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      user_uuid: data.responsible?.value || undefined,
      user_label: data.responsible?.label,
      equipment_uuid: data.equipment?.value || undefined,
      equipment_label: data.equipment?.label,
      warehouse_uuid: data.warehouse?.value || undefined,
      warehouse_label: data.warehouse?.label,
      product_uuid: data.product?.value || undefined,
      product_label: data.product?.label,
      provider_uuid: data.provider?.value || undefined,
      provider_label: data.provider?.label,
    } as ModuleWeighingFilterForm);
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
            name="responsible"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.responsible}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
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
            name="equipment"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.equipment}
                service={listEquipmentCatalogOptions}
                mapOptions={(item: EquipmentOption) => ({
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
            name="warehouse"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.warehouse}
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

          {/* DV-008 fechado — mesma fonte AJAX do relatório (`listProductOptions`,
              LK-025), nunca o lookup vazio do legado. */}
          <Controller
            name="product"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.product}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
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
            name="provider"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.provider}
                service={listProviderOptions}
                mapOptions={(item: ProviderOptionItem) => ({ label: item.label, value: item.uuid })}
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

export default FilterSideModuleWeighing;
