// src/pages/CadastrosBase/Fornecedores/FilterSideFornecedores.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Fornecedores.
//
// DIVERGÊNCIA DELIBERADA do mirror mecânico dos irmãos de Cadastros Base
// (Emissores/Armazem/CategoriasProduto etc., que usam `<VStack as="form">`):
// esta Tarefa (TASK-PR-FE-02) instrui explicitamente `<Form formFilter>` +
// `Form.BodyFilter`/`Form.FooterFilter` (componente canônico novo,
// `@/components/Form`, ainda só adotado na camada de EXEMPLO —
// `_examples/pages/cadastros/recursos/FilterSideRecursos.tsx` — mirror real
// desta tela). `<VStack as="form">` é NUNCA aceitável para telas novas
// (regra explícita da ficha).
//
// Contrato real (Provider-FrontEnd-contrato.md ## 4/## 6.1): search (Input,
// nif/name/nickname) + type (Select ESTÁTICO, `providerTypeOptions`, enum
// int-backed — escrita sempre em INT) + city (SelectAsyncPaginate real sobre
// `/cities/options`, PORTALIZADO — armadilha #7) + isEnabled (Select
// Ativo/Inativo — `ProviderFilterData.isEnabled` usa `WithCast(bool)` no
// backend, mesmo Anti-Gap de LowReason/AdditionalInfo).
//
// `ProviderFilterForm` (TASK-PR-FE-01, `@/@types/v2/CadastrosBase/provider`)
// já guarda `type`/`city`/`isEnabled` como `Option<T> | null` COMPLETOS (não
// só o valor cru) — por isso este form usa `ProviderFilterForm` DIRETO como
// forma interna (sem tipo intermediário): o próprio Option guarda o `label`
// para re-hidratação (equivalente ao par `_uuid`/`_label` separado usado em
// FilterSideCategoriasProduto.tsx, armadilha #8). O achatamento para os
// query params crus (`type.value`/`city.value`/`isEnabled.value`) acontece
// só em `useProviders.tsx` (`useProviderList`), nunca aqui.
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

import { providerTypeOptions } from '@/constants/cadastrosBase/provider/options';

import { listCityOptions } from '@/services/v2/Cities/city-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ProviderFilterForm } from '@/@types/v2/CadastrosBase/provider';
import type { CityListItem } from '@/@types/v2/Cities';

const pristineFormValues: ProviderFilterForm = {
  search: '',
  type: null,
  city: null,
  isEnabled: null,
};

export function FilterSideFornecedores({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ProviderFilterForm>) {
  const filterText = languageGB.providers.provider.filter;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: filterText.enabledOptions.active },
    { value: false, label: filterText.enabledOptions.inactive },
  ];

  // Re-resolve `type`/`isEnabled` pela LISTA ESTÁTICA de opções (por
  // `.value`), nunca confiando no `label` eventualmente persistido em
  // `paginatedQuery.filter` (ex.: o filtro PADRÃO da tela, aplicado
  // antes de o usuário abrir o drawer, guarda `isEnabled.label: ''` —
  // ver `defaultFilter` em `index.tsx`). `city` não tem lista estática
  // (assíncrona) — o Option completo (com label) É a única fonte,
  // preservado direto do que já está aplicado.
  function toInternalValues(rawFilter?: ProviderFilterForm | null): ProviderFilterForm {
    return {
      search: rawFilter?.search ?? '',
      type:
        providerTypeOptions.options(languageGB).find((o) => o.value === rawFilter?.type?.value) ??
        null,
      city: rawFilter?.city ?? null,
      isEnabled: enabledOptions.find((o) => o.value === rawFilter?.isEnabled?.value) ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<ProviderFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: ProviderFilterForm) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      type: data.type ?? undefined,
      city: data.city ?? undefined,
      isEnabled: data.isEnabled ?? undefined,
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

  // Re-hidrata o form a partir do filtro REALMENTE aplicado sempre que o
  // drawer abre — deps SOMENTE `[isOpen]` (nunca `filter`, senão todo
  // refetch da grid — que troca a referência do objeto — reabriria o efeito
  // e sobrescreveria (clobber) o que o usuário está digitando/selecionando
  // dentro do drawer já aberto, mesmo motivo documentado em
  // FilterSideCategoriasProduto.tsx/FilterSideEmissores.tsx).
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.type}
                placeholder={filterText.typeAll}
                name={name}
                // Armadilha #9 do checklist: `?? null`, NUNCA `?? undefined`
                // — `<AsyncPaginate>`/`<Select>` controlado vira
                // NÃO-controlado com `undefined` e mantém a última seleção.
                value={value ?? null}
                onChange={onChange}
                options={providerTypeOptions.options(languageGB)}
              />
            )}
          />

          <Controller
            name="city"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.city}
                placeholder={filterText.cityAll}
                service={listCityOptions}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                mapOptions={(item: CityListItem) => ({
                  label: `${item.title} — ${item.state?.letter ?? ''}`,
                  value: item.uuid,
                })}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                // Armadilha #7 — portaliza SÓ esta instância no <body>, fora
                // do fluxo do Drawer (Drawer.Body tem overflow auto e
                // recortaria o menu não-portalizado).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="isEnabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isEnabled}
                placeholder={filterText.isEnabledAll}
                name={name}
                value={value ?? null}
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
