// src/pages/Administrativo/Solicitacao/prototype/PrototypeGeneratedOrders.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — na aba Vínculos da Solicitação: as Ordens de compra
// que ela gerou (uma por fornecedor) e quanto de cada item já está em ordem
// (`itemCoverage`, com teste). A Solicitação continua viva e ligada às Ordens.
// -----------------------------------------------------------------------------

import { Box, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { RequestTabEmpty, RequestTabHeader } from '../RequestTabParts';

import { purchaseOrderEntityPath } from '../../OrdensCompra/prototype/purchaseOrderEntity';

import { itemCoverage } from './generateOrders';
import type { PrototypePurchaseOrder } from './prototypeFields';

const qty = (value: number) => value.toLocaleString('pt-BR');

export function PrototypeGeneratedOrders({ data }: { data: PrototypePurchaseOrder }) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.links;
  const orders = data.generated_orders ?? [];
  const coverage = itemCoverage(data.items ?? [], orders);

  const orderColumns: SimpleTableColumn[] = [
    { key: 'code', header: text.code },
    { key: 'provider', header: text.provider },
    { key: 'items', header: text.itemsCount },
    { key: 'forecast', header: text.forecast },
    { key: 'status', header: text.status },
  ];
  const orderRows: SimpleTableRow[] = orders.map((order) => ({
    key: order.uuid,
    cells: {
      code: (
        <Link to={purchaseOrderEntityPath(order.uuid)}>
          <Text as="span" fontFamily="mono" color="primaryMain" textDecoration="underline">
            {order.code}
          </Text>
        </Link>
      ),
      provider: order.provider.name,
      items: order.items.length,
      forecast: order.delivery_forecast ? formatDate(order.delivery_forecast) : text.forecastPending,
      status: order.status_label,
    },
  }));

  const coverageColumns: SimpleTableColumn[] = [
    { key: 'item', header: text.item },
    { key: 'requested', header: text.requested },
    { key: 'ordered', header: text.ordered },
    { key: 'pending', header: text.pending },
  ];
  const coverageRows: SimpleTableRow[] = (data.items ?? [])
    .filter((item) => (coverage[item.uuid]?.requested ?? 0) > 0)
    .map((item) => ({
      key: item.uuid,
      cells: {
        item: item.product?.description ?? item.description ?? '—',
        requested: qty(coverage[item.uuid].requested),
        ordered: qty(coverage[item.uuid].ordered),
        pending: (
          <Text as="span" fontWeight={coverage[item.uuid].pending > 0 ? 'semibold' : undefined}>
            {qty(coverage[item.uuid].pending)}
          </Text>
        ),
      },
    }));

  return (
    <>
      <Box mt={6}>
        <RequestTabHeader title={text.ordersTitle} count={orders.length} />
        {orders.length ? (
          <SimpleTable columns={orderColumns} rows={orderRows} ariaLabel={text.ordersTitle} />
        ) : (
          <RequestTabEmpty>{text.noOrders}</RequestTabEmpty>
        )}
      </Box>
      {orders.length > 0 && (
        <Box mt={6}>
          <RequestTabHeader title={text.coverageTitle} />
          <SimpleTable columns={coverageColumns} rows={coverageRows} ariaLabel={text.coverageTitle} />
        </Box>
      )}
    </>
  );
}
