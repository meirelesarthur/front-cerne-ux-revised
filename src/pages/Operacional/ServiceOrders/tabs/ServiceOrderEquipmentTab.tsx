// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderEquipmentTab.tsx
// -----------------------------------------------------------------------------
// Aba "Equipamentos" — TASK-FE-2005. `useFieldArray` de `equipments`, mirror
// `Appropriations/tabs/AppropriationEquipmentTab.tsx` (versão enxuta — sem
// horímetro/foto, contrato real `equipments[]{equipment_uuid,note,
// is_checked}`). `equipment_uuid` via `listEquipmentCatalogOptions`
// (`equipments/options`, já existente — TASK-FE-840).
//
// Execução 086 (FE-02): `?purpose=service-order` — paridade com o legado da OS
// (tenant inteiro + status 1 + `is_enabled` + famílias 1/2/3), em vez do
// catálogo geral sem filtro.
//
// exec-038 HOMOLOG R2 (R2-04, achado E2E do dono) — "Confirmado"
// (`is_checked`) REMOVIDO do form (backend mantém a coluna com default);
// Equipamento + Observação PRESERVADOS (o legado tem os 2 na criação,
// `_card_equipment.blade.php`).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import {
  listEquipmentCatalogOptions,
  type EquipmentOptionsPurpose,
} from '@/services/v2/Equipments/equipment-service';

import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { ServiceOrderForm } from '@/@types/v2/ServiceOrders';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

const EQUIPMENT_OPTIONS_PURPOSE: EquipmentOptionsPurpose = 'service-order';

export interface ServiceOrderEquipmentTabProps {
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  watch: UseFormWatch<ServiceOrderForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function ServiceOrderEquipmentTab({
  control,
  isLoading,
  canSave,
}: ServiceOrderEquipmentTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'equipments' });

  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({ equipment_uuid: null, note: null, is_checked: false });
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Box
              key={field.id}
              p={4}
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
            >
              <SimpleGrid columns={columnsForm.default} gap={4}>
                <Controller
                  name={`equipments.${index}.equipment_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={formText.equipment.fields.equipment}
                      placeholder={formText.equipment.placeholders.equipment}
                      service={listEquipmentCatalogOptions}
                      mapOptions={(item: EquipmentOption) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        purpose: EQUIPMENT_OPTIONS_PURPOSE,
                      })}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      isRequired
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />

                <Controller
                  name={`equipments.${index}.note`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Input
                      label={formText.equipment.fields.note}
                      name={rowField.name}
                      value={rowField.value ?? ''}
                      onChange={(event) => rowField.onChange(event.target.value)}
                      disabled={isDisabled}
                    />
                  )}
                />
              </SimpleGrid>

              <Flex justify="flex-end" align="center" mt={3}>
                <IconButtonTable
                  aria-label={formText.removeItem}
                  mensegerTooltip={formText.removeItem}
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
          ))}
        </Flex>
      )}

      <Button
        title={formText.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
