// src/@types/v2/Fiscal/cteEmissao/index.d.ts
// -----------------------------------------------------------------------------
// DTOs/tipos da tela de Emissão SEFAZ do CT-e (execução 045, Onda 2,
// TASK-CTE-FE-09/10/11). `GET /api/v1/ctes/{uuid}/emissao` (E8,
// `CteEmissaoController::show()`) devolve o MESMO `CteDetailResource` já
// consumido pela Onda 1 (`getCte`/`CteData`, mesma `GetCteAction` injetada
// nos dois controllers) — `CteEmissaoData` é um alias, não uma cópia
// divergente, para nunca deixar os dois tipos driftarem silenciosamente.
//
// GAP-CTE-FE-04 (registrado nesta execução, mirror GAP-CTE-FE-03): `POST
// /ctes/{uuid}/transmitir` (`TransmitCteRequest`) valida `issue_id` como
// `integer,exists:issues,id` (PK numérica do Model legado `App\Issue`) — a
// SPA não tem nenhum endpoint wired que exponha esse `id` numérico (todos os
// endpoints de "emissores elegíveis" já existentes —
// `nfes/issuer-options`, `contadores/issues-elegiveis`,
// `issue-dfe-sync-times/eligible-issuers` — devolvem só `uuid`, mesmo padrão
// "uuid, nunca id" do resto da stack). `IssueOptionItem`/`getIssueOptions`
// (service) seguem esse MESMO padrão uuid-only por consistência; o payload
// de `transmitirCte` envia esse uuid em `issue_id` — vai 422 contra o
// backend atual até o Gap ser resolvido (Alternativa A sugerida: mirror
// GAP-CTE-FE-03, `TransmitCteRequest`/`TransmitCteToSefazAction` passam a
// resolver uuid→id internamente). Ver
// `[[97-Esteiras/045/GAPS/GAP-CTE-FE-04-issue-id-integer-vs-uuid-sem-endpoint-options.md]]`.
// -----------------------------------------------------------------------------

import type { CteData } from '@/@types/v2/Fiscal/cte';

// ---- Leitura (GET .../emissao) — mesmo `CteDetailResource` da Onda 1 -------
export type CteEmissaoData = CteData;

// ---- LK19 (mirror GAP-CTE-FE-04) — lookup de emissores elegíveis ----------
export interface IssueOptionItem {
  uuid: string;
  razao_social: string | null;
  nome_fantasia: string | null;
}

// ---- Payloads de escrita (E10/E11/E12) -------------------------------------
export interface TransmitirCteRequest {
  /** GAP-CTE-FE-04 — enviado como uuid (único valor disponível no SPA); o
   *  `TransmitCteRequest` real exige `integer,exists:issues,id`. */
  issue_id: string;
}

export interface CorrigirCteRequest {
  grupo: string;
  campo: string;
  motivo: string;
}

export interface CancelarCteRequest {
  motivo: string;
}

/** Retorno de `POST /ctes/{uuid}/corrigir` — `CorrectCteAction::toArray()`,
 *  shape distinto de `CteDetailResource` (não persiste um novo `estado`,
 *  só incrementa `sequencia_cce` — o call site invalida a query de emissão
 *  para refletir a nova sequência). */
export interface CorrigirCteResult {
  cStat: string;
  motivo: string;
  protocol_number: string;
}

// ---- Formulários locais (Dialogs, TASK-CTE-FE-11) --------------------------
export interface CteCorrecaoFormValues {
  grupo: { value: string; label: string } | null;
  campo: string;
  motivo: string;
}

export interface CteCancelamentoFormValues {
  motivo: string;
}
