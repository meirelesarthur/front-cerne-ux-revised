// src/@types/v2/Integrations/integrationDominio/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Software Domínio (IntegrationDominio) — Integrações, F-121,
// 97-Esteiras/072. CRUD-pai da área Integrações (Lista/Cadastro/Detalhe +
// Testar Conexão). TASK-F121-FE-01.
//
// Endpoints consumidos (roteiro API, CONTRATO_AUTOAPROVADO):
// GET/POST/PUT/DELETE /api/v1/integration-dominios + POST .../test-connection
// + GET .../issue-options + GET .../contador-options.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** "Emissor" — satélite do Resource (`IntegrationDominioData.issue`). */
export interface IntegrationDominioIssueRef {
  uuid: string;
  razao_social: string;
  full_description: string;
}

/** "Contador" — satélite do Resource (`IntegrationDominioData.contador`). */
export interface IntegrationDominioAccountantRef {
  uuid: string;
  razao_social: string;
}

/** `GET /integration-dominios/{uuid}` (e item da listagem) — mesmo
 * `IntegrationDominioResource` em list/show/create/update. Sem `status`/
 * `lastSync` — removidos por falta de lastro na API (contrato de tela §8-A). */
export interface IntegrationDominioData {
  uuid: string;
  issue: IntegrationDominioIssueRef;
  contador: IntegrationDominioAccountantRef;
  x_integration_key: string;
  is_enabled: boolean;
  created_at: string;
}

/** Linha da grid — mesmo shape do Resource, reaproveitado (mirror `SharingListItem`). */
export interface IntegrationDominioListItem extends IntegrationDominioData {}

/** `ApiResponse::paginated()` — `GET /integration-dominios`. */
export interface IntegrationDominiosListEnvelope {
  success: boolean;
  message: string;
  data: IntegrationDominioListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

/** Valores do `react-hook-form` (`CreateOrUpdateIntegrationDominio.tsx`). Os 2
 * selects e `is_enabled` guardam `Option` — extração `.value` só no submit
 * (service, `tryPersist`, RISCO 2 do contrato de tela). */
export interface IntegrationDominioForm {
  issue: Option<string> | null;
  contador: Option<string> | null;
  x_integration_key: string;
  is_enabled: Option<boolean> | null;
}

/** Payload real enviado ao backend (`POST`/`PUT /integration-dominios`). */
export interface IntegrationDominioPayload {
  issue_id: string;
  contador_id: string;
  x_integration_key: string;
  is_enabled: boolean;
}

/** `POST /integration-dominios/test-connection`. */
export interface TestConnectionRequest {
  issue_id: string;
  contador_id: string;
  x_integration_key: string;
}

/** Retorno de `test-connection` sob `data.connection` — shape OPAQUE do
 * provedor externo (passthrough); tipamos só os campos usados no bloco de
 * conexão exibido na tela (Contador/Cliente). */
export interface ConnectionInfo {
  accountant?: string;
  client?: string;
  [key: string]: unknown;
}

/** Opção do select async "Emissor" (`GET .../issue-options`, lista flat). */
export interface IssueOption {
  uuid: string;
  label: string;
}

/** Opção do select async "Contador" (`GET .../contador-options`, lista flat). */
export interface ContadorOption {
  uuid: string;
  label: string;
}
