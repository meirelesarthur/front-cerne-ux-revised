// src/@types/v2/Fiscal/dfe/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo DFe Recebidas (Dfe — domínio Fiscal, execução 044,
// TASK-DFE-FE-03). Fonte de fidelidade: `CONTRATO-API-DFE.md §3/§6` (contrato
// de API) e `CONTRATO-TELA-DFE-FE.md §5` (contrato de tela), ambos derivados
// de `contrato-dfe-norm.md` (contrato legado, COMPLETE).
//
// Domínio NÃO é CRUD (mode_matrix.edit/delete = applicable:false no legado) —
// sem create/update/destroy de Dfe. Contratos (envelope ApiResponse
// { success, message, data, errors, meta }):
//   GET  /dfes                    → data: DfeListItem[] + meta paginado real.
//   GET  /dfes/{uuid}             → data: DfeDetail (mesmo shape flat).
//   POST /dfes/sync               → SÍNCRONO (GAP-DFE-02, opção A — decisão
//                                    do dono, DECISOES-DONO.md). Body:
//                                    DfeSyncPayload. Resposta: data =
//                                    DfeListItem[] (delta sincronizado NESTA
//                                    chamada, SEM paginação).
//   GET  /dfes/manifest-events    → lookup estático (LOOK-04).
//   POST /dfes/manifest           → body DfeManifestPayload (individual/lote,
//                                    1..20 uuids).
//   PUT  /dfes/{uuid}/personal    → toggle sem body (mutuamente exclusivo com
//                                    shipment).
//   PUT  /dfes/{uuid}/shipment    → idem.
//   GET  /dfes/{uuid}/danfe       → binário application/pdf.
//   GET  /dfes/{uuid}/xml         → binário application/xml (reusado por
//                                    TASK-DFE-FE-08 para os 4 lançamentos
//                                    cross-módulo).
//   GET  /dfes-report             → binário (pdf|xlsx conforme `type`),
//                                    síncrono (GAP-DFE-02 opção A).
//
// `data_emissao` é `varchar` no backend (fidelidade — NÃO `Date`). NÃO fazer
// `new Date(data_emissao)` sem confirmar o formato real devolvido pela API no
// primeiro payload (Risco documentado em TASK-DFE-FE-03).
//
// `launched_in` já vem PRONTO da API (COALESCE server-side,
// `CONTRATO-API-DFE.md §4`) — o front NÃO recalcula a origem do lançamento.
// -----------------------------------------------------------------------------

// ============================================
// DFE (resposta da API — DfeResource shape real, mirror NfseListItem)
// ============================================

export interface DfeListItem {
  uuid: string;
  chave: string;
  emissor_uuid: string; // Issuer.uuid
  razao_social: string; // desnormalizado (LST-03)
  cpf_cnpj: string;
  issue_ie: string; // IE Fornecedor (LST-04)
  ie: string; // IE Destinatário (LST-05) — escrito por Invoice (UpdateDfePointerAction), não tocar
  number: string;
  serie: string;
  valor: number;
  data_emissao: string; // varchar preservado (fidelidade — NÃO converter p/ Date)
  tipo: '0' | '1'; // 0=Retorno, !=0=Produto/Animal/Despesa (LST-11)
  tipo_evento: 0 | 1 | 2 | 3 | 4; // manifesto (LST-09/LST-10)
  sequencia_evento: number;
  is_personal: boolean;
  is_shipment: boolean;
  launched_in: 'invoice' | 'animal' | 'expense' | 'return' | null; // LST-11 (COALESCE do backend)
  integration_status: 'P' | 'E'; // LST-01 (dot cinza/azul)
}

// GET /dfes/{uuid} devolve o mesmo shape flat da listagem (Resource único,
// sem campos só-de-detalhe) — mirror `NfseDetail`.
export type DfeDetail = DfeListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — real)
// ============================================

export interface DfesListEnvelope {
  success: boolean;
  message: string;
  data: DfeListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-DFE-FE-04) — DfeIndexRequest real
