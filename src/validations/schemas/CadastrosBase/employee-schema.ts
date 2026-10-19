// src/validations/schemas/CadastrosBase/employee-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Funcionários" (Employee — Cadastros
// Base), espelhando `EmployeeRequest::rules()` (lido diretamente em
// `api_root`, TASK-EMP-FE-01, redespacho pós GAP-EMP-FE-01).
//
// Vive em `src/validations/schemas/` (NÃO em `pages/`) — mesmo padrão
// canônico de `provider-schema.ts`/`client-schema.ts`.
//
// Independência arquitetural: NÃO importa nada de
// `@/pages/CadastrosBase/Pessoas/` — a validação de CPF/CNPJ vem do util
// PURO e compartilhado `@/utils/cpfCnpj` (mesmo algoritmo usado por
// `provider-schema.ts`/`client-schema.ts`).
//
// DIVERGÊNCIA DELIBERADA do bloco `employee` de
// `src/pages/CadastrosBase/Pessoas/pessoa-schema.ts` (linhas 79-108): lá
// `function`/`birthday` só são obrigatórios condicionalmente
// (`.when('enabled', is: true, ...)`, porque no wizard o papel Employee é
// opcional/toggle). Nesta fachada standalone NÃO existe esse toggle — a API
// só cria papéis ATIVOS (`employee.is_enabled` forçado `true`, DA-EMP-11) —
// logo `function`/`birthday`/`base_salary` são `.required()` INCONDICIONAL,
// confirmado em `EmployeeRequest.php:152,159,162` (`required` sem depender
// do verbo POST/PUT). Estilo simples, sem `.when`, mirror
// `function-schema.ts` (Funções).
//
// `zip_code` NULLABLE (não `required`) — divergência CONFIRMADA do texto
// original da ficha (que sugeria `zip_code` obrigatório): leitura direta de
// `EmployeeRequest.php:140` (`'zip_code' => ['nullable', 'string', 'max:9']`)
// + dos 2 precedentes reais já ✅ CONCLUÍDO (`provider-schema.ts:49`,
// `client-schema.ts:81`, ambos `nullable()`) confirma que a alegação
// "obrigatório (mirror Provider)" nunca foi reconfirmada contra o Request
// real — correção TÉCNICA direta (sem ambiguidade de negócio/UX), mesmo
// racional já aplicado pelo Executor do módulo Client a este EXATO campo
// (ver nota de cabeçalho de `client-schema.ts`), não um Gap novo.
//
// `email` — condicional `.when('create_user', { is: true, then: required })`
// (DA-EMP-06, `EmployeeRequest.php:135` `Rule::requiredIf($createUserRequested)`).
// `role` — condicional simétrica (`EmployeeRequest.php:178`
// `required_if:create_user,true`), TASK-EMP-FE-04 liga a UI de ambos.
//
// `commission`/`vl_time_productive`/`goal_salary` SEM `.required()` — anti-
// gap MANTIDO (DA-EMP-10, ausência real e documentada do legado/servidor,
// `EmployeeRequest.php:153-154,160` todos `nullable`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';
import { todayLocalIso } from '@/utils/localDate';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const employeeSchema = (languageGB: LanguageDate) => {
  const v = languageGB.employees.employee.form.validation;

  return yup.object({
    // --- raiz Person (idênticos a EmployeeRequest §raiz) ---
    nif: yup
      .string()
      .trim()
      .required(v.nifRequired)
      .test('valid-nif', v.nifInvalid, (value) => (value ? isValidCpfCnpj(value) : false)),
    name: yup.string().trim().required(v.nameRequired).max(120, v.nameMaxLength),
    // CORRIGIDO — GAP-EMP-FE-01: campo real, obrigatório, mirror
    // `provider-schema.ts:46`/`client-schema.ts:78`.
    nickname: yup.string().trim().required(v.nicknameRequired).max(60, v.nicknameMaxLength),
    // Condicional: obrigatório só quando `create_user===true` (DA-EMP-06).
    email: yup
      .string()
      .trim()
      .email(v.emailInvalid)
      .max(89, v.emailMaxLength)
      .nullable()
      .when('create_user', {
        is: true,
        then: (schema) => schema.required(v.emailRequiredForUser),
      }),
    phone: yup.string().nullable().max(15, v.phoneMaxLength),
    // NULLABLE — ver nota de cabeçalho (divergência confirmada do texto
    // original da ficha, reconfirmado contra `EmployeeRequest.php:140`).
    zip_code: yup.string().nullable(),
    address: yup.string().trim().required(v.addressRequired).max(120, v.addressMaxLength),
    // REQUIRED — confirmado em `EmployeeRequest.php:142` (omitido do texto
    // original da ficha, incluído por fidelidade ao Form Request, mesmo
    // padrão já usado por `ProviderDetail`, "ACHADO REAL #2").
    // `.nullable()` — Bug 1 (F-164, esteira 090): sem ela, `null` vindo do
    // banco (edição sem tocar no campo) vaza a mensagem TÉCNICA crua do Yup
    // ("must be a string type... null") em vez da mensagem amigável
    // `numberRequired`/`districtRequired`. Mesmo padrão já usado por
    // `birthday` nesta função.
    number: yup.string().trim().nullable().required(v.numberRequired).max(10, v.numberMaxLength),
    district: yup
      .string()
      .trim()
      .nullable()
      .required(v.districtRequired)
      .max(60, v.districtMaxLength),
    city: optionSchema.test('required', v.cityRequired, (value) => !!value),

    // --- bloco employee.* (vínculo empregatício, SEM `.when('enabled')` —
    // fachada standalone só escreve papéis ATIVOS, DA-EMP-11) ---
    office: yup.string().nullable().max(120, v.officeMaxLength),
    function: optionSchema.test('required', v.functionRequired, (value) => !!value),
    commission: yup.number().nullable(),
    vl_time_productive: yup.number().nullable(),
    // `.nullable()` — Bug 1 (F-164, esteira 090): default `null` (create) ou
    // valor ausente do banco fazia o Yup castar para `NaN` e vazar a
    // mensagem TÉCNICA crua ("must be a number type... NaN") em vez de
    // `baseSalaryRequired`. Mesmo padrão de `birthday` nesta função.
    base_salary: yup.number().nullable().required(v.baseSalaryRequired).min(0, v.baseSalaryMin),
    goal_salary: yup.number().nullable(),
    center: optionSchema,
    // Bug 4 (F-164, esteira 090): máx = hoje, TESTE DE STRING (comparação
    // lexicográfica ISO 'yyyy-MM-dd', NUNCA `yup.date()` — proibido no
    // projeto, ver `field-validation-schema.ts`). Mesma técnica de
    // `cashBook-schema.ts::end_date` ('not-today-or-future').
    birthday: yup
      .string()
      .nullable()
      .required(v.birthdayRequired)
      .test('not-future', v.birthdayNotFuture, (value) => {
        if (!value) return true;
        const todayIso = todayLocalIso();
        return value <= todayIso;
      }),
    bank: optionSchema,
    account_type: yup.string().nullable(),
    agency: yup.string().nullable(),
    account: yup.string().nullable(),
    pix_type: optionSchema,
    pix: yup.string().nullable(),

    // --- bloco opcional `create_user`/`role` (DA-EMP-06, TASK-EMP-FE-04) ---
    // `role` obrigatório só quando `create_user===true` — mirror exato de
    // `EmployeeRequest.php:177-182` (`required_if:create_user,true`).
    create_user: yup.boolean().default(false),
    role: optionSchema.when('create_user', {
      is: true,
      then: (schema) => schema.test('required', v.roleRequired, (value) => !!value),
    }),
  });
};

export const employeeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(employeeSchema(languageGB));

export default employeeSchemaResolver;
