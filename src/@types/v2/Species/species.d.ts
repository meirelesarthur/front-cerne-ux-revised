// src/@types/v2/Species/species.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ESPÉCIES — API v1 do backend Laravel GB.Cerne.
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /species            → data: SpeciesListItem[], meta SEMPRE null
//                                 (confirmado: `index()` do `SpecieAnimalController`
//                                 usa `ApiResponse::success()`, nunca `::paginated()` —
//                                 este recurso NÃO pagina de verdade).
//   DELETE /species/{uuid}     → 204; hoje SEM checagem de dependência
//                                 (`DeleteSpecieAnimalAction` não tem sub-Action
//                                 tipo `CheckCultivationDependenciesAction`) — uma
//                                 Espécie referenciada (Perdas/Nascimentos/Óbitos/
//                                 Vendas/Categorias) produz 500 genérico
//                                 (`ApiExceptionHandler::handleUnexpected()`), NÃO
//                                 um 422/409 estruturado com `errors.in_use[]`.
//                                 TASK-ESP-01 trata isso com o `onError` genérico
//                                 do `useRequest` (toast com a `message` do
//                                 envelope) — ver "Ponto a confirmar com o Tester
//                                 de API" na ficha da tarefa.
//
// Fonte: `SpecieAnimalController`/`SpecieAnimalRequest`/`SpecieAnimalResource`/
// `SpeciesTest.php` (`api_root`), batidos linha a linha em TASK-ESP-01. Campo é
// `description` (NÃO `name`). `cost_center_id` é FK numérica hoje, NÃO exibida
// nesta listagem (ver TASK-ESP-02, que migra para `cost_center_uuid`).
//
// TASK-ESP-02 (leitura de código, 2026-07-17): `TASK-ESP-API-01` já foi
// entregue — `SpecieAnimalResource` (usado por `index()` E `show()`, mesmo
// Resource para os dois) expõe `cost_center: { uuid, code, description } | null`
// (Resource aninhado, nunca mais `cost_center_id` cru) e `SpecieAnimalRequest`
// aceita `cost_center_uuid` (nullable) — confirmado lendo
// `app/Http/Resources/V1/SpecieAnimalResource.php` e
// `app/Http/Requests/Api/V1/SpecieAnimalRequest.php` no `api_root`.
// `SpeciesListItem`/`SpeciesListEnvelope` abaixo (herdados de `ESP-01`) ficam
// como estão porque a grid desta Tarefa não exibe/edita Centro de Custo (fora
// de escopo de `ESP-02`) — `cost_center_id` já não reflete o Resource real
// (que hoje devolve `cost_center` aninhado também no `index()`), mas nenhum
// consumidor deste tipo lê esse campo. Ver `SpecieData` abaixo para o shape
// real usado pelo formulário desta Tarefa.
// -----------------------------------------------------------------------------

import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { Option } from '@/@types/option';

// ============================================
// SPECIES (resposta da API)
// ============================================

export interface SpeciesListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  /** FK numérica real hoje — NÃO exibida na listagem; ver TASK-ESP-02 para a migração a `cost_center_uuid`. */
  cost_center_id: number | null;
}

// ============================================
// SPECIE DETAIL / FORM (TASK-ESP-02 — pós TASK-ESP-API-01)
// ============================================

// `GET /species/{uuid}` — mesmo `SpecieAnimalResource` do `index()`, shape
// aninhado consistente com `CostCenterResource`/`CostCenterRef` do front
// (reaproveitado, não uma cópia — ver Select de Centro de Custo no form).
export interface SpecieData {
  uuid: string;
  description: string;
  is_enabled: boolean;
  cost_center: CostCenterRef | null;
}

// Payload de escrita (`POST`/`PUT /species`) — espelha `SpecieAnimalData`
// (`api_root`): `description`/`is_enabled` sempre presentes no create;
// `cost_center_uuid` nullable/opcional (omitido no PUT quando não fizer parte
// do delta de `dirtyFields` — ver `tryPersistSpecie` em
// `CreateOrUpdateEspecie.tsx`).
export interface SpeciePayload {
  description?: string;
  is_enabled?: boolean;
  cost_center_uuid?: string | null;
}

// React Hook Form — `cost_center_uuid` guarda o Option INTEIRO
// (`SelectAsyncPaginate`, mesmo padrão de `parent_uuid` em
// `CostCenterForm`/`CreateOrUpdateCentroCusto.tsx`), convertido para
// `cost_center_uuid: string | null` só no submit. `is_enabled` é `boolean`
// puro (não `Option`) — mesmo padrão do campo de status em
// `Cultivation/CreateOrUpdateCultivation.tsx` (`Select` com
// `options: [{value:true,...},{value:false,...}]`, sem Switch).
export interface SpecieForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
  cost_center_uuid: Option<string> | null;
}

// ============================================
// ENVELOPE (ApiResponse::success — SEM paginação real)
// ============================================

export interface SpeciesListEnvelope {
  success: boolean;
  message: string;
  data: SpeciesListItem[];
  errors: Record<string, string[]> | null;
  /** SEMPRE null para este recurso — `index()` nunca usa `ApiResponse::paginated()`. */
  meta: null;
}

// ============================================
// OPTIONS (lookup enxuto — GAP-FE-206, correção pós-E2E 2026-08-03)
// ============================================

// `GET /species/options` (`SpecieAnimalOptionResource`) — uuid+label, SEM
// `specie_view` (GAP-BE-040 Opção B). Achado real desta correção: o
// `index()` (`/species`, usado por `listSpecies`) EXIGE `specie_view` — um
// operador de rebanho sem esse privilégio administrativo recebia 403 ("Sem
// opções") no Select de Espécie do form de Animal. `listSpecies` PERMANECE
// intocado (telas de administração do catálogo continuam usando o índice
// completo). GAP-BE-427/TASK-BE-892: esta rota agora exige `X-Farm-Id`
// (`farm.context` ESTRITO) — o interceptor genérico de `api.ts` já propaga o
// header, nenhuma ação extra necessária aqui.
export interface SpecieOptionItem {
  uuid: string;
  label: string;
}

export interface SpeciesOptionsListEnvelope {
  success: boolean;
  message: string;
  data: SpecieOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface SpeciesFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
}
