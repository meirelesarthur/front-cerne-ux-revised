// src/@types/v2/CadastrosBase/proprietary/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Proprietários" (Proprietary — Cadastros Base). Contrato
// investigado DIRETAMENTE em `api_root` (TASK-PY-FE-01, backend
// `TASK-PY-01/02/03` ✅ CONCLUÍDO/validado pelo Tester de api em
// 2026-07-29):
//   app/Http/Requests/Api/V1/ProprietaryRequest.php
//   app/Http/Resources/V1/{ProprietaryListResource,ProprietaryDetailResource}.php
//
// Proprietary NÃO é módulo isolado — é um PAPEL de Person
// (Proprietary-contrato.md DA-PY-01), reaproveitando 100% as Actions do
// módulo People por baixo da fachada dedicada `/api/v1/proprietaries`
// (DA-PY-02). Este arquivo NÃO estende nem importa nada de
// `@/pages/CadastrosBase/Pessoas/` (mesma independência arquitetural de
// `ProprietaryRequest`, "não estende `PersonRequest` por herança", §4.2) —
// mesmo racional já usado por `@/@types/v2/CadastrosBase/provider`.
//
// SEM enum de `type` (Proprietary não tem campo de tipo/categoria,
// contrato `## 4.5`) — por isso não existe `constants/cadastrosBase/
// proprietary/proprietary-type.ts`, diferente de `Provider`.
//
// DIVERGÊNCIA REAL confirmada por leitura direta do Resource (vs. o que a
// ficha da Tarefa havia INFERIDO do contrato antes do backend existir):
//   - `city` no grid/detalhe é o MESMO shape achatado de `ProviderCityRef`
//     (`{uuid, name, state:{name,uf}|null}`), NÃO `{uuid,title}`.
//   - `ProprietaryDetailResource.farms[]` é PLANO — `{uuid, percentage}`
//     (uuid é o da FARM), NÃO `{farm:{uuid,description}, percentage}`
//     aninhado como a ficha havia suposto. Corrigido aqui por fidelidade ao
//     Resource real (Inspeção Obrigatória da Tarefa).
//
// Exclusão é HARD-DELETE físico com guarda 422 (DA-PY-05, diferente do
// SOFT-delete de `Provider`) — `ProprietaryInUseError` abaixo é molde DIRETO
// de `ContadorInUseError`/`AddressingInUseError` (mesmo shape físico de
// `errors.in_use[]` que `CheckProprietaryDependenciesAction` lança).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// Cidade/Estado — shape achatado (mirror `ProviderCityRef`, mesmo
// `city.state` eager-load do Repository)
// ============================================

export interface ProprietaryCityRef {
  uuid: string;
  name: string;
  state: { name: string; uf: string } | null;
}

// ============================================
// PROPRIETARY — LISTAGEM (mirror `ProprietaryListResource`, grid achatada
// Person+Proprietary) — `uuid` exposto é o do PAPEL Proprietary (DA-PY-09).
// `percentage` só vem preenchido quando a listagem está escopada a 1 farm
// (`PersonRepository::listProprietaries()`, só-farm, DA-PY-04=b) — lido do
// primeiro item de `farms` já restrito à farm ativa no Repository.
// ============================================

export interface ProprietaryListItem {
  uuid: string;
  nif: string;
  name: string;
  nickname: string;
  phone: string | null;
  city: ProprietaryCityRef | null;
  is_enabled: boolean;
  percentage: number | null;
}

// ============================================
// PROPRIETARY — DETALHE (mirror `ProprietaryDetailResource` — Person raiz +
// Proprietary papel achatados no mesmo nível, entregue desde a v1)
// ============================================

export interface ProprietaryFarmDetail {
  /** uuid da FARM (não do vínculo pivot) — shape plano real do Resource. */
  uuid: string;
  percentage: number | null;
}

export interface ProprietaryDetail {
  uuid: string;

  // --- 10 campos raiz de Person (ProprietaryDetailResource) ---
  nif: string;
  name: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  address: string;
  number: string;
  district: string;
  zip_code: string | null;
  city: ProprietaryCityRef | null;

