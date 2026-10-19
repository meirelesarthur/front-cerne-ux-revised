import { describe, expect, it } from 'vitest';

import type { SystemLogEntry } from '@/@types/v2/SystemLogs';

import {
  MAX_LOADED_BYTES,
  MAX_LOADED_LINES,
  buildBreadcrumb,
  buildPageText,
  classifyContentError,
  countLines,
  filterEntries,
  highlightSegments,
  isLoadLimitReached,
  parentPathOf,
  splitLines,
} from './utils';

const entry = (name: string, type: 'file' | 'dir' = 'file'): SystemLogEntry => ({
  name,
  path: name,
  type,
  size: type === 'file' ? 10 : null,
  modified_at: '2026-09-30T08:22:41-03:00',
});

describe('buildBreadcrumb', () => {
  it('raiz', () => {
    expect(buildBreadcrumb('', 'logs')).toEqual([{ name: 'logs', path: '' }]);
  });

  it('um nível', () => {
    expect(buildBreadcrumb('jobs', 'logs')).toEqual([
      { name: 'logs', path: '' },
      { name: 'jobs', path: 'jobs' },
    ]);
  });

  it('N níveis e barra final', () => {
    expect(buildBreadcrumb('jobs/2026/queue.log/', 'logs')).toEqual([
      { name: 'logs', path: '' },
      { name: 'jobs', path: 'jobs' },
      { name: '2026', path: 'jobs/2026' },
      { name: 'queue.log', path: 'jobs/2026/queue.log' },
    ]);
  });
});

describe('parentPathOf', () => {
  it('devolve a pasta do arquivo', () => {
    expect(parentPathOf('laravel.log')).toBe('');
    expect(parentPathOf('jobs/2026/queue.log')).toBe('jobs/2026');
  });
});

describe('filterEntries', () => {
  const entries = [entry('laravel-2026-09-30.log'), entry('Relatório.log'), entry('jobs', 'dir')];

  it('sem termo devolve tudo', () => {
    expect(filterEntries(entries, '  ')).toHaveLength(3);
  });

  it('ignora caixa e acento', () => {
    expect(filterEntries(entries, 'RELATORIO').map((e) => e.name)).toEqual(['Relatório.log']);
    expect(filterEntries(entries, 'relatório').map((e) => e.name)).toEqual(['Relatório.log']);
  });

  it('casa por substring e inclui pastas', () => {
    expect(filterEntries(entries, 'jo').map((e) => e.name)).toEqual(['jobs']);
    expect(filterEntries(entries, '2026').map((e) => e.name)).toEqual(['laravel-2026-09-30.log']);
  });

  it('sem resultado devolve lista vazia', () => {
    expect(filterEntries(entries, 'inexistente')).toEqual([]);
  });
});

describe('splitLines / buildPageText', () => {
  it('descarta a linha vazia final e trata conteúdo vazio', () => {
    expect(splitLines('a\nb\n')).toEqual(['a', 'b']);
    expect(splitLines('a\nb')).toEqual(['a', 'b']);
    expect(splitLines('')).toEqual([]);
    expect(splitLines('\n')).toEqual(['']);
  });

  it('corta linha acima do limite e mantém as demais', () => {
    const result = buildPageText(`${'x'.repeat(15)}\ncurta\n`, '…[cortada]', 10);
    expect(result.text).toBe(`${'x'.repeat(10)}…[cortada]\ncurta`);
    expect(result.lineCount).toBe(2);
  });
});

describe('highlightSegments', () => {
  it('termo vazio não destaca', () => {
    expect(highlightSegments('abc', '')).toEqual([{ text: 'abc', match: false }]);
  });

  it('múltiplas ocorrências por linha, sem diferenciar caixa', () => {
    expect(highlightSegments('ERROR x error', 'error')).toEqual([
      { text: 'ERROR', match: true },
      { text: ' x ', match: false },
      { text: 'error', match: true },
    ]);
  });

  it('trata metacaracteres como literal', () => {
    expect(highlightSegments('a.*b', '.*')).toEqual([
      { text: 'a', match: false },
      { text: '.*', match: true },
      { text: 'b', match: false },
    ]);
  });

  it('sem ocorrência devolve a linha inteira', () => {
    expect(highlightSegments('abc', 'zz')).toEqual([{ text: 'abc', match: false }]);
  });
});

describe('isLoadLimitReached', () => {
  it('limite por bytes ou por linhas', () => {
    expect(isLoadLimitReached(MAX_LOADED_BYTES - 1, MAX_LOADED_LINES - 1)).toBe(false);
    expect(isLoadLimitReached(MAX_LOADED_BYTES, 0)).toBe(true);
    expect(isLoadLimitReached(0, MAX_LOADED_LINES)).toBe(true);
  });
});

describe('rotas e locale', () => {
  it('explorerHref: raiz sem query e pasta com path codificado', async () => {
    const { explorerHref, viewerHref, toIntlLocale } = await import('./utils');
    expect(explorerHref('')).toBe('/administrativo/logs');
    expect(explorerHref('jobs/2026')).toBe('/administrativo/logs?path=jobs%2F2026');
    expect(viewerHref('jobs/a b.log')).toBe('/administrativo/logs/arquivo?path=jobs%2Fa%20b.log');
    expect(toIntlLocale('US')).toBe('en-US');
    expect(toIntlLocale('ES')).toBe('es-ES');
    expect(toIntlLocale('BR')).toBe('pt-BR');
    expect(toIntlLocale(null)).toBe('pt-BR');
  });
});

describe('countLines', () => {
  it('conta linhas de blocos terminados ou não em \\n', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('a')).toBe(1);
    expect(countLines('a\n')).toBe(1);
    expect(countLines('a\nb')).toBe(2);
    expect(countLines('a\nb\n')).toBe(2);
  });

  it('é consistente com splitLines', () => {
    for (const sample of ['x\ny\nz\n', 'x\ny', '\n\n', 'único']) {
      expect(countLines(sample)).toBe(splitLines(sample).length);
    }
  });
});

describe('classifyContentError', () => {
  const http = (status: number, errors?: Record<string, string[]>) => ({
    response: { status, data: { errors: errors ?? null } },
  });

  it('classifica por status e por campo do 422', () => {
    expect(classifyContentError(http(403))).toBe('forbidden');
    expect(classifyContentError(http(404))).toBe('not-found');
    expect(
      classifyContentError(
        http(422, { before: ['O cursor está além do tamanho atual do arquivo. Recarregue.'] })
      )
    ).toBe('invalid-cursor');
    expect(classifyContentError(http(422, { path: ['Arquivo binário: use o download.'] }))).toBe(
      'binary'
    );
    expect(classifyContentError(http(422, { path: ['O caminho informado é inválido.'] }))).toBe(
      'not-found'
    );
    expect(classifyContentError(http(500))).toBe('generic');
    expect(classifyContentError(new Error('rede'))).toBe('generic');
  });
});
