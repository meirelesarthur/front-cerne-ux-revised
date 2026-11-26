// src/pages/Administrativo/OrdensCompra/prototype/PurchaseOrderEntityDetail.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — detalhe da ORDEM DE COMPRA: fornecedor único (com
// contato), situação, fazenda, data, PREVISÃO DE ENTREGA da ordem (uma só,
// editável), a Solicitação de origem (vínculo de volta) ou "começou sozinha",
// e os itens com quantidade, valor unitário e total. Rota
// `/administrativo/ordens-de-compra/ordens/:uuid`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
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

import { RequestTabEmpty, RequestTabHeader } from '../../Solicitacao/RequestTabParts';

import {
  fetchPurchaseOrder,
  PURCHASE_ORDER_ENTITY_PATH,
  purchaseOrderEntityQueryKey,
  purchaseOrderStatusColor,
  setPurchaseOrderForecast,
} from './purchaseOrderEntity';

const qty = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function PurchaseOrderEntityDetail() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.purchaseOrder;
  const { uuid = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: purchaseOrderEntityQueryKey.detail(uuid),
    queryFn: () => fetchPurchaseOrder(uuid),
    enabled: !!uuid,
  });

  async function saveForecast() {
    setBusy(true);
    try {
      await setPurchaseOrderForecast(uuid, newDate);
      await queryClient.invalidateQueries({ queryKey: purchaseOrderEntityQueryKey.list });
      toaster.success({ title: text.forecastSaved });
      setEditing(false);
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

  const columns: SimpleTableColumn[] = [
    { key: 'index', header: '#' },
    { key: 'product', header: text.item },
    { key: 'quantity', header: text.quantity, align: 'right' },
    { key: 'unit', header: text.unitPrice, align: 'right' },
    { key: 'total', header: text.total, align: 'right' },
  ];
  const rows: SimpleTableRow[] = data.items.map((item, index) => ({
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
    },
  }));

  return (
    <FormContainer
      title={`${text.detailTitle} ${data.code}`}
      subtitle={text.detailSubtitle}
      headerActions={<StatusTag label={data.status_label} color={purchaseOrderStatusColor(data.status)} />}
      footer={
        <Button
          title={text.back}
          variant="secondary"
          type="button"
          onClick={() => navigate(PURCHASE_ORDER_ENTITY_PATH)}
        />
      }
    >
      <RequestTabHeader title={text.generalTitle} />
      <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
        <InputReadOnly label={text.provider} value={data.provider.name} />
        <InputReadOnly label={text.contact} value={`${data.provider_contact.email} · ${data.provider_contact.phone}`} />
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
              setEditing(true);
            }}
          />
        </Box>
        <InputReadOnly label={text.total} value={formatCurrencyBRL(data.total)} />
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
        <RequestTabHeader title={text.itemsTitle} count={data.items.length} />
        <SimpleTable columns={columns} rows={rows} ariaLabel={text.itemsTitle} />
      </Box>

      <CustomDialog
        isOpen={editing}
        onClose={() => setEditing(false)}
        title={text.forecastDialogTitle}
        size="sm"
        footer={
          <Flex gap={3}>
            <Button title={text.cancel} variant="secondary" type="button" onClick={() => setEditing(false)} />
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
    </FormContainer>
  );
}
