import { describe, expect, it } from 'vitest';

import { getCellTooltipText, isTooltipEligibleColumn } from './tableCellTooltip';

describe('isTooltipEligibleColumn', () => {
  it('rejeita colunas de ação/seleção/ícone', () => {
    expect(isTooltipEligibleColumn('acoes')).toBe(false);
    expect(isTooltipEligibleColumn('select')).toBe(false);
    expect(isTooltipEligibleColumn('edit')).toBe(false);
    expect(isTooltipEligibleColumn('pdf')).toBe(false);
  });

  it('rejeita coluna sem id', () => {
    expect(isTooltipEligibleColumn(undefined)).toBe(false);
  });

  it('aceita colunas comuns de texto', () => {
    expect(isTooltipEligibleColumn('nome')).toBe(true);
    expect(isTooltipEligibleColumn('descricao')).toBe(true);
  });
});

describe('getCellTooltipText', () => {
  it('retorna o texto para coluna elegível com valor string longo', () => {
    expect(getCellTooltipText('nome', 'Fazenda Santa Rita do Rio Verde Ltda')).toBe(
      'Fazenda Santa Rita do Rio Verde Ltda'
    );
  });

  it('retorna o texto para coluna elegível com valor number', () => {
    expect(getCellTooltipText('quantidade', 12345)).toBe('12345');
  });

  it('retorna undefined para coluna de ação (acoes)', () => {
    expect(getCellTooltipText('acoes', 'qualquer valor')).toBeUndefined();
  });

  it('retorna undefined para coluna de seleção (select)', () => {
    expect(getCellTooltipText('select', 'x')).toBeUndefined();
  });

  it('retorna undefined quando o valor é null', () => {
    expect(getCellTooltipText('nome', null)).toBeUndefined();
  });

  it('retorna undefined quando o valor é undefined', () => {
    expect(getCellTooltipText('nome', undefined)).toBeUndefined();
  });

  it('retorna undefined para valor JSX/objeto complexo', () => {
    expect(getCellTooltipText('badge', { status: 'ativo' })).toBeUndefined();
  });
});
