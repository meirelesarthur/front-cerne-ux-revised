// src/pages/Operacional/Monitoring/FilterSideMonitoring.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Monitoramento (MonitoringServiceOrder) —
// TASK-MO-FE-04 (esteira `97-Esteiras/057`). Contrato B completo
// (`FilterModalProps<T>`, 6 props exatas), re-hidratação em `[isOpen]` —
// mirror quase literal de `ServiceOrders/FilterSideServiceOrders.tsx`,
// acrescentando o 4º campo (`pagination_quantity`, ausente no filtro de
// `service-orders`).
//
// 4 campos, ORDEM MANDATÓRIA (contrato de tela §5.1, NÃO reordenar):
//   1. code                 → <Input> + Controller
//   2. start_date           → <DateInput> + Controller
//   3. end_date             → <DateInput> + Controller (faixa `<=`, não igualdade)
//   4. pagination_quantity  → <Select> + Controller (opções fixas TASK-MO-FE-01)
//
// Sem `yupResolver` — os 4 campos são 100% opcionais (contrato de tela §5.1,
// decisão documentada: nenhum schema Yup necessário para este filtro, mesma
// exceção já aplicada em `FilterSideServiceOrders.tsx`).
//
// Botão "Limpar" limpa SÓ os filtros da própria tela (`handleReset` do
// Contrato B) — NUNCA navega para outra rota (bug do legado NÃO replicado,
// gate 6 do contrato de tela).
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

import { monitoringPaginationOptions } from '@/constants/monitoring/options/monitoring-pagination-options';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { MonitoringFilterForm } from '@/@types/v2/Operacional/Monitoring';

// Forma INTERNA do form — só `pagination_quantity` trabalha com `Option<number>`
// (contrato do componente `<Select>`); os demais campos são strings cruas
// (mirror `FilterSideServiceOrders`).
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

const paginationOptions = monitoringPaginationOptions.options();

function toInternalValues(rawFilter?: MonitoringFilterForm | null): FilterFormValues {
  return {
    code: rawFilter?.code ?? null,
    start_date: rawFilter?.start_date ?? null,
    end_date: rawFilter?.end_date ?? null,
    pagination_quantity:
      rawFilter?.pagination_quantity != null
        ? monitoringPaginationOptions.getOption(rawFilter.pagination_quantity)
        : null,
  };
}

interface FilterSideMonitoringProps extends FilterModalProps<MonitoringFilterForm> {
  filtersApplied?: number;
}

export function FilterSideMonitoring({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideMonitoringProps) {
  const text = languageGB.monitoring.list.filter;

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (Contrato B,
  // mirror `FilterSideServiceOrders.tsx`).
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
