// src/pages/Operacional/Pedidos/OrderItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens do formulário de CRIAÇÃO/EDIÇÃO de Pedido (Order —
// Operacional / Vendas, F-051, 97-Esteiras/043, PED-FE-04). Consumido por
// `CreateOrUpdateOrder.tsx` (campo `items` de `OrderForm`, `useFieldArray` no
// PAI — DEC-PED-FE-ITENS, contrato-tela §6).
//
// Mirror ESTRUTURAL de `Budget/BudgetItemsEditor.tsx` (`useFieldArray` vive
// no formulário PAI — `control`/`fields`/`append`/`remove`/`errors` chegam
// via props) + gate de completude/remoção de `Romaneios/RomaneioItemsTab.tsx`
// (IG-008/IG-009: "Adicionar item" recusa com toast se alguma linha estiver
// incompleta; remover a ÚLTIMA linha recusa direto, sem diálogo).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import type { LanguageDate } from '@/@types/language';
import type { OrderForm } from '@/@types/v2/Orders';

import { OrderItemRow, createEmptyOrderItem, isOrderItemRowComplete } from './OrderItemRow';

export interface OrderItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`OrderForm`, PED-FE-03). */
  control: Control<OrderForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<OrderForm, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<OrderForm, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<OrderForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

export function OrderItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
}: OrderItemsEditorProps) {
  const text = languageGB.orders.order;
  const itemText = text.form.fields.item;

  const arrayError = (errors as any)?.items?.message as string | undefined;

  // Watch PRÓPRIO (mirror `BudgetItemsEditor`'s `useWatch('items')` para o
  // grandTotal) — só para o gate de completude de IG-008, não duplica o
  // rodapé de totais (`OrderFooterTotals`, PED-FE-03, watch independente).
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];

  // IG-008 — "Adicionar item" só clona se NENHUMA linha existente estiver
  // incompleta (mirror `RomaneioItemsTab.handleAdd`, `LANG.var_preencher_todos_campos`).
  function handleAdd() {
    const hasIncompleteRow = watchedItems.some((item) => !isOrderItemRowComplete(item));

    if (hasIncompleteRow) {
      toaster.error({ title: itemText.addItem, description: itemText.addIncompleteError });
      return;
    }

    append(createEmptyOrderItem());
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {itemText.sectionTitle}
        </Text>
      </Flex>

      {arrayError && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || itemText.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <OrderItemRow
              key={field.id}
              control={control}
              index={index}
              remove={remove}
              isOnlyRow={fields.length <= 1}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={itemText.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default OrderItemsEditor;
