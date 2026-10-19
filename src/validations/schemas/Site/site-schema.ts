// src/validations/schemas/Site/site-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Site (configuração única do
// site/fazenda) — 97-Esteiras/061, TASK-SITE-04. Fábrica `(languageGB) =>
// resolver`, mesma convenção de `config-schema.ts`/`help-schema.ts`. Vive em
// `src/validations/schemas/Site/` (NUNCA em `pages/` — SEVERIDADE inviolável
// do task-packet).
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)` (`fv`) +
// `languageGB.defaltStrings.validations.*` (`messages`) — fonte única do
// projeto para mensagens Yup. NUNCA string literal.
//
// Ordem do contrato de tela §3 (`03-ARQUITETURA-frontend-site.md`):
//   published  => fv.boolean() (obrigatório — corrige CL-013 do legado)
//   instagram/facebook/twitter/youtube => nullable + url (COMPOSIÇÃO, sem
//     precedente LITERAL no repo — ver §3.2 do contrato: por analogia com
//     `resp_email`/`resp_cnpj` de `config-schema.ts`, que usam o mesmo
//     padrão `yup.string().trim().nullable()` para campos opcionais.
//     DECISÃO DE ARQUITETURA explícita, documentada aqui por instrução do
//     contrato — NÃO tratar como padrão já validado em produção)
//   whatsapp   => nullable + max(15) (mirror `whatsapp` do backend
//     `SiteRequest::rules()`, máscara BR é responsabilidade só do FRONT)
//   about      => fv.string() (já embute `.required()` + mensagem i18n —
//     corrige CL-012 do legado, coluna NOT NULL sem validação)
//
// `banner` NÃO tem entrada neste schema — é estado local (`imageFile`) fora
// do RHF/`control`, validado client-side dentro do próprio `ImageUpload`
// (tipo/tamanho), mirror `FamilyEquipments`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const siteSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    published: fv.boolean(),
    // Composição — ver nota de cabeçalho §3.2 do contrato. `.url()` só roda
    // quando o valor não é vazio/nulo (comportamento nativo do Yup: regras
    // encadeadas não bloqueiam `nullable()` quando o valor é `null`).
    instagram: yup.string().trim().nullable().url(messages.invalidValue),
    facebook: yup.string().trim().nullable().url(messages.invalidValue),
    twitter: yup.string().trim().nullable().url(messages.invalidValue),
    youtube: yup.string().trim().nullable().url(messages.invalidValue),
    whatsapp: yup.string().trim().nullable().max(15, messages.invalidValue),
    about: fv.string(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const siteSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(siteSchema(languageGB) as any);

export default siteSchemaResolver;
