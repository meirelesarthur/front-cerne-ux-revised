// src/validations/schemas/FeedlotCorrals/feedlotCorralWizard-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do WIZARD standalone de Curral (FeedlotCorral) —
// TASK-043-CUR-T03 (`03-Wizard-Casca-Etapa1.md`), DEC-043-CURRAIS-FORM.
//
// COMPÕE (via `.shape()`, nunca modifica) os 2 schemas shared do diálogo do
// Mapa, que ficam INTOCADOS (contrato de tela §9, não-regressão):
//   - `feedlotCorralSchema(lang, requireStatus)` — os 11 campos base do CRUD
//     cru (`name`/`installation_type`/`status`/`width`/`length`/`capacity`/
//     `coverage`/`floor`/`shading`/`trough_uuid`/`drinking_fountain_uuid`),
//     TASK-FE-042-206.
//   - Regra `available_at`/`note` — mesmo `.when('status', ...)` condicional
//     de `feedlotCorralStatus-schema.ts` (IG-009, FID-G3F §6 Etapa 1),
//     reusando a MESMA constante `FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED`
//     (nunca uma cópia divergente do conjunto `['VS','LI','MA','FE']`).
//     Reproduzido aqui (não importado o `.object()` inteiro) porque o alvo é
//     um único schema composto do wizard, não dois objetos Yup separados
//     rodando sobre o mesmo `status`.
//
// ADITIVO exclusivo desta tela:
//   - `feedlot_sector_uuid` (FM-003, GAP-API-03) — sempre obrigatório (o
//     campo é só READONLY em alguns modos, nunca ausente de valor).
//   - `batches` (Etapa 3) — placeholder de FORMA (array de linhas), SEM
//     regra de obrigatoriedade: a UI real (`useFieldArray`, cascata
//     espécie→categorias, resumos) só chega na T05; validar aqui bloquearia
//     o wizard antes de existir uma etapa para preenchê-lo.
//
// `stepFields(step)` — mapa etapa→campos consumido pelo `trigger()` do RHF
// antes de avançar/trocar aba (IG-001, AC-012/014). `identification` NUNCA
// aparece — não é campo RHF (mirror `FeedlotCorralDialog.tsx`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FeedlotCorralWizardForm } from '@/@types/v2/FeedlotCorrals';

import { feedlotCorralSchema } from './feedlotCorral-schema';
import { FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED } from './feedlotCorralStatus-schema';

// Etapas do wizard, na ordem das abas (`useCustomSearch`/`Tabs.Root`, mirror
// §6 do contrato de tela). `dimensoesEstrutura`/`lotes` só ganham conteúdo
// real nas T04/T05 — os NOMES já existem para o `trigger()` por etapa não
// precisar ser reescrito quando esses passos chegarem.
export const FEEDLOT_CORRAL_WIZARD_STEPS = [
  'identificacaoSituacao',
  'dimensoesEstrutura',
  'lotes',
] as const;

export type FeedlotCorralWizardStep = (typeof FEEDLOT_CORRAL_WIZARD_STEPS)[number];

// Mirror `requiresDetail` (`feedlotCorralStatus-schema.ts`) — mesma
// constante, sem duplicar o conjunto de status.
export function requiresStatusDetail(status: Option<string> | null | undefined): boolean {
  return (
    !!status && (FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED as readonly string[]).includes(status.value)
  );
}

export const feedlotCorralWizardSchema = (languageGB: LanguageDate, requireStatus: boolean) => {
  const sectorMsgs = languageGB.feedlotCorrals.feedlotCorral.form.validation;
  const statusMsgs = languageGB.feedlotMap.feedlotMap.status.validation;

  return feedlotCorralSchema(languageGB, requireStatus).shape({
    feedlot_sector_uuid: yup.object().nullable().required(sectorMsgs.feedlotSectorRequired),
    available_at: yup
      .string()
      .nullable()
      .when('status', {
        is: (status: Option<string> | null) => requiresStatusDetail(status),
        then: (schema) => schema.required(statusMsgs.availableAtRequired),
      }),
    note: yup
      .string()
      .nullable()
      .max(1500, statusMsgs.noteMaxLength)
      .when('status', {
        is: (status: Option<string> | null) => requiresStatusDetail(status),
        then: (schema) => schema.required(statusMsgs.noteRequired),
      }),
    // Etapa 3 (T05) — só a FORMA (array de linhas); sem `.required()` por
    // linha/array enquanto a UI de lotes não existe nesta tarefa.
    batches: yup.array().of(yup.object({ batch_uuid: yup.object().nullable() })),
  } as any);
};

export const feedlotCorralWizardSchemaResolver = (
  languageGB: LanguageDate,
  requireStatus: boolean
) => yupResolver(feedlotCorralWizardSchema(languageGB, requireStatus) as any);

export function stepFields(step: FeedlotCorralWizardStep): (keyof FeedlotCorralWizardForm)[] {
  switch (step) {
    case 'identificacaoSituacao':
      return ['feedlot_sector_uuid', 'name', 'installation_type', 'status', 'available_at', 'note'];
    case 'dimensoesEstrutura':
      return [
        'width',
        'length',
        'capacity',
        'coverage',
        'floor',
        'shading',
        'trough_uuid',
        'drinking_fountain_uuid',
      ];
    case 'lotes':
      return ['batches'];
    default:
      return [];
  }
}

export default feedlotCorralWizardSchemaResolver;
