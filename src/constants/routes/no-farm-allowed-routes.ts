// src/constants/routes/no-farm-allowed-routes.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-11 (decisão do dono DEC-362, 2026-09-26) — lista CENTRALIZADA das
// rotas privadas que um CONTRATANTE SEM FAZENDA pode abrir. Qualquer outra rota
// privada redireciona (`<Navigate replace>`) para `NO_FARM_REDIRECT_TARGET`
// (listagem de Fazendas) com aviso — ver `src/utils/noFarmGuard.ts` e
// `src/components/NoFarmOnboardingGuard.tsx`.
//
// Padrões no formato `matchPath` do react-router (`:param` = 1 segmento, match
// EXATO — subrotas não listadas NÃO são liberadas, ex.: áreas da fazenda).
//
// Liberadas:
//   - Home (`/home`) e a raiz `/` — decisão do dono de 2026-09-27 (altera
//     DEC-362): a Home fica ACESSÍVEL ao contratante sem fazenda. Match EXATO:
//     `/` só redireciona para `/home` (`<Navigate replace>` no router) e
//     nenhuma subrota `/home/*` é liberada. A Home (`OverviewPanel`) não chama
//     endpoint farm-scoped sem fazenda ativa (todas as queries levam `hasFarm`
//     no `enabled`) e mostra o estado "Selecione uma fazenda";
//   - Fazendas: lista, novo, edição;
//   - Centros de Custo: lista + CRUD (novo, novo filho, edição, detalhe);
//   - Categorias Financeiras: lista + CRUD (NÃO o relatório — exige fazenda no
//     back, `financial-categories/report`, e vive sob `/relatorios/*`);
//   - `/profile` (Meu perfil — o menu da conta só navega para cá; tema, idioma
//     e sair são ações locais).
// Rotas públicas, login e logout ficam FORA do `PrivateRoute` e nunca passam
// pelo guard. Relatórios seguem NÃO liberados.
// -----------------------------------------------------------------------------

/** Destino do redirect — listagem de Fazendas (precisa estar na allowlist: anti-loop). */
export const NO_FARM_REDIRECT_TARGET = '/cadastros-base/fazendas';

/** Padrões `matchPath` liberados para o contratante sem fazenda. */
export const NO_FARM_ALLOWED_ROUTE_PATTERNS: readonly string[] = [
  // Home (decisão do dono 2026-09-27) — `/` é só o redirect para `/home`
  '/',
  '/home',
  // Fazendas
  NO_FARM_REDIRECT_TARGET,
  '/cadastros-base/fazendas/novo',
  '/cadastros-base/fazendas/:farmId',
  // Centros de Custo
  '/cadastros-base/centros-custo',
  '/cadastros-base/centros-custo/novo',
  '/cadastros-base/centros-custo/novo/:parentUuid',
  '/cadastros-base/centros-custo/:costCenterId',
  '/cadastros-base/centros-custo/:costCenterId/detalhe',
  // Categorias Financeiras (sem o relatório)
  '/cadastros-base/categorias',
  '/cadastros-base/categorias/novo',
  '/cadastros-base/categorias/:financialCategoryUuid',
  // Meu perfil (menu da conta)
  '/profile',
] as const;

/**
 * Papéis que NUNCA passam pelo guard. O back já envia `is_contractor=false`
 * para o `Gestor_Plataf` (`GetFarmContextSignalAction`); esta lista é a defesa
 * do front, caso o sinal mude.
 */
export const NO_FARM_GUARD_EXEMPT_ROLES: readonly string[] = ['Gestor_Plataf'] as const;

/** Chave do `location.state` que sinaliza à listagem de Fazendas exibir o aviso. */
export const NO_FARM_NOTICE_STATE_KEY = 'noFarmNotice';
