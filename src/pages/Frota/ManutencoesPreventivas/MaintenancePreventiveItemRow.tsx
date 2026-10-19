// src/pages/Frota/ManutencoesPreventivas/MaintenancePreventiveItemRow.tsx
// -----------------------------------------------------------------------------
// Linha de item do formulário de Manutenções Preventivas
// (MaintenancePreventive) — Tarefa 44. Componente PRÓPRIO por linha (mirror
// `SupplyItemRow.tsx`, convenção estrutural do módulo `Frota` — mesmo sem
// hook de rede por linha aqui: esta feature NÃO tem cascata (D7), diferente
// do sibling `Abastecimentos`).
//
// Campos (contrato Tarefa 40 §DTOs, FID-G3F §6):
//   1. Equipamento (`SelectAsyncPaginate` + `listEquipmentCatalogOptions`,
//      SEM filtro de família, D4) — editável de fato em QUALQUER modo, SEM
//      `isDisabled`/`readOnly` (D-Equip, resolve CLM-02 do legado).
//   2. Serviço (`message`) — SEMPRE obrigatório, `required` ESTÁTICO via
//      react-hook-form (D7 — supera o toggle condicional INT-01 do legado).
//   3. Data Revisão (`date`, opcional) — MESMO `DateInput` do cabeçalho, sem
//      variante por modo (D5, resolve CLM-06/CLM-07).
//   4. Horímetro/Km (`hour_meter_km`, opcional, numérico puro).
//   5. Observação (`note`, opcional) — sempre visível em criar E editar.
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { MaintenancePreventiveForm } from '@/@types/v2/MaintenancePreventives';

import type { Control, FieldErrors } from 'react-hook-form';

export interface MaintenancePreventiveItemRowProps {
  index: number;
  control: Control<MaintenancePreventiveForm>;
  errors: FieldErrors<MaintenancePreventiveForm>;
  isDisabled: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

export function MaintenancePreventiveItemRow({
  index,
  control,
  errors,
  isDisabled,
  canRemove,
  onRemove,
}: MaintenancePreventiveItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenancePreventives.maintenancePreventive.form.items;
  const formErrors = languageGB.maintenancePreventives.maintenancePreventive.form.errors;

  const rowErrors = errors.items?.[index];

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.equipment_uuid`}
          control={control}
          rules={{ required: formErrors.equipmentRequired }}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.equipment}
              placeholder={text.placeholders.equipment}
              error={error?.message}
              service={listEquipmentCatalogOptions}
              mapOptions={(item: EquipmentOption) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              // D-Equip — NUNCA isDisabled/readOnly aqui, em nenhum modo
              // (resolve CLM-02: o legado tinha readonly "cosmético" que
              // nunca bloqueava de verdade a edição real).
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.message`}
          control={control}
          rules={{ required: formErrors.messageRequired }}
          render={({ field, fieldState: { error } }) => (
            <Input
              name={field.name}
              label={text.fields.message}
              placeholder={text.placeholders.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              error={error?.message}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.date`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <Field
              label={text.fields.date}
              errorText={rowErrors?.date?.message as string | undefined}
            >
              <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
            </Field>
          )}
        />

        <Controller
          name={`items.${index}.hour_meter_km`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.hourMeterKm}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.note`}
          control={control}
          render={({ field }) => (
            <Textarea
              name={field.name}
              label={text.fields.note}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeItem}
          mensegerTooltip={text.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled || !canRemove}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}
