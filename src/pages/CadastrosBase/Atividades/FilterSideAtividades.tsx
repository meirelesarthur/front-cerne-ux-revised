// src/pages/CadastrosBase/Atividades/FilterSideAtividades.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Atividades (mesma casca global <FilterSide>
// de FilterSideTiposTitulo.tsx — molde direto desta Tarefa, TASK-FE-026).
//
// Contrato real (Activity-contrato.md §9): search (Input, ILIKE em `name`) +
// type (Select — Custeio/Investimento/Á Definir, slugs de ActivityTypeSlug) +
// use (Select — Ambos/Agricultura/Fruticultura/Pecuária de Corte, slugs de
// ActivityUseSlug) + is_enabled (Select — Ativo/Inativo).
//
// PENDÊNCIA REGISTRADA (não bloqueia a entrega — autorizado pela Tarefa):
// filtro `operation_id` NÃO implementado nesta Tarefa. Confirmado por leitura
// direta de `GB.Cerne.Api/routes/api.php` (grep "oper"/"activit") — não existe
// NENHUM endpoint de `Operation` no fork (nem `/api/v1/operations`, nem rota
// legada equivalente registrada em `routes/api.php`); `Operation` continua
// 100% legado, servido apenas pelas views Blade do `agro365`. Sem endpoint
// para popular o `SelectAsyncPaginate`, o filtro é omitido aqui (Regra 9 —
// SEM MOCK mascarando integração). Reintroduzir quando `Operation` migrar
// para a API nova.
//
// Sem SelectAsyncPaginate, sem companion `_label`, sem
// menuPortalTarget/menuPosition="fixed" — `type`/`use`/`is_enabled` são
// Selects Chakra estáticos (enums de slug fixos), que já portalizam
// nativamente (mesmo racional de FilterSideTiposTitulo.tsx).
//
// RE-HIDRATAÇÃO — Contrato B: prop `filter` (o index.tsx passa
// `filter={paginatedQuery.filter}`) + `useEffect` com deps `[isOpen]` APENAS
// (nunca incluir `filter` nas deps — evitaria reset no meio de uma edição do
// usuário enquanto o drawer está aberto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ActivityFilterForm, ActivityTypeSlug, ActivityUseSlug } from '@/@types/v2/Activities';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `ActivityFilterForm` (slugs crus).
interface FilterFormValues {
  search?: string;
  type: Option<ActivityTypeSlug> | null;
  use: Option<ActivityUseSlug> | null;
  is_enabled: Option<string> | null;
}

export function FilterSideAtividades({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ActivityFilterForm>) {
  const text = languageGB.activities.activity.filter;

  const typeOptions: Option<ActivityTypeSlug>[] = [
    { value: 'custeio', label: text.typeOptions.costing },
    { value: 'investimento', label: text.typeOptions.investment },
    { value: 'a_definir', label: text.typeOptions.undefined },
  ];

  const useOptions: Option<ActivityUseSlug>[] = [
    { value: 'ambos', label: text.useOptions.both },
    { value: 'agricultura', label: text.useOptions.agriculture },
    { value: 'fruticultura', label: text.useOptions.fruitculture },
    { value: 'pecuaria_corte', label: text.useOptions.beefCattle },
  ];

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    type: null,
    use: null,
    is_enabled: null,
  };

  function toInternalValues(rawFilter?: ActivityFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      type: typeOptions.find((o) => o.value === rawFilter?.type) ?? null,
      use: useOptions.find((o) => o.value === rawFilter?.use) ?? null,
      is_enabled: enabledOptions.find((o) => o.value === rawFilter?.is_enabled) ?? null,
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
      type: data.type?.value || undefined,
      use: data.use?.value || undefined,
      is_enabled: (data.is_enabled?.value as ActivityFilterForm['is_enabled']) || undefined,
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
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.type}
                placeholder={text.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="use"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.use}
                placeholder={text.useAll}
                name={name}
                value={value}
                onChange={onChange}
                options={useOptions}
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
            height="4"
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
