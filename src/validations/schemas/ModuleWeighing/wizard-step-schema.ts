// src/validations/schemas/ModuleWeighing/wizard-step-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup das etapas de Pesagem Inicial/Final do wizard (FE-SCR-03,
// `TASK-MWG-FE-05`) — corpo real: `gross_weight_numeric_range`/
// `tare_weight_numeric_range` (GAP-PES-10) + `.test()` cross-field (tara/
// bruto não podem ser negativos nem produzir peso líquido negativo —
// `netWeight = gross - tare`, `DIM-CAL-001`, contrato de tela §6.2).
//
// Cada etapa captura SÓ o campo ativo daquela etapa (bruto OU tara,
// conforme a ordem por `type`) — o outro valor (já persistido em etapa
// anterior) chega via `context` para a validação de peso líquido não-
// negativo, sem exigir os dois campos no mesmo formulário.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const moduleWeighingWizardStepSchema = (languageGB: LanguageDate) => {
  const text = languageGB.moduleWeighing.moduleWeighing.wizard.validation;

  return yup.object({
    weight: yup
      .number()
      .transform((value, original) => (original === '' ? null : value))
      .typeError(text.requiredField)
      .required(text.requiredField)
      .moreThan(0, text.weightRange)
      // Arrow function + `ctx.options.context` (não `function(){...}`/
      // `this.options.context`) — evita `no-invalid-this` do ESLint do
      // projeto (mesma convenção de `advance-schema.ts`/`invoice-schema.ts`).
      .test('net-weight-non-negative', text.netWeightNegative, (value, ctx) => {
        const { otherWeight, isGrossField } = (ctx.options.context ?? {}) as {
          otherWeight?: number | null;
          isGrossField?: boolean;
        };
        if (value == null || otherWeight == null) return true;
        const netWeight = isGrossField ? value - otherWeight : otherWeight - value;
        return netWeight >= 0;
      }),
  });
};

export const moduleWeighingWizardStepSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(moduleWeighingWizardStepSchema(languageGB)) as any;
