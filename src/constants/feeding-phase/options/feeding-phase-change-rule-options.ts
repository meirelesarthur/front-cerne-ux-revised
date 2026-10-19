// src/constants/feeding-phase/options/feeding-phase-change-rule-options.ts
// Fábrica de opções do campo `change_rule` de Item da Fase (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-01). Padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror `dietObjectiveOptions`.
// Ordem PD antes de PP (LM-02).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import {
  FEEDING_PHASE_CHANGE_RULES,
  feedingPhaseChangeRuleLabel,
  FeedingPhaseChangeRule,
} from '../feeding-phase-change-rule';

const labels = (languageGB: LanguageDate): Map<FeedingPhaseChangeRule, string> => {
  const label = feedingPhaseChangeRuleLabel(languageGB);
  return new Map(FEEDING_PHASE_CHANGE_RULES.map((changeRule) => [changeRule, label[changeRule]]));
};

const getLabel = (value: FeedingPhaseChangeRule, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FeedingPhaseChangeRule | null | undefined,
  languageGB: LanguageDate
): Option<FeedingPhaseChangeRule> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<FeedingPhaseChangeRule>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const feedingPhaseChangeRuleOptions = { getLabel, getOption, options };
