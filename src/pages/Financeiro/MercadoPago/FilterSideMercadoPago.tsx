// src/pages/Financeiro/MercadoPago/FilterSideMercadoPago.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Financeiro Mercado Pago — casca
// `<FilterSide>` + `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>`,
// mirror mecânico de `FilterSideSaldoInicial.tsx` (datas) +
// `FilterSideFuncoes.tsx` (Select). Contrato de tela §3: `status` (Select:
// Todos/Pendente/Aprovado/Rejeitado/Cancelado) + `date_start`/`date_end`
// (Input type="date", mesmo range-guard min/max de `FilterSideSaldoInicial`).
//
// Contrato B canônico (`FilterModalProps<FinancialMercadoPagoFilterForm>`):
// re-hidratação via `toInternalValues(filter)` num ÚNICO `useEffect` com deps
// `[isOpen]` — nunca `[filter]`, para não sobrescrever o que o usuário está
// digitando enquanto o drawer está aberto.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  FinancialMercadoPagoFilterForm,
  FinancialMercadoPagoStatus,
} from '@/@types/v2/Financeiro/financialMercadoPago';

// Forma INTERNA do form — o Select trabalha com `Option`, o submit converte
// para `FinancialMercadoPagoFilterForm` (string crua), mesmo padrão de
// `FilterSideFuncoes.tsx`.
interface FilterFormValues {
  status: Option<FinancialMercadoPagoStatus> | null;
  date_start: string;
  date_end: string;
}

const pristineFormValues: FilterFormValues = {
  status: null,
  date_start: '',
  date_end: '',
};

export function FilterSideMercadoPago({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<FinancialMercadoPagoFilterForm>) {
  const text = languageGB.financial.mercadoPago.list.filter;

  // Sem a opção "Todos" na lista — mesma convenção de `FilterSideFuncoes`
  // (`is_enabled`): "Todos" é o PLACEHOLDER do Select (nada selecionado),
  // não um item real da coleção. `''` (Todos) nunca é enviado como filtro.
  const statusOptions: Option<FinancialMercadoPagoStatus>[] = [
    { value: 'pending', label: text.statusOptions.pending },
    { value: 'approved', label: text.statusOptions.approved },
    { value: 'rejected', label: text.statusOptions.rejected },
    { value: 'cancelled', label: text.statusOptions.cancelled },
  ];

  function toInternalValues(rawFilter?: FinancialMercadoPagoFilterForm | null): FilterFormValues {
    return {
      status: rawFilter?.status
        ? (statusOptions.find((option) => option.value === rawFilter.status) ?? null)
        : null,
      date_start: rawFilter?.date_start ?? '',
      date_end: rawFilter?.date_end ?? '',
    };
  }

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto,
  // mesma disciplina de `FilterSideSaldoInicial.tsx`/`FilterSideFuncoes.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const watchedStartDate = watch('date_start');
  const watchedEndDate = watch('date_end');

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      status: data.status?.value || undefined,
      date_start: data.date_start || undefined,
      date_end: data.date_end || undefined,
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
            {languageGB.financial.mercadoPago.list.pageTitle}
          </Text>

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.statusLabel}
                placeholder={text.statusOptions.all}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="date_start"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.dateStartLabel}
                maxDate={watchedEndDate ? new Date(`${watchedEndDate}T00:00:00`) : undefined}
              />
            )}
          />
          <Controller
            name="date_end"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.dateEndLabel}
                minDate={watchedStartDate ? new Date(`${watchedStartDate}T00:00:00`) : undefined}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={text.clearButton}
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={text.filterButton} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
