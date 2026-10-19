// src/services/v2/ModuleWeighing/module-weighing-service.ts
// -----------------------------------------------------------------------------
// ModuleWeighing Service — API v1 do backend Laravel GB.Cerne
// (`/module-weighings*`, contrato `CONTRATO-API-PESAGEM.md §6`, 15
// endpoints). TASK-MWG-FE-01 (fundação): só o CRUD atômico
// (list/getById/create/update) + `deleteModuleWeighing` (adicionado pela
// TASK-MWG-FE-02, que é quem primeiro precisa excluir da listagem). Os
// demais métodos (wizard `next-step`/`finish`, `nfe`/`transfer`,
// `connector/download`, `module-weighings-report`) são adicionados pelas
// Tarefas que os consomem (TASK-MWG-FE-05/06/07/09/12) — mantém o arquivo
// rastreável por Tarefa, mirror da decisão já tomada em `weighing-service.ts`.
//
// ⚠️ O backend deste domínio AINDA NÃO está implementado (`TASK-PES-01/02/03`
// em curso em paralelo, `NOTA DE DEPENDÊNCIA` do task-packet desta esteira)
// — este service é escrito CONTRA O CONTRATO de API, não contra um endpoint
// testável agora (mesma situação já documentada em `equipment-service.ts`).
//
// Envelope `ApiResponse` padrão (`{ success, message, data, errors, meta }`),
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// `uuid` sempre — nunca `id` sequencial (Lei 10 SPA).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { DiscountRuleType } from '@/@types/v2/DiscountTables';
import type {
  AdvanceModuleWeighingStepPayload,
  ModuleWeighingCategory,
  ModuleWeighingClassification,
  ModuleWeighingEligibleDfe,
  ModuleWeighingStatus,
  ModuleWeighingType,
  FinalizeModuleWeighingPayload,
  ModuleWeighingData,
  ModuleWeighingDiscountRuleRef,
  ModuleWeighingFilterRequest,
  ModuleWeighingFinishHydration,
  ModuleWeighingListItem,
  ModuleWeighingNextStepHydration,
  ModuleWeighingPayload,
  ModuleWeighingReportFilterRequest,
  ModuleWeighingWarehouseRef,
  ModuleWeighingsListEnvelope,
  ModuleWeighingNfePrefill,
} from '@/@types/v2/ModuleWeighing/module-weighing';

const BASE = '/module-weighings';

// ---------------------------------------------------------------------------
// Adaptadores GET .../next-step e GET .../finish (correção 050, Bug 2/
// Finalização) — o backend REAL (`GetModuleWeighingNextStepHydrationAction`/
// `GetModuleWeighingFinishHydrationAction`, `ModuleWeighingController.php`)
// devolve um envelope ANINHADO (`{ module_weighing, ... }`), diferente do
// shape PLANO que os tipos de hidratação (escritos CONTRA O CONTRATO, antes
// da API existir) declaram. Estes adaptadores achatam a resposta real na
// fronteira do service — nenhuma tela consome o envelope aninhado
// diretamente. `PUT .../next-step` e `PUT .../finish` (`finalize`) devolvem
// o `ModuleWeighingResource` PLANO (sem envelope) — não passam por adaptador.
// ---------------------------------------------------------------------------

/** Sub-shape de `module_weighing` dentro do envelope de `GET next-step` —
 *  só os campos que a hidratação do wizard consome (`ModuleWeighingResource`
 *  devolve bem mais campos, mas o resto não é usado nesta etapa). */
interface RawNextStepModuleWeighing {
  uuid: string;
  code: string;
  status: ModuleWeighingStatus;
  type: ModuleWeighingType;
  category: ModuleWeighingCategory;
  gross_weight: number | null;
  tare_weight: number | null;
  has_classification: boolean;
  classification: ModuleWeighingClassification | null;
  product: { uuid: string; description: string } | null;
  measurement: { uuid: string; name: string } | null;
  discount_table: { uuid: string; name: string } | null;
  equipment?: { uuid: string; description: string; tara?: number | string | null } | null;
}

