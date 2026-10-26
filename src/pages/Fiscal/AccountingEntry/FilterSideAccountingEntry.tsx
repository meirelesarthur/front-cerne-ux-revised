// src/pages/Fiscal/AccountingEntry/FilterSideAccountingEntry.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da Listagem de Partida Dobrada (AccountingEntry — domínio
// Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-06). Contrato B EXATO
// (`FilterModalProps<AccountingEntryFilterRequest>`), mirror ESTRUTURAL 1:1 de
// `Fiscal/Dfe/FilterSideDfe.tsx` (mesmo domínio Fiscal, mesmo tipo de tela —
// listagem paginada com filtro lateral).
//
// ⚠️ Reconciliação de tipos (fundação, TASK-PD-FE-01): `AccountingEntryFilterForm`
// (`@/@types/v2/Fiscal/accountingEntry`) tipa `start_date`/`end_date` como
// `Date | null` — nenhum consumidor real existia até esta Tarefa. O widget de
// data canônico do projeto (`DateInput`, mirror `FilterSideDfe`) trabalha com
// string ISO `yyyy-MM-dd`, não `Date`. Para não brigar com o contrato real do
// componente nem inventar um DatePicker novo, este arquivo declara sua PRÓPRIA
// forma interna (`FilterFormValues`, convenção local do Contrato B — mesma
// decisão de `FilterSideDfe`/`FilterSidePlanAccount`) e usa
// `AccountingEntryFilterRequest` (já 100% flat/string, "Query params enviados
// na listagem") como `TFilter` EXTERNO — é o mesmo tipo consumido por
// `useCustomGridQuery`/`userPaginatedQuery` em `index.tsx`. `AccountingEntryFilterForm`
// permanece exportado (não removido — dead code inofensivo, decisão de não
// alterar contrato já commitado sem necessidade) mas não é usado aqui.
//
// LKP-02 (`user_uuid`): não existe `listUserOptions`-like dedicado (ver
// `src/services/v2/Users/user-service.ts`) — reutiliza `listUsers` (mesma
// assinatura `(PaginationQueryParams) => Promise<ResponsePagination<T>>`
// exigida por `SelectAsyncPaginate`, ZERO service novo). Risco documentado:
// `GET /users` é o endpoint administrativo geral (`permission:users_view`) —
// se o usuário operacional que acessa Partida Dobrada não tiver essa
// permissão, o combobox falha silenciosamente (403 já é absorvido pelo
// interceptor global). Reportado como Gap `[PARA ANÁLISE]` no relatório desta
// Tarefa (Arquiteto de API avalia endpoint `/users/options` dedicado) — não
// bloqueia o restante do filtro (decisão explícita da Tarefa, "sub-bloqueio
// pontual").
//
// RE-HIDRATAÇÃO — prop `filter` (Contrato B) + `useEffect` com deps
// `[isOpen]` (nunca `[filter]`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { accountingEntryOriginOptions } from '@/constants/Fiscal/accountingEntry';

import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  AccountingEntryFilterRequest,
  AccountingEntryOrigin,
} from '@/@types/v2/Fiscal/accountingEntry';
import type { UserListItem } from '@/@types/v2/Users';

// Forma INTERNA do form (só deste componente) — mirror `FilterFormValues` de
// `FilterSideDfe.tsx`. `origin`/`user_uuid` guardam `Option` inteiro (Select/
// SelectAsyncPaginate são sempre controlados por `Option<T>`, nunca por valor
// cru); `start_date`/`end_date` guardam string ISO `yyyy-MM-dd` (contrato real
// do `DateInput`, ver nota de topo do arquivo).
interface FilterFormValues {
  code: string;
  origin: Option<AccountingEntryOrigin> | null;
  description: string;
  start_date: string | null;
  end_date: string | null;
  user_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  code: '',
  origin: null,
  description: '',
  start_date: null,
  end_date: null,
  user_uuid: null,
};

export function FilterSideAccountingEntry({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AccountingEntryFilterRequest>) {
  const text = languageGB.accountingEntries.accountingEntry.filter;
  const originOptionsList = accountingEntryOriginOptions.options(languageGB);

  function toInternalValues(rawFilter?: AccountingEntryFilterRequest | null): FilterFormValues {
    return {
      code: rawFilter?.code ?? '',
      origin: originOptionsList.find((option) => option.value === rawFilter?.origin) ?? null,
      description: rawFilter?.description ?? '',
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
      // Sem endpoint de "buscar 1 usuário pelo uuid" dedicado a este drawer —
      // o label reidratado usa o próprio uuid como fallback visual até o
      // usuário reabrir o combobox (mesma limitação aceita em `FilterSideDfe`
      // para `issue_uuid`).
      user_uuid: rawFilter?.user_uuid
        ? { label: rawFilter.user_uuid, value: rawFilter.user_uuid }
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      code: data.code.trim() || undefined,
      origin: data.origin?.value ?? undefined,
      description: data.description.trim() || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      user_uuid: data.user_uuid?.value || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]` (nunca `[filter]`).
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

          <Input label={text.fields.code} {...register('code')} />

          <Controller
            name="origin"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.fields.origin}
                name={name}
                value={value}
                onChange={onChange}
                options={originOptionsList}
              />
            )}
          />

          <Input label={text.fields.description} {...register('description')} />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.fields.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.fields.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="user_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.user}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
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
