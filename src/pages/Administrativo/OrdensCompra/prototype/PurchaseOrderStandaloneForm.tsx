// src/pages/Administrativo/OrdensCompra/prototype/PurchaseOrderStandaloneForm.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — "Nova ordem de compra" AVULSA (sem Solicitação):
// fornecedor (um só), fazenda, categoria (as 4 de 25/11) e marcação opcional,
// previsão de entrega da ordem, os itens (descrição, quantidade inteira e
// valor unitário) e, opcionais, a ENTREGA (frete, local, transportadora,
// descarga) e o PAGAMENTO (condição, parcelas iguais a partir do 1º
// vencimento, despesas de frete/seguro/outras). Regra em `standaloneOrder.ts` (com teste). Ao salvar, abre o
// detalhe da Ordem. Rota `/administrativo/ordens-de-compra/ordens/nova`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { RepeaterList } from '@/components/ui/RepeaterList';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { columnsForm } from '@/constants/coluns-form';

import {
  PURCHASE_ORDER_CATEGORIES,
  PURCHASE_ORDER_MARKS,
  type PurchaseOrderCategoryKey,
  type PurchaseOrderMarkKey,
} from '../../Solicitacao/prototype/purchaseOrderCategories';
import { RequestTabHeader } from '../../Solicitacao/RequestTabParts';

import {
  createStandaloneOrder,
  fetchStandaloneOrderOptions,
  PURCHASE_ORDER_ENTITY_PATH,
  purchaseOrderEntityPath,
  purchaseOrderEntityQueryKey,
} from './purchaseOrderEntity';
import {
  buildInstallments,
  buildStandaloneOrderPayload,
  emptyStandaloneOrder,
  newStandaloneItem,
  type StandaloneOrderForm,
  type StandaloneOrderItemForm,
  standaloneOrderPayable,
  standaloneOrderTotal,
  validateStandaloneOrder,
} from './standaloneOrder';

const NO_MARK = 'nenhuma';

