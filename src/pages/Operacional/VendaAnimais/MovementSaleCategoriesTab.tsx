// src/pages/Operacional/VendaAnimais/MovementSaleCategoriesTab.tsx
// -----------------------------------------------------------------------------
// Tabela de CATEGORIAS AGREGADAS da Venda de Animais — TASK-VD-FE-02,
// contrato de tela §7.3. Só renderizada quando `type_sale===1` (Recria, IG5).
//
// Relação items↔categories (contrato §7.3, maior risco de fidelidade da
// Tarefa): a tabela é DERIVADA de `items` (agrupados por `category_uuid`,
// que vem do animal selecionado em cada card, `MovementSaleItemRow.tsx`) —
// `quantity` de cada linha é a contagem de itens daquela categoria, mantida
// em sincronia por este efeito (append/remove/update em `categories`,
// nunca um `useFieldArray` "solto" independente de `items`). O usuário
// informa `value_real` (Kg/Arroba) OU `value_head` (Cabeça) POR CATEGORIA —
// `value_arroba` é bidirecional de `value_real` pelo fator 30 (`CV2`,
// `WeightConversion::KG_TO_ARROBA_MAIN_FACTOR`, já fixado na API — o
// frontend replica o MESMO fator: `value_arroba = value_real * 30`).
// `value_total` é readonly, Σ `value_unit` dos itens da categoria (mesma
// fórmula da API, `CreateMovementSaleItemsAction`).
//
// ⚠️ Achado de fidelidade (confirmado contra `MovementSaleRequest::rules()`
// real) — DIVERGE de "no submit, cada item NÃO carrega preço": o servidor
// exige `items.*.value_real/value_arroba/value_head/value_unit` em CADA
// item. A UX (preço 1x por categoria) é preservada aqui; é
// `buildMovementSaleItemPayload` (`useMovementSales.tsx`) quem replica o
// preço da categoria em cada item do payload no submit — não neste
// componente, que só cuida da UI/derivação de `categories`.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Box, Table, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';

import { useLanguage } from '@/hooks/useLanguage';

import type { MovementSalePricingType, MovementSaleForm } from '@/@types/v2/MovementSales';

