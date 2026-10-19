// src/services/v2/FeedlotMap/feedlot-map-service.ts
// -----------------------------------------------------------------------------
// FeedlotMap Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Confinamento — Mapa de Confinamento). Casa própria, TASK-FE-042-200
// (execução 042).
//
//   GET /feedlot-map → árvore composta yards[].sectors[].components[],
//                       feedlot-map_view (S026/R02). Repara e persiste
//                       conflitos de posição ANTES da resposta (S063,
//                       side-effect do backend, não do front).
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem axios cru, sem fetch em
// componente (Lei 3/7).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response, ResponsePagination } from '@/@types/response-api';
import type { FeedlotCorralDetail } from '@/@types/v2/FeedlotCorrals';
import type { FeedlotMapTree } from '@/@types/v2/FeedlotMap';
import type {
  FeedlotCorralBatchOption,
  SyncCorralBatchesRequest,
  UpdateCorralDatesRequest,
} from '@/@types/v2/FeedlotMap/batches';
import type { FeedlotCorralDeathData } from '@/@types/v2/FeedlotMap/death';
import type { CreateCorralDietHistoryRequest } from '@/@types/v2/FeedlotMap/diet';
import type {
  FeedlotCorralSanitaryData,
  FeedlotCorralSanitaryStockOption,
  SaveMultipleSanitariesRequest,
  SaveMultipleSanitariesResponseData,
} from '@/@types/v2/FeedlotMap/sanitary';
import type {
  FeedlotCorralTransferOptions,
  TransferCorralBatchRequest,
} from '@/@types/v2/FeedlotMap/transfer';
import type {
  FeedlotCorralWeighingAnimal,
  SaveMultipleWeighingsRequest,
  WeighingParseResultItem,
} from '@/@types/v2/FeedlotMap/weighing';
import type { MeasurementOption } from '@/@types/v2/Measurements';

async function getFeedlotMapTree(): Promise<Response<FeedlotMapTree>> {
  const { data } = await api.V2.get<Response<FeedlotMapTree>>('/feedlot-map');
  return data;
}

export interface FeedlotMapPriorityItem {
  uuid: string;
  priority: number;
}

// Reorder de pátios (`R03`, `AM08`) — TASK-FE-042-202. `feedlot-map_manage`
// (mutação do widget, DEC-MAP-04), não `feedlot-yards_edit`.
async function reorderFeedlotYards(items: FeedlotMapPriorityItem[]): Promise<Response<null>> {
  const { data } = await api.V2.put<Response<null>>('/feedlot-map/yards/reorder', { items });
  return data;
}

// Reorder de setores dentro do MESMO pátio (`R04`, `AM09`) — TASK-FE-042-202.
async function reorderFeedlotSectors(items: FeedlotMapPriorityItem[]): Promise<Response<null>> {
  const { data } = await api.V2.put<Response<null>>('/feedlot-map/sectors/reorder', { items });
  return data;
}

export interface FeedlotComponentReorderItem {
  uuid: string;
  line: number;
  column: number;
}

// Reorder de componentes (curral/rua, `R05`/`AM10`) — `GAP-FE-240` resolvido
// (backend passou a expor `component.uuid` na árvore, campo aditivo em
// `GetFeedlotMapTreeAction::formatComponent()`). Payload por `{uuid, line,
// column}` (NÃO `priority` como yards/sectors) — mirror
// `ReorderFeedlotComponentsRequest::rules()`.
async function reorderFeedlotComponents(
  items: FeedlotComponentReorderItem[]
): Promise<Response<null>> {
  const { data } = await api.V2.put<Response<null>>('/feedlot-map/components/reorder', { items });
  return data;
}

// Lotes disponíveis para o curral (`LK09`, `TASK-FE-042-209`) — exclusão
// cruzada curral/área/pastejo, Action DEDICADA (distinta do genérico
// `GET /batches/options`). NÃO refazer ao trocar `entry_date` (mirror da
// decisão da Tarefa — o endpoint não aceita esse parâmetro).
async function getCorralBatchOptions(
  corralUuid: string
): Promise<Response<FeedlotCorralBatchOption[]>> {
  const { data } = await api.V2.get<Response<FeedlotCorralBatchOption[]>>(
    `/feedlot-map/corrals/${corralUuid}/batch-options`
  );
  return data;
}

// Sincroniza os lotes do curral (`R08`, `AM14`, `TASK-FE-042-209`) — datas,
// dieta, consumo, GMD esperado e o array de lotes vinculados.
async function syncCorralBatches(
  corralUuid: string,
  payload: SyncCorralBatchesRequest
): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.put<Response<FeedlotCorralDetail>>(
    `/feedlot-map/corrals/${corralUuid}/batches`,
    payload
  );
  return data;
}

