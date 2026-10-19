// src/hooks/useMenuModules.role.test.ts
// U-01 (execução 079) — regra `role` em `ruleAllows`/`pruneMenuModules`:
// ADITIVA à permissão; regras antigas (permission, anyOf, sameAs) sem regressão.

import { describe, expect, it } from 'vitest';

import { pruneMenuModules, ruleAllows, ruleForNavId } from './useMenuModules';

import type { NavModule } from '@/config/v2/navigationTree';

type Checker = Parameters<typeof ruleAllows>[1];

function checker(opts: {
  permissions?: string[];
  roles?: string[];
  hasFarm?: boolean;
  farmScoped?: string[];
  withHasRole?: boolean;
}): Checker {
  const permissions = new Set(opts.permissions ?? []);
  const roles = new Set(opts.roles ?? []);
  const farmScoped = new Set(opts.farmScoped ?? []);
  return {
    can: (p) => permissions.has(p),
    canAny: (ps) => ps.some((p) => permissions.has(p)),
    hasFarm: opts.hasFarm ?? false,
    isFarmScoped: (p) => farmScoped.has(p),
    ...(opts.withHasRole === false ? {} : { hasRole: (r: string) => roles.has(r) }),
  };
}

const logsRule = { permission: 'system-logs_view', role: 'Gestor_Plataf' };

describe('ruleAllows com role', () => {
  it('papel + permissão: visível (sem fazenda, permissão não farm-scoped)', () => {
    expect(
      ruleAllows(logsRule, checker({ permissions: ['system-logs_view'], roles: ['Gestor_Plataf'] }))
    ).toBe(true);
  });

  it('só a permissão (outro papel): oculto — a permissão sozinha não abre', () => {
    expect(
      ruleAllows(logsRule, checker({ permissions: ['system-logs_view'], roles: ['Gestor'] }))
    ).toBe(false);
  });

  it('só o papel, sem a permissão: oculto', () => {
    expect(ruleAllows(logsRule, checker({ roles: ['Gestor_Plataf'] }))).toBe(false);
  });

  it('chamador antigo sem hasRole: regra com role nega (fail-closed)', () => {
    expect(
      ruleAllows(
        logsRule,
        checker({ permissions: ['system-logs_view'], roles: ['Gestor_Plataf'], withHasRole: false })
      )
    ).toBe(false);
  });

  it('regra só com role exige o papel', () => {
    expect(ruleAllows({ role: 'Gestor_Plataf' }, checker({ roles: ['Gestor_Plataf'] }))).toBe(true);
    expect(ruleAllows({ role: 'Gestor_Plataf' }, checker({}))).toBe(false);
  });
});

describe('ruleAllows — regras antigas sem regressão', () => {
  it('permission', () => {
    expect(ruleAllows({ permission: 'farms_view' }, checker({ permissions: ['farms_view'] }))).toBe(
      true
    );
    expect(ruleAllows({ permission: 'farms_view' }, checker({}))).toBe(false);
  });

  it('permission farm-scoped exige fazenda ativa', () => {
    const rule = { permission: 'stocks_view' };
    expect(
      ruleAllows(rule, checker({ permissions: ['stocks_view'], farmScoped: ['stocks_view'] }))
    ).toBe(false);
    expect(
      ruleAllows(
        rule,
        checker({ permissions: ['stocks_view'], farmScoped: ['stocks_view'], hasFarm: true })
      )
    ).toBe(true);
  });

  it('anyOf', () => {
    const rule = { anyOf: ['a_view', 'b_view'] };
    expect(ruleAllows(rule, checker({ permissions: ['b_view'] }))).toBe(true);
    expect(ruleAllows(rule, checker({ permissions: ['c_view'] }))).toBe(false);
  });

  it('sem regra: visível', () => {
    expect(ruleAllows(ruleForNavId('__sem-regra__'), checker({}))).toBe(true);
  });
});

describe('pruneMenuModules com item restrito por papel', () => {
  // `pruneMenuModules` resolve a regra por `item.id` no mapa real; usa o id
  // registrado `adm-sis-log` (menu do módulo Administrativo).
  const modules = [
    {
      id: 'administrativo',
      label: 'Administrativo',
      emoji: '',
      icon: (() => null) as unknown as NavModule['icon'],
      groups: [
        {
          id: 'adm-sistema',
          label: 'Sistema',
          icon: (() => null) as unknown as NavModule['icon'],
          items: [{ id: 'adm-sis-log', label: 'Logs do Sistema', path: '/administrativo/logs' }],
        },
      ],
    },
  ] as unknown as NavModule[];

  it('Gestor_Plataf com a permissão vê o grupo e o item (mesmo sem fazenda)', () => {
    const result = pruneMenuModules(
      modules,
      checker({ permissions: ['system-logs_view'], roles: ['Gestor_Plataf'] })
    );
    expect(result[0]?.groups?.[0]?.items.map((i) => i.id)).toEqual(['adm-sis-log']);
  });

  it('outro papel: item, grupo e módulo somem', () => {
    const result = pruneMenuModules(
      modules,
      checker({ permissions: ['system-logs_view'], roles: ['Gestor'] })
    );
    expect(result).toEqual([]);
  });
});
