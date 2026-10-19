// src/pages/BaseRegistrations/DocumentTypes/FilterSideDocumentTypes.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Tipo Documento (mesma casca global
// <FilterSide> de FilterSideAccountingGroupers.tsx).
//
// Único campo real (`search` — name OU code) — 100% CLIENT-SIDE, `GET
// /document-types` não aceita esse parâmetro (ver "Diferenças reais" da
// TASK-DT-FE-01). NENHUMA request de rede é disparada ao aplicar o filtro.
//
// Contrato B (`FilterModalProps`): a fonte de re-hidratação é a prop `filter`
// (state local da árvore no index.tsx). `useEffect` com deps `[isOpen]`
// SOMENTE — nunca incluir `filter`, para não sobrescrever o que o usuário
// está digitando dentro do drawer aberto.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { DocumentTypeFilterForm } from '@/@types/v2/DocumentTypes';

interface FilterFormValues {
  search?: string;
}

export function FilterSideDocumentTypes({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DocumentTypeFilterForm>) {
  const text = languageGB.baseRegistrations.documentTypes.filter;

  const pristineFormValues: FilterFormValues = { search: '' };

  function toInternalValues(rawFilter?: DocumentTypeFilterForm | null): FilterFormValues {
    return { search: rawFilter?.search ?? '' };
  }

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
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
  // drawer abre — deps SOMENTE `isOpen` (ver nota de topo do arquivo).
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
