// src/pages/Administrativo/Recebimentos/receiptDefaults.ts
// -----------------------------------------------------------------------------
// Valores iniciais do formulário "Confirmar Recebimento" (execução 081,
// T-081-FE-10; contrato LEGADO-SUPRIMENTOS-09, FLD-03..FLD-07 e seção 7):
//  - Data Recebimento: `receipt_date_suggested` da API (hoje), senão hoje local;
//  - Status do Pedido: "Compra Recebida" (1), sem opção vazia;
//  - itens: status `?? 'P'` e Dt. Entrega `?? hoje`;
//  - Observações: vazias (FLD-10);
//  - Responsável: o usuário logado (o legado mostra o logado, não o gravado);
//  - anexos: 1 linha vazia (só acrescenta; os anexos existentes não são tocados).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  ConfirmReceiptCompletion,
  ConfirmReceiptForm,
  RequestReceiptData,
} from '@/@types/v2/RequestReceipts';

export interface ConfirmDefaultsContext {
  /** Hoje no fuso local, 'yyyy-MM-dd'. */
  today: string;
  /** Nome do usuário logado. */
  loggedUserName: string | null;
  itemStatusOption: (value: 'P' | 'E' | 'C') => Option<'P' | 'E' | 'C'>;
  completionOption: (value: ConfirmReceiptCompletion) => Option<ConfirmReceiptCompletion>;
}

export function buildConfirmReceiptDefaults(
  data: RequestReceiptData,
  ctx: ConfirmDefaultsContext
): ConfirmReceiptForm {
  return {
    code: data.code,
    responsible: ctx.loggedUserName ?? data.responsible?.name ?? null,
    receipt_date: data.receipt_date_suggested ?? ctx.today,
    nfe: data.nfe ?? '',
    purchase_status: ctx.completionOption(1),
    receipt_note: '',
    items: (data.items ?? []).map((item) => ({
      uuid: item.uuid,
      description: item.product?.description ?? item.name ?? item.description ?? null,
      quantity: item.quantity,
      status: ctx.itemStatusOption(item.status ?? 'P'),
      delivery_date: item.delivery_date ?? ctx.today,
    })),
    attachments: [{ name: '', file: null }],
  };
}
