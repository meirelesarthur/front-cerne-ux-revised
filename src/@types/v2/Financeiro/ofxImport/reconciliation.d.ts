// src/@types/v2/Financeiro/ofxImport/reconciliation.d.ts
// -----------------------------------------------------------------------------
// Tipos da CONCILIAÇÃO BANCÁRIA da Importação OFX (OfxImport — Financeiro,
// F-114, 97-Esteiras/064, TASK-064-OFX-FE-02). Mirror 1:1 de
// `App\Http\Resources\V1\OfxReconciliationResource`/`OfxReconciliationItemData`/
// `OfxReconciliationResultData` (api_root, leitura direta — TASK-064-OFX-02
// já implementada no fork).
//
// `GET`+`POST /ofx-imports/{uuid}/reconciliation` devolvem a MESMA forma
// (`OfxReconciliationResult`) — o `POST` (apply) NÃO recebe payload (o
// servidor reprocessa o parse do OFX e casa/grava is_reconciled em massa,
// Decisão 2 da arquitetura de API); por isso não há um tipo de "request de
// aplicação" aqui, o `store()` é `POST` com corpo vazio.
//
// `value` SEMPRE positivo (`abs(TRNAMT)`, CV-02); `type` deriva do sinal
// original (`E`=entrada/`S`=saída) — reaproveita `MovementTypeCode`
// (`@/@types/v2/Movements`), MESMO domínio de valor (não um enum próprio).
//
// UT-000753 (a) — `account` (NOVO campo, API_UT753): projeção da `Account`
// já eager-loaded pelo backend (`OfxReconciliationResultData`), mesmo shape
// de `OfxImportAccountSummary` (`uuid`/`code`/`description`/`bank`). Fonte
// PREFERENCIAL de conta bancária para esta tela — exige SOMENTE
// `import_ofx_edit` (gate único de `.../reconciliation`), diferente de
// `GET /ofx-imports/{uuid}` (`import_ofx_view`, gate separado e NÃO tocado
// por esta correção). `null` só no caso teórico de `OfxImport` sem
// `account_id` resolvido (FK obrigatória no cadastro, não deveria ocorrer).
//
// UT-000753 (a, etapa b) — `account.investment_account` (NOVO campo aninhado,
// API_UT753 etapa b): `{uuid, description} | null`, mesmo shape de
// `AccountResource::toArray()['investment_account']` (`AccountDetail` em
// `@/@types/v2/CadastrosBase/account`), projetado pelo mesmo
// `accountSummary()` do backend — `null` quando `investment_account_id` da
// conta do OFX não está preenchido (mesma condição que já controla
// `pending_investments`, CLM-22). Fonte ÚNICA da conta de investimento do
// `BulkInvestmentBanner` (SURF-063) — `GET /accounts/{uuid}` (`accounts_view`,
// nunca afrouxado) NÃO é mais chamado por esta tela.
// -----------------------------------------------------------------------------

import type { OfxImportAccountSummary } from '@/@types/v2/Financeiro/ofxImport';
import type { MovementTypeCode } from '@/@types/v2/Movements';

// ============================================
// CLASSIFICAÇÃO por termos do MEMO (`OfxTransactionClassifier`, CLM-22) —
// só usada para destacar a linha e alimentar o banner de lote (SURF-063).
// ============================================

export type OfxReconciliationClassification = 'INVESTMENT' | 'REDEMPTION' | 'COMMON';

// ============================================
// ITEM (linha) — 1 transação do extrato bancário, já classificada e
// (opcionalmente) casada com um `Movement` já existente no sistema.
// ============================================

