// src/@types/v2/CadastrosBase/provider/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Fornecedores" (Provider — Cadastros Base). Contrato
// investigado DIRETAMENTE em `api_root` (TASK-PR-FE-01):
//   app/Http/Controllers/Api/V1/ProviderController.php
//   app/Http/Requests/Api/V1/ProviderRequest.php
//   app/Http/Resources/V1/{ProviderResource,ProviderListResource}.php
//   app/Data/Person/ProviderRoleData.php
//
// Provider NÃO é módulo isolado — é um PAPEL de Person (Provider-contrato.md
// DA-PR-01), reaproveitando 100% as Actions do módulo People por baixo da
// fachada dedicada `/api/v1/providers` (DA-PR-02). Este arquivo NÃO estende
// nem importa nada de `@/pages/CadastrosBase/Pessoas/` — mesma independência
// arquitetural de `ProviderRequest` ("não estende `PersonRequest` por
// herança", contrato §4.2).
//
// GAP-PR-FE-02 — RESOLVIDO (TASK-PR-06/GAP-PR-07, revalidado pelo Tester de
// api em 2026-07-29, `memory/runs/Provider-tester-2026-07-29-gap-pr-07-refix.md`):
// `ProviderController::show()/store()/update()` passaram a serializar via
// `new ProviderDetailResource($person)` (achata Person raiz + Provider papel
// no mesmo nível), não mais `ProviderResource($provider)`. O envelope de
// detalhe PASSA A INCLUIR os 10 campos raiz de Person (`nif`/`name`/
// `nickname`/`email`/`phone`/`address`/`number`/`district`/`zip_code`/`city`)
// — `ProviderDetail` abaixo reflete FIELMENTE esse shape real e ATUAL,
// consumido pela pré-carga da aba "Dados" em `TASK-PR-FE-03`.
//
// GAP-PR-09 — RESOLVIDO (TASK-PR-08, validado pelo Tester de api em
// 2026-07-29 por reprodução HTTP real e independente,
// `memory/runs/Provider-tester-2026-07-29-gap-pr-09.md`): `ProviderBranchDetail`/
// `ProviderSellerDetail` abaixo eram, até esta correção (TASK-PR-FE-11),
// declarados com campos que a API NUNCA devolvia de fato (achado de
// `ERRO-04` — o comentário/tipo tinha sido escrito sem verificar o Resource
// PHP real). Hoje, `ProviderBranchDetailResource`/`ProviderSellerDetailResource`
// (Resources dedicados e NOVOS, usados só dentro de `ProviderDetailResource`
// — `BranchResource`/`SellerResource` compartilhados com `/people` não
// mudaram) tornam esses campos REAIS — os tipos abaixo agora refletem
// fielmente o shape confirmado, incluindo `city_uuid` (string plana,
// devolvida junto com o objeto `city` aninhado).
//
// ACHADO REAL #2 (não bloqueante, incorporado sem Gap): `number`/`district`
// SÃO campos raiz `required` reais de `ProviderRequest::rules()` (idênticos
// a `PersonRequest`), embora ausentes da tabela de campos `## 3` do contrato
// de tela (omissão de planejamento, não de código) — incluídos aqui por
// fidelidade ao Form Request (fonte de verdade, per "Inspeção Obrigatória"
// da ficha), mesmo padrão já usado por `pessoa-schema.ts`.
//
// `cellphone`, `default_cost_center` e `is_enabled` reabertos pelo UT-000773
// (execução 118): agora fazem parte do contrato de detalhe/form/payload.
// -----------------------------------------------------------------------------

import type { ProviderType } from '@/constants/cadastrosBase/provider/provider-type';

import { Option } from '@/@types/option';

// ============================================
// Cidade/Estado — shape achatado repetido em ProviderListResource/
// BranchResource (mirror do `city.state` eager-load do Repository)
// ============================================

export interface ProviderCityRef {
  uuid: string;
  name: string;
  state: { name: string; uf: string } | null;
}

// ============================================
// FILIAL (Branch) — provider.branches[] (RN-08, delete+recreate a cada save)
// ============================================

export interface ProviderBranchDetail {
  uuid: string;
  nif: string;
  name: string | null;
  state_registration: string | null;
  zip_code: string | null;
  // Devolvido junto com `city` (mesma condição `whenLoaded('city')` no
  // Resource) — não consumido diretamente no mapeamento do form (que usa o
  // objeto `city` aninhado abaixo), mas declarado aqui por fidelidade ao
  // shape real de `ProviderBranchDetailResource.php` (GAP-PR-09/TASK-PR-08).
  city_uuid: string | null;
  city: ProviderCityRef | null;
  address: string;
}

export interface ProviderBranchForm {
  uuid?: string;
  nif: string;
  name: string | null;
  state_registration: string | null;
  zip_code: string | null;
  city: Option<string> | null; // Option<cityUuid> — `?? null`, nunca `?? undefined`
  address: string;
}

export interface ProviderBranchPayload {
  nif: string;
  name?: string | null;
  state_registration?: string | null;
  zip_code?: string | null;
  city_uuid: string;
  address: string;
}

// ============================================
// VENDEDOR (Seller) — provider.sellers[] (RN-08, delete+recreate a cada save)
// ============================================

export interface ProviderSellerDetail {
  uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ProviderSellerForm {
  uuid?: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ProviderSellerPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
}

// ============================================
// PROVIDER — LISTAGEM (mirror `ProviderListResource`, grid achatada
// Person+Provider) — `uuid` exposto é o do PAPEL Provider (DA-PR-14)
// ============================================

export interface ProviderListItem {
  uuid: string;
  nif: string;
  name: string;
  nickname: string;
  phone: string | null;
  city: ProviderCityRef | null;
  type: ProviderType;
  type_label: string | null;
  is_enabled: boolean;
}

// ============================================
// PROVIDER — DETALHE (mirror `ProviderDetailResource` — Person raiz +
// Provider papel achatados no mesmo nível, GAP-PR-FE-02 RESOLVIDO acima)
// ============================================

export interface ProviderDetail {
  uuid: string;

