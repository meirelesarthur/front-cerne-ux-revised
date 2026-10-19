// src/validations/schemas/HarvestProduct/harvestProduct-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Colheita de Frutas" (HarvestProduct —
// Operacional / Agricultura, F-040, execução 040, TASK-FE-1092), espelhando
// `HarvestProductRequest::rules()` do contrato de API (validação client-side
// é UX antecipada — a autoridade final de negócio é sempre o 422 do backend).
// Vive em `src/validations/schemas/HarvestProduct/` (pasta pelo NOME DA
// ENTIDADE, nunca em `src/pages/`, mesma convenção de `ProtocolsSeason`/
// `Rastreabilidade`).
//
// `boxes` tem `.min(1)` — mirror EXATO `ProtocolsSeason/protocolSeason-
// schema.ts::items` e `BreedingBatch/breeding-batch-schema.ts::batches`
// (contrato §7.7/§7.10 D em torno de DIV-01: a guarda "ao menos uma caixa"
// era furada no legado; agora é efetiva nos dois lados, client Yup + 422
// real do servidor).
//
// `date`/`amount` compõem `fieldValidationSchema(languageGB)` (fábrica
// canônica única de validators, `get_pwa_validation_and_utils_pattern` §1.7 —
// mesmo padrão de `request-purchase-schema.ts::request_date`/
// `drinkingFountains-schema.ts::total_area`): `.required(customMsg)` sobre
// `v.date()`/`v.number()` sobrescreve só a mensagem, mantendo a MESMA regex
// ISO/transform já centralizados — nunca reimplementar a lógica aqui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { HarvestProductBoxForm, HarvestProductForm } from '@/@types/v2/HarvestProduct';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const harvestProductSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.harvestProduct.validation;

  const harvestProductBoxSchema = yup.object().shape<Shape<HarvestProductBoxForm>>({
    // interno, sem UI própria — nunca validado/exibido.
    uuid: yup.string().nullable(),

    amount: v.number().required(messages.boxAmountRequired).moreThan(0, messages.boxAmountRequired),
  });

  return yup.object().shape<Shape<HarvestProductForm>>({
    // readonly (`code` gerado no servidor, D1) — validação de presença
    // dispensada: string vazia é o valor legítimo no modo criação.
    code: yup.string(),

    date: v.date().required(messages.dateRequired),

    areaUuid: optionSchema.required(messages.areaRequired),
    clientUuid: optionSchema.required(messages.clientRequired),
    productUuid: optionSchema.required(messages.productRequired),

    // UT-000787 (D5): reverte DIV-09 — máscara de placa + formato só quando
    // preenchida (cadastro antigo vazio continua válido).
    plate: yup
      .string()
      .max(10)
      .nullable()
      .test(
        'plate-format',
        languageGB.defaltStrings.validations.plateInvalid,
        (value) => !value || isValidPlate(value)
      ),

    cityUuid: optionSchema,

    // max:191 (DIV-04 já corrigido no backend) — NÃO 255.
    driverName: yup.string().max(191).nullable(),

    driverNif: yup.string().nullable(),

    // FIDELIDADE (contrato §7.4/§7.7): `.min(1)` fecha DIV-01 do lado
    // client — mirror `protocolSeason-schema.ts::items`/`breeding-batch-
    // schema.ts::batches`.
    boxes: yup.array().of(harvestProductBoxSchema).min(1, messages.boxesMinOne),
  });
};

export const harvestProductSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(harvestProductSchema(languageGB)) as any;

export default harvestProductSchemaResolver;
