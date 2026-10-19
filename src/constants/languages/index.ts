import { LanguagesDate } from '@/@types/language';

import { languageEnUs } from './languageEnUs';
import { languageEsEs } from './languageEsEs';
import { languagePtBr } from './languagePtBr';

export const languageContextTypes = {
  US: 'US',
  BR: 'BR',
  ES: 'ES',
} as const;

export const languages: LanguagesDate = {
  ...languagePtBr,
  ...languageEnUs,
  ...languageEsEs,
} as const;
