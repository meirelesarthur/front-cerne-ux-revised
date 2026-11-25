// src/config/v2/serviceOrdersFeature.ts
// Ordem de Serviço DESLIGADA no web (decisão do dono, 24/11/2026).
//
// A OS quase não tinha uso (veio do pedido de uma fazenda). O trabalho da equipe
// entra pelo Apontamento e o serviço de fora entra pela Ordem de compra (antiga
// Solicitação de compra, tipo Serviço), cuja confirmação é o Recebimento.
//
// Com `false`, as telas de OS (Lista, Minhas OS, Monitoramento, Avaliações) saem do
// menu e das rotas. O código continua no repositório: o app mobile ainda usa a OS
// e a volta é só trocar para `true`.
export const SERVICE_ORDERS_ENABLED = false;