// Opções de transferência (`LK17`, `TASK-FE-042-210`) — lotes do curral de
// origem + currais/áreas/pastejos destino elegíveis, 4 grupos numa única
// chamada.
async function getCorralTransferOptions(
  corralUuid: string
): Promise<Response<FeedlotCorralTransferOptions>> {
  const { data } = await api.V2.get<Response<FeedlotCorralTransferOptions>>(
    `/feedlot-map/corrals/${corralUuid}/transfer-options`
  );
  return data;
}

// Transfere o lote do curral de origem para curral/área/pastejo (`R25`,
// `AM15`, `TASK-FE-042-210`).
async function transferCorralBatch(
  corralUuid: string,
  payload: TransferCorralBatchRequest
): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>(
    `/feedlot-map/corrals/${corralUuid}/transfer-batch`,
    payload
  );
  return data;
}

// Atualiza datas/GMD previsto (`R26`, `AM16`, `TASK-FE-042-211`) — update
// simples, sem histórico dedicado (mirror `IG22`).
async function updateCorralDates(
  corralUuid: string,
  payload: UpdateCorralDatesRequest
): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.put<Response<FeedlotCorralDetail>>(
    `/feedlot-map/corrals/${corralUuid}/dates`,
    payload
  );
  return data;
}

// Registra mudança de dieta do curral (`R28`, `AM17`, `TASK-FE-042-212`) —
// cria histórico e atualiza `diet_id`/`feed_intake` do curral na mesma
// transação (`SE13`, side-effect do backend). Endpoint GLOBAL (não escopado
// por curral na URL) — `feedlot_corral_uuid` vai no payload.
async function createCorralDietHistory(
  payload: CreateCorralDietHistoryRequest
): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>('/feedlot-corral-diet-histories', payload);
  return data;
}

// Lookup scoped ao curral para o diálogo Morte (`R22`, `TASK-FE-042-216`) —
// animais ACTIVE (com `batch_uuid` de cada) + causas de morte habilitadas.
// Persistência é REUSO TOTAL de `createDeathAnimal` (`death-animal-service.ts`),
// nenhum endpoint de escrita novo aqui.
//
// ADAPTADOR (rejeição QA rodada 3, MAPA3-01/D3): a Action de leitura da API
// (`GetFeedlotCorralDeathDataAction`) devolve o shape CRU do model —
// `animals: {uuid, identification, batch_uuid, batch_description}[]` e
// `causes: {uuid, description}[]` — SEM `value`/`label`. O tipo já declarado
// (`FeedlotCorralDeathData`) exige `Option`-like `{value,label}`; o cast
// genérico do axios mentia sobre o shape real, fazendo o `<Select>` renderizar
// opções sem texto e não selecionáveis (barras vazias). Mapeamos aqui, na
// borda do serviço, preservando `batch_uuid` (usado no submit).
//
// Label rico (rejeição QA rodada 3, decisão do dono pela fidelidade ao
// legado `ModalMorte.js:122-124`): `${identification} – ${batch_description}`.
// `batch_description` vazio/ausente degrada para só `identification` (sem
// " – " solto) — SEM MOCK, nenhum valor inventado quando a API não tem o dado.
interface FeedlotCorralDeathAnimalRaw {
  uuid: string;
  identification: string;
  batch_uuid: string;
  batch_description: string | null;
}

interface FeedlotCorralDeathCauseRaw {
  uuid: string;
  description: string;
}

interface FeedlotCorralDeathDataRaw {
  animals: FeedlotCorralDeathAnimalRaw[];
  causes: FeedlotCorralDeathCauseRaw[];
}

async function getCorralDeathData(corralUuid: string): Promise<Response<FeedlotCorralDeathData>> {
  const { data } = await api.V2.get<Response<FeedlotCorralDeathDataRaw>>(
    `/feedlot-map/corrals/${corralUuid}/death-data`
  );

  return {
    ...data,
    data: {
      animals: data.data.animals.map((animal) => ({
        value: animal.uuid,
        label: animal.batch_description
          ? `${animal.identification} – ${animal.batch_description}`
          : animal.identification,
        batch_uuid: animal.batch_uuid,
      })),
      causes: data.data.causes.map((cause) => ({
        value: cause.uuid,
        label: cause.description,
      })),
    },
  };
}

