// src/constants/RequestPurchases/options/request-purchase-status-options.ts
// Fábrica de opções do enum `status` (RequestPurchaseStatus) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror `provider-type-options.ts`).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { requestPurchaseStatus, RequestPurchaseStatus } from '../request-purchase-status';

const labels = (languageGB: LanguageDate): Map<RequestPurchaseStatus, string> => {
  const text = languageGB.requestPurchases.requestPurchase.statusOptions;
  return new Map([
    [requestPurchaseStatus.solicitacao, text.solicitacao],
    [requestPurchaseStatus.cotacaoEmAndamento, text.cotacaoEmAndamento],
    [requestPurchaseStatus.aguardandoAprovacao, text.aguardandoAprovacao],
    [requestPurchaseStatus.aguardandoCiencia, text.aguardandoCiencia],
    [requestPurchaseStatus.pedidoNaoAprovado, text.pedidoNaoAprovado],
    [requestPurchaseStatus.aguardandoCompra, text.aguardandoCompra],
    [requestPurchaseStatus.compraEfetuada, text.compraEfetuada],
    [requestPurchaseStatus.compraRecebida, text.compraRecebida],
    [requestPurchaseStatus.pedidoFinalizado, text.pedidoFinalizado],
    [requestPurchaseStatus.pedidoCancelado, text.pedidoCancelado],
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

export const requestPurchaseStatusOptions = { getLabel, getOption, options };
