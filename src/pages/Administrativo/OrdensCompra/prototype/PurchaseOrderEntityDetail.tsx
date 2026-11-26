// src/pages/Administrativo/OrdensCompra/prototype/PurchaseOrderEntityDetail.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — detalhe da ORDEM DE COMPRA: fornecedor único (com
// contato), situação, fazenda, data, PREVISÃO DE ENTREGA da ordem (uma só,
// editável), a Solicitação de origem (vínculo de volta) ou "começou sozinha".
// Abas que são da Ordem (saíram da Solicitação): Itens (com Recebido e Saldo),
// Entrega, Pagamento e Notas fiscais. Ações no rodapé: "Registrar recebimento"
// (NF + quantidades) e "Cancelar saldo". Rota `/administrativo/ordens-de-compra/ordens/:uuid`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Spinner, Tabs, Text } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';

import {
  PrototypeDeliveryPanel,
  PrototypeInvoicesPanel,
  PrototypePaymentPanel,
} from '../../Solicitacao/prototype/PrototypeFinancePanels';
import { PrototypeJustifyDialog, PrototypeReceiptDialog } from '../../Solicitacao/prototype/PrototypeOrderActions';
import { RequestTabEmpty, RequestTabHeader } from '../../Solicitacao/RequestTabParts';

import {
  cancelPurchaseOrderBalance,
  fetchPurchaseOrder,
  PURCHASE_ORDER_ENTITY_PATH,
  purchaseOrderEntityQueryKey,
  purchaseOrderHasBalance,
  purchaseOrderItemBalance,
  purchaseOrderStatusColor,
  registerPurchaseOrderReceipt,
  setPurchaseOrderForecast,
} from './purchaseOrderEntity';

const qty = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

type OrderTab = 'items' | 'delivery' | 'payment' | 'invoices';

