// src/validations/schemas/Relatorios/animal-movements-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Movimentação/Rebanho"
// (F-224, lote 076, `AnimalMovementReport-contrato.md` §4.4). Mirror
// ESTRUTURAL de `birth-report-filter-schema.ts` (mensagens custom por
// campo), adaptado ao gate real do servidor
// (`AnimalMovementReportRequest::withValidator()`, AF-02): `harvest_uuid` é
// o ÚNICO campo obrigatório — `month` NUNCA satisfaz o gate (REPLICAR-
// IGNORAR) e por isso é `nullable`, sem `.test`/`.required` cruzado com
// `harvest_uuid`.
//
// Mensagem "Selecione uma safra ou um mês." ESPELHA literalmente CL-14 do
// contrato legado (o texto sobrevive na tela mesmo com o mecanismo
// redesenhado — `month` nunca conta para satisfazer o gate, nem no legado
// nem aqui).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`AnimalMovementsReportParams`):
//   harvest_uuid: Option<string> | null
//   month: string | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const animalMovementsReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.animalMovementsReport.report;

  return yup.object({
    harvest_uuid: yup
      .object({ value: yup.mixed(), label: yup.string() })
      .nullable()
      .required(messages.validation.harvestRequired),
    month: yup.string().trim().nullable().default(null),
  });
};

export const animalMovementsReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalMovementsReportFilterSchema(languageGB)) as any;

export default animalMovementsReportFilterSchemaResolver;
