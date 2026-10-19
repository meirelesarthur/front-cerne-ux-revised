// src/services/v2/CadastrosBase/Account/account-service.ts
// -----------------------------------------------------------------------------
// Account Service — API v1 do backend Laravel GB.Cerne ("Contas Bancárias").
// Fundação de dados da execução 025 (TASK-FE-560). Mirror estrutural de
// `services/v2/CadastrosBase/Provider/provider-service.ts` (pasta canônica
// NOVA — `services/v2/CadastrosBase/`, NÃO o mirror mecânico dos irmãos mais
// antigos soltos em `services/v2/{Feature}/`), adaptação de paginação
// idêntica a `listPlanAccounts`/`listBanks` (meta REAL do backend,
// `AccountIndexRequest` valida `per_page` teto 100 desde o nascimento — não
// é dívida como `Farm`/`Kind` pré-padrão).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /accounts/options   → { types, cnab_types } — FORA do grupo
//                                 `farm.context` (Account-contrato.md §4,
//                                 mirror `banks/options`/`tax-rules/options`).
//                                 Não exige X-Farm-Id — o interceptor
//                                 genérico de `services/api.ts` anexa o
//                                 header de qualquer forma quando há fazenda
//                                 ativa; inofensivo, o backend ignora.
//   GET    /accounts           → data: AccountListItem[], meta paginação
//                                 REAL.
//   GET    /accounts/{uuid}    → data: AccountDetail (provider/
//                                 proprietaries/farms/investment_account
//                                 carregados).
//   POST   /accounts           → payload AccountPayload completo.
//   PUT    /accounts/{uuid}    → payload Partial<AccountPayload> — na
//                                 prática os campos raiz são SEMPRE enviados
//                                 completos pelo chamador (mirror
//                                 `updateCostCenter`/`updateProvider`,
//                                 full-resource); só `proprietary_uuids`/
//                                 `farm_uuids` são de fato parciais/
//                                 presence-aware (D8 do contrato de API) — a
//                                 disciplina de enviar os campos raiz cheios
//                                 é responsabilidade do chamador
//                                 (TASK-FE-565/566), este service só
//                                 repassa o payload.
//   DELETE /accounts/{uuid}    → 204; SEM guarda de FK/negócio no backend
//                                 (D9, GAP-BE-260/261) — `onError` genérico,
//                                 sem mensagem de negócio fabricada.
//
// Rota dentro de `farm.context` ESTRITO (exceto `/accounts/options`) —
// `X-Farm-Id` é anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts`; este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AccountDetail,
  AccountForm,
  AccountListItem,
  AccountOptionsResponse,
  AccountPayload,
  AccountTypeCode,
  AccountsListEnvelope,
} from '@/@types/v2/CadastrosBase/account';

export interface ListAccountsParams extends PaginationQueryParams {
  search?: string;
  // Decisão 6 (arquitetura-ofx-db-api.md §4) / Decisão F5
  // (arquitetura-ofx-frontend.md §4) — extensão ADITIVA: `type` aceita valor
  // único (100% retrocompatível, nenhum consumidor existente muda) OU array
  // (`AccountFilterData::$type` já migrado para `whereIn()` quando array,
  // confirmado por teste real `AccountControllerTest::filters by an array
  // of types`). Primeiro consumidor do array: `CreateOrUpdateOfxImport.tsx`
  // (`type: ['C', 'P']`, CURRENT+SAVINGS, Decisão 5/LK-01).
  type?: AccountTypeCode | AccountTypeCode[];
  is_enabled?: 'true' | 'false';
}

