// src/utils/notificationRoute.test.ts
// T-081-FE-11 — destino de clique do sino.

import { describe, expect, it } from 'vitest';

import type { NotificationItem } from '@/@types/v2/Notifications';

import { listableNotifications, notificationRoute } from './notificationRoute';

function item(id: string, url: string | null): NotificationItem {
  return { id, message: `m${id}`, url, created_at: '2026-10-01T10:00:00+00:00' };
}

describe('notificationRoute', () => {
  it('converte a URL absoluta da API em rota interna com a query', () => {
    expect(notificationRoute('https://spa.exemplo.com/administrativo/compras?search=0012')).toBe(
      '/administrativo/compras?search=0012'
    );
  });

  it('descarta a origem (nunca abre outra origem) e mantém o hash', () => {
    expect(notificationRoute('https://outro.host/administrativo/autorizacao?search=1#x')).toBe(
      '/administrativo/autorizacao?search=1#x'
    );
  });

  it('traduz as rotas nomeadas do legado', () => {
    expect(notificationRoute('https://legado/request-buy?search=0001')).toBe(
      '/administrativo/compras?search=0001'
    );
    expect(notificationRoute('https://legado/request-authorization/?search=0002')).toBe(
      '/administrativo/autorizacao?search=0002'
    );
  });

  it('aceita caminho relativo', () => {
    expect(notificationRoute('/administrativo/solicitacao')).toBe('/administrativo/solicitacao');
  });

  it('sem url devolve null', () => {
    expect(notificationRoute(null)).toBeNull();
    expect(notificationRoute(undefined)).toBeNull();
    expect(notificationRoute('   ')).toBeNull();
  });
});

describe('listableNotifications', () => {
  it('lista só o que tem url (como o legado)', () => {
    const result = listableNotifications([item('1', null), item('2', '/a'), item('3', '')]);
    expect(result.map((n) => n.id)).toEqual(['2']);
  });

  it('limita a 10 itens', () => {
    const many = Array.from({ length: 14 }, (_, i) => item(String(i), `/x/${i}`));
    expect(listableNotifications(many)).toHaveLength(10);
  });
});
