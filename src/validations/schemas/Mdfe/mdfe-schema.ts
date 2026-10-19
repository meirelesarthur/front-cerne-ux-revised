// src/validations/schemas/Mdfe/mdfe-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de MDFe (domínio Fiscal-Transporte) —
// TASK-MDFE-FE-01. Resolver ÚNICO cobrindo as 3 abas (Geral/Transporte/
// Descarga) — 1 `useForm` raiz (`CreateOrUpdateMdfe.tsx`, TASK-MDFE-FE-03)
// consome este schema, mirror `nfe-schema.ts` (formulário com abas
// compartilha 1 resolver só).
//
// `veiculo_reboque_id` (reboque 1) é `nullable()` aqui de propósito — a
// obrigatoriedade condicional (`wheel_type === '03'`) depende de um lookup
// pontual (`GET /equipments/{uuid}`) resolvido em estado de componente, não
// em campo do form (`CONTRATO-FRONT-MDFE.md §5.3`); a validação condicional
// real acontece no componente via `isRequired` dinâmico do `Select`
// (`TASK-MDFE-FE-04`), o schema só garante o formato aqui.
//
// `municipios_carregamento`/`info_descarga` — `min:1` (fecha o gate de
// Salvar client-side, `CV006`, espelhado no servidor por
// `MdfeRequest::rules()`). `percursos`/`vale_pedagios`/`payments` —
// `array()` sem mínimo (GAP-MDFE-09 do backend confirmou que o legado nunca
// exigiu essas 3 coleções). `ciots`: obrigatório só com `tp_emit` 1/3 e código de
// 12 dígitos (UT-000776 T-776-FE-03; `mdfeRequiresCiot`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

/** Código do CIOT: exatamente 12 dígitos (espelha `MdfeCiotRule::CIOT_CODE_PATTERN` da API). */
export const MDFE_CIOT_CODE_PATTERN = /^\d{12}$/;

/**
 * CIOT obrigatório só com `tp_emit` 1 ou 3 (espelha `required_if:tp_emit,1,3` do `MdfeRequest` /
 * `MdfeCiotRule::requiresCiot`). `tp_emit`=2 (carga própria) nunca exige — `tp_transp` NÃO entra
 * na regra (UT-000776, D-100-29, R-FE-07).
 *
 * @param {unknown} tpEmit - `Option {value}` do select ou o valor cru de `tp_emit`.
 * @return {boolean} `true` quando o CIOT é obrigatório.
 */
export function mdfeRequiresCiot(tpEmit: unknown): boolean {
  const raw =
    tpEmit && typeof tpEmit === 'object' && 'value' in (tpEmit as Record<string, unknown>)
      ? (tpEmit as { value: unknown }).value
      : tpEmit;
  return String(raw) === '1' || String(raw) === '3';
}