export default function PurchaseOrderEntityDetail() {
  const { languageGB } = useLanguage();
  const proto = languageGB.requestPurchases.requestPurchase.form.prototype;
  const text = proto.purchaseOrder;
  const { uuid = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<OrderTab>('items');
  const [dialog, setDialog] = useState<'forecast' | 'receipt' | 'cancelBalance' | null>(null);
  const [newDate, setNewDate] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: purchaseOrderEntityQueryKey.detail(uuid),
    queryFn: () => fetchPurchaseOrder(uuid),
    enabled: !!uuid,
  });

  // A lista e o detalhe compartilham o prefixo da chave: um invalidate atualiza os dois.
  const refresh = () => queryClient.invalidateQueries({ queryKey: purchaseOrderEntityQueryKey.list });

  async function saveForecast() {
    setBusy(true);
    try {
      await setPurchaseOrderForecast(uuid, newDate);
      await refresh();
      toaster.success({ title: text.forecastSaved });
      setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !data) {
    return (
      <Flex justify="center" py={16}>
        <Spinner />
      </Flex>
    );
  }

  const canReceive = purchaseOrderHasBalance(data);

  const columns: SimpleTableColumn[] = [
    { key: 'index', header: '#' },
    { key: 'product', header: text.item },
    { key: 'quantity', header: text.quantity, align: 'right' },
    { key: 'unit', header: text.unitPrice, align: 'right' },
    { key: 'total', header: text.total, align: 'right' },
    { key: 'received', header: proto.items.received, align: 'right' },
    { key: 'balance', header: proto.items.balance, align: 'right' },
  ];
  const rows: SimpleTableRow[] = data.items.map((item, index) => {
    const balance = purchaseOrderItemBalance(item);
    return {
      key: item.uuid,
      cells: {
        index: <Text color="fg.muted">{index + 1}</Text>,
        product: (
          <Box minW="220px">
            <Text fontWeight="medium">{item.product ?? item.description}</Text>
            {item.product && (
              <Text fontSize="sm" color="fg.muted">
                {item.description}
              </Text>
            )}
          </Box>
        ),
        quantity: qty(item.quantity),
        unit: formatCurrencyBRL(item.unit_price),
        total: <Text fontWeight="semibold">{formatCurrencyBRL(item.total)}</Text>,
        received: qty(item.received_quantity),
        balance: item.cancelled ? (
          <StatusTag size="sm" label={proto.actions.cancelled} color="semanticNeutral.400" />
        ) : (
          <Text fontWeight="semibold" color={balance > 0 ? 'orange.600' : 'green.700'}>
            {qty(balance)}
          </Text>
        ),
      },
    };
  });
  rows.push({ key: 'total', kind: 'total', cells: { product: text.total, total: formatCurrencyBRL(data.total) } });

  const tabs: { key: OrderTab; label: string }[] = [
    { key: 'items', label: text.itemsTitle },
    { key: 'delivery', label: proto.delivery.tab },
    { key: 'payment', label: proto.payment.tab },
    { key: 'invoices', label: proto.invoices.tab },
  ];

  return (
    <FormContainer
      title={`${text.detailTitle} ${data.code}`}
      subtitle={text.detailSubtitle}
      headerActions={<StatusTag label={data.status_label} color={purchaseOrderStatusColor(data.status)} />}
      footer={
        <>
          <Button title={text.back} variant="secondary" type="button" onClick={() => navigate(PURCHASE_ORDER_ENTITY_PATH)} />
          {canReceive && (
            <Button title={proto.actions.cancelBalance} variant="outline" type="button" onClick={() => setDialog('cancelBalance')} />
          )}
          {canReceive && <Button title={proto.receipt.button} type="button" onClick={() => setDialog('receipt')} />}
        </>
      }
    >
      <RequestTabHeader title={text.generalTitle} />
      <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
        <InputReadOnly label={text.provider} value={data.provider.name} />
        <InputReadOnly label={text.contact} value={data.provider_contact.phone} />
        <InputReadOnly label={text.farm} value={data.farm.description} />
        <InputReadOnly label={text.date} value={formatDate(data.date)} />
        <Box>
          <InputReadOnly
            label={text.forecast}
            value={data.delivery_forecast ? formatDate(data.delivery_forecast) : text.forecastPending}
          />
          <Button
            title={data.delivery_forecast ? text.changeForecast : text.setForecast}
            variant="outline"
            size="sm"
            type="button"
            mt={2}
            onClick={() => {
              setNewDate(data.delivery_forecast?.slice(0, 10) ?? '');
              setDialog('forecast');
            }}
          />
        </Box>
        <InputReadOnly label={text.total} value={formatCurrencyBRL(data.total)} />
        <InputReadOnly
          label={text.categoryMark}
          value={
            data.category
              ? [proto.categories.names[data.category], data.mark ? proto.marks.names[data.mark] : null]
                  .filter(Boolean)
                  .join(' · ')
              : '—'
          }
        />
      </SimpleGrid>
      <Text fontSize="sm" color="fg.muted" mt={2}>
        {text.forecastHint}
      </Text>

      <Box mt={8}>
        <RequestTabHeader title={text.originTitle} />
        {data.request ? (
          <Flex gap={2} align="baseline" wrap="wrap">
            <Text>{text.originFrom}</Text>
            <Link to={`/administrativo/solicitacao/${data.request.uuid}/visualizar?tab=10`}>
              <Text as="span" fontFamily="mono" color="primaryMain" textDecoration="underline">
                {data.request.code}
              </Text>
            </Link>
            <Text color="fg.muted">— {data.request.description}</Text>
          </Flex>
        ) : (
          <RequestTabEmpty>{text.originStandalone}</RequestTabEmpty>
        )}
      </Box>

      <Box mt={8}>
        {/* @ts-ignore - custom variant (mesmo uso da Solicitação) */}
        <Tabs.Root value={tab} onValueChange={(details: { value: string }) => setTab(details.value as OrderTab)} variant="outline">
          {/* @ts-ignore */}
          <Tabs.List>
            {tabs.map((t) => (
              // @ts-ignore
              <Tabs.Trigger key={t.key} value={t.key}>
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {/* @ts-ignore */}
          <Tabs.Content value="items">
            <Box pt={4}>
              <SimpleTable columns={columns} rows={rows} ariaLabel={text.itemsTitle} />
            </Box>
          </Tabs.Content>
          {/* @ts-ignore */}
          <Tabs.Content value="delivery">
            <PrototypeDeliveryPanel delivery={data.delivery} />
          </Tabs.Content>
          {/* @ts-ignore */}
          <Tabs.Content value="payment">
            <PrototypePaymentPanel payment={data.payment} itemsTotal={data.total} />
          </Tabs.Content>
          {/* @ts-ignore */}
          <Tabs.Content value="invoices">
            <PrototypeInvoicesPanel invoices={data.invoices} itemsTotal={data.total} />
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      <CustomDialog
        isOpen={dialog === 'forecast'}
        onClose={() => setDialog(null)}
        title={text.forecastDialogTitle}
        size="sm"
        footer={
          <Flex gap={3}>
            <Button title={text.cancel} variant="secondary" type="button" onClick={() => setDialog(null)} />
            <Button title={text.save} type="button" onClick={saveForecast} loading={busy} disabled={!newDate || busy} />
          </Flex>
        }
      >
        <Input
          label={text.forecast}
          type="date"
          value={newDate}
          onChange={(event) => setNewDate(event.target.value)}
          isRequired
        />
      </CustomDialog>

      <PrototypeReceiptDialog
        isOpen={dialog === 'receipt'}
        onClose={() => setDialog(null)}
        items={data.items.map((item) => ({
          uuid: item.uuid,
          name: item.product ?? item.description,
          balance: purchaseOrderItemBalance(item),
        }))}
        onSubmit={async (payload) => {
          await registerPurchaseOrderReceipt(uuid, payload);
          await refresh();
          setTab('invoices');
        }}
      />
      <PrototypeJustifyDialog
        isOpen={dialog === 'cancelBalance'}
        onClose={() => setDialog(null)}
        title={proto.actions.cancelBalanceTitle}
        description={proto.actions.cancelBalanceDescription}
        onConfirm={async (justify) => {
          await cancelPurchaseOrderBalance(uuid, justify);
          await refresh();
        }}
      />
    </FormContainer>
  );
}
