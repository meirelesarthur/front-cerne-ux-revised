// src/utils/dfeManifestDeadline.ts
// -----------------------------------------------------------------------------
// CALC-01 (`CONTRATO-TELA-DFE-FE.md §6.3`) — badge "Prazo Manifesto" (LST-10)
// da grid de DFe Recebidas (TASK-DFE-FE-05). 100% client-side (a API NÃO
// implementa prazo, `CONTRATO-API-DFE.md §8` DIV-12). Extraído como
// utilitário PURO/testável, mirror `checkLoadingStatus.ts` (isolado, não
// inline no componente da grid).
//
// Fórmula (preservada 1:1 do legado): `90 - diffInDays(data_emissao, hoje)`;
// "manifestado" sempre que `tipo_evento !== 0` (já manifestada — o prazo não
// se aplica mais, independente da diferença de dias); "encerrado" só com
// decorridos > 90 (T-752-FE-01); senão "restam N dias".
//
// DIV-12 preservada como observada (não corrigida): esta janela de 90 dias é
// DIFERENTE da janela de 10/180 dias usada pelo modal de manifestação
// individual (`dfeManifestEventOptions.ts`, CALC-02/03) — os dois cálculos
// coexistiam divergentes no legado; nenhuma unificação sem decisão do dono.
//
// `data_emissao` é varchar preservado (fidelidade, `CONTRATO-API-DFE.md
// §3.1`) — o parse aqui é DEFENSIVO (ISO primeiro, fallback `Date` nativo)
// porque o formato exato devolvido pela API não foi confirmado em runtime
// ainda (Risco documentado em TASK-DFE-FE-03/05). Data inválida = estado
// "desconhecido" (Lei "sem mock mascarando integração" — nunca finge um
// prazo que não pôde calcular).
// -----------------------------------------------------------------------------

import { isValid, parseISO } from 'date-fns';

// 3 estados visuais EXATOS pedidos pelo contrato (§6.3/§Estados de UI):
// "manifestado" (verde/neutro), "restam N dias" (aviso) e "encerrado"
// (alerta) — sem um 4º estado intermediário inventado.
export type DfeManifestDeadlineStatus = 'manifested' | 'warning' | 'expired' | 'unknown';

export interface DfeManifestDeadlineResult {
  status: DfeManifestDeadlineStatus;
  /** Dias restantes até o prazo de 90 dias (pode ser negativo — já encerrado). */
  daysRemaining: number | null;
}

const MANIFEST_DEADLINE_DAYS = 90;
const MS_PER_DAY = 86_400_000;

function parseDataEmissao(dataEmissao: string): Date | null {
  if (!dataEmissao) return null;

  const isoParsed = parseISO(dataEmissao);
  if (isValid(isoParsed)) return isoParsed;

  const nativeParsed = new Date(dataEmissao);
  if (isValid(nativeParsed)) return nativeParsed;

  return null;
}

/**
 * CALC-01 — status do prazo de manifestação (90 dias) para a badge da grid.
 * @param {string} dataEmissao - `DfeListItem.data_emissao` (varchar preservado).
 * @param {number} tipoEvento - `DfeListItem.tipo_evento` (0 = não manifestada).
 * @return {DfeManifestDeadlineResult} Status + dias restantes (90 - decorridos).
 */
export function getDfeManifestDeadline(
  dataEmissao: string,
  tipoEvento: number
): DfeManifestDeadlineResult {
  if (tipoEvento !== 0) {
    return { status: 'manifested', daysRemaining: null };
  }

  const emissao = parseDataEmissao(dataEmissao);
  if (!emissao) {
    return { status: 'unknown', daysRemaining: null };
  }

  // UT-000752 (T-752-FE-01, CV-01): legado = `diffInDays` (janelas de 24h
  // TRUNCADAS, não dias de calendário) e "encerrado" só com decorridos > 90
  // (aos 90 exatos ainda "restam 0 dia(s)").
  const elapsedDays = Math.floor((Date.now() - emissao.getTime()) / MS_PER_DAY);
  const daysRemaining = MANIFEST_DEADLINE_DAYS - elapsedDays;

  if (elapsedDays > MANIFEST_DEADLINE_DAYS) {
    return { status: 'expired', daysRemaining };
  }

  return { status: 'warning', daysRemaining };
}