async function listAccounts(
  params: ListAccountsParams
): Promise<ResponsePagination<AccountListItem[]>> {
  const { data } = await api.V2.get<AccountsListEnvelope>('/accounts', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    is_enabled: params.is_enabled || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // meta REAL (idêntico a listPlanAccounts/listBanks), NUNCA o fallback de
  // página única obsoleto de listSpecies.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getAccount(accountUuid: string) {
  const { data } = await api.V2.get<Response<AccountDetail>>(`/accounts/${accountUuid}`);
  return data;
}

async function createAccount(payload: AccountPayload) {
  const { data } = await api.V2.post<Response<AccountDetail>>('/accounts', payload);
  return data;
}

// Parcial só pelos blocos presence-aware (`proprietary_uuids`/`farm_uuids`,
// D8 do contrato de API) — os demais campos raiz são sempre enviados
// completos pelo chamador (mirror `updateCostCenter`/`updateProvider`).
async function updateAccount(accountUuid: string, payload: Partial<AccountPayload>) {
  const { data } = await api.V2.put<Response<AccountDetail>>(`/accounts/${accountUuid}`, payload);
  return data;
}

async function deleteAccount(accountUuid: string) {
  const { data } = await api.V2.delete(`/accounts/${accountUuid}`);
  return data;
}

// GET /accounts/options — FORA do grupo farm.context (mirror
// `getTaxRuleOptions`/`listBankOptions`) — enums estáticos `type`/
// `type_cnab`, não dependem de fazenda/tenant ativos.
async function getAccountOptions() {
  const { data } = await api.V2.get<Response<AccountOptionsResponse>>('/accounts/options');
  return data;
}

// TASK-FE-036-103 (esteira 036, Contas a Pagar) — preview de saldo "na
// data" da seção Baixa Automática (GAP-FE-036-105), `AccountController::
// balance`. `date` é `required` no `AccountBalanceRequest` — caller nunca
// chama sem os 2 parâmetros preenchidos (`account_uuid`+`movement_date`).
async function getAccountBalance(
  accountUuid: string,
  date: string
): Promise<Response<{ balance: number }>> {
  const { data } = await api.V2.get<Response<{ balance: number }>>(
    `/accounts/${accountUuid}/balance`,
    { date }
  );
  return data;
}

// -----------------------------------------------------------------------------
// tryPersistAccount — função PURA chamada pela mutation de
// `CreateOrUpdateContaBancaria.tsx` (TASK-FE-565/566). Vive AQUI (não na
// tela, divergência deliberada do mirror `tryPersistCostCenter`/
// `tryPersistPackage`, instrução explícita do task-packet desta execução) —
// monta o `AccountPayload` a partir do `AccountForm` (RHF) e decide
// create/update pelo `isEditing` recebido.
//
// Campos especiais (Account-FrontEnd-contrato.md "Riscos"):
//   #1 `bank` — SelectAsyncPaginate tolerante a fora-do-catálogo: o RHF
//      guarda o Option{label,value} inteiro, `value` É o nome (D4); extração
//      direta, sem validar contra nenhuma lista carregada.
//   #2 `investment_account_uuid` — extraído do Option, `null` quando vazio;
//      a restrição `type=I` e a exclusão do próprio uuid em edição são
//      resolvidas no `findParams`/filtro client-side da TELA (SelectAsyncPaginate),
//      não aqui.
//   #3 `balance`/`is_bank` — NUNCA aparecem em `AccountForm` (D5/D6), logo
//      nunca chegam a este payload — nenhuma chave a omitir manualmente.
//
// Emissão de Boleto/Vínculos (TASK-FE-566, PONTO DE EXTENSÃO): nesta Tarefa
// (565) a seção "Emissão de Boleto" e "Fazendas Vinculadas" NÃO têm UI —
// `is_ticket` nasce sempre `false` (defaultValues do form), `bank_contract`/
// `bank_agreement`/`type_cnab` nascem `null`, `proprietary_uuids`/
// `farm_uuids` nascem `[]`, nenhum dirty possível ainda. O payload já
// respeita a semântica presence-aware (D8/§6 do contrato de tela) para que
// TASK-FE-566 só precise LIGAR os campos de UI que faltam (CheckboxListField
// de Proprietários/Fazendas, Select de Emite Boleto) — a lógica de
// presence-aware abaixo já está correta e não precisa ser reescrita.
// -----------------------------------------------------------------------------

export interface TryPersistAccountParams {
  data: AccountForm;
  isEditing: boolean;
  accountUuid?: string;
  // `dirtyFields.proprietary_uuids`/`dirtyFields.farm_uuids` do RHF (D8) —
  // só o CHAMADOR (a tela) sabe se o usuário mexeu na seção nesta sessão.
  // TASK-FE-566: passa a receber `true` de fato quando o CheckboxListField
  // existir; nesta Tarefa nunca é `true` (seção sem UI).
  dirtyProprietaryUuids?: boolean;
  dirtyFarmUuids?: boolean;
}

async function tryPersistAccount({
  data,
  isEditing,
  accountUuid,
  dirtyProprietaryUuids,
  dirtyFarmUuids,
}: TryPersistAccountParams) {
  const payload: AccountPayload = {
    bank: data.bank!.value,
    agency: data.agency.trim(),
    account: data.account.trim(),
    type: data.type as AccountTypeCode,
    limit: Number(data.limit),
    is_enabled: !!data.is_enabled,
    provider_uuid: data.provider_uuid?.value ?? null,
    code: data.code.trim(),
    description: data.description.trim(),
    is_ticket: !!data.is_ticket,
    bank_contract: data.is_ticket ? data.bank_contract?.trim() || null : null,
    bank_agreement: data.is_ticket ? data.bank_agreement?.trim() || null : null,
    type_cnab: data.is_ticket ? (data.type_cnab ?? null) : null,
    use_cash_book: !!data.use_cash_book,
    investment_account_uuid: data.investment_account_uuid?.value ?? null,
  };

  // `proprietary_uuids` — presence-aware (D8/§6): CREATE sempre envia (mesmo
  // vazio) quando `is_ticket=false`; UPDATE só entra quando o usuário mexeu
  // na seção NESTA sessão (`dirtyProprietaryUuids`) — omitido preserva os
  // vínculos existentes (nunca `[]` "por via das dúvidas").
  if (!isEditing) {
    payload.proprietary_uuids = data.proprietary_uuids ?? [];
  } else if (dirtyProprietaryUuids) {
    payload.proprietary_uuids = data.proprietary_uuids ?? [];
  }

  // `farm_uuids` — presence-aware nos dois verbos (§6): opcional no CREATE
  // (omitido quando vazio, não obrigatório), só entra no UPDATE quando dirty.
  if (!isEditing && (data.farm_uuids ?? []).length > 0) {
    payload.farm_uuids = data.farm_uuids;
  } else if (isEditing && dirtyFarmUuids) {
    payload.farm_uuids = data.farm_uuids ?? [];
  }

  if (isEditing && accountUuid) {
    return await updateAccount(accountUuid, payload);
  }
  return await createAccount(payload);
}

export {
  createAccount,
  deleteAccount,
  getAccount,
  getAccountBalance,
  getAccountOptions,
  listAccounts,
  tryPersistAccount,
  updateAccount,
};
