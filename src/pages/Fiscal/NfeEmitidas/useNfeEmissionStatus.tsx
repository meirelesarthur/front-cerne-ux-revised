// src/pages/Fiscal/NfeEmitidas/useNfeEmissionStatus.tsx
// -----------------------------------------------------------------------------
// Hook de Query — Status de Emissão SEFAZ (GAP-FE-036-402, TASK-FE-036-511).
// Hidrata número/chave/recibo/data de envio de uma NFe já `aprovada`/
// `cancelada`/`rejeitada` sem exigir clique manual em "Consultar"
// (TASK-FE-036-514, fora desta onda) — reusa `GET /nfes/{uuid}/emission-status`
// (leitura PURA, `NfeDocumentController::emissionStatus()`, NUNCA chama a
// SEFAZ).
//
// `enabled: estado !== 'novo'` — uma NFe `novo` nunca tem campos satélite
// persistidos (guarda que evita 1 request inútil por NFe ainda não emitida).
// `staleTime` alto + `refetchOnWindowFocus: false` garantem 1 disparo por
// carregamento de tela (nunca a cada re-render do componente que consome
// este hook, contrato de tela TASK-FE-036-511).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getNfeEmissionStatus } from '@/services/v2/Fiscal/nfe-service';

import type { NfeEmissionResult, NfeEstado } from '@/@types/v2/Nfes';

export function useNfeEmissionStatus(nfeUuid: string | undefined, estado: NfeEstado | undefined) {
  return useQuery<NfeEmissionResult>({
    queryKey: [queryKey.nfes.nfe, nfeUuid, 'emission'],
    queryFn: async () => {
      if (!nfeUuid) {
        throw new Error('nfeUuid is required');
      }
      const response = await getNfeEmissionStatus(nfeUuid);
      return response.data;
    },
    enabled: !!nfeUuid && estado !== 'novo',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
