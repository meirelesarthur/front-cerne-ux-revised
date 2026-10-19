// src/@types/v2/XmlPrefill/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo COMPARTILHADO de Prefill/Download de XML — esteira 036,
// Onda 3 sub-onda 3f (B-05), TASK-FE-036-340. Consumido tanto por Contas a
// Pagar (Expense, `segment: 'expenses'`) quanto por Contas a Receber (Income,
// `segment: 'incomes'`) — mesmo racional de compartilhamento já usado por
// `@types/v2/ImportExport` (`ImportExportSegment`) e `@types/v2/WriteOff`.
// NÃO DUPLICAR: qualquer módulo com o mesmo contrato de upload/parse/download
// de XML importa DESTE arquivo.
//
// Contrato REAL confirmado por leitura direta do backend (`GB.Cerne.Api`,
// `StoreExpenseAction`/`StoreIncomeAction`/`ExpenseRequest`/`IncomeRequest`,
// já commitado) — 2 achados CRÍTICOS que mudam o tratamento na Tarefa de
// integração (TASK-FE-036-342), não neste arquivo de tipos:
//
//   1. `xml_key` NUNCA é persistido HOJE pelo `store()` final de Expense/
//      Income — nenhum dos 2 Form Requests tem `xml_key` em `rules()`, e
//      nenhuma das 2 Actions escreve esse campo no INSERT. O arquivo físico
//      é gravado direto no path definitivo pelo `parseXml`, mas o vínculo
//      textual entre o título criado e esse arquivo não existe ainda — Gap
//      de API pendente (mirror do padrão `chave`/`InvoiceRequest` que já
//      resolve esse problema para Invoice).
//   2. Semântica ASSIMÉTRICA de `*_matched` — `provider_matched`(Expense)/
//      `client_matched`(Income) fazem find-or-create REAL (`matched=false` =
//      "criado agora", uuid SEMPRE válido); `proprietary_matched`(Income, só
//      ramo NFe) faz busca simples SEM criar (`matched=false` = "não
//      encontrado" de verdade, `proprietary_uuid=null`).
//
//   POST /{segment}/xml                    → multipart `file` → envelope
//        `Response<ExpenseXmlDraft | IncomeXmlDraft>` (200, nada persistido).
//   GET  /{segment}/{uuid}/download-xml    → binário do XML definitivo, SEM
//        o envelope `ApiResponse` (mirror `downloadInvoiceXml`/
//        `downloadImportTemplate`), `responseType: 'blob'`.
// -----------------------------------------------------------------------------

/** Segmento — a única diferença estrutural entre Expense/Income é o path da URL (mirror `ImportExportSegment`). */
export type XmlPrefillSegment = 'incomes' | 'expenses';

/**
 * Draft de Contas a Pagar (Expense) — `POST /expenses/xml`
 * (`ParseExpenseNfseXmlAction`). Só reconhece NFSe (Expense rejeita XML de
 * NFe com 422 de negócio, tratado pelo `XmlPrefillModal`).
 */
export interface ExpenseXmlDraft {
  /** Chave da NFSe (até 50 chars; aleatória no import de XML, nacional no rascunho de NFS-e Recebidas). */
  xml_key: string;
  note: string;
  amount: number;
  /** `find-or-create` real por NIF — SEMPRE um uuid válido, mesmo quando `provider_matched===false`. */
  provider_uuid: string;
  /** `false` = Provider/Person CRIADO agora pelo parse (não bloqueante, apenas informativo). */
  provider_matched: boolean;
  dt_emission: string;
  /**
   * Bug preservado do legado (`ParseExpenseNfseXmlAction`, comentário
   * explícito no próprio backend) — string vazia na maioria dos casos. NÃO
   * corrigir no front, é decisão do backend.
   */
  number: string;
  /** Fixo `3` — inteiro legado sem tradução determinística para uuid do fork. */
  type_note_id: number;
  /** Fixo `18` — idem `type_note_id`. */
  type_id: number;
}

/**
 * Draft de Contas a Receber (Income) — `POST /incomes/xml`. Ramo determinado
 * por `document_type` (`nfe`/`nfse`) — campos/semânticas divergem entre os 2
 * (ver `proprietary_uuid`/`proprietary_matched` abaixo).
 */
export interface IncomeXmlDraft {
  /**
   * Ramo NFe: chave fiscal REAL extraída do XML (44 dígitos numéricos).
   * Ramo NFSe: aleatória (sem chave fiscal real, mirror `ExpenseXmlDraft`).
   */
  xml_key: string;
  note: string;
  amount: number;
  document_type: 'nfe' | 'nfse';
  /** `find-or-create` real por NIF — SEMPRE um uuid válido, mesmo quando `client_matched===false`. */
  client_uuid: string;
  /** `false` = Client/Person CRIADO agora pelo parse (não bloqueante, apenas informativo). */
  client_matched: boolean;
  dt_emission: string;
  number: string;
  /** Fixo — inteiro legado sem tradução determinística para uuid do fork (idem `ExpenseXmlDraft`). */
  type_note_id: number;
  type_id: number;
  /**
   * SÓ populado no ramo NFe (busca simples, `matchProprietary`, NUNCA cria)
   * — sempre `null` no ramo NFSe.
   */
  proprietary_uuid: string | null;
  /**
   * SÓ relevante no ramo NFe. `false` (com `proprietary_uuid=null`) = o
   * proprietário do XML NÃO FOI ENCONTRADO de verdade no cadastro do tenant
   * — DIFERENTE da semântica de `client_matched` acima (nunca tratar os 2
   * campos com a mesma régua). No ramo NFSe este campo não é populado pelo
   * backend (sempre `false`/irrelevante, já que `proprietary_uuid` é `null`).
   */
  proprietary_matched: boolean;
}
