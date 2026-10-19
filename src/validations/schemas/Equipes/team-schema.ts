// src/validations/schemas/Equipes/team-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Equipes" (Team — Administrativo /
// Gestão Pessoal), espelhando `TeamRequest::rules()` (`api-contract-equipes.md`
// §4.3): `name` obrigatório/`max:30`, `description` OPCIONAL/`max:50` (NÃO 40 —
// `GAP-EQ-FE-09`, o 40 do legado era só `maxlength` de HTML sem contraparte no
// servidor/schema), `employee_uuid` obrigatório (Option{label,value} inteiro
// guardado pelo RHF, servidor corrigiu DIV-001: agora `required` de verdade),
// `is_enabled` booleano.
//
// `members` (repeater) NÃO usa `v.option()` (que forçaria erro imediato numa
// linha ainda vazia) — cada linha é validada por um `.test()` de nível de
// OBJETO: linha totalmente vazia (Tipo E Integrante nulos) é válida (filtrada
// do payload no submit, `GAP-EQ-FE-03` — equipe sem integrante é estado
// válido); só a incompletude PARCIAL (só um dos dois preenchido) é erro —
// nunca bloqueia a digitação/seleção de uma linha nova.
//
// Vive em `src/validations/schemas/Equipes/` (NÃO em `pages/`) — mesmo path
// canônico de `Funcoes/function-schema.ts`/`marker-schema.ts`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const teamSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.workTeams.workTeam.form.validation;

  return yup.object({
    name: v.string().max(30, messages.nameMaxLength),
    // Opcional (`nullable|string|max:50` no servidor) — NUNCA `v.string()`
    // (que é required por padrão). Mantido como string ('') no form, nunca
    // `null`, para o `<Input>` controlado por `register()` continuar simples.
    description: yup.string().trim().max(50, messages.descriptionMaxLength).default(''),
    employee_uuid: v.option(),
    is_enabled: v.boolean(),
    members: yup
      .array()
      .of(
        yup
          .object({
            provider_uuid: yup
              .object({ label: yup.string(), value: yup.mixed() })
              .nullable()
              .default(null),
            type: yup
              .object({ label: yup.string(), value: yup.mixed<2 | 3>() })
              .nullable()
              .default(null),
            is_enabled: v.boolean(),
          })
          .test('member-row-complete', messages.memberRowIncomplete, (row) => {
            if (!row) return true;
            const hasProvider = !!row.provider_uuid;
            const hasType = !!row.type;
            // Ambos vazios (linha nova/limpa) OU ambos preenchidos — só a
            // incompletude PARCIAL (um sim, outro não) é inválida.
            return hasProvider === hasType;
          })
      )
      .default([]),
  });
};

export const teamSchemaResolver = (languageGB: LanguageDate) => yupResolver(teamSchema(languageGB));

export default teamSchemaResolver;
