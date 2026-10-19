// src/pages/Administrativo/Fabrica/FoodFeedstocksEditor.tsx
// -----------------------------------------------------------------------------
// Repeater da COMPOSIÇÃO (matérias-primas) do módulo "Formulação" (Food —
// Fábrica/Ração, TASK-FOOD-FE-04). Consumido pelo formulário completo
// create/edit (`TASK-FOOD-FE-06`, campo `feedstocks` de `FoodForm`).
//
// UX-GAP confirmado (ver ficha) — nenhuma tela Food em `GB.Cerne.UX/src/pages`.
// Referência de ESTILO: `AllocationEditor.tsx`/`RepeaterList.tsx` (`ux_root`,
// genéricos) + precedente REAL `MovementAllocationEditor.tsx` (`frontend_root`,
// TASK-MV-FE-03) — adaptação, não cópia (Chakra v3 local).
//
// Decisão estrutural (mirror `MovementAllocationEditor`): NÃO instancia seu
// próprio `useFieldArray` — `fields`/`append`/`remove` chegam via props, o
// `useFieldArray({ name: 'feedstocks' })` vive no formulário PAI
// (`TASK-FOOD-FE-06`).
//
// SEM bug legado (Doc Bruta Food, item 12/`$('body').on('change', '.product',
// ...)`): nenhum handler global por seletor de classe — cada linha isolada
// por `index` do `useFieldArray`, via subcomponente `FoodFeedstockRow`
// (necessário porque cada linha dispara o PRÓPRIO `useProductMeasurementOptions`
// — hooks não podem ser chamados dentro de um `.map()` sem estar dentro de um
// componente React próprio).
//
// Rótulo de `percentage`/`total` muda por `type` (P/U) — mirror
// `_forms.blade.php:146-156`:
//   - `type==='P'` → "Quantidade (%)" (linha) / "Total (%)" (rodapé), input
//     `PercentInput` (mesma mecânica já usada em `MovementAllocationEditor`
//     para percentual de linha).
//   - `type==='U'` → "Quantidade" / "Total", input `NumberInput`
//     (`allowDot`, sem prefixo/sufixo — este NÃO é um valor monetário; a
//     ficha original citava `MoneyInput` por mirror superficial de
//     `MovementAllocationEditor`, mas ali o campo É dinheiro (`value` em
//     R$) — aqui é percentual OU quantidade fixa, nunca R$. Correção
//     documentada, não escolhida em silêncio: `PercentInput`/`NumberInput`
//     são os componentes fiéis ao dado real, mesmo racional de
//     `MovementAllocationEditor`'s `PercentInput` para a coluna de %).
//
// Total é 100% client-side/cosmético (`useWatch`), NUNCA chega ao payload
// (mirror `MovementAllocationEditor`). Exposto ao formulário PAI via
// `onTotalChange` (callback) — a trava real de DESABILITAR o "Salvar" fica
// no formulário pai (`TASK-FOOD-FE-06`), não aqui; este componente só exibe
// o `Alert` de aviso quando `type==='P'` e a soma diverge de 100
// (divergência documentada do padrão geral "nunca bloqueia" — já registrada
// em `TASK-FOOD-FE-02`/Decisão 4 do `Food-contrato.md`).
//
// Cascata Produto→Unidade: ao trocar a matéria-prima de UMA linha, a unidade
// selecionada daquela mesma linha é limpa (`measurements: null`) — evita
// manter uma unidade que pertencia ao produto anterior (Doc Bruta Food regra
// 12: "a lista de opções... é RECONSTRUÍDA" ao trocar o produto; mirror do
// efeito observável do legado, não um bug novo introduzido aqui).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Alert, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { FOOD_TYPE } from '@/constants/foods/food-type';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { LanguageDate } from '@/@types/language';
import type { FoodFeedstockItemForm, FoodForm, FoodType } from '@/@types/v2/Foods';

import { useProductMeasurementOptions } from './useProductMeasurementOptions';

// Shape concreto mínimo que este componente precisa do formulário pai —
// mirror `AllocationsFieldValues` de `MovementAllocationEditor`.
export interface FeedstocksFieldValues {
  feedstocks: FoodFeedstockItemForm[];
}

