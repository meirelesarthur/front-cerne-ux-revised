// src/pages/CadastrosBase/Produtos/Classes/FilterSideClasses.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Classes de Produto — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">`). Mirror de composição real:
// `Fazendas/FilterSideFazendas.tsx` (precedente mais recente do fork a usar
// `formFilter`).
//
// Contrato real (fiel ao legado `kinds/index.blade.php`, filtro
// `search`+`category`): `search` (Input) + `category_uuid` (SelectAsyncPaginate
// via `listCategoryProductOptions`, TASK-FE-945) + `is_enabled` (Select
// Ativo/Inativo/Todos).
//
// REPONTAMENTO (TASK-FE-945, correção pós-E2E): `listActiveCategoryProducts`
// (`GET /category-products/active`, gateado por `category-products_view` —
// causa do toast "Sem permissão" no E2E do dev) migrou para
// `listCategoryProductOptions` (`GET /category-products/options`,
// TASK-FE-942/TASK-BE-600) — lookup FLAT, SEM gate de permissão. Sem
// parâmetro de pai (Classe é o topo da cascata neste submódulo).
// `listActiveCategoryProducts` continua existindo em
// `category-product-service.ts` para outros consumidores.
//
// Re-hidratação ao reabrir — mesmo padrão de `FilterSideFazendas.tsx`/
// `FilterSideRacas.tsx`: um único `useEffect([isOpen])` reconstrói o form a
// partir de `filter` (`paginatedQuery.filter`).
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

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { KindFilterForm } from '@/@types/v2/Kinds';

// Forma INTERNA do form — os Selects trabalham com `Option`, o submit
// converte para `KindFilterForm` (strings cruas), mesmo padrão de
// `FilterSideFazendas.tsx`/`FilterSideRacas.tsx`.
interface FilterFormValues {
  search: string;
  category_uuid: Option<string> | null;
  is_enabled: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  category_uuid: null,
  is_enabled: null,
};

export function FilterSideClasses({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<KindFilterForm>) {
  const text = languageGB.kinds.kind.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  const enabledOptions: Option<string>[] = [
    { value: '1', label: text.enabledOptions.active },
    { value: '0', label: text.enabledOptions.inactive },
  ];

  // Re-hidratação ao (re)abrir o drawer — reconstrói a partir de `filter`
  // (`paginatedQuery.filter`), único useEffect, deps `[isOpen]` (mesma
  // disciplina de `FilterSideFazendas.tsx`/`FilterSideRacas.tsx`: reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto).
  //
  // `category_uuid` (BUG-FE — E2E feature 024): `KindFilterForm` agora
  // também persiste `category_label` (display-only, ver `Kinds/index.d.ts`),
  // então a re-hidratação reconstrói o par `{ label, value }` completo do
  // `SelectAsyncPaginate` com o NOME da Categoria, sem precisar de fetch
  // novo. FALLBACK para o próprio uuid como label quando `category_label`
  // não existir (compat com filtros já persistidos no localStorage ANTES
  // deste fix) — mesmo padrão de `FilterSideRacas.tsx`/`specie_label`.
  function toInternalValues(rawFilter?: KindFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      category_uuid: rawFilter?.category_uuid
        ? { value: rawFilter.category_uuid, label: rawFilter.category_label ?? rawFilter.category_uuid }
        : null,
      is_enabled: rawFilter?.is_enabled
        ? (enabledOptions.find((option) => option.value === rawFilter.is_enabled) ?? null)
        : null,
    };
  }

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: KindFilterForm = {
      search: data.search?.trim() || undefined,
      category_uuid: data.category_uuid?.value || undefined,
      // DISPLAY-ONLY (BUG-FE — E2E feature 024) — só para re-hidratar o
      // label no drawer; NUNCA enviado à API (ver Kinds/index.d.ts /
      // useKinds.tsx).
      category_label: data.category_uuid?.label,
      is_enabled: (data.is_enabled?.value as KindFilterForm['is_enabled']) || undefined,
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
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.category}
                placeholder={text.categoryAll}
                service={listCategoryProductOptions}
                mapOptions={(item: CategoryProductOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (não `?? undefined`) — mantém o componente
                // CONTROLADO ao limpar (mesma correção de
                // `FilterSideRacas.tsx`, TASK-BREED-FILTER-CLEAR-FIX).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
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
