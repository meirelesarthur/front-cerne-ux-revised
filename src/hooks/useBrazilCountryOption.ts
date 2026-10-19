// src/hooks/useBrazilCountryOption.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-03 (I1, D1 do dono) — resolve o Brasil como `Option` de País
// para o formulário de Contratante, SEM uuid hardcoded: o uuid varia por
// ambiente/seed; o que é estável é `countries.codigo` (IBGE 1058,
// `BRAZIL_COUNTRY_CODE`).
//
// Contrato consumido: `GET /countries/options?codigo=1058` (API-D1,
// `TASK-072-API-03` 3.2c). O `find(isBrazilCountry)` sobre a resposta é a
// rede de segurança caso o filtro devolva mais de um item (ou o back ainda
// ignore o param): nunca escolhe um país que não seja o Brasil — ausência =
// `null` (estado honesto; o schema acusa `required` no submit e o
// `ErrorLogPanel` registra a falha de rede pelo interceptor).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { BRAZIL_COUNTRY_CODE, isBrazilCountry } from '@/constants/countries';
import { queryKey } from '@/constants/query-key';

import { listCountryOptions } from '@/services/v2/Countries/country-service';

import type { Option } from '@/@types/option';
import type { CountryOptionItem } from '@/@types/v2/Countries';

export type BrazilCountryOption = Option<string> & { codigo: number };

/**
 * Seleciona o Brasil (por `codigo`) numa lista de opções de País.
 * @param {CountryOptionItem[]} items - Itens devolvidos por `GET /countries/options`.
 * @return {BrazilCountryOption | null} Option do Brasil ou `null` quando ausente.
 */
export function pickBrazilCountryOption(items: CountryOptionItem[]): BrazilCountryOption | null {
  const brazil = items.find((item) => isBrazilCountry(item));
  if (!brazil) return null;
  return { label: brazil.nome, value: brazil.uuid, codigo: Number(brazil.codigo) };
}

/**
 * Query do Brasil como Option de País (default fixo do create de Contratante).
 * @param {Object} [options] - `options.enabled` permite pular a busca (ex.: edição).
 * @return {Object} Query TanStack com a Option do Brasil (ou `null`).
 */
export function useBrazilCountryOption({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [queryKey.baseRegistrations.tenant, 'brazil-country'],
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const response = await listCountryOptions({ codigo: BRAZIL_COUNTRY_CODE });
      return pickBrazilCountryOption(response.data.items);
    },
  });
}
