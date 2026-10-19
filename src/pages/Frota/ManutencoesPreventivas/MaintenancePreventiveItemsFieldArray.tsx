// src/pages/Frota/ManutencoesPreventivas/MaintenancePreventiveItemsFieldArray.tsx
// -----------------------------------------------------------------------------
// `useFieldArray` de `items` do formulário de Manutenções Preventivas
// (MaintenancePreventive) — Tarefa 44. Mirror estrutural de
// `SupplyItemsFieldArray.tsx`.
//
// Botões "Adicionar item"/"Remover" — mínimo de 1 linha (SR-10/SR-11, FID-G3F
// §6): remover fica desabilitado quando resta só 1 linha.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { MaintenancePreventiveForm } from '@/@types/v2/MaintenancePreventives';

import { MaintenancePreventiveItemRow } from './MaintenancePreventiveItemRow';

import type { Control, FieldErrors } from 'react-hook-form';

export interface MaintenancePreventiveItemsFieldArrayProps {
  control: Control<MaintenancePreventiveForm>;
  errors: FieldErrors<MaintenancePreventiveForm>;
  isDisabled: boolean;
  itemsError: string | null;
}

export function MaintenancePreventiveItemsFieldArray({
  control,
  errors,
  isDisabled,
  itemsError,
}: MaintenancePreventiveItemsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenancePreventives.maintenancePreventive.form.items;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  function handleAdd() {
    append({
      equipment_uuid: null,
      message: '',
      date: null,
      note: null,
      hour_meter_km: null,
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
            <MaintenancePreventiveItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
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
