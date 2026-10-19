// src/constants/BatchTransfers/batch-transfer-type.ts
// -----------------------------------------------------------------------------
// Mapper de rótulo da coluna "Tipo" da listagem de Transferência Animais/Lote
// (contrato §5.2, fiel a `index.blade.php:78`):
// `'batch'` → "Lote"; qualquer outro valor (inclusive `null`) → "Individual".
// NUNCA inline no componente — Lei 6 (`get_pwa_constants_and_mappers_pattern`).
//
// Não é uma fábrica de `Option<T>` (não alimenta nenhum Select) — é só um
// mapper de EXIBIÇÃO de valor cru → rótulo i18n, mesma natureza simplificada
// de um mapper booleano (`statusColor`), adaptada para o único consumidor
// desta coluna.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

export function getBatchTransferTypeLabel(type: string | null, languageGB: LanguageDate): string {
  const { typeOptions } = languageGB.batchTransfers.batchTransfer.list;
  return type === 'batch' ? typeOptions.batch : typeOptions.individual;
}

export const batchTransferTypeMapper = { getLabel: getBatchTransferTypeLabel };
