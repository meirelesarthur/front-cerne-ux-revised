// src/@types/v2/Document/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo COMPARTILHADO de Documentos Anexos (Document) — TASK-FE-036-337,
// ONDA 3 sub-onda 3c. Consumido tanto por Contas a Receber (`segment: 'incomes'`,
// TASK-FE-036-339) quanto pela fatia irmã de Contas a Pagar (`segment:
// 'expenses'`, ainda não fatiada). NÃO DUPLICAR — qualquer tela que precise de
// documentos anexos importa DESTE arquivo, nunca copia os tipos para dentro de
// `@types/v2/Incomes`/`@types/v2/Financeiro/Expenses`.
//
// Módulo NOVO e SEPARADO do módulo de Baixa (`@types/v2/WriteOff`) — mirror
// estrutural (mesmo padrão arquitetural "fundação → componente → integração"),
// mas SEM nenhum import cruzado entre os dois (concerns independentes).
//
// Contrato REAL confirmado por leitura direta do backend (`GB.Cerne.Api`,
// TASK-036-GB-04, `🔬 [PARA TESTE]`) — diverge do resumo passado pelo
// coordenador, esta é a versão correta:
//   GET  /api/v1/{incomes,expenses}/{uuid}/documents  → data: DocumentListItem[]
//        (envelope `ApiResponse::success`, SEM paginação, `meta: null` sempre).
//   POST /api/v1/{incomes,expenses}/{uuid}/documents  → multipart/form-data,
//        campo do arquivo é `file` (NÃO `anexo`), `description` (required,
//        max:50) + `date` (opcional, `sometimes` — backend usa `now()` como
//        default se ausente).
//   DELETE /api/v1/{incomes,expenses}/{uuid}/documents/{documentUuid} → 204,
//        precisa dos DOIS uuids (título + documento) — diferente do
//        `cancelWriteOff` do módulo de Baixa, que só precisa do uuid da baixa.
//
// Documento pode ser COMPARTILHADO entre títulos (mirror `all_files[]` do
// legado) — a associação é por pivot (`expense_documents`/`income_documents`),
// não FK direta. O `DELETE` só faz `detach()` do título corrente; o registro
// `Document` + arquivo físico só são apagados de verdade quando ficam ÓRFÃOS
// (sem nenhuma pivot restante em nenhum dos dois segmentos). Resposta 204 do
// DELETE NÃO garante que o arquivo sumiu para sempre — só garante que sumiu da
// lista DESTE título (mirror desta observação na UI da Tarefa 338 — texto de
// confirmação NEUTRO, nunca "excluído permanentemente").
//
// Storage é público (disco 'public', decisão DEC-107) — a `url` do Resource já
// é usável direto num `<a href={url} target="_blank">`, sem necessidade de
// endpoint de download dedicado nem lógica de assinatura/token.
// -----------------------------------------------------------------------------

// ============================================
// SEGMENTO — a única diferença entre Income/Expense é o path da URL
// ============================================

export type DocumentSegment = 'incomes' | 'expenses';

// ============================================
// LEITURA — GET /{segment}/{uuid}/documents (mirror 1:1 `DocumentResource`,
// MESMO shape no POST de criação)
// ============================================

export interface DocumentListItem {
  uuid: string;
  description: string | null;
  /** `YYYY-MM-DD` ou `null`. */
  date: string | null;
  /** URL pública, completa, direto utilizável em `<a href>` — ou `null`. */
  url: string | null;
  /** ISO — SEM `updated_at` (o Resource não devolve). */
  created_at: string;
}

// ============================================
// ENVELOPE — ApiResponse::success (SEM paginação, `meta: null` sempre)
// ============================================

export interface DocumentsListEnvelope {
  success: boolean;
  message: string;
  data: DocumentListItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// ESCRITA — POST /{segment}/{uuid}/documents (mirror 1:1
// `UploadIncomeDocumentRequest`/`UploadExpenseDocumentRequest`)
// ============================================

export interface DocumentPayload {
  /** Campo do multipart é `file` — validado no servidor (`mimes:pdf, max:2048` KB = 2MB). */
  file: File;
  /** `required, string, max:50`. */
  description: string;
  /** `sometimes, date` — opcional, backend usa `now()` como default se ausente. */
  date?: string;
}

// ============================================
// REACT HOOK FORM (shape RHF da seção de upload do painel, Tarefa 338) — o
// arquivo em si NÃO é campo RHF (fica em `useState<File|null>`, validado pelo
// próprio `FileUpload`), só `description`/`date` passam pelo Yup (Tarefa 337).
// ============================================

export interface DocumentUploadForm {
  description: string;
  date: string | null;
}
