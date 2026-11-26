// src/pages/Administrativo/OrdensCompra/prototype/PurchaseOrderStandaloneForm.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — "Nova ordem de compra" AVULSA (sem Solicitação):
// fornecedor (um só), fazenda, categoria (as 4 de 25/11) e marcação opcional,
// previsão de entrega da ordem e os itens (descrição, quantidade inteira e
// valor unitário). Regra em `standaloneOrder.ts` (com teste). Ao salvar, abre o
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
  buildStandaloneOrderPayload,
  emptyStandaloneOrder,
  newStandaloneItem,
  type StandaloneOrderForm,
  type StandaloneOrderItemForm,
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

  const error = validateStandaloneOrder(form);
  const set = (patch: Partial<StandaloneOrderForm>) => setForm((current) => ({ ...current, ...patch }));
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
    </FormContainer>
  );
}
