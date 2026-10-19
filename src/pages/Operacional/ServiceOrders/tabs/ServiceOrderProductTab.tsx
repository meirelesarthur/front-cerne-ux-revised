// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderProductTab.tsx
// -----------------------------------------------------------------------------
// Aba "Insumos" — exec-038 HOMOLOG R2 (R2-05, REWORK completo pós-E2E do
// dono, fiel ao legado `_product.blade.php` + mirror
// `Appropriations/tabs/AppropriationStockTab.tsx`, citado pelo dono como
// referência do padrão "armazém-para-o-bloco + itens").
//
// MUDANÇA DE FORMA (substitui a v1, TASK-FE-2005): `warehouse_uuid` deixa de
// ser um campo POR LINHA (`useFieldArray`) e passa a ser um campo de
// CABEÇALHO DA ABA (`products_warehouse_uuid`, fora do array, mirror
// `warehouse_production_uuid` de `AppropriationProductionTab.tsx`) — 1
// Armazém para TODOS os itens do bloco, exatamente como o legado
// (`_product.blade.php:5-13`, `warehouse_id` é campo único do painel, não da
// linha `_card_product.blade.php`).
//
// "Produto" (rótulo do Select, mirror `_card_product.blade.php:7`
// `@lang('trad.prod_produto')`) passa a ser `listStockAvailableOptions`
// (`GET /stocks/available-options?warehouse_uuid=<bloco>&allow_pointing=true`
// — execução 086: mesmo Resource/params de `/stocks/available`, mas gateado
// por `service-orders_create|edit`, não `stocks_view`; mirror
// legado SEMPRE `allow_pointing=1`) — CADA option já é um `Stock` físico
// (`StockAvailabilityResource` ganhou `uuid` próprio do registro nesta
// mesma execução), então o `value` da option JÁ É o `stock_uuid` do
// payload — sem round-trip extra por `listStocks` (o `GAP RESIDUAL` da v1
// deixou de existir: o catálogo do bloco filtra por Armazém E o item
// escolhido já carrega `stock_uuid` certo).
//
// "Un. Medida" — Select LOCAL derivado das 1-2 unidades embutidas na option
// do Produto (`measurement`/`measurementSecond`), mirror EXATO
// `AppropriationStockTab.tsx` (dedupe por uuid, auto-seleciona quando resta
// 1 única opção).
//
// "Estoque" — `InputReadOnly`, saldo do item (`quantity` embutida na
// option), com a MESMA conversão por fator (`factor`/`factor_type`, direção
// INSUMOS: `M` multiplica, `D` divide — mirror `AppropriationStockTab.tsx`,
// TASK-FE-714) quando a Un. Medida escolhida é a secundária do produto.
//
// "Qtd/ha" (`quantity`) × "Qtd Total" (`total_quantity`) — BIDIRECIONAL,
// fiel ao `main.js`/`_product.blade.php:44-126` do legado: "Qtd Total" =
// "Qtd/ha" × ÁREA PRODUTIVA da Área escolhida no cabeçalho da OS (seção
// "Execução", `area_uuid` — `productive_area` embutida na option pela
// exec-038 HOMOLOG R2, `ServiceOrderHeaderFields.tsx`). Editar QUALQUER um
// dos dois recalcula o outro (mirror os 2 handlers `blur` do legado —
// `product-quantity`/`product-total-quantity` — que se retroalimentam).
// Área não selecionada (`productive_area` ausente/0) — PRESERVE sem dividir
// por zero: o cálculo trata a área como 0 (mirror `totalArea > 0 ? total /
// totalArea : total` do legado, linha 97).
//
// VALIDAÇÃO (mirror `_product.blade.php:66-88`, 2 avisos independentes):
//   1. "Qtd Total" > estoque do item → `ServiceOrderStockExceedsWarningDialog`
//      (mirror texto/swal do legado) + ZERA "Qtd/ha" E "Qtd Total" desta
//      linha (o legado zera o campo editado e, por recalcular o outro a
//      partir de 0, os dois ficam 0 — replicado aqui explicitamente para não
//      depender de ordem de effects).
//   2. (Estoque − Qtd Total) < `min_stock` (e ≥ 0) →
//      `ServiceOrderBelowMinStockWarningDialog`, SEM zerar nada (só avisa).
//
// Payload (`ServiceOrderProductItemPayload`, INALTERADO) — `stock_uuid`+
// `measurement_uuid`+`quantity`+`total_quantity`; `products_warehouse_uuid`
// é 100% UI (filtro do catálogo do bloco), nunca vai ao payload
// (`CreateOrUpdateServiceOrder.tsx`).
//
// R2-02 — "Confirmado" (`is_checked`) REMOVIDO do form (backend mantém a
// coluna com default; o dado de tela nunca chega a existir nesta aba).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listStockAvailableOptions } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { ServiceOrderForm } from '@/@types/v2/ServiceOrders';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { ServiceOrderBelowMinStockWarningDialog } from './ServiceOrderBelowMinStockWarningDialog';
import { ServiceOrderStockExceedsWarningDialog } from './ServiceOrderStockExceedsWarningDialog';

