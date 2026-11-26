// src/pages/Administrativo/Solicitacao/prototype/PrototypeItemsTable.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 2, item 1 do plano — F1) — Itens da Ordem de compra na
// VISUALIZAÇÃO, com Qtde, Vlr. unitário, Vlr. total, Recebido e Saldo, e o
// total da ordem no rodapé. A previsão de entrega é da ordem (fornecedor
// único), não do item: fica no topo (`PurchaseOrderProcessBar`), 26/11/2026. `unit_price` e `received_quantity`
// ainda não existem na API (vêm dos dados de demonstração); a conta está em
// `itemTotals` (`prototypeFields.ts`, com teste). Edição continua no
// `RequestItemRow`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Text } from '@chakra-ui/react';

import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { RequestTabEmpty, RequestTabHeader } from '../RequestTabParts';

import { cancelPrototypeItem } from './prototypeActions';
import { itemTotals, type PrototypePurchaseOrder } from './prototypeFields';
import { PrototypeJustifyDialog, useRefreshPurchaseOrder } from './PrototypeOrderActions';

const qty = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export function PrototypeItemsTable({ data }: { data: PrototypePurchaseOrder }) {
  const { languageGB } = useLanguage();
  const form = languageGB.requestPurchases.requestPurchase.form;
  const text = form.prototype.items;
  const actionsText = form.prototype.actions;
  const refresh = useRefreshPurchaseOrder(data.uuid);
  const [cancelUuid, setCancelUuid] = useState<string | null>(null);

  // Lote 4: "Cancelar item" enquanto a compra está aguardando ou efetuada.
  const canCancelItems =
    data.status === requestPurchaseStatus.aguardandoCompra ||
    data.status === requestPurchaseStatus.compraEfetuada;

  const columns: SimpleTableColumn[] = [
    { key: 'index', header: '#' },
    { key: 'product', header: text.product },
    { key: 'quantity', header: text.quantity, align: 'right' },
    { key: 'unit', header: text.unitPrice, align: 'right' },
    { key: 'total', header: text.total, align: 'right' },
    { key: 'received', header: text.received, align: 'right' },
    { key: 'balance', header: text.balance, align: 'right' },
    // 26/11: sem "Previsão" por item — a previsão é da ordem (fornecedor único), no topo.
    ...(canCancelItems ? [{ key: 'actions', header: '', align: 'right' as const }] : []),
  ];

  let orderTotal = 0;
  const rows: SimpleTableRow[] = data.items.map((item, index) => {
    const t = itemTotals(item);
    orderTotal += t.total;
    return {
      key: item.uuid,
      cells: {
        index: (
          <Text color="fg.muted" fontWeight="medium">
            {index + 1}
          </Text>
        ),
        product: (
          <Box minW="220px">
            <Text fontWeight="medium" lineClamp="1">
              {item.product?.description ?? item.description ?? '—'}
            </Text>
            {item.product && item.description && (
              <Text fontSize="sm" color="fg.muted" lineClamp="1">
                {item.description}
              </Text>
            )}
          </Box>
        ),
        quantity: qty(t.quantity),
        unit: formatCurrencyBRL(t.unit),
        total: <Text fontWeight="semibold">{formatCurrencyBRL(t.total)}</Text>,
        received: qty(t.quantity === null ? null : t.received),
        balance: t.cancelled ? (
          <StatusTag size="sm" label={actionsText.cancelled} color="semanticNeutral.400" />
        ) : (
          <Text
            fontWeight="semibold"
            color={t.balance === null ? 'fg.muted' : t.balance > 0 ? 'orange.600' : 'green.700'}
          >
            {qty(t.balance)}
          </Text>
        ),
        actions:
          canCancelItems && !t.cancelled && (t.balance ?? 0) > 0 ? (
            <Box
              as="button"
              {...({ type: 'button' } as Record<string, string>)}
              onClick={() => setCancelUuid(item.uuid)}
              fontSize="sm"
              fontWeight="semibold"
              color="feedBack.errorMain"
              whiteSpace="nowrap"
              _hover={{ textDecoration: 'underline' }}
            >
              {actionsText.cancelItem}
            </Box>
          ) : null,
      },
    };
  });

  if (rows.length) {
    rows.push({
      key: 'total',
      kind: 'total',
      cells: {
        product: text.orderTotal,
        total: formatCurrencyBRL(orderTotal),
      },
    });
  }

  return (
    <Box pt={4}>
      <RequestTabHeader title={form.tabs.items} count={data.items.length} />
      {data.items.length === 0 ? (
        <RequestTabEmpty>{form.itemsSection.emptyLabel}</RequestTabEmpty>
      ) : (
        <SimpleTable columns={columns} rows={rows} ariaLabel={form.tabs.items} />
      )}

      <PrototypeJustifyDialog
        isOpen={cancelUuid !== null}
        onClose={() => setCancelUuid(null)}
        title={actionsText.cancelItemTitle}
        description={actionsText.cancelItemDescription}
        onConfirm={async (justify) => {
          if (!cancelUuid) return;
          await cancelPrototypeItem(data.uuid, cancelUuid, justify);
          await refresh();
        }}
      />
    </Box>
  );
}