interface RawNextStepDiscountRule {
  type: DiscountRuleType;
  initial_limit_percent: number;
  final_limit_percent: number;
  discount_percent: number;
}

interface RawModuleWeighingNextStepResponse {
  module_weighing: RawNextStepModuleWeighing;
  next_status: ModuleWeighingStatus | null;
  active_warehouses: ModuleWeighingWarehouseRef[];
  discount_rules: RawNextStepDiscountRule[];
}

function parseEquipmentTara(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapNextStepHydration(
  raw: RawModuleWeighingNextStepResponse
): ModuleWeighingNextStepHydration {
  const mw = raw.module_weighing;
  const discountRules: ModuleWeighingDiscountRuleRef[] = raw.discount_rules.map((rule) => ({
    type: rule.type,
    initial_limit_percent: rule.initial_limit_percent,
    final_limit_percent: rule.final_limit_percent,
    discount_percent: rule.discount_percent,
  }));

  return {
    uuid: mw.uuid,
    // Correção 050 (BUG-4) — `ModuleWeighingStatus` é um backed enum STRING
    // no backend (`case PesagemInicial = '2'`), então `status`/`next_status`
    // chegam como STRING ("2","3","4") no JSON, embora os tipos de front
    // declarem união de NÚMEROS (checagem só em compile-time, não pega em
    // runtime). Normalizado para número aqui, na fronteira do service, para
    // que TODA comparação a jusante (`WizardModuleWeighingShell`) seja
    // número×número de forma robusta — aceita string OU number vindos da
    // API sem depender de disciplina de cada consumidor.
    status: Number(mw.status) as ModuleWeighingStatus,
    next_status:
      raw.next_status !== null ? (Number(raw.next_status) as ModuleWeighingStatus) : null,
    type: mw.type,
    category: mw.category,
    code: mw.code,
    product_uuid: mw.product?.uuid ?? null,
    gross_weight: mw.gross_weight,
    tare_weight: mw.tare_weight,
    has_classification: mw.has_classification,
    classification: mw.classification,
    discount_table: mw.discount_table
      ? { uuid: mw.discount_table.uuid, description: mw.discount_table.name }
      : null,
    measurement: mw.measurement
      ? { uuid: mw.measurement.uuid, description: mw.measurement.name }
      : null,
    equipment_tara: parseEquipmentTara(mw.equipment?.tara),
    warehouses: raw.active_warehouses,
    discount_rules: discountRules,
  };
}

// ---------------------------------------------------------------------------
// Adaptador GET /module-weighings/{uuid} (correção 050, DIV-02/DIV-03) — o
// backend REAL (`ModuleWeighingResource.php:101-112`) expõe
// `measurement`/`discount_table` como `{uuid,name}` e `farm_to` como
// `{uuid,description}`, DIVERGENTE do shape especulativo dos tipos de front
// escritos contra o contrato antes da API existir
// (`ModuleWeighingMeasurementRef`/`ModuleWeighingDiscountTableRef` usam
// `description`; `ModuleWeighingFarmRef` usa `name`). Sem este adaptador, o
// `fillForm` de edição (`CreateOrUpdateModuleWeighing.tsx`) e o comprovante
// (`ModuleWeighingReceipt.tsx`) re-hidratam esses 3 selects com label
// `undefined` (o `uuid` chega correto, só o label some). Normalizado aqui na
// fronteira do service — mesma técnica de `mapNextStepHydration` acima —
// nenhuma tela lê o shape cru da API diretamente.
// ---------------------------------------------------------------------------
type RawModuleWeighingDetail = Omit<
  ModuleWeighingData,
  'measurement' | 'discount_table' | 'farm_to'
> & {
  measurement: { uuid: string; name: string } | null;
  discount_table: { uuid: string; name: string } | null;
  farm_to: { uuid: string; description: string } | null;
};

function mapModuleWeighingDetail(raw: RawModuleWeighingDetail): ModuleWeighingData {
  return {
    ...raw,
    measurement: raw.measurement
      ? { uuid: raw.measurement.uuid, description: raw.measurement.name }
      : null,
    discount_table: raw.discount_table
      ? { uuid: raw.discount_table.uuid, description: raw.discount_table.name }
      : null,
    farm_to: raw.farm_to ? { uuid: raw.farm_to.uuid, name: raw.farm_to.description } : null,
  };
}

/** Sub-shape de `module_weighing` dentro do envelope de `GET finish`. */
interface RawFinishModuleWeighing {
  uuid: string;
  code: string;
  status: ModuleWeighingStatus;
  type: ModuleWeighingType;
  gross_weight: number | null;
  tare_weight: number | null;
  final_weight?: number | null;
  measurement?: { uuid: string; name: string } | null;
  classification_discount: number | null;
  average_cost: number | null;
  total: number | null;
}

/** `GetModuleWeighingFinishHydrationAction::eligibleDfes()` só seleciona
 *  `id,uuid,number,razao_social` — sem data de emissão. */
interface RawFinishEligibleDfe {
  uuid: string;
  number: string | null;
  razao_social: string | null;
}

interface RawModuleWeighingFinishResponse {
  module_weighing: RawFinishModuleWeighing;
  eligible_dfes: RawFinishEligibleDfe[];
}

function mapFinishHydration(raw: RawModuleWeighingFinishResponse): ModuleWeighingFinishHydration {
  const mw = raw.module_weighing;
  const eligibleDfes: ModuleWeighingEligibleDfe[] = raw.eligible_dfes.map((dfe) => ({
    uuid: dfe.uuid,
    number: dfe.number,
    issuer_name: dfe.razao_social,
    issue_date: null,
  }));

  return {
    uuid: mw.uuid,
    // Correção 050 (BUG-4) — mesma normalização de `mapNextStepHydration`
    // acima (backed enum string-based no backend); `status` aqui alimenta
    // comparações number×number em consumidores futuros do mesmo shape.
    status: Number(mw.status) as ModuleWeighingStatus,
    type: mw.type,
    code: mw.code,
    gross_weight: mw.gross_weight,
    tare_weight: mw.tare_weight,
    final_weight: mw.final_weight ?? null,
    measurement_name: mw.measurement?.name ?? null,
    classification_discount: mw.classification_discount,
    average_cost: mw.average_cost,
    total: mw.total,
    // Backend real não expõe este sinalizador (GAP-PES-08 não implementado
    // como flag) — lista vazia já é um estado honesto, nunca fabricado.
    dfe_lookup_unavailable: false,
    eligible_dfes: eligibleDfes,
  };
}

// ---------------------------------------------------------------------------
// RT-001 — GET /module-weighings (listagem paginada, 5 filtros
// `FM-001..FM-005`, contrato-pesagem-norm.md). Envelope adaptado do
// `ApiResponse` flat para `ResponsePagination` (`useCustomGridQuery`), mesma
// técnica de `listWeighings`/`listWarehouseTransfers` (meta REAL, nunca
// fabricada).
// ---------------------------------------------------------------------------
export interface ListModuleWeighingsParams
  extends PaginationQueryParams, ModuleWeighingFilterRequest {}

async function listModuleWeighings(
  params: ListModuleWeighingsParams
): Promise<ResponsePagination<ModuleWeighingListItem[]>> {
  const { data } = await api.V2.get<ModuleWeighingsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    user_uuid: params.user_uuid || undefined,
    equipment_uuid: params.equipment_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
    product_uuid: params.product_uuid || undefined,
    provider_uuid: params.provider_uuid || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// RT-004 — GET /module-weighings/{uuid} (detalhe — granularidade completa,
// consumido por FE-SCR-02 (editar) e FE-SCR-05 (comprovante)).
async function getModuleWeighingById(uuid: string): Promise<Response<ModuleWeighingData>> {
  const { data } = await api.V2.get<Response<RawModuleWeighingDetail>>(`${BASE}/${uuid}`);
  return { ...data, data: mapModuleWeighingDetail(data.data) };
}

// RT-003 — POST /module-weighings (FE-SCR-02, cria em `status=PreCadastro`;
// `farm_id`/`status` resolvidos pelo servidor, nunca enviados no payload).
async function createModuleWeighing(
  payload: ModuleWeighingPayload
): Promise<Response<ModuleWeighingData>> {
  const { data } = await api.V2.post<Response<ModuleWeighingData>>(BASE, payload);
  return data;
}

// RT-006 — PUT /module-weighings/{uuid} (FE-SCR-02 editar — guarda de status
// no servidor, `GAP-PES-01`: só aceita update completo em `status=PreCadastro`).
async function updateModuleWeighing(
  uuid: string,
  payload: ModuleWeighingPayload
): Promise<Response<ModuleWeighingData>> {
  const { data } = await api.V2.put<Response<ModuleWeighingData>>(`${BASE}/${uuid}`, payload);
  return data;
}

// ---------------------------------------------------------------------------
// RT-007 — DELETE /module-weighings/{uuid} (adicionado pela TASK-MWG-FE-02,
// ação "Excluir" da listagem, `AM-010`). A UI não decide a regra de bloqueio
// (`GAP-PES-02`) — só reage à resposta: `204` remove da lista, `422` mostra a
// `message` do envelope de erro tal qual veio (nunca reescrita no front).
// ---------------------------------------------------------------------------
async function deleteModuleWeighing(uuid: string): Promise<void> {
  await api.V2.delete(`${BASE}/${uuid}`);
}

// ---------------------------------------------------------------------------
// RT-012/RT-013 — GET .../nfe e GET .../transfer (elegibilidade + payload de
// pré-preenchimento, `AM-008`/`AM-009`, TASK-MWG-FE-02). Handoff GAP-PES-07:
// esta Tarefa SÓ consome a elegibilidade e entrega o payload à tela de
// destino (NFe/Transfer, features irmãs, fora deste contrato) via
// navegação — nenhuma Action de vínculo (`nfe-link`/`transfer-link`) é
// chamada aqui. Payload não tipado em detalhe (contrato de API não fixa o
// shape exato — decisão de escopo da Opção do Gap, `CONTRATO-API-PESAGEM
// §5.6/5.7`) — consumido como registro opaco pela tela de destino.
// ---------------------------------------------------------------------------
async function getModuleWeighingNfeEligibility(
  uuid: string
): Promise<Response<ModuleWeighingNfePrefill>> {
  const { data } = await api.V2.get<Response<ModuleWeighingNfePrefill>>(`${BASE}/${uuid}/nfe`);
  return data;
}

async function getModuleWeighingTransferEligibility(
  uuid: string
): Promise<Response<Record<string, unknown>>> {
  const { data } = await api.V2.get<Response<Record<string, unknown>>>(`${BASE}/${uuid}/transfer`);
  return data;
}

// ---------------------------------------------------------------------------
// RT-008/RT-009 — GET/PUT .../next-step (TASK-MWG-FE-05, wizard). `GET` é
// leitura pura, idempotente (fecha DV-014 — o legado hoje pode persistir
// troca de bruto/tara em `type=Avulsa` dentro de um GET, invariante
// corrigido na API). `PUT` avança `status` — só o campo capturado na etapa
// corrente (contrato de tela §6.1).
// ---------------------------------------------------------------------------
async function getModuleWeighingNextStep(
  uuid: string
): Promise<Response<ModuleWeighingNextStepHydration>> {
  const { data } = await api.V2.get<Response<RawModuleWeighingNextStepResponse>>(
    `${BASE}/${uuid}/next-step`
  );
  return { ...data, data: mapNextStepHydration(data.data) };
}

// `PUT next-step` (`ModuleWeighingController::storeNextStep`) devolve o
// `ModuleWeighingResource` PLANO (sem `next_status`/`active_warehouses`/
// `discount_rules`) — NUNCA o mesmo envelope aninhado do `GET`. O chamador
// (`WizardModuleWeighingShell`) não deve gravar esta resposta diretamente no
// cache da hidratação; deve invalidar/refazer o `GET next-step` (Regra 6).
async function advanceModuleWeighingStep(
  uuid: string,
  payload: AdvanceModuleWeighingStepPayload
): Promise<Response<ModuleWeighingData>> {
  const { data } = await api.V2.put<Response<ModuleWeighingData>>(
    `${BASE}/${uuid}/next-step`,
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// RT-010/RT-011 — GET/PUT .../finish (TASK-MWG-FE-07). `GET` leitura pura
// (elegibilidade de DFe, `dfe_lookup_unavailable` — GAP-PES-08); `PUT`
// finaliza (`status=Finalizado`), efeito de estoque inteiramente do
// servidor (contrato de tela §"Regras").
// ---------------------------------------------------------------------------
async function getModuleWeighingFinish(
  uuid: string
): Promise<Response<ModuleWeighingFinishHydration>> {
  const { data } = await api.V2.get<Response<RawModuleWeighingFinishResponse>>(
    `${BASE}/${uuid}/finish`
  );
  return { ...data, data: mapFinishHydration(data.data) };
}

async function finalizeModuleWeighing(
  uuid: string,
  payload: FinalizeModuleWeighingPayload
): Promise<Response<ModuleWeighingData>> {
  const { data } = await api.V2.put<Response<ModuleWeighingData>>(
    `${BASE}/${uuid}/finish`,
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// RT-015 — GET /module-weighings-report (TASK-MWG-FE-09, export Excel
// TASK-MWG-FE-11) — export SÍNCRONO (blob), 1 função interna + 2 wrappers
// finos, mirror ESTRUTURAL EXATO de `downloadCusteioAnimalReport`
// (`costing-animal-report-service.ts`). `type` (filtro de DOMÍNIO
// "Venda/Saída") enviado como número real (incluindo `0`) — nunca `||
// undefined` (isso reintroduziria DV-006 no client: `0 || undefined` vira
// `undefined`). `report_type` ('pdf'|'excel') é o parâmetro de FORMATO,
// reconciliado com o api-architect para NÃO colidir com `type` — nome
// distinto, EXCLUSIVO deste endpoint (diferente de `costing-animal-report`,
// que não tem filtro de domínio `type` e por isso pode reusar o nome com
// segurança).
// ---------------------------------------------------------------------------
async function downloadModuleWeighingReport(
  params: ModuleWeighingReportFilterRequest,
  reportType: 'pdf' | 'excel'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/module-weighings-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      type: params.type,
      category: params.category || undefined,
      warehouse_uuid: params.warehouse_uuid || undefined,
      product_uuid: params.product_uuid || undefined,
      client_uuid: params.client_uuid || undefined,
      report_type: reportType,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function getModuleWeighingReportPdf(
  params: ModuleWeighingReportFilterRequest
): Promise<Blob> {
  return downloadModuleWeighingReport(params, 'pdf');
}

async function getModuleWeighingReportXlsx(
  params: ModuleWeighingReportFilterRequest
): Promise<Blob> {
  return downloadModuleWeighingReport(params, 'excel');
}

export {
  advanceModuleWeighingStep,
  createModuleWeighing,
  deleteModuleWeighing,
  finalizeModuleWeighing,
  getModuleWeighingById,
  getModuleWeighingFinish,
  getModuleWeighingNextStep,
  getModuleWeighingNfeEligibility,
  getModuleWeighingReportPdf,
  getModuleWeighingReportXlsx,
  getModuleWeighingTransferEligibility,
  listModuleWeighings,
  updateModuleWeighing,
};
