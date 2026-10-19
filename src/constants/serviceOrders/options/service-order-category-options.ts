// src/constants/serviceOrders/options/service-order-category-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options do select "Uso" (`category`, cabeçalho do form de
// Ordem de Serviço) — TASK-FE-2004. Domínio ESTÁTICO (backed int 1/2/3,
// mirror `App\Enums\OperationUse` do backend, confirmado por leitura direta
// de `OperationOptionsRequest.php`: "`ServiceOrder::$category` e
// `OperationUse` compartilham o MESMO domínio inteiro") — SEM endpoint
// remoto, mesma fábrica estática de `getServiceOrderStatusOptions`.
//
// `category` dispara 2 efeitos no form (`ServiceOrderHeaderFields.tsx`):
//   - cascata IG-02 (contrato legado) → `operations/options?category=`;
//   - IG-01 → habilita/desabilita cultivo (2=Agricultura)/lote+categoria
//     animal (3=Pecuária); 1=Ambos habilita os 3 (PRESERVE as-is).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

/**
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Option<number>[]} Options do select "Uso" (1=Ambos,
 *   2=Agricultura, 3=Pecuária).
 */
export function getServiceOrderCategoryOptions(languageGB: LanguageDate): Option<number>[] {
  const labels = languageGB.serviceOrders.serviceOrder.form.categoryOptions;

  return [
    { value: 1, label: labels.both },
    { value: 2, label: labels.agriculture },
    { value: 3, label: labels.livestock },
  ];
}
