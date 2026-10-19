// src/pages/BaseRegistrations/PaymentTerms/FilterSidePaymentTerms.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Condições de Pagamento — Contrato B
// canônico de filtro (mirror de
// BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx).
//
// Contrato real (contrato §12.1): search (Input, busca por `description`) +
// is_enabled (Select — Todos/Ativo/Inativo) + type (Select — Todos/Compra/
// Venda/Ambos).
//
// ⚠️ PONTO DE ATENÇÃO — `type` usa as 3 SLUGS (`'compra'|'venda'|'ambos'`)
// como `value` do Select, NÃO índices numéricos.
//
// Sem SelectAsyncPaginate, sem companion `_label`, sem
// menuPortalTarget/menuPosition="fixed" — `is_enabled`/`type` são Selects
// Chakra estáticos, que já portalizam nativamente.
//
// Contrato B (`FilterModalProps`): re-hidratação a partir da PROP `filter`
// (nunca de um literal fixo) + `useEffect` com deps `[isOpen]` APENAS —
// `filter` é lido por CLOSURE, nunca dep (evitaria reset no meio de uma
// edição do usuário enquanto o drawer está aberto).
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
import type { PaymentTermFilterForm } from '@/@types/v2/BaseRegistrations/paymentTerms';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `PaymentTermFilterForm` (strings cruas).
interface FilterFormValues {
  search?: string;
  is_enabled: Option<string> | null;
  type: Option<string> | null;
}

export function FilterSidePaymentTerms({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<PaymentTermFilterForm>) {
  const text = languageGB.baseRegistrations.paymentTerm.filter;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.enabledOptions.active },
    { value: 'false', label: text.enabledOptions.inactive },
  ];

  // `type` usa as 3 SLUGS reais do contrato (compra/venda/ambos), NÃO
  // índices numéricos.
  const typeOptions: Option<string>[] = [
    { value: 'compra', label: text.typeOptions.purchase },
    { value: 'venda', label: text.typeOptions.sale },
    { value: 'ambos', label: text.typeOptions.both },
  ];

  const pristineFormValues: FilterFormValues = {
    search: '',
    is_enabled: null,
    type: null,
  };

  function toInternalValues(rawFilter?: PaymentTermFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      is_enabled: enabledOptions.find((option) => option.value === rawFilter?.is_enabled) ?? null,
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
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
      is_enabled: (data.is_enabled?.value as PaymentTermFilterForm['is_enabled']) || undefined,
      type: (data.type?.value as PaymentTermFilterForm['type']) || undefined,
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
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.type}
                placeholder={text.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
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
