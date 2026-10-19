// src/pages/Operacional/Vendas/SaleItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens do formulário de CRIAÇÃO/EDIÇÃO de Venda COMERCIAL (Sale —
// venda de PRODUTOS, Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-04,
// `S-TAB-001`/`S-LIST-002`). Consumido por `CreateOrUpdateSale.tsx` (campo
// `items` de `SaleForm`, `useFieldArray` vive no formulário PAI).
//
// Mirror ESTRUTURAL de `Operacional/Pedidos/OrderItemsEditor.tsx` — gate de
// completude (IG010, "Adicionar item" recusa com toast se a última linha
// estiver incompleta) + add/remove habilitados nos DOIS modos (PARADA-3,
// `D012`/`IG011` — divergência deliberada do legado, que só permitia
// adicionar na criação avulsa e não oferecia remover).
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
import type { SaleForm } from '@/@types/v2/Sales';

import { createEmptySaleItem, isSaleItemRowComplete, SaleItemRow } from './SaleItemRow';

export interface SaleItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`SaleForm`, SALE-FE-COM-03). */
  control: Control<SaleForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<SaleForm, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<SaleForm, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<SaleForm>;
  /** Modo EDIÇÃO do form pai (`!!uuid` da rota) — PARADA-4, repassado à
   *  linha para o gate de readonly do Produto (só linha EXISTENTE). */
  isEditingSale: boolean;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

export function SaleItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  isEditingSale,
  languageGB,
  disabled = false,
}: SaleItemsEditorProps) {
  const text = languageGB.sales.sale;
  const itemText = text.form.fields.item;

  const arrayError = (errors as any)?.items?.message as string | undefined;

  // Watch PRÓPRIO — só para o gate de completude de IG010, não duplica o
  // rodapé de totais (`SaleTotalsBlock`, `useWatch` independente).
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];

  // IG010 — "Adicionar item" só clona se NENHUMA linha existente estiver
  // incompleta (mirror `OrderItemsEditor.handleAdd`).
  function handleAdd() {
    const hasIncompleteRow = watchedItems.some((item) => !isSaleItemRowComplete(item));

    if (hasIncompleteRow) {
      toaster.error({ title: itemText.addItem, description: itemText.addIncompleteError });
      return;
    }

    append(createEmptySaleItem());
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
            <SaleItemRow
              key={field.id}
              control={control}
              index={index}
              remove={remove}
              isOnlyRow={fields.length <= 1}
              isEditingSale={isEditingSale}
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

export default SaleItemsEditor;
