// src/constants/RequestAuthorizations/options/request-authorization-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções de status RESTRITA ao subconjunto de Autorização (BR-01).
//
// Autorização NÃO cunha um enum de status próprio — opera sobre o MESMO enum
// `requestPurchaseStatus`/`requestPurchaseStatusColor` já existente
// (`@/constants/RequestPurchases/request-purchase-status`), restrito a
// `{3 aguardandoAprovacao, 4 aguardandoCiencia, 11 analisarProcesso}`.
// Labels reaproveitados de `languageGB.requestPurchases.requestPurchase.
// statusOptions.*` (NÃO uma tradução nova) — mirror do padrão `statusOptions`
// restrito já usado em `Cotacoes/index.tsx` via prop `statusOptions` de
// `FilterSideSolicitacao` (`get_pwa_constants_and_mappers_pattern` §3.2).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import {
  requestPurchaseStatus,
  RequestPurchaseStatus,
} from '@/constants/RequestPurchases/request-purchase-status';

/** Subconjunto fechado de status válidos na fila de Autorização (BR-01). */
const REQUEST_AUTHORIZATION_STATUSES: RequestPurchaseStatus[] = [
  requestPurchaseStatus.aguardandoAprovacao,
  requestPurchaseStatus.aguardandoCiencia,
  requestPurchaseStatus.analisarProcesso,
];

const labels = (languageGB: LanguageDate): Map<RequestPurchaseStatus, string> => {
  const text = languageGB.requestPurchases.requestPurchase.statusOptions;
  return new Map([
    [requestPurchaseStatus.aguardandoAprovacao, text.aguardandoAprovacao],
    [requestPurchaseStatus.aguardandoCiencia, text.aguardandoCiencia],
    [requestPurchaseStatus.analisarProcesso, text.analisarProcesso],
  ]);
};

const getLabel = (value: RequestPurchaseStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RequestPurchaseStatus,
  languageGB: LanguageDate
): Option<RequestPurchaseStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RequestPurchaseStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const requestAuthorizationStatusOptions = {
  statuses: REQUEST_AUTHORIZATION_STATUSES,
  getLabel,
  getOption,
  options,
};
