// src/pages/Administrativo/Autorizacao/RequestAuthorizationItemsSection.tsx
// -----------------------------------------------------------------------------
// Bloco de itens da Autorização (execução 081, T-081-FE-06; legado `_forms.blade.php:
// 196-272` "Itens para Aprovação" e `second.blade.php:80-131` "Produtos/Serviços").
//
// - Aprovação: checkbox por item (marcado por padrão, controlado pelo container) e,
//   só em P/S/U/M com cotação, o lápis que edita a quantidade (recalcula as cotações,
//   T-081-API-02). Os itens desmarcados ficam fora da compra (reprovação parcial).
// - Ciência (`readOnly`): lista somente leitura, sem seleção e sem lápis.
// Cabeçalhos por tipo (legado): item = Produto (P), Serviço (S), Descrição do serviço
// (D) ou Descrição; valor = Valor (R/A/C/B/E), Quantidade de Diárias (D) ou Qtd.
// "Descrição" extra só no tipo P; "Observação" quando a solicitação tem observação.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, Table, Text } from '@chakra-ui/react';
import { FiEdit } from 'react-icons/fi';

import { IconButtonTable } from '@/components/IconButtonTable';
import { Checkbox } from '@/components/ui/checkbox';

import { useLanguage } from '@/hooks/useLanguage';

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import type { RequestItemRow } from '@/@types/v2/RequestPurchases';

import { canEditItemQuantity } from './authorizationRules';
import { EditRequestAuthorizationItemDialog } from './EditRequestAuthorizationItemDialog';

const NO_DATA = '—';

/** Tipos cujo valor do item é monetário (`amount`) em vez de quantidade. */
const AMOUNT_TYPES: readonly string[] = [
  requestPurchaseType.reembolso,
  requestPurchaseType.adiantamento,
  requestPurchaseType.empreitada,
  requestPurchaseType.frete,
  requestPurchaseType.despesaFixa,
];

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return NO_DATA;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatCurrencyBRL(value: number | null): string {
  if (value === null || value === undefined) return NO_DATA;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface RequestAuthorizationItemsSectionProps {
  /** `uuid` da Autorização — necessário para compor o endpoint de edição de item. */
  authorizationUuid: string;
  /** Tipo da solicitação (`P`, `S`, `D`...) — decide cabeçalhos, valor e lápis. */
  type: string;
  /** Quantidade de cotações (o lápis só existe com cotação). */
  quotationsCount: number;
  items: RequestItemRow[];
  /** Mostra a coluna "Observação" (legado: só quando a solicitação tem observação). */
  showObservation?: boolean;
  selectedItemUuids: string[];
  onToggleItem: (itemUuid: string) => void;
  /** Ciência: só leitura (sem seleção e sem lápis). */
  readOnly?: boolean;
  /** Permissão de escrita (`request-authorization_edit`) para o lápis. */
  canEdit?: boolean;
}

export function RequestAuthorizationItemsSection({
  authorizationUuid,
  type,
  quotationsCount,
  items,
  showObservation = false,
  selectedItemUuids,
  onToggleItem,
  readOnly = false,
  canEdit = true,
}: RequestAuthorizationItemsSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.items;

  const [editingItem, setEditingItem] = useState<RequestItemRow | null>(null);

  const showSelection = !readOnly;
  const showActions = !readOnly && canEdit && canEditItemQuantity(type, quotationsCount);
  const isProduct = type === requestPurchaseType.produto;
  const isDaily = type === requestPurchaseType.diaria;
  const usesAmount = AMOUNT_TYPES.includes(type);

  const itemHeader = isProduct
    ? text.table.product
    : type === requestPurchaseType.servico
      ? text.table.service
      : isDaily
        ? text.table.serviceDescription
        : text.table.description;
  const valueHeader = usesAmount
    ? text.table.value
    : isDaily
      ? text.table.dailyQuantity
      : text.table.quantity;

  function itemLabel(item: RequestItemRow): string {
    if (item.product?.description) return item.product.description;
    if (isDaily) return item.service_description ?? NO_DATA;
    return item.description ?? NO_DATA;
  }

  function itemValue(item: RequestItemRow): string {
    if (usesAmount) return formatCurrencyBRL(item.amount);
    if (isDaily) return item.daily_quantity !== null ? String(item.daily_quantity) : NO_DATA;
    return formatNumber(item.quantity);
  }

  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.default"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {readOnly ? text.readOnlyTitle : text.title}
      </Text>

      {!readOnly && (
        <Box
          role="note"
          mb={4}
          px={3}
          py={2}
          borderRadius="md"
          bg="orange.subtle"
          color="orange.fg"
          fontSize="sm"
        >
          {text.hint}
        </Box>
      )}

      {items.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {text.empty}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Text fontSize="xs" color="fg.muted" mb={2}>
            {text.recordsCount} {items.length}
          </Text>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                {showSelection && <Table.ColumnHeader>{text.table.select}</Table.ColumnHeader>}
                <Table.ColumnHeader>{itemHeader}</Table.ColumnHeader>
                <Table.ColumnHeader>{valueHeader}</Table.ColumnHeader>
                {isProduct && <Table.ColumnHeader>{text.table.description}</Table.ColumnHeader>}
                {showObservation && (
                  <Table.ColumnHeader>{text.table.observation}</Table.ColumnHeader>
                )}
                {showActions && <Table.ColumnHeader>{text.table.actions}</Table.ColumnHeader>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.uuid}>
                  {showSelection && (
                    <Table.Cell>
                      <Checkbox
                        checked={selectedItemUuids.includes(item.uuid)}
                        onCheckedChange={() => onToggleItem(item.uuid)}
                        aria-label={text.table.select}
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell>{itemLabel(item)}</Table.Cell>
                  <Table.Cell>{itemValue(item)}</Table.Cell>
                  {isProduct && <Table.Cell>{item.description ?? NO_DATA}</Table.Cell>}
                  {showObservation && <Table.Cell>{item.observation ?? NO_DATA}</Table.Cell>}
                  {showActions && (
                    <Table.Cell>
                      <Flex>
                        <IconButtonTable
                          aria-label={text.editButton}
                          mensegerTooltip={text.editButton}
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          <Icon as={FiEdit} />
                        </IconButtonTable>
                      </Flex>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <EditRequestAuthorizationItemDialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        authorizationUuid={authorizationUuid}
        item={editingItem}
      />
    </Box>
  );
}
