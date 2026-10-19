// src/validations/schemas/CadastrosBase/product-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Produto (bloco ESTÁVEL — sem os
// ~40 campos fiscais, isolados em TASK-FE-507). Localização: o task-packet
// original pedia `src/validations/schemas/Products/` (pasta por módulo),
// mas o Maestro (execução 025, conferência TASK-FE-500) padronizou em
// `src/validations/schemas/CadastrosBase/` — convenção real confirmada em
// disco: é onde vivem `provider-schema.ts`/`package-schema.ts`/
// `category-animal-schema.ts`/`account-schema.ts`, todas as demais features
// desta MESMA execução. Pasta por módulo criaria uma segunda convenção
// dentro da mesma execução — mantido fora de `pages/` (divergência
// deliberada do precedente `Kind`, cujo schema fica em `pages/`).
//
// Compõe `fieldValidationSchema(languageGB)` para os campos genéricos
// (`v.string()`/`v.option()`/`v.number()`/`v.boolean()`) e sobrescreve só o
// específico da entidade — mensagens em
// `languageGB.products.product.form.validation.*`.
//
// Condicionais confirmadas pelo contrato backend (D8, `group_id==8` =
// "Produção", Product-contrato.md §6): quando o Grupo selecionado tem
// `description === "Produção"`, `cultivation_uuid`/`ncm_uuid` tornam-se
// OBRIGATÓRIOS e `quality` passa a ser ACEITO (fora desse grupo o backend
// REJEITA `quality` com 422 — não é só "opcional", é proibido). A comparação
// é feita por `option.label` (o Select de Grupo guarda `{ label, value }`,
// e `label` é a própria `description` do grupo) — mesma técnica já usada em
// `provider-schema.ts` (`type.value === providerType.comissionado`).
//
// Trio `required_with` cruzado (`second_measurement_uuid`/`factor_type`/
// `factor`, Product-contrato.md §5): se qualquer um for preenchido, os 3
// tornam-se obrigatórios — mesmo padrão de `confirmPassword` em
// `field-validation-schema.ts`/`residual` em `family-equipment-schema.ts`.
//
// ⚠️ `kind_uuid` é `nullable` no contrato de API (§5), mas o contrato de
// TELA (Product-Frontend-Contrato.md §3.3) exige o Select "habilitado só com
// categoria selecionada" e o DoD desta Tarefa pede explicitamente que o
// schema REJEITE `kind_uuid` ausente — decisão de UX mais estrita que o
// backend (permitido: o front pode exigir mais, nunca menos, sem quebrar a
// API). Documentado aqui para não ser confundido com erro de reconciliação.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

/** `group_products.description` do grupo cuja seleção liga as regras
 *  condicionais de D8 (Product-contrato.md §6, `group_id==8`). Comparado
 *  contra o `label` do Option de Grupo — nunca contra um id/uuid hardcoded
 *  (o id físico `8` é um detalhe de seed, não deve vazar para o front).
 *  Exportado (TASK-FE-503) para o componente reusar a MESMA constante/função
 *  no hint visual do campo `ncm_uuid` (isRequired condicional) — única fonte
 *  de verdade, nunca duplicar a string "Produção" em outro arquivo. */
export const PRODUCTION_GROUP_LABEL = 'Produção';

export const isProductionGroup = (group: { label?: string } | null | undefined) =>
  group?.label === PRODUCTION_GROUP_LABEL;

// -- Trio required_with cruzado — ERRO-FE-015 --------------------------------
// `second_measurement_uuid`/`factor_type`/`factor` se referenciam via `.when()`
// nos TRÊS sentidos (cada um lê os outros dois) para materializar a regra
// simétrica do contrato (§5): "qualquer um preenchido torna os 3
// obrigatórios". Isso forma um grafo de dependência CÍCLICO entre os 3 nós —
// o Yup faz ordenação TOPOLÓGICA dos campos antes de validar (para resolver
// `.when()` em cadeia) e lança `Cyclic dependency, node was:"factor"` já na
// CONSTRUÇÃO do schema (não é uma falha de execução tardia, é síncrona).
//
// Correção: 2º argumento de `.shape()` (`excludedEdges`, doc oficial do Yup
// para exatamente este caso — grafo cíclico "todo mundo depende de todo
// mundo") remove APENAS a ordenação entre esses 3 nós, sem tocar os
// `.when()` em si. Comprovado (não presumido, ver script de prova no
// task-packet ERRO-FE-015) que isso NÃO muda o resultado da validação:
// o Yup resolve `.when()` na fase de VALIDATE usando o objeto já
// completamente casted como `parent` (`object.js#_validate`, `parent: value`)
// — não o objeto parcial da ordem de `_nodes` usado só na fase de CAST. Como
// nenhuma das 3 branches muda o TIPO castado (só adiciona `.required()`),
// a ordem de processamento é irrelevante para o resultado.
//
// Só precisa excluir 1 sentido por par (3 arestas) para quebrar o ciclo —
// as 3 arestas reversas remanescentes formam um grafo acíclico
// (factor → factor_type → second_measurement_uuid).
const PRODUCT_MEASUREMENT_FACTOR_TRIO_EXCLUDED_EDGES: [string, string][] = [
  ['second_measurement_uuid', 'factor_type'],
  ['second_measurement_uuid', 'factor'],
  ['factor_type', 'factor'],
];

