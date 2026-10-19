// src/pages/CadastrosBase/Produtos/Catalogo/FilterSideCatalogo.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Produtos (Catálogo) — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">`). Mirror de composição real:
// `Produtos/Classes/FilterSideClasses.tsx` (precedente mais recente de
// catálogo com filtro server-side por FK), estendido para 3 selects em
// CASCATA REAL (Grupo→Categoria→Classe) em vez de 1.
//
// Contrato real (Product-Frontend-Contrato.md v1.1, §3.2): `search` (Input) +
// `group_uuid`/`category_uuid`/`kind_uuid` (`SelectAsyncPaginate` em cascata)
// + `has_lot`/`is_equipment`/`is_fiscal` (`Select` estático Sim/Não/Todos).
// SEM filtro de Status (`is_enabled`) — diferente da referência UX, fiel ao
// legado. `is_fiscal` (TASK-FE-946, correção pós-E2E) — mirror EXATO de
// `has_lot`/`is_equipment`, destrava o dev para isolar produtos fiscais no
// E2E de Regras Fiscais; backend recebe `is_fiscal` em paralelo
// (TASK-BE-602, `ProductFilterData`).
//
// REPONTAMENTO (TASK-FE-943, correção pós-E2E) — os 3 Selects de cascata
// migraram de `listProductGroups`/`listCategoryProducts`/`listKinds`
// (paginados, gateados por `product-groups_view`/`category-products_view`/
// `kinds_view` — causa do toast "Sem permissão" no E2E do dev) para
// `listProductGroupOptions`/`listCategoryProductOptions`/`listKindOptions`
// (`GET /product-groups/options`, `/category-products/options`,
// `/kinds/options`, TASK-FE-942/TASK-BE-600/601) — lookups FLAT, SEM gate de
// permissão. GAP-FE-161 foi resolvida COM cascata: `listCategoryProductOptions`
// aceita `group_uuid` e `listKindOptions` aceita `category_uuid`, então o
// `findParams` de cada Select continua IDÊNTICO — só o `service` muda.
// `group_uuid`/`category_uuid` inválido/inexistente devolve LISTA VAZIA (não
// 422) — se um filtro persistido apontar para um pai que deixou de existir, o
// Select do filho aparece vazio ao reabrir, sem toast de erro (comportamento
// aceitável).
//
// CASCATA (Risco #2 da Tarefa): trocar o pai reseta os filhos no MESMO
// `onChange` do Controller (nunca só no submit nem via `useEffect` populando
// estado solto) — `setValue('category_uuid', null)`/`setValue('kind_uuid',
// null)` diretamente dentro do `onChange` de `group_uuid`, e
// `setValue('kind_uuid', null)` dentro do `onChange` de `category_uuid`.
// `category_uuid`/`kind_uuid` ficam `isDisabled` até o pai ser selecionado
// (contrato §3.2 — "habilitado só com group_uuid selecionado" /"...
// category_uuid selecionado"). `cacheUniqs` força o `AsyncPaginate` a
// descartar o cache de opções quando o pai muda (senão o menu do filho
// continuaria mostrando opções do pai anterior até o usuário digitar algo).
//
// RE-HIDRATAÇÃO (Risco #3 da Tarefa): `ProductFilterForm` (persistido em
// `paginatedQuery.filter`) já guarda os pares achatados `*_uuid`+`*_label`
// (mesmo padrão de `KindFilterForm.category_uuid`/`category_label`) — um
// único `useEffect([isOpen])` reconstrói os 3 `Option<string>` completos
// (`{ value, label }`) a partir deles, com fallback para o próprio uuid como
// label quando `*_label` não existir (compat com filtros persistidos antes
// deste padrão).
//
// BOOLEANOS (`has_lot`/`is_equipment`): o valor enviado ao backend é a
// STRING `'true'`/`'false'` (nunca boolean nativo) — `'false'` é truthy em
// JS (só `''` é falsy), então `data.has_lot?.value || undefined` NUNCA
// descarta o filtro "Não" (diferente do bug clássico de `boolean || undefined`
// descartar `false`). Ver nota em `ProductFilterForm`/`product-service.ts`.
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

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { listKindOptions } from '@/services/v2/Kinds/kind-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { KindOption } from '@/@types/v2/Kinds';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';
import type { ProductFilterForm } from '@/@types/v2/Products';

// Forma INTERNA do form — os 3 Selects de cascata e os 2 booleanos trabalham
// com `Option`, o submit converte para `ProductFilterForm` (strings cruas +
// `*_label` companion), mesmo padrão de `FilterSideClasses.tsx`.
interface FilterFormValues {
  search: string;
  group_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  kind_uuid: Option<string> | null;
  has_lot: Option<'true' | 'false'> | null;
  is_equipment: Option<'true' | 'false'> | null;
  is_fiscal: Option<'true' | 'false'> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  group_uuid: null,
  category_uuid: null,
  kind_uuid: null,
  has_lot: null,
  is_equipment: null,
  is_fiscal: null,
};

