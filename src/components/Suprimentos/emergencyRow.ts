// src/components/Suprimentos/emergencyRow.ts
// -----------------------------------------------------------------------------
// Destaque da linha do tipo U (Emergencial) — execução 081, T-081-FE-01.
// Legado: `background-color: #EE6D8F` na linha (request-purchase/index.blade.php:86,
// request-buy/index.blade.php:106, request-receipts/index.blade.php:124).
// Devolve o NOME do token semântico (`supplyEmergencyRowBg`, light e dark em
// `styles/theme/semantic`), nunca hex — para passar a `Table.getRowHighlight`.
// -----------------------------------------------------------------------------

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

export const SUPPLY_EMERGENCY_ROW_TOKEN = 'supplyEmergencyRowBg';

export function emergencyRowHighlight(row: { type?: string | null }): string | undefined {
  return row.type === requestPurchaseType.emergencial ? SUPPLY_EMERGENCY_ROW_TOKEN : undefined;
}