export const productSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.products.product.form.validation;

  return yup.object().shape(
    {
      // -- Identificação/Classificação (Aba 1) --
      description: yup
        .string()
        .trim()
        .required(messages.descriptionRequired)
        // max:181 confirmado pelo contrato backend (§5, `varchar(181)`) — teto
        // real da coluna, não os 100 de UX que o contrato de tela cogitava
        // "a menos que o contrato formal diga o contrário" (e ele diz).
        .max(181, messages.descriptionMaxLength),
      measurement_uuid: v.option<string>(),
      group_uuid: v.option<string>(),
      category_uuid: v.option<string>(),
      // Obrigatório por decisão de UX desta tela (ver nota de topo do arquivo)
      // — backend aceita `null`, o front não oferece essa opção nesta versão.
      kind_uuid: v.option<string>(),
      is_enabled: v.boolean(),
      is_equipment: v.boolean(),
      has_lot: v.boolean(),
      control_stock: v.boolean(),

      // -- Estoque/Financeiro (Aba 2) --
      min_stock: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      las_price: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? undefined : value))
        .typeError(messages.lasPriceRequired)
        .required(messages.lasPriceRequired)
        .min(0, messages.lasPriceMin),
      active_principle: yup.string().trim().nullable().max(50, messages.activePrincipleMaxLength),
      financial_category_uuid: yup.mixed().nullable(),
      default_cost_center_uuid: yup.mixed().nullable(),
      default_warehouse_uuid: yup.mixed().nullable(),
      addressing_uuid: yup.mixed().nullable(),
      tax_rule_uuid: yup.mixed().nullable(),

      // -- Trio required_with cruzado (2ª Unidade de Medida / Fator) --
      second_measurement_uuid: yup
        .mixed()
        .nullable()
        .when(['factor_type', 'factor'], {
          is: (factorType: unknown, factor: unknown) => !!factorType || !!factor,
          then: (schema) => schema.required(messages.secondMeasurementRequiredWithFactor),
        }),
      factor_type: yup
        .string()
        // `null` incluído no domínio aceito (achado adjacente ao ERRO-FE-015,
        // ver relatório do erro) — `.nullable()` sozinho NÃO basta para o Yup
        // 0.32: `oneOf()` só isenta `undefined` por padrão, então `null`
        // (o valor real do `defaultValues`/mapeamento em
        // `CreateOrUpdateProduto.tsx`, produto sem 2ª unidade/fator) era
        // rejeitado por este teste mesmo fora de qualquer `.when()` — o caso
        // mais comum (os 3 campos vazios) nunca validava.
        .oneOf(['M', 'D', null])
        .nullable()
        .when(['second_measurement_uuid', 'factor'], {
          is: (secondMeasurement: unknown, factor: unknown) => !!secondMeasurement || !!factor,
          then: (schema) => schema.required(messages.factorTypeRequiredWithFactor),
        }),
      factor: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable()
        .when(['second_measurement_uuid', 'factor_type'], {
          is: (secondMeasurement: unknown, factorType: unknown) =>
            !!secondMeasurement || !!factorType,
          then: (schema) => schema.required(messages.factorRequiredWithSecondMeasurement),
        }),

      // -- Condicionais de D8 (grupo "Produção") --
      // `ncm_uuid` — `SelectAsyncPaginate` sobre o endpoint `ncms/options`;
      // o valor que chega do RHF é um `Option<string>` (`{label, value}`,
      // `value` = uuid do NCM). `GAP-BE-660` (✅ CONCLUÍDO): o backend passou
      // a aceitar `ncm_uuid` (string uuid) em vez do id numérico interno —
      // schema `yup.mixed()` inalterado (mesmo tratamento de
      // `cultivation_uuid`/`financial_category_uuid` abaixo), só o valor
      // enviado ao payload mudou (sem conversão `Number(...)` no componente).
      ncm_uuid: yup
        .mixed()
        .nullable()
        .when('group_uuid', {
          is: isProductionGroup,
          then: (schema) => schema.required(messages.ncmRequiredForProductionGroup),
        }),
      cultivation_uuid: yup
        .mixed()
        .nullable()
        .when('group_uuid', {
          is: isProductionGroup,
          then: (schema) => schema.required(messages.cultivationRequiredForProductionGroup),
        }),
      quality: yup
        .string()
        .trim()
        .nullable()
        .max(191, messages.qualityMaxLength)
        .when('group_uuid', {
          is: (group: { label?: string } | null | undefined) => !isProductionGroup(group),
          // Backend REJEITA `quality` fora do grupo "Produção" (D8) — não é só
          // opcional, é proibido. `.test` bloqueia no client antes do 422.
          then: (schema) =>
            schema.test(
              'quality-only-production-group',
              messages.qualityOnlyForProductionGroup,
              (value) => !value
            ),
        }),

      // -- Pivot Embalagens (`TASK-BE-506`/`GAP-BE-230`, TASK-FE-504) --
      // Sem `.min(1)`/condicional aqui — o backend já trata "grupo manda, não
      // a lista" (detach total quando o grupo deixa de ser "Produção", mesmo
      // com uuids válidos no payload); a UI só desabilita o campo fora do
      // grupo (`ProdutoEstoqueFinanceiroTab.tsx`), não bloqueia o submit.
      product_package_uuids: yup.array().of(yup.string().required()).default([]),

      // -- Aba 3 "Fiscal" (~40 campos, TASK-FE-507) --
      // ⚠️ REGRA MAIS IMPORTANTE desta Tarefa (task-packet, execução 025):
      // validação SÓ tipo/tamanho, espelhando `ProductRequest::rules()` REAL
      // (`GAP-BE-232`, escopo reduzido) — ZERO regra de negócio nova. PROIBIDO
      // `.oneOf()` de CST/CSOSN/CFOP/CEST "válidos" e PROIBIDO obrigatoriedade
      // condicional a `is_fiscal` (a tabela `products` tem 543.983 linhas de
      // dado histórico que passaram por um backend sem validação nenhuma —
      // endurecer aqui rejeitaria dado legítimo ao EDITAR um produto
      // existente). Todos os Selects/Enums aceitam e exibem valor FORA do
      // domínio do catálogo (`withToleratedOption()`, `ProdutoFiscalTab.tsx`) —
      // o schema Yup abaixo NUNCA valida contra a lista de opções, só o
      // tamanho da coluna física (mesmos limites de `ProductRequest::rules()`,
      // contrato §5/§2).
      cst_csosn: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      cst_pis: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      cst_cofins: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      cst_ipi: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      cst_csosn_exp: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      cfop_saida_interno: yup.string().trim().nullable().max(4, messages.fiscalStringMaxLength),
      cfop_saida_externo: yup.string().trim().nullable().max(4, messages.fiscalStringMaxLength),
      cest: yup.string().trim().nullable().max(10, messages.fiscalStringMaxLength),
      reference: yup.string().trim().nullable().max(30, messages.fiscalStringMaxLength),
      barcode: yup.string().trim().nullable().max(13, messages.fiscalStringMaxLength),
      cenq_ipi: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      cbenef: yup.string().trim().nullable().max(191, messages.fiscalStringMaxLength),
      perc_icms: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_pis: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_cofins: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_ipi: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      origem: yup.mixed().nullable(),
      is_fiscal: v.boolean(),
      allow_pointing: v.boolean(),
      // `modality_bc`/`percent_reduction` — colunas `NOT NULL` no schema físico
      // (default `0`/`0.00`) — o form nunca guarda `null` (default do useForm já
      // parte de `0`), então basta tipar como número (sem `.nullable()`).
      modality_bc: yup.number().default(0),
      percent_reduction: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? 0 : value))
        .default(0),
      // -- C1 (D-101-19): nullable, faixa 0-100; dominio de mot_des_icms por CST validado pela API --
      mot_des_icms: yup.number().nullable().notRequired(),
      perc_dif: yup
        .number()
        .typeError(messages.percentageRange100)
        .min(0, messages.percentageRange100)
        .max(100, messages.percentageRange100)
        .nullable()
        .notRequired(),
      perc_fcp: yup
        .number()
        .typeError(messages.percentageRange100)
        .min(0, messages.percentageRange100)
        .max(100, messages.percentageRange100)
        .nullable()
        .notRequired(),
      // -- Reforma Tributária (IBS/CBS/IS) --
      c_class_trib: yup.string().trim().nullable().max(6, messages.fiscalStringMaxLength),
      cst_ibs_cbs: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      perc_ibs_uf: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_ibs_mun: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_reducao_aliq_ibs_uf: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_reducao_aliq_ibs_mun: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_dif_ibs_uf: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_dif_ibs_mun: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_cbs: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_reducao_aliq_cbs: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_dif_cbs: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      cst_is: yup.string().trim().nullable().max(3, messages.fiscalStringMaxLength),
      perc_is: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      perc_is_espec: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      u_trib_is: yup.string().trim().nullable().max(6, messages.fiscalStringMaxLength),
      ad_rem_ibs: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      ad_rem_cbs: yup
        .number()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .nullable(),
      tp_cred_pres_ibs_zfm: yup.mixed().nullable(),
      ind_doacao: v.boolean(),
    },
    PRODUCT_MEASUREMENT_FACTOR_TRIO_EXCLUDED_EDGES
  );
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const productSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(productSchema(languageGB));

export default productSchemaResolver;
