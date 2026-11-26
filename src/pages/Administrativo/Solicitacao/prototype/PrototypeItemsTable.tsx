// src/pages/Administrativo/Solicitacao/prototype/PrototypeItemsTable.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 2, item 1 do plano — F1) — Itens da SOLICITAÇÃO na
// VISUALIZAÇÃO, com Qtde, Vlr. unitário, Vlr. total e, desde 26/11, quanto de
// cada item já está EM ORDEM e quanto está SEM ORDEM (`itemCoverage`, com
// teste). Recebido, Saldo, "Cancelar item" e Previsão saíram daqui: são da
// ORDEM de compra (fornecedor único, tela própria). Edição continua no
// `RequestItemRow`.
// -----------------------------------------------------------------------------

import { Box, Text } from '@chakra-ui/react';

import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { RequestTabEmpty, RequestTabHeader } from '../RequestTabParts';

import { itemCoverage } from './generateOrders';
import { itemTotals, type PrototypePurchaseOrder } from './prototypeFields';

const qty = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export function PrototypeItemsTable({ data }: { data: PrototypePurchaseOrder }) {
  const { languageGB } = useLanguage();
  const form = languageGB.requestPurchases.requestPurchase.form;
  const text = form.prototype.items;
  const linksText = form.prototype.links;
  const coverage = itemCoverage(data.items ?? [], data.generated_orders ?? []);

  const columns: SimpleTableColumn[] = [
    { key: 'index', header: '#' },
    { key: 'product', header: text.product },
    { key: 'quantity', header: text.quantity, align: 'right' },
    { key: 'unit', header: text.unitPrice, align: 'right' },
    { key: 'total', header: text.total, align: 'right' },
    { key: 'ordered', header: linksText.ordered, align: 'right' },
    { key: 'pending', header: linksText.pending, align: 'right' },
  ];

  let requestTotal = 0;
  const rows: SimpleTableRow[] = data.items.map((item, index) => {
    const t = itemTotals(item);
    const c = coverage[item.uuid];
    requestTotal += t.total;
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
        ordered: qty(t.quantity === null ? null : (c?.ordered ?? 0)),
        pending:
          t.quantity === null ? (
            '—'
          ) : (
            <Text fontWeight="semibold" color={(c?.pending ?? 0) > 0 ? 'orange.600' : 'green.700'}>
              {qty(c?.pending ?? 0)}
            </Text>
          ),
      },
    };
  });

  if (rows.length) {
    rows.push({
      key: 'total',
      kind: 'total',
      cells: {
        product: text.orderTotal,
        total: formatCurrencyBRL(requestTotal),
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
    </Box>
  );
}