export function FilterSideCatalogo({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ProductFilterForm>) {
  const text = languageGB.products.product.filter;

  const { control, register, handleSubmit, reset, watch, setValue } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Observados para habilitar/desabilitar Categoria/Classe e alimentar a
  // cascata real (`findParams`/`cacheUniqs`).
  const groupValue = watch('group_uuid');
  const categoryValue = watch('category_uuid');

  const hasLotOptions: Option<'true' | 'false'>[] = [
    { value: 'true', label: text.hasLotOptions.yes },
    { value: 'false', label: text.hasLotOptions.no },
  ];

  const isEquipmentOptions: Option<'true' | 'false'>[] = [
    { value: 'true', label: text.isEquipmentOptions.yes },
    { value: 'false', label: text.isEquipmentOptions.no },
  ];

  const isFiscalOptions: Option<'true' | 'false'>[] = [
    { value: 'true', label: text.isFiscalOptions.yes },
    { value: 'false', label: text.isFiscalOptions.no },
  ];

  // Re-hidratação ao (re)abrir o drawer — reconstrói os 3 pares
  // `{label,value}` a partir de `filter` (`paginatedQuery.filter`), único
  // useEffect, deps `[isOpen]` (reagir a `filter` clobaria o que o usuário
  // está digitando com o drawer aberto — mesma disciplina de
  // `FilterSideClasses.tsx`/`FilterSideEmbalagens.tsx`).
  function toInternalValues(rawFilter?: ProductFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      group_uuid: rawFilter?.group_uuid
        ? { value: rawFilter.group_uuid, label: rawFilter.group_label ?? rawFilter.group_uuid }
        : null,
      category_uuid: rawFilter?.category_uuid
        ? {
            value: rawFilter.category_uuid,
            label: rawFilter.category_label ?? rawFilter.category_uuid,
          }
        : null,
      kind_uuid: rawFilter?.kind_uuid
        ? { value: rawFilter.kind_uuid, label: rawFilter.kind_label ?? rawFilter.kind_uuid }
        : null,
      has_lot: rawFilter?.has_lot
        ? (hasLotOptions.find((option) => option.value === rawFilter.has_lot) ?? null)
        : null,
      is_equipment: rawFilter?.is_equipment
        ? (isEquipmentOptions.find((option) => option.value === rawFilter.is_equipment) ?? null)
        : null,
      is_fiscal: rawFilter?.is_fiscal
        ? (isFiscalOptions.find((option) => option.value === rawFilter.is_fiscal) ?? null)
        : null,
    };
  }

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: ProductFilterForm = {
      search: data.search?.trim() || undefined,
      group_uuid: data.group_uuid?.value || undefined,
      group_label: data.group_uuid?.label,
      category_uuid: data.category_uuid?.value || undefined,
      category_label: data.category_uuid?.label,
      kind_uuid: data.kind_uuid?.value || undefined,
      kind_label: data.kind_uuid?.label,
      // Strings 'true'/'false' — NUNCA boolean (ver nota de topo do arquivo).
      has_lot: data.has_lot?.value,
      is_equipment: data.is_equipment?.value,
      is_fiscal: data.is_fiscal?.value,
    };
    handleFilterChange(applied);
    onClose();
  }

  // Botão "cancelar" hoje apenas fecha o drawer (SEM reset) — não existe
  // `handleResetFiltersOnClose` aqui porque o form não precisa de reidratação
  // adicional no cancelar. "Limpar" NÃO fecha o drawer — uniformizado ao
  // template canônico (`FilterSideDiagnosisPregnancy.tsx`).
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
            name="group_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.group}
                placeholder={text.groupAll}
                service={listProductGroupOptions}
                mapOptions={(item: ProductGroupOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (não `?? undefined`) — mantém o componente
                // CONTROLADO ao limpar (mesma correção de
                // `FilterSideClasses.tsx`).
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // CASCATA — trocar o Grupo reseta Categoria e Classe no
                  // MESMO onChange (nunca só no submit/useEffect), via
                  // `setValue` parcial do RHF.
                  setValue('category_uuid', null);
                  setValue('kind_uuid', null);
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.category}
                placeholder={groupValue ? text.categoryAll : text.categoryDisabledHint}
                isDisabled={!groupValue}
                service={listCategoryProductOptions}
                mapOptions={(item: CategoryProductOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  group_uuid: groupValue?.value,
                })}
                // Descarta o cache de opções quando o Grupo muda — senão o
                // menu continuaria oferecendo Categorias do Grupo anterior.
                cacheUniqs={[groupValue?.value]}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // CASCATA — trocar a Categoria reseta a Classe.
                  setValue('kind_uuid', null);
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="kind_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.kind}
                placeholder={categoryValue ? text.kindAll : text.kindDisabledHint}
                isDisabled={!categoryValue}
                service={listKindOptions}
                mapOptions={(item: KindOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  category_uuid: categoryValue?.value,
                })}
                cacheUniqs={[categoryValue?.value]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="has_lot"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.hasLot}
                placeholder={text.hasLotAll}
                name={name}
                value={value}
                onChange={onChange}
                options={hasLotOptions}
              />
            )}
          />

          <Controller
            name="is_equipment"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEquipment}
                placeholder={text.isEquipmentAll}
                name={name}
                value={value}
                onChange={onChange}
                options={isEquipmentOptions}
              />
            )}
          />

          <Controller
            name="is_fiscal"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isFiscal}
                placeholder={text.isFiscalAll}
                name={name}
                value={value}
                onChange={onChange}
                options={isFiscalOptions}
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
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
