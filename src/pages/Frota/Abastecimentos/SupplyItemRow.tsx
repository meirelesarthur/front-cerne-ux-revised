// src/pages/Frota/Abastecimentos/SupplyItemRow.tsx
// -----------------------------------------------------------------------------
// Linha de item do formulário de Abastecimentos (Supply) — Tarefa 41.
// Componente PRÓPRIO por linha (hooks de cascata por linha exigem isso,
// Rules of Hooks — mirror `StockItemRow` de
// `Operacional/Appropriations/tabs/AppropriationStockTab.tsx`).
//
// 4 cascatas encadeadas (contrato de API §9, FID-G3F §8/§9):
//   1. Equipamento → `getSupplyLastReading` → Horímetro/Km sugeridos
//      (readonly). Fallback documentado (Roteiro, risco 3): `EquipmentOption`
//      não expõe `family_equipment` — os 2 campos (Horímetro/Km) ficam SEMPRE
//      visíveis (em vez de alternância condicional IG-01); nenhuma validação
//      client-side "preencha 1 dos 2" foi adicionada nesta fatia — registrar
//      como nota ao Tester/handoff.
//   2. Armazém → `listWarehouseOptions` (já existe) — trocar o Armazém limpa
//      o Produto/Estoque E a Un. Medida da MESMA linha (gate de sequência,
//      mirror `AppropriationStockTab.tsx` "TASK-FE-604").
//   3. Produto/Estoque → `listStockAvailability({ warehouse_uuid })` (já
//      existe, MESMO endpoint de `AppropriationStockTab.tsx`) — cada option
//      já embute `measurement`/`measurementSecond`/`factor`/`factorType`/
//      `quantity`, ZERO 3ª chamada. `value` = `stock_uuid` (uuid do PRÓPRIO
//      registro de `Stock`, contrato §4 `items.*.stock_uuid`) — NÃO
//      `product_uuid` (Abastecimentos não tem esse campo no payload).
//   4. UM primária/secundária → recalcula "Quantidade disponível exibida"
//      CLIENT-SIDE puro (CV-03: `factor_type==='M' ? raw*factor :
//      raw/factor`), zero request adicional.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { getSupplyLastReading } from '@/services/v2/Supplies/supply-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { SupplyForm } from '@/@types/v2/Supplies';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { SupplyStockExceedsWarningDialog } from './SupplyStockExceedsWarningDialog';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

type StockOptionValue = Option<string> & {
  quantity?: number;
  measurement?: Option<string> | null;
  measurementSecond?: Option<string> | null;
  factor?: number | null;
  factorType?: 'M' | 'D' | null;
};

