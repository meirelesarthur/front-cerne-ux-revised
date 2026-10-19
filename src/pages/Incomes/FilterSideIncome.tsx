// src/pages/Incomes/FilterSideIncome.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Contas a Receber — mirror quase 1:1 de
// `FilterSideCentroCusto.tsx` (casca `<FilterSide>` + `Form.BodyFilter`/
// `Form.FooterFilter`), trocando os campos pelos reais de
// `IncomeIndexRequest` (contrato §3.2, TASK-FE-036-312).
//
// `client_id` — nome do parâmetro é LEGADO, mas o valor esperado é o `uuid`
// do cliente (mirror `InvoiceFilterForm.provider_id`) — NÃO renomear. `status`
// é o único campo sem precedente direto no molde de Invoice (enum
// vencido/parcial/aberto/baixado, derivado no cliente — §5.1 do contrato).
//
// O `Select`/`SelectAsyncPaginate` trabalham com `Option` (label/value), não
// com a string crua que o backend espera — por isso o form RHF usa
// `Option | null` internamente e o `submit` converte para o shape cru de
// `IncomeFilterForm` antes de chamar `handleFilterChange`.
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
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { Harvest } from '@/@types/v2/Harvests';
import type { IncomeFilterForm } from '@/@types/v2/Incomes';

