// src/constants/RequestQuotations/request-quotation-payment-method.ts
// Enum `payment_method` de `RequestQuotationPayment` (Cotações — Administrativo
// / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01). Mirror EXATO de
// `App\Enums\RequestQuotationPaymentMethod` (backend, int-backed,
// `app/Enums/RequestQuotationPaymentMethod.php`) — 5 valores fechados.
// Consumido pelo formulário público do fornecedor (TASK-CQ-FE-10, condições
// de pagamento) — fábrica de opções registrada aqui já na fundação para não
// duplicar o enum quando aquela Tarefa for despachada.

export const requestQuotationPaymentMethod = {
  aVista: 0,
  boleto: 1,
  cartao: 2,
  pix: 3,
  cheque: 4,
} as const;

export type RequestQuotationPaymentMethod =
  (typeof requestQuotationPaymentMethod)[keyof typeof requestQuotationPaymentMethod];
