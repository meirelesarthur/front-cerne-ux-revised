// src/constants/Fiscal/mdfe-tipo-carga-options.ts
// -----------------------------------------------------------------------------
// Opções do enum `MdfeTipoCarga` (`01`..`11`, mirror `MdfeTpCargaEnum` do
// backend, LK006, `CONTRATO-API-MDFE.md §3`) — TASK-MDFE-FE-01. Rótulos
// SEMPRE via i18n (`mdfes.mdfe.tipoCarga.tc01..tc11`), nunca hardcoded no
// enum (mirror observação do próprio `CONTRATO-API-MDFE.md §3`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MdfeTipoCarga } from '@/@types/v2/Fiscal/Mdfe';

const TIPOS_CARGA: MdfeTipoCarga[] = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
];

function options(languageGB: LanguageDate): Option<MdfeTipoCarga>[] {
  const text = languageGB.mdfes.mdfe.tipoCarga;
  return TIPOS_CARGA.map((value) => ({
    label: text[`tc${value}` as keyof typeof text],
    value,
  }));
}

function getLabel(value: MdfeTipoCarga | null | undefined, languageGB: LanguageDate): string {
  if (!value) return '—';
  return options(languageGB).find((option) => option.value === value)?.label ?? value;
}

export const mdfeTipoCargaOptions = { options, getLabel };

export default mdfeTipoCargaOptions;
