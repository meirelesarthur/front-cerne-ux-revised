// src/@types/v2/Contadores/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo CONTADOR (Escritório de Contabilidade) — Cadastros Base,
// domínio Fiscal/Contábil. Contrato: [[Contador-contrato]] (APROVADO, Ciclo 4,
// 100%, 2026-07-27).
//
// TASK-CT-03a cobre LISTAGEM + exclusão (`ContadorListItem`/`ContadorFilterForm`/
// `ContadoresListEnvelope`/`ContadorInUseError`). TASK-CT-03b ESTENDE este mesmo
// arquivo com o formulário create/edit (`ContadorDetail`/`ContadorPayload`/
// `ContadorForm`/`IssueEligibleRef`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface CityRef {
  uuid: string;
  title: string;
}

export interface ContadorListItem {
  uuid: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie: string;
  rua: string;
  numero: string;
  bairro: string;
  fone: string;
  cep: string;
  email: string;
  city: CityRef | null;
  auto_send: boolean;
  created_at: string;
  updated_at: string;
  // `issues` OMITIDO aqui de propósito — `ListContadoresAction` não faz
  // `with(['issues'])`, o campo vem ausente/undefined nesta listagem
  // (`whenLoaded` no Resource). Só existe em `ContadorDetail` (GET
  // /contadores/{uuid}, TASK-CT-03b).
}

export interface ContadorFilterForm {
  search?: string;
}

export interface ContadoresListEnvelope {
  success: boolean;
  message: string;
  data: ContadorListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// Molde direto de `AddressingInUseError` — MESMO shape físico de
// `ContadorRepository::hasDependents()` (`{resource, table, count}[]`).
export interface ContadorInUseError {
  success: false;
  message: string;
  errors: {
    in_use: Array<{ resource: string; table: string; count: number }>;
  };
}

// ---- TASK-CT-03b: formulário create/edit ----------------------------------

export interface IssueEligibleRef {
  uuid: string;
  razao_social: string;
  cpf_cnpj: string;
}

// GET /contadores/{uuid} — inclui `city` + `issues` (ao contrário de
// `ContadorListItem`, que não carrega `issues`).
export interface ContadorDetail extends ContadorListItem {
  issues: IssueEligibleRef[];
}

export interface ContadorPayload {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie: string;
  rua: string;
  numero: string;
  bairro: string;
  fone: string;
  cep: string;
  email: string;
  cidade_uuid: string;
  issue_uuids: string[];
  auto_send: boolean;
}

// Shape do formulário (RHF) — `cidade_uuid` guarda o `Option` INTEIRO (o
// padrão real já materializado em `PlanAccount.parent_uuid`, não um campo
// `_label` companion separado — ver Achado 1 da Tarefa).
export interface ContadorForm {
  uuid?: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie: string;
  rua: string;
  numero: string;
  bairro: string;
  fone: string;
  cep: string;
  email: string;
  cidade_uuid: Option<string> | null;
  issue_uuids: string[];
  auto_send: boolean;
}
