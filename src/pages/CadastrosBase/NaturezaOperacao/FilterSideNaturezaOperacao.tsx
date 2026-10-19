// src/pages/CadastrosBase/NaturezaOperacao/FilterSideNaturezaOperacao.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Natureza de Operação (mesma casca global
// <FilterSide> de FilterSideInfoComplementares.tsx — molde deste drawer,
// acrescido de 1 Select extra: `tipo`).
//
// Contrato real (TASK-NO-FE-01): search (Input, busca por `descricao`/`code`)
// + tipo (Select — Entrada/Saída/Todos, `Option<number>`, valores `0`/`1` do
// `TipoOperacaoEnum` — só 2 valores fixos, hardcode local aceitável, mesmo
// racional já documentado para `is_active` em outras telas) + ativo (Select —
// Ativo/Inativo/Todos, mesmo padrão `is_active` de
// FilterSideInfoComplementares.tsx). Sem `SelectAsyncPaginate`, sem
// companion `_label` — nenhum dos 2 Selects consome FK/endpoint assíncrono
// (NatureOperation não tem FK própria NA LISTAGEM — as FKs
// `additional_info_uuid`/`tax_rule_uuid` só existem no formulário da Tarefa
// irmã TASK-NO-FE-02).
//
// RE-HIDRATAÇÃO — Contrato B: prop `filter` (o index.tsx passa
// `filter={paginatedQuery.filter}`) + `useEffect` com deps `[isOpen]` APENAS
// (nunca incluir `filter` nas deps — evitaria reset no meio de uma edição do
// usuário enquanto o drawer está aberto).
//
// CAST BOOL do filtro `ativo`: o Select trabalha com `Option<string>`
// ('true'/'false') por UX (mesmo componente usado em `is_active` em outras
// telas), mas o `NatureOperationFilterForm.ativo` real é `boolean | null` —
// o `submit()` converte explicitamente `'true'`/`'false'` → `true`/`false`
// (nunca `Boolean('false')`, que resultaria incorretamente em `true`).
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
import type { NatureOperationFilterForm } from '@/@types/v2/NatureOperations';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `NatureOperationFilterForm` (number/boolean crus).
interface FilterFormValues {
  search?: string;
  tipo: Option<number> | null;
  ativo: Option<string> | null;
}

export function FilterSideNaturezaOperacao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<NatureOperationFilterForm>) {
  const text = languageGB.natureOperations.natureOperation.filter;

  const tipoOptions: Option<number>[] = [
    { value: 0, label: text.tipoOptions.entrada },
    { value: 1, label: text.tipoOptions.saida },
  ];

  const activeOptions: Option<string>[] = [
    { value: 'true', label: text.activeOptions.active },
    { value: 'false', label: text.activeOptions.inactive },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    tipo: null,
    ativo: null,
  };

  function toInternalValues(rawFilter?: NatureOperationFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      tipo: tipoOptions.find((o) => o.value === rawFilter?.tipo) ?? null,
      ativo:
        rawFilter?.ativo === true
          ? activeOptions[0]
          : rawFilter?.ativo === false
            ? activeOptions[1]
            : null,
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
      tipo: typeof data.tipo?.value === 'number' ? data.tipo.value : undefined,
      // CAST BOOL explícito — nunca Boolean('false') (resultaria em `true`).
      ativo:
        data.ativo?.value === 'true' ? true : data.ativo?.value === 'false' ? false : undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            name="tipo"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.tipo}
                placeholder={text.tipoAll}
                name={name}
                value={value ?? null}
                onChange={onChange}
                options={tipoOptions}
              />
            )}
          />

          <Controller
            name="ativo"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.ativo}
                placeholder={text.ativoAll}
                name={name}
                value={value ?? null}
                onChange={onChange}
                options={activeOptions}
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
