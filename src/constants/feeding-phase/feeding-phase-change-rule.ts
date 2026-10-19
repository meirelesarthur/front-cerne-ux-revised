// src/constants/feeding-phase/feeding-phase-change-rule.ts
// Enum client-side do campo `change_rule` de Item da Fase (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-01). Mirror
// estrutural de `diet/diet-objective.ts` — união literal DECLARADA DE NOVO
// aqui (decoupling: este arquivo não depende de import cruzado de
// `@/@types/v2/FeedingPhases`).
//
// `PD`=Por Dias, `PP`=Por Peso — confirmado por leitura direta de
// `App\Enums\FeedingPhaseChangeRule` (`GB.Cerne.Api`,
// `app/Enums/FeedingPhaseChangeRule.php`).

import type { LanguageDate } from '@/@types/language';

export type FeedingPhaseChangeRule = 'PD' | 'PP';

export const FEEDING_PHASE_CHANGE_RULE = {
  BY_DAYS: 'PD',
  BY_WEIGHT: 'PP',
} as const;

// Ordem PD antes de PP (LM-02) — mesma ordem do enum server-side.
export const FEEDING_PHASE_CHANGE_RULES: FeedingPhaseChangeRule[] = [
  FEEDING_PHASE_CHANGE_RULE.BY_DAYS,
  FEEDING_PHASE_CHANGE_RULE.BY_WEIGHT,
];

/**
 * Rótulo do enum `FeedingPhaseChangeRule`, SEMPRE via i18n (nunca
 * hardcoded) — consumido pela fábrica de opções
 * (`options/feeding-phase-change-rule-options.ts`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<FeedingPhaseChangeRule, string>} Mapa `FeedingPhaseChangeRule` → rótulo traduzido.
 */
export const feedingPhaseChangeRuleLabel = (
  languageGB: LanguageDate
): Record<FeedingPhaseChangeRule, string> => ({
  PD: languageGB.feedingPhases.feedingPhase.form.changeRuleOptions.byDays,
  PP: languageGB.feedingPhases.feedingPhase.form.changeRuleOptions.byWeight,
});

/**
 * Unidade dinâmica do par Mínimo/Início e Máximo/Fim (CV-03) — "dias" (PD)
 * ou "kg" (PP), derivada do enum/`unit_label` do backend
 * (`ItemFeedingPhaseResource.php`). Mapa LOCAL espelhando o mesmo valor do
 * `unitLabel()` server-side (`FeedingPhaseChangeRule.php`), usado quando a
 * linha ainda não tem `unit_label` hidratado da API (linha nova no create).
 */
export const feedingPhaseChangeRuleUnit: Record<FeedingPhaseChangeRule, string> = {
  PD: 'dias',
  PP: 'kg',
};
