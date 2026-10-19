// src/utils/requestQuotationWhatsApp.ts
// -----------------------------------------------------------------------------
// Composição 100% CLIENT-SIDE do link de WhatsApp por cotação (AM-06 —
// Cotações/RequestQuotation, esteira 97-Esteiras/035, TASK-CQ-FE-09). Util
// PURO — nenhum componente de tela, nenhum `useState`/hook, reutilizável de
// qualquer ponto que tenha uma `RequestQuotationData` + o contexto da
// `RequestPurchase` PAI (mirror da disciplina "helper na camada correta,
// nunca lógica solta em `pages/`").
//
// Legado (`agro365/app/Http/Controllers/Admin/RequestQuotationController.php:331-371`,
// `whatsapp($id)`, EV-081): monta a mensagem SERVER-side e faz
// `redirect()->away()` para `https://api.whatsapp.com/send?phone=55{numero}&text={msg}`.
// Divergência consciente JÁ REGISTRADA (roteiro de API,
// `97-Esteiras/035/ROTEIROS/02-roteiro-api-cotacoes.md` §8.3, claim
// CL-049/AM-06 do contrato legado): a mesma composição passa a ser feita no
// FRONTEND, sem Action de backend dedicada — todo o dado necessário já vem
// do `GetRequestQuotationAction` (`RequestQuotationResource`, TASK-CQ-API-
// 03/05, campo por campo: `provider.name/cellphone`, `user.name`, `hash`) +
// do `RequestPurchase` PAI já carregado pela tela-única
// (`CreateOrUpdateSolicitacao.tsx`/`requestPurchaseData`), SEM nenhuma
// chamada extra (dependência declarada da Tarefa). Comportamento observável
// ao usuário final é idêntico (mesmo texto, mesmo destino, mirror
// `wa.me` recomendado pelo roteiro frontend §4.3) — só o LOCAL onde o texto
// é montado muda.
//
// -- Fronteira de fidelidade preservada 1:1 (EV-081) --
// Título · bloco "#Fazenda {farm}#" (monoespaçado) · "Código da
// solicitação:" · "Descrição/Chamado:" · bloco "Fornecedor:\n{nome}"
// (monoespaçado) · convite (itálico) · instrução de preenchimento único
// (itálico) · assinatura "Atenciosamente:" + nome do CRIADOR da cotação
// (`quotation.user.name`, NUNCA o usuário logado que clicou) · link do
// formulário público. `str_replace('&', '', $name)` do legado é preservado
// (`&` quebra a formatação de negrito/itálico do WhatsApp).
//
// -- Execução 081 (T-081-FE-08, contrato LEGADO 05 P43 e 10 PQ07..PQ11) --
// Ajustes de paridade sobre a composição acima:
//   - destino `https://api.whatsapp.com/send?phone=55{número}&text=...` (o
//     legado não usa `wa.me`);
//   - número = `cellphone ?? telefone da pessoa`, só dígitos; número vazio NÃO
//     bloqueia (o legado abre o WhatsApp mesmo assim, o usuário escolhe o
//     contato lá). Por isso não existe mais o erro `missing-phone`;
//   - vendedor (`provider.sellers[]`, T-081-API-07): o mesmo texto, endereçado
//     ao vendedor (nome no bloco "Fornecedor:", telefone dele) — o chamador
//     passa o vendedor em `contactOverride`;
//   - frase "O mesmo já está disponível no email {e-mail do destinatário}.": o
//     legado imprimia o e-mail vazio (PLD-05, atributo inexistente); aqui sai
//     com o e-mail do destinatário e é OMITIDA quando ele não tem e-mail, em vez
//     de reproduzir "no email ." sem informação.
// -----------------------------------------------------------------------------

import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

/** Textos i18n consumidos por este util — mirror de
 *  `languageGB.requestQuotations.requestQuotation.whatsApp`
 *  (`@/@types/language/module-request-quotations`). Nenhuma string literal
 *  de UI aqui — todo fragmento vem do pacote de idioma ativo. A marcação de
 *  formatação do WhatsApp (`*negrito*`, ```` ```monoespaçado``` ````,
 *  `_itálico_`) é aplicada em `buildRequestQuotationWhatsAppMessage`, nunca
 *  nos textos deste pacote (que guardam só o conteúdo, não o markup). */
