// src/constants/RecentActivities/options/recent-activity-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do enum `RecentActivityType` (UT-000690 / F-349). O label
// vem do i18n (`languageGB.recentActivities.recentActivity.types.*`). Valor
// desconhecido (tipo futuro devolvido pela API) → `getLabel` devolve
// `undefined` e a tela cai no `type_label` da API (AD-FE-02).
// -----------------------------------------------------------------------------

import {
  recentActivityType,
  type RecentActivityType,
} from '@/constants/RecentActivities/recent-activity-type';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<RecentActivityType, string> => {
  const text = languageGB.recentActivities.recentActivity.types;
  return new Map<RecentActivityType, string>([
    [recentActivityType.serviceOrder, text.serviceOrder],
    [recentActivityType.animalBatchTransfer, text.animalBatchTransfer],
    [recentActivityType.batchAreaTransfer, text.batchAreaTransfer],
    [recentActivityType.separation, text.separation],
    [recentActivityType.deathAnimal, text.deathAnimal],
    [recentActivityType.lossAnimal, text.lossAnimal],
    [recentActivityType.birthAnimal, text.birthAnimal],
    [recentActivityType.weaning, text.weaning],
    [recentActivityType.weighing, text.weighing],
    [recentActivityType.sanitary, text.sanitary],
    [recentActivityType.pasture, text.pasture],
    [recentActivityType.dietBeat, text.dietBeat],
    [recentActivityType.feeding, text.feeding],
    [recentActivityType.appropriation, text.appropriation],
    [recentActivityType.marking, text.marking],
    [recentActivityType.breedingMating, text.breedingMating],
    [recentActivityType.pregnancyDiagnosis, text.pregnancyDiagnosis],
    [recentActivityType.supply, text.supply],
    [recentActivityType.maintenance, text.maintenance],
  ]);
};

const getLabel = (value: string, languageGB: LanguageDate): string | undefined =>
  labels(languageGB).get(value as RecentActivityType);

const getOption = (
  value: RecentActivityType,
  languageGB: LanguageDate
): Option<RecentActivityType> => ({
  label: labels(languageGB).get(value) ?? value,
  value,
});

const options = (languageGB: LanguageDate): Option<RecentActivityType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const recentActivityTypeOptions = { getLabel, getOption, options };
