// src/validations/schemas/Integracoes/exportFinancialCsv-schema.ts
// Schema Yup da tela "Exportação Financeira CSV — C. Pagas/Recebidas" (F-120,
// Integrações, irmã do canário F-119). 2 campos obrigatórios
// (`start_date`/`end_date`, ISO `yyyy-MM-dd` via `fieldValidationSchema(...).date()`)
// + `.test` cross-field `end_date >= start_date` (espelha `after_or_equal:start_date`
// do server, mesma fidelidade OQ-03 do canário). Mensagens 100% derivadas da
// tradução — nunca string literal (severidade INVIOLÁVEL).
//
// Comparação de strings ISO 'yyyy-MM-dd' é lexicográfica e correta para
// ordenar datas — não precisa parse para `Date`.

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const exportFinancialCsvSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const vMsg = languageGB.integrations.exportFinancialCsv.form.validation;

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
