// src/pages/Operacional/Processamentos/processingOrigin.ts
// -----------------------------------------------------------------------------
// Normalização da origem do processamento (UT-000677, FE-1/FE-2).
//
// Contrato:
//  - `ProcessingResource.php:116` (detalhe) devolve `type` como FQCN do morph
//    (`App\Models\MovementPurchase`; linhas legadas `App\MovementPurchase`).
//  - `/prepare.origin_type` devolve a chave curta (`movement_purchase`).
// A API normaliza por `class_basename()` + `BASENAME_TO_KEY`; este helper é o
// espelho no front. Aceita FQCN em qualquer namespace e a própria chave curta.
// -----------------------------------------------------------------------------

/** Espelho de `BASENAME_TO_KEY` da API (`ResolveProcessingPreparationAction`). */
const BASENAME_TO_KEY: Record<string, string> = {
  MovementPurchase: 'movement_purchase',
  TransferBatchFarm: 'transfer_batch_farm',
  Weaning: 'weaning',
  Separation: 'separation',
  TransferAnimalFarm: 'transfer_animal_farm',
};

const KNOWN_KEYS = new Set(Object.values(BASENAME_TO_KEY));

const MOVEMENT_PURCHASE_KEY = 'movement_purchase';

/**
 * Resolve a chave curta da origem a partir do FQCN do morph (`App\Models\X`,
 * `App\X`) ou de uma chave curta já normalizada. Desconhecido/vazio → `null`.
 * @param {string | null | undefined} type FQCN do morph ou chave curta.
 * @return {string | null} Chave curta da origem ou `null`.
 */
export function resolveProcessingOriginKey(type?: string | null): string | null {
  if (!type) return null;
  if (KNOWN_KEYS.has(type)) return type;
  const basename = type.slice(type.lastIndexOf('\\') + 1);
  return BASENAME_TO_KEY[basename] ?? null;
}

/**
 * `true` quando a origem é Compra (import de planilha e propagação de identificação).
 * @param {string | null | undefined} type FQCN do morph ou chave curta.
 * @return {boolean} `true` se for Compra.
 */
export function isMovementPurchaseOrigin(type?: string | null): boolean {
  return resolveProcessingOriginKey(type) === MOVEMENT_PURCHASE_KEY;
}
