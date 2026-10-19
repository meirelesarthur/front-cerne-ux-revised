// src/pages/CadastrosBase/Pessoas/pessoa.types.ts
// -----------------------------------------------------------------------------
// Forma INTERNA do formulário (React Hook Form) do wizard de Pessoa — distinta
// do shape de payload/leitura da API (`@/@types/v2/People`). Campos de FK
// usam `Option<T>` (par label/value), mesma convenção de
// `CreateOrUpdateCentroCusto.tsx`/outros formulários do projeto com
// `SelectAsyncPaginate`/`Select` via `Controller`. A conversão para o
// payload real (`PersonPayload`) acontece só no submit
// (`CreateOrUpdatePessoa.tsx`, TASK-FE-305).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { RoleKey } from '@/@types/v2/People';

export type { RoleKey };

export interface FarmShareForm {
  farm: Option<string> | null; // uuid
  // TASK-FE-333 — REVERTIDO de `number | null` (`PercentInput`, TASK-FE-330)
  // para `string` (`Input` de texto simples) — `PercentInput.MAX_RAW_DIGITS`
  // impedia digitar 100%, valor legítimo de participação societária (sócio
  // único). Vírgula decimal pt-BR; convertido para `number` (ponto) só no
  // `buildPayload()` via `transformStringToNumber`.
  percentage: string;
}

export interface BranchForm {
  nif: string;
  name: string;
  state_registration: string;
  zip_code: string;
  // TASK-FE-327 — `Option.value` guarda o uuid, enviado como `city_uuid` no
  // payload (GAP-FE-120 fechado do lado front); prefill em edição usa
  // fallback rótulo=uuid (`BranchResource` não denormaliza nome/UF).
  city: Option<string> | null;
  address: string;
}

export interface SellerForm {
  name: string;
  email: string;
  phone: string;
}

export interface ProprietaryFormValues {
  enabled: boolean;
  farms: FarmShareForm[];
  state_registration_numbers: { value: string }[];
}

export interface EmployeeFormValues {
  enabled: boolean;
  office: string;
  function: Option<string> | null; // uuid — GET /functions/options
  // TASK-FE-330 — 5 campos migrados de `string` para `number | null`
  // (`commission`/`provider.commission`→`PercentInput`;
  // `vl_time_productive`/`vl_time_unproductive`/`base_salary`/`goal_salary`→`MoneyInput`).
  commission: number | null;
  vl_time_productive: number | null;
  vl_time_unproductive: number | null;
  base_salary: number | null;
  goal_salary: number | null;
  // GAP-FE-120 (addendum) FECHADO — TASK-FE-332/TASK-BE-355: `center_uuid`
  // (uuid, `GET /cost-centers/options`, sem gate de `costcenters_view`).
  center: Option<string> | null;
  birthday: string | null;
  // GAP-FE-120 (addendum) FECHADO no catálogo — TASK-FE-332/TASK-BE-356:
  // `bank_uuid` (uuid, `GET /banks/options`, sem gate de `banks_view`).
  // Prefill em edição continua best-effort (`EmployeeResource` nunca expôs
  // esse campo na leitura, achado desta rodada — ver `@types/v2/People`).
  bank: Option<string> | null;
  account_type: string;
  agency: string;
  account: string;
  pix_type: Option<number> | null;
  pix: string;
}

export interface ProviderFormValues {
  enabled: boolean;
  type: Option<number> | null;
  // TASK-FE-330 — migrados de `string` para `number | null`
  // (`commission`→`PercentInput`; `hour_value`→`MoneyInput`).
  commission: number | null;
  hour_value: number | null;
  state_registration: string;
  city_registration: string;
  contact: string;
  contact_phone: string;
  bank: Option<string> | null;
  account_type: string;
  agency: string;
  account: string;
  pix_type: Option<number> | null;
  pix: string;
  branches: BranchForm[];
  sellers: SellerForm[];
}

