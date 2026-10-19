import type { Option } from '@/@types/option';
import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

// DD-078-04 — texto do fallback quando o payload não traz o rótulo (nunca o uuid).
export const NOT_INFORMED_LABEL = 'Não informado';

// 081 / A-16 — o Encarregado (select "Encarregado") hidrata por
// `second_request_authorizer {uuid, name}` (autorizador escolhido na criação).
// `authorizer` é o autorizador ATUAL do fluxo e muda ao longo das etapas, por isso
// não alimenta o campo. Sem `name`, placeholder honesto (nunca o uuid).
export function buildAuthorizerOption(data: RequestPurchaseData): Option<string> | null {
  const chosen = data.second_request_authorizer;
  if (!chosen) return null;
  return { label: chosen.name || NOT_INFORMED_LABEL, value: chosen.uuid };
}
