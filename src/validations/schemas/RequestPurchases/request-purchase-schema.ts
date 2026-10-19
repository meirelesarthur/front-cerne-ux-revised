// src/validations/schemas/RequestPurchases/request-purchase-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário único de Solicitação de Compras
// (RequestPurchase — Administrativo / Suprimentos, esteira 97-Esteiras/022,
// TASK-RP-FE-05). Fábrica `(languageGB) => yupResolver(...)`, mirror mecânico
// de `diagnosisPregnancySchemaResolver`
// (`src/validations/schemas/BaseRegistrations/diagnosisPregnancy-schema.ts`) —
// mesma "empresa": função que recebe `languageGB` e devolve o schema.
//
// Localização: `src/validations/schemas/RequestPurchases/`, NUNCA em
// `pages/` (regra inviolável da Tarefa).
//
// Compõe `fieldValidationSchema(languageGB)` para os campos genéricos do
// cabeçalho e reserva `.when()`/`.test()` só para a lógica condicional real
// (`get_pwa_validation_and_utils_pattern` §1.7) — mensagens 100% via
// `languageGB.requestPurchases.requestPurchase.form.validation.*`
// (`TASK-RP-FE-03`), zero string literal.
//
// Fonte normativa: RequestPurchase-contrato.md §4 (Form Request unificado
// store+update) + a matriz de campo obrigatório por tipo da própria Tarefa
// (DA-RP-05/DA-RP-18).
//
// -- Mecanismo escolhido para a validação condicional por `type` DENTRO de um
//    array (Riscos + solução da Tarefa) --------------------------------------
// `items[]`/`attachments[]` são arrays cujo campo condicionante (`type`) mora
// no FORM PAI, não em cada linha — um `.when('type', ...)` comum dentro do
// `.shape()` de cada linha NÃO enxerga `type` (ele é sibling do ARRAY, não da
// linha). Dos dois mecanismos sugeridos pela Tarefa, foi escolhido
// `.test()` no nível do array pai lendo `this.parent.type` (em vez de
// contexto injetado via `resolver(languageGB, { context: { type } })`),
// porque:
//   1. Não exige que o formulário (`TASK-RP-FE-09`, ainda não construído)
//      passe `context` a cada render do `useForm` — o resolver continua
//      sendo chamado exatamente como todos os outros do fork
//      (`resolver(languageGB)`, mirror `equipmentSchemaResolver`).
//   2. Já existe precedente estrutural no fork para `.test()` de array
//      (`cost-center-sum-100` em `equipment-schema.ts`), zero padrão novo de
//      acoplamento schema↔componente.
//   3. Cada teste agrega os erros de TODAS as linhas do array num único
//      `throw new yup.ValidationError(innerErrors)` — técnica documentada do
//      Yup para anexar múltiplos erros de campo (cada um com seu próprio
//      `path`, ex. `items[2].amount`) a partir de um `.test()` só. Confirmado
//      compatível com a versão do fork (`yup@0.32.11`): o construtor de
//      `ValidationError` concatena `errors`/`inner` de cada item do array
//      recebido.
//
// `attachments[].name` `required_with` `file` já é `.when()` comum (mesmo
// objeto de linha, sibling real) — não precisa do mecanismo acima.
//
// -- Execução 081 / T-081-FE-05 (paridade com o legado) -----------------------
// - Produto OPCIONAL em P/M/U (e F/E): saiu da matriz de obrigatórios; a
//   descrição (máx. 60 em P/M/U) segue obrigatória (legado: `descriptions[]`
//   maxlength 60, produto com classe `ignore`).
// - Serviço (S): quantidade inteira, descrição obrigatória, observação máx. 90.
// - Diária (D): descrição do serviço máx. 200.
// - C e B: "Descrição de serviços" obrigatória (PR-I11 MANTER, A-16).
// - Anexos: F/E/U exigem ao menos 1 linha, com descrição e arquivo (PR-N01).
// - Observação do cabeçalho: máx. 800 (PR-C10).
// - Encarregado: obrigatório quando a API informa `meta.requires_authorizer`
//   (opção `requiresAuthorizer`, DEP-API-04 / A-16).
//
// -- Divergência encontrada (transparência, não fabricação) ------------------
// A matriz de campo obrigatório por tipo da própria Tarefa lista, para o tipo
// `B` (Despesa Fixa), somente `amount`. O texto normativo do Form Request
// (RequestPurchase-contrato.md §4, linha `items.*.service_description →
// required_if:type,D,C,B`) inclui `B` na lista de tipos que também exigem
// `service_description` (junto de `D`/`C`). Como a própria Tarefa determina
// "Client-side coerente com o server" como regra inviolável, este schema
// segue o texto normativo verificado (service_description também obrigatório
// para `B`) em vez da tabela-resumo da Tarefa — decisão tomada de forma
// EXPLÍCITA e documentada aqui (não escolhida silenciosamente). Reportar ao
// Arquiteto para confirmar/corrigir a tabela da Tarefa.
//
// -- Lacunas de i18n herdadas (TASK-RP-FE-03), resolvidas em TASK-RP-FE-07 ---
// O pacote de mensagens entregue originalmente não trouxe chave dedicada para
// `nif`/`phone`/`fileMaxLength`, mas foram adicionadas em feedback desta Tarefa.
//   - `nif`/`phone` de item (max:20/max:15 no contrato) agora têm chaves
//     `nifMaxLength`/`phoneMaxLength` nos 3 idiomas.
//   - Tamanho de `attachments.*.file` (max:10240 KB no contrato) agora tem
//     chave `fileMaxLength` nos 3 idiomas.
//   - `observation` (cabeçalho, `max:800` no contrato) permanece sem `max()`
//     client-side (não tem chave dedicada e é field de menor risco).
// Números de 191 → 800 em `justificationMaxLength`/`descriptionMaxLength`
// foram corrigidos nos textos das 3 mensagens.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

