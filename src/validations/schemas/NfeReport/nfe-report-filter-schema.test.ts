// src/validations/schemas/NfeReport/nfe-report-filter-schema.test.ts
// -----------------------------------------------------------------------------
// Cobertura do BUG DO DONO: "Ao aplicar os filtros data início e fim, nada
// acontece ao clicar em Gerar relatório" (F-287, esteira 97-Esteiras/079).
//
// Causa-raiz: `status` usava `v.option<NfeEstado>()` (helper `required()` de
// `fieldValidationSchema`) mesmo nascendo `null` em `buildPristineValues` —
// `NfeReportRequest` NÃO exige `status`. Yup `.nullable().required()` ainda
// rejeita `null`, então o resolver reprovava um submit só-com-datas e o RHF
// nunca chamava `handleDownload` (falha SILENCIOSA, sem exceção, sem toast).
//
// Este teste prova (1) que um payload só com `start_date`/`end_date` é
// VÁLIDO (o cenário exato relatado pelo dono) e (2) que `end_date <
// start_date` continua REPROVANDO com a mensagem correta.
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { nfeReportFilterSchema } from './nfe-report-filter-schema';

const languageGB = languagePtBr.BR;
const schema = nfeReportFilterSchema(languageGB);
const messages = languageGB.nfeReport.report.validation;

describe('nfeReportFilterSchema — bug do dono: submit só com datas fica mudo', () => {
  it('start_date + end_date apenas (status/demais filtros null/vazios) → VÁLIDO', async () => {
    await expect(
      schema.validate(
        {
          start_date: '2026-08-01',
          end_date: '2026-08-10',
          status: null,
          client_ids: [],
          farm_ids: [],
          center_ids: [],
          issuer_id: null,
          provider_id: null,
          format: { value: 'pdf', label: 'PDF' },
        },
        { abortEarly: false }
      )
    ).resolves.toBeTruthy();
  });

  it('end_date < start_date → INVÁLIDO com a mensagem end-date-after-start-date', async () => {
    await expect(
      schema.validate(
        {
          start_date: '2026-08-10',
          end_date: '2026-08-01',
          status: null,
          client_ids: [],
          farm_ids: [],
          center_ids: [],
          issuer_id: null,
          provider_id: null,
          format: { value: 'pdf', label: 'PDF' },
        },
        { abortEarly: false }
      )
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'end_date',
          message: messages.endDateBeforeStartDate,
        }),
      ]),
    });
  });

  it('status nulo isoladamente NÃO reprova mais (regressão do bug corrigido)', async () => {
    // isValid() nunca lança — é o teste mais direto do sintoma relatado: o
    // form "não faz nada" porque isValid ficava false com status:null.
    await expect(
      schema.isValid({
        start_date: '2026-08-01',
        end_date: '2026-08-10',
        status: null,
        client_ids: [],
        farm_ids: [],
        center_ids: [],
        issuer_id: null,
        provider_id: null,
        format: { value: 'pdf', label: 'PDF' },
      })
    ).resolves.toBe(true);
  });
});
