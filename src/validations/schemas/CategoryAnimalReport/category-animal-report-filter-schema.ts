// src/validations/schemas/CategoryAnimalReport/category-animal-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Estq. Animais/Categoria"
// (F-242, esteira 97-Esteiras/077). Mirror ESTRUTURAL de
// `stock-abc-report-filter-schema.ts`, mas os 3 selects de lookup
// (`category_uuid`/`batch_uuid`/`harvest_uuid`) são TODOS opcionais — fiel
// ao legado CL-04 (nenhum filtro obrigatório).
//
// NÃO usar `fieldValidationSchema(languageGB).option<T>()` nestes 3 campos —
// `field-validation-schema.ts` confirma que `.option()` é SEMPRE
// `.required()` (`.nullable().required(...)`), o que bloquearia o submit sem
// seleção. Usa-se `yup.object({label,value}).nullable().default(null)`
// inline. Só `format` usa `v.option<CategoryAnimalReportFormat>()` — sempre
// tem valor default (`pdf`), mirror `StockAbcReport`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { CategoryAnimalReportFormat } from '@/@types/v2/CategoryAnimalReport';

// Select opcional — `Option<T> = {label, value}` OU `null`. NUNCA
// `v.option()` (sempre required por definição, ver nota de cabeçalho).
const optionalOption = () =>
  yup
    .object({
      label: yup.string(),
      value: yup.mixed(),
    })
    .nullable()
    .default(null);

export const categoryAnimalReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);

  return yup.object({
    category_uuid: optionalOption(),
    batch_uuid: optionalOption(),
    harvest_uuid: optionalOption(),
    format: v.option<CategoryAnimalReportFormat>(), // ÚNICO campo required (sempre tem default)
  });
};

export const categoryAnimalReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(categoryAnimalReportFilterSchema(languageGB)) as any;

export default categoryAnimalReportFilterSchemaResolver;
