// src/pages/CadastrosBase/Batches/FilterSideBatches.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Lotes Animais — REGENERADO (TASK-FE-1080).
// Casca REAL `<FilterSide>` + `<Form formFilter>`/`Form.BodyFilter`/
// `Form.FooterFilter` (DECISÃO EXPLÍCITA do dev — NUNCA `<Box as="form">`
// cru, como o arquivo antigo fazia com o `SideModal` inexistente). Mirror de
// composição: `Administrativo/Funcoes/FilterSideFuncoes.tsx`/
// `CadastrosBase/CategoriasAnimais/FilterSideCategoriasAnimais.tsx`.
//
// Contrato real (contrato v1.1 §3, achado confirmado na Tarefa): a tela web
// só filtra por descrição — SEM filtro de status (decisão consciente do
// dev, D3) e sem os filtros por uuid do controller JSON unificado
// (`batch_uuids`/`grazing_uuid`/`area_uuid`/`category_uuid`), que dependem de
// módulos (Grazing/Area) ainda sem tela no front — fora desta rodada.
//
// TASK-FE-1084: a chave enviada à API é `search` (convenção do projeto —
// `PaymentTermIndexRequest`/`LowReasonRequest`/`KindIndexRequest`; já
// ENTREGUE em `AnimalBatchRepository:75-78`, ILIKE sobre `description`),
// NÃO `description` — a API ignorava essa chave silenciosamente. O rótulo
// visível segue vindo do i18n (`text.description`), só o parâmetro da query
// mudou.
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

export function FilterSideBatches({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BatchFilterForm>) {
  const text = languageGB.batches.batch.filter;

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mesma
  // disciplina de `FilterSideFuncoes.tsx`/`FilterSideCategoriasAnimais.tsx`:
  // reagir a `filter` clobaria o que o usuário está digitando com o drawer
  // aberto).
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

          <Input label={text.description} placeholder={text.description} {...register('search')} />
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
