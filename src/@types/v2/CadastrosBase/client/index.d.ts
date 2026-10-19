// src/@types/v2/CadastrosBase/client/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Clientes" (Client — Cadastros Base).
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01) — escrito ANTES de
// `Client-contrato.md`/`TASK-CL-0N` de backend existirem (a fachada dedicada
// `/api/v1/clients` ainda não foi materializada; tracker.md mostra o módulo
// `Client` em estágio BRUTO). Shape inferido com ALTA CONFIANÇA do papel
// `Client` já codificado e embutido em `/people`
// (`app/Http/Resources/V1/ClientResource.php` + `app/Data/Person/ClientRoleData.php`,
// api_root) + do padrão físico já confirmado em
// `ProviderListResource.php`/`ProviderDetailResource.php`/`ProprietaryDetailResource.php`
// (10 campos raiz de Person achatados + `city` no shape `{uuid, name,
// state:{name,uf}|null}`). CÓDIGO-INCOMPLETO / sujeito a reconciliação
// quando o contrato `/clients` fechar — reconfirmar contra
// `app/Http/Requests/Api/V1/ClientRequest.php` +
// `app/Http/Resources/V1/{ClientListResource,ClientDetailResource}.php`
// assim que existirem.
//
// Client NÃO é módulo isolado — é um PAPEL de Person (mesma independência
// arquitetural de `Proprietary`/`Provider`, "não estende `PersonRequest` por
// herança"). Este arquivo NÃO estende nem importa nada de
// `@/pages/CadastrosBase/Pessoas/` (grep confirma).
//
// Client NÃO tem bloco de Fazenda/Participação (diferente de `Proprietary`,
// que tem `farms[]`) — os únicos campos de "papel" são os listados abaixo +
// o repeater `state_registrations` (texto livre, sem FK). Nenhum
// service/Select de Fazenda criado para este módulo.
//
// Semântica de EXCLUSÃO — DEFAULT assumido = HARD-DELETE físico real
// (evidência direta do legado: `app/Client.php` sem trait `SoftDeletes`,
// `ClientController::destroy()` chama `$item->delete()`), guardado por 422
// estruturado `errors.in_use[]` — `ClientInUseError` abaixo é molde DIRETO
// de `ProprietaryInUseError`/`ContadorInUseError`/`AddressingInUseError`
// (mesmo shape físico). Se o contrato fechar por SOFT-delete via
// `is_enabled` (como `Provider`), este tipo deixa de ser usado —
// `TASK-CL-FE-02` ajusta.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// Cidade/Estado — shape achatado (mirror `ProprietaryCityRef`/`ProviderCityRef`)
// ============================================

export interface ClientCityRef {
  uuid: string;
  name: string;
  state: { name: string; uf: string } | null;
}

// ============================================
// CLIENT — LISTAGEM (mirror `ClientListResource` futuro, grid achatada
// Person+Client) — `uuid` exposto é o do PAPEL Client.
// ============================================

export interface ClientListItem {
  uuid: string;
  nif: string;
  name: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  cellphone: string | null;
  city: ClientCityRef | null;
  is_enabled: boolean;
}

// ============================================
// CLIENT — DETALHE (mirror `ClientDetailResource` futuro — Person raiz +
// Client papel achatados no mesmo nível, `@mixin Person`)
// ============================================

export interface ClientDetail {
  uuid: string;

  // --- 10 campos raiz de Person ---
  nif: string;
  name: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  address: string;
  number: string;
  district: string;
  zip_code: string | null;
  city: ClientCityRef | null;

  // --- papel Client ---
  is_enabled: boolean;
  cellphone: string | null;
  contact: string | null;
  contact_phone: string | null;
  city_registration: string | null;
  farm_name: string | null;
  final_costumer: boolean;
  taxpayer: boolean;
  /** Escalar `codigo` (`countries.codigo`) — DEFEITO-CLIENTES-03 (2026-07-30):
   *  `ClientDetailResource::code_country` devolve um **INTEIRO** físico
   *  (ex. `1058`), NÃO uma string — confirmado em produção pelo 422
   *  `"O campo client.code_country deve ser uma string."` ao reenviar esse
   *  escalar cru no payload de edição (`ClientRequest::rules()` exige
   *  `string`+`regex:/^\d+$/`). SEM país aninhado `{uuid,nome,codigo}`
   *  (diferente de `FarmDetailResource::country`, mesmo catálogo) — sem
   *  isso, o form não resolve o `nome` do país em EDIÇÃO sem paginar a
   *  lista inteira de `/countries/options` (que só filtra por `nome`).
   *  `buildClientFormDefaultValues` SEMPRE converte via `String(...)` antes
   *  de montar a `Option` — nunca repassar o escalar cru. */
  code_country: number;
  /** Acréscimo não-quebrante (97-Esteiras/012, item 2) — `ClientDetailResource`
   *  agora expõe também o objeto País `{uuid,nome,codigo}` (mirror exato de
   *  `FarmDetailResource::country`, mesmo catálogo `countries`), quando a
   *  relação `client.country` está eager-loaded no backend
   *  (`PersonRepository::findByClientUuidOrFail()`). `code_country` (escalar)
   *  permanece intocado por compatibilidade — `country` é só um ACRÉSCIMO
   *  para resolver o rótulo "Brasil" em edição sem paginar `/countries/options`
   *  inteiro (que só filtra por `nome`). `undefined`/ausente quando a relação
   *  não vier carregada — `buildClientFormDefaultValues` mantém o fallback
   *  HONESTO (label = código) nesse caso. */
  country?: { uuid: string; nome: string; codigo: number } | null;
  id_abroad: string | null;
  state_registrations: string[];
}