// Animais do curral para a tabela de pesagem manual (`R09`, `TASK-FE-042-213`)
// — `identification`/`batch_description`/`last_weighing_date`/`last_weight`
// (readonly, já com o fallback peso/data de entrada resolvido server-side).
//
// ADAPTADOR (fix cirúrgico modal Pesagem Manual): a Action da API devolve o
// shape CRU do model — `{uuid, identification, batch_description,
// last_weight, last_weight_date}` — SEM remapear para o tipo esperado pelo
// front (`FeedlotCorralWeighingAnimal`: `animal_uuid`/`last_weighing_date`),
// ao contrário de `getCorralDeathData`/`getCorralSanitaryData` acima, que já
// fazem esse remapeamento na borda do serviço. O cast genérico do axios
// mentia sobre o shape real, deixando `animal_uuid`/`last_weighing_date`
// `undefined` — "Última Pesagem"/"Dias"/"GMD" ficavam "—" e o submit falhava
// silenciosamente (schema Yup exige `animal_uuid`). Mapeamos aqui, mirror do
// padrão acima; API/Action não tocadas.
interface FeedlotCorralWeighingAnimalRaw {
  uuid: string;
  identification: string;
  batch_description: string;
  last_weight: number | null;
  last_weight_date: string | null;
}

async function getCorralAnimalsForWeighing(
  corralUuid: string
): Promise<Response<FeedlotCorralWeighingAnimal[]>> {
  const { data } = await api.V2.get<Response<FeedlotCorralWeighingAnimalRaw[]>>(
    `/feedlot-map/corrals/${corralUuid}/animals`
  );

  return {
    ...data,
    data: data.data.map((animal) => ({
      animal_uuid: animal.uuid,
      identification: animal.identification,
      batch_description: animal.batch_description,
      last_weighing_date: animal.last_weight_date,
      last_weight: animal.last_weight,
    })),
  };
}

// -----------------------------------------------------------------------------
// Prelink Mapa→Venda de Animais (`corral_id`, TASK Mapa/Venda "religar
// Vender Animais", `CreateOrUpdateMovementSale.tsx`) — MESMO endpoint
// corral-scoped acima, consumido em separado. ACHADO DE FIDELIDADE: o shape
// REAL devolvido por `GetFeedlotCorralAnimalsForWeighingAction::execute`
// (GB.Cerne.Api, confirmado no código-fonte do Action) é `{uuid,
// identification, batch_description, last_weight, last_weight_date}` —
// DIVERGE do tipo `FeedlotCorralWeighingAnimal` (`animal_uuid`/
// `last_weighing_date`) usado por `getCorralAnimalsForWeighing`/
// `FeedlotCorralWeighingDialog.tsx` acima, já existente ANTES desta Tarefa e
// fora deste fluxo (não corrigido aqui — risco de regressão em feature
// alheia). Esta função usa o shape REAL confirmado no backend, sem herdar a
// divergência pré-existente.
export interface FeedlotCorralAnimalForSalePrefill {
  uuid: string;
  identification: string;
  batch_description: string | null;
  last_weight: number | null;
  last_weight_date: string | null;
}

async function getCorralAnimalsForSalePrefill(
  corralUuid: string
): Promise<Response<FeedlotCorralAnimalForSalePrefill[]>> {
  const { data } = await api.V2.get<Response<FeedlotCorralAnimalForSalePrefill[]>>(
    `/feedlot-map/corrals/${corralUuid}/animals`
  );
  return data;
}

// Submit único da pesagem (`R34`, `TASK-FE-042-213`) — endpoint GLOBAL (não
// escopado por curral), arrays paralelos `animal_uuids`/`weights`.
async function saveMultipleWeighings(
  payload: SaveMultipleWeighingsRequest
): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>('/weighings-multiple', payload);
  return data;
}

