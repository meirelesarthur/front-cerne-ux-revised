// src/pages/Operacional/VendaAnimais/movement-sale-finish-mapper.ts
// -----------------------------------------------------------------------------
// TASK-VD-FE-03 (contrato de tela §8) — mapeamento PURO
// `MovementSaleDetail` (resposta de `GET .../{uuid}/slaughter` ou
// `GET .../slaughter-many`) → `MovementSaleForm` (MESMO tipo do form
// principal, `useForm` do RHF) + montagem do payload de finalização, mirror
// `appropriation-form-mapper.ts`/`buildMovementSalePayload`
// (`useMovementSales.tsx`) — reaproveita `movementSaleItemDetailToForm`/
// `movementSaleCategoryDetailToForm` (já existentes, Tarefa 15) sem
// reescrever a hidratação de itens/categorias do zero.
//
// Fator de conversão Kg↔Arroba de CARCAÇA (`CV3`/`GAP-VD-04`,
// `WeightConversion::KG_TO_ARROBA_SLAUGHTER_FACTOR = 15`) — DIFERENTE do
// fator 30 (`KG_TO_ARROBA_MAIN_FACTOR`) do fluxo principal. Usado só para o
// cálculo de exibição (`MovementSaleCategoriesTab` recebe `conversionFactor=
// 15`/`weightField='carcass_weight'`, `priceTimesWeight`); o fator 15 NÃO
// entra no total (total = preço Kg × carcaça, ou @ × carcaça/15 quando o
// preço foi editado em @; servidor alinhado); os campos `value_real`/`value_arroba`
// digitados pelo usuário são replicados tal-e-qual no payload de cada item,
// mirror `buildMovementSaleItemPayload` — o servidor
// (`FinalizeSlaughterAction`) grava `value_unit = value_real × carcass_weight`,
// nunca reimplementado aqui.
// -----------------------------------------------------------------------------

import { movementSalePricingTypeOptions } from '@/constants/GestaoAnimal/MovementSale/options';

import type { LanguageDate } from '@/@types/language';
import type {
  MovementSaleCategoryAggregateForm,
  MovementSaleDetail,
  MovementSaleForm,
  MovementSaleItemForm,
  MovementSaleSlaughterItemPayload,
  MovementSaleSlaughterManyPayload,
  MovementSaleSlaughterPayload,
} from '@/@types/v2/MovementSales';

import {
  buildMovementSaleCategoryPayload,
  movementSaleCategoryDetailToForm,
  movementSaleItemDetailToForm,
} from './useMovementSales';

