// src/pages/Operacional/BatchTransfers/FilterSideBatchTransfers.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de animais elegíveis (contrato §5.3, Contrato
// B — `FilterModalProps<T>`, seis props exatas). Mirror de composição:
// `CadastrosBase/Batches/FilterSideBatches.tsx`.
//
// Três campos: Categoria (`Select`, options de `create-options.categories`),
// Lote (`Select`, options de `create-options.batches`), Identificação
// (`Input`, texto de ajuda OBRIGATÓRIO — busca por IGUALDADE EXATA no
// backend, não `ILIKE`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BatchTransferFilterForm } from '@/@types/v2/BatchTransfers';

import { useBatchTransferCreateOptions } from './useBatchTransfers';

interface FilterFormValues {
  category: Option<string> | null;
  batch: Option<string> | null;
  identification: string;
}

const pristineFormValues: FilterFormValues = {
  category: null,
  batch: null,
  identification: '',
};

function toInternalValues(
  rawFilter: BatchTransferFilterForm | null | undefined,
  categoryOptions: Option<string>[],
  batchOptions: Option<string>[]
): FilterFormValues {
  return {
    category: categoryOptions.find((option) => option.value === rawFilter?.category_uuid) ?? null,
    batch: batchOptions.find((option) => option.value === rawFilter?.batch_uuid) ?? null,
    identification: rawFilter?.identification ?? '',
  };
}

export function FilterSideBatchTransfers({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BatchTransferFilterForm>) {
  const text = languageGB.batchTransfers.batchTransfer.filter;

  const createOptionsQuery = useBatchTransferCreateOptions();
  const categoryOptions: Option<string>[] = (createOptionsQuery.data?.categories ?? []).map(
    (category) => ({ label: category.description, value: category.uuid })
  );
  const batchOptions: Option<string>[] = (createOptionsQuery.data?.batches ?? []).map((batch) => ({
    label: batch.description,
    value: batch.uuid,
  }));

  const { register, handleSubmit, reset, setValue, watch } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter, [], []) },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // nunca [filter] — clobaria o que o usuário está digitando).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter, categoryOptions, batchOptions) });
  }, [isOpen]);

  const watchedCategory = watch('category');
  const watchedBatch = watch('batch');

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      category_uuid: data.category?.value || undefined,
      batch_uuid: data.batch?.value || undefined,
      identification: data.identification.trim() || undefined,
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

          <Select
            name="category"
            label={text.category}
            options={categoryOptions}
            value={watchedCategory}
            onChange={(option) => setValue('category', option ?? null)}
            loading={createOptionsQuery.isLoading}
          />

          <Select
            name="batch"
            label={text.batch}
            options={batchOptions}
            value={watchedBatch}
            onChange={(option) => setValue('batch', option ?? null)}
            loading={createOptionsQuery.isLoading}
          />

          <Input
            label={text.identification}
            placeholder={text.identification}
            tooltip={text.identificationHint}
            {...register('identification')}
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
