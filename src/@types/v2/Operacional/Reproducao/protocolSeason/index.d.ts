// src/@types/v2/Operacional/Reproducao/protocolSeason/index.d.ts
// -----------------------------------------------------------------------------
// DTOs/tipos do módulo "Protocolos/Estação" (ProtocolSeason — Operacional /
// Reprodução, F-057, execução 040, TASK-FE-1050). 25 campos do
// `field_manifest` legado mapeados 1:1 (14 cabeçalho + 11 item) — contrato de
// tela `ProtocolsSeason-contrato-frontend.md` §2/§3. Módulo-irmão estrutural:
// `@/@types/v2/BreedingBatch` (mesma esteira 040→048).
//
// Lei 1 (Tipagem Limpa): nenhum DTO abaixo é redeclarado em service/componente
// — só aqui. `Option<T>` obrigatório em todo Select (nunca `string` direta).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ---- Leitura (GET index/show) — ProtocolSeasonResource. `timeline` presente
// SÓ no `show` (CAL-007, contrato §2.2). ----------------------------------
export interface ProtocolSeasonData {
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  date: string;
  breeding_season: { uuid: string; description: string };
  user: { uuid: string; name: string };
  employee: { uuid: string; name: string } | null;
  matings_count: number;
  items: ProtocolItemData[];
  timeline?: ProtocolSeasonTimelineGroup[];
}

export interface ProtocolItemData {
  uuid: string;
  product: { uuid: string; description: string } | null;
  service: number | null;
  warehouse: { uuid: string; description: string } | null;
  stock_uuid: string | null;
  measurement: { uuid: string; description: string } | null;
  date: string;
  time: string | null;
  quantity: number;
  identification: string | null;
  description: string | null;
}

export interface ProtocolSeasonTimelineGroup {
  date: string;
  interval_days: number | null;
  weekday: number;
  items: ProtocolItemData[];
}

// ---- Corpo do formulário (React Hook Form) — cabeçalho. `code`/`user_uuid`/
// `user_name` NÃO são inputs livres (readonly/calculados — contrato §3.1
// linhas 8/10/11), mas participam do form para hidratação/round-trip. -------
export interface ProtocolSeasonForm {
  code: string;
  date: string;
  user_uuid: string;
  user_name: string;
  breeding_season_uuid: Option<string> | null;
  name: string;
  description: string;
  items: ProtocolItemFieldValue[];
}

// ---- Item do subcadastro (`useFieldArray`, name: 'items'). `identification`
// e `stock_display` são CALCULADOS (CAL-005/CAL-004) — existem no form só
// para exibição readonly (contrato §3.2 linhas 15/24). ----------------------
export interface ProtocolItemFieldValue {
  identification: string;
  date: string;
  time: string | null;
  warehouse_uuid: Option<string> | null;
  stock_uuid: string | null;
  product_uuid: Option<string> | null;
  service: Option<number> | null;
  measurement_uuid: Option<string> | null;
  stock_display: string;
  quantity: number | null;
  description?: string;
}

// ---- Filtro da listagem. Selects guardam `Option<string>` no estado do
// drawer (re-hidratação do label); o index converte para `.value` cru antes de
// enviar ao service (mirror `FeedlotSectors`). ------------------------------
export interface ProtocolSeasonFilterForm {
  name: string | null;
  user_uuid: Option<string> | null;
  breeding_season_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ProtocolSeasonFilterRequest {
  name?: string;
  user_uuid?: string;
  breeding_season_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ---- Payload de criação/atualização — mirror `ProtocolSeasonData`/
// `ProtocolItemData` (Spatie `#[MapInputName(SnakeCaseMapper::class)]`,
// `App/Data/ProtocolSeason/*.php`, código real do `api_root`). `farmUuid`/
// `tenant_id` NUNCA aqui (resolvidos via header `X-Farm-Id`,
// get_spa_api_client_pattern).
//
// ⚠️ ACHADO DE RECONCILIAÇÃO (diverge do contrato-frontend §2.3, que
// documentava wire camelCase): o DTO real usa `SnakeCaseMapper` — o payload
// JSON PRECISA ser snake_case (`breeding_season_uuid`, `user_uuid`,
// `product_uuid`, `warehouse_uuid`, `stock_uuid`, `measurement_uuid`), não
// camelCase. Confirmado por leitura direta de
// `app/Data/ProtocolSeason/ProtocolSeasonData.php`/`ProtocolItemData.php` no
// `api_root` (TASK-FE-1050/1059, achado reportado no fechamento). ---------
export interface CreateProtocolSeasonRequest {
  code: string;
  name: string;
  description?: string;
  date: string;
  breeding_season_uuid: string;
  user_uuid: string;
  employee_uuid?: string;
  items: CreateProtocolItemRequest[];
}

export interface CreateProtocolItemRequest {
  product_uuid?: string;
  service?: number;
  warehouse_uuid?: string;
  stock_uuid?: string;
  // Optional (Execução 065, TASK A complemento) — item SÓ-serviço não tem
  // `measurement_uuid`/`quantity` (schema condiciona os dois a `product_uuid`,
  // `protocolSeason-schema.ts`); chave ausente = semântica `Optional` que a
  // API já aceita (`ProtocolItemData`). Continuam obrigatórios NA PRÁTICA
  // quando há produto — a omissão só ocorre no ramo só-serviço.
  measurement_uuid?: string;
  date: string;
  time?: string;
  description?: string;
  quantity?: number;
  identification?: string;
}

// ⚠️ ACHADO DE RECONCILIAÇÃO (diverge de contrato-frontend §4.2/TASK-FE-1059,
// que previa PATCH parcial do cabeçalho em UPDATE): `ProtocolSeasonController
// ::update()` consome o MESMO `ProtocolSeasonRequest` do `store()` — `code`/
// `name`/`date`/`breeding_season_uuid`/`user_uuid`/`items` são `required` em
// AMBOS os verbos (sem `|Optional` no DTO para esses campos). Enviar só
// `dirtyFields` no UPDATE causaria 422 garantido. UPDATE usa o MESMO shape
// de CREATE — cabeçalho sempre completo + `items[]` sempre integral.
export type UpdateProtocolSeasonRequest = CreateProtocolSeasonRequest;

// Enum de serviço (LKP-009) — RUNTIME const, mora em
// `@/constants/operacional/reproducao/protocolSeason/protocol-item-service`
// (get_pwa_constants_and_mappers_pattern §2: enums são CONSTANTS, não DTOs de
// `@types/`). Um `.d.ts` é ambient-only — Rollup/Vite não o bundla como
// módulo real, então um `export const` com valor aqui quebraria o build de
// produção (achado corrigido, ver `vite build`).
