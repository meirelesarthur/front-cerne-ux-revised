// src/constants/operacional/reproducao/protocolSeason/options/protocolSeason-service-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do enum `PROTOCOL_ITEM_SERVICE` (LKP-009) — 4 valores
// fixos hardcoded, `NAO_APLICAVEL` como endpoint (contrato-frontend §2.4).
// Labels mirror EXATO `ProtocolItemServiceEnum::label()` do backend — não
// inventar rótulo (contrato-frontend TASK-FE-1050 §3).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { PROTOCOL_ITEM_SERVICE, type ProtocolItemService } from '../protocol-item-service';

const labels = (languageGB: LanguageDate): Map<ProtocolItemService, string> => {
  const text = languageGB.protocolSeasons.protocolSeason.services;
  return new Map([
    [PROTOCOL_ITEM_SERVICE.Insemination, text.insemination],
    [PROTOCOL_ITEM_SERVICE.Ultrasound, text.ultrasound],
    [PROTOCOL_ITEM_SERVICE.PregnancyDiagnosis, text.pregnancyDiagnosis],
    [PROTOCOL_ITEM_SERVICE.ImplantRemoval, text.implantRemoval],
  ]);
};

const getLabel = (value: ProtocolItemService, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ProtocolItemService,
  languageGB: LanguageDate
): Option<ProtocolItemService> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ProtocolItemService>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const protocolSeasonServiceOptions = { getLabel, getOption, options };

export default protocolSeasonServiceOptions;
