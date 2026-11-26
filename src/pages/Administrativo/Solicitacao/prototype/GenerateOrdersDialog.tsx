// src/pages/Administrativo/Solicitacao/prototype/GenerateOrdersDialog.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — "Gerar ordens de compra" na Solicitação. Cada linha
// diz quanto de um item vai para qual fornecedor; "Dividir" cria outra linha do
// mesmo item para outro fornecedor. Ao confirmar, nasce uma Ordem por
// fornecedor (`buildGenerateOrdersPayload`, com teste) e a Solicitação continua
// viva, ligada às Ordens. Chama a rota simulada `/prototype/generate-orders`.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import {
  buildGenerateOrdersPayload,
  type GenerateOrdersRow,
  itemCoverage,
  validateGenerateOrders,
} from './generateOrders';
import { generatePrototypeOrders } from './prototypeActions';
import type { PrototypePurchaseOrder } from './prototypeFields';

interface GenerateOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrototypePurchaseOrder;
  onDone: () => Promise<unknown> | void;
}

type Row = GenerateOrdersRow & { key: string };

export function GenerateOrdersDialog({ isOpen, onClose, data, onDone }: GenerateOrdersDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.generateOrders;
  const coverage = useMemo(() => itemCoverage(data.items ?? [], data.generated_orders ?? []), [data]);
  const providers = (data.provider_options ?? []).map((p) => ({ label: p.name, value: p.uuid }));
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRows(
      (data.items ?? [])
        .filter((item) => (coverage[item.uuid]?.pending ?? 0) > 0)
        .map((item) => ({
          key: item.uuid,
          item_uuid: item.uuid,
          quantity: coverage[item.uuid].pending,
          provider_uuid: null,
        }))
    );
  }, [isOpen, data.items, coverage]);

  const error = validateGenerateOrders(rows, coverage);
  const orderCount = buildGenerateOrdersPayload(rows).orders.length;
  const nameOf = (uuid: string) => {
    const item = (data.items ?? []).find((row) => row.uuid === uuid);
    return item?.product?.description ?? item?.description ?? '—';
  };

  function update(key: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function split(row: Row) {
    setRows((current) => {
      const index = current.findIndex((r) => r.key === row.key);
      const copy: Row = { ...row, key: `${row.key}-${Date.now()}`, quantity: 0, provider_uuid: null };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
  }

  async function confirm() {
    setBusy(true);
    try {
      await generatePrototypeOrders(data.uuid, buildGenerateOrdersPayload(rows));
      await onDone();
      toaster.create({ type: 'success', title: text.done.replace('{count}', String(orderCount)) });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={text.dialogTitle}
      size="lg"
      footer={
        <Flex gap={3} align="center">
          {error && error !== 'empty' && (
            <Text fontSize="sm" color="fg.error">
              {text.errors[error]}
            </Text>
          )}
          <Button title={text.cancel} variant="secondary" type="button" onClick={onClose} />
          <Button
            title={text.confirm.replace('{count}', String(orderCount))}
            type="button"
            onClick={confirm}
            loading={busy}
            disabled={!!error || busy}
          />
        </Flex>
      }
    >
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.description}
      </Text>
      {rows.length === 0 ? (
        <Text fontSize="sm">{text.nothingPending}</Text>
      ) : (
        <Flex direction="column" gap={3}>
          {rows.map((row) => (
            <Flex
              key={row.key}
              align="flex-end"
              gap={3}
              px={3}
              py={2}
              borderWidth="1px"
              borderColor="semanticNeutral.200"
              borderRadius="lg"
              wrap="wrap"
            >
              <Box flex="2" minW="160px">
                <Text fontWeight="medium" lineClamp="1">
                  {nameOf(row.item_uuid)}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {text.pending.replace('{value}', (coverage[row.item_uuid]?.pending ?? 0).toLocaleString('pt-BR'))}
                </Text>
              </Box>
              <Box w="120px">
                {/* Inteiro: digitar "200" dá 200 (com casas decimais a máscara enche da direita). */}
                <NumberInput
                  name={`qty_${row.key}`}
                  label={text.quantity}
                  value={row.quantity}
                  onValueChange={(q) => update(row.key, { quantity: q ?? 0 })}
                />
              </Box>
              <Box flex="2" minW="200px">
                <Select
                  name={`provider_${row.key}`}
                  label={text.provider}
                  options={providers}
                  value={providers.find((p) => p.value === row.provider_uuid) ?? null}
                  onChange={(option) => update(row.key, { provider_uuid: option?.value ?? null })}
                  disablePortal
                />
              </Box>
              <Button title={text.split} variant="outline" type="button" onClick={() => split(row)} />
            </Flex>
          ))}
        </Flex>
      )}
    </CustomDialog>
  );
}
