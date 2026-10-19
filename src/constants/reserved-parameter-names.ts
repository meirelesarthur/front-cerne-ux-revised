// src/constants/reserved-parameter-names.ts
// -----------------------------------------------------------------------------
// Lista dos 5 nomes-máscara RESERVADOS de Parâmetros (Parameter) — execução
// 031, TASK-FE-031-40. Mirror 1:1 de `config('parameters.reserved_names')` no
// backend (GAP-BE-511-parameters, decisão do dono 2026-08-06: [APROVADO —
// Opção A] — travar `destroy` E rename via config).
//
// Default CLIENT-SIDE enquanto o `ParameterResource` não expõe `is_reserved`
// computado no servidor (recomendação registrada em
// contrato-front-parametros.md §"Leitura do dev" / decisoes-do-dono-031.md
// "Addendum técnico recomendado", ainda não aplicada no backend). Se o
// backend adicionar a flag, trocar o consumo desta constante por
// `parameter.is_reserved` nas telas 41/42 — NÃO duplicar a lista em outro
// lugar do projeto (checar `grep -r "CATEGF"` antes de reabrir esta Tarefa).
//
// Risco aceito e documentado (contrato §9): se o backend ampliar a lista
// reservada sem avisar o front, esta constante fica desatualizada — o 422 de
// defesa do backend (`extractApiFieldErrorMessage`, ver telas 41/42) cobre
// esse caso; o front NUNCA é a única barreira.
export const RESERVED_PARAMETER_NAMES = [
  'CATEGF',
  'CENTROC',
  'CCONTA',
  'GROUPF',
  'DOCUTP',
] as const;

export type ReservedParameterName = (typeof RESERVED_PARAMETER_NAMES)[number];

export function isReservedParameterName(name: string | undefined | null): boolean {
  if (!name) return false;
  return (RESERVED_PARAMETER_NAMES as readonly string[]).includes(name);
}
