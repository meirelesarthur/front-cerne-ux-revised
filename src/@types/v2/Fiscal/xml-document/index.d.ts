// src/@types/v2/Fiscal/xml-document/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Arquivos XML" (F-133, Gestão Fiscal, esteira 97-Esteiras/008,
// Tarefa 36). Fonte de fidelidade: `spa-contract-arquivos-xml.md §3/§5.1` +
// `api-contract-arquivos-xml.md §2`. Entidade: NENHUMA — a listagem é uma
// PROJEÇÃO AGREGADA (`UNION ALL`) sobre 4 tabelas fiscais (nves/mdves/dves/
// nfses), sem Model que a represente.
//
// 3 fidelidades do wire que este arquivo preserva (não "corrigir" na Tarefa
// 37 nem em manutenção futura):
//   1. `counterparty_name` é SEMPRE `null` em MDFe — literal `NULL::varchar`
//      no SELECT do backend (fidelidade, não bug). Renderizar `?? '--'`.
//   2. `emitted_at` é `::text` de 4 colunas heterogêneas por ramo (uma delas
//      `dves.data_emissao`, `varchar(25)` legado) — NUNCA `new Date(...)`;
//      usar `formatDate(emitted_at, 'dd/MM/yyyy HH:mm')` (mirror
//      `Fiscal/Dfe/index.tsx:500`, GAP-XML-FE-01).
//   3. `state` é string CRUA do servidor, SEM Enum unificador (AD-08 da API
//      — vocabulário heterogêneo por tipo de documento: NFe/MDFe têm string
//      livre, DFe deriva de `tipo_evento`, NFSe deriva Lançada/Não lançada).
//      Só a COR do badge é derivada (por substring), nunca o texto/tradução.
// -----------------------------------------------------------------------------

export type XmlDocumentType = 'nfe' | 'mdfe' | 'dfe' | 'nfse';
export type XmlDocumentFilterDocument = 'todos' | XmlDocumentType;
export type XmlDocumentFilterStatus = 'aprovado' | 'cancelado';

// ============================================
// FILTRO — os 6 params reais de `GET /xml-documents` (E1). Os 5 primeiros
// são pré-condição da consulta (AD-F03); `launched` é opcional e só se
// aplica ao ramo DFe (não é cascata por `document`).
// ============================================

export interface XmlDocumentFilterQuery {
  issue: string; // uuid do emissor — nunca id
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  document: XmlDocumentFilterDocument;
  status: XmlDocumentFilterStatus;
  launched?: '0' | '1'; // só ramo DFe; ausente = param não enviado
}

// ============================================
// ITEM (XmlDocumentResource — 9 campos exatos, wire real)
// ============================================

export interface XmlDocumentItem {
  uuid: string;
  document_type: XmlDocumentType;
  document_label: string; // "NFe"|"MDFe"|"DFe"|"NFSe" — rótulo técnico do servidor, não string de UI
  chave: string | null;
  counterparty_name: string | null; // MDFe é sempre null — fidelidade 1
  emitted_at: string | null; // ::text heterogêneo — fidelidade 2
  state: string | null; // string crua, sem Enum — fidelidade 3
  amount: number; // já é number com .00 preservado — nunca Number()/parse
  nsu: number; // 0 (literal) em NFe/MDFe; real em DFe/NFSe — NÃO vira coluna
}

export interface XmlDocumentGroupData {
  document_type: XmlDocumentType;
  document_label: string;
  count: number;
  subtotal: number;
  items: XmlDocumentItem[];
}

// ============================================
// ENVELOPE (wire real de E1 — dois formatos, discriminados por
// `meta.query_executed`; `data: null` + `query_executed: false` é 200, NUNCA
// 422/erro — ver AD-F03/armadilha 1 da Tarefa 36).
// ============================================

export interface XmlDocumentsListEnvelope {
  success: boolean;
  message: string;
  data: { groups: XmlDocumentGroupData[] } | null;
  errors: Record<string, string[]> | null;
  meta: {
    query_executed: boolean;
    total_count?: number;
    total_amount?: number;
    filters_echo?: Record<string, unknown>;
  } | null;
}

/** View model devolvido pelo service — adapta envelope + `meta` num só
 *  objeto para o hook/consumidor (mirror do adaptador de `financial-freeze-
 *  service.ts`/`ofx-import-service.ts`, que adaptam `meta` → `pagination`). */
export interface XmlDocumentsListResult {
  queryExecuted: boolean;
  groups: XmlDocumentGroupData[];
  totalCount: number;
  totalAmount: number;
}

// ============================================
// ISSUERS — `GET /xml-documents/issuers` (E2). Lookup PRÓPRIO desta tela
// (AD-F09) — NÃO é o `/issuers` do CRUD de Emissores.
// ============================================

export interface XmlDocumentIssuerOption {
  uuid: string;
  razao_social: string;
  cpf_cnpj: string;
  full_description: string; // "{razao_social} [{cpf_cnpj}]" — rótulo legado (LK-01)
}

// ============================================
// EXPORTAÇÃO — `POST /xml-documents/download` (E3) e `POST /xml-documents/
// send-email` (E4), body idêntico. Tipos já nascem aqui (Tarefa 36); a
// Tarefa 37 consome `downloadXmlDocumentsZip`/`sendXmlDocumentsEmail`.
// ============================================

export interface XmlDocumentExportItem {
  type: XmlDocumentType;
  uuid: string;
}

export interface XmlDocumentExportPayload {
  issue: string; // uuid do emissor
  documents: XmlDocumentExportItem[]; // min:1 no backend
}