  // --- papel Proprietary ---
  is_enabled: boolean | null;
  farms: ProprietaryFarmDetail[] | null;
  state_registration_numbers: string[] | null;
}

// ============================================
// FORM (React Hook Form) — Selects SEMPRE como Option<T>, nunca string
// direta. `percentage` é `number | null` — PATCH pós-entrega (homologação,
// 2026-07-30): migrado de STRING (lição TASK-FE-333, `PercentInput` de cap
// fixo impedia digitar 100%) para o contrato NUMÉRICO do `NumberInput`
// compartilhado (`@/components/Form/NumberInput`, mesmo padrão de
// `RegrasFiscais/tax-rule-schema.ts::perc_icms` — `allowDot`,
// `decimalPlaces=2`, `max=999.99`); `null` quando o campo está vazio, sem
// conversão string→número no payload (`f.percentage ?? 0` direto).
// `is_enabled` NÃO é campo do form (mirror `Provider`/`DA-PY`): forçado
// `true` internamente pelo `ProprietaryController::store()`/`update()` — a
// única forma do registro deixar de existir é o hard-delete de
// `TASK-PY-FE-02`, não um toggle.
// ============================================

export interface ProprietaryFarmShareForm {
  farm: Option<string> | null; // Option<farmUuid>
  percentage: number | null;
}

export interface ProprietaryForm {
  uuid?: string;

  // --- raiz Person (idênticos a ProprietaryRequest §4.2) ---
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

  // --- bloco proprietary ---
  farms: ProprietaryFarmShareForm[];
  state_registration_numbers: { value: string }[];
}

// ============================================
// FILTRO (listagem — `search`/`is_enabled`)
// ============================================

export interface ProprietaryFilterForm {
  search?: string;
  isEnabled?: Option<boolean> | null;
}

export interface ProprietaryFilterRequest {
  search?: string;
  is_enabled?: boolean;
}

// ============================================
// PAYLOAD (POST/PUT) — raiz completa (`ProprietaryRequest::rules()`) +
// bloco `proprietary.farms[]`/`state_registration_numbers[]`. SEM
// `is_enabled` (o Controller força `true` em store/update; `destroy()` é
// HARD-DELETE via rota própria, DA-PY-05) — não existe no shape do payload.
// ============================================

export interface ProprietaryFarmSharePayload {
  farm_uuid: string;
  percentage: number; // escrita SEMPRE em number — nunca string
}

export interface ProprietaryPayloadBlock {
  farms: ProprietaryFarmSharePayload[];
  state_registration_numbers: string[];
}

export interface CreateProprietaryRequest {
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
  proprietary: ProprietaryPayloadBlock;
}

// `update` mantém os campos raiz completos (mesmo padrão `$rootDefaults` de
// `PersonController::update()`/`ProviderController::update()`, contrato de
// `TASK-PY-03`) — só o bloco `proprietary.*` é parcial (`ProprietaryRequest`
// trata `proprietary`/`proprietary.farms` como `sometimes` no UPDATE).
export interface UpdateProprietaryRequest extends Omit<CreateProprietaryRequest, 'proprietary'> {
  proprietary: Partial<ProprietaryPayloadBlock>;
}

// ============================================
// ERRO DE USO (HARD-DELETE bloqueado, DA-PY-05) — molde DIRETO de
// `ContadorInUseError`/`AddressingInUseError` (mesmo shape físico de
// `errors.in_use[]` que `CheckProprietaryDependenciesAction` lança).
// ============================================

export interface ProprietaryInUseError {
  success: false;
  message: string;
  errors: {
    in_use: Array<{ resource: string; table: string; count: number }>;
  };
}

// ============================================
// ENVELOPE (ApiResponse) — meta de paginação real (mesmo shape de
// `ProvidersApiPaginationMeta`)
// ============================================

export interface ProprietariesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ProprietariesListEnvelope {
  success: boolean;
  message: string;
  data: ProprietaryListItem[];
  errors: Record<string, string[]> | null;
  meta: ProprietariesApiPaginationMeta | null;
}
