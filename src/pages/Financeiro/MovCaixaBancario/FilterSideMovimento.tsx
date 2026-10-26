// src/pages/Financeiro/MovCaixaBancario/FilterSideMovimento.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de MOVIMENTO CAIXA/BANCÁRIO (Movement,
// TASK-MV-FE-04) — casca `<FilterSide>` + `<Form formFilter>`/
// `<Form.BodyFilter>`/`<Form.FooterFilter>` (NUNCA `<VStack as="form">` cru),
// mirror mecânico de `CadastrosBase/SaldoInicial/FilterSideSaldoInicial.tsx`.
//
// Contrato B do filtro (get_pwa_grid_query_pattern) — SEIS props exatas
// (`FilterModalProps<MovementFilterForm>`), sem `onApply`/`onReset` do
// Contrato A aposentado.
//
// Campos (Movement-contrato-tela.md §5, ficha TASK-MV-FE-04): data De/Até,
// conta (`SelectAsyncPaginate`/`listAccounts`), proprietário
// (`SelectCombobox`/`listProprietaryOptions`, reusa `useProprietariesList()`),
// tipo (`Select`/`movementTypeOptions`), categoria
// (`SelectAsyncPaginate`/`listFinancialCategoryOptions`), faixa de valor (2
// `MoneyInput`), safra (`SelectAsyncPaginate`/`listHarvestOptions`).
//
// Re-hidratação SOMENTE em `[isOpen]` — reagir a `filter` clobaria o que o
// usuário está digitando com o drawer aberto (mesma disciplina de
// `FilterSideSaldoInicial.tsx`/`FilterSideEstoqueInicial.tsx`).
//
// `value_min`/`value_max` (nome persistido em `MovementFilterForm`, contrato
// de tipos TASK-MV-FE-01) → achatados para `min_value`/`max_value` na
// querystring real por `index.tsx` (`toRequestFilter`), nomes confirmados em
// `MovementFilterData` (api_root) — este arquivo só lida com o nome de
// FORM/persistência, nunca com o nome de querystring.
//
// UT-000796 r2 (L5/L6) — campo "Tipo Cat." (`category_type`): como no legado
// (`index.blade.php:90,288-352`) NÃO filtra linhas; só configura o lookup do
// filtro "Categoria" (`deriveFilterCategoryParams`: E:2, S:1, T:3, F:2) e
// habilita/limpa o select Categoria (desabilitado enquanto o Tipo Cat. está
// vazio, como o `readonly(!isset($category))` do legado). A LIMPEZA da
// Categoria acontece SÓ no handler de mudança do usuário (nunca em
// `useEffect`/`watch`), então a re-hidratação do drawer (`reset` em `[isOpen]`)
// não a dispara.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';

import { useAuth } from '@/hooks/useAuth';

import {
  movementFilterCategoryTypeOptions,
  movementTypeOptions,
} from '@/constants/Financial/movement/options';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  MovementFilterCategoryType,
  MovementFilterForm,
  MovementTypeCode,
} from '@/@types/v2/Movements';

import { deriveFilterCategoryParams } from './movement-field-state';

import { useProprietariesList } from '../../CadastrosBase/ContasBancarias/useAccounts';

// Forma INTERNA do form — Selects trabalham com `Option`, o submit converte
// para `MovementFilterForm` (strings/números crus + `*_label` companion),
// mesmo padrão de `FilterSideSaldoInicial.tsx`.
interface FilterFormValues {
  start_date: string;
  end_date: string;
  account_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  type: Option<MovementTypeCode> | null;
  category_type: Option<MovementFilterCategoryType> | null;
  category_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  value_min: number | null;
  value_max: number | null;
}

const pristineFormValues: FilterFormValues = {
  start_date: '',
  end_date: '',
  account_uuid: null,
  proprietary_uuid: null,
  type: null,
  category_type: null,
  category_uuid: null,
  harvest_uuid: null,
  value_min: null,
  value_max: null,
};