export interface RequestQuotationWhatsAppMessages {
  messageTitle: string;
  farmLabel: string;
  purchaseCodeLabel: string;
  descriptionLabel: string;
  providerLabel: string;
  invitationText: string;
  emailAvailableText: string;
  fillInstructions: string;
  regardsLabel: string;
  formLinkLabel: string;
}

/** Contexto da `RequestPurchase` PAI — já carregado por
 *  `CreateOrUpdateSolicitacao.tsx` (`requestPurchaseData`), NUNCA uma nova
 *  chamada. `RequestQuotationResource.request_purchase` só expõe
 *  `{uuid, code}` (sem `description`/`farm`, ver
 *  `@/@types/v2/RequestQuotations` → `RequestQuotationPurchaseRef`) — por
 *  isso este contexto é passado À PARTE pelo chamador (que já o tem via
 *  `RequestPurchaseData.{code,description,farm.description}`), nunca
 *  extraído de dentro de `RequestQuotationData`. */
export interface RequestQuotationWhatsAppPurchaseContext {
  code: string | null;
  description: string | null;
  farmDescription: string | null;
}

/** Contato de destino (fornecedor OU vendedor específico, `seller_id`) —
 *  ver nota de "Ramificação por vendedor" no cabeçalho do arquivo. */
export interface RequestQuotationWhatsAppContact {
  name: string;
  phone: string | null;
  /** E-mail do destinatário (fornecedor ou vendedor) para a frase "O mesmo já
   *  está disponível no email ...". */
  email?: string | null;
}

export type RequestQuotationWhatsAppError = 'missing-provider';

export type RequestQuotationWhatsAppOutcome =
  { ok: true; url: string } | { ok: false; error: RequestQuotationWhatsAppError };

/**
 * Resolve o contato-alvo da mensagem — `contactOverride` (vendedor
 * específico, quando o chamador já o tiver resolvido) OU o contato
 * principal do fornecedor (`quotation.provider`, default do legado sem
 * `seller_id`). `null` quando nem override nem `provider` existem (mirror
 * IG-10, fallback "os dados do fornecedor não foram encontrados").
 * @param {Pick<RequestQuotationData, 'provider'>} quotation - Cotação (só o `provider` é necessário aqui).
 * @param {RequestQuotationWhatsAppContact | null} [contactOverride] - Vendedor específico já resolvido pelo chamador.
 * @return {RequestQuotationWhatsAppContact | null} Contato resolvido ou `null` se indisponível.
 */
export function resolveRequestQuotationWhatsAppContact(
  quotation: Pick<RequestQuotationData, 'provider'>,
  contactOverride?: RequestQuotationWhatsAppContact | null
): RequestQuotationWhatsAppContact | null {
  if (contactOverride) return contactOverride;
  if (!quotation.provider) return null;

  // Legado: `cellphone ?? people.phone` (RQC:340).
  return {
    name: quotation.provider.name ?? '',
    phone: quotation.provider.cellphone ?? quotation.provider.phone ?? null,
    email: quotation.provider.email ?? null,
  };
}

/**
 * Resolve o link PÚBLICO do formulário do fornecedor a partir do `hash`
 * (Opção 1 do gate 6.1, roteiro frontend §5.2/6.1 — rota top-level
 * `/orcamento/{hash}` no MESMO domínio da SPA, ainda BLOQUEADA em
 * TASK-CQ-FE-10, mas o formato do link já está decidido e documentado como
 * default). Função separada (em vez de acessar `window` dentro do builder
 * de mensagem) para manter `buildRequestQuotationWhatsAppMessage` pura e
 * testável sem DOM.
 * @param {string} hash - `quotation.hash` (endurecido, `RequestQuotationResource`).
 * @param {string} origin - `window.location.origin` da SPA em execução (resolvido pelo chamador).
 * @return {string} URL absoluta do formulário público.
 */
export function buildRequestQuotationPublicFormUrl(hash: string, origin: string): string {
  return `${origin}/orcamento/${hash}`;
}

