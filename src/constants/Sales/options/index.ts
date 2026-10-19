// src/constants/Sales/options/index.ts — barrel export
export {
  defaultPaginationQuantity,
  paginationQuantity,
  paginationQuantityOptions,
} from './pagination-quantity-options';
export type { PaginationQuantity } from './pagination-quantity-options';
export { saleStatusOptions } from './sale-status-options';

// Reuso confirmado (contrato-tela §3, catálogo SEFAZ) — forma de pagamento
// da Venda REUSA a fábrica/catálogo de Budgets, mesmo enum de 15 valores
// (`App\Enums\BudgetPaymentMethod`), mirror EXATO do que Pedidos já faz
// (`orderPaymentMethodOptions`). Reexportado aqui sob o nome do módulo
// consumidor, SEM duplicar o catálogo.
export { budgetPaymentMethodOptions as salePaymentMethodOptions } from '@/constants/Budgets/options/budget-payment-method-options';
