import { describe, expect, it } from 'vitest';

import { CATALOG } from './catalog';
import {
  annualMonthly,
  annualTotal,
  bandIndex,
  compareTiers,
  consultPrice,
  formatBRL,
  positionToSize,
  pruneUnavailable,
  quote,
  sizeToPosition,
  toggleModule,
  type Selection,
} from './pricing';

// Fazenda de 1.200 cabeças = faixa 2 (até 1.500), como no simulador do documento.
const sel = (plan: Selection['plan'], users: number, modules: string[] = [], size = 1200, unit: Selection['unit'] = 'cab'): Selection => ({
  plan,
  users,
  modules: new Set(modules),
  unit,
  size,
  consult: 'none',
});

describe('faixas de tamanho', () => {
  it('cabeças: limites 500 · 1.500 · 3.000 · 10.000', () => {
    expect([100, 500, 501, 1500, 3000, 10000, 10001].map((n) => bandIndex('cab', n))).toEqual([0, 0, 1, 1, 2, 3, 4]);
  });

  it('hectares: limites 200 · 800 · 1.500 · 3.000', () => {
    expect([200, 201, 800, 1500, 3000, 3001].map((n) => bandIndex('ha', n))).toEqual([0, 1, 1, 2, 3, 4]);
  });

  it('preço do plano acompanha a faixa', () => {
    expect(quote('Pro', sel('Pro', 5, [], 300)).base).toBe(189);
    expect(quote('Deluxe', sel('Deluxe', 5, [], 1200)).base).toBe(490);
    expect(quote('Enterprise', sel('Enterprise', 5, [], 2000)).base).toBe(1290);
  });

  it('faixa 5 é ponto de partida para proposta', () => {
    const q = quote('Enterprise', sel('Enterprise', 5, [], 12000));
    expect(q.band).toBe(4);
    expect(q.openRange).toBe(true);
    expect(q.base).toBe(2790);
  });

  it('régua: tamanho ↔ posição é consistente (5 trechos iguais)', () => {
    expect(sizeToPosition('cab', 500)).toBe(100);
    expect(sizeToPosition('cab', 1500)).toBe(200);
    expect(sizeToPosition('cab', 20000)).toBe(500);
    expect(positionToSize('cab', 100)).toBe(500);
    expect(bandIndex('cab', positionToSize('cab', 150))).toBe(1);
  });
});

describe('quote', () => {
  it('Pro com acessos incluídos e sem módulos = valor base da faixa', () => {
    const q = quote('Pro', sel('Pro', 5));
    expect(q.month).toBe(349);
    expect(q.extraSeats).toBe(0);
  });

  it('cobra acesso extra: R$ 25 no Pro e no Deluxe, ilimitado no Enterprise', () => {
    expect(quote('Pro', sel('Pro', 7)).month).toBe(349 + 2 * 25);
    expect(quote('Deluxe', sel('Deluxe', 13)).month).toBe(490 + 3 * 25);
    const ent = quote('Enterprise', sel('Enterprise', 40));
    expect(ent.extraSeats).toBe(0);
    expect(ent.month).toBe(890);
  });

  it('módulo avulso soma no Pro e vem incluído no Deluxe', () => {
    const mods = ['ofx'];
    expect(quote('Pro', sel('Pro', 5, mods)).month).toBe(349 + 79);
    const deluxe = quote('Deluxe', sel('Deluxe', 5, mods));
    expect(deluxe.month).toBe(490);
    expect(deluxe.includedModules.map((m) => m.key)).toEqual(['ofx']);
  });

  it('módulo que só existe a partir de um plano invalida a cotação abaixo dele', () => {
    expect(quote('Pro', sel('Pro', 5, ['dre'])).valid).toBe(false);
    expect(quote('Deluxe', sel('Deluxe', 5, ['dre'])).valid).toBe(true);
  });
});

describe('toggleModule / pruneUnavailable', () => {
  it('marcar módulo exclusivo sobe o plano', () => {
    const r = toggleModule(sel('Pro', 5), 'dre', true);
    expect(r.selection.plan).toBe('Deluxe');
    expect(r.adjustedTo).toBe('Deluxe');
  });

  it('marcar avulso não muda o plano', () => {
    const r = toggleModule(sel('Pro', 5), 'sup', true);
    expect(r.selection.plan).toBe('Pro');
    expect(r.adjustedTo).toBeUndefined();
  });

  it('rebaixar remove módulos que deixam de existir', () => {
    const r = pruneUnavailable(sel('Pro', 5, ['dre', 'ofx']));
    expect([...r.selection.modules]).toEqual(['ofx']);
    expect(r.removed.map((m) => m.key)).toEqual(['dre']);
  });
});

describe('compareTiers', () => {
  it('Enterprise pode sair mais barato que Pro + muitos avulsos', () => {
    const { cheapest } = compareTiers(sel('Pro', 5, ['sup', 'ven', 'os', 'pes', 'ras']));
    // Faixa 2 · Pro: 349 + 290+190+149+149+190 = 1317 · Deluxe: 490 + (mesmos) = 1458 · Enterprise: 890
    expect(cheapest.tier).toBe('Enterprise');
    expect(cheapest.month).toBe(890);
  });

  it('ignora planos que não atendem', () => {
    const { quotes, cheapest } = compareTiers(sel('Deluxe', 5, ['dre']));
    expect(quotes.find((q) => q.tier === 'Pro')?.valid).toBe(false);
    expect(cheapest.tier).toBe('Deluxe');
  });
});

describe('anual, consultoria e formatação', () => {
  it('anual cobra 10 de 12 meses', () => {
    expect(annualTotal(490)).toBe(4900);
    expect(annualMonthly(490)).toBe(408.33);
  });

  it('GB Consult: valores de referência', () => {
    expect(['none', 'fis', 'faz', 'cor'].map((k) => consultPrice(k))).toEqual([0, 489, 1290, 3490]);
  });

  it('formata BRL sem ,00 e o catálogo tem 15 módulos', () => {
    expect(formatBRL(349)).toBe('R$ 349');
    expect(formatBRL(408.33)).toBe('R$ 408,33');
    expect(CATALOG.modules.length).toBe(15);
  });
});
