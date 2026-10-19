// src/@types/v2/Issuers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de EMISSORES NFe (Issuer) — API v1 do backend Laravel
// GB.Cerne (execução 023, TASK-FE-320). Fonte batida linha a linha contra o
// código REAL do backend já entregue (commit `fb204f231`, TASK-BE-300/301/302):
//   - app/Http/Resources/V1/IssuerResource.php (shape de saída)
//   - app/Http/Requests/Api/V1/IssuerRequest.php (regras de entrada)
//   - app/Http/Requests/Api/V1/IssuerIndexRequest.php (filtros aceitos)
//   - app/Http/Requests/Api/V1/IssuerCertificateRequest.php (upload)
//   - app/Actions/Issuer/ViewIssuerCertificateAction.php (shape do GET .../certificate)
//   - app/Http/Controllers/Api/V1/IssuerController.php (envelope ApiResponse::paginated)
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /issuers                    → data: IssuerListItem[] + meta paginado real
//   GET    /issuers/{uuid}              → data: IssuerDetail
//   POST   /issuers                     → payload IssuerPayload (create)
//   PUT    /issuers/{uuid}               → payload IssuerPayload (update, full-resource)
//   DELETE /issuers/{uuid}               → 204; 422 possível (GAP-BE-052, aguardando aprovação)
//   GET    /issuers/{uuid}/certificate  → data: IssuerCertificateInfo | null; 422 se
//                                          certificado corrompido/senha ilegível
//   POST   /issuers/{uuid}/certificate  → multipart (IssuerCertificatePayload)
//   DELETE /issuers/{uuid}/certificate  → remove o certificado
//
// Divergências UX×API resolvidas por default (Gaps abertos, não bloqueantes):
//   - GAP-FE-110 (OBSOLETO, UT-000766 T4/D-101-03): CST/CFOP/NCM/percentuais/token
//     IBPT padrão do emissor saíram da tela e do contrato (a API não os devolve).
//   - GAP-FE-111: SEM campo `logo` no payload de escrita (IssuerRequest não o
//     lista) — `logo_url` é só leitura no Resource, sem via de escrita nesta rodada.
//   - GAP-FE-112: `numbers: string[]` — lista simples de números de IE, SEM
//     UF/isento (fiel ao contrato real, D7 — sem CRUD próprio de StateRegistration).
//   - GAP-FE-113: `cidade_uuid` é FK real (`Rule::exists('cities','uuid')`) —
//     `SelectAsyncPaginate` sobre `listCities`, nunca texto livre.
//   - GAP-FE-114: `IssuerIndexRequest` não aceita filtro `ambiente` — omitido
//     de `IssuerFilterForm`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ISSUER (resposta da API)
// ============================================

export type IssuerRegimeSlug = 'simples_nacional' | 'normal';
export type IssuerAmbienteSlug = 'producao' | 'homologacao';
/** Perfil de apresentação do SPED (D-101-05: A/B/C). */
export type IssuerSpedProfile = 'A' | 'B' | 'C';

/** Série de NF-e do emissor (UT-000780) — `uuid`, nunca `id`. `in_use` = já
 *  usada em nota emitida (API bloqueia mudar o número da série e removê-la). */
export interface IssuerNfeSeries {
  uuid: string;
  serie: number;
  ultimo_numero: number;
  is_default: boolean;
  is_active: boolean;
  in_use: boolean;
}

export interface IssuerEndereco {
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade_uuid: string | null;
  cidade_nome: string | null;
  uf: string | null;
}

export interface IssuerListItem {
  uuid: string;
  razao_social: string;
  nome_fantasia: string;
  cpf_cnpj: string;
  ie: string | null;
  endereco: IssuerEndereco;
  telefone: string;
  email: string;
  issues_nfe: boolean;
  regime: IssuerRegimeSlug | null;
  regime_label: string | null;
  ambiente: IssuerAmbienteSlug | null;
  ambiente_label: string | null;
  /** D-101-12: true = ambiente travado em Homologação (chave da API). */
  ambiente_locked?: boolean;
  /** CNAE (texto livre, até 20 caracteres). */
  cnae: string | null;
  sped_profile: IssuerSpedProfile | null;
  /** Séries de NF-e (UT-000780). Presente no show; opcional na listagem. */
  nfe_series?: IssuerNfeSeries[];
  ultimo_numero_cte: number | null;
  numero_serie_cte: number | null;
  ultimo_numero_mdfe: number | null;
  numero_serie_mdfe: number | null;
  is_enabled: boolean;
  logo_url: string | null;
  has_certificate: boolean;
  /** Autorização para download do XML da NFe (legado, opcional). */
  aut_xml: string;
  /** Só presente quando a relação é eager-loaded (GET show, contrato §3.2). */
  farm_uuids?: string[];
  /** Só presente quando a relação é eager-loaded (GET show, contrato §3.2). */
  state_registration_numbers?: string[];
}

