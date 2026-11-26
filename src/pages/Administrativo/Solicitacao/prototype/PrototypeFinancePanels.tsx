// src/pages/Administrativo/Solicitacao/prototype/PrototypeFinancePanels.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 4 — F4) — abas "Pagamento" (condição, parcelas, despesas e a
// conferência parcelas × total, regra `paymentCheck`) e "Notas fiscais" (NFs
// de entrada ligadas à ordem, com a soma ao lado do total). `payment` e
// `invoices[]` ainda não existem na API (vêm dos dados de demonstração; o
// "Registrar recebimento" acrescenta NFs).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Icon } from '@/components/ui/Icon';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';

import { RequestTabEmpty, RequestTabHeader } from '../RequestTabParts';

import {
  paymentCheck,
  type PurchaseOrderDelivery,
  type PurchaseOrderInvoice,
  type PurchaseOrderPayment,
} from './prototypeFields';

// 26/11: entrega, pagamento e NFs são da ORDEM de compra (fornecedor único);
// os painéis recebem os dados soltos e o total dos itens da ordem.

export function PrototypeDeliveryPanel({ delivery }: { delivery: PurchaseOrderDelivery | null | undefined }) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.delivery;
  return (
    <Box pt={4}>
      <RequestTabHeader title={text.tab} />
      {!delivery ? (
        <RequestTabEmpty>{text.empty}</RequestTabEmpty>
      ) : (
        <>
          <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
            <InputReadOnly label={text.freightType} value={delivery.freight_type === 'CIF' ? text.cif : text.fob} />
            <InputReadOnly label={text.carrier} value={delivery.carrier || '—'} />
            <InputReadOnly label={text.unloading} value={delivery.needs_unloading ? text.yes : text.no} />
          </SimpleGrid>
          <SimpleGrid columns={columnsForm.twoColumns} columnGap={5} rowGap={6} mt={6}>
            <InputReadOnly label={text.place} value={delivery.place} />
            <InputReadOnly label={text.note} value={delivery.note || '—'} />
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}

export function PrototypePaymentPanel({
  payment,
  itemsTotal,
}: {
  payment: PurchaseOrderPayment | null | undefined;
  itemsTotal: number;
}) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.payment;

  if (!payment) {
    return (
      <Box pt={4}>
        <RequestTabHeader title={text.tab} />
        <RequestTabEmpty>{text.empty}</RequestTabEmpty>
      </Box>
    );
  }

  const check = paymentCheck(itemsTotal, payment);
  const columns: SimpleTableColumn[] = [
    { key: 'seq', header: text.seq },
    { key: 'due', header: text.dueDate },
    { key: 'value', header: text.value, align: 'right' },
    { key: 'status', header: text.status },
  ];
  const rows: SimpleTableRow[] = payment.installments.map((p) => ({
    key: String(p.seq),
    cells: {
      seq: `${p.seq}/${payment.installments.length}`,
      due: formatDate(p.due_date),
      value: <Text fontWeight="semibold">{formatCurrencyBRL(p.value)}</Text>,
      status: (
        <StatusTag
          size="sm"
          label={p.status === 'paid' ? text.paid : text.open}
          color={p.status === 'paid' ? 'green.600' : 'semanticNeutral.400'}
        />
      ),
    },
  }));
  rows.push({ key: 'total', kind: 'total', cells: { seq: text.scheduled, value: formatCurrencyBRL(check.scheduled) } });

  const ok = check.diff === 0;
  return (
    <Box pt={4}>
      <RequestTabHeader title={text.tab} />
      <SimpleGrid columns={columnsForm.default} columnGap={5} rowGap={6} mb={6}>
        <InputReadOnly label={text.condition} value={payment.condition} />
        <InputReadOnly label={text.freight} value={formatCurrencyBRL(payment.expenses.freight)} />
        <InputReadOnly label={text.insurance} value={formatCurrencyBRL(payment.expenses.insurance)} />
        <InputReadOnly label={text.other} value={formatCurrencyBRL(payment.expenses.other)} />
      </SimpleGrid>

      <RequestTabHeader title={text.installments} count={payment.installments.length} />
      <SimpleTable columns={columns} rows={rows} ariaLabel={text.installments} />

      <Flex
        mt={4}
        px={4}
        py={3}
        gap={3}
        align="center"
        wrap="wrap"
        borderRadius="lg"
        bg={ok ? 'secondary' : 'feedBack.error'}
        color={ok ? 'green.700' : 'feedBack.errorMain'}
      >
        <Icon name={ok ? 'check-circle' : 'warning'} size="sm" />
        <Text fontWeight="semibold">
          {ok
            ? text.matches
            : (check.diff > 0 ? text.missing : text.over).replace(
                '{value}',
                formatCurrencyBRL(Math.abs(check.diff))
              )}
        </Text>
        <Text fontSize="sm" color="fg.muted" ml="auto">
          {`${text.itemsTotal} ${formatCurrencyBRL(check.expected - check.expenses)} + ${text.expenses.toLowerCase()} ${formatCurrencyBRL(check.expenses)} = ${formatCurrencyBRL(check.expected)}`}
        </Text>
      </Flex>
    </Box>
  );
}

export function PrototypeInvoicesPanel({
  invoices = [],
  itemsTotal,
}: {
  invoices: PurchaseOrderInvoice[] | undefined;
  itemsTotal: number;
}) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.invoices;

  const columns: SimpleTableColumn[] = [
    { key: 'issuer', header: text.issuer },
    { key: 'number', header: text.number },
    { key: 'series', header: text.series },
    { key: 'issued', header: text.issuedAt },
    { key: 'entered', header: text.enteredAt },
    { key: 'value', header: text.value, align: 'right' },
  ];
  const total = invoices.reduce((sum, nf) => sum + nf.value, 0);
  const rows: SimpleTableRow[] = invoices.map((nf) => ({
    key: nf.uuid,
    cells: {
      issuer: <Text fontWeight="medium">{nf.issuer}</Text>,
      number: <Text fontFamily="mono">{nf.number}</Text>,
      series: nf.series,
      issued: formatDate(nf.issued_at),
      entered: formatDate(nf.entered_at),
      value: <Text fontWeight="semibold">{formatCurrencyBRL(nf.value)}</Text>,
    },
  }));
  if (invoices.length) {
    rows.push({ key: 'total', kind: 'total', cells: { issuer: text.total, value: formatCurrencyBRL(total) } });
    rows.push({ key: 'order', cells: { issuer: <Text color="fg.muted">{text.orderTotal}</Text>, value: <Text color="fg.muted">{formatCurrencyBRL(itemsTotal)}</Text> } });
  }

  return (
    <Box pt={4}>
      <RequestTabHeader title={text.tab} count={invoices.length} />
      {invoices.length ? (
        <SimpleTable columns={columns} rows={rows} ariaLabel={text.tab} />
      ) : (
        <RequestTabEmpty>{text.empty}</RequestTabEmpty>
      )}
    </Box>
  );
}
