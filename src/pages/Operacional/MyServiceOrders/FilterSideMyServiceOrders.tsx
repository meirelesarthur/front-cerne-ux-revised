// src/pages/Operacional/MyServiceOrders/FilterSideMyServiceOrders.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Minhas OS (MyServiceOrder) — esteira 063
// (TASK-MOS-FE-04). Contrato B completo (`FilterModalProps<T>`, 6 props
// exatas), re-hidratação em `[isOpen]` — mirror LITERAL de
// `Operacional/Monitoring/FilterSideMonitoring.tsx` (contrato de tela §2),
// só trocando a fábrica de options (`myServiceOrderPaginationOptions`) e o
// namespace de tradução (`languageGB.myServiceOrders.myServiceOrder.list.filter`).
//
// 4 campos, ORDEM MANDATÓRIA (contrato de tela §2, NÃO reordenar):
//   1. code                 → <Input> + Controller
//   2. start_date           → <DateInput> + Controller (`dt_emission >= start_date`)
//   3. end_date             → <DateInput> + Controller (`<= end_date`)
//   4. pagination_quantity  → <Select> + Controller (whitelist TASK-MOS-FE-01)
//
// Sem `yupResolver` — os 4 campos são 100% opcionais (mesma exceção já
// aplicada em `FilterSideMonitoring.tsx`/`FilterSideServiceOrders.tsx`).
//
// Botão "Limpar" limpa SÓ os filtros da própria tela (`handleReset` do
// Contrato B) — NUNCA navega para outra rota (gate 6, mirror `Monitoring`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Input, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';

import { myServiceOrderPaginationOptions } from '@/constants/myServiceOrders/options/my-service-order-pagination-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { MyServiceOrderFilterForm } from '@/@types/v2/MyServiceOrders';

// Forma INTERNA do form — só `pagination_quantity` trabalha com `Option<number>`
// (contrato do componente `<Select>`); os demais campos são strings cruas
// (mirror `FilterSideMonitoring`).
interface FilterFormValues {
  code: string | null;
  start_date: string | null;
  end_date: string | null;
  pagination_quantity: Option<number> | null;
}

const pristineFormValues: FilterFormValues = {
  code: null,
  start_date: null,
  end_date: null,
  pagination_quantity: null,
};

const paginationOptions = myServiceOrderPaginationOptions.options();

function toInternalValues(rawFilter?: MyServiceOrderFilterForm | null): FilterFormValues {
  return {
    code: rawFilter?.code ?? null,
    start_date: rawFilter?.start_date ?? null,
    end_date: rawFilter?.end_date ?? null,
    pagination_quantity:
      rawFilter?.pagination_quantity != null
        ? myServiceOrderPaginationOptions.getOption(rawFilter.pagination_quantity)
        : null,
  };
}

interface FilterSideMyServiceOrdersProps extends FilterModalProps<MyServiceOrderFilterForm> {
  filtersApplied?: number;
}

export function FilterSideMyServiceOrders({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideMyServiceOrdersProps) {
  const text = languageGB.myServiceOrders.myServiceOrder.list.filter;

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // mirror `FilterSideMonitoring.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      code: data.code || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      pagination_quantity: data.pagination_quantity?.value ?? undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset(); // limpa SÓ os filtros da própria tela — SEM navegação (gate 6)
    reset(pristineFormValues);
  }

  return (
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Field label={text.code}>
                <Input
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder={text.codePlaceholder}
                />
              </Field>
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="pagination_quantity"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.paginationQuantity}
                name={name}
                value={value}
                onChange={onChange}
                options={paginationOptions}
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
