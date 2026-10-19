// src/@types/v2/CadastrosBase/employee/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Funcionários" (Employee — Cadastros Base). Shape tirado
// DIRETAMENTE da fonte (TASK-EMP-FE-01, redespacho pós GAP-EMP-FE-01):
//   app/Http/Requests/Api/V1/EmployeeRequest.php
//   app/Http/Resources/V1/{EmployeeListResource,EmployeeDetailResource}.php
// (api_root) — a API já está `✅ CONCLUÍDO` (Tester, suíte 2991 passed).
//
// Employee NÃO é módulo isolado — é um PAPEL de Person, reaproveitando o
// upsert-por-nif de People por baixo da fachada dedicada `/api/v1/employees`
// (DA-EMP-02/03) — mesma independência arquitetural de `Provider`/`Client`
// ("não estende `PersonRequest` por herança"). Este arquivo NÃO estende nem
// importa nada de `@/pages/CadastrosBase/Pessoas/` (grep confirma).
//
// `nickname` — CORRIGIDO (GAP-EMP-FE-01, 2026-08-01): é campo REAL do form,
// obrigatório, mirror exato de `provider-schema.ts:46`/`client-schema.ts:78`
// — a hipótese original de "autofill 100% backend" citava só o Blade legado
// (`EmployeeController::store()`), nunca reconfirmada contra o
// `EmployeeRequest` novo (`nickname` `required`, sem autofill/merge). Ver
// `Employee-FrontEnd-contrato.md ## 3.1` (nota de correção).
//
// `zip_code` — NULLABLE (não `required`), divergência CONFIRMADA do texto
// original da ficha (que sugeria `zip_code` obrigatório, "mirror Provider").
// Leitura direta de `EmployeeRequest.php:140` (`'zip_code' => ['nullable', ...]`)
// + dos 2 precedentes reais já ✅ CONCLUÍDO (`provider-schema.ts:49`,
// `client-schema.ts:81`, ambos `nullable()`) confirma que a alegação
// "obrigatório (mirror Provider)" do contrato de tela nunca foi reconfirmada
// contra o Request real — mesma classe de erro do achado `nickname`
// (GAP-EMP-FE-01), mas correção TÉCNICA direta (sem ambiguidade de
// negócio/UX, já resolvida da mesma forma pelo Executor do módulo Client
// sem abrir Gap nesse precedente), não um novo Gap.
//
// `number`/`district` — REQUIRED (idênticos a `PersonRequest`/
// `ProviderRequest`), confirmado em `EmployeeRequest.php:142-143`. Omissão do
// texto original da ficha (não listava obrigatoriedade para esses 2 campos)
// — incluídos aqui por fidelidade ao Form Request, mesmo padrão já usado por
// `ProviderDetail` ("ACHADO REAL #2", `@/@types/v2/CadastrosBase/provider`).
//
// GAP-EMP-FE-02 (FECHADO no front, follow-up de `TASK-EMP-FE-03` — ver
// `TASK-EMP-06`, api_root): `EmployeeDetailResource` agora devolve
// `bank`/`account_type`/`agency`/`account`, lidos do Provider tipo
// "Funcionário" (`Person::employeeProvider()`, critério determinístico
// `updated_at DESC, id DESC`, DA-EMP-21). Shape mirror EXATO de
// `ProviderDetailResource.php:86-93`/`ProviderDetail.bank`
// (`@/@types/v2/CadastrosBase/provider`): `bank` nested `{uuid,code,name}`
// ou `null` (nenhum registro de fornecedor-espelho com banco gravado);
// `account_type`/`agency`/`account` escalares `string | null`. Conferido por
// leitura direta de `app/Http/Resources/V1/EmployeeDetailResource.php`
// (api_root) antes desta correção — não deduzido do task-packet.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// Cidade/Estado — shape achatado (mirror `ProviderCityRef`/`ClientCityRef`)
// ============================================

export interface EmployeeCityRef {
  uuid: string;
  name: string;
  state: { name: string; uf: string } | null;
}

// ============================================
// Função (CBO) / Centro de Custo — shape nested do `EmployeeDetailResource`
// (`employeeFunction()`/`employeeCenter()`, api_root)
// ============================================

export interface EmployeeFunctionRef {
  uuid: string | null;
  name: string | null;
}

export interface EmployeeCenterRef {
  uuid: string | null;
  code: string | null;
  description: string | null;
}

// ============================================
// EMPLOYEE — LISTAGEM (mirror `EmployeeListResource`, grid achatada
// Person+Employee) — `uuid` exposto é o do PAPEL Employee. SEM `city`/
// `nickname` (fora do DoD de `TASK-EMP-03`, confirmado no Resource real).
// ============================================

export interface EmployeeListItem {
  uuid: string;
  nif: string;
  name: string;
  email: string | null;
  phone: string | null;
  office: string | null;
  is_enabled: boolean;
  created_at: string;
}

// ============================================
// EMPLOYEE — DETALHE (mirror `EmployeeDetailResource` — Person raiz +
// Employee papel achatados no mesmo nível, `@mixin Person`)
// ============================================

export interface EmployeeDetail {
  uuid: string;

  // --- 9 campos raiz de Person + city ---
  nif: string;
  name: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  address: string;
  number: string;
  district: string;
  zip_code: string | null;
  city: EmployeeCityRef | null;

