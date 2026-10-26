// src/pages/Financeiro/ContasAPagar/FilterSideExpense.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Expense (Contas a Pagar, esteira 036) —
// mirror `FilterSideInvoice.tsx`. Campos = subconjunto REAL suportado por
// `ExpenseIndexRequest::rules()` — NÃO a lista completa do legado.
//
// TASK-FE-036-115 (ONDA 2, FID-G3F FM13/FM16/FM17/FM05 revisado) — 4 filtros
// novos (`note`/`category_uuid`/`center_uuid`/`status`), já aplicados na API
// (`ExpenseIndexRequest::rules()`/`ExpenseRepository::listWithFilters`).
// `category_uuid`/`center_uuid` reaproveitam os MESMOS services já usados em
// `ExpenseApportionmentTab.tsx` (`listFinancialCategoryOptions`/
// `listCostCenterOptions`) — nenhum service novo duplicado. `status` é um
// enum FECHADO de 8 estados (`ExpenseStatusFilterValue`, mirror
// `Expense::opStatus()` legado) — filtro server-side NOVO e INDEPENDENTE do
// badge client-side de 4 estados da grid (`utils/expense-status.ts`,
// GAP-FE-036-108, `computeExpenseStatus` PERMANECE intocado por esta
// Tarefa). `product` (FM21) NÃO entra — BLOQUEADO por GAP-036-113
// (`ExpenseIndexRequest.php`, comentário do campo). Filtros de data de baixa
// (FM10/FM11), conta da baixa (FM18) e Fazenda (FM14) ficam de fora
// (Onda 3/Onda 4, respectivamente).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { expensePaymentTypeOptions } from '@/constants/financeiro/expense/options/payment-type-options';
import { expenseStatusFilterOptions } from '@/constants/financeiro/expense/options/status-filter-options';
import { invoiceDocumentTypeOptions } from '@/constants/invoices/options/document-type-options';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { getAccount, listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import {
  getProprietaryByUuid,
  listProprietaries,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  getProviderByUuid,
  listProviders,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import {
  getCostCenter,
  listCostCenterOptions,
} from '@/services/v2/CostCenters/cost-center-service';
import {
  getFinancialCategory,
  listFinancialCategoryOptions,
} from '@/services/v2/FinancialCategories/financial-category-service';
import { getHarvest, listHarvests } from '@/services/v2/Harvests/harvest-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type {
  ExpenseFilterForm,
  ExpensePaymentTypeValue,
  ExpenseStatusFilterValue,
} from '@/@types/v2/Financeiro/expense';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { Harvest } from '@/@types/v2/Harvests';
import type { InvoiceDocumentTypeValue } from '@/@types/v2/Invoices';

// Forma INTERNA do form — selects de relacionamento trabalham com `Option`,
// o submit converte para o shape cru de `ExpenseFilterForm`.
interface FilterFormValues {
  number?: string;
  provider_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  type_title_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  dt_emission_from?: string | null;
  dt_emission_to?: string | null;
  due_date_from?: string | null;
  due_date_to?: string | null;
  amount?: number | null;
  // `payment_type`/`type_note` (esteira 036fix, audit E-13) — a API já
  // aceita e aplica os dois (`ExpenseIndexRequest::rules()`/
  // `ExpenseRepository::listWithFilters`), só faltavam no drawer.
  payment_type: Option<ExpensePaymentTypeValue> | null;
  type_note: Option<number> | null;
  // TASK-FE-036-115 — 4 filtros novos.
  note?: string;
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  status: Option<ExpenseStatusFilterValue> | null;
  // ---- ONDA 3 sub-onda 3d (FM10/FM11/FM18) — filtros de baixa. Nome
  // DIFERE do CaR (`account_id`) — aqui é `account_uuid`, mirror do
  // parâmetro real aceito por `ExpenseIndexRequest::rules()`. ----
  account_uuid: Option<string> | null;
  write_off_date_from?: string | null;
  write_off_date_to?: string | null;
}

// EXP-R15 (P1) — `toInternalValues()` restaurava provider/proprietário/Tipo
// de Título/Safra sempre como `null` ao reabrir o drawer: o filtro
// continuava aplicado internamente (o uuid cru já ia para
// `handleFilterChange`/query), mas a UI reabria vazia, escondendo do
// usuário o que estava realmente filtrado. `ExpenseFilterForm` só guarda o
// uuid cru (sem label, `@/@types/v2/Financeiro/expense`) — os 4 resolvers
// abaixo buscam o registro individual (mesmos endpoints já usados pelos
// pickers deste MESMO drawer/form, portanto mesma superfície de permissão,
// sem gate novo) só para popular o label do Select ao reabrir. Falha de
// rede/404 aqui NUNCA bloqueia a abertura do drawer — só deixa aquele
// campo sem label (mesmo comportamento anterior).
async function resolveProviderOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await getProviderByUuid(uuid);
    return { label: response.data.name, value: uuid };
  } catch {
    return null;
  }
}

