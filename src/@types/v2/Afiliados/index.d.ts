// src/@types/v2/Afiliados/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de AFILIADOS (Partner — Cadastros Base / Pessoas, execução
// 024, TASK-FE-430). Catálogo GLOBAL (sem farm/tenant, `is_farm:false`) — o
// mesmo padrão sem ID de contexto de `Kind`. Contrato confirmado por leitura
// direta de `Partner-Frontend-Contrato.md` §1 (backend já implementado e
// testado, `Partner-contrato.md` APROVADO v1.2):
//   GET    /api/v1/partners          → data: PartnerListItem[], meta paginado
//                                       REAL (ApiResponse::paginated, `per_page`
//                                       default backend 10, teto 100)
//   GET    /api/v1/partners/{uuid}   → data: PartnerDetail
//   POST   /api/v1/partners          → multipart (FormData) — `contract_file`
//                                       sempre pode estar presente
//   PUT    /api/v1/partners/{uuid}   → multipart, mesmas regras de
//                                       `PartnerRequest::rules()` (não
//                                       diferencia por verbo)
//   DELETE /api/v1/partners/{uuid}   → 204 (GAP-BE-210 `[AVALIADO]`, efeito
//                                       colateral no backend — reatribuição de
//                                       Contratantes órfãos, fora do escopo do
//                                       front)
//
// CORREÇÃO E2E (feature 024, bug de prefill): `PartnerResource` passou a
// expor também `person.{nickname,phone,address,city_uuid,city_name}` —
// backend fechou a lacuna documentada anteriormente aqui (confirmado por
// leitura direta de `app/Http/Resources/V1/PartnerResource.php` no
// `api_root`). `dt_affiliation`/`due_date` agora vêm em `yyyy-MM-dd`
// (`Carbon::toDateString()`).
//
// CORREÇÃO E2E (feature 024, bug de CEP): backend passou a aceitar `zip_code`
// no payload raiz (`PartnerRequest`) e a expor `person.zip_code` no GET
// `/partners/{uuid}` — `zip_code` deixou de ser conveniência client-only e
// agora é persistido/reidratado como os demais campos (ver `PartnerPayload`
// e `partner-service.ts::buildPartnerFormData`).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// PARTNER (resposta da API)
// ============================================

export interface PartnerPersonRef {
  name: string;
  nickname: string;
  nif: string;
  email: string;
  phone: string | null;
  /** CEP — CORREÇÃO E2E (feature 024): agora exposto por `PartnerResource` para prefill na edição. */
  zip_code: string | null;
  address: string | null;
  city_uuid: string | null;
  /** Rótulo denormalizado da cidade (`City.title`) — só para exibição/prefill do `SelectAsyncPaginate`. */
  city_name: string | null;
}

export type PartnerStatusValue = 1 | 2 | 3;

export interface PartnerStatusRef {
  value: PartnerStatusValue;
  label: string;
}

export interface PartnerListItem {
  uuid: string;
  person: PartnerPersonRef;
  contact: string | null;
  contact_phone: string | null;
  dt_affiliation: string;
  /** Decimal cru do backend (ex.: "12.50") — convertido para `number` só no form (TASK-FE-432). */
  commission: string;
  status: PartnerStatusRef;
  due_date: string | null;
  qtd_farms: number;
  created_at: string;
  updated_at: string;
}

// `show` acrescenta os campos abaixo — NÃO inclui `address`/`city`/`phone`
// (ver nota de cabeçalho do arquivo).
export interface PartnerDetail extends PartnerListItem {
  business_rule: string | null;
  note: string | null;
  /** URL pública (Storage), só leitura — nunca confundir com o campo de upload do payload (`File`). */
  contract_file: string | null;
  cellphone: string | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface PartnersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PartnersListEnvelope {
  success: boolean;
  message: string;
  data: PartnerListItem[];
  errors: Record<string, string[]> | null;
  meta: PartnersApiPaginationMeta | null;
}

// ============================================
// FORMULÁRIO (React Hook Form — CreateOrUpdateAfiliado.tsx, TASK-FE-432)
// ============================================
//
// Desvio deliberado (documentado) do rascunho literal de `TASK-FE-430`:
// `commission`/`qtd_farms` são tipados `number | null` (não `string`) — o
// mandato explícito de `TASK-FE-432` é usar `PercentInput`/`NumberInput`
// (contrato `value?: number | null` / `onValueChange?: (value) => void`),
// mesmo padrão já em produção para campos de comissão/quantidade em
// `pessoa.types.ts` (`EmployeeFormValues.commission`,
// `StepIdentificacao.tsx::tenant_id`). Evita um `transformStringToNumber`
// desnecessário e mantém os dois arquivos da mesma feature consistentes entre
// si.
export interface PartnerForm {
  nif: string;
  nickname: string;
  name: string;
  email: string;
  phone: string;
  cellphone: string;
  /** CEP — autofill via ViaCEP (`address`/`city`) E persistido no payload (ver `PartnerPayload`, CORREÇÃO E2E feature 024). */
  zip_code: string;
  address: string;
  /** `Option<uuid>` — convertido para `city_uuid` só no payload. */
  city: Option<string> | null;
  contact: string;
  contact_phone: string;
  status: Option<PartnerStatusValue> | null;
  dt_affiliation: string | null;
  /** Percentual puro (ex.: 12.5) — `numeric, min:0`, SEM teto 100 (diferente de Funcionário/Fornecedor). */
  commission: number | null;
  due_date: string | null;
  qtd_farms: number | null;
  business_rule: string;
  note: string;
  /** Novo arquivo selecionado nesta sessão (upload/substituição) — `null` quando nada foi trocado. */
  contract_file: File | null;
  /** Marca a remoção do contrato já existente (edição) — mutuamente exclusivo com `contract_file` novo. */
  remove_contract_file: boolean;
}

// ============================================
// FILTRO (drawer da listagem — TASK-FE-431)
// ============================================

export interface PartnerFilterForm {
  search?: string;
  status?: PartnerStatusValue;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (POST/PUT) — SEMPRE completo, `PartnerRequest::rules()`
// não diferencia por verbo (mesma nota de `KindPayload`/`FarmPayload`).
export interface PartnerPayload {
  nif: string;
  nickname: string;
  name: string;
  email: string;
  phone: string | null;
  cellphone: string | null;
  /** CEP — CORREÇÃO E2E (feature 024): backend passou a aceitar no payload raiz (`PartnerRequest`). */
  zip_code?: string | null;
  address: string;
  /** Nunca `city_id` (DEC-009). */
  city_uuid: string;
  contact: string | null;
  contact_phone: string | null;
  status: PartnerStatusValue;
  dt_affiliation: string;
  commission: number;
  due_date: string | null;
  qtd_farms: number | null;
  business_rule: string | null;
  note: string | null;
  /** Presente só quando um arquivo novo foi selecionado nesta sessão. */
  contract_file?: File;
  /** Presente só quando o usuário removeu o contrato existente sem escolher um novo. */
  remove_contract_file?: boolean;
}
