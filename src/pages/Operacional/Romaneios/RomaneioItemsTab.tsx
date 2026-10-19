// src/pages/Operacional/Romaneios/RomaneioItemsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Itens & Totais" do Romaneio (TASK-TRF-FE-03) — sai de stub para
// implementação real: `useFieldArray({control, name:'items'})` + repeater
// (`RomaneioItemRow.tsx`) + bloco "Totais" (`RomaneioTotalsBlock.tsx`).
// Molde estrutural: `src/pages/Invoices/InvoiceItemsTab.tsx` (`fields.map`,
// `key={field.id}`, `handleAdd`/`onRemove` por linha, bloco Totais abaixo do
// repeater NA MESMA aba — contrato de tela §5.4/§5.5, ambos "Aba 1").
//
// GAP-TRF-FE-02 (aprovado) — `useFieldArray` no PAI (aqui), a linha recebe
// `control`/`index`/`watch`/`setValue`/`errors`/`isDisabled` por prop e NÃO
// instancia o próprio `useFieldArray` (contrato §"Estado").
//
// Armadilha #13 — `items` NUNCA vazio: remover a última linha é bloqueado
// com a mensagem literal do legado (sem abrir o diálogo de confirmação da
// linha — a ação é simplesmente recusada). "Adicionar" com QUALQUER linha
// incompleta (falta `product_uuid`/`measurement_uuid`/`quantity`/`amount`) é
// bloqueado com a outra mensagem literal.
//
// Armadilha #14 (FC-ITEM-13) — quando `is_from_charge || is_from_weighing`,
// o repeater fica SOMENTE-LEITURA (sem adicionar/remover, campos
// `isDisabled`) — o banner explicativo já é renderizado pelo formulário
// (`TransferGuardBanners.tsx`, TASK-TRF-FE-02), não duplicado aqui.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { TransferForm, TransferItemForm } from '@/@types/v2/Transfers';

import { RomaneioItemRow } from './RomaneioItemRow';
import { RomaneioTotalsBlock } from './RomaneioTotalsBlock';
import { createEmptyTransferItem } from './useRomaneios';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface RomaneioItemsTabProps {
  control: Control<TransferForm>;
  errors: FieldErrors<TransferForm>;
  watch: UseFormWatch<TransferForm>;
  setValue: UseFormSetValue<TransferForm>;
  isDisabled: boolean;
  /** GAP-TRF-FE-05/FC-ITEM-13 — `is_from_charge || is_from_weighing` do
   *  registro carregado. Trava só o REPEATER (adicionar/remover/campos das
   *  linhas), não a aba/tela inteira — o banner de origem já aparece no
   *  topo do formulário (`TransferGuardBanners.tsx`). */
  isItemsLocked?: boolean;
}

function isRowComplete(item: TransferItemForm | undefined): boolean {
  if (!item) return false;
  return (
    !!item.product_uuid?.value &&
    !!item.measurement_uuid?.value &&
    item.quantity !== null &&
    item.quantity !== undefined &&
    item.quantity > 0 &&
    item.amount !== null &&
    item.amount !== undefined &&
    item.amount >= 0
  );
}

export function RomaneioItemsTab({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  isItemsLocked = false,
}: RomaneioItemsTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.transfers.transfer.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isRepeaterDisabled = isDisabled || isItemsLocked;

  const arrayError = errors.items?.message as string | undefined;

  function handleAdd() {
    const currentItems = watch('items') ?? [];
    const hasIncompleteRow = currentItems.some((item) => !isRowComplete(item));

    if (hasIncompleteRow) {
      toaster.error({
        title: text.itemRow.addButton,
        description: text.itemRow.addIncompleteError,
      });
      return;
    }

    append(createEmptyTransferItem());
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) {
      // Armadilha #13 — nunca zero itens; recusa direto (sem diálogo),
      // mensagem literal do legado.
      toaster.error({
        title: text.itemRow.removeButton,
        description: text.itemRow.removeLastError,
      });
      return;
    }
    remove(index);
  }

  return (
    <Box pt={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.sections.items}
      </Text>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      <Flex direction="column" gap={4} mb={4}>
        {fields.map((field, index) => (
          <RomaneioItemRow
            key={field.id}
            index={index}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isDisabled={isRepeaterDisabled}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </Flex>

      <Button
        title={text.itemRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isRepeaterDisabled}
      />

      <RomaneioTotalsBlock
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
        isDisabled={isDisabled}
      />
    </Box>
  );
}
