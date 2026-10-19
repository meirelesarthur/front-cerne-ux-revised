// src/@types/v2/BaseRegistrations/tenant/lookup.d.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-05 (I5) — contratos dos lookups do form de Contratante
// (API v1.2, TASK-072-API-03/API-04), lidos direto do `api_root`:
//   - `GET /tenants/person-by-nif?nif=` → `TenantPersonLookupResource`;
//   - `GET /tenants/cnpj-lookup?cnpj=`  → `CnpjLookupResource` (proxy
//     ReceitaWS no back — o front NUNCA chama a ReceitaWS).
// Mesmo shape de `city` nos dois (`name`←`cities.title`, `state.uf`←
// `states.letter`). `nickname` = Razão Social; `name` = Nome Fantasia.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { Response } from '@/@types/response-api';

/** Cidade resolvida pelo back nos dois lookups. */
export interface TenantLookupCity {
  uuid: string;
  name: string;
  iso: number | string | null;
  state: { uuid: string; uf: string } | null;
}

/** Campos comuns aos dois lookups (o que o form de Contratante preenche). */
export interface TenantLookupFieldsData {
  name: string | null;
  nickname: string | null;
  address: string | null;
  zip_code: string | null;
  email: string | null;
  /** Person: como gravado; CNPJ: só dígitos do 1º telefone. */
  phone: string | null;
  city: TenantLookupCity | null;
}

/** 200 de `GET /tenants/person-by-nif`. */
export interface TenantPersonLookupData extends TenantLookupFieldsData {
  uuid: string;
  nif: string;
  is_tenant: boolean;
}

/** 200 de `GET /tenants/cnpj-lookup`. */
export type CnpjLookupData = TenantLookupFieldsData;

export type TenantPersonLookupEnvelope = Response<TenantPersonLookupData>;
export type CnpjLookupEnvelope = Response<CnpjLookupData>;

/** Saída do mapper puro `lookupToTenantFields` (valores crus, sem máscara). */
export interface TenantNifAutofillFields {
  nickname: string;
  name: string;
  email: string;
  /** Só dígitos — a máscara é aplicada ao gravar no form. */
  phone: string;
  zip_code: string;
  address: string;
  city: Option<string> | null;
}

/** Campos de texto que o autofill por NIF grava no form. */
export type TenantNifAutofillTextField = Exclude<keyof TenantNifAutofillFields, 'city'>;

/** Título + descrição de um toast do autofill por NIF (i18n do módulo). */
export interface NifAutofillToastMessage {
  title: string;
  description: string;
}

/** TASK-072-FE-05 — mensagens i18n do autofill por NIF. */
export interface NifAutofillMessages {
  alreadyTenant: NifAutofillToastMessage;
  cnpjNotFound: NifAutofillToastMessage;
  cnpjUnavailable: NifAutofillToastMessage;
  rateLimited: NifAutofillToastMessage;
  networkError: NifAutofillToastMessage;
}
