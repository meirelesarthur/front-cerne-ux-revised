// src/pages/CadastrosBase/Emissores/emissor-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Emissor NFe — mirror de
// CadastrosBase/CondicoesPagamento/condicao-pagamento-schema.ts: FUNÇÃO que
// recebe `languageGB` e devolve o schema (mensagens i18n).
//
// Cobre AMBAS as seções do form único (`CreateOrUpdateEmissor.tsx`):
// "Informações Gerais"/"Endereço"/"Fazendas"/"Inscrições Estaduais"
// (TASK-FE-322) + "Configuração Fiscal" condicional por `issues_nfe`
// (TASK-FE-323) — um único schema Yup, campos condicionais via `.when()`.
//
// UT-000766 T4 / D-101-03: CST/CFOP/NCM/percentuais/token IBPT padrão saíram do
// schema. UT-000780: séries de NF-e (`nfe_series`) substituem a série/último
// número únicos; com `issues_nfe=true` exige >= 1 série, exatamente 1 padrão,
// série única (inteiro 0..999) e último número >= piso da série já usada
// (espelho da API; a API continua sendo a autoridade — 422 vira erro de campo).
//
// `cpf_cnpj` — validação de dígito verificador client-side (§5.3, melhoria
// de UX zero-custo; o backend não valida isso).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';

import type { LanguageDate } from '@/@types/language';
import type { IssuerNfeSeriesForm } from '@/@types/v2/Issuers';

type NfeSeriesRow = Partial<IssuerNfeSeriesForm>;

/**
 * Regras locais das séries de NF-e (espelho da API); erros de grupo usam
 * `nfe_series.root` (convenção do RHF para field arrays).
 * @param {NfeSeriesRow[]} rows - Linhas do field array `nfe_series`.
 * @param {object} messages - Mensagens i18n de validação do módulo.
 * @param {Function} createError - Fábrica de erro por caminho (`ctx.createError`).
 * @return {true | yup.ValidationError} `true` ou `ValidationError` agregado (1 por linha/campo).
 */
export function validateNfeSeries(
  rows: NfeSeriesRow[],
  messages: LanguageDate['issuers']['issuer']['form']['validation'],
  createError: (path: string, message: string) => yup.ValidationError
): true | yup.ValidationError {
  const errors: yup.ValidationError[] = [];

  if (rows.length === 0) {
    errors.push(createError('nfe_series.root', messages.seriesRequired));
  } else if (rows.filter((row) => row.is_default).length !== 1) {
    errors.push(createError('nfe_series.root', messages.seriesDefaultRequired));
  }

  const seen = new Map<number, number>();
  rows.forEach((row, index) => {
    const serie = row.serie;
    if (serie === null || serie === undefined) {
      errors.push(createError(`nfe_series.${index}.serie`, messages.serieRequired));
    } else if (!Number.isInteger(serie) || serie < 0 || serie > 999) {
      errors.push(createError(`nfe_series.${index}.serie`, messages.serieRange));
    } else if (seen.has(serie)) {
      errors.push(createError(`nfe_series.${index}.serie`, messages.serieDuplicated));
    } else {
      seen.set(serie, index);
    }

    const ultimo = row.ultimo_numero;
    if (ultimo === null || ultimo === undefined) {
      errors.push(createError(`nfe_series.${index}.ultimo_numero`, messages.ultimoNumeroRequired));
    } else if (row.in_use && ultimo < (row.min_ultimo_numero ?? 0)) {
      errors.push(
        createError(
          `nfe_series.${index}.ultimo_numero`,
          messages.ultimoNumeroBelowUsed.replace('{min}', String(row.min_ultimo_numero ?? 0))
        )
      );
    }
  });

  return errors.length ? new yup.ValidationError(errors) : true;
}

