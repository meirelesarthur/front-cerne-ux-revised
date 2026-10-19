// src/validations/schemas/Fiscal/dfe-manifest-schema.ts
// Schema de validação Yup do modal de Manifestação SEFAZ (Dfe — domínio
// Fiscal, execução 044, TASK-DFE-FE-03/06). Migra a regra do legado (só
// JS: `justificativa` obrigatória + mín. 15 chars quando `evento` in [3,4])
// para Yup `.when()` real — MESMA regra, mecanismo novo (`CONTRATO-TELA-
// DFE-FE.md §6.4`). Vive em `src/validations/schemas/Fiscal/` (pasta pelo
// NOME DO MÓDULO, NUNCA em `src/pages/`).
//
// DIV-03 (modal em lote não valida prazo, `CONTRATO-TELA-DFE-FE.md §6.3`) é
// tratada em TASK-DFE-FE-06 pelo utilitário `dfeManifestEventOptions` (disable
// de OPÇÕES só no modo individual) — este schema valida só presença/shape de
// `evento`/`justificativa`, igual nos dois modos (a assimetria de prazo não é
// uma regra de validação Yup, é uma restrição de OPÇÕES disponíveis no
// Select).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const dfeManifestSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.dfes.dfe.manifest.validation;

  return yup.object({
    evento: yup
      .object({
        label: yup.string().required(messages.eventoRequired),
        value: yup.mixed<1 | 2 | 3 | 4>().required(messages.eventoRequired),
      })
      .nullable()
      .required(messages.eventoRequired),

    justificativa: yup
      .string()
      .trim()
      .when('evento', {
        // `evento` guarda o `Option` inteiro (mirror padrão de select do
        // projeto) — a condição lê `.value` do objeto selecionado.
        is: (evento: { value?: number } | null) => evento?.value === 3 || evento?.value === 4,
        then: (schema) =>
          schema.required(messages.justificativaRequired).min(15, messages.justificativaMin),
        otherwise: (schema) => schema.nullable(),
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do modal de manifestação
 * (`DfeManifestModal.tsx`, TASK-DFE-FE-06).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de manifestação do módulo.
 */
export const dfeManifestSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(dfeManifestSchema(languageGB)) as any;

export default dfeManifestSchemaResolver;