async function resolveProprietaryOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await getProprietaryByUuid(uuid);
    return { label: response.data.name, value: uuid };
  } catch {
    return null;
  }
}

async function resolveHarvestOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await getHarvest(uuid);
    return { label: response.data.description, value: uuid };
  } catch {
    return null;
  }
}

// Tipo de Título NÃO usa `getTypeTitleByUuid` (`/type-titles/{uuid}`) — esse
// endpoint exige `typetitles_view` (mesmo achado que já motivou o Select
// deste MESMO drawer a usar `listTypeTitleOptions`/`/type-titles/options`,
// SEM esse gate, ver comentário do Controller abaixo). Reidratar o label por
// ali reintroduziria a exata classe de bug de permissão já corrigida.
async function resolveTypeTitleOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await listTypeTitleOptions({ per_page: 100, is_enabled: 'true' });
    const match = response.data.items.find((item) => item.uuid === uuid);
    return match ? { label: match.description, value: match.uuid } : null;
  } catch {
    return null;
  }
}

// TASK-FE-036-115 — mesmo racional de EXP-R15 acima, agora para os 2
// selects relacionais novos (`category_uuid`/`center_uuid`): busca o
// registro individual só para popular o label ao reabrir o drawer; falha de
// rede/404 nunca bloqueia a abertura, só deixa o campo sem label.
async function resolveCategoryOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await getFinancialCategory(uuid);
    return { label: response.data.description, value: uuid };
  } catch {
    return null;
  }
}

async function resolveCenterOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await getCostCenter(uuid);
    return { label: `${response.data.code} — ${response.data.description}`, value: uuid };
  } catch {
    return null;
  }
}

// ONDA 3 sub-onda 3d (FM10/FM11/FM18) — mesmo racional de EXP-R15/TASK-FE-
// 036-115 acima, agora para `account_uuid` (conta da baixa). MESMO service
// `getAccount`/`listAccounts` já usado em `CreateOrUpdateExpense.tsx`
// (seção Baixa Automática) — nenhum service novo duplicado.
async function resolveAccountOption(uuid?: string | null): Promise<Option<string> | null> {
  if (!uuid) return null;
  try {
    const response = await getAccount(uuid);
    return {
      label: `${response.data.bank} — Ag. ${response.data.agency} / Cta. ${response.data.account}`,
      value: uuid,
    };
  } catch {
    return null;
  }
}

