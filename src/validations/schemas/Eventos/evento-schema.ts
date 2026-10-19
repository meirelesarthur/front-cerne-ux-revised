// src/validations/schemas/Eventos/evento-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Eventos" (Event — Administrativo /
// Gestão Pessoal), espelhando `EventRequest::rules()` (`Eventos-contrato.md`
// §3.2, APROVADO): `name` obrigatório/`max:30` (autoridade é a coluna do
// banco, não o `maxlength=100` do Blade legado — contrato de tela §3),
// `type`/`method`/`condition` obrigatórios, um dos valores do respectivo enum
// (o `Select` nunca deixa passar um valor fora da lista, mas valida mesmo
// assim — mesma cautela de `centro-custo-schema.ts` para `condition`),
// `is_enabled` booleano.
//
// Vive em `src/validations/schemas/Eventos/` (NÃO em `pages/`) — mesmo path
// canônico de `Funcoes/function-schema.ts`/`marker-schema.ts` (preferência de
// organização desta Tarefa — dedicado, não inline, mirror `Funcoes`).
//
// `condition` validado como STRING ('0'|'1') — mesma convenção de
// `CostCenterForm.condition`/`EventForm.type|method` (o `Select` trabalha com
// valores string); a conversão para o `number` real do payload
// (`CreateEventRequest.condition`) acontece só em `CreateOrUpdateEvento.tsx`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const eventoSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.events.event.form.validation;
  const requiredMessage = languageGB.defaltStrings.validations.requiredField;

  return yup.object({
    name: v.string().max(30, messages.nameMaxLength),
    type: yup
      .string()
      .oneOf(['1', '2', '3', '4', '5', '6'], requiredMessage)
      .required(requiredMessage),
    method: yup.string().oneOf(['0', '1'], requiredMessage).required(requiredMessage),
    condition: yup.string().oneOf(['0', '1'], requiredMessage).required(requiredMessage),
    is_enabled: v.boolean(),
  });
};

export const eventoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(eventoSchema(languageGB));

export default eventoSchemaResolver;