// Download síncrono do template xlsx (`R10`, `TASK-FE-042-214`) — resposta
// binária FORA do envelope `ApiResponse`, mirror `downloadMovementSaleReport`
// (`responseType: 'blob'`, nunca `window.open`/`<a href>` direto).
async function downloadWeighingTemplate(corralUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/feedlot-map/corrals/${corralUuid}/weighing-template`,
    undefined,
    { responseType: 'blob' }
  );
  return data;
}

// Upload+parse da planilha preenchida (`R11`, `TASK-FE-042-214`) — multipart,
// NÃO persiste (`SE14`/`IG28`), só devolve os pesos reconhecidos para
// hidratar a MESMA tabela de `getCorralAnimalsForWeighing`.
async function parseWeighingSpreadsheet(
  corralUuid: string,
  file: File
): Promise<Response<WeighingParseResultItem[]>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<WeighingParseResultItem[]>>(
    `/feedlot-map/corrals/${corralUuid}/weighing-parse`,
    fd
  );
  return data;
}

// Lookup scoped ao curral para o diálogo Sanitário (`R21`, `TASK-FE-042-215`)
// — animais ACTIVE do curral + armazéns `active` da fazenda (`LK13`).
//
// ADAPTADOR (rejeição QA rodada 3, MAPA3-01/D1): raiz COMPARTILHADA com o D3
// da Morte acima — `GetFeedlotCorralSanitaryDataAction` devolve `animals` no
// shape CRU do model (`{uuid, identification}`, SEM `value`/`label`), embora
// `warehouses` NA MESMA Action já venha corretamente `{value,label}` (não
// mexer). O `<Select multiple>` de Animais lia `label`/`value` `undefined` em
// toda opção — item sem texto e, como o modal pré-seleciona TODOS os animais
// por padrão, toda opção batia com o valor `undefined` selecionado (parede de
// barras verdes preenchidas). Mapeamos só `animals` aqui.
interface FeedlotCorralSanitaryAnimalRaw {
  uuid: string;
  identification: string;
}

interface FeedlotCorralSanitaryDataRaw {
  animals: FeedlotCorralSanitaryAnimalRaw[];
  warehouses: FeedlotCorralSanitaryData['warehouses'];
}

async function getCorralSanitaryData(
  corralUuid: string
): Promise<Response<FeedlotCorralSanitaryData>> {
  const { data } = await api.V2.get<Response<FeedlotCorralSanitaryDataRaw>>(
    `/feedlot-map/corrals/${corralUuid}/sanitary-data`
  );

  return {
    ...data,
    data: {
      animals: data.data.animals.map((animal) => ({
        value: animal.uuid,
        label: animal.identification,
      })),
      warehouses: data.data.warehouses,
    },
  };
}

// Cascata armazém→produto (`R35`, `TASK-FE-042-215`) — rota DEDICADA do Mapa
// (`GAP-FE-244`, correção de fidelidade exec-042): cada opção é uma LINHA de
// `Stock` (produto+LOTE), não um produto deduplicado — `quantity`/`lot`
// vêm nela mesma (mirror `product.quantity`/`product.lot` do legado
// `ModalSanitario.js@handleProductChange`), SEM chamada extra de saldo.
// Adaptador para `ResponsePagination` (1 página só) — mesmo racional de
// `listSanitaryProductsByWarehouse`.
// `search` (TASK-FE-063-SANITARY-SEARCH-01) — opt-in, mirror EXATO de
// `listWarehouseOptions` (`warehouse-service.ts`): repassado como query
// param puro; ausência preserva 100% o comportamento anterior (filtro
// feito só no client pelo `react-select-async-paginate`).
async function listFeedlotMapSanitaryProductsByWarehouse(
  warehouseUuid: string,
  search?: string
): Promise<ResponsePagination<FeedlotCorralSanitaryStockOption[]>> {
  const { data } = await api.V2.get<Response<FeedlotCorralSanitaryStockOption[]>>(
    `/feedlot-map/sanitary/products-by-warehouse/${warehouseUuid}`,
    { search: search || undefined }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// Cascata produto→medida (`R36`, `TASK-FE-042-215`) — mesma REUSO/rota nova
// de `listFeedlotMapSanitaryProductsByWarehouse` acima.
async function listFeedlotMapSanitaryMeasurements(
  productUuid: string
): Promise<Response<MeasurementOption[]>> {
  const { data } = await api.V2.get<Response<MeasurementOption[]>>(
    `/feedlot-map/sanitary/measurements/${productUuid}`
  );
  return data;
}

// Persistência do sanitário múltiplo (`R37`, `TASK-FE-042-215`) — GAP-FE-244:
// corrigido de `FormData`+arrays paralelos (nomes legado, incompatíveis com
// o Form Request atual) para JSON `{ animal_uuids, items[] }`, mirror EXATO
// de `StoreFeedlotCorralSanitaryMultipleRequest::rules()`. Cria 1 `Sanitary`
// por lote + `ItemSanitary` por item + decrementa o `Stock` exato
// (`items[].stock_uuid`), tudo transacional no backend.
async function saveMultipleSanitaries(
  corralUuid: string,
  payload: SaveMultipleSanitariesRequest
): Promise<Response<SaveMultipleSanitariesResponseData>> {
  const { data } = await api.V2.post<Response<SaveMultipleSanitariesResponseData>>(
    `/feedlot-map/corrals/${corralUuid}/sanitaries-multiple`,
    payload
  );
  return data;
}

export {
  createCorralDietHistory,
  downloadWeighingTemplate,
  getCorralAnimalsForSalePrefill,
  getCorralAnimalsForWeighing,
  getCorralBatchOptions,
  getCorralDeathData,
  getCorralSanitaryData,
  getCorralTransferOptions,
  getFeedlotMapTree,
  listFeedlotMapSanitaryMeasurements,
  listFeedlotMapSanitaryProductsByWarehouse,
  parseWeighingSpreadsheet,
  reorderFeedlotComponents,
  reorderFeedlotSectors,
  reorderFeedlotYards,
  saveMultipleSanitaries,
  saveMultipleWeighings,
  syncCorralBatches,
  transferCorralBatch,
  updateCorralDates,
};
