// src/constants/myServiceOrders/options/my-service-order-execution-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options do `Select` de status do bloco "Execução" (FLD-33,
// contrato de tela §3, TASK-MOS-FE-01). LK-01 — restringe o domínio completo
// de `ServiceOrderStatus` (5 valores) para SÓ `[2,3]` (Em Execução/
// Concluída), mirror `array_slice` do legado, fiel a
// `MyServiceOrderExecutionRequest::rules()` (`in:2,3`).
//
// Reaproveita `getServiceOrderStatusOptions` (fonte única de label traduzido
// + cor tokenizada do domínio `ServiceOrderStatus`) — NÃO duplica string de
// status. Adapta o shape `{status,label,badgeColor}` (legenda) para
// `Option<T>` (`{label,value}`), formato exigido pelo `Select` do form
// (mirror `MyServiceOrderExecutionForm.status: Option<2|3>|null`).
// -----------------------------------------------------------------------------

import { getServiceOrderStatusOptions } from '@/constants/serviceOrders/options/service-order-status-options';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

/**
 * Options restritas do status de execução (LK-01 — só `2` e `3`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Option<2 | 3>[]} Exatamente 2 opções (Em Execução / Concluída).
 */
export function getMyServiceOrderExecutionStatusOptions(languageGB: LanguageDate): Option<2 | 3>[] {
  return getServiceOrderStatusOptions(languageGB)
    .filter((option) => option.status === 2 || option.status === 3)
    .map((option) => ({ label: option.label, value: option.status as 2 | 3 }));
}