/**
 * Monta o TEXTO da mensagem (sem o link do WhatsApp) — mirror 1:1 de EV-081, ver
 * notas de fidelidade no cabeçalho do arquivo. Função PURA (sem acesso a
 * `window`) — `formUrl` já vem resolvido pelo chamador
 * (`buildRequestQuotationPublicFormUrl`).
 * @param {object} input - Nome do contato, criador da cotação, contexto da compra e link do formulário já resolvidos.
 * @param {RequestQuotationWhatsAppMessages} text - Fragmentos i18n do idioma ativo.
 * @return {string} Texto pronto para `encodeURIComponent` no link do WhatsApp.
 */
export function buildRequestQuotationWhatsAppMessage(
  input: {
    contactName: string;
    contactEmail?: string | null;
    creatorName: string | null;
    purchase: RequestQuotationWhatsAppPurchaseContext;
    formUrl: string;
  },
  text: RequestQuotationWhatsAppMessages
): string {
  // `str_replace('&', '', $name)` do legado (EV-081) — `&` quebra a
  // formatação de negrito/itálico/monoespaçado do WhatsApp.
  const contactName = input.contactName.replace(/&/g, '');
  const contactEmail = (input.contactEmail ?? '').trim();
  const emailLine = contactEmail ? `${text.emailAvailableText} ${contactEmail}.\n\n` : '';

  return (
    `*${text.messageTitle}*\n` +
    `\`\`\`#${text.farmLabel} ${input.purchase.farmDescription ?? ''}# \`\`\`\n` +
    `${text.purchaseCodeLabel} ${input.purchase.code ?? ''}\n\n` +
    `${text.descriptionLabel}\n${input.purchase.description ?? ''}\n\n` +
    `\`\`\`${text.providerLabel}\n${contactName}\`\`\`\n\n` +
    `_${text.invitationText}_\n\n` +
    emailLine +
    `_${text.fillInstructions}_\n\n` +
    `\`\`\`${text.regardsLabel}\`\`\`\n` +
    `\`\`\`${input.creatorName ?? ''}\`\`\`\n\n` +
    `*${text.formLinkLabel}*\n` +
    `${input.formUrl}\n\n`
  );
}

/**
 * Monta o link `api.whatsapp.com/send` completo (mensagem + telefone) OU devolve um erro
 * tipado quando o contato/telefone não existe — o CHAMADOR decide a
 * mensagem de UI (toast) a partir do `error` (i18n, nunca string aqui). DDI
 * `55` fixo — mirror `'...phone=55' . $number` do legado; números na SPA são
 * sempre cadastrados sem DDI (mesma convenção de `src/utils/format-phone.ts`).
 * @param {Pick<RequestQuotationData, 'provider'|'user'>} quotation - Cotação (mínimo `provider`/`user`).
 * @param {RequestQuotationWhatsAppPurchaseContext} purchase - Contexto da `RequestPurchase` PAI, já carregado pelo chamador.
 * @param {string} formUrl - Link do formulário público já resolvido (`buildRequestQuotationPublicFormUrl`).
 * @param {RequestQuotationWhatsAppMessages} text - Fragmentos i18n do idioma ativo.
 * @param {RequestQuotationWhatsAppContact | null} [contactOverride] - Vendedor específico (`seller_id`), quando resolvido pelo chamador.
 * @return {RequestQuotationWhatsAppOutcome} `{ok:true,url}` pronto para `window.open`, ou `{ok:false,error}`.
 */
export function buildRequestQuotationWhatsAppLink(
  quotation: Pick<RequestQuotationData, 'provider' | 'user'>,
  purchase: RequestQuotationWhatsAppPurchaseContext,
  formUrl: string,
  text: RequestQuotationWhatsAppMessages,
  contactOverride?: RequestQuotationWhatsAppContact | null
): RequestQuotationWhatsAppOutcome {
  const contact = resolveRequestQuotationWhatsAppContact(quotation, contactOverride);
  if (!contact) return { ok: false, error: 'missing-provider' };

  // Número vazio não bloqueia (legado, RQC:351): abre o WhatsApp sem destino.
  const phoneDigits = (contact.phone ?? '').replace(/\D/g, '');

  const message = buildRequestQuotationWhatsAppMessage(
    {
      contactName: contact.name,
      contactEmail: contact.email,
      creatorName: quotation.user?.name ?? null,
      purchase,
      formUrl,
    },
    text
  );

  return {
    ok: true,
    url: `https://api.whatsapp.com/send?phone=55${phoneDigits}&text=${encodeURIComponent(message)}`,
  };
}