export default function PurchaseOrderStandaloneForm() {
  const { languageGB } = useLanguage();
  const proto = languageGB.requestPurchases.requestPurchase.form.prototype;
  const text = proto.purchaseOrder;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StandaloneOrderForm>(emptyStandaloneOrder);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: options } = useQuery({
    queryKey: [...purchaseOrderEntityQueryKey.list, 'options'],
    queryFn: fetchStandaloneOrderOptions,
  });

  const providerOptions = (options?.providers ?? []).map((p) => ({ label: p.name, value: p.uuid }));
  const farmOptions = (options?.farms ?? []).map((f) => ({ label: f.description, value: f.uuid }));
  const categoryOptions = PURCHASE_ORDER_CATEGORIES.map((c) => ({ label: proto.categories.names[c.key], value: c.key }));
  const markOptions = [
    { label: text.markNone, value: NO_MARK },
    ...PURCHASE_ORDER_MARKS.map((m) => ({ label: proto.marks.names[m.key], value: m.key })),
  ];

  const freightOptions = [
    { label: proto.delivery.cif, value: 'CIF' },
    { label: proto.delivery.fob, value: 'FOB' },
  ];

  const error = validateStandaloneOrder(form);
  const installments = buildInstallments(
    standaloneOrderPayable(form),
    form.payment.installments ?? 0,
    form.payment.first_due,
    form.payment.interval_days ?? 30
  );
  const set = (patch: Partial<StandaloneOrderForm>) => setForm((current) => ({ ...current, ...patch }));
  const setDelivery = (patch: Partial<StandaloneOrderForm['delivery']>) =>
    setForm((current) => ({ ...current, delivery: { ...current.delivery, ...patch } }));
  const setPayment = (patch: Partial<StandaloneOrderForm['payment']>) =>
    setForm((current) => ({ ...current, payment: { ...current.payment, ...patch } }));
  const setItem = (key: string, patch: Partial<StandaloneOrderItemForm>) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));

  async function save() {
    setTried(true);
    if (error) return;
    setBusy(true);
    try {
      const created = await createStandaloneOrder(buildStandaloneOrderPayload(form));
      await queryClient.invalidateQueries({ queryKey: purchaseOrderEntityQueryKey.list });
      toaster.success({ title: text.created.replace('{code}', created.code) });
      navigate(purchaseOrderEntityPath(created.uuid));
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (field: 'provider' | 'farm' | 'category') =>
    tried && error === field ? text.errors[field] : undefined;

  return (
    <FormContainer
      title={text.newTitle}
      subtitle={text.newSubtitle}
      footer={
        <>
          {tried && error && !['provider', 'farm', 'category'].includes(error) && (
            <Text fontSize="sm" color="fg.error" mr="auto">
              {text.errors[error]}
            </Text>
          )}
          <Button title={text.cancel} variant="secondary" type="button" onClick={() => navigate(PURCHASE_ORDER_ENTITY_PATH)} />
          <Button title={text.create} type="button" onClick={save} loading={busy} disabled={busy} />
        </>
      }
    >
      <RequestTabHeader title={text.generalTitle} />
      <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
        <Select
          name="provider"
          label={text.provider}
          options={providerOptions}
          value={providerOptions.find((o) => o.value === form.provider_uuid) ?? null}
          onChange={(option) => set({ provider_uuid: option?.value ?? null })}
          error={fieldError('provider')}
          isRequired
        />
        <Select
          name="farm"
          label={text.farm}
          options={farmOptions}
          value={farmOptions.find((o) => o.value === form.farm_uuid) ?? null}
          onChange={(option) => set({ farm_uuid: option?.value ?? null })}
          error={fieldError('farm')}
          isRequired
        />
        <Input
          label={text.forecast}
          type="date"
          value={form.delivery_forecast}
          onChange={(event) => set({ delivery_forecast: event.target.value })}
        />
        <Select
          name="category"
          label={proto.categories.label}
          options={categoryOptions}
          value={categoryOptions.find((o) => o.value === form.category) ?? null}
          onChange={(option) => set({ category: (option?.value as PurchaseOrderCategoryKey) ?? null })}
          error={fieldError('category')}
          isRequired
        />
        <Select
          name="mark"
          label={proto.marks.label}
          options={markOptions}
          value={markOptions.find((o) => o.value === (form.mark ?? NO_MARK)) ?? null}
          onChange={(option) =>
            set({ mark: !option || option.value === NO_MARK ? null : (option.value as PurchaseOrderMarkKey) })
          }
          noClearable
        />
      </SimpleGrid>
      <Text fontSize="sm" color="fg.muted" mt={2}>
        {text.forecastHint}
      </Text>

      <Box mt={8}>
        <RequestTabHeader title={text.itemsTitle} count={form.items.length} />
        <RepeaterList
          count={form.items.length}
          rowKey={(index) => form.items[index].key}
          onAdd={() => set({ items: [...form.items, newStandaloneItem()] })}
          onRemove={(index) => set({ items: form.items.filter((_, i) => i !== index) })}
          addLabel={text.addItem}
          removeLabel={text.removeItem}
          renderRow={(index) => {
            const item = form.items[index];
            return (
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full">
                <Input
                  name={`item_description_${item.key}`}
                  label={text.item}
                  value={item.description}
                  onChange={(event) => setItem(item.key, { description: event.target.value })}
                  isRequired
                />
                <NumberInput
                  name={`item_quantity_${item.key}`}
                  label={text.quantity}
                  value={item.quantity}
                  onValueChange={(q) => setItem(item.key, { quantity: q })}
                  min={0}
                />
                <MaskedInput
                  kind="currency"
                  name={`item_price_${item.key}`}
                  label={text.unitPrice}
                  value={item.unit_price}
                  onValueChange={(v) => setItem(item.key, { unit_price: v })}
                  min={0}
                />
              </SimpleGrid>
            );
          }}
        />
        <Flex justify="flex-end" mt={4}>
          <Text fontWeight="semibold">
            {text.total}: {formatCurrencyBRL(standaloneOrderTotal(form))}
          </Text>
        </Flex>
      </Box>

      {/* Entrega combinada com o fornecedor (opcional: vai se tiver o local). */}
      <Box mt={8}>
        <RequestTabHeader title={proto.delivery.tab} />
        <Text fontSize="sm" color="fg.muted" mt={-2} mb={4}>
          {text.deliveryHint}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
          <Select
            name="freight_type"
            label={proto.delivery.freightType}
            options={freightOptions}
            value={freightOptions.find((o) => o.value === form.delivery.freight_type) ?? null}
            onChange={(option) => setDelivery({ freight_type: (option?.value as 'CIF' | 'FOB') ?? 'CIF' })}
            noClearable
          />
          <Input
            name="delivery_place"
            label={proto.delivery.place}
            value={form.delivery.place}
            onChange={(event) => setDelivery({ place: event.target.value })}
          />
          <Input
            name="delivery_carrier"
            label={proto.delivery.carrier}
            value={form.delivery.carrier}
            onChange={(event) => setDelivery({ carrier: event.target.value })}
          />
          <Input
            name="delivery_note"
            label={proto.delivery.note}
            value={form.delivery.note}
            onChange={(event) => setDelivery({ note: event.target.value })}
          />
        </SimpleGrid>
        <Box mt={4}>
          <ToggleRow
            label={proto.delivery.unloading}
            checked={form.delivery.needs_unloading}
            onChange={(value) => setDelivery({ needs_unloading: value })}
          />
        </Box>
      </Box>

      {/* Pagamento (opcional: vai se tiver a condição); parcelas iguais sobre itens + despesas. */}
      <Box mt={8}>
        <RequestTabHeader title={proto.payment.tab} />
        <Text fontSize="sm" color="fg.muted" mt={-2} mb={4}>
          {text.paymentHint}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
          <Input
            name="payment_condition"
            label={proto.payment.condition}
            value={form.payment.condition}
            onChange={(event) => setPayment({ condition: event.target.value })}
          />
          <NumberInput
            name="payment_installments"
            label={text.installmentsCount}
            value={form.payment.installments}
            onValueChange={(v) => setPayment({ installments: v })}
            min={1}
          />
          <Input
            name="payment_first_due"
            label={text.firstDue}
            type="date"
            value={form.payment.first_due}
            onChange={(event) => setPayment({ first_due: event.target.value })}
          />
          <NumberInput
            name="payment_interval"
            label={text.intervalDays}
            value={form.payment.interval_days}
            onValueChange={(v) => setPayment({ interval_days: v })}
            min={0}
          />
          <MaskedInput
            kind="currency"
            name="payment_freight"
            label={proto.payment.freight}
            value={form.payment.freight}
            onValueChange={(v) => setPayment({ freight: v })}
            min={0}
          />
          <MaskedInput
            kind="currency"
            name="payment_insurance"
            label={proto.payment.insurance}
            value={form.payment.insurance}
            onValueChange={(v) => setPayment({ insurance: v })}
            min={0}
          />
          <MaskedInput
            kind="currency"
            name="payment_other"
            label={proto.payment.other}
            value={form.payment.other}
            onValueChange={(v) => setPayment({ other: v })}
            min={0}
          />
        </SimpleGrid>
        {form.payment.condition.trim() && installments.length > 0 && (
          <Text fontSize="sm" fontWeight="semibold" mt={4}>
            {text.installmentsPreview
              .replace('{count}', String(installments.length))
              .replace('{value}', formatCurrencyBRL(installments[0].value))
              .replace('{total}', formatCurrencyBRL(standaloneOrderPayable(form)))}
          </Text>
        )}
      </Box>
    </FormContainer>
  );
}