/** `GET /clients/by-nif/{nif}` (UT-000740) — mesmo shape de `ClientDetail`,
 *  mas `uuid` é `null` quando a Pessoa existe sem papel Client visível nesta
 *  fazenda/tenant: nesse caso os campos do papel vêm `null`/ausentes e só os
 *  campos de Pessoa são confiáveis. Tipo derivado — NÃO afrouxa `ClientDetail`
 *  (usado por show/edição). */
export interface ClientByNifDetail
  extends Omit<
    ClientDetail,
    | 'uuid'
    | 'city'
    | 'is_enabled'
    | 'final_costumer'
    | 'taxpayer'
    | 'code_country'
    | 'state_registrations'
  > {
  uuid: string | null;
  city?: ClientDetail['city'];
  is_enabled: boolean | null;
  final_costumer: boolean | null;
  taxpayer: boolean | null;
  code_country: number | null;
  state_registrations: string[] | null;
}

// ============================================
// FORM (React Hook Form) — mirror direto de `client.*` já em produção em
// `pessoa.types.ts`/`StepCliente.tsx`, adaptado para form standalone.
// Selects SEMPRE como Option<T>, nunca string direta.
//
// `is_enabled` — AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30): PASSOU a ser
// campo do form (`Switch`, obrigatório, "Ativo*"), divergindo do precedente
// `Proprietary`/`Provider` (que ainda forçam o valor server-side). Sempre
// enviado no payload de create/update (ver `CreateClientRequest.client`
// abaixo). Reconfirmar contra `ClientController` real quando materializado.
// ============================================

export interface ClientForm {
  uuid?: string;

  // --- raiz Person ---
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

  // --- bloco client ---
  cellphone: string;
  contact: string;
  contact_phone: string;
  city_registration: string;
  farm_name: string;
  is_enabled: boolean; // obrigatório ("Ativo*") — AJUSTE DE HOMOLOGAÇÃO 2026-07-30
  final_costumer: boolean; // default false
  taxpayer: boolean; // default true
  // CORREÇÃO CRÍTICA (2026-07-30) — Option<codigo> (código numérico legado da
  // tabela `countries.codigo`, ex. "1058" = Brasil), NUNCA Option<ISO>. Era
  // `string` cru (sigla ISO via `CountryCombobox`) — causa-raiz do 500
  // `SQLSTATE[22P02] invalid input syntax for type integer: "BR"`. Ver nota
  // de cabeçalho de `CreateOrUpdateCliente.tsx`.
  code_country: Option<string> | null; // obrigatório
  id_abroad: string; // sempre visível/opcional — AJUSTE DE HOMOLOGAÇÃO 2026-07-30
  state_registrations: { value: string }[];
}

// ============================================
// FILTRO (listagem — `search`/`is_enabled`)
// ============================================

export interface ClientFilterForm {
  search?: string;
  isEnabled?: Option<boolean> | null;
}

export interface ClientFilterRequest {
  search?: string;
  is_enabled?: boolean;
}

// ============================================
// PAYLOAD (POST/PUT) — raiz completa + campos de papel acima +
// `state_registrations: string[]`. `is_enabled` AGORA incluído (AJUSTE DE
// HOMOLOGAÇÃO 2026-07-30 — ver nota de cabeçalho do bloco FORM acima).
// ============================================

export interface CreateClientRequest {
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
  client: {
    cellphone: string | null;
    contact: string | null;
    contact_phone: string | null;
    city_registration: string | null;
    farm_name: string | null;
    is_enabled: boolean;
    final_costumer: boolean;
    taxpayer: boolean;
    /** Código legado numérico da tabela `countries.codigo` (dígitos, ex.
     *  `"1058"` = Brasil) — NUNCA sigla ISO 3166-1. Ver CORREÇÃO CRÍTICA
     *  2026-07-30 no bloco FORM acima e nota de cabeçalho de
     *  `CreateOrUpdateCliente.tsx`. */
    code_country: string;
    id_abroad: string | null;
    state_registrations: string[];
  };
}

// `update` mantém os campos raiz completos (mesmo padrão `$rootDefaults` de
// `PersonController::update()`/`ProviderController::update()`/
// `ProprietaryController::update()`) — só o bloco `client.*` é presence-aware
// (`sometimes`) no backend; aqui enviado por completo por simplicidade
// (mesma exigência do checklist canônico: payload de update SEMPRE
// completo, nunca delta).
export interface UpdateClientRequest extends CreateClientRequest {}

// ============================================
// ERRO DE USO (HARD-DELETE bloqueado, default assumido) — molde DIRETO de
// `ProprietaryInUseError`/`ContadorInUseError`/`AddressingInUseError` (mesmo
// shape físico de `errors.in_use[]`). Usado só se o fork de exclusão
// confirmar HARD-delete; se a api fechar SOFT-delete, este tipo não é usado.
// ============================================

export interface ClientInUseError {
  success: false;
  message: string;
  errors: {
    in_use: Array<{ resource: string; table: string; count: number }>;
  };
}

// ============================================
// ENVELOPE (ApiResponse) — meta de paginação real (mesmo shape de
// `ProprietariesApiPaginationMeta`/`ProvidersApiPaginationMeta`)
// ============================================

export interface ClientsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ClientsListEnvelope {
  success: boolean;
  message: string;
  data: ClientListItem[];
  errors: Record<string, string[]> | null;
  meta: ClientsApiPaginationMeta | null;
}
