// src/config/v2/purchaseOrdersFeature.ts
// Tela única de Ordens de compra LIGADA (decisão do dono, 24/11/2026).
//
// Com `true`, o grupo Suprimentos do menu mostra só "Ordens de compra" (a tela
// única, com as visões em abas) e "Parâmetros SLA". As 6 entradas antigas (Meus
// Processos, Rejeitados / Cancelados, Cotações, Autorização, Compras e
// Recebimentos) saem do menu, mas as rotas continuam vivas: o sino, favoritos e
// links externos seguem funcionando. A volta é só trocar para `false`.
export const UNIFIED_PURCHASE_ORDERS_ENABLED = true;
