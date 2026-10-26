// src/pages/Fiscal/Dfe/FilterSideDfe.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da Listagem de DFe Recebidas (Dfe, domínio Fiscal,
// execução 044, TASK-DFE-FE-04). Depende de TASK-DFE-FE-03 (tipos/service/
// i18n/options). Contrato B canônico (`FilterModalProps<DfeFilterForm>`),
// mirror ESTRUTURAL 1:1 de `FilterSideNfseRecebidas.tsx` (mesmo domínio
// Fiscal, mesmo tipo de tela — documento fiscal de terceiro):
//   - Combobox Emissor: `SelectAsyncPaginate` sobre `listIssuers`, campo
//     `nullable` no backend (RN-1 mirror: ausente ⇒ lista vazia, não erro) —
//     obrigatório só por UX (label com `*` + helperText), NÃO bloqueia
//     submit (`CONTRATO-TELA-DFE-FE.md §4`, Risco documentado na Tarefa).
//   - Par `start_date`/`end_date`: mirror `date_from`/`date_to` de
//     `FilterSideNfseRecebidas` — aviso não bloqueante de intervalo invertido.
//   - `launched`/`is_personal`/`is_shipment`: reaproveitam a fábrica GLOBAL
//     `constants/options/boolean.ts` (`Option<boolean>`), convertidos para
//     `'1'|'0'` no submit (shape externo `DfeFilterForm`; a API valida
//     `boolean` do Laravel e devolvia 422 com 'true'/'false' — UT-000752,
//     T-752-FE-01). Filtros salvos no localStorage com 'true'/'false'
//     legados são migrados em silêncio em `toInternalValues`.
//   - `status`: `dfeStatusOptions` (LOOK-06, `TASK-DFE-FE-03`, domínio 0..4).
//   - `FIL-07` (paginação) NÃO tem campo aqui — resolvido pelo
//     `TableProvider`/`Pagination` padrão da grid (TASK-DFE-FE-05), mesma
//     decisão já tomada em todos os módulos V3 do projeto (divergência
//     estrutural aceita do legado, `CONTRATO-TELA-DFE-FE.md` "O que muda").
//
// RE-HIDRATAÇÃO — prop `filter` (Contrato B) + `useEffect` com deps
// `[isOpen]` (nunca `[filter]`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import {
  dfeStatusOptions,
  DfeStatusValue,
} from '@/constants/Fiscal/dfe/options/dfe-status-options';
import { boolean } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { getIssuerByUuid, listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { DfeFilterForm } from '@/@types/v2/Fiscal/dfe';
import type { IssuerListItem } from '@/@types/v2/Issuers';

// Forma INTERNA do form (só deste componente) — `issue_uuid` guarda o
// `Option` inteiro (label+value, mesmo padrão de `FilterSideNfseRecebidas`);
// `launched`/`is_personal`/`is_shipment` guardam `Option<boolean>` (fábrica
// global `boolean.ts`); `status` guarda `Option<DfeStatusValue>` (fábrica
// local `dfeStatusOptions`). Datas nullable para o `DateInput` controlado.
interface FilterFormValues {
  issue_uuid: Option<string> | null;
  search?: string;
  start_date: string | null;
  end_date: string | null;
  launched: Option<boolean> | null;
  status: Option<DfeStatusValue> | null;
  is_personal: Option<boolean> | null;
  is_shipment: Option<boolean> | null;
}

// Aceita '1'/'0' (atual) e 'true'/'false' (legado do localStorage).
function normalizeBooleanFilter(raw?: string | null): boolean | null {
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return null;
}

function toBooleanFilter(option: Option<boolean> | null): '1' | '0' | undefined {
  if (!option) return undefined;
  return option.value ? '1' : '0';
}

const pristineFormValues: FilterFormValues = {
  issue_uuid: null,
  search: '',
  start_date: null,
  end_date: null,
  launched: null,
  status: null,
  is_personal: null,
  is_shipment: null,
};

export function FilterSideDfe({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DfeFilterForm>) {
  const text = languageGB.dfes.dfe.filter;

  const launchedOptions = boolean.options(languageGB);
  const isPersonalOptions = boolean.options(languageGB);
  const isShipmentOptions = boolean.options(languageGB);
  const statusOptionsList = dfeStatusOptions.options(languageGB);

  // Combobox de Emissor guarda só `value` no filtro externo (`issue_uuid`).
  // O NOME para exibição na reabertura vem de `GET /issuers/{uuid}` (nunca o
  // UUID — UT-000752, T-752-FE-01); enquanto carrega, o label fica vazio.
  const issuerUuid = filter?.issue_uuid;
  const issuerQuery = useQuery({
    queryKey: [queryKey.issuers.detail, 'dfe-filter', issuerUuid],
    queryFn: () => getIssuerByUuid(issuerUuid as string),
    enabled: Boolean(issuerUuid) && isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const issuerLabel = issuerQuery.data?.data?.razao_social ?? '';

  function toInternalValues(rawFilter?: DfeFilterForm | null): FilterFormValues {
    const findBoolean = (raw?: string | null) => {
      const normalized = normalizeBooleanFilter(raw);
      return normalized === null
        ? null
        : (launchedOptions.find((option) => option.value === normalized) ?? null);
    };

    return {
      issue_uuid: rawFilter?.issue_uuid
        ? { label: issuerLabel, value: rawFilter.issue_uuid }
        : null,
      search: rawFilter?.search ?? '',
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
      launched: findBoolean(rawFilter?.launched),
      status: statusOptionsList.find((option) => option.value === rawFilter?.status) ?? null,
      is_personal: findBoolean(rawFilter?.is_personal),
      is_shipment: findBoolean(rawFilter?.is_shipment),
    };
  }

  const { control, register, handleSubmit, reset, watch, getValues, setValue } =
    useForm<FilterFormValues>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      defaultValues: {
        ...pristineFormValues,
        ...toInternalValues(filter),
      },
    });

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  // Validação client-side NÃO bloqueante (mirror ParameterWeights/
  // NfseRecebidas) — comparação lexicográfica válida para strings ISO
  // `yyyy-MM-dd`.
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      issue_uuid: data.issue_uuid?.value || undefined,
      search: data.search?.trim() || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      launched: toBooleanFilter(data.launched),
      status: data.status?.value ?? undefined,
      is_personal: toBooleanFilter(data.is_personal),
      is_shipment: toBooleanFilter(data.is_shipment),
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

  // O nome do emissor chega assíncrono: preenche o label SEM resetar o resto
  // do form (e sem sobrescrever uma troca de emissor feita pelo usuário).
  useEffect(() => {
    const current = getValues('issue_uuid');
    if (issuerLabel && current && current.value === issuerUuid && current.label !== issuerLabel) {
      setValue('issue_uuid', { label: issuerLabel, value: current.value });
    }
  }, [issuerLabel, issuerUuid]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="issue_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={`${text.issuer} *`}
                helperText={text.issuerRequired}
                placeholder={text.issuerPlaceholder}
                service={listIssuers}
                mapOptions={(item: IssuerListItem) => ({
                  label: item.razao_social,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateFrom}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dateTo}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {text.dateRangeInvalid}
            </Text>
          )}

          <Controller
            name="launched"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.launched}
                placeholder={text.launchedAll}
                name={name}
                value={value}
                onChange={onChange}
                options={launchedOptions}
              />
            )}
          />

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
                options={statusOptionsList}
              />
            )}
          />

          <Controller
            name="is_personal"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isPersonal}
                placeholder={text.isPersonalAll}
                name={name}
                value={value}
                onChange={onChange}
                options={isPersonalOptions}
              />
            )}
          />

          <Controller
            name="is_shipment"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isShipment}
                placeholder={text.isShipmentAll}
                name={name}
                value={value}
                onChange={onChange}
                options={isShipmentOptions}
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
