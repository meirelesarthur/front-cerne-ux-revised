// src/constants/Sales/options/sale-status-options.ts
// Fábrica de opções do enum `status` (SaleStatus) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `order-status-options.ts`). Fallback estático — o `SaleStatusRef`
// hidratado (`{value,label,color}`) já vem PRONTO do `SaleListResource`
// (usar diretamente na grid); esta fábrica cobre o Select do FILTRO e a
// legenda estática da listagem, onde não há Resource hidratado.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { saleStatus, SaleStatus } from '../sale-status';

const labels = (languageGB: LanguageDate): Map<SaleStatus, string> => {
  const text = languageGB.sales.sale.status;
  return new Map([
    [saleStatus.aguardandoEmissaoNfe, text.aguardandoEmissaoNfe],
    [saleStatus.fechado, text.fechado],
    [saleStatus.cancelado, text.cancelado],
  ]);
};

const getLabel = (value: SaleStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: SaleStatus, languageGB: LanguageDate): Option<SaleStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<SaleStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const saleStatusOptions = { getLabel, getOption, options };
