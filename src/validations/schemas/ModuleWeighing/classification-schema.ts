// src/validations/schemas/ModuleWeighing/classification-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup da etapa de Classificação do wizard (FE-SCR-03, 6 chaves,
// `TASK-MWG-FE-06`) — corpo real: `classification_percent_range` (0-100,
// GAP-PES-10) para cada uma das 6 chaves fixas (`impureza/umidade/quebrado/
// esverdeado/avariado/taxa_recepcao`).
//
// IG-014 (percentual >100% zera automaticamente) é aplicado como EFEITO
// (`StepClassificacao.tsx`, no `onChange`/`onBlur` do campo), não só como
// validação declarativa — a validação aqui é a rede de segurança que
// impede submit com percentual fora de 0-100 caso o efeito falhe.
//
// `discountTable` REMOVIDO do schema (correção 050, Bug 2) — a tabela de
// desconto não é mais selecionável nesta etapa (fixada no pré-cadastro, o
// `PUT next-step` real nunca aceita `discount_table_uuid`); validar um campo
// que não existe mais em `ClassificationFormValues` travava o submit
// (`.defined()` reprovava `undefined` e `handleSubmit` nunca chamava
// `onSubmit`).
//
// Correção 050 (D4) — `applied` (boolean único) virou DOIS campos: `applied`
// (checkbox "aplicar este desconto", usado quando HÁ tabela de desconto — o
// percentual é resolvido automaticamente via `discountRules`) e
// `appliedManual` (input numérico 0-100, usado quando NÃO HÁ tabela — mirror
// `classification.blade:24-26`, campo `applied` editável quando
// `discount_table_id == null`). Qual dos dois é enviado ao servidor depende
// do modo (`StepClassificacao.tsx`, `hasDiscountTable`), nunca os dois ao
// mesmo tempo.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const CLASSIFICATION_KEYS = [
  'impureza',
  'umidade',
  'quebrado',
  'esverdeado',
  'avariado',
  'taxa_recepcao',
] as const;

export const moduleWeighingClassificationSchema = (languageGB: LanguageDate) => {
  const text = languageGB.moduleWeighing.moduleWeighing.classification.validation;

  const itemSchema = yup.object({
    percent: yup
      .number()
      .transform((value, original) => (original === '' || original == null ? null : value))
      .nullable()
      .min(0, text.percentRange)
      .max(100, text.percentRange),
    applied: yup.boolean().required(),
    // Correção 050 (D4) — desconto manual (sem tabela), 0-100, opcional
    // (ausente/`null` = nenhum desconto para a chave, mirror do checkbox
    // desmarcado no modo com tabela).
    appliedManual: yup
      .number()
      .transform((value, original) => (original === '' || original == null ? null : value))
      .nullable()
      .min(0, text.percentRange)
      .max(100, text.percentRange),
  });

  const shape = CLASSIFICATION_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: itemSchema }),
    {} as Record<(typeof CLASSIFICATION_KEYS)[number], typeof itemSchema>
  );

  return yup.object({
    ...shape,
  });
};

export const moduleWeighingClassificationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(moduleWeighingClassificationSchema(languageGB)) as any;
