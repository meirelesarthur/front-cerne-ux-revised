// src/@types/v2/Site/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Site" (configuração única do site/fazenda) — API v1 do
// backend Laravel GB.Cerne (97-Esteiras/061, TASK-SITE-04, contrato
// `03-ARQUITETURA-frontend-site.md` §3 + `02-ARQUITETURA-database-api-site.md`
// §3.3/§3.8).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /api/v1/site → data: SiteData (singleton farm-scoped; `GetSiteAction`
//                       devolve uma instância NÃO persistida na "1ª vez" —
//                       `uuid`/`slug` saem `null` até o 1º PUT, fiel ao legado
//                       onde o form também nasce vazio).
//   PUT /api/v1/site → payload UpdateSiteRequest (upsert, `X-Farm-Id`
//                       resolve a fazenda — nunca `farm_id` no corpo).
//
// `Site` é farm-scoped via `X-Farm-Id` (uuid) — diferente de `Config`
// (global, sem tenancy). `farm_id`/`slug` NUNCA entram no formulário
// (server-derivados, CL-005) — não existem em `SiteForm`/`UpdateSiteRequest`.
//
// `banner` NÃO entra em `SiteForm`/`UpdateSiteRequest` — é parâmetro solto
// do service (`File | null`), mirror `SiteData.banner` não entrando no DTO
// da Action (`02-ARQUITETURA-database-api-site.md §3.3`, mesma decisão
// espelhada nas duas camadas: DTO do backend e Form do frontend).
// -----------------------------------------------------------------------------

// ============================================
// SITE (resposta da API — GET/PUT)
// ============================================

export interface SiteData {
  /** `null` na "1ª vez" (instância não persistida, `GetSiteAction`) — só
   *  populado após o 1º PUT. */
  uuid: string | null;
  /** URL absoluta (`Storage::disk('public')->url($banner)`), `null` quando
   *  não há banner armazenado. */
  banner_url: string | null;
  published: boolean;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  whatsapp: string | null;
  /** NOT NULL no schema — `GetSiteAction` já garante `''` na "1ª vez". */
  about: string;
  /** `null` na "1ª vez" (server-derivado, `Str::slug(farm.description)`,
   *  recalculado a cada PUT — nunca vem do form). */
  slug: string | null;
}

// ============================================
// REACT HOOK FORM
// ============================================
// `banner` fica FORA do RHF (estado local `imageFile`, mirror
// `FamilyEquipments/CreateOrUpdateFamilyEquipments.tsx`) — a troca de banner
// nunca aparece em `dirtyFields`, por isso o guard de submit combina
// `!isEmpty(dirtyFields)` com `hasImageChange` (TASK-SITE-05).

export interface SiteForm {
  /** Switch/toggle (SUR-004) — `boolean` puro, NÃO `Option<boolean>`
   *  (decisão explícita do dono, contrato §3 linha SUR-004). */
  published: boolean;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  whatsapp: string;
  about: string;
}

// ============================================
// REQUEST (payload do PUT, banner tratado à parte no service)
// ============================================
// Mesmos campos de `SiteForm` (banner NÃO entra aqui — é o 2º argumento de
// `updateSite(data, bannerFile)` no service) — os dois tipos são mantidos
// DISTINTOS (não um alias) porque representam camadas diferentes (estado de
// formulário vs. corpo da requisição), ainda que hoje coincidam campo a
// campo; qualquer divergência futura entre as duas camadas (ex.: uma
// conversão de formato só do form) já tem onde crescer sem quebrar a outra.

export interface UpdateSiteRequest {
  published: boolean;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  whatsapp: string;
  about: string;
}