  // --- papel Employee (mirror `EmployeeDetailResource::toArray()`) ---
  office: string | null;
  function: EmployeeFunctionRef | null;
  is_enabled: boolean;
  commission: number | null;
  vl_time_productive: number | null;
  base_salary: number | null;
  goal_salary: number | null;
  center: EmployeeCenterRef | null;
  birthday: string | null;
  pix: string | null;
  pix_type: number | null;
  // Bloco bancário (GAP-EMP-FE-02/TASK-EMP-06) — lido do Provider-espelho
  // tipo Funcionário, mirror EXATO de `ProviderDetail.bank`/`account_type`.
  // `null` quando não há registro de fornecedor-espelho com dado bancário
  // gravado ainda (ex.: Employee criado antes desta correção).
  bank: { uuid: string; code: string; name: string } | null;
  account_type: string | null;
  agency: string | null;
  account: string | null;
}

// ============================================
// FORM (React Hook Form) — mirror direto do shape já validado em produção
// por `StepFuncionario.tsx`/`pessoa.types.ts`, adaptado para form standalone
// SEM o wrapper `employee.*`/`enabled`. Selects SEMPRE como Option<T>, nunca
// string direta (exceto `account_type`, que já é string livre em produção,
// mirror `StepFuncionario.tsx`/`ACCOUNT_TYPE_OPTIONS`).
//
// `is_enabled` NÃO é campo do form (forçado pelo backend, DA-EMP-11).
// ============================================

export interface EmployeeForm {
  uuid?: string;

  // --- raiz Person ---
  nif: string;
  name: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  address: string;
  number: string;
  district: string;
  zip_code: string | null;
  city: Option<string> | null; // Option<cityUuid>

  // --- bloco employee (vínculo empregatício) ---
  office: string | null;
  function: Option<string> | null; // Option<functionUuid>
  commission: number | null;
  vl_time_productive: number | null;
  base_salary: number | null;
  goal_salary: number | null;
  center: Option<string> | null; // Option<centerUuid>
  birthday: string | null;
  bank: Option<string> | null; // Option<bankUuid>
  account_type: string | null; // string livre ('C'/'P'), mirror StepFuncionario
  agency: string | null;
  account: string | null;
  pix_type: Option<number> | null;
  pix: string | null;

  // --- bloco opcional (esqueleto — `TASK-EMP-FE-04` liga a UI) ---
  create_user: boolean;
  role: Option<string> | null; // Option<roleUuid>
}

// ============================================
// FILTRO (listagem — `search`/`start_date`/`end_date`/`is_enabled`,
// DA-EMP-04, SEM filtro de FK)
// ============================================

export interface EmployeeFilterForm {
  search?: string;
  startDate?: string | null;
  endDate?: string | null;
  isEnabled?: Option<boolean> | null;
}

export interface EmployeeFilterRequest {
  search?: string;
  start_date?: string;
  end_date?: string;
  is_enabled?: boolean;
}

// ============================================
// PAYLOAD (POST/PUT) — raiz completa + bloco `employee.*` completo (a
// fachada só escreve papéis ATIVOS, DA-EMP-11 — bloco sempre vem inteiro,
// nunca `Partial`, diferente de `ProviderPayloadBlock`). `create_user`/
// `role_uuid` só existem no shape de CREATE (nunca enviados no PUT, mirror
// do Blade que nem exibe os campos na edição).
// ============================================

export interface EmployeePayloadBlock {
  office?: string | null;
  function_uuid: string;
  commission?: number | null;
  vl_time_productive?: number | null;
  base_salary: number;
  goal_salary?: number | null;
  center_uuid?: string | null;
  birthday: string;
  bank_uuid?: string | null;
  account_type?: string | null;
  agency?: string | null;
  account?: string | null;
  pix_type?: number | null;
  pix?: string | null;
}

export interface CreateEmployeeRequest {
  nif: string;
  name: string;
  nickname: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  number: string;
  district: string;
  zip_code?: string | null;
  city_uuid: string;
  employee: EmployeePayloadBlock;
  // Só validados em POST (`EmployeeRequest::rules()`) — `TASK-EMP-FE-04`
  // liga a UI, o schema já prepara o `.when('create_user', ...)` de `email`.
  create_user?: boolean;
  role_uuid?: string | null;
}

// `update` mantém os campos raiz completos (full-resource-replace, contrato
// `## 3.4`) — SEM `create_user`/`role_uuid` (nunca enviados no PUT).
export type UpdateEmployeeRequest = Omit<CreateEmployeeRequest, 'create_user' | 'role_uuid'>;

// ============================================
// Sem `EmployeeInUseError` — Employee é SOFT (DA-EMP-07), não há guarda de
// FK a expor ao usuário (diferente de Proprietary/Client/Contador).
// ============================================

// ============================================
// ENVELOPE (ApiResponse) — meta de paginação real (mirror
// `ProvidersListEnvelope`/`ClientsListEnvelope`)
// ============================================

export interface EmployeesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface EmployeesListEnvelope {
  success: boolean;
  message: string;
  data: EmployeeListItem[];
  errors: Record<string, string[]> | null;
  meta: EmployeesApiPaginationMeta | null;
}

// ============================================
// EMPLOYEE OPTIONS (mirror `WarehouseOption`/`WarehouseOptionsListEnvelope`)
// — lookup ENXUTO `GET /employees/options` (CORRECAO-R1/D1, Onda 2, Execução
// 037), SEM gate de `employees_view` (`EmployeeOptionResource`, api_root:
// `uuid`+`name` do papel Employee, is_enabled=true, farm-scoped). FLAT — a
// resposta NÃO é paginada (`ApiResponse::success`, `meta: null` sempre).
// ============================================

export interface EmployeeOption {
  uuid: string;
  name: string;
}

export interface EmployeeOptionsListEnvelope {
  success: boolean;
  message: string;
  data: EmployeeOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