export function FilterSideExpense({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ExpenseFilterForm>) {
  const filterText = languageGB.financial.expense.filter;

  const pristineFormValues: FilterFormValues = {
    number: '',
    provider_uuid: null,
    proprietary_uuid: null,
    type_title_uuid: null,
    harvest_uuid: null,
    dt_emission_from: null,
    dt_emission_to: null,
    due_date_from: null,
    due_date_to: null,
    amount: null,
    payment_type: null,
    type_note: null,
    note: '',
    category_uuid: null,
    center_uuid: null,
    status: null,
    account_uuid: null,
    write_off_date_from: null,
    write_off_date_to: null,
  };

  function toInternalValues(rawFilter?: ExpenseFilterForm | null): FilterFormValues {
    return {
      number: rawFilter?.number ?? '',
      provider_uuid: null,
      proprietary_uuid: null,
      type_title_uuid: null,
      harvest_uuid: null,
      dt_emission_from: rawFilter?.dt_emission_from ?? null,
      dt_emission_to: rawFilter?.dt_emission_to ?? null,
      due_date_from: rawFilter?.due_date_from ?? null,
      due_date_to: rawFilter?.due_date_to ?? null,
      amount: rawFilter?.amount ?? null,
      payment_type:
        rawFilter?.payment_type != null
          ? {
              label: expensePaymentTypeOptions.getLabel(rawFilter.payment_type, languageGB),
              value: rawFilter.payment_type,
            }
          : null,
      type_note:
        rawFilter?.type_note != null
          ? {
              label: invoiceDocumentTypeOptions.getLabel(
                rawFilter.type_note as InvoiceDocumentTypeValue,
                languageGB
              ),
              value: rawFilter.type_note,
            }
          : null,
      note: rawFilter?.note ?? '',
      category_uuid: null,
      center_uuid: null,
      status:
        rawFilter?.status != null
          ? {
              label: expenseStatusFilterOptions.getLabel(rawFilter.status, languageGB),
              value: rawFilter.status,
            }
          : null,
      account_uuid: null,
      write_off_date_from: rawFilter?.write_off_date_from ?? null,
      write_off_date_to: rawFilter?.write_off_date_to ?? null,
    };
  }

  const { control, register, handleSubmit, reset, setValue } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      number: data.number?.trim() || undefined,
      provider_uuid: data.provider_uuid?.value || undefined,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      type_title_uuid: data.type_title_uuid?.value || undefined,
      harvest_uuid: data.harvest_uuid?.value || undefined,
      dt_emission_from: data.dt_emission_from || undefined,
      dt_emission_to: data.dt_emission_to || undefined,
      due_date_from: data.due_date_from || undefined,
      due_date_to: data.due_date_to || undefined,
      amount: data.amount ?? undefined,
      payment_type: data.payment_type?.value || undefined,
      type_note: data.type_note?.value ?? undefined,
      note: data.note?.trim() || undefined,
      category_uuid: data.category_uuid?.value || undefined,
      center_uuid: data.center_uuid?.value || undefined,
      status: data.status?.value ?? undefined,
      account_uuid: data.account_uuid?.value || undefined,
      write_off_date_from: data.write_off_date_from || undefined,
      write_off_date_to: data.write_off_date_to || undefined,
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

  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });

    // EXP-R15 — upgrade assíncrono dos 4 campos relacionais (a reidratação
    // síncrona acima já limpa/reseta o resto do form imediatamente; os
    // labels chegam logo em seguida, sem travar a abertura do drawer).
    if (!isOpen || !filter) return undefined;

    let cancelled = false;
    Promise.all([
      resolveProviderOption(filter.provider_uuid),
      resolveProprietaryOption(filter.proprietary_uuid),
      resolveTypeTitleOption(filter.type_title_uuid),
      resolveHarvestOption(filter.harvest_uuid),
      resolveCategoryOption(filter.category_uuid),
      resolveCenterOption(filter.center_uuid),
      resolveAccountOption(filter.account_uuid),
    ]).then(
      ([
        providerOption,
        proprietaryOption,
        typeTitleOption,
        harvestOption,
        categoryOption,
        centerOption,
        accountOption,
      ]) => {
        if (cancelled) return;
        if (providerOption) setValue('provider_uuid', providerOption);
        if (proprietaryOption) setValue('proprietary_uuid', proprietaryOption);
        if (typeTitleOption) setValue('type_title_uuid', typeTitleOption);
        if (harvestOption) setValue('harvest_uuid', harvestOption);
        if (categoryOption) setValue('category_uuid', categoryOption);
        if (centerOption) setValue('center_uuid', centerOption);
        if (accountOption) setValue('account_uuid', accountOption);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Input
            label={filterText.number}
            placeholder={filterText.numberPlaceholder}
            {...register('number')}
          />

          <Controller
            name="provider_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.provider}
                service={listProviders}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
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

          <Controller
            name="proprietary_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.proprietary}
                service={listProprietaries}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
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

          <Controller
            name="type_title_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.typeTitle}
                // P0 (audit `audit-contas-a-pagar.md`, item E-03) — mesmo
                // fix do form: lookup sem gate de `typetitles_view`.
                service={listTypeTitleOptions}
                mapOptions={(item: TypeTitleOptionItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: 'true' as const,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="payment_type"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={filterText.paymentType}
                options={expensePaymentTypeOptions.options(languageGB)}
                value={field.value}
                onChange={(option: Option<number> | null) => field.onChange(option)}
              />
            )}
          />

          <Controller
            name="type_note"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={filterText.typeNote}
                options={invoiceDocumentTypeOptions.options(languageGB)}
                value={field.value}
                onChange={(option: Option<number> | null) => field.onChange(option)}
              />
            )}
          />

          {/* TASK-FE-036-115 (FM13) — mirror `number` acima, mesmo padrão
              visual. Busca por `ILIKE` no backend, INDEPENDENTE do filtro
              `number` (`ExpenseRepository::listWithFilters`). */}
          <Input label={filterText.note} {...register('note')} />

          {/* TASK-FE-036-115 (FM16) — MESMO service já usado no rateio
              (`ExpenseApportionmentTab.tsx`), nenhum service novo
              duplicado. */}
          <Controller
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.category}
                service={listFinancialCategoryOptions}
                mapOptions={(item: FinancialCategoryOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: 'true' as const,
                  type_id: 1,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* TASK-FE-036-115 (FM17) — MESMO service já usado no rateio
              (`ExpenseApportionmentTab.tsx`), nenhum service novo
              duplicado. */}
          <Controller
            name="center_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.center}
                service={listCostCenterOptions}
                mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  only_analytic: true,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* TASK-FE-036-115 (FM05, revisado — pivô de fidelidade da Onda 2
              OVERRIDE o default de GAP-FE-036-108 SÓ para este filtro).
              Enum FECHADO de 8 estados (`ExpenseStatusFilterValue`, mirror
              `Expense::opStatus()` legado) — filtro server-side NOVO,
              INDEPENDENTE do badge client-side de 4 estados da grid
              (`computeExpenseStatus`, `utils/expense-status.ts`, permanece
              intocado). Os dois números de estados NÃO precisam bater 1:1. */}
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={filterText.status}
                options={expenseStatusFilterOptions.options(languageGB)}
                value={field.value}
                onChange={(option: Option<ExpenseStatusFilterValue> | null) =>
                  field.onChange(option)
                }
              />
            )}
          />

          <Controller
            name="harvest_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.harvest}
                service={listHarvests}
                mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
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

          {/* ONDA 3 sub-onda 3d (FM18) — "conta da baixa". Mirror do
              padrão de `SelectAsyncPaginate` já usado neste MESMO drawer
              (`category_uuid`/`center_uuid`), MESMO service `listAccounts`
              já usado em `CreateOrUpdateExpense.tsx` (seção Baixa
              Automática) — nenhum service novo duplicado. */}
          <Controller
            name="account_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.account}
                placeholder={filterText.accountPlaceholder}
                service={listAccounts}
                mapOptions={(item: {
                  uuid: string;
                  bank: string;
                  agency: string;
                  account: string;
                }) => ({
                  label: `${item.bank} — Ag. ${item.agency} / Cta. ${item.account}`,
                  value: item.uuid,
                })}
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

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dtEmissionFrom}
          </Text>
          <Controller
            name="dt_emission_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dtEmissionTo}
          </Text>
          <Controller
            name="dt_emission_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dueDateFrom}
          </Text>
          <Controller
            name="due_date_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dueDateTo}
          </Text>
          <Controller
            name="due_date_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          {/* ONDA 3 sub-onda 3d (FM10/FM11) — "data de baixa", mirror
              exato do par `due_date_from`/`due_date_to` acima. */}
          <Text fontSize="sm" fontWeight="medium">
            {filterText.writeOffDateFrom}
          </Text>
          <Controller
            name="write_off_date_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.writeOffDateTo}
          </Text>
          <Controller
            name="write_off_date_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              // P1 (audit "Valor... WIDGET_DIVERGENTE: legado usa máscara
              // monetária") — `NumberInput` cru trocado pela mesma máscara
              // R$ usada no valor do título/rateio/parcelas.
              <MoneyInput
                name={field.name}
                label={filterText.amount}
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
