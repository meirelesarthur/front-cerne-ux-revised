// src/constants/Fiscal/xml-document/options/xml-document-type-options.ts
// Fábrica de opções de TIPO DE DOCUMENTO do filtro de Arquivos XML (F-133,
// Tarefa 36) — padrão canônico `(languageGB) => Map` + `getLabel`/
// `getOption`/`options` (get_pwa_constants_and_mappers_pattern §3.2), mirror
// `financial-freeze-month-options.ts`. **5 opções** (`todos|nfe|mdfe|dfe|
// nfse`) — `document` é obrigatório no filtro, com default `'todos'`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { XmlDocumentFilterDocument } from '@/@types/v2/Fiscal/xml-document';

const labels = (languageGB: LanguageDate): Map<XmlDocumentFilterDocument, string> =>
  new Map([
    ['todos', languageGB.xmlDocuments.documentTypeOptions.todos],
    ['nfe', languageGB.xmlDocuments.documentTypeOptions.nfe],
    ['mdfe', languageGB.xmlDocuments.documentTypeOptions.mdfe],
    ['dfe', languageGB.xmlDocuments.documentTypeOptions.dfe],
    ['nfse', languageGB.xmlDocuments.documentTypeOptions.nfse],
  ]);

const getLabel = (value: XmlDocumentFilterDocument, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: XmlDocumentFilterDocument,
  languageGB: LanguageDate
): Option<XmlDocumentFilterDocument> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<XmlDocumentFilterDocument>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const xmlDocumentTypeOptions = { getLabel, getOption, options };
