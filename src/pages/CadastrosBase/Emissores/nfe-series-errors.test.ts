// UT-000780 — 422 flat da API vira erro de campo `nfe_series.N.campo` (e `nfe_series.root`).
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { applyNfeSeriesServerErrors } from './nfe-series-errors';

function error422(errors: Record<string, string[]>) {
  const err = new AxiosError('422');
  err.response = { status: 422, data: { errors } } as any;
  return err;
}

describe('applyNfeSeriesServerErrors', () => {
  it('mapeia nfe_series.N.campo e o erro de grupo; ignora demais chaves', () => {
    const setError = vi.fn();
    applyNfeSeriesServerErrors(
      error422({
        'nfe_series.0.serie': ['Série já em uso'],
        'nfe_series.1.ultimo_numero': ['Abaixo do maior emitido'],
        nfe_series: ['Defina uma série padrão'],
        email: ['inválido'],
      }),
      setError
    );
    expect(setError).toHaveBeenCalledTimes(3);
    expect(setError).toHaveBeenCalledWith('nfe_series.0.serie', {
      type: 'server',
      message: 'Série já em uso',
    });
    expect(setError).toHaveBeenCalledWith('nfe_series.1.ultimo_numero', {
      type: 'server',
      message: 'Abaixo do maior emitido',
    });
    expect(setError).toHaveBeenCalledWith('nfe_series.root', {
      type: 'server',
      message: 'Defina uma série padrão',
    });
  });

  it('ignora erros que não são 422 de axios', () => {
    const setError = vi.fn();
    applyNfeSeriesServerErrors(new Error('x'), setError);
    expect(setError).not.toHaveBeenCalled();
  });
});
