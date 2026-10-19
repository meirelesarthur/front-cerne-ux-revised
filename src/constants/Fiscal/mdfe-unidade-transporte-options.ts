// src/constants/Fiscal/mdfe-unidade-transporte-options.ts
// -----------------------------------------------------------------------------
// Opções de `tp_unid_transp` (LK007, `CONTRATO-API-MDFE.md §3`) —
// TASK-MDFE-FE-01. Catálogo SÓ DO FRONT (não confirmado como enum formal do
// backend — `MdfeRequest::rules()` valida `info_descarga.*.tp_unid_transp`
// apenas como `integer`, sem `Rule::in()`). Tratar como estático de UI, não
// bloquear em 422 se o backend devolver um valor fora desta lista.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const UNIDADES: number[] = [1, 2, 3, 4, 5, 6, 7];

function options(languageGB: LanguageDate): Option<number>[] {
  const text = languageGB.mdfes.mdfe.unidadeTransporte;
  return UNIDADES.map((value) => ({
    label: text[`u${value}` as keyof typeof text],
    value,
  }));
}

function getLabel(value: number | null | undefined, languageGB: LanguageDate): string {
  if (value === null || value === undefined) return '—';
  return options(languageGB).find((option) => option.value === value)?.label ?? String(value);
}

export const mdfeUnidadeTransporteOptions = { options, getLabel };

export default mdfeUnidadeTransporteOptions;
