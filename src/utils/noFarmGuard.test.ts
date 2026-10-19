import { describe, expect, it } from 'vitest';

import { shouldRedirectNoFarm, withHasFarmsRaised } from '@/utils/noFarmGuard';

const CONTRACTOR_NO_FARM = { farm_context: { is_contractor: true, has_farms: false } };
const BLOCKED = '/financeiro/contas-pagar';
const ALLOWED = '/cadastros-base/centros-custo';

describe('TASK-072-FE-11 — shouldRedirectNoFarm (matriz)', () => {
  it('loading → false (não decide)', () => {
    expect(
      shouldRedirectNoFarm({
        loading: true,
        profile: CONTRACTOR_NO_FARM,
        roles: [],
        pathname: BLOCKED,
      })
    ).toBe(false);
  });

  it('profile ausente → false', () => {
    expect(
      shouldRedirectNoFarm({ loading: false, profile: null, roles: [], pathname: BLOCKED })
    ).toBe(false);
  });

  it('profile sem farm_context (back antigo) → false (fail-open)', () => {
    expect(
      shouldRedirectNoFarm({ loading: false, profile: {}, roles: [], pathname: BLOCKED })
    ).toBe(false);
  });

  it('is_contractor=false (funcionário) → false', () => {
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: { farm_context: { is_contractor: false, has_farms: false } },
        roles: [],
        pathname: BLOCKED,
      })
    ).toBe(false);
  });

  it('Gestor_Plataf → false (defesa do front, mesmo com sinal de contratante)', () => {
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: CONTRACTOR_NO_FARM,
        roles: ['Gestor_Plataf'],
        pathname: BLOCKED,
      })
    ).toBe(false);
  });

  it('has_farms=true → false', () => {
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: { farm_context: { is_contractor: true, has_farms: true } },
        roles: [],
        pathname: BLOCKED,
      })
    ).toBe(false);
  });

  it('contratante sem fazenda em rota bloqueada → true', () => {
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: CONTRACTOR_NO_FARM,
        roles: [],
        pathname: BLOCKED,
      })
    ).toBe(true);
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: CONTRACTOR_NO_FARM,
        roles: ['Contratante'],
        pathname: '/relatorios/financeiro/razao-categoria',
      })
    ).toBe(true);
  });

  it('contratante sem fazenda na Home (/home e /) → false (decisão do dono 2026-09-27)', () => {
    for (const pathname of ['/home', '/']) {
      expect(
        shouldRedirectNoFarm({ loading: false, profile: CONTRACTOR_NO_FARM, roles: [], pathname })
      ).toBe(false);
    }
  });

  it('contratante sem fazenda em subrota de /home → true (sem liberação por prefixo)', () => {
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: CONTRACTOR_NO_FARM,
        roles: [],
        pathname: '/home/qualquer',
      })
    ).toBe(true);
  });

  it('contratante sem fazenda em rota liberada → false', () => {
    expect(
      shouldRedirectNoFarm({
        loading: false,
        profile: CONTRACTOR_NO_FARM,
        roles: [],
        pathname: ALLOWED,
      })
    ).toBe(false);
  });
});

describe('TASK-072-FE-11 — withHasFarmsRaised (setter otimista)', () => {
  it('sobe has_farms para true', () => {
    expect(withHasFarmsRaised(CONTRACTOR_NO_FARM)?.farm_context).toEqual({
      is_contractor: true,
      has_farms: true,
    });
  });

  it('nunca baixa, e devolve a mesma referência quando nada muda', () => {
    const withFarms = { farm_context: { is_contractor: true, has_farms: true } };
    expect(withHasFarmsRaised(withFarms)).toBe(withFarms);
    const noSignal = { name: 'x' } as { name: string; farm_context?: undefined };
    expect(withHasFarmsRaised(noSignal)).toBe(noSignal);
    expect(withHasFarmsRaised(null)).toBeNull();
  });
});
