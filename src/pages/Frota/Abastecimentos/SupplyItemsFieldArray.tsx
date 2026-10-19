// src/pages/Frota/Abastecimentos/SupplyItemsFieldArray.tsx
// -----------------------------------------------------------------------------
// `useFieldArray` de `items` do formulário de Abastecimentos (Supply) —
// Tarefa 41. Mirror estrutural de
// `Operacional/Appropriations/tabs/AppropriationStockTab.tsx` (Armazém+
// Produto+UM+Qtd), acrescido de Equipamento (cascata 1)/Horímetro/Km/
// Responsável, que o sibling não tem.
//
// Botões "Adicionar item"/"Remover" — mínimo de 1 linha (AM-06/AM-07,
// FID-G3F §6): remover fica desabilitado quando resta só 1 linha.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { SupplyForm } from '@/@types/v2/Supplies';

import { SupplyItemRow } from './SupplyItemRow';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface SupplyItemsFieldArrayProps {
  control: Control<SupplyForm>;
  errors: FieldErrors<SupplyForm>;
  watch: UseFormWatch<SupplyForm>;
  setValue: UseFormSetValue<SupplyForm>;
  isDisabled: boolean;
  itemsError: string | null;
}

export function SupplyItemsFieldArray({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  itemsError,
}: SupplyItemsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplies.supply.form.items;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  function handleAdd() {
    append({
      equipment_uuid: null,
      hour_meter: null,
      mileage: null,
      warehouse_uuid: null,
      stock_uuid: null,
      measurement_uuid: null,
      quantity: null,
      responsible_uuid: null,
      note: null,
    });
  }

  return (
    <Box pt={4}>
      <Text fontSize="md" fontWeight="semibold" color="fg.default" mb={3}>
        {text.title}
      </Text>

      {itemsError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {itemsError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <SupplyItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