export function FilterSideMovimento({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MovementFilterForm>) {
  const text = languageGB.movements.movement.filter;

  // Escopo pela FAZENDA ATIVA (`activeFarmUuid`, mesma fonte do
  // `X-Farm-Id`), mirror `CreateOrUpdateMovimento.tsx`/`NewMovementModal.tsx`/
  // `BulkInvestmentBanner.tsx` — escopo TENANT (sem `farmUuid`) omitia
  // proprietários só-fazenda do filtro. `farmUuid` entra na `queryKey` do
  // hook (`useAccounts.tsx`), refazendo o fetch na troca de fazenda.
  const { activeFarmUuid } = useAuth();
  const proprietariesQuery = useProprietariesList(activeFarmUuid ?? undefined);
  const proprietaryOptions: Option<string>[] = (proprietariesQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  const { control, handleSubmit, reset, watch, setValue } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  function toInternalValues(rawFilter?: MovementFilterForm | null): FilterFormValues {
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
      type: movementTypeOptions.getOption(rawFilter?.type, languageGB),
      category_type: movementFilterCategoryTypeOptions.getOption(
        rawFilter?.category_type,
        languageGB
      ),
      category_uuid: rawFilter?.category_uuid
        ? {
            value: rawFilter.category_uuid,
            label: rawFilter.category_label ?? rawFilter.category_uuid,
          }
        : null,
      harvest_uuid: rawFilter?.harvest_uuid
        ? {
            value: rawFilter.harvest_uuid,
            label: rawFilter.harvest_label ?? rawFilter.harvest_uuid,
          }
        : null,
      value_min: rawFilter?.value_min ?? null,
      value_max: rawFilter?.value_max ?? null,
    };
  }

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen].
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');
  const watchedCategoryType = watch('category_type');
  const categoryType = watchedCategoryType?.value ?? null;
  // Legado: `readonly(!isset($category))` — fica habilitada se já houver uma
  // Categoria aplicada (filtros persistidos antes do campo Tipo Cat. existir).
  const hasCategory = !!watch('category_uuid');

  function onSubmit(data: FilterFormValues) {
    const applied: MovementFilterForm = {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      account_uuid: data.account_uuid?.value || undefined,
      account_label: data.account_uuid?.label,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      proprietary_label: data.proprietary_uuid?.label,
      type: data.type?.value || undefined,
      category_type: data.category_type?.value || undefined,
      category_uuid: data.category_uuid?.value || undefined,
      category_label: data.category_uuid?.label,
      harvest_uuid: data.harvest_uuid?.value || undefined,
      harvest_label: data.harvest_uuid?.label,
      value_min: data.value_min ?? undefined,
      value_max: data.value_max ?? undefined,
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

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.type}
                options={movementTypeOptions.options(languageGB)}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="category_type"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.categoryType}
                placeholder={text.categoryTypePlaceholder}
                options={movementFilterCategoryTypeOptions.options(languageGB)}
                value={field.value ?? null}
                onChange={(option) => {
                  field.onChange(option ?? null);
                  // Legado: trocar/limpar o Tipo Cat. limpa a Categoria. Só em
                  // ação do usuário (este handler) — a re-hidratação não passa
                  // por aqui.
                  setValue('category_uuid', null, { shouldDirty: true });
                }}
              />
            )}
          />

          <Controller
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.category}
                placeholder={
                  categoryType || hasCategory ? text.categoryPlaceholder : text.categoryDisabledHint
                }
                isDisabled={!categoryType && !hasCategory}
                service={listFinancialCategoryOptions}
                mapOptions={(item: FinancialCategoryOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  ...deriveFilterCategoryParams(categoryType),
                })}
                cacheUniqs={[categoryType ?? '']}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="harvest_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.harvest}
                placeholder={text.harvestPlaceholder}
                service={listHarvestOptions}
                mapOptions={(item: Harvest) => ({
                  label: item.description,
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
            name="value_min"
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                label={text.valueMin}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
              />
            )}
          />
          <Controller
            name="value_max"
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                label={text.valueMax}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
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
