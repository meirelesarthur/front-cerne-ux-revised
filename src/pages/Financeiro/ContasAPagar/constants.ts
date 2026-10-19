// src/pages/Financeiro/ContasAPagar/constants.ts
// -----------------------------------------------------------------------------
// Rota-base real do módulo Expense ("Contas a Pagar", esteira 036). Isolada
// num arquivo próprio (em vez de viver em `index.tsx`) para não acoplar o
// bundle da tela de criação/edição ao chunk lazy da listagem.
//
// O contrato de tela (§3) sugeriu `/financeiro/contas-a-pagar`, mas o item
// de menu JÁ EXISTENTE no fork (`navigationTree.ts`, `fin-pag`) aponta para
// `/financeiro/pagar` (mesmo padrão de `fin-rec` → `/financeiro/receber`).
// Fidelidade ao código REAL já em produção > contrato aspiracional — ver
// nota de divergência no relatório de entrega desta Tarefa.
// -----------------------------------------------------------------------------

export const EXPENSES_BASE_PATH = '/financeiro/pagar';
