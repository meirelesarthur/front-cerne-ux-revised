// src/validations/schemas/CadastrosBase/batch-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Lotes Animais" (Batch — Cadastros
// Base / Pecuários), espelhando `AnimalBatchRequest::rules()` v1.1
// (`animal-batch-contrato.md` §3, M4/GAP-476). Vive em
// `src/validations/schemas/` (NÃO em `pages/`) — mirror EXATO estrutural de
// `category-animal-schema.ts`; o schema antigo em
// `pages/CadastrosBase/Batches/batch-schema.ts` é um DESVIO pré-canonização,
// descartado no lote que regenera a tela (TASK-FE-1080/1081) — não clonado
// aqui.
//
// Mensagens SEMPRE derivadas da tradução do módulo
// (`languageGB.batches.batch.form.validation`) — nunca string literal.
//
// Campos required conforme contrato v1.1 §3: `description` (max:100, NÃO
// max:255 — teto real do backend diverge do maxlength da UI legada, ver
// contrato §2), `date`, `specie_uuid`, `category_uuids` (array, min 1).
// **Fora deste schema, de propósito:** `status` (não é input do cliente —
// nasce sempre `'A'`, só muda via Arquivar) e `corral_uuid` (fora da tela por
// ora, `FeedlotCorral` não migrado). `animal_uuids` é `nullable|array` (um
// Lote pode nascer sem animal, contrato v1.1 §3) — sem `.required()`/`.min()`.
// `parameter_weight_uuid` (TASK-FE-1090) é `nullable|uuid` — campo "Peso"
// OPCIONAL (contrato TASK-BE-970/legado `_forms.blade.php:20`), sem
// `.required()`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const batchSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.batches.batch.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    date: yup.mixed().required(messages.dateRequired),
    // FK obrigatória — guarda o `Option` completo (SelectAsyncPaginate).
    specie_uuid: yup.mixed().required(messages.specieRequired),
    // `nullable|uuid` (TASK-FE-1090/TASK-BE-970) — campo "Peso" OPCIONAL, fiel
    // ao legado (`_forms.blade.php:20`, tem opção vazia "Selecione"). SEM
    // `.required()` — guarda o `Option` completo (SelectAsyncPaginate) ou
    // `null`.
    parameter_weight_uuid: yup.mixed().nullable(),
    // `required|array|min:1` (M4/GAP-476) — array de `Option`/uuid do multi-select.
    category_uuids: yup
      .array()
      .required(messages.categoriesRequired)
      .min(1, messages.categoriesMin),
    // `nullable|array` (Doc Bruta/contrato §3) — um Lote pode nascer sem animal.
    animal_uuids: yup.array().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const batchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(batchSchema(languageGB));

export default batchSchemaResolver;
