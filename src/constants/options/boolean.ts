import { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate) => {
  return new Map<boolean, string>([
    [true, languageGB.defaltStrings.yes],
    [false, languageGB.defaltStrings.no],
  ]);
};

const getLabel = (situation: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(situation)!;

const getOption = (situation: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(situation, languageGB),
  value: situation,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

// Variante ADITIVA (item 8, reprovação AD F-022 — Lote/Fazenda): ordem
// Não-primeiro exigida pelo legado para `has_financial`/`fiscal_document`
// desta feature. NUNCA inverter `options()` global — dezenas de outras
// telas dependem da ordem Sim-primeiro atual.
const optionsReversed = (languageGB: LanguageDate): Option<boolean>[] =>
  [...options(languageGB)].reverse();

export const boolean = {
  getLabel,
  getOption,
  options,
  optionsReversed,
};
