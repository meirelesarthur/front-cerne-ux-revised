// src/validations/schemas/CadastrosBase/account-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Contas Bancárias" (Account —
// Cadastros Base / Financeiros, execução 025, TASK-FE-562), espelhando
// `AccountRequest::rules()` (lido diretamente em `api_root`,
// `app/Http/Requests/Api/V1/AccountRequest.php`, mesma fonte de verdade do
// `Account-contrato.md §5`). Vive em `src/validations/schemas/CadastrosBase/`
// (NUNCA em `pages/`) — mirror estrutural de `provider-schema.ts`/
// `package-schema.ts`/`category-animal-schema.ts` (canônico novo desta
// branch): FUNÇÃO que recebe `languageGB` e devolve o schema. Mensagens
// SEMPRE derivadas de `languageGB.accounts.account.form.validation`
// (`languageAccounts.ts`, TASK-FE-561) — nenhuma string literal de mensagem
// neste arquivo.
//
// `balance` NÃO existe neste schema — somente-leitura por construção (D5 do
// contrato de API; nem está no `$fillable` do Model), nunca faz parte do
// payload de escrita (TASK-FE-565/566 nunca inclui a chave).
//
// Convenção de valor RHF por tipo de campo (mirror `provider-schema.ts`
// `optionSchema`/`centro-custo-schema.ts`/`plan-account-schema.ts`/
// `emissor-schema.ts`):
//   - `bank`/`provider_uuid`/`investment_account_uuid` — `SelectAsyncPaginate`,
//     RHF guarda o `Option{label,value}` INTEIRO (mesmo padrão de
//     `cidade_uuid`/`specie_uuid`/`category_uuid`); a extração do valor cru
//     para o payload acontece só na tela do formulário (TASK-FE-565/566).
//   - `type`/`type_cnab`/`is_enabled`/`use_cash_book`/`is_ticket` — `Select`
//     local (não-assíncrono) via `Controller`, RHF guarda o valor PRIMITIVO
//     (char/número/boolean), mesma convenção de `condition`/`type` em
//     `centro-custo-schema.ts`/`plan-account-schema.ts`.
//   - `proprietary_uuids`/`farm_uuids` — `CheckboxListField`, array de
//     strings (uuid) cru, mirror `emissor-schema.ts` (`farm_uuids`).
//
// Obrigatoriedades espelham `AccountRequest::rules()` (fonte de verdade):
// campos `required` no create validam sempre aqui (o form de edição
// pré-popula todos os campos, então o `sometimes` do backend no update não
// relaxa a UX de validação client-side — mesma leitura já aplicada por
// `provider-schema.ts`/`emissor-schema.ts`). `bank_contract`/`bank_agreement`/
// `type_cnab`/`proprietary_uuids` são `required_if(is_ticket,true)` — via
// `.when('is_ticket', ...)`, idêntico ao backend. `provider_uuid`/
// `investment_account_uuid`/`farm_uuids` são `nullable`/opcionais nos dois
// verbos — sem `.required()`.
//
// `investment_account_uuid`: a restrição real "só contas `type=I`" é
// aplicada no `findParams` do `SelectAsyncPaginate` da tela (filtro de
// opções), não duplicada aqui — o schema não contradiz a regra do servidor,
// só não a reforça (redundante e frágil a mudança de contrato).
//
// Campos mascarados (`agency`/`account`/`code`): nenhuma máscara é aplicada
// nesta versão (Account-FrontEnd-contrato.md §"Riscos" #4 — sem fonte real
// de regex/máscara, YAGNI) — `Input` comum via `register()`, validado
// direto contra o valor cru digitado.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { ACCOUNT_TYPES } from '@/constants/cadastrosBase/account/account-type';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const accountSchema = (languageGB: LanguageDate) => {
  const v = languageGB.accounts.account.form.validation;

  return yup.object({
    // --- Informações Gerais (AccountRequest, todos `required` no create) ---
    bank: optionSchema.test('required', v.bankRequired, (value) => !!value),
    agency: yup.string().trim().required(v.agencyRequired).max(6, v.agencyMaxLength),
    account: yup.string().trim().required(v.accountRequired).max(20, v.accountMaxLength),
    // Endurecimento fiel ao backend (Rule::enum, não só max:1).
    type: yup.string().oneOf(ACCOUNT_TYPES, v.typeRequired).required(v.typeRequired),
    code: yup.string().trim().required(v.codeRequired).max(4, v.codeMaxLength), // fidelidade — coluna é 10, validação legada/backend é 4
    description: yup
      .string()
      .trim()
      .required(v.descriptionRequired)
      .max(40, v.descriptionMaxLength),
    limit: yup.number().typeError(v.limitRequired).required(v.limitRequired),
    is_enabled: yup.boolean().required(),
    use_cash_book: yup.boolean().required(),

    // Opcional (`nullable` no backend) — guarda o Option inteiro.
    provider_uuid: optionSchema,

    // Opcional — restrição a `type=I` fica no filtro de opções da tela, não
    // duplicada aqui (ver cabeçalho do arquivo).
    investment_account_uuid: optionSchema,

    // --- Emissão de Boleto (condicional a `is_ticket`) ---
    is_ticket: yup.boolean().required(),
    bank_contract: yup
      .string()
      .trim()
      .nullable()
      .max(8, v.bankContractMaxLength)
      .when('is_ticket', {
        is: true,
        then: (schema) => schema.required(v.bankContractRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    bank_agreement: yup
      .string()
      .trim()
      .nullable()
      .max(8, v.bankAgreementMaxLength)
      .when('is_ticket', {
        is: true,
        then: (schema) => schema.required(v.bankAgreementRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    type_cnab: yup
      .mixed<1 | 2 | null>()
      .nullable()
      .when('is_ticket', {
        is: true,
        then: (schema) => schema.oneOf([1, 2], v.typeCnabRequired).required(v.typeCnabRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    proprietary_uuids: yup
      .array()
      .of(yup.string().required())
      .when('is_ticket', {
        is: true,
        then: (schema) => schema.min(1, v.proprietariesRequired),
      })
      .default([]),

    // --- Fazendas Vinculadas (opcional; presence-aware no PUT — TASK-FE-566
    // decide se a chave entra no payload via `dirtyFields`, não este schema) ---
    farm_uuids: yup.array().of(yup.string().required()).default([]),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const accountSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accountSchema(languageGB));

export default accountSchemaResolver;