export interface FoodFeedstocksEditorProps {
  /** `control` do `useForm` do formulário PAI (`FoodForm`, TASK-FOOD-FE-06). */
  control: Control<FoodForm>;
  /** `fields` do `useFieldArray({ control, name: 'feedstocks' })` do PAI. */
  fields: FieldArrayWithId<FeedstocksFieldValues, 'feedstocks', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<FeedstocksFieldValues, 'feedstocks'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `Food.type` do cabeçalho — governa o rótulo dinâmico (P/U) e a trava visual de soma=100%. */
  type: FoodType;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<FoodForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
  /** Reflete o total calculado (cosmético) para o PAI decidir se trava o submit (TASK-FOOD-FE-06). */
  onTotalChange?: (total: number) => void;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Select de matéria-prima — mirror EXATO de `listProductOptions` com
// `food_eligibility: 'feedstock'` (TASK-FOOD-06, ✅ CONCLUÍDO — ver nota de
// topo de `product-service.ts`). SEM filtro de categoria seria a lacuna
// original da ficha; o parâmetro real já existe e é usado aqui.
async function listFeedstockProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions({ ...params, food_eligibility: 'feedstock' });
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

interface FoodFeedstockRowProps {
  control: Control<FeedstocksFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  type: FoodType;
  languageGB: LanguageDate;
  disabled: boolean;
}

function FoodFeedstockRow({
  control,
  index,
  remove,
  type,
  languageGB,
  disabled,
}: FoodFeedstockRowProps) {
  const text = languageGB.foods.food.form.fields;

  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `feedstocks.${index}.feedstock_product_id`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `feedstocks.${index}.measurements`,
  });
  const { field: percentageField, fieldState: percentageFieldState } = useController({
    control,
    name: `feedstocks.${index}.percentage`,
  });

  const productUuid = productField.value?.value ?? null;
  const { options: measurementOptions, isLoading: isLoadingMeasurements } =
    useProductMeasurementOptions(productUuid);

  const isPercentageType = type === FOOD_TYPE.PERCENTAGE;
  const percentageLabel = isPercentageType ? text.feedstockPercentageP : text.feedstockPercentageU;

  function handleProductChange(option: { label: string; value: string } | null) {
    const nextUuid = option?.value ?? null;
    const previousUuid = productField.value?.value ?? null;
    productField.onChange(option ?? null);
    // Reconstrução da lista de unidade (Doc Bruta Food regra 12) — a unidade
    // anterior deixa de ser válida quando o produto muda.
    if (nextUuid !== previousUuid) {
      measurementField.onChange(null);
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={productField.name}
          label={text.feedstockProduct}
          service={listFeedstockProductOptions}
          mapOptions={mapProductOption}
          findParams={findParamsFromSearch}
          value={productField.value ?? undefined}
          onChange={handleProductChange as any}
          error={productFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box flex="1" minW="180px">
        <Select
          name={measurementField.name}
          label={text.feedstockMeasurement}
          value={measurementField.value ?? undefined}
          onChange={measurementField.onChange}
          options={measurementOptions}
          isDisabled={disabled || !productUuid}
          loading={isLoadingMeasurements}
          error={measurementFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '180px' }}>
        {isPercentageType ? (
          <PercentInput
            name={percentageField.name}
            label={percentageLabel}
            value={Number(percentageField.value) || 0}
            maxValue={100}
            disabled={disabled}
            onValueChange={percentageField.onChange}
            error={percentageFieldState.error?.message}
          />
        ) : (
          <NumberInput
            name={percentageField.name}
            label={percentageLabel}
            allowDot
            decimalPlaces={2}
            min={0}
            value={Number(percentageField.value) || 0}
            onValueChange={(value) => percentageField.onChange(value ?? 0)}
            disabled={disabled}
            error={percentageFieldState.error?.message}
          />
        )}
      </Box>

      <Flex direction="column" gap="1.5">
        {/* Spacer invisível — reserva a mesma altura de label das demais
            colunas (mirror `MovementAllocationEditor`). */}
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.removeFeedstock}
        </Flex>
        <IconButtonTable
          aria-label={text.removeFeedstock}
          mensegerTooltip={text.removeFeedstock}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}

export function FoodFeedstocksEditor({
  control,
  fields,
  append,
  remove,
  type,
  errors,
  languageGB,
  disabled = false,
  onTotalChange,
}: FoodFeedstocksEditorProps) {
  const text = languageGB.foods.food.form.fields;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `MovementAllocationEditor::genericControl`: resolve os paths concretos
  // de `useWatch` contra `FeedstocksFieldValues`.
  const genericControl = control as unknown as Control<FeedstocksFieldValues>;

  // Erro de nível de ARRAY (`.min(1)` do Yup) — mesmo cast pragmático de
  // `MovementAllocationEditor::arrayError`.
  const arrayError = (errors as any)?.feedstocks?.message as string | undefined;

  const isPercentageType = type === FOOD_TYPE.PERCENTAGE;
  // Rótulo dinâmico do rodapé (mirror `_forms.blade.php:146-156`: "Total (%)"
  // quando `type==='P'`, "Total" quando `type==='U'`) — `text.total` já é
  // i18n (`TASK-FOOD-FE-01`); o sufixo "(%)" é símbolo, não texto traduzível.
  const totalLabel = isPercentageType ? `${text.total} (%)` : text.total;

  // Total — 100% client-side/cosmético (`useWatch`), nunca chega ao payload.
  const watchedFeedstocks = useWatch({ control: genericControl, name: 'feedstocks' }) ?? [];
  const total = watchedFeedstocks.reduce((sum, item) => sum + (Number(item?.percentage) || 0), 0);
  const roundedTotal = Math.round(total * 100) / 100;
  const isSumInvalid = isPercentageType && Math.abs(roundedTotal - 100) >= 0.01;

  // `useEffect` (não durante o render) — evita "Cannot update a component
  // while rendering a different component" quando o PAI usa `onTotalChange`
  // para `setState` (ex.: travar o botão Salvar, `TASK-FOOD-FE-06`).
  useEffect(() => {
    onTotalChange?.(roundedTotal);
  }, [roundedTotal, onTotalChange]);

  function handleAdd() {
    append({
      feedstock_product_id: null,
      measurements: null,
      percentage: 0,
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {text.feedstocks}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {totalLabel}:
          </Text>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={isSumInvalid ? 'fg.error' : 'fg.default'}
          >
            {isPercentageType
              ? `${roundedTotal.toLocaleString('pt-BR')}%`
              : roundedTotal.toLocaleString('pt-BR')}
          </Text>
        </Flex>
      </Flex>

      {/* Divergência documentada do padrão geral "nunca bloqueia" (Decisão 4
          do `Food-contrato.md`, já registrada em `TASK-FOOD-FE-02`): este
          Alert é só o AVISO visual — quem trava o submit é o form PAI. */}
      {isSumInvalid && (
        <Alert.Root status="warning" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{text.total}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {arrayError && fields.length > 0 && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{arrayError}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.feedstocks}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <FoodFeedstockRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              type={type}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addFeedstock}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default FoodFeedstocksEditor;
