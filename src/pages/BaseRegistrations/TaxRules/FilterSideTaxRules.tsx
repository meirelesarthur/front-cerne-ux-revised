// src/pages/BaseRegistrations/TaxRules/FilterSideTaxRules.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Regras Fiscais — mesma casca global
// <FilterSide>, variante SÓ `search` (mirror
// CondicoesPagamento/FilterSideCondicoesPagamento.tsx, sem os Selects
// adicionais que aquele módulo tem).
//
// Decisão registrada em TaxRule-contrato.md §16: o backend aceita
// `is_enabled` como filtro aditivo (TaxRuleIndexRequest), mas o task-packet só
// pediu "busca na listagem" — este drawer NÃO tem Select de status
// (fidelidade ao task-packet, sem inventar capacidade extra).
//
// RE-HIDRATAÇÃO — prop `filter` (Contrato B, o index.tsx passa
// `filter={paginatedQuery.filter}`) + `useEffect` com deps `[isOpen]`
// APENAS (nunca incluir `filter` nas deps — evitaria reset no meio de
// uma edição do usuário enquanto o drawer está aberto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { TaxRuleFilterForm } from '@/@types/v2/TaxRules';

export function FilterSideTaxRules({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<TaxRuleFilterForm>) {
  const pristineFormValues: TaxRuleFilterForm = { search: '' };

  function toInternalValues(rawFilter?: TaxRuleFilterForm | null): TaxRuleFilterForm {
    return { search: rawFilter?.search ?? '' };
  }

  const { register, handleSubmit, reset } = useForm<TaxRuleFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const text = languageGB.taxRules.taxRule.filter;

  function onSubmit(data: TaxRuleFilterForm) {
    handleFilterChange({ search: data.search?.trim() || undefined });
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

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />
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
