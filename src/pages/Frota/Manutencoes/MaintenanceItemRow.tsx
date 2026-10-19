// src/pages/Frota/Manutencoes/MaintenanceItemRow.tsx
// -----------------------------------------------------------------------------
// Linha de item do formulário de Manutenções — Tarefa 44. Componente PRÓPRIO
// por linha (Rules of Hooks, mirror `SupplyItemRow.tsx`/`StockItemRow` de
// `AppropriationStockTab.tsx`).
//
// 2 mecanismos REUSADOS (interação, não código, FID-G3F §4):
//   1. Cascata de estoque armazém→produto→UM — MESMO endpoint de
//      `AppropriationStockTab.tsx`/`SupplyItemRow.tsx`
//      (`listStockAvailability`), mas o `value` do Select de Produto aqui é
//      `product.uuid` (contrato `MaintenanceItemData.product_uuid`),
//      DISTINTO de `SupplyItemForm.stock_uuid` (uuid físico do registro de
//      `Stock`) — a resolução do registro (`resolveStock`) é 100%
//      server-side nesta feature.
//   2. Toggle de executor Funcionário×Fornecedor — mirror EXATO
//      `AppropriationLaborTab.tsx` (onChange do tipo limpa os 2 outros
//      campos condicionais da MESMA linha), reduzido a 2 branches (sem
//      "Função").
//
// Horímetro/Km — fallback herdado da Tarefa 41 de Abastecimentos
// (`EquipmentOption` sem `family_equipment_uuid`, IG-01): campos SEMPRE
// visíveis e editáveis diretamente, SEM cascata de último-registro (não há
// `GET /maintenances/last-reading/{equipment}` no contrato desta feature).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { MaintenanceForm } from '@/@types/v2/Maintenances';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { MaintenanceStockExceedsWarningDialog } from './MaintenanceStockExceedsWarningDialog';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

type StockOptionValue = Option<string> & {
  quantity?: number;
  measurement?: Option<string> | null;
  measurementSecond?: Option<string> | null;
  factor?: number | null;
  factorType?: 'M' | 'D' | null;
};

