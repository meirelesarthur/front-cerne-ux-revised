// src/constants/Fiscal/xml-document/options/xml-document-launched-options.ts
// Fábrica de opções de LANÇADA do filtro de Arquivos XML (F-133, Tarefa 36).
// 2 opções (`'0'`/`'1'`, STRING — o wire é `'0'|'1'`, não booleano) + a
// ausência (campo limpo = param não enviado, ver `useXmlDocuments.tsx`).
// NÃO reusa `src/constants/options/boolean.ts` — aquele mapeia para
// `boolean`, este precisa da string crua exigida pelo backend (armadilha
// confirmada 5 da Tarefa: `launched` fica sempre visível/habilitado, é o
// servidor que só o aplica ao ramo DFe — não é cascata por `document`).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<'0' | '1', string> =>
  new Map([
    ['1', languageGB.xmlDocuments.launchedOptions.yes],
    ['0', languageGB.xmlDocuments.launchedOptions.no],
  ]);

const getLabel = (value: '0' | '1', languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: '0' | '1', languageGB: LanguageDate): Option<'0' | '1'> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<'0' | '1'>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const xmlDocumentLaunchedOptions = { getLabel, getOption, options };
