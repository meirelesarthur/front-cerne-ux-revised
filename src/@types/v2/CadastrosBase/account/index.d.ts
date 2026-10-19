// src/@types/v2/CadastrosBase/account/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Contas Bancárias" (Account — Cadastros Base / Financeiros).
// Fundação de dados da execução 025 (TASK-FE-560) — shapes espelham
// `Account-contrato.md` (backend, APROVADO v1.0, §5/§6/§10) e
// `Account-FrontEnd-contrato.md` (tela, APROVADO v1.0, §2) EXATAMENTE.
//
// `balance`/`is_bank`/`tenant_id` são SOMENTE-LEITURA no backend (D5/D6/D2 do
// contrato de API) — NUNCA entram em `AccountPayload` nem em nenhum outro
// tipo de escrita deste arquivo. `balance`/`is_bank` só aparecem em
// interfaces de LEITURA (`AccountListItem`/`AccountDetail`), exibição
// informativa, nunca editáveis via formulário/RHF.
//
// MCP `get_spa_api_client_pattern` indisponível nesta sessão (LACUNA, ver
// cabeçalho de `Account-FrontEnd-contrato.md`) — mitigado por leitura direta
// de `@types/v2/CadastrosBase/provider/index.d.ts` (estrutura de pastas
// canônica) e `@types/v2/Banks/index.d.ts` (shape de options/paginação).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// Enums de escrita/leitura dos campos `type`/`type_cnab` — união literal
// inline, mirror exato do contrato (`Account-FrontEnd-contrato.md §2.1`).
// Equivalente ao `AccountType` de `constants/cadastrosBase/account/account-type.ts`
// (TASK-FE-561), mantido inline aqui para este arquivo não depender de
// import cruzado de `constants/`.
// ============================================

export type AccountTypeCode = 'C' | 'P' | 'I' | 'L';
export type AccountCnabCode = 1 | 2;

// ============================================
// ACCOUNT — LISTAGEM (mirror `AccountResource`, `Account-contrato.md §10`)
// ============================================

export interface AccountListItem {
  uuid: string;
  bank: string; // NOME livre, não uuid/code (D4 do contrato de API)
  agency: string;
  account: string;
  type: { value: AccountTypeCode; label: string };
  // `limit`/`balance` chegam como STRING do backend (TASK-FE-564, achado
  // confirmado lendo `AccountResource::toArray()` no api_root): o Model
  // aplica `'limit' => 'decimal:2'`/`'balance' => 'decimal:2'` e o Resource
  // NÃO faz `(float)` cast antes de expor (ao contrário de outros campos do
  // mesmo Resource) — mesma classe de armadilha já catalogada em
  // `PackageResource::size` (Package-Frontend-Contrato.md). Consumidores
  // (grid/form) SEMPRE fazem `Number(...)` antes de formatar/comparar —
  // nunca tratar como number cru.
  limit: string;
  balance: string; // somente-leitura, nunca no payload
  is_enabled: boolean;
  provider: { uuid: string; name: string } | null;
  code: string;
  description: string;
  is_ticket: boolean;
  investment_account: { uuid: string; description: string } | null;
}

// ============================================
// ACCOUNT — DETALHE (GET /accounts/{uuid}, mirror `Account-contrato.md §10`)
// ============================================

export interface AccountDetail extends AccountListItem {
  is_bank: boolean; // exibição informativa apenas, nunca no form/payload (D6)
  type_cnab: { value: AccountCnabCode; label: string } | null;
  bank_contract: string | null;
  bank_agreement: string | null;
  use_cash_book: boolean;
  proprietaries: { uuid: string; name: string }[];
  farms: { uuid: string; name: string }[];
  created_at: string;
  updated_at: string;
}

// ============================================
// PAYLOAD (POST/PUT — mirror `Account-contrato.md §5/§6`). `balance`/
// `is_bank`/`tenant_id` NÃO existem aqui — nunca chegam do cliente (D5/D6/D2).
// `proprietary_uuids`/`farm_uuids` são presence-aware no PUT (D8 do contrato
// de API) — só incluir a chave quando a seção foi efetivamente tocada nesta
// sessão (`dirtyFields` do RHF), nunca enviar `[]` "por via das dúvidas"
// (ver TASK-FE-564/566 para a montagem do payload de update).
// ============================================