export const KG_TO_ARROBA_SLAUGHTER_FACTOR = 15;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Hidrata `MovementSaleForm` a partir do detalhe (`GET .../slaughter[-many]`)
// — MESMO shape do form principal (reutilizado pelos componentes
// compartilhados `MovementSaleItemsSection`/`MovementSaleCategoriesTab`/
// `MovementSaleTotalsBlock`, mirror `FinishAppropriation.tsx`). Campos que a
// Finalização não edita (cabeçalho) nascem informativos/readonly — a tela
// (`FinishMovementSale.tsx`) exibe um resumo de cabeçalho fora do `useForm`
// (não há `MovementSaleHeaderFields` reutilizável, diferente de
// Apontamentos), então valores aqui só precisam ser consistentes o
// suficiente para não quebrar tipos — nunca enviados de volta ao servidor
// (o payload de finalização só carrega `items`/`categories`/totais, contrato
// §8, DTO real `MovementSaleSlaughterData`).
export function mapMovementSaleDetailToFinishFormValues(
  data: MovementSaleDetail,
  languageGB: LanguageDate
): MovementSaleForm {
  return {
    code: data.code,
    dt_sale: data.dt_sale,
    seller_uuid: data.seller
      ? { label: data.seller.name ?? data.seller.uuid, value: data.seller.uuid }
      : null,
    batch_sale: data.batch_sale,
    batch_uuid: data.batch
      ? { label: data.batch.description ?? data.batch.uuid, value: data.batch.uuid }
      : null,
    client_uuid: data.client
      ? { label: data.client.name ?? data.client.uuid, value: data.client.uuid }
      : null,
    type_sale: { label: data.type_sale_label, value: data.type_sale },
    // UT-000707/D1 (REABERTURA v2) — `label` real (não `''`), mirror
    // `CreateOrUpdateMovementSale.tsx` (`movementSalePricingTypeOptions.
    // getLabel`). Label vazio reprovava `v.option().required()` do schema de
    // finalização (Yup `string().required()` rejeita `''`) num campo NÃO
    // renderizado nesta tela → toast falso "Revise os campos..." mesmo com
    // tudo preenchido.
    pricing_type: {
      label: movementSalePricingTypeOptions.getLabel(data.pricing_type, languageGB),
      value: data.pricing_type,
    },
    chave: null,
    number: null,
    serie: null,
    // GAP-VENDAS-FE-03 — `MovementSaleResource` não expõe `type_payment` em
    // nenhum modo; mantido `null` até o round-trip fechar (SEM MOCK, nunca
    // inventar valor). Renderizado e OBRIGATÓRIO só na tela individual
    // (`FinishMovementSale.tsx`, D1-a/`GAP-VD-14`).
    type_payment: null,
    gtas: data.gtas ?? '',
    note: '',
    // TASK-VD-FE-05 (GAP-VENDAS-FE-04 §3.13) — default SIM, fidelidade ao
    // `->value(1)` de `slaughter.blade.php:153` (era `false` hardcoded).
    has_financial: true,
    // UT-000719 (D-097-12) — reidrata de `incomes[0].fiscal_document`; default Sim.
    fiscal_document: data.incomes?.[0]?.fiscal_document ?? true,
    financial_allocations: [],
    financial_installments: [],
    items: data.items.map(movementSaleItemDetailToForm),
    categories: data.categories.map(movementSaleCategoryDetailToForm),
    average_weight_kg: null,
    total_products: data.total_products,
    freight: data.freight,
    other_values: data.other_values,
    discount: data.discount,
    total: data.total,
  };
}

// Item de finalização (`MovementSaleSlaughterItemData` real —
// `animal_uuid`/`carcass_weight`/`performance`/`value_real`/`value_arroba`).
// `value_real`/`value_arroba` são REPLICADOS da categoria do item (mirror
// `buildMovementSaleItemPayload`, contrato §7.3/§8.1 — o preço é digitado 1x
// por CATEGORIA na UI, nunca por item).
export function buildMovementSaleSlaughterItemPayload(
  item: MovementSaleItemForm,
  categories: MovementSaleCategoryAggregateForm[]
): MovementSaleSlaughterItemPayload {
  const category = categories.find((c) => c.category_uuid === item.category_uuid?.value);

  return {
    animal_uuid: item.animal_uuid!.value,
    carcass_weight: item.carcass_weight ?? 0,
    performance: item.performance ?? 0,
    value_real: category?.value_real ?? 0,
    value_arroba: category?.value_arroba ?? 0,
  };
}

// Payload de finalização INDIVIDUAL (`PUT .../{uuid}/slaughter`) —
// `total_products`/`total` RECALCULADOS a partir de `categories` (mesma
// fórmula de `MovementSaleTotalsBlock.tsx`), mirror `buildMovementSalePayload`.
export interface BuildMovementSaleSlaughterPayloadOptions {
  /**
   * TASK-VD-FE-05 (D1-a/D-LOTE-a, `GAP-VD-14`) — `type_payment` só entra no
   * payload da Finalização INDIVIDUAL. Default `true`
   * (`buildMovementSaleSlaughterPayload` chamado direto pela tela
   * individual); a Finalização em lote chama com `false` explícito.
   */
  includeTypePayment?: boolean;
}

