// src/constants/discount-table/discount-table-calculation-base.ts
// Enum client-side do campo `calculation_base` de Tabela de Desconto
// (DiscountTable — Operacional/Agricultura, F-032, TASK-DT-FE-01). Mirror
// estrutural de `feeding-phase/feeding-phase-change-rule.ts` — união literal
// DECLARADA DE NOVO aqui (decoupling: este arquivo não depende de import
// cruzado de `@/@types/v2/DiscountTables`).
//
// `GW`=Peso Bruto, `PD`=Peso Bruto - Desconto Anterior — confirmado por
// leitura direta de `App\Enums\DiscountTableCalculationBase` (`GB.Cerne.Api`,
// `app/Enums/DiscountTableCalculationBase.php`). Ordem GW antes de PD (LK-01).

import type { LanguageDate } from '@/@types/language';

export type DiscountTableCalculationBase = 'GW' | 'PD';

export const DISCOUNT_TABLE_CALCULATION_BASE = {
  GROSS_WEIGHT: 'GW',
  CUMULATIVE: 'PD',
} as const;

// Ordem GW antes de PD (LK-01) — mesma ordem do enum server-side.
export const DISCOUNT_TABLE_CALCULATION_BASES: DiscountTableCalculationBase[] = [
  DISCOUNT_TABLE_CALCULATION_BASE.GROSS_WEIGHT,
  DISCOUNT_TABLE_CALCULATION_BASE.CUMULATIVE,
];

/**
 * Rótulo do enum `DiscountTableCalculationBase`, SEMPRE via i18n (nunca
 * hardcoded) — consumido pela fábrica de opções
 * (`options/calculation-base-options.ts`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<DiscountTableCalculationBase, string>} Mapa `DiscountTableCalculationBase` → rótulo traduzido.
 */
export const discountTableCalculationBaseLabel = (
  languageGB: LanguageDate
): Record<DiscountTableCalculationBase, string> => ({
  GW: languageGB.discountTables.discountTable.form.calculationBaseOptions.grossWeight,
  PD: languageGB.discountTables.discountTable.form.calculationBaseOptions.cumulative,
});
