import { describe, expect, it } from 'vitest';

import { parseContentDispositionFilename } from './parseContentDispositionFilename';

describe('parseContentDispositionFilename', () => {
  it('prioriza filename* UTF-8 sobre filename', () => {
    const header =
      'attachment; filename="relatorio.log"; filename*=utf-8\'\'relat%C3%B3rio%20final.log';
    expect(parseContentDispositionFilename(header, 'x/y.log')).toBe('relatório final.log');
  });

  it('lê filename com aspas', () => {
    expect(
      parseContentDispositionFilename('attachment; filename="laravel-2026-09-30.log"', 'a.log')
    ).toBe('laravel-2026-09-30.log');
  });

  it('lê filename sem aspas', () => {
    expect(parseContentDispositionFilename('attachment; filename=app.log', 'a.log')).toBe(
      'app.log'
    );
  });

  it('usa o basename do path quando o header está ausente', () => {
    expect(parseContentDispositionFilename(undefined, 'jobs/2026/queue.log')).toBe('queue.log');
    expect(parseContentDispositionFilename(null, 'laravel.log')).toBe('laravel.log');
  });

  it('usa o basename quando filename* é inválido e não há filename', () => {
    expect(
      parseContentDispositionFilename("attachment; filename*=utf-8''%E0%A4%A", 'p/q.log')
    ).toBe('q.log');
  });
});
