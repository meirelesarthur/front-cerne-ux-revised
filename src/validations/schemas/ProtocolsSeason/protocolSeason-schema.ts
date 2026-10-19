// src/validations/schemas/ProtocolsSeason/protocolSeason-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Protocolos/Estação" (ProtocolSeason —
// Operacional / Reprodução, F-057, execução 040, TASK-FE-1050), espelhando
// `ProtocolSeasonRequest::rules()` do contrato de API (validação client-side é
// UX antecipada — a autoridade final de negócio é sempre o 422 do backend).
// Vive em `src/validations/schemas/ProtocolsSeason/` (pasta pelo NOME DA
// ENTIDADE, NUNCA em `src/pages/`, mesma convenção dos irmãos
// `BreedingBatch`/`BreedingSeasons`).
//
// ⚠️ PONTO DE FIDELIDADE (contrato de tela §4.3): `items` tem `.min(1)` —
// mirror `BreedingBatch/breeding-batch-schema.ts::batches` (o legado sempre
// inicia com 1 linha DZERO na criação; o backend valida via 422, sem o
// `.min(1)` no client o usuário só descobre "protocolo sem itens" pós-submit).
//
// ⚠️ Produto × Serviço (contrato §3.2 linhas 20/21, FID-G1 Q2) — "PELO MENOS
// UM", NÃO xor "exatamente um": o legado permite produto, serviço OU AMBOS
// na mesma linha. Onda B (execução 065) relaxou o xor herdado de
// `Pastures/pasture-schema.ts::areaXorGrazing` — mesmo `yup.test()`
// compartilhado nos dois campos, só a condição mudou (`||`, não `!==`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type {
  ProtocolItemFieldValue,
  ProtocolSeasonForm,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';
import type Shape from '@/@types/validations/shape';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

// Item 2 (FID-G1 Q2) — "pelo menos um", NÃO MAIS xor "exatamente um": o
// legado permite produto, serviço OU AMBOS na mesma linha (não há validação
// server-side de item; client-side é UX antecipada). Mantém o mesmo
// `.test()` compartilhado nos dois campos, só troca `!==` (xor) por `||`
// (pelo menos um).
function productOrService(_value: unknown, context: yup.TestContext) {
  const product = context.parent?.product_uuid;
  const service = context.parent?.service;
  return Boolean(product) || Boolean(service);
}

// CAL-009 — clamp de quantidade vs. estoque disponível. Vive no `.test()` do
// Yup (não em `setError` imperativo no componente) para não competir com a
// revalidação do próprio resolver a cada `onChange` (mode: 'onChange') — o
// teste lê `stock_display`/`warehouse_uuid` da MESMA linha via
// `context.parent`, sempre em dia com a cascata (TASK-FE-1056).
function parseStockDisplayForValidation(display: unknown): number {
  if (typeof display !== 'string' || !display) return 0;
  const normalized = display.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function quantityWithinStock(value: number | null | undefined, context: yup.TestContext) {
  const warehouse = context.parent?.warehouse_uuid;
  if (!warehouse || value === null || value === undefined) return true;
  const available = parseStockDisplayForValidation(context.parent?.stock_display);
  return value <= available;
}

// CAL-005 — "data anterior à primeira aplicação (DZERO)" (SURF-055): NÃO
// implementado como `.test()` aqui — a versão instalada do Yup (0.32) não
// expõe `TestContext.from` (cadeia de ancestrais, disponível só a partir do
// Yup 1.x), então um teste de item não alcança o array `items` irmão. Fica
// resolvido de forma imperativa em `CreateOrUpdateProtocolSeason.tsx`
// (`computeProtocolIdentification` + `setError`/`clearErrors`), mesmo padrão
// já em produção no sibling `CreateOrUpdateLoteReproducao.tsx::runCheckDateForRow`.

export const protocolSeasonSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.protocolSeasons.protocolSeason.form.validation;

  const protocolItemSchema = yup.object().shape<Shape<ProtocolItemFieldValue>>({
    // readonly/calculado (CAL-005) — nunca editado pelo usuário, sem `.required()`.
    identification: yup.string(),

    date: yup
      .string()
      .required(messages.itemDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.itemDateRequired, excludeEmptyString: true }),

    // `ProtocolSeasonRequest::rules()` real (`items.*.time` =>
    // `['nullable', 'date_format:H:i']`) diverge do `field_manifest` legado
    // (que marcava obrigatório) — a autoridade de negócio é o backend
    // hoje migrado; client-side não bloqueia além do 422 real.
    time: yup.string().nullable(),

    // não obrigatório (FLD-018) — armazém vazio é um caminho válido (LKP-004).
    warehouse_uuid: optionSchema,

    // interno, resolvido pela cascata (TASK-FE-1056) — sem Select próprio.
    stock_uuid: yup.string().nullable(),

    product_uuid: yup
      .mixed()
      .nullable()
      .test('product-or-service', messages.productOrServiceRequired, productOrService),
    service: yup
      .mixed()
      .nullable()
      .test('product-or-service', messages.productOrServiceRequired, productOrService),

    // Item 2 (FID-G1 Q2) — obrigatório SÓ quando há produto (item só-serviço
    // não tem unidade a escolher, Item 1 já deriva `options` vazio nesse
    // caso). Yup 0.32 (sem `TestContext.from`) — `.when('product_uuid', ...)`
    // alcança o irmão na MESMA linha via `context.parent`, é o idioma
    // canônico (`get_pwa_validation_and_utils_pattern §1.4`).
    measurement_uuid: optionSchema.when('product_uuid', {
      is: (value: unknown) => Boolean(value),
      then: (schema) => schema.required(messages.measurementRequired),
      otherwise: (schema) => schema.nullable(),
    }),

    // readonly/calculado (CAL-004) — não validado.
    stock_display: yup.string(),

    // Item 2 (FID-G1 Q2) — obrigatório + clamp de estoque SÓ quando há
    // produto; item só-serviço não tem quantidade de produto a validar.
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .when('product_uuid', {
        is: (value: unknown) => Boolean(value),
        then: (schema) =>
          schema
            .typeError(messages.quantityRequired)
            .required(messages.quantityRequired)
            .moreThan(0, messages.quantityRequired)
            .test('quantity-within-stock', messages.quantityExceedsStock, quantityWithinStock),
        otherwise: (schema) => schema.nullable().notRequired(),
      }),

    description: yup.string().nullable(),
  });

  return yup.object().shape<Shape<ProtocolSeasonForm>>({
    // sempre preenchido (next-code/hidratado) — readonly, validação de presença apenas.
    code: yup.string().required(),

    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),

    user_uuid: yup.string().required(),
    user_name: yup.string(),

    breeding_season_uuid: optionSchema.required(messages.breedingSeasonRequired),

    name: yup.string().required(messages.nameRequired).max(200),
    description: yup.string().max(200).nullable(),

    // `.min(1)` — FIDELIDADE (contrato §4.3): mirror `BreedingBatch/
    // breeding-batch-schema.ts::batches`, NÃO `AnimalsFieldArray`/
    // `ProductsFieldArray` (sem `.min(1)`, GAP-BSS-06, não é precedente aqui).
    items: yup.array().of(protocolItemSchema).min(1, messages.itemsMinOne),
  });
};

export const protocolSeasonSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(protocolSeasonSchema(languageGB)) as any;

export default protocolSeasonSchemaResolver;
