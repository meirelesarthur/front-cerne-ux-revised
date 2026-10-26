// src/pages/Fiscal/CashBook/FilterSideCashBook.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da Listagem de CashBook (LCDPR, domínio Fiscal, execução
// 045, TASK-LCDPR-FE-02). Contrato B canônico (`FilterModalProps<CashBookFilterForm>`),
// mirror ESTRUTURAL de `FilterSideContador.tsx` — filtro ADITIVO (o legado
// não tinha filtro nenhum no index, `CONTRATO-FRONT-LCDPR.md §1`).
//
// `year`: `Input` numérico simples (decisão de UI livre pela Tarefa —
// `Select` de anos exigiria conhecer o range real de anos com registro, que
// nenhum endpoint expõe; `Input` numérico evita inventar esse range).
// `proprietary_id`: `Select` ESTÁTICO sobre `listProprietaryOptions`
// (scope='farm', `AD-04`) — mesma regra "NUNCA AJAX" do Cadastro (§3 do
// contrato: `listProprietaryOptions` devolve array simples, NÃO
// `ResponsePagination`, incompatível com o contrato de `service` do
// `SelectAsyncPaginate`) — lista completa carregada UMA VEZ via `useQuery`,
// mirror `FilterSideRomaneios.tsx` (mesmo lookup, mesma técnica).
//
// Re-hidratação — prop `filter` (Contrato B) + `useEffect` com deps
// SOMENTE `[isOpen]` (nunca `[filter]`), mesmo cuidado de `FilterSideContador`.
// O label do `proprietary_id` re-hidratado só fica disponível quando a lista
// de options já carregou — re-roda ao terminar de carregar (`[isOpen,
// proprietaryOptionsQuery.data]`), mesma limitação aceita de `FilterSideDfe`
// para lookups sem endpoint "buscar 1 pelo uuid" dedicado.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CashBookFilterForm } from '@/@types/v2/Fiscal/cashBook';

// Forma INTERNA do form — `year` como string (Input controlado), `proprietary_id`
// guarda o `Option` inteiro (mesmo racional de `FilterSideDfe`); o submit
// converte para o shape externo `CashBookFilterForm` (`year: number`,
// `proprietary_id: string`).
interface FilterFormValues {
  year: string;
  proprietary_id: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  year: '',
  proprietary_id: null,
};

export function FilterSideCashBook({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CashBookFilterForm>) {
  const text = languageGB.cashBooks.cashBook.filter;

  // Lista completa UMA VEZ (`useQuery` simples, sem paginação/debounce) —
  // mesma técnica proibindo AJAX-por-tecla usada no Cadastro (`AD-04`).
  const proprietaryOptionsQuery = useQuery({
    queryKey: ['cash-book-filter-proprietary-options'],
    queryFn: () => listProprietaryOptions(undefined, 'farm'),
    staleTime: 30 * 1000,
  });
  const proprietaryOptions = (proprietaryOptionsQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  function toInternalValues(rawFilter?: CashBookFilterForm | null): FilterFormValues {
    return {
      year: rawFilter?.year ? String(rawFilter.year) : '',
      proprietary_id: rawFilter?.proprietary_id
        ? (proprietaryOptions.find((option) => option.value === rawFilter.proprietary_id) ?? {
            label: rawFilter.proprietary_id,
            value: rawFilter.proprietary_id,
          })
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ou quando as options terminam de carregar,
  // ressincroniza o form com o filtro REALMENTE aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen, proprietaryOptionsQuery.data]);

  function onSubmit(data: FilterFormValues) {
    const parsedYear = data.year ? Number(data.year) : undefined;
    handleFilterChange({
      year: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
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

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input
            label={text.year}
            placeholder={text.yearPlaceholder}
            type="number"
            {...register('year')}
          />

          <Controller
            name="proprietary_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.proprietary}
                placeholder={text.proprietaryAll}
                name={name}
                value={value}
                onChange={onChange}
                options={proprietaryOptions}
                loading={proprietaryOptionsQuery.isLoading}
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
