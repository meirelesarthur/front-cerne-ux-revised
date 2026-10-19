// src/validations/schemas/CadastrosBase/proprietary-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Proprietários" (Proprietary —
// Cadastros Base), espelhando `ProprietaryRequest::rules()` (lido
// diretamente em `api_root`, TASK-PY-FE-01, backend `TASK-PY-01/02/03` já
// ✅ CONCLUÍDO/validado). Vive em `src/validations/schemas/` (NÃO em
// `pages/`) — mesmo padrão canônico de `provider-schema.ts`.
//
// Independência arquitetural: NÃO importa nada de
// `@/pages/CadastrosBase/Pessoas/` (mesma decisão de `ProprietaryRequest`
// não estender `PersonRequest` por herança) — a validação de CPF/CNPJ vem
// do util PURO e compartilhado `@/utils/cpfCnpj` (mesmo algoritmo usado por
// `provider-schema.ts`/`Pessoas/nif.ts`), sem importar a pasta de Pessoas.
//
// `farms.*.percentage` — `yup.number()` puro, faixa `min(0)`/`max(100)`
// (participação societária não passa de 100%; decisão de negócio que
// SUPERA o teto anterior de 999.99 da homologação 2026-07-30). Mesmo
// componente `NumberInput` compartilhado (`allowDot`, `decimalPlaces=2`).
// O `max(100)` do NumberInput só clampa no `blur` e o cap de dígitos crus é
// por CONTAGEM (100,00 e 999,99 têm ambos 5 dígitos), então digitar "100"
// continua possível — o bug histórico de cap fixo era do `PercentInput`
// (outro componente), não se aplica aqui (lição TASK-FE-333).
// SEM validação de soma=100% por farm (DA-PY-13, fidelidade ao legado).
//
// SEM enum de `type` — `Proprietary` não tem campo de tipo/categoria
// (contrato `## 4.5`), diferente de `Provider`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const proprietarySchema = (languageGB: LanguageDate) => {
  const v = languageGB.proprietaries.proprietary.form.validation;

  return yup.object({
    // --- raiz Person (idênticos a ProprietaryRequest §4.2) ---
    nif: yup
      .string()
      .trim()
      .required(v.nifRequired)
      .test('valid-nif', v.nifInvalid, (value) => (value ? isValidCpfCnpj(value) : false)),
    name: yup.string().trim().required(v.nameRequired).max(120, v.nameMaxLength),
    nickname: yup.string().trim().required(v.nicknameRequired).max(60, v.nicknameMaxLength),
    email: yup
      .string()
      .trim()
      .required(v.emailRequired)
      .email(v.emailInvalid)
      .max(89, v.emailMaxLength),
    phone: yup.string().nullable(),
    zip_code: yup.string().nullable(),
    address: yup.string().trim().required(v.addressRequired).max(120, v.addressMaxLength),
    number: yup.string().trim().required(v.numberRequired).max(10, v.numberMaxLength),
    district: yup.string().trim().required(v.districtRequired).max(60, v.districtMaxLength),
    city: optionSchema.test('required', v.cityRequired, (value) => !!value),

    // --- bloco proprietary (raiz do papel) — farms[]/state_registration_numbers[] ---
    // TASK-PY-FE-03: mínimo 1 linha (DoD/Cenário "Tentar salvar farms vazio
    // — erro client-side"). `pessoa-schema.ts` (molde estrutural) NÃO tem
    // esse `.min(1)` — divergência INTENCIONAL desta ficha (fachada
    // dedicada `/proprietaries` exige ao menos 1 fazenda; o step embutido em
    // Pessoas não tinha essa regra porque o papel podia ser ativado sem
    // fazenda vinculada ainda, fluxo que não existe nesta tela standalone).
    farms: yup
      .array(
        yup.object({
          farm: optionSchema.test('required', v.farmRequired, (value) => !!value),
          // `yup.number()` puro (não mais STRING+teste custom) — o
          // `NumberInput` compartilhado já entrega `number | null` via
          // `Controller` (nunca a string mascarada), então o schema só
          // valida a faixa de negócio. `nullable()`/`notRequired()`
          // preserva o comportamento ORIGINAL de linha opcional (nenhuma
          // exigência nova de preenchimento nasceu deste patch).
          percentage: yup
            .number()
            .typeError(v.percentageRange)
            .min(0, v.percentageRange)
            .max(100, v.percentageRange)
            .nullable()
            .notRequired(),
        })
      )
      .min(1, v.farmsMinRequired)
      .default([]),

    state_registration_numbers: yup.array(yup.object({ value: yup.string() })).default([]),
  });
};

export const proprietarySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(proprietarySchema(languageGB));

export default proprietarySchemaResolver;
