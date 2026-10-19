// src/validations/schemas/ModuleWeighing/finish-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup da tela de Finalização (FE-SCR-04, `TASK-MWG-FE-07`) — corpo
// real: a hidratação do `GET finish` não tem campos editáveis obrigatórios
// além do vínculo OPCIONAL de DFe (`dfe_uuid`, GAP-PES-08) — a confirmação
// em si não exige nenhum outro dado do usuário (efeito de estoque é
// inteiramente do servidor). Schema mínimo, validação real vive na API.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const moduleWeighingFinishSchema = (languageGB: LanguageDate) => {
  void languageGB; // sem mensagens de validação nesta tela (ver racional acima).
  return yup.object({
    dfeUuid: yup.string().nullable().defined(),
  });
};

export const moduleWeighingFinishSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(moduleWeighingFinishSchema(languageGB)) as any;
