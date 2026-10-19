import { describe, expect, it } from 'vitest';

import { canAddFarmRow, canRemoveFarmRow, emptyFarmRow } from './farmsRowGuard';

describe('farmsRowGuard — tabela Fazendas igual ao legado', () => {
  it('linha nova começa vazia ("Selecione" em Fazenda e Nível)', () => {
    expect(emptyFarmRow()).toEqual({ farm_uuid: '', level: null });
  });

  it('bloqueia adicionar quando a linha atual tem a fazenda vazia', () => {
    expect(canAddFarmRow([{ farm_uuid: '', level: 1 }])).toBe(false);
  });

  it('bloqueia adicionar quando a linha atual tem o nível vazio', () => {
    expect(canAddFarmRow([{ farm_uuid: 'f-1', level: null }])).toBe(false);
  });

  it('bloqueia adicionar quando qualquer linha está incompleta', () => {
    expect(
      canAddFarmRow([
        { farm_uuid: 'f-1', level: 2 },
        { farm_uuid: '', level: null },
      ])
    ).toBe(false);
  });

  it('permite adicionar quando todas as linhas estão completas', () => {
    expect(
      canAddFarmRow([
        { farm_uuid: 'f-1', level: 1 },
        { farm_uuid: 'f-2', level: 4 },
      ])
    ).toBe(true);
  });

  it('não remove a última linha', () => {
    expect(canRemoveFarmRow(1)).toBe(false);
    expect(canRemoveFarmRow(0)).toBe(false);
  });

  it('remove quando sobra ao menos uma linha', () => {
    expect(canRemoveFarmRow(2)).toBe(true);
  });
});
