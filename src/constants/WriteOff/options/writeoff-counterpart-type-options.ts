// src/constants/WriteOff/options/writeoff-counterpart-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do Select ESTÁTICO "Tipo de Baixa" da baixa INDIVIDUAL
// (`WriteOffCreateModal`, `TASK-036-GB-07/08`) — mirror do padrão canônico
// `{entidade}-status-options.ts` (Map + rótulos via `languageGB`, NUNCA
// array inline no `.tsx`). Universo por segmento vem de
// `WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT` (fonte única, compartilhada com o
// schema Yup).
//
// `disabledTypes` — disponibilidade CONDICIONAL de `I`/`E` (handshake §2):
// quando a rota `income-options`/`expense-options` do título aberto vier
// vazia, a option correspondente chega aqui já marcada `disabled: true` +
// rótulo com o sufixo do tooltip (`Select.tsx` não expõe tooltip por opção
// — adaptação declarada: o aviso vira parte do label da option desabilitada).
// -----------------------------------------------------------------------------

import { WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT } from '@/constants/WriteOff/writeoff-counterpart-type';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { WriteOffCounterpartType, WriteOffSegment } from '@/@types/v2/WriteOff';

function labelFor(type: WriteOffCounterpartType, languageGB: LanguageDate): string {
  const labels = languageGB.writeOff.form.counterpartTypeOptions;
  const map: Record<WriteOffCounterpartType, string> = {
    M: labels.bankMovement,
    B: labels.crossed,
    D: labels.nfeReturn,
    I: labels.incomeCross,
    E: labels.expenseCross,
    C: labels.cardBill,
  };
  return map[type];
}

function getWriteOffCounterpartTypeOptions(
  segment: WriteOffSegment,
  languageGB: LanguageDate,
  disabledTypes: Partial<Record<WriteOffCounterpartType, boolean>> = {}
): Array<Option<WriteOffCounterpartType>> {
  const tooltip = languageGB.writeOff.form.counterpartUnavailableTooltip;

  return WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT[segment].map((type) => {
    const isDisabled = !!disabledTypes[type];
    return {
      label: isDisabled ? `${labelFor(type, languageGB)} (${tooltip})` : labelFor(type, languageGB),
      value: type,
      disabled: isDisabled,
    };
  });
}

export const writeOffCounterpartTypeOptions = { getWriteOffCounterpartTypeOptions };

export { getWriteOffCounterpartTypeOptions };
