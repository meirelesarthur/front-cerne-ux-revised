// src/constants/Budgets/budget-payment-method.ts
// Enum `payment_method` de `BudgetPayment` (Orçamentos — Operacional /
// Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-01). Catálogo SEFAZ fechado
// (`Nfe::typesPayment()` legado, fonte real `agro365/lang/pt-BR/trad.php:
// 2678-2692`), 14 chaves string — `budgets-api-contract.md §4.4`.
//
// Distinto de `PaymentTerm` (condição de pagamento Compra/Venda, conceito
// diferente, confirmado por leitura direta) — enum PRÓPRIO do domínio
// Budget/Payment, SEM tabela/lookup de backend (fábrica de opções
// `budgetPaymentMethodOptions` NÃO faz chamada de rede).

export const budgetPaymentMethod = {
  dinheiro: '01',
  cheque: '02',
  cartaoCredito: '03',
  cartaoDebito: '04',
  creditoLoja: '05',
  valeAlimentacao: '10',
  valeRefeicao: '11',
  valePresente: '12',
  valeCombustivel: '13',
  duplicataMercantil: '14',
  boletoBancario: '15',
  depositoBancario: '16',
  pix: '17',
  semPagamento: '90',
  outros: '99',
} as const;

export type BudgetPaymentMethod = (typeof budgetPaymentMethod)[keyof typeof budgetPaymentMethod];
