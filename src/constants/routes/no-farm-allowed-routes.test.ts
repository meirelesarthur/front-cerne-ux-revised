import { describe, expect, it } from 'vitest';

import { isAllowedPath } from '@/utils/noFarmGuard';

import {
  NO_FARM_ALLOWED_ROUTE_PATTERNS,
  NO_FARM_REDIRECT_TARGET,
} from '@/constants/routes/no-farm-allowed-routes';

const UUID = '3f1c2a8e-5b7d-4e9f-a1b2-c3d4e5f60718';

describe('TASK-072-FE-11 — no-farm-allowed-routes (allowlist centralizada)', () => {
  it.each([
    '/home',
    '/',
    '/cadastros-base/fazendas',
    '/cadastros-base/fazendas/novo',
    `/cadastros-base/fazendas/${UUID}`,
    '/cadastros-base/centros-custo',
    '/cadastros-base/centros-custo/novo',
    `/cadastros-base/centros-custo/novo/${UUID}`,
    `/cadastros-base/centros-custo/${UUID}`,
    `/cadastros-base/centros-custo/${UUID}/detalhe`,
    '/cadastros-base/categorias',
    '/cadastros-base/categorias/novo',
    `/cadastros-base/categorias/${UUID}`,
    '/profile',
  ])('rota liberada casa: %s', (pathname) => {
    expect(isAllowedPath(pathname)).toBe(true);
  });

  it.each([
    '/home/qualquer',
    '/homes',
    '/relatorios/financeiro/razao-categoria',
    '/cadastros-base/plano-de-contas',
    '/cadastros-base/contratantes',
    '/cadastros-base/categorias-animais',
    `/cadastros-base/fazendas/${UUID}/areas/novo`,
    `/cadastros-base/fazendas/${UUID}/areas/multiplas`,
    '/financeiro/contas-pagar',
    '/dashboards/financeiro',
    '/fiscal/notas',
  ])('rota NÃO liberada não casa: %s', (pathname) => {
    expect(isAllowedPath(pathname)).toBe(false);
  });

  it('anti-loop: o destino do redirect está na allowlist', () => {
    expect(isAllowedPath(NO_FARM_REDIRECT_TARGET)).toBe(true);
    expect(NO_FARM_REDIRECT_TARGET).toBe('/cadastros-base/fazendas');
  });

  it('Home consta (decisão do dono 2026-09-27); relatórios não constam', () => {
    expect(NO_FARM_ALLOWED_ROUTE_PATTERNS).toContain('/home');
    expect(NO_FARM_ALLOWED_ROUTE_PATTERNS.some((p) => p.startsWith('/relatorios'))).toBe(false);
  });
});
