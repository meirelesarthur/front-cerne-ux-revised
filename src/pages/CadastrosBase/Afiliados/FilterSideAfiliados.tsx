// src/pages/CadastrosBase/Afiliados/FilterSideAfiliados.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Afiliados — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO
// EXPLÍCITA do dev — NUNCA `<VStack as="form">`). Mirror de composição real:
// `Produtos/Classes/FilterSideClasses.tsx`/`Fazendas/FilterSideFazendas.tsx`
// (precedentes corretos do mecanismo — `Pessoas/FilterSidePessoas.tsx` é um
// outlier antigo com `VStack as="form"`, NÃO copiado aqui).
//
// Contrato real (`Partner-Frontend-Contrato.md` §3.3): `search` (Input) +
// `status` (Select nativo, 4 opções — Habilitado/Bloqueado/Cancelado/Todos,
// via `partnerStatusOptions`). SEM campos de período (`GAP-FE-126`, default
// omitir — o `PartnerFilterData` aprovado no backend não aceita
// `start_date`/`end_date`).
//
// Re-hidratação ao reabrir — mesmo padrão de `FilterSideClasses.tsx`: um
// único `useEffect([isOpen])` reconstrói o form a partir de `filter`
// (`paginatedQuery.filter`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { partnerStatusOptions } from '@/constants/afiliados/partner/options/partner-status-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { PartnerFilterForm, PartnerStatusValue } from '@/@types/v2/Afiliados';

// Forma INTERNA do form — `status` trabalha com `Option` (Select nativo), o
// submit converte para `PartnerFilterForm` (valor cru), mesmo padrão de
// `FilterSideClasses.tsx`.
interface FilterFormValues {
  search: string;
  status: Option<PartnerStatusValue> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  status: null,
};

export function FilterSideAfiliados({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<PartnerFilterForm>) {
  const text = languageGB.afiliados.partner.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  const statusOptions = partnerStatusOptions.options(languageGB);

  // Re-hidratação ao (re)abrir o drawer — reconstrói a partir de `filter`
  // (`paginatedQuery.filter`), único useEffect, deps `[isOpen]` (mesma
  // disciplina de `FilterSideClasses.tsx`: reagir a `filter` clobaria o que
  // o usuário está digitando com o drawer aberto).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      search: filter?.search ?? '',
      status: filter?.status
        ? (statusOptions.find((option) => option.value === filter.status) ?? null)
        : null,
    });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: PartnerFilterForm = {
      search: data.search?.trim() || undefined,
      status: data.status?.value || undefined,
    };
    handleFilterChange(applied);
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
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.status}
                placeholder={text.statusAll}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
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
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
