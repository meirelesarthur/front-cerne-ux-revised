// src/pages/Frota/Manutencoes/MaintenanceItemsFieldArray.tsx
// -----------------------------------------------------------------------------
// `useFieldArray` de `items` do formulário de Manutenções — Tarefa 44.
// Mirror estrutural de `Frota/Abastecimentos/SupplyItemsFieldArray.tsx`.
//
// Botões "Adicionar item"/"Remover" — mínimo de 1 linha, remover fica
// desabilitado quando resta só 1 linha.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { MaintenanceForm } from '@/@types/v2/Maintenances';

import { MaintenanceItemRow } from './MaintenanceItemRow';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface MaintenanceItemsFieldArrayProps {
  control: Control<MaintenanceForm>;
  errors: FieldErrors<MaintenanceForm>;
  watch: UseFormWatch<MaintenanceForm>;
  setValue: UseFormSetValue<MaintenanceForm>;
  isDisabled: boolean;
  itemsError: string | null;
}

export function MaintenanceItemsFieldArray({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  itemsError,
}: MaintenanceItemsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.form.items;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  function handleAdd() {
    append({
      equipment_uuid: null,
      hour_meter: null,
      mileage: null,
      warehouse_uuid: null,
      product_uuid: null,
      measurement_uuid: null,
      quantity: null,
      note: null,
      executor_type: null,
      employee_uuid: null,
      employee_quantity: null,
      provider_uuid: null,
      provider_total: null,
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
            <MaintenanceItemRow
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
