// src/constants/discount-table/options/discount-table-status-options.ts
// Fábrica de opções do campo `is_active` de Tabela de Desconto (DiscountTable
// — Operacional/Agricultura, F-032, TASK-DT-FE-01). Padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror
// `feedingPhaseChangeRuleOptions`. Ordem 1 (Ativo) antes de 0 (Inativo, LK-02).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import {
  DISCOUNT_TABLE_STATUSES,
  discountTableStatusLabel,
  DiscountTableStatus,
} from '../discount-table-status';

const labels = (languageGB: LanguageDate): Map<DiscountTableStatus, string> => {
  const label = discountTableStatusLabel(languageGB);
  return new Map(DISCOUNT_TABLE_STATUSES.map((status) => [status, label[status]]));
};

const getLabel = (value: DiscountTableStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DiscountTableStatus | null | undefined,
  languageGB: LanguageDate
): Option<DiscountTableStatus> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<DiscountTableStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const discountTableStatusOptions = { getLabel, getOption, options };
