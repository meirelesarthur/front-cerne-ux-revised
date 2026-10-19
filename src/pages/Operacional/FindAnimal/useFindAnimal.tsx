// src/pages/Operacional/FindAnimal/useFindAnimal.tsx
// -----------------------------------------------------------------------------
// Hook de orquestração (Lei 3) da tela "Localizar Animal" (FindAnimal —
// Operacional > Pecuária > Manejo, F-042, TASK-FA-FE-02). Concentra:
//
//   - dossiê: `useCustomFormQueryByGuid<FindAnimalData>` — `registrationId`
//     vazio desabilita a query (nenhum request antes de escolher um animal,
//     contrato de tela §6.5 "estado vazio"); `fillFindAnimalDossier` é
//     função NOMEADA que popula estado local (precedente de tela read-only,
//     contrato de tela §6.3 — esta tela NÃO é um formulário editável, não há
//     `dirtyFields` a guardar).
//   - mutação: `useRequest` da transferência de lote
//     (SURF-ACTION-SALVAR-TRANSFER / SURF-SIDEEFFECT-CHANGE-BATCH), corpo
//     EXATO `{ batch_uuid }` (contrato de tela §5.2/§6.4).
//
// Nenhum `fetch`/`axios` aqui — tudo delega a `find-animal-service.ts`.
// Nenhum `useState` de loading/erro de request, nenhum `useQuery` cru (Lei 4).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  getFindAnimalLocation,
  transferAnimalBatch,
} from '@/services/v2/Livestock/find-animal-service';

import type {
  FindAnimalBatchTransferRequest,
  FindAnimalData,
} from '@/@types/v2/Livestock/findAnimal';

import type { UseQueryResult } from '@tanstack/react-query';

interface UseFindAnimalProps {
  /** `uuid` do animal em foco — `undefined`/`''` desabilita a query do dossiê (estado vazio, §6.5). */
  animalUuid?: string;
  /**
   * Callback opt-in disparado após a transferência de lote ter sucesso.
   * O hook não conhece o formulário/`Controller` do Select de destino
   * (`BatchTransferForm.tsx`, TASK-FA-FE-05) — quem consome este hook decide
   * o round-trip de UI (ex.: `reset()` do select ao placeholder).
   */
  onTransferBatchSuccess?: () => void;
}

export function useFindAnimal({ animalUuid, onTransferBatchSuccess }: UseFindAnimalProps) {
  const { languageGB } = useLanguage();

  const [dossier, setDossier] = useState<FindAnimalData | null>(null);

  // Lei 2 — função NOMEADA (nunca arrow inline em `useEffect`). Popula
  // estado local a cada carga/refetch bem-sucedido do dossiê.
  function fillFindAnimalDossier(data: FindAnimalData) {
    setDossier(data);
  }

  // DÍVIDA TÉCNICA (TASK-FA-FE-05, limpeza da própria fatia) — o hook
  // COMPARTILHADO `useCustomFormQueryByGuid` (`@/hooks/useCustomFormQueryByGuid`,
  // consumido por mais de 100 telas do projeto) anota seu retorno como
  // `Response<TData>`, mas o objeto real em runtime É o `UseQueryResult` que
  // `useQuery` devolve internamente — mentira de tipo na ORIGEM do hook
  // compartilhado. Não é alterável aqui: mudar a assinatura de um hook usado
  // por >100 telas está fora do escopo desta fatia e é risco de regressão
  // generalizada (ver `AGENTS.md`/contrato do Executor — bloqueio externo,
  // não se arrasta risco para fora da Tarefa). O cast fica CENTRALIZADO
  // nesta ÚNICA linha, no ponto de DEFINIÇÃO do hook orquestrador local,
  // em vez de repetido no ponto de CONSUMO (`index.tsx`, dívida da Tarefa
  // 03/04 — resolvida agora).
  const dossierQueryUntyped = useCustomFormQueryByGuid<FindAnimalData>({
    registrationId: animalUuid ?? '',
    queryKey: queryKey.findAnimals.findAnimal,
    asyncFunction: getFindAnimalLocation,
    fillForm: fillFindAnimalDossier,
  });
  const dossierQuery = dossierQueryUntyped as unknown as UseQueryResult<FindAnimalData>;

  // `personalizedMessage` cobre D3 (manifesto FID-G3F §4) — o legado não dá
  // nenhum retorno visual na transferência; a Lei "nenhum estado silencioso"
  // do design system exige o toast de sucesso.
  const transferBatchMutation = useRequest<null>({
    asyncFunction: (body: FindAnimalBatchTransferRequest) => transferAnimalBatch(animalUuid!, body),
    typesRequest: 'update',
    entityName: languageGB.livestock.findAnimal.singularLabel,
    personalizedMessage: languageGB.livestock.findAnimal.transfer.successToast,
    queryKey: queryKey.findAnimals.findAnimal,
    actionSuccess: () => {
      onTransferBatchSuccess?.();
    },
  });

  return {
    dossier,
    dossierQuery,
    transferBatchMutation,
  };
}
