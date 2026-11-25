import { describe, expect, it } from 'vitest';

import { getInitialRequestType } from './initialRequestType';

describe('getInitialRequestType', () => {
  it('pré-seleciona Serviço quando a URL traz ?tipo=S na criação', () => {
    expect(getInitialRequestType('?tipo=S', false)).toBe('S');
  });

  it('aceita minúscula e espaços', () => {
    expect(getInitialRequestType('?tipo= p ', false)).toBe('P');
  });

  it('ignora valor fora do enum', () => {
    expect(getInitialRequestType('?tipo=X', false)).toBeNull();
  });

  it('ignora na edição (o tipo é imutável no update)', () => {
    expect(getInitialRequestType('?tipo=S', true)).toBeNull();
  });

  it('sem parâmetro, o formulário nasce vazio como antes', () => {
    expect(getInitialRequestType('', false)).toBeNull();
  });
});
