// src/pages/CadastrosBase/Fazendas/FilterSideFazendas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Fazendas — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev, §20.2 do contrato — NUNCA `<VStack as="form">`, diferente
// do padrão majoritário do fork em `FilterSideFamiliaBens.tsx`/
// `FilterSideCentroCusto.tsx` etc.). Referência de composição real:
// `src/_examples/pages/cadastros/recursos/FilterSideRecursos.tsx` (único
// consumidor real de `formFilter` no fork hoje).
//
// Contrato real (`FarmFilterData`, código — NÃO a prosa do contrato que
// menciona um `state_id` inexistente): `search` (Input) + `is_enabled`
// (Select Ativo/Inativo/Todos) + `tenant_id` (só `Gestor_Plataf`,
// `GAP-FE-122` — `NumberInput` puro: não há endpoint que devolva
// `uuid`+`id` numérico de Tenant ao mesmo tempo, ver nota em
// `CreateOrUpdateFarm.tsx`). SEM filtro de intervalo de datas (`GAP-FE-122`,
// ausente em `FarmFilterData`).
//
// TASK-FE-580 (2026-07-30) — o filtro `country_id` ("País (ID)") foi
// REMOVIDO por decisão do dev (redução consciente de escopo, não regressão):
// o campo pedia o ID interno numérico do país, um catálogo vazado na UI. O
// backend (`FarmFilterData`/`FarmRepository`/`FarmIndexRequest`) foi mantido
// intocado de propósito. NÃO confundir com o campo `country_uuid` do
// FORMULÁRIO de Fazenda (`StepEndereco.tsx`), que continua intacto.
//
// Re-hidratação ao reabrir — mesmo padrão de `FilterSideRecursos.tsx`: um
// único `useEffect([isOpen])` reconstrói o form a partir de `filter`
// (`paginatedQuery.filter`, contrato `FilterModalProps`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';

import { usePermissions } from '@/hooks/usePermissions';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FarmFilterForm } from '@/@types/v2/Farms/farm-admin';

// Forma INTERNA do form — `is_enabled` trabalha com `Option` (Select), o
// submit converte para `FarmFilterForm` (strings cruas), mesmo padrão de
// `FilterSideFamiliaBens.tsx`.
interface FilterFormValues {
  search: string;
  is_enabled: Option<string> | null;
  tenant_id: number | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  is_enabled: null,
  tenant_id: null,
};

export function FilterSideFazendas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FarmFilterForm>) {
  const { hasRole } = usePermissions();
  // §20.2/GAP-FE-122 — coluna/filtro "Contratante" só para Gestor_Plataf
  // (papel de plataforma, não permissão dedicada — mesma exceção documentada
  // em `usePermissions.ts` para o módulo CentroCusto/DEC-005).
  const isGestorPlataf = hasRole('Gestor_Plataf');

  const text = languageGB.farms.farm.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  function toInternalValues(rawFilter?: FarmFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: rawFilter?.is_enabled
        ? (enabledOptions.find((option) => option.value === rawFilter.is_enabled) ?? null)
        : null,
      tenant_id: rawFilter?.tenant_id ?? null,
    };
  }

  // Re-hidratação ao (re)abrir o drawer — reconstrói a partir de `filter`
  // (`paginatedQuery.filter`), único useEffect, deps `[isOpen]`.
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    // Deps SOMENTE [isOpen] — deliberado (mesma disciplina de
    // `FilterSideFamiliaBens.tsx`/`FilterSideRecursos.tsx`): reagir a
    // `filter` clobaria o que o usuário está digitando dentro do drawer
    // aberto.
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: FarmFilterForm = {
      search: data.search?.trim() || undefined,
      is_enabled: (data.is_enabled?.value as FarmFilterForm['is_enabled']) || undefined,
      tenant_id: isGestorPlataf ? (data.tenant_id ?? undefined) : undefined,
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

          {/* GAP-FE-122 — Contratante (tenant_id) só para Gestor_Plataf. */}
          {isGestorPlataf && (
            <Controller
              name="tenant_id"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={text.tenantId}
                  placeholder={text.tenantIdPlaceholder}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  decimalPlaces={0}
                  min={1}
                />
              )}
            />
          )}
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
