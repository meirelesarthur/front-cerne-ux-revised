// src/utils/notificationRoute.ts
// -----------------------------------------------------------------------------
// Destino de clique do sino de notificações (execução 081, T-081-FE-11).
//
// A API devolve a `url` ABSOLUTA (origem = `FRONTEND_URL`, ex.:
// `https://spa/administrativo/compras?search=0012`). A SPA navega SEMPRE por
// rota interna (caminho + query + hash), nunca abre outra origem: a notificação
// vem do servidor, mas redirecionar para fora a partir do sino seria um vetor
// de phishing. Linhas migradas do legado trazem o host antigo; o mesmo
// tratamento serve (a origem é descartada) e as rotas conhecidas do legado são
// traduzidas para a rota da SPA.
// -----------------------------------------------------------------------------

import type { NotificationItem } from '@/@types/v2/Notifications';

/** Rotas nomeadas do legado -> rota da SPA. */
const LEGACY_PATHS: Record<string, string> = {
  '/request-authorization': '/administrativo/autorizacao',
  '/request-buy': '/administrativo/compras',
};

/** Máximo de itens do painel (legado: 10 não lidas). */
export const NOTIFICATION_LIST_LIMIT = 10;

/**
 * Converte a `url` da API em rota interna da SPA.
 * @param {string | null | undefined} url - URL absoluta (ou caminho) da notificação.
 * @return {string | null} Rota interna (`/caminho?query#hash`) ou `null` se não houver destino.
 */
export function notificationRoute(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw, 'http://spa.invalid');
  } catch {
    return null;
  }

  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  const mapped = LEGACY_PATHS[pathname] ?? pathname;
  return `${mapped}${parsed.search}${parsed.hash}`;
}

/**
 * Como o legado: só é listado o que tem `url` (o contador, vindo da API,
 * conta todas as não lidas). Limita a 10 por segurança, se a API mandar mais.
 * @param {NotificationItem[]} items - Itens vindos de `GET /notifications`.
 * @return {NotificationItem[]} Itens com destino, no máximo 10.
 */
export function listableNotifications(items: NotificationItem[]): NotificationItem[] {
  return items
    .filter((item) => notificationRoute(item.url) !== null)
    .slice(0, NOTIFICATION_LIST_LIMIT);
}