export const emissorSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.issuers.issuer.form.validation;

  return yup.object({
    razao_social: yup.string().trim().required(messages.razaoSocialRequired).max(80),
    nome_fantasia: yup.string().trim().required(messages.nomeFantasiaRequired).max(80),
    cpf_cnpj: yup
      .string()
      .trim()
      .required(messages.cpfCnpjRequired)
      .test('cpf-cnpj-digito-verificador', messages.cpfCnpjInvalid, (value) =>
        value ? isValidCpfCnpj(value) : false
      ),
    rua: yup.string().trim().required(messages.ruaRequired).max(50),
    // Texto livre até 10 caracteres (D-101-11, decisão do dono): aceita "123",
    // "123A", "S/N", "KM 12". Mesma regra do legado (IssueController.php:244
    // 'required|max:10') e da API (IssuerRequest.php:60). Supera a regra
    // "só dígitos" do EST-07 defeito 4.
    numero: yup.string().trim().required(messages.numeroRequired).max(10),
    bairro: yup.string().trim().required(messages.bairroRequired).max(40),
    telefone: yup.string().trim().required(messages.telefoneRequired).max(15),
    cep: yup.string().trim().required(messages.cepRequired).max(9, messages.cepMax),
    // `cidade_uuid` guarda o `Option<string>` inteiro (label+value) — mesmo
    // padrão de `parent_uuid` em PlanAccount (SelectAsyncPaginate controlado).
    cidade_uuid: yup
      .mixed()
      .nullable()
      .test(
        'cidade-uuid-required',
        messages.cidadeRequired,
        (value) => !!value && typeof (value as any).value === 'string' && !!(value as any).value
      ),
    issues_nfe: yup.boolean().required(),

    // Condicionais por issues_nfe=true (required_if do backend).
    regime: yup.string().when('issues_nfe', {
      is: true,
      then: (schema) => schema.required(messages.regimeRequired),
      otherwise: (schema) => schema.notRequired(),
    }),
    ambiente: yup.string().when('issues_nfe', {
      is: true,
      then: (schema) => schema.required(messages.ambienteRequired),
      otherwise: (schema) => schema.notRequired(),
    }),
    // Sem regra própria no legado (fiel — nullable em qualquer verbo).
    ultimo_numero_cte: yup.number().nullable(),
    numero_serie_cte: yup.number().nullable(),
    ultimo_numero_mdfe: yup.number().nullable(),
    numero_serie_mdfe: yup.number().nullable(),

    // D-101-05: CNAE texto livre (até 20), opcional; Perfil SPED A/B/C opcional.
    cnae: yup.string().trim().nullable().max(20, messages.cnaeMax),
    sped_profile: yup.string().nullable().oneOf(['', 'A', 'B', 'C'], messages.spedInvalid),

    // Séries de NF-e — itens frouxos aqui; as regras estritas só valem com
    // issues_nfe=true (campo oculto não pode bloquear o submit).
    nfe_series: yup
      .array()
      .default([])
      .when('issues_nfe', {
        is: true,
        then: (schema) =>
          schema.test('nfe-series-rules', (value, ctx) =>
            validateNfeSeries((value ?? []) as NfeSeriesRow[], messages, (path, message) =>
              ctx.createError({ path, message })
            )
          ),
        otherwise: (schema) => schema,
      }),

    email: yup.string().trim().required(messages.emailRequired).email(messages.emailInvalid),
    is_enabled: yup.boolean().required(),

    // IE única do emissor (UT-000766): lista `numbers` com >= 1 inscrição não vazia
    // (o antigo campo `ie` duplicado foi removido; a API deriva `ie` da 1ª).
    numbers: yup
      .array()
      .of(yup.string().trim().max(20, messages.numbersMax))
      .default([])
      .test('numbers-min-one', messages.numbersRequired, (value?: (string | undefined)[]) =>
        (value ?? []).some((item) => !!item && item.trim() !== '')
      ),
    farm_uuids: yup.array().of(yup.string().required()).default([]),

    aut_xml: yup.string().trim().nullable().max(18),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const emissorSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(emissorSchema(languageGB)) as any;

export default emissorSchemaResolver;
