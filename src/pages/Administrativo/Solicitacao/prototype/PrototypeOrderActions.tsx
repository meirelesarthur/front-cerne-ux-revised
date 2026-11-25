// src/pages/Administrativo/Solicitacao/prototype/PrototypeOrderActions.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 4 — F4) — ações da Ordem de compra no rodapé:
//   - "Registrar recebimento" (compra efetuada): NF + quantidade recebida por
//     item (padrão = saldo); o saldo cai e, sem saldo, a ordem fica recebida;
//   - "Cancelar saldo" (compra efetuada com saldo): justificativa obrigatória;
//   - "Reabrir" (encerrada ou cancelada): justificativa obrigatória.
// "Cancelar item" fica na linha da tabela de itens (`PrototypeItemsTable`),
// com o mesmo diálogo de justificativa (`PrototypeJustifyDialog`).
// As ações chamam rotas que só existem nos dados de demonstração
// (`prototypeActions.ts`) e recarregam a ordem; tudo vai para a linha do tempo.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';
import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import {
  cancelPrototypeBalance,
  registerPrototypeReceipt,
  reopenPrototypeOrder,
} from './prototypeActions';
import { itemTotals, type PrototypePurchaseOrder } from './prototypeFields';

/** Recarrega a ordem depois de uma ação simulada. */
export function useRefreshPurchaseOrder(uuid: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [queryKey.requestPurchases.requestPurchase, uuid] });
}

interface JustifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: (justify: string) => Promise<unknown>;
}

/** Diálogo com justificativa obrigatória (cancelar saldo, cancelar item, reabrir). */
export function PrototypeJustifyDialog({ isOpen, onClose, title, description, onConfirm }: JustifyDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.actions;
  const [justify, setJustify] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setJustify('');
  }, [isOpen]);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(justify.trim());
      toaster.success({ title, description: text.toastDone });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Flex gap={3}>
          <Button title={text.cancel} variant="secondary" type="button" onClick={onClose} />
          <Button title={text.confirm} type="button" onClick={confirm} loading={busy} disabled={!justify.trim() || busy} />
        </Flex>
      }
    >
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {description}
      </Text>
      <Textarea
        name="prototype_justify"
        label={text.justification}
        placeholder={text.justificationPlaceholder}
        value={justify}
        onChange={(event) => setJustify(event.target.value)}
        rows={3}
        isRequired
      />
    </CustomDialog>
  );
}

function ReceiptDialog({
  isOpen,
  onClose,
  data,
  onDone,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: PrototypePurchaseOrder;
  onDone: () => void;
}) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.receipt;
  const pending = data.items.filter((item) => {
    const t = itemTotals(item);
    return t.balance !== null && t.balance > 0;
  });

  const [number, setNumber] = useState('');
  const [series, setSeries] = useState('1');
  const [issuedAt, setIssuedAt] = useState('');
  const [value, setValue] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number | null>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNumber('');
    setSeries('1');
    setIssuedAt(format(new Date(), 'yyyy-MM-dd'));
    setValue(null);
    setQuantities(Object.fromEntries(pending.map((item) => [item.uuid, itemTotals(item).balance])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const anyQuantity = Object.values(quantities).some((q) => (q ?? 0) > 0);

  async function confirm() {
    setBusy(true);
    try {
      await registerPrototypeReceipt(data.uuid, {
        invoice: { number, series, issued_at: issuedAt, value: value ?? 0 },
        items: pending.map((item) => ({ item_uuid: item.uuid, quantity: quantities[item.uuid] ?? 0 })),
      });
      toaster.success({ title: text.toastTitle });
      onDone();
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
        <Flex gap={3}>
          <Button title={text.cancel} variant="secondary" type="button" onClick={onClose} />
          <Button
            title={text.confirm}
            type="button"
            onClick={confirm}
            loading={busy}
            disabled={!number.trim() || !anyQuantity || busy}
          />
        </Flex>
      }
    >
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.description}
      </Text>
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={5}>
        <Input name="nf_number" label={text.invoiceNumber} value={number} onChange={(e) => setNumber(e.target.value)} isRequired />
        <Input name="nf_series" label={text.series} value={series} onChange={(e) => setSeries(e.target.value)} />
        <Input name="nf_issued" label={text.issuedAt} type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        <MaskedInput kind="currency" name="nf_value" label={text.value} value={value} onValueChange={setValue} min={0} />
      </SimpleGrid>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.items}
      </Text>
      <Flex direction="column" gap={2}>
        {pending.map((item) => {
          const t = itemTotals(item);
          return (
            <Flex
              key={item.uuid}
              align="center"
              gap={3}
              px={3}
              py={2}
              borderWidth="1px"
              borderColor="semanticNeutral.200"
              borderRadius="lg"
            >
              <Box flex="1" minW={0}>
                <Text fontWeight="medium" lineClamp="1">
                  {item.product?.description ?? item.description}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {`${text.balance}: ${(t.balance ?? 0).toLocaleString('pt-BR')}`}
                </Text>
              </Box>
              <Box w="140px">
                <NumberInput
                  allowDot
                  name={`receive_${item.uuid}`}
                  aria-label={text.items}
                  value={quantities[item.uuid] ?? null}
                  onValueChange={(q) =>
                    setQuantities((current) => ({ ...current, [item.uuid]: Math.min(q ?? 0, t.balance ?? 0) }))
                  }
                  decimalPlaces={3}
                  min={0}
                />
              </Box>
            </Flex>
          );
        })}
      </Flex>
    </CustomDialog>
  );
}

/** Botões do rodapé (protótipo) e seus diálogos. */
export function PrototypeOrderActions({ data }: { data: PrototypePurchaseOrder }) {
  const { languageGB } = useLanguage();
  const proto = languageGB.requestPurchases.requestPurchase.form.prototype;
  const refresh = useRefreshPurchaseOrder(data.uuid);
  const [open, setOpen] = useState<'receipt' | 'cancelBalance' | 'reopen' | null>(null);

  const hasBalance = data.items.some((item) => (itemTotals(item).balance ?? 0) > 0);
  const canReceive = data.status === requestPurchaseStatus.compraEfetuada && hasBalance;
  const canReopen =
    data.status === requestPurchaseStatus.pedidoFinalizado ||
    data.status === requestPurchaseStatus.pedidoCancelado;

  return (
    <>
      {canReceive && (
        <Button title={proto.actions.cancelBalance} variant="outline" type="button" onClick={() => setOpen('cancelBalance')} />
      )}
      {canReopen && <Button title={proto.actions.reopen} variant="outline" type="button" onClick={() => setOpen('reopen')} />}
      {canReceive && <Button title={proto.receipt.button} type="button" onClick={() => setOpen('receipt')} />}

      <ReceiptDialog isOpen={open === 'receipt'} onClose={() => setOpen(null)} data={data} onDone={refresh} />
      <PrototypeJustifyDialog
        isOpen={open === 'cancelBalance'}
        onClose={() => setOpen(null)}
        title={proto.actions.cancelBalanceTitle}
        description={proto.actions.cancelBalanceDescription}
        onConfirm={async (justify) => {
          await cancelPrototypeBalance(data.uuid, justify);
          await refresh();
        }}
      />
      <PrototypeJustifyDialog
        isOpen={open === 'reopen'}
        onClose={() => setOpen(null)}
        title={proto.actions.reopenTitle}
        description={proto.actions.reopenDescription}
        onConfirm={async (justify) => {
          await reopenPrototypeOrder(data.uuid, justify);
          await refresh();
        }}
      />
    </>
  );
}
