// src/pages/CadastrosBase/Areas/area-routes.ts
// -----------------------------------------------------------------------------
// Convenção de rotas do módulo Áreas (Area — subdivisão geoespacial da Fazenda,
// F-348/UT-000446, esteira 067, TASK-FE-416). As rotas AINDA NÃO existem em
// `router/index.tsx` — `TASK-FE-422` ("Áreas — Roteamento") registra os
// `<Route>` reais + `RequirePermission` + menu. Esta Tarefa (416) só PRECISA
// apontar os handlers de navegação (menu da Fazenda: Adicionar Área/Adicionar
// Múltiplas Áreas; menu da Área: Visualizar/Editar) para um destino ESTÁVEL —
// até 422 registrar as rotas, elas caem no catch-all `/cadastros-base/*`
// (`RoutePlaceholder`), sem quebrar o build (contrato da Tarefa).
//
// Fonte única de verdade do PATH — nenhuma tela desta Tarefa nem das
// seguintes (417/419/420/421/422) deve montar o path na mão; todas importam
// daqui. Convenção: Área é FARM-SCOPED (SURF-04 exige `farm_uuid` explícito
// na criação, matriz FID-G3A A-01/A-03) — todo path de Área carrega o
// `farmUuid` na URL, aninhado sob a rota já real de Fazenda
// (`/cadastros-base/fazendas/:farmId`, TASK-FE-404). Mirror do padrão de
// detalhe aninhado já em produção (`/cadastros-base/centros-custo/:id/detalhe`).
// -----------------------------------------------------------------------------

export function areaListBasePath(farmUuid: string): string {
  return `/cadastros-base/fazendas/${farmUuid}/areas`;
}

/**
 * Destino de "Adicionar Área" (menu da Fazenda, SURF-04) — TASK-FE-419/420.
 * @param {string} farmUuid - UUID da fazenda-pai da Área a criar.
 * @return {string} path da rota de criação (single).
 */
export function areaCreateRoute(farmUuid: string): string {
  return `${areaListBasePath(farmUuid)}/novo`;
}

/**
 * Destino de "Adicionar Múltiplas Áreas" (menu da Fazenda, SURF-05) —
 * TASK-FE-421.
 * @param {string} farmUuid - UUID da fazenda-pai das Áreas a criar em lote.
 * @return {string} path da rota de criação em lote.
 */
export function areaCreateMultipleRoute(farmUuid: string): string {
  return `${areaListBasePath(farmUuid)}/multiplas`;
}

/**
 * Destino de "Editar" (menu da Área, SURF-06) — TASK-FE-419/420.
 * @param {string} farmUuid - UUID da fazenda-pai da Área.
 * @param {string} areaUuid - UUID da Área a editar.
 * @return {string} path da rota de edição.
 */
export function areaEditRoute(farmUuid: string, areaUuid: string): string {
  return `${areaListBasePath(farmUuid)}/${areaUuid}`;
}

/**
 * Destino de "Visualizar" (menu da Área, SURF-07) — TASK-FE-417.
 * @param {string} farmUuid - UUID da fazenda-pai da Área.
 * @param {string} areaUuid - UUID da Área a visualizar.
 * @return {string} path da rota de detalhe (read-only).
 */
export function areaViewRoute(farmUuid: string, areaUuid: string): string {
  return `${areaListBasePath(farmUuid)}/${areaUuid}/detalhe`;
}
