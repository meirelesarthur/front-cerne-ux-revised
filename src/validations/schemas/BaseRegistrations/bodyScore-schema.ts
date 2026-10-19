// src/validations/schemas/BaseRegistrations/bodyScore-schema.ts
// Schema de validação Yup do formulário de Escore Corporal (BodyScore) —
// mirror `diagnosisPregnancy-schema.ts`, campo extra de FK (`specie_uuid`)
// via `fieldValidationSchema().option()`. Fábrica que recebe `languageGB` e
// devolve o schema — NUNCA string de erro literal.
//
// TASK-BS-FE-04 (ajuste de homologação): `description` passa a validar como
// STRING NUMÉRICA (dígitos + separador decimal opcional "."), fiel ao Blade
// legado (`_forms.blade.php`: `<input type="number" step="0.25">`). O
// payload continua STRING — o backend é `varchar(100)` (contrato §4/Doc
// Bruta §5) — a restrição é só client-side, não muda o tipo do dado. Mensagem
// derivada de `defaltStrings.validations.invalidNumber` (genérica/reusável,
// NÃO uma chave só de BodyScore) — `excludeEmptyString: true` para o campo
// vazio cair no `required()` acima, não nesta regra (mesmo padrão de
// `field-validation-schema.ts` → `date()`).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const bodyScoreSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.bodyScore.form.validation;

  return yup.object({
    // CLIENT-required por fidelidade ao Blade (`_forms.blade.php` tinha
    // `->required()` HTML5 no select de Espécie) — servidor aceita `null`
    // (contrato §4, decisão documentada, NÃO é enfraquecimento: é a MESMA
    // regra do server legado). `v.option()` já deriva a mensagem de
    // `defaltStrings.validations.requiredField` — nunca string literal.
    specie_uuid: v.option(),
    description: v
      .string()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength)
      .matches(/^\d+(\.\d+)?$/, {
        message: languageGB.defaltStrings.validations.invalidNumber,
        excludeEmptyString: true,
      }),
    is_enabled: v.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const bodyScoreSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(bodyScoreSchema(languageGB));

export default bodyScoreSchemaResolver;
