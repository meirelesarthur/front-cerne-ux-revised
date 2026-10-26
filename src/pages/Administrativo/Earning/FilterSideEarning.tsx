// src/pages/Administrativo/Earning/FilterSideEarning.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Apuração Mensal (Earning — Administrativo,
// 97-Esteiras/002, Tarefa 07). Contrato B canônico de filtro (`<Form
// formFilter>`, `FilterModalProps<T>` 6 props exatas, re-hidratação em
// `[isOpen]`) — mirror EXATO de `FilterSideRequisition.tsx`.
//
// Busca por funcionário via combobox assíncrono (`listEmployees`) que
// resolve nome→uuid — NUNCA texto livre contra `/earnings` (a API só aceita
// `employee_uuid` exato, `GAP-EARNING-FE-02`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { EarningFilterForm, EarningTypeValue } from '@/@types/v2/Earnings';
import type { FunctionOption } from '@/@types/v2/Functions';

import { buildDefaultEarningFilter } from './earningTotals';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  label: String(index + 1).padStart(2, '0'),
  value: index + 1,
}));

const TYPE_OPTIONS: { label: string; value: EarningTypeValue }[] = [
  { label: 'Folha Normal', value: 'N' },
  { label: 'Adiantamento 13º', value: 'A' },
  { label: '13º Salário', value: 'D' },
];

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const pristineFormValues: EarningFilterForm = {
  employee_uuid: null,
  function_uuid: null,
  year: '',
  month: null,
  type: null,
};

export function FilterSideEarning({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<EarningFilterForm>) {
  const filterText = languageGB.earnings.earning.list.filter;

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<EarningFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (mesma
  // disciplina dos irmãos). O drawer sempre abre mostrando os valores
  // efetivamente APLICADOS (`filter`, já nunca vazio em mês/ano/tipo —
  // `index.tsx` garante o default a cada visita, UT-000756).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  // UT-000756 — `onSubmit` NUNCA aplica mês/ano/tipo vazios. Mês e Tipo já
  // não são limpáveis pela UI (`noClearable` nos Selects abaixo), e Ano é
  // obrigatório (`register('year', { required: true })`), mas esta rede de
  // segurança cobre qualquer caminho que ainda produza um valor vazio
  // (ex.: comportamento de deseleção do Select ao reclicar no item
  // selecionado) — cai para o MESMO default do legado (mês anterior/ano/
  // Folha Normal), nunca para um filtro "sem período".
  function applyFilter(data: EarningFilterForm) {
    const fallback = buildDefaultEarningFilter();

    handleFilterChange({
      employee_uuid: data.employee_uuid ?? undefined,
      function_uuid: data.function_uuid ?? undefined,
      year: data.year && data.year.trim() !== '' ? data.year : fallback.year,
      month: data.month ?? fallback.month,
      type: data.type ?? fallback.type,
    });
    onClose();
  }

  function onSubmit(data: EarningFilterForm) {
    applyFilter(data);
  }

  // UT-000756 — Ano é `required` no `register` (abaixo), então um Ano vazio
  // IMPEDE o `onSubmit` válido de disparar (comportamento nativo do RHF).
  // Em vez de travar o usuário num drawer que nunca fecha, cai no MESMO
  // fallback de `applyFilter` usando os valores atuais do form
  // (`getValues()` — `onInvalid` não recebe os dados, só os erros) — o
  // período nunca fica vazio de nenhum dos dois caminhos (válido ou
  // inválido).
  function onInvalid() {
    applyFilter(getValues());
  }

  // UT-000756 — "Limpar filtros" volta ao default do legado (mês anterior +
  // ano + Folha Normal, SEM funcionário/função), NUNCA a um filtro vazio
  // (`pristineFormValues` era o bug: aplicava período vazio e "congelava" a
  // listagem sem período nenhum). `handleReset()` (hook compartilhado,
  // `usePaginatedQueryStorage.tsx`, NÃO alterado) já aplica o mesmo default
  // vindo de `index.tsx`; aqui só sincroniza o FORM local do drawer com o
  // mesmo valor, recalculado na hora (nunca memoizado no module scope).
  function handleResetFilters() {
    handleReset();
    reset(buildDefaultEarningFilter());
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...filter });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="employee_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.employee}
                placeholder={filterText.employeePlaceholder}
                service={listEmployees}
                mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="function_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.function}
                service={listFunctionOptions}
                mapOptions={(item: FunctionOption) => ({ label: item.name, value: item.uuid })}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            type="number"
            label={filterText.year}
            isRequired
            error={errors.year ? 'Campo obrigatório' : undefined}
            {...register('year', { required: true })}
          />

          {/* UT-000756 — `noClearable`: Mês não pode ficar vazio (mirror
              legado, que sempre tem mês/ano aplicados); `onChange` só aceita
              `null` como "nenhuma seleção ainda não deveria acontecer" —
              mantém o valor anterior em vez de zerar caso o Select dispare
              deseleção ao reclicar no item já selecionado. */}
          <Controller
            name="month"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={filterText.month}
                options={MONTH_OPTIONS}
                noClearable
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? value ?? null)}
              />
            )}
          />

          {/* UT-000756 — mesmo racional do Mês: Tipo não-limpável. */}
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={filterText.type}
                options={TYPE_OPTIONS}
                noClearable
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? value ?? null)}
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}

export default FilterSideEarning;
