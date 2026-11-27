// src/pages/Administrativo/Solicitacao/prototype/QuotationMapDialog.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026) — "Mapa de cotações" em pop-up, no lugar do Excel.
//   - Resumo: melhor total (quem cotou todos os itens), "melhor de cada item"
//     (total, quantos fornecedores — uma Ordem por fornecedor — e a economia) e
//     quantas cotações chegaram.
//   - Tabela item × fornecedor: preço unitário e total da linha; o menor preço
//     do item em verde com a marca "Menor"; "—" quando o fornecedor não cotou.
//     Fornecedores do mais barato no geral para o mais caro (`buildQuotationMap`).
//   - Embaixo: subtotal, frete, desconto, total, prazo de entrega e condição.
// Dados: `/request-purchases/{uuid}/prototype/quotation-map` (demonstração).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';

import { useLanguage } from '@/hooks/useLanguage';

import api from '@/services/api';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { buildQuotationMap, type QuotationMapData, type QuotationMapSupplier } from './quotationMap';

const qty = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

async function fetchQuotationMap(uuid: string): Promise<QuotationMapData> {
  const { data } = await api.V2.get<{ data: QuotationMapData }>(`/request-purchases/${uuid}/prototype/quotation-map`);
  return data.data;
}

function SummaryCard({ label, value, detail, highlight }: { label: string; value: string; detail?: string; highlight?: boolean }) {
  return (
    <Box
      px={4}
      py={3}
      borderWidth="1px"
      borderColor={highlight ? 'green.600' : 'semanticNeutral.200'}
      borderRadius="xl"
      bg="cardBG"
    >
      <Text fontSize="xs" color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="0.05em">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={highlight ? 'green.700' : 'strongText'}>
        {value}
      </Text>
      {detail && (
        <Text fontSize="sm" color="fg.muted">
          {detail}
        </Text>
      )}
    </Box>
  );
}

interface QuotationMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestPurchaseUuid: string;
  requestCode?: string | null;
}

export function QuotationMapDialog({ isOpen, onClose, requestPurchaseUuid, requestCode }: QuotationMapDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.quotationMap;

  const { data, isLoading } = useQuery({
    queryKey: ['prototype-quotation-map', requestPurchaseUuid],
    queryFn: () => fetchQuotationMap(requestPurchaseUuid),
    enabled: isOpen,
  });

  const map = data ? buildQuotationMap(data) : null;
  const received = map ? map.suppliers.filter((s) => s.received).length : 0;

  const columns: SimpleTableColumn[] = map
    ? [
        { key: 'item', header: text.item },
        ...map.suppliers.map((s, index) => ({
          key: s.uuid,
          align: 'right' as const,
          header: (
            <Flex direction="column" align="flex-end" gap="2px">
              <Text as="span" fontWeight="semibold" textTransform="none" lineClamp="1">
                {s.name}
              </Text>
              {!s.received ? (
                <StatusTag size="sm" label={text.waiting} color="semanticNeutral.400" />
              ) : index === 0 && s.complete ? (
                <StatusTag size="sm" label={text.bestTotal} color="green.600" />
              ) : !s.complete ? (
                <StatusTag
                  size="sm"
                  label={text.partial.replace('{count}', String(s.quotedCount)).replace('{total}', String(map.items.length))}
                  color="orange.600"
                />
              ) : null}
            </Flex>
          ),
        })),
      ]
    : [];

  const rows: SimpleTableRow[] = map
    ? map.items.map((item, i) => ({
        key: item.uuid,
        cells: {
          item: (
            <Box minW="200px">
              <Text fontWeight="medium">{item.product ?? item.description}</Text>
              <Text fontSize="sm" color="fg.muted">
                {text.quantity.replace('{value}', qty(item.quantity))}
              </Text>
            </Box>
          ),
          ...Object.fromEntries(
            map.suppliers.map((s) => {
              const price = s.received ? s.prices[i] : null;
              if (price === null || price === undefined) return [s.uuid, <Text color="fg.muted">—</Text>];
              const isCheapest = map.cheapest[item.uuid]?.supplierUuid === s.uuid;
              return [
                s.uuid,
                <Flex direction="column" align="flex-end">
                  <Flex align="center" gap={2}>
                    {isCheapest && <StatusTag size="sm" label={text.cheapest} color="green.600" />}
                    <Text fontWeight="semibold" color={isCheapest ? 'green.700' : 'strongText'}>
                      {formatCurrencyBRL(price)}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="fg.muted">
                    {formatCurrencyBRL(price * item.quantity)}
                  </Text>
                </Flex>,
              ];
            })
          ),
        },
      }))
    : [];

  if (map) {
    const suppliers = map.suppliers;
    const line = (key: string, label: string, value: (s: QuotationMapSupplier) => string, total = false) =>
      rows.push({
        key,
        kind: total ? 'total' : undefined,
        cells: {
          item: label,
          ...Object.fromEntries(suppliers.map((s) => [s.uuid, s.received ? value(s) : '—'])),
        },
      });
    line('subtotal', text.subtotal, (s) => formatCurrencyBRL(s.subtotal));
    line('freight', text.freight, (s) => formatCurrencyBRL(s.freight));
    line('discount', text.discount, (s) => (s.discount ? `− ${formatCurrencyBRL(s.discount)}` : formatCurrencyBRL(0)));
    line('total', text.total, (s) => formatCurrencyBRL(s.total), true);
    line('delivery', text.delivery, (s) => (s.delivery_days !== null ? text.days.replace('{value}', String(s.delivery_days)) : '—'));
    line('payment', text.payment, (s) => s.payment_condition ?? '—');
  }

  const best = map?.bestComplete;
  const byItem = map?.bestByItem;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={requestCode ? `${text.title} · ${requestCode}` : text.title}
      subtitle={text.subtitle}
      size="form"
      footer={<Button title={text.close} variant="secondary" type="button" onClick={onClose} />}
    >
      {isLoading || !map ? (
        <Flex justify="center" py={10}>
          <Spinner />
        </Flex>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mb={5}>
            <SummaryCard
              label={text.bestTotal}
              value={best ? formatCurrencyBRL(best.total) : '—'}
              detail={best ? `${best.name}${best.delivery_days !== null ? ` · ${text.days.replace('{value}', String(best.delivery_days))}` : ''}${best.payment_condition ? ` · ${best.payment_condition}` : ''}` : text.noneComplete}
              highlight
            />
            <SummaryCard
              label={text.bestByItem}
              value={byItem && byItem.complete ? formatCurrencyBRL(byItem.total) : '—'}
              detail={
                byItem && byItem.complete
                  ? text.bestByItemDetail
                      .replace('{count}', String(byItem.suppliers))
                      .replace('{saving}', formatCurrencyBRL(Math.max(0, byItem.saving ?? 0)))
                  : text.someItemMissing
              }
            />
            <SummaryCard
              label={text.answers}
              value={`${received} / ${map.suppliers.length}`}
              detail={text.answersDetail}
            />
          </SimpleGrid>
          <Box overflowX="auto">
            <SimpleTable columns={columns} rows={rows} ariaLabel={text.title} />
          </Box>
          <Text fontSize="sm" color="fg.muted" mt={3}>
            {text.footnote}
          </Text>
        </>
      )}
    </CustomDialog>
  );
}
