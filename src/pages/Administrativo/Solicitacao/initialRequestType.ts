// src/pages/Administrativo/Solicitacao/initialRequestType.ts
// Pré-seleção do TIPO da solicitação a partir da URL (`?tipo=S`), usada pela
// porta de entrada da nova OS ("Contratar um serviço de fora" → tipo Serviço).
// Só vale na criação; valor fora do enum é ignorado (o formulário nasce vazio,
// como antes). Nenhuma mudança de contrato: o tipo continua escolhido no form.

import {
  requestPurchaseType,
  type RequestPurchaseType,
} from '@/constants/RequestPurchases/request-purchase-type';

const VALID_TYPES = new Set<string>(Object.values(requestPurchaseType));

export function getInitialRequestType(
  search: string,
  isEditing: boolean
): RequestPurchaseType | null {
  if (isEditing) return null;
  const value = new URLSearchParams(search).get('tipo')?.trim().toUpperCase();
  return value && VALID_TYPES.has(value) ? (value as RequestPurchaseType) : null;
}
