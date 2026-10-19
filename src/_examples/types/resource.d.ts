// src/_examples/types/resource.d.ts
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — DTOs de um CRUD completo (referência de padrão).
//
// Preserva a CONVENÇÃO de tipagem do projeto (DTO da API, DTOs de request de
// criação/atualização e um tipo de formulário do RHF) com nomenclatura genérica
// (Recurso / Resource). Não representa nenhuma entidade de domínio real.
//
// O ID é um GUID/UUID (string) — padrão da empresa para projetos novos.
// -----------------------------------------------------------------------------

// ============================================
// STATUS DO RECURSO
// ============================================

export type ResourceStatus = "active" | "inactive";

// ============================================
// RESOURCE DATA (resposta da API)
// ============================================

export interface ResourceData {
  id: string; // GUID
  name: string;
  description?: string;
  code: string;
  status: ResourceStatus;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateResourceRequest {
  name: string;
  description?: string;
  code: string;
  status: ResourceStatus;
  enabled?: boolean;
}

export interface UpdateResourceRequest {
  name?: string;
  description?: string;
  code?: string;
  status?: ResourceStatus;
  enabled?: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface ResourceForm {
  id?: string; // GUID
  name: string;
  description?: string;
  code: string;
  status: ResourceStatus;
  enabled?: boolean;
}

// ============================================
// FILTRO (drawer)
// ============================================
//
// Dois tipos, igual ao padrão real (AgentFilterForm / AgentFilterRequest):
//  - `FilterForm`   = estado do formulário do drawer (usa Option<T> nos selects
//                     e boolean nos toggles).
//  - `FilterRequest`= o que de fato vai como query string para a API (valores
//                     "achatados": string/number, boolean vira 0|1).

import type { Option } from "@/@types/option";

export interface ResourceFilterForm {
  name?: string;
  status?: Option<ResourceStatus> | null;
  includeDeleted?: boolean;
}

export interface ResourceFilterRequest {
  name?: string;
  status?: ResourceStatus;
  include_deleted?: number; // 0 | 1
}
