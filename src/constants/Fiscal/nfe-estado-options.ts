// src/constants/Fiscal/nfe-estado-options.ts
// -----------------------------------------------------------------------------
// Opções + mapa de cor do enum `NfeEstado` (`novo`/`aprovado`/`rejeitado`/
// `cancelado`, mirror `NfeEstadoEnum` do backend, contrato de API §3) —
// TASK-FE-036-402. Cores SUGERIDAS pelo contrato de tela §3 (ajustáveis em
// revisão sem reabrir contrato): `novo→gray`, `aprovado→green`,
// `rejeitado→red`, `cancelado→orange`.
//
// SEM `default` silencioso no mapa de cor — as 4 chaves do enum são
// exaustivas (`Record<NfeEstado, ...>`), então um 5º valor inesperado do
// backend quebra a compilação em vez de cair num fallback mudo (mirror
// `request-purchase-status.ts`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { NfeEstado } from '@/@types/v2/Nfes';

/** Mapa de cor do Badge (Chakra `colorPalette`) por estado — SEM `default`. */
export const nfeEstadoColor: Record<NfeEstado, string> = {
  novo: 'gray',
  aprovado: 'green',
  rejeitado: 'red',
  cancelado: 'orange',
};

/** Estados em que edição/exclusão são permitidas (mirror doc bruta
 *  `mode_matrix.edit.guard`/`destroy.UI_guard`, contrato de tela §3/§4.1). */
export const NFE_EDITABLE_ESTADOS: NfeEstado[] = ['novo', 'rejeitado'];

export function isNfeEditable(estado: NfeEstado): boolean {
  return NFE_EDITABLE_ESTADOS.includes(estado);
}

function options(languageGB: LanguageDate): Option<NfeEstado>[] {
  const text = languageGB.nfes.nfe.estadoOptions;
  return [
    { label: text.novo, value: 'novo' },
    { label: text.aprovado, value: 'aprovado' },
    { label: text.rejeitado, value: 'rejeitado' },
    { label: text.cancelado, value: 'cancelado' },
  ];
}

function getLabel(estado: NfeEstado | null | undefined, languageGB: LanguageDate): string {
  if (!estado) return '—';
  return options(languageGB).find((option) => option.value === estado)?.label ?? estado;
}

export const nfeEstadoOptions = { options, getLabel };

export default nfeEstadoOptions;
