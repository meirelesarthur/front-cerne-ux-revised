// src/constants/Fiscal/dfe/options/dfe-manifest-event-options.ts
// Fábrica de opções do evento de manifestação SEFAZ (LOOK-04, `Dfe —
// domínio Fiscal, execução 044, TASK-DFE-FE-03). Alimenta o `Select` do
// modal de manifestação (TASK-DFE-FE-06). Contrato de tela (`CONTRATO-TELA-
// DFE-FE.md §6.6`) pede alimentação por `GET /dfes/manifest-events`
// (`get_manifest_events` do service) — a Tarefa consumidora do lookup
// (TASK-DFE-FE-06, via `useQuery` + `queryKey.dfes.manifestEvents`) decide
// se usa a resposta da API para os LABELS; os VALUES (1..4) são fixos e já
// espelham o `dfeManifestEvent` (enum canônico, `dfe-manifest-event.ts`).
//
// Fallback estático (decisão do Executor, documentada): esta fábrica é
// standalone e NÃO depende da rede — ela sempre resolve os 4 labels via
// `languageGB.dfes.dfe.manifest.eventOptions.*` (i18n local, já traduzido
// nos 3 idiomas do projeto na Tarefa 03). Se `TASK-DFE-FE-06` optar por
// preferir o label vindo da API quando a query de lookup responder, o
// consumidor faz o merge; esta fábrica cobre o caso "API indisponível/lookup
// falhou" sem deixar o `Select` vazio (Lei UX "nenhum estado silencioso").

import { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { dfeManifestEvent, DfeManifestEventValue } from '../dfe-manifest-event';

const labels = (languageGB: LanguageDate): Map<DfeManifestEventValue, string> => {
  const text = languageGB.dfes.dfe.manifest.eventOptions;
  return new Map([
    [dfeManifestEvent.Ciencia, text.ciencia],
    [dfeManifestEvent.Confirmacao, text.confirmacao],
    [dfeManifestEvent.Desconhecimento, text.desconhecimento],
    [dfeManifestEvent.NaoRealizada, text.naoRealizada],
  ]);
};

const getLabel = (value: DfeManifestEventValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DfeManifestEventValue,
  languageGB: LanguageDate
): Option<DfeManifestEventValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<DfeManifestEventValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const dfeManifestEventOptions = { getLabel, getOption, options };
