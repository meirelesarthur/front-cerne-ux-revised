// src/pages/Financeiro/OfxImport/FilterSideOfxImport.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Importação OFX (OfxImport, F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-01) — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (NUNCA
// `<VStack as="form">` cru), mirror mecânico de
// `Financeiro/MovCaixaBancario/FilterSideMovimento.tsx`.
//
// Contrato B do filtro (get_pwa_grid_query_pattern) — SEIS props exatas
// (`FilterModalProps<OfxImportFilterForm>`), sem `onApply`/`onReset` do
// Contrato A aposentado.
//
// Decisão F3 (arquitetura-ofx-frontend.md §4) — extensão ADITIVA do
// protótipo UX (que só tem busca textual): conta (`SelectAsyncPaginate`/
// `listAccounts`, SEM filtro de `type` — Decisão 5/CLM-16, index não
// restringe por tipo de conta) + período (`start_date`/`end_date`).
//
// Re-hidratação SOMENTE em `[isOpen]` — reagir a `filter` clobaria o que o
// usuário está digitando com o drawer aberto (mesma disciplina de
// `FilterSideMovimento.tsx`/`FilterSideSaldoInicial.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { OfxImportFilterForm } from '@/@types/v2/Financeiro/ofxImport';

// Forma INTERNA do form — Select trabalha com `Option`, o submit converte
// para `OfxImportFilterForm` (strings cruas + `*_label` companion), mesmo
// padrão de `FilterSideMovimento.tsx`.
interface FilterFormValues {
  description: string;
  account_uuid: Option<string> | null;
  start_date: string;
  end_date: string;
}

const pristineFormValues: FilterFormValues = {
  description: '',
  account_uuid: null,
  start_date: '',
  end_date: '',
};

function findParamsFromSearch(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export function FilterSideOfxImport({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<OfxImportFilterForm>) {
  const text = languageGB.ofxImports.ofxImport.filter;

  const { control, register, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  function toInternalValues(rawFilter?: OfxImportFilterForm | null): FilterFormValues {
    return {
      description: rawFilter?.description ?? '',
      account_uuid: rawFilter?.account_uuid
        ? {
            value: rawFilter.account_uuid,
            label: rawFilter.account_label ?? rawFilter.account_uuid,
          }
        : null,
      start_date: rawFilter?.start_date ?? '',
      end_date: rawFilter?.end_date ?? '',
    };
  }

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen].
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  function onSubmit(data: FilterFormValues) {
    const applied: OfxImportFilterForm = {
      description: data.description.trim() || undefined,
      account_uuid: data.account_uuid?.value || undefined,
      account_label: data.account_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
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

          <Input label={text.description} {...register('description')} />

          <Controller
            name="account_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.account}
                placeholder={text.accountPlaceholder}
                service={listAccounts}
                mapOptions={(item: AccountListItem) => ({
                  label: `${item.bank} — ${item.agency}/${item.account}`,
                  value: item.uuid,
                })}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.startDate}
                maxDate={watchedEndDate ? new Date(`${watchedEndDate}T00:00:00`) : undefined}
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.endDate}
                minDate={watchedStartDate ? new Date(`${watchedStartDate}T00:00:00`) : undefined}
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