// ============================================
// Matriz de campo obrigatório por `type` (DA-RP-05/DA-RP-18 + divergência
// documentada acima — `B` inclui `service_description`).
// ============================================

export type RequestItemFieldKey =
  | 'product_uuid'
  | 'quantity'
  | 'amount'
  | 'name'
  | 'nif'
  | 'phone'
  | 'description'
  | 'service_description'
  | 'daily_quantity';

// ⚠️ Gap corrigido nesta Tarefa (Doc Bruta `RequestPurchase-Doc-Bruta.md`
// §12): `description` existia no shape de LEITURA (`RequestItemRow`) e o
// backend já aceita/persiste/expõe, mas nunca fora adicionado ao caminho de
// ESCRITA — 8 dos 11 tipos ganham `description` obrigatório aqui (P/M/U/S/
// A/R/F/E). Diária/Empreitada/Despesa Fixa (D/C/B) NÃO mudam (já em
// paridade, fora do escopo desta correção).
export const REQUIRED_ITEM_FIELDS_BY_TYPE: Record<string, RequestItemFieldKey[]> = {
  // Produto OPCIONAL em P/M/U/F/E (legado: select de produto com classe `ignore`).
  [requestPurchaseType.produto]: ['quantity', 'description'], // P
  [requestPurchaseType.manutencao]: ['quantity', 'description'], // M
  [requestPurchaseType.emergencial]: ['quantity', 'description'], // U
  [requestPurchaseType.servico]: ['quantity', 'description'], // S
  [requestPurchaseType.adiantamento]: ['amount', 'description'], // A
  [requestPurchaseType.reembolso]: ['amount', 'description'], // R
  [requestPurchaseType.empreitada]: ['amount', 'service_description'], // C
  // ⚠️ `service_description` aqui é a divergência documentada no cabeçalho
  // do arquivo — a tabela da Tarefa lista só `amount` para `B`, o texto
  // normativo do contrato (§4) inclui `service_description` junto de D/C.
  [requestPurchaseType.despesaFixa]: ['amount', 'service_description'], // B
  [requestPurchaseType.compraEfetuada]: ['amount', 'description'], // F — DA-RP-18 (novo)
  [requestPurchaseType.frete]: ['amount', 'description'], // E — DA-RP-18 (novo)
  [requestPurchaseType.diaria]: ['name', 'nif', 'phone', 'service_description', 'daily_quantity'], // D
};