export interface ClientFormValues {
  enabled: boolean;
  cellphone: string;
  contact: string;
  contact_phone: string;
  city_registration: string;
  farm_name: string;
  final_costumer: boolean;
  taxpayer: boolean;
  code_country: string;
  id_abroad: string;
  // TASK-FE-334 — repeater (`useFieldArray`), mesmo shape de
  // `ProprietaryFormValues.state_registration_numbers` (fidelidade real: N
  // inscrições estaduais, não uma string única).
  state_registrations: { value: string }[];
}

export interface UserFormValues {
  enabled: boolean;
  is_purchasing_assistant: boolean;
  password: string;
  password_confirmation: string;
  farm_uuids: string[];
  role_uuids: string[];
  boss_uuids: string[];
}

export interface PessoaFormValues {
  uuid?: string;
  nif: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  zip_code: string;
  // TASK-FE-327/GAP-FE-120 (fechado) — `city_uuid` (string) é o contrato real
  // (`PersonRequest::rules()`, `Rule::exists('cities','uuid')` desde
  // TASK-BE-334); o `Option.value` aqui carrega o `uuid`, enviado como
  // `city_uuid` no payload (`buildPayload()`), sem cast.
  city: Option<string> | null;
  address: string;
  number: string;
  district: string;

  proprietary: ProprietaryFormValues;
  employee: EmployeeFormValues;
  provider: ProviderFormValues;
  client: ClientFormValues;
  user: UserFormValues;
}

export const ROLE_ORDER: RoleKey[] = ['proprietary', 'employee', 'provider', 'client', 'user'];

export function emptyProprietary(): ProprietaryFormValues {
  return { enabled: false, farms: [], state_registration_numbers: [] };
}

export function emptyEmployee(): EmployeeFormValues {
  return {
    enabled: false,
    office: '',
    function: null,
    commission: null,
    vl_time_productive: null,
    vl_time_unproductive: null,
    base_salary: null,
    goal_salary: null,
    center: null,
    birthday: null,
    bank: null,
    account_type: '',
    agency: '',
    account: '',
    pix_type: null,
    pix: '',
  };
}

export function emptyProvider(): ProviderFormValues {
  return {
    enabled: false,
    type: null,
    commission: null,
    hour_value: null,
    state_registration: '',
    city_registration: '',
    contact: '',
    contact_phone: '',
    bank: null,
    account_type: '',
    agency: '',
    account: '',
    pix_type: null,
    pix: '',
    branches: [],
    sellers: [],
  };
}

export function emptyClient(): ClientFormValues {
  return {
    enabled: false,
    cellphone: '',
    contact: '',
    contact_phone: '',
    city_registration: '',
    farm_name: '',
    final_costumer: false,
    taxpayer: true,
    // 97-Esteiras/030 — deixou de ser `'BR'` (sigla ISO). `code_country`
    // agora guarda o `codigo` numérico de `countries` (string de dígitos,
    // ex. `String(BRAZIL_COUNTRY_CODE)`) — ver correção crítica de homologação em
    // `steps/StepCliente.tsx`. `''` = nenhum país selecionado ainda; o
    // usuário escolhe via `SelectAsyncPaginate` (sem default hardcoded,
    // mesmo racional do CRUD standalone de Cliente).
    code_country: '',
    id_abroad: '',
    state_registrations: [],
  };
}

export function emptyUser(): UserFormValues {
  return {
    enabled: false,
    is_purchasing_assistant: false,
    password: '',
    password_confirmation: '',
    farm_uuids: [],
    role_uuids: [],
    boss_uuids: [],
  };
}

export function emptyPessoaForm(): PessoaFormValues {
  return {
    nif: '',
    name: '',
    nickname: '',
    email: '',
    phone: '',
    zip_code: '',
    city: null,
    address: '',
    number: '',
    district: '',
    proprietary: emptyProprietary(),
    employee: emptyEmployee(),
    provider: emptyProvider(),
    client: emptyClient(),
    user: emptyUser(),
  };
}

/** Etapas dinâmicas: fixas (Dados Básicos, Endereço) + uma por papel ativo, na ordem canônica. */
export type StepKey = 'basico' | 'endereco' | RoleKey;

export function computeSteps(form: PessoaFormValues): StepKey[] {
  return ['basico', 'endereco', ...ROLE_ORDER.filter((role) => form[role].enabled)];
}
