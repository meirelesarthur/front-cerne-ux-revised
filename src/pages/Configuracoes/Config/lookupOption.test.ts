import { describe, expect, it } from 'vitest';

import { partnerLabel, planRoleLabel, toLookupOption } from './lookupOption';

describe('toLookupOption', () => {
  it('exibe o nome como label e mantém o uuid como value', () => {
    expect(toLookupOption('u-1', 'Afiliado Alfa')).toEqual({
      label: 'Afiliado Alfa',
      value: 'u-1',
    });
  });
  it('faz fallback para o uuid quando o nome vem null', () => {
    expect(toLookupOption('u-2', null)).toEqual({ label: 'u-2', value: 'u-2' });
  });
  it('retorna null sem uuid', () => {
    expect(toLookupOption(null, 'x')).toBeNull();
  });
});

describe('labels iguais aos da lista', () => {
  it('afiliado: apelido — nome', () => {
    expect(partnerLabel('Zé', 'José Silva')).toBe('Zé — José Silva');
  });
  it('plano: nome - R$ preço', () => {
    expect(planRoleLabel('Premium', '99.90')).toBe('Premium - R$ 99.90');
  });
});