export const mdfeSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    // ---- Aba 0 — Geral ----
    uf_inicio: v.option<string>(),
    uf_fim: v.option<string>(),
    data_inicio_viagem: yup.string().trim().nullable().required(messages.requiredField),
    carga_posterior: yup.mixed().nullable(),
    type_emission: v.option<number>(),
    cnpj_contratante: yup.string().trim().nullable().required(messages.requiredField),
    quantidade_carga: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.requiredField)
      .required(messages.requiredField),
    valor_carga: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.requiredField)
      .required(messages.requiredField),
    produto_pred_nome: yup.string().trim().nullable(),
    produto_pred_ncm: yup.string().trim().nullable(),
    produto_pred_cod_barras: yup.string().trim().nullable(),
    cep_carrega: yup.string().trim().nullable(),
    cep_descarrega: yup.string().trim().nullable(),
    latitude_carregamento: yup.string().trim().nullable(),
    longitude_carregamento: yup.string().trim().nullable(),
    latitude_descarregamento: yup.string().trim().nullable(),
    longitude_descarregamento: yup.string().trim().nullable(),
    tp_carga: yup.mixed().nullable(),
    seguradora_nome: yup.string().trim().nullable(),
    seguradora_cnpj: yup.string().trim().nullable(),
    numero_apolice: yup.string().trim().nullable(),
    numero_averbacao: yup.string().trim().nullable(),
    info_complementar: yup.string().trim().nullable(),
    info_adicional_fisco: yup.string().trim().nullable(),
    municipios_carregamento: yup
      .array()
      .of(
        yup.object({
          cidade_id: v.option<string>(),
        })
      )
      .min(1, messages.requiredField),
    percursos: yup.array().of(
      yup.object({
        uf: v.option<string>(),
      })
    ),

    // ---- Aba 1 — Transporte ----
    veiculo_tracao_id: v.option<string>(),
    // Condicional real no componente (isRequired dinâmico) — ver docblock.
    veiculo_reboque_id: yup.mixed().nullable(),
    veiculo_reboque2_id: yup.mixed().nullable(),
    veiculo_reboque3_id: yup.mixed().nullable(),
    tp_emit: yup.mixed().nullable(),
    tp_transp: yup.mixed().nullable(),
    lac_rodo: yup.string().trim().nullable(),
    ciots: yup
      .array()
      .of(
        yup.object({
          codigo: yup
            .string()
            .trim()
            .nullable()
            .matches(MDFE_CIOT_CODE_PATTERN, languageGB.mdfes.mdfe.ciot.codeLengthError),
          cpf_cnpj: yup.string().trim().nullable(),
        })
      )
      .test(
        'ciot-required-by-tp-emit',
        languageGB.mdfes.mdfe.ciot.requiredForTpEmit,
        (value, context) => {
          if (!mdfeRequiresCiot(context.parent?.tp_emit)) return true;
          return Array.isArray(value) && value.length > 0;
        }
      ),
    vale_pedagios: yup.array().of(
      yup.object({
        cnpj_fornecedor: yup.string().trim().nullable(),
        cnpj_fornecedor_pagador: yup.string().trim().nullable(),
        numero_compra: yup.string().trim().nullable(),
        valor: yup.number().nullable(),
      })
    ),
    payments: yup.array().of(
      yup.object({
        responsible_name: yup.string().trim().nullable(),
        responsible_cpf_cnpj: yup.string().trim().nullable(),
        payment_type: yup.mixed().nullable(),
        component_type: yup.mixed().nullable(),
        amount: yup.number().nullable(),
        bank_code: yup.mixed().nullable(),
        agency_code: yup.string().trim().nullable(),
        cnpj_ipef: yup.string().trim().nullable(),
        pix_key: yup.string().trim().nullable(),
        additional_info: yup.string().trim().nullable(),
      })
    ),

    // ---- Aba 2 — Descarga ----
    condutor_nome: yup.string().trim().nullable().required(messages.requiredField),
    condutor_cpf: yup.string().trim().nullable().required(messages.requiredField),
    info_descarga: yup
      .array()
      .of(
        yup.object({
          tp_unid_transp: yup.mixed().nullable(),
          // UT-000787 — placa só p/ Rodoviário Tração/Reboque (1/2) e só se
          // preenchida; demais tipos são livres (D3), max 20.
          id_unid_transp: yup
            .string()
            .trim()
            .nullable()
            .max(20)
            .test(
              'plate-format',
              languageGB.defaltStrings.validations.plateInvalid,
              (value, ctx) => {
                const tp = (ctx.parent?.tp_unid_transp as { value?: number } | null)?.value;
                return !value || (tp !== 1 && tp !== 2) || isValidPlate(value);
              }
            ),
          quantidade_rateio: yup.number().nullable(),
          cidade_id: v.option<string>(),
          chave_nfe: yup.string().trim().nullable(),
          seg_cod_nfe: yup.string().trim().nullable(),
          chave_cte: yup.string().trim().nullable(),
          seg_cod_cte: yup.string().trim().nullable(),
        })
      )
      .min(1, messages.requiredField),
  });
};

export const mdfeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(mdfeSchema(languageGB) as any);

export default mdfeSchemaResolver;
