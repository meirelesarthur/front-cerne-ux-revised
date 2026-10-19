import type { Option } from '@/@types/option';

// Hidrata o Option inicial de um select de FK a partir de uuid + nome do GET /configs.
// Nome ausente (null/vazio) -> fallback para o uuid; uuid ausente -> sem seleção.
export function toLookupOption(
  uuid: string | null | undefined,
  nome: string | null | undefined
): Option<string> | null {
  if (!uuid) return null;
  return { label: nome || uuid, value: uuid };
}

// Labels compartilhados entre `mapOptions` da lista e a hidratação inicial (devem ser idênticos).
export function partnerLabel(
  nickname: string | null | undefined,
  name: string | null | undefined
): string {
  return `${nickname} — ${name}`;
}

export function planRoleLabel(
  name: string | null | undefined,
  price: string | number | null | undefined
): string {
  return `${name} - R$ ${price}`;
}
