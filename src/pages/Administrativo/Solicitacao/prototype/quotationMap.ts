// src/pages/Administrativo/Solicitacao/prototype/quotationMap.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026) — "Mapa de cotações" em tela (no lugar do Excel):
// compara os fornecedores item a item. Regra pura, testada:
//   - total do fornecedor = Σ(qtde × preço dos itens que cotou) + frete − desconto;
//   - ordem: quem cotou TODOS os itens primeiro, do menor para o maior total;
//     depois quem cotou parte; por último quem ainda não respondeu;
//   - menor preço de cada item (entre as cotações recebidas);
//   - "melhor de cada item": quanto custaria comprar cada item de quem cobra
//     menos (vira uma Ordem por fornecedor) e a economia sobre o melhor total.
// Sem estoque (27/11): o fornecedor pode marcar itens "sem estoque" ao responder.
// Isso NÃO impede a cotação, mas fica EXPLÍCITO (`unavailable`), diferente de "não
// cotou"; o fornecedor segue "parcial" e nunca entra como melhor total completo.
// Rota simulada: `/request-purchases/{uuid}/prototype/quotation-map`.
// -----------------------------------------------------------------------------

export interface QuotationMapItem {
  uuid: string;
  product: string | null;
  description: string;
  quantity: number;
}

export interface QuotationMapSupplierInput {
  uuid: string;
  name: string;
  received: boolean;
  date: string | null;
  /** Preço unitário por item, na ordem de `items`; null = não cotou. */
  prices: (number | null)[];
  /** Itens que o fornecedor marcou "sem estoque" (27/11): resposta explícita, NÃO é "não cotou". */
  unavailable?: boolean[];
  /** Total informado quando não há preço por item. */
  total_reported: number | null;
  freight: number;
  discount: number;
  delivery_days: number | null;
  payment_condition: string | null;
}

export interface QuotationMapData {
  items: QuotationMapItem[];
  suppliers: QuotationMapSupplierInput[];
}

export interface QuotationMapSupplier extends QuotationMapSupplierInput {
  subtotal: number;
  total: number;
  quotedCount: number;
  /** Quantos itens o fornecedor marcou "sem estoque". */
  unavailableCount: number;
  complete: boolean;
}

export interface QuotationMap {
  items: QuotationMapItem[];
  suppliers: QuotationMapSupplier[];
  /** Por item: fornecedor e preço mais baixos (null quando ninguém cotou). */
  cheapest: Record<string, { supplierUuid: string; price: number } | null>;
  /** Melhor total entre quem cotou todos os itens. */
  bestComplete: QuotationMapSupplier | null;
  /** Comprar cada item de quem cobra menos (sem frete e desconto). */
  bestByItem: { total: number; suppliers: number; saving: number | null; complete: boolean };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function buildQuotationMap(data: QuotationMapData): QuotationMap {
  const itemCount = data.items.length;
  const suppliers: QuotationMapSupplier[] = data.suppliers.map((s) => {
    const quoted = s.prices.filter((price) => price !== null).length;
    const fromItems = data.items.reduce((sum, item, i) => sum + item.quantity * (s.prices[i] ?? 0), 0);
    const subtotal = quoted > 0 ? fromItems : (s.total_reported ?? 0);
    const complete = s.received && (quoted === itemCount || (quoted === 0 && s.total_reported !== null));
    return {
      ...s,
      subtotal: round2(subtotal),
      total: round2(subtotal + s.freight - s.discount),
      quotedCount: quoted,
      unavailableCount: (s.unavailable ?? []).filter(Boolean).length,
      complete,
    };
  });

  const rank = (s: QuotationMapSupplier) => (!s.received ? 2 : s.complete ? 0 : 1);
  suppliers.sort((a, b) => rank(a) - rank(b) || a.total - b.total);

  const cheapest: QuotationMap['cheapest'] = {};
  data.items.forEach((item, i) => {
    let best: { supplierUuid: string; price: number } | null = null;
    suppliers.forEach((s) => {
      const price = s.received ? s.prices[i] : null;
      if (price !== null && price !== undefined && (!best || price < best.price)) best = { supplierUuid: s.uuid, price };
    });
    cheapest[item.uuid] = best;
  });

  const bestComplete = suppliers.find((s) => s.complete) ?? null;
  const picks = data.items.map((item) => cheapest[item.uuid]);
  const byItemTotal = round2(
    data.items.reduce((sum, item, i) => sum + item.quantity * (picks[i]?.price ?? 0), 0)
  );
  const byItemComplete = picks.every((pick) => pick !== null);
  return {
    items: data.items,
    suppliers,
    cheapest,
    bestComplete,
    bestByItem: {
      total: byItemTotal,
      suppliers: new Set(picks.filter(Boolean).map((pick) => pick!.supplierUuid)).size,
      saving: bestComplete && byItemComplete ? round2(bestComplete.total - byItemTotal) : null,
      complete: byItemComplete,
    },
  };
}
