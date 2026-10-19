// src/constants/Sales/options/pagination-quantity-options.ts
// Reexport do catálogo canônico de "registros por página" (10/30/50/80/100/
// 200, default 10) já materializado por `@/constants/Orders/options/
// pagination-quantity-options` — SEM DUPLICAR o catálogo (mirror da decisão
// já tomada para Pedidos, mesma UI/UX de listagem, contrato-tela §7.4).

export {
  defaultPaginationQuantity,
  paginationQuantity,
  paginationQuantityOptions,
} from '@/constants/Orders/options/pagination-quantity-options';
export type { PaginationQuantity } from '@/constants/Orders/options/pagination-quantity-options';
