// Tiers Service - API V2
// Baseado no Postman Collection: GB Cerne API v2 > Auth > Tiers

import type { Response } from '@/@types/response-api';
import type { TiersResponse } from '@/@types/v2/Tiers';
import api from '@/services/api';

// ============================================
// GET ENDPOINTS
// ============================================

/**
 * GET /api/v2/tiers
 * Lista os tiers (planos) disponíveis
 * Retorna { individual: TierData[], team: TierData[] }
 */
export async function getTiers() {
  const { data } = await api.V2.get<Response<TiersResponse>>(
    '/tiers'
  );
  return data;
}
