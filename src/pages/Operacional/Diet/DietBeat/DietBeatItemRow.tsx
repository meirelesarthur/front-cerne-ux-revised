// src/pages/Operacional/Diet/DietBeat/DietBeatItemRow.tsx
// -----------------------------------------------------------------------------
// Linha de item DERIVADO da Dieta selecionada (DietBeat — Operacional/
// Pecuária, TASK-FE-DIET-06). Molde EXATO
// `FoodBeat/FoodBeatFormulationItemsEditor.tsx::FoodBeatFormulationItemRow`
// (linha FIXA — o CONJUNTO é determinado pela composição da Dieta
// escolhida, não por ação do usuário; só `stock_id`/`quantity_realized` são
// editáveis pelo usuário).
//
// Cascata `stock_id` → autofill saldo/custo — cache local
// (`Map<uuid, StockListItem>`) populado pela MESMA resposta que alimenta o
// dropdown (`listStocks({ product_uuid })`, SEM MOCK) — mirror EXATO
// `FoodBeatFormulationItemRow::stockCacheRef`.
//
// CV-06 (previsto) = `ingredient.quantity * (produzida/referência)`, `/100`
// quando `Diet.type==='P'` (`arquitetura-frontend-dieta.md §4.3`). CV-07
// (total) = `quantity_realized*cost_value` — preview, servidor recalcula
// (AD-06). `percentage` do payload = `Diet.ingredients[i].quantity` CARREGADO
// como está (mirror `FoodBeatFormulationItemRow`, que também carrega
// `Food.feedstocks[i].percentage` sem recompute). `difference` (CV-09) =
// `|100 - realizado/previsto*100|`.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

import { Box, Flex, Stack } from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { listStocks } from '@/services/v2/Stocks/stock-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { DietBeatItemForm } from '@/@types/v2/DietBeats';
import type { StockListItem } from '@/@types/v2/Stocks';

