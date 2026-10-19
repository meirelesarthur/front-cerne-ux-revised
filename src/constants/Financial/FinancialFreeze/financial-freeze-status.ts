// src/constants/Financial/FinancialFreeze/financial-freeze-status.ts
// Mapa de cor do `Badge` "Congelado?" (`is_frozen`) — `StatusTag` NÃO existe
// no fork (busca negativa confirmada, FID-G3F §1); o padrão vigente é
// `Badge colorPalette` resolvido por mapa em `constants/` com fallback,
// mirror `requestPurchaseStatusColor`
// (`src/constants/RequestPurchases/request-purchase-status.ts`).
//
// Indexado por `String(is_frozen)` (`'true' | 'false'`) — `true` (mês
// bloqueado) usa a cor de alerta; `false` a cor neutra/positiva. Fallback
// `'gray'` para qualquer valor fora do domínio (defensivo, mesmo racional já
// usado em `RequestMovementHistory.tsx`).

export const financialFreezeStatusColor: Record<string, string> = {
  true: 'red',
  false: 'green',
};
