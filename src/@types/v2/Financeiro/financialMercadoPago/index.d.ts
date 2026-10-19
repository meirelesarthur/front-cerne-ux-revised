// src/@types/v2/Financeiro/financialMercadoPago/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Financeiro Mercado Pago" (execução 031, TASK-FE-031-44).
// Fachada read-only `GET /api/v1/financial-mercado-pago` (contrato de API
// AUTOAPROVADO, modo PLACEHOLDER — contrato-api-financeiro-mercado-pago.md
// §0): não existe tabela de billing migrada ainda, então o backend SEMPRE
// retorna `data: []`/`meta.total: 0` hoje. Nenhum campo aqui é lido de dado
// real neste momento; o shape existe para o front ter tipo estável desde já
// (contrato de API §4) — trocar por dado real é refactor futuro isolado, só
// do lado backend (contrato de API §6), este arquivo não muda quando isso
// acontecer.
//
// Sem `Payload`/`Detail`/`Form` de entidade — tela é 100% read-only, sem
// create/edit/show (contrato de tela §5). `uuid` é a chave de item, sem uso
// de ação hoje (sem endpoint de update nesta fase).
// -----------------------------------------------------------------------------

export type FinancialMercadoPagoStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type FinancialMercadoPagoPaymentMethod = 'pix' | 'boleto' | 'cartao';

export interface FinancialMercadoPagoListItem {
  uuid: string;
  nome: string;
  contratante: string;
  plano: string;
  cpf_cnpj: string;
  transaction_id: string;
  payment_method: FinancialMercadoPagoPaymentMethod;
  /** decimal — mesma cautela de tipo já documentada em outros módulos
   *  (`@/@types/v2/OpenMovements`): pode chegar como string do backend. */
  value: number | string;
  /** ISO 8601 — legado ordena/filtra por `updated_at`, mantido aqui (contrato §4). */
  date: string;
  status: FinancialMercadoPagoStatus;
}

/**
 * Filtro da listagem (drawer). `''`/ausente = "Todos" — nunca enviado como
 * query param (contrato de tela §3).
 */
export interface FinancialMercadoPagoFilterForm {
  status?: FinancialMercadoPagoStatus | '';
  date_start?: string;
  date_end?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /financial-mercado-pago)
// ============================================

export interface FinancialMercadoPagoApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface FinancialMercadoPagoListEnvelope {
  success: boolean;
  message: string;
  data: FinancialMercadoPagoListItem[];
  errors: Record<string, string[]> | null;
  meta: FinancialMercadoPagoApiPaginationMeta | null;
}
