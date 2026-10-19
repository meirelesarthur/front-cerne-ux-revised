// src/pages/CadastrosBase/Fornecedores/useProviders.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Fornecedores" (Provider — Cadastros Base).
//
// TASK-PR-FE-02 cobriu a LISTAGEM (`useProviderList`, sem ID pai —
// `useCustomGridQuery`, mesmo padrão de useLowReasonsList/useResourcesList).
// TASK-PR-FE-03 acrescenta `useProviderForm` (`useCustomFormQueryByGuid` —
// detalhe por UUID do PAPEL Provider, DA-PR-14, mesmo padrão de
// `usePeople.tsx`/`useContadorForm`) neste MESMO arquivo (padrão incremental
// já usado em CentroCusto/useCostCenters.tsx e Especies/useSpecies.tsx).
// `GET /providers/{uuid}` agora devolve os 10 campos raiz de Person + city
// (GAP-PR-FE-02 RESOLVIDO por TASK-PR-06/GAP-PR-07, revalidado pelo Tester
// em 2026-07-29) — pré-carga completa da aba "Dados" numa única chamada.
//
// Achatamento do filtro (armadilha #12 do checklist — `type` é enum
// int-backed, escrita SEMPRE em INT) — `paginatedQuery.filter` guarda o
// shape `ProviderFilterForm` (Option<T> completo, útil para re-hidratar o
// drawer com o `_label` embutido no próprio Option — ver
// FilterSideFornecedores.tsx); aqui ele é achatado para `ListProvidersParams`
// (valores crus que `listProviders`/`ProviderFilterData` esperam).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getProviderByUuid,
  listProviders,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ListProvidersParams } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ProviderDetail,
  ProviderFilterForm,
  ProviderListItem,
} from '@/@types/v2/CadastrosBase/provider';

interface UseProviderListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ProviderFilterForm;
}

// Query de listagem paginada de Fornecedores (`GET /api/v1/providers`,
// filtros `search`/`type`/`city_uuid`/`is_enabled` 100% server-side).
export function useProviderList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseProviderListProps) {
  return useCustomGridQuery<ProviderListItem, ListProvidersParams>({
    asyncFunction: listProviders,
    queryKey: queryKey.cadastrosBase.providers,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {
      search: filter?.search || undefined,
      // Presença via ternário (NUNCA `?.value || undefined`) — `type` é
      // enum int-backed (escrita sempre em INT, lição CategoryProduct/
      // PlanAccount); nenhum case vale `0` hoje, mas o padrão é consistente
      // com `isEnabled` abaixo, onde `false` É um valor válido.
      type: filter?.type ? filter.type.value : undefined,
      city_uuid: filter?.city?.value || undefined,
      // Armadilha #11 do checklist: `false` (Inativo) é valor válido — NUNCA
      // `filter?.isEnabled?.value || undefined` (descartaria `false`).
      is_enabled: filter?.isEnabled ? filter.isEnabled.value : undefined,
      // D5 (UT-000773): a API só devolve ativos por padrão; status "Todos"
      // (sem `isEnabled`) precisa pedir inativos explicitamente.
      include_inactive: filter?.isEnabled ? undefined : true,
    },
  });
}

interface UseProviderFormProps {
  registrationId?: string;
}

// Query de detalhe para popular o formulário de criação/edição
// (TASK-PR-FE-03, match por UUID do PAPEL Provider — DA-PR-14, NÃO o uuid da
// Person). `GET /providers/{uuid}` devolve os 10 campos raiz de Person + city
// + todos os campos de papel num único payload (GAP-PR-FE-02 RESOLVIDO) —
// sem 2ª chamada a `/people`.
//
// TASK-PR-FE-10: deixou de receber `fillForm` — a responsabilidade de
// "popular o form" saiu do hook de busca (arquitetura antiga: montar o form
// vazio e populá-lo depois via `reset()`/`replace()` quando o detalhe
// assíncrono chegava — causa raiz de ERRO-02/ERRO-03). Agora é só um
// wrapper fino sobre `useCustomFormQueryByGuid`; único consumidor
// confirmado (`CreateOrUpdateFornecedor.tsx`, grep sem outro caller) lê
// `providerQuery.data` diretamente e computa `defaultValues` síncronos
// ANTES do mount do form (`buildProviderFormDefaultValues`). `fillForm`
// continua obrigatório na assinatura genérica de `useCustomFormQueryByGuid`
// (hook compartilhado por outros módulos, fora do escopo desta correção) —
// aqui passamos um no-op, já que nada mais precisa popular o form a partir
// deste hook.
export function useProviderForm({ registrationId }: UseProviderFormProps) {
  return useCustomFormQueryByGuid<ProviderDetail>({
    registrationId,
    queryKey: queryKey.cadastrosBase.provider,
    asyncFunction: getProviderByUuid,
    fillForm: () => {},
  });
}
