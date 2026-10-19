// src/validations/schemas/Fiscal/cte-manifestacao-desacordo-schema.ts
// Schema de validação Yup do dialog "Manifestar desacordo" (CteManifestacao —
// domínio Fiscal, execução 045, Onda 2, TASK-CTE-FE-13). Único campo visível
// ao usuário é `justificativa` (`evento` é fixo `1`, LK22, nunca exposto como
// Select) — mirror `dfe-manifest-schema.ts` (mesmo domínio Fiscal, mesma
// regra de negócio "justificativa min 15"), simplificado (sem `.when()`,
// pois aqui não há bifurcação por evento). Vive em
// `src/validations/schemas/Fiscal/` (pasta pelo NOME DO MÓDULO, NUNCA em
// `src/pages/`).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { ManifestarDesacordoFormValues } from '@/@types/v2/Fiscal/cteManifestacao';
import type Shape from '@/@types/validations/shape';

export const cteManifestacaoDesacordoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.cteManifestacoes.cteManifestacao.manifestarDialog.validation;

  return yup.object().shape<Shape<ManifestarDesacordoFormValues>>({
    justificativa: yup
      .string()
      .trim()
      .required(messages.justificativaRequired)
      .min(15, messages.justificativaMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do dialog de manifestação
 * de desacordo (`ManifestarDesacordoDialog.tsx`, TASK-CTE-FE-13).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de desacordo do módulo.
 */
export const cteManifestacaoDesacordoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cteManifestacaoDesacordoSchema(languageGB)) as any;

export default cteManifestacaoDesacordoSchemaResolver;
