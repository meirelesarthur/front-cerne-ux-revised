// src/validations/schemas/Earnings/earning-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de APURAÇÃO MENSAL (Earning —
// Administrativo, 97-Esteiras/002, Tarefa 08). Mirror mecânico de
// `Advances/advance-schema.ts`: FUNÇÃO que recebe `languageGB` e devolve o
// schema (mensagens i18n do próprio módulo,
// `languageGB.earnings.earning.form.validation`).
//
// `events` — array `min(1)` (Armadilha 3 da Tarefa 08: bloqueio de remover a
// última linha é reforçado AQUI e também no componente, `EventoApuracaoEditor`)
// + `value` numérico por linha (só obrigatório/validado quando
// `method === 1`, Informado — quando `method === 0`, Fixo, o campo é
// readonly e vem preenchido pelo catálogo) + duplicidade de `event.value`
// (uuid) entre linhas validada no `superRefine`-equivalente do Yup
// (`.test()` a nível de ARRAY), mirror do alerta JS legado `IG-04`, agora
// como erro de validação em vez de `alert()`.
//
// `total`/`vl_account`/`vl_cheque` são NUMBER no formulário (conversão já
// feita na hidratação, `CreateOrUpdateEarning.tsx`) — o servidor NUNCA
// recalcula `total` a partir de `events[]` (`GAP-EARNING-01` [AVALIADO]).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const earningSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.earnings.earning.form.validation;

  const eventRowSchema = yup.object({
    event: yup.object().nullable().required(messages.eventValueRequired),
    event_uuid: yup.string().required(messages.eventValueRequired),
    method: yup.number().nullable().required(),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.eventValueRequired)
      .when('method', {
        // `method === 1` (Informado) — valor editável, obrigatório.
        // `method === 0` (Fixo) — valor readonly, já vem do catálogo; ainda
        // assim precisa ser um número válido (>= 0) para entrar no total.
        is: (method: number | null) => method === 1,
        then: (schema) => schema.required(messages.eventValueRequired),
        otherwise: (schema) => schema.notRequired(),
      })
      .test(
        'is-number',
        messages.eventValueRequired,
        (value) => value === undefined || !Number.isNaN(value)
      ),
    conditionLabel: yup.string().nullable(),
    // UT-000716 item 10 — client-only (não vai no payload), governa o
    // lock de linhas pré-existentes no `EventoApuracaoEditor`. Não
    // participa de nenhuma regra de validação.
    isPersisted: yup.boolean().nullable().notRequired(),
  });

  return yup.object({
    function_uuid: yup.object().nullable().required(messages.functionRequired),
    month: yup.number().required(),
    year: yup.number().required(),
    type: yup.string().required(),
    // UT-000714 item 7 — Centro de Custo volta a ser obrigatório no
    // submit (mirror legado, HTML `required`); o select já só lista
    // Analíticos da fazenda ativa (ver `CreateOrUpdateEarning.tsx`).
    center_uuid: yup.object().nullable().required(messages.costCenterRequired),
    team_uuid: yup.object().nullable(),
    proprietary_uuid: yup.object().nullable(),
    total: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.totalRequired)
      .required(messages.totalRequired),
    vl_account: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.vlAccountRequired)
      .required(messages.vlAccountRequired)
      .min(0, messages.vlAccountRequired),
    vl_cheque: yup.number().transform((value) => value ?? 0),
    events: yup
      .array()
      .of(eventRowSchema)
      .min(1, messages.eventsRequired)
      .test('no-duplicate-event', messages.duplicateEvent, (rows) => {
        const uuids = (rows ?? [])
          .map((row) => row?.event_uuid)
          .filter((uuid): uuid is string => !!uuid);
        return new Set(uuids).size === uuids.length;
      }),
  });
};

export const earningSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(earningSchema(languageGB)) as any;

export default earningSchemaResolver;
