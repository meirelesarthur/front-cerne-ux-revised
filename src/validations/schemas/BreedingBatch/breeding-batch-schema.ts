// src/validations/schemas/BreedingBatch/breeding-batch-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Lotes/Reprodução" (BreedingBatch —
// Operacional / Reprodução, 97-Esteiras/048, Tarefa 04 — fundação, consumido
// pela Tarefa 06), espelhando `BreedingBatchRequest::rules()` (contrato de API
// §5): `date`/`description`/`breeding_season_uuid`/`batch_uuids` obrigatórios.
// Vive em `src/validations/schemas/BreedingBatch/` (pasta pelo NOME DA
// ENTIDADE, NUNCA em `src/pages/`, mesma convenção dos irmãos
// `BreedingSeasons`/`BullSeedSeason`).
//
// ⚠️ PONTO DE FIDELIDADE (contrato de tela §3/§5.1, achado #3 do backend):
// `batches` tem `.min(1)` — DIFERENTE de `AnimalsFieldArray`/`ProductsFieldArray`
// do módulo-irmão `BullSeedSeason` (que NÃO têm `.min(1)`, decisão própria
// daquela tela, `GAP-BSS-06` — NÃO É PRECEDENTE aqui). A API rejeita
// `batch_uuids: []` com 422 (`required|array|min:1`) — sem o `.min(1)` no
// client, o usuário só descobre o erro depois do submit.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { BreedingBatchBatchFieldValue, BreedingBatchForm } from '@/@types/v2/BreedingBatch';
import type Shape from '@/@types/validations/shape';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const breedingBatchSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.breedingBatches.breedingBatch.form.validation;

  return yup.object({
    // `code` é readonly/sugerido (`next-code`, só criação) — validação de
    // presença apenas, mirror `EstacaoDeMonta`/`BullSeedSeason` (o valor
    // sempre chega preenchido pelo `fillForm`/sugestão do backend).
    code: yup.string().required(),

    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),

    description: yup.string().required(messages.descriptionRequired),

    breeding_season: optionSchema.required(messages.breedingSeasonRequired),

    // `.min(1)` OBRIGATÓRIO — ver nota de cabeçalho. `batch` de cada linha é
    // `required` (mirror `AnimalsFieldArray` — cada linha JÁ adicionada exige
    // seleção; dedupe/`check-date` são comportamento de UI da Tarefa 06, não
    // do schema Yup).
    batches: yup
      .array()
      .of(
        yup.object().shape<Shape<BreedingBatchBatchFieldValue>>({
          batch: optionSchema.required(messages.batchRequired),
        })
      )
      .min(1, messages.batchesMinRequired),
  });
};

export const breedingBatchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(breedingBatchSchema(languageGB)) as any;

export default breedingBatchSchemaResolver;

// Re-exportado só para o teste unitário do schema (DoD da Tarefa 04 — cenário
// "batches: [] → errors.batches presente") sem acoplar o teste ao resolver.
export type { BreedingBatchForm };
