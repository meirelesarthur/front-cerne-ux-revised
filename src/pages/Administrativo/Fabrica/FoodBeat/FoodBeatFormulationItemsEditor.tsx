// src/pages/Administrativo/Fabrica/FoodBeat/FoodBeatFormulationItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de composição do ramo FORMULAÇÃO da Batida (FoodBeat — Fábrica,
// TASK-FB-FE-04). Consumido pelo formulário completo create/edit
// (`TASK-FB-FE-06`, campo `formulationItems` de `FoodBeatForm`).
//
// UX-GAP confirmado (ver ficha) — nenhuma página Batida/FoodBeat em
// `GB.Cerne.UX/src/pages`. Referência de ESTILO: `AllocationEditor.tsx`/
// `RepeaterList.tsx` (`ux_root`, genéricos) + precedentes REAIS
// (`frontend_root`): `FoodFeedstocksEditor.tsx` (mesmo domínio Fábrica,
// mirror mais próximo) e `MovementAllocationEditor.tsx` — adaptação, não
// cópia (Chakra v3 local).
//
// Decisão estrutural (mirror os 2 precedentes): NÃO instancia seu próprio
// `useFieldArray` — `fields` chega via props, o `useFieldArray({ name:
// 'formulationItems' })` vive no formulário PAI (`TASK-FB-FE-06`).
//
// `append`/`remove` PERMANECEM na assinatura de props (contrato exato da
// ficha, mirror estrutural dos 2 precedentes) mas NÃO são acionados por
// nenhuma UI deste componente: cada linha corresponde 1:1 a uma matéria-prima
// FIXA de `Food.feedstocks[]` (Doc Bruta `§12.2`: `feedstock_product_id`
// "somente leitura de fato", NUNCA Select) — o CONJUNTO de linhas é
// determinado pela composição da Ração escolhida, não por ação do usuário
// dentro deste editor. Quem popula/reconstrói `formulationItems` ao trocar a
// Ração é o formulário PAI (`TASK-FB-FE-06`, via `replace`/`reset` do próprio
// `useFieldArray`), não este componente — inventar um botão "Adicionar"
// aqui, sem saber qual matéria-prima nova associar, seria UI sem contrato
// (Doc Bruta não documenta essa ação para o ramo Formulação).
//
// `feedstockProductUuids` — prop ADICIONAL por linha (alinhada por índice a
// `fields`/`Food.feedstocks[]`), resolvida pelo formulário PAI ao carregar a
// Ração via `getFood(uuid)` (ver "Leitura do dev" da ficha, item 1). Cada
// linha usa o próprio uuid para filtrar `listStocks({ product_uuid })` —
// nunca lista o catálogo inteiro de estoques.
//
// Autofill `stock_quantity`/`feedstock_amount` ao selecionar `stock_id`: como
// `SelectAsyncPaginate`/`mapOptions` só devolve `{label, value}` (não o
// registro completo do `StockListItem`), cada linha mantém um cache local
// (`Map<uuid, StockListItem>`) populado pela PRÓPRIA função `service` que
// alimenta o Select — dado 100% real (mesma resposta de rede já usada para
// preencher o dropdown), não um endpoint novo nem mock. `DA-FB-08` (round-
// trip): o valor capturado no momento da seleção NUNCA é recalculado depois.
//
// `feedstock_quantity`/`feedstock_difference`/`feedstock_total` — calculados
// via `useWatch` + sincronizados de volta ao campo RHF correspondente via
// `useEffect` (guardado por comparação de valor, evita loop de re-render;
// mesmo racional do `useEffect` de `onTotalChange` em `FoodFeedstocksEditor`).
// `feedstock_total`/`feedstock_amount`/`percentage`/`feedstock_quantity_realized`
// são os 4 campos que `TASK-FB-FE-06` extrai para `FoodBeatFormulationItemPayload`
// (`stock_uuid`/`quantity_realized`/`percentage`/`amount`/`total`) — por isso
// precisam estar SEMPRE sincronizados no estado RHF, não só exibidos.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef } from 'react';

import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
} from 'react-hook-form';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { listStocks } from '@/services/v2/Stocks/stock-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { FoodBeatForm, FoodBeatFormulationItemForm } from '@/@types/v2/FoodBeats';
import type { StockListItem } from '@/@types/v2/Stocks';

// Shape concreto mínimo que este componente precisa do formulário pai —
// mirror `AllocationsFieldValues`/`FeedstocksFieldValues`.
export interface FormulationItemsFieldValues {
  formulationItems: FoodBeatFormulationItemForm[];
}

