// src/constants/Marker/options/marker-type-options.ts
// Fábrica de opções do enum `type` (MarkerTypeEnum) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2). Mandato explícito da Tarefa
// TASK-MK-FE-01 — NÃO um array `Option<number>[]` inline no componente
// (desvio conhecido de `FamiliaBens/typeDepreciationOptions`, não replicado).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { markerType, MarkerType } from '../marker-type';

const labels = (languageGB: LanguageDate): Map<MarkerType, string> =>
  new Map([
    [markerType.activity, languageGB.markers.marker.type.activity],
    [markerType.infrastructure, languageGB.markers.marker.type.infrastructure],
  ]);

const getLabel = (value: MarkerType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: MarkerType, languageGB: LanguageDate): Option<MarkerType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<MarkerType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const markerTypeOptions = { getLabel, getOption, options };
