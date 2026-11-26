// src/pages/Administrativo/OrdensCompra/prototype/PurchaseOrderEntityList.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — lista das ORDENS DE COMPRA (entidade própria, uma
// por fornecedor). Visões Abertas / Recebidas / Todas, origem (da Solicitação
// ou avulsa) e busca. O código abre o detalhe; a Solicitação de origem abre a
// Solicitação. Rota `/administrativo/ordens-de-compra/ordens` (menu `adm-sup-oc`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';
import { ViewSelect } from '@/components/ui/ViewSelect';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import {
  countPurchaseOrderViews,
  fetchPurchaseOrders,
  filterPurchaseOrders,
  PURCHASE_ORDER_NEW_PATH,
  purchaseOrderEntityPath,
  purchaseOrderEntityQueryKey,
  type PurchaseOrderEntityView,
  type PurchaseOrderOrigin,
  purchaseOrderStatusColor,
} from './purchaseOrderEntity';

export default function PurchaseOrderEntityList() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.purchaseOrder;
  const [view, setView] = useState<PurchaseOrderEntityView>('abertas');
  const [origin, setOrigin] = useState<PurchaseOrderOrigin>('todas');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data = [], isLoading } = useQuery({
    queryKey: purchaseOrderEntityQueryKey.list,
    queryFn: fetchPurchaseOrders,
  });

  const counts = countPurchaseOrderViews(data);
  const visible = useMemo(() => filterPurchaseOrders(data, { view, origin, search }), [data, view, origin, search]);

  const columns: SimpleTableColumn[] = [
    { key: 'status', header: text.status },
    { key: 'code', header: text.code },
    { key: 'provider', header: text.provider },
    { key: 'request', header: text.request },
    { key: 'farm', header: text.farm },
    { key: 'forecast', header: text.forecast },
    { key: 'total', header: text.total, align: 'right' },
  ];

  const rows: SimpleTableRow[] = visible.map((order) => ({
    key: order.uuid,
    cells: {
      status: <StatusTag size="sm" label={order.status_label} color={purchaseOrderStatusColor(order.status)} />,
      code: (
        <Link to={purchaseOrderEntityPath(order.uuid)}>
          <Text as="span" fontFamily="mono" color="primaryMain" textDecoration="underline">
            {order.code}
          </Text>
        </Link>
      ),
      provider: order.provider.name,
      request: order.request ? (
        <Link to={`/administrativo/solicitacao/${order.request.uuid}/visualizar`}>
          <Text as="span" fontFamily="mono" color="primaryMain" textDecoration="underline">
            {order.request.code}
          </Text>
        </Link>
      ) : (
        <Text as="span" color="fg.muted">
          {text.standalone}
        </Text>
      ),
      farm: order.farm.description,
      forecast: order.delivery_forecast ? formatDate(order.delivery_forecast) : text.forecastPending,
      total: <Text fontWeight="semibold">{formatCurrencyBRL(order.total)}</Text>,
    },
  }));

  return (
    <ContainerGrid>
      <Flex mb={2} justify="space-between" align="flex-start" gap={4} wrap="wrap">
        <PageHeader title={text.listTitle} description={text.listSubtitle} count={visible.length} />
        {/* 26/11: Ordem avulsa, que começa sozinha (sem Solicitação). */}
        <Button title={text.newButton} type="button" onClick={() => navigate(PURCHASE_ORDER_NEW_PATH)} />
      </Flex>
      <Flex gap={3} wrap="wrap" align="center" mb={3}>
        <ViewSelect
          options={(['abertas', 'recebidas', 'todas'] as PurchaseOrderEntityView[]).map((key) => ({
            key,
            label: text.views[key],
            count: counts[key],
          }))}
          value={view}
          onChange={setView}
          ariaLabel={text.viewsAriaLabel}
        />
        <ViewSelect
          options={(['todas', 'solicitacao', 'avulsa'] as PurchaseOrderOrigin[]).map((key) => ({
            key,
            label: text.origins[key],
          }))}
          value={origin}
          onChange={setOrigin}
          ariaLabel={text.originAriaLabel}
        />
      </Flex>
      <ListToolbar search={search} onSearch={setSearch} searchPlaceholder={text.searchPlaceholder} />
      <Box mt={3}>
        {isLoading ? (
          <Flex justify="center" py={10}>
            <Spinner />
          </Flex>
        ) : rows.length ? (
          <SimpleTable columns={columns} rows={rows} ariaLabel={text.listTitle} />
        ) : (
          <Text color="fg.muted" py={6} textAlign="center">
            {text.empty}
          </Text>
        )}
      </Box>
    </ContainerGrid>
  );
}
