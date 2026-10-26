import { describe, expect, it } from 'vitest';

import { CATALOG } from './catalog';
import {
  annualMonthly,
  annualTotal,
  compareTiers,
  formatBRL,
  pruneUnavailable,
  quote,
  toggleModule,
  type Selection,
} from './pricing';

const sel = (plan: Selection['plan'], users: number, modules: string[] = []): Selection => ({
  plan,
  users,
  modules: new Set(modules),
});

describe('quote', () => {
  it('Pro com acessos incluídos e sem módulos = valor base', () => {
    const q = quote('Pro', sel('Pro', 3));
    expect(q.month).toBe(349);
    expect(q.extraSeats).toBe(0);
  });

  it('cobra acesso extra pelo preço do plano', () => {
    expect(quote('Pro', sel('Pro', 5)).month).toBe(349 + 2 * 39);
    expect(quote('Deluxe', sel('Deluxe', 8)).month).toBe(490 + 3 * 35);
    expect(quote('Enterprise', sel('Enterprise', 12)).month).toBe(890 + 2 * 29);
  });

  it('módulo avulso soma no Pro e vem incluído no Deluxe', () => {
    const mods = ['ofx'];
    expect(quote('Pro', sel('Pro', 3, mods)).month).toBe(349 + 79);
    const deluxe = quote('Deluxe', sel('Deluxe', 5, mods));
    expect(deluxe.month).toBe(490);
    expect(deluxe.includedModules.map((m) => m.key)).toEqual(['ofx']);
  });

  it('módulo que só existe a partir de um plano invalida a cotação abaixo dele', () => {
    expect(quote('Pro', sel('Pro', 3, ['dre'])).valid).toBe(false);
    expect(quote('Deluxe', sel('Deluxe', 5, ['dre'])).valid).toBe(true);
  });
});

describe('toggleModule / pruneUnavailable', () => {
  it('marcar módulo exclusivo sobe o plano', () => {
    const r = toggleModule(sel('Pro', 3), 'dre', true);
    expect(r.selection.plan).toBe('Deluxe');
    expect(r.adjustedTo).toBe('Deluxe');
  });

  it('marcar avulso não muda o plano', () => {
    const r = toggleModule(sel('Pro', 3), 'sup', true);
    expect(r.selection.plan).toBe('Pro');
    expect(r.adjustedTo).toBeUndefined();
  });

  it('rebaixar remove módulos que deixam de existir', () => {
    const r = pruneUnavailable(sel('Pro', 3, ['dre', 'ofx']));
    expect([...r.selection.modules]).toEqual(['ofx']);
    expect(r.removed.map((m) => m.key)).toEqual(['dre']);
  });
});

describe('compareTiers', () => {
  it('Enterprise pode sair mais barato que Pro + muitos avulsos', () => {
    const { cheapest } = compareTiers(sel('Pro', 3, ['sup', 'ven', 'os', 'pes', 'ras']));
    // Pro: 349 + 290+190+149+149+190 = 1317 · Deluxe: 490 + (mesmos) = 1458 · Enterprise: 890
    expect(cheapest.tier).toBe('Enterprise');
    expect(cheapest.month).toBe(890);
  });

  it('ignora planos que não atendem', () => {
    const { quotes, cheapest } = compareTiers(sel('Deluxe', 5, ['dre']));
    expect(quotes.find((q) => q.tier === 'Pro')?.valid).toBe(false);
    expect(cheapest.tier).toBe('Deluxe');
  });
});

describe('anual e formatação', () => {
  it('anual cobra 10 de 12 meses', () => {
    expect(annualTotal(490)).toBe(4900);
    expect(annualMonthly(490)).toBe(408.33);
  });

  it('formata BRL sem ,00', () => {
    expect(formatBRL(349)).toBe('R$ 349');
    expect(formatBRL(408.33)).toBe('R$ 408,33');
    expect(CATALOG.modules.length).toBe(16);
  });
});
