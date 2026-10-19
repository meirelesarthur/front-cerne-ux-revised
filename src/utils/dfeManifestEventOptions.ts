// src/utils/dfeManifestEventOptions.ts
// -----------------------------------------------------------------------------
// CALC-02/CALC-03 (`CONTRATO-TELA-DFE-FE.md §6.3`) — disable das OPÇÕES de
// evento no modal de manifestação (`DfeManifestModal.tsx`, TASK-DFE-FE-06),
// função pura extraída do `acao(id,date)` legado. NÃO confundir com
// `constants/Fiscal/dfe/options/dfe-manifest-event-options.ts` (fábrica de
// LABELS i18n do LOOK-04) — este utilitário só decide DISABLE por prazo,
// vive em `src/utils/` (mirror `dfeManifestDeadline.ts`), a fábrica de
// labels vive em `src/constants/` (dado estático de tradução).
//
// CALC-02: limite de "Ciência" (evento=1) = `data_emissao 23:59:59 + 10 dias`.
// CALC-03: limite dos demais eventos (2,3,4) = `data_emissao 23:59:59 + 180
// dias`.
//
// DIV-03 preservada (`CONTRATO-TELA-DFE-FE.md §6.3`, comentário no código
// apontando a origem do achado, NÃO corrigir sem decisão do dono): o modal em
// modo LOTE nunca desabilita opção por prazo — mirror exato do legado
// (`acao(id,date)` só roda no fluxo individual). `modo` decide isso aqui, no
// ÚNICO ponto de cálculo, para o consumidor (`DfeManifestModal.tsx`) nunca
// precisar replicar a condição `modo === 'lote'` em mais de um lugar.
// -----------------------------------------------------------------------------

import { addDays, isValid, parseISO, set } from 'date-fns';

import { dfeManifestEvent, DfeManifestEventValue } from '@/constants/Fiscal/dfe/dfe-manifest-event';

export type DfeManifestModalMode = 'individual' | 'lote';

const CIENCIA_DEADLINE_DAYS = 10; // CALC-02
const OTHER_EVENTS_DEADLINE_DAYS = 180; // CALC-03

function parseDataEmissao(dataEmissao: string): Date | null {
  if (!dataEmissao) return null;

  const isoParsed = parseISO(dataEmissao);
  if (isValid(isoParsed)) return isoParsed;

  const nativeParsed = new Date(dataEmissao);
  if (isValid(nativeParsed)) return nativeParsed;

  return null;
}

/**
 * CALC-02/CALC-03 — a opção de `evento` deve aparecer DESABILITADA no
 * `Select` do modal de manifestação?
 *
 * DIV-03: em modo `'lote'` NUNCA desabilita (mirror do legado, que só corria
 * `acao(id,date)` no fluxo individual) — só o modo `'individual'` avalia o
 * prazo real.
 *
 * @param {DfeManifestEventValue} evento - Valor do evento (1..4) sendo avaliado.
 * @param {string} dataEmissao - `DfeListItem.data_emissao` (varchar preservado) da(s) Dfe em manifestação.
 * @param {DfeManifestModalMode} modo - `'individual'` aplica CALC-02/03; `'lote'` nunca desabilita (DIV-03).
 * @return {boolean} `true` quando a opção deve aparecer desabilitada no Select.
 */
export function isDfeManifestEventDisabled(
  evento: DfeManifestEventValue,
  dataEmissao: string,
  modo: DfeManifestModalMode
): boolean {
  if (modo === 'lote') return false; // DIV-03 — assimetria preservada

  const emissao = parseDataEmissao(dataEmissao);
  if (!emissao) return false; // data desconhecida — não bloqueia, não inventa

  const deadlineDays =
    evento === dfeManifestEvent.Ciencia ? CIENCIA_DEADLINE_DAYS : OTHER_EVENTS_DEADLINE_DAYS;

  const emissaoEndOfDay = set(emissao, {
    hours: 23,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  });
  const deadline = addDays(emissaoEndOfDay, deadlineDays);

  return new Date() > deadline;
}

export default isDfeManifestEventDisabled;
