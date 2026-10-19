// src/@types/v2/HarvestProduct/index.d.ts
// -----------------------------------------------------------------------------
// DTOs/tipos do módulo "Colheita de Frutas" (HarvestProduct — Operacional /
// Agricultura, F-040, execução 040, TASK-FE-1092). Namespace `HarvestProduct`
// (singular) — NUNCA `Harvest`/`Harvests` (módulo de Safra já migrado,
// `@/@types/v2/Harvests`, contrato §7.3). 12 campos de create / 14 de edit
// (10 negócio + `code` + `boxes[]`), fonte HarvestProduct-contrato-
// arquitetural.md §7.4.
//
// Lei 1 (Tipagem Limpa): `Option<T>` obrigatório em todo Select
// (`areaUuid`/`clientUuid`/`productUuid`/`cityUuid`), nunca `string` direta.
//
// Wire do backend é SNAKE_CASE (`#[MapInputName(SnakeCaseMapper::class)]` em
// `HarvestProductData`/`HarvestProductFilterData`, confirmado por leitura
// direta do `api_root`) — os `*Request` abaixo já modelam o shape enviado ao
// axios (snake_case); o form React usa camelCase (`areaUuid` etc., mandato do
// contrato §7.4) e a tela converte um para o outro no submit (mirror
// `ProtocolSeasonForm`/`CreateProtocolSeasonRequest`, que fazem a mesma
// separação forma↔wire).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ---- Leitura (GET index/show) — HarvestProductResource. -------------------
export interface HarvestProductBoxData {
  uuid: string;
  /** String — preserva as 5 casas decimais físicas (`decimal(12,5)`,
   *  `HarvestProductBoxResource::toArray()`, DIV-03). NUNCA truncar para 2
   *  casas ao converter para número na UI. */
  amount: string;
}

export interface HarvestProductData {
  uuid: string;
  code: string;
  date: string;
  plate: string | null;
  driver_name: string | null;
  driver_nif: string | null;
  product: { uuid: string; description: string };
  area: { uuid: string; description: string };
  client: { uuid: string; name: string | null };
  city: { uuid: string; title: string; state_letter: string | null } | null;
  boxes: HarvestProductBoxData[];
  boxes_count: number;
  /** String — mesma precisão de `amount`, `number_format(..., 5)` no backend. */
  total_weight: string;
  created_at: string;
}

// ---- Corpo do formulário (React Hook Form) — cabeçalho. `code` participa
// só para exibição (disabled/placeholder no create, valor real no edit),
// NUNCA enviado no payload de criação (contrato §7.4 D1). -------------------
export interface HarvestProductForm {
  code: string;
  date: string;
  areaUuid: Option<string> | null;
  clientUuid: Option<string> | null;
  productUuid: Option<string> | null;
  plate: string;
  cityUuid: Option<string> | null;
  driverName: string;
  driverNif: string;
  boxes: HarvestProductBoxForm[];
}

// ---- Linha do subcadastro (`useFieldArray`, name: 'boxes'). `uuid` é campo
// INTERNO (sem UI própria) — `undefined`/`null` = caixa nova (INSERT);
// presente = caixa existente (UPDATE); ausente na lista final = caixa
// removida (DELETE, reconciliação do lado do backend). ----------------------
export interface HarvestProductBoxForm {
  uuid?: string | null;
  amount: number | null;
}

// ---- Filtro da listagem — FL-01..FL-04 (contrato §7.4). --------------------
export interface HarvestProductFilterForm {
  areaUuid: Option<string> | null;
  clientUuid: Option<string> | null;
  dateStart: string | null;
  dateEnd: string | null;
}

// Forma "achatada" (sem Option) usada pelo `useCustomGridQuery`/service —
// `dateStart`/`dateEnd` mapeados para `date_start`/`date_end` (D6,
// CONFIRMADO contra `HarvestProductFilterData` real do `api_root`) dentro do
// service, nunca aqui.
export interface HarvestProductFilterRequest {
  areaUuid?: string;
  clientUuid?: string;
  dateStart?: string;
  dateEnd?: string;
}

// ---- Payload de escrita (POST/PUT) — wire SNAKE_CASE, mirror
// `HarvestProductData` do backend (`#[MapInputName(SnakeCaseMapper::class)]`).
// `farm_id`/`tenant_id` NUNCA aqui (resolvidos via header `X-Farm-Id`).
// `code` NUNCA presente — gerado no servidor (contrato §7.4 D1). ------------
export interface HarvestProductBoxRequest {
  /** Chave SEMPRE presente no payload (`present|nullable` no PUT/PATCH,
   *  `sometimes|nullable` no POST — `HarvestProductRequest`, api_root):
   *  `null` = caixa nova (INSERT); uuid presente = caixa existente (UPDATE);
   *  ausente da lista final = caixa removida (DELETE). */
  uuid: string | null;
  /** String — evita artefato de ponto flutuante ao serializar o `number` do
   *  form (`Number(amount).toFixed(5)` no call site), preservando as 5 casas
   *  que o backend espera/devolve (DIV-03). */
  amount: string;
}

export interface CreateHarvestProductRequest {
  date: string;
  area_uuid: string;
  client_uuid: string;
  product_uuid: string;
  plate?: string;
  city_uuid?: string;
  driver_name?: string;
  driver_nif?: string;
  boxes: HarvestProductBoxRequest[];
}

// `UpdateHarvestProductAtomicAction::handle()` (api_root, TASK-BE-1071) usa
// `fill()` incondicional a partir do DTO — o cabeçalho SEMPRE completo no
// UPDATE também (mirror `ProtocolSeasonRequest`, NÃO um PATCH parcial de
// `dirtyFields`); só o "nada mudou → não chama a API" (Lei 2) é client-side.
export type UpdateHarvestProductRequest = CreateHarvestProductRequest;

// ---- Options — lookups locais (`areas/options`/`clients/options`, flat,
// `ApiResponse::success`, SEM paginação real) e AJAX-paginados
// (`products/options`/`cities/options`, `ApiResponse::paginated`),
// confirmados por leitura direta dos Resources reais do `api_root`
// (`AreaOptionResource`/`ClientOptionResource`/`ProductOptionResource`/
// `CityOptionResource`). --------------------------------------------------
export interface AreaOptionItem {
  uuid: string;
  description: string;
}

export interface ClientOptionItem {
  uuid: string;
  name: string | null;
}

export interface ProductOptionItem {
  uuid: string;
  code: string;
  description: string;
}

export interface CityOptionItem {
  uuid: string;
  title: string;
  state?: { letter: string | null } | null;
}
