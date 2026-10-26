// src/pages/Administrativo/SaldoEstoque/GroupStocksModal.tsx
// -----------------------------------------------------------------------------
// Modal "Agrupar" (Consolidação de Estoque) — TASK-STK-FE-04. Aberto pelo
// botão "Agrupar" do `HeaderTable.tsx` DEPOIS que a prévia (`GET
// /stock-consolidations`) já resolveu no `index.tsx` (não abre com spinner
// interno). Fiel ao legado `group-products_modal`.
//
// Composição do Dialog v3 headless: mirror
// `CadastrosBase/Depreciacao/GerarDepreciacaoModal.tsx` (mesmos `@ts-ignore`
// de tipos ainda incompatíveis da versão instalada; `mutation` recebido por
// prop, instanciada no `index.tsx` — o `onSuccess` fecha o modal e limpa a
// seleção lá). NÃO reusa `TableProvider`/`Table` cheio (sticky header/grid
// settings/paginação são excesso para poucas linhas) — lista simples
// (`VStack`), 1 linha por estoque selecionado da prévia mesclada.
//
// Corpo: legenda "Selecione o produto que irá ser o principal." + um
// `RadioGroup` (de `@/components/ui/radio`, primeiro uso do primitivo no
// projeto) com um `Radio` por linha (valor = `uuid` do estoque destino,
// `correct_stock_uuid`). A `unit` exibida vem MESCLADA no `index.tsx` (a API
// de consolidação não devolve `unit` — ver ficha, Leitura do dev #7).
//
// Rodapé (ADENDO DO DONO): "Cancelar" (esquerda — fecha SEM POST, sem alterar
// a seleção da grid) e "Agrupar" (direita — confirma → `POST
// /stock-consolidations` com o `correct_stock_uuid` REAL escolhido no radio →
// `useRequest` invalida `queryKey.stocks.stocks` → grid recarrega). Ambos os
// rótulos via i18n (PT/EN/ES), nunca literal. "Agrupar" fica `disabled` até
// um radio ser escolhido e `loading` durante o POST.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Dialog, Flex, Portal, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Radio, RadioGroup } from '@/components/ui/radio';

import formatDate from '@/utils/formatDate';

import type { LanguageDate } from '@/@types/language';
import type { StockConsolidationPreviewRow } from '@/@types/v2/Stocks';

import type { useConsolidateStocks } from './useConsolidateStocks';

export interface GroupStocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Linhas da prévia (`GET`), já mescladas com o `unit` da grid (index.tsx). */
  previewRows: StockConsolidationPreviewRow[];
  languageGB: LanguageDate;
  /** Instanciada no `index.tsx` — o `onSuccess` fecha o modal e limpa a seleção. */
  mutation: ReturnType<typeof useConsolidateStocks>;
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function GroupStocksModal({
  isOpen,
  onClose,
  previewRows,
  languageGB,
  mutation,
}: GroupStocksModalProps) {
  const text = languageGB.stocks.stock.consolidation;

  // Estoque destino ("principal") escolhido no radio — `correct_stock_uuid`
  // REAL do POST (a prévia usou `stock_uuids[0]` só como placeholder).
  const [correctUuid, setCorrectUuid] = useState<string | null>(null);

  // Reset a cada (re)abertura — nenhum "principal" pré-selecionado.
  useEffect(() => {
    if (!isOpen) return;
    setCorrectUuid(null);
  }, [isOpen]);

  function handleConfirm() {
    if (!correctUuid) return;

    mutation.mutate({
      stock_uuids: previewRows.map((row) => row.uuid),
      correct_stock_uuid: correctUuid,
    });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) onClose();
      }}
      lazyMount
      unmountOnExit
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.modalTitle}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text fontSize="sm" fontWeight="medium" color="fg.default">
                  {text.modalPrimaryLabel}
                </Text>

                {/* Cabeçalho das colunas (alinhado com as linhas abaixo — a
                    1ª coluna do grid é reservada ao radio). */}
                <SimpleGrid
                  columns={6}
                  gap={2}
                  px={2}
                  color="fg.muted"
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  <Box />
                  <Text>{text.columns.product}</Text>
                  <Text>{text.columns.warehouse}</Text>
                  <Text textAlign="right">{text.columns.quantity}</Text>
                  <Text>{text.columns.lot}</Text>
                  <Text>{text.columns.expirationDate}</Text>
                </SimpleGrid>

                <RadioGroup
                  value={correctUuid}
                  onValueChange={(details: { value: string | null }) =>
                    setCorrectUuid(details.value)
                  }
                >
                  <VStack align="stretch" gap={1}>
                    {previewRows.map((row) => (
                      <SimpleGrid
                        key={row.uuid}
                        columns={6}
                        gap={2}
                        px={2}
                        py={2}
                        alignItems="center"
                        borderWidth="1px"
                        borderColor="borderGrid"
                        borderRadius="md"
                        bg={correctUuid === row.uuid ? 'selectedTextGridColor' : undefined}
                      >
                        <Radio value={row.uuid} aria-label={row.product} />
                        <Text fontSize="sm" fontWeight="medium" lineClamp="1">
                          {row.product}
                        </Text>
                        <Text fontSize="sm" color="fg.muted" lineClamp="1">
                          {row.warehouse}
                        </Text>
                        <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
                          {formatQuantity(row.quantity)} {row.unit}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          {row.lot || row.provider_lot || '—'}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          {row.expiration_date ? formatDate(row.expiration_date) : '—'}
                        </Text>
                      </SimpleGrid>
                    ))}
                  </VStack>
                </RadioGroup>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Flex justify="space-between" width="full">
                <Button
                  title={text.cancelButton}
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                  disabled={mutation.isPending}
                />
                <Button
                  title={text.confirmButton}
                  type="button"
                  onClick={handleConfirm}
                  loading={mutation.isPending}
                  disabled={!correctUuid}
                />
              </Flex>
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