// GET /issuers/{uuid} devolve o mesmo Resource, com `farms`/`stateRegistrations`
// eager-loaded — `farm_uuids`/`state_registration_numbers` sempre presentes.
export interface IssuerDetail extends IssuerListItem {
  nfe_series: IssuerNfeSeries[];
  farm_uuids: string[];
  state_registration_numbers: string[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface IssuersListEnvelope {
  success: boolean;
  message: string;
  data: IssuerListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// REQUEST TYPES (create/update — IssuerRequest)
// ============================================

export interface IssuerPayload {
  razao_social: string;
  nome_fantasia: string;
  cpf_cnpj: string;
  rua: string;
  numero: string;
  bairro: string;
  telefone: string;
  cep: string;
  issues_nfe: boolean;
  cidade_uuid: string;
  cnae?: string | null;
  sped_profile?: IssuerSpedProfile | null;
  // required_if:issues_nfe,true
  regime?: IssuerRegimeSlug;
  ambiente?: IssuerAmbienteSlug;
  /** Obrigatório na criação com issues_nfe=true (min 1); no update, ausente =
   *  preserva as séries atuais. Série em uso não muda número nem é removida. */
  nfe_series?: IssuerNfeSeriesPayload[];
  // nullable, sem regra própria no legado
  ultimo_numero_cte?: number | null;
  numero_serie_cte?: number | null;
  ultimo_numero_mdfe?: number | null;
  numero_serie_mdfe?: number | null;
  email: string;
  is_enabled: boolean;
  /** IEs adicionais — lista simples de números (GAP-FE-112, sem UF/isento). */
  numbers?: string[];
  /** Fazendas vinculadas — uuid, nunca id (D8). */
  farm_uuids?: string[];
  /** Só enviado quando issues_nfe=true (UT-000766). */
  aut_xml?: string;
}

export interface IssuerNfeSeriesPayload {
  uuid?: string | null;
  serie: number;
  ultimo_numero: number;
  is_default: boolean;
  is_active: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

// `cidade_uuid` guarda o `Option<string>` inteiro no RHF (label + value) —
// mesmo padrão de `parent_uuid` em PlanAccount (SelectAsyncPaginate
// controlado via Controller) — necessário para exibir o label da cidade já
// selecionada em modo edição sem uma segunda fonte de estado.
/** Linha do bloco "Séries de NF-e" no RHF (`useFieldArray`). `in_use` e
 *  `min_ultimo_numero` são só de UI/validação local (não vão no payload). */
export interface IssuerNfeSeriesForm {
  uuid: string | null;
  serie: number | null;
  ultimo_numero: number | null;
  is_default: boolean;
  is_active: boolean;
  in_use: boolean;
  /** Piso do último número: valor gravado quando a série já foi usada. */
  min_ultimo_numero: number;
}

export interface IssuerFormType {
  uuid?: string;
  razao_social: string;
  nome_fantasia: string;
  cpf_cnpj: string;
  rua: string;
  numero: string;
  bairro: string;
  telefone: string;
  cep: string;
  cidade_uuid: Option<string> | null;
  issues_nfe: boolean;
  regime: IssuerRegimeSlug | '';
  ambiente: IssuerAmbienteSlug | '';
  cnae: string;
  sped_profile: IssuerSpedProfile | '';
  nfe_series: IssuerNfeSeriesForm[];
  ultimo_numero_cte: number | null;
  numero_serie_cte: number | null;
  ultimo_numero_mdfe: number | null;
  numero_serie_mdfe: number | null;
  email: string;
  is_enabled: boolean;
  numbers: string[];
  farm_uuids: string[];
  aut_xml: string;
}

// ============================================
// FILTRO (drawer da listagem) — GAP-FE-114: SEM `ambiente`
// ============================================

export interface IssuerFilterForm {
  /** Busca por `razao_social`/`nome_fantasia`/`cpf_cnpj` (param `search`). */
  search?: string;
  is_enabled?: 'true' | 'false';
  issues_nfe?: 'true' | 'false';
}

// ============================================
// CERTIFICADO DIGITAL (contrato §3.4/§8.2/§9)
// ============================================

/**
 * Shape REAL confirmado contra `ViewIssuerCertificateAction::handle()` —
 * `data: null` quando não há certificado cadastrado (não é erro); `data:
 * {...}` quando há certificado legível. Certificado ilegível/corrompido vira
 * 422 (tratado pelo `onError` genérico do `useRequest`, nunca chega a este
 * shape). NUNCA inclui senha/binário (write-only absoluto, contrato §9).
 */
export interface IssuerCertificateInfo {
  serial: string;
  valid_from: string;
  valid_to: string;
  days_until_expiration: number;
}

export interface IssuerCertificatePayload {
  arquivo: File;
  senha_certificado: string;
}
