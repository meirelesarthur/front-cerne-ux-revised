// src/pages/Public/RequestQuotation/publicQuotationProgress.ts
// -----------------------------------------------------------------------------
// Lógica pura de APRESENTAÇÃO do formulário público do fornecedor: contagem de
// itens com preço informado (faixa "N de M itens preenchidos"), regra que
// libera o botão Enviar e formatação do valor em reais. Não altera nenhuma
// regra de validação nem de cálculo (isso continua em `publicQuotationTotals`).
// -----------------------------------------------------------------------------

type ItemLike = { unitary_value: number | null | undefined; quantity?: number | null };

// Item "preenchido" = preço unitário informado e maior que zero E, quando há
// quantidade ofertada (27/11: o fornecedor pode ofertar menos que o pedido),
// quantidade maior que zero. (O campo de dinheiro devolve 0 quando o fornecedor
// apaga o valor, então 0 vale "vazio".) Sem `quantity` no item, só o preço conta.
export function isItemPriced(item: ItemLike | undefined): boolean {
  const value = item?.unitary_value;
  const priced = typeof value === 'number' && !Number.isNaN(value) && value > 0;
  const quantity = item?.quantity;
  const hasQuantity = quantity === undefined || quantity === null || quantity > 0;
  return priced && hasQuantity;
}

/** A quantidade ofertada é menor que a pedida (oferta parcial). */
export function isPartialOffer(offered: number | null | undefined, requested: number): boolean {
  return typeof offered === 'number' && offered > 0 && offered < requested;
}

export function countPricedItems(items: readonly ItemLike[]): number {
  return items.filter(isItemPriced).length;
}

// O envio só é liberado quando existe ao menos 1 item e todos têm preço.
export function allItemsPriced(items: readonly ItemLike[]): boolean {
  return items.length > 0 && countPricedItems(items) === items.length;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}
