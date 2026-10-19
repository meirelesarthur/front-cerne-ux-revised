// src/services/v2/BaseRegistrations/tenant-lookup-service.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-05 (I5) — lookups do form de Contratante (API v1.2):
//   - `GET /tenants/person-by-nif?nif=` (TASK-072-API-03): NIF como digitado;
//   - `GET /tenants/cnpj-lookup?cnpj=`  (TASK-072-API-04): proxy da ReceitaWS
//     no back — o front NUNCA chama o provedor externo.
// Envelope `ApiResponse` desempacotado aqui. 404 vira `null` (não achar é
// resultado esperado, não erro de UI); 422/429/503/rede propagam para o
// chamador (`useTenantNifAutofill`) decidir a mensagem pelo status/`code`.
// SEM `X-Farm-Id` obrigatório — Tenant não é escopado por farm (DA-T01).
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

import api from '@/services/api';

import type {
  CnpjLookupData,
  CnpjLookupEnvelope,
  TenantPersonLookupData,
  TenantPersonLookupEnvelope,
} from '@/@types/v2/BaseRegistrations/tenant/lookup';

function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/**
 * Procura a pessoa já cadastrada pelo CPF/CNPJ.
 * @param {string} nif - Documento como digitado (com ou sem máscara).
 * @return {Promise<TenantPersonLookupData | null>} Pessoa, ou `null` no 404.
 */
async function findPersonByNif(nif: string): Promise<TenantPersonLookupData | null> {
  try {
    const { data } = await api.V2.get<TenantPersonLookupEnvelope>('/tenants/person-by-nif', {
      nif,
    });
    return data.data;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/**
 * Consulta o CNPJ na Receita pelo back (proxy ReceitaWS).
 * @param {string} cnpj - CNPJ com 14 dígitos (com ou sem máscara).
 * @return {Promise<CnpjLookupData | null>} Dados da Receita, ou `null` no 404.
 */
async function lookupCnpj(cnpj: string): Promise<CnpjLookupData | null> {
  try {
    const { data } = await api.V2.get<CnpjLookupEnvelope>('/tenants/cnpj-lookup', { cnpj });
    return data.data;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export { findPersonByNif, lookupCnpj };
