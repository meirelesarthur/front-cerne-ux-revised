// src/constants/Fiscal/xml-document/options/xml-document-status-options.ts
// Fábrica de opções de STATUS do filtro de Arquivos XML (F-133, Tarefa 36) —
// mesmo padrão de `xml-document-type-options.ts`. **APENAS 2 opções**
// (`aprovado|cancelado`) — o legado NÃO oferece "todos" para este campo
// (armadilha confirmada 4 da Tarefa; `status` sem "todos" é fidelidade da
// API, `api-contract-arquivos-xml.md §2` AD-08).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { XmlDocumentFilterStatus } from '@/@types/v2/Fiscal/xml-document';

const labels = (languageGB: LanguageDate): Map<XmlDocumentFilterStatus, string> =>
  new Map([
    ['aprovado', languageGB.xmlDocuments.statusOptions.aprovado],
    ['cancelado', languageGB.xmlDocuments.statusOptions.cancelado],
  ]);

const getLabel = (value: XmlDocumentFilterStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: XmlDocumentFilterStatus,
  languageGB: LanguageDate
): Option<XmlDocumentFilterStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<XmlDocumentFilterStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const xmlDocumentStatusOptions = { getLabel, getOption, options };
