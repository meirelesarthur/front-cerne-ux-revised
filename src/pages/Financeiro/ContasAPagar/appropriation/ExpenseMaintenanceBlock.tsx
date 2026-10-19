// src/pages/Financeiro/ContasAPagar/appropriation/ExpenseMaintenanceBlock.tsx
// -----------------------------------------------------------------------------
// UT-000795 — bloco "Apropriação — Manutenção" do Cabeçalho de Contas a Pagar
// (Direta + Tipo=Manutenção): Equipamento/Veículo + Horímetro OU Km.
//
//   - A alternância usa SÓ `uses_mileage` devolvido pela API (família 5 = Km);
//     o front não hardcoda a família. Renderiza UM dos dois campos (o outro
//     não existe no DOM — sem validação nem foco escondido).
//   - Horímetro: `NumberInput allowDot decimalPlaces=1` — preenchimento pela
//     DIREITA, como o legado (maskMoney precision 1): digitar 1, 2, 5 vira
//     12,5. Decisão do dono em 2026-10-15 (Q-F1 DECIDIDA; substitui o default
//     anterior de digitação direta). Valor do form = número puro (sem ×10;
//     `1234.5` exibe `1.234,5`). `0` é válido (exibe `0,0`).
//   - Km: `MaskedInput kind="integer"`.
//   - Troca de equipamento (handler do usuário, nunca efeito): se o tipo de
//     medidor muda, limpa o medidor que passa a ficar oculto.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormClearErrors,
  type UseFormSetValue,
} from 'react-hook-form';

import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import type { EquipmentCatalogOption } from '@/services/v2/Equipments/equipment-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type {
  ExpenseAppropriationMaintenanceDetail,
  ExpenseForm,
  ExpenseMaintenanceEquipmentOption,
} from '@/@types/v2/Financeiro/expense';

import { AppropriationDetailSummary } from './AppropriationDetailSummary';
import { equipmentUsesMileage } from './expenseAppropriation';

export const MAINTENANCE_EQUIPMENT_PAGE_SIZE = 100;
const HOUR_METER_MAX = 9999999999.9;
const MILEAGE_MAX = 2147483647;

interface ExpenseMaintenanceBlockProps {
  control: Control<ExpenseForm>;
  errors: FieldErrors<ExpenseForm>;
  setValue: UseFormSetValue<ExpenseForm>;
  clearErrors: UseFormClearErrors<ExpenseForm>;
  /** `!canSave || isLoading` — também verdadeiro na rota de visualização. */
  isDisabled: boolean;
  /** `appropriation_detail.maintenance` do título carregado. */
  detail?: ExpenseAppropriationMaintenanceDetail | null;
}

export function ExpenseMaintenanceBlock({
  control,
  errors,
  setValue,
  clearErrors,
  isDisabled,
  detail,
}: ExpenseMaintenanceBlockProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.financial.expense.form;

  const equipmentValue = useWatch({ control, name: 'aprop_man_equipment_uuid' });
  const usesMileage = equipmentUsesMileage(equipmentValue);

  function handleEquipmentChange(option: ExpenseMaintenanceEquipmentOption | null) {
    clearErrors('aprop_man_equipment_uuid');
    const nextUsesMileage = equipmentUsesMileage(option);
    if (nextUsesMileage !== usesMileage) {
      // O medidor que passa a ficar oculto é limpo (H1) — só por ação do usuário.
      setValue(nextUsesMileage ? 'aprop_man_hour_meter' : 'aprop_man_mileage', null, {
        shouldDirty: true,
      });
      clearErrors(['aprop_man_hour_meter', 'aprop_man_mileage']);
    }
  }

  return (
    <Box mt={6} p={4} bg="bg.muted" borderRadius="lg" data-testid="expense-maintenance-block">
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {formText.sections.maintenance}
      </Text>

      {detail && (
        <AppropriationDetailSummary
          code={detail.code}
          status={detail.status}
          date={detail.date}
          amount={detail.amount}
        />
      )}

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
        <Box gridColumn={{ md: 'span 3' }}>
          <Controller
            name="aprop_man_equipment_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.maintenanceEquipment}
                placeholder={formText.placeholders.maintenanceEquipment}
                error={errors.aprop_man_equipment_uuid?.message as string | undefined}
                service={(params: PaginationQueryParams & { search?: string }) =>
                  listEquipmentCatalogOptions({
                    page: params.page,
                    per_page: params.per_page ?? MAINTENANCE_EQUIPMENT_PAGE_SIZE,
                    search: params.search,
                    purpose: 'expense-maintenance',
                  })
                }
                pageSize={MAINTENANCE_EQUIPMENT_PAGE_SIZE}
                // Rótulo só com a descrição (legado); `uses_mileage` viaja na option.
                mapOptions={(item: EquipmentCatalogOption) => ({
                  label: item.description,
                  value: item.uuid,
                  uses_mileage: item.uses_mileage === true,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  handleEquipmentChange(option ?? null);
                }}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        {usesMileage ? (
          <Controller
            name="aprop_man_mileage"
            control={control}
            render={({ field }) => (
              <MaskedInput
                kind="integer"
                name={field.name}
                label={formText.fields.maintenanceMileage}
                placeholder={formText.placeholders.maintenanceMileage}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  clearErrors('aprop_man_mileage');
                }}
                error={errors.aprop_man_mileage?.message as string | undefined}
                min={0}
                max={MILEAGE_MAX}
                isRequired
                disabled={isDisabled}
              />
            )}
          />
        ) : (
          <Controller
            name="aprop_man_hour_meter"
            control={control}
            render={({ field }) => (
              <NumberInput
                allowDot
                decimalPlaces={1}
                name={field.name}
                label={formText.fields.maintenanceHourMeter}
                placeholder={formText.placeholders.maintenanceHourMeter}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  clearErrors('aprop_man_hour_meter');
                }}
                error={errors.aprop_man_hour_meter?.message as string | undefined}
                min={0}
                max={HOUR_METER_MAX}
                isRequired={!!equipmentValue}
                disabled={isDisabled}
              />
            )}
          />
        )}
      </SimpleGrid>
    </Box>
  );
}
