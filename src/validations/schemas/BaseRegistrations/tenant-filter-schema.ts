// src/validations/schemas/BaseRegistrations/tenant-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do drawer de filtro da listagem de Contratantes
// (TASK-072-FE-07, I10). Espelha as regras do `TenantIndexRequest`
// (API v1.2) que o usuário consegue violar pela tela:
//   - `search` com no máximo 60 caracteres;
//   - datas `yyyy-MM-dd`;
//   - `end_date >= start_date` (só quando os dois estão preenchidos, como o
//     `after_or_equal` condicional do back).
// Mensagens: `fieldValidationSchema` (`defaltStrings.validations.*`) e a
// chave do módulo `tenant.filter.searchMaxLength` para o limite.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { TENANT_FILTER_SEARCH_MAX_LENGTH } from '@/constants/BaseRegistrations/mappers/tenant-filter-mapper';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  TenantDueDay,
  TenantDueMonth,
  TenantSignature,
  TenantStatus,
} from '@/@types/v2/BaseRegistrations/tenant';

export const tenantFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;
  const text = languageGB.baseRegistrations.tenant.filter;

  return yup.object({
    search: yup
      .string()
      .trim()
      .default('')
      .max(TENANT_FILTER_SEARCH_MAX_LENGTH, text.searchMaxLength),
    status: v.optionalOption<TenantStatus>(),
    signature: v.optionalOption<TenantSignature>(),
    due_month: v.optionalOption<TenantDueMonth>(),
    due_day: v.optionalOption<TenantDueDay>(),
    dt_accession: v.optionalDate(),
    start_date: v.optionalDate(),
    end_date: v
      .optionalDate()
      .test('end-date-after-start-date', messages.invalidValue, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    role_uuid: v.optionalOption<string>(),
    plan_uuid: v.optionalOption<string>(),
  });
};

export const tenantFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(tenantFilterSchema(languageGB)) as any;

export default tenantFilterSchemaResolver;
