// src/pages/CadastrosBase/SaldoInicial/FilterSideSaldoInicial.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de SALDO INICIAL (OpenMovement) — casca
// `<FilterSide>` + `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>`
// (NUNCA `<VStack as="form">` cru), mirror mecânico de
// `EstoqueInicial/FilterSideEstoqueInicial.tsx`. TASK-FE-031-36.
//
// Contrato de tela §7: período (`start_date`/`end_date`) + `account_uuid`
// (`SelectAsyncPaginate` × `listAccounts`) + `proprietary_uuid`
// (`SelectCombobox` × `useProprietariesList` — endpoint `/proprietaries/options`
// NÃO-paginado, mesmo risco documentado no contrato "Risco + solução" —
// reaproveitado de `ContasBancarias/useAccounts.tsx`, nenhum hook novo).
// Persistido como par uuid+label (`OpenMovementFilterForm.account_label`/
// `.proprietary_label`) para re-hidratar o drawer ao reabrir, mirror
// `OpeningBalanceFilterForm.product_uuid/product_label`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { OpenMovementFilterForm } from '@/@types/v2/OpenMovements';

import { useProprietariesList } from '../ContasBancarias/useAccounts';

// Forma INTERNA do form — os 2 Selects trabalham com `Option`, o submit
// converte para `OpenMovementFilterForm` (strings cruas + `*_label`
// companion), mesmo padrão de `FilterSideEstoqueInicial.tsx`.
interface FilterFormValues {
  start_date: string;
  end_date: string;
  account_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: '',
  end_date: '',
  account_uuid: null,
  proprietary_uuid: null,
};

export function FilterSideSaldoInicial({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<OpenMovementFilterForm>) {
  const text = languageGB.openMovements.openMovement.filter;

  const proprietariesQuery = useProprietariesList();
  const proprietaryOptions: Option<string>[] = (proprietariesQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  function toInternalValues(rawFilter?: OpenMovementFilterForm | null): FilterFormValues {
    return {
      start_date: rawFilter?.start_date ?? '',
      end_date: rawFilter?.end_date ?? '',
      account_uuid: rawFilter?.account_uuid
        ? {
            value: rawFilter.account_uuid,
            label: rawFilter.account_label ?? rawFilter.account_uuid,
          }
        : null,
      proprietary_uuid: rawFilter?.proprietary_uuid
        ? {
            value: rawFilter.proprietary_uuid,
            label: rawFilter.proprietary_label ?? rawFilter.proprietary_uuid,
          }
        : null,
    };
  }

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está digitando com o drawer aberto,
  // mesma disciplina de `FilterSideEstoqueInicial.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  function onSubmit(data: FilterFormValues) {
    const applied: OpenMovementFilterForm = {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      account_uuid: data.account_uuid?.value || undefined,
      account_label: data.account_uuid?.label,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      proprietary_label: data.proprietary_uuid?.label,
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

          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.startDate}
                maxDate={watchedEndDate ? new Date(`${watchedEndDate}T00:00:00`) : undefined}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.endDate}
                minDate={watchedStartDate ? new Date(`${watchedStartDate}T00:00:00`) : undefined}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
              />
            )}
          />

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
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="proprietary_uuid"
            control={control}
            render={({ field }) => (
              <SelectCombobox
                name={field.name}
                label={text.proprietary}
                placeholder={text.proprietaryPlaceholder}
                options={proprietaryOptions}
                loading={proprietariesQuery.isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
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