export interface OfxReconciliationItem {
  fit_id: string;
  /** ISO "YYYY-MM-DD" — data da transação bancária (não editável, FLD-20). */
  date: string;
  /** Sempre positivo (CV-02) — o front NUNCA reconstrói o sinal a partir de
   *  `type`, o servidor já entrega o valor absoluto. */
  value: number;
  type: MovementTypeCode;
  /** Descrição bruta da transação bancária (MEMO/TRNMEMO) — mirror FLD-26
   *  (autofill do `note` do modal de movimento, truncado a 40 chars pelo
   *  FRONT, não pelo servidor). */
  memo: string;
  classification: OfxReconciliationClassification;
  /** `null` quando nenhum `Movement` do período bateu exatamente
   *  (value+date+type, CV-12/CLM-12) — linha PENDENTE (SURF-064/065). */
  matched_movement_uuid: string | null;
  /** Estado ATUAL (no momento da leitura) do `is_reconciled` do Movement
   *  casado — sempre `false` quando `matched_movement_uuid` é `null`.
   *  `true` = já conciliado (mostra "Desconciliar", SURF-069); `false` COM
   *  `matched_movement_uuid` preenchido = casado mas AINDA NÃO aplicado
   *  (aparece como tal até o usuário disparar "Aplicar Conciliação"). */
  reconciled: boolean;
  /**
   * FASE 3 (proposta de UX da conciliação) — candidatos ORDENADOS por `score` desc. OPCIONAL: o
   * backend atual não envia; sem o campo a tela cai no comportamento anterior (confirmar todas
   * as linhas já casadas). Contrato sugerido ao backend em `docs/ux/funcionalidades/conciliacao-ofx.md`.
   */
  candidates?: OfxReconciliationCandidate[];
}

// ============================================
// CANDIDATOS (FASE 3) — título(s)/movimento(s) que podem explicar uma transação do extrato.
// ============================================

export interface OfxReconciliationReason {
  /** Texto curto já pronto para exibir (ex.: "Valor igual", "Mesmo fornecedor"). */
  label: string;
  /** `true` = critério atendido (✓); `false` = parcial/aproximado (≈). */
  matched: boolean;
}

export interface OfxReconciliationCandidate {
  /** Identificador do candidato (movimento ou título; "A+B" para soma de vários). */
  id: string;
  title: string;
  subtitle: string;
  /** 0–100. ≥90 = alta confiança; 60–89 = média; <60 = baixa. */
  score: number;
  reasons: OfxReconciliationReason[];
  /** `true` quando o candidato é a SOMA de 2+ títulos que fecha o valor. */
  multi?: boolean;
}

/** Escolha do usuário para uma linha — corpo de `POST …/reconciliation/confirm`. */
export interface OfxReconciliationConfirmPick {
  fit_id: string;
  candidate_id: string;
}

export interface OfxReconciliationConfirmResult extends OfxReconciliationResult {
  /** Linhas confirmadas agora, com o movimento resultante (base do Desfazer). */
  confirmed: { fit_id: string; matched_movement_uuid: string }[];
}

// ============================================
// CONTA (com conta de investimento aninhada) — UT-000753 (a, etapa b).
// ============================================

export interface OfxReconciliationAccount extends OfxImportAccountSummary {
  /** `null` quando a conta do OFX não tem `investment_account_id` setado
   *  (ver nota de cabeçalho do arquivo). */
  investment_account: { uuid: string; description: string } | null;
}

// ============================================
// RESULTADO COMPLETO — mesma forma no `GET` (preview) e no `POST` (apply).
// ============================================

export interface OfxReconciliationResult {
  /** UT-000753 (a) — ver nota de cabeçalho do arquivo. */
  account: OfxReconciliationAccount | null;
  items: OfxReconciliationItem[];
  total_items: number;
  reconciled_count: number;
  /** 0..100, já arredondado pelo servidor (CV-03) — front só formata. */
  progress_percent: number;
  /** Subconjunto de `items`, classificados `INVESTMENT`, ainda sem match —
   *  SÓ presente quando a `Account` do OFX tem `investment_account`
   *  preenchido (mirror exato da condição legada do banner "Aplicações e
   *  Resgates em Lote", SR-08/SURF-063). Array vazio = banner oculto. */
  pending_investments: OfxReconciliationItem[];
}
