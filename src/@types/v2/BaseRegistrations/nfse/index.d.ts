// src/@types/v2/BaseRegistrations/nfse/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo NFSe Recebidas (Nfse — domínio Fiscal, execução 033,
// TASK-FE-2730). Fonte batida linha a linha contra o código REAL do backend
// já entregue (`GB.Cerne.Api`, branch `feature/refactor-plans-appropriations-
// invoices-nfe`, TASK-BE-973/974/975, `🔬 PARA TESTE`):
//   - app/Http/Resources/V1/NfseResource.php (shape de saída)
//   - app/Http/Requests/Api/V1/NfseIndexRequest.php (filtros aceitos)
//   - app/Http/Requests/Api/V1/NfseStoreRequest.php (payload "Buscar DFe")
//   - app/Data/ExpenseDraftData.php (`#[MapName(SnakeCaseMapper::class)]` —
//     snake_case também na SAÍDA, não confundir com `PlanRoleResource`
//     camelCase de outro módulo)
//
// Domínio NÃO é CRUD (contrato §1/§7.4) — sem create/update/destroy de Nfse,
// só leitura + ações de download/lançamento. Contratos (envelope ApiResponse
// { success, message, data, errors, meta }):
//   GET    /nfses                      → data: NfseListItem[] + meta paginado
//                                         real. Filtros: issuer_uuid
//                                         (nullable — AUSENTE ⇒ lista vazia,
//                                         RN-1), search, launched, date_from,
//                                         date_to.
//   GET    /nfses/{uuid}               → data: NfseListItem (detalhe).
//   POST   /nfses                      → SÍNCRONO (200, GAP-BE-519). Body:
//                                         { issuer_uuid }. Resposta: data =
//                                         NfseListItem[] (delta sincronizado
//                                         NESTA chamada, SEM paginação).
//   GET    /nfses/{uuid}/xml           → binário application/xml.
//   GET    /nfses/{uuid}/danfe         → binário application/pdf.
//   POST   /nfses/{uuid}/expense-draft → JSON (data = ExpenseDraftData, NÃO
//                                         persiste Expense). 422 se já
//                                         hasLinkedExpense (RN-14) ou sem
//                                         chave/cpf_cnpj.
//
// Decisão herdada (GAP-BE-518, APROVADO): `is_personal`/`integration_status`
// são código morto DESCARTADOS — NUNCA modelar a legenda "Integrado com a
// Domínio" aqui. A única coluna de status real é `is_launched`.
// -----------------------------------------------------------------------------

import type { Response } from '@/@types/response-api';

// ============================================
// NFSE (resposta da API — NfseResource::toArray() real)
// ============================================

export interface NfseListItem {
  uuid: string;
  issuer_uuid: string;
  issuer_razao_social: string;
  chave: string;
  name: string;
  cpf_cnpj: string;
  value: number;
  dt_emission: string;
  competence: string;
  city_code: string;
  number: string;
  serie: string;
  description: string;
  has_file: boolean;
  is_launched: boolean;
  launched_expense_uuid: string | null;
  // UT-000776 T-776-FE-09 (contrato fixo, T-776-DB-03/API-11): grupo de
  // tributos IBS/CBS. Nota sem grupo tributário ⇒ todos `null`.
  c_class_trib: string | null;
  cst_ibs_cbs: string | null;
  v_bc_ibs_cbs: number | null;
  v_ibs_uf: number | null;
  v_ibs_mun: number | null;
  v_cbs: number | null;
  v_liquido: number | null;
}

// GET /nfses/{uuid} devolve o mesmo shape flat da listagem (Resource único,
// sem campos só-de-detalhe) — mesmo racional de `IssueDfeSyncTimeDetail`.
export type NfseDetail = NfseListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface NfsesListEnvelope {
  success: boolean;
  message: string;
  data: NfseListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// FILTRO (drawer da listagem) — NfseIndexRequest real
// ============================================

export interface NfseFilterForm {
  /** `nullable` no backend (RN-1: ausente ⇒ lista vazia) — obrigatório só
   *  por UX na Listagem/`FilterSideNfseRecebidas` (TASK-FE-2731/2732). */
  issuer_uuid?: string;
  search?: string;
  launched?: 'true' | 'false';
  date_from?: string;
  date_to?: string;
}

// ============================================
// "BUSCAR DFe" — POST /nfses (síncrono, GAP-BE-519)
// ============================================

export interface NfseSyncPayload {
  issuer_uuid: string;
}

/** `meta` do `POST /nfses` (UT-000754): contagem real e ambiente do emissor. */
export interface NfseSyncMeta {
  synced_count: number;
  environment: 'producao' | 'homologacao';
}

/** Envelope do `POST /nfses`; `meta` ausente em API antiga (fallback `data.length`). */
export type NfseSyncEnvelope = Response<NfseListItem[]> & {
  meta?: NfseSyncMeta | null;
};

// ============================================
// RASCUNHO DE DESPESA — POST /nfses/{uuid}/expense-draft
// (ExpenseDraftData REAL, `#[MapName(SnakeCaseMapper::class)]` — saída
// snake_case de ponta a ponta, NÃO camelCase como outros módulos)
// ============================================

export interface NfseExpenseDraft {
  /** Chave nacional da NFS-e (50 caracteres). */
  xml_key: string;
  /** Sem zeros à esquerda (≤15); `null` quando a NFS-e não traz número. */
  number: string | null;
  /** `Y-m-d`. */
  dt_emission: string | null;
  /** `Y-m-d` (= `dt_emission`, mirror legado). */
  due_date: string | null;
  /** vServ. */
  amount: number;
  /** xDescServ. */
  note: string;
  provider_uuid: string;
  /** `false` = Provider/Person criado agora (find-or-create, GAP-BE-520). */
  provider_matched: boolean;
  /** Tomador no escopo do tenant; `null` quando não resolvido. */
  proprietary_uuid: string | null;
  /** Fazenda do `X-Farm-Id` usado na chamada. */
  farm_uuid: string | null;
  type_note_id: number;
  type_id: number;
  fiscal_document: boolean;
  is_taxation: boolean;
  payment_type: number;
  appropriation: number;
  /** @deprecated use `note`. */
  description?: string;
  /** @deprecated use `amount`. */
  value?: number;
  /** @deprecated use `type_note_id`. */
  type_note?: number;
}
