// src/pages/CadastrosBase/Operacoes/FilterSideOperacoes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Operações (mesma casca global <FilterSide>
// de FilterSideAtividades.tsx/FilterSideRacas.tsx).
//
// Contrato real (Operation-contrato.md v2.1 §10-A/§19): search (Input) + use
// (Select estático — Ambos/Agricultura/Pecuária, `OperationUseSlug` PRÓPRIO
// de 3 valores) + is_enabled (Select Ativo/Inativo) + grouper_uuid
// (`SelectAsyncPaginate` contra `listGrouperOptions` — GET /groupers/options,
// GAP-BE-040 Opção B, sem gate `groupers_view` — GAP-FE-006 resolvido, Opção
// B, RE-HABILITADO — não mais omitido).
//
// Precedente literal do campo "Agrupador": FilterSideRacas.tsx (campo
// `specie_uuid`) — portal (`menuPortalTarget`/`menuPosition="fixed"`, sem
// `position="fixed"` no menu interno), clear (`value ?? null`, NUNCA
// `?? undefined` — landmine TASK-BREED-FILTER-CLEAR-FIX) e re-hidratação
// (`specie_label`/aqui `grouper_label`, display-only, nunca enviado à API).
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
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listGrouperOptions } from '@/services/v2/Groupers/grouper-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { GrouperListItem } from '@/@types/v2/Groupers';
import type { OperationFilterForm, OperationUseSlug } from '@/@types/v2/Operations';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `OperationFilterForm` (slugs/uuid crus).
interface FilterFormValues {
  search?: string;
  use: Option<OperationUseSlug> | null;
  is_enabled: Option<string> | null;
  grouper_uuid: Option<string> | null;
}

export function FilterSideOperacoes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<OperationFilterForm>) {
  const text = languageGB.operations.operation.filter;

  const useOptions: Option<OperationUseSlug>[] = [
    { value: 'ambos', label: text.useOptions.both },
    { value: 'agricultura', label: text.useOptions.agriculture },
    { value: 'pecuaria', label: text.useOptions.livestock },
  ];

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    use: null,
    is_enabled: null,
    grouper_uuid: null,
  };

  function toInternalValues(rawFilter?: OperationFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      use: useOptions.find((o) => o.value === rawFilter?.use) ?? null,
      is_enabled: enabledOptions.find((o) => o.value === rawFilter?.is_enabled) ?? null,
      grouper_uuid: rawFilter?.grouper_uuid
        ? {
            value: rawFilter.grouper_uuid,
            label: rawFilter.grouper_label ?? rawFilter.grouper_uuid,
          }
        : null,
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
      use: data.use?.value || undefined,
      is_enabled: (data.is_enabled?.value as OperationFilterForm['is_enabled']) || undefined,
      // Server-side (GAP-FE-006 resolvido) — vai à querystring de /operations.
      grouper_uuid: data.grouper_uuid?.value || undefined,
      // DISPLAY-ONLY — só para re-hidratar o label no drawer; NUNCA enviado à API.
      grouper_label: data.grouper_uuid?.label,
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

          <Controller
            name="grouper_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.grouper}
                placeholder={text.grouperAll}
                service={listGrouperOptions}
                mapOptions={(item: GrouperListItem) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // TASK-BREED-FILTER-CLEAR-FIX: `?? null` (NÃO `?? undefined`) —
                // ver cabeçalho do arquivo.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // TASK-BREED-FILTER-FIX/-FIX-2 — portaliza no <body>, SEM
                // `position="fixed"` na prop do menu interno (ver cabeçalho).
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