export interface FoodBeatFormulationItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`FoodBeatForm`, TASK-FB-FE-06). */
  control: Control<FoodBeatForm>;
  /** `fields` do `useFieldArray({ control, name: 'formulationItems' })` do PAI. */
  fields: FieldArrayWithId<FormulationItemsFieldValues, 'formulationItems', 'id'>[];
  /** Mantido no contrato de props (mirror estrutural) — não usado dentro deste editor, ver cabeçalho do arquivo. */
  append: UseFieldArrayAppend<FormulationItemsFieldValues, 'formulationItems'>;
  /** Mantido no contrato de props (mirror estrutural) — não usado dentro deste editor, ver cabeçalho do arquivo. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<FoodBeatForm>;
  languageGB: LanguageDate;
  /** Gate de permissão/trava de edição do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
  /** `FoodBeatForm.quantity` do cabeçalho (Quantidade Produzida desta batida). */
  headerQuantity: number;
  /** `FoodBeatForm.product_quantity` — quantidade padrão de produção da Ração (`Food.quantity`). */
  headerProductQuantity: number;
  /** uuid do produto (matéria-prima) de CADA linha, alinhado por índice com
   *  `fields`/`Food.feedstocks[]` — resolvido pelo formulário PAI ao carregar
   *  a Ração via `getFood` (TASK-FB-FE-06). `null` enquanto a Ração ainda não
   *  resolveu (trava o Select da linha em loading). */
  feedstockProductUuids: (string | null)[];
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface FoodBeatFormulationItemRowProps {
  control: Control<FormulationItemsFieldValues>;
  index: number;
  languageGB: LanguageDate;
  disabled: boolean;
  headerQuantity: number;
  headerProductQuantity: number;
  feedstockProductUuid: string | null;
}