export interface SupplyItemRowProps {
  index: number;
  control: Control<SupplyForm>;
  errors: FieldErrors<SupplyForm>;
  watch: UseFormWatch<SupplyForm>;
  setValue: UseFormSetValue<SupplyForm>;
  isDisabled: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

// PADRÃO 12 (`get_pwa_complex_screen_compositions_pattern`) — `useQuery`
// direto por linha, leitura pura sem paginação, `enabled: !!equipmentUuid`,
// SEM `refetchOnWindowFocus` (Tarefa 41, §Hooks).
function useSupplyLastReadingQuery(equipmentUuid?: string) {
  return useQuery({
    queryKey: ['supply-last-reading', equipmentUuid],
    queryFn: async () => {
      const response = await getSupplyLastReading(equipmentUuid!);
      return response.data;
    },
    enabled: !!equipmentUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function SupplyItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  canRemove,
  onRemove,
}: SupplyItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplies.supply.form.items;

  const rowErrors = errors.items?.[index];

  const equipmentOption = watch(`items.${index}.equipment_uuid`) as Option<string> | null;
  const equipmentUuid = equipmentOption?.value;

  const lastReadingQuery = useSupplyLastReadingQuery(equipmentUuid);

  // Guarda de mudança REAL de equipamento (não dispara no mount da hidratação
  // de edição, preservando `hour_meter`/`mileage` já persistidos) — mirror
  // `totalQuantityTouchedRef`/`isFirstRender` de `AppropriationStockTab.tsx`.
  const isFirstRender = useRef(true);
  const previousEquipmentUuid = useRef(equipmentUuid);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousEquipmentUuid.current = equipmentUuid;
      return;
    }
    if (equipmentUuid === previousEquipmentUuid.current) return;
    previousEquipmentUuid.current = equipmentUuid;
    if (!equipmentUuid) {
      setValue(`items.${index}.hour_meter`, null);
      setValue(`items.${index}.mileage`, null);
      return;
    }
    if (lastReadingQuery.data) {
      // Sem abastecimento anterior, o backend retorna `null` propositalmente
      // (`SupplyLastReadingResource`, Tarefa 38) — o form deve exibir `0`
      // (leitura honesta de "sem histórico"), nunca deixar o InputReadOnly
      // cair no fallback visual `—` (Correção pós-entrega, Esteira 009).
      setValue(`items.${index}.hour_meter`, lastReadingQuery.data.hour_meter ?? 0);
      setValue(`items.${index}.mileage`, lastReadingQuery.data.mileage ?? 0);
    }
  }, [equipmentUuid, lastReadingQuery.data]);

  const [stockWarning, setStockWarning] = useState<{
    informedQuantity: number;
    stockQuantity: number;
  } | null>(null);

  const stockOption = watch(`items.${index}.stock_uuid`) as StockOptionValue | null;
  const selectedMeasurementUuid = (
    watch(`items.${index}.measurement_uuid`) as Option<string> | null
  )?.value;
  const rawStockQuantity =
    stockOption?.quantity !== undefined ? Number(stockOption.quantity) : null;

  // Conversão por fator (direção Insumos — mirror `AppropriationStockTab.tsx`
  // "TASK-FE-714"): `factor_type==='M'` MULTIPLICA, `'D'` DIVIDE. Só converte
  // quando a UM escolhida é a SECUNDÁRIA do produto (nativa = sem conversão).
  function convertStockQuantity(raw: number): number {
    const nativeMeasurementUuid = stockOption?.measurement?.value;
    const isNativeMeasurement =
      !selectedMeasurementUuid || selectedMeasurementUuid === nativeMeasurementUuid;
    if (isNativeMeasurement) return raw;

    const factor = stockOption?.factor;
    const factorType = stockOption?.factorType;
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
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—';

  const measurementOptions = Array.from(
    new Map(
      [stockOption?.measurement, stockOption?.measurementSecond]
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
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <InputReadOnly
          label={text.fields.hourMeter}
          value={
            watch(`items.${index}.hour_meter`) != null
              ? String(watch(`items.${index}.hour_meter`))
              : '—'
          }
          loading={lastReadingQuery.isFetching}
        />

        <InputReadOnly
          label={text.fields.mileage}
          value={
            watch(`items.${index}.mileage`) != null ? String(watch(`items.${index}.mileage`)) : '—'
          }
          loading={lastReadingQuery.isFetching}
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
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // Gate de sequência (mirror AppropriationStockTab
                // "TASK-FE-604") — trocar o Armazém limpa Produto/Estoque E
                // Un. Medida da MESMA linha.
                setValue(`items.${index}.stock_uuid`, null);
                setValue(`items.${index}.measurement_uuid`, null);
              }}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.stock_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.product}
              placeholder={text.placeholders.product}
              error={rowErrors?.stock_uuid?.message as string | undefined}
              service={listStockAvailability}
              mapOptions={(item: StockAvailabilityItem) => ({
                label: item.provider_lot
                  ? `${item.product.description} - Lote: ${item.provider_lot}`
                  : item.product.description,
                value: item.uuid,
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
              value={field.value ?? null}
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
              isRequired
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
              error={rowErrors?.measurement_uuid?.message as string | undefined}
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
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              onBlur={handleQuantityBlur}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <InputReadOnly label={text.fields.stock} value={stockDisplayValue} />

        <Controller
          name={`items.${index}.responsible_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.responsible}
              placeholder={text.placeholders.responsible}
              service={listEmployeeOptions}
              mapOptions={(item: EmployeeOption) => ({ label: item.name, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

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

      <SupplyStockExceedsWarningDialog
        isOpen={!!stockWarning}
        onClose={() => setStockWarning(null)}
        informedQuantity={stockWarning?.informedQuantity ?? 0}
        stockQuantity={stockWarning?.stockQuantity ?? 0}
      />
    </Box>
  );
}
