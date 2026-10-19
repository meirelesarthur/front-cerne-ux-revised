// src/validations/schemas/Integracoes/exportNfseDominio-schema.ts
// Schema Yup da tela "Exportação NFS-e → Domínio" (F-119, Integrações,
// canário `97-Esteiras/071`). 2 campos obrigatórios (`start_date`/`end_date`,
// ISO `yyyy-MM-dd` via `fieldValidationSchema(...).date()`) + `.test`
// cross-field `end_date >= start_date` (espelha `after_or_equal:start_date`
// do server, corrige OQ-02 — intervalo invertido gerava xlsx vazio
// silencioso no legado). Mensagens 100% derivadas da tradução — nunca
// string literal (severidade INVIOLÁVEL).
//
// Comparação de strings ISO 'yyyy-MM-dd' é lexicográfica e correta para
// ordenar datas — não precisa parse para `Date`.

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const exportNfseDominioSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const vMsg = languageGB.integrations.exportNfseDominio.form.validation;

  return yupResolver(
    yup.object({
      start_date: v.date(),
      end_date: v
        .date()
        .test(
          'end-after-or-equal-start',
          vMsg.endBeforeStart,
          (value, ctx) => !value || !ctx.parent.start_date || value >= ctx.parent.start_date
        ),
    })
  );
};
