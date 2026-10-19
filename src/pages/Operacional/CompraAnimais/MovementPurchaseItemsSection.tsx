// src/pages/Operacional/CompraAnimais/MovementPurchaseItemsSection.tsx
// -----------------------------------------------------------------------------
// Seção "Itens" da Compra de Animais — TASK-CP-06, contrato de frontend §5
// (SUBREG-ITEMS). Mirror EXATO `MovementSaleItemsSection.tsx` —
// `useFieldArray({ control, name: 'items' })` NESTE componente (o pai da
// Section, `CreateOrUpdateMovementPurchase.tsx`, apenas repassa
// `control`/`errors`/`watch`); a linha (`MovementPurchaseItemRow`) NUNCA
// instancia o próprio `useFieldArray` (contrato §"Estado").
//
// Bloqueia remover a última linha (mirror legado + `MovementSaleItemsSection`).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { MovementPurchaseForm } from '@/@types/v2/MovementPurchases';

import { MovementPurchaseItemRow } from './MovementPurchaseItemRow';
import { createEmptyMovementPurchaseItem } from './useMovementPurchases';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface MovementPurchaseItemsSectionProps {
  control: Control<MovementPurchaseForm>;
  errors: FieldErrors<MovementPurchaseForm>;
  watch: UseFormWatch<MovementPurchaseForm>;
  isDisabled: boolean;
  /** Origem fiscal (compra salva com chave / XML importado). */
  isFiscalLocked?: boolean;
}

export function MovementPurchaseItemsSection({
  control,
  errors,
  watch,
  isDisabled,
  isFiscalLocked = false,
}: MovementPurchaseItemsSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementPurchases.movementPurchase.form.itemRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const arrayError = errors.items?.message as string | undefined;

  function handleAdd() {
    append(createEmptyMovementPurchaseItem());
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) {
      toaster.error({
        title: text.addButton,
        description: text.removeLastError,
      });
      return;
    }
    remove(index);
  }

  return (
    <Box pt={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.title}
      </Text>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.empty}
        </Text>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <MovementPurchaseItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              isDisabled={isDisabled}
              isFiscalLocked={isFiscalLocked}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