export function buildMovementSaleSlaughterPayload(
  data: MovementSaleForm,
  options: BuildMovementSaleSlaughterPayloadOptions = {}
): MovementSaleSlaughterPayload {
  const { includeTypePayment = true } = options;

  const categoriesPayload = data.categories.map(buildMovementSaleCategoryPayload);
  const totalProducts = round(
    categoriesPayload.reduce((sum, category) => sum + category.value_total, 0),
    2
  );
  const total = round(totalProducts + data.freight + data.other_values - data.discount, 2);

  const payload: MovementSaleSlaughterPayload = {
    items: data.items.map((item) => buildMovementSaleSlaughterItemPayload(item, data.categories)),
    categories: categoriesPayload,
    total_products: totalProducts,
    freight: data.freight,
    other_values: data.other_values,
    discount: data.discount,
    total,
    has_financial: data.has_financial,
  };

  // D1-a/`GAP-VD-14` — código de 2 caracteres, nunca o label. Omitido por
  // construção quando `includeTypePayment===false` (lote, D-LOTE-a) OU
  // quando o campo não foi preenchido (não renderizado/obrigatório fora do
  // modo `'finish'`).
  if (includeTypePayment && data.type_payment?.value) {
    payload.type_payment = data.type_payment.value;
  }

  // TASK-VD-FE-04 (fundação compartilhada, GAP-VENDAS-FE-04 §6) — shape REAL
  // da API (`financial.date_installments[]`/`value_installments[]`/
  // `vl_total`/`income_categories[]`/`income_centers[]`/
  // `income_category_values[]`), lido de `financial_allocations`/
  // `financial_installments` (`MovementSaleIncomeAllocation`/
  // `MovementSaleInstallmentsSection`, Tarefa 23) — bloco morto que fabricava
  // 1 parcela no valor total na data da venda REMOVIDO. Percentuais nunca
  // enviados (mirror `CreateFarmTransfer.tsx:303-329`).
  if (data.has_financial) {
    const allocations = data.financial_allocations ?? [];
    const installments = data.financial_installments ?? [];

    payload.financial = {
      date_installments: installments.map((installment) => installment.date ?? ''),
      value_installments: installments.map((installment) => Number(installment.value) || 0),
      vl_total: total,
      income_categories: allocations.map((allocation) => allocation.category_uuid!.value),
      income_centers: allocations.map((allocation) => allocation.center_uuid!.value),
      income_category_values: allocations.map((allocation) => Number(allocation.value) || 0),
      // VD-API-03 (`GAP-API-FE-03`) — mirror `buildMovementSalePayload`
      // (`useMovementSales.tsx`): Conta Contábil opcional por linha.
      income_plan_accounts: allocations.map(
        (allocation) => allocation.plan_account_uuid?.value ?? null
      ),
      // UT-000719 (D-097-12) — só na finalização, só com `has_financial`.
      fiscal_document: data.fiscal_document ?? true,
    };
  }

  return payload;
}

function buildFinishManyCategories(
  details: MovementSaleDetail[]
): MovementSaleCategoryAggregateForm[] {
  const isHead = details[0]?.pricing_type === 2;
  const grouped = new Map<
    string,
    { description: string; quantity: number; total: number; weight: number }
  >();
  details.forEach((detail) => {
    detail.categories.forEach((category) => {
      const current = grouped.get(category.uuid);
      grouped.set(category.uuid, {
        description: category.description ?? '',
        quantity: (current?.quantity ?? 0) + category.quantity,
        total: (current?.total ?? 0) + (Number(category.value_total) || 0),
        weight: current?.weight ?? 0,
      });
    });
    detail.items.forEach((item) => {
      const current = item.category ? grouped.get(item.category.uuid) : undefined;
      if (current) current.weight += Number(item.carcass_weight) || 0;
    });
  });

  return Array.from(grouped.entries()).map(([uuid, group]) => {
    const total = round(group.total, 2);
    const valueReal = group.weight > 0 ? round(total / group.weight, 6) : null;
    return {
      category_uuid: uuid,
      description: group.description,
      quantity: group.quantity,
      value_real: valueReal,
      value_arroba: valueReal === null ? null : round(valueReal * KG_TO_ARROBA_SLAUGHTER_FACTOR, 2),
      value_head: isHead && group.quantity > 0 ? round(total / group.quantity, 6) : null,
      value_total: total,
    };
  });
}

