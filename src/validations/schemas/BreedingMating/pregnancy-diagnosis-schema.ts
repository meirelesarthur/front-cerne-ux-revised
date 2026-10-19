// src/validations/schemas/BreedingMating/pregnancy-diagnosis-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Diagnóstico de Gestação"
// (PregnancyDiagnosis — sub-árvore aninhada de Acasalamento, F-016,
// 97-Esteiras/001, Tarefa 02). Todo validator sai de
// `fieldValidationSchema(languageGB)` — proibido `yup.string().required(...)`
// escrito à mão. Vive em `src/validations/schemas/BreedingMating/` (mesma
// pasta da entidade-pai — DG não tem pasta própria, é sub-árvore).
//
// Mensagem literal do legado preservada (regra 4 da Tarefa 01):
// "Adicione pelo menos um animal para salvar o DG." — `animals.min(1)`.
// NÃO existe schema de UPDATE — o modo editar de DG é `NAO_APLICAVEL`
// comprovado (contrato de tela §2).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  PregnancyDiagnosisAnimalCardFormValue,
  PregnancyDiagnosisForm,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const pregnancyDiagnosisSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.breedingMatings.pregnancyDiagnosis.form.validation;

  return yup.object({
    code: yup.string().required(),
    date: fv.date(),
    responsible_name: yup.string().nullable(), // InputReadOnly nunca sincronizado em modo criação — mirror GAP-FE-BM-08

    // Mínimo 1 card — mensagem literal do legado (regra 4 da Tarefa 01).
    // Por linha: `Inseminador`/`Técnica DG`/`DG` obrigatórios; `Ressincronização`
    // e `Transferir Lote` são mutuamente exclusivos (aplicado na UI, a
    // partir de `cascade_rules` — não duplicado aqui); `Observação` máx. 190
    // (migration `note`); `Tempo de Gestação` e `Touro` ficam nullable —
    // habilitados por `cascade_rules` conforme o resultado do DG.
    animals: yup
      .array()
      .of(
        yup.object().shape<Shape<PregnancyDiagnosisAnimalCardFormValue>>({
          animal: optionSchema.required(),
          inseminator: optionSchema.required(messages.inseminatorRequired),
          technique: optionSchema.required(messages.techniqueRequired),
          diagnosis: optionSchema.required(messages.diagnosisRequired),
          resync: yup.boolean().default(false),
          batch: optionSchema,
          observation: yup.string().trim().nullable().max(190),
          gestation_days: yup
            .number()
            .transform((value, original) => (original === '' || original === null ? null : value))
            .nullable()
            .min(0),
          bull: optionSchema,
        })
      )
      .min(1, messages.animalsMinRequired),
  });
};

export const pregnancyDiagnosisSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(pregnancyDiagnosisSchema(languageGB)) as any;

export default pregnancyDiagnosisSchemaResolver;

// Re-exportado só para teste unitário do schema, sem acoplar ao resolver.
export type { PregnancyDiagnosisForm };
