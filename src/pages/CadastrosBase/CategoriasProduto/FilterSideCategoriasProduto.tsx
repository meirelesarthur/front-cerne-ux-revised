// src/pages/CadastrosBase/CategoriasProduto/FilterSideCategoriasProduto.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Categorias de Produto (mesma casca global
// <FilterSide> de GruposProduto/FilterSideGruposProduto.tsx e
// Racas/FilterSideRacas.tsx).
//
// Contrato real (TASK-CP-FE-01): search (Input, param `search`) + group_uuid
// (SelectAsyncPaginate, TASK-FE-973 repontado para `listProductGroupOptions`
// — GET /product-groups/options, SEM gate de `product-groups_view` — SEM
// filtro de ativos — DA-CP-07) + type (Select ESTÁTICO — Insumos/Máquinas/
// Produção) + is_enabled (Select — Ativo/Inativo).
//
// Contrato B (`FilterModalProps`): re-hidratação a partir da PROP `filter`
// (nunca de um literal fixo), companion `_label` do Select assíncrono
// (armadilha #1/#8 do checklist, mesmo padrão de Racas/FilterSideRacas.tsx
// `specie_uuid`/`specie_label`): `group_uuid` (vai à API) + `group_label`
// (display-only, nunca enviado). Deps do `useEffect` restritas a `[isOpen]`
// DE PROPÓSITO — `filter` é lido por CLOSURE, nunca dep (mesmo motivo
// documentado em FilterSideGruposProduto.tsx/FilterSideRacas.tsx).
//
// `SelectAsyncPaginate` portalizado por padrão (armadilha #7): sem isso o menu
// é recortado pelo container do drawer.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  CategoryProductFilterForm,
  CategoryProductTypeCode,
} from '@/@types/v2/CategoryProducts/category-product';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `CategoryProductFilterForm` (valores
// crus que a API espera: `type`/`is_enabled` são CÓDIGOS inteiros —
// TASK-CP-FE-FIX-03).
interface FilterFormValues {
  search?: string;
  group_uuid: Option<string> | null;
  type: Option<CategoryProductTypeCode> | null;
  is_enabled: Option<0 | 1> | null;
}

export function FilterSideCategoriasProduto({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CategoryProductFilterForm>) {
  const filterText = languageGB.categoryProducts.categoryProduct.filter;

  // TASK-CP-FE-FIX-03 — bug de homologação: filtro "Status" não filtrava.
  // O backend tem `#[WithCast(bool)]` em `CategoryProductFilterData.is_enabled`
  // — enviar as strings `'true'`/`'false'` (valor antigo) era interpretado
  // incorretamente. Ativo=1/Inativo=0 (inteiro) casa com segurança.
  const enabledOptions: Option<0 | 1>[] = [
    { value: 1, label: filterText.enabledOptions.active },
    { value: 0, label: filterText.enabledOptions.inactive },
  ];

  // TASK-CP-FE-FIX-03 — bug de homologação: filtro "Tipo" não filtrava. A API
  // (`CategoryProductFilterData.type`) é `int`-backed igual ao payload de
  // create/update (`CategoryProductTypeCode`, ver CreateOrUpdateCategoriaProduto.tsx)
  // — o nome ("INPUT") NÃO é aceito pelo filtro, mesmo que o GET/listagem
  // devolva o nome na coluna `type_label`.
  const typeOptions: Option<CategoryProductTypeCode>[] = [
    { value: 1, label: filterText.typeOptions.input },
    { value: 2, label: filterText.typeOptions.equipment },
    { value: 3, label: filterText.typeOptions.production },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    group_uuid: null,
    type: null,
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: CategoryProductFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      group_uuid: rawFilter?.group_uuid
        ? {
            value: rawFilter.group_uuid,
            label: rawFilter.group_label ?? rawFilter.group_uuid,
          }
        : null,
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      group_uuid: data.group_uuid?.value || undefined,
      // DISPLAY-ONLY — nunca vai à API, só para re-hidratar o Select.
      group_label: data.group_uuid?.label,
      // TASK-CP-FE-FIX-03 — checar a PRESENÇA do Option (`data.type ? ... :`),
      // NUNCA `data.type?.value || undefined`: `type` nunca é `0`, mas o
      // padrão abaixo é o mesmo usado em `is_enabled`, onde `0` (Inativo) É
      // um valor válido e `||` o descartaria silenciosamente.
      type: data.type ? data.type.value : undefined,
      is_enabled: data.is_enabled ? data.is_enabled.value : undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    // Deps: SOMENTE isOpen. NUNCA incluir `filter` aqui — se entrar, toda vez
    // que a grid re-fetcha (o que atualiza a referência do objeto `filter`) o
    // efeito dispara de novo e sobrescreve (clobber) o que o usuário está
    // digitando/selecionando dentro do drawer aberto.
  }, [isOpen]);

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
            name="group_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.group}
                placeholder={filterText.groupAll}
                service={listProductGroupOptions}
                mapOptions={(item: ProductGroupOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // Armadilha #10 do checklist: `?? null` NUNCA `?? undefined` —
                // `handleResetFilters()` põe `field.value = null`; caindo em
                // `undefined` o `<AsyncPaginate>` vira NÃO-CONTROLADO e mantém
                // a última seleção interna do react-select.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // Armadilha #7 — portaliza SÓ esta instância no <body>, fora do
                // fluxo do drawer (Drawer.Body tem overflow auto e recorta o
                // menu não-portalizado).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.type}
                placeholder={filterText.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isEnabled}
                placeholder={filterText.isEnabledAll}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            height="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
