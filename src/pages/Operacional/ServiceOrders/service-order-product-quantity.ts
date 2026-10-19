// src/pages/Operacional/ServiceOrders/service-order-product-quantity.ts
// -----------------------------------------------------------------------------
// Cálculo BIDIRECIONAL "Qtd/ha" ↔ "Qtd Total" da aba Insumos (mirror
// `_product.blade.php:44-126` do legado): Qtd Total = Qtd/ha × ÁREA PRODUTIVA
// da Área do cabeçalho. Sem dividir por zero quando a área é 0/ausente.
// Funções puras, testáveis (execução 086 — a Área hidratada no edit já traz
// `productive_area`, então editar a Qtd/ha de uma linha antiga recalcula certo).
// -----------------------------------------------------------------------------

/**
 * @param {unknown} quantity - Qtd/ha informada.
 * @param {number} productiveArea - Área produtiva da Área escolhida.
 * @return {number} Qtd Total = Qtd/ha × área produtiva.
 */
export function computeTotalQuantity(quantity: unknown, productiveArea: number): number {
  return (Number(quantity) || 0) * productiveArea;
}

/**
 * @param {unknown} totalQuantity - Qtd Total informada.
 * @param {number} productiveArea - Área produtiva da Área escolhida.
 * @return {number} Qtd/ha = Qtd Total ÷ área produtiva (0 se a área for 0).
 */
export function computeQuantityPerArea(totalQuantity: unknown, productiveArea: number): number {
  return productiveArea > 0 ? (Number(totalQuantity) || 0) / productiveArea : 0;
}