import { computeQuantityPerArea, computeTotalQuantity } from '../service-order-product-quantity';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ServiceOrderProductTabProps {
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  watch: UseFormWatch<ServiceOrderForm>;
  setValue: UseFormSetValue<ServiceOrderForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function ServiceOrderProductTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
}: ServiceOrderProductTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  const isDisabled = !canSave || isLoading;

  // R2-05 — aviso "Qtd Total > estoque" (zera a linha) e "estoque abaixo do
  // mínimo" (só avisa) — mirror `AppropriationStockTab.tsx`/
  // `StockQuantityExceedsWarningDialog.tsx`, 2 modais independentes (o
  // legado dispara os 2 `swal` em sequência, nunca 1 substituindo o outro).
  const [stockWarning, setStockWarning] = useState<{
    informedQuantity: number;
    productiveArea: number;
    stockQuantity: number;
  } | null>(null);
  const [belowMinStockWarning, setBelowMinStockWarning] = useState(false);

  function handleAdd() {
    append({
      stock_uuid: null,
      measurement_uuid: null,
      quantity: null,
      total_quantity: null,
      note: null,
      is_checked: false,
    });
  }

  // Área produtiva (Execução → `area_uuid`, embutida na option — ver
  // `ServiceOrderHeaderFields.tsx`) — usada por TODAS as linhas do bloco,
  // mirror `used_area` de Apontamentos (aqui é derivada da Área, não um
  // campo próprio da OS).
  const areaOption = watch('area_uuid') as (Option<string> & { productive_area?: number }) | null;
  const productiveArea = Number(areaOption?.productive_area) || 0;

  function handleQuantityBlur(index: number) {
    const total = computeTotalQuantity(watch(`products.${index}.quantity`), productiveArea);
    checkStockLimits(index, total);
  }

  function handleTotalQuantityBlur(index: number) {
    const total = Number(watch(`products.${index}.total_quantity`)) || 0;
    checkStockLimits(index, total);
  }

  function checkStockLimits(index: number, total: number) {
    const stockOption = watch(`products.${index}.stock_uuid`) as
      (Option<string> & { quantity?: number; minStock?: number | null }) | null | undefined;
    if (stockOption?.quantity === undefined) return;

    const stockQuantity = Number(stockOption.quantity);
    const minStock = stockOption.minStock ?? null;

    if (total > stockQuantity) {
      setStockWarning({ informedQuantity: total, productiveArea, stockQuantity });
      // Mirror legado — zera os 2 campos da linha (o editado E o
      // derivado), sem depender de ordem de effects.
      setValue(`products.${index}.quantity`, 0);
      setValue(`products.${index}.total_quantity`, 0);
      return;
    }

    if (minStock !== null && stockQuantity - total < minStock && stockQuantity - total >= 0) {
      setBelowMinStockWarning(true);
    }
  }

  return (
    <Box pt={4}>
      {/* "Armazém de insumos" — campo ÚNICO de cabeçalho da aba (R2-05,
          mirror `warehouse_production_uuid` de Apontamentos), NÃO item de
          `products[]`/`useFieldArray`; fora do payload. */}
      <SimpleGrid columns={columnsForm.default} gap={4} mb={5}>
        <Controller
          name="products_warehouse_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.products.fields.warehouse}
              placeholder={formText.products.placeholders.warehouse}
              service={listWarehouseOptions}
              mapOptions={(item: WarehouseOption) => ({
                label: `${item.initials} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                // Mirror TASK-FE-611/AP-08 (`type: 'insumos'`) — só Armazéns
                // de Insumos aparecem aqui.
                type: 'insumos',
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // Trocar o Armazém do BLOCO limpa o "Produto"/"Un. Medida"
                // de TODAS as linhas (o catálogo mudou por completo) —
                // mirror cascata Armazém→Produto por linha de
                // `AppropriationStockTab.tsx`, só que aplicada ao bloco.
                fields.forEach((_, index) => {
                  setValue(`products.${index}.stock_uuid`, null);
                  setValue(`products.${index}.measurement_uuid`, null);
                });
              }}
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
            <ProductItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              productiveArea={productiveArea}
              onQuantityBlur={() => handleQuantityBlur(index)}
              onTotalQuantityBlur={() => handleTotalQuantityBlur(index)}
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

      <ServiceOrderStockExceedsWarningDialog
        isOpen={!!stockWarning}
        onClose={() => setStockWarning(null)}
        informedQuantity={stockWarning?.informedQuantity ?? 0}
        productiveArea={stockWarning?.productiveArea ?? 0}
        stockQuantity={stockWarning?.stockQuantity ?? 0}
      />
      <ServiceOrderBelowMinStockWarningDialog
        isOpen={belowMinStockWarning}
        onClose={() => setBelowMinStockWarning(false)}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (mirror `StockItemRow` de
// `AppropriationStockTab.tsx`): necessário para o `useEffect`/`useRef` do
// cálculo bidirecional Qtd/ha↔Qtd Total sem violar Rules of Hooks dentro do
// `.map()` de `useFieldArray`.
// -----------------------------------------------------------------------------

interface ProductItemRowProps {
  index: number;
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  watch: UseFormWatch<ServiceOrderForm>;
  setValue: UseFormSetValue<ServiceOrderForm>;
  isDisabled: boolean;
  productiveArea: number;
  onQuantityBlur: () => void;
  onTotalQuantityBlur: () => void;
  onRemove: () => void;
}

function ProductItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  productiveArea,
  onQuantityBlur,
  onTotalQuantityBlur,
  onRemove,
}: ProductItemRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const rowErrors = errors.products?.[index];
  const warehouseUuid = (watch('products_warehouse_uuid') as Option<string> | null)?.value;

  const stockOption = watch(`products.${index}.stock_uuid`) as
    | (Option<string> & {
        quantity?: number;
        minStock?: number | null;
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: 'M' | 'D' | null;
      })
    | null
    | undefined;
  const selectedMeasurementUuid = (
    watch(`products.${index}.measurement_uuid`) as Option<string> | null | undefined
  )?.value;

  // Cálculo BIDIRECIONAL "Qtd/ha" ↔ "Qtd Total" (R2-05, mirror
  // `_product.blade.php:44-126`) — cada campo, ao ser editado, recalcula o
  // OUTRO com base na área produtiva; sem dividir por zero quando a Área
  // não está selecionada (`productiveArea === 0`).
  const quantity = watch(`products.${index}.quantity`);
  const totalQuantity = watch(`products.${index}.total_quantity`);

  const lastEditedRef = useRef<'quantity' | 'total_quantity' | null>(null);
  // Última entrada vista pelo efeito: só recalcula quando Qtd/ha ou a Área
  // MUDAM de verdade. Linha hidratada no edit (valores já salvos, nada digitado)
  // nunca é recalculada na montagem — nem no double-invoke do StrictMode.
  const previousInputsRef = useRef({ quantity, productiveArea });

  useEffect(() => {
    const previous = previousInputsRef.current;
    if (previous.quantity === quantity && previous.productiveArea === productiveArea) return;
    previousInputsRef.current = { quantity, productiveArea };
    if (lastEditedRef.current === 'total_quantity') return;
    setValue(`products.${index}.total_quantity`, computeTotalQuantity(quantity, productiveArea), {
      shouldValidate: false,
    });
  }, [quantity, productiveArea, index, setValue]);

  useEffect(() => {
    if (lastEditedRef.current !== 'total_quantity') return;
    setValue(`products.${index}.quantity`, computeQuantityPerArea(totalQuantity, productiveArea), {
      shouldValidate: false,
    });
  }, [totalQuantity, productiveArea, index, setValue]);

  // "Estoque" — conversão por fator (direção INSUMOS: `M` multiplica, `D`
  // divide), mirror EXATO `AppropriationStockTab.tsx` (TASK-FE-714).
  const rawStockQuantity =
    stockOption?.quantity !== undefined ? Number(stockOption.quantity) : null;

  const convertInsumoStock = (raw: number): number => {
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
  };

  const stockDisplayValue =
    rawStockQuantity !== null
      ? convertInsumoStock(rawStockQuantity).toLocaleString('pt-BR', {
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

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        {/* "Produto" (R2-05) — catálogo `listStockAvailableOptions`, escopado
            pelo Armazém do BLOCO; `value` da option JÁ É o `stock_uuid`
            (`StockAvailabilityResource.uuid`, exec-038 HOMOLOG R2). */}
        <Controller
          name={`products.${index}.stock_uuid`}
          control={control}
          render={({ field: rowField }) => (
            <SelectAsyncPaginate
              name={rowField.name}
              label={formText.products.fields.product}
              placeholder={formText.products.placeholders.product}
              error={rowErrors?.stock_uuid?.message as string | undefined}
              service={listStockAvailableOptions}
              mapOptions={(item: StockAvailabilityItem) => ({
                label: item.lot
                  ? `${item.product.description} — ${item.lot}`
                  : item.product.description,
                value: item.uuid,
                quantity: item.quantity,
                minStock: item.min_stock,
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
                warehouse_uuid: warehouseUuid,
                // Mirror `_product.blade.php` — Insumos SEMPRE envia
                // `allow_pointing=1` (anti-regressão GAP-BE-632 opção b).
                allow_pointing: true,
              })}
              cacheUniqs={[warehouseUuid]}
              value={rowField.value ?? undefined}
              onChange={(option: any) => {
                rowField.onChange(option ?? null);
                // Cascata (mirror `AppropriationStockTab.tsx`, TASK-FE-663) —
                // dedupe por uuid: 1 opção após dedupe auto-seleciona, 2
                // distintas ficam vazias para escolha manual.
                const dedupedMeasurements = Array.from(
                  new Map(
                    [option?.measurement, option?.measurementSecond]
                      .filter((candidate): candidate is Option<string> => Boolean(candidate))
                      .map((candidate) => [candidate.value, candidate])
                  ).values()
                );
                setValue(
                  `products.${index}.measurement_uuid`,
                  dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                );
              }}
              isRequired
              // Gate de sequência — "Produto" só habilita depois do Armazém
              // do BLOCO ser escolhido (mirror legado, painel inteiro
              // readonly sem Armazém).
              isDisabled={isDisabled || !warehouseUuid}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`products.${index}.measurement_uuid`}
          control={control}
          render={({ field: rowField }) => (
            <Select
              name={rowField.name}
              label={formText.products.fields.measurement}
              placeholder={formText.products.placeholders.measurement}
              value={rowField.value ?? null}
              onChange={(option) => rowField.onChange(option ?? null)}
              options={measurementOptions}
              noClearable
              isDisabled={isDisabled || measurementOptions.length <= 1}
            />
          )}
        />

        {/* "Estoque" (R2-05) — READONLY, saldo do item escolhido. */}
        <InputReadOnly label={formText.products.fields.stock} value={stockDisplayValue} />

        <Controller
          name={`products.${index}.quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.products.fields.quantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => {
                lastEditedRef.current = 'quantity';
                rowField.onChange(value);
              }}
              onBlur={onQuantityBlur}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`products.${index}.total_quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.products.fields.totalQuantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => {
                lastEditedRef.current = 'total_quantity';
                rowField.onChange(value);
              }}
              onBlur={onTotalQuantityBlur}
              error={rowErrors?.total_quantity?.message as string | undefined}
              isRequired
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
