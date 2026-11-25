// src/pages/Administrativo/Solicitacao/prototype/DuplicateOrderDialog.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 3, item 2 do plano — F3) — diálogo "Duplicar ordem de
// compra": lista os itens (todos marcados) e, ao confirmar, abre "Nova ordem"
// já preenchida (`buildDuplicateState`, com teste). Não grava nada: a ordem
// nova é salva pelo formulário de criação de sempre.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Checkbox } from '@/components/ui/checkbox';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import { buildDuplicateState } from './duplicateOrder';

interface DuplicateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: RequestPurchaseData;
}

export function DuplicateOrderDialog({ isOpen, onClose, data }: DuplicateOrderDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.duplicate;
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelected((data.items ?? []).map((item) => item.uuid));
  }, [isOpen, data.items]);

  function toggle(uuid: string) {
    setSelected((current) =>
      current.includes(uuid) ? current.filter((id) => id !== uuid) : [...current, uuid]
    );
  }

  function confirm() {
    const state = buildDuplicateState(data, selected, format(new Date(), 'yyyy-MM-dd'));
    onClose();
    navigate('/administrativo/solicitacao/novo', { state });
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={text.dialogTitle}
      size="md"
      footer={
        <Flex gap={3}>
          <Button title={text.cancel} variant="secondary" type="button" onClick={onClose} />
          <Button title={text.confirm} type="button" onClick={confirm} disabled={selected.length === 0} />
        </Flex>
      }
    >
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.description}
      </Text>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.items}
      </Text>
      <Flex direction="column" gap={2}>
        {(data.items ?? []).map((item) => (
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
            <Checkbox
              checked={selected.includes(item.uuid)}
              onCheckedChange={() => toggle(item.uuid)}
              aria-label={item.product?.description ?? item.description ?? ''}
            />
            <Box flex="1" minW={0}>
              <Text fontWeight="medium" lineClamp="1">
                {item.product?.description ?? item.description ?? '—'}
              </Text>
              {item.quantity !== null && (
                <Text fontSize="sm" color="fg.muted">
                  {item.quantity.toLocaleString('pt-BR')} · {formatCurrencyBRL(item.amount ?? 0)}
                </Text>
              )}
            </Box>
          </Flex>
        ))}
      </Flex>
    </CustomDialog>
  );
}
