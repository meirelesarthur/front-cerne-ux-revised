// src/services/v2/Contadores/contador-service.ts
// -----------------------------------------------------------------------------
// Contador Service — API v1 do backend Laravel GB.Cerne (Escritório de
// Contabilidade), domínio Fiscal/Contábil.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /contadores                  → data: ContadorListItem[] + meta de paginação
//   GET    /contadores/issues-elegiveis  → data: IssueEligibleRef[], SEM meta (não pagina)
//   GET    /contadores/{uuid}            → data: ContadorDetail (inclui city/issues)
//   POST   /contadores                   → payload ContadorPayload (12 campos sempre completos)
//   PUT    /contadores/{uuid}            → payload ContadorPayload (mesmas regras do POST, sem `sometimes`)
//   DELETE /contadores/{uuid}            → 204; 422 estruturado `errors.in_use[]` se houver dependentes
//
// `listContadores` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery) consome — mesmo adaptador
// estrutural de `listPlanAccounts`/`listCities`.
//
// TASK-CT-03a cobriu LISTAGEM + exclusão. TASK-CT-03b adiciona
// `getContador`/`createContador`/`updateContador`/`listEligibleIssues`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ContadorDetail,
  ContadoresListEnvelope,
  ContadorListItem,
  ContadorPayload,
  IssueEligibleRef,
} from '@/@types/v2/Contadores';

// Params aceitos pela listagem — paginação padrão + `search` (ILIKE em
// `razao_social`/`nome_fantasia`/`cnpj`, Contador-contrato §3). Único filtro
// real do contrato — não inventar filtro de cidade/emissor fiscal sem base
// contratual.
export interface ListContadoresParams extends PaginationQueryParams {
  search?: string;
}

async function listContadores(
  params: ListContadoresParams
): Promise<ResponsePagination<ContadorListItem[]>> {
  const { data } = await api.V2.get<ContadoresListEnvelope>('/contadores', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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

async function deleteContador(contadorUuid: string) {
  const { data } = await api.V2.delete(`/contadores/${contadorUuid}`);
  return data;
}

// ---- TASK-CT-03b: detalhe (form) + create/update + elegibilidade ----------

async function getContador(contadorUuid: string) {
  const { data } = await api.V2.get<Response<ContadorDetail>>(`/contadores/${contadorUuid}`);
  return data;
}

async function createContador(payload: ContadorPayload) {
  const { data } = await api.V2.post<Response<ContadorDetail>>('/contadores', payload);
  return data;
}

async function updateContador(contadorUuid: string, payload: ContadorPayload) {
  const { data } = await api.V2.put<Response<ContadorDetail>>(
    `/contadores/${contadorUuid}`,
    payload
  );
  return data;
}

// GET /contadores/issues-elegiveis — SEM paginação (`ApiResponse::success`
// simples, sem `meta`) — `ListEligibleIssuesAction` devolve a Collection
// inteira (lista pequena por design: Emissores Fiscais elegíveis de 1
// tenant/farm). Não aceita `search` — o filtro de busca do `CheckboxListField`
// é aplicado CLIENT-SIDE sobre esta lista já carregada (ver `useContadores.tsx`).
async function listEligibleIssues() {
  const { data } = await api.V2.get<Response<IssueEligibleRef[]>>('/contadores/issues-elegiveis');
  return data;
}

// ---- TASK-LCDPR-FE-01 (CONTRATO-API-LCDPR §10, `GET /contadores/options`) --
// Fachada MÍNIMA options-source (LU-02), mirror 1:1 de
// `listProprietaryOptions` (`src/services/v2/CadastrosBase/Proprietary/
// proprietary-service.ts:164-173`) — MESMO shape de retorno
// (`{uuid, label}[]`, sem paginação). Diferente de `listProprietaryOptions`,
// NÃO recebe `scope` (Contador não tem esse conceito no backend — o
// endpoint real já escopa por fazenda/tenant no `ContadorOptionsRequest`,
// sem parâmetro de query). `search` é aceito na assinatura por paridade com
// o padrão do projeto, mas o backend real (`ContadorOptionsRequest::rules()`)
// não filtra por ele hoje — o Cadastro de CashBook (TASK-LCDPR-FE-03) chama
// sem argumento e filtra localmente no `Select` estático (lista completa
// carregada UMA VEZ, `CL-08`/`CL-23` — nunca `AsyncSearchSelect`).
export interface ContadorOption {
  uuid: string; // contadors.uuid
  label: string; // nome_fantasia (ContadorOptionResource, `CL-08`)
}

async function listContadorOptions(search?: string): Promise<ContadorOption[]> {
  const { data } = await api.V2.get<Response<ContadorOption[]>>('/contadores/options', {
    search: search || undefined,
  });
  return data.data ?? [];
}

export {
  createContador,
  deleteContador,
  getContador,
  listContadores,
  listContadorOptions,
  listEligibleIssues,
  updateContador,
};
