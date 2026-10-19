// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderProductionTab.tsx
// -----------------------------------------------------------------------------
// Aba "Produção" — TASK-FE-2005 (mirror `Appropriations/tabs/
// AppropriationProductionTab.tsx` — parte de catálogo, SEM a matriz de 13
// campos de qualidade, exclusiva de Apontamentos).
//
// D-FRONT-04 (matriz §5, "produto produção grupos 8/18") RESOLVIDO por
// REUTILIZAÇÃO do padrão já em produção: `listProductGroupOptions` resolve
// os uuids dos grupos "Produção"/"Ração / Alimentação / Nutrição" (mesmos 2
// grupos físicos 8/18 do legado, `GroupProductReference`) e filtra
// `listProductOptions` por `group_uuid[]` — MESMO mecanismo de
// `AppropriationProductionTab.tsx` (TASK-FE-612/AP-10), nenhum endpoint novo.
//
// exec-038 HOMOLOG R2 (R2-06, achado E2E do dono):
//   - "Confirmado" (`is_checked`) REMOVIDO do form (backend mantém a coluna
//     com default).
//   - "Armazém" ADICIONADO como campo de CABEÇALHO da aba (1 para TODOS os
//     itens, mirror `warehouse_production_uuid` de
//     `AppropriationProductionTab.tsx`, o padrão "armazém-para-o-bloco" que
//     o dono citou como referência) — verificado no legado
//     `_production.blade.php:5-15` (Select `warehouse_production_id`, campo
//     ÚNICO do painel). O Armazém do bloco NÃO filtra o catálogo de
//     "Produto" (que segue restrito aos grupos 8/18 via `group_uuid`,
//     mecanismo já existente e sem endpoint que combine
//     grupo+armazém) — alimenta, em vez disso, um novo "Estoque" READONLY
//     por linha (`GET /stocks/available?warehouse_uuid=&product_uuid=`,
//     SEM `allow_pointing`, mirror `AppropriationProductionTab.tsx`/
//     GAP-BE-632), com a MESMA conversão por fator (direção PRODUÇÃO: `M`
//     divide, `D` multiplica — oposta à de Insumos, decisão do dono
//     preservada). UI-ONLY: `productions_warehouse_uuid` nunca vai ao
//     payload (`CreateOrUpdateServiceOrder.tsx`).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
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

import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listStockAvailableOptions } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { ProductOption } from '@/@types/v2/Products';
import type { ServiceOrderForm } from '@/@types/v2/ServiceOrders';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

// Mirror EXATO de `APPROPRIATION_PRODUCTION_ELIGIBLE_GROUP_LABELS`
// (`AppropriationProductionTab.tsx`) — grupos 8 ("Produção") + 18 ("Ração /
// Alimentação / Nutrição"), mesmo domínio do legado (`group_id IN (8,18)`).
const SERVICE_ORDER_PRODUCTION_ELIGIBLE_GROUP_LABELS = [
  'Produção',
  'Ração / Alimentação / Nutrição',
];

