// src/pages/CadastrosBase/ParameterAnimals/FilterSideParameterAnimals.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Parâmetros Animais (mesma casca global
// <FilterSide> de FilterSideAtividades.tsx/FilterSideFuncoes.tsx — TASK-FE-1078,
// regeneração). O form real é montado pelo CALLER via `<Form formFilter>` +
// `Form.BodyFilter` (campos) + `Form.FooterFilter` (botões) — padrão canônico
// de TODOS os filtros reais do projeto. A versão antiga usava `Box as="form"`
// cru (via `SideModal`/`InputForm` inexistentes), que é justamente o defeito
// eliminado nesta regeneração.
//
// Contrato real (animal-parameter-contrato.md v1.1 §3): "Sem filtros
// adicionais — Doc Bruta não encontrou filtro algum no index() do legado além
// do escopo de fazenda" — único campo é o filtro textual (Input, contains).
//
// TASK-FE-1084: a chave enviada à API é `search` (convenção do projeto —
// `PaymentTermIndexRequest`/`LowReasonRequest`/`KindIndexRequest`), NÃO
// `description` — a API ignorava essa chave silenciosamente. O rótulo
// visível segue vindo do i18n (`filterText.description`), só o parâmetro da
// query mudou.
//
// Contrato B canônico (`FilterModalProps<ParameterAnimalFilterForm>`):
// re-hidratação via `toInternalValues(filter)` somada a `pristineFormValues`,
// ressincronizada em um ÚNICO `useEffect` com deps `[isOpen]` — nunca
// `[filter]`, para não sobrescrever o que o usuário está digitando enquanto o
// drawer está aberto.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { ParameterAnimalFilterForm } from '@/@types/v2/ParameterAnimals/parameter-animal';

interface FilterFormValues {
  search?: string;
}

export function FilterSideParameterAnimals({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ParameterAnimalFilterForm>) {
  const filterText = languageGB.parameterAnimals.parameterAnimal.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
  };

  function toInternalValues(rawFilter?: ParameterAnimalFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
    };
  }

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado. Deps
  // SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o usuário
  // está digitando dentro do drawer aberto.
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

          <Input label={filterText.description} {...register('search')} />
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
