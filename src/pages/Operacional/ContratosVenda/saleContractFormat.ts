// src/pages/Operacional/ContratosVenda/saleContractFormat.ts
// -----------------------------------------------------------------------------
// Formatação numérica compartilhada de Contratos de Venda (Operacional /
// Agricultura, esteira 036) — REWORK DE FIDELIDADE pós-auditoria
// (`audit-contratos-de-venda.md`, `SC-LST-003`/rupturas §(E) item "Saldo"):
// o legado nunca imprime número cru — sempre via helper `money($value)`
// (`number_format($value, 2, ',', '.')`, SEM prefixo de moeda — confirmado
// em `app/Helpers/functions.php:155` e nas máscaras jQuery `.money`/
// `.money4` de `resources/js/main.js`, que também não têm `prefix`).
//
// Mesmo algoritmo de `formatDecimal()` de `SaleContractCalculationFields.tsx`
// (Qtd. Sacas), generalizado aqui para reuso na LISTAGEM (coluna
// `quantity`/`Quantidade Faltante`) e no FORM (`Entregue`/`Saldo`
// readonly) — nenhum desses 4 pontos é um widget editável (por isso não é
// `NumberInput`/`MoneyInput`, só texto formatado).
// -----------------------------------------------------------------------------

/**
 * Formata um número puro no padrão pt-BR de 2 casas (milhar "." decimal ","),
 * mirror do helper `money()` legado — nunca prefixo de moeda, nunca valor cru.
 * @param {number | null | undefined} value - Valor numérico puro.
 * @return {string} Texto formatado (ex.: `20000` → `"20.000,00"`); `"—"`
 * quando o valor não está disponível (nunca imprime `undefined`/`NaN`).
 */
export function formatSaleContractQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