// Hidrata `MovementSaleForm` para a Finalização EM LOTE
// (`FinishMovementSaleMany.tsx`, contrato §8.2) — `items[]` ACHATADO de
// TODAS as vendas do lote (cada item já se autoidentifica por `animal_uuid`
// no payload, mirror `MovementSaleSlaughterManyData` real). `categories`
// nasce pré-preenchido por categoria (D2-b): `value_total` = soma dos
// `value_total` persistidos das vendas; `value_real` = total ÷ Σ carcaça dos
// itens da categoria e `value_arroba` = `value_real` × 15 quando o peso > 0
// (sem peso, ficam vazios e o total persistido é mantido); em Cabeça,
// `value_head` = total ÷ quantidade. Preço unitário nunca é somado.
// `freight`/`other_values`/`discount` nascem somados (AGREGADO do lote
// inteiro, contrato §8.2) — o servidor distribui proporcionalmente por
// venda, nunca o cliente.
export function mapMovementSaleDetailsToFinishManyFormValues(
  details: MovementSaleDetail[],
  languageGB: LanguageDate
): MovementSaleForm {
  return {
    code: details.map((d) => d.code).join(', '),
    dt_sale: details[0]?.dt_sale ?? '',
    seller_uuid: null,
    batch_sale: false,
    batch_uuid: null,
    client_uuid: null,
    type_sale: details[0]
      ? { label: details[0].type_sale_label, value: details[0].type_sale }
      : null,
    // UT-000707/D1 (REABERTURA v2) — mesmo fix do mapper individual acima.
    pricing_type: details[0]
      ? {
          label: movementSalePricingTypeOptions.getLabel(details[0].pricing_type, languageGB),
          value: details[0].pricing_type,
        }
      : null,
    chave: null,
    number: null,
    serie: null,
    // D-LOTE-a / `GAP-VD-14` — `type_payment` NÃO é renderizado nem enviado
    // na Finalização em lote (assimetria legada real: `updateMany()` omite
    // o campo por construção; a tela legada de lote renderiza um campo
    // morto sem efeito). Permanece `null` sempre, nunca preenchido.
    type_payment: null,
    gtas: '',
    note: '',
    // TASK-VD-FE-05 (GAP-VENDAS-FE-04 §3.13/D2-a) — default SIM também no
    // lote, fidelidade ao `->value(1)` de `slaughter-many.blade.php:155`.
    has_financial: true,
    // UT-000719 (D-097-12) — lote: reidrata de `details[0].incomes[0]`; default Sim.
    fiscal_document: details[0]?.incomes?.[0]?.fiscal_document ?? true,
    financial_allocations: [],
    financial_installments: [],
    items: details.flatMap((detail) => detail.items.map(movementSaleItemDetailToForm)),
    categories: buildFinishManyCategories(details),
    average_weight_kg: null,
    total_products: round(
      details.reduce((sum, detail) => sum + detail.total_products, 0),
      2
    ),
    freight: round(
      details.reduce((sum, detail) => sum + detail.freight, 0),
      2
    ),
    other_values: round(
      details.reduce((sum, detail) => sum + detail.other_values, 0),
      2
    ),
    discount: round(
      details.reduce((sum, detail) => sum + detail.discount, 0),
      2
    ),
    total: round(
      details.reduce((sum, detail) => sum + detail.total, 0),
      2
    ),
  };
}

// Payload de finalização EM LOTE (`PUT .../slaughter-many`) — MESMO shape do
// individual + `sale_uuids[]` (contrato §8.2). Distribuição proporcional de
// `discount`/`total`/`total_products`/`freight`/`other_values` por venda do
// lote é feita PELO SERVIDOR (`FinalizeSlaughterManyAction`, `CV6`) — os
// totais aqui são os AGREGADOS do lote inteiro (soma de todas as vendas
// selecionadas), nunca uma distribuição calculada no cliente.
export function buildMovementSaleSlaughterManyPayload(
  saleUuids: string[],
  data: MovementSaleForm
): MovementSaleSlaughterManyPayload {
  return {
    sale_uuids: saleUuids,
    // D-LOTE-a / `GAP-VD-14` (§2.7) — `includeTypePayment: false` explícito:
    // o payload do lote NUNCA leva `type_payment`, mesmo que o campo chegue
    // preenchido por engano (ele nem é renderizado em `FinishMovementSaleMany.tsx`).
    ...buildMovementSaleSlaughterPayload(data, { includeTypePayment: false }),
  };
}
