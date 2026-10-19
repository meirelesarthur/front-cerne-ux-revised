// src/pages/Operacional/GrouperBatches/FilterSideGrouperBatches.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem "Agrupar Lotes" (GrouperBatch, execução 042,
// TASK-FE-042-303) — só `search` (D-front-8, i18n ISOLADO
// `grouperBatches.grouperBatch.list.filter`, NÃO reusa
// `languageGB.batches.batch.filter`). Mirror estrutural de
// `CadastrosBase/Batches/FilterSideBatches.tsx` (`Form formFilter`,
// re-hidratação em `[isOpen]`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { BatchFilterForm } from '@/@types/v2/Batches';

interface FilterFormValues {
  search: string;
}

const pristineFormValues: FilterFormValues = {
  search: '',
};

function toInternalValues(rawFilter?: BatchFilterForm | null): FilterFormValues {
  return {
    search: rawFilter?.search ?? '',
  };
}

export function FilterSideGrouperBatches({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BatchFilterForm>) {
  const text = languageGB.grouperBatches.grouperBatch.list.filter;

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mesma
  // disciplina de `FilterSideBatches.tsx`: reagir a `filter` clobaria o que
  // o usuário está digitando com o drawer aberto).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search.trim() || undefined,
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
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.search} {...register('search')} />
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
