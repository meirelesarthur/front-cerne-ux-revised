// src/pages/Operacional/Vendas/SaleTotalsBlock.tsx
// -----------------------------------------------------------------------------
// Bloco de TOTAIS + COMPLEMENTOS da Venda COMERCIAL (Sale — Operacional /
// Vendas, venda de PRODUTOS, 97-Esteiras/043, SALE-FE-COM-03, `FM004`).
//
// Fórmula exibida = fórmula do SERVIDOR (PARADA-2, contrato-tela §6.2/§6.3):
//   subtotal = Σ(quantity × price)                    (BRUTO, CV003)
//   discount = Σ item.discount                         (readonly)
//   total    = subtotal + icms + freight + other_values − discount (CV004)
// NUNCA replica o desconto contado 2× do legado (`D002`/`CV005`) —
// `subtotal`/`discount`/`total` são readonly aqui E ausentes do payload
// (`CreateOrUpdateSale.tsx::tryPersistSale`), o servidor é a autoridade.
//
// `client_uuid` REUSA `listOrderClientOptions` (contrato-tela §3, sem
// endpoint próprio de Vendas). `transporter_uuid` filtra `providers/options`
// por `type=4` (Transportador, mirror `CreateOrUpdateMovementSale.tsx`).
// `proprietary_uuid` adapta `listProprietaryOptions` (array FLAT) para o
// contrato `ResponsePagination` que `SelectAsyncPaginate` exige (mirror
// `TransferAbcBatch/CreateTransferAbcBatch.tsx::listProprietaryOptionsPaginated`).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useWatch } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { columnsForm } from '@/constants/coluns-form';
import { salePaymentMethodOptions } from '@/constants/Sales/options';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProprietaryOption } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listOrderClientOptions } from '@/services/v2/Orders/order-service';
import type { OrderClientOptionItem } from '@/services/v2/Orders/order-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { SaleForm } from '@/@types/v2/Sales';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';

const TRANSPORTER_PROVIDER_TYPE = 4;

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeSaleTotals(
  items: SaleForm['items'],
  icms: number,
  freight: number,
  otherValues: number
) {
  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );
  const discount = items.reduce((acc, item) => acc + (Number(item.discount) || 0), 0);
  const total = subtotal + icms + freight + otherValues - discount;
  return { subtotal: roundTo2(subtotal), discount: roundTo2(discount), total: roundTo2(total) };
}

function mapClientOption(item: OrderClientOptionItem) {
  return { label: item.name ?? '—', value: item.uuid };
}

function mapProviderOption(item: ProviderOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapProprietaryOption(item: ProprietaryOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

interface ListProprietaryOptionsPaginatedParams extends PaginationQueryParams {
  search?: string;
}

async function listProprietaryOptionsPaginated(params: ListProprietaryOptionsPaginatedParams) {
  // `scope='farm'` (GAP-EARNING-07) — escopa pela fazenda ATIVA via
  // `farm_proprietary` (mirror SSR do legado, fix Execução 065 Frente F).
  // `SaleRequest::proprietary_uuid` já valida farm-scoped; sem isto o
  // select listava tenant-wide e a API rejeitava "não pertence à fazenda".
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export interface SaleTotalsBlockProps {
  control: Control<SaleForm>;
  register: UseFormRegister<SaleForm>;
  errors: FieldErrors<SaleForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function SaleTotalsBlock({
  control,
  register,
  errors,
  languageGB,
  disabled,
}: SaleTotalsBlockProps) {
  const text = languageGB.sales.sale.form;
  const header = text.fields.header;
  const footerText = text.fields.footer;

  // IG001 — recalcula ao mudar itens/ICMS/frete/outros (Lei 4, `useWatch`
  // isolado — sem estado próprio nem recompute manual).
  const items = useWatch({ control, name: 'items' }) ?? [];
  const icms = Number(useWatch({ control, name: 'icms' })) || 0;
  const freight = Number(useWatch({ control, name: 'freight' })) || 0;
  const otherValues = Number(useWatch({ control, name: 'other_values' })) || 0;

  const { subtotal, discount, total } = computeSaleTotals(items, icms, freight, otherValues);

  const paymentMethodOptions = salePaymentMethodOptions.options(languageGB);

  return (
    <Box mt={6}>
      <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="client"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={header.client}
              placeholder={text.placeholders.header.client}
              service={listOrderClientOptions}
              mapOptions={mapClientOption}
              findParams={findParamsFromSearch}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              error={error?.message}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isRequired
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="payment_method"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={header.paymentMethod}
              options={paymentMethodOptions}
              value={field.value ?? null}
              onChange={(option) => field.onChange(option ?? null)}
              error={error?.message}
              isRequired
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="transporter"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={header.transporter}
              service={(params) =>
                listProviderOptions({ ...params, type: TRANSPORTER_PROVIDER_TYPE })
              }
              mapOptions={mapProviderOption}
              findParams={findParamsFromSearch}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="proprietary"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={header.proprietary}
              service={listProprietaryOptionsPaginated}
              mapOptions={mapProprietaryOption}
              findParams={findParamsFromSearch}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
        <Input
          label={header.driver}
          maxLength={250}
          error={errors.driver?.message}
          disabled={disabled}
          {...register('driver')}
        />
      </SimpleGrid>

      <Box mt={6}>
        <Textarea
          label={header.note}
          maxLength={200}
          rows={4}
          error={errors.note?.message}
          disabled={disabled}
          {...register('note')}
        />
      </Box>

      {/* Rodapé de totais (FM004) — `subtotal`/`discount`/`total` SEMPRE
          readonly (fórmula do servidor, PARADA-2); `icms`/`freight`/
          `other_values` são os ÚNICOS editáveis do rodapé (CV004). */}
      <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
        <InputReadOnly label={footerText.subtotal} value={formatCurrencyBRL(subtotal)} />

        <Controller
          name="icms"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MoneyInput
              name={field.name}
              label={footerText.icms}
              value={field.value}
              onValueChange={field.onChange}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="freight"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MoneyInput
              name={field.name}
              label={footerText.freight}
              value={field.value}
              onValueChange={field.onChange}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="other_values"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MoneyInput
              name={field.name}
              label={footerText.otherValues}
              value={field.value}
              onValueChange={field.onChange}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <InputReadOnly label={footerText.discount} value={formatCurrencyBRL(discount)} />
        <InputReadOnly label={footerText.total} value={formatCurrencyBRL(total)} />
      </SimpleGrid>
    </Box>
  );
}

export default SaleTotalsBlock;