function FoodBeatFormulationItemRow({
  control,
  index,
  languageGB,
  disabled,
  headerQuantity,
  headerProductQuantity,
  feedstockProductUuid,
}: FoodBeatFormulationItemRowProps) {
  const text = languageGB.foodBeats.foodBeat.form.fields.formulationItem;

  // Cache local (`uuid` -> registro completo do `StockListItem`) alimentado
  // pela MESMA resposta que popula o dropdown — ver cabeçalho do arquivo.
  const stockCacheRef = useRef(new Map<string, StockListItem>());

  const listRowStocks = useCallback(
    async (params: PaginationQueryParams & { search?: string }) => {
      const response = await listStocks({
        ...params,
        product_uuid: feedstockProductUuid ?? undefined,
      });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [feedstockProductUuid]
  );

  const { field: stockField, fieldState: stockFieldState } = useController({
    control,
    name: `formulationItems.${index}.stock_id`,
  });
  const { field: productLabelField } = useController({
    control,
    name: `formulationItems.${index}.feedstock_product_id`,
  });
  const { field: percentageField } = useController({
    control,
    name: `formulationItems.${index}.percentage`,
  });
  const { field: stockQuantityField } = useController({
    control,
    name: `formulationItems.${index}.stock_quantity`,
  });
  const { field: amountField } = useController({
    control,
    name: `formulationItems.${index}.feedstock_amount`,
  });
  const { field: quantityRealizedField, fieldState: quantityRealizedFieldState } = useController({
    control,
    name: `formulationItems.${index}.feedstock_quantity_realized`,
  });
  const { field: quantityField } = useController({
    control,
    name: `formulationItems.${index}.feedstock_quantity`,
  });
  const { field: differenceField } = useController({
    control,
    name: `formulationItems.${index}.feedstock_difference`,
  });
  const { field: totalField } = useController({
    control,
    name: `formulationItems.${index}.feedstock_total`,
  });

  const stockQuantity = Number(stockQuantityField.value) || 0;
  const amount = Number(amountField.value) || 0;
  const quantityRealized = Number(quantityRealizedField.value) || 0;
  const percentage = Number(percentageField.value) || 0;

  // Quantidade Prevista — mirror `_forms.blade.php:404-432`.
  const predictedQuantity =
    headerProductQuantity > 0 ? percentage * (headerQuantity / headerProductQuantity) : 0;
  const roundedPredicted = roundTo2(predictedQuantity);

  const difference =
    roundedPredicted !== 0 ? ((quantityRealized - roundedPredicted) / roundedPredicted) * 100 : 0;
  const roundedDifference = roundTo2(difference);

  const total = quantityRealized * amount;
  const roundedTotal = roundTo2(total);

  // Sincroniza os 3 campos DERIVADOS de volta ao RHF (necessário —
  // `feedstock_total` é extraído por `TASK-FB-FE-06` para o payload) — só
  // escreve quando o valor de fato mudou, evita loop de re-render (ver
  // cabeçalho do arquivo).
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

  useEffect(() => {
    if (Number(totalField.value) !== roundedTotal) {
      totalField.onChange(roundedTotal);
    }
  }, [roundedTotal]);

  function handleStockChange(option: Option<string> | null) {
    stockField.onChange(option ?? null);
    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    // `DA-FB-08` — captura o valor do stock ESCOLHIDO agora, via `onChange`
    // direto (nunca `useEffect` solto), re-hidratando mesmo se o usuário já
    // tinha editado `feedstock_quantity_realized` antes (Riscos da ficha).
    stockQuantityField.onChange(stock?.quantity ?? 0);
    amountField.onChange(stock?.average_cost ?? 0);
  }

  function handleQuantityRealizedBlur() {
    const value = Number(quantityRealizedField.value) || 0;
    if (value > stockQuantity) {
      quantityRealizedField.onChange('');
      toaster.error({
        title: languageGB.foodBeats.foodBeat.singularLabel,
        description: text.insufficientStock,
      });
    }
  }

  return (
    // TASK-FB-FE-11/12 (homologação, Opção A confirmada pelo dono): 2 linhas
    // por card — LINHA 1 = identificação (Armazém/Matéria-Prima/Estoque/%),
    // LINHA 2 = quantidades/valores (Prevista/Realizada/Diferença/Vl.
    // Unitário/Vl. Total). Só reagrupamento visual — nenhuma prop/lógica de
    // campo mudou (handleStockChange, cálculos derivados, error, isDisabled,
    // etc. permanecem exatamente onde estavam).
    <Stack gap={3}>
      <Flex gap={3} align="flex-start" wrap="wrap">
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
            isDisabled={disabled || !feedstockProductUuid}
          />
        </Box>

        <Box flex="2" minW="260px">
          <InputReadOnly
            name={productLabelField.name}
            label={text.feedstock}
            value={productLabelField.value || '—'}
            // Ajuste de homologação (TASK-FB-FE-11): mesmo `fontSize` do texto
            // do select "Armazém" (`SelectAsyncPaginate` → `customStyles.singleValue`
            // → `fontSizes.md`, ver `src/styles/components/SelectComponent.ts`).
            // Antes, este campo herdava o fontSize default (maior) e nomes
            // longos de matéria-prima ultrapassavam a borda do input.
            // TASK-FB-FE-12: campo alargado (`flex="2"`/`minW="260px"`, vs.
            // `flex="1"` dos demais da linha) para caber nomes longos sem
            // estourar a borda — combinado com o `fontSize` acima.
            fontSize="md"
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={stockQuantityField.name}
            label={text.stockAvailable}
            value={formatNumber(stockQuantity)}
          />
        </Box>

        <Box w={{ base: 'full', sm: '120px' }}>
          <InputReadOnly
            name={percentageField.name}
            label={text.percentage}
            value={formatNumber(percentage)}
          />
        </Box>
      </Flex>

      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={quantityField.name}
            label={text.quantityPredicted}
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
          <InputReadOnly name={amountField.name} label={text.amount} value={formatNumber(amount)} />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={totalField.name}
            label={text.total}
            value={formatNumber(roundedTotal)}
          />
        </Box>
      </Flex>
    </Stack>
  );
}

export function FoodBeatFormulationItemsEditor({
  control,
  fields,
  errors,
  languageGB,
  disabled = false,
  headerQuantity,
  headerProductQuantity,
  feedstockProductUuids,
}: FoodBeatFormulationItemsEditorProps) {
  const text = languageGB.foodBeats.foodBeat.form.fields.formulationItem;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `FoodFeedstocksEditor::genericControl`.
  const genericControl = control as unknown as Control<FormulationItemsFieldValues>;

  // Erro de nível de ARRAY (`.min(1)` do Yup, quando `type==='F'`).
  const arrayError = (errors as any)?.formulationItems?.message as string | undefined;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {arrayError && fields.length > 0 && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4}>
          {fields.map((field, index) => (
            <FoodBeatFormulationItemRow
              key={field.id}
              control={genericControl}
              index={index}
              languageGB={languageGB}
              disabled={disabled}
              headerQuantity={headerQuantity}
              headerProductQuantity={headerProductQuantity}
              feedstockProductUuid={feedstockProductUuids[index] ?? null}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
}

export default FoodBeatFormulationItemsEditor;
