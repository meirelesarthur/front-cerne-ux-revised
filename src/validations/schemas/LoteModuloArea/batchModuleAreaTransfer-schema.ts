// src/validations/schemas/LoteModuloArea/batchModuleAreaTransfer-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela de Transferência "Lote/Módulo/Área"
// (97-Esteiras/070, TASK-LMA-FE-01), espelhando
// `BatchModuleAreaTransferRequest::rules()` (contrato de API §4.3): `date`
// obrigatório + XOR dos 3 destinos (`area_uuid`/`grazing_uuid`/
// `feedlot_corral_uuid`) — exatamente 1 dos 3 preenchido, nunca 0 nem 2+.
//
// A LIMPEZA mútua em tempo real (selecionar Área limpa Módulo/Curral) é
// comportamento de CASCATA (`useWatch`+`useEffect`), implementada em
// `TASK-LMA-FE-04` — este schema cobre só a validação de SUBMIT.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const batchModuleAreaTransferSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.loteModuloArea.batchModuleAreaTransfer.form.validation;

  // Roda 1x por campo do trio; válido só quando exatamente 1 dos 3 está
  // preenchido — rejeita tanto "nenhum preenchido" quanto "2+ preenchidos"
  // (mirror `BatchModuleAreaTransferRequest::rules()` + `withValidator()`).
  // Acesso via `ctx.parent.<campo>` (não desestruturado — evita
  // `this`/camelcase de identificador snake_case), mirror
  // `changeBatchModuleArea-schema.ts`.
  const destinationField = () =>
    yup
      .string()
      .nullable()
      .test(
        'destination-xor',
        messages.destinationRequired,
        (_value: string | null | undefined, ctx: yup.TestContext) => {
          const parent = ctx.parent as {
            area_uuid?: string | null;
            grazing_uuid?: string | null;
            feedlot_corral_uuid?: string | null;
          };
          const filled = [parent.area_uuid, parent.grazing_uuid, parent.feedlot_corral_uuid].filter(
            (value) => value != null && value !== ''
          ).length;
          return filled === 1;
        }
      );

  return yup.object({
    date: v.string(),
    area_uuid: destinationField(),
    grazing_uuid: destinationField(),
    feedlot_corral_uuid: destinationField(),
  });
};

export const batchModuleAreaTransferSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(batchModuleAreaTransferSchema(languageGB)) as any;

export default batchModuleAreaTransferSchemaResolver;
