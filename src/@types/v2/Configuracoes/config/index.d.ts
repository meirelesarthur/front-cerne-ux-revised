// src/@types/v2/Configuracoes/config/index.d.ts
// -----------------------------------------------------------------------------
// Configuração (settings singleton de plataforma) — execução 032,
// TASK-FE-2600. Contrato de tela `contrato-front-configuracao.md` §6.1,
// confirmado contra o backend REAL já materializado nesta execução
// (`ConfigResource.php`/`ConfigRequest.php`/`ConfigVideoIntroRequest.php`).
//
// Rota SINGULAR (sem `{uuid}` na URL, GET/PUT `/config`) — o `uuid` abaixo
// existe no payload (o registro tem identidade real no backend), mas NUNCA é
// usado para endereçar a URL (D5, mesmo racional de `TenantParameterData`).
//
// Segredos Mercado Pago são WRITE-ONLY (contrato §4.2): `ConfigData` (leitura,
// `GET`) NUNCA tem `mercadopago_access_token`/`mercadopago_public_key` como
// string — só os 2 booleanos `*_configurado`. Só `ConfigPayload` (escrita,
// `PUT`) tem os 2 campos de segredo, e ambos OPCIONAIS (`?:`) — omitidos do
// payload quando o campo do form está vazio (preserva o valor atual no
// backend).
// -----------------------------------------------------------------------------

export interface ConfigData {
  uuid: string;
  dias_teste: number;
  dias_alerta_pagamento: number;
  dias_assinar_contrato: number;
  contrato_certificado: boolean;
  minutos_online: number;
  dias_alerta_vencimento_certificado: number;
  mercadopago_access_token_configurado: boolean; // write-only — nunca o valor bruto
  mercadopago_public_key_configurado: boolean; // idem
  afiliado_padrao_uuid: string | null;
  afiliado_padrao_nome: string | null; // aditivo (UT-101) — Partner.person.name
  afiliado_padrao_apelido: string | null; // aditivo (UT-101) — Partner.nickname
  plano_padrao_uuid: string | null;
  plano_padrao_nome: string | null; // aditivo (UT-101) — PlanRole.nome
  plano_padrao_preco: string | number | null; // aditivo (UT-101) — mesmo preço do label da lista
  whatsapp_link_suporte: string;
  video_intro_url: string | null;
  resp_cnpj: string | null;
  resp_nome: string | null;
  resp_email: string | null;
  resp_fone: string | null;
  created_at: string;
  updated_at: string;
}

// Payload do PUT — os 13 campos sempre obrigatórios (contrato §4/§6, mesmo o
// backend aceitando os 2 uuids de FK como `nullable`, ver `ConfigRequest`) +
// os 2 segredos `?:` (omitidos quando o campo do form está vazio, write-only).
export interface ConfigPayload {
  dias_teste: number;
  dias_alerta_pagamento: number;
  dias_assinar_contrato: number;
  contrato_certificado: boolean;
  minutos_online: number;
  dias_alerta_vencimento_certificado: number;
  mercadopago_access_token?: string; // OMITIDO se vazio — write-only (§4.2)
  mercadopago_public_key?: string; // idem
  afiliado_padrao_uuid: string | null;
  plano_padrao_uuid: string | null;
  whatsapp_link_suporte: string;
  resp_cnpj: string | null;
  resp_nome: string | null;
  resp_email: string | null;
  resp_fone: string | null;
}

// Form (react-hook-form, TASK-FE-2601) — os 2 segredos sempre `string` no
// form (vazio = "não alterar", nunca populado a partir do GET); os 2 uuids de
// FK viram `Option<string> | null` (SelectAsyncPaginate/Controller, mirror
// `OpeningBalanceForm.product_uuid`); `contrato_certificado` vira
// `Option<boolean> | null` (Select Sim/Não, §7.5).
export interface ConfigForm extends Omit<
  ConfigPayload,
  | 'mercadopago_access_token'
  | 'mercadopago_public_key'
  | 'afiliado_padrao_uuid'
  | 'plano_padrao_uuid'
  | 'contrato_certificado'
> {
  contrato_certificado: { label: string; value: boolean } | null;
  mercadopago_access_token: string;
  mercadopago_public_key: string;
  afiliado_padrao_uuid: { label: string; value: string } | null;
  plano_padrao_uuid: { label: string; value: string } | null;
}
