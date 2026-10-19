// src/constants/Orders/options/index.ts — barrel export
export { fiscalDocumentOptions } from './fiscal-document-options';
export { hasInputOptions } from './has-input-options';
export { orderStatusOptions } from './order-status-options';
export { paginationQuantityOptions } from './pagination-quantity-options';

// Reuso confirmado (contrato-tela §4/§10, decisão menor do contrato-api §7):
// forma de pagamento do Pedido REUSA o catálogo/fábrica de Budgets, mesmo
// enum de valores (`App\Enums\BudgetPaymentMethod`). Reexportado aqui sob o
// nome do módulo consumidor para os componentes de Pedidos importarem de um
// único lugar, SEM duplicar o catálogo SEFAZ.
export { budgetPaymentMethodOptions as orderPaymentMethodOptions } from '@/constants/Budgets/options/budget-payment-method-options';
