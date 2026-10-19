// src/pages/BaseRegistrations/Troughs/useTroughs.tsx
// -----------------------------------------------------------------------------
// Hooks PRÓPRIOS de Cochos (Trough) — TASK-FE-2202. Encapsulam a lógica
// realmente compartilhada do formulário: buscar o registro em edição
// (`useTroughForm`, mirror `useCostCenterForm`) e buscar `GET /troughs/
// options` (contrato de API §6, 1 chamada agregadora) traduzindo o
// resultado em `Option[]` prontos para os 3 `Select` de localização (Área/
// Módulo Pastejo/Curral) — mapeamento de contagem (`troughs_count`) e de
// rótulo composto (`identification — name`) do Curral. Wrapper justificado
// pelo protocolo v2 ("wrapper só existe quando encapsula lógica real") — o
// resto do formulário (XOR Área×Módulo, semântica de Curral, submit) fica
// INLINE em `CreateOrUpdateTrough.tsx`, sem `useTroughForm` monolítico
// (padrão de wrapper "faz tudo" proibido no `BaseRegistrations`).
//
// `currentTroughUuid` — SÓ em edição (contrato de API §6, verificado por
// leitura direta de `TroughController::options()`): mantém visível na lista
// o Curral HOJE vinculado a ESTE Cocho, mesmo que "ocupado" (por ele mesmo).
// Mirror exato de `useDrinkingFountainOptions` (`DrinkingFountains/
// useDrinkingFountains.tsx`, mesma anatomia, mesma execução 029).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import {
  getTroughByUuid,
  listTroughOptions,
} from '@/services/v2/BaseRegistrations/troughs-service';

import type { Option } from '@/@types/option';
import type { TroughData, TroughOptions } from '@/@types/v2/BaseRegistrations/troughs';

interface UseTroughFormProps {
  registrationId?: string;
  fillForm: (data: TroughData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useCostCenterForm`/`useGrazingByUuid` inline.
export function useTroughForm({ registrationId, fillForm }: UseTroughFormProps) {
  return useCustomFormQueryByGuid<TroughData>({
    registrationId,
    queryKey: queryKey.troughs.trough,
    asyncFunction: getTroughByUuid,
    fillForm,
  });
}

interface UseTroughOptionsResult {
  isLoading: boolean;
  areaOptions: Option<string>[];
  grazingOptions: Option<string>[];
  feedlotCorralOptions: Option<string>[];
}

/**
 * 1 única chamada que popula os 3 Selects de localização do formulário
 * (Área/Módulo Pastejo/Curral, com contagens) — contrato de API §6/D4, NUNCA
 * 3 chamadas separadas. `queryKey.troughs.options` é a EXCEÇÃO documentada
 * sem par de tradução (mirror `packages.options`).
 * @param {string} [currentTroughUuid] - uuid do Cocho em edição (ausente na criação)
 *   — repassado ao backend para manter visível o Curral hoje vinculado a
 *   este registro na lista de "disponíveis".
 * @return {UseTroughOptionsResult} opções já traduzidas para `Option[]` + `isLoading`.
 */
export function useTroughOptions(currentTroughUuid?: string): UseTroughOptionsResult {
  const optionsQuery = useQuery({
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryKey: [queryKey.troughs.options, currentTroughUuid],
    queryFn: async () => {
      const envelope = await listTroughOptions({ trough_uuid: currentTroughUuid });
      return envelope.data;
    },
    retry: false,
  });

  const options = optionsQuery.data as TroughOptions | undefined;

  return {
    isLoading: optionsQuery.isLoading,
    areaOptions: (options?.areas ?? []).map((area) => ({
      label: `${area.description} (${area.troughs_count})`,
      value: area.uuid,
    })),
    grazingOptions: (options?.grazings ?? []).map((grazing) => ({
      label: `${grazing.description} (${grazing.troughs_count})`,
      value: grazing.uuid,
    })),
    feedlotCorralOptions: (options?.feedlot_corrals ?? []).map((corral) => ({
      label: corral.name ? `${corral.identification} — ${corral.name}` : corral.identification,
      value: corral.uuid,
    })),
  };
}