export interface DietBeatItemsFieldValues {
  items: DietBeatItemForm[];
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface DietBeatItemRowProps {
  control: Control<DietBeatItemsFieldValues>;
  index: number;
  languageGB: LanguageDate;
  disabled: boolean;
  /** Quantidade Produzida desta batida (`DietBeatForm.quantity`, cabeçalho). */
  headerQuantity: number;
  /** Quantidade Referência da Dieta (`Diet.quantity`, cabeçalho da Dieta escolhida). */
  dietReferenceQuantity: number;
  /** `Diet.type` — governa `/100` de CV-06. */
  isPercentageDiet: boolean;
  /** uuid do produto (ingrediente) desta linha — resolve `listStocks({product_uuid})`. */
  ingredientProductUuid: string | null;
}

export function DietBeatItemRow({
  control,
  index,
  languageGB,
  disabled,
  headerQuantity,
  dietReferenceQuantity,
  isPercentageDiet,
  ingredientProductUuid,
}: DietBeatItemRowProps) {
  const text = languageGB.dietBeats.dietBeat.form.fields.item;

  // Cache local (`uuid` -> registro completo do `StockListItem`) alimentado
  // pela MESMA resposta que popula o dropdown — mirror
  // `FoodBeatFormulationItemRow`.
  const stockCacheRef = useRef(new Map<string, StockListItem>());

  const listRowStocks = useCallback(
    async (params: PaginationQueryParams & { search?: string }) => {
      const response = await listStocks({
        ...params,
        product_uuid: ingredientProductUuid ?? undefined,
      });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [ingredientProductUuid]
  );

  const { field: stockField, fieldState: stockFieldState } = useController({
    control,
    name: `items.${index}.stock_id`,
  });
  const { field: productLabelField } = useController({
    control,
    name: `items.${index}.product_label`,
  });
  const { field: measurementLabelField } = useController({
    control,
    name: `items.${index}.measurement_label`,
  });
  const { field: dryMatterField } = useController({
    control,
    name: `items.${index}.dry_matter`,
  });
  const { field: costValueField } = useController({
    control,
    name: `items.${index}.cost_value`,
  });
  const { field: percentageField } = useController({
    control,
    name: `items.${index}.percentage`,
  });
  const { field: quantityField } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: differenceField } = useController({
    control,
    name: `items.${index}.difference`,
  });
  const { field: quantityRealizedField, fieldState: quantityRealizedFieldState } = useController({
    control,
    name: `items.${index}.quantity_realized`,
  });

  const [stockAvailable, setStockAvailable] = useState(0);
  const costValue = Number(costValueField.value) || 0;
  const quantityRealized = Number(quantityRealizedField.value) || 0;
  const percentage = Number(percentageField.value) || 0;

  // CV-06 — previsto, `/100` quando a Dieta é percentual.
  const rawPredicted =
    dietReferenceQuantity > 0 ? percentage * (headerQuantity / dietReferenceQuantity) : 0;
  const predictedQuantity = isPercentageDiet ? rawPredicted / 100 : rawPredicted;
  const roundedPredicted = roundTo2(predictedQuantity);

  // CV-09 — diferença (`|100 - realizado/previsto*100|`).
  const difference =
    roundedPredicted !== 0 ? Math.abs(100 - (quantityRealized / roundedPredicted) * 100) : 0;
  const roundedDifference = roundTo2(difference);

  // CV-07 — total, preview client-side (servidor recalcula, AD-06).
  const total = quantityRealized * costValue;
  const roundedTotal = roundTo2(total);

  // Sincroniza os campos DERIVADOS de volta ao RHF — só escreve quando o
  // valor de fato mudou (evita loop de re-render, mirror
  // `FoodBeatFormulationItemRow`).
  useEffect(() => {
    if (Number(quantityField.value) !== roundedPredicted) {
      quantityField.onChange(roundedPredicted);
    }
  }, [roundedPredicted]);

  useEffect(() => {
    if (Number(differenceField.value) !== roundedDifference) {
      differenceField.onChange(roundedDifference);
    }
  }, [roundedDifference]);

  function handleStockChange(option: Option<string> | null) {
    stockField.onChange(option ?? null);
    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    setStockAvailable(stock?.quantity ?? 0);
    costValueField.onChange(stock?.average_cost ?? 0);
  }

  function handleQuantityRealizedBlur() {
    const value = Number(quantityRealizedField.value) || 0;
    if (value > stockAvailable) {
      quantityRealizedField.onChange('');
      toaster.error({
        title: languageGB.dietBeats.dietBeat.singularLabel,
        description: text.insufficientStock,
      });
    }
  }

  return (
    <Stack gap={3}>
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="2" minW="260px">
          <InputReadOnly
            name={productLabelField.name}
            label={text.product}
            value={productLabelField.value || '—'}
          />
        </Box>

        <Box flex="1" minW="220px">
          <SelectAsyncPaginate
            name={stockField.name}
            label={text.stock}
            service={listRowStocks}
            mapOptions={(item: StockListItem) => ({
              label: item.warehouse.description,
              value: item.uuid,
            })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={stockField.value ?? undefined}
            onChange={handleStockChange as any}
            error={stockFieldState.error?.message}
            isRequired
            isDisabled={disabled || !ingredientProductUuid}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name="stockAvailable"
            label={text.stockAvailable}
            value={formatNumber(stockAvailable)}
          />
        </Box>

        <Box w={{ base: 'full', sm: '150px' }}>
          <InputReadOnly
            name={measurementLabelField.name}
            label={text.measurement}
            value={measurementLabelField.value || '—'}
          />
        </Box>
      </Flex>

      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box w={{ base: 'full', sm: '120px' }}>
          <InputReadOnly
            name={dryMatterField.name}
            label={text.dryMatter}
            value={formatNumber(Number(dryMatterField.value) || 0)}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={costValueField.name}
            label={text.costValue}
            value={formatNumber(costValue)}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={quantityField.name}
            label={text.quantityPlanned}
            value={formatNumber(roundedPredicted)}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <NumberInput
            name={quantityRealizedField.name}
            label={text.quantityRealized}
            allowDot
            decimalPlaces={2}
            min={0}
            value={quantityRealized}
            onValueChange={(value) => quantityRealizedField.onChange(value ?? 0)}
            onBlur={handleQuantityRealizedBlur}
            disabled={disabled}
            error={quantityRealizedFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '120px' }}>
          <InputReadOnly
            name={differenceField.name}
            label={text.difference}
            value={`${formatNumber(roundedDifference)}%`}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly name="total" label={text.total} value={formatNumber(roundedTotal)} />
        </Box>
      </Flex>
    </Stack>
  );
}
