// src/constants/Orders/options/order-status-options.ts
// Fábrica de opções do enum `status` (OrderStatus) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `budget-status-options.ts`). Fallback estático — o `OrderStatusRef`
// hidratado (`{value,label,color}`) já vem PRONTO do `OrderResource` (usar
// diretamente quando disponível); esta fábrica cobre o Select do FILTRO,
// onde não há Resource hidratado, apenas o valor.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { orderStatus, OrderStatus } from '../order-status';

const labels = (languageGB: LanguageDate): Map<OrderStatus, string> => {
  const text = languageGB.orders.order.status;
  return new Map([
    [orderStatus.emAberto, text.emAberto],
    [orderStatus.emProcessamento, text.emProcessamento],
    [orderStatus.finalizado, text.finalizado],
    [orderStatus.cancelado, text.cancelado],
  ]);
};

const getLabel = (value: OrderStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: OrderStatus, languageGB: LanguageDate): Option<OrderStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<OrderStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const orderStatusOptions = { getLabel, getOption, options };