export function FilterSideIncome({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterModalProps<IncomeFilterForm> & { filtersApplied?: number }) {
  const text = languageGB.incomes.income.filter;

  // TASK-FE-036-322 (FID-G3F LM03/FM11/LK12) — 6 estados (chaves CONFIRMADAS
  // 1:1 com o enum `status` do backend migrado, ver `IncomeStatus`).
  const statusOptions: Option<string>[] = [
    { value: 'vencido', label: text.statusOptions.vencido },
    { value: 'parcial', label: text.statusOptions.parcial },
    { value: 'aberto', label: text.statusOptions.aberto },
    { value: 'baixado', label: text.statusOptions.baixado },
    { value: 'adiantamento_aberto', label: text.statusOptions.adiantamento_aberto },
    { value: 'adiantamento_baixado', label: text.statusOptions.adiantamento_baixado },
  ];

  // Forma INTERNA do form (só deste componente) — `client_id`/`status`/
  // lookups são `Option`, o submit converte para `IncomeFilterForm` (valores
  // crus). TASK-FE-036-323/324 — 5 campos simples (intervalo de vencimento,
  // histórico, valor) + 4 selects de lookup (proprietário/categoria/centro/
  // safra). NFe (FM02) e "conta" (FM18) NÃO implementados nesta Onda (ver
  // notas de escopo no topo do arquivo/tipo `IncomeFilterForm`).
  interface FilterFormValues {
    search?: string;
    client_id: Option<string> | null;
    status: Option<string> | null;
    dt_emission_from: string | null;
    dt_emission_to: string | null;
    due_date_from: string | null;
    due_date_to: string | null;
    note?: string;
    amount: number | null;
    proprietary_id: Option<string> | null;
    category_id: Option<string> | null;
    center_id: Option<string> | null;
    harvest_id: Option<string> | null;
    // ---- ONDA 3 sub-onda 3d (FM08/FM09/FM18) — filtros de baixa. ----
    account_id: Option<string> | null;
    write_off_date_from: string | null;
    write_off_date_to: string | null;
  }

  const pristineFormValues: FilterFormValues = {
    search: '',
    client_id: null,
    status: null,
    dt_emission_from: null,
    dt_emission_to: null,
    due_date_from: null,
    due_date_to: null,
    note: '',
    amount: null,
    proprietary_id: null,
    category_id: null,
    center_id: null,
    harvest_id: null,
    account_id: null,
    write_off_date_from: null,
    write_off_date_to: null,
  };

  function toInternalValues(rawFilter?: IncomeFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      client_id: null,
      status: statusOptions.find((option) => option.value === rawFilter?.status) ?? null,
      dt_emission_from: rawFilter?.dt_emission_from ?? null,
      dt_emission_to: rawFilter?.dt_emission_to ?? null,
      due_date_from: rawFilter?.due_date_from ?? null,
      due_date_to: rawFilter?.due_date_to ?? null,
      note: rawFilter?.note ?? '',
      amount: rawFilter?.amount ?? null,
      // Selects assíncronos — só a `Option` completa (label+value) hidrata
      // corretamente; sem cache de lookup aberto no drawer, reabrir com um
      // filtro já aplicado mostra o campo vazio (mesma limitação já aceita
      // para `client_id` acima, mirror do padrão existente do componente).
      proprietary_id: null,
      category_id: null,
      center_id: null,
      harvest_id: null,
      // Mesma limitação de reidratação já aceita acima (Select assíncrono
      // só com a `Option` completa) — reabrir com o filtro já aplicado
      // mostra o campo vazio.
      account_id: null,
      write_off_date_from: rawFilter?.write_off_date_from ?? null,
      write_off_date_to: rawFilter?.write_off_date_to ?? null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      client_id: data.client_id?.value || undefined,
      status: (data.status?.value as IncomeFilterForm['status']) || undefined,
      dt_emission_from: data.dt_emission_from || undefined,
      dt_emission_to: data.dt_emission_to || undefined,
      due_date_from: data.due_date_from || undefined,
      due_date_to: data.due_date_to || undefined,
      note: data.note?.trim() || undefined,
      amount: data.amount || undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      category_id: data.category_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      harvest_id: data.harvest_id?.value || undefined,
      account_id: data.account_id?.value || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

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

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="client_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.client}
                placeholder={text.clientPlaceholder}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                // TASK-FE-036-324 (FID-G3F LK01 fix) — paridade com
                // `CreateOrUpdateIncome.tsx` (`is_enabled: true`), que já
                // envia esse parâmetro; o filtro estava sem, listando
                // clientes inativos.
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: true,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* TASK-FE-036-324 (FID-G3F FM13) — proprietário, mirror exato do
              service/mapOptions/findParams já usados em
              `CreateOrUpdateIncome.tsx` (`proprietary_uuid`). */}
          <Controller
            name="proprietary_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.proprietary}
                placeholder={text.proprietaryPlaceholder}
                service={listProprietaries}
                mapOptions={(item: ProprietaryListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: true,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* TASK-FE-036-324 (FID-G3F FM19) — safra DE CABEÇALHO
              (`harvest_uuid`), mirror exato de `CreateOrUpdateIncome.tsx`.
              NÃO é a safra por-linha de rateio (decisão do dono já
              ratificada). */}
          <Controller
            name="harvest_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.harvest}
                placeholder={text.harvestPlaceholder}
                service={listHarvests}
                mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* TASK-FE-036-324 (FID-G3F FM16) — categoria financeira, mirror
              exato de `IncomeApportionmentTab.tsx`. */}
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.category}
                placeholder={text.categoryPlaceholder}
                service={listFinancialCategoryOptions}
                mapOptions={(item: FinancialCategoryOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* TASK-FE-036-324 (FID-G3F FM17) — centro de custo, mirror exato
              de `IncomeApportionmentTab.tsx` (`only_analytic: true`). */}
          <Controller
            name="center_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.center}
                placeholder={text.centerPlaceholder}
                service={listCostCenterOptions}
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  only_analytic: true,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
              />
            )}
          />

          {/* FM08/FM18 "conta da baixa" — ONDA 3 sub-onda 3d: o backend
              agora aceita `account_id` em `IncomeIndexRequest::rules()`
              (API em teste). Mirror do padrão de `SelectAsyncPaginate`
              já usado acima (`client_id`/`proprietary_id`), MESMO service
              `listAccounts` já usado em `IncomeAutomaticWriteoffSection.tsx`
              — nenhum service novo duplicado. */}
          <Controller
            name="account_id"
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
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
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
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="dt_emission_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dtEmissionFrom}>
                <DateInput value={value} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="dt_emission_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dtEmissionTo}>
                <DateInput value={value} onChange={onChange} />
              </Field>
            )}
          />

          {/* TASK-FE-036-323 (FID-G3F FM04/FM05) — intervalo de vencimento
              (`due_date`), maior prioridade dos 4 filtros ausentes (uso
              operacional frequente, sinalizado pelo coordenador). Mirror
              exato dos campos de emissão acima. */}
          <Controller
            name="due_date_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dueDateFrom}>
                <DateInput value={value} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="due_date_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.dueDateTo}>
                <DateInput value={value} onChange={onChange} />
              </Field>
            )}
          />

          {/* FM09/FM18 "data de baixa" — ONDA 3 sub-onda 3d, mirror exato
              do par `due_date_from`/`due_date_to` acima. */}
          <Controller
            name="write_off_date_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.writeOffDateFrom}>
                <DateInput value={value} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="write_off_date_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.writeOffDateTo}>
                <DateInput value={value} onChange={onChange} />
              </Field>
            )}
          />

          {/* TASK-FE-036-323 (FID-G3F FM10) — histórico (`note`), busca
              textual, mirror do campo `search` já existente. */}
          <Input label={text.note} placeholder={text.notePlaceholder} {...register('note')} />

          {/* TASK-FE-036-323 (FID-G3F FM12) — valor (`amount`), igualdade
              após normalização monetária. `MoneyInput` aceita uso fora de um
              form de escrita completo (contrato `value`/`onValueChange`
              autônomo, não amarrado a nenhum RHF específico). */}
          <Controller
            name="amount"
            control={control}
            render={({ field: { value, onChange } }) => (
              <MoneyInput
                name="amount"
                label={text.amount}
                value={value}
                onValueChange={onChange}
              />
            )}
          />

          {/* NFe (FM02) — cross-feature MISSING (Boleto/Ticket, `FID-G3A`
              RT16/RT28, decisão de escopo já registrada fora desta esteira).
              NÃO implementado — campo intencionalmente ausente, não
              omissão silenciosa. Reabrir quando Boleto for migrado. */}
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
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