/** 3 dos 11 tipos exigem `attachments[].file` (na criação, sem
 *  `attachment_uuid` já existente) — contrato §4, regra do legado. */
export const ATTACHMENT_FILE_REQUIRED_TYPES = new Set<string>([
  requestPurchaseType.compraEfetuada, // F
  requestPurchaseType.frete, // E
  requestPurchaseType.emergencial, // U
]);

/** Shape mínimo de linha de item usado só pela matriz condicional acima —
 *  não é o tipo de payload completo (`RequestItemFormRow`,
 *  `@/@types/v2/RequestPurchases`), só o suficiente para o teste de
 *  obrigatoriedade. `product_uuid` pode chegar como `Option<string>` (RHF,
 *  Select) — tratado defensivamente abaixo. */
export type RequestItemRowShape = {
  product_uuid?: Option<string> | string | null;
  quantity?: number | string | null;
  amount?: number | string | null;
  name?: string | null;
  nif?: string | null;
  phone?: string | null;
  description?: string | null;
  service_description?: string | null;
  daily_quantity?: number | string | null;
  observation?: string | null;
};

type RequestAttachmentRowShape = {
  attachment_uuid?: string | null;
  name?: string | null;
  file?: File | null;
};

/** Tipos em que a descrição do item tem máximo de 60 (legado `maxlength=60`). */
const ITEM_DESCRIPTION_MAX_60_TYPES = new Set<string>([
  requestPurchaseType.produto,
  requestPurchaseType.manutencao,
  requestPurchaseType.emergencial,
]);
export const ITEM_DESCRIPTION_MAX = 60;
export const ITEM_SERVICE_DESCRIPTION_MAX = 200;
export const ITEM_OBSERVATION_MAX = 90;
export const ATTACHMENT_NAME_MAX = 120;

/**
 * `true` quando o campo está vazio para fins de obrigatoriedade condicional
 * (mesmo racional para `Option`/número/texto — reaproveitado pelos 3
 * formatos de campo da matriz, `product_uuid` inclusive).
 * @param {RequestItemFieldKey} field - Campo da matriz a checar (DA-RP-05/DA-RP-18).
 * @param {RequestItemRowShape} row - Linha de `items[]` sendo validada.
 * @return {boolean} `true` se o campo está vazio (deve reprovar quando obrigatório).
 */
export const isItemFieldEmpty = (field: RequestItemFieldKey, row: RequestItemRowShape): boolean => {
  const value = row?.[field];

  if (field === 'product_uuid') {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value === 'object') return !value.value;
    return false;
  }

  if (field === 'quantity' || field === 'amount' || field === 'daily_quantity') {
    if (value === null || value === undefined || value === '') return true;
    return Number.isNaN(Number(value));
  }

  // name / nif / phone / description / service_description — texto.
  return value === null || value === undefined || String(value).trim() === '';
};

const FIELD_MESSAGE_KEY: Record<
  RequestItemFieldKey,
  | 'productRequiredForType'
  | 'quantityRequiredForType'
  | 'amountRequiredForType'
  | 'nameRequiredForType'
  | 'nifRequiredForType'
  | 'phoneRequiredForType'
  | 'descriptionRequiredForType'
  | 'serviceDescriptionRequiredForType'
  | 'dailyQuantityRequiredForType'
> = {
  product_uuid: 'productRequiredForType',
  quantity: 'quantityRequiredForType',
  amount: 'amountRequiredForType',
  name: 'nameRequiredForType',
  nif: 'nifRequiredForType',
  phone: 'phoneRequiredForType',
  description: 'descriptionRequiredForType',
  service_description: 'serviceDescriptionRequiredForType',
  daily_quantity: 'dailyQuantityRequiredForType',
};

export interface RequestPurchaseSchemaOptions {
  /** `meta.requires_authorizer` de `authorizer-options`: o solicitante tem
   *  chefes e o Encarregado é obrigatório. */
  requiresAuthorizer?: boolean;
}

