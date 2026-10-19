// src/validations/schemas/FinancialFreeze/financial-freeze-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Congelamento Financeiro"
// (FinancialFreeze — F-110, esteira 97-Esteiras/008, Tarefa 32), espelhando
// `FinancialFreezeRequest::rules()` (contrato de tela §6/§10) EXCETO a regra
// FF-N1 (ver GAP-FF-FE-01 abaixo). Vive em `src/validations/schemas/
// FinancialFreeze/` (pasta pelo NOME DA ENTIDADE, nunca em `src/pages/`) —
// mirror LITERAL de `src/validations/schemas/OfxImport/ofx-import-schema.ts`
// (fábrica `(languageGB) => yup.object({...})`, `optionSchema` local, export
// do resolver + default).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const financialFreezeSchema = (languageGB: LanguageDate) => {
  const v = languageGB.financial.financialFreeze.form.validation;

  // GAP-FF-FE-01 (pré-validação client de mês/ano futuro — default AS-IS
  // aplicado nesta Tarefa, NÃO implementado aqui) — a regra de negócio
  // FF-N1 ("O mês e ano não pode ser superior ao mês atual.") não é
  // replicada neste schema. O servidor é a única fonte de verdade dessa
  // regra; o 422 chega mapeado no campo `month` (não em `year`) e é
  // exibido via `setError` em `CreateOrUpdateFinancialFreeze.tsx`. Ver
  // `04-Gaps_Frontend_UI/GAP-FF-FE-01-prevalidacao-client-mes-futuro.md`.
  return yup.object({
    month: optionSchema.test('required', v.monthRequired, (value) => !!value),
    // `year` — string de 4 dígitos (`digits:4` no servidor, `varchar(4)` na
    // coluna, AD-08). NUNCA convertida para number (o dado legado de
    // produção pode não ser numericamente limpo — mesma regra do contrato
    // de tela §4/Tarefa 32, armadilha confirmada #4).
    year: yup
      .string()
      .trim()
      .required(v.yearRequired)
      .matches(/^\d{4}$/, v.yearDigits),
    // ⚠️ Atenção real (Tarefa 32 §4, armadilha confirmada #2): `is_frozen:
    // false` ("Não") é um valor VÁLIDO. O teste abaixo valida a PRESENÇA do
    // objeto `Option` (que sempre existe quando o Select tem uma seleção),
    // NUNCA o booleano interno via `!!value.value`. Trocar por
    // `.required()` sobre o valor ou por `yup.boolean().required()`
    // rejeitaria "Não" — NÃO fazer isso.
    is_frozen: optionSchema.test('required', v.isFrozenRequired, (value) => !!value),
  });
};

export const financialFreezeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(financialFreezeSchema(languageGB)) as any;

export default financialFreezeSchemaResolver;
