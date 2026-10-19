// src/constants/discount-table/discount-table-status.ts
// Enum client-side do campo `is_active` de Tabela de Desconto (DiscountTable
// — Operacional/Agricultura, F-032, TASK-DT-FE-01). Físico `smallint` (0/1)
// no backend (cast lógico `boolean` no Model) — confirmado por leitura
// direta de `DiscountTableResource.php`/`DiscountTableRequest::rules()`
// (`in:0,1`). Ordem 1 (Ativo) antes de 0 (Inativo) — LK-02.
//
// Enum + `*Color` CO-LOCADOS (get_pwa_constants_and_mappers_pattern §4) —
// cor via tokens do tema (`green`/`red`, Chakra colorPalette), SEM hex fixo.

import type { LanguageDate } from '@/@types/language';

export type DiscountTableStatus = 0 | 1;

export const discountTableStatus = {
  active: 1,
  inactive: 0,
} as const;

// Ordem 1 antes de 0 (LK-02) — mesma ordem do Select do legado.
export const DISCOUNT_TABLE_STATUSES: DiscountTableStatus[] = [
  discountTableStatus.active,
  discountTableStatus.inactive,
];

export const discountTableStatusColor: Record<DiscountTableStatus, string> = {
  1: 'green',
  0: 'red',
};

/**
 * Rótulo do enum `DiscountTableStatus`, SEMPRE via i18n (nunca hardcoded) —
 * consumido pela fábrica de opções (`options/discount-table-status-options.ts`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<DiscountTableStatus, string>} Mapa `DiscountTableStatus` → rótulo traduzido.
 */
export const discountTableStatusLabel = (
  languageGB: LanguageDate
): Record<DiscountTableStatus, string> => ({
  1: languageGB.discountTables.discountTable.form.statusOptions.active,
  0: languageGB.discountTables.discountTable.form.statusOptions.inactive,
});