import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface MovementSaleCategoriesTabProps {
  control: Control<MovementSaleForm>;
  watch: UseFormWatch<MovementSaleForm>;
  /** TASK-VD-FE-03 — necessário para persistir `value_total` calculado de
   *  volta no campo do form (ver efeito de sincronização abaixo; achado de
   *  fidelidade da Tarefa 16: a Tarefa 15 só exibia `value_total` como
   *  variável local de render, nunca escrevia no estado do RHF — o payload
   *  de submit (`buildMovementSalePayload`) lia sempre `0`. Corrigido aqui
   *  por ser pré-requisito do payload de Finalização, que reaproveita esta
   *  MESMA tabela — correção, não regressão: nenhum comportamento visível
   *  muda, só o valor agora persiste corretamente no submit). */
  setValue: UseFormSetValue<MovementSaleForm>;
  pricingType: MovementSalePricingType | null;
  isDisabled: boolean;
  /** TASK-VD-FE-03 (contrato §8.1, `CV3`/`GAP-VD-04`) — fator de conversão
   *  Kg↔Arroba usado no bidirecional `value_real`⇄`value_arroba` e no
   *  cálculo de `value_total` por categoria. Default `30`
   *  (`KG_TO_ARROBA_MAIN_FACTOR`, fluxo principal, Tarefa 15) — a
   *  Finalização de abate (`FinishMovementSale.tsx`) passa `15`
   *  (`KG_TO_ARROBA_SLAUGHTER_FACTOR`), NUNCA a mesma constante. */
  conversionFactor?: number;
  /** Campo de peso usado no cálculo de `value_total` — `weight_kg` (fluxo
   *  principal, default) ou `carcass_weight` (Finalização, peso de carcaça
   *  informado na Aba de Itens). */
  weightField?: 'weight_kg' | 'carcass_weight';
  /** Total da categoria = preço × peso, sem fator (finalização de Abate). */
  priceTimesWeight?: boolean;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Fator de conversão Kg↔Arroba do form principal (`CV2`,
// `WeightConversion::KG_TO_ARROBA_MAIN_FACTOR`) — NUNCA o fator 15 da
// finalização de abate (`CV3`, `GAP-VD-04`, fator diferente, fora do escopo
// desta tela).
const KG_TO_ARROBA_MAIN_FACTOR = 30;

type LastEditedPrice = 'real' | 'arroba';

function computeItemValueUnit(
  pricingType: MovementSalePricingType | null,
  valueReal: number,
  valueHead: number,
  weightKg: number,
  factor: number = KG_TO_ARROBA_MAIN_FACTOR,
  priceTimesWeight: boolean = false
): number {
  if (pricingType === 2) return valueHead;
  if (priceTimesWeight) return valueReal * weightKg;
  return valueReal * (weightKg / factor);
}

interface ResolveCategoryValueTotalInput {
  pricingType: MovementSalePricingType | null;
  valueReal: number;
  valueArroba: number;
  valueHead: number;
  weights: number[];
  factor: number;
  priceTimesWeight: boolean;
  lastEdited: LastEditedPrice;
  touched: boolean;
  hydratedTotal: number;
}

function resolveCategoryValueTotal({
  pricingType,
  valueReal,
  valueArroba,
  valueHead,
  weights,
  factor,
  priceTimesWeight,
  lastEdited,
  touched,
  hydratedTotal,
}: ResolveCategoryValueTotalInput): number {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  if (priceTimesWeight && pricingType !== 2) {
    if (weightSum === 0 && !touched) return hydratedTotal;
    if (lastEdited === 'arroba') return round(valueArroba * (weightSum / factor), 2);
  }
  return round(
    weights.reduce(
      (sum, weight) =>
        sum +
        computeItemValueUnit(pricingType, valueReal, valueHead, weight, factor, priceTimesWeight),
      0
    ),
    2
  );
}

export function MovementSaleCategoriesTab({
  control,
  watch,
  setValue,
  pricingType,
  isDisabled,
  conversionFactor = KG_TO_ARROBA_MAIN_FACTOR,
  weightField = 'weight_kg',
  priceTimesWeight = false,
}: MovementSaleCategoriesTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale.form.categoriesTab;

  const { fields, append, remove, update } = useFieldArray({ control, name: 'categories' });
  const items = watch('items') ?? [];
  const rowState = useRef<Record<string, { touched: boolean; lastEdited: LastEditedPrice }>>({});

  function getRowState(categoryUuid: string) {
    if (!rowState.current[categoryUuid]) {
      rowState.current[categoryUuid] = { touched: false, lastEdited: 'real' };
    }
    return rowState.current[categoryUuid];
  }

  function markEdited(categoryUuid: string, lastEdited?: LastEditedPrice) {
    const state = getRowState(categoryUuid);
    state.touched = true;
    if (lastEdited) state.lastEdited = lastEdited;
  }

  function computeRowTotal(categoryUuid: string, index: number): number {
    const rowItems = items.filter((item) => item.category_uuid?.value === categoryUuid);
    const weights = rowItems.map((item) => Number(item[weightField]) || 0);
    const state = getRowState(categoryUuid);
    if (weights.some((weight) => weight > 0)) state.touched = true;
    return resolveCategoryValueTotal({
      pricingType,
      valueReal: Number(watch(`categories.${index}.value_real`)) || 0,
      valueArroba: Number(watch(`categories.${index}.value_arroba`)) || 0,
      valueHead: Number(watch(`categories.${index}.value_head`)) || 0,
      weights,
      factor: conversionFactor,
      priceTimesWeight,
      lastEdited: state.lastEdited,
      touched: state.touched,
      hydratedTotal: Number(watch(`categories.${index}.value_total`)) || 0,
    });
  }

  // ---- Sincroniza `categories` a partir da composição de `items` ---------
  // Chave de dependência estável (uuids das categorias presentes em
  // `items`, na ordem de primeira aparição) — evita re-executar o efeito por
  // qualquer mudança de `items` que não afete a COMPOSIÇÃO de categorias
  // (ex.: digitar `note`).
  const categoryKeysInItems = items
    .map((item) => item.category_uuid?.value)
    .filter((value): value is string => !!value);
  const dependencyKey = Array.from(new Set(categoryKeysInItems)).join('|');

  useEffect(() => {
    const grouped = new Map<string, { description: string; quantity: number }>();
    items.forEach((item) => {
      const categoryOption = item.category_uuid;
      if (!categoryOption?.value) return;
      const existing = grouped.get(categoryOption.value);
      grouped.set(categoryOption.value, {
        description: categoryOption.label,
        quantity: (existing?.quantity ?? 0) + 1,
      });
    });

    // Remove linhas cuja categoria não existe mais em `items` (backward,
    // índices não deslocam durante a remoção).
    for (let i = fields.length - 1; i >= 0; i -= 1) {
      if (!grouped.has(fields[i].category_uuid)) {
        remove(i);
      }
    }

    // Atualiza `quantity`/adiciona linha nova — preserva `value_real`/
    // `value_arroba`/`value_head` já digitados pelo usuário.
    grouped.forEach((value, categoryUuid) => {
      const rowIndex = fields.findIndex((f) => f.category_uuid === categoryUuid);
      if (rowIndex === -1) {
        append({
          category_uuid: categoryUuid,
          description: value.description,
          quantity: value.quantity,
          value_real: null,
          value_arroba: null,
          value_head: null,
          value_total: 0,
        });
      } else if (fields[rowIndex].quantity !== value.quantity) {
        update(rowIndex, { ...fields[rowIndex], quantity: value.quantity });
      }
    });
    // Deps INTENCIONALMENTE restritas a `dependencyKey` (ver comentário
    // acima) — `items`/`fields`/`append`/`remove`/`update` mudam a cada
    // execução deste próprio efeito; incluí-los reexecutaria em loop.
  }, [dependencyKey]);

  // ---- Sincroniza `value_total` de volta no estado do RHF ----------------
  // TASK-VD-FE-03 (achado de fidelidade, ver docblock de `setValue` acima) —
  // `value_total` era só uma variável de render (`valueTotal`, abaixo), nunca
  // escrita no campo `categories.${index}.value_total` — `buildMovementSale
  // Payload`/`buildMovementSaleSlaughterPayload` liam sempre `0`. Chave de
  // dependência estável (preço + peso relevante por categoria, arredondado
  // a 2 casas) — evita o mesmo risco de loop do efeito acima; só regrava
  // quando o valor calculado realmente muda.
  const valueTotalDependencyKey = fields
    .map((field, index) => {
      const rowItems = items.filter((item) => item.category_uuid?.value === field.category_uuid);
      const valueReal = Number(watch(`categories.${index}.value_real`)) || 0;
      const valueArroba = Number(watch(`categories.${index}.value_arroba`)) || 0;
      const valueHead = Number(watch(`categories.${index}.value_head`)) || 0;
      const weightSum = rowItems.reduce((sum, item) => sum + (Number(item[weightField]) || 0), 0);
      const state = getRowState(field.category_uuid);
      return `${field.category_uuid}:${valueReal}:${valueArroba}:${valueHead}:${weightSum}:${state.lastEdited}:${state.touched}`;
    })
    .join('|');

  useEffect(() => {
    fields.forEach((field, index) => {
      const valueTotal = computeRowTotal(field.category_uuid, index);

      if (Number(watch(`categories.${index}.value_total`)) !== valueTotal) {
        setValue(`categories.${index}.value_total`, valueTotal);
      }
    });
    // Deps restritas a `valueTotalDependencyKey` (ver comentário acima) —
    // `fields`/`items`/`watch`/`setValue` mudam a cada execução própria.
  }, [valueTotalDependencyKey, pricingType, conversionFactor, weightField, priceTimesWeight]);

  if (fields.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        {text.empty}
      </Text>
    );
  }

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.fields.category}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.fields.quantity}</Table.ColumnHeader>
            {pricingType !== 2 && (
              <>
                <Table.ColumnHeader>{text.fields.valueReal}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.fields.valueArroba}</Table.ColumnHeader>
              </>
            )}
            {pricingType === 2 && <Table.ColumnHeader>{text.fields.valueHead}</Table.ColumnHeader>}
            <Table.ColumnHeader>{text.fields.valueTotal}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {fields.map((field, index) => {
            const valueTotal = computeRowTotal(field.category_uuid, index);

            return (
              <Table.Row key={field.id}>
                <Table.Cell>{field.description}</Table.Cell>
                <Table.Cell>{watch(`categories.${index}.quantity`)}</Table.Cell>
                {pricingType !== 2 && (
                  <>
                    <Table.Cell minW="160px">
                      <Controller
                        name={`categories.${index}.value_real`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <MoneyInput
                            name={controllerField.name}
                            value={controllerField.value ?? null}
                            onValueChange={(value) => {
                              markEdited(field.category_uuid, 'real');
                              controllerField.onChange(value);
                              // UT-000707/D3 — `setValue` (não `update` do
                              // `useFieldArray`) para espelhar o campo
                              // derivado SEM regenerar `field.id` (o
                              // `update` força `<Table.Row key={field.id}>`
                              // a desmontar+remontar a cada tecla,
                              // derrubando o foco do MoneyInput).
                              setValue(
                                `categories.${index}.value_arroba`,
                                round(value * conversionFactor, 2),
                                { shouldDirty: true }
                              );
                            }}
                            disabled={isDisabled}
                          />
                        )}
                      />
                    </Table.Cell>
                    <Table.Cell minW="160px">
                      <Controller
                        name={`categories.${index}.value_arroba`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <MoneyInput
                            name={controllerField.name}
                            value={controllerField.value ?? null}
                            onValueChange={(value) => {
                              markEdited(field.category_uuid, 'arroba');
                              controllerField.onChange(value);
                              // UT-000707/D3 — ver nota em value_real acima.
                              setValue(
                                `categories.${index}.value_real`,
                                round(value / conversionFactor, 2),
                                { shouldDirty: true }
                              );
                            }}
                            disabled={isDisabled}
                          />
                        )}
                      />
                    </Table.Cell>
                  </>
                )}
                {pricingType === 2 && (
                  <Table.Cell minW="160px">
                    <Controller
                      name={`categories.${index}.value_head`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <MoneyInput
                          name={controllerField.name}
                          value={controllerField.value ?? null}
                          onValueChange={(value) => {
                            markEdited(field.category_uuid);
                            // UT-000707/D3 — `controllerField.onChange` já
                            // grava `value_head` no RHF; o `update(index, …)`
                            // aqui era redundante e regenerava `field.id`
                            // (mesma causa-raiz da perda de foco), removido.
                            controllerField.onChange(value);
                          }}
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Table.Cell>
                )}
                <Table.Cell>
                  <InputReadOnly value={formatCurrencyBRL(valueTotal)} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export { computeItemValueUnit, resolveCategoryValueTotal, KG_TO_ARROBA_MAIN_FACTOR };