export interface AccountPayload {
  bank: string;
  agency: string;
  account: string;
  type: AccountTypeCode; // valor do enum, nunca o label
  limit: number;
  is_enabled: boolean;
  provider_uuid?: string | null;
  code: string;
  description: string;
  is_ticket: boolean;
  proprietary_uuids?: string[]; // required_if(is_ticket) no POST; presence-aware (sometimes) no PUT
  bank_contract?: string | null; // required_if(is_ticket)
  bank_agreement?: string | null; // required_if(is_ticket)
  type_cnab?: AccountCnabCode | null; // required_if(is_ticket)
  use_cash_book: boolean;
  investment_account_uuid?: string | null;
  farm_uuids?: string[]; // presence-aware (sometimes) nos dois verbos
}

// ============================================
// FILTRO (GET /accounts — mirror `AccountIndexRequest`, `Account-contrato.md §5`)
// ============================================

export interface ListAccountsParams {
  page?: number;
  per_page?: number; // default 10, teto 100 validado no backend
  search?: string; // description/code/bank (ilike, backend)
  type?: AccountTypeCode;
  is_enabled?: 'true' | 'false';
}

// RHF (drawer de filtro, `<Form formFilter>`) — Selects sempre como
// Option<T>|null, nunca o valor cru (mirror `ProviderFilterForm`).
export interface AccountFilterForm {
  search?: string;
  type?: Option<AccountTypeCode> | null;
  isEnabled?: Option<boolean> | null;
}

// ============================================
// ENVELOPE (ApiResponse::paginated) — meta REAL (mirror
// BanksApiPaginationMeta/ProvidersApiPaginationMeta), NÃO o fallback de
// página única obsoleto de `listSpecies` (ver "Riscos" da Tarefa).
// ============================================

export interface AccountsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface AccountsListEnvelope {
  success: boolean;
  message: string;
  data: AccountListItem[];
  errors: Record<string, string[]> | null;
  meta: AccountsApiPaginationMeta | null;
}

// ============================================
// FORM (RHF, `CreateOrUpdateContaBancaria.tsx` — TASK-FE-565/566). Convenção
// por tipo de campo (mirror `PackageForm`/`CostCenterForm`):
//   - `bank`/`provider_uuid`/`investment_account_uuid` — `SelectAsyncPaginate`,
//     guarda o `Option{label,value}` INTEIRO; extração do valor cru pro
//     payload só no submit (`tryPersistAccount`, `account-service.ts`).
//   - `type`/`type_cnab`/`is_enabled`/`use_cash_book`/`is_ticket` — `Select`
//     local via `Controller`, guarda o valor PRIMITIVO (char/número/boolean).
//   - `proprietary_uuids`/`farm_uuids` — `CheckboxListField` (TASK-FE-566),
//     array de uuids cru.
// `balance` NÃO existe aqui — somente-leitura, nunca em RHF (D5), só exibido
// como `Text` estático a partir de `AccountDetail.balance` na tela.
// ============================================

export interface AccountForm {
  bank: Option<string> | null; // valor = NOME do banco (D4), não uuid/code
  agency: string;
  account: string;
  type: AccountTypeCode | '';
  code: string;
  description: string;
  limit: number | null; // MoneyInput controlado — number | null enquanto vazio
  is_enabled: boolean;
  use_cash_book: boolean;
  provider_uuid: Option<string> | null;
  investment_account_uuid: Option<string> | null;

  // --- Emissão de Boleto (TASK-FE-566, ponto de extensão — ver
  // `CreateOrUpdateContaBancaria.tsx`). Defaults nesta Tarefa: `is_ticket`
  // sempre `false` (sem UI para alternar), demais campos `null`/`[]`, nunca
  // renderizados. ---
  is_ticket: boolean;
  bank_contract: string | null;
  bank_agreement: string | null;
  type_cnab: AccountCnabCode | null;
  proprietary_uuids: string[];

  // --- Fazendas Vinculadas (TASK-FE-566, ponto de extensão) ---
  farm_uuids: string[];
}

// ============================================
// OPTIONS (GET /accounts/options — mirror `AccountOptionsResource`, FORA do
// grupo `farm.context`, `Account-contrato.md §10`) — 2 enums estáticos do
// backend (`AccountType`/`Cnab`), consumidos por `useAccountOptions`
// (TASK-FE-561, ao lado dos enums estáticos client-side em
// `account-status.ts`). Mirror `TaxRuleOptionsData` (payload plano, sem
// paginação).
// ============================================

export interface AccountOptionsResponse {
  types: Option<AccountTypeCode>[];
  cnab_types: Option<AccountCnabCode>[];
}