export interface ServiceOrderProductionTabProps {
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  watch: UseFormWatch<ServiceOrderForm>;
  setValue: UseFormSetValue<ServiceOrderForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function ServiceOrderProductionTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
}: ServiceOrderProductionTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'productions' });

  // TASK-FE-2005 (mirror TASK-FE-612/AP-10) — resolve os uuids dos grupos
  // elegíveis (8+18) UMA vez, via o lookup já existente e sem gate
  // (`GET /product-groups/options`).
  const eligibleGroupUuidsQuery = useQuery({
    queryKey: ['service-order-production-eligible-group-uuids'],
    queryFn: async () => {
      const response = await listProductGroupOptions({});
      return response.data.items
        .filter((group) => SERVICE_ORDER_PRODUCTION_ELIGIBLE_GROUP_LABELS.includes(group.label))
        .map((group) => group.uuid);
    },
    staleTime: 5 * 60 * 1000,
  });
  const eligibleGroupUuids = eligibleGroupUuidsQuery.data;

  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({
      product_uuid: null,
      measurement_uuid: null,
      quantity: null,
      note: null,
      is_checked: false,
    });
  }

  return (
    <Box pt={4}>
      {/* "Armazém" — campo ÚNICO de cabeçalho da aba (R2-06), NÃO item de
          `productions[]`/`useFieldArray`; fora do payload. */}
      <SimpleGrid columns={columnsForm.default} gap={4} mb={5}>
        <Controller
          name="productions_warehouse_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.productions.fields.warehouse}
              placeholder={formText.productions.placeholders.warehouse}
              service={listWarehouseOptions}
              mapOptions={(item: WarehouseOption) => ({
                label: `${item.initials} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                // Mirror TASK-FE-611/AP-08 (`type: 'producao'`).
                type: 'producao',
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </SimpleGrid>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <ProductionItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              eligibleGroupUuids={eligibleGroupUuids}
              onRemove={() => remove(index)}
            />
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

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (R2-06, mirror `ProductionItemRow` de
// `AppropriationProductionTab.tsx`): necessário para o `useQuery` de
// "Estoque" por linha sem violar Rules of Hooks dentro do `.map()` de
// `useFieldArray`.
// -----------------------------------------------------------------------------

interface ProductionItemRowProps {
  index: number;
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  watch: UseFormWatch<ServiceOrderForm>;
  setValue: UseFormSetValue<ServiceOrderForm>;
  isDisabled: boolean;
  eligibleGroupUuids: string[] | undefined;
  onRemove: () => void;
}

function ProductionItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  eligibleGroupUuids,
  onRemove,
}: ProductionItemRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const rowErrors = errors.productions?.[index];

  const warehouseUuid = (watch('productions_warehouse_uuid') as Option<string> | null)?.value;
  const productOption = watch(`productions.${index}.product_uuid`) as
    | (Option<string> & {
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: { value: 'M' | 'D'; label: string } | null;
      })
    | null
    | undefined;
  const productUuid = productOption?.value as string | undefined;
  const selectedMeasurementUuid = (
    watch(`productions.${index}.measurement_uuid`) as Option<string> | null | undefined
  )?.value;

  // R2-06 (mirror TASK-FE-645/GAP-BE-632 de `AppropriationProductionTab.tsx`)
  // — "Estoque" REAL via `/stocks/available-options` (execução 086, gate do
  // consumidor OS em vez de `stocks_view`), habilitado só com Armazém (cabeçalho) E Produto (desta
  // linha) escolhidos.
  const stockQuery = useQuery({
    queryKey: ['service-order-production-stock', warehouseUuid, productUuid],
    queryFn: async () => {
      const response = await listStockAvailableOptions({
        warehouse_uuid: warehouseUuid,
        product_uuid: productUuid,
      });
      const items = response.data.items ?? [];
      return (
        items.find((item: StockAvailabilityItem) => item.product.uuid === productUuid) ??
        items[0] ??
        null
      );
    },
    enabled: Boolean(warehouseUuid) && Boolean(productUuid),
    staleTime: 60 * 1000,
    retry: false,
  });

  // Conversão por fator, DIREÇÃO DE PRODUÇÃO (oposta à de Insumos, decisão
  // do dono preservada — mirror EXATO `AppropriationProductionTab.tsx`,
  // TASK-FE-713): `M` divide, `D` multiplica.
  const rawStockQuantity = stockQuery.data ? Number(stockQuery.data.quantity) : null;

  function convertProductionStock(raw: number): number {
    const nativeMeasurementUuid = productOption?.measurement?.value;
    const isNativeMeasurement =
      !selectedMeasurementUuid || selectedMeasurementUuid === nativeMeasurementUuid;
    if (isNativeMeasurement) return raw;

    const factor = productOption?.factor;
    const factorType = productOption?.factorType?.value;
    if (!factor || factor <= 0) return raw;

    if (factorType === 'M') return raw / factor;
    if (factorType === 'D') return raw * factor;
    return raw;
  }

  const stockDisplayValue =
    rawStockQuantity !== null
      ? convertProductionStock(rawStockQuantity).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—';

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`productions.${index}.product_uuid`}
          control={control}
          render={({ field: rowField }) => (
            <SelectAsyncPaginate
              name={rowField.name}
              label={formText.productions.fields.product}
              placeholder={formText.productions.placeholders.product}
              error={rowErrors?.product_uuid?.message as string | undefined}
              service={listProductOptions}
              mapOptions={(item: ProductOption) => ({
                label: item.code ? `${item.code} — ${item.description}` : item.description,
                value: item.uuid,
                measurement: item.measurement
                  ? { label: item.measurement.description, value: item.measurement.uuid }
                  : null,
                measurementSecond: item.measurement_second
                  ? {
                      label: item.measurement_second.description,
                      value: item.measurement_second.uuid,
                    }
                  : null,
                factor: item.factor ?? null,
                factorType: item.factor_type ?? null,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                group_uuid: eligibleGroupUuids ?? [],
              })}
              cacheUniqs={[eligibleGroupUuids?.join(',')]}
              value={rowField.value ?? undefined}
              onChange={(option: any) => {
                rowField.onChange(option ?? null);
                const dedupedMeasurements = Array.from(
                  new Map(
                    [option?.measurement, option?.measurementSecond]
                      .filter((candidate): candidate is Option<string> => Boolean(candidate))
                      .map((candidate) => [candidate.value, candidate])
                  ).values()
                );
                setValue(
                  `productions.${index}.measurement_uuid`,
                  dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                );
              }}
              isRequired
              isDisabled={isDisabled || !eligibleGroupUuids}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`productions.${index}.measurement_uuid`}
          control={control}
          render={({ field: rowField }) => (
            <SelectAsyncPaginate
              name={rowField.name}
              label={formText.productions.fields.measurement}
              placeholder={formText.productions.placeholders.measurement}
              error={rowErrors?.measurement_uuid?.message as string | undefined}
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
          )}
        />

        {/* "Estoque" (R2-06) — READONLY, display-only, NUNCA enviado. */}
        <InputReadOnly label={formText.productions.fields.stock} value={stockDisplayValue} />

        <Controller
          name={`productions.${index}.quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.productions.fields.quantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`productions.${index}.note`}
          control={control}
          render={({ field: rowField }) => (
            <Input
              label={formText.productions.fields.note}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={formText.removeItem}
          mensegerTooltip={formText.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}