export interface MaintenanceItemRowProps {
  index: number;
  control: Control<MaintenanceForm>;
  errors: FieldErrors<MaintenanceForm>;
  watch: UseFormWatch<MaintenanceForm>;
  setValue: UseFormSetValue<MaintenanceForm>;
  isDisabled: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

export function MaintenanceItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  canRemove,
  onRemove,
}: MaintenanceItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.form.items;

  const rowErrors = errors.items?.[index];

  const executorTypeOptions: Option<'employee' | 'provider'>[] = [
    { value: 'employee', label: text.executorTypeOptions.employee },
    { value: 'provider', label: text.executorTypeOptions.provider },
  ];

  const [stockWarning, setStockWarning] = useState<{
    informedQuantity: number;
    stockQuantity: number;
  } | null>(null);

  const productOption = watch(`items.${index}.product_uuid`) as StockOptionValue | null;
  const selectedMeasurementUuid = (
    watch(`items.${index}.measurement_uuid`) as Option<string> | null
  )?.value;
  const rawStockQuantity =
    productOption?.quantity !== undefined ? Number(productOption.quantity) : null;

  // Conversão por fator (mirror `AppropriationStockTab.tsx`/`SupplyItemRow.tsx`
  // "TASK-FE-714"): `factor_type==='M'` MULTIPLICA, `'D'` DIVIDE. Só converte
  // quando a UM escolhida é a SECUNDÁRIA do produto (nativa = sem conversão).
  function convertStockQuantity(raw: number): number {
    const nativeMeasurementUuid = productOption?.measurement?.value;
    const isNativeMeasurement =
      !selectedMeasurementUuid || selectedMeasurementUuid === nativeMeasurementUuid;
    if (isNativeMeasurement) return raw;

    const factor = productOption?.factor;
    const factorType = productOption?.factorType;
    if (!factor || factor <= 0) return raw;

    if (factorType === 'M') return raw * factor;
    if (factorType === 'D') return raw / factor;
    return raw;
  }

  const convertedStockQuantity =
    rawStockQuantity !== null ? convertStockQuantity(rawStockQuantity) : null;
  const stockDisplayValue =
    convertedStockQuantity !== null
      ? convertedStockQuantity.toLocaleString('pt-BR', {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })
      : '—';

  const measurementOptions = Array.from(
    new Map(
      [productOption?.measurement, productOption?.measurementSecond]
        .filter((option): option is Option<string> => Boolean(option))
        .map((option) => [option.value, option])
    ).values()
  );

  function handleQuantityBlur() {
    const quantity = Number(watch(`items.${index}.quantity`)) || 0;
    if (convertedStockQuantity === null) return;
    if (quantity > convertedStockQuantity) {
      setStockWarning({ informedQuantity: quantity, stockQuantity: convertedStockQuantity });
      setValue(`items.${index}.quantity`, 0);
    }
  }

  const executorType = watch(`items.${index}.executor_type`)?.value;

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.equipment_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.equipment}
              placeholder={text.placeholders.equipment}
              error={rowErrors?.equipment_uuid?.message as string | undefined}
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
              // D-Equip (mirror precedente Manutenções Preventivas) — editável
              // de fato em QUALQUER modo, sem `isDisabled` artificial além do
              // gate global do form (`isDisabled` de submissão/permissão).
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.hour_meter`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.hourMeter}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.mileage`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.mileage}
              allowDot={false}
              decimalPlaces={0}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.warehouse_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.warehouse}
              placeholder={text.placeholders.warehouse}
              error={rowErrors?.warehouse_uuid?.message as string | undefined}
              service={listWarehouseOptions}
              mapOptions={(item: WarehouseOption) => ({
                label: `${item.initials} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // Gate de sequência (mirror `AppropriationStockTab.tsx`/
                // `SupplyItemRow.tsx` "TASK-FE-604") — trocar o Armazém
                // limpa Produto E Un. Medida da MESMA linha.
                setValue(`items.${index}.product_uuid`, null);
                setValue(`items.${index}.measurement_uuid`, null);
              }}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.product_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.product}
              placeholder={text.placeholders.product}
              error={rowErrors?.product_uuid?.message as string | undefined}
              service={listStockAvailability}
              mapOptions={(item: StockAvailabilityItem) => ({
                label: item.provider_lot
                  ? `${item.product.description} - Lote: ${item.provider_lot}`
                  : item.product.description,
                // Contrato `MaintenanceItemData.product_uuid` — value é o
                // uuid do PRODUTO, não o do registro físico de `Stock`
                // (DISTINTO de `SupplyItemForm.stock_uuid`).
                value: item.product.uuid,
                quantity: item.quantity,
                measurement: item.measurement
                  ? {
                      label: item.measurement.description || item.measurement.name,
                      value: item.measurement.uuid,
                    }
                  : null,
                measurementSecond: item.measurement_second
                  ? {
                      label: item.measurement_second.description || item.measurement_second.name,
                      value: item.measurement_second.uuid,
                    }
                  : null,
                factor: item.factor ?? null,
                factorType: item.factor_type ?? null,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                warehouse_uuid: watch(`items.${index}.warehouse_uuid`)?.value,
              })}
              cacheUniqs={[watch(`items.${index}.warehouse_uuid`)?.value]}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                const dedupedMeasurements = Array.from(
                  new Map(
                    [option?.measurement, option?.measurementSecond]
                      .filter((candidate): candidate is Option<string> => Boolean(candidate))
                      .map((candidate) => [candidate.value, candidate])
                  ).values()
                );
                setValue(
                  `items.${index}.measurement_uuid`,
                  dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                );
              }}
              isDisabled={isDisabled || !watch(`items.${index}.warehouse_uuid`)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.measurement_uuid`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.fields.measurement}
              value={field.value ?? null}
              onChange={(option) => field.onChange(option ?? null)}
              options={measurementOptions}
              noClearable
              isDisabled={isDisabled || measurementOptions.length <= 1}
            />
          )}
        />

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.quantity}
              isRequired={!!productOption}
              allowDot
              decimalPlaces={3}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              onBlur={handleQuantityBlur}
              error={rowErrors?.quantity?.message as string | undefined}
              disabled={isDisabled}
            />
          )}
        />

        <InputReadOnly label={text.fields.stock} value={stockDisplayValue} />

        <Controller
          name={`items.${index}.executor_type`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.fields.executorType}
              value={field.value ?? null}
              onChange={(option: Option<'employee' | 'provider'> | null) => {
                field.onChange(option ?? null);
                // Mirror EXATO `AppropriationLaborTab.tsx` (onChange do tipo
                // limpa os 3 outros campos condicionais da MESMA linha).
                setValue(`items.${index}.employee_uuid`, null);
                setValue(`items.${index}.employee_quantity`, null);
                setValue(`items.${index}.provider_uuid`, null);
                setValue(`items.${index}.provider_total`, null);
              }}
              options={executorTypeOptions}
              isDisabled={isDisabled}
            />
          )}
        />

        {executorType === 'employee' && (
          <>
            <Controller
              name={`items.${index}.employee_uuid`}
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.employee}
                  placeholder={text.placeholders.employee}
                  service={listEmployeeOptions}
                  mapOptions={(item: EmployeeOption) => ({ label: item.name, value: item.uuid })}
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

            <Controller
              name={`items.${index}.employee_quantity`}
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={text.fields.employeeHours}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  isRequired
                  disabled={isDisabled}
                />
              )}
            />
          </>
        )}

        {executorType === 'provider' && (
          <>
            <Controller
              name={`items.${index}.provider_uuid`}
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.provider}
                  placeholder={text.placeholders.provider}
                  service={listProviders}
                  mapOptions={(item: ProviderListItem) => ({ label: item.name, value: item.uuid })}
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

            <Controller
              name={`items.${index}.provider_total`}
              control={control}
              render={({ field }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.providerTotal}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  isRequired
                  disabled={isDisabled}
                />
              )}
            />
          </>
        )}

        <Controller
          name={`items.${index}.note`}
          control={control}
          render={({ field }) => (
            <Input
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

      <MaintenanceStockExceedsWarningDialog
        isOpen={!!stockWarning}
        onClose={() => setStockWarning(null)}
        informedQuantity={stockWarning?.informedQuantity ?? 0}
        stockQuantity={stockWarning?.stockQuantity ?? 0}
      />
    </Box>
  );
}
