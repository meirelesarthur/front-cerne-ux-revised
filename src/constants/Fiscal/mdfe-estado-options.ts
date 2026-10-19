// src/constants/Fiscal/mdfe-estado-options.ts
// -----------------------------------------------------------------------------
// Opções + mapa de cor do enum `MdfeEstado` (`novo`/`aprovado`/`rejeitado`/
// `cancelado`, mirror `MdfeEstadoEnum` do backend, `CONTRATO-API-MDFE.md §3`)
// — TASK-MDFE-FE-01. Mirror ESTRUTURAL de `nfe-estado-options.ts`.
//
// SEM `default` silencioso no mapa de cor — as 4 chaves do enum são
// exaustivas (`Record<MdfeEstado, ...>`).
//
// ⚠️ `MDFE_EDITABLE_ESTADOS` é DIFERENTE do conjunto de Nfe (`AC009`: "editar
// somente estado != aprovado") — inclui `cancelado`, não copiar de
// `nfe-estado-options.ts` às cegas. `MDFE_DELETABLE_ESTADOS` (`AC010`) SIM é
// igual ao de Nfe.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MdfeEstado } from '@/@types/v2/Fiscal/Mdfe';

/** Mapa de cor do Badge (Chakra `colorPalette`) por estado — SEM `default`. */
export const mdfeEstadoColor: Record<MdfeEstado, string> = {
  novo: 'gray',
  aprovado: 'green',
  rejeitado: 'red',
  cancelado: 'orange',
};

// AC009: "editar somente estado != aprovado" — DIFERENTE do conjunto
// editável de Nfe (novo/rejeitado apenas). Em Mdfe, `cancelado` também é
// editável (fidelidade ao legado).
export const MDFE_EDITABLE_ESTADOS: MdfeEstado[] = ['novo', 'rejeitado', 'cancelado'];

export function isMdfeEditable(estado: MdfeEstado): boolean {
  return MDFE_EDITABLE_ESTADOS.includes(estado);
}

// AC010: exclusão só novo/rejeitado — este SIM é igual ao conjunto de Nfe.
export const MDFE_DELETABLE_ESTADOS: MdfeEstado[] = ['novo', 'rejeitado'];

export function isMdfeDeletable(estado: MdfeEstado): boolean {
  return MDFE_DELETABLE_ESTADOS.includes(estado);
}

function options(languageGB: LanguageDate): Option<MdfeEstado>[] {
  const text = languageGB.mdfes.mdfe.estadoOptions;
  return [
    { label: text.novo, value: 'novo' },
    { label: text.aprovado, value: 'aprovado' },
    { label: text.rejeitado, value: 'rejeitado' },
    { label: text.cancelado, value: 'cancelado' },
  ];
}

function getLabel(estado: MdfeEstado | null | undefined, languageGB: LanguageDate): string {
  if (!estado) return '—';
  return options(languageGB).find((option) => option.value === estado)?.label ?? estado;
}

export const mdfeEstadoOptions = { options, getLabel };

export default mdfeEstadoOptions;
