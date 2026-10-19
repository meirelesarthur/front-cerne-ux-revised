// src/pages/Frota/Transferencias/TransferEquipmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// `useFieldArray` de `equipment_uuids` do formulário de criação —
// TASK-ETR-FE-03. Clone estrutural de
// `Frota/Abastecimentos/SupplyItemsFieldArray.tsx`.
//
// Começa com 1 linha (`equipment_uuids` é `required|array|min:1`, `AC-05`/
// `CL-13`). "Remover" desabilitado quando resta 1 linha (`CL-26`/`AC-06`).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { EquipmentTransferForm } from '@/@types/v2/EquipmentTransfers';

import { TransferEquipmentRow } from './TransferEquipmentRow';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface TransferEquipmentsFieldArrayProps {
  control: Control<EquipmentTransferForm>;
  errors: FieldErrors<EquipmentTransferForm>;
  watch: UseFormWatch<EquipmentTransferForm>;
  setValue: UseFormSetValue<EquipmentTransferForm>;
  isDisabled: boolean;
  itemsError: string | null;
}

export function TransferEquipmentsFieldArray({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  itemsError,
}: TransferEquipmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipmentTransfers.equipmentTransfer.form.equipments;

  const { fields, append, remove } = useFieldArray({ control, name: 'equipment_uuids' });

  function handleAdd() {
    append({ equipment_uuid: null });
  }

  return (
    <Box pt={4}>
      <Text fontSize="md" fontWeight="semibold" color="fg.default" mb={3}>
        {text.sectionTitle}
      </Text>

      {itemsError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {itemsError}
        </Text>
      )}

      <Flex direction="column" gap={4} mb={4}>
        {fields.map((field, index) => (
          <TransferEquipmentRow
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
