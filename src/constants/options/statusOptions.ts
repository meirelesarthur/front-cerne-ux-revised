import { LanguageDate } from "@/@types/language";
import { Option } from "@/@types/option";

const labels = (languageGB: LanguageDate) => {
  return new Map<boolean, string>([
    [true, languageGB.defaltStrings.active],
    [false, languageGB.defaltStrings.inactive],
  ]);
};

const getLabel = (situation: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(situation)!;

const getOption = (
  situation: boolean,
  languageGB: LanguageDate
): Option<boolean> => ({
  label: getLabel(situation, languageGB),
  value: situation,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const statusOptions = {
  getLabel,
  getOption,
  options,
};
