// src/validations/schemas/RelatorioSla/relatorio-sla-filter-schema.test.ts
// -----------------------------------------------------------------------------
// Cobertura do bug de homologação "Cyclic dependency, node was: end_date" no
// Relatório SLA (feature Rejeitados/Cancelados + SLA, esteira 97-Esteiras/037).
// `start_date`/`end_date` têm `.when(...)` mútuo; sem declarar o par em
// `yup.object(shape, dependencies)` o Yup não resolve o schema no submit
// ("Gerar") e lança a excecao ANTES de qualquer assert de validação (o
// smoke E2E não pegou porque não submeteu com data preenchida). Este teste
// prova (1) que o schema RESOLVE sem lançar o ciclo e (2) a matriz
// required_with mútua continua correta.
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { supplyStatusSlaReportFilterSchema } from './relatorio-sla-filter-schema';

const languageGB = languagePtBr.BR;
const schema = supplyStatusSlaReportFilterSchema(languageGB);
const messages = languageGB.supplyStatusSlaReport.validation;

describe('supplyStatusSlaReportFilterSchema — ciclo start_date/end_date (bug de homologação)', () => {
  it('resolve sem lançar "Cyclic dependency" (o bug em si) — ambos vazios', async () => {
    await expect(
      schema.validate({ uuid: null, start_date: null, end_date: null, status: null })
    ).resolves.toBeTruthy();
  });

  it('start_date preenchido SEM end_date → REPROVA com dateRangeRequired', async () => {
    await expect(
      schema.validate(
        { uuid: null, start_date: '2026-08-01', end_date: null, status: null },
        { abortEarly: false }
      )
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'end_date',
          message: messages.dateRangeRequired,
        }),
      ]),
    });
  });

  it('end_date preenchido SEM start_date → REPROVA com dateRangeRequired', async () => {
    await expect(
      schema.validate(
        { uuid: null, start_date: null, end_date: '2026-08-10', status: null },
        { abortEarly: false }
      )
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'start_date',
          message: messages.dateRangeRequired,
        }),
      ]),
    });
  });

  it('ambos preenchidos → PASSA', async () => {
    await expect(
      schema.validate({
        uuid: null,
        start_date: '2026-08-01',
        end_date: '2026-08-10',
        status: null,
      })
    ).resolves.toBeTruthy();
  });

  it('nenhum preenchido (só uuid/status opcionais) → PASSA', async () => {
    await expect(
      schema.validate({
        uuid: { value: 'uuid-x', label: 'Fornecedor X' },
        start_date: null,
        end_date: null,
        status: { value: 'aprovado', label: 'Aprovado' },
      })
    ).resolves.toBeTruthy();
  });
});