// ============================================

export interface DfeFilterForm {
  /** `nullable` no backend (RN-1 mirror: ausente ⇒ lista vazia) — obrigatório
   *  só por UX no `FilterSideDfe` (TASK-DFE-FE-04). */
  issue_uuid?: string; // FIL-01 (CLM-DFe-036 — sem cascata)
  search?: string; // FIL-02
  start_date?: string; // FIL-03
  end_date?: string; // FIL-04
  // UT-000752 (T-752-FE-01): a API valida `boolean` do Laravel — aceita
  // '1'/'0' (NUNCA 'true'/'false', que devolve 422).
  launched?: '1' | '0'; // FIL-05
  status?: 0 | 1 | 2 | 3 | 4; // FIL-06 (tipo_evento; ausente = "Todos")
  is_personal?: '1' | '0'; // FIL-08
  is_shipment?: '1' | '0'; // FIL-09
}

// ============================================
// "BUSCAR DFe" — POST /dfes/sync (síncrono, GAP-DFE-02 opção A)
// ============================================

export interface DfeSyncPayload {
  issue_uuid: string;
}

// ============================================
// MANIFESTAÇÃO SEFAZ — POST /dfes/manifest (TASK-DFE-FE-06)
// ============================================

export interface DfeManifestPayload {
  dfe_uuids: string[]; // 1..20 (validação client+server)
  evento: 1 | 2 | 3 | 4;
  justificativa?: string; // obrigatória server-side (e client Yup) quando evento in [3,4]
}

/** Forma INTERNA do form do modal de manifestação (react-hook-form,
 * `TASK-DFE-FE-06`). `evento` guarda o `Option` inteiro (mirror padrão de
 * select do projeto); o submit extrai `.value` para `DfeManifestPayload`. */
export interface DfeManifestFormValues {
  evento: import('@/@types/option').Option<1 | 2 | 3 | 4> | null;
  justificativa: string;
}

export const DFE_MANIFEST_EVENT_LOOKUP_QUERY_KEY = 'dfe-manifest-events'; // GET /dfes/manifest-events (LOOK-04)

// ============================================
// RELATÓRIO — GET /dfes-report (TASK-DFE-FE-10)
// ============================================

export interface DfeReportFilterForm {
  issue_uuid: string; // obrigatório NESTA tela (diferente do index — FIL-10)
  start_date?: string; // FIL-11 (emissão)
  end_date?: string; // FIL-12 (emissão)
  launch_start_date?: string; // FIL-13 (lançamento)
  launch_end_date?: string; // FIL-14 (lançamento)
  launched?: '1' | '0'; // FIL-15 (Laravel `boolean` rejeita 'true'/'false' — CTR-09/F-240)
  type: 0 | 1; // FIL-16 (0=PDF, 1=Excel — LOOK-09)
}

// ============================================
// RETORNO — GET /dfes/{uuid}/return-candidates (UT-000752, T-752-FE-03)
// ============================================

export interface DfeReturnSource {
  uuid: string;
  chave: string;
  cpf_cnpj: string;
  razao_social: string;
  valor: number;
}

export interface DfeReturnCandidate {
  uuid: string;
  code: string;
  dt_sale: string; // Y-m-d
  total: number | null;
  nfe_number: string | null;
  client_name: string | null;
  type_label: string;
}

export interface DfeReturnCandidatesEnvelope {
  success: boolean;
  message: string;
  data: {
    dfe: DfeReturnSource;
    suggestions: DfeReturnCandidate[];
    items: DfeReturnCandidate[];
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  } | null;
}

/** Contexto do cabeçalho do Retorno, devolvido junto da página de candidatos. */
export interface DfeReturnContext {
  dfe: DfeReturnSource;
  suggestions: DfeReturnCandidate[];
}

export interface DfeReturnCandidatesParams {
  page?: number;
  per_page?: number;
  date?: string;
  search?: string;
}