export const requestPurchaseSchema = (
  languageGB: LanguageDate,
  options: RequestPurchaseSchemaOptions = {}
) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.requestPurchases.requestPurchase.form.validation;

  // -- Linha de item (`items[]`) — tipagem/transform genéricos por campo；
  //    a OBRIGATORIEDADE condicional por `type` fica no `.test()` do array
  //    logo abaixo (mecanismo documentado no cabeçalho do arquivo). --------
  const itemRowSchema = yup.object({
    // Controle (DA-RP-07) — `null`/ausente = item novo. Fora da validação.
    item_uuid: yup.string().nullable(),
    product_uuid: yup.mixed<Option<string> | null>().nullable(),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
    amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
    name: yup.string().trim().nullable(),
    nif: yup.string().trim().max(20, messages.nifMaxLength).nullable(),
    phone: yup.string().trim().max(15, messages.phoneMaxLength).nullable(),
    // ADITIVO — gap de caminho-de-escrita corrigido nesta Tarefa (ver nota
    // em `RequestItemPayload.description`). Obrigatoriedade condicional por
    // `type` fica no `.test()` do array (mesmo mecanismo dos demais campos).
    description: yup.string().trim().nullable(),
    service_description: yup.string().trim().nullable(),
    daily_quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
    brand: yup.string().trim().nullable(),
    observation: yup.string().trim().nullable(),
    delivery_date: yup.string().trim().nullable(),
  });

  // -- Linha de anexo (`attachments[]`) — `name` é `required_with` `file`
  //    (contrato §4, sibling real dentro da MESMA linha — `.when()` comum,
  //    não precisa do mecanismo de array). `file` obrigatório condicional
  //    por `type` fica no `.test()` do array (mesmo mecanismo de `items`). --
  const attachmentRowSchema = yup.object({
    attachment_uuid: yup.string().nullable(),
    name: yup
      .string()
      .trim()
      .max(ATTACHMENT_NAME_MAX, messages.attachmentNameMaxLength)
      .nullable()
      .when('file', {
        is: (file: unknown) => !!file,
        then: (schema) => schema.required(messages.attachmentNameRequiredWithFile),
      }),
    file: yup
      .mixed<File | null>()
      .nullable()
      .test('file-max-size', messages.fileMaxLength, (file) => {
        if (!file) return true;
        const maxSizeKB = 10240;
        const fileSizeKB = file.size / 1024;
        return fileSizeKB <= maxSizeKB;
      }),
  });

  return yup.object({
    // -- Cabeçalho --
    type: v.option<string>().required(messages.typeRequired),
    request_date: v.date().required(messages.requestDateRequired),
    justification: yup
      .string()
      .trim()
      .required(messages.justificationRequired)
      .max(800, messages.justificationMaxLength),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(800, messages.descriptionMaxLength),
    priority: yup.mixed<Option<number> | null>().nullable(),
    authorizer_uuid: options.requiresAuthorizer
      ? yup
          .mixed<Option<string> | null>()
          .nullable()
          .test('authorizer-required', messages.authorizerRequired, (value) => !!value?.value)
      : yup.mixed<Option<string> | null>().nullable(),
    observation: yup.string().trim().max(800, messages.observationMaxLength).nullable(),

    // -- Itens (DA-RP-05/DA-RP-18) --
    items: yup
      .array()
      .of(itemRowSchema)
      .min(1, messages.itemsMinOne)
      .test(
        'items-required-fields-by-type',
        messages.itemsMinOne,
        // Arrow function (não `function`) + `context` como 2º parâmetro do
        // `.test()` (mesma técnica de `parameterWeights-schema.ts`,
        // `gt-initial-weight`) — evita `no-invalid-this` do eslint do
        // projeto; `context.parent` enxerga os siblings do ARRAY (`type`
        // do form pai), mecanismo documentado no cabeçalho do arquivo.
        (rows: RequestItemRowShape[] | undefined, context) => {
          const type = (context.parent as { type?: Option<string> | null } | undefined)?.type
            ?.value;
          // Sem `type` selecionado, o `.required()` do próprio campo `type`
          // já bloqueia o submit — evita erro duplicado/confuso aqui.
          if (!type) return true;

          const requiredFields = REQUIRED_ITEM_FIELDS_BY_TYPE[type] ?? [];
          if (requiredFields.length === 0) return true;

          const innerErrors: yup.ValidationError[] = [];
          (rows ?? []).forEach((row, index) => {
            // Máximos do legado por tipo (60 em P/M/U, 200 na Diária, 90 na
            // observação do Serviço).
            if (
              ITEM_DESCRIPTION_MAX_60_TYPES.has(type) &&
              String(row?.description ?? '').length > ITEM_DESCRIPTION_MAX
            ) {
              innerErrors.push(
                new yup.ValidationError(
                  messages.itemDescriptionMaxLength,
                  row?.description,
                  `items[${index}].description`
                )
              );
            }
            if (
              type === requestPurchaseType.diaria &&
              String(row?.service_description ?? '').length > ITEM_SERVICE_DESCRIPTION_MAX
            ) {
              innerErrors.push(
                new yup.ValidationError(
                  messages.itemServiceDescriptionMaxLength,
                  row?.service_description,
                  `items[${index}].service_description`
                )
              );
            }
            if (
              type === requestPurchaseType.servico &&
              String(row?.observation ?? '').length > ITEM_OBSERVATION_MAX
            ) {
              innerErrors.push(
                new yup.ValidationError(
                  messages.itemObservationMaxLength,
                  row?.observation,
                  `items[${index}].observation`
                )
              );
            }
            requiredFields.forEach((field) => {
              if (isItemFieldEmpty(field, row)) {
                innerErrors.push(
                  new yup.ValidationError(
                    messages[FIELD_MESSAGE_KEY[field]],
                    row?.[field],
                    `items[${index}].${field}`
                  )
                );
              }
            });
          });

          if (innerErrors.length > 0) {
            throw new yup.ValidationError(innerErrors);
          }
          return true;
        }
      ),

    // -- Anexos (`attachments[].file` condicional para type ∈ {F,E,U}) --
    attachments: yup
      .array()
      .of(attachmentRowSchema)
      .default([])
      .test(
        'attachments-file-required-by-type',
        messages.attachmentFileRequiredForType,
        // Arrow function + `context` como 2º parâmetro (mesma técnica acima).
        (rows: RequestAttachmentRowShape[] | undefined, context: yup.TestContext) => {
          const type = (context.parent as { type?: Option<string> | null } | undefined)?.type
            ?.value;
          if (!type || !ATTACHMENT_FILE_REQUIRED_TYPES.has(type)) return true;

          // PR-N01: F/E/U exigem a lista de anexos (ao menos 1 linha).
          if (!rows || rows.length === 0) {
            return context.createError({ message: messages.attachmentsMinOne });
          }

          const innerErrors: yup.ValidationError[] = [];
          (rows ?? []).forEach((row, index) => {
            const hasExistingAttachment = !!row?.attachment_uuid;
            const hasFile = !!row?.file;
            if (!String(row?.name ?? '').trim()) {
              innerErrors.push(
                new yup.ValidationError(
                  messages.attachmentNameRequiredForType,
                  row?.name,
                  `attachments[${index}].name`
                )
              );
            }
            // required_if:type,F,E,U — "não obrigatório no update se já
            // existir registro" (contrato §4): `attachment_uuid` presente
            // dispensa `file` novo.
            if (!hasExistingAttachment && !hasFile) {
              innerErrors.push(
                new yup.ValidationError(
                  messages.attachmentFileRequiredForType,
                  row?.file,
                  `attachments[${index}].file`
                )
              );
            }
          });

          if (innerErrors.length > 0) {
            throw new yup.ValidationError(innerErrors);
          }
          return true;
        }
      ),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @param {RequestPurchaseSchemaOptions} [options] - Opções dependentes da API (Encarregado obrigatório).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestPurchaseSchemaResolver = (
  languageGB: LanguageDate,
  options?: RequestPurchaseSchemaOptions
) => yupResolver(requestPurchaseSchema(languageGB, options));

export default requestPurchaseSchemaResolver;
