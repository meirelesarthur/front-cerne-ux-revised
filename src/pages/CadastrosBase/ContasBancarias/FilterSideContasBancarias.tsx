// src/pages/CadastrosBase/ContasBancarias/FilterSideContasBancarias.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Contas Bancárias — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">`, ver Riscos #2 da Tarefa).
// Mirror de composição real: `CategoriasAnimais/FilterSideCategoriasAnimais.tsx`
// (precedente mais atual do fork nesta branch, aprovado pelo Tester) /
// `Fornecedores/FilterSideFornecedores.tsx`.
//
// Contrato real (`Account-FrontEnd-contrato.md §2.3/§3`): `search` (Input,
// description/code/bank ilike no backend) + `type` (Select ESTÁTICO,
// `accountTypeOptions` — enum char C/P/I/L) + `isEnabled` (Select Ativo/
// Inativo, reaproveitando o `statusOptions` GENÉRICO já existente em
// `constants/options/statusOptions.ts` — mesma fábrica usada por
// `CategoriasAnimais`, SEM factory nova, mirror §5.1 do contrato de tela).
// SEM campo de ordenação — backend fixa `orderBy('bank', 'asc')` (§11).
//
// Re-hidratação ao reabrir — único `useEffect([isOpen])` reconstrói o form a
// partir de `filter` (`paginatedQuery.filter`), mesma disciplina de
// `FilterSideCategoriasAnimais.tsx`/`FilterSideFornecedores.tsx`: reagir a
// `filter` clobaria o que o usuário está digitando/selecionando com o drawer
// já aberto (o próprio `paginatedQuery.filter` troca de referência a cada
// refetch da grid).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { accountTypeOptions } from '@/constants/cadastrosBase/account/account-status';
import { statusOptions } from '@/constants/options/statusOptions';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { AccountFilterForm } from '@/@types/v2/CadastrosBase/account';

const pristineFormValues: AccountFilterForm = {
  search: '',
  type: null,
  isEnabled: null,
};

export function FilterSideContasBancarias({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AccountFilterForm>) {
  const text = languageGB.accounts.account.filter;

  const { control, register, handleSubmit, reset } = useForm<AccountFilterForm>({
    defaultValues: pristineFormValues,
  });

  // `type`/`isEnabled` são reresolvidos pelas LISTAS ESTÁTICAS de opções (por
  // `.value`), nunca confiando em um `label` eventualmente persistido (mesma
  // disciplina de `FilterSideFornecedores.tsx`).
  function toInternalValues(rawFilter?: AccountFilterForm | null): AccountFilterForm {
    return {
      search: rawFilter?.search ?? '',
      type:
        accountTypeOptions.options(languageGB).find((o) => o.value === rawFilter?.type?.value) ??
        null,
      isEnabled:
        statusOptions.options(languageGB).find((o) => o.value === rawFilter?.isEnabled?.value) ??
        null,
    };
  }

  // Re-hidratação — deps SOMENTE [isOpen] (deliberado, ver cabeçalho do
  // arquivo).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
  }, [isOpen]);

  function onSubmit(data: AccountFilterForm) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      type: data.type ?? undefined,
      isEnabled: data.isEnabled ?? undefined,
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

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.type}
                placeholder={text.typeAll}
                name={name}
                // Armadilha do checklist: `?? null`, NUNCA `?? undefined` —
                // o `<Select>` controlado vira NÃO-controlado com
                // `undefined` e mantém a última seleção.
                value={value ?? null}
                onChange={onChange}
                options={accountTypeOptions.options(languageGB)}
              />
            )}
          />

          <Controller
            name="isEnabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isEnabled}
                placeholder={text.isEnabledAll}
                name={name}
                value={value ?? null}
                onChange={onChange}
                options={statusOptions.options(languageGB)}
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
