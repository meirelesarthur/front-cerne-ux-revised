// src/pages/Frota/Transferencias/TransferEquipmentRow.tsx
// -----------------------------------------------------------------------------
// Linha de máquina do formulário de criação — TASK-ETR-FE-03. Clone
// estrutural simplificado de `Frota/Abastecimentos/SupplyItemRow.tsx`: um
// único `SelectAsyncPaginate` por linha (SEM cascatas — `AC-05`, `LK-02`).
//
// Duplicata PERMITIDA (`DEC-FE-ETR-02`): `CL-13` não valida e o pivot não
// tem unicidade (DEB-04) — NÃO copiar a validação de duplicidade de
// `FarmTransferItemsEditor.tsx`.
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { EquipmentTransferForm } from '@/@types/v2/EquipmentTransfers';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface TransferEquipmentRowProps {
  index: number;
  control: Control<EquipmentTransferForm>;
  errors: FieldErrors<EquipmentTransferForm>;
  watch: UseFormWatch<EquipmentTransferForm>;
  setValue: UseFormSetValue<EquipmentTransferForm>;
  isDisabled: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

export function TransferEquipmentRow({
  index,
  control,
  errors,
  isDisabled,
  canRemove,
  onRemove,
}: TransferEquipmentRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipmentTransfers.equipmentTransfer.form.equipments;

  const rowError = errors.equipment_uuids?.[index]?.equipment_uuid;

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`equipment_uuids.${index}.equipment_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.equipment}
              error={rowError?.message as string | undefined}
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
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
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
