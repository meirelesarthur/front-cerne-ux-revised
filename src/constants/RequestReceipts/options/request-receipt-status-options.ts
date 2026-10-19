// src/constants/RequestReceipts/options/request-receipt-status-options.ts
// -----------------------------------------------------------------------------
// Opções do filtro "Status" de Recebimentos. Execução 081 (T-081-FE-10): o legado
// oferece os 11 status (`RequestPurchase::status()`, FM-02), não só {7, 8, 9}; por
// isso reaproveita a fábrica completa de `requestPurchaseStatusOptions` (rótulos
// de `languageGB.requestPurchases.requestPurchase.statusOptions`).
// -----------------------------------------------------------------------------

import { requestPurchaseStatusOptions } from '@/constants/RequestPurchases/options/request-purchase-status-options';
import { REQUEST_RECEIPT_STATUSES } from '@/constants/RequestReceipts/request-receipt-status';

export const requestReceiptStatusOptions = {
  /** Status em que a solicitação aparece como etapa de Recebimentos (7, 8 e 9). */
  statuses: REQUEST_RECEIPT_STATUSES,
  getLabel: requestPurchaseStatusOptions.getLabel,
  getOption: requestPurchaseStatusOptions.getOption,
  options: requestPurchaseStatusOptions.options,
};
