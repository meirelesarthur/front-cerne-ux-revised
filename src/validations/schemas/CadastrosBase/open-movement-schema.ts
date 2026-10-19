// src/validations/schemas/CadastrosBase/open-movement-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Saldo Inicial" (OpenMovement —
// Cadastros Base / Financeiros, execução 031, TASK-FE-031-35), espelhando
// `OpenMovementRequest::rules()` (contrato de API §7). Vive em
// `src/validations/schemas/CadastrosBase/` — mirror estrutural de
// `account-schema.ts`/`proprietary-schema.ts` (canônico dos siblings
// recentes de `CadastrosBase`): FUNÇÃO que recebe `languageGB` e devolve o
// schema. Mensagens sempre derivadas de
// `languageGB.openMovements.openMovement.form.validation`.
//
// Convenção de valor RHF por tipo de campo (mirror `account-schema.ts`):
//   - `account_uuid`/`proprietary_uuid` — `SelectAsyncPaginate`/
//     `SelectCombobox`, RHF guarda o `Option{label,value}` INTEIRO; extração
//     do uuid cru para o payload acontece só na tela (TASK-FE-031-37).
//   - `items[].financial_category_uuid`/`.cost_center_uuid` — idem, Option
//     inteiro (mirror `apportionments.*.cost_center_uuid` em
//     `centro-custo-schema.ts`).
//
// `items` — obrigatório, `min(1)` (contrato §6), cada linha com os 3 campos
// obrigatórios. SEM `.test()` de soma do array bloqueando o submit —
// decisão deliberada (contrato §6/§12): a validação server-side da SOMA do
// rateio ainda está `[AGUARDANDO APROVAÇÃO]` no contrato de API (§17.1); o
// front fica resiliente às duas opções por desenho (badge cosmético
// client-side sempre, nunca bloqueia submit).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const openMovementSchema = (languageGB: LanguageDate) => {
  const v = languageGB.openMovements.openMovement.form.validation;

  return yup.object({
    account_uuid: optionSchema.test('required', v.accountRequired, (value) => !!value),
    date: yup.string().trim().required(v.dateRequired),
    // Rejeita zero (mirror regra 2 do legado/contrato de API §7 — feedback
    // client-side imediato; o backend também valida, contrato §7).
    value: yup
      .number()
      .typeError(v.valueRequired)
      .required(v.valueRequired)
      .test('not-zero', v.valueNotZero, (val) => val !== 0),
    // Opcional — omitido do payload quando vazio (backend default 0).
    interest: yup
      .number()
      .transform((val, original) => (original === '' || original === null ? undefined : val))
      .notRequired(),
    document: yup.string().trim().nullable().max(100, v.documentMaxLength),
    note: yup.string().trim().nullable().max(40, v.noteMaxLength),
    proprietary_uuid: optionSchema.test('required', v.proprietaryRequired, (value) => !!value),
    items: yup
      .array()
      .of(
        yup.object({
          financial_category_uuid: optionSchema.test(
            'required',
            v.itemCategoryRequired,
            (value) => !!value
          ),
          cost_center_uuid: optionSchema.test(
            'required',
            v.itemCostCenterRequired,
            (value) => !!value
          ),
          value: yup
            .number()
            .typeError(v.itemValueRequired)
            .required(v.itemValueRequired)
            .min(0.01, v.itemValueMin),
        })
      )
      .min(1, v.itemsMinLength)
      .required(v.itemsMinLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const openMovementSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(openMovementSchema(languageGB)) as any;

export default openMovementSchemaResolver;
