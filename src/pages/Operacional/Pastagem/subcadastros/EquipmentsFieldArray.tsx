// src/pages/Operacional/Pastagem/subcadastros/EquipmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// Aba "Máq/Implementos" (equipamentos) — TASK-PAST-FE-04. `useFieldArray` de
// `equipments` no form pai (CLM-51 — sem endpoint por linha, submit único).
// Mirror `Appropriations/tabs/AppropriationEquipmentTab.tsx`.
//
// Readonly em edição (CLM-64): linha já persistida (`row.uuid` presente,
// hidratada por `fillPastureForm`) trava `equipment_uuid`/`measurement_uuid`/
// `start_hour_meter` (identidade + valor inicial); `end_hour_meter`/`note`
// continuam editáveis (CALC-03). Linha NOVA (adicionada nesta sessão, sem
// `uuid`) fica 100% editável, mesmo em modo edição.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { PastureForm } from '@/@types/v2/Pastures';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface EquipmentsFieldArrayProps {
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  watch: UseFormWatch<PastureForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function EquipmentsFieldArray({
  control,
  watch,
  isLoading,
  canSave,
}: EquipmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture.form;
  const equipmentText = text.equipments;

  const { fields, append, remove } = useFieldArray({ control, name: 'equipments' });
  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({ equipment_uuid: null, measurement_uuid: null, start_hour_meter: null, note: null });
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const isExistingRow = !!watch(`equipments.${index}.uuid`);
            return (
              <Box
                key={field.id}
                p={4}
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
              >
                {isExistingRow && (
                  <Text fontSize="xs" color="fg.muted" mb={2}>
                    {equipmentText.readonlyHint}
                  </Text>
                )}
                <SimpleGrid columns={columnsForm.default} gap={4}>
                  <Controller
                    name={`equipments.${index}.equipment_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      isExistingRow ? (
                        <InputReadOnly
                          label={equipmentText.fields.equipment}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={equipmentText.fields.equipment}
                          placeholder={equipmentText.placeholders.equipment}
                          service={listEquipmentCatalogOptions}
                          mapOptions={(item: EquipmentOption) => ({
                            label: `${item.code} — ${item.description}`,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={rowField.value ?? undefined}
                          onChange={(option: any) => rowField.onChange(option ?? null)}
                          isRequired
                          isDisabled={isDisabled}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )
                    }
                  />

                  <Controller
                    name={`equipments.${index}.measurement_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      isExistingRow ? (
                        <InputReadOnly
                          label={equipmentText.fields.measurement}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={equipmentText.fields.measurement}
                          placeholder={equipmentText.placeholders.measurement}
                          service={listMeasurementOptions}
                          mapOptions={(item: MeasurementOption) => ({
                            label: item.description,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={rowField.value ?? undefined}
                          onChange={(option: any) => rowField.onChange(option ?? null)}
                          isRequired
                          isDisabled={isDisabled}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )
                    }
                  />

                  {isExistingRow ? (
                    <InputReadOnly
                      label={equipmentText.fields.startHourMeter}
                      value={Number(
                        watch(`equipments.${index}.start_hour_meter`) ?? 0
                      ).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    />
                  ) : (
                    <Controller
                      name={`equipments.${index}.start_hour_meter`}
                      control={control}
                      render={({ field: rowField }) => (
                        <NumberInput
                          name={rowField.name}
                          label={equipmentText.fields.startHourMeter}
                          allowDot
                          decimalPlaces={2}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          disabled={isDisabled}
                        />
                      )}
                    />
                  )}

                  <Controller
                    name={`equipments.${index}.end_hour_meter`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={equipmentText.fields.endHourMeter}
                        allowDot
                        decimalPlaces={2}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        disabled={isDisabled}
                      />
                    )}
                  />

                  <Controller
                    name={`equipments.${index}.note`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Input
                        label={equipmentText.fields.note}
                        name={rowField.name}
                        value={rowField.value ?? ''}
                        onChange={(e) => rowField.onChange(e.target.value)}
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
                    disabled={isDisabled}
                    onClick={() => remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              </Box>
            );
          })}
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
