// src/constants/Orders/options/pagination-quantity-options.ts
// Fábrica de opções do seletor de registros por página da listagem
// (FLT-006, contrato-tela §7.4 — 10/30/50/80/100/200, default 10). Padrão
// canônico `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern
// §3.2). Rótulos são números puros (sem dependência de tradução) — assinatura
// SEM `languageGB`, ao contrário das demais fábricas do módulo. SEM chamada
// de rede.

import type { Option } from '@/@types/option';

export const paginationQuantity = {
  ten: 10,
  thirty: 30,
  fifty: 50,
  eighty: 80,
  oneHundred: 100,
  twoHundred: 200,
} as const;

export type PaginationQuantity = (typeof paginationQuantity)[keyof typeof paginationQuantity];

export const defaultPaginationQuantity: PaginationQuantity = paginationQuantity.ten;

const labels = (): Map<PaginationQuantity, string> =>
  new Map([
    [paginationQuantity.ten, String(paginationQuantity.ten)],
    [paginationQuantity.thirty, String(paginationQuantity.thirty)],
    [paginationQuantity.fifty, String(paginationQuantity.fifty)],
    [paginationQuantity.eighty, String(paginationQuantity.eighty)],
    [paginationQuantity.oneHundred, String(paginationQuantity.oneHundred)],
    [paginationQuantity.twoHundred, String(paginationQuantity.twoHundred)],
  ]);

const getLabel = (value: PaginationQuantity): string => labels().get(value)!;

const getOption = (value: PaginationQuantity): Option<PaginationQuantity> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<PaginationQuantity>[] =>
  Array.from(labels()).map(([value, label]) => ({ label, value }));

export const paginationQuantityOptions = { getLabel, getOption, options };
