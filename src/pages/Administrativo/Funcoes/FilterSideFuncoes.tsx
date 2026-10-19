// src/pages/Administrativo/Funcoes/FilterSideFuncoes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Funções (mesma casca global <FilterSide>
// de FilterSideCentroCusto.tsx/FilterSideFamiliaBens.tsx — inspecionado
// `@/components/FilterSide` (Inspeção Obrigatória da ficha): a casca interna
// é um `Drawer` genérico (`Drawer.Body` recebe `children`); o form real é
// montado pelo CALLER via `<Form formFilter>` + `Form.BodyFilter` (campos) +
// `Form.FooterFilter` (botões), padrão canônico de TODOS os filtros reais do
// `frontend_root` hoje.
//
// Contrato real (TASK-FN-FE-01): search (Input, busca por `name` — DA-FN-15,
// rótulo "Buscar") + is_enabled (Select — Todos/Ativo/Inativo) + cbo_uuid
// (SelectAsyncPaginate sobre `listCboOptions`, portalizado por padrão,
// companheiro display-only `cbo_uuid_label`).
//
// Contrato B canônico (`FilterModalProps<FunctionFilterForm>`): re-hidratação
// via `toInternalValues(filter)` (prop `filter` = `paginatedQuery.filter` do
// index.tsx) somada a `pristineFormValues`, ressincronizada em um ÚNICO
// `useEffect` com deps `[isOpen]` — nunca `[filter]`, para não sobrescrever o
// que o usuário está digitando enquanto o drawer está aberto. Guard
// `if (!isOpen) return` evita reconstruir enquanto fechado.
//
// ⚠️ CHECKLIST item 19 — `is_enabled` SEMPRE stringificado com `??`, nunca
// `||` (`false`/"Inativo" é falsy e seria descartado por `||`).
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

import { listCboOptions } from '@/services/v2/Cbo/cbo-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CboOption } from '@/@types/v2/Cbo';
import type { FunctionFilterForm } from '@/@types/v2/Functions';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `FunctionFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  cbo_uuid: Option<string> | null;
}

export function FilterSideFuncoes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FunctionFilterForm>) {
  // Var local de i18n renomeada p/ `filterText` — evita colisão com a prop
  // `filter` do Contrato B (`FilterModalProps<FunctionFilterForm>`).
  const filterText = languageGB.functions.function.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: filterText.enabledOptions.active },
    { value: 'false', label: filterText.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    cbo_uuid: null,
  };

  function toInternalValues(rawFilter?: FunctionFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: rawFilter?.is_enabled
        ? (enabledOptions.find((option) => option.value === rawFilter.is_enabled) ?? null)
        : null,
      cbo_uuid: rawFilter?.cbo_uuid
        ? {
            value: rawFilter.cbo_uuid,
            label: rawFilter.cbo_uuid_label ?? rawFilter.cbo_uuid,
          }
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  // Deps SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o
  // usuário está digitando dentro do drawer aberto.
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
      // `??`, NUNCA `||` — checklist item 19 (`false` é falsy e seria
      // descartado por `||`, quebrando o filtro "Inativo").
      is_enabled: (data.is_enabled?.value as FunctionFilterForm['is_enabled']) ?? undefined,
      cbo_uuid: data.cbo_uuid?.value || undefined,
      // Display-only (checklist item 13) — nunca vai à API, só re-hidrata o Select.
      cbo_uuid_label: data.cbo_uuid?.label,
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

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="cbo_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.cbo}
                placeholder={filterText.cboAll}
                service={listCboOptions}
                mapOptions={(item: CboOption) => ({
                  label: `${item.code} — ${item.description}`,
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
                // Checklist item 12 — portaliza SÓ esta instância no <body>,
                // fora do fluxo do drawer (Drawer.Body tem overflow auto e
                // recorta o menu não-portalizado). NUNCA `position="fixed"` na
                // instância.
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
