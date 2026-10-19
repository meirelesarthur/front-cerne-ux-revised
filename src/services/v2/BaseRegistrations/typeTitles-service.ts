// src/services/v2/BaseRegistrations/typeTitles-service.ts
// -----------------------------------------------------------------------------
// Type Title Service — API v1 do backend Laravel GB.Cerne (Tipos de Título).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /type-titles            → data: TypeTitleListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated(),
//                                     current_page/last_page/per_page/total —
//                                     confirmado em TypeTitleController::index()
//                                     pós-TASK-TT-API-01).
//   GET    /type-titles/{uuid}     → data: TypeTitleDetail
//   POST   /type-titles            → payload TypeTitlePayload (create)
//   PUT    /type-titles/{uuid}     → payload TypeTitlePayload — SEMPRE os 4
//                                     campos (description/type/factor/
//                                     is_enabled), NUNCA delta
//                                     (TypeTitleRequest::rules() não distingue
//                                     verbo — full-resource-replace, mesma
//                                     recorrência de Species/PlanAccount/
//                                     Cultivation).
//   DELETE /type-titles/{uuid}     → 204; 422 estruturado (BusinessRuleException)
//                                     com a mensagem real "Tipo de título está
//                                     em uso e não pode ser excluído." — o
//                                     `onError` GENÉRICO do `useRequest` já
//                                     exibe essa `message`, sem tratamento
//                                     especial de código.
//
// `listTypeTitles` ADAPTA o envelope PAGINADO REAL do backend
// (`ApiResponse::paginated()`) para o shape `ResponsePagination` que a infra
// de grid do projeto (useCustomGridQuery/TableProvider) consome — MESMO
// adaptador de `listCategoryMatrices`/`listLowReasons`, NÃO o truque
// `meta:null` de `listSpecies`/`listBreeds` (TypeTitle pagina de verdade).
//
// Tabela GLOBAL (sem farm_id/tenant_id) — este serviço não adiciona nenhum
// header extra nem depende da fazenda ativa (mesmo racional de
// CategoryMatrix/LowReason).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  TypeTitleDetail,
  TypeTitleListItem,
  TypeTitleOptionItem,
  TypeTitleOptionsListEnvelope,
  TypeTitlePayload,
  TypeTitlesListEnvelope,
} from '@/@types/v2/BaseRegistrations/typeTitles';

// Params aceitos pela listagem — paginação real + busca + filtros reais do
// backend (`is_enabled`/`type`). `factor` NÃO é filtrável (não pedido, não
// suportado por TypeTitleFilterData).
export interface ListTypeTitlesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  type?: '1' | '2' | '3';
}

async function listTypeTitles(
  params: ListTypeTitlesParams
): Promise<ResponsePagination<TypeTitleListItem[]>> {
  const { data } = await api.V2.get<TypeTitlesListEnvelope>('/type-titles', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    type: params.type || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // lê `meta.total`/`per_page`/`current_page`/`last_page` REAIS, NÃO fixados
  // em `1`/`data.length` (diferente de listSpecies).
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

async function deleteTypeTitle(typeTitleUuid: string) {
  const { data } = await api.V2.delete(`/type-titles/${typeTitleUuid}`);
  return data;
}

// TASK-TT-02 — detalhe (form de edição).
async function getTypeTitleByUuid(typeTitleUuid: string) {
  const { data } = await api.V2.get<Response<TypeTitleDetail>>(`/type-titles/${typeTitleUuid}`);
  return data;
}

async function createTypeTitle(payload: TypeTitlePayload) {
  const { data } = await api.V2.post<Response<TypeTitleDetail>>('/type-titles', payload);
  return data;
}

// UPDATE recebe o payload COMPLETO — TypeTitleRequest::rules() não distingue
// verbo (description/type/factor/is_enabled são `required` em ambos),
// full-resource-replace. NUNCA gatear estes 4 campos por dirtyFields no PUT.
async function updateTypeTitle(typeTitleUuid: string, payload: TypeTitlePayload) {
  const { data } = await api.V2.put<Response<TypeTitleDetail>>(
    `/type-titles/${typeTitleUuid}`,
    payload
  );
  return data;
}

// GET /type-titles/options — lookup ENXUTO (GAP-BE-620/TASK-BE-620, 9ª
// instância do padrão GAP-BE-040 Opção B), SEM gate de `typetitles_view` (só
// `auth:sanctum`, herdado do grupo global de rota). Alimenta o select "Tipo
// de Título" da tela de Invoice (TASK-FE-623, DF-02) — usuários com
// `invoices_create`/`invoices_edit` (sem `typetitles_view`) agora veem
// opções reais. MESMO adaptador de `listTypeTitles`/`listBankOptions`
// (ResponsePagination) — só a rota e o Resource (`TypeTitleOptionResource`,
// `uuid`+`description`+`type`+`type_label`+`factor`+`factor_label`, SEM
// `is_enabled`/`code`) mudam. `listTypeTitles` (sobre `/type-titles`,
// gated) CONTINUA existindo — usada pelo CRUD próprio de "Tipos de Título",
// fora de escopo aqui.
// `is_enabled` (esteira 036fix) — aditivo, OPCIONAL: `TypeTitleOptionsRequest::
// rules()` aceita o param só para validar formato quando enviado; a Action
// (`ListTypeTitleOptionsAction`) IGNORA o valor recebido e força
// `is_enabled=true` sempre no servidor (comentário do Action). Enviar
// explicitamente `'true'` aqui é só DOCUMENTAÇÃO DE INTENÇÃO do caller
// (nenhum comportamento novo no backend) — mantém o parâmetro visível na
// aba de rede para quem audita o contrato, sem mudar o resultado real.
async function listTypeTitleOptions(
  params: Pick<ListTypeTitlesParams, 'search' | 'per_page' | 'page'> & {
    is_enabled?: 'true' | 'false';
  }
): Promise<ResponsePagination<TypeTitleOptionItem[]>> {
  const { data } = await api.V2.get<TypeTitleOptionsListEnvelope>('/type-titles/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
  });

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

export {
  createTypeTitle,
  deleteTypeTitle,
  getTypeTitleByUuid,
  listTypeTitleOptions,
  listTypeTitles,
  updateTypeTitle,
};