  // --- 10 campos raiz de Person (ProviderDetailResource, TASK-PR-06) ---
  nif: string;
  name: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  address: string;
  number: string;
  district: string;
  zip_code: string | null;
  city: ProviderCityRef | null;

  // --- papel Provider (mirror `ProviderResource`) ---
  is_enabled: boolean;
  type: ProviderType;
  type_label: string | null;
  commission: number | null;
  hour_value: number | null;
  state_registration: string | null;
  city_registration: string | null;
  contact: string | null;
  contact_phone: string | null;
  /** Celular do papel Provider (UT-000773, execução 118) — editável na aba Dados. */
  cellphone: string | null;
  /** Centro de custo padrão (UT-000773); `null` quando não definido ou invisível ao usuário. */
  default_cost_center: { uuid: string; code: string; description: string } | null;
  id_abroad: string | null;
  bank: { uuid: string; code: string; name: string } | null;
  account_type: 'C' | 'P' | null;
  agency: string | null;
  account: string | null;
  pix_type: number | null;
  pix: string | null;
  branches: ProviderBranchDetail[];
  sellers: ProviderSellerDetail[];
}

// ============================================
// FORM (React Hook Form) — Selects SEMPRE como Option<T>, nunca string direta
// ============================================

export interface ProviderForm {
  uuid?: string;

  // --- raiz Person (idênticos a PersonRequest, ProviderRequest §4.2) ---
  nif: string;
  nickname: string;
  name: string;
  email: string | null;
  phone: string | null;
  zip_code: string | null;
  address: string;
  number: string;
  district: string;
  city: Option<string> | null; // Option<cityUuid>

  // --- bloco provider (raiz do papel) ---
  type: Option<ProviderType> | null;
  commission: number | null; // requiredIf(type===Comissionado=5)
  hour_value: number | null; // requiredIf(type===Terceirizado=3)
  state_registration: string | null;
  city_registration: string | null;
  contact: string | null;
  contact_phone: string | null;
  cellphone: string | null;
  default_cost_center: Option<string> | null; // Option<costCenterUuid>
  is_enabled: Option<boolean> | null; // Select Sim/Não SEMPRE como Option

  // --- aba Conta (presence-aware/`sometimes` no backend, TASK-BE-362) ---
  bank: Option<string> | null; // Option<bankUuid>
  account_type: Option<'C' | 'P'> | null;
  agency: string | null;
  account: string | null;
  pix_type: Option<number> | null;
  pix: string | null;

  // --- abas Filiais/Vendedores (V1 confirmado, TASK-PR-FE-05/06) ---
  branches: ProviderBranchForm[];
  sellers: ProviderSellerForm[];
}

// ============================================
// FILTRO (listagem — `search`/`type`/`city_uuid`/`is_enabled`)
// ============================================

export interface ProviderFilterForm {
  search?: string;
  type?: Option<ProviderType> | null;
  city?: Option<string> | null;
  isEnabled?: Option<boolean> | null;
}

export interface ProviderFilterRequest {
  search?: string;
  type?: ProviderType;
  city_uuid?: string;
  is_enabled?: boolean;
}

// ============================================
// PAYLOAD (POST/PUT) — full-resource nos campos raiz `required` (contrato
// `## 6.3`/checklist `## 9` item 4); bloco `provider.*` presence-aware
// (`sometimes`, TASK-BE-362). UT-000773: `is_enabled`, `cellphone` e
// `default_cost_center_uuid` passam a ser enviados (ausente = preserva no PUT,
// `null` = limpa).
// ============================================

export interface ProviderPayloadBlock {
  type: ProviderType; // escrita SEMPRE em INT — nunca o nome do case
  commission?: number | null;
  hour_value?: number | null;
  account_type?: 'C' | 'P' | null;
  state_registration?: string | null;
  city_registration?: string | null;
  contact?: string | null;
  contact_phone?: string | null;
  is_enabled?: boolean;
  cellphone?: string | null;
  default_cost_center_uuid?: string | null;
  id_abroad?: string | null;
  bank_uuid?: string | null;
  agency?: string | null;
  account?: string | null;
  pix_type?: number | null;
  pix?: string | null;
  branches?: ProviderBranchPayload[];
  sellers?: ProviderSellerPayload[];
}

export interface CreateProviderRequest {
  nif: string;
  nickname: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  zip_code?: string | null;
  address: string;
  number: string;
  district: string;
  city_uuid: string;
  provider: ProviderPayloadBlock;
}

// `update` mantém o payload COMPLETO nos campos raiz `required` (guard
// `Object.keys(dirtyFields).length===0`, contrato `## 6.3`) — só o bloco
// `provider.*` é parcial (enviar apenas o que mudou, presence-aware).
export interface UpdateProviderRequest extends Omit<CreateProviderRequest, 'provider'> {
  provider: Partial<ProviderPayloadBlock>;
}

// ============================================
// ENVELOPE (ApiResponse) — meta de paginação real (Laravel padrão do
// projeto, mesmo shape de BanksApiPaginationMeta/CostCentersApiPaginationMeta)
// ============================================

export interface ProvidersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ProvidersListEnvelope {
  success: boolean;
  message: string;
  data: ProviderListItem[];
  errors: Record<string, string[]> | null;
  meta: ProvidersApiPaginationMeta | null;
}
