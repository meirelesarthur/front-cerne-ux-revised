// src/router/index.tsx
// Roteamento do GB Cerne (shell mínimo).
//
// Superfície pública: /login (+ 2FA, esqueci/reset senha) — a UI do login é
// redesenhada em outra tarefa; aqui só preservamos as rotas.
// Superfície privada (DashboardLayout): /home + 9 módulos "em construção" via
// catch-all (`/modulo/*`) + /planos + o módulo de EXEMPLO (/exemplo, acessível
// só por URL — não entra no menu).
//
// Por que catch-all e não uma rota por item de menu: a árvore de navegação
// completa (`navigationTree.ts`) tem ~150 itens-folha. Em vez de 150 rotas
// explícitas, cada módulo ganha UMA rota `/base/*` que renderiza
// `RoutePlaceholder` — ele descobre sozinho, batendo `location.pathname`
// contra a árvore, qual item está ativo e mostra o label certo. Isso também é
// o que faz o SecondaryNav abrir sozinho ao navegar direto por URL (ver
// `DashboardLayout` + `findModuleByPath`).

import { Suspense, lazy } from 'react';

import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PublicQuotationLayout } from '@/layouts/PublicQuotationLayout';

import { RoutePlaceholder } from '@/components/ModulePlaceholder';
import { NotFound } from '@/components/NotFound';
import { PrivateRoute } from '@/components/PrivateRoute';
import { PublicRoute } from '@/components/PublicRoute';
import { RequirePermission } from '@/components/RequirePermission';
import { RequireRole } from '@/components/RequireRole';

import { ROUTES } from '@/constants/routes';

// ---- Público (login) ----
const Login = lazy(() => import('@/pages/Login'));
const TwoFactorVerify = lazy(() => import('@/pages/Login/TwoFactorVerify'));
const ForgotPassword = lazy(() => import('@/pages/Login/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/Login/ResetPassword'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));

// ---- Público ANÔNIMO (formulário do fornecedor, hash — esteira
// 97-Esteiras/035, TASK-CQ-FE-10). FORA de `PublicRoute`/`PrivateRoute` —
// nenhum dos dois guards se aplica (posse do hash é o único fator de
// autorização, roteiro API §9; gate 6.1/DEC-CQ-07, Opção 1 já decidida). ----
const RequestQuotationPublicPage = lazy(() => import('@/pages/Public/RequestQuotation'));

// ---- Público ANÔNIMO (aprovação de Orçamento via hash — Budget,
// 97-Esteiras/054, TASK-BG-FE-06). FORA de `PublicRoute`/`PrivateRoute` —
// mesmo racional do bloco acima (posse do hash é o único fator de
// autorização, `budgets-frontend-contract.md §5.5`/gate 6.1). Path
// `/orcamento-aprovacao/:hash` (plural/composto) — DELIBERADAMENTE
// distinto de `/orcamento/:hash` (singular, já usado acima por
// `RequestQuotationPublicPage`) para evitar colisão de rota. ----
const BudgetPublicPage = lazy(() => import('@/pages/Public/Budget'));

// ---- Público ANÔNIMO (rastreio de produto via código — Rastreabilidade,
// F-067, 97-Esteiras/058, TASK-TR-PUB-FE-02). FORA de `PublicRoute`/
// `PrivateRoute` — mesmo racional dos 2 blocos acima (posse do `code` é o
// único fator de autorização, `CONTRATO-TELA-F067-rastreio-publico.md ## 3`).
// Path `/rastreio` com `code` em QUERYSTRING (`?code=`) — DELIBERADAMENTE
// distinto de `/orcamento/:hash` e `/orcamento-aprovacao/:hash` (path param):
// fiel à URL já impressa em etiquetas/QR code do legado (`CL-01`). O `code`
// da querystring é repassado como PATH PARAM na chamada à API
// (`GET /public/traceability/{code}`) dentro da página — os dois esquemas de
// URL são independentes, sem conflito. ----
const RastreioPublicPage = lazy(() => import('@/pages/Public/Rastreio'));

// ---- Público ANÔNIMO (landing pública do Site — 97-Esteiras/061,
// TASK-SITE-10). FORA de `PublicRoute`/`PrivateRoute` — mesmo racional dos
// blocos acima (posse do `slug` público é o único fator de autorização,
// `05-CONTRATO-TELA-pagina-publica-site.md ## 4`). Path `/site/:slug` COM
// PATH PARAM (decisão do front-architect, "Leitura do dev" item 1) —
// DELIBERADAMENTE distinto de `/rastreio?code=` (querystring, constraint de
// compatibilidade com QR/etiquetas já impressas que não existe aqui: o
// legado do Site já era path-param `website/{slug}`). ----
const SitePublicoPage = lazy(() => import('@/pages/Public/Site'));

// ---- Privado: Home (launcher antigo, `src/pages/Home/index.tsx`) ----
// F-211 (execução 062, TASK-FE-211-00, Opção A): `/home` passou a resolver
// `DashboardOverviewPanel` (ver rota abaixo) — este `lazy()` NÃO é mais
// referenciado por nenhuma rota, então sai daqui para não quebrar
// `tsc`/ESLint (`no-unused-vars`); o ARQUIVO `src/pages/Home/index.tsx`
// continua intacto (destino é decisão futura fora do escopo do F-211).

// ---- Privado: Planos (PlanRole, gestão completa — TASK-FE-2701..2704) ----
// Ícone "Gem" dedicado no rodapé do NavRail (`NavRail.tsx:150-327`), fora da
// árvore de Configurações — mantido como está (TASK-FE-2704, divergência do
// gatilho original reportada e não revertida sem pedido de produto novo).
const PlanosList = lazy(() => import('@/pages/Planos'));
// Contratar/alterar plano (simulador de assinatura) — qualquer usuário autenticado; a permissão
// definitiva (ex.: `subscription_manage`) depende do backend.
const ContratacaoPlano = lazy(() => import('@/pages/Planos/Contratacao'));
const CreateOrUpdatePlanRole = lazy(() => import('@/pages/Planos/CreateOrUpdatePlanRole'));
const DetalhePlanRole = lazy(() => import('@/pages/Planos/DetalhePlanRole'));

// ---- Privado: Cadastros Base — Perfis (Roles RBAC) ----
const PerfilList = lazy(() => import('@/pages/CadastrosBase/Perfil'));
const PerfilForm = lazy(() => import('@/pages/CadastrosBase/Perfil/CreateOrUpdatePerfil'));

// ---- Privado: Cadastros Base — Fazendas (Farm, execução 024) ----
// CRUD administrativo completo (TASK-FE-400..404). Item de menu `cad-est-faz`
// e permissão (`farms_view`) JÁ EXISTIAM (navigationTree.ts/
// navigationPermissions.ts) — só liga a rota real.
const FarmsList = lazy(() => import('@/pages/CadastrosBase/Fazendas'));
const CreateOrUpdateFarm = lazy(() => import('@/pages/CadastrosBase/Fazendas/CreateOrUpdateFarm'));

// ---- Privado: Cadastros Base — Áreas (Area, F-348/UT-000446, esteira 067,
// TASK-FE-422) ---- Áreas são acessadas VIA Fazendas (não é item de menu de
// topo próprio, `AreasSubList.tsx`/`AreasSubList` embutida na listagem de
// Fazendas, TASK-FE-416) — nenhum item novo em `navigationTree.ts`, só as
// rotas reais (até aqui caíam no catch-all `/cadastros-base/*`,
// `RoutePlaceholder`, `area-routes.ts` cabeçalho). Farm-scoped: todo path
// carrega `farmId` na URL (`/cadastros-base/fazendas/:farmId/areas/...`,
// mirror `areaListBasePath`).
const CreateOrUpdateArea = lazy(() => import('@/pages/CadastrosBase/Areas/CreateOrUpdateArea'));
const CreateMultipleAreas = lazy(() => import('@/pages/CadastrosBase/Areas/CreateMultipleAreas'));
const DetalheArea = lazy(() => import('@/pages/CadastrosBase/Areas/DetalheArea'));

// ---- Privado: Cadastros Base — Classes de Produto (Kind, execução 024) ----
// Menu `cad-est-pro-cla` NOVO (não existia — TASK-FE-463 criou a entrada em
// navigationTree.ts/navigationPermissions.ts) + as 3 rotas reais.
const ClassesList = lazy(() => import('@/pages/CadastrosBase/Produtos/Classes'));
const CreateOrUpdateKind = lazy(
  () => import('@/pages/CadastrosBase/Produtos/Classes/CreateOrUpdateKind')
);

// ---- Privado: Cadastros Base — Afiliados (Partner, execução 024) ----
// Menu `cad-pes-afi` NOVO (TASK-FE-433 criou a entrada em
// navigationTree.ts/navigationPermissions.ts, logo após Autorizadores) + as
// 3 rotas reais, guardadas por permissão GRANULAR (contrato de tela §3.1 —
// view na lista, create/edit distintas por rota de formulário).
const AfiliadosList = lazy(() => import('@/pages/CadastrosBase/Afiliados'));
const CreateOrUpdateAfiliado = lazy(
  () => import('@/pages/CadastrosBase/Afiliados/CreateOrUpdateAfiliado')
);

// ---- Privado: Cadastros Base — Centros de Custo ----
const CentroCustoList = lazy(() => import('@/pages/CadastrosBase/CentroCusto'));
const CreateOrUpdateCentroCusto = lazy(
  () => import('@/pages/CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto')
);
const DetalheCentroCusto = lazy(
  () => import('@/pages/CadastrosBase/CentroCusto/DetalheCentroCusto')
);

// ---- Privado: Cadastros Base — Autorizadores (RequestAuthorizer, Lote 06 /
// esteira 089, Frente C, F-141) ----
// SLICE 1 trouxe a listagem real. SLICE 2 (mesmo lote/esteira, frente C)
// ACRESCENTA o form create/edit (`CreateOrUpdateAutorizador`), importado e
// registrado nas rotas abaixo.
const AutorizadoresList = lazy(() => import('@/pages/CadastrosBase/Autorizadores'));
const CreateOrUpdateAutorizador = lazy(
  () => import('@/pages/CadastrosBase/Autorizadores/CreateOrUpdateAutorizador')
);
// Tela Visualizar (T-081-FE-02): mesmo form em modo leitura, só `request-authorizers_view`.
const VisualizarAutorizador = lazy(
  () => import('@/pages/CadastrosBase/Autorizadores/VisualizarAutorizador')
);

// ---- Privado: Cadastros Base — Raças (Breeds) ----
const RacasList = lazy(() => import('@/pages/CadastrosBase/Racas'));
const CreateOrUpdateRaca = lazy(() => import('@/pages/CadastrosBase/Racas/CreateOrUpdateRaca'));

// ---- Privado: Cadastros Base — Vacinas (Vaccine) ----
const VacinasList = lazy(() => import('@/pages/CadastrosBase/Vacinas'));
const CreateOrUpdateVacina = lazy(
  () => import('@/pages/CadastrosBase/Vacinas/CreateOrUpdateVacina')
);

// ---- Privado: Cadastros Base — Causa Morte/Perda (DeathLoss) ----
const CausaMortePerdaList = lazy(() => import('@/pages/CadastrosBase/CausaMortePerda'));
const CreateOrUpdateCausaMortePerda = lazy(
  () => import('@/pages/CadastrosBase/CausaMortePerda/CreateOrUpdateCausaMortePerda')
);

// ---- Privado: Cadastros Base — Parâmetros Animais ----
const ParameterAnimalsList = lazy(() => import('@/pages/CadastrosBase/ParameterAnimals'));
const CreateOrUpdateParameterAnimal = lazy(
  () => import('@/pages/CadastrosBase/ParameterAnimals/CreateOrUpdateParameterAnimal')
);

// ---- Privado: Cadastros Base — Lotes Animais ----
const BatchesList = lazy(() => import('@/pages/CadastrosBase/Batches'));
const CreateOrUpdateBatch = lazy(() => import('@/pages/CadastrosBase/Batches/CreateOrUpdateBatch'));

// ---- Privado: Cadastros Base — Grupos de Produto ----
const GruposProdutoList = lazy(() => import('@/pages/BaseRegistrations/ProductGroups'));
const CreateOrUpdateGrupoProduto = lazy(
  () => import('@/pages/BaseRegistrations/ProductGroups/CreateOrUpdateProductGroups')
);

// ---- Privado: Cadastros Base — Categorias de Produto ----
const CategoriasProdutoList = lazy(() => import('@/pages/CadastrosBase/CategoriasProduto'));
const CreateOrUpdateCategoriaProduto = lazy(
  () => import('@/pages/CadastrosBase/CategoriasProduto/CreateOrUpdateCategoriaProduto')
);

// ---- Privado: Cadastros Base — Bancos (Bank, dado mestre GLOBAL) ----
const BancosList = lazy(() => import('@/pages/BaseRegistrations/Banks'));
const CreateOrUpdateBanco = lazy(
  () => import('@/pages/BaseRegistrations/Banks/CreateOrUpdateBanks')
);

// ---- Privado: Cadastros Base — Safras ----
const SafrasList = lazy(() => import('@/pages/CadastrosBase/Safra'));
const CreateOrUpdateSafra = lazy(() => import('@/pages/CadastrosBase/Safra/CreateOrUpdateSafra'));
const SafraDetalhe = lazy(() => import('@/pages/CadastrosBase/Safra/SafraDetalhe'));

// ---- Privado: Cadastros Base — Ciclo de Produção (ProductionCycle) ----
// TASK-FE-01 (97-Esteiras/033) — rotas de LEITURA (grid + detalhe).
// TASK-FE-02 — formulário create/edit (`/novo` e `/:productionCycleUuid`).
const CicloProducaoList = lazy(() => import('@/pages/CadastrosBase/CicloProducao'));
const CicloProducaoDetalhe = lazy(
  () => import('@/pages/CadastrosBase/CicloProducao/CicloProducaoDetalhe')
);
const CreateOrUpdateCicloProducao = lazy(
  () => import('@/pages/CadastrosBase/CicloProducao/CreateOrUpdateCicloProducao')
);

// ---- Privado: Administrativo — Adiantamento Salarial (Advance) ----
// TASK-FE-adiant-salarial (97-Esteiras/034) — rotas REAIS (grid + form
// create/edit + detalhe). Item de menu (adm-gp-adi) e permissão
// (advances_view) JÁ existem (navigationTree.ts/navigationPermissions.ts).
// ---- Privado: Relatórios — Suprimentos (Relatório SLA, TASK-SLA-FE-02,
// esteira 97-Esteiras/037) — 1ª rota real do grupo de menu "Relatórios",
// hoje todo o grupo cai no catch-all `/relatorios/*` (`RoutePlaceholder`,
// abaixo). Item de menu (`rel-sup`) e bucket de permissão (`anyOf` em
// `navigationPermissions.ts`) JÁ EXISTIAM — nenhuma edição neles. ----
const SupplyStatusSlaReportPage = lazy(() => import('@/pages/Relatorios/Suprimentos'));
// ---- Privado: Relatórios — Suprimentos — Gerencial de Solicitações
// (F-310, TASK-053-F310-FE-02, esteira 97-Esteiras/053) — 2º filho do grupo
// `rel-sup` (`navigationTree.ts` reestruturado nesta mesma Tarefa, mirror
// `rel-fin`/`rel-est`/`rel-gfi`). `request-purchase-management_report_view`
// já está no `anyOf` de `rel-sup` (linha acima) — nenhuma edição no bucket
// do pai. ----
const RequestPurchaseManagementReportPage = lazy(
  () => import('@/pages/Relatorios/Suprimentos/GerencialSolicitacoes')
);

// ---- Privado: Relatórios — Suprimentos — Produtos x Prev. Entrega
// (F-309, TASK-058-F309-FE-02, esteira 97-Esteiras/058) — 3º filho do grupo
// `rel-sup` (`navigationTree.ts`, sibling de `rel-sup-sla`/
// `rel-sup-gerencial-solicitacoes`). `request-purchase-forecast-report_report_view`
// já está no `anyOf` de `rel-sup` (navigationPermissions.ts) — nenhuma edição
// no bucket do pai.
const RequestPurchaseForecastReportPage = lazy(
  () => import('@/pages/Relatorios/Suprimentos/ProdutosPrevEntrega')
);

// ---- Privado: Relatórios — Suprimentos — ANS (F-229, lote 076,
// `F-229-ans-report-contrato-api.md`) — 3º filho do grupo `rel-sup`, mirror
// EXATO de `RequestPurchaseManagementReportPage` acima. `ans_report_view` já
// estava no `anyOf` de `rel-sup` (navigationPermissions.ts) — nenhuma edição
// no bucket do pai. ----
const AnsRelatorio = lazy(() => import('@/pages/Relatorios/Suprimentos/Ans'));

// ---- Privado: Relatórios — Suprimentos — Savings (F-319, execução 013,
// TASK-013-F319-FE-01/02) — 3º filho NOVO do grupo `rel-sup`
// (`navigationTree.ts`). Item de menu (`rel-sup-savings`) e permissão
// (`savings_view`) JÁ EXISTEM/foram criados nesta mesma Tarefa — SEM
// `RequirePermission` na rota, de propósito (`OQ-005` `MANTER_COMO_IS`, ver
// bloco da rota abaixo). ----
const SavingsRelatorio = lazy(() => import('@/pages/Relatorios/Suprimentos/Savings'));

// ---- Privado: Relatórios — Suprimentos — Suprimentos (F-325,
// `supplies-report`, execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52) —
// 5º filho NOVO do grupo `rel-sup` (`navigationTree.ts`). `supplies_view` já
// está no `anyOf` de `rel-sup` (linha acima, 1ª posição do array) — nenhuma
// edição no bucket do pai. ----
const SuppliesReportRelatorio = lazy(() => import('@/pages/Relatorios/Suprimentos/SuppliesReport'));

// ---- Privado: Relatórios — Gestão Fiscal — Partida Dobrada (F-257,
// TASK-PDR-FE-04, esteira 97-Esteiras/069) — materializa o item de menu
// já existente `rel-gfi` ("Gestão Fiscal", `navigationTree.ts:2308`), hoje
// um stub sem rota. Guard de ROTA usa a permissão específica
// `double-entry-accountings_report` (mirror do `permission:` do
// Controller) — o `anyOf` de 3 permissões em `navigationPermissions.ts`
// fica só no MENU (que pode um dia hospedar relatórios de NFe também,
// contrato-tela §7). ----
const PartidaDobradaRelatorio = lazy(
  () => import('@/pages/Relatorios/GestaoFiscal/PartidaDobrada')
);

// ---- Privado: Relatórios — Gestão Fiscal — Faturamento (F-286, esteira
// 97-Esteiras/054, TASK-054-286-FE-02) — 2º filho do grupo `rel-gfi`, ao lado
// de "Partida Dobrada" acima. Guard de ROTA usa a permissão específica
// `nfe_product_report` (já contida no `anyOf` do próprio `rel-gfi` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const FaturamentoRelatorio = lazy(() => import('@/pages/Relatorios/GestaoFiscal/Faturamento'));

// ---- Privado: Relatórios — Gestão Fiscal — NFe/Emitidas (F-287, esteira
// 97-Esteiras/079, TASK-F287-FE-02) — 3º filho do grupo `rel-gfi`, ao lado
// de "Faturamento"/"Partida Dobrada" acima. Guard de ROTA usa a permissão
// específica `nfe_report` (já contida no `anyOf` do próprio `rel-gfi` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const NfeReportRelatorio = lazy(() => import('@/pages/Relatorios/GestaoFiscal/NfeReport'));

// ---- Privado: Relatórios — Financeiro — DRE (F-259, TASK-DRE-FE-02,
// esteira 97-Esteiras/049) — transforma o item de menu `rel-fin`
// ("Financeiro", `navigationTree.ts`), hoje folha única, em grupo com filho
// "DRE" (mirror EXATO de como `rel-gfi`/`rel-pec` já foram transformados).
// Guard de ROTA usa a permissão específica `dre_view` (mirror do
// `permission:` do Controller) — o `anyOf` amplo de `rel-fin` em
// `navigationPermissions.ts` (já contém `dre_view`/`dre_annual_view`) fica só
// no MENU. ----
const DreRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/Dre'));

// ---- Privado: Relatórios — Financeiro — Contas a Pagar (F-262,
// TASK-050-262-FE-02, esteira 97-Esteiras/050) — filho NOVO do grupo
// `rel-fin`. Guard de ROTA usa a permissão específica `expenses_report`
// (mirror do `permission:` do Controller) — o `anyOf` amplo de `rel-fin` em
// `navigationPermissions.ts` (já contém `expenses_report`) fica só no MENU.
const ContasAPagarRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/ContasAPagar'));

// ---- Privado: Relatórios — Financeiro — Contas Pagas (F-291,
// TASK-050-291-FE-02, esteira 97-Esteiras/050) — irmã da rota acima, mesmo
// grupo `rel-fin`. Guard de ROTA usa `expenses_paid_report` (já no `anyOf`
// de `rel-fin`).
const ContasPagasRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/ContasPagas'));

// ---- Privado: Relatórios — Financeiro — Contas Tributárias (F-327, esteira
// 97-Esteiras/060, TASK-F327-FRONT-01) — tela NOVA (download-only), mesma
// família visual de "Contas Pagas"/"Contas a Pagar" acima (FormContainer +
// footer, sem grid/prévia). Guard de ROTA usa o slug EXATO do backend
// `tax_accounts_report` (`PermissionTree.php:3780`).
const ContasTributariasRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/ContasTributarias')
);

// ---- Privado: Relatórios — Financeiro — Pagamento Previsto × Real (F-289,
// esteira 97-Esteiras/054, TASK-289-FE-02) — filho NOVO do grupo `rel-fin`,
// mesma família visual de "Contas a Pagar"/"Contas Pagas" acima
// (download-only, sem grid/prévia). Guard de ROTA usa a permissão específica
// `pag_prev_report` (já contida no `anyOf` amplo de `rel-fin` em
// `navigationPermissions.ts`, que fica só no MENU). Distinto do irmão
// `rel-fin-prev-real` (F-238, lado Recebimentos) — id/rota/label nunca
// colidem. ----
const PagamentoPrevistoRealRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/PagamentoPrevistoReal')
);

// Relatórios — Financeiro — Recebimento Previsto × Real (F-297, esteira
// 97-Esteiras/079, TASK-079-297-FE-02) — mirror EXATO do irmão "Pagamento
// Previsto × Real" acima (lado Receita). Guard de ROTA usa `rec_prev_report`
// (já no `anyOf` de `rel-fin`, distinto do gate do MENU em
// `navigationPermissions.ts`). Distinto do irmão `rel-fin-prev-real`
// (F-238, Planejamento Orçamentário) — id/rota/label nunca colidem.
const RecebimentoPrevistoRealRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/RecebimentoPrevistoReal')
);

// Relatórios — Financeiro — Contas a Receber (F-271, TASK-050-271-FE-02,
// esteira 97-Esteiras/050) — espelho do F-262 no lado receita, 5º filho do
// grupo `rel-fin`. Guard de ROTA usa `incomes_report` (já no `anyOf` de
// `rel-fin`).
const ContasAReceberRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/ContasAReceber'));

// Relatórios — Financeiro — Contas Recebidas (F-292, TASK-050-292-FE-02,
// esteira 97-Esteiras/050) — espelho do F-291 no lado receita, 6º e ÚLTIMO
// filho do grupo `rel-fin`. Guard de ROTA usa `incomes_paid_report` (já no
// `anyOf` de `rel-fin`).
const ContasRecebidasRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/ContasRecebidas')
);

// ---- Privado: Relatórios — Financeiro — DRE Anual (F-258, TASK-DRE-FE-04,
// esteira 97-Esteiras/049) — 2º filho do grupo `rel-fin`, mirror EXATO da
// tela irmã acima, trocando o período por range de ano. Guard de ROTA usa a
// permissão específica `dre_annual_view`. ----
const DreAnualRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/DreAnual'));

// ---- Privado: Relatórios — Financeiro — Juros Pagos (F-290, TASK-290-FE-02,
// esteira 97-Esteiras/073) — 3º filho do grupo `rel-fin`, mirror ESTRUTURAL
// das telas irmãs "DRE"/"DRE Anual" acima. Guard de ROTA usa a permissão
// específica `paid_interest_report` (mirror do `permission:` do Controller,
// já contida no `anyOf` amplo de `rel-fin` em `navigationPermissions.ts`,
// que fica só no MENU). ----
const JurosPagosRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/JurosPagos'));
// ---- Privado: Relatórios — Financeiro — Juros Recebidos (esteira
// 97-Esteiras/014, Tarefa 49) — DECLARADO no MESMO bloco de
// `/relatorios/financeiro/{juros-pagos,apuracao-de-custo}`, ANTES do
// catch-all /relatorios/*. Guard de ROTA usa a permissão específica
// `received_interest_report` (já contida no `anyOf` amplo de `rel-fin` em
// navigationPermissions.ts, que fica só no MENU). ----
const JurosRecebidosRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/JurosRecebidos'));
const CustoProducaoBatidaRelatorio = lazy(
  () => import('@/pages/Relatorios/Estoque/CustoProducaoBatida')
);

// ---- Privado: Relatórios — Estoque — Recebimentos (F-305, TASK-RCB-FE-02,
// esteira 97-Esteiras/074) — 2º filho do grupo `rel-est`, mirror ESTRUTURAL
// do bloco irmão "Custo Produção Batida" acima. Guard de ROTA usa a
// permissão específica `receipts_report` (mirror do `permission:` do
// Controller, já contida no `anyOf` amplo de `rel-est` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const RecebimentosRelatorio = lazy(() => import('@/pages/Relatorios/Estoque/Recebimentos'));

// ---- Privado: Relatórios — Estoque — Movimentação de Estoque (F-1f1d23e3,
// TASK-MOV-FE-02, esteira 97-Esteiras/074) — filho do grupo `rel-est`,
// mirror ESTRUTURAL dos blocos irmãos "Custo Produção Batida"/"Recebimentos"
// acima. Guard de ROTA usa a permissão específica `stock_movement_report`
// (mirror do `permission:` do Controller, já contida no `anyOf` amplo de
// `rel-est` em `navigationPermissions.ts`, que fica só no MENU). ----
const MovimentacaoEstoqueRelatorio = lazy(
  () => import('@/pages/Relatorios/Estoque/MovimentacaoEstoque')
);

// ---- Privado: Relatórios — Estoque — Lote/Fornecedor (F-324,
// TASK-052-324-FE-02, esteira 97-Esteiras/052) — 4º filho do grupo
// `rel-est`, mirror ESTRUTURAL dos blocos irmãos "Custo Produção Batida"/
// "Recebimentos"/"Movimentação de Estoque" acima. Guard de ROTA usa a
// permissão específica `stocks-lot-provider_report` (mirror do
// `permission:` do Controller, já contida no `anyOf` amplo de `rel-est` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const LoteFornecedorRelatorio = lazy(() => import('@/pages/Relatorios/Estoque/LoteFornecedor'));

// ---- Privado: Relatórios — Estoque — Saídas x Centro Custo (F-301, esteira
// 97-Esteiras/078, F-301-plano-frontend.md) — filho do grupo `rel-est`,
// mirror ESTRUTURAL dos blocos irmãos acima. Guard de ROTA usa a permissão
// específica `products-exit-cost-center_report` (mirror do `permission:` do
// Controller, já contida no `anyOf` amplo de `rel-est` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const SaidasCentroCustoRelatorio = lazy(
  () => import('@/pages/Relatorios/Estoque/SaidasCentroCusto')
);

// Relatórios → Estoque → Requisição/Saída (F-312, esteira 97-Esteiras/078,
// F-312-plano-frontend.md) — mirror EXATO do bloco `SaidasCentroCustoRelatorio`
// acima.
const RequisicaoSaidaRelatorio = lazy(() => import('@/pages/Relatorios/Estoque/RequisicaoSaida'));

// ---- Privado: Relatórios — Financeiro — Financiamentos (F-265, esteira
// 97-Esteiras/078, F-265-plano-frontend.md) — filho do grupo `rel-fin`,
// mirror ESTRUTURAL do bloco irmão "Saídas x Centro Custo" acima. Guard de
// ROTA usa a permissão específica `financings_report` (mirror do
// `permission:` do Controller, já contida no `anyOf` amplo de `rel-fin` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const FinanciamentosRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/Financiamentos'));
const FluxoMensalPagamentoRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/FluxoMensalPagamento')
);
// ---- Privado: Relatórios — Financeiro — Extrato Financeiro (F-233, execução
// 97-Esteiras/079, F-233-plano-frontend.md) — filho NOVO do grupo `rel-fin`,
// mirror ESTRUTURAL do bloco irmão "Fluxo Mensal de Pagamento" acima. Guard
// de ROTA usa `movements_report` (mirror do `permission:` do Controller, já
// contido no `anyOf` amplo de `rel-fin` em `navigationPermissions.ts`). ----
const ExtratoFinanceiroRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/ExtratoFinanceiro')
);

// ---- Privado: Relatórios — Agricultura — Descarte Romaneio (F-256, esteira
// 97-Esteiras/078, F-256-plano-frontend.md) — filho do grupo `rel-agr`,
// mirror ESTRUTURAL do bloco irmão "Saídas x Centro Custo" acima. Guard de
// ROTA usa a permissão `discards_report` (mirror do
// `permission:discards_report` do `DiscardsReportController`, já contida no
// `anyOf` amplo de `rel-agr` em `navigationPermissions.ts`, que fica só no
// MENU). ----
const DescarteRomaneioRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/DescarteRomaneio')
);

// ---- Privado: Relatórios — Pecuária — Estoque/Rebanho (F-228, execução
// 97-Esteiras/078, F-228-plano-frontend.md) — filho do grupo `rel-pec`,
// mirror ESTRUTURAL do bloco irmão "Descarte Romaneio" acima (casca +
// download PDF-ONLY, FRONT-05). Guard de ROTA usa a permissão
// `animals-report_view` (mirror do slug legado `animals-report_view`, já
// contida no `anyOf` de `rel-pec` em `navigationPermissions.ts`). ----
const EstoqueRebanhoRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/EstoqueRebanho'));

// ---- Privado: Relatórios — Estoque — Curva ABC/Estoque (F-322,
// esteira 97-Esteiras/077, CONTRATOS/front/F-322-plano-front.md) — 6º filho
// do grupo `rel-est`, mirror ESTRUTURAL dos blocos irmãos "Custo Produção
// Batida"/"Recebimentos"/"Movimentação de Estoque"/"Lote/Fornecedor" acima.
// Guard de ROTA usa a permissão específica `stocks-abc_report` (mirror do
// `permission:` do Controller, já contida no `anyOf` amplo de `rel-est` em
// `navigationPermissions.ts`, que fica só no MENU). ----
const StockAbcReportRelatorio = lazy(() => import('@/pages/Relatorios/Estoque/StockAbcReport'));

// ---- Privado: Relatórios — Estoque — Estoque Consolidado (F-323,
// feature_id e70b8cad, esteira 97-Esteiras/079, F-323-plano-frontend.md) —
// 9º filho do grupo `rel-est`, mirror ESTRUTURAL dos blocos irmãos "Custo
// Produção Batida"/"Recebimentos"/"Movimentação de Estoque"/"Lote/
// Fornecedor"/"Curva ABC/Estoque"/"Requisição/Saída" acima. Guard de ROTA
// usa a permissão específica `stocks-consolidated_report` (mirror do
// `permission:` do Controller/Form Request, já contida no `anyOf` amplo de
// `rel-est` em `navigationPermissions.ts`, que fica só no MENU). ----
const StockConsolidatedReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Estoque/StockConsolidatedReport')
);

// ---- Privado: Relatórios — Suprimentos — Orçamentos
// (`request-quotation.report`, F-311, esteira 97-Esteiras/078,
// F-311-plano-frontend.md) — filho do grupo `rel-sup`, mirror ESTRUTURAL dos
// blocos irmãos "Saídas x Centro Custo"/"Requisição/Saída" acima. Guard de
// ROTA usa a permissão `request-quotation_report_view` (legado reuse EXATO,
// contrato §"Permissão legada" — a API F-311 enforça server-side, guard no
// cliente é coerente, mirror `SaidasCentroCusto`, NÃO `Savings` sem guard).
// ----
const OrcamentosRelatorio = lazy(() => import('@/pages/Relatorios/Suprimentos/Orcamentos'));

// ---- Privado: Relatórios — Frotas — Máquinas (F-278, TASK-052-278-FE-02,
// esteira 97-Esteiras/052) — 1º filho do grupo `rel-gfr` ("Gestão de
// Frotas"), que era um flatItem FOLHA e vira item-PAI (mirror ESTRUTURAL da
// reestruturação já aplicada a `rel-est`/`rel-agr`). Guard de ROTA usa a
// permissão específica `machinesreport_view` (já contida no `anyOf` do
// próprio `rel-gfr` em `navigationPermissions.ts`, que fica só no MENU). ----
const MaquinasRelatorio = lazy(() => import('@/pages/Relatorios/Frotas/Maquinas'));

// ---- Privado: Relatórios — Frotas — Abastecimentos (F-277, esteira
// 97-Esteiras/054, TASK-054-277-FE-02) — 2º filho do grupo `rel-gfr` ("Gestão
// de Frotas"), ao lado de "Máquinas" acima. Guard de ROTA usa a permissão
// específica `machines-supply_view` (já contida no `anyOf` do próprio
// `rel-gfr` em `navigationPermissions.ts`, que fica só no MENU). ----
const AbastecimentosRelatorio = lazy(() => import('@/pages/Relatorios/Frotas/Abastecimentos'));

// ---- Privado: Relatórios — Frotas — Manutenções (F-276, esteira
// 97-Esteiras/078, F-276-plano-frontend.md) — 3º filho do grupo `rel-gfr`
// ("Gestão de Frotas"), ao lado de "Máquinas"/"Abastecimentos" acima. Guard
// de ROTA usa a permissão específica `machines-maintenance_view` (já
// contida no `anyOf` do próprio `rel-gfr` em `navigationPermissions.ts`, que
// fica só no MENU). ----
const ManutencoesRelatorio = lazy(() => import('@/pages/Relatorios/Frotas/Manutencoes'));

// ---- Privado: Relatórios — Financeiro — Apuração de Custo (F-245,
// TASK-245-FE-02, esteira 97-Esteiras/073) — 4º filho do grupo `rel-fin`,
// mirror ESTRUTURAL das telas irmãs "DRE"/"DRE Anual"/"Juros Pagos" acima.
// Guard de ROTA usa a permissão específica `cost_calculation_report` (mirror
// do `permission:` do Controller, já contida no `anyOf` amplo de `rel-fin`
// em `navigationPermissions.ts`, que fica só no MENU). ----
const ApuracaoCustoRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/ApuracaoCusto'));

// ---- Privado: Relatórios — Financeiro — Centro de Custo (F-247,
// TASK-052-247-FE-02, esteira 97-Esteiras/052) — filho NOVO do grupo
// `rel-fin`, mirror ESTRUTURAL de "Apuração de Custo" acima (3 URIs sobre a
// mesma Action: PDF/`/excel`/`/preview`). Guard de ROTA usa a permissão
// específica `cost_centers_report` (mirror do `permission:` do Controller,
// já contida no `anyOf` amplo de `rel-fin` em `navigationPermissions.ts`,
// que fica só no MENU). ----
const CentroCustoRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/CentroCusto'));

// ---- Privado: Relatórios — Financeiro — Livro Razão (F-274, TASK-FE-LR-03,
// esteira 97-Esteiras/008) — filho NOVO do grupo `rel-fin`, mirror ESTRUTURAL
// de `CentroCusto` acima (3 URIs sobre a mesma Action: PDF/`/excel`/
// `/preview`). Guard de ROTA usa a permissão NOVA `ledger-report_view`
// (`app/Support/PermissionTree.php`) — DISTINTA dos slugs legados
// `ledger_report`/`ledger_caregory_report` já presentes no `anyOf` de
// `rel-fin` (GAP-LR-05, ver `navigationPermissions.ts`, edição aditiva). ----
const LivroRazaoRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/LivroRazao'));

// ---- Privado: Relatórios — Financeiro — Consolidado (Pagar/Receber) (F-214,
// TASK-052-214-FE-02, esteira 97-Esteiras/052) — filho NOVO do grupo
// `rel-fin`, mirror ESTRUTURAL de `ContasAPagar` acima (download-only rico,
// SEM grid/prévia, 1 único endpoint PDF+Excel via campo `format`). Guard de
// ROTA usa a permissão específica `accounts_payable_receivable_report`
// (mirror do `permission:` do Controller, já contida no `anyOf` amplo de
// `rel-fin` em `navigationPermissions.ts`, que fica só no MENU). ----
const ConsolidadoPagarReceberRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/Consolidado')
);

// ---- Privado: Relatórios — Financeiro — Fluxo de Caixa Mensal (F-240,
// TASK-053-240-FE-02/FE-03, esteira 97-Esteiras/053) — filho NOVO do grupo
// `rel-fin`, mirror ESTRUTURAL de `ContasAPagar`/`Consolidado` acima
// (download-only puro, SEM grid/prévia, 1 único endpoint PDF+Excel via
// campo `format`). Guard de ROTA usa a permissão específica
// `cashflow_by_category_report` (mirror do `permission:` do Controller, já
// contida no `anyOf` amplo de `rel-fin` em `navigationPermissions.ts`, que
// fica só no MENU). ----
const FluxoCaixaMensalRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/FluxoCaixaMensal')
);

// ---- Privado: Relatórios — Financeiro — Estoque Financeiro (F-241,
// TASK-013-241-FE-04, esteira 97-Esteiras/013) — filho NOVO do grupo
// `rel-fin`, mirror ESTRUTURAL de `FluxoCaixaMensal`/`ContasAPagar`/
// `Consolidado` acima (download-only puro, SEM grid/prévia, 1 único
// endpoint PDF+Excel via campo `format`). Guard de ROTA usa a permissão
// específica `cashflow_product_report` (já contida no `anyOf` amplo de
// `rel-fin` em `navigationPermissions.ts`, que fica só no MENU). ----
const EstoqueFinanceiroRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/EstoqueFinanceiro')
);

// ---- Privado: Relatórios — Financeiro — Custo de Produção (F-272,
// TASK-272-FE-02/03, esteira 97-Esteiras/073) — `IncomeStatementController`
// do legado (NÃO confundir com a tela "DRE", já migrada e distinta). 5º
// filho de `rel-fin`. Guard de ROTA usa a permissão específica
// `incomestatement_view` (mirror do `permission:` do Controller, já contida
// no `anyOf` amplo de `rel-fin` em `navigationPermissions.ts`, que fica só
// no MENU). ----
const CustoProducaoRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/CustoProducao'));

// ---- Privado: Relatórios — Financeiro — Custo de Produção Acumulado
// (F-217, TASK-058-F217-FE-02, esteira 97-Esteiras/058) —
// `AccumulatedIncomeStatementController` do legado (irmão ACUMULADO de
// "Custo de Produção" acima, controller distinto). Filho NOVO de
// `rel-fin`. Guard de ROTA usa a permissão específica
// `accumulatedincomestatement_view` (mirror do `permission:` do
// Controller, já contida no `anyOf` amplo de `rel-fin` em
// `navigationPermissions.ts`, que fica só no MENU). Tela DOWNLOAD-ONLY
// (D-058-02, divergência deliberada) — SEM grid/prévia/drill-down, ao
// contrário do irmão `CustoProducaoRelatorio` acima. ----
const CustoProducaoAcumuladoRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/CustoProducaoAcumulado')
);

// ---- Privado: Relatórios — Financeiro — Movimento Bancário (F-264,
// TASK-058-F264-FE-02, esteira 97-Esteiras/058) — 7º filho do grupo
// `rel-fin`, mirror ESTRUTURAL de `ContasAPagar`/`CentroCusto` acima
// (download-only, SEM grid/prévia). Guard de ROTA REUSA a permissão
// canônica já existente `financial-movement-report_view` (menu "Movimento
// Bancário" no PermissionTree, já seeded — nunca criar slug novo),
// incluída no `anyOf` amplo de `rel-fin` em `navigationPermissions.ts`. ----
const MovimentoBancarioRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/MovimentoBancario')
);

// ---- Privado: Relatórios — Pecuária — Evolução/Rebanho (Tarefa 27,
// spa-contract-evolucao-rebanho.md §5) — 1ª rota real do bucket `rel-pec`
// ("Pecuária"), hoje reservando ~38 relatórios futuros. Item de menu
// (`rel-pec-evo`) e permissão (`evolution-animal-report_view`) JÁ EXISTIAM
// no `anyOf` do pai — só o filho novo em navigationPermissions.ts. ----
const EvolucaoRebanhoRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/EvolucaoRebanho'));

// ---- Privado: Operacional — Sanitário (Sanitary, F-062, TASK-SAN-FE-09,
// contrato-tela-lane-c-sanitario-frontend.md §9) — última Tarefa da esteira,
// fecha o `surface_manifest` do módulo. 4 componentes para as 5 rotas reais
// (novo/editar reusam o mesmo `CreateOrUpdateSanitario`, mirror EXATO do
// bloco "Reprodução → Estação de Monta" acima). Item de menu
// (`ope-pec-man-san`) e permissão (`sanitary_view`) em navigationTree.ts/
// navigationPermissions.ts — nenhum slug novo (`sanitary_*` já existem em
// permissionsCatalog.json). ----
const SanitarioList = lazy(() => import('@/pages/Operacional/Sanitario'));
const CreateOrUpdateSanitario = lazy(
  () => import('@/pages/Operacional/Sanitario/CreateOrUpdateSanitario')
);
const SanitarioDetalhe = lazy(() => import('@/pages/Operacional/Sanitario/SanitarioDetalhe'));
const SanitarioLoteRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/SanitarioLote'));

// Relatórios — Pecuária — Vacas Prenhas (Tarefa 46,
// frontend-contract-vacas-prenhas.md §2.3). Rota GATEADA por
// `pregnancy-diagnosis_view` (permissão REAL do endpoint, `GAP-VACAS-01`).
const VacasPrenhasRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/VacasPrenhas'));
const HistoricoReprodutivoRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/HistoricoReprodutivo')
);

// Relatórios — Pecuária — Produtividade/Receptora (F-307, lote 079,
// F-307-plano-frontend.md §5 TASK-F307-FE-03). Rota GATEADA por
// `receiver-cow-productivity-report_view` (permissão REAL do endpoint,
// já provisionada no backend — sem workaround, mirror `HistoricoReprodutivo`).
const ProdutividadeReceptoraRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/ProdutividadeReceptora')
);

// Relatórios — Pecuária — Custeio/Lote (execução 074,
// custeio-lote-contrato-front.md §6). Rota GATEADA por
// `costing-batch-report_view` (permissão REAL do endpoint, já provisionada
// no backend — sem workaround, mirror `HistoricoReprodutivo`).
const CusteioLoteRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/CusteioLote'));

// Relatórios — Pecuária — Custeio/Animal (F-248, esteira 075,
// CusteioAnimal-contrato-front.md §6). Rota GATEADA por
// `costing-animal-report_view` (permissão REAL do endpoint, já provisionada
// no backend — sem workaround, mirror `CusteioLote`).
const CusteioAnimalRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/CusteioAnimal'));

// Relatórios — Pecuária — Custeio/Área (F-251,
// CusteioAreaPecuaria-contrato-api.md, lote 076). Rota GATEADA por
// `cust-area-pec-report_view` (permissão REAL do endpoint, já provisionada
// no backend — sem workaround, mirror `CusteioAnimal`).
const CusteioAreaPecuariaRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/CusteioAreaPecuaria')
);

// Relatórios — Pecuária — Custeio/Módulo (F-250, esteira 080,
// Custeio-Modulo-Contrato-Front.md §2). Rota GATEADA por
// `costing-grazing-report_view` (permissão REAL do endpoint, já provisionada
// no backend — sem workaround, mirror `CusteioAreaPecuaria`).
const CusteioModuloRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/CusteioModulo'));

// Relatórios — Pecuária — Aplicação/Manejo (F-230, esteira 97-Esteiras/077,
// F-230-plano-front.md). Rota GATEADA por
// `application-management-report_view` (permissão REAL do endpoint, já
// provisionada no backend — sem workaround, mirror `CusteioAreaPecuaria`).
const AplicacaoManejoRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/AplicacaoManejo'));

// Relatórios — Pecuária — Desempenho Pesagem Confinamento (F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`). Rota GATEADA por
// `feedlot-weighing-performance-report_view` (permissão REAL do endpoint,
// já provisionada no backend — sem workaround, mirror `CusteioAreaPecuaria`).
const DesempenhoPesagemConfinamentoRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/DesempenhoPesagemConfinamento')
);

// Relatórios — Pecuária — Movimentação/Rebanho (F-224, lote 076,
// `AnimalMovementReport-contrato.md`). Rota GATEADA por
// `animal-movements-report_view` (permissão REAL do endpoint, já
// provisionada no backend — sem workaround, mirror
// `DesempenhoPesagemConfinamento`).
const MovimentacaoRebanhoRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/MovimentacaoRebanho')
);

// Relatórios — Pecuária — Estq. Animais/Categoria (F-242, esteira
// 97-Esteiras/077, F-242-plano-front.md). Rota GATEADA por
// `category-animal-report_view` (permissão REAL do endpoint, já provisionada
// no backend — sem workaround, mirror `MovimentacaoRebanho`).
const CategoryAnimalReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/CategoryAnimalReport')
);

// Relatórios — Pecuária — Transf/Lote/Módulo/Área (F-329, esteira
// 97-Esteiras/077, F-329-plano-front.md). Rota GATEADA por
// `transfer-batch-module-area-report_view` (permissão REAL exigida pelo
// endpoint, já no `anyOf` do pai `rel-pec` — sem workaround, mirror
// `CategoryAnimalReport`). O plano de API fecha o bypass de autorização do
// legado (achado POSSÍVEL_LEGACY_DEFECT §1) via `HasMiddleware`.
const TransferenciaLoteModuloAreaRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/TransferenciaLoteModuloArea')
);

// Relatórios — Pecuária — Vendas/Animais (F-227, esteira 97-Esteiras/077,
// F-227-plano-front.md). Rota GATEADA por `animals-sales-report_view`
// (permissão REAL exigida pelo endpoint `GET /api/v1/animals-sales-report`,
// já no `anyOf` do pai `rel-pec` — sem workaround, mirror
// `CategoryAnimalReport`).
const AnimalsSaleReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/AnimalsSaleReport')
);

// Relatórios — Pecuária — Custo Total de Reprodução (F-328, esteira
// 97-Esteiras/008, TASK-FE-CTR-02). Rota GATEADA por
// `total-cost-of-reproduction-report_view` — permissão REAL exigida pelo
// endpoint `GET /total-cost-of-reproduction-report`, enforce em 2 barreiras
// no servidor (`GAP-CTR-01` opção B, decisão do dono 2026-09-09 — ao
// contrário de `PerformanceAnimal`/`EvolucaoRebanho`, onde a API NÃO
// enforce). Item de MENU dedicado (`rel-pec-cus-rep`, navigationTree.ts).
const CustoTotalReproducaoRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/CustoTotalReproducao')
);

// Relatórios — Pecuária — Nascimentos/SISBOV (F-235, esteira
// 97-Esteiras/052, TASK-052-235-FE-02). Rota GATEADA por
// `birth-animals-sisbovs-report_view` (permissão REAL exigida pelo endpoint
// `GET /api/v1/birth-animals-sisbovs-report`, mirror `HistoricoReprodutivo`/
// `CusteioLote` — sem workaround). Tela SÓ PDF, download-only, ambas as
// datas opcionais (fidelidade adjudicada DEC-225 §7.3).
const NascimentosSisbovRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/NascimentosSisbov')
);

// ---- Privado: Relatórios — Pecuária — Mortes/SISBOV (F-253, esteira
// 97-Esteiras/054, TASK-054-253-FE-02) — mirror estrutural 1:1 do bloco
// irmão "Nascimentos/SISBOV" acima, mesmo grupo `rel-pec`. Rota GATEADA por
// `death-animals-sisbovs-report_view` — permissão REAL exigida pelo endpoint
// `GET /api/v1/death-animals-sisbovs-report`, já no `anyOf` do pai `rel-pec`.
// Tela SÓ PDF, ambas as datas opcionais. ----
const MortesSisbovRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/MortesSisbov'));

// ---- Privado: Relatórios — Pecuária — Identificação/SISBOV (F-270, esteira
// 97-Esteiras/078, TASK-F270-F04, CONTRATOS/F-270-contrato-legado.md) —
// mirror estrutural 1:1 do bloco irmão "Nascimentos/SISBOV" acima, mesmo
// grupo `rel-pec`. Rota GATEADA por
// `identification-animals-sisbovs-report_view` — permissão REAL exigida
// pelo endpoint `GET /api/v1/identification-animals-sisbovs-report`, já no
// `anyOf` do pai `rel-pec`. Tela SÓ PDF, AMBAS as datas OBRIGATÓRIAS
// (diverge do irmão Nascimentos/Mortes SISBOV, que são opcionais). ----
const IdentificacaoSisbovRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/IdentificacaoSisbov')
);
// Mortes GENÉRICO (F-254, esteira 97-Esteiras/077,
// CONTRATOS/front/F-254-plano-front.md) — mirror EXATO do padrão do irmão
// "Mortes/SISBOV" acima, mesmo grupo `rel-pec`. Rota GATEADA por
// `death-animals-report_view` — permissão REAL exigida pelo endpoint
// planejado `GET /api/v1/death-animals-report`, já no `anyOf` do pai
// `rel-pec`. Tela PDF+Excel (Select `format`), ambas as datas OBRIGATÓRIAS.
const DeathAnimalReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/DeathAnimalReport')
);

// ---- Privado: Relatórios — Pecuária — Nascimentos GENÉRICO (F-236, esteira
// 97-Esteiras/053, TASK-053-236-FE-02, roteiro-front-F236-nascimentos.md) —
// mirror ESTRUTURAL do bloco "Nascimentos/SISBOV" acima. Rota GATEADA por
// `birth-report_view` — permissão REAL exigida pelo endpoint
// `GET /api/v1/birth-report` (`BirthReportController::middleware()`), já no
// `anyOf` do pai `rel-pec` (sem workaround). Distinto do irmão SISBOV: este
// é PDF+Excel, datas obrigatórias, com filtro de categoria.
const NascimentosRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/Nascimentos'));

// ---- Privado: Relatórios — Pecuária — Ficha Animal (F-225,
// 97-Esteiras/012, Tarefa 47, frontend-contract-ficha-animal.md §2.3) —
// mirror ESTRUTURAL do bloco "Vacas Prenhas" acima. Rota GATEADA por
// `animal-record-report_view` — permissão REAL e enforced no servidor
// (diferente de `GAP-VACAS-01`; ver fid-g3f-ficha-animal.md §2.1, a
// checagem-espelho confirmou que aqui gatear é o comportamento correto). ----
const FichaAnimalRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/FichaAnimal'));

// ---- Privado: Relatórios — Pecuária — Manejo/Lote (F-279, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-279-FE-03) — fan-out do canário
// `ProducaoCusteioAreaRelatorio` (F-298, ver bloco "Agricultura" abaixo).
// Mirror EXATO do bloco irmão `VacasPrenhasRelatorio` acima (mesmo grupo de
// menu "Relatórios → Pecuária", mesmo padrão de guard de rota por permissão
// real de servidor). Item de menu (`rel-pec-man`) e permissão
// (`management-batch-report_view`, já no `anyOf` do pai `rel-pec`) em
// navigationTree.ts/navigationPermissions.ts. ----
const ManejoLoteRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/ManejoLote'));

// ---- Privado: Relatórios — Pecuária — Pesagem/Lote (Tarefa 49, esteira
// CORE_WORKSPACE/97-Esteiras/014). Mirror EXATO do bloco irmão
// `ManejoLoteRelatorio` acima (mesmo grupo de menu "Relatórios → Pecuária",
// mesmo padrão de guard de rota por permissão real de servidor). Item de
// menu (`rel-pec-pes`) e permissão (`accumulated-weighing-batch-
// report_view`, já no `anyOf` do pai `rel-pec`) em
// navigationTree.ts/navigationPermissions.ts. ----
const PesagemLoteRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/PesagemLote'));

// ---- Privado: Relatórios — Pecuária — Nutrição/Lote (F-288, esteira
// 97-Esteiras/053, TASK-288-FE-02, roteiro-front-F288-nutricao.md) — mirror
// EXATO do bloco irmão `ManejoLoteRelatorio` acima (mesmo grupo de menu
// "Relatórios → Pecuária", mesmo domínio de dados — rota/ícone DISTINTOS).
// Item de menu (`rel-pec-nut`) e permissão (`nutrition-consumption-
// report_view`, já no `anyOf` do pai `rel-pec` após correção da entrada
// STALE `nutrition_report`) em navigationTree.ts/navigationPermissions.ts. ----
const NutricaoConsumoLoteRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/NutricaoConsumoLote')
);

// Relatórios — Pecuária — Composição Rebanho (F-269, lote 079,
// F-269-plano-frontend.md §6 TASK-F269-FE-03). Item de menu
// (`rel-pec-composicao-rebanho`) e permissão (`herd-composition-report_view`,
// já no `anyOf` do pai `rel-pec`) em navigationTree.ts/navigationPermissions.ts. ----
const ComposicaoRebanhoRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/ComposicaoRebanho')
);

// ---- Privado: Relatórios — Pecuária — Animais por Lote (Tarefa 51, esteira
// CORE_WORKSPACE/97-Esteiras/015). Mirror EXATO do bloco irmão
// `PesagemLoteRelatorio` acima (mesmo grupo de menu "Relatórios → Pecuária",
// mesmo padrão de guard de rota por permissão real de servidor). Item de
// menu (`rel-pec-apl`) e permissão (`animals-per-batch-report_view`, já no
// `anyOf` do pai `rel-pec`) em navigationTree.ts/navigationPermissions.ts. ----
const AnimaisPorLoteRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/AnimaisPorLote'));

// Relatórios — Pecuária — Performance Animal (F-234, TASK-FE-PA-01). Rota
// SEM `RequirePermission` DE PROPÓSITO — mirror `EvolucaoRebanhoRelatorio`
// (`GET /batch-profitability-report` não exige permissão no servidor,
// `DEC-DOM-19`); o item de MENU (`rel-pec-pfa`) permanece gateado por
// `batch-profitability-report_view`.
const PerformanceAnimalRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/PerformanceAnimal')
);

// ---- Privado: Relatórios — Agricultura — Apontamento Máquina (Tarefa 46,
// frontend-contract-apontamento-maquina.md §2) — mirror ESTRUTURAL do bloco
// "Evolução/Rebanho" acima, mas COM guard de permissão (mirror
// `SanitarioLoteRelatorio`, ver rota abaixo) — a API corrigiu a autorização
// por construção (`GAP-APONT-01`). "Agricultura" (`rel-agr`) vira item-pai
// com 1 filho novo, mirror EXATO do padrão já aplicado a
// `rel-pec`/`rel-fin`/`rel-gfi`. Item de menu (`rel-agr-apo`) e permissão
// (`appropriation_equipments_report`) em navigationTree.ts/
// navigationPermissions.ts. ----
const ApontamentoMaquinaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/ApontamentoMaquina')
);

// ---- Privado: Relatórios — Agricultura — Ocorrências Talhões (F-232,
// Tarefa 50, esteira CORE_WORKSPACE/97-Esteiras/015) — mirror ESTRUTURAL do
// bloco "Apontamento Máquina" acima (mesmo grupo de menu, mesmo padrão de
// guard de rota por permissão real de servidor). Rota GATEADA por
// `appropriation-occurrences-report_view` — a API corrigiu a autorização por
// construção (FID-G3A #1 da API), mesmo cuidado do bloco irmão
// (`GAP-APONT-01`). Item de menu (`rel-agr-ocor`) e permissão em
// navigationTree.ts/navigationPermissions.ts. ----
const OcorrenciasTalhoesRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/OcorrenciasTalhoes')
);

// ---- Privado: Relatórios — Agricultura — Prev. Área/Receita (F-280,
// TASK-MFA-FE-03, esteira 075) — mirror ESTRUTURAL do bloco "Apontamento
// Máquina" acima (2º filho de `rel-agr`). Rota GATEADA por
// `markings_prev_area_view` — permissão REAL enforced no servidor (`CL-05`
// corrigido), mesmo cuidado do bloco irmão (`GAP-APONT-01`). Item de menu
// (`rel-agr-prev`) e permissão em navigationTree.ts/navigationPermissions.ts. ----
const PrevisaoAreaReceitaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/PrevisaoAreaReceita')
);

// ---- Privado: Relatórios — Bens — Inventário Patrimonial (F-260,
// TASK-INV-FE-02, esteira 075) — 1º filho do grupo `rel-ben` ("Bens /
// Ativo"), convertido de item-folha para item-pai+filho nesta Tarefa (mirror
// EXATO do mesmo padrão já aplicado a `rel-est`/`rel-gfi`/`rel-agr`/
// `rel-pec`). Guard de ROTA usa a permissão específica `equipments_report`
// (mirror do `permission:` do Controller, já contida no `anyOf` amplo de
// `rel-ben` em `navigationPermissions.ts`, que fica só no MENU). ----
const InventarioRelatorio = lazy(() => import('@/pages/Relatorios/Bens/Inventario'));

// ---- Privado: Relatórios — Gestão Pessoal — Apuração Mensal (TASK-07-57,
// feature F-285, `97-Esteiras/007`) — mirror ESTRUTURAL do bloco
// "Evolução/Rebanho" acima (`rel-pec`). "Gestão Pessoal" (`rel-gpe`) vira
// item-pai com 1 filho novo, mirror EXATO do padrão já aplicado a
// `rel-pec`/`rel-fin`/`rel-agr`. SEM guard de permissão na ROTA — `GET
// /monthly-calculation-report` não exige permissão nenhuma no backend
// (DEC-DOM-19, fidelidade estrita ao legado), mirror EXATO `GAP-EVO-01`
// (`EvolucaoRebanhoRelatorio`). Item de menu (`rel-gpe-apu`) e permissão
// (`earnings_view`) em navigationTree.ts/navigationPermissions.ts. ----
const ApuracaoMensalRelatorio = lazy(
  () => import('@/pages/Relatorios/GestaoPessoal/ApuracaoMensal')
);

// ---- Privado: Relatórios — Agricultura — Produção/Custeio/Área (F-298,
// esteira CORE_WORKSPACE/97-Esteiras/051, TASK-298-FE-03) — CANÁRIO da tela
// de relatório em código para o fan-out (F-279/F-238/F-315/F-326). Mirror
// EXATO do bloco irmão `ApontamentoMaquinaRelatorio` acima (mesmo grupo de
// menu "Relatórios → Agricultura", mesmo padrão de guard de rota por
// permissão real de servidor). Item de menu (`rel-agr-pca`) e permissão
// (`production_cost_area_view`, já no `anyOf` do pai `rel-agr`) em
// navigationTree.ts/navigationPermissions.ts. ----
const ProducaoCusteioAreaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/ProducaoCusteioArea')
);

// ---- Privado: Relatórios — Agricultura — Custeio/Área (F-252, esteira
// CORE_WORKSPACE/97-Esteiras/079, F-252-plano-frontend.md TASK-252-FE-03) —
// tela NOVA, distinta de `ProducaoCusteioAreaRelatorio` acima (F-298,
// rota/controller/permissão diferentes, §0 do roteiro). Mirror ESTRUTURAL
// do bloco irmão acima (mesmo grupo de menu "Relatórios → Agricultura",
// mesmo padrão de guard de rota por permissão real de servidor). Item de
// menu (`rel-agr-cus`) e permissão (`cost_area_view`, já no `anyOf` do pai
// `rel-agr`) em navigationTree.ts/navigationPermissions.ts. ----
const CusteioAreaRelatorio = lazy(() => import('@/pages/Relatorios/Agricultura/CusteioArea'));

// ---- Privado: Relatórios — Agricultura — Prod./Colaborador (F-300, esteira
// CORE_WORKSPACE/97-Esteiras/079, F-300-plano-frontend.md TASK-300-FE-03) —
// fan-out do canário `ProducaoCusteioAreaRelatorio` (F-298, ver bloco acima).
// Mirror EXATO do bloco irmão `ProducaoCusteioAreaRelatorio` (mesmo grupo de
// menu "Relatórios → Agricultura", mesmo padrão de guard de rota por
// permissão real de servidor). Item de menu (`rel-agr-poc`) e permissão
// (`prod_employee_view`, já no `anyOf` do pai `rel-agr`) em
// navigationTree.ts/navigationPermissions.ts. ----
const ProducaoColaboradorRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/ProducaoColaborador')
);

// ---- Privado: Relatórios — Vendas — Vendas/Produto (F-315, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-315-FE-03) — fan-out do canário
// `ProducaoCusteioAreaRelatorio` (F-298). Mirror ESTRUTURAL do bloco irmão
// acima, mesmo padrão de guard de rota por permissão real de servidor. Item
// de menu (`rel-ven`, FOLHA, single-page) e gate do grupo (`anyOf` incluindo
// `sales-products_report`) JÁ EXISTEM em navigationTree.ts/
// navigationPermissions.ts — nenhuma edição em nenhum dos dois (auditoria do
// roteiro-front-F315). Esta rota fecha o link morto que hoje cai no
// `RoutePlaceholder` genérico de `/relatorios/*`. ----
const VendasProdutoRelatorio = lazy(() => import('@/pages/Relatorios/Vendas'));

// ---- Privado: Relatórios — Vendas — Cliente/Produto (F-313, esteira
// 97-Esteiras/054, TASK-054-313-T1) — 2º filho do grupo `rel-ven`, que era
// FOLHA (servindo só o F-315 acima) e vira item-PAI (navigationTree.ts,
// mirror `rel-gfi`/`rel-pec`). Guard de ROTA usa a permissão específica
// `sale-clients_report` (já contida no `anyOf` do próprio `rel-ven` em
// `navigationPermissions.ts`, que fica só no MENU) — a rota do irmão F-315
// acima permanece INTOCADA. ----
const ClienteProdutoRelatorio = lazy(() => import('@/pages/Relatorios/Vendas/ClienteProduto'));

// ---- Privado: Relatórios — Vendas — Cliente (F-317, esteira
// 97-Esteiras/077, F-317-plano-front.md) — 3º filho do grupo `rel-ven`,
// mirror EXATO do bloco irmão `ClienteProdutoRelatorio` acima. Guard de
// ROTA usa a permissão específica `sales_report` (já contida no `anyOf` do
// próprio `rel-ven` em `navigationPermissions.ts`, que fica só no MENU) — as
// rotas dos irmãos F-315/F-313 acima permanecem INTOCADAS. Endpoint-alvo
// `GET /sales-report` ainda em migração cirúrgica no motor da API
// (`F-317-plano-CIRURGICO.md`) — dependência de sequenciamento registrada
// para o Tester, não bloqueia o fatiamento do front. ----
const SaleGeneralReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Vendas/SaleGeneralReport')
);

// ---- Privado: Relatórios — Vendas — Funcionário (F-314, esteira
// 97-Esteiras/079, F-314-plano-frontend.md) — 4º filho do grupo `rel-ven`,
// mirror EXATO do bloco irmão `SaleGeneralReportRelatorio` acima. Guard de
// ROTA usa a permissão específica `sale-employees_report` (já contida no
// `anyOf` do próprio `rel-ven` em `navigationPermissions.ts`, que fica só no
// MENU) — as rotas dos irmãos F-315/F-313/F-317 acima permanecem INTOCADAS.
// Endpoint `GET /sales-employee-report` já em produção (lote 043), com fix
// pontual do filtro `user_uuid` na esteira 079 (sem mudança de contrato). ----
const SaleEmployeeReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Vendas/SaleEmployeeReport')
);

// ---- Privado: Relatórios — Agricultura — Rentabilidade/Cultura (F-302,
// esteira CORE_WORKSPACE/97-Esteiras/077, F-302-plano-front.md) — mirror
// EXATO do bloco irmão `ProducaoCusteioAreaRelatorio` acima (mesmo grupo de
// menu "Relatórios → Agricultura", mesmo padrão de guard de rota por
// permissão real de servidor). Item de menu (`rel-agr-ren`) e permissão
// (`profitability-by-crop_report`, já no `anyOf` do pai `rel-agr`) em
// navigationTree.ts/navigationPermissions.ts. ----
const RentabilidadeCulturaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/RentabilidadeCultura')
);

// ---- Privado: Relatórios — Agricultura — Romaneio/Diferença (Tarefa 49,
// esteira 97-Esteiras/014, front-architecture-romaneio-diferenca.md §2) —
// mirror ESTRUTURAL do bloco "Rentabilidade/Cultura" acima, irmão dentro do
// mesmo item-pai `rel-agr`. SEM `RequirePermission` DE PROPÓSITO — mirror
// EXATO `EvolucaoRebanhoRelatorio` (ver comentário da rota abaixo,
// `GAP-RMD-02`/`DEC-043`). Item de menu (`rel-agr-rom-dif`) e permissão
// (`transfer_difference_report`, já no `anyOf` do pai `rel-agr`) em
// navigationTree.ts/navigationPermissions.ts. ----
const RomaneioDiferencaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/RomaneioDiferenca')
);

// ---- Privado: Relatórios — Agricultura — Prod./Área (Tarefa 47,
// frontend-contract-prod-area.md §2.3) — mirror ESTRUTURAL do bloco
// "Apontamento Máquina" acima, irmão dentro do mesmo item-pai `rel-agr`.
// Rota GATEADA (mirror `ApontamentoMaquina`, não o "sem guard" de
// `EvolucaoRebanho`): o backend exige `prod_area_view` por dupla barreira
// (contrato de API §11, `C-08`). Item de menu (`rel-agr-pro`) e permissão
// em navigationTree.ts/navigationPermissions.ts. ----
const ProducaoAreaRelatorio = lazy(() => import('@/pages/Relatorios/Agricultura/ProducaoArea'));

// ---- Privado: Relatórios — Agricultura — Pesagens/Colheita (F-335,
// execução 053, roteiro-front-F335-pesagens-colheita.md) — mirror
// ESTRUTURAL do bloco "Prod./Área" acima, irmão dentro do mesmo item-pai
// `rel-agr`. Rota GATEADA por `weighing-harvest_report` (já reservada no
// `anyOf` do pai `rel-agr`, navigationPermissions.ts:906) — dupla barreira
// (`WeighingHarvestReportController::middleware()` + `authorize()` do
// Request), o legado só escondia o link do menu (DIV-01). Item de menu
// (`rel-agr-pes`) e permissão em navigationTree.ts/navigationPermissions.ts. ----
const PesagensColheitaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/PesagensColheita')
);

// ---- Privado: Relatórios — Agricultura — Romaneio/Vendas/Contrato (F-331,
// 97-Esteiras/008, TASK-RVC-FE-02) — mirror ESTRUTURAL do bloco
// "Pesagens/Colheita" acima, irmão dentro do mesmo item-pai `rel-agr`. Rota
// GATEADA por `transfer-sales-contract_report` (já reservada no `anyOf` do
// pai `rel-agr`, `navigationPermissions.ts:912`) — dupla barreira real
// (`HasMiddleware` + `authorize()` do Request), mirror
// `/relatorios/agricultura/pesagens-colheita` (NÃO o precedente de rota
// aberta de `evolucao-rebanho`/`apuracao-mensal`). Item de menu
// (`rel-agr-rvc`) e permissão em navigationTree.ts/navigationPermissions.ts. ----
const RomaneioVendasContratoRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/RomaneioVendasContrato')
);

// ---- Privado: Relatórios — Gestão Pessoal — Horas Logadas (Tarefa 47,
// frontend-contract-horas-logadas.md §2.3 v2) — mirror ESTRUTURAL do bloco
// "Evolução/Rebanho" (SEM guard de permissão, não o "com guard" de
// `Prod./Área`/`ApontamentoMaquina`): `DEF-01` preservado intencionalmente
// na API v2/v3 (api-contract-horas-logadas.md §0/§8) — o endpoint não checa
// `logged-hours_view` no servidor. "Gestão Pessoal" (`rel-gpe`) vira
// item-pai com 1 filho novo, mirror EXATO do padrão já aplicado a
// `rel-pec`/`rel-fin`/`rel-gfi`/`rel-agr`. Item de menu
// (`rel-gpe-horas-logadas`) e permissão (`logged-hours_view`) em
// navigationTree.ts/navigationPermissions.ts — gate SÓ do menu. ----
const HorasLogadasRelatorio = lazy(() => import('@/pages/Relatorios/GestaoPessoal/HorasLogadas'));

// ---- Privado: Relatórios — Financeiro — Adiantamento (F-219, esteira
// 97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/* para vencer
// o RoutePlaceholder, mirror EXATO dos blocos irmãos de `rel-fin` acima.
const AdiantamentoRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/Adiantamento'));

// ---- Privado: Relatórios — Agricultura — Previsão Fazenda/Receita (F-281,
// esteira 97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/* para
// vencer o RoutePlaceholder, mirror EXATO dos blocos irmãos de `rel-agr`
// acima.
const PrevisaoFazendaReceitaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/PrevisaoFazendaReceita')
);

// ---- Privado: Relatórios — Financeiro — Agenda de Recebimentos (F-304,
// esteira 97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/* para
// vencer o RoutePlaceholder, mirror EXATO dos blocos irmãos de `rel-fin`
// acima.
const AgendaRecebimentosRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/AgendaRecebimentos')
);

// ---- Privado: Relatórios — Financeiro — Fiscal/Não Fiscal (F-266, lote 076,
// `FiscalDifferenceReport-contrato.md`) — DECLARADA ANTES do catch-all
// /relatorios/* para vencer o RoutePlaceholder, mirror EXATO dos blocos
// irmãos de `rel-fin` acima.
const FiscalNaoFiscalRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/FiscalNaoFiscal')
);

// ---- Privado: Relatórios — Pecuária — Registro Genealógico (F-222, esteira
// 97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/* para vencer
// o RoutePlaceholder, mirror EXATO dos blocos irmãos de `rel-pec` acima.
const RegistroGenealogicoRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/RegistroGenealogico')
);

// ---- Privado: Relatórios — Pecuária — Histórico de Animais/Lote (F-221,
// esteira 97-Esteiras/058, FRONT-F221-plano.md) — DECLARADA ANTES do
// catch-all /relatorios/* para vencer o RoutePlaceholder, mirror EXATO dos
// blocos irmãos de `rel-pec` acima (`HistoricoReprodutivo`/
// `RegistroGenealogico`).
const HistoricoAnimaisLoteRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/HistoricoAnimaisLote')
);

// ---- Privado: Relatórios — Agricultura — Romaneio Cliente (F-332, esteira
// 97-Esteiras/058, FRONT-F332-plano.md) — DECLARADA ANTES do catch-all
// /relatorios/* para vencer o RoutePlaceholder, mirror EXATO dos blocos
// irmãos de `rel-agr` acima (`PrevisaoFazendaReceitaRelatorio`).
const RomaneioClienteRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/RomaneioCliente')
);

// ---- Privado: Relatórios — Agricultura — Pesagem Entrada/Saída (F-336,
// esteira 97-Esteiras/058, FRONT-F336-plano.md) — DECLARADA ANTES do
// catch-all /relatorios/* para vencer o RoutePlaceholder, mirror EXATO do
// bloco irmão "Romaneio Cliente" acima.
const PesagemEntradaSaidaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/PesagemEntradaSaida')
);

// ---- Privado: Relatórios — 9 telas da execução 059 (F-273/F-223/F-216/
// F-282/F-294/F-303/F-334/F-337/F-220) — BLOCO DE FIAÇÃO GLOBAL (Executor
// Front v2, integração das telas escritas em paralelo, cada uma DECLARADA
// ANTES do catch-all `/relatorios/*` para vencer o `RoutePlaceholder`,
// mesmo cuidado de todos os blocos irmãos acima). ----
const RazaoCategoriaRelatorio = lazy(() => import('@/pages/Relatorios/Financeiro/RazaoCategoria'));
const AnaliseMovimentacaoLoteRelatorio = lazy(
  () => import('@/pages/Relatorios/Pecuaria/AnaliseMovimentacaoLote')
);
const DepreciacaoAcumuladaRelatorio = lazy(
  () => import('@/pages/Relatorios/Bens/DepreciacaoAcumulada')
);
const PrevisaoColheitaAreaRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/PrevisaoColheitaArea')
);
const AgendaPagamentosRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/AgendaPagamentos')
);
const FluxoMensalRecebimentoRelatorio = lazy(
  () => import('@/pages/Relatorios/Financeiro/FluxoMensalRecebimento')
);
const PesagemAnimalRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/PesagemAnimal'));
// Desmamas (F-333, esteira 97-Esteiras/060, ROTEIRO-F333-FRONT-desmamas-tela.md
// §6, TASK-F333-FRONT-01) — sai do modal em Operacional > Desmama e ganha tela
// dedicada em Relatórios > Pecuária, mirror EXATO do padrão `PesagemAnimalRelatorio`
// acima.
const DesmamasRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/Desmamas'));
const WeighingStockClientReportRelatorio = lazy(
  () => import('@/pages/Relatorios/Estoque/WeighingStockClientReport')
);
const AplicacaoManejoTalhoesRelatorio = lazy(
  () => import('@/pages/Relatorios/Agricultura/AplicacaoManejoTalhoes')
);

// ---- Privado: Operacional — Pesagem (Weighing, F-071, TASK-PES-FE-08,
// contrato-tela-lane-c-pesagem-frontend.md §9) — última Tarefa da esteira,
// fecha o `surface_manifest` completo do módulo. 3 componentes para as 4
// rotas reais (novo/editar reusam o mesmo `CreateOrUpdateWeighing`, mirror
// EXATO do bloco "Operacional → Sanitário" acima). Sem rota própria de
// relatório individual — é ação de linha (download direto), não tela.
// Item de menu (`ope-pec-man-pes`) e permissão (`weighing_view`) em
// navigationTree.ts/navigationPermissions.ts — nenhum slug novo
// (`weighing_*` já existem em permissionsCatalog.json). ----
const PesagemList = lazy(() => import('@/pages/Operacional/Pesagem'));
const CreateOrUpdateWeighing = lazy(
  () => import('@/pages/Operacional/Pesagem/CreateOrUpdateWeighing')
);
const WeighingDetalhe = lazy(() => import('@/pages/Operacional/Pesagem/WeighingDetalhe'));

// ---- Privado: Operacional — Nutrição (Nutrition, F-050, esteira
// CORE_WORKSPACE/97-Esteiras/066, TASK-NT-FE-02) — listagem+filtro+exclusão,
// mirror EXATO do bloco "Operacional → Sanitário/Pesagem" acima (mesmo grupo
// de permissão `ope-pec-man`, que já incluía `nutrition_view/create/edit/
// delete` no `anyOf` do pai). Item de menu (`ope-pec-man-nut`) e permissão
// (`nutrition_view`) NOVOS em navigationTree.ts/navigationPermissions.ts
// (nenhum slug novo — `nutrition_*` já existem no catálogo real). SEM
// `CreateOrUpdateNutrition`/`NutritionDetalhe` nesta Tarefa — form (SRF-03)
// e visualização (SRF-07) são fatias futuras (`TASK-NT-FE-03`/`04`, ver
// matriz FID-G3F `nutricao-fid-g3f-matriz.DRAFT.md`). ----
const NutritionList = lazy(() => import('@/pages/Operacional/Nutrition'));
// Form ÚNICO de criação/edição (TASK-NT-FE-03, SRF-03/04/05/09) —
// `/operacional/nutricao/novo` (criar) e `/operacional/nutricao/:id`
// (editar), mirror `CreateOrUpdateFoodBeat`/`CreateOrUpdateUsuario`.
const CreateOrUpdateNutrition = lazy(
  () => import('@/pages/Operacional/Nutrition/CreateOrUpdateNutrition')
);
// Visualização read-only (TASK-NT-FE-05, SRF-07) — `/operacional/nutricao/
// :id/visualizar`, fecha o CRUD visual do módulo. Reaproveita a composição do
// form (`CreateOrUpdateNutrition`/`NutritionItemsEditor`/
// `NutritionEmployeesEditor`) em modo leitura — ver docblock do componente.
const ViewNutrition = lazy(() => import('@/pages/Operacional/Nutrition/ViewNutrition'));

// ---- Privado: Operacional — Gestão Animais (tela DEDICADA, execução 017,
// reversão de SD-01 — ver contrato de tela 97-Esteiras/017/CONTRATOS/
// contrato-tela-gestao-animais-dedicada.md §2/§3). Wrapper fino sobre o
// MESMO núcleo de tela (`AnimalListScreen`, extraído na Tarefa 53) que
// `/cadastros-base/rebanho` — nenhuma lógica de grid/filtro/lote nova.
// `CreateOrUpdateAnimal` NÃO ganha um segundo lazy import — reaproveita o já
// declarado acima para as rotas de Rebanho (evita duplicar o chunk).
const GestaoAnimaisList = lazy(() => import('@/pages/Operacional/GestaoAnimais'));

// ---- Privado: Operacional — Pesagem Rodoviária (ModuleWeighing, F-045,
// execução 044, TASK-MWG-FE-01..13 — esteira COMPLETA). PINO CRÍTICO:
// `ModuleWeighing` ≠ `Weighing` (bloco acima, pesagem ANIMAL, F-071, já em
// produção) — namespace/pasta/rota deliberadamente disjuntos
// (`CONTRATO-TELA-PESAGEM-FE §1`). Item de menu registrado em
// `navigationTree.ts`/`navigationPermissions.ts` (`ope-agr-pes`,
// `TASK-MWG-FE-13`). ----
const ModuleWeighingList = lazy(() => import('@/pages/Operacional/PesagemRodoviaria'));
const CreateOrUpdateModuleWeighing = lazy(
  () => import('@/pages/Operacional/PesagemRodoviaria/CreateOrUpdateModuleWeighing')
);
const ModuleWeighingRelatorio = lazy(
  () => import('@/pages/Operacional/PesagemRodoviaria/ModuleWeighingRelatorio')
);
const ModuleWeighingWizard = lazy(
  () => import('@/pages/Operacional/PesagemRodoviaria/ModuleWeighingWizard')
);
const FinalizarModuleWeighing = lazy(
  () => import('@/pages/Operacional/PesagemRodoviaria/FinalizarModuleWeighing')
);
const ModuleWeighingComprovante = lazy(
  () => import('@/pages/Operacional/PesagemRodoviaria/ModuleWeighingComprovante')
);

const AdiantamentoList = lazy(() => import('@/pages/Administrativo/Adiantamento'));
const AdiantamentoDetalhe = lazy(
  () => import('@/pages/Administrativo/Adiantamento/AdiantamentoDetalhe')
);
const CreateOrUpdateAdiantamento = lazy(
  () => import('@/pages/Administrativo/Adiantamento/CreateOrUpdateAdiantamento')
);

// ---- Privado: Administrativo — Registro de Eventos (Bonus) ----
// Esteira 037 (registro-eventos-front-roteiro.md, TASK-FE-08) — rotas REAIS
// (grid + form create/edit + detalhe). Item de menu (adm-gp-reg) e permissão
// (bonuses_view) JÁ existem (navigationTree.ts/navigationPermissions.ts).
const RegistroEventosList = lazy(() => import('@/pages/Administrativo/RegistroEventos'));
const RegistroEventoDetalhe = lazy(
  () => import('@/pages/Administrativo/RegistroEventos/RegistroEventoDetalhe')
);
const CreateOrUpdateRegistroEvento = lazy(
  () => import('@/pages/Administrativo/RegistroEventos/CreateOrUpdateRegistroEvento')
);

// ---- Privado: Administrativo — Apuração Mensal (Earning) ----
// 97-Esteiras/002, Tarefas 07/08/09 — listagem+filtro+seletor de
// funcionário (Tarefa 07), detalhe read-only (Tarefa 07), formulário único
// de upsert (Tarefa 08). Item de menu (adm-gp-apu) e permissão
// (earnings_view/earnings_edit) JÁ EXISTEM (navigationTree.ts:498 —
// `path: "/administrativo/apuracao"`, navigationPermissions.ts:253) — esta
// Tarefa só conecta as rotas reais, path fiel ao item de menu JÁ EM
// PRODUÇÃO (diverge do `/administrativo/apuracao-mensal` sugerido pelo
// task-packet — fidelidade ao código real > contrato aspiracional, mesmo
// racional já registrado para `ContasAPagar`/`fin-pag`).
const EarningList = lazy(() => import('@/pages/Administrativo/Earning'));
const EarningDetalhe = lazy(() => import('@/pages/Administrativo/Earning/EarningDetalhe'));
const CreateOrUpdateEarning = lazy(
  () => import('@/pages/Administrativo/Earning/CreateOrUpdateEarning')
);

// ---- Privado: Cadastros Base — Cultura/Variedade (Cultivation) ----
// Listagem em árvore (TASK-CV-04a) + formulário create/edit (TASK-CV-04b).
const CultivationList = lazy(() => import('@/pages/BaseRegistrations/Cultivation'));
const CultivationForm = lazy(
  () => import('@/pages/BaseRegistrations/Cultivation/CreateOrUpdateCultivation')
);

// ---- Privado: Cadastros Base — Endereçamentos (Addressing, domínio
// Estoque) ----
// Listagem em árvore RECURSIVA de 4 níveis (TASK-AD-03a) + formulário
// contextual create/edit (TASK-AD-03b).
const AddressingList = lazy(() => import('@/pages/BaseRegistrations/Addressing'));
const AddressingForm = lazy(
  () => import('@/pages/BaseRegistrations/Addressing/CreateOrUpdateAddressing')
);

// ---- Privado: Cadastros Base — Plano de Contas (PlanAccount, domínio
// Financeiro) ----
// Listagem paginada (TASK-PA-03a) + formulário create/edit + categorias
// (TASK-PA-03b, substitui os placeholders de `novo`/`novo/:parentUuid`/`:uuid`
// que caíam no catch-all `/cadastros-base/*`).
const PlanAccountList = lazy(() => import('@/pages/CadastrosBase/PlanAccount'));
const CreateOrUpdatePlanAccount = lazy(
  () => import('@/pages/CadastrosBase/PlanAccount/CreateOrUpdatePlanAccount')
);

// ---- Privado: Cadastros Base — Armazéns (Warehouses) ----
// ---- Privado: Doc. Fiscal/Entrada (Invoice, domínio PRÓPRIO — sub-rota
// REAL dentro do módulo catch-all "Gestão Fiscal", TASK-FE-2769, execução
// 033/Onda 3). Casa de código em `src/pages/Invoices/` (mirror
// `Warehouses`/`Planos`), NÃO sub-pasta de CadastrosBase/BaseRegistrations —
// só a ROTA fica sob `/fiscal/*` (mesmo racional de `ArmazemList` abaixo,
// sub-rota real declarada ANTES do catch-all do próprio módulo). ----
const InvoicesList = lazy(() => import('@/pages/Invoices'));
const CreateOrUpdateInvoice = lazy(() => import('@/pages/Invoices/CreateOrUpdateInvoice'));
const InvoiceDetalhe = lazy(() => import('@/pages/Invoices/InvoiceDetalhe'));

// ---- Privado: Operacional — Apontamentos (Appropriation, domínio PRÓPRIO —
// TASK-FE-2705..2713, execução 033/Onda 3). URL `/operacional/apontamentos`
// (não `/cadastros-base/...` — domínio de rota novo, mirror `Administrativo`/
// `Financeiro`). Item de menu (`ope-agr-apo`) e permissão
// (`appropriations_view`) JÁ EXISTIAM em `navigationTree.ts`/
// `navigationPermissions.ts` antes desta Tarefa — nenhuma edição neles. ----
const AppropriationsList = lazy(() => import('@/pages/Operacional/Appropriations'));
const CreateOrUpdateAppropriation = lazy(
  () => import('@/pages/Operacional/Appropriations/CreateOrUpdateAppropriation')
);
const AppropriationDetalhe = lazy(
  () => import('@/pages/Operacional/Appropriations/AppropriationDetalhe')
);
const AppropriateAppropriation = lazy(
  () => import('@/pages/Operacional/Appropriations/AppropriateAppropriation')
);
// TASK-FE-715 (execução 034, rodada Apropriar+Finalização) — tela dedicada
// de Finalização (reabre as 5 categorias, majoritariamente readonly).
const FinishAppropriation = lazy(
  () => import('@/pages/Operacional/Appropriations/FinishAppropriation')
);

// ---- Privado: Operacional — Pastagem (Pasture, domínio PRÓPRIO — TASK-PAST-
// FE-00..08, execução 041). URL `/operacional/pastagem`, mirror
// `Operacional/Appropriations` acima (mesma família de máquina de estados
// O→F→A). Item de menu NÃO existe ainda em `navigationTree.ts` (observação
// registrada ao Tester/Arquiteto — fora do escopo desta Tarefa, que só
// registra rotas; a tela é alcançável por deep-link/URL direta). Permissões
// `pastures_view/create/edit/delete` JÁ EXISTIAM em
// `navigationPermissions.ts` (grupo `ope-pec-man`) antes desta Tarefa —
// nenhuma edição nele. ----
const PastagemList = lazy(() => import('@/pages/Operacional/Pastagem'));
const CreateOrUpdatePastagem = lazy(
  () => import('@/pages/Operacional/Pastagem/CreateOrUpdatePastagem')
);
const ShowPastagem = lazy(() => import('@/pages/Operacional/Pastagem/ShowPastagem'));
const AppropriatePastagem = lazy(() => import('@/pages/Operacional/Pastagem/AppropriatePastagem'));

// ---- Privado: Operacional — Romaneios (Transfer, domínio PRÓPRIO —
// TASK-TRF-FE-01, esteira 97-Esteiras/001). URL `/operacional/romaneios`,
// mirror `Operacional/Appropriations` acima. Item de menu (`ope-agr-rom`) e
// permissão (`transfers_view`) JÁ EXISTIAM em `navigationTree.ts`/
// `navigationPermissions.ts` antes desta Tarefa — nenhuma edição neles.
// A TASK-TRF-FE-01 declarou a LISTAGEM; a TASK-TRF-FE-02 (esta) ativa
// `/novo` e `/:transferUuid` (casca de abas + aba Cabeçalho). A rota
// `/:transferUuid/detalhe` fica reservada por comentário para TASK-TRF-FE-05. ----
const RomaneiosList = lazy(() => import('@/pages/Operacional/Romaneios'));
const CreateOrUpdateRomaneio = lazy(
  () => import('@/pages/Operacional/Romaneios/CreateOrUpdateRomaneio')
);
// TASK-TRF-FE-05 — tela de visualização (read-only) dedicada, ativa a rota
// `/:transferUuid/detalhe` reservada acima (GAP-TRF-FE-10, sem `useForm`).
const RomaneioDetalhe = lazy(() => import('@/pages/Operacional/Romaneios/RomaneioDetalhe'));
const FinishRomaneio = lazy(() => import('@/pages/Operacional/Romaneios/FinishRomaneio'));

// ---- Privado: Operacional — Carregamento (Charge, domínio PRÓPRIO —
// TASK-FE-CG-02, esteira 97-Esteiras/045). URL `/operacional/carregamento`
// (singular, espelha o `path` do item de menu `ope-agr-car`, JÁ EXISTENTE em
// `navigationTree.ts`/`navigationPermissions.ts` — nenhuma edição neles,
// apenas reconciliação). Mirror `Operacional/Romaneios`. `TASK-FE-CG-02`
// declara SÓ a listagem; `/novo` e `/:chargeUuid` (mesma tela cobre criar/
// editar/visualizar, nota técnica 5 do plano — sem surface de "Visualizar"
// separada) nascem em `TASK-FE-CG-03`. ----
const CarregamentoList = lazy(() => import('@/pages/Operacional/Carregamento'));
const CreateOrUpdateCharge = lazy(
  () => import('@/pages/Operacional/Carregamento/CreateOrUpdateCharge')
);
// `FinishCharge` (TASK-FE-CG-05, AM-05) — rota dedicada de finalização,
// mirror `FinishAppropriation`.
const FinishCharge = lazy(() => import('@/pages/Operacional/Carregamento/FinishCharge'));

// ---- Privado: Operacional — Agricultura — Carregamento — Contas a Receber
// (ChargeBillIncome, F-026, domínio PRÓPRIO — TASK-CBI-FE-01/02/04, esteira
// CORE_WORKSPACE/97-Esteiras/059). URL base `/operacional/carregamento/
// contas-a-receber` (filho de "Carregamento", mesmo `anyOf` de
// `navigationPermissions.ts` já cobria `charge_income_*` antes desta
// Tarefa). Domínio PRÓPRIO — NÃO confundir com `Income` (Financeiro →
// Receber, `/financeiro/receber`, permissões `incomes_*`). FE-01/02/04
// registraram listagem + detalhe; TASK-CBI-FE-03 (esta Tarefa) acrescenta
// `/novo` e `/:chargeBillIncomeUuid` (form create/edit) — ver bloco de rotas
// abaixo. ----
const ChargeBillIncomesList = lazy(() => import('@/pages/Operacional/ChargeBillIncomes'));
const ChargeBillIncomeDetalhe = lazy(
  () => import('@/pages/Operacional/ChargeBillIncomes/ChargeBillIncomeDetalhe')
);
// `/novo` e `/:chargeBillIncomeUuid` (form create/edit, TASK-CBI-FE-03) —
// registradas no bloco de rotas abaixo, DECLARADAS ANTES do catch-all
// `/operacional/*` (mesmo cuidado de especificidade dos blocos irmãos).
const CreateOrUpdateChargeBillIncome = lazy(
  () => import('@/pages/Operacional/ChargeBillIncomes/CreateOrUpdateChargeBillIncome')
);

// ---- Privado: Operacional — Agricultura — Carregamento — Contas a Pagar
// (ChargeBillExpense, domínio PRÓPRIO — TASK-CBE-04/05/06/07, esteira
// CORE_WORKSPACE/97-Esteiras/062). URL base `/operacional/carregamento/
// contas-a-pagar` (filho de "Carregamento", mirror do gêmeo `ChargeBillIncome`
// acima). Domínio PRÓPRIO — NÃO confundir com `Expense` (Financeiro → Pagar,
// `/financeiro/pagar`, permissões `expenses_*`). ----
const ChargeBillExpensesList = lazy(() => import('@/pages/Operacional/ChargeBillExpenses'));
const ChargeBillExpenseDetalhe = lazy(
  () => import('@/pages/Operacional/ChargeBillExpenses/ChargeBillExpenseDetalhe')
);
const CreateOrUpdateChargeBillExpense = lazy(
  () => import('@/pages/Operacional/ChargeBillExpenses/CreateOrUpdateChargeBillExpense')
);

// ---- Privado: Operacional — Fechamento Semana (ClosingWeek, domínio
// PRÓPRIO — TASK-FE-FS-02/03/04, esteira 97-Esteiras/053). URL
// `/operacional/fechamento-semana`. Mirror `Operacional/Carregamento`.
// `TASK-FE-FS-02` declara a listagem; `TASK-FE-FS-03` acrescenta o Detalhe
// (`/:uuid`, read-only); `TASK-FE-FS-04` acrescenta `/novo` (busca + relatório
// server-driven + salvar) — registrada ANTES de `/:uuid` abaixo (contrato de
// especificidade). ----
const FechamentoSemanaList = lazy(() => import('@/pages/Operacional/FechamentoSemana'));
const CreateClosingWeek = lazy(
  () => import('@/pages/Operacional/FechamentoSemana/CreateClosingWeek')
);
const ShowClosingWeek = lazy(() => import('@/pages/Operacional/FechamentoSemana/ShowClosingWeek'));

// ---- Privado: Operacional — Vendas — Orçamentos (Budget, F-018,
// 97-Esteiras/054, TASK-BG-FE-02). URL `/operacional/orcamentos`. Item de
// menu (`ope-ven-orc`) e permissão de navegação (`budgets_view`) JÁ
// EXISTIAM (`navigationTree.ts:1656-1674`/`navigationPermissions.ts:622`)
// — nenhuma edição nesses 2 arquivos, só a rota real abaixo. `TASK-BG-FE-02`
// declara SÓ a listagem; `/novo`/`/:uuid`/`/:uuid/visualizar` nascem em
// `TASK-BG-FE-03/04/05` (ainda não implementadas — os links da listagem que
// apontam para elas caem no `RoutePlaceholder` até lá, mesmo padrão já
// aceito em `Planejamentos`/outros módulos fatiados por onda). ----
const BudgetsList = lazy(() => import('@/pages/Operacional/Budget'));
// ---- Privado: Operacional — Vendas — Orçamentos, form (Budget, F-018,
// TASK-BG-FE-03). MESMO componente para criar/editar (mirror `Invoices`). ----
const CreateOrUpdateBudget = lazy(() => import('@/pages/Operacional/Budget/CreateOrUpdateBudget'));
// ---- Privado: Operacional — Vendas — Orçamentos, visualização (Budget,
// F-018, TASK-BG-FE-05). Somente-leitura, mirror `InvoiceDetalhe`. ----
const BudgetDetalhe = lazy(() => import('@/pages/Operacional/Budget/BudgetDetalhe'));

// ---- Privado: Operacional — Vendas — Pedidos (Order, F-051,
// 97-Esteiras/043, PED-FE-02). URL `/operacional/pedidos`. Item de menu
// (`ope-ven-ped`) e permissão de navegação (`orders_view`) JÁ EXISTIAM
// (`navigationTree.ts:1901-1905`/`navigationPermissions.ts:752`) — nenhuma
// edição nesses 2 arquivos, só a rota real abaixo. PED-FE-02 declara a
// listagem; `/:uuid/detalhe` (visualização somente-leitura) nasce em
// PED-FE-06, mesmo padrão já aceito no bloco Orçamentos acima. ----
const OrdersList = lazy(() => import('@/pages/Operacional/Pedidos'));
// ---- Privado: Operacional — Vendas — Pedidos, form (Order, F-051,
// 97-Esteiras/043, PED-FE-03) — casca + cabeçalho + totais + submit
// atômico. MESMO componente para criar/editar (mirror `CreateOrUpdateBudget`).
const CreateOrUpdateOrder = lazy(() => import('@/pages/Operacional/Pedidos/CreateOrUpdateOrder'));
// ---- Privado: Operacional — Vendas — Pedidos, visualização (Order,
// F-051, 97-Esteiras/043, PED-FE-06, SURF-032, F-077..F-100).
// Somente-leitura, mirror `BudgetDetalhe`. ----
const OrderDetalhe = lazy(() => import('@/pages/Operacional/Pedidos/OrderDetalhe'));
// ---- Privado: Operacional — Vendas — Pedidos, "Gerar Venda" (Order→Sale,
// F-051, SALE-FE-COM-10, 97-Esteiras/063). Backend já em produção desde a
// execução 043 — esta rota liga a ação, antes hardcoded desabilitada em
// `OrderActionsMenu.tsx`/`OrderDetalhe.tsx`. Guarda `sales_create`. ----
const GerarVendaFromOrder = lazy(() => import('@/pages/Operacional/Pedidos/GerarVendaFromOrder'));

// ---- Privado: Operacional — Vendas — Vendas Comercial (Sale — venda de
// PRODUTOS, 97-Esteiras/043, SALE-FE-COM-02). URL `/operacional/vendas`.
// NÃO é Venda de Animais (`MovementSale`/`src/pages/Operacional/VendaAnimais`)
// — model alvo exclusivo `Sale`. Item de menu (`ope-ven-ven`) e permissão de
// navegação (`sales_view`) JÁ EXISTIAM (`navigationTree.ts:1906`/
// `navigationPermissions.ts:753`) — nenhuma edição nesses 2 arquivos, só as
// rotas reais abaixo (contrato-tela §4/§10). SALE-FE-COM-02 declara a
// listagem; `/novo`+`/:uuid/editar` nascem em `03`, `/:uuid/detalhe` em `05`. ----
const SalesList = lazy(() => import('@/pages/Operacional/Vendas'));
// ---- Privado: Operacional — Vendas — Vendas Comercial, form (Sale,
// 97-Esteiras/043, SALE-FE-COM-03) — casca + cabeçalho + totais + submit
// atômico. MESMO componente para criar/editar (mirror `CreateOrUpdateOrder`).
const CreateOrUpdateSale = lazy(() => import('@/pages/Operacional/Vendas/CreateOrUpdateSale'));
// ---- Privado: Operacional — Vendas — Vendas Comercial, visualização
// (Sale, 97-Esteiras/043, SALE-FE-COM-05, `S-SCREEN-005`). Somente-leitura,
// destino da ação Visualizar (`A004`, `SaleActionsMenu.tsx`), mirror
// `OrderDetalhe`. ----
const SaleDetalhe = lazy(() => import('@/pages/Operacional/Vendas/SaleDetalhe'));
// ---- Privado: Operacional — Vendas — Vendas Comercial, Adiantamento (Sale,
// 97-Esteiras/043, SALE-FE-COM-07/08, `S-SCREEN-006`/`S-FORM-003`). Cria
// `Income` polimórfico (`incomeable=Sale`) + rateio; NENHUMA baixa
// automática (SE012) — sucesso navega para `/financeiro/receber/:uuid`. ----
const SaleAdvanceIncome = lazy(() => import('@/pages/Operacional/Vendas/SaleAdvanceIncome'));

// ---- Privado: Operacional / Agricultura — Descontos/Classificação
// (DiscountTable, F-032, TASK-DT-FE-04): 3 rotas REAIS (listagem, criar,
// editar), mirror EXATO do bloco Fases de Alimentação
// (`Operacional/FeedingPhase`, esteira 051). Sem rota `show` dedicada
// (contrato de tela §2 nota SURF-SHOW — mesma tela em modo read-only). Item
// de menu `ope-agr-des` JÁ EXISTIA em `navigationTree.ts` (placeholder,
// path `/operacional/descontos`) — path corrigido para
// `/operacional/discount-tables` (fiel ao contrato de tela §2); permissão
// (`ope-agr-des` → `discount-tables_view`) em `navigationPermissions.ts` JÁ
// estava correta — nenhuma edição nela. ----
const DiscountTableList = lazy(() => import('@/pages/Operacional/DiscountTable'));
const CreateOrUpdateDiscountTable = lazy(
  () => import('@/pages/Operacional/DiscountTable/CreateOrUpdateDiscountTable')
);

// ---- Privado: Operacional — Lista de OS (ServiceOrder, domínio PRÓPRIO —
// TASK-FE-2001/2002/2003 (fatia READ) + TASK-FE-2004/2005 (fatia WRITE,
// D-FRONT-01/03/04 RESOLVIDAS, esteira 038). URL `/operacional/lista-os`,
// mirror `Operacional/Appropriations`/`Operacional/Romaneios`. Item de menu
// (`ope-os-lis`) e permissão (`service-orders_view`) JÁ EXISTIAM em
// `navigationTree.ts`/`navigationPermissions.ts` antes desta Tarefa —
// nenhuma edição neles. `CreateOrUpdateServiceOrder` é o destino REAL de
// `/novo` e `/:serviceOrderId` (substitui o placeholder
// `ServiceOrderFormPending`, removido nesta Tarefa). ----
const PlanejamentosList = lazy(() => import('@/pages/Operacional/Planejamentos'));
// TASK-FE-PLAN-02 — casca única de criação/edição (form raiz + árvore
// condicional, "Decisão de arquitetura de tela" do manifesto FID-G3F) —
// mesma página cobre `/novo` e `/:planningUuid`.
const CreateOrUpdatePlanning = lazy(
  () => import('@/pages/Operacional/Planejamentos/CreateOrUpdatePlanning')
);
const ServiceOrdersList = lazy(() => import('@/pages/Operacional/ServiceOrders'));
const CreateOrUpdateServiceOrder = lazy(
  () => import('@/pages/Operacional/ServiceOrders/CreateOrUpdateServiceOrder')
);
const ServiceOrderDetalhe = lazy(
  () => import('@/pages/Operacional/ServiceOrders/ServiceOrderDetalhe')
);

// ---- Privado: Operacional — Monitoramento (MonitoringServiceOrder, domínio
// PRÓPRIO — F-046, TASK-MO-FE-05). URL `/operacional/monitoramento`, tela
// ÚNICA de listagem/filtro (mode_matrix do contrato legado: criar/editar/
// excluir NAO_APLICAVEL) — mirror `Operacional/ServiceOrders` (irmã). Item de
// menu (`ope-os-mon`) e permissão de navegação (`monitoring-service-orders_view`)
// JÁ EXISTIAM em `navigationTree.ts`/`navigationPermissions.ts` — nenhuma
// edição neles, só a rota real abaixo. ----
const MonitoringList = lazy(() => import('@/pages/Operacional/Monitoring'));

// ---- Privado: Operacional / Agricultura — Rastreabilidade (Traceability +
// TraceabilityConfig, F-067, TASK-TR-FE-11, esteira 97-Esteiras/058). URL
// `/operacional/rastreabilidade/produtos` (Traceability) e
// `/operacional/rastreabilidade/configuracao` (TraceabilityConfig) — mirror
// `Operacional/Carregamento` (item-pai com 2 filhos). Item de menu
// (`ope-agr-ras`) reestruturado de item-folha STUB para item-pai com 2
// filhos (`ope-agr-ras-pro`/`ope-agr-ras-cfg`) em `navigationTree.ts`; gates
// novos por filho em `navigationPermissions.ts` (`traceab_view` `anyOf`
// create/edit/delete para Produtos, `tracconfig_view` único slug para
// Configuração — nenhuma permissão nova cunhada, DEC-006). Guarda de cada
// ROTA usa a permissão MÍNIMA real (não o `anyOf` do menu), mirror
// Carregamento/Fechamento Semana acima: listagem/galeria = `traceab_view`;
// create/edit = `traceab_create`/`traceab_edit`; listagem/form de
// Configuração = `tracconfig_view` (único slug cobre todos os verbos, `## 6.1`
// do contrato de destino). ----
const TraceabilityList = lazy(() => import('@/pages/Operacional/Rastreabilidade/Traceability'));
const CreateOrUpdateTraceability = lazy(
  () => import('@/pages/Operacional/Rastreabilidade/Traceability/CreateOrUpdateTraceability')
);
const TraceabilityGalery = lazy(
  () => import('@/pages/Operacional/Rastreabilidade/Traceability/Galery')
);
const TraceabilityConfigList = lazy(
  () => import('@/pages/Operacional/Rastreabilidade/TraceabilityConfig')
);
const CreateOrUpdateTraceabilityConfig = lazy(
  () =>
    import('@/pages/Operacional/Rastreabilidade/TraceabilityConfig/CreateOrUpdateTraceabilityConfig')
);

// ---- Privado: Operacional — Avaliações de Ordem de Serviço
// (RatingServiceOrder, domínio PRÓPRIO — TASK-FE-041-AVL-01/02/03, esteira
// 041). URL `/operacional/avaliacoes`, mirror `Operacional/ServiceOrders`.
// Item de menu (`ope-os-ava`) e permissão de navegação
// (`rating-service-orders_view`) JÁ EXISTIAM em `navigationTree.ts`/
// `navigationPermissions.ts` antes desta esteira — nenhuma edição neles.
// A ação "Visualizar" da listagem reaproveita a rota JÁ EXISTENTE
// `/operacional/lista-os/:serviceOrderId/detalhe` (`ServiceOrderDetalhe`
// acima) — nenhuma tela nova para essa ação. ----
const RatingServiceOrdersList = lazy(() => import('@/pages/Operacional/RatingServiceOrders'));
const RatingServiceOrderForm = lazy(
  () => import('@/pages/Operacional/RatingServiceOrders/RatingServiceOrderForm')
);

// ---- Privado: Operacional — Minhas OS (MyServiceOrder, domínio PRÓPRIO —
// esteira 063, TASK-MOS-FE-04/05/08). URL `/operacional/minhas-os`, mirror
// `Operacional/RatingServiceOrders` (listagem restrita ao executor logado +
// rota dedicada de execução, nunca modal). Item de menu (`ope-os-min`) e as
// 4 permissões (`my-service-orders_{create,delete,edit,view}`) JÁ EXISTIAM
// em `navigationTree.ts`/`navigationPermissions.ts`/`permissionsCatalog.json`
// antes desta Tarefa — nenhuma edição neles. A ação "Visualizar" da listagem
// reaproveita a rota JÁ EXISTENTE `/operacional/lista-os/:serviceOrderId/
// detalhe` (`ServiceOrderDetalhe` acima) — nenhuma tela nova para essa ação. ----
const MyServiceOrdersList = lazy(() => import('@/pages/Operacional/MyServiceOrders'));
const MyServiceOrderExecutionForm = lazy(
  () => import('@/pages/Operacional/MyServiceOrders/MyServiceOrderExecutionForm')
);

// ---- Privado: Operacional — Transferência ABC de Animais entre Lotes
// (TransferAbcBatch, domínio PRÓPRIO — 97-Esteiras/039, TASK-FE-039-ABC-02/
// 03). URL `/operacional/transferencias`. Item de menu (`ope-pec-tra`,
// "Transferências") e permissão de navegação (`anyOf` já inclui
// `transfer_abc_batch_{view,create,delete}`) JÁ EXISTIAM
// (`navigationTree.ts:1312`/`navigationPermissions.ts:288`) — esta Tarefa só
// conecta as rotas reais (hoje caem no `RoutePlaceholder` de
// `/operacional/*`). Gate de rota pelas permissões REAIS emitidas pelo
// backend (`transfer_abc_batch_{view,create,delete}`,
// `TransferAbcBatchController::middleware()`), não pelo `anyOf` (mais amplo,
// cobre outras features legadas de transferência no mesmo item de menu). Sem
// rota de edição (D3, parity — a API nunca teve `update()`). ----
const TransferAbcBatchList = lazy(() => import('@/pages/Operacional/TransferAbcBatch'));
const TransferAbcBatchDetalhe = lazy(
  () => import('@/pages/Operacional/TransferAbcBatch/TransferAbcBatchDetalhe')
);
const CreateTransferAbcBatch = lazy(
  () => import('@/pages/Operacional/TransferAbcBatch/CreateTransferAbcBatch')
);

// ---- Privado: Operacional — Transferência de Lote entre Fazendas
// (TransferBatchFarm, domínio PRÓPRIO — 97-Esteiras/041,
// TASK-FE-041-LF-01..04). URL `/operacional/lote-fazenda/transferencias`.
// ⚠️ NÃO confundir com `TransferAbcBatch`/`BatchTransfers` acima (domínios
// DIFERENTES — ver `plano-front-lote-fazenda.md §1.1). Item de menu
// (`ope-pec-tra-lf`, filho de "Transferências") e permissão de navegação
// NOVOS (`navigationTree.ts`/`navigationPermissions.ts`, TASK-FE-041-LF-01).
// Sem rota de edição/detalhe (R-02/`edit` `NAO_APLICAVEL`, FID-G1 do
// doc-bruta — a API nunca teve `update()`).
const TransferBatchFarmList = lazy(
  () => import('@/pages/Operacional/LoteFazenda/TransferBatchFarms')
);
const CreateOrUpdateTransferBatchFarm = lazy(
  () => import('@/pages/Operacional/LoteFazenda/TransferBatchFarms/CreateOrUpdateTransferBatchFarm')
);
const TransferBatchFarmFinancial = lazy(
  () => import('@/pages/Operacional/LoteFazenda/TransferBatchFarms/TransferBatchFarmFinancial')
);

// ---- Privado: Operacional — Lote/Módulo/Área (BatchModuleAreaTransfer,
// domínio PRÓPRIO — 97-Esteiras/070, TASK-LMA-FE-01..04). URLs
// `/operacional/lote-modulo-area/transferencias` (listagem) e
// `/operacional/lote-modulo-area/transferencias/:batchUuid` (formulário de
// transferência). ⚠️ NÃO confundir com a rota já migrada
// `/cadastros-base/lote-modulo` (feature-irmã "Lote/Módulo", cadastro base)
// nem com `TransferBatchFarm` acima (transfere lote ENTRE FAZENDAS — esta
// transfere Módulo/Área/Curral DENTRO da mesma fazenda). Item de menu
// (`ope-pec-tra-lma`, filho de "Transferências") e permissões
// (`navigationTree.ts`/`navigationPermissions.ts`, TASK-LMA-FE-02).
const BatchModuleAreaTransfersList = lazy(
  () => import('@/pages/Operacional/LoteModuloArea/BatchModuleAreaTransfers')
);
const TransferBatchModuleArea = lazy(
  () =>
    import('@/pages/Operacional/LoteModuloArea/BatchModuleAreaTransfers/TransferBatchModuleArea')
);

// ---- Privado: Operacional — Agrupar/Lotes (GrouperBatch, domínio PRÓPRIO —
// execução 042, TASK-FE-042-306). URL `/operacional/agrupar-lotes`. Item de
// menu (`ope-pec-tra-ag`, filho de "Transferências") e permissão de
// navegação NOVOS (`navigationTree.ts`/`navigationPermissions.ts`,
// TASK-FE-042-306). Sem rota de criação/detalhe — os 2 modais da feature
// (Agrupar/Novo Lote) são Dialog inline, sem rota própria.
const GrouperBatchesList = lazy(() => import('@/pages/Operacional/GrouperBatches'));

// ---- Privado: Operacional — Transferência de Animal entre Fazendas
// (TransferAnimalFarm, domínio PRÓPRIO — 97-Esteiras/042, TASK-FE-042-102).
// URL `/operacional/animal-fazenda/transferencias`. Mirror ESTRUTURAL do
// bloco `TransferBatchFarm` acima (transferência entre fazendas + financeiro
// + recebimento→Processing), acrescido de 1 rota a mais (`:uuid`, Visualizar
// — a irmã Lote/Fazenda não tem `show`, esta feature tem desde o legado).
// ⚠️ NÃO confundir com `TransferBatchFarm` acima (transfere LOTES) nem com
// `TransferAbcBatch`/`BatchTransfers` (domínios intra-fazenda DIFERENTES).
// Item de menu (`ope-pec-tra-af`, filho de "Transferências") e permissões
// `transfer_animal_farms_{view,create,delete}` NOVAS
// (`navigationTree.ts`/`navigationPermissions.ts`, TASK-FE-042-102).
const TransferAnimalFarmList = lazy(
  () => import('@/pages/Operacional/AnimalFazenda/TransferAnimalFarm')
);
const CreateOrUpdateTransferAnimalFarm = lazy(
  () =>
    import('@/pages/Operacional/AnimalFazenda/TransferAnimalFarm/CreateOrUpdateTransferAnimalFarm')
);
const ShowTransferAnimalFarm = lazy(
  () => import('@/pages/Operacional/AnimalFazenda/TransferAnimalFarm/ShowTransferAnimalFarm')
);
const TransferAnimalFarmFinancial = lazy(
  () => import('@/pages/Operacional/AnimalFazenda/TransferAnimalFarm/TransferAnimalFarmFinancial')
);

// ---- Privado: Operacional — Venda de Animais (MovementSale, domínio PRÓPRIO
// — TASK-VD-FE-01/02, esteira 97-Esteiras/004). URL `/operacional/venda-animais`,
// item de menu NOVO `ope-pec-ven` + permissão NOVA `mov_sale_view`
// (`navigationTree.ts`/`navigationPermissions.ts`, TASK-VD-FE-01).
//
// TASK-VD-FE-02 (formulário) acrescenta `/novo` e `/:saleUuid/editar` (mesmo
// componente, `CreateOrUpdateMovementSale`). `/:saleUuid/finalizar` e
// `/finalizar-lote` (frontend-contract-vendas.md §2.3) ficam para a
// Tarefa 16 (fluxos de finalização) — até lá, navegar para essas URLs cai no
// catch-all `/operacional/*` abaixo. ----
const VendaAnimaisList = lazy(() => import('@/pages/Operacional/VendaAnimais'));
const MovementSaleDetalhe = lazy(
  () => import('@/pages/Operacional/VendaAnimais/MovementSaleDetalhe')
);
const CreateOrUpdateMovementSale = lazy(
  () => import('@/pages/Operacional/VendaAnimais/CreateOrUpdateMovementSale')
);
// TASK-VD-FE-03 (contrato §2.3/§8) — fluxos de finalização (individual e em
// lote), gate de rota `mov_sale_edit` (transição de ESCRITA, nunca
// `_view`).
const FinishMovementSale = lazy(
  () => import('@/pages/Operacional/VendaAnimais/FinishMovementSale')
);
const FinishMovementSaleMany = lazy(
  () => import('@/pages/Operacional/VendaAnimais/FinishMovementSaleMany')
);

// ---- Privado: Operacional — Compra de Animais (MovementPurchase, domínio
// PRÓPRIO — TASK-CP-04/05/06/07/08/09, esteira 97-Esteiras/047). URL
// `/operacional/compra-animais`, item de menu NOVO `ope-pec-com` +
// permissão REUSADA `mov_purchase_view` (`navigationTree.ts`/
// `navigationPermissions.ts`, TASK-CP-04, DEC-006).
//
// TASK-CP-04/05 registraram a listagem. TASK-CP-06/07 acrescentaram
// `CreateOrUpdateMovementPurchase.tsx` (`/novo`/`/:uuid/editar`, mesmo
// componente, cabeçalho+itens+financeiro). TASK-CP-09 (esta Tarefa)
// acrescenta `MovementPurchaseDetalhe.tsx` (`/:uuid`, readonly).
const CompraAnimaisList = lazy(() => import('@/pages/Operacional/CompraAnimais'));
const CreateOrUpdateMovementPurchase = lazy(
  () => import('@/pages/Operacional/CompraAnimais/CreateOrUpdateMovementPurchase')
);
const MovementPurchaseDetalhe = lazy(
  () => import('@/pages/Operacional/CompraAnimais/MovementPurchaseDetalhe')
);

// ---- Privado: Operacional — Nascimentos (BirthAnimal, domínio PRÓPRIO —
// TASK-NASC-FE-01/02, esteira 97-Esteiras/004). URL `/operacional/nascimentos`,
// item de menu NOVO `ope-pec-nas` + permissão NOVA `birth_animals_view`
// (`navigationTree.ts`/`navigationPermissions.ts`, mesma Tarefa,
// GAP-NASCIMENTOS-FE-02).
//
// TASK-NASC-FE-02 (formulário) acrescenta `/novo` e `/:birthAnimalUuid/editar`
// (frontend-contract-nascimentos.md §2.3) — `/novo` declarada ANTES de
// `/:birthAnimalUuid` (mesma armadilha "novo" vs UUID já documentada em
// `Equipes`/Faltas/Vendas). ----
const BirthAnimalsList = lazy(() => import('@/pages/Operacional/Nascimentos'));
const BirthAnimalDetalhe = lazy(() => import('@/pages/Operacional/Nascimentos/BirthAnimalDetalhe'));
const CreateOrUpdateBirthAnimal = lazy(
  () => import('@/pages/Operacional/Nascimentos/CreateOrUpdateBirthAnimal')
);

// ---- Privado: Operacional — Perdas (LossAnimal, domínio PRÓPRIO — F-043,
// execução 040, TASK-FE-2772). URL `/operacional/perdas`, item de menu NOVO
// `ope-pec-per` + permissão NOVA `loss_animals_view`
// (`navigationTree.ts`/`navigationPermissions.ts`, mesma Tarefa). CRUD de
// lista farm-scoped, single-table, sem subcadastro (contrato de tela §7.5.4)
// — as 3 rotas usam o MESMO gate `loss_animals_view`; a granularidade
// create/edit é checada DENTRO da página via `usePermissions().can(...)`
// (achado confirmado, NÃO usar `ProtectedModuleRoute`). `/nova` declarada
// ANTES de `/:lossAnimalUuid` (mesma armadilha "novo" vs UUID já documentada
// em `Nascimentos`/`Equipes`/Faltas/Vendas). ----
const LossAnimalList = lazy(() => import('@/pages/Operacional/Perdas'));
const CreateOrUpdateLossAnimal = lazy(
  () => import('@/pages/Operacional/Perdas/CreateOrUpdateLossAnimal')
);
const LossAnimalDetalhe = lazy(() => import('@/pages/Operacional/Perdas/LossAnimalDetalhe'));

// ---- Privado: Operacional — Mortes (DeathAnimal, domínio PRÓPRIO —
// TASK-DA-FE-01/02, esteira 97-Esteiras/049). URL `/operacional/mortes`,
// item de menu NOVO `ope-pec-mor` + permissão NOVA `death_animals_view`
// (`navigationTree.ts`/`navigationPermissions.ts`, mesma Tarefa). `/novo`
// declarada ANTES de `/:deathAnimalUuid` (mesma armadilha "novo" vs UUID já
// documentada em `CentroCusto`/`FeedlotYard`/Nascimentos) — rota de Detalhe
// PRÓPRIA (`/:deathAnimalUuid/detalhe`), diferente de Nascimentos.
const DeathAnimalsList = lazy(() => import('@/pages/Operacional/DeathAnimals'));
const DetalheDeathAnimal = lazy(
  () => import('@/pages/Operacional/DeathAnimals/DetalheDeathAnimal')
);
const CreateOrUpdateDeathAnimal = lazy(
  () => import('@/pages/Operacional/DeathAnimals/CreateOrUpdateDeathAnimal')
);

// ---- Operacional — Pluviometria (Rainfall, execução 041, TASK-FE-041-PLV-01..05).
// Item de menu (`ope-plu`) e permissão (`rainfall_view`) JÁ existentes em
// `navigationTree.ts`/`navigationPermissions.ts` — só faltava a rota. `/novo`
// declarada ANTES de `/:rainfallUuid` (mesma armadilha "novo" vs UUID de
// `CentroCusto`/`FeedlotYard`/`DeathAnimals`). Gate de rota `rainfall_view` —
// ações de criar/editar/excluir/importar são gateadas por
// `rainfall_create/edit/delete` DENTRO do componente.
const RainfallList = lazy(() => import('@/pages/Operacional/Rainfalls'));
const RainfallDetalhe = lazy(() => import('@/pages/Operacional/Rainfalls/RainfallDetalhe'));
const CreateOrUpdateRainfall = lazy(
  () => import('@/pages/Operacional/Rainfalls/CreateOrUpdateRainfall')
);

// ---- Privado: Operacional — Processamentos (Processing, domínio PRÓPRIO —
// 97-Esteiras/039, TASK-FE-039-PROC-02/03). URL `/operacional/processamentos`.
// Listagem + Detalhe (PROC-02) gate `processing_view`; `/finalizar` (PROC-03)
// gate `processing_create` (transição de ESCRITA, mirror
// `/operacional/venda-animais/:saleUuid/finalizar`). SEM `/novo`/`/editar` —
// a API só expõe `index`/`show`/`finish` (front-plan-proc.md §1.1); os
// processamentos nascem automaticamente das origens do rebanho. `/finalizar`
// declarado APÓS `/:uuid` propositalmente: são segmentos ANINHADOS
// (`/:uuid/finalizar`), não colidem com a armadilha "novo" vs UUID de
// `VendaAnimais`/`Equipes`/Faltas (que é entre um segmento ESTÁTICO e um
// dinâmico no MESMO nível).
const ProcessingList = lazy(() => import('@/pages/Operacional/Processamentos'));
const ProcessingDetalhe = lazy(
  () => import('@/pages/Operacional/Processamentos/ProcessingDetalhe')
);
const FinishProcessing = lazy(() => import('@/pages/Operacional/Processamentos/FinishProcessing'));

// ---- Privado: Operacional — Desmama (Weaning, domínio PRÓPRIO —
// TASK-WN-FE-01..06, esteira 97-Esteiras/043). URL `/operacional/desmame`,
// item de menu NOVO `ope-pec-man-des` (filho de `ope-pec-man`, Manejo) +
// permissão `weaning_view` (já cobre no `anyOf` do pai; só falta o item
// filho). Sem tela de visualização dedicada (mirror `02-arquitetura-
// frontend-desmama.md §2` — abrir em modo editar É a visualização); `/novo`
// declarada ANTES de `/:uuid` (mesma armadilha "novo" vs UUID já
// documentada em Nascimentos/Equipes/Faltas/Vendas). ----
const WeaningsList = lazy(() => import('@/pages/Operacional/Weaning'));
const CreateOrUpdateWeaning = lazy(
  () => import('@/pages/Operacional/Weaning/CreateOrUpdateWeaning')
);

// ---- Privado: Operacional — Localizar Animal (Find Animal, domínio
// PRÓPRIO — TASK-FA-FE-06, contrato-tela-lane-a-find-animal-frontend.md
// §6.1/§9). URL `/operacional/localizar-animal`, item de menu NOVO
// `ope-pec-man-loc` (filho de `ope-pec-man`, Manejo, ao lado de
// `ope-pec-man-pas`/`ope-pec-man-des`) + permissão `find-animal_view` (já
// cobre no `anyOf` do pai; só falta o item filho). Mirror EXATO do bloco
// Desmama acima: uma ÚNICA rota — os 5 endpoints de CRUD são
// `EXCLUDED_BY_OWNER` (sem `/novo`, `/:uuid`, `/editar`). Gate de rota é
// `find-animal_view`; `find-animal_edit` é checado DENTRO do componente
// (TASK-FA-FE-05, `BatchTransferForm.tsx`), mirror Apartação/`separation_create`. ----
const FindAnimalPage = lazy(() => import('@/pages/Operacional/FindAnimal'));

// ---- Privado: Operacional — Marcação (Marking, domínio PRÓPRIO —
// TASK-MC-FE-01..09, esteira 97-Esteiras/044). URL `/operacional/marcacao`,
// item de menu NOVO `ope-pec-man-mar` (filho de `ope-pec-man`, Manejo) +
// permissão `markings_view` (CRIADA nesta Tarefa no `anyOf` do pai — a
// premissa do task-packet original de que o menu já existia era FALSA, ver
// `ARCHITECTURE-MARCACAO-FE.md §"O que muda"`). Rotas literais
// (`create`/`previsao-lote`/`realizacao-lote`) declaradas ANTES de `:uuid`
// (mesma armadilha "novo" vs UUID de Nascimentos/Equipes/Faltas/Vendas/
// Desmama). ----
const MarkingsList = lazy(() => import('@/pages/Operacional/Marcacao'));
const CreateOrUpdateMarking = lazy(
  () => import('@/pages/Operacional/Marcacao/CreateOrUpdateMarking')
);
const PrevisaoMarking = lazy(() => import('@/pages/Operacional/Marcacao/PrevisaoMarking'));
const RealizadoMarking = lazy(() => import('@/pages/Operacional/Marcacao/RealizadoMarking'));
const PrevisaoLoteMarking = lazy(() => import('@/pages/Operacional/Marcacao/PrevisaoLoteMarking'));
const RealizacaoLoteMarking = lazy(
  () => import('@/pages/Operacional/Marcacao/RealizacaoLoteMarking')
);

// ---- Privado: Operacional — Apartação (Separation, domínio PRÓPRIO —
// 97-Esteiras/005 Tarefa 24, frontend-contract-apartacao.md §2.3). URL
// `/operacional/apartacao`, item de menu NOVO `ope-pec-apa` + permissão
// EXISTENTE `separation_view` (`navigationTree.ts`/`navigationPermissions.ts`,
// mesma Tarefa, `GAP-APARTACAO-FE-01`).
//
// Só listagem + Detalhe nesta Tarefa (fundação) — a Tarefa 25 (formulário)
// acrescenta `/novo` e `/:separationUuid/editar` (mesmo componente
// `CreateOrUpdateSeparation`, ainda não criado). Mesma armadilha "novo" vs
// UUID já documentada em `Nascimentos`/`Equipes`/Faltas/Vendas — a Tarefa 25
// declara `/novo` ANTES de `/:separationUuid` quando registrar. ----
const SeparationsList = lazy(() => import('@/pages/Operacional/Separations'));
const SeparationDetalhe = lazy(() => import('@/pages/Operacional/Separations/SeparationDetalhe'));
const CreateOrUpdateSeparation = lazy(
  () => import('@/pages/Operacional/Separations/CreateOrUpdateSeparation')
);

const ArmazemList = lazy(() => import('@/pages/BaseRegistrations/Warehouses'));
const CreateOrUpdateArmazem = lazy(
  () => import('@/pages/BaseRegistrations/Warehouses/CreateOrUpdateWarehouses')
);

// ---- Privado: Cadastros Base — Atualizações do Sistema (SystemUpdate,
// execução 031, TASK-FE-1104) — dado mestre GLOBAL, mesma vizinhança de
// Bancos/Armazéns (contrato-front-atualizacoes-sistema.md §1.2/§8). ----
const SystemUpdatesList = lazy(() => import('@/pages/BaseRegistrations/SystemUpdates'));
const CreateOrUpdateSystemUpdate = lazy(
  () => import('@/pages/BaseRegistrations/SystemUpdates/CreateOrUpdateSystemUpdate')
);
const SystemUpdateDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/SystemUpdates/SystemUpdateDetalhe')
);

// ---- Privado: Cadastros Base — Permissões (Permission, execução 032,
// TASK-FE-2404) — catálogo técnico GLOBAL do sistema (contrato de tela
// §1.2/§8), mesma vizinhança de Atualizações do Sistema/Bancos/Armazéns. ----
const PermissionsList = lazy(() => import('@/pages/BaseRegistrations/Permissions'));
const CreateOrUpdatePermission = lazy(
  () => import('@/pages/BaseRegistrations/Permissions/CreateOrUpdatePermission')
);
const PermissionDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/Permissions/PermissionDetalhe')
);

// ---- Privado: Cadastros Base — IBPT (Ibpt, execução 032, TASK-FE-2414) —
// catálogo fiscal GLOBAL (contrato de tela §1.2/§8), mesma vizinhança de
// Permissões/Atualizações do Sistema/Bancos/Armazéns. Só 3 rotas — SEM rota
// de edição (contrato de API §10, sem update). ----
const IbptsList = lazy(() => import('@/pages/BaseRegistrations/Ibpts'));
const ImportIbptTable = lazy(() => import('@/pages/BaseRegistrations/Ibpts/ImportIbptTable'));
const IbptDetalhe = lazy(() => import('@/pages/BaseRegistrations/Ibpts/IbptDetalhe'));

// ---- Privado: Cadastros Base — Termos e Condições (PlatformDocument,
// execução 032, TASK-FE-2502) — catálogo GLOBAL (contrato de tela §1.2/§8),
// mesma vizinhança de Permissões/IBPT/Atualizações do Sistema. Tela ÚNICA
// (TASK-FE-2500/2501/2502) — 2 uploads independentes, SEM /novo/:uuid. ----
const PlatformDocuments = lazy(() => import('@/pages/BaseRegistrations/PlatformDocuments'));

// ---- Privado: Cadastros Base — Espécies ----
// Listagem real (TASK-ESP-01) + formulário create/edit (TASK-ESP-02).
const EspeciesList = lazy(() => import('@/pages/CadastrosBase/Especies'));
const CreateOrUpdateEspecie = lazy(
  () => import('@/pages/CadastrosBase/Especies/CreateOrUpdateEspecie')
);

// ---- Privado: Cadastros Base — Categorias Animais (CategoryAnimal) ----
// Listagem real (TASK-FE-541) + formulário create/edit (TASK-FE-542/543).
const CategoriasAnimaisList = lazy(() => import('@/pages/CadastrosBase/CategoriasAnimais'));
const CreateOrUpdateCategoriaAnimal = lazy(
  () => import('@/pages/CadastrosBase/CategoriasAnimais/CreateOrUpdateCategoriaAnimal')
);

// ---- Privado: Cadastros Base — Pecuários — Rebanho (Animal, execução 027)
// ----
// Listagem real (TASK-FE-881) + formulário create/edit real (TASK-FE-882/
// 883/884/885). Item de menu "Rebanho" (cad-pec-reb) JÁ EXISTE
// (navigationTree.ts/navigationPermissions.ts/languageSidebar.ts) — esta
// Tarefa (TASK-FE-887) só liga a rota real, nenhuma edição de menu.
const RebanhoList = lazy(() => import('@/pages/CadastrosBase/Rebanho'));
const CreateOrUpdateAnimal = lazy(
  () => import('@/pages/CadastrosBase/Rebanho/CreateOrUpdateAnimal')
);

// ---- Privado: Cadastros Base — Embalagens (Package) ----
// Listagem real (TASK-FE-521) + formulário create/edit (TASK-FE-522).
const EmbalagensList = lazy(() => import('@/pages/CadastrosBase/Embalagens'));
const CreateOrUpdateEmbalagem = lazy(
  () => import('@/pages/CadastrosBase/Embalagens/CreateOrUpdateEmbalagem')
);

// ---- Privado: Cadastros Base — Contas Bancárias (Account, domínio
// Financeiro, execução 025) ----
// Listagem real (TASK-FE-564) + formulário create/edit (TASK-FE-565/566).
const ContasBancariasList = lazy(() => import('@/pages/CadastrosBase/ContasBancarias'));
const CreateOrUpdateContaBancaria = lazy(
  () => import('@/pages/CadastrosBase/ContasBancarias/CreateOrUpdateContaBancaria')
);

// ---- Privado: Cadastros Base — Saldo Inicial (OpenMovement, domínio
// Financeiro, execução 031, TASK-FE-031-38) ----
// Listagem (TASK-FE-031-36) + formulário de criação (TASK-FE-031-37) +
// detalhe view-only (TASK-FE-031-38). SEM Edição (contrato §2 — Movement
// nunca teve `edit`/`update`).
const SaldoInicialList = lazy(() => import('@/pages/CadastrosBase/SaldoInicial'));
const CreateSaldoInicial = lazy(
  () => import('@/pages/CadastrosBase/SaldoInicial/CreateSaldoInicial')
);
const SaldoInicialDetalhe = lazy(
  () => import('@/pages/CadastrosBase/SaldoInicial/SaldoInicialDetalhe')
);

// ---- Privado: Financeiro — Mercado Pago (FinancialMercadoPago, domínio
// SaaS-admin, execução 031, TASK-FE-031-46) ----
// Listagem read-only (TASK-FE-031-45), placeholder — backend sempre retorna
// `data: []` até o billing ser migrado (contrato de API §0). SEM
// create/edit/delete nesta fase (contrato de tela §5). Primeira rota real do
// grupo de menu "Financeiro" — hoje todo o grupo cai no catch-all
// `/financeiro/*` (`RoutePlaceholder`, abaixo).
const FinancialMercadoPagoList = lazy(() => import('@/pages/Financeiro/MercadoPago'));

// ---- Privado: Operacional / Agricultura — Contratos de Venda
// (SaleContract, esteira 036, TASK-FE-036-207) ----
// Listagem + filtro (TASK-FE-036-205) + formulário único create/edit/view
// (TASK-FE-036-206). Primeira rota real do grupo de menu "Operacional" —
// hoje todo o grupo cai no catch-all `/operacional/*` (`RoutePlaceholder`,
// abaixo). Menu/rota/permissão já reservados (`navigationTree.ts` →
// `ope-agr-con`, `navigationPermissions.ts` → `sale-contracts_view`).
const ContratosVendaList = lazy(() => import('@/pages/Operacional/ContratosVenda'));
const CreateOrUpdateContratoVenda = lazy(
  () => import('@/pages/Operacional/ContratosVenda/CreateOrUpdateContratoVenda')
);

// ---- Privado: Financeiro — Contas a Pagar (Expense, esteira 036,
// TASK-FE-036-102/104/110) ----
// Rota real do grupo de menu "Financeiro" (`navigationTree.ts`, item
// `fin-pag` → `/financeiro/pagar`, permissão `expenses_view`) — o contrato
// de tela (§3) sugeriu `/financeiro/contas-a-pagar`, mas o item de menu JÁ
// EXISTENTE aponta para `/financeiro/pagar` (mesmo padrão de `fin-rec` →
// `/financeiro/receber`). Fidelidade ao código REAL já em produção >
// contrato aspiracional — ver nota de divergência no relatório de entrega
// desta Tarefa. Visualização reaproveita o MESMO componente de criação/
// edição (`canSave` deriva de `expenses_edit`/`expenses_create` — usuário só
// com `expenses_view` já enxerga tudo readonly, mirror `ServiceExpenses`,
// SEM tela Blade-like separada).
const ExpensesList = lazy(() => import('@/pages/Financeiro/ContasAPagar'));
const CreateOrUpdateExpense = lazy(
  () => import('@/pages/Financeiro/ContasAPagar/CreateOrUpdateExpense')
);

// ---- Privado: Financeiro — Contas a Receber (Income, execução 036,
// TASK-FE-036-319) ----
// CRUD completo — listagem (grid + filtro + seleção múltipla + toggle fiscal,
// TASK-FE-036-311/318), form create/update (TASK-FE-036-313/314/315/316) e
// detalhe somente-leitura (TASK-FE-036-317). Path `/financeiro/receber`
// resolvido de `navigationTree.ts`/`navigationPermissions.ts` (`fin-rec`,
// já pré-semeado com `incomes_view` — nenhuma alteração necessária nesses 2
// arquivos nem em `permissionsCatalog.json`, `incomes_*` já catalogado).
const IncomesList = lazy(() => import('@/pages/Incomes'));
const CreateOrUpdateIncome = lazy(() => import('@/pages/Incomes/CreateOrUpdateIncome'));
const IncomeDetalhe = lazy(() => import('@/pages/Incomes/IncomeDetalhe'));

// ---- Privado: Financeiro — Mov. Caixa/Bancário (Movement, TASK-MV-FE-04) ----
// Listagem real (grid + filtros). Item de menu (`fin-cai`) e permissão de
// navegação (`movements_view`) JÁ EXISTEM (navigationTree.ts:678,
// navigationPermissions.ts:255) — nenhuma alteração nesses 2 arquivos nesta
// Tarefa. Form create/edit (`/novo`, `/:uuid`) e edit-rateio dedicado
// (`/:uuid/rateio`) são de TASK-MV-FE-05/06 — NÃO registrados aqui.
const MovimentoList = lazy(() => import('@/pages/Financeiro/MovCaixaBancario'));
// Form create/edit (22 campos, TASK-MV-FE-05) — MESMO componente para
// `/novo` e `/:uuid` (campo interno `isValidGuid(uuid)` decide o modo).
// Edit-rateio dedicado (`/:uuid/rateio`) permanece TASK-MV-FE-06 — NÃO
// registrado aqui.
const CreateOrUpdateMovimento = lazy(
  () => import('@/pages/Financeiro/MovCaixaBancario/CreateOrUpdateMovimento')
);
// Form dedicado de edit-rateio (TASK-MV-FE-06) — reedita SÓ `allocations[]`
// via `PATCH /movements/{uuid}/allocation` (não recria o cabeçalho).
const EditRateioMovimento = lazy(
  () => import('@/pages/Financeiro/MovCaixaBancario/EditRateioMovimento')
);
// ---- Privado: Financeiro — Importação OFX (OfxImport, F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-01) ----
// Item de menu (`fin-cnc-ofx`) e permissão de navegação (`import_ofx_view`)
// JÁ EXISTEM (navigationTree.ts:2129, navigationPermissions.ts:834) —
// nenhuma alteração nesses 2 arquivos nesta Tarefa. Form único create/edit/
// visualizar (Decisão F1) — MESMO componente para `/novo` e `/:uuid`.
const OfxImportList = lazy(() => import('@/pages/Financeiro/OfxImport'));
const CreateOrUpdateOfxImport = lazy(
  () => import('@/pages/Financeiro/OfxImport/CreateOrUpdateOfxImport')
);
// Aba/rota de Conciliação (TASK-064-OFX-FE-02) — `/:uuid/conciliacao`,
// destino real da ação "Conciliar" de SURF-013 (já navegava para cá desde a
// FE-01, catch-all `/financeiro/*` até esta Tarefa registrar a rota real).
const OfxReconciliationTab = lazy(
  () => import('@/pages/Financeiro/OfxImport/Reconciliation/OfxReconciliationTab')
);

// ---- Privado: Financeiro — Importação Mov. Bancários (MovementSheet,
// F-112, 97-Esteiras/064, TASK-064-MOV-FE-01) ----
// Item de menu (`fin-imp`) e permissão de navegação (`movement-sheets_view`)
// JÁ EXISTEM (navigationTree.ts:2118, navigationPermissions.ts:832) —
// nenhuma alteração nesses 2 arquivos. Sem rota de formulário/`novo` — não
// existe cadastro/edição unitária (mode_matrix não tem modo `criar`/`editar`
// de campo a campo, o único ponto de criação é a importação de planilha,
// TASK-064-MOV-FE-02). Rota de detalhe (`:uuid`, TASK-064-MOV-FE-03)
// registrada logo abaixo, mesmo racional já usado por
// `/financeiro/ofx/:uuid/conciliacao`.
const ImportacaoMovBancariosList = lazy(() => import('@/pages/Financeiro/ImportacaoMovBancarios'));
const ImportacaoMovBancariosDetalhe = lazy(
  () => import('@/pages/Financeiro/ImportacaoMovBancarios/ImportacaoMovBancariosDetalhe')
);

// ---- Privado: Relatórios — Financeiro — Conciliação de Contas
// (RelatorioConsolidado, F-213, lote 079, rework FE — 3 ajustes do dono,
// F-213-plano-frontend-rework.md) ----
// Consome `AccountReconciliationReportController` (farm-scoped, PDF/Excel
// via `/generated`+`report_type`, prévia JSON via `report()`) — permissão
// real do controller é `account-reconciliation_report`
// (navigationPermissions.ts, grupo `rel-fin`). AGORA COM item de menu
// (`rel-fin-conciliacao-contas`, navigationTree.ts) — sobrepõe DEC-177
// ("sem item de menu", decisão original de SURF-033/034); rota da tela
// ALINHADA para o bloco de rotas `rel-fin` (ver `<Route>` correspondente,
// declarada antes do catch-all `/relatorios/*`, não mais em
// `/financeiro/*`). Pasta do componente MANTIDA (decisão de menor risco —
// ver header de `RelatorioConsolidado/index.tsx`).
const RelatorioConsolidadoConciliacao = lazy(
  () => import('@/pages/Financeiro/Conciliacao/RelatorioConsolidado')
);

// "Meses Conciliados" (TASK-065-OFX-FE-03, RECONSTRUÍDA) — a tela DELES
// (`Conciliacao/MesesConciliados`) consumia `GET /ofx-report`, endpoint
// REMOVIDO pelo backend reconciliado (routes/api.php, mesmo merge).
// Substituída por `OfxImport/Report/` (NOSSO módulo), consumindo o
// agregado sobrevivente `GET /ofx-imports/report` — escopo reduzido, SEM
// form de filtro/export (o endpoint não os oferece). Rota mantém o path
// `/financeiro/meses-conciliados` (item de menu `fin-cnc-mes` já existente,
// não conflitado pelo merge).
const OfxImportsReport = lazy(() => import('@/pages/Financeiro/OfxImport/Report'));
// NOTA (TASK-065-OFX-FE-01): as telas "Importação OFX" e "Conciliação OFX"
// DELES (`Conciliacao/ImportacaoOfx`, `Conciliacao/ReconciliacaoOfx`) foram
// descartadas — CRUD/fluxo superado pelo `OfxImport/` acima (mesmo motor
// vencedor, homologado).

// ---- Privado: Financeiro — Congelamentos Financeiros (FinancialFreeze,
// F-110, esteira 97-Esteiras/008, Tarefa 31/32) ----
// Item de menu (`fin-cng`→`/financeiro/congelamentos`) e a permissão
// `financial-freeze_view` (e as 3 irmãs create/edit/delete) JÁ EXISTEM
// (navigationTree.ts, navigationPermissions.ts:831, permissionsCatalog.json)
// — nenhuma alteração nesses 3 arquivos. Tarefa 31 liga só a listagem;
// `CreateOrUpdateFinancialFreeze` (novo/editar/visualizar) é Tarefa 32.
const CongelamentosList = lazy(() => import('@/pages/Financeiro/Congelamentos'));
// Formulário único criar/editar/visualizar (Tarefa 32) — as 3 rotas irmãs
// abaixo apontam para o MESMO componente lazy.
const CreateOrUpdateFinancialFreeze = lazy(
  () => import('@/pages/Financeiro/Congelamentos/CreateOrUpdateFinancialFreeze')
);

// ---- Privado: Financeiro — Prev. Orçamentária (BudgetPlanning, F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-06/07) ----
// Item de menu (`fin-pre`→`/financeiro/previsao`) e a permissão
// `budget-plannings_view` JÁ EXISTEM (navigationTree.ts:2136-2140,
// navigationPermissions.ts:839) — nenhuma alteração nesses 2 arquivos.
// TASK-PO-FE-06 ligou a listagem (grid+filtro+exclusão+exportar de linha).
// TASK-PO-FE-07 (GAP-PO-08 resolvido — `GET /budget-plannings/eligible-
// categories` existe) liga o formulário criar/editar/visualizar (grade
// mensal categorias×12 meses), MESMO componente para as 3 rotas irmãs
// abaixo (mirror `CreateOrUpdateFinancialFreeze`).
// TASK-PO-FE-10 (contrato de tela §9) liga o relatório Previsto×Realizado —
// rota ESTÁTICA própria (`relatorio-previsto-realizado`), declarada ANTES de
// `/:budgetPlanningUuid` (mesmo cuidado de `/create`, senão o binding da
// rota-parâmetro capturaria o segmento literal como uuid).
const BudgetPlanningList = lazy(() => import('@/pages/Financeiro/BudgetPlanning'));
const CreateOrUpdateBudgetPlanning = lazy(
  () => import('@/pages/Financeiro/BudgetPlanning/CreateOrUpdateBudgetPlanning')
);
const BudgetPlanningPredictedReport = lazy(
  () => import('@/pages/Financeiro/BudgetPlanning/BudgetPlanningPredictedReport')
);

// ---- Privado: Financeiro — Fluxo Bancário (CashFlow, F-107, esteira 070,
// TASK-CF-FE-01/02) ----
// Item de menu (`fin-flu`→`/financeiro/fluxo`) e a permissão `cashflow_view`
// JÁ EXISTEM (navigationTree.ts:2180, navigationPermissions.ts:862) —
// nenhuma alteração nesses 2 arquivos, só a rota real abaixo (mesmo padrão
// `WarehouseTransfer`/`TASK-WT-FE-02`, item de menu apontando a
// `RoutePlaceholder` até a rota real ser registrada). Tela 100% leitura
// (relatório único, `GET /cashflow`) — sem rotas de formulário/criar/editar.
const CashFlowReport = lazy(() => import('@/pages/Financeiro/CashFlow'));

// ---- Privado: Cadastros Base — Produtos (Product, execução 025) ----
// Listagem real (TASK-FE-502) + formulário create/edit real com 2 abas
// (TASK-FE-503/504) + detalhe view-only (TASK-FE-505) — wiring de rota em
// TASK-FE-506 (CHOKEPOINT), URL/rótulo/heading renomeados de "Catálogo" para
// "Produtos" em TASK-FE-1000 (GAP-FE-200/201). Item de menu `cad-est-pro-lista`
// ("Produtos") e permissão de navegação JÁ EXISTIAM (navigationTree.ts:124,
// navigationPermissions.ts:54) — nenhuma edição nesses 2 arquivos nesta
// Tarefa além de label/path. Pasta física continua `Produtos/Catalogo/`
// (rename de diretório fora de escopo, decisão explícita de TASK-FE-1000).
const ProdutosCatalogoList = lazy(() => import('@/pages/CadastrosBase/Produtos/Catalogo'));
const CreateOrUpdateProduto = lazy(
  () => import('@/pages/CadastrosBase/Produtos/Catalogo/CreateOrUpdateProduto')
);
const ProdutoDetalhe = lazy(() => import('@/pages/CadastrosBase/Produtos/Catalogo/ProdutoDetalhe'));

// ---- Privado: Cadastros Base — Pecuários — Diagnóstico Gestação ----
const DiagnosisPregnancyList = lazy(() => import('@/pages/BaseRegistrations/DiagnosisPregnancy'));
const CreateOrUpdateDiagnosisPregnancy = lazy(
  () => import('@/pages/BaseRegistrations/DiagnosisPregnancy/CreateOrUpdateDiagnosisPregnancy')
);

// ---- Privado: Cadastros Base — Pecuários — Escore Corporal (BodyScore, TASK-BS-FE-03) ----
const BodyScoreList = lazy(() => import('@/pages/BaseRegistrations/BodyScores'));
const CreateOrUpdateBodyScore = lazy(
  () => import('@/pages/BaseRegistrations/BodyScores/CreateOrUpdateBodyScore')
);

// ---- Privado: Cadastros Base — Gerais — Contratantes (Tenant, TASK-TN-FE-02) ----
// Listagem (TASK-TN-FE-02) + formulário create/edit (TASK-TN-FE-03/04/05,
// mesmo componente único `CreateOrUpdateContratante.tsx`).
const ContratantesList = lazy(() => import('@/pages/BaseRegistrations/Contratantes'));
const CreateOrUpdateContratante = lazy(
  () => import('@/pages/BaseRegistrations/Contratantes/CreateOrUpdateContratante')
);

// ---- Privado: Cadastros Base — Estrutura — Rateio / Categorias (Apportionment, TASK-AP-FE-09) ----
const ApportionmentList = lazy(() => import('@/pages/BaseRegistrations/Apportionments'));
const CreateOrUpdateApportionment = lazy(
  () => import('@/pages/BaseRegistrations/Apportionments/CreateOrUpdateApportionment')
);

// ---- Privado: Cadastros Base — Pecuários — Parâmetros / Peso (ParameterWeight) ----
// Listagem real (TASK-PW-FE-01) — formulário create/edit real (TASK-PW-FE-02,
// lazy import acrescentado por essa Tarefa irmã, mesmo arquivo de service/tipos).
const ParameterWeightsList = lazy(() => import('@/pages/BaseRegistrations/ParameterWeights'));
const CreateOrUpdateParameterWeights = lazy(
  () => import('@/pages/BaseRegistrations/ParameterWeights/CreateOrUpdateParameterWeights')
);

// ---- Privado: Cadastros Base — Pecuários — Forragem (Fodder) ----
// Listagem real (TASK-FD-FE-01) — SEM filtro (DA-FD-11). Formulário
// create/edit é a Tarefa irmã TASK-FD-FE-02 (lazy import acrescentado por
// ela, mesmo arquivo de service/tipos).
const FoddersList = lazy(() => import('@/pages/BaseRegistrations/Fodders'));
const CreateOrUpdateFodders = lazy(
  () => import('@/pages/BaseRegistrations/Fodders/CreateOrUpdateFodders')
);

// ---- Privado: Cadastros Base — Pecuários — Módulo Pastejo (Grazing) ----
// Listagem real (TASK-GZ-FE-01) — SEM filtro (legado não tem busca, Doc
// Bruta §7 item 1). Formulário create/edit (TASK-GZ-FE-02) — campos base,
// SEM o mapa de seleção de piquetes (`areas[]`, TASK-GZ-FE-03, Tarefa irmã
// ainda não iniciada — o submit real só fecha quando ela existir).
const GrazingsList = lazy(() => import('@/pages/BaseRegistrations/Grazings'));
const CreateOrUpdateGrazing = lazy(
  () => import('@/pages/BaseRegistrations/Grazings/CreateOrUpdateGrazing')
);

// ---- Privado: Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing,
// execução 029) ----
// Lote de FUNDAÇÃO (TASK-FE-2004, chokepoint). 3 telas: listagem, criação,
// visualização (cards) — SEM edição, a API não tem PUT/PATCH (D1 do
// contrato de API `contrato-lote-modulo.md`). Item de menu `cad-pec-lmo`
// JÁ EXISTE (navigationTree.ts/navigationPermissions.ts/languageSidebar.ts)
// — esta Tarefa só liga a rota real. Os 3 componentes abaixo são
// materializados pela Tarefa irmã de feature (TASK-FE-2000..2003).
const BatchGrazingsList = lazy(() => import('@/pages/BaseRegistrations/BatchGrazings'));
const CreateBatchGrazing = lazy(
  () => import('@/pages/BaseRegistrations/BatchGrazings/CreateBatchGrazing')
);
const BatchGrazingDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/BatchGrazings/BatchGrazingDetalhe')
);

// ---- Privado: Cadastros Base — Pecuários — Lote/Área (BatchArea, execução
// 029) ----
// Lote de FUNDAÇÃO (TASK-FE-2104, chokepoint). Irmã estrutural de
// BatchGrazing (mesma anatomia, trocando Módulo por Área) — SEM edição
// (D1 do contrato de API `contrato-lote-area.md`). Item de menu `cad-pec-lar`
// JÁ EXISTE — esta Tarefa só liga a rota real. Componentes materializados
// pela Tarefa irmã de feature (TASK-FE-2100..2103).
const BatchAreasList = lazy(() => import('@/pages/BaseRegistrations/BatchAreas'));
const CreateBatchArea = lazy(() => import('@/pages/BaseRegistrations/BatchAreas/CreateBatchArea'));
const BatchAreaDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/BatchAreas/BatchAreaDetalhe')
);

// ---- Privado: Cadastros Base — Pecuários — Cochos (Trough, execução 029)
// ----
// Lote de FUNDAÇÃO (TASK-FE-2204, chokepoint). CRUD completo (criação/edição
// real, API TEM PUT — `contrato-cochos.md`) + visualização NOVA (cards).
// Item de menu `cad-pec-coc` JÁ EXISTE — esta Tarefa só liga a rota real.
// Componentes materializados pela Tarefa irmã de feature (TASK-FE-2200..2203).
const TroughsList = lazy(() => import('@/pages/BaseRegistrations/Troughs'));
const CreateOrUpdateTrough = lazy(
  () => import('@/pages/BaseRegistrations/Troughs/CreateOrUpdateTrough')
);
const TroughDetalhe = lazy(() => import('@/pages/BaseRegistrations/Troughs/TroughDetalhe'));

// ---- Privado: Cadastros Base — Pecuários — Bebedouros (DrinkingFountain,
// execução 029) ----
// Lote de FUNDAÇÃO (TASK-FE-2304, chokepoint). DELTA sobre Trough (mesma
// anatomia, `contrato-bebedouros.md`) — item de menu `cad-pec-beb` NOVO
// (não existia, criado por esta mesma Tarefa em navigationTree.ts/
// navigationPermissions.ts/languageSidebar.ts). Componentes materializados
// pela Tarefa irmã de feature (TASK-FE-2300..2303).
const DrinkingFountainsList = lazy(() => import('@/pages/BaseRegistrations/DrinkingFountains'));
const CreateOrUpdateDrinkingFountain = lazy(
  () => import('@/pages/BaseRegistrations/DrinkingFountains/CreateOrUpdateDrinkingFountain')
);
const DrinkingFountainDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/DrinkingFountains/DrinkingFountainDetalhe')
);

// ---- Privado: Cadastros Base — Família de Bens (FamilyEquipment) ----
// Listagem real (TASK-FE-FE-01) + formulário create/edit (TASK-FE-FE-02).
const FamiliaBensList = lazy(() => import('@/pages/BaseRegistrations/FamilyEquipments'));
const CreateOrUpdateFamiliaBens = lazy(
  () => import('@/pages/BaseRegistrations/FamilyEquipments/CreateOrUpdateFamilyEquipments')
);

// ---- Privado: Cadastros Base — Marcadores (Marker) ----
// Listagem real (TASK-MK-FE-01) + formulário create/edit real (TASK-MK-FE-02).
const MarcadoresList = lazy(() => import('@/pages/BaseRegistrations/Markers'));
const CreateOrUpdateMarcador = lazy(
  () => import('@/pages/BaseRegistrations/Markers/CreateOrUpdateMarkers')
);

// ---- Privado: Configurações — Testeiras (Headband, TASK-HB-FE-04) ----
// Listagem real (TASK-HB-FE-03) + formulário create/edit real (TASK-HB-FE-06).
// Pasta de código permanece BaseRegistrations/Headbands/ — só a URL migrou
// do slug antigo em Cadastros Base para /configuracoes/testeiras (97-Esteiras/019).
const HeadbandsList = lazy(() => import('@/pages/BaseRegistrations/Headbands'));
const CreateOrUpdateHeadband = lazy(
  () => import('@/pages/BaseRegistrations/Headbands/CreateOrUpdateHeadband')
);

// ---- Privado: Configurações — Parâmetros (Parameter, execução 031,
// TASK-FE-031-43) ----
// Listagem real (TASK-FE-031-41) + formulário create/edit real
// (TASK-FE-031-42) + detalhe read-only (TASK-FE-031-43). Item novo de menu,
// nunca existiu antes (fecha a lacuna anotada em navigationTree.ts, execução
// 019) — sem migração de URL.
const ParametersList = lazy(() => import('@/pages/BaseRegistrations/Parameters'));
const CreateOrUpdateParameters = lazy(
  () => import('@/pages/BaseRegistrations/Parameters/CreateOrUpdateParameters')
);
const ParametersDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/Parameters/ParametersDetalhe')
);

// ---- Privado: Cadastros Base — Usuários (User, execução 027) ----
// Lote de FUNDAÇÃO (TASK-FE-800..804) — as telas reais (listagem TASK-FE-805,
// formulário TASK-FE-811/812) chegam no PRÓXIMO lote. Os 2 componentes abaixo
// são PLACEHOLDER mínimo (ver comentário de cabeçalho de cada arquivo) só
// para a rota (TASK-FE-803) não cair no catch-all `/cadastros-base/*`. Item
// de menu (`cad-pes-usr`) e permissão (`users_view`) JÁ EXISTIAM — nenhuma
// alteração em `navigationTree.ts`/`languageSidebar.ts`/`navigationPermissions.ts`.
const UsuariosList = lazy(() => import('@/pages/CadastrosBase/Usuarios'));
const CreateOrUpdateUsuario = lazy(
  () => import('@/pages/CadastrosBase/Usuarios/CreateOrUpdateUsuario')
);

// ---- Privado: Cadastros Base — Estágio Reprodutivo (CategoryMatrix) ----
// Listagem real (TASK-CATYMT-01) + formulário create/edit (TASK-CATYMT-02).
const EstagioReprodutivoList = lazy(() => import('@/pages/CadastrosBase/EstagioReprodutivo'));
const CreateOrUpdateEstagioReprodutivo = lazy(
  () => import('@/pages/CadastrosBase/EstagioReprodutivo/CreateOrUpdateEstagioReprodutivo')
);

// ---- Privado: Cadastros Base — Motivos de Baixa (LowReason) ----
// Listagem real (TASK-LR-FE-01) + formulário create/edit (TASK-LR-FE-02).
const MotivosBaixaList = lazy(() => import('@/pages/BaseRegistrations/LowReasons'));
const CreateOrUpdateMotivoBaixa = lazy(
  () => import('@/pages/BaseRegistrations/LowReasons/CreateOrUpdateLowReasons')
);
// Visualização NOVA (cards, somente leitura) — lote 01/EST-085, passada 2,
// mesmo molde de `TroughDetalhe`/`DetalheCentroCusto`.
const LowReasonDetalhe = lazy(
  () => import('@/pages/BaseRegistrations/LowReasons/LowReasonDetalhe')
);

// ---- Privado: Cadastros Base — Tipos de Título (TypeTitle) ----
// Listagem real (TASK-TT-01) + formulário create/edit (TASK-TT-02).
const TiposTituloList = lazy(() => import('@/pages/BaseRegistrations/TypeTitles'));
const CreateOrUpdateTipoTitulo = lazy(
  () => import('@/pages/BaseRegistrations/TypeTitles/CreateOrUpdateTypeTitles')
);

// ---- Privado: Cadastros Base -- Informacoes Complementares (AdditionalInfo) ----
// Listagem real (TASK-AI-03, paginacao real via ApiResponse::paginated) +
// formulario create/edit real (TASK-AI-04). Item de menu JA EXISTE
// (navigationTree.ts:167/navigationPermissions.ts:77, cad-fis-inf) -- esta
// Tarefa so conecta a rota real.
const InfoComplementaresList = lazy(() => import('@/pages/BaseRegistrations/AdditionalInfo'));
const CreateOrUpdateInfoComplementar = lazy(
  () => import('@/pages/BaseRegistrations/AdditionalInfo/CreateOrUpdateAdditionalInfo')
);

// ---- Privado: Cadastros Base — Condições de Pagamento (PaymentTerm) ----
// Listagem real (TASK-FE-046) + formulário create/edit (TASK-FE-047).
const CondicoesPagamentoList = lazy(() => import('@/pages/BaseRegistrations/PaymentTerms'));
const CreateOrUpdateCondicaoPagamento = lazy(
  () => import('@/pages/BaseRegistrations/PaymentTerms/CreateOrUpdatePaymentTerms')
);

// ---- Privado: Cadastros Base — Emissores NFe (Issuer, execução 023) ----
// Listagem real (TASK-FE-321) + formulário create/edit (TASK-FE-322/323) +
// tela dedicada de certificado digital (TASK-FE-324) — wiring de rota em
// TASK-FE-325. Item de menu JÁ EXISTE (navigationTree.ts, cad-fis-emi).
const EmissoresList = lazy(() => import('@/pages/CadastrosBase/Emissores'));
const CreateOrUpdateEmissor = lazy(
  () => import('@/pages/CadastrosBase/Emissores/CreateOrUpdateEmissor')
);
const CertificadoEmissor = lazy(() => import('@/pages/CadastrosBase/Emissores/CertificadoEmissor'));

// ---- Privado: Cadastros Base — Proprietários (Proprietary) ----
// LISTAGEM real (TASK-PY-FE-02, paginação/filtro/exclusão HARD-DELETE
// server-side via `GET|DELETE /api/v1/proprietaries`, fachada dedicada de
// Proprietary-contrato.md DA-PY-02). Item de menu NOVO (`cad-pes-prp`,
// navigationTree.ts), posicionado ANTES de `cad-for-lis` (ordem real do
// legado, app/Support/PermissionTree.php:424-459). Formulário create/edit
// (rotas /novo e /:uuid, TASK-PY-FE-03) — casca single-page (sem Tabs, ver
// ficha "Referência UX" item 4) com seções `farms[]`/`state_registration_numbers[]`.
const ProprietariosList = lazy(() => import('@/pages/CadastrosBase/Proprietarios'));
const CreateOrUpdateProprietario = lazy(
  () => import('@/pages/CadastrosBase/Proprietarios/CreateOrUpdateProprietario')
);

// ---- Privado: Cadastros Base — Funcionários (Employee) ----
// LISTAGEM real (TASK-EMP-FE-02, paginação/filtro/exclusão SOFT
// server-side via `GET|DELETE /api/v1/employees`, fachada dedicada de
// Employee-contrato.md DA-EMP-02). Item de menu NOVO (`cad-pes-fun`,
// navigationTree.ts), posicionado ENTRE `cad-pes-prp` e `cad-for-lis` (ordem
// real do legado, app/Support/PermissionTree.php:424-459). Formulário
// create/edit chega em `TASK-EMP-FE-03/04` — `/novo`/`/:employeeUuid` já
// registradas (guardas granulares `employees_create`/`employees_edit`,
// mirror Fornecedores) mas renderizam `<RoutePlaceholder />` até lá (mesmo
// padrão incremental de outros módulos antes do form existir).
const FuncionariosList = lazy(() => import('@/pages/CadastrosBase/Funcionarios'));
// TASK-EMP-FE-03 — formulário criar/editar real, substitui os 2
// `<RoutePlaceholder />` de `/novo`/`/:employeeUuid` abaixo.
const CreateOrUpdateFuncionario = lazy(
  () => import('@/pages/CadastrosBase/Funcionarios/CreateOrUpdateFuncionario')
);

// ---- Privado: Cadastros Base — Clientes (Client) ----
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01/02/03) — escrito
// ANTES de `Client-contrato.md`/backend existirem (fachada dedicada
// `/api/v1/clients` ainda não materializada). Item de menu NOVO
// (`cad-pes-cli`, navigationTree.ts), posicionado APÓS `cad-for-lis` (ordem
// real do legado, app/Support/PermissionTree.php:399-469). Rotas guardadas
// por `clients_view` (leitura mínima do form) — a autorização REAL de
// create/edit é aplicada dentro do componente (`canSave`) e, em última
// instância, pelo backend (403).
const ClientesList = lazy(() => import('@/pages/CadastrosBase/Clientes'));
const CreateOrUpdateCliente = lazy(
  () => import('@/pages/CadastrosBase/Clientes/CreateOrUpdateCliente')
);
// Visualização NOVA (cards, somente leitura) — lote 01/EST-085, passada 2,
// mesmo molde de `TroughDetalhe`/`DetalheCentroCusto`.
const ClienteDetalhe = lazy(() => import('@/pages/CadastrosBase/Clientes/ClienteDetalhe'));

// ---- Privado: Cadastros Base — Fornecedores (Provider) ----
// LISTAGEM real (TASK-PR-FE-02, paginação/filtro/ordenação server-side via
// `GET /api/v1/providers`, fachada dedicada de Provider-contrato.md DA-PR-02).
// Item de menu NOVO (`cad-for-lis`, navigationTree.ts), separado de "Pessoas"
// (decisão do dono: COEXISTIR, Provider-FrontEnd-contrato.md ## 11 item 1).
// Formulário create/edit (rotas /novo e /:providerUuid, TASK-PR-FE-03) —
// casca de Tabs + aba "Dados"; GAP-PR-FE-02 RESOLVIDO (TASK-PR-06/GAP-PR-07,
// revalidado pelo Tester de api em 2026-07-29).
const FornecedoresList = lazy(() => import('@/pages/CadastrosBase/Fornecedores'));
const CreateOrUpdateFornecedor = lazy(
  () => import('@/pages/CadastrosBase/Fornecedores/CreateOrUpdateFornecedor')
);

// ---- Privado: Cadastros Base — Pessoas Unificado (Person, execução 023) ----
// Listagem real (TASK-FE-301) + wizard multi-etapa create/edit
// (TASK-FE-302/303/304/305) — wiring de rota em TASK-FE-306. Item de menu
// JÁ EXISTE (navigationTree.ts:136/navigationPermissions.ts:62, cad-pes-uni).
const PessoasList = lazy(() => import('@/pages/CadastrosBase/Pessoas'));
const CreateOrUpdatePessoa = lazy(
  () => import('@/pages/CadastrosBase/Pessoas/CreateOrUpdatePessoa')
);

// ---- Privado: Cadastros Base — Serviços (ServiceExpense) ----
// Listagem real (TASK-FE-131) + formulário create/edit (TASK-FE-132).
const ServicosList = lazy(() => import('@/pages/BaseRegistrations/ServiceExpenses'));
const CreateOrUpdateServico = lazy(
  () => import('@/pages/BaseRegistrations/ServiceExpenses/CreateOrUpdateServiceExpenses')
);

// ---- Privado: Cadastros Base — Estorno (ReversalExpense) ----
// Listagem real (TASK-FE-062) + formulário create/edit (TASK-FE-063).
const EstornoList = lazy(() => import('@/pages/BaseRegistrations/ReversalExpenses'));
const CreateOrUpdateEstorno = lazy(
  () => import('@/pages/BaseRegistrations/ReversalExpenses/CreateOrUpdateReversalExpenses')
);

// ---- Privado: Cadastros Base — Técnicas de Diagnóstico ----
const TecnicasDiagnosticoList = lazy(
  () => import('@/pages/BaseRegistrations/DiagnosticTechniques')
);
const CreateOrUpdateTecnicaDiagnostico = lazy(
  () => import('@/pages/BaseRegistrations/DiagnosticTechniques/CreateOrUpdateDiagnosticTechniques')
);

// ---- Privado: Cadastros Base — Tipos de Identificação (IdentificationType) ----
// TASK-FE-040: 3 rotas reais (lista/criar/editar), catálogo global sem FK.
const TiposIdentificacaoList = lazy(() => import('@/pages/BaseRegistrations/IdentificationTypes'));
const CreateOrUpdateTipoIdentificacao = lazy(
  () => import('@/pages/BaseRegistrations/IdentificationTypes/CreateOrUpdateIdentificationTypes')
);

// ---- Privado: Cadastros Base — Observação Nascimento (BirthNote) ----
// TASK-FE-103: 3 rotas reais (lista/criar/editar), catálogo global sem FK.
const ObservacaoNascimentoList = lazy(() => import('@/pages/BaseRegistrations/BirthNotes'));
const CreateOrUpdateObservacaoNascimento = lazy(
  () => import('@/pages/BaseRegistrations/BirthNotes/CreateOrUpdateBirthNotes')
);

// ---- Privado: Cadastros Base — Indexadores (Indexer) ----
// TASK-FE-213: 3 rotas reais (lista/criar/editar), catálogo global sem FK.
const IndexadoresList = lazy(() => import('@/pages/BaseRegistrations/Indexers'));
const CreateOrUpdateIndexador = lazy(
  () => import('@/pages/BaseRegistrations/Indexers/CreateOrUpdateIndexers')
);

// ---- Privado: Cadastros Base — Atividades (Activity) ----
const AtividadesList = lazy(() => import('@/pages/CadastrosBase/Atividades'));
const CreateOrUpdateAtividade = lazy(
  () => import('@/pages/CadastrosBase/Atividades/CreateOrUpdateAtividade')
);

// ---- Privado: Cadastros Base — Operações (Operation) ----
const OperacoesList = lazy(() => import('@/pages/CadastrosBase/Operacoes'));
const CreateOrUpdateOperacao = lazy(
  () => import('@/pages/CadastrosBase/Operacoes/CreateOrUpdateOperacao')
);

// ---- Privado: Cadastros Base — Agrupadores (Grouper) ----
// Listagem em árvore (TASK-FE-030) + formulário create/edit (TASK-FE-031).
const AgrupadoresList = lazy(() => import('@/pages/BaseRegistrations/Groupers'));
const CreateOrUpdateAgrupador = lazy(
  () => import('@/pages/BaseRegistrations/Groupers/CreateOrUpdateGroupers')
);

// ---- Privado: Cadastros Base — Categorias Financeiras (FinancialCategory) ----
// Listagem em árvore/grid (TASK-FE-311) + formulário create/edit (TASK-FE-312).
// Menu (`cad-fin-cat`) já existia — só faltava o wiring de rota (TASK-FE-313).
const CategoriasFinanceirasList = lazy(() => import('@/pages/CadastrosBase/Categorias'));
const CreateOrUpdateFinancialCategory = lazy(
  () => import('@/pages/CadastrosBase/Categorias/CreateOrUpdateFinancialCategory')
);

// ---- Privado: Cadastros Base — Agrupadores Contábeis (AccountingGrouper) ----
// Módulo IRMÃO de "Agrupadores" (estoque, acima) — domínio DRE, permissão
// PRÓPRIA `accounting_groupers_*` (TASK-ACG-01/02). NÃO reutiliza
// `AgrupadoresList`/`groupers_view` (ver "Armadilha de identidade" na Tarefa).
// Listagem em árvore SEM paginação (TASK-ACG-01) + formulário create/edit
// (TASK-ACG-02).
const AgrupadoresContabeisList = lazy(() => import('@/pages/BaseRegistrations/AccountingGroupers'));
const CreateOrUpdateAgrupadorContabil = lazy(
  () => import('@/pages/BaseRegistrations/AccountingGroupers/CreateOrUpdateAccountingGroupers')
);

// Administrativo — Gestão Documentos — Tipo Documento (DocumentType,
// TASK-DT-FE-01): mesma classe estrutural de AccountingGrouper (nested-set,
// sem paginação real). Listagem em árvore SEM paginação (TASK-DT-FE-01) +
// formulário create/edit (TASK-DT-FE-02).
const TiposDocumentoList = lazy(() => import('@/pages/BaseRegistrations/DocumentTypes'));
const CreateOrUpdateTipoDocumento = lazy(
  () => import('@/pages/BaseRegistrations/DocumentTypes/CreateOrUpdateDocumentType')
);

// Administrativo — Gestão Documentos — Documentos (DocumentManagement,
// Tarefas 12/13): módulo IRMÃO de Tipo Documento (mesma classe estrutural de
// Equipment/Measurements — paginação REAL, NÃO árvore). Listagem paginada +
// filtro (Tarefa 12) + formulário create/edit com bloco dinâmico de anexos
// (Tarefa 13).
const DocumentosList = lazy(() => import('@/pages/Administrativo/Documentos'));
const CreateOrUpdateDocumento = lazy(
  () => import('@/pages/Administrativo/Documentos/CreateOrUpdateDocumento')
);

// ---- Privado: Cadastros Base — Estados + Cidades (Geografia) ----
// Catálogos globais 100% read-only (TASK-FE-022/023) — SEM rota /novo/:id,
// nunca terão formulário.
const EstadosList = lazy(() => import('@/pages/CadastrosBase/Estados'));
const CidadesList = lazy(() => import('@/pages/CadastrosBase/Cidades'));

// ---- Privado: Cadastros Base — Un. de Medida (Measurement) ----
// TASK-FE-056: formulário (criar/editar) + listagem (TASK-FE-054, paginação
// REAL — GAP-BE-043 fechado ✅ CONCLUÍDO, GAP-FE-009 resolvido).
const UnidadeMedidaList = lazy(() => import('@/pages/BaseRegistrations/Measurements'));
const CreateOrUpdateUnidadeMedida = lazy(
  () => import('@/pages/BaseRegistrations/Measurements/CreateOrUpdateMeasurements')
);

// ---- Privado: Cadastros Base — Parametrizações (TenantParameter) ----
// Settings-form de registro único (TASK-FE-070/071) — 1 única rota, SEM
// /novo/:id. Item de menu JÁ EXISTE (navigationTree.ts, cad-ger-par) — esta
// Tarefa só conecta a rota real.
const Parametrizacoes = lazy(() => import('@/pages/BaseRegistrations/TenantParameters'));

// ---- Privado: Cadastros Base — Regras Fiscais (TaxRule) ----
// Item de menu JÁ EXISTE (navigationTree.ts, cad-fis-reg) — esta Tarefa só
// conecta as 3 rotas reais (TASK-FE-114).
const RegrasFiscaisList = lazy(() => import('@/pages/BaseRegistrations/TaxRules'));
const CreateOrUpdateRegraFiscal = lazy(
  () => import('@/pages/BaseRegistrations/TaxRules/CreateOrUpdateTaxRules')
);

// ---- Privado: Cadastros Base — Natureza de Operação (NatureOperation) ----
// LISTAGEM real (TASK-NO-FE-01, paginação real via ApiResponse::paginated),
// declarada ANTES do catch-all /cadastros-base/* para vencer o
// RoutePlaceholder. Item de menu (cad-fis-nat) e permissão (natop_view) JÁ
// EXISTIAM em navigationTree.ts/navigationPermissions.ts — esta Tarefa
// destrava o link de menu órfão, conectando a rota real. Formulário
// create/edit (rotas /novo e /:natureOperationId, TASK-NO-FE-02) abaixo.
const NaturezaOperacaoList = lazy(() => import('@/pages/CadastrosBase/NaturezaOperacao'));
const CreateOrUpdateNaturezaOperacao = lazy(
  () => import('@/pages/CadastrosBase/NaturezaOperacao/CreateOrUpdateNaturezaOperacao')
);

// ---- Privado: Cadastros Base — Tipos de Categoria (CategoryType) ----
// LISTAGEM real (TASK-CTY-01, paginação real via ApiResponse::paginated —
// per_page ignorado pelo backend hoje, Risco 2 da ficha), declarada ANTES do
// catch-all /cadastros-base/* para vencer o RoutePlaceholder. Formulário
// create/edit (rotas /novo e /:categoryTypeId, TASK-CTY-02) abaixo.
const TiposDeCategoriaList = lazy(() => import('@/pages/BaseRegistrations/CategoryTypes'));
const CreateOrUpdateTipoDeCategoria = lazy(
  () => import('@/pages/BaseRegistrations/CategoryTypes/CreateOrUpdateCategoryTypes')
);

// ---- Privado: Cadastros Base — Previsão de Depreciação (DepreciationForecast) ----
// Tela ÚNICA read-only/simulação (TASK-FE-231) — item de menu JÁ EXISTE
// (navigationTree.ts, cad-ben-pre, grupo "Bens/Ativos") — esta Tarefa só
// conecta a rota real (TASK-FE-232). Sem /novo, sem /:id — não há CRUD.
const PrevisaoDepreciacao = lazy(() => import('@/pages/BaseRegistrations/DepreciationForecasts'));

// ---- Privado: Cadastros Base — Depreciação Mensal / Depreciação Animal
// (Depreciation, execução 027, TASK-FE-842) ----
// Tela ÚNICA (2 abas Equipamento/Animal, sem CRUD) — item de menu JÁ EXISTE
// (navigationTree.ts:332, cad-ben-dep, grupo "Bens/Ativos") — esta Tarefa só
// conecta a rota real e amplia o gate de navegação para `anyOf` (ver
// navigationPermissions.ts).
const DepreciacaoMensal = lazy(() => import('@/pages/CadastrosBase/Depreciacao'));

// ---- Privado: Cadastros Base — Depreciação Animal (STANDALONE) ----
// [DECISÃO DO DONO — execução 055, "navegação fiel ao legado"]: no legado,
// "Depreciação Animal" é item de menu PRÓPRIO com tela dedicada (não uma aba
// dentro de "Depreciação Mensal"). Reusa o MESMO componente de
// `/cadastros-base/depreciacao-mensal` (`mode="animal"`, ver
// `Depreciacao/index.tsx`) via wrapper fino no próprio `lazy()` — zero
// duplicação de lógica/colunas/filtro/modal. Item de menu NOVO (cad-ben-dep-
// ani, navigationTree.ts) + gate PRÓPRIO (só `depreciation_animals_view`,
// navigationPermissions.ts) — "Depreciação Mensal"/Equipamento permanece
// 100% intocada.
const DepreciacaoAnimal = lazy(() =>
  import('@/pages/CadastrosBase/Depreciacao').then((mod) => ({
    default: () => <mod.default mode="animal" />,
  }))
);

// ---- Privado: Cadastros Base — Contador (Escritório de Contabilidade,
// domínio Fiscal/Contábil) ----
// Item de menu/permissão de navegação JÁ EXISTEM (navigationTree.ts:171,
// navigationPermissions.ts:78, cad-fis-cnt) — esta Tarefa só conecta as rotas
// reais. Listagem (TASK-CT-03a) + formulário create/edit (TASK-CT-03b).
const ContadorList = lazy(() => import('@/pages/CadastrosBase/Contador'));
const CreateOrUpdateContador = lazy(
  () => import('@/pages/CadastrosBase/Contador/CreateOrUpdateContador')
);

// ---- Privado: Cadastros Base — Sincronização DFe (IssueDfeSyncTime,
// domínio Fiscal) ----
// Item de menu/permissão de navegação JÁ EXISTEM (navigationTree.ts:175,
// navigationPermissions.ts:78, cad-fis-sin, `issue-dfe-sync-time_view`) —
// esta Tarefa só conecta as rotas reais. Listagem+exclusão (TASK-DFE-FE-01)
// + formulário create/edit (TASK-DFE-FE-02).
const SincronizacaoDfeList = lazy(() => import('@/pages/BaseRegistrations/IssueDfeSyncTimes'));
const CreateOrUpdateSincronizacaoDfe = lazy(
  () => import('@/pages/BaseRegistrations/IssueDfeSyncTimes/CreateOrUpdateIssueDfeSyncTimes')
);

// ---- Privado: Cadastros Base — NFSe Recebidas (Nfse, domínio Fiscal,
// TASK-FE-2730..2735) ----
// REPARO (wiring perdido em `git checkout` mal escopado — módulo já estava
// ✅ aprovado; páginas/i18n intactas, só o wiring compartilhado sumiu).
// Item de menu/permissão de navegação restaurados em navigationTree.ts
// (cad-fis-nfse) / navigationPermissions.ts (nfse_view) — esta restauração
// só reconecta as 2 rotas reais. Domínio NÃO é CRUD (sem create/update/
// destroy de `Nfse`, fidelidade ao legado) — Listagem (`TASK-FE-2732`) +
// "Buscar DFe" síncrono (`TASK-FE-2734`).
const NfseRecebidasList = lazy(() => import('@/pages/BaseRegistrations/NfseRecebidas'));
const BuscarDfeNfse = lazy(() => import('@/pages/BaseRegistrations/NfseRecebidas/BuscarDfe'));

// ---- Privado: Configurações — Tutoriais (Help, TASK-HP-06) ----
// DIVERGÊNCIA da ficha desta Tarefa (reportada, não improvisada): o
// task-packet especificava `src/router/v2/private/configuracoes.routes.ts`
// (estrutura modular idealizada pela tool `get_pwa_new_module_execution_plan`
// para "front de sistema" em geral). Este repositório NÃO tem `src/router/v2/`
// — a ÚNICA árvore de rotas real é este arquivo (`src/router/index.tsx`),
// confirmado por leitura antes de codar. Seguido o precedente REAL mais
// recente do MESMO grupo de menu "Configurações" (Testeiras/Headband, logo
// abaixo): rotas registradas diretamente aqui, com `RequirePermission`.
// Não existe catch-all `/configuracoes/*` neste router — as 3 rotas abaixo
// não disputam nenhum `RoutePlaceholder`.
const HelpsList = lazy(() => import('@/pages/Configuracoes/Help'));
const CreateOrUpdateHelp = lazy(() => import('@/pages/Configuracoes/Help/CreateOrUpdateHelp'));

// ---- Privado: Configurações — Configuração (Config, execução 032,
// TASK-FE-2603) ----
// Tela ÚNICA (settings singleton de plataforma, sem create/edit por rota) —
// mesmo padrão de Tutoriais/Aplicativos acima (rota registrada diretamente
// aqui, `RequirePermission`). `Config` é catálogo GLOBAL (contrato de tela
// §1.2/§5) — sem `farm.context`.
const Config = lazy(() => import('@/pages/Configuracoes/Config'));

// ---- Privado: Configurações — Aplicativos (App, TASK-APP-FE-01) ----
// Mesmo padrão de Tutoriais/Help acima: rotas registradas diretamente aqui
// (este repositório não tem `src/router/v2/`), com `RequirePermission`.
// `App` é catálogo GLOBAL (App-contrato.md Seção 4) — sem `farm.context`.
const AppsList = lazy(() => import('@/pages/Configuracoes/Apps'));
const CreateOrUpdateApp = lazy(() => import('@/pages/Configuracoes/Apps/CreateOrUpdateApp'));

// ---- Privado: Site (Site, esteira 97-Esteiras/061, TASK-SITE-07) ----
// Tela ÚNICA de configuração pública da fazenda (form singleton, mirror
// Config/TenantParameters — sem create/edit por rota). Módulo PRÓPRIO, NÃO
// aninhado em `/configuracoes` (G-FE-02, `03-ARQUITETURA-frontend-site.md`
// §"Decisão esperada do dev"). `Site` é farm-scoped via `X-Farm-Id`
// (diferente de `Config`, global) — guard de "sem fazenda ativa" fica DENTRO
// da tela (TASK-SITE-05), não é gate de rota.
const Site = lazy(() => import('@/pages/Site'));

// ---- Privado: Cadastros Base — Estoque Inicial (OpeningBalance, execução
// 026) ----
// Listagem real (TASK-FE-1042) + formulário create/edit real (TASK-FE-1043)
// + detalhe view-only (TASK-FE-1045) — wiring de rota em TASK-FE-1046
// (CHOKEPOINT). Item de menu `cad-est-sal-ini` e permissão de navegação
// (`openingbalances_view`) JÁ EXISTIAM (navigationTree.ts:211/
// navigationPermissions.ts:68, corrigidos em TASK-FE-1041) — esta Tarefa só
// conecta as 4 rotas reais.
const EstoqueInicialList = lazy(() => import('@/pages/CadastrosBase/EstoqueInicial'));
const CreateOrUpdateEstoqueInicial = lazy(
  () => import('@/pages/CadastrosBase/EstoqueInicial/CreateOrUpdateEstoqueInicial')
);
const EstoqueInicialDetalhe = lazy(
  () => import('@/pages/CadastrosBase/EstoqueInicial/EstoqueInicialDetalhe')
);

// ---- Privado: Cadastros Base — Inventário (Equipment, execução 026) ----
// Listagem real (TASK-FE-1004) + formulário completo de 5 abas
// (TASK-FE-1005..1009) + detalhe view-only (TASK-FE-1010) — wiring de rota em
// TASK-FE-1011 (CHOKEPOINT). Item de menu `cad-ben-inv` e permissão de
// navegação (`equipments_view`) JÁ EXISTIAM (navigationTree.ts:331/
// navigationPermissions.ts:129, i18n ×3 em languageSidebar.ts) — esta Tarefa
// só conecta as 4 rotas reais.
const InventarioList = lazy(() => import('@/pages/CadastrosBase/Inventario'));
const CreateOrUpdateEquipamento = lazy(
  () => import('@/pages/CadastrosBase/Inventario/CreateOrUpdateEquipamento')
);
const DetalheEquipamento = lazy(
  () => import('@/pages/CadastrosBase/Inventario/DetalheEquipamento')
);

// ---- Privado: Administrativo — Gestão Pessoal — Funções (Function, cargo/
// função de RH, TASK-FN-FE-01/02) ----
// Item de menu/permissão JÁ EXISTEM (navigationTree.ts:388, adm-gp-fun,
// navigationPermissions.ts:156, functions_view) — esta Tarefa só conecta a
// rota real (a primeira tela real de toda a área /administrativo/*, que hoje
// cai inteira no catch-all `RoutePlaceholder`). Listagem+filtro+exclusão
// (TASK-FN-FE-01) + formulário create/edit (TASK-FN-FE-02, CBO+máscara
// monetária+campo calculado somente-leitura).
const FuncoesList = lazy(() => import('@/pages/Administrativo/Funcoes'));
const CreateOrUpdateFuncao = lazy(
  () => import('@/pages/Administrativo/Funcoes/CreateOrUpdateFuncao')
);

// ---- Privado: Administrativo — Gestão Pessoal — Eventos (Event, rubrica de
// folha, TASK-FE-EVT-01/02) ----
// Item de menu/permissão JÁ EXISTEM (navigationTree.ts:428, adm-gp-eve,
// navigationPermissions.ts:220, events_view) — esta Tarefa só conecta a rota
// real. Listagem+filtro+exclusão com guarda de dependência (5 tabelas,
// TASK-FE-EVT-01) + formulário único create/edit (TASK-FE-EVT-02), reusado
// também como modo leitura (Eventos-contrato-frontend.md §Leitura do dev).
const EventosList = lazy(() => import('@/pages/Administrativo/Eventos'));
const CreateOrUpdateEvento = lazy(
  () => import('@/pages/Administrativo/Eventos/CreateOrUpdateEvento')
);

// ---- Privado: Administrativo — Gestão Pessoal — Registro de Faltas
// (Absence, 97-Esteiras/003 Tarefas 12/13) ----
// Item de menu (`adm-gp-fal`) e as 4 permissions (`absences_view/create/
// edit/delete`) JÁ EXISTEM (navigationTree.ts:494, navigationPermissions.ts:249,
// permissionsCatalog.json) — esta Tarefa só conecta as rotas reais.
// Listagem+filtro+exclusão (Tarefa 12) + formulário único create/edit
// (Tarefa 13), reusado também como modo leitura (mirror `CreateOrUpdateEvento`).
const AbsencesList = lazy(() => import('@/pages/Administrativo/Faltas'));
const CreateOrUpdateAbsence = lazy(
  () => import('@/pages/Administrativo/Faltas/CreateOrUpdateAbsence')
);

// ---- Privado: Operacional / Pecuária — Inventariado (Inventoried, F-041,
// CORE_WORKSPACE/97-Esteiras/060, TASK-INV-FE-02/04) ----
// Item de menu (`ope-pec-inv`) e a permissão `inventoried-animals_view` JÁ
// EXISTEM (`navigationTree.ts:1442`, `navigationPermissions.ts:406`) — esta
// Tarefa só conecta as 2 rotas reais (o menu apontava para uma rota
// inexistente até aqui, erro recorrente de "esquecer o wiring de rota").
// Listagem (S1, TASK-INV-FE-02) + Detalhe read-only (S3, TASK-INV-FE-04).
// SEM formulário de criar/editar — feature sem `_edit` (SR-06 do legado).
const InventariadoList = lazy(() => import('@/pages/Operacional/Inventariado'));
const InventariadoDetalhe = lazy(
  () => import('@/pages/Operacional/Inventariado/InventariadoDetalhe')
);

// ---- Privado: Operacional / Reprodução — Estação de Monta (BreedingSeason,
// 97-Esteiras/003 Tarefas 12/13) ----
// Item de menu (`ope-pec-rep`) e as 4 permissions (`breeding-seasons_view/
// create/edit/delete`) JÁ EXISTEM (`navigationTree.ts:725`,
// `navigationPermissions.ts:270`) — esta Tarefa só conecta as rotas reais.
// Primeira rota real do submódulo "Reprodução" — a rota-raiz
// `/operacional/reproducao` mapeia direto para esta feature
// (`GAP-ESTACAOMONTA-FE-02`, decisão do dono). Listagem+filtro+exclusão+
// Detalhe (Tarefa 12) + formulário único create/edit (Tarefa 13).
const EstacaoDeMontaList = lazy(() => import('@/pages/Operacional/Reproducao/EstacaoDeMonta'));
const EstacaoDeMontaDetalhe = lazy(
  () => import('@/pages/Operacional/Reproducao/EstacaoDeMonta/EstacaoDeMontaDetalhe')
);
const CreateOrUpdateEstacaoDeMonta = lazy(
  () => import('@/pages/Operacional/Reproducao/EstacaoDeMonta/CreateOrUpdateEstacaoDeMonta')
);

// ---- Privado: Operacional / Reprodução — Touros/Sêmen/Embrião
// (BullSeedSeason, 97-Esteiras/005 Tarefas 24/25) ----
// Item de menu FILHO NOVO (`ope-pec-rep-bss`, `GAP-BSS-FE-01`) do item-pai
// já existente `ope-pec-rep` (que continua indo para Estação de Monta, sem
// mudança). Fundação + Listagem + Detalhe (Tarefa 24) + formulário único de
// criação/edição com os 2 subcadastros dinâmicos (Tarefa 25).
const BullSeedSeasonList = lazy(() => import('@/pages/Operacional/Reproducao/BullSeedSeason'));
const BullSeedSeasonDetalhe = lazy(
  () => import('@/pages/Operacional/Reproducao/BullSeedSeason/BullSeedSeasonDetalhe')
);
const CreateOrUpdateBullSeedSeason = lazy(
  () => import('@/pages/Operacional/Reproducao/BullSeedSeason/CreateOrUpdateBullSeedSeason')
);

// ---- Privado: Operacional / Reprodução — Lotes/Reprodução (BreedingBatch,
// 97-Esteiras/048 Tarefas 04-07) ----
// Item de menu FILHO NOVO (`ope-pec-rep-lb`) do item-pai já existente
// `ope-pec-rep` (que continua indo para Estação de Monta, sem mudança).
// Fundação + Listagem (Tarefas 04/05) + formulário único de criação/edição
// com o subcadastro dinâmico `batches[]` (Tarefa 06) + Detalhe (Tarefa 07).
const LoteReproducaoList = lazy(() => import('@/pages/Operacional/Reproducao/LoteReproducao'));
const LoteReproducaoDetalhe = lazy(
  () => import('@/pages/Operacional/Reproducao/LoteReproducao/LoteReproducaoDetalhe')
);
const CreateOrUpdateLoteReproducao = lazy(
  () => import('@/pages/Operacional/Reproducao/LoteReproducao/CreateOrUpdateLoteReproducao')
);

// ---- Privado: Operacional / Reprodução — Protocolos/Estação (ProtocolSeason,
// F-057, execução 040, TASK-FE-1050..1059) ----
// Item de menu FILHO NOVO (`ope-pec-rep-pse`) do item-pai já existente
// `ope-pec-rep`. Listagem + formulário único de criação/edição com o
// subcadastro dinâmico `items[]` (grid + cascata + preview de timeline) +
// Detalhe (timeline server-side, CAL-007).
const ProtocolSeasonsList = lazy(() => import('@/pages/Operacional/Reproducao/ProtocoloEstacao'));
const ProtocolSeasonDetalhe = lazy(
  () => import('@/pages/Operacional/Reproducao/ProtocoloEstacao/ProtocolSeasonDetalhe')
);
const CreateOrUpdateProtocolSeason = lazy(
  () => import('@/pages/Operacional/Reproducao/ProtocoloEstacao/CreateOrUpdateProtocolSeason')
);

// ---- Privado: Operacional / Reprodução — Acasalamento (BreedingMating +
// Diagnóstico de Gestação, TASK-BM-FE-09, contrato-tela-lane-b-breeding-
// mating-frontend.md §3/§9) ----
// Item de menu FILHO NOVO (`ope-pec-rep-bm`) do item-pai já existente
// `ope-pec-rep` (que continua indo para Estação de Monta, sem mudança).
// Diagnóstico de Gestação NÃO ganha item de menu próprio (OWN-DEC-001) —
// alcançado somente por dentro das telas de Acasalamento. Listagem +
// formulário único create/edit + Próxima Etapa + Detalhe (Acasalamento) +
// listagem + criação + Detalhe (Diagnóstico de Gestação).
const AcasalamentoList = lazy(() => import('@/pages/Operacional/Reproducao/Acasalamento'));
const CreateOrUpdateAcasalamento = lazy(
  () => import('@/pages/Operacional/Reproducao/Acasalamento/CreateOrUpdateAcasalamento')
);
const AcasalamentoProximaEtapa = lazy(
  () => import('@/pages/Operacional/Reproducao/Acasalamento/AcasalamentoProximaEtapa')
);
const AcasalamentoDetalhe = lazy(
  () => import('@/pages/Operacional/Reproducao/Acasalamento/AcasalamentoDetalhe')
);
const CreateDiagnosticoGestacao = lazy(
  () =>
    import('@/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/CreateDiagnosticoGestacao')
);
const DiagnosticoGestacaoDetalhe = lazy(
  () =>
    import('@/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/DiagnosticoGestacaoDetalhe')
);
const DiagnosticoGestacaoList = lazy(
  () => import('@/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao')
);

// ---- Privado: Operacional / Agricultura — Colheita de Frutas
// (HarvestProduct, F-040, execução 040, TASK-FE-1092..1101) ----
// Item de menu FILHO NOVO (`ope-agr-col`) do grupo já existente
// `ope-agricultura`, ao lado de "Romaneios"/"Marcação". Listagem + formulário
// único de criação/edição com subcadastro dinâmico `boxes[]` (grid
// `useFieldArray`) + Detalhe (aba única "Caixas").
const HarvestProductsList = lazy(() => import('@/pages/Operacional/HarvestProduct'));
const HarvestProductDetalhe = lazy(
  () => import('@/pages/Operacional/HarvestProduct/HarvestProductDetalhe')
);
const CreateOrUpdateHarvestProduct = lazy(
  () => import('@/pages/Operacional/HarvestProduct/CreateOrUpdateHarvestProduct')
);

// ---- Privado: Operacional / Reprodução — Gerenciamento Avançado
// (AdvancedReproductive, F-011, 97-Esteiras/056 TASK-AR-FE-03) ----
// Item de menu FILHO NOVO (`ope-pec-rep-adv`) do item-pai já existente
// `ope-pec-rep` (que continua indo para Estação de Monta, sem mudança).
// Tela 100% leitura (sem `/nova`, sem `/:uuid`, sem `/:uuid/editar`).
const GerenciamentoAvancadoList = lazy(
  () => import('@/pages/Operacional/Reproducao/GerenciamentoAvancado')
);

// ---- Privado: Operacional / Pecuária — Evolução/Rebanho (Evolution,
// Tarefa 26, spa-contract-evolucao-rebanho.md §4) — 100% somente-leitura,
// item de menu FILHO NOVO (`ope-pec-tra-evo`) do item-pai já existente
// `ope-pec-tra` ("Transferências", que continua indo para a mesma rota de
// sempre, sem mudança). ----
const EvolutionsList = lazy(() => import('@/pages/Operacional/Evolutions'));

// ---- Privado: Operacional / Pecuária — Transferência Animais/Lote
// (BatchTransfer, feature `426be835`, Tarefas 26/27,
// frontend-contract-animais-lote.md §3) — item de menu FILHO NOVO
// (`ope-pec-tra-anl`) do item-pai já existente `ope-pec-tra`
// ("Transferências", que continua indo para a mesma rota de sempre, sem
// mudança). Listagem de animais elegíveis (Tarefa 26) + formulário de nova
// transferência (Tarefa 27). Sem rota de edição/detalhe/exclusão — a rota
// web legada é `->only(['index','create','store'])`. ----
const BatchTransfersList = lazy(() => import('@/pages/Operacional/BatchTransfers'));
const CreateBatchTransfer = lazy(
  () => import('@/pages/Operacional/BatchTransfers/CreateBatchTransfer')
);

// ---- Privado: Operacional / Pecuária — Dieta (Diet, TASK-FE-DIET-07) ----
// 3 rotas REAIS de Dieta (listagem, criar, editar) + 3 rotas REAIS de Batida
// (DietBeat), mirror EXATO do bloco Food/FoodBeat em
// `/administrativo/fabrica*`. Item de menu (`ope-pec-die`) e as 8
// permissions (`diets_view/create/edit/delete`, `diet-beats_view/create/
// edit/delete`) — slugs JÁ EXISTEM em `permissionsCatalog.json:299-310`
// (reuso exato, DEC-006, nenhum cunhado); item de menu conectado nesta
// mesma Tarefa em `navigationTree.ts`/`navigationPermissions.ts`
// (GAP-DIET-FE-02, default Operacional/Pecuária).
const DietList = lazy(() => import('@/pages/Operacional/Diet'));
const CreateOrUpdateDiet = lazy(() => import('@/pages/Operacional/Diet/CreateOrUpdateDiet'));
// ---- Privado: Operacional / Pecuária/Confinamento — Fases de Alimentação
// (FeedingPhase, F-034, TASK-FP-FE-04): 3 rotas REAIS (listagem, criar,
// editar), mirror EXATO do bloco Dieta acima. Sem rota `show` dedicada
// (contrato de tela §2 nota SURF-SHOW — mesma tela em modo read-only).
const FeedingPhaseList = lazy(() => import('@/pages/Operacional/FeedingPhase'));
const CreateOrUpdateFeedingPhase = lazy(
  () => import('@/pages/Operacional/FeedingPhase/CreateOrUpdateFeedingPhase')
);
const DietBeatList = lazy(() => import('@/pages/Operacional/Diet/DietBeat'));
const CreateOrUpdateDietBeat = lazy(
  () => import('@/pages/Operacional/Diet/DietBeat/CreateOrUpdateDietBeat')
);

// ---- Privado: Operacional / Confinamento — Pátio (FeedlotYard,
// TASK-PT-FE-01/02, execução 046) ----
// Item de menu (`ope-pec-die-pat`) conectado nesta mesma Tarefa em
// `navigationTree.ts`/`navigationPermissions.ts`, 3º filho do grupo
// `ope-pec-conf` ("Confinamento"), ao lado de Dietas/Batidas. 4 permissions
// (`feedlot-yards_view/create/edit/delete`) reuso 100% dos slugs legados
// (DEC-006 já aplicada na camada `api`) — nenhuma permissão nova.
const FeedlotYardList = lazy(() => import('@/pages/Operacional/FeedlotYards'));
const CreateOrUpdateFeedlotYard = lazy(
  () => import('@/pages/Operacional/FeedlotYards/CreateOrUpdateFeedlotYard')
);
const DetalheFeedlotYard = lazy(
  () => import('@/pages/Operacional/FeedlotYards/DetalheFeedlotYard')
);

// ---- Privado: Operacional / Confinamento — Setor (FeedlotSector,
// TASK-FS-FE-01/02) ----
// Item de menu (`ope-pec-die-set`) conectado nesta mesma Tarefa em
// `navigationTree.ts`/`navigationPermissions.ts`, 4º filho do grupo
// `ope-pec-conf` ("Confinamento"), ao lado de Dietas/Batidas/Pátios. 4
// permissions (`feedlot-sectors_view/create/edit/delete`) reuso 100% dos
// slugs legados — nenhuma permissão nova.
const FeedlotSectorList = lazy(() => import('@/pages/Operacional/FeedlotSectors'));
const CreateOrUpdateFeedlotSector = lazy(
  () => import('@/pages/Operacional/FeedlotSectors/CreateOrUpdateFeedlotSector')
);
const DetalheFeedlotSector = lazy(
  () => import('@/pages/Operacional/FeedlotSectors/DetalheFeedlotSector')
);

// ---- Privado: Operacional / Confinamento — Curral standalone
// (FeedlotCorral, F-035, lote 043, TASK-043-CUR-T01 — fundação): 5 rotas
// REAIS (listagem, criar, editar, detalhe, histórico), declaradas ANTES do
// catch-all /operacional/* para vencerem o RoutePlaceholder, mirror do
// bloco Setor acima. CASCA MÍNIMA nesta Tarefa — T02/T03/T07/T09
// substituem cada página por inteiro. `feedlotCorral-service`/
// `FeedlotCorralForm`/`FeedlotCorralDialog` do Mapa ficam INTOCADOS.
const FeedlotCorralList = lazy(() => import('@/pages/Operacional/FeedlotCorrals'));
const CreateOrUpdateFeedlotCorral = lazy(
  () => import('@/pages/Operacional/FeedlotCorrals/CreateOrUpdateFeedlotCorral')
);
const DetalheFeedlotCorral = lazy(
  () => import('@/pages/Operacional/FeedlotCorrals/DetalheFeedlotCorral')
);
const HistoricoFeedlotCorral = lazy(() => import('@/pages/Operacional/FeedlotCorrals/Historico'));

// ---- Privado: Operacional / Confinamento — Mapa de Confinamento
// (FeedlotMap, TASK-FE-042-200, execução 042): rota ÚNICA (árvore completa,
// sem CRUD paginado próprio — reusa services de Pátio/Setor/Curral/Rua via
// diálogos), guardada por `feedlot-map_view`. ---
const FeedlotMapDashboard = lazy(() => import('@/pages/Operacional/FeedlotMapDashboard'));

// ---- Privado: Administrativo — Gestão Pessoal — Funcionário x Eventos
// (EmployeeEvent, TASK-FE-FXE-01/02) ----
// Item de menu (`adm-gp-fxe`) e as 4 permissions (`employeeevents_view/
// create/edit/delete`) JÁ EXISTEM (navigationTree.ts:434,
// navigationPermissions.ts:226, permissionsCatalog.json:339-342) — esta
// Tarefa só conecta as 2 rotas reais. DA-EE-FE-01 (INVIOLÁVEL): 2 telas —
// Tela 1 picker de Funcionários (TASK-FE-FXE-01) + Tela 2 Matriz de
// Vínculos por funcionário via `sync` (TASK-FE-FXE-02). SEM rota `/novo`/
// CRUD unitário de vínculo isolado.
const FuncionarioXEventosList = lazy(() => import('@/pages/Administrativo/FuncionarioXEventos'));
const MatrizVinculosFuncionario = lazy(
  () => import('@/pages/Administrativo/FuncionarioXEventos/MatrizVinculosFuncionario')
);

// ---- Privado: Administrativo — Gestão Pessoal — Equipes (Team, equipe de
// fazenda, TASK-EQ-FE-01/02/03) ----
// Item de menu/permissão JÁ EXISTEM (navigationTree.ts:450, adm-gp-equ,
// navigationPermissions.ts:233, teams_view) — a listagem real (TASK-EQ-FE-01)
// já estava conectada; esta Tarefa (TASK-EQ-FE-02) ativa o formulário
// criar/editar/visualizar (`CreateOrUpdateEquipe`) nas 2 rotas RESERVADAS
// pela Tarefa irmã (posição já documentada abaixo — `/novo` ANTES de
// `/:teamUuid`, senão "novo" seria capturado como UUID).
const EquipesList = lazy(() => import('@/pages/Administrativo/Equipes'));
const CreateOrUpdateEquipe = lazy(
  () => import('@/pages/Administrativo/Equipes/CreateOrUpdateEquipe')
);

// ---- Privado: Administrativo — Suprimentos — Solicitação de Compras
// (RequestPurchase, TASK-RP-FE-08/09/10) ----
// Listagem real (TASK-RP-FE-08) + formulário create/edit real
// (TASK-RP-FE-09) + roteamento (TASK-RP-FE-10). Item de menu
// (`adm-sup-sol`) e permissão (`request-purchases_view`) JÁ EXISTEM
// (navigationTree.ts:390, navigationPermissions.ts:180) — esta Tarefa
// só conecta as 3 rotas reais. `/novo` vem ANTES de `/:requestPurchaseId`
// para não ser capturado como GUID, mesmo padrão de Armazéns/Raças.
const SolicitacaoList = lazy(() => import('@/pages/Administrativo/Solicitacao'));
// "Meus Processos" (RequestPurchase, TASK-RP-FE-13, esteira 037) — reusa a
// MESMA entidade RequestPurchase, filtrada server-side por `responsible_id =
// auth()->id()` (`GET /request-purchases/my-processes`), fonte/queryKey/
// storageKey próprias (ver cabeçalho do arquivo). Item de menu (`adm-sup-meu`)
// e permissão (`request-purchases_view`) JÁ EXISTEM/JÁ CORRETOS
// (navigationTree.ts:448, navigationPermissions.ts:222) — nenhuma alteração
// neles, só a rota estava faltando.
const MeusProcessosList = lazy(() => import('@/pages/Administrativo/MeusProcessos'));
// "Rejeitados / Cancelados" (RequestPurchase, TASK-RP-FE-13, esteira 037) —
// idem acima, consumindo `listRejectedRequestPurchases` (`status IN (5,10)`,
// `GET /request-purchases/rejected`). Permissão (`adm-sup-rej`) CORRIGIDA
// nesta Tarefa de `rejected-requests_view` (slug legado) para
// `request-purchases_view` (GAP-UX-CPS-01); VOLTA a `rejected-requests_view`
// (legado + API, T-081-API-03; execução 081, T-081-FE-02).
const RejeitadosList = lazy(() => import('@/pages/Administrativo/Rejeitados'));
// Hub tenant-wide "Cotações" (TASK-CQ-FE-13) — reusa a MESMA entidade
// RequestPurchase, fonte/queryKey/storageKey próprias (ver cabeçalho do
// arquivo). Item de menu (`adm-sup-cot`) e permissão (`request-quotation_view`)
// JÁ EXISTEM (navigationTree.ts:451, navigationPermissions.ts:225).
const CotacoesList = lazy(() => import('@/pages/Administrativo/Cotacoes'));
const CreateOrUpdateSolicitacao = lazy(
  () => import('@/pages/Administrativo/Solicitacao/CreateOrUpdateSolicitacao')
);
// Hub tenant-wide "Compras" (fila `in-purchase`, `status IN (6,7,10)`,
// TASK-CPS-FE-02, esteira 036) — mesma entidade RequestPurchase, fonte/
// queryKey/storageKey próprias (ver cabeçalho do arquivo). Item de menu
// (`adm-sup-com`) e permissão (`request-buy_view`, igual ao legado e à API —
// T-081-API-03; supera o GAP-UX-CPS-01, execução 081, T-081-FE-02).
const ComprasList = lazy(() => import('@/pages/Administrativo/Compras'));
// Hub tenant-wide "Autorização" (TASK-AUTH-FE-02, esteira 038) — reusa a
// MESMA entidade RequestPurchase, `GET /request-authorizations`, filtro de
// negócio `status IN (3,4,11)` (BR-01), fonte/queryKey/storageKey próprias
// (ver cabeçalho do arquivo). Item de menu (`adm-sup-aut`) e permissão
// (`request-authorization_view`) JÁ EXISTEM (navigationTree.ts:452,
// navigationPermissions.ts:236) — esta Tarefa só conecta a rota real.
const AutorizacaoList = lazy(() => import('@/pages/Administrativo/Autorizacao'));
// Tela de detalhe única "Autorizar Solicitação" (TASK-AUTH-FE-03, esteira
// 038) — container que decide o ramo (1º nível, ciência/2º nível em
// TASK-AUTH-FE-04, ou fallback readonly) via `authorization_context`, fonte
// única de verdade server-side. Mesma permissão de leitura da listagem
// (`request-authorization_view`) — mutações são gateadas no backend por
// `request-authorization_edit`, o front só some/desabilita os botões.
const AutorizarSolicitacao = lazy(
  () => import('@/pages/Administrativo/Autorizacao/AutorizarSolicitacao')
);

// ---- Privado: Administrativo — Suprimentos — Recebimentos (RequestReceipt,
// TASK-RCB-FE-00..04, esteira 040) ----
// Hub tenant-wide de edit-flows sobre a MESMA entidade RequestPurchase
// (mirror `/administrativo/compras`/`/administrativo/autorizacao` acima) —
// listagem + 3 telas de escrita (Confirmar Recebimento / Gerar Financeiro /
// Finalizar Pedido), consumindo `/api/v1/request-receipts*`. Sem
// create/destroy — é um hub de ação de linha (Voltar Etapa/Receber/
// Transferir/Visualizar/SLA são boundary reuse de `request-purchases/*`,
// construídos na própria listagem). Permissões `request-receipts_view`/
// `request-receipts_edit`/`request-purchases_financial` JÁ EXISTEM no
// `PermissionTree` (slugs legados preservados, ver arquitetura-api-
// recebimentos.md §2/CLM-49) — esta Tarefa só conecta as rotas reais.
const RecebimentosList = lazy(() => import('@/pages/Administrativo/Recebimentos'));
const ConfirmarRecebimentoPage = lazy(
  () => import('@/pages/Administrativo/Recebimentos/ConfirmarRecebimentoPage')
);
const GerarFinanceiroPage = lazy(
  () => import('@/pages/Administrativo/Recebimentos/GerarFinanceiroPage')
);
const FinalizarPedidoPage = lazy(
  () => import('@/pages/Administrativo/Recebimentos/FinalizarPedidoPage')
);

// ---- Privado: Administrativo — Estoque — Saldo de Estoque (Stock, TASK-STK-FE-01) ----
// Listagem+filtro real (TASK-STK-FE-01), 100% leitura (sem create/update/
// delete — Stock nunca foi CRUD, `Stock-contrato.md ## 0`). Item de menu
// (`adm-est-sal`) e permissão (`stocks_view`) JÁ EXISTEM (navigationTree.ts:422,
// navigationPermissions.ts) — esta Tarefa só conecta a rota real. Detalhe
// (`/detalhe`) e Relatório/Export (`/relatorio`) são TASK-STK-FE-02/03, fora
// do escopo desta Tarefa — a navegação da Listagem para eles já fica correta,
// as rotas de destino são adicionadas depois.
const SaldoEstoqueList = lazy(() => import('@/pages/Administrativo/SaldoEstoque'));
// Detalhe agrupado (TASK-STK-FE-02) — 100% leitura, rota por querystring de
// 2 UUIDs (`DA-STK-04`, `?product_uuid=&warehouse_uuid=`), sem path-param.
const SaldoEstoqueDetalhe = lazy(
  () => import('@/pages/Administrativo/SaldoEstoque/SaldoEstoqueDetalhe')
);
// Relatório/Export (TASK-STK-FE-03) — mesmos filtros da Listagem, botão
// "Gerar prévia" (`GET /stocks`) + 2 exports desabilitados até haver prévia
// (`GET /stocks/report` PDF, `GET /stocks/export` XLSX).
const SaldoEstoqueRelatorio = lazy(
  () => import('@/pages/Administrativo/SaldoEstoque/SaldoEstoqueRelatorio')
);

// ---- Privado: Administrativo — Estoque — Correção de Estoque
// (StockCorrection, TASK-FE-COR-01/02) ----
// Listagem + filtro por período + importação de planilha + exclusão
// reforçada (TASK-FE-COR-01) e detalhe read-only (TASK-FE-COR-02). Item de
// menu (`adm-est-cor`) e as 3 permissions (`stock-corrections_view/create/
// delete`) JÁ EXISTEM (navigationTree.ts:419, navigationPermissions.ts:215,
// permissionsCatalog.json:868-870) — esta Tarefa só conecta as rotas reais.
// Sem rota de formulário — não existe cadastro/edição unitária (contrato de
// API §1), o único ponto de criação é a importação de planilha.
const CorrecaoEstoqueList = lazy(() => import('@/pages/Administrativo/CorrecaoEstoque'));
const CorrecaoEstoqueDetalhe = lazy(
  () => import('@/pages/Administrativo/CorrecaoEstoque/CorrecaoEstoqueDetalhe')
);

// ---- Privado: Administrativo — Baixa de Estoque (StockWriteoff, esteira
// 038) ----
// Listagem + filtro por período + exclusão (TASK-FE-3001/3002), detalhe
// read-only (TASK-FE-3003), form de criação (TASK-FE-3004, `/nova`) e
// relatório PDF (TASK-FE-3005, `/relatorio`). Item de menu (`adm-est-bai`) e
// as 3 permissions (`stock-writeoffs_view/create/delete`) JÁ EXISTEM
// (navigationTree.ts:472, navigationPermissions.ts:252,
// permissionsCatalog.json:879-882) — nenhuma alteração nelas. A Baixa NÃO
// TEM edição (`apiResource(...)->only([index,store,show,destroy])`,
// contrato de tela §2.1) — sem rota `/:uuid/editar`. `/relatorio` é
// guardada por `stock_writeoffs_report` (underscore, nome distinto das
// demais permissões `stock-writeoffs_*`).
const BaixaEstoqueList = lazy(() => import('@/pages/Administrativo/BaixaEstoque'));
const BaixaEstoqueDetalhe = lazy(
  () => import('@/pages/Administrativo/BaixaEstoque/BaixaEstoqueDetalhe')
);
const CreateBaixaEstoque = lazy(
  () => import('@/pages/Administrativo/BaixaEstoque/CreateBaixaEstoque')
);
const BaixaEstoqueReport = lazy(
  () => import('@/pages/Administrativo/BaixaEstoque/BaixaEstoqueReport')
);

// ---- Privado: Administrativo — Suprimentos — Parâmetros SLA
// (SupplyStatusSla, TASK-FE-SLA-01) ----
// 1 rota REAL (listagem sempre-visível com edição inline de `max_hours`,
// sem tela de detalhe/formulário separada — DEC-D do contrato de API). Item
// de menu (`adm-sup-sla`) e permissão (`supply-status-sla_view`) JÁ EXISTEM
// (navigationTree.ts:402, navigationPermissions.ts:202) — esta Tarefa só
// conecta a rota real. Sem `/novo` nem `/:uuid` — não existem.
const SlaList = lazy(() => import('@/pages/Administrativo/Sla'));
// Logs do Sistema (execução 079) — Gestor_Plataf.
const SystemLogsExplorer = lazy(() => import('@/pages/Administrativo/SystemLogs'));
const SystemLogViewer = lazy(() => import('@/pages/Administrativo/SystemLogs/SystemLogViewer'));

// ---- Privado: Administrativo — Atividades Recentes (UT-000690 / F-349) ----
// Listagem somente leitura, guardada por `recent-activities_view`, declarada
// ANTES do catch-all /administrativo/* para vencer o RoutePlaceholder.
const RecentActivitiesList = lazy(() => import('@/pages/Administrativo/AtividadesRecentes'));

// ---- Privado: Administrativo — Fábrica — Formulação (Food, TASK-FOOD-FE-05/06/07) ----
// 3 rotas REAIS (listagem, criar, editar), declaradas ANTES do catch-all
// /administrativo/* para vencerem o RoutePlaceholder. Item de menu
// (`adm-est-fab`, "Fábrica") e permissão (`anyOf` de `food_*`/`food-beat_*`)
// JÁ EXISTEM (navigationTree.ts:429, navigationPermissions.ts:222) — esta
// Tarefa só conecta o `lazy(() => import(...))` real, mirror exato do
// padrão já usado por `SaldoEstoque`/`Solicitacao`/`Sla` (item de menu e
// permissão já existiam antes da tela). `FoodBeat` (Batida) ainda não tem
// Tarefa de front — esta Tarefa entrega só Food ocupando
// `/administrativo/fabrica` diretamente.
const FoodList = lazy(() => import('@/pages/Administrativo/Fabrica'));
const CreateOrUpdateFood = lazy(() => import('@/pages/Administrativo/Fabrica/CreateOrUpdateFood'));

// ---- Privado: Administrativo — Fábrica — Batida (FoodBeat, TASK-FB-FE-05/06/07) ----
// 3 rotas REAIS (listagem, criar, editar), declaradas ANTES do catch-all
// /administrativo/* para vencerem o RoutePlaceholder, mirror EXATO do bloco
// Food acima. Item de menu (`adm-est-fab`) e permissão (`anyOf` incluindo
// `food-beat_*`) JÁ EXISTIAM (preparados desde TASK-FOOD-FE-01) — esta
// Tarefa só conecta as rotas reais. Path-base `/administrativo/fabrica/batidas`
// (segmento fixo, não colide com `/administrativo/fabrica/:foodId` de Food).
// `/novo` (não "/nova") — mirror EXATO do padrão já usado por Food
// (`/administrativo/fabrica/novo`) e já referenciado pela própria listagem
// de Batida (`FoodBeat/index.tsx`, `navigate('/administrativo/fabrica/batidas/novo')`,
// TASK-FB-FE-05 ✅) — confirmado por leitura direta do código já entregue.
const FoodBeatList = lazy(() => import('@/pages/Administrativo/Fabrica/FoodBeat'));
const CreateOrUpdateFoodBeat = lazy(
  () => import('@/pages/Administrativo/Fabrica/FoodBeat/CreateOrUpdateFoodBeat')
);

// ---- Privado: Administrativo — Estoque — Trans. Armazém (WarehouseTransfer,
// TASK-WT-FE-02/TASK-WT-FE-03) ----
// Listagem (TASK-WT-FE-02) + formulário de CRIAÇÃO em lote (TASK-WT-FE-03),
// declaradas ANTES do catch-all /administrativo/* para vencer o
// RoutePlaceholder, mirror EXATO do bloco Batida acima. Item de menu
// (`adm-est-trm`) e permissão (`warehouse-transfer_view`/`_create`) JÁ
// EXISTIAM (confirmados por leitura direta de `navigationTree.ts`/
// `navigationPermissions.ts`). A rota `/:uuid` (edição) é registrada em
// TASK-WT-FE-04 (edita seu próprio trecho do arquivo — sem conflito).
const WarehouseTransferList = lazy(() => import('@/pages/Administrativo/WarehouseTransfer'));
const CreateWarehouseTransfer = lazy(
  () => import('@/pages/Administrativo/WarehouseTransfer/CreateWarehouseTransfer')
);
// Edição/visualização de 1 linha (TASK-WT-FE-04) — gated por `_view`; o
// botão de submit dentro do form é quem checa `_edit` (mirror `FoodBeat`/`Food`).
const UpdateWarehouseTransfer = lazy(
  () => import('@/pages/Administrativo/WarehouseTransfer/UpdateWarehouseTransfer')
);

// ---- Privado: Administrativo — Estoque — Trans. Fazendas (FarmTransfer,
// Tarefas 01/02/03) ----
// Listagem (Tarefa 01) + detalhe dedicado read-only (Tarefa 01,
// `GAP-FARMTRANSFER-FE-04`) + formulário de CRIAÇÃO em lote com subfluxo
// financeiro opcional (Tarefas 02/03), declaradas ANTES do catch-all
// /administrativo/* para vencer o RoutePlaceholder, mirror EXATO do bloco
// Trans. Armazém acima. Item de menu (`adm-est-trf`) e permissões
// (`warehouse-transfer-farm_view`/`_create`/`_delete`) JÁ EXISTIAM
// (`navigationTree.ts:472`, catálogo reaproveitado da MESMA feature legada
// — ver docblock de `FarmTransferController.php`). NÃO há modo editar
// (`RT-06 NAO_APLICAVEL`) — sem `UpdateFarmTransfer`.
const FarmTransferList = lazy(() => import('@/pages/Administrativo/FarmTransfer'));
const CreateFarmTransfer = lazy(
  () => import('@/pages/Administrativo/FarmTransfer/CreateFarmTransfer')
);
const FarmTransferDetalhe = lazy(
  () => import('@/pages/Administrativo/FarmTransfer/FarmTransferDetalhe')
);

// ---- Privado: Administrativo — Estoque — Requisição/Saída (Requisition,
// 97-Esteiras/002, Tarefas 04/05) ----
// Listagem + detalhe dedicado read-only (Tarefa 04, `GAP-REQUISICAO-FE-02`)
// + formulário de CRIAÇÃO em lote (Tarefa 05), declaradas ANTES do
// catch-all /administrativo/* para vencer o RoutePlaceholder, mirror
// ESTRUTURAL do bloco Trans. Fazendas acima. Item de menu (`adm-est-req`) e
// permissão de navegação (`requisitions_view`) JÁ EXISTIAM
// (`navigationTree.ts:468`). NÃO há modo editar (`MM-02`/`RT-06`
// `NAO_APLICAVEL`) — sem `UpdateRequisition`. A Tarefa 06 (fluxo de
// assinatura) reusa as MESMAS rotas de listagem/detalhe — nenhuma rota nova
// para ela.
const RequisitionList = lazy(() => import('@/pages/Administrativo/Requisition'));
const CreateRequisition = lazy(
  () => import('@/pages/Administrativo/Requisition/CreateRequisition')
);
const RequisitionDetalhe = lazy(
  () => import('@/pages/Administrativo/Requisition/RequisitionDetalhe')
);

// ---- Privado: Administrativo — Estoque — Devolução/Entrada (Devolution,
// 97-Esteiras/037) ----
// Listagem + criação em lote (multi-item) + tela única de visualização/
// edição (`FID-11`), declaradas ANTES do catch-all /administrativo/* para
// vencer o RoutePlaceholder, mirror ESTRUTURAL do bloco Requisição/Saída
// acima. Item de menu (`adm-est-dev`) e permissões de navegação
// (`devolution_*`, SINGULAR) JÁ EXISTIAM (`navigationPermissions.ts:253`).
const DevolucaoList = lazy(() => import('@/pages/Administrativo/Devolucao'));
const CreateDevolucao = lazy(() => import('@/pages/Administrativo/Devolucao/CreateDevolucao'));
const UpdateDevolucao = lazy(() => import('@/pages/Administrativo/Devolucao/UpdateDevolucao'));

// ---- Privado: Administrativo — Estoque — Entrada de Insumos (InputEntry,
// esteira 037) ----
// Listagem + tela única de criação/visualização/edição em lote multi-item +
// baixa financeira automática, declaradas ANTES do catch-all
// /administrativo/* para vencer o RoutePlaceholder, mirror ESTRUTURAL do
// bloco Devolução/Entrada acima. Item de menu (`adm-est-eis`) e permissão
// de navegação (`input_entries_view`) são NOVOS (GAP de menu achado no
// roteiro — `adm-est-dfe` é o módulo Invoice/NFe, feature diferente).
const EntradaInsumosList = lazy(() => import('@/pages/Administrativo/EntradaInsumos'));
const CreateOrUpdateEntradaInsumos = lazy(
  () => import('@/pages/Administrativo/EntradaInsumos/CreateOrUpdateEntradaInsumos')
);
// Correção de reprovação AD F-084 (Execução 063) — tela de DETALHE
// (somente leitura), mirror `ProdutoDetalhe`/`DetalheCentroCusto`. Antes
// desta Tarefa não existia: `/administrativo/entrada-insumos/:uuid` abria
// SEMPRE a edição.
const DetalheEntradaInsumos = lazy(
  () => import('@/pages/Administrativo/EntradaInsumos/DetalheEntradaInsumos')
);

// ---- Privado: Financeiro — Gestão de Contratos (Contract, TASK-CTR-FE-07/08/09) ----
// Listagem real (TASK-CTR-FE-07) + formulário create/edit real
// (TASK-CTR-FE-08) + roteamento (TASK-CTR-FE-09). Item de menu
// (`fin-con`) e permissão (`contracts_view`) JÁ EXISTEM
// (navigationTree.ts:580, navigationPermissions.ts:233) — esta Tarefa
// só conecta as 3 rotas reais. `/novo` vem ANTES de `/:contractId`
// para não ser capturado como GUID, mesmo padrão de Solicitação/Armazéns/Raças.
const ContratoList = lazy(() => import('@/pages/Financeiro/Contrato'));
const CreateOrUpdateContrato = lazy(
  () => import('@/pages/Financeiro/Contrato/CreateOrUpdateContrato')
);

// ---- Privado: Fiscal — NFe Emitidas (Nfe, execução 036) ----
// Listagem real (TASK-FE-036-403) + formulário create/edit (TASK-FE-036-404/
// 405) + detalhe view-only (TASK-FE-036-406). Item de menu (fis-nfe-emi) e
// permissão de navegação (`nfe_view`) JÁ EXISTIAM (navigationTree.ts:715/
// navigationPermissions.ts:269) — esta Tarefa só conecta as rotas reais.
const NfesList = lazy(() => import('@/pages/Fiscal/NfeEmitidas'));
const CreateOrUpdateNfe = lazy(() => import('@/pages/Fiscal/NfeEmitidas/CreateOrUpdateNfe'));
const NfeDetalhe = lazy(() => import('@/pages/Fiscal/NfeEmitidas/NfeDetalhe'));

// Fiscal — DFe Recebidas (Dfe, execução 044, TASK-DFE-FE-05/07/08/09/10/11).
// Grid+filtro+manifestação+toggles (index), "Buscar DFe" (sync), Relatório
// PDF/Excel e Vínculo de Retorno (`DfeReturnLinking`, TASK-DFE-FE-09) — as 4
// rotas do contrato agora completas. Lançamentos cross-módulo Produto/Animal
// (TASK-DFE-FE-08) chamam `parseInvoiceXml`/`importMovementPurchaseXml`
// direto de `Fiscal/Dfe/index.tsx` (sem rota própria); Despesa permanece
// oculta (Gap `[PARA ANÁLISE]`, ver cabeçalho de `Fiscal/Dfe/index.tsx`).
const DfeRecebidasList = lazy(() => import('@/pages/Fiscal/Dfe'));
const BuscarDfe = lazy(() => import('@/pages/Fiscal/Dfe/BuscarDfe'));
const DfeReport = lazy(() => import('@/pages/Fiscal/Dfe/DfeReport'));
const DfeReturnLinking = lazy(() => import('@/pages/Fiscal/Dfe/DfeReturnLinking'));

// Fiscal — CT-e (Cte, execução 045). Listagem (grid+filtro) + formulário
// create/edit único (`CreateOrUpdateCte`, `useParams<{ id }>` decide o modo
// via `isValidGuid`). Item de menu pré-existente (`fis-cte-lis`/
// `fis-cte-nov`, navigationTree.ts) apontava para path placeholder
// (`/fiscal/cte-lista`/`/fiscal/cte-nova`) anterior à tela real — corrigido
// abaixo para as rotas REAIS (mesmo racional da correção DFe acima).
const CtesList = lazy(() => import('@/pages/Fiscal/Cte'));
const CreateOrUpdateCte = lazy(() => import('@/pages/Fiscal/Cte/CreateOrUpdateCte'));

// Fiscal — CT-e emissão SEFAZ (CteEmissao, TASK-CTE-FE-14, Onda 2). Tela
// dedicada de emissão/transmissão/correção/cancelamento — todas as 8 rotas
// do `CteEmissaoController` (inclusive `show`) exigem a tela por `cte_view`;
// as ações dentro dela são gateadas por cte_edit (emitir/CC-e) e cte_delete (cancelar).
const CteEmissao = lazy(() => import('@/pages/Fiscal/Cte/CteEmissao'));

// Fiscal — CT-e manifestação (CteManifestacao, TASK-CTE-FE-14, Onda 2).
// `CteManifestacaoController::middleware()` exige `permission:cte_manifest`
// em todas as rotas, inclusive `index` (listagem).
const CteManifestacao = lazy(() => import('@/pages/Fiscal/CteManifestacao'));

// Fiscal — MDF-e (Mdfe, execução 045). Listagem + formulário create/edit
// único + "MDFe Não Encerrados" (consulta separada, TASK-MDFE-FE-06). Item
// de menu (`fis-mdf-lis`/`fis-mdf-nov`) JÁ EXISTIA com os paths corretos.
const MdfesList = lazy(() => import('@/pages/Fiscal/Mdfe'));
const CreateOrUpdateMdfe = lazy(() => import('@/pages/Fiscal/Mdfe/CreateOrUpdateMdfe'));
const MdfeNaoEncerrados = lazy(() => import('@/pages/Fiscal/Mdfe/MdfeNaoEncerrados'));
// TASK-MDFE-FE-09 (Onda 2) — Detalhe/Emissão SEFAZ, mirror `NfeDetalhe`.
// Substitui `CreateOrUpdateMdfe` (Onda 1) como destino de `/visualizar`.
const MdfeDetalhe = lazy(() => import('@/pages/Fiscal/Mdfe/MdfeDetalhe'));

// Fiscal — Livro Caixa/LCDPR (CashBook, execução 045, SEM dashboard —
// excluído desta Tarefa). Listagem + criação + detalhe view-only
// (`CashBookDetalhe`). Item de menu pré-existente (`fis-lcd`) apontava para
// path placeholder (`/fiscal/lcdpr`) — corrigido abaixo para a rota REAL
// (mesmo racional da correção DFe/CTe).
const CashBookList = lazy(() => import('@/pages/Fiscal/CashBook'));
const CreateCashBook = lazy(() => import('@/pages/Fiscal/CashBook/CreateCashBook'));
const CashBookDetalhe = lazy(() => import('@/pages/Fiscal/CashBook/CashBookDetalhe'));

// Fiscal — Arquivos XML (F-133, Gestão Fiscal, esteira 97-Esteiras/008,
// Tarefa 36). Item de menu (`fis-nfe-xml`) e permissão de navegação
// (`xml_view`) JÁ EXISTIAM — esta Tarefa só conecta a rota real.
const ArquivosXml = lazy(() => import('@/pages/Fiscal/ArquivosXml'));

// ---- Privado: Dashboards — Análise de Usuários (execução 046, TASK-UA-FE-08
// — 1ª da fila de rota, CHK-1, ordem UA → LC → AT → ABC) ----
const DashboardUserAnalysis = lazy(() => import('@/pages/Dashboards/UserAnalysis'));

// ---- Privado: Dashboards — Lotação de Currais (execução 046, TASK-LC-FE-09
// — 2ª da fila de rota, CHK-1) ----
const DashboardFeedlot = lazy(() => import('@/pages/Dashboards/FeedlotDashboard'));

// ---- Privado: Dashboards — Ativos (execução 046, TASK-AT-FE-09 — 3ª da
// fila de rota, CHK-1) ----
const DashboardAssets = lazy(() => import('@/pages/Dashboards/AssetsDashboard'));

// ---- Privado: Dashboards — Programa ABC Corte (execução 046, TASK-ABC-FE-09
// — 4ª e última da fila de rota, CHK-1) ----
const DashboardAbcIndicators = lazy(() => import('@/pages/Dashboards/AbcIndicators'));
// ---- Pluviometria (RainfallDashboard, execução 048, TASK-01-FE) ----
const DashboardRainfall = lazy(() => import('@/pages/Dashboards/RainfallDashboard'));
// ---- Livro Caixa (CashbookDashboard, execução 048, TASK-03-FE — 2ª rota
// nova do lote 048, mesma faixa) ----
const DashboardCashbook = lazy(() => import('@/pages/Dashboards/CashbookDashboard'));
// ---- Depreciações (DepreciationDashboard, execução 048, TASK-02-FE — 3ª
// rota nova do lote 048, mesma faixa) ----
const DashboardDepreciation = lazy(() => import('@/pages/Dashboards/DepreciationDashboard'));
// ---- Financeiro (FinancialDashboard, execução 048, TASK-04-FE — 4ª rota
// nova do lote 048, mesma faixa. DEC-191: sem heatmap.) ----
const DashboardFinancial = lazy(() => import('@/pages/Dashboards/FinancialDashboard'));
// ---- Pecuária de Corte (LivestockDashboard, execução 048, TASK-05-FE —
// 5ª e última rota nova do lote 048, mesma faixa. Sem abas
// Produtivo/Reprodutivo.) ----
const DashboardLivestock = lazy(() => import('@/pages/Dashboards/LivestockDashboard'));
// ---- Painel de Controle / Visão Geral (OverviewPanel, F-211, execução 062,
// TASK-FE-211-00) — substitui `Home` na rota `/home` (Opção A, contrato §3;
// `Home` NÃO é apagado, só deixa de ser o `element` desta rota). ----
const DashboardOverviewPanel = lazy(() => import('@/pages/Dashboards/OverviewPanel'));

// ---- Meu perfil (Execução 071, TASK-071-FE-02, SRF-071-01) — rota
// `/profile` (URL do legado, `ROUTES.PROFILE`), entrada única pelo item "Meu
// perfil" do menu da conta (Header/AccountMenu). Dentro do bloco privado,
// SEM `RequirePermission` (contrato API §0: `/me/*` não tem `permission:`,
// mesmo racional de `/home` acima). ----
const MeuPerfil = lazy(() => import('@/pages/MeuPerfil'));

// Fiscal — Partida Dobrada (AccountingEntry, F-128, esteira 97-Esteiras/068,
// TASK-PD-FE-06/07/08/09). Listagem (grid+filtro+exclusão) + formulário
// criar/editar (cabeçalho + linhas D/C dinâmicas + balanceamento em tempo
// real) + visualização (`/:uuid/visualizar`, TASK-PD-FE-08 — MESMO componente
// `CreateOrUpdateAccountingEntry` em modo `isViewMode` derivado da rota, sem
// tela própria). Item de menu (`fis-par`) e permissão de navegação
// (`double-entry-accountings_view`) JÁ EXISTIAM (`navigationTree.ts`/
// `navigationPermissions.ts`) — TASK-PD-FE-09 só conecta as rotas reais.
const AccountingEntryList = lazy(() => import('@/pages/Fiscal/AccountingEntry'));
const CreateOrUpdateAccountingEntry = lazy(
  () => import('@/pages/Fiscal/AccountingEntry/CreateOrUpdateAccountingEntry')
);
// Dashboard de Suprimentos (SupplyDashboard — Dashboards, esteira
// 97-Esteiras/009, Tarefas 38/39). Item de menu (`dash-sup`) e permissão de
// navegação (`supply_dashboard_view`) JÁ EXISTIAM
// (`navigationPermissions.ts:56`) — esta Tarefa só conecta a rota real.
const SupplyDashboardPage = lazy(() => import('@/pages/Dashboards/Suprimentos'));

// ---- Privado: Gestão de Frota — Abastecimentos (Supply, tabela dedicada
// `supplies`, AD-01, esteira 97-Esteiras/009, Tarefas 40/41). URL
// `/frota/abastecimentos`, PRIMEIRA tela real do módulo `/frota/*` (hoje
// 100% `<RoutePlaceholder />`). Item de menu (`fro-aba`) e permissão
// (`appropriation-supplies_view`) JÁ EXISTIAM em `navigationTree.ts`/
// `navigationPermissions.ts` antes desta Tarefa — nenhuma edição neles. ----
const AbastecimentosList = lazy(() => import('@/pages/Frota/Abastecimentos'));
const CreateOrUpdateAbastecimento = lazy(
  () => import('@/pages/Frota/Abastecimentos/CreateOrUpdateAbastecimento')
);
const AbastecimentoDetalhe = lazy(
  () => import('@/pages/Frota/Abastecimentos/AbastecimentoDetalhe')
);
const RevisoesList = lazy(() => import('@/pages/Frota/Revisoes'));
// Transferência de Máquinas (EquipmentTransfer, F-101, 97-Esteiras/005,
// TASK-ETR-FE-05) — 4 rotas reais, declaradas no bloco contíguo `/frota/*`
// logo após `/frota/revisoes`. Item de menu (`fro-tra`) e permissão
// (`equipment-transfer_view`) JÁ EXISTIAM em `navigationTree.ts`/
// `navigationPermissions.ts` antes desta Tarefa — nenhuma edição neles.
const TransferenciasList = lazy(() => import('@/pages/Frota/Transferencias'));
const CreateTransferencia = lazy(() => import('@/pages/Frota/Transferencias/CreateTransferencia'));
const TransferenciaDetalhe = lazy(
  () => import('@/pages/Frota/Transferencias/TransferenciaDetalhe')
);
const ReceberTransferencia = lazy(
  () => import('@/pages/Frota/Transferencias/ReceberTransferencia')
);

// ---- Integrações — Compartilhamento (Sharing, F-122, 97-Esteiras/070,
// TASK-CP-FE-01/02/03). Listagem + formulário único create/edit + detalhe
// (view). Módulo NOVO em `src/pages/Integracoes/` (primeira feature dessa
// pasta-mãe no frontend_root). ----
const CompartilhamentoList = lazy(() => import('@/pages/Integracoes/Compartilhamento'));
const CreateOrUpdateCompartilhamento = lazy(
  () => import('@/pages/Integracoes/Compartilhamento/CreateOrUpdateCompartilhamento')
);
const CompartilhamentoDetalhe = lazy(
  () => import('@/pages/Integracoes/Compartilhamento/CompartilhamentoDetalhe')
);

// ---- Integrações — Exportação NFS-e → Domínio (F-119, CANÁRIO do módulo
// Integrações, `97-Esteiras/071`, TASK-NFSE-FE-04/05). Tela STANDALONE
// (form de filtro de 2 datas + export), sem grid/create/edit. Item de menu
// (`int-exp-nfse`) e permissão (`export_nfs_dominio_view`) JÁ EXISTIAM em
// `navigationTree.ts`/`navigationPermissions.ts` (grupo "Exportação /
// Domínio", reservado para as irmãs F-116/117/118/120) — path
// `/integracoes/exp-nfse` reusado tal como já apontado pelo menu, em vez de
// cunhar um path novo (`/integracoes/nfse-dominio`) que deixaria o item de
// menu existente órfão. Nenhuma edição em navigationTree/navigationPermissions
// nesta Tarefa. ----
const ExportNfseDominio = lazy(() => import('@/pages/Integracoes/ExportNfseDominio'));

// ---- Integrações — Exportação Movimento Bancário → Domínio (F-116, irmã
// do canário F-119, `97-Esteiras/071`, TASK-F116-FE-01). Tela STANDALONE
// (form de filtro de 2 datas + 1 select `type` + export), sem grid/create/
// edit. Item de menu (`int-exp-bco`) e permissão
// (`export_movements_dominios_view`) JÁ EXISTIAM em
// `navigationTree.ts`/`navigationPermissions.ts` — path
// `/integracoes/exp-bancario` reusado tal como já apontado pelo menu.
// Nenhuma edição em navigationTree/navigationPermissions nesta Tarefa. ----
const ExportMovementsDominio = lazy(() => import('@/pages/Integracoes/ExportMovementsDominio'));

// ---- Integrações — Exportação Folha Salarial → Domínio (F-117, irmã do
// canário F-119, `97-Esteiras/071`, TASK-F117-FE-01). Tela STANDALONE
// (form de filtro de 2 selects `year`/`month` + export), sem grid/create/
// edit. Item de menu (`int-exp-fol`) e permissão
// (`export_payments_dominio_view` — slug real `payments`, não `earnings`,
// CL-03) JÁ EXISTIAM em `navigationTree.ts`/`navigationPermissions.ts` —
// path `/integracoes/exp-folha` reusado tal como já apontado pelo menu.
// Nenhuma edição em navigationTree/navigationPermissions nesta Tarefa. ----
const ExportEarningsDominio = lazy(() => import('@/pages/Integracoes/ExportEarningsDominio'));

// ---- Integrações — Exportação Domínio → Contas a Pagar/Receber (F-118,
// irmã do canário F-119, a mais rica do lote — 11 campos, `97-Esteiras/071`,
// TASK-CPR-FE-05). Tela STANDALONE (form de filtro de 11 campos + export),
// sem grid/create/edit. Item de menu (`int-exp-cp`) e permissão
// (`export_expenses_incomes_dominio_view`) JÁ EXISTIAM em
// `navigationTree.ts:2443`/`navigationPermissions.ts:1054` — path
// `/integracoes/exp-cp` reusado tal como já apontado pelo menu. Nenhuma
// edição em navigationTree/navigationPermissions nesta Tarefa. ----
const ExportCPagarReceberDominio = lazy(
  () => import('@/pages/Integracoes/ExportCPagarReceberDominio')
);

// ---- Integrações — Exportação Financeira CSV → C. Pagas/Recebidas (F-120,
// irmã do canário F-119, `97-Esteiras/071`, TASK-F120-FE-01). Tela
// STANDALONE (form de filtro de 2 datas + export), sem grid/create/edit.
// Item de menu (`int-csv`) e permissão (`financial_export`) JÁ EXISTIAM em
// `navigationTree.ts:2455`/`navigationPermissions.ts:1056` — path
// `/integracoes/csv` reusado tal como já apontado pelo menu. Nenhuma edição
// em navigationTree/navigationPermissions nesta Tarefa. ----
const ExportFinancialCsv = lazy(() => import('@/pages/Integracoes/ExportFinancialCsv'));

// ---- Integrações — Software Domínio (IntegrationDominio, F-121, CRUD-pai da
// área Integrações, `97-Esteiras/072`, TASK-F121-FE-03/04/05). Listagem +
// formulário único create/edit + detalhe (view). Item de menu (`int-dom-soft`)
// e permissão (`integration_dominios_*`) JÁ EXISTIAM em
// `navigationTree.ts:2418`/`navigationPermissions.ts:1051` — path
// `/integracoes/dominio` reusado tal como já apontado pelo menu. Nenhuma
// edição em navigationTree/navigationPermissions nesta Tarefa. ----
const SoftwareDominioList = lazy(() => import('@/pages/Integracoes/SoftwareDominio'));
const CreateOrUpdateIntegrationDominio = lazy(
  () => import('@/pages/Integracoes/SoftwareDominio/CreateOrUpdateIntegrationDominio')
);
const IntegrationDominioDetalhe = lazy(
  () => import('@/pages/Integracoes/SoftwareDominio/IntegrationDominioDetalhe')
);

// ---- Privado: Gestão de Frota — Manutenções Preventivas
// (MaintenancePreventive, Rota A do
// `GAP-CONFLITO-MANUTENCOES-PREVENTIVAS-01`, esteira 97-Esteiras/010,
// Tarefas 43/44). URL `/frota/preventivas`. Item de menu (`fro-pre`) e
// permissão (`maintenance-preventives_view`) JÁ EXISTIAM em
// `navigationTree.ts:2196`/`navigationPermissions.ts:856` antes desta
// Tarefa — nenhuma edição neles. ----
const ManutencoesPreventivasList = lazy(() => import('@/pages/Frota/ManutencoesPreventivas'));
const CreateOrUpdateManutencaoPreventiva = lazy(
  () => import('@/pages/Frota/ManutencoesPreventivas/CreateOrUpdateManutencaoPreventiva')
);
const ManutencaoPreventivaDetalhe = lazy(
  () => import('@/pages/Frota/ManutencoesPreventivas/ManutencaoPreventivaDetalhe')
);

// ---- Privado: Gestão de Frota — Manutenções (Maintenance, F-103, esteira
// 97-Esteiras/010, Tarefas 43/44/45). URL `/frota/manutencoes`. Item de
// menu (`fro-man`) e permissão (`maintenances_view`) JÁ EXISTIAM em
// `navigationTree.ts:2193`/`navigationPermissions.ts:854` antes desta
// Tarefa — nenhuma edição neles. "Gerar Financeiro" é ROTA PRÓPRIA (fluxo
// descendente, FID-G3F §0/§4), NÃO um Dialog. ----
const ManutencoesList = lazy(() => import('@/pages/Frota/Manutencoes'));
const CreateOrUpdateManutencao = lazy(
  () => import('@/pages/Frota/Manutencoes/CreateOrUpdateManutencao')
);
const ManutencaoDetalhe = lazy(() => import('@/pages/Frota/Manutencoes/ManutencaoDetalhe'));
const GerarFinanceiroManutencao = lazy(
  () => import('@/pages/Frota/Manutencoes/GerarFinanceiroManutencao')
);

// ---- Privado: camada de EXEMPLO (referência de padrão CRUD; só por URL) ----
const ExampleResources = lazy(() => import('@/_examples/pages/cadastros/recursos/index'));
const ExampleResourceForm = lazy(
  () => import('@/_examples/pages/cadastros/recursos/CreateOrUpdateRecurso')
);

function lazyRoute(Element: React.ComponentType) {
  return (
    <Suspense fallback={null}>
      <Element />
    </Suspense>
  );
}

// ---- Redirects permanentes: URLs antigas de Produtos (GAP-FE-201, Opção B
// aprovada pelo dev — sem prazo de remoção) ----
// `catalogo` saiu do path (TASK-FE-1000); estes 2 componentes preservam o
// `productId` da URL antiga ao redirecionar client-side (`replace`, sem
// entrar no histórico) — `<Navigate to=>` sozinho não substitui parâmetro de
// rota.
function RedirectProductDetail() {
  const { productId } = useParams();
  return <Navigate to={`/cadastros-base/produtos/${productId}/detalhe`} replace />;
}

function RedirectProductEdit() {
  const { productId } = useParams();
  return <Navigate to={`/cadastros-base/produtos/${productId}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* ========================================= */}
      {/* ROTAS PÚBLICAS (login)                    */}
      {/* ========================================= */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={lazyRoute(Login)} />
        <Route path="/login/two-factor" element={lazyRoute(TwoFactorVerify)} />
        <Route path="/forgot-password" element={lazyRoute(ForgotPassword)} />
        <Route path="/reset-password" element={lazyRoute(ResetPassword)} />
        <Route path="/criar-conta" element={lazyRoute(Onboarding)} />
      </Route>

      {/* ========================================= */}
      {/* ROTA PÚBLICA ANÔNIMA (formulário do fornecedor via hash) */}
      {/* ========================================= */}
      {/* Esteira 97-Esteiras/035, TASK-CQ-FE-10 — FORA de `PublicRoute` E
          `PrivateRoute` (nenhum dos dois guards se aplica: `PublicRoute`
          redireciona quando JÁ autenticado, semântica oposta à de uma página
          100% anônima; `PrivateRoute` exige sessão, que aqui nunca existe).
          `PublicQuotationLayout` é um layout DEDICADO, isolado de
          `AuthContext`/`useFarmStore`/do client HTTP autenticado (gate 6.1) —
          mirror da mesma decisão simétrica já tomada no backend (endpoint
          público dedicado, fora de `auth:sanctum`). Path `/orcamento/{hash}`
          mirror EXATO do legado (`agro365`) e do link já composto por
          `buildRequestQuotationPublicFormUrl` (TASK-CQ-FE-09). */}
      <Route element={<PublicQuotationLayout />}>
        <Route path="/orcamento/:hash" element={lazyRoute(RequestQuotationPublicPage)} />
      </Route>

      {/* ========================================= */}
      {/* ROTA PÚBLICA ANÔNIMA (aprovação de Orçamento via hash) */}
      {/* ========================================= */}
      {/* Esteira 97-Esteiras/054, TASK-BG-FE-06 — FORA de `PublicRoute` E
          `PrivateRoute` (mesmo racional do bloco de RequestQuotation acima:
          `PublicRoute` redireciona quando JÁ autenticado, semântica oposta
          à de uma página 100% anônima; `PrivateRoute` exige sessão, que
          aqui nunca existe). Reaproveita o MESMO `PublicQuotationLayout`
          standalone (Box + Outlet, sem chrome autenticado) — layout
          genérico o suficiente para qualquer superfície pública por hash,
          nenhuma duplicação. Path `/orcamento-aprovacao/:hash`
          (`budgets-frontend-contract.md §5.5`) — DELIBERADAMENTE distinto
          de `/orcamento/:hash` (singular, RequestQuotation) para evitar
          colisão de rota. */}
      <Route element={<PublicQuotationLayout />}>
        <Route path="/orcamento-aprovacao/:hash" element={lazyRoute(BudgetPublicPage)} />
      </Route>

      {/* ========================================= */}
      {/* ROTA PÚBLICA ANÔNIMA (rastreio de produto via código) */}
      {/* ========================================= */}
      {/* Esteira 97-Esteiras/058, TASK-TR-PUB-FE-02 — FORA de `PublicRoute` E
          `PrivateRoute` (mesmo racional dos 2 blocos acima: `PublicRoute`
          redireciona quando JÁ autenticado, semântica oposta à de uma página
          100% anônima; `PrivateRoute` exige sessão, que aqui nunca existe).
          Reaproveita o MESMO `PublicQuotationLayout` standalone (Box +
          Outlet, sem chrome autenticado) — layout genérico o suficiente para
          qualquer superfície pública, nenhuma duplicação. Path `/rastreio`
          com `code` em QUERYSTRING (`?code=`) — `{code}` (path param da API)
          só existe dentro da chamada HTTP feita pela página, não na URL do
          front (`CONTRATO-TELA-F067-rastreio-publico.md ## 3`). */}
      <Route element={<PublicQuotationLayout />}>
        <Route path="/rastreio" element={lazyRoute(RastreioPublicPage)} />
      </Route>

      {/* ========================================= */}
      {/* ROTA PÚBLICA ANÔNIMA (landing pública do Site) */}
      {/* ========================================= */}
      {/* Esteira 97-Esteiras/061, TASK-SITE-10 — FORA de `PublicRoute` E
          `PrivateRoute` (mesmo racional dos 3 blocos acima: `PublicRoute`
          redireciona quando JÁ autenticado, semântica oposta à de uma página
          100% anônima; `PrivateRoute` exige sessão, que aqui nunca existe).
          Reaproveita o MESMO `PublicQuotationLayout` standalone (Box +
          Outlet, sem chrome autenticado) — layout genérico o suficiente para
          qualquer superfície pública, nenhuma duplicação. Path `/site/:slug`
          COM PATH PARAM (`05-CONTRATO-TELA-pagina-publica-site.md ## 4`). */}
      <Route element={<PublicQuotationLayout />}>
        <Route path="/site/:slug" element={lazyRoute(SitePublicoPage)} />
      </Route>

      {/* ========================================= */}
      {/* ROTAS PRIVADAS (autenticadas)             */}
      {/* ========================================= */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* Raiz -> Home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Home — Painel de Controle / Visão Geral (F-211, execução 062,
            TASK-FE-211-00). Opção A (contrato §3, decisão do dono): o
            `OverviewPanel` SUBSTITUI o launcher de módulos em `/home`
            (paridade 1:1 com o legado, `GET /home` sempre foi o dashboard).
            `Home` (launcher antigo) segue existindo em código — seu destino
            é decisão futura fora do escopo do F-211 — só deixou de ser o
            `element` desta rota. Sem `RequirePermission` nesta Fase A: a
            permissão nova `home_dashboard_view` (contrato §5) ainda não
            existe no backend (Fase B) — gatear a rota agora bloquearia TODOS
            os usuários no pós-login; RBAC por bloco é a TASK-FE-211-07
            (transversal), não este roteamento. */}
        <Route path="/home" element={lazyRoute(DashboardOverviewPanel)} />

        {/* Meu perfil (Execução 071, TASK-071-FE-02/03/04, SRF-071-01) —
            edição do próprio usuário (nome, foto, senha) + Resumo da conta.
            Sem RequirePermission (contrato API §0). */}
        <Route path={ROUTES.PROFILE} element={lazyRoute(MeuPerfil)} />

        {/* Cadastros Base — Perfis (Roles RBAC): rotas REAIS, declaradas ANTES
            do catch-all /cadastros-base/* para vencerem o RoutePlaceholder. */}
        <Route
          path="/cadastros-base/perfil"
          element={
            <RequirePermission permission="roles_tenant_view">
              {lazyRoute(PerfilList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/perfil/novo"
          element={
            <RequirePermission permission="roles_tenant_view">
              {lazyRoute(PerfilForm)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/perfil/:roleId"
          element={
            <RequirePermission permission="roles_tenant_view">
              {lazyRoute(PerfilForm)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Centros de Custo: rotas REAIS, declaradas ANTES
            do catch-all /cadastros-base/* para vencerem o RoutePlaceholder. */}
        <Route
          path="/cadastros-base/centros-custo"
          element={
            <RequirePermission permission="costcenters_view">
              {lazyRoute(CentroCustoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/centros-custo/novo"
          element={
            <RequirePermission permission="costcenters_view">
              {lazyRoute(CreateOrUpdateCentroCusto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/centros-custo/novo/:parentUuid"
          element={
            <RequirePermission permission="costcenters_view">
              {lazyRoute(CreateOrUpdateCentroCusto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/centros-custo/:costCenterId"
          element={
            <RequirePermission permission="costcenters_view">
              {lazyRoute(CreateOrUpdateCentroCusto)}
            </RequirePermission>
          }
        />
        {/* TASK-FE-CC-09a — tela de Detalhe (somente leitura), mesmo padrão
            de rota de `/cadastros-base/safras/:harvestId/detalhe`. */}
        <Route
          path="/cadastros-base/centros-custo/:costCenterId/detalhe"
          element={
            <RequirePermission permission="costcenters_view">
              {lazyRoute(DetalheCentroCusto)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Autorizadores (RequestAuthorizer, Lote 06 /
            esteira 089, Frente C, F-141): rotas REAIS, declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder
            (eixo da rejeição AF — "não está aparecendo no ambiente"). O item
            de menu e a permissão `request-authorizers_view` já existem
            (navigationTree.ts/navigationPermissions.ts) — SLICE 1 registrou
            a listagem; SLICE 2 (esta Tarefa) registra `/novo` e
            `/:authorizerId`. `/novo` vem ANTES de `/:authorizerId` para não
            ser capturado como uuid. Guarda GRANULAR por rota (mirror
            Afiliados/People, contrato de tela §6 da Tarefa): criação por
            `request-authorizers_create`, edição por `request-authorizers_edit`. */}
        <Route
          path="/cadastros-base/autorizadores"
          element={
            <RequirePermission permission="request-authorizers_view">
              {lazyRoute(AutorizadoresList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/autorizadores/novo"
          element={
            <RequirePermission permission="request-authorizers_create">
              {lazyRoute(CreateOrUpdateAutorizador)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/autorizadores/:authorizerId/visualizar"
          element={
            <RequirePermission permission="request-authorizers_view">
              {lazyRoute(VisualizarAutorizador)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/autorizadores/:authorizerId"
          element={
            <RequirePermission permission="request-authorizers_edit">
              {lazyRoute(CreateOrUpdateAutorizador)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Raças (Breeds): rotas REAIS, declaradas ANTES
            do catch-all /cadastros-base/* para vencerem o RoutePlaceholder
            (TASK-BREED-01/02). */}
        <Route
          path="/cadastros-base/racas"
          element={
            <RequirePermission permission="breeds_view">{lazyRoute(RacasList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/racas/novo"
          element={
            <RequirePermission permission="breeds_view">
              {lazyRoute(CreateOrUpdateRaca)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/racas/:breedId"
          element={
            <RequirePermission permission="breeds_view">
              {lazyRoute(CreateOrUpdateRaca)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Vacinas (Vaccine): rotas REAIS, declaradas ANTES
            do catch-all /cadastros-base/* para vencerem o RoutePlaceholder
            (TASK-FE-060). Item de menu CRIADO nesta mesma Tarefa (não existia
            placeholder — diferente de PaymentTerm/DeathLoss). */}
        <Route
          path="/cadastros-base/vacinas"
          element={
            <RequirePermission permission="vaccine_view">
              {lazyRoute(VacinasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/vacinas/novo"
          element={
            <RequirePermission permission="vaccine_view">
              {lazyRoute(CreateOrUpdateVacina)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/vacinas/:vaccineId"
          element={
            <RequirePermission permission="vaccine_view">
              {lazyRoute(CreateOrUpdateVacina)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Causa Morte/Perda (DeathLoss): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-050/051/052). `/novo` vem ANTES de
            `/:deathLossId`, senão o React Router captura "novo" como se
            fosse um uuid (mesma ordem do bloco de Raças acima). */}
        <Route
          path="/cadastros-base/causa-morte-perda"
          element={
            <RequirePermission permission="death_loss_view">
              {lazyRoute(CausaMortePerdaList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/causa-morte-perda/novo"
          element={
            <RequirePermission permission="death_loss_view">
              {lazyRoute(CreateOrUpdateCausaMortePerda)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/causa-morte-perda/:deathLossId"
          element={
            <RequirePermission permission="death_loss_view">
              {lazyRoute(CreateOrUpdateCausaMortePerda)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Parâmetros Animais */}
        <Route
          path="/parameter-animals"
          element={
            <RequirePermission permission="parameter-animals_view">
              {lazyRoute(ParameterAnimalsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/parameter-animals/novo"
          element={
            <RequirePermission permission="parameter-animals_view">
              {lazyRoute(CreateOrUpdateParameterAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/parameter-animals/:parameterAnimalId"
          element={
            <RequirePermission permission="parameter-animals_view">
              {lazyRoute(CreateOrUpdateParameterAnimal)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Lotes Animais */}
        <Route
          path="/batches"
          element={
            <RequirePermission permission="batch_view">{lazyRoute(BatchesList)}</RequirePermission>
          }
        />
        <Route
          path="/batches/novo"
          element={
            <RequirePermission permission="batch_view">
              {lazyRoute(CreateOrUpdateBatch)}
            </RequirePermission>
          }
        />

        {/* Operacional — Agrupar/Lotes (GrouperBatch, execução 042,
            TASK-FE-042-306) — sem rota de criação/detalhe (2 modais inline). */}
        <Route
          path="/operacional/agrupar-lotes"
          element={
            <RequirePermission permission="grouper_batches">
              {lazyRoute(GrouperBatchesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/batches/:batchId"
          element={
            <RequirePermission permission="batch_view">
              {lazyRoute(CreateOrUpdateBatch)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Safras: rotas REAIS, declaradas ANTES
            do catch-all /cadastros-base/* para vencerem o RoutePlaceholder. */}
        <Route
          path="/cadastros-base/safras"
          element={
            <RequirePermission permission="harvests_view">
              {lazyRoute(SafrasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/safras/novo"
          element={
            <RequirePermission permission="harvests_view">
              {lazyRoute(CreateOrUpdateSafra)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/safras/:harvestId"
          element={
            <RequirePermission permission="harvests_view">
              {lazyRoute(CreateOrUpdateSafra)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/safras/:harvestId/detalhe"
          element={
            <RequirePermission permission="harvests_view">
              {lazyRoute(SafraDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Ciclo de Produção: rotas REAIS de LEITURA
            (TASK-FE-01, 97-Esteiras/033) + ESCRITA (TASK-FE-02, criar/editar),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. Item de menu (cad-agr-cic) e permissão
            (production-cycles_view) JÁ existem (navigationTree.ts/
            navigationPermissions.ts). `/novo` ANTES de `/:productionCycleUuid`
            (reserva o segmento estático — mesma convenção de Safra/Grazing,
            ainda que o ranking do React Router v6 já resolva isso sozinho). */}
        <Route
          path="/cadastros-base/ciclo-producao"
          element={
            <RequirePermission permission="production-cycles_view">
              {lazyRoute(CicloProducaoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/ciclo-producao/novo"
          element={
            <RequirePermission permission="production-cycles_create">
              {lazyRoute(CreateOrUpdateCicloProducao)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/ciclo-producao/:productionCycleUuid"
          element={
            <RequirePermission permission="production-cycles_edit">
              {lazyRoute(CreateOrUpdateCicloProducao)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/ciclo-producao/:productionCycleUuid/detalhe"
          element={
            <RequirePermission permission="production-cycles_view">
              {lazyRoute(CicloProducaoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Cultura/Variedade (Cultivation): rotas REAIS da
            listagem (TASK-CV-04a) + formulário create/edit (TASK-CV-04b),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `authorize()` real (create/edit) é
            responsabilidade do backend (403) — aqui só evitamos renderizar
            o form sem a permissão mínima de leitura, mesmo padrão de
            /cadastros-base/perfil/novo e /cadastros-base/perfil/:roleId. */}
        <Route
          path="/cadastros-base/cultura"
          element={
            <RequirePermission permission="cultivations_view">
              {lazyRoute(CultivationList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/cultura/novo"
          element={
            <RequirePermission permission="cultivations_view">
              {lazyRoute(CultivationForm)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/cultura/:cultivationId"
          element={
            <RequirePermission permission="cultivations_view">
              {lazyRoute(CultivationForm)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Endereçamentos (Addressing, domínio Estoque):
            rotas REAIS da listagem em árvore recursiva de 4 níveis
            (TASK-AD-03a) + formulário contextual create/edit (TASK-AD-03b),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `authorize()` real (create/edit) é
            responsabilidade do backend (403) — aqui só evitamos renderizar
            o form sem a permissão mínima de leitura, mesmo padrão de
            /cadastros-base/cultura/novo e /cadastros-base/cultura/:cultivationId. */}
        <Route
          path="/cadastros-base/enderecos"
          element={
            <RequirePermission permission="addressings_view">
              {lazyRoute(AddressingList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/enderecos/novo"
          element={
            <RequirePermission permission="addressings_view">
              {lazyRoute(AddressingForm)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/enderecos/:addressingId"
          element={
            <RequirePermission permission="addressings_view">
              {lazyRoute(AddressingForm)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Plano de Contas (PlanAccount, domínio Financeiro):
            rotas REAIS de listagem (TASK-PA-03a) + formulário create/edit
            (TASK-PA-03b), declaradas ANTES do catch-all /cadastros-base/*
            para vencerem o RoutePlaceholder. `novo`/`novo/:parentUuid`
            guardadas por `plan-accounts_create`; `:planAccountId` (edição)
            por `plan-accounts_edit` — PlanAccountResource não expõe flags
            por-item (diferente de CostCenter/DEC-005), autorização só por
            permissão global (Tarefa, §"Tela / Rota"). */}
        <Route
          path="/cadastros-base/plano-de-contas"
          element={
            <RequirePermission permission="plan-accounts_view">
              {lazyRoute(PlanAccountList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/plano-de-contas/novo"
          element={
            <RequirePermission permission="plan-accounts_create">
              {lazyRoute(CreateOrUpdatePlanAccount)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/plano-de-contas/novo/:parentUuid"
          element={
            <RequirePermission permission="plan-accounts_create">
              {lazyRoute(CreateOrUpdatePlanAccount)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/plano-de-contas/:planAccountId"
          element={
            <RequirePermission permission="plan-accounts_edit">
              {lazyRoute(CreateOrUpdatePlanAccount)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Armazéns: rotas REAIS, declaradas ANTES
            do catch-all /cadastros-base/* para vencerem o RoutePlaceholder. */}
        <Route
          path="/cadastros-base/armazens"
          element={
            <RequirePermission permission="warehouses_view">
              {lazyRoute(ArmazemList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/armazens/novo"
          element={
            <RequirePermission permission="warehouses_view">
              {lazyRoute(CreateOrUpdateArmazem)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/armazens/:warehouseId"
          element={
            <RequirePermission permission="warehouses_view">
              {lazyRoute(CreateOrUpdateArmazem)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Atualizações do Sistema (SystemUpdate): LISTAGEM
            real (TASK-FE-1101) + formulário create/edit real (TASK-FE-1102)
            + detalhe read-only (TASK-FE-1103), execução 031, TASK-FE-1104.
            Cada rota usa a permissão ESPECÍFICA do verbo (system_updates_
            view/create/edit), mesmo padrão de Parâmetros (linhas ~1334-1364)
            — `authorize()` real (create/edit/delete) é responsabilidade do
            backend (403); aqui só evitamos renderizar a tela sem a
            permissão mínima daquele verbo. */}
        <Route
          path="/cadastros-base/atualizacoes-sistema"
          element={
            <RequirePermission permission="system_updates_view">
              {lazyRoute(SystemUpdatesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/atualizacoes-sistema/novo"
          element={
            <RequirePermission permission="system_updates_create">
              {lazyRoute(CreateOrUpdateSystemUpdate)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/atualizacoes-sistema/:uuid"
          element={
            <RequirePermission permission="system_updates_edit">
              {lazyRoute(CreateOrUpdateSystemUpdate)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/atualizacoes-sistema/:uuid/detalhe"
          element={
            <RequirePermission permission="system_updates_view">
              {lazyRoute(SystemUpdateDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Permissões (Permission): LISTAGEM real
            (TASK-FE-2401) + formulário create/edit real (TASK-FE-2402) +
            detalhe read-only (TASK-FE-2403), execução 032, TASK-FE-2404.
            Cada rota usa a permissão ESPECÍFICA do verbo (permissions_
            view/create/edit), mesmo padrão de Atualizações do Sistema acima —
            `authorize()` real (create/edit/delete) é responsabilidade do
            backend (403); aqui só evitamos renderizar a tela sem a
            permissão mínima daquele verbo. */}
        <Route
          path="/cadastros-base/permissoes"
          element={
            <RequirePermission permission="permissions_view">
              {lazyRoute(PermissionsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/permissoes/novo"
          element={
            <RequirePermission permission="permissions_create">
              {lazyRoute(CreateOrUpdatePermission)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/permissoes/:uuid"
          element={
            <RequirePermission permission="permissions_edit">
              {lazyRoute(CreateOrUpdatePermission)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/permissoes/:uuid/detalhe"
          element={
            <RequirePermission permission="permissions_view">
              {lazyRoute(PermissionDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — IBPT (Ibpt): LISTAGEM (TASK-FE-2411) + Import
            "Nova Tabela" (TASK-FE-2412) + Visualização read-only
            (TASK-FE-2413), execução 032, TASK-FE-2414. SEM rota de edição
            (contrato de API §10, sem update — reimportar a UF já é o
            mecanismo de atualização, RN-01). `/novo` (literal) registrado
            ANTES de `/:uuid` (dinâmico), mesma convenção de
            Permissões/Atualizações do Sistema acima. */}
        <Route
          path="/cadastros-base/ibpt"
          element={
            <RequirePermission permission="ibpts_view">{lazyRoute(IbptsList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/ibpt/novo"
          element={
            <RequirePermission permission="ibpts_create">
              {lazyRoute(ImportIbptTable)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/ibpt/:uuid"
          element={
            <RequirePermission permission="ibpts_view">{lazyRoute(IbptDetalhe)}</RequirePermission>
          }
        />

        {/* Cadastros Base — Termos e Condições (PlatformDocument): tela ÚNICA
            (TASK-FE-2500/2501/2502), execução 032. Catálogo GLOBAL — SEM
            X-Farm-Id, SEM /novo/:uuid. Declarada ANTES do catch-all
            /cadastros-base/* para vencer o RoutePlaceholder, mesma regra de
            Permissões/IBPT acima. */}
        <Route
          path="/cadastros-base/termos-condicoes"
          element={
            <RequirePermission permission="terms_view">
              {lazyRoute(PlatformDocuments)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Espécies: LISTAGEM real (TASK-ESP-01) + formulário
            create/edit real (TASK-ESP-02), declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder. `authorize()`
            real (create/edit) é responsabilidade do backend via
            `specie_create`/`specie_edit` (403) — aqui só evitamos
            renderizar o form sem a permissão mínima de leitura, mesmo padrão
            de /cadastros-base/perfil/novo e /cadastros-base/perfil/:roleId. */}
        <Route
          path="/cadastros-base/especies"
          element={
            <RequirePermission permission="specie_view">
              {lazyRoute(EspeciesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/especies/novo"
          element={
            <RequirePermission permission="specie_view">
              {lazyRoute(CreateOrUpdateEspecie)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/especies/:specieId"
          element={
            <RequirePermission permission="specie_view">
              {lazyRoute(CreateOrUpdateEspecie)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Categorias Animais (CategoryAnimal): LISTAGEM real
            (TASK-FE-541) + formulário create/edit real (TASK-FE-542/543),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `/novo` vem ANTES de `/:uuid` para não ser
            capturada como parâmetro (mesma armadilha de Raças/Espécies).
            `authorize()` real (create/edit/delete) é responsabilidade do
            backend via `categoryanimals_create`/`categoryanimals_edit`/
            `categoryanimals_delete` (403) — aqui só evitamos renderizar a
            tela sem a permissão mínima de leitura (TASK-FE-544). */}
        <Route
          path="/cadastros-base/categorias-animais"
          element={
            <RequirePermission permission="categoryanimals_view">
              {lazyRoute(CategoriasAnimaisList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/categorias-animais/novo"
          element={
            <RequirePermission permission="categoryanimals_view">
              {lazyRoute(CreateOrUpdateCategoriaAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/categorias-animais/:categoryAnimalId"
          element={
            <RequirePermission permission="categoryanimals_view">
              {lazyRoute(CreateOrUpdateCategoriaAnimal)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Rebanho (Animal, execução 027,
            TASK-FE-887): 3 rotas REAIS, declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder. Item de menu
            (cad-pec-reb) e permissão de navegação (animals_view) JÁ
            EXISTIAM (navigationTree.ts/navigationPermissions.ts/
            languageSidebar.ts) — nenhuma alteração neles. `/novo` vem ANTES
            de `/:animalId` para não ser capturada como GUID (mesma
            armadilha de Raças/Kind/CategoryAnimal/CategoriasAnimais).

            Guarda `anyOf` (Tarefa 26, Gestão Animais — feature 3596a556,
            SD-01 aceita pelo dono): esta tela ABSORVE os filtros/ações em
            lote de `animals-management.index`. O backend já aceita
            `animals_view|animals-management_view` no `index()`/`show()`
            (`AnimalController.php:95`); a guarda de rota espelha o OR. Os
            verbos de escrita (`animals_create`/`animals_edit`) permanecem
            gateados nos componentes internos — quem só tem
            `animals-management_view` vê a listagem em modo leitura. */}
        <Route
          path="/cadastros-base/rebanho"
          element={
            <RequirePermission anyOf={['animals_view', 'animals-management_view']}>
              {lazyRoute(RebanhoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/rebanho/novo"
          element={
            <RequirePermission anyOf={['animals_view', 'animals-management_view']}>
              {lazyRoute(CreateOrUpdateAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/rebanho/:animalId"
          element={
            <RequirePermission anyOf={['animals_view', 'animals-management_view']}>
              {lazyRoute(CreateOrUpdateAnimal)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Embalagens (Package): LISTAGEM real (TASK-FE-521)
            + formulário create/edit real (TASK-FE-522), declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder.
            `/novo` vem ANTES de `/:packageId` para não ser capturada como
            parâmetro (mesma armadilha de Raças/Espécies/Categorias Animais).
            `authorize()` real (create/edit/delete) é responsabilidade do
            backend via `product-packages_create`/`product-packages_edit`/
            `product-packages_delete` (403) — aqui só evitamos renderizar a
            tela sem a permissão mínima de leitura (TASK-FE-523). */}
        <Route
          path="/cadastros-base/embalagens"
          element={
            <RequirePermission permission="product-packages_view">
              {lazyRoute(EmbalagensList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/embalagens/novo"
          element={
            <RequirePermission permission="product-packages_view">
              {lazyRoute(CreateOrUpdateEmbalagem)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/embalagens/:packageId"
          element={
            <RequirePermission permission="product-packages_view">
              {lazyRoute(CreateOrUpdateEmbalagem)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Diagnóstico Gestação: LISTAGEM real
            (TAREFA-02) + formulário create/edit real (TAREFA-03), declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `authorize()` real (create/edit) é
            responsabilidade do backend via `diagnosis_pregnancies_create`/
            `diagnosis_pregnancies_edit` (403) — aqui só evitamos renderizar a
            tela sem a permissão mínima de leitura, mesmo padrão de
            /cadastros-base/especies. */}
        <Route
          path="/cadastros-base/diagnostico-gestacao"
          element={
            <RequirePermission permission="diagnosis_pregnancies_view">
              {lazyRoute(DiagnosisPregnancyList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/diagnostico-gestacao/novo"
          element={
            <RequirePermission permission="diagnosis_pregnancies_view">
              {lazyRoute(CreateOrUpdateDiagnosisPregnancy)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/diagnostico-gestacao/:diagnosisPregnancyId"
          element={
            <RequirePermission permission="diagnosis_pregnancies_view">
              {lazyRoute(CreateOrUpdateDiagnosisPregnancy)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Escore Corporal (BodyScore, TASK-BS-FE-02/03):
            LISTAGEM (TASK-BS-FE-02) + formulário create/edit (TASK-BS-FE-03),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder — mesmo bloco/padrão de
            /cadastros-base/diagnostico-gestacao acima. `/novo` declarada ANTES
            de `/:bodyScoreId` (evita o wildcard capturar o literal). Guardadas
            por `bodys_view` (DEC-006, slug reusado do legado) —
            `authorize()` real de create/edit/delete é responsabilidade do
            backend via `bodys_create`/`bodys_edit`/`bodys_delete` (403); aqui
            só evitamos renderizar a tela sem a permissão mínima de leitura. */}
        <Route
          path="/cadastros-base/escore-corporal"
          element={
            <RequirePermission permission="bodys_view">
              {lazyRoute(BodyScoreList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/escore-corporal/novo"
          element={
            <RequirePermission permission="bodys_view">
              {lazyRoute(CreateOrUpdateBodyScore)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/escore-corporal/:bodyScoreId"
          element={
            <RequirePermission permission="bodys_view">
              {lazyRoute(CreateOrUpdateBodyScore)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Gerais — Contratantes (Tenant): LISTAGEM
            (TASK-TN-FE-02) + formulário create/edit (TASK-TN-FE-03/04/05,
            mesmo componente único). Gate 1 RESOLVIDO — dono via Maestro:
            /cadastros-base/contratantes, sob Cadastros Base, ao lado de
            Afiliados/Fazendas. Declaradas ANTES do catch-all
            /cadastros-base/* para vencer o RoutePlaceholder. `/novo` vem
            ANTES de `/:uuid` para não ser capturado como uuid. Guarda
            GRANULAR por rota (mirror Afiliados, contrato de tela §3.1 —
            estilo People, não permissão única): listagem por `tenants_view`,
            criação por `tenants_create`, edição por `tenants_edit`. */}
        <Route
          path="/cadastros-base/contratantes"
          element={
            <RequirePermission permission="tenants_view">
              {lazyRoute(ContratantesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/contratantes/novo"
          element={
            <RequirePermission permission="tenants_create">
              {lazyRoute(CreateOrUpdateContratante)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/contratantes/:uuid"
          element={
            // TASK-072-FE-06 (I9) — abrir o registro exige `tenants_view` OU
            // `tenants_edit` (legado `TenantController.php:33`); só-view abre
            // em modo visualização (`resolveTenantFormMode`).
            <RequirePermission anyOf={['tenants_view', 'tenants_edit']}>
              {lazyRoute(CreateOrUpdateContratante)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Estrutura — Rateio / Categorias (Apportionment):
            LISTAGEM (TASK-AP-FE-07) + formulário create/edit (TASK-AP-FE-08),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `/novo` declarada ANTES de `/:apportionmentId`
            (mesmo cuidado de ordenação já documentado para as demais telas
            BaseRegistrations, evita o wildcard capturar o literal).
            `authorize()` real (create/edit/delete) é responsabilidade do
            backend via `apportionments_create`/`apportionments_edit`/
            `apportionments_delete` (403) — aqui só evitamos renderizar a
            tela sem a permissão mínima de leitura. */}
        <Route
          path="/cadastros-base/rateios-categorias"
          element={
            <RequirePermission permission="apportionments_view">
              {lazyRoute(ApportionmentList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/rateios-categorias/novo"
          element={
            <RequirePermission permission="apportionments_view">
              {lazyRoute(CreateOrUpdateApportionment)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/rateios-categorias/:apportionmentId"
          element={
            <RequirePermission permission="apportionments_view">
              {lazyRoute(CreateOrUpdateApportionment)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Família de Bens (FamilyEquipment): LISTAGEM real
            (TASK-FE-FE-01) + formulário create/edit real (TASK-FE-FE-02),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `authorize()` real (create/edit) é
            responsabilidade do backend via `familyequipments_create`/
            `familyequipments_edit` (403) — aqui só evitamos renderizar a tela
            sem a permissão mínima de leitura, mesmo padrão de
            /cadastros-base/especies e /cadastros-base/especies/:specieId. */}
        <Route
          path="/cadastros-base/familia-de-bens"
          element={
            <RequirePermission permission="familyequipments_view">
              {lazyRoute(FamiliaBensList)}
            </RequirePermission>
          }
        />
        {/* Cadastros Base — Marcadores (Marker): LISTAGEM real (TASK-MK-FE-01) +
            formulário create/edit real (TASK-MK-FE-02), declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder, mesmo
            bloco/padrão de /cadastros-base/familia-de-bens. `authorize()` real
            (create/edit) é responsabilidade do backend via `markers_create`/
            `markers_edit` (403) — aqui só evitamos renderizar a tela sem a
            permissão mínima de leitura. */}
        <Route
          path="/cadastros-base/marcadores"
          element={
            <RequirePermission permission="markers_view">
              {lazyRoute(MarcadoresList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/marcadores/novo"
          element={
            <RequirePermission permission="markers_view">
              {lazyRoute(CreateOrUpdateMarcador)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/marcadores/:markerId"
          element={
            <RequirePermission permission="markers_view">
              {lazyRoute(CreateOrUpdateMarcador)}
            </RequirePermission>
          }
        />
        {/* Configurações — Testeiras (Headband, TASK-HB-FE-04): LISTAGEM real
            (TASK-HB-FE-03) + formulário create/edit real (TASK-HB-FE-06).
            URL migrada do antigo path em Cadastros Base para
            /configuracoes/testeiras em 97-Esteiras/019 (instrução literal do
            dono, 2026-08-05, pós-mover Testeiras/Marcadores para o módulo de
            menu `configuracoes` em navigationTree.ts). Não existe catch-all
            `/configuracoes/*` registrado neste router (só os módulos de topo
            listados mais abaixo, ex. /cadastros-base/*, /administrativo/*) —
            nenhuma outra rota disputa este prefixo, então as 3 rotas abaixo
            não precisam "vencer" nenhum RoutePlaceholder; sem elas, cairiam
            no catch-all genérico `*` → NotFound (ver fim do arquivo).
            `authorize()` real (create/edit) é responsabilidade do backend via
            `headbands_create`/`headbands_edit` (403) — aqui só evitamos
            renderizar a tela sem a permissão mínima de leitura. */}
        <Route
          path="/configuracoes/testeiras"
          element={
            <RequirePermission permission="headbands_view">
              {lazyRoute(HeadbandsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/testeiras/novo"
          element={
            <RequirePermission permission="headbands_view">
              {lazyRoute(CreateOrUpdateHeadband)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/testeiras/:headbandId"
          element={
            <RequirePermission permission="headbands_view">
              {lazyRoute(CreateOrUpdateHeadband)}
            </RequirePermission>
          }
        />
        {/* Configurações — Parâmetros (Parameter, execução 031,
            TASK-FE-031-43): LISTAGEM real (TASK-FE-031-41) + formulário
            create/edit real (TASK-FE-031-42) + detalhe read-only
            (TASK-FE-031-43). Item novo, nunca existiu antes — fecha a lacuna
            anotada em navigationTree.ts (execução 019), sem migração de URL.
            Cada rota usa a permissão ESPECÍFICA do verbo (parameters_view/
            create/edit), diferente do bloco de Testeiras acima (que reusa
            `headbands_view` nas 3 rotas) — `authorize()` real (create/edit/
            delete) é responsabilidade do backend (403); aqui só evitamos
            renderizar a tela sem a permissão mínima daquele verbo. */}
        <Route
          path="/configuracoes/parametros"
          element={
            <RequirePermission permission="parameters_view">
              {lazyRoute(ParametersList)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/parametros/novo"
          element={
            <RequirePermission permission="parameters_create">
              {lazyRoute(CreateOrUpdateParameters)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/parametros/:parameterUuid"
          element={
            <RequirePermission permission="parameters_edit">
              {lazyRoute(CreateOrUpdateParameters)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/parametros/:parameterUuid/detalhe"
          element={
            <RequirePermission permission="parameters_view">
              {lazyRoute(ParametersDetalhe)}
            </RequirePermission>
          }
        />
        {/* Configurações — Tutoriais (Help, TASK-HP-06): LISTAGEM +
            formulário create/edit reais. Mesmo padrão de Testeiras acima
            (permissão única `helpers_view` guarda as 3 rotas; botões
            internos checam `helpers_create`/`helpers_edit` via
            `usePermissions`). `/create` vem ANTES de `/:id` para não ser
            capturado como uuid. */}
        <Route
          path="/configuracoes/helps"
          element={
            <RequirePermission permission="helpers_view">{lazyRoute(HelpsList)}</RequirePermission>
          }
        />
        <Route
          path="/configuracoes/helps/create"
          element={
            <RequirePermission permission="helpers_view">
              {lazyRoute(CreateOrUpdateHelp)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/helps/:id"
          element={
            <RequirePermission permission="helpers_view">
              {lazyRoute(CreateOrUpdateHelp)}
            </RequirePermission>
          }
        />
        {/* Configurações — Configuração (Config, execução 032,
            TASK-FE-2603): tela ÚNICA (settings singleton de plataforma, sem
            create/edit por rota — não há `/novo` nem `/:uuid`, contrato de
            tela §5). `config_view` guarda a rota; `config_edit` controla
            modo leitura/escrita DENTRO da tela (TASK-FE-2601), não é gate de
            rota. */}
        <Route
          path="/configuracoes/config"
          element={
            <RequirePermission permission="config_view">{lazyRoute(Config)}</RequirePermission>
          }
        />
        {/* Site (Site, esteira 97-Esteiras/061): tela ÚNICA de configuração
            pública da fazenda (form singleton — sem `/novo` nem `/:uuid`,
            mirror `/configuracoes/config` acima). Path REPOSICIONADO sob
            "Rastreabilidade" por decisão do dono na homologação
            (2026-08-27): "Não encontrei a funcionalidade Site dentro de
            Operacional -> Agricultura -> Rastreabilidade -> Site, ajuste"
            — reverte o path próprio `/site` (G-FE-02 anterior) para
            `/operacional/rastreabilidade/site`, mirror dos irmãos
            `/operacional/rastreabilidade/produtos` e
            `/operacional/rastreabilidade/configuracao`. `site_edit` guarda
            a rota (mesmo slug reusado pelo backend, DEC-006, inalterado);
            a tela decide internamente modo leitura/escrita quando
            `!can('site_edit')`. */}
        <Route
          path="/operacional/rastreabilidade/site"
          element={<RequirePermission permission="site_edit">{lazyRoute(Site)}</RequirePermission>}
        />
        {/* Configurações — Aplicativos (App, TASK-APP-FE-01): LISTAGEM +
            formulário create/edit reais. Mesmo padrão de Tutoriais acima
            (permissão única `apps_view` guarda as 3 rotas; botões internos
            checam `apps_create`/`apps_edit` via `usePermissions`). `/create`
            vem ANTES de `/:id` para não ser capturado como uuid. */}
        <Route
          path="/configuracoes/apps"
          element={
            <RequirePermission permission="apps_view">{lazyRoute(AppsList)}</RequirePermission>
          }
        />
        <Route
          path="/configuracoes/apps/create"
          element={
            <RequirePermission permission="apps_view">
              {lazyRoute(CreateOrUpdateApp)}
            </RequirePermission>
          }
        />
        <Route
          path="/configuracoes/apps/:id"
          element={
            <RequirePermission permission="apps_view">
              {lazyRoute(CreateOrUpdateApp)}
            </RequirePermission>
          }
        />
        {/* Cadastros Base — Estágio Reprodutivo (CategoryMatrix): LISTAGEM
            real (TASK-CATYMT-01) + formulário create/edit real
            (TASK-CATYMT-02), declaradas ANTES do catch-all /cadastros-base/*
            para vencerem o RoutePlaceholder. `authorize()` real
            (create/edit) é responsabilidade do backend via
            `catymt_create`/`catymt_edit` (403) — aqui só evitamos renderizar
            o form sem a permissão mínima de leitura, mesmo padrão de
            /cadastros-base/especies/novo e /cadastros-base/especies/:specieId. */}
        <Route
          path="/cadastros-base/estagio-reprodutivo"
          element={
            <RequirePermission permission="catymt_view">
              {lazyRoute(EstagioReprodutivoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/familia-de-bens/novo"
          element={
            <RequirePermission permission="familyequipments_view">
              {lazyRoute(CreateOrUpdateFamiliaBens)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estagio-reprodutivo/novo"
          element={
            <RequirePermission permission="catymt_view">
              {lazyRoute(CreateOrUpdateEstagioReprodutivo)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/familia-de-bens/:familyEquipmentId"
          element={
            <RequirePermission permission="familyequipments_view">
              {lazyRoute(CreateOrUpdateFamiliaBens)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estagio-reprodutivo/:categoryMatrixId"
          element={
            <RequirePermission permission="catymt_view">
              {lazyRoute(CreateOrUpdateEstagioReprodutivo)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Motivos de Baixa (LowReason): LISTAGEM real
            (TASK-LR-FE-01) + formulário create/edit real (TASK-LR-FE-02),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `authorize()` real (create/edit) é
            responsabilidade do backend via `lowreasons_create`/
            `lowreasons_edit` (403) — aqui só evitamos renderizar o form sem a
            permissão mínima de leitura, mesmo padrão de
            /cadastros-base/especies/novo e /cadastros-base/especies/:specieId. */}
        <Route
          path="/cadastros-base/motivos-de-baixa"
          element={
            <RequirePermission permission="lowreasons_view">
              {lazyRoute(MotivosBaixaList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/motivos-de-baixa/novo"
          element={
            <RequirePermission permission="lowreasons_view">
              {lazyRoute(CreateOrUpdateMotivoBaixa)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/motivos-de-baixa/:lowReasonId"
          element={
            <RequirePermission permission="lowreasons_view">
              {lazyRoute(CreateOrUpdateMotivoBaixa)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/motivos-de-baixa/:lowReasonId/detalhe"
          element={
            <RequirePermission permission="lowreasons_view">
              {lazyRoute(LowReasonDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Tipos de Título (TypeTitle): LISTAGEM real
            (TASK-TT-01, paginação real via ApiResponse::paginated) +
            formulário create/edit real (TASK-TT-02), declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder.
            `authorize()` real (create/edit) é responsabilidade do backend via
            `typetitles_create`/`typetitles_edit` (403) — aqui só evitamos
            renderizar a tela sem a permissão mínima de leitura, mesmo padrão
            de /cadastros-base/motivos-de-baixa e /cadastros-base/especies. */}
        <Route
          path="/cadastros-base/tipos-titulo"
          element={
            <RequirePermission permission="typetitles_view">
              {lazyRoute(TiposTituloList)}
            </RequirePermission>
          }
        />
        {/* Cadastros Base — Técnicas de Diagnóstico: LISTAGEM real (TASK-FE-018)
            + formulário create/edit real (TASK-FE-019), declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder.
            `/novo` vem ANTES de `/:diagnosticTechniqueId` para não ser
            capturado como uuid. `authorize()` real (create/edit/delete) é
            responsabilidade do backend via `diagnostic_techniques_create`/
            `diagnostic_techniques_edit`/`diagnostic_techniques_delete` (403)
            — aqui só evitamos renderizar a tela sem a permissão mínima de
            leitura, mesmo padrão de /cadastros-base/especies/novo e
            /cadastros-base/especies/:specieId. */}
        <Route
          path="/cadastros-base/tecnicas-diagnostico"
          element={
            <RequirePermission permission="diagnostic_techniques_view">
              {lazyRoute(TecnicasDiagnosticoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/tipos-titulo/novo"
          element={
            <RequirePermission permission="typetitles_view">
              {lazyRoute(CreateOrUpdateTipoTitulo)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/tecnicas-diagnostico/novo"
          element={
            <RequirePermission permission="diagnostic_techniques_view">
              {lazyRoute(CreateOrUpdateTecnicaDiagnostico)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/tipos-titulo/:typeTitleId"
          element={
            <RequirePermission permission="typetitles_view">
              {lazyRoute(CreateOrUpdateTipoTitulo)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base -- Informacoes Complementares (AdditionalInfo): LISTAGEM
            real (TASK-AI-03, paginacao real via ApiResponse::paginated),
            declarada ANTES do catch-all /cadastros-base/* para vencer o
            RoutePlaceholder. Item de menu (cad-fis-inf) e permissao
            (navigationPermissions.ts) JA EXISTEM -- esta Tarefa so conecta a
            rota real. Formulario create/edit (rotas /novo e /:additionalInfoId)
            entram em TASK-AI-04. */}
        <Route
          path="/cadastros-base/info-complementares"
          element={
            <RequirePermission permission="additional-info_view">
              {lazyRoute(InfoComplementaresList)}
            </RequirePermission>
          }
        />
        {/* Formulario create/edit (TASK-AI-04) -- `/novo` declarada ANTES de
            `/:additionalInfoId` para nao ser capturada como se fosse um uuid.
            `authorize()` real (create/edit) e responsabilidade do backend via
            `additional-info_create`/`additional-info_edit` (403) -- aqui so
            evitamos renderizar o form sem a permissao minima de leitura. */}
        <Route
          path="/cadastros-base/info-complementares/novo"
          element={
            <RequirePermission permission="additional-info_view">
              {lazyRoute(CreateOrUpdateInfoComplementar)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/info-complementares/:additionalInfoId"
          element={
            <RequirePermission permission="additional-info_view">
              {lazyRoute(CreateOrUpdateInfoComplementar)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Bancos (Bank, dado mestre GLOBAL): LISTAGEM real
            (TASK-BANK-FE-01, sem paginação/filtro de servidor — busca local
            client-side) + formulário create/edit real (TASK-BANK-FE-02),
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `/novo` vem ANTES de `/:bankId` para não ser
            capturado como uuid. `authorize()` real (create/edit/delete) é
            responsabilidade do backend via `banks_create`/`banks_edit`/
            `banks_delete` (403) — aqui só evitamos renderizar a tela sem a
            permissão mínima de leitura, mesmo padrão de
            /cadastros-base/tipos-titulo e /cadastros-base/motivos-de-baixa. */}
        <Route
          path="/cadastros-base/bancos"
          element={
            <RequirePermission permission="banks_view">{lazyRoute(BancosList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/bancos/novo"
          element={
            <RequirePermission permission="banks_view">
              {lazyRoute(CreateOrUpdateBanco)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/bancos/:bankId"
          element={
            <RequirePermission permission="banks_view">
              {lazyRoute(CreateOrUpdateBanco)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Condições de Pagamento (PaymentTerm): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-048). Item de menu JÁ EXISTE
            (navigationTree.ts:144/navigationPermissions.ts:66, cad-fin-cnd) —
            esta Tarefa só conecta a rota real. `/novo` vem ANTES de
            `/:paymentTermId` para não ser capturado como uuid. */}
        <Route
          path="/cadastros-base/condicoes-pagamento"
          element={
            <RequirePermission permission="paymentterms_view">
              {lazyRoute(CondicoesPagamentoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/condicoes-pagamento/novo"
          element={
            <RequirePermission permission="paymentterms_view">
              {lazyRoute(CreateOrUpdateCondicaoPagamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/condicoes-pagamento/:paymentTermId"
          element={
            <RequirePermission permission="paymentterms_view">
              {lazyRoute(CreateOrUpdateCondicaoPagamento)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Emissores NFe (Issuer): rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (execução 023, TASK-FE-325). Item de menu JÁ
            EXISTE (navigationTree.ts, cad-fis-emi / navigationPermissions.ts,
            issue_view) — esta Tarefa só conecta as rotas reais. `/novo` vem
            ANTES de `/:issuerUuid` para não ser capturado como uuid; a rota
            de certificado usa `issue_edit` DIRETAMENTE (mais restritiva que
            as demais 3, que usam `issue_view` — contrato de backend §8.2/§9:
            o certificado é sempre "editar o Emissor", nunca "visualizar"). */}
        <Route
          path="/cadastros-base/emissores"
          element={
            <RequirePermission permission="issue_view">
              {lazyRoute(EmissoresList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/emissores/novo"
          element={
            <RequirePermission permission="issue_view">
              {lazyRoute(CreateOrUpdateEmissor)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/emissores/:issuerUuid"
          element={
            <RequirePermission permission="issue_view">
              {lazyRoute(CreateOrUpdateEmissor)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/emissores/:issuerUuid/certificado"
          element={
            <RequirePermission permission="issue_edit">
              {lazyRoute(CertificadoEmissor)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pessoas Unificado (Person): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-306). Item de menu JÁ EXISTE
            (navigationTree.ts:136/navigationPermissions.ts:62, cad-pes-uni)
            — esta Tarefa só conecta as rotas reais. `/novo` vem ANTES de
            `/:personId` para não ser capturada como se fosse um uuid, mesmo
            padrão de PlanAccount (permissões granulares distintas por
            rota: `people_view`/`people_create`/`people_edit`). */}
        <Route
          path="/cadastros-base/pessoas"
          element={
            <RequirePermission permission="people_view">{lazyRoute(PessoasList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/pessoas/novo"
          element={
            <RequirePermission permission="people_create">
              {lazyRoute(CreateOrUpdatePessoa)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/pessoas/:personId"
          element={
            <RequirePermission permission="people_edit">
              {lazyRoute(CreateOrUpdatePessoa)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Fornecedores (Provider): LISTAGEM (TASK-PR-FE-02)
            + FORMULÁRIO create/edit (TASK-PR-FE-03, casca de Tabs + aba
            "Dados" — Conta/Filiais/Vendedores chegam em TASK-PR-FE-04/05/06
            no MESMO componente), declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder. Item de menu
            NOVO (`cad-for-lis`, navigationTree.ts), separado de "Pessoas"
            (decisão do dono: COEXISTIR — Provider-FrontEnd-contrato.md ## 11
            item 1). `/novo` vem ANTES de `/:providerUuid` para não ser
            capturado como uuid (mesmo padrão de Contador/CentroCusto). */}
        {/* Cadastros Base — Proprietários (Proprietary): rota REAL,
            declarada ANTES do catch-all /cadastros-base/* para vencer o
            RoutePlaceholder (TASK-PY-FE-02). Item de menu (`cad-pes-prp`) e
            permissão (`proprietaries_view`) já registrados em
            navigationTree.ts/navigationPermissions.ts. Rotas de create/edit
            (TASK-PY-FE-03) guardadas por `proprietaries_view` (leitura
            mínima do form, instrução explícita da ficha) — a autorização
            REAL de create/edit é aplicada dentro do componente (`canSave`)
            e, em última instância, pelo backend (403). `/novo` vem ANTES de
            `/:uuid` para não ser capturado como uuid (mesmo padrão de
            Contador/Fornecedores/CentroCusto). */}
        <Route
          path="/cadastros-base/proprietarios"
          element={
            <RequirePermission permission="proprietaries_view">
              {lazyRoute(ProprietariosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/proprietarios/novo"
          element={
            <RequirePermission permission="proprietaries_view">
              {lazyRoute(CreateOrUpdateProprietario)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/proprietarios/:uuid"
          element={
            <RequirePermission permission="proprietaries_view">
              {lazyRoute(CreateOrUpdateProprietario)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Funcionários (Employee): rota REAL, declarada
            ANTES do catch-all /cadastros-base/* para vencer o
            RoutePlaceholder. Item de menu (`cad-pes-fun`) e permissão
            (`employees_view`) já registrados em
            navigationTree.ts/navigationPermissions.ts. `/novo` vem ANTES de
            `/:employeeUuid` para não ser capturado como uuid (mesmo padrão
            de Proprietários/Fornecedores/Contador/CentroCusto). Guardas
            GRANULARES por rota (`employees_view`/`employees_create`/
            `employees_edit`, mirror Fornecedores — não o padrão único de
            Clientes) — formulário real (`CreateOrUpdateFuncionario`,
            TASK-EMP-FE-03) substitui os 2 `<RoutePlaceholder />`
            anteriores; bloco opcional `create_user`/`role` chega em
            `TASK-EMP-FE-04`. */}
        <Route
          path="/cadastros-base/funcionarios"
          element={
            <RequirePermission permission="employees_view">
              {lazyRoute(FuncionariosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/funcionarios/novo"
          element={
            <RequirePermission permission="employees_create">
              {lazyRoute(CreateOrUpdateFuncionario)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/funcionarios/:employeeUuid"
          element={
            <RequirePermission permission="employees_edit">
              {lazyRoute(CreateOrUpdateFuncionario)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Clientes (Client): rota REAL, declarada ANTES do
            catch-all /cadastros-base/* para vencer o RoutePlaceholder
            (TASK-CL-FE-02/03). SCAFFOLD ADIANTADO POR ESPELHAMENTO — ver
            nota de topo dos imports lazy acima. `/novo` vem ANTES de
            `/:uuid` para não ser capturado como uuid (mesmo padrão de
            Proprietários/Fornecedores/Contador/CentroCusto). */}
        <Route
          path="/cadastros-base/clientes"
          element={
            <RequirePermission permission="clients_view">
              {lazyRoute(ClientesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/clientes/novo"
          element={
            <RequirePermission permission="clients_view">
              {lazyRoute(CreateOrUpdateCliente)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/clientes/:uuid"
          element={
            <RequirePermission permission="clients_view">
              {lazyRoute(CreateOrUpdateCliente)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/clientes/:uuid/detalhe"
          element={
            <RequirePermission permission="clients_view">
              {lazyRoute(ClienteDetalhe)}
            </RequirePermission>
          }
        />

        <Route
          path="/cadastros-base/fornecedores"
          element={
            <RequirePermission permission="providers_view">
              {lazyRoute(FornecedoresList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fornecedores/novo"
          element={
            <RequirePermission permission="providers_create">
              {lazyRoute(CreateOrUpdateFornecedor)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fornecedores/:providerUuid"
          element={
            <RequirePermission permission="providers_edit">
              {lazyRoute(CreateOrUpdateFornecedor)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Serviços (ServiceExpense): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-133). `/novo` vem ANTES de
            `/:serviceExpenseId` para não ser capturado como uuid. */}
        <Route
          path="/cadastros-base/servicos"
          element={
            <RequirePermission permission="service_view">
              {lazyRoute(ServicosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/servicos/novo"
          element={
            <RequirePermission permission="service_view">
              {lazyRoute(CreateOrUpdateServico)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/servicos/:serviceExpenseId"
          element={
            <RequirePermission permission="service_view">
              {lazyRoute(CreateOrUpdateServico)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Estorno (ReversalExpense): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-064). `/novo` vem ANTES de
            `/:reversalExpenseId` para não ser capturado como uuid. */}
        <Route
          path="/cadastros-base/estorno"
          element={
            <RequirePermission permission="reversal_view">
              {lazyRoute(EstornoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estorno/novo"
          element={
            <RequirePermission permission="reversal_view">
              {lazyRoute(CreateOrUpdateEstorno)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estorno/:reversalExpenseId"
          element={
            <RequirePermission permission="reversal_view">
              {lazyRoute(CreateOrUpdateEstorno)}
            </RequirePermission>
          }
        />

        <Route
          path="/cadastros-base/tecnicas-diagnostico/:diagnosticTechniqueId"
          element={
            <RequirePermission permission="diagnostic_techniques_view">
              {lazyRoute(CreateOrUpdateTecnicaDiagnostico)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Tipos de Identificação (IdentificationType):
            rotas REAIS, declaradas ANTES do catch-all /cadastros-base/* para
            vencerem o RoutePlaceholder (TASK-FE-040). `/novo` vem ANTES de
            `/:identificationTypeId` para não ser capturado como uuid.
            `authorize()` real (create/edit/delete) é responsabilidade do
            backend via `idanimal_create`/`idanimal_edit`/`idanimal_delete`
            (403) — aqui só evitamos renderizar a tela sem a permissão mínima
            de leitura, mesmo padrão de /cadastros-base/tecnicas-diagnostico. */}
        <Route
          path="/cadastros-base/tipos-identificacao"
          element={
            <RequirePermission permission="idanimal_view">
              {lazyRoute(TiposIdentificacaoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/tipos-identificacao/novo"
          element={
            <RequirePermission permission="idanimal_view">
              {lazyRoute(CreateOrUpdateTipoIdentificacao)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/tipos-identificacao/:identificationTypeId"
          element={
            <RequirePermission permission="idanimal_view">
              {lazyRoute(CreateOrUpdateTipoIdentificacao)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Observação Nascimento (BirthNote): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-103). Item de menu CRIADO nesta mesma
            Tarefa (não existia placeholder). `/novo` vem ANTES de
            `/:birthNoteId` para não ser capturado como uuid. */}
        <Route
          path="/cadastros-base/observacao-nascimento"
          element={
            <RequirePermission permission="birth_note_view">
              {lazyRoute(ObservacaoNascimentoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/observacao-nascimento/novo"
          element={
            <RequirePermission permission="birth_note_view">
              {lazyRoute(CreateOrUpdateObservacaoNascimento)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/observacao-nascimento/:birthNoteId"
          element={
            <RequirePermission permission="birth_note_view">
              {lazyRoute(CreateOrUpdateObservacaoNascimento)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Indexadores (Indexer): rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-213). Item de menu CRIADO nesta mesma
            Tarefa (não existia placeholder). `/novo` vem ANTES de
            `/:indexerId` para não ser capturado como uuid. */}
        <Route
          path="/cadastros-base/indexadores"
          element={
            <RequirePermission permission="indexers_view">
              {lazyRoute(IndexadoresList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/indexadores/novo"
          element={
            <RequirePermission permission="indexers_view">
              {lazyRoute(CreateOrUpdateIndexador)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/indexadores/:indexerId"
          element={
            <RequirePermission permission="indexers_view">
              {lazyRoute(CreateOrUpdateIndexador)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Atividades (Activity): rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-026/027/028). `/novo` declarada ANTES
            de `/:activityId` para não ser capturada como se fosse um uuid. */}
        <Route
          path="/cadastros-base/atividades"
          element={
            <RequirePermission permission="activities_view">
              {lazyRoute(AtividadesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/atividades/novo"
          element={
            <RequirePermission permission="activities_view">
              {lazyRoute(CreateOrUpdateAtividade)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/atividades/:activityId"
          element={
            <RequirePermission permission="activities_view">
              {lazyRoute(CreateOrUpdateAtividade)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Operações (Operation): rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-044). Item de menu JÁ EXISTE
            (navigationTree.ts:168/navigationPermissions.ts:78, cad-agr-ope) —
            esta Tarefa só conecta a rota real. `/novo` declarada ANTES de
            `/:operationId` para não ser capturada como se fosse um uuid. */}
        <Route
          path="/cadastros-base/operacoes"
          element={
            <RequirePermission permission="operations_view">
              {lazyRoute(OperacoesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/operacoes/novo"
          element={
            <RequirePermission permission="operations_view">
              {lazyRoute(CreateOrUpdateOperacao)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/operacoes/:operationId"
          element={
            <RequirePermission permission="operations_view">
              {lazyRoute(CreateOrUpdateOperacao)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Estados + Cidades (Geografia): LISTAGEM real
            (TASK-FE-022/023), declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder. Módulo 100%
            read-only — SEM rota `/novo`/`:id` para nenhum dos 2 (nunca terão
            formulário, TASK-FE-024). */}
        <Route
          path="/cadastros-base/estados"
          element={
            <RequirePermission permission="states_view">{lazyRoute(EstadosList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/cidades"
          element={
            <RequirePermission permission="cities_view">{lazyRoute(CidadesList)}</RequirePermission>
          }
        />

        {/* Cadastros Base — Agrupadores (Grouper): rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-032). `/novo` declarada ANTES de
            `/:grouperUuid` para não ser capturada como se fosse um uuid
            (aceita `?parentUuid=` opcional na query string — "criar
            descendente" da árvore, TASK-FE-030). */}
        <Route
          path="/cadastros-base/agrupadores"
          element={
            <RequirePermission permission="groupers_view">
              {lazyRoute(AgrupadoresList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/agrupadores/novo"
          element={
            <RequirePermission permission="groupers_view">
              {lazyRoute(CreateOrUpdateAgrupador)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/agrupadores/:grouperUuid"
          element={
            <RequirePermission permission="groupers_view">
              {lazyRoute(CreateOrUpdateAgrupador)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Categorias Financeiras (FinancialCategory): rotas
            REAIS, declaradas ANTES do catch-all /cadastros-base/* para
            vencerem o RoutePlaceholder (TASK-FE-313). O menu (`cad-fin-cat`)
            já existia em navigationTree.ts/navigationPermissions.ts — zero
            diff nesses arquivos aqui. `/novo` declarada ANTES de
            `/:financialCategoryUuid` para não ser capturada como se fosse um
            uuid (aceita `?parentUuid=` — "criar filho" da árvore, único modo
            de criação alcançável, GAP-FE-100). */}
        <Route
          path="/cadastros-base/categorias"
          element={
            <RequirePermission permission="financialcategories_view">
              {lazyRoute(CategoriasFinanceirasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/categorias/novo"
          element={
            <RequirePermission permission="financialcategories_view">
              {lazyRoute(CreateOrUpdateFinancialCategory)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/categorias/:financialCategoryUuid"
          element={
            <RequirePermission permission="financialcategories_view">
              {lazyRoute(CreateOrUpdateFinancialCategory)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Agrupadores Contábeis (AccountingGrouper): rotas
            REAIS, declaradas ANTES do catch-all /cadastros-base/* para
            vencerem o RoutePlaceholder (TASK-ACG-01/02). Módulo IRMÃO do
            bloco "Agrupadores" acima — permissão PRÓPRIA
            `accounting_groupers_view` (NÃO `groupers_view`, ver "Armadilha
            de identidade" da Tarefa). `/novo` declarada ANTES de
            `/:accountingGrouperUuid` para não ser capturada como se fosse um
            uuid (aceita `?parentUuid=` opcional na query string — "criar
            descendente" da árvore, TASK-ACG-01). SEM paginação — a API
            devolve a árvore inteira em uma única chamada. */}
        <Route
          path="/cadastros-base/agrupadores-contabeis"
          element={
            <RequirePermission permission="accounting_groupers_view">
              {lazyRoute(AgrupadoresContabeisList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/agrupadores-contabeis/novo"
          element={
            <RequirePermission permission="accounting_groupers_view">
              {lazyRoute(CreateOrUpdateAgrupadorContabil)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/agrupadores-contabeis/:accountingGrouperUuid"
          element={
            <RequirePermission permission="accounting_groupers_view">
              {lazyRoute(CreateOrUpdateAgrupadorContabil)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Un. de Medida (Measurement): listagem (TASK-FE-054)
            + as 2 rotas de formulário (TASK-FE-056) — `/novo` declarada ANTES
            de `/:measurementId` para não ser capturada como se fosse um uuid,
            mesmo padrão do bloco de Armazéns. */}
        <Route
          path="/cadastros-base/unidade-medida"
          element={
            <RequirePermission permission="measurements_view">
              {lazyRoute(UnidadeMedidaList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/unidade-medida/novo"
          element={
            <RequirePermission permission="measurements_view">
              {lazyRoute(CreateOrUpdateUnidadeMedida)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/unidade-medida/:measurementId"
          element={
            <RequirePermission permission="measurements_view">
              {lazyRoute(CreateOrUpdateUnidadeMedida)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Parametrizações (TenantParameter): settings-form de
            registro único, SEM /novo/:id. Item de menu JÁ EXISTE
            (navigationTree.ts/navigationPermissions.ts, cad-ger-par) —
            esta Tarefa só conecta a rota real (TASK-FE-070/071). Declarada
            ANTES do catch-all /cadastros-base/* para vencer o
            RoutePlaceholder. */}
        <Route
          path="/cadastros-base/parametrizacoes"
          element={
            <RequirePermission permission="tenant-parameters_edit">
              {lazyRoute(Parametrizacoes)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Regras Fiscais (TaxRule): rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-114). Item de menu JÁ EXISTIA
            (cad-fis-reg, grupo Fiscais) — esta Tarefa só liga a rota real,
            mesmo racional de PaymentTerm/DeathLoss/TenantParameter. `/novo`
            vem ANTES de `/:taxRuleId` para não ser capturado como uuid. As 3
            gated por `tax-rules_view` (entrada na tela); `create`/`edit`
            gateiam os botões internos, não rotas separadas. */}
        <Route
          path="/cadastros-base/regras-fiscais"
          element={
            <RequirePermission permission="tax-rules_view">
              {lazyRoute(RegrasFiscaisList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/regras-fiscais/novo"
          element={
            <RequirePermission permission="tax-rules_view">
              {lazyRoute(CreateOrUpdateRegraFiscal)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/regras-fiscais/:taxRuleId"
          element={
            <RequirePermission permission="tax-rules_view">
              {lazyRoute(CreateOrUpdateRegraFiscal)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Natureza de Operação (NatureOperation): LISTAGEM
            real (TASK-NO-FE-01, paginação real via ApiResponse::paginated),
            declarada ANTES do catch-all /cadastros-base/* para vencer o
            RoutePlaceholder. Item de menu (cad-fis-nat) e permissão
            (natop_view) JÁ EXISTIAM — esta Tarefa destrava o link de menu
            órfão (sem `<Route>` correspondente até aqui), conectando a rota
            real. */}
        <Route
          path="/cadastros-base/natureza-operacao"
          element={
            <RequirePermission permission="natop_view">
              {lazyRoute(NaturezaOperacaoList)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Natureza de Operação: FORMULÁRIO create/edit
            (TASK-NO-FE-02) — declaradas ANTES do catch-all /cadastros-base/*
            para vencer o RoutePlaceholder. `/novo` vem ANTES de
            `/:natureOperationId` para não ser capturado como uuid. Gates
            DISTINTOS por rota (`natop_create` na criação, `natop_edit` na
            edição), diferente do padrão de RegrasFiscais (gate único
            `tax-rules_view` nas 2 rotas) — decisão explícita desta Tarefa. */}
        <Route
          path="/cadastros-base/natureza-operacao/novo"
          element={
            <RequirePermission permission="natop_create">
              {lazyRoute(CreateOrUpdateNaturezaOperacao)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/natureza-operacao/:natureOperationId"
          element={
            <RequirePermission permission="natop_edit">
              {lazyRoute(CreateOrUpdateNaturezaOperacao)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Previsão de Depreciação (DepreciationForecast):
            rota REAL única (sem /novo, sem /:id — não há CRUD, TASK-FE-232),
            declarada ANTES do catch-all /cadastros-base/* para vencer o
            RoutePlaceholder. Item de menu JÁ EXISTE (cad-ben-pre, grupo
            "Bens/Ativos") — esta Tarefa só liga a rota real. */}
        <Route
          path="/cadastros-base/previsao-depreciacao"
          element={
            <RequirePermission permission="depreciation-forecast_view">
              {lazyRoute(PrevisaoDepreciacao)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Contador (Escritório de Contabilidade, domínio
            Fiscal/Contábil): rotas REAIS, declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder (TASK-CT-03a/
            TASK-CT-03b). Item de menu/permissão de navegação JÁ EXISTIAM
            (navigationTree.ts:171/navigationPermissions.ts:78, cad-fis-cnt) —
            esta Tarefa só liga as rotas reais. `/novo` vem ANTES de
            `/:contadorId` para não ser capturado como uuid. Listagem gated
            por `ctdr_view`; criação por `ctdr_create`; edição por `ctdr_edit`
            (`ContadorResource` não expõe flags por-item). */}
        <Route
          path="/cadastros-base/contador"
          element={
            <RequirePermission permission="ctdr_view">{lazyRoute(ContadorList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/contador/novo"
          element={
            <RequirePermission permission="ctdr_create">
              {lazyRoute(CreateOrUpdateContador)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/contador/:contadorId"
          element={
            <RequirePermission permission="ctdr_edit">
              {lazyRoute(CreateOrUpdateContador)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Tipos de Categoria (CategoryType): LISTAGEM real
            (TASK-CTY-01, paginação real via ApiResponse::paginated — per_page
            ignorado pelo backend hoje, Risco 2 da ficha), declarada ANTES do
            catch-all /cadastros-base/* para vencer o RoutePlaceholder. Item
            de menu (cad-fin-cty) e permissão (navigationPermissions.ts)
            criados na TASK-CTY-01. Dado mestre GLOBAL — rota fora do grupo
            farm.context no backend, sem FarmTenantScope no Model. */}
        <Route
          path="/cadastros-base/tipos-de-categoria"
          element={
            <RequirePermission permission="categorytypes_view">
              {lazyRoute(TiposDeCategoriaList)}
            </RequirePermission>
          }
        />
        {/* Formulário create/edit (TASK-CTY-02), declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder.
            `categorytypes_view` guarda as 2 rotas (autorização real de
            create/edit é do backend via 403 no submit) — mesmo padrão exato
            de /cadastros-base/especies/novo e /:specieId. */}
        <Route
          path="/cadastros-base/tipos-de-categoria/novo"
          element={
            <RequirePermission permission="categorytypes_view">
              {lazyRoute(CreateOrUpdateTipoDeCategoria)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/tipos-de-categoria/:categoryTypeId"
          element={
            <RequirePermission permission="categorytypes_view">
              {lazyRoute(CreateOrUpdateTipoDeCategoria)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Fazendas (Farm, execução 024): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-404). Item de menu (cad-est-faz) e
            permissão (navigationPermissions.ts, farms_view) JÁ EXISTIAM —
            esta Tarefa só liga as rotas reais. `/novo` vem ANTES de `/:uuid`
            para não ser capturado como uuid. Lista e formulário guardados
            por `farms_view` (create/edit distinguidos DENTRO da tela via
            `can()`, mesmo padrão de Tipos de Categoria/Contador). */}
        <Route
          path="/cadastros-base/fazendas"
          element={
            <RequirePermission permission="farms_view">{lazyRoute(FarmsList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fazendas/novo"
          element={
            <RequirePermission permission="farms_view">
              {lazyRoute(CreateOrUpdateFarm)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fazendas/:farmId"
          element={
            <RequirePermission permission="farms_view">
              {lazyRoute(CreateOrUpdateFarm)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Áreas (Area, F-348/UT-000446, esteira 067,
            TASK-FE-422): rotas REAIS, farm-scoped, declaradas ANTES do
            catch-all /cadastros-base/* para vencerem o RoutePlaceholder.
            Paths vêm de `area-routes.ts` (fonte única de verdade) — NÃO
            montados na mão. Guarda GRANULAR pelos slugs de FAZENDA
            (`farms_*`, DEC-006, `CONTRATO-tela-frontend-area.md §2/§2-bis`
            — este repo NÃO tem `ProtectedModuleRoute`/`hasModuleAccess`):
            criar/múltiplas → `farms_create`; editar → `farms_edit`; detalhe
            (TASK-FE-417) → `farms_view` (mesma guarda da sub-lista,
            `AreasSubList.tsx`). `/novo` e `/multiplas` (estáticos) vêm ANTES
            de `/:areaId` (dinâmico) — mesmo cuidado de Fazendas/Centros de
            Custo acima; `/:areaId/detalhe` tem 1 segmento a mais que
            `/:areaId`, sem risco de colisão entre os dois. Item de menu:
            NENHUM novo — Área é acessada via Fazendas (`cad-est-faz` já
            existe), não item de topo próprio. */}
        <Route
          path="/cadastros-base/fazendas/:farmId/areas/novo"
          element={
            <RequirePermission permission="farms_create">
              {lazyRoute(CreateOrUpdateArea)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fazendas/:farmId/areas/multiplas"
          element={
            <RequirePermission permission="farms_create">
              {lazyRoute(CreateMultipleAreas)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fazendas/:farmId/areas/:areaId/detalhe"
          element={
            <RequirePermission permission="farms_view">{lazyRoute(DetalheArea)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/fazendas/:farmId/areas/:areaId"
          element={
            <RequirePermission permission="farms_edit">
              {lazyRoute(CreateOrUpdateArea)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Afiliados (Partner, execução 024): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-433). Menu (cad-pes-afi) NOVO — criado
            nesta mesma Tarefa, logo após Autorizadores. `/novo` vem ANTES de
            `/:uuid` para não ser capturado como uuid. Guarda GRANULAR por
            rota (contrato de tela §3.1 — estilo People, não permissão única
            de Kind): lista por `partners_view`, criação por `partners_create`,
            edição por `partners_edit`. */}
        <Route
          path="/cadastros-base/pessoas/afiliados"
          element={
            <RequirePermission permission="partners_view">
              {lazyRoute(AfiliadosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/pessoas/afiliados/novo"
          element={
            <RequirePermission permission="partners_create">
              {lazyRoute(CreateOrUpdateAfiliado)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/pessoas/afiliados/:uuid"
          element={
            <RequirePermission permission="partners_edit">
              {lazyRoute(CreateOrUpdateAfiliado)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Sincronização DFe (IssueDfeSyncTime, domínio
            Fiscal): rotas REAIS, declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder (TASK-DFE-
            FE-01/TASK-DFE-FE-02). Item de menu/permissão de navegação JÁ
            EXISTIAM (navigationTree.ts:175/navigationPermissions.ts:78,
            cad-fis-sin) — esta Tarefa só liga as rotas reais. `/novo` vem
            ANTES de `/:issueDfeSyncTimeId` para não ser capturado como uuid.
            Permissão única `issue-dfe-sync-time_view` guarda as 3 rotas
            (mesmo padrão de CategoryProduct/LowReason) — botões internos
            checam `issue-dfe-sync-time_create`/`_edit` via `usePermissions`. */}
        <Route
          path="/cadastros-base/sincronizacao-dfe"
          element={
            <RequirePermission permission="issue-dfe-sync-time_view">
              {lazyRoute(SincronizacaoDfeList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/sincronizacao-dfe/novo"
          element={
            <RequirePermission permission="issue-dfe-sync-time_view">
              {lazyRoute(CreateOrUpdateSincronizacaoDfe)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/sincronizacao-dfe/:issueDfeSyncTimeId"
          element={
            <RequirePermission permission="issue-dfe-sync-time_view">
              {lazyRoute(CreateOrUpdateSincronizacaoDfe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — NFSe Recebidas (Nfse, domínio Fiscal): rotas REAIS,
            REPARO de wiring perdido (módulo já ✅ aprovado, TASK-FE-2730..2735)
            — declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `/buscar-dfe` vem ANTES do path-base (mesma
            prudência de ordem dos siblings CRUD, ainda que aqui não haja
            captura de `:uuid` — módulo sem tela de detalhe/edição). Item de
            menu/permissão restaurados (navigationTree.ts cad-fis-nfse /
            navigationPermissions.ts nfse_view). Gates por rota mirror
            TASK-FE-2735: `nfse_create` guarda "Buscar DFe" (POST síncrono),
            `nfse_view` guarda a Listagem — `nfse_xml`/`nfse_danfe`/
            `nfse_launch` são checados internamente via `usePermissions` nos
            botões/ações da Listagem, não em nível de rota. */}
        <Route
          path="/cadastros-base/nfse-recebidas/buscar-dfe"
          element={
            <RequirePermission permission="nfse_create">
              {lazyRoute(BuscarDfeNfse)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/nfse-recebidas"
          element={
            <RequirePermission permission="nfse_view">
              {lazyRoute(NfseRecebidasList)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Contas Bancárias (Account, domínio Financeiro,
            execução 025): rotas REAIS, declaradas ANTES do catch-all
            /cadastros-base/*. Item de menu e permissão JÁ EXISTIAM
            (navigationTree.ts:152, navigationPermissions.ts:77, cad-fin-bco)
            — nenhuma edição nesses 2 arquivos (TASK-FE-563). `/novo` vem
            ANTES de `/:accountId` para não ser capturado como uuid, mesmo
            padrão de PlanAccount (permissões granulares distintas por rota:
            `accounts_view`/`accounts_create`/`accounts_edit`). */}
        <Route
          path="/cadastros-base/contas-bancarias"
          element={
            <RequirePermission permission="accounts_view">
              {lazyRoute(ContasBancariasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/contas-bancarias/novo"
          element={
            <RequirePermission permission="accounts_create">
              {lazyRoute(CreateOrUpdateContaBancaria)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/contas-bancarias/:accountId"
          element={
            <RequirePermission permission="accounts_edit">
              {lazyRoute(CreateOrUpdateContaBancaria)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Saldo Inicial (OpenMovement, domínio Financeiro,
            execução 031): rotas REAIS, declaradas ANTES do catch-all
            /cadastros-base/* para vencerem o RoutePlaceholder (TASK-FE-031-38).
            Item de menu (`cad-fin-sal`) e permissão (`open-movements_view`)
            JÁ EXISTIAM (navigationTree.ts:267, navigationPermissions.ts:94)
            — nenhuma edição nesses 2 arquivos. SEM rota de edição (contrato
            §2/§3 — `Movement` nunca teve `edit`/`update`). Não confundir com
            "Saldo Inicial" de Estoque (`cad-est-sal-ini` →
            `/cadastros-base/estoques-iniciais`, outro módulo). */}
        <Route
          path="/cadastros-base/saldo-inicial"
          element={
            <RequirePermission permission="open-movements_view">
              {lazyRoute(SaldoInicialList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/saldo-inicial/novo"
          element={
            <RequirePermission permission="open-movements_create">
              {lazyRoute(CreateSaldoInicial)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/saldo-inicial/:openMovementUuid/detalhe"
          element={
            <RequirePermission permission="open-movements_view">
              {lazyRoute(SaldoInicialDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Produtos (namespace `produtos` consolidado,
            TASK-FE-1000): bloco ÚNICO com as 13 rotas do namespace
            `/cadastros-base/produtos/*` — antes espalhadas do L618 ao L2229
            (grupos/categorias/classes intercaladas com Raças/Causa Morte-
            Perda). Consolidação exigida pela TASK-FE-1000: com `catalogo`
            removido do path, `produtos` deixa de ser só prefixo e vira
            TAMBÉM rota-índice, e a dinâmica `:productId` passa a competir em
            profundidade com os 3 irmãos estáticos (`grupos`/`categorias`/
            `classes`). ORDEM EXATA — não presumir, não reordenar:
              1. índice (listagem, TASK-FE-502/506, ex-`/catalogo`)
              2. `/novo` (criar, TASK-FE-503/504)
              3-5. `grupos` + `/novo` + `/:groupProductId` [INTOCADO]
              6-8. `categorias` + `/novo` + `/:categoryProductId` [INTOCADO]
              9-11. `classes` + `/novo` + `/:kindId` [INTOCADO]
              12. `/:productId/detalhe` (detalhe, TASK-FE-505 — mais
                  específico que a dinâmica de edição, vem ANTES dela)
              13. `/:productId` (editar, TASK-FE-503/504) — POR ÚLTIMO,
                  depois de TODOS os estáticos (2, 6→8 base, 9→11 base) e do
                  `/detalhe` — se isto regredir, `/produtos/grupos` cai na
                  tela de edição com `productId = "grupos"` (sintoma silencioso,
                  passa limpo no tsc/build).
            Item de menu (`cad-est-pro-lista`) e permissão de navegação
            (`products_view`/`products_create`/`products_edit`) inalterados —
            só `label`/`path` mudaram em navigationTree.ts (ver TASK-FE-1000).
            `CreateOrUpdateProduto`/`ProdutoDetalhe` já fazem o gate fino de
            botões internamente via `can('products_create'|'products_edit')`. */}
        <Route
          path="/cadastros-base/produtos"
          element={
            <RequirePermission permission="products_view">
              {lazyRoute(ProdutosCatalogoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/novo"
          element={
            <RequirePermission permission="products_create">
              {lazyRoute(CreateOrUpdateProduto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/grupos"
          element={
            <RequirePermission permission="groupproducts_view">
              {lazyRoute(GruposProdutoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/grupos/novo"
          element={
            <RequirePermission permission="groupproducts_view">
              {lazyRoute(CreateOrUpdateGrupoProduto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/grupos/:groupProductId"
          element={
            <RequirePermission permission="groupproducts_view">
              {lazyRoute(CreateOrUpdateGrupoProduto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/categorias"
          element={
            <RequirePermission permission="categoryproducts_view">
              {lazyRoute(CategoriasProdutoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/categorias/novo"
          element={
            <RequirePermission permission="categoryproducts_view">
              {lazyRoute(CreateOrUpdateCategoriaProduto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/categorias/:categoryProductId"
          element={
            <RequirePermission permission="categoryproducts_view">
              {lazyRoute(CreateOrUpdateCategoriaProduto)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/classes"
          element={
            <RequirePermission permission="kinds_view">{lazyRoute(ClassesList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/classes/novo"
          element={
            <RequirePermission permission="kinds_view">
              {lazyRoute(CreateOrUpdateKind)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/classes/:kindId"
          element={
            <RequirePermission permission="kinds_view">
              {lazyRoute(CreateOrUpdateKind)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/:productId/detalhe"
          element={
            <RequirePermission permission="products_view">
              {lazyRoute(ProdutoDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/produtos/:productId"
          element={
            <RequirePermission permission="products_edit">
              {lazyRoute(CreateOrUpdateProduto)}
            </RequirePermission>
          }
        />

        {/* Redirects permanentes das URLs antigas de Produtos (GAP-FE-201,
            Opção B aprovada pelo dev — sem prazo de remoção, TASK-FE-1000).
            Path `catalogo/...` é mais específico que qualquer rota do bloco
            acima, então não compete em ranking mesmo declarado depois. Sem
            `RequirePermission` — redirect não expõe dado, só troca a URL
            antes do guard da rota nova rodar. `uuid` preservado nas 2 de
            edição/detalhe via `RedirectProductDetail`/`RedirectProductEdit`. */}
        <Route
          path="/cadastros-base/produtos/catalogo"
          element={<Navigate to="/cadastros-base/produtos" replace />}
        />
        <Route
          path="/cadastros-base/produtos/catalogo/novo"
          element={<Navigate to="/cadastros-base/produtos/novo" replace />}
        />
        <Route
          path="/cadastros-base/produtos/catalogo/:productId/detalhe"
          element={<RedirectProductDetail />}
        />
        <Route
          path="/cadastros-base/produtos/catalogo/:productId"
          element={<RedirectProductEdit />}
        />

        {/* Cadastros Base — Estoque Inicial (OpeningBalance, execução 026):
            rotas REAIS, declaradas ANTES do catch-all /cadastros-base/* para
            vencerem o RoutePlaceholder (TASK-FE-1046). `/novo` vem ANTES de
            `/:openingBalanceUuid` para não ser capturado como uuid, mesmo
            padrão de Armazéns/Raças/Espécies. Gates GRANULARES por rota
            (contrato de tela §3/Roteiro item 2 — estilo PlanAccount/
            ContasBancarias, não permissão única de Armazém): lista e
            detalhe por `openingbalances_view`, criação por
            `openingbalances_create`, edição por `openingbalances_edit`. A
            rota de edição usa `:openingBalanceId` (NÃO `:openingBalanceUuid`)
            porque `CreateOrUpdateEstoqueInicial.tsx` desestrutura
            `useParams<{ openingBalanceId }>()` — confirmado por leitura do
            componente; usar o nome errado de param faria `isEditing` cair
            para `false` (isValidGuid(undefined)) e a tela renderizar como
            criação em vez de edição, silenciosamente. */}
        <Route
          path="/cadastros-base/estoques-iniciais"
          element={
            <RequirePermission permission="openingbalances_view">
              {lazyRoute(EstoqueInicialList)}
            </RequirePermission>
          }
        />
        {/* Administrativo — Gestão Pessoal — Funções (Function): LISTAGEM real
            (TASK-FN-FE-01) + formulário create/edit real (TASK-FN-FE-02),
            declaradas ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder — primeira tela real desta área. `authorize()`
            real (create/edit/delete) é responsabilidade do backend via
            `functions_create`/`functions_edit`/`functions_delete` (403) —
            aqui só evitamos renderizar a tela sem a permissão mínima de
            leitura, mesmo padrão de /cadastros-base/marcadores. */}
        <Route
          path="/administrativo/funcoes"
          element={
            <RequirePermission permission="functions_view">
              {lazyRoute(FuncoesList)}
            </RequirePermission>
          }
        />

        {/* Doc. Fiscal/Entrada (Invoice, TASK-FE-2769) — rotas REAIS,
            declaradas ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder. Canônico em `Administrativo › Estoque › Doc.
            Fiscal / Entrada` (mirror 1:1 do legado — `sidebar.blade.php`,
            grupo único "Estoque", `route('invoices.index')` — o legado NÃO
            tem um módulo "Fiscal" separado). CORREÇÃO de E2E do dono:
            morava em `/fiscal/documentos-fiscais`, com item de MENU
            duplicado sob "Gestão Fiscal" (`fis-entrada-docs`, removido de
            `navigationTree.ts`) e o item canônico
            (`adm-est-dfe` → `/administrativo/doc-fiscal`) caindo no
            `RoutePlaceholder` "em construção" por falta de rota real aqui.
            URL migrada (não só o item de menu) para não deixar o header/
            NavRail destacando o módulo "Fiscal" ao navegar por uma tela
            listada em "Administrativo" — `getActiveModule()` resolve o
            módulo ativo pelo prefixo da URL. Listagem+Visualização
            guardadas por `invoices_view`; Formulário (criar/editar) por
            `invoices_create`/`invoices_edit` (`anyOf` — o próprio componente
            distingue create/edit internamente via `canSave`); Excluir é
            ação da listagem, gate `invoices_delete` já aplicado em
            `InvoiceActionsMenu.tsx`. `/novo` ANTES de `/:invoiceId` para não
            ser capturado como uuid. */}
        <Route
          path="/administrativo/doc-fiscal"
          element={
            <RequirePermission permission="invoices_view">
              {lazyRoute(InvoicesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/doc-fiscal/novo"
          element={
            <RequirePermission anyOf={['invoices_create', 'invoices_edit']}>
              {lazyRoute(CreateOrUpdateInvoice)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/doc-fiscal/:invoiceId"
          element={
            <RequirePermission anyOf={['invoices_create', 'invoices_edit']}>
              {lazyRoute(CreateOrUpdateInvoice)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/doc-fiscal/:invoiceId/visualizar"
          element={
            <RequirePermission permission="invoices_view">
              {lazyRoute(InvoiceDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estoques-iniciais/novo"
          element={
            <RequirePermission permission="openingbalances_create">
              {lazyRoute(CreateOrUpdateEstoqueInicial)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/funcoes/novo"
          element={
            <RequirePermission permission="functions_view">
              {lazyRoute(CreateOrUpdateFuncao)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estoques-iniciais/:openingBalanceUuid"
          element={
            <RequirePermission permission="openingbalances_view">
              {lazyRoute(EstoqueInicialDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/estoques-iniciais/:openingBalanceId/editar"
          element={
            <RequirePermission permission="openingbalances_edit">
              {lazyRoute(CreateOrUpdateEstoqueInicial)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Inventário (Equipment, execução 026): rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder (TASK-FE-1011). `/novo` vem ANTES de
            `/:equipmentId` para não ser capturado como uuid, mesmo padrão de
            Armazéns/Raças/Espécies. Gate ÚNICO `equipments_view` em TODAS as
            rotas (Equipment-Frontend-Contrato §3 — mirror CostCenter/
            FamiliaBens, NÃO o padrão granular de PlanAccount/OpeningBalance):
            a autorização real de criar/editar/excluir é 403 do backend +
            gate de botão client-side (`can('equipments_create'/'_edit'/
            '_delete')`, já implementado em HeaderTable.tsx/index.tsx/
            CreateOrUpdateEquipamento.tsx). `:equipmentId` é o nome real
            desestruturado por `useParams<{ equipmentId }>()` em
            `CreateOrUpdateEquipamento.tsx`/`DetalheEquipamento.tsx`
            (confirmado por leitura dos componentes). */}
        <Route
          path="/cadastros-base/inventario"
          element={
            <RequirePermission permission="equipments_view">
              {lazyRoute(InventarioList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/inventario/novo"
          element={
            <RequirePermission permission="equipments_view">
              {lazyRoute(CreateOrUpdateEquipamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/inventario/:equipmentId"
          element={
            <RequirePermission permission="equipments_view">
              {lazyRoute(CreateOrUpdateEquipamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/inventario/:equipmentId/detalhe"
          element={
            <RequirePermission permission="equipments_view">
              {lazyRoute(DetalheEquipamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/funcoes/:functionId"
          element={
            <RequirePermission permission="functions_view">
              {lazyRoute(CreateOrUpdateFuncao)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Gestão Pessoal — Eventos (Event): LISTAGEM real
            (TASK-FE-EVT-01) + formulário create/edit real (TASK-FE-EVT-02),
            declaradas ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder, mesmo bloco/posição do precedente
            /administrativo/funcoes. `/novo` ANTES de `/:eventId` (senão o
            router captura "novo" como parâmetro). Gate ÚNICO `events_view`
            nas 3 rotas (mirror `functions_view` em Funcoes) — a autorização
            real de criar/editar/excluir é 403 do backend + gate de botão
            client-side (`can('events_create'/'_edit'/'_delete')`, já
            implementado em HeaderTable.tsx/index.tsx/CreateOrUpdateEvento.tsx).
            `:eventId` é o nome real desestruturado por
            `useParams<{ eventId }>()` em `CreateOrUpdateEvento.tsx`. */}
        <Route
          path="/administrativo/eventos"
          element={
            <RequirePermission permission="events_view">{lazyRoute(EventosList)}</RequirePermission>
          }
        />
        <Route
          path="/administrativo/eventos/novo"
          element={
            <RequirePermission permission="events_view">
              {lazyRoute(CreateOrUpdateEvento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/eventos/:eventId"
          element={
            <RequirePermission permission="events_view">
              {lazyRoute(CreateOrUpdateEvento)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Gestão Pessoal — Registro de Faltas (Absence,
            97-Esteiras/003 Tarefas 12/13): LISTAGEM real (Tarefa 12) +
            formulário create/edit real (Tarefa 13), declaradas ANTES do
            catch-all /administrativo/* para vencerem o RoutePlaceholder,
            mesmo bloco/posição do precedente /administrativo/eventos.
            `/novo` ANTES de `/:absenceUuid` (senão o router captura "novo"
            como parâmetro). Gate ÚNICO `absences_view` nas 3 rotas (mirror
            `events_view` em Eventos) — a autorização real de criar/editar/
            excluir é 403 do backend + gate de botão client-side
            (`can('absences_create'/'_edit'/'_delete')`, já implementado em
            HeaderTable.tsx/index.tsx/CreateOrUpdateAbsence.tsx).
            `:absenceUuid` é o nome real desestruturado por
            `useParams<{ absenceUuid }>()` em `CreateOrUpdateAbsence.tsx`. */}
        <Route
          path="/administrativo/faltas"
          element={
            <RequirePermission permission="absences_view">
              {lazyRoute(AbsencesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/faltas/novo"
          element={
            <RequirePermission permission="absences_view">
              {lazyRoute(CreateOrUpdateAbsence)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/faltas/:absenceUuid"
          element={
            <RequirePermission permission="absences_view">
              {lazyRoute(CreateOrUpdateAbsence)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Gestão Pessoal — Funcionário x Eventos
            (EmployeeEvent, TASK-FE-FXE-01/02): 3 rotas REAIS (picker +
            criação inline + Matriz de Vínculos), declaradas ANTES do
            catch-all /administrativo/* para vencerem o RoutePlaceholder,
            mesmo bloco/posição do precedente /administrativo/eventos. Item
            de menu (adm-gp-fxe) e as 4 permissions (employeeevents_view/
            create/edit/delete) JÁ EXISTEM (navigationTree.ts:434,
            navigationPermissions.ts:226, permissionsCatalog.json:339-342) —
            nenhuma alteração nelas.

            [REVISADO 2026-10-07, TASK-104] `/novo` acrescentada — supersede
            parcialmente o comentário anterior ("SEM rota /novo/CRUD
            unitário de vínculo isolado, DA-EE-FE-01 INVIOLÁVEL"): decisão
            nova do dono, fluxo de criação volta a ser PÁGINA ÚNICA sem
            modal (mirror fiel do legado `employeeevents/_forms.blade`),
            `AdicionarVinculoModal` removido. `/novo` é estaticamente
            literal e sempre vence `:employeeUuid` no algoritmo de ranking
            do React Router v6 independente da ordem de declaração, mas é
            declarada ANTES por clareza/convenção do arquivo. Gate
            `employeeevents_create` (distinto do `_view` das outras 2 —
            criar vínculo exige a permissão de criação, mirror do botão
            "Adicionar vínculo" do header). `:employeeUuid` é o nome real
            desestruturado por `useParams<{ employeeUuid }>()` em
            `MatrizVinculosFuncionario.tsx`; `employeeUuid === undefined`
            dentro do componente só ocorre nesta rota `/novo` (as 3 rotas
            mapeiam para o mesmo componente — modo CRIAR vs EDITAR decidido
            pela ausência/presença do param). */}
        <Route
          path="/administrativo/func-eventos"
          element={
            <RequirePermission permission="employeeevents_view">
              {lazyRoute(FuncionarioXEventosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/func-eventos/novo"
          element={
            <RequirePermission permission="employeeevents_create">
              {lazyRoute(MatrizVinculosFuncionario)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/func-eventos/:employeeUuid"
          element={
            <RequirePermission permission="employeeevents_view">
              {lazyRoute(MatrizVinculosFuncionario)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Solicitação de Compras
            (RequestPurchase, TASK-RP-FE-10): 3 rotas REAIS, declaradas
            ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder. Item de menu (adm-sup-sol) e permissão
            (request-purchases_view) JÁ EXISTEM (navigationTree.ts:390,
            navigationPermissions.ts:180) — nenhuma alteração neles.
            `/novo` vem ANTES de `/:requestPurchaseId` para não ser
            capturado como GUID, mesmo padrão de Armazéns/Raças.
            Gate `request-purchases_view` em TODAS as rotas — a
            autorização real de criar/editar é 403 do backend.
            `:requestPurchaseId` é o nome real desestruturado por
            `useParams<{ requestPurchaseId }>()` em
            `CreateOrUpdateSolicitacao.tsx` (confirmado por leitura
            do componente). */}
        <Route
          path="/administrativo/solicitacao"
          element={
            <RequirePermission permission="request-purchases_view">
              {lazyRoute(SolicitacaoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/solicitacao/novo"
          element={
            <RequirePermission permission="request-purchases_view">
              {lazyRoute(CreateOrUpdateSolicitacao)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/solicitacao/:requestPurchaseId"
          element={
            <RequirePermission permission="request-purchases_view">
              {lazyRoute(CreateOrUpdateSolicitacao)}
            </RequirePermission>
          }
        />
        {/* Visualização somente-leitura (paridade com o legado: "Visualizar"
            sempre disponível na lista, independente do status). Reusa o MESMO
            CreateOrUpdateSolicitacao em modo leitura (via `useLocation`),
            padrão dos módulos /visualizar (Fiscal/Financeiro/Operacional). */}
        <Route
          path="/administrativo/solicitacao/:requestPurchaseId/visualizar"
          element={
            <RequirePermission permission="request-purchases_view">
              {lazyRoute(CreateOrUpdateSolicitacao)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Meus Processos (RequestPurchase,
            TASK-RP-FE-13, esteira 037): 1 rota REAL, declarada ANTES do
            catch-all /administrativo/* para vencer o RoutePlaceholder, mesmo
            padrão do bloco `/administrativo/solicitacao` acima. Item de menu
            (`adm-sup-meu`) e permissão (`request-purchases_view`) JÁ EXISTEM/
            JÁ CORRETOS (navigationTree.ts:448, navigationPermissions.ts:222)
            — esta Tarefa só conecta a rota real, componente já pronto. */}
        <Route
          path="/administrativo/meus-processos"
          element={
            <RequirePermission permission="request-purchases_view">
              {lazyRoute(MeusProcessosList)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Rejeitados / Cancelados
            (RequestPurchase, TASK-RP-FE-13, esteira 037): 1 rota REAL,
            declarada ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder, mesmo padrão do bloco acima. Item de menu
            (`adm-sup-rej`) JÁ EXISTIA. A permissão volta a ser
            `rejected-requests_view`, igual ao legado e ao que a API passou a
            exigir (T-081-API-03), o que supera a decisão GAP-UX-CPS-01
            (execução 081, T-081-FE-02). */}
        <Route
          path="/administrativo/rejeitados"
          element={
            <RequirePermission permission="rejected-requests_view">
              {lazyRoute(RejeitadosList)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Cotações (hub tenant-wide de
            RequestPurchase, TASK-CQ-FE-13): 1 rota REAL, declarada ANTES do
            catch-all /administrativo/* para vencer o RoutePlaceholder,
            mesmo padrão do bloco `/administrativo/solicitacao` acima. Item
            de menu (`adm-sup-cot`) e permissão (`request-quotation_view`)
            JÁ EXISTEM (navigationTree.ts:451, navigationPermissions.ts:225,
            DEC-CQ-09) — nenhuma alteração neles. NÃO é uma tela nova de
            RequestQuotation (ver cabeçalho de `Administrativo/Cotacoes/
            index.tsx`). */}
        <Route
          path="/administrativo/cotacoes"
          element={
            <RequirePermission permission="request-quotation_view">
              {lazyRoute(CotacoesList)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Compras (hub tenant-wide de
            RequestPurchase, fila `in-purchase`, TASK-CPS-FE-02): 1 rota REAL,
            declarada ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder, mesmo padrão do bloco `/administrativo/cotacoes`
            acima. Item de menu (`adm-sup-com`) já existia
            (navigationTree.ts:453); a permissão volta a ser `request-buy_view`,
            igual ao legado e ao que a API passou a exigir (T-081-API-03), o
            que supera a decisão GAP-UX-CPS-01 (execução 081, T-081-FE-02). NÃO é uma
            tela nova de RequestPurchase, é a 3ª visão tenant-wide da MESMA
            entidade (mirror `/administrativo/cotacoes`). */}
        <Route
          path="/administrativo/compras"
          element={
            <RequirePermission permission="request-buy_view">
              {lazyRoute(ComprasList)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Autorização (hub tenant-wide de
            RequestPurchase, TASK-AUTH-FE-02, esteira 038): 1 rota REAL,
            declarada ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder, mesmo padrão do bloco `/administrativo/compras`
            acima. Item de menu (`adm-sup-aut`) e permissão
            (`request-authorization_view`) JÁ EXISTEM (navigationTree.ts:452,
            navigationPermissions.ts:236) — nenhuma alteração neles. NÃO é uma
            tela nova de RequestPurchase, é a 4ª visão tenant-wide da MESMA
            entidade (mirror `/administrativo/cotacoes`/`/administrativo/compras`). */}
        <Route
          path="/administrativo/autorizacao"
          element={
            <RequirePermission permission="request-authorization_view">
              {lazyRoute(AutorizacaoList)}
            </RequirePermission>
          }
        />

        {/* Tela de detalhe única "Autorizar Solicitação" (TASK-AUTH-FE-03,
            esteira 038) — declarada ANTES do catch-all /administrativo/*,
            mesmo padrão do bloco acima. Guarda de leitura idêntica à
            listagem (`request-authorization_view`); mutações (aprovar/
            reprovar/transferir) são gateadas no backend por
            `request-authorization_edit` — o front só some/desabilita os
            botões (`usePermissions().can(...)`, dentro do container). */}
        <Route
          path="/administrativo/autorizacao/:uuid"
          element={
            <RequirePermission permission="request-authorization_view">
              {lazyRoute(AutorizarSolicitacao)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Recebimentos (hub tenant-wide de
            RequestPurchase, TASK-RCB-FE-01, esteira 040): 4 rotas REAIS,
            declaradas ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder, mesmo padrão dos blocos `/administrativo/
            compras`/`/administrativo/autorizacao` acima. NÃO é uma tela nova
            de RequestPurchase, é a 5ª visão tenant-wide da MESMA entidade. */}
        <Route
          path="/administrativo/recebimentos"
          element={
            <RequirePermission permission="request-receipts_view">
              {lazyRoute(RecebimentosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/recebimentos/:uuid/confirmar"
          element={
            <RequirePermission permission="request-receipts_edit">
              {lazyRoute(ConfirmarRecebimentoPage)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/recebimentos/:uuid/financeiro"
          element={
            <RequirePermission permission="request-purchases_financial">
              {lazyRoute(GerarFinanceiroPage)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/recebimentos/:uuid/finalizar"
          element={
            <RequirePermission permission="request-purchases_financial">
              {lazyRoute(FinalizarPedidoPage)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Saldo de Estoque (Stock, TASK-STK-FE-01):
            1 rota REAL (listagem), declarada ANTES do catch-all
            /administrativo/* para vencer o RoutePlaceholder. Item de menu
            (adm-est-sal) e permissão (stocks_view) JÁ EXISTEM
            (navigationTree.ts:422, navigationPermissions.ts) — nenhuma
            alteração neles. Módulo 100% leitura — sem rota de create/edit.
            `/detalhe` (TASK-STK-FE-02) e `/relatorio` (TASK-STK-FE-03) ainda
            não existem — conectadas em Tarefas futuras. */}
        <Route
          path="/administrativo/saldo-estoque"
          element={
            <RequirePermission permission="stocks_view">
              {lazyRoute(SaldoEstoqueList)}
            </RequirePermission>
          }
        />

        {/* Detalhe agrupado (Stock, TASK-STK-FE-02) — 2 UUIDs via
            querystring (`DA-STK-04`, `?product_uuid=&warehouse_uuid=`), não
            path-param — sem colisão de segmento, declarada ANTES do
            catch-all /administrativo/*. Mesma permissão `stocks_view`. */}
        <Route
          path="/administrativo/saldo-estoque/detalhe"
          element={
            <RequirePermission permission="stocks_view">
              {lazyRoute(SaldoEstoqueDetalhe)}
            </RequirePermission>
          }
        />

        {/* Relatório/Export (Stock, TASK-STK-FE-03) — mesmos filtros da
            Listagem, botão "Gerar prévia" + 2 exports (PDF/XLSX)
            desabilitados até haver prévia, declarada ANTES do catch-all
            /administrativo/*. Mesma permissão `stocks_view`. */}
        <Route
          path="/administrativo/saldo-estoque/relatorio"
          element={
            <RequirePermission permission="stocks_view">
              {lazyRoute(SaldoEstoqueRelatorio)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Correção de Estoque (StockCorrection,
            TASK-FE-COR-01/02): 2 rotas REAIS (listagem + detalhe),
            declaradas ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder. Item de menu (adm-est-cor) e as 3 permissions
            (stock-corrections_view/create/delete) JÁ EXISTEM
            (navigationTree.ts:419, navigationPermissions.ts:215,
            permissionsCatalog.json:868-870) — nenhuma alteração nelas. `:uuid`
            DEPOIS do path fixo de listagem, mesma ordem de precedência já
            usada em /administrativo/eventos → /administrativo/eventos/:eventId.
            Sem rota de formulário/`novo` — não existe cadastro/edição
            unitária (contrato de API §1). */}
        <Route
          path="/administrativo/correcao"
          element={
            <RequirePermission permission="stock-corrections_view">
              {lazyRoute(CorrecaoEstoqueList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/correcao/:uuid"
          element={
            <RequirePermission permission="stock-corrections_view">
              {lazyRoute(CorrecaoEstoqueDetalhe)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Baixa de Estoque (StockWriteoff, esteira 038) —
            4 rotas REAIS, declaradas ANTES do catch-all /administrativo/*
            para vencerem o RoutePlaceholder. Item de menu (adm-est-bai) e as
            3 permissions (stock-writeoffs_view/create/delete) JÁ EXISTEM
            (navigationTree.ts:472, navigationPermissions.ts:252,
            permissionsCatalog.json:879-882) — nenhuma alteração nelas.
            `/nova`/`/relatorio` (paths fixos) ANTES de `:uuid`, mesma ordem
            de precedência já usada em /administrativo/correcao →
            /administrativo/correcao/:uuid. Sem rota de edição — a Baixa não
            tem update/edit (contrato de tela §2.1). `/relatorio` guardada
            por `stock_writeoffs_report` (underscore, TASK-FE-3005). */}
        <Route
          path="/administrativo/baixa-estoque"
          element={
            <RequirePermission permission="stock-writeoffs_view">
              {lazyRoute(BaixaEstoqueList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/baixa-estoque/nova"
          element={
            <RequirePermission permission="stock-writeoffs_create">
              {lazyRoute(CreateBaixaEstoque)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/baixa-estoque/relatorio"
          element={
            <RequirePermission permission="stock_writeoffs_report">
              {lazyRoute(BaixaEstoqueReport)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/baixa-estoque/:uuid"
          element={
            <RequirePermission permission="stock-writeoffs_view">
              {lazyRoute(BaixaEstoqueDetalhe)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Suprimentos — Parâmetros SLA (SupplyStatusSla,
            TASK-FE-SLA-01): 1 rota REAL, declarada ANTES do catch-all
            /administrativo/* para vencer o RoutePlaceholder — mesmo bloco/
            grupo de menu Suprimentos de `/administrativo/solicitacao`/
            `/administrativo/saldo-estoque`. Item de menu (adm-sup-sla) e
            permissão (supply-status-sla_view) JÁ EXISTEM
            (navigationTree.ts:402, navigationPermissions.ts:202) — esta
            Tarefa só conecta a rota real. Sem `/novo` nem `/:uuid` — não
            existem (DEC-D do contrato de API): a listagem satisfaz sozinha
            "Parâmetros SLA" + "Supply Status Sla View" (leitura) + "Supply
            Status Sla Edit" (edição inline, gate `supply-status-sla_edit`
            só na coluna de ações, não na rota). */}
        <Route
          path="/administrativo/sla"
          element={
            <RequirePermission permission="supply-status-sla_view">
              {lazyRoute(SlaList)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Fábrica — Formulação (Food, TASK-FOOD-FE-05/06/07):
            3 rotas REAIS (listagem, criar, editar), declaradas ANTES do
            catch-all /administrativo/* para vencerem o RoutePlaceholder.
            Item de menu (`adm-est-fab`) e permissão (`anyOf` de `food_*`/
            `food-beat_*`) JÁ EXISTEM (navigationTree.ts:429,
            navigationPermissions.ts:222) — esta Tarefa só conecta as rotas
            reais. `/novo` ANTES de `/:foodId` não é estritamente necessário
            aqui (segmentos literais distintos, sem colisão de path-param —
            diferente do caso Armazéns/Raças, onde o path-param vem logo
            após o path-base sem segmento fixo no meio), mas mantido pela
            mesma convenção de ordem já usada em Usuários/Contratos. */}
        {/* Path-base movido de `/administrativo/fabrica` para
            `/administrativo/fabrica/formulacao` (pedido do dono) — sibling de
            `/administrativo/fabrica/batidas`. Redirect de compat abaixo preserva
            links/bookmarks antigos e o clique no nó-pai "Fábrica" do menu. */}
        <Route
          path="/administrativo/fabrica"
          element={<Navigate to="/administrativo/fabrica/formulacao" replace />}
        />
        <Route
          path="/administrativo/fabrica/formulacao"
          element={
            <RequirePermission permission="food_view">{lazyRoute(FoodList)}</RequirePermission>
          }
        />
        <Route
          path="/administrativo/fabrica/formulacao/novo"
          element={
            <RequirePermission permission="food_create">
              {lazyRoute(CreateOrUpdateFood)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/fabrica/formulacao/:foodId"
          element={
            <RequirePermission permission="food_view">
              {lazyRoute(CreateOrUpdateFood)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Fábrica — Batida (FoodBeat, TASK-FB-FE-05/06/07):
            3 rotas REAIS (listagem, criar, editar), declaradas ANTES do
            catch-all /administrativo/* para vencerem o RoutePlaceholder,
            mirror exato do bloco Food acima. Item de menu (`adm-est-fab`) e
            permissão (`anyOf` incluindo `food-beat_*`) JÁ EXISTIAM — esta
            Tarefa só conecta as rotas reais. `/novo` ANTES de
            `/:foodBeatId`, mirror convenção do projeto; `:foodBeatId` gated
            por `food-beat_view` (não `food-beat_edit`) — mesmo padrão exato
            de Food, o botão de submit dentro do form é quem checa
            `food-beat_edit`, não a rota. */}
        <Route
          path="/administrativo/fabrica/batidas"
          element={
            <RequirePermission permission="food-beat_view">
              {lazyRoute(FoodBeatList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/fabrica/batidas/novo"
          element={
            <RequirePermission permission="food-beat_create">
              {lazyRoute(CreateOrUpdateFoodBeat)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/fabrica/batidas/:foodBeatId"
          element={
            <RequirePermission permission="food-beat_view">
              {lazyRoute(CreateOrUpdateFoodBeat)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Trans. Armazém (WarehouseTransfer,
            TASK-WT-FE-02/TASK-WT-FE-03): listagem + criação em lote,
            declaradas ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder, mirror exato do bloco Batida acima. Item de
            menu (`adm-est-trm`) e permissões (`warehouse-transfer_view`/
            `_create`) JÁ EXISTIAM. `/novo` vem ANTES de `/:uuid` (chega em
            TASK-WT-FE-04) para não ser capturado como GUID, mesmo padrão de
            Batida/Contrato/Armazéns/Raças. */}
        <Route
          path="/administrativo/transf-armazens"
          element={
            <RequirePermission permission="warehouse-transfer_view">
              {lazyRoute(WarehouseTransferList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/transf-armazens/novo"
          element={
            <RequirePermission permission="warehouse-transfer_create">
              {lazyRoute(CreateWarehouseTransfer)}
            </RequirePermission>
          }
        />
        {/* Edição + visualização de 1 linha (TASK-WT-FE-04) — `/novo` acima
            vence `/:uuid` por ordem de declaração (mesmo padrão de
            Batida/Contrato/Armazéns/Raças). Rota gated por `_view` (mirror
            `FoodBeat`/`Food`: quem só tem `_view` abre a MESMA tela com os
            campos desabilitados; quem tem `_edit` edita de verdade). */}
        <Route
          path="/administrativo/transf-armazens/:uuid"
          element={
            <RequirePermission permission="warehouse-transfer_view">
              {lazyRoute(UpdateWarehouseTransfer)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Trans. Fazendas (FarmTransfer,
            Tarefas 01/02/03): listagem + criação em lote (com subfluxo
            financeiro opcional) + detalhe dedicado read-only, declaradas
            ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder, mirror exato do bloco Trans. Armazém acima.
            Item de menu (`adm-est-trf`) e permissões
            (`warehouse-transfer-farm_view`/`_create`/`_delete`) JÁ
            EXISTIAM. `/novo` vem ANTES de `/:uuid` (NÃO é edição — é o
            detalhe dedicado, `GAP-FARMTRANSFER-FE-04`) para não ser
            capturado como GUID, mesmo padrão de Batida/Contrato/
            Armazéns/Trans. Armazém. */}
        <Route
          path="/administrativo/transf-fazendas"
          element={
            <RequirePermission permission="warehouse-transfer-farm_view">
              {lazyRoute(FarmTransferList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/transf-fazendas/novo"
          element={
            <RequirePermission permission="warehouse-transfer-farm_create">
              {lazyRoute(CreateFarmTransfer)}
            </RequirePermission>
          }
        />
        {/* Detalhe dedicado read-only (Tarefa 01, `GAP-FARMTRANSFER-FE-04`)
            — NÃO é edição (`RT-06 NAO_APLICAVEL`). `/novo` acima vence
            `/:uuid` por ordem de declaração. */}
        <Route
          path="/administrativo/transf-fazendas/:uuid"
          element={
            <RequirePermission permission="warehouse-transfer-farm_view">
              {lazyRoute(FarmTransferDetalhe)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Requisição/Saída (Requisition,
            97-Esteiras/002, Tarefas 04/05): listagem + criação em lote +
            detalhe dedicado read-only, declaradas ANTES do catch-all
            /administrativo/* para vencer o RoutePlaceholder, mirror
            ESTRUTURAL do bloco Trans. Fazendas acima. Item de menu
            (`adm-est-req`) e permissão de navegação (`requisitions_view`)
            JÁ EXISTIAM (`navigationTree.ts:468`). `/novo` vem ANTES de
            `/:uuid` (detalhe dedicado, `GAP-REQUISICAO-FE-02` — NÃO é
            edição, `RT-06 NAO_APLICAVEL`) para não ser capturado como GUID,
            mesmo padrão dos blocos de Estoque acima. */}
        <Route
          path="/administrativo/requisicao"
          element={
            <RequirePermission permission="requisitions_view">
              {lazyRoute(RequisitionList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/requisicao/novo"
          element={
            <RequirePermission permission="requisitions_create">
              {lazyRoute(CreateRequisition)}
            </RequirePermission>
          }
        />
        {/* Detalhe dedicado read-only (Tarefa 04, `GAP-REQUISICAO-FE-02`) —
            NÃO é edição (`MM-02`/`RT-06` `NAO_APLICAVEL`). `/novo` acima
            vence `/:uuid` por ordem de declaração. */}
        <Route
          path="/administrativo/requisicao/:uuid"
          element={
            <RequirePermission permission="requisitions_view">
              {lazyRoute(RequisitionDetalhe)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Devolução/Entrada (Devolution,
            97-Esteiras/037): listagem + criação em lote + tela única de
            visualização/edição (`FID-11`), declaradas ANTES do catch-all
            /administrativo/* para vencer o RoutePlaceholder, mirror
            ESTRUTURAL do bloco Requisição/Saída acima. Item de menu
            (`adm-est-dev`) e permissões (`devolution_*`, SINGULAR) JÁ
            EXISTIAM. `/novo` vem ANTES de `/:uuid` para não ser capturado
            como GUID, mesma disciplina de todos os blocos de Estoque. */}
        <Route
          path="/administrativo/devolucao"
          element={
            <RequirePermission permission="devolution_view">
              {lazyRoute(DevolucaoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/devolucao/novo"
          element={
            <RequirePermission permission="devolution_create">
              {lazyRoute(CreateDevolucao)}
            </RequirePermission>
          }
        />
        {/* Ver + Editar mescladas em UMA tela (`FID-11`, decisão #1) — NÃO é
            só leitura como `RequisitionDetalhe` (Requisição não tem `update`). */}
        <Route
          path="/administrativo/devolucao/:uuid"
          element={
            <RequirePermission permission="devolution_view">
              {lazyRoute(UpdateDevolucao)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Estoque — Entrada de Insumos (InputEntry,
            esteira 037): listagem + tela de DETALHE (leitura) + tela de
            criação/edição em lote multi-item + baixa financeira automática,
            declaradas ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder, mirror ESTRUTURAL do bloco Devolução/Entrada
            acima. Item de menu (`adm-est-eis`) e permissão de navegação
            (`input_entries_view`) são NOVOS nesta esteira. `/novo` vem
            ANTES de `/:uuid` para não ser capturado como GUID, mesma
            disciplina de todos os blocos de Estoque. */}
        <Route
          path="/administrativo/entrada-insumos"
          element={
            <RequirePermission permission="input_entries_view">
              {lazyRoute(EntradaInsumosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/entrada-insumos/novo"
          element={
            <RequirePermission permission="input_entries_create">
              {lazyRoute(CreateOrUpdateEntradaInsumos)}
            </RequirePermission>
          }
        />
        {/* Correção AD F-084 (Execução 063) — Ver e Editar deixam de
            compartilhar a MESMA rota/tela (decisão #2 original do roteiro
            037 revertida pelo dono nesta correção): "Visualizar" abre
            `DetalheEntradaInsumos` (somente leitura, `input_entries_view`,
            mirror `/cadastros-base/produtos/:productId/detalhe`); "Editar"
            é ação EXPLÍCITA (botão no detalhe + ícone na listagem) para
            `CreateOrUpdateEntradaInsumos`, agora gate por
            `input_entries_edit` (mirror `/cadastros-base/produtos/
            :productId`) — antes exigia só `input_entries_view` porque a
            mesma tela servia os dois papéis. `InputEntryRequest` continua
            um Request unificado (store+update) no backend; nada muda lá. */}
        <Route
          path="/administrativo/entrada-insumos/:uuid/detalhe"
          element={
            <RequirePermission permission="input_entries_view">
              {lazyRoute(DetalheEntradaInsumos)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/entrada-insumos/:uuid"
          element={
            <RequirePermission permission="input_entries_edit">
              {lazyRoute(CreateOrUpdateEntradaInsumos)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Usuários (User, execução 027, TASK-FE-803):
            3 rotas REAIS, declaradas ANTES do catch-all /cadastros-base/*
            para vencerem o RoutePlaceholder — mesmo padrão de Marcadores.
            Item de menu (cad-pes-usr) e permissão de navegação (users_view)
            JÁ EXISTIAM (navigationTree.ts/navigationPermissions.ts) — nenhuma
            alteração neles. `/novo` vem ANTES de `/:userId` para não ser
            capturado como GUID, mesmo padrão de Armazéns/Raças/Espécies.
            Páginas-alvo são PLACEHOLDER mínimo nesta rodada (lote de
            fundação) — a listagem/formulário reais chegam em
            TASK-FE-805/811/812, no próximo lote. */}
        <Route
          path="/cadastros-base/usuarios"
          element={
            <RequirePermission permission="users_view">{lazyRoute(UsuariosList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/usuarios/novo"
          element={
            <RequirePermission permission="users_view">
              {lazyRoute(CreateOrUpdateUsuario)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/usuarios/:userId"
          element={
            <RequirePermission permission="users_view">
              {lazyRoute(CreateOrUpdateUsuario)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Depreciação Mensal / Depreciação Animal
            (Depreciation, execução 027): rota REAL única (sem /novo, sem
            /:id — não há CRUD, TASK-FE-842), declarada ANTES do catch-all
            /cadastros-base/* para vencer o RoutePlaceholder. Item de menu JÁ
            EXISTE (cad-ben-dep, grupo "Bens/Ativos", navigationTree.ts:332)
            — esta Tarefa só liga a rota real e amplia o gate para `anyOf`
            (navigationPermissions.ts:130 já ampliado nesta mesma Tarefa). 2
            abas (Equipamento/Animal, `?tab=0|1` via `useCustomSearch` dentro
            do próprio componente) — usuário com QUALQUER uma das 2 visões
            alcança a rota; cada aba internamente gated pela sua permissão
            específica (TASK-FE-845). */}
        <Route
          path="/cadastros-base/depreciacao-mensal"
          element={
            <RequirePermission anyOf={['depreciations_view', 'depreciation_animals_view']}>
              {lazyRoute(DepreciacaoMensal)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Depreciação Animal (STANDALONE, execução 055):
            [DECISÃO DO DONO — navegação fiel ao legado] item de menu PRÓPRIO
            (cad-ben-dep-ani, navigationTree.ts) + rota dedicada, gate SÓ
            `depreciation_animals_view` (reuso, DEC-006 — navigationPermissions.ts).
            Mesmo componente de `/cadastros-base/depreciacao-mensal`, prop
            `mode="animal"` (wrapper fino declarado acima) — sem barra de
            abas, mesma lógica/hooks/colunas/filtro/modal da aba Animal já
            fiel. Declarada ANTES do catch-all /cadastros-base/*, mirror da
            rota irmã acima. "Depreciação Mensal" (Equipamento) permanece
            intocada. */}
        <Route
          path="/cadastros-base/depreciacao-animal"
          element={
            <RequirePermission permission="depreciation_animals_view">
              {lazyRoute(DepreciacaoAnimal)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Parâmetros / Peso (ParameterWeight):
            LISTAGEM real (TASK-PW-FE-01) + formulário create/edit real
            (TASK-PW-FE-02), declaradas ANTES do catch-all /cadastros-base/*
            para vencer o RoutePlaceholder, mesmo bloco/padrão de
            /cadastros-base/diagnostico-gestacao. Menu (`cad-pec-par`,
            navigationTree.ts:330) e permissão (navigationPermissions.ts:124,
            permissionsCatalog.json) JÁ EXISTEM — zero edição nesses 3
            arquivos. `authorize()` real (create/edit) é responsabilidade do
            backend via `parameter-weight_create`/`parameter-weight_edit`
            (403, slugs legados, DEC-006 — nenhum cunhado novo) + gate de
            botão client-side (`canSave` em
            `CreateOrUpdateParameterWeights.tsx`) — aqui só evitamos
            renderizar a tela sem a permissão mínima de leitura, mesmo
            padrão de /cadastros-base/diagnostico-gestacao. `/novo`
            registrada ANTES de `/:parameterWeightId` (senão o router
            captura "novo" como parâmetro). */}
        <Route
          path="/cadastros-base/parametros-peso"
          element={
            <RequirePermission permission="parameter-weight_view">
              {lazyRoute(ParameterWeightsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/parametros-peso/novo"
          element={
            <RequirePermission permission="parameter-weight_view">
              {lazyRoute(CreateOrUpdateParameterWeights)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/parametros-peso/:parameterWeightId"
          element={
            <RequirePermission permission="parameter-weight_view">
              {lazyRoute(CreateOrUpdateParameterWeights)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Forragem (Fodder): SÓ a LISTAGEM
            (TASK-FD-FE-01), declarada ANTES do catch-all /cadastros-base/*
            para vencer o RoutePlaceholder, mesmo bloco/padrão de
            /cadastros-base/parametros-peso. Menu (`cad-pec-for`,
            navigationTree.ts:331) e permissão (navigationPermissions.ts:125,
            permissionsCatalog.json:435-438) JÁ EXISTEM — zero edição nesses 3
            arquivos. As rotas `/novo` e `/:fodderId` são registradas pela
            Tarefa irmã TASK-FD-FE-02 (junto com o componente que elas
            apontam) — SEM filtro nesta tela (DA-FD-11). */}
        <Route
          path="/cadastros-base/forragem"
          element={
            <RequirePermission permission="fodder_view">{lazyRoute(FoddersList)}</RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/forragem/novo"
          element={
            <RequirePermission permission="fodder_view">
              {lazyRoute(CreateOrUpdateFodders)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/forragem/:fodderId"
          element={
            <RequirePermission permission="fodder_view">
              {lazyRoute(CreateOrUpdateFodders)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Módulo Pastejo (Grazing): LISTAGEM
            (TASK-GZ-FE-01) + FORMULÁRIO criar/editar — campos base, SEM o
            mapa de seleção de piquetes (TASK-GZ-FE-02), declaradas ANTES do
            catch-all /cadastros-base/* para vencer o RoutePlaceholder, mesmo
            bloco/padrão de /cadastros-base/forragem. `/novo` ANTES de
            `/:grazingId` (senão "novo" seria capturado como uuid). Menu
            (`cad-pec-mod`, navigationTree.ts:333) e permissão
            (navigationPermissions.ts:128, permissionsCatalog.json:450-453)
            JÁ EXISTEM — zero edição nesses 3 arquivos. Guarda por VERBO nas
            rotas de formulário (`grazing_create`/`grazing_edit`), mirror
            `Grazing-FrontEnd-contrato.md ## 13` — SEM filtro nesta tela
            (Doc Bruta §7 item 1). O mapa de seleção de piquetes (`areas[]`)
            é `TASK-GZ-FE-03`, ainda não iniciada — o submit real só fecha
            quando ela existir (`areas` é `required, min:1` no backend). */}
        <Route
          path="/cadastros-base/modulo-pastejo"
          element={
            <RequirePermission permission="grazing_view">
              {lazyRoute(GrazingsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/modulo-pastejo/novo"
          element={
            <RequirePermission permission="grazing_create">
              {lazyRoute(CreateOrUpdateGrazing)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/modulo-pastejo/:grazingId"
          element={
            <RequirePermission permission="grazing_edit">
              {lazyRoute(CreateOrUpdateGrazing)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing, execução
            029, TASK-FE-2004 — chokepoint de FUNDAÇÃO): 3 rotas REAIS,
            declaradas ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `/novo` ANTES de `/:uuid` (senão "novo" seria
            capturado como parâmetro — mesma armadilha de Raças/Espécies/
            Categorias Animais/Rebanho/Embalagens). SEM edição — a API não
            tem PUT/PATCH (D1, `contrato-lote-modulo.md`), por isso a rota
            `/:uuid` renderiza a VISUALIZAÇÃO (cards), não um formulário de
            edição. Guarda única `batch_grazing_view` nas 3 rotas (leitura
            mínima — mirror `contrato-fe-convencoes-chokepoints.md §2` item 3;
            autorização real de create/delete é responsabilidade do backend,
            403). Item de menu `cad-pec-lmo` JÁ EXISTE — nenhuma edição em
            navigationTree.ts/navigationPermissions.ts/languageSidebar.ts. */}
        <Route
          path="/cadastros-base/lote-modulo"
          element={
            <RequirePermission permission="batch_grazing_view">
              {lazyRoute(BatchGrazingsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/lote-modulo/novo"
          element={
            <RequirePermission permission="batch_grazing_view">
              {lazyRoute(CreateBatchGrazing)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/lote-modulo/:uuid"
          element={
            <RequirePermission permission="batch_grazing_view">
              {lazyRoute(BatchGrazingDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Lote/Área (BatchArea, execução 029,
            TASK-FE-2104 — chokepoint de FUNDAÇÃO): irmã estrutural do bloco
            de Lote/Módulo acima, mesma ordem/guarda/razão (SEM edição, D1 de
            `contrato-lote-area.md`). Item de menu `cad-pec-lar` JÁ EXISTE —
            nenhuma edição em navigationTree.ts/navigationPermissions.ts/
            languageSidebar.ts. */}
        <Route
          path="/cadastros-base/lote-area"
          element={
            <RequirePermission permission="batch_area_view">
              {lazyRoute(BatchAreasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/lote-area/novo"
          element={
            <RequirePermission permission="batch_area_view">
              {lazyRoute(CreateBatchArea)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/lote-area/:uuid"
          element={
            <RequirePermission permission="batch_area_view">
              {lazyRoute(BatchAreaDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Cochos (Trough, execução 029,
            TASK-FE-2204 — chokepoint de FUNDAÇÃO): 4 rotas REAIS, declaradas
            ANTES do catch-all /cadastros-base/* para vencerem o
            RoutePlaceholder. `/novo` ANTES de `/:uuid` (mesma armadilha já
            documentada); `/:uuid/detalhe` DEPOIS de `/:uuid` (mirror
            `/cadastros-base/centros-custo/:costCenterId/detalhe`). Diferente
            de Lote/Módulo/Lote/Área, a API TEM PUT (`contrato-cochos.md`) —
            `/:uuid` é edição real, mesmo componente de `/novo`. Guarda única
            `troughs_view` nas 4 rotas (leitura mínima; create/edit/delete
            reais ficam a cargo do backend, 403). Item de menu `cad-pec-coc`
            JÁ EXISTE — nenhuma edição em navigationTree.ts/
            navigationPermissions.ts/languageSidebar.ts. */}
        <Route
          path="/cadastros-base/cochos"
          element={
            <RequirePermission permission="troughs_view">
              {lazyRoute(TroughsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/cochos/novo"
          element={
            <RequirePermission permission="troughs_view">
              {lazyRoute(CreateOrUpdateTrough)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/cochos/:uuid"
          element={
            <RequirePermission permission="troughs_view">
              {lazyRoute(CreateOrUpdateTrough)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/cochos/:uuid/detalhe"
          element={
            <RequirePermission permission="troughs_view">
              {lazyRoute(TroughDetalhe)}
            </RequirePermission>
          }
        />

        {/* Cadastros Base — Pecuários — Bebedouros (DrinkingFountain,
            execução 029, TASK-FE-2304 — chokepoint de FUNDAÇÃO): DELTA sobre
            o bloco de Cochos acima, mesma ordem/guarda/razão
            (`contrato-bebedouros.md`, mesma anatomia de Trough — API TEM
            PUT). Item de menu `cad-pec-beb` NOVO — criado por esta mesma
            Tarefa em navigationTree.ts/navigationPermissions.ts/
            languageSidebar.ts (não existia placeholder, diferente de
            Lote/Módulo/Lote/Área/Cochos). */}
        <Route
          path="/cadastros-base/bebedouros"
          element={
            <RequirePermission permission="drinking-fountains_view">
              {lazyRoute(DrinkingFountainsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/bebedouros/novo"
          element={
            <RequirePermission permission="drinking-fountains_view">
              {lazyRoute(CreateOrUpdateDrinkingFountain)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/bebedouros/:uuid"
          element={
            <RequirePermission permission="drinking-fountains_view">
              {lazyRoute(CreateOrUpdateDrinkingFountain)}
            </RequirePermission>
          }
        />
        <Route
          path="/cadastros-base/bebedouros/:uuid/detalhe"
          element={
            <RequirePermission permission="drinking-fountains_view">
              {lazyRoute(DrinkingFountainDetalhe)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Gestão de Contratos (Contract, TASK-CTR-FE-09):
            3 rotas REAIS, declaradas ANTES do catch-all /financeiro/*
            para vencerem o RoutePlaceholder. Item de menu (`fin-con`) e
            permissão de navegação (`contracts_view`) JÁ EXISTEM (navigationTree.ts:580,
            navigationPermissions.ts:233) — nenhuma alteração neles.
            `/novo` vem ANTES de `/:contractId` para não ser capturado como GUID,
            mesmo padrão de Solicitação/Armazéns/Raças. */}
        <Route
          path="/financeiro/contratos"
          element={
            <RequirePermission permission="contracts_view">
              {lazyRoute(ContratoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/contratos/novo"
          element={
            <RequirePermission permission="contracts_view">
              {lazyRoute(CreateOrUpdateContrato)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/contratos/:contractId"
          element={
            <RequirePermission permission="contracts_view">
              {lazyRoute(CreateOrUpdateContrato)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Mercado Pago (TASK-FE-031-46) — DECLARADA ANTES do
            catch-all /financeiro/* para vencer o RoutePlaceholder. Primeira
            rota real do grupo de menu "Financeiro" (fin-principal). */}
        <Route
          path="/financeiro/mercado-pago"
          element={
            <RequirePermission permission="finan_view">
              {lazyRoute(FinancialMercadoPagoList)}
            </RequirePermission>
          }
        />

        {/* Operacional / Agricultura — Contratos de Venda (TASK-FE-036-207) —
            DECLARADAS ANTES do catch-all /operacional/* para vencerem o
            RoutePlaceholder. As rotas usam o MESMO gate `sale-contracts_view`
            (acesso à página) — a distinção fina create/edit é feita DENTRO
            da tela via `usePermissions` (`canCreate`/`canEdit`/`canSave`),
            mesmo padrão real já usado por Safra/Contract (`/cadastros-base/
            safras`, `/financeiro/contratos`). `/:saleContractId/visualizar`
            (item "Visualizar", homologação 036fix5, mirror `/financeiro/
            pagar/:expenseId/visualizar`) vem ANTES de `/:saleContractId` por
            especificidade de path — reusa o MESMO componente, que força
            somente-leitura via `isViewOnlyRoute`. */}
        <Route
          path="/operacional/contratos-venda"
          element={
            <RequirePermission permission="sale-contracts_view">
              {lazyRoute(ContratosVendaList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/contratos-venda/novo"
          element={
            <RequirePermission permission="sale-contracts_view">
              {lazyRoute(CreateOrUpdateContratoVenda)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/contratos-venda/:saleContractId/visualizar"
          element={
            <RequirePermission permission="sale-contracts_view">
              {lazyRoute(CreateOrUpdateContratoVenda)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/contratos-venda/:saleContractId"
          element={
            <RequirePermission permission="sale-contracts_view">
              {lazyRoute(CreateOrUpdateContratoVenda)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Contas a Pagar (esteira 036, TASK-FE-036-110) —
            DECLARADAS ANTES do catch-all /financeiro/* para vencer o
            RoutePlaceholder, mesmo cuidado de `mercado-pago` acima. */}
        <Route
          path="/financeiro/pagar"
          element={
            <RequirePermission permission="expenses_view">
              {lazyRoute(ExpensesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/pagar/novo"
          element={
            <RequirePermission permission="expenses_create">
              {lazyRoute(CreateOrUpdateExpense)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/pagar/:expenseId"
          element={
            <RequirePermission permission="expenses_edit">
              {lazyRoute(CreateOrUpdateExpense)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/pagar/:expenseId/visualizar"
          element={
            <RequirePermission permission="expenses_view">
              {lazyRoute(CreateOrUpdateExpense)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Contas a Receber (Income, TASK-FE-036-319) —
            DECLARADAS ANTES do catch-all /financeiro/* para vencer o
            RoutePlaceholder. `/novo` antes de `/:incomeId` (evita colisão de
            captura de uuid, mirror `/cadastros-base/centros-custo/novo`). */}
        <Route
          path="/financeiro/receber"
          element={
            <RequirePermission permission="incomes_view">
              {lazyRoute(IncomesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/receber/novo"
          element={
            <RequirePermission permission="incomes_create">
              {lazyRoute(CreateOrUpdateIncome)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/receber/:incomeId"
          element={
            // INC-R24 (REAUDITORIA-036-2a-rodada) — o GET (`show`) exige
            // `incomes_view` e o PUT (`update`) exige `incomes_edit`
            // (`IncomeController::middleware()`); `anyOf` deixava um
            // usuário só-`incomes_create` entrar numa tela que falhava ao
            // carregar. Alinhado para exigir as DUAS permissões reais.
            <RequirePermission allOf={['incomes_view', 'incomes_edit']}>
              {lazyRoute(CreateOrUpdateIncome)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/receber/:incomeId/detalhe"
          element={
            <RequirePermission permission="incomes_view">
              {lazyRoute(IncomeDetalhe)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Mov. Caixa/Bancário (Movement, TASK-MV-FE-04) —
            DECLARADA ANTES do catch-all /financeiro/* para vencer o
            RoutePlaceholder. Item de menu (`fin-cai`) e permissão
            (`movements_view`) JÁ EXISTEM (navigationTree.ts:678,
            navigationPermissions.ts:255) — nenhuma alteração neles. */}
        <Route
          path="/financeiro/caixa"
          element={
            <RequirePermission permission="movements_view">
              {lazyRoute(MovimentoList)}
            </RequirePermission>
          }
        />
        {/* Financeiro — Mov. Caixa/Bancário — form create/edit (Movement,
            TASK-MV-FE-05). `/novo` vem ANTES de `/:uuid` para não ser
            capturado como GUID, mesmo padrão de Solicitação/Armazéns/Raças.
            Permissão `movements_create` (§2.5 do contrato de tela — `PUT`
            reusa o mesmo slug, Decisão #7, sem permissão dedicada de update). */}
        <Route
          path="/financeiro/caixa/novo"
          element={
            <RequirePermission permission="movements_create">
              {lazyRoute(CreateOrUpdateMovimento)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/caixa/:uuid"
          element={
            <RequirePermission permission="movements_create">
              {lazyRoute(CreateOrUpdateMovimento)}
            </RequirePermission>
          }
        />
        {/* Financeiro — Mov. Caixa/Bancário — form dedicado de edit-rateio
            (Movement, TASK-MV-FE-06). `:uuid/rateio` tem mais segmentos que
            `:uuid` — não colide (React Router prioriza a rota mais
            específica independente da ordem de declaração), mas fica
            declarada logo após o form completo por legibilidade. Mesma
            permissão `movements_create` (Decisão #7, `PATCH .../allocation`
            reusa o slug do form completo). */}
        <Route
          path="/financeiro/caixa/:uuid/rateio"
          element={
            <RequirePermission permission="movements_create">
              {lazyRoute(EditRateioMovimento)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Importação OFX (OfxImport, F-114, 97-Esteiras/064,
            TASK-064-OFX-FE-01) — DECLARADAS ANTES do catch-all
            /financeiro/* para vencer o RoutePlaceholder. Item de menu
            (`fin-cnc-ofx`) e permissão (`import_ofx_view`) JÁ EXISTEM
            (navigationTree.ts:2129, navigationPermissions.ts:834) — nenhuma
            alteração nesses 2 arquivos. `/novo` ANTES de `/:uuid` (senão
            "novo" seria capturado como UUID). `/:uuid` aceita
            `import_ofx_view` OU `import_ofx_edit` (`anyOf`, mirror
            `CreateOrUpdateIncome.tsx`/INC-R24) — mesma rota serve
            visualização (só `_view`) e edição (`_edit`), Decisão F1: o
            componente decide `canSave` internamente, não o guard de rota. */}
        <Route
          path="/financeiro/ofx"
          element={
            <RequirePermission permission="import_ofx_view">
              {lazyRoute(OfxImportList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/ofx/novo"
          element={
            <RequirePermission permission="import_ofx_create">
              {lazyRoute(CreateOrUpdateOfxImport)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/ofx/:uuid"
          element={
            <RequirePermission anyOf={['import_ofx_view', 'import_ofx_edit']}>
              {lazyRoute(CreateOrUpdateOfxImport)}
            </RequirePermission>
          }
        />
        {/* Conciliação bancária (TASK-064-OFX-FE-02) — `:uuid/conciliacao`
            tem mais segmentos que `:uuid` — não colide (mesmo racional de
            `/financeiro/caixa/:uuid/rateio`). Permissão `import_ofx_edit`
            (Decisão 1 da arquitetura de API — unificação do slug incorreto
            do link legado, mesma permissão exigida pelos 2 verbos de
            `GET`+`POST .../reconciliation`). */}
        <Route
          path="/financeiro/ofx/:uuid/conciliacao"
          element={
            <RequirePermission permission="import_ofx_edit">
              {lazyRoute(OfxReconciliationTab)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Importação Mov. Bancários (MovementSheet, F-112,
            97-Esteiras/064, TASK-064-MOV-FE-01/03) — 2 rotas REAIS
            (listagem + detalhe), DECLARADAS ANTES do catch-all
            /financeiro/* para vencerem o RoutePlaceholder. Item de menu
            (`fin-imp`) e permissão (`movement-sheets_view`) JÁ EXISTEM
            (navigationTree.ts:2118, navigationPermissions.ts:832) —
            nenhuma alteração nesses 2 arquivos. Sem rota de
            formulário/`novo` — o único ponto de criação é a importação de
            planilha (TASK-064-MOV-FE-02). `:uuid` DEPOIS do path fixo de
            listagem, mesma ordem de precedência já usada em
            /administrativo/correcao → /administrativo/correcao/:uuid. */}
        <Route
          path="/financeiro/importacao"
          element={
            <RequirePermission permission="movement-sheets_view">
              {lazyRoute(ImportacaoMovBancariosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/importacao/:uuid"
          element={
            <RequirePermission permission="movement-sheets_view">
              {lazyRoute(ImportacaoMovBancariosDetalhe)}
            </RequirePermission>
          }
        />
        {/* NOTA (TASK-065-OFX-FE-01): rota `/financeiro/ofx/:uuid/conciliacao`
            DELES (`ReconciliacaoOfx`, permissão bare `import_ofx`) foi
            descartada — o guard acima (`OfxReconciliationTab`,
            `import_ofx_edit`) é o vencedor, já homologado (TASK-064-OFX-FE-02). */}
        {/* "Meses Conciliados" (TASK-065-OFX-FE-03, RECONSTRUÍDA) — guard
            `import_ofx` (permissão GENÉRICA, mirror `OfxReportRequest::
            authorize()` + `navigationPermissions.ts:835`, item de menu
            `fin-cnc-mes`) — NÃO as granulares view/create/edit/delete. */}
        <Route
          path="/financeiro/meses-conciliados"
          element={
            <RequirePermission permission="import_ofx">
              {lazyRoute(OfxImportsReport)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Congelamentos Financeiros (FinancialFreeze, F-110,
            esteira 97-Esteiras/008, Tarefa 31/32) — DECLARADAS ANTES do
            catch-all /financeiro/* para vencer o RoutePlaceholder, mirror
            literal do bloco Contas a Pagar acima. `/novo` OBRIGATORIAMENTE
            antes de `/:financialFreezeUuid` (senão "novo" seria capturado
            como uuid pelo binding da rota-parâmetro), mesma ordem
            list → novo → :uuid → :uuid/visualizar dos blocos irmãos. As 3
            rotas do formulário apontam para o MESMO componente
            `CreateOrUpdateFinancialFreeze` (lazy). */}
        <Route
          path="/financeiro/congelamentos"
          element={
            <RequirePermission permission="financial-freeze_view">
              {lazyRoute(CongelamentosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/congelamentos/novo"
          element={
            <RequirePermission permission="financial-freeze_create">
              {lazyRoute(CreateOrUpdateFinancialFreeze)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/congelamentos/:financialFreezeUuid"
          element={
            <RequirePermission permission="financial-freeze_edit">
              {lazyRoute(CreateOrUpdateFinancialFreeze)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/congelamentos/:financialFreezeUuid/visualizar"
          element={
            <RequirePermission permission="financial-freeze_view">
              {lazyRoute(CreateOrUpdateFinancialFreeze)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Prev. Orçamentária (BudgetPlanning, F-106, esteira
            97-Esteiras/067, TASK-PO-FE-06/07) — DECLARADAS ANTES do
            catch-all /financeiro/* para vencer o RoutePlaceholder, mirror
            literal do bloco Congelamentos acima. `/create` (path real usado
            pelo `ButtonAdd`/CTA da listagem, `HeaderBudgetPlanningTable.tsx`
            — fidelidade ao código já em produção, não ao `/novo` sugerido
            pelo contrato de tela §10) declarado ANTES de `/:budgetPlanning
            Uuid` (senão "create" seria capturado como uuid pelo binding da
            rota-parâmetro). As 3 rotas do formulário apontam para o MESMO
            componente `CreateOrUpdateBudgetPlanning` (lazy, GAP-PO-08
            resolvido). */}
        <Route
          path="/financeiro/previsao"
          element={
            <RequirePermission permission="budget-plannings_view">
              {lazyRoute(BudgetPlanningList)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/previsao/create"
          element={
            <RequirePermission permission="budget-plannings_create">
              {lazyRoute(CreateOrUpdateBudgetPlanning)}
            </RequirePermission>
          }
        />
        {/* TASK-PO-FE-10/11 — relatório Previsto×Realizado (contrato de tela
            §9). Gateado por `budget-plannings_view` (o que
            `BudgetPlanningPredictedReportRequest::authorize()` REALMENTE
            exige no backend) — NÃO o slug órfão `budget-planning-
            predicted_view` do catálogo do front (contrato de tela §12/risco
            2, `GAP-PO-05`). Declarada ANTES de `/:budgetPlanningUuid` —
            mesmo cuidado de `/create` acima. */}
        <Route
          path="/financeiro/previsao/relatorio-previsto-realizado"
          element={
            <RequirePermission permission="budget-plannings_view">
              {lazyRoute(BudgetPlanningPredictedReport)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/previsao/:budgetPlanningUuid"
          element={
            <RequirePermission permission="budget-plannings_edit">
              {lazyRoute(CreateOrUpdateBudgetPlanning)}
            </RequirePermission>
          }
        />
        <Route
          path="/financeiro/previsao/:budgetPlanningUuid/visualizar"
          element={
            <RequirePermission permission="budget-plannings_view">
              {lazyRoute(CreateOrUpdateBudgetPlanning)}
            </RequirePermission>
          }
        />

        {/* Financeiro — Fluxo Bancário (CashFlow, F-107, esteira 070,
            TASK-CF-FE-01/02) — mirror EXATO do bloco WarehouseTransfer
            (TASK-WT-FE-02): item de menu (`fin-flu`) e permissão
            (`cashflow_view`) JÁ EXISTEM, só a rota real abaixo. Tela 100%
            leitura (relatório único) — sem rota de formulário/criar/editar. */}
        <Route
          path="/financeiro/fluxo"
          element={
            <RequirePermission permission="cashflow_view">
              {lazyRoute(CashFlowReport)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Gestão Pessoal — Equipes (Team): LISTAGEM
            (TASK-EQ-FE-01) + FORMULÁRIO criar/editar/visualizar
            (TASK-EQ-FE-02) + DETALHE somente-leitura forçado (TASK-EQ-FE-04,
            GAP-EQ-FE-11), declaradas ANTES do catch-all /administrativo/*
            para vencer o RoutePlaceholder. `/novo` ANTES de `/:teamUuid`
            (obrigatório — senão "novo" seria capturado como UUID pelo
            binding da rota-parâmetro), e `/:teamUuid/detalhe` DEPOIS de
            `/:teamUuid` (segmento literal após o parâmetro). `authorize()`
            real (create/edit/delete) é responsabilidade do backend via
            `teams_create`/`teams_edit`/`teams_delete` (403); aqui só
            evitamos renderizar a tela sem a permissão mínima de leitura/
            criação, mesmo padrão de /administrativo/funcoes. Modo
            visualizar tem DUAS portas: por permissão (sem `teams_edit`, em
            `/:teamUuid` — GAP-EQ-FE-04) ou forçado pela rota `/detalhe`
            (inclusive para quem tem `teams_edit` — GAP-EQ-FE-11, decisão de
            produto do dono: "Visualizar" da listagem passou a ser sempre
            exibida para `teams_view`). Ambas resolvidas DENTRO do próprio
            `CreateOrUpdateEquipe` (`isReadOnly`), não por gates separados —
            a rota `/detalhe` reusa o MESMO componente, sem `lazy()` novo. */}
        <Route
          path="/administrativo/equipes"
          element={
            <RequirePermission permission="teams_view">{lazyRoute(EquipesList)}</RequirePermission>
          }
        />
        <Route
          path="/administrativo/equipes/novo"
          element={
            <RequirePermission permission="teams_create">
              {lazyRoute(CreateOrUpdateEquipe)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/equipes/:teamUuid"
          element={
            <RequirePermission permission="teams_view">
              {lazyRoute(CreateOrUpdateEquipe)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/equipes/:teamUuid/detalhe"
          element={
            <RequirePermission permission="teams_view">
              {lazyRoute(CreateOrUpdateEquipe)}
            </RequirePermission>
          }
        />

        {/* Fiscal — NFe Emitidas (Nfe, execução 036, TASK-FE-036-403/404/406):
            rotas REAIS, declaradas ANTES do catch-all /fiscal/* para
            vencerem o RoutePlaceholder (contrato-frontend-nfe-emitidas.md
            §1). Item de menu ("NFe Emitidas", grupo "NF-e") e permissão de
            navegação (`nfe_view`) JÁ EXISTIAM — esta Tarefa só liga as
            rotas reais. `/novo` vem ANTES de `/:nfeId` para não ser
            capturado como uuid; `/:nfeId/visualizar` vem ANTES de
            `/:nfeId` por especificidade de path (React Router usa a 1ª
            rota que casa, mas caminhos mais específicos declarados antes
            evitam ambiguidade). */}
        <Route
          path="/fiscal/nfe-emitidas"
          element={
            <RequirePermission permission="nfe_view">{lazyRoute(NfesList)}</RequirePermission>
          }
        />
        <Route
          path="/fiscal/nfe-emitidas/novo"
          element={
            <RequirePermission permission="nfe_create">
              {lazyRoute(CreateOrUpdateNfe)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/nfe-emitidas/:nfeId/visualizar"
          element={
            <RequirePermission permission="nfe_view">{lazyRoute(NfeDetalhe)}</RequirePermission>
          }
        />
        <Route
          path="/fiscal/nfe-emitidas/:nfeId"
          element={
            <RequirePermission permission="nfe_edit">
              {lazyRoute(CreateOrUpdateNfe)}
            </RequirePermission>
          }
        />

        {/* Fiscal — DFe Recebidas (Dfe, execução 044, TASK-DFE-FE-09/11):
            rotas REAIS, declaradas ANTES de qualquer catch-all `/fiscal/*`.
            `/buscar` e `/relatorio` (segmentos ESTÁTICOS) vêm ANTES do
            path-base `/fiscal/dfes` — mesma prudência de ordem de
            `nfse-recebidas/buscar-dfe` (ainda que aqui não haja segmento
            dinâmico capturando por engano, mantém o padrão do domínio).
            Permissão de rota por par `dfe_*|dfe_fiscal_*` (`anyOf`,
            `CONTRATO-API-DFE.md §6`); permissões finas (manifestar/DANFE/
            XML/toggle) são checadas DENTRO da grid via `usePermissions()`
            (`Dfe/index.tsx`), Lei 9 — nunca duplicadas aqui.
            `/:dfeUuid/retorno` (TASK-DFE-FE-09, `DfeReturnLinking`) — gate
            `dfe_launch|dfe_fiscal_launch` (mesma permissão de MENU dos 4
            botões de lançamento, `CONTRATO-API-DFE.md §6.1`); a escrita real
            (finalizar venda) é gateada NA PRÓPRIA rota de destino
            (`mov_sale_edit`, `/operacional/venda-animais/.../finalizar*`). */}
        <Route
          path="/fiscal/dfes/buscar"
          element={
            <RequirePermission anyOf={['dfe_create', 'dfe_fiscal_create']}>
              {lazyRoute(BuscarDfe)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/dfes/relatorio"
          element={
            <RequirePermission permission="dfe_report">{lazyRoute(DfeReport)}</RequirePermission>
          }
        />
        <Route
          path="/fiscal/dfes/:dfeUuid/retorno"
          element={
            <RequirePermission anyOf={['dfe_launch', 'dfe_fiscal_launch']}>
              {lazyRoute(DfeReturnLinking)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/dfes"
          element={
            <RequirePermission anyOf={['dfe_view', 'dfe_fiscal_view']}>
              {lazyRoute(DfeRecebidasList)}
            </RequirePermission>
          }
        />

        {/* Fiscal — CT-e (Cte, execução 045): rotas REAIS, declaradas ANTES
            do catch-all /fiscal/* para vencerem o RoutePlaceholder.
            `/create` vem ANTES de `/:id` para não ser capturada como uuid. */}
        <Route
          path="/fiscal/ctes"
          element={
            <RequirePermission permission="cte_view">{lazyRoute(CtesList)}</RequirePermission>
          }
        />
        <Route
          path="/fiscal/ctes/create"
          element={
            <RequirePermission permission="cte_create">
              {lazyRoute(CreateOrUpdateCte)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/ctes/:id"
          element={
            <RequirePermission permission="cte_view">
              {lazyRoute(CreateOrUpdateCte)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/ctes/:id/emissao"
          element={
            <RequirePermission permission="cte_view">{lazyRoute(CteEmissao)}</RequirePermission>
          }
        />
        {/* Correção de link de menu (lote 070, 2026-09-02): o item de menu
            "Manifestar CTe" (navigationTree.ts `fis-cte-man`) usa o path
            `/fiscal/cte-manifestar` (singular), mas a rota da tela real estava
            registrada como `/fiscal/cte-manifestacoes` (plural) → o menu caía
            no placeholder "em construção". Nada referencia a rota plural além
            deste registro; path alinhado ao singular do menu. (Endpoints da API
            seguem `cte-manifestacoes` — não afetados.) */}
        <Route
          path="/fiscal/cte-manifestar"
          element={
            <RequirePermission permission="cte_manifest">
              {lazyRoute(CteManifestacao)}
            </RequirePermission>
          }
        />

        {/* Fiscal — MDF-e (Mdfe, execução 045): rotas REAIS, declaradas
            ANTES do catch-all /fiscal/*. `/nao-encerrados` (TASK-MDFE-FE-06)
            e `/:mdfeUuid/visualizar` (CreateOrUpdateMdfe.tsx navega para cá
            após salvar e no botão "Visualizar" da listagem) vêm ANTES de
            `/:mdfeUuid` por especificidade de path.
            TASK-MDFE-FE-09 (Onda 2) — `/visualizar` passou a renderizar
            `MdfeDetalhe` (tela de leitura DEDICADA + painel de Emissão
            SEFAZ, mirror `NfeDetalhe`), substituindo o stand-in da Onda 1
            (`CreateOrUpdateMdfe` com campos desabilitados). */}
        <Route
          path="/fiscal/mdfe-lista/nao-encerrados"
          element={
            <RequirePermission permission="mdfe_view">
              {lazyRoute(MdfeNaoEncerrados)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/mdfe-lista/:mdfeUuid/visualizar"
          element={
            <RequirePermission permission="mdfe_view">{lazyRoute(MdfeDetalhe)}</RequirePermission>
          }
        />
        <Route
          path="/fiscal/mdfe-lista/:mdfeUuid"
          element={
            <RequirePermission permission="mdfe_edit">
              {lazyRoute(CreateOrUpdateMdfe)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/mdfe-lista"
          element={
            <RequirePermission permission="mdfe_view">{lazyRoute(MdfesList)}</RequirePermission>
          }
        />
        <Route
          path="/fiscal/mdfe-nova"
          element={
            <RequirePermission permission="mdfe_create">
              {lazyRoute(CreateOrUpdateMdfe)}
            </RequirePermission>
          }
        />

        {/* Fiscal — Livro Caixa/LCDPR (CashBook, execução 045, SEM
            dashboard — excluído): rotas REAIS, declaradas ANTES do
            catch-all /fiscal/*. `/create` vem ANTES de `/:uuid` para não
            ser capturada como uuid. */}
        <Route
          path="/fiscal/livro-caixa/create"
          element={
            <RequirePermission permission="cash-book_create">
              {lazyRoute(CreateCashBook)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/livro-caixa/:uuid"
          element={
            <RequirePermission permission="cash-book_view">
              {lazyRoute(CashBookDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/livro-caixa"
          element={
            <RequirePermission permission="cash-book_view">
              {lazyRoute(CashBookList)}
            </RequirePermission>
          }
        />

        {/* Fiscal — Arquivos XML (F-133, esteira 97-Esteiras/008, Tarefa 36):
            rota REAL, declarada ANTES do catch-all /fiscal/* (linha ~7514+)
            para vencer o RoutePlaceholder (contrato de tela §2, AD-F01).
            Só `xml_view` — nunca `anyOf`/`allOf` com permissão de
            download/e-mail (AD-F02, C04 do contrato de API: as 2 ações de
            exportação não têm gate de permissão no servidor, decisão as-is
            do dono). */}
        <Route
          path="/fiscal/xml"
          element={
            <RequirePermission permission="xml_view">{lazyRoute(ArquivosXml)}</RequirePermission>
          }
        />

        {/* Fiscal — Partida Dobrada (AccountingEntry, F-128, esteira
            97-Esteiras/068, TASK-PD-FE-06/07/08/09): rotas REAIS de LISTAGEM +
            criar/editar/visualizar, declaradas ANTES do catch-all /fiscal/*
            para vencerem o RoutePlaceholder (contrato-tela §8). Permissões
            finas de linha (view/delete) são checadas DENTRO da grid via
            `usePermissions()` (`AccountingEntry/index.tsx`), Lei 9 — nunca
            duplicadas aqui. `/novo` E `/:uuid/visualizar` (segmentos mais
            específicos) vêm ANTES de `/:uuid` (path genérico) para não serem
            capturados como se fossem um uuid (mesma prudência de
            `NfeEmitidas`/`CentroCusto`). Visualizar reusa o MESMO componente
            `CreateOrUpdateAccountingEntry` em `isViewMode` (TASK-PD-FE-08),
            sem tela própria. */}
        <Route
          path="/fiscal/partida-dobrada"
          element={
            <RequirePermission permission="double-entry-accountings_view">
              {lazyRoute(AccountingEntryList)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/partida-dobrada/novo"
          element={
            <RequirePermission permission="double-entry-accountings_create">
              {lazyRoute(CreateOrUpdateAccountingEntry)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/partida-dobrada/:uuid/visualizar"
          element={
            <RequirePermission permission="double-entry-accountings_view">
              {lazyRoute(CreateOrUpdateAccountingEntry)}
            </RequirePermission>
          }
        />
        <Route
          path="/fiscal/partida-dobrada/:uuid"
          element={
            <RequirePermission permission="double-entry-accountings_edit">
              {lazyRoute(CreateOrUpdateAccountingEntry)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Gestão Documentos — Tipo Documento (DocumentType,
            TASK-DT-FE-01/02): listagem + as 2 rotas de formulário, TODAS
            declaradas ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder — mirror do bloco AccountingGroupers acima
            (`RequirePermission` + `lazyRoute`, NÃO o padrão genérico
            `RouteConfig[]`/`useSuspenseLoader`). `/novo` declarada ANTES de
            `/:documentTypeUuid` para não ser capturada como se fosse um uuid
            (aceita `?parentUuid=` opcional — "criar descendente" da árvore).
            Guarda de rota por `document-types_view`; a ação real de
            create/edit é gateada por `document-types_create`/
            `document-types_edit` dentro da tela (botão salvar). SEM
            paginação — a API devolve a árvore inteira em uma única
            chamada. */}
        <Route
          path="/administrativo/tipos-documento"
          element={
            <RequirePermission permission="document-types_view">
              {lazyRoute(TiposDocumentoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/tipos-documento/novo"
          element={
            <RequirePermission permission="document-types_view">
              {lazyRoute(CreateOrUpdateTipoDocumento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/tipos-documento/:documentTypeUuid"
          element={
            <RequirePermission permission="document-types_view">
              {lazyRoute(CreateOrUpdateTipoDocumento)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Gestão Documentos — Documentos (DocumentManagement,
            Tarefas 12/13): módulo IRMÃO de Tipo Documento, TODAS declaradas
            ANTES do catch-all /administrativo/* para vencerem o
            RoutePlaceholder — mirror EXATO do bloco Tipo Documento acima
            (`RequirePermission` + `lazyRoute`). `/novo` declarada ANTES de
            `/:documentUuid` para não ser capturada como se fosse um uuid.
            Guarda de rota por `document-managements_view`; a ação real de
            create/edit é gateada por `document-managements_create`/
            `document-managements_edit` dentro da tela (botão salvar). COM
            paginação REAL (diferente de Tipo Documento). Item de menu
            (adm-gd-doc) e permissão (document-managements_view) JÁ EXISTIAM
            em navigationTree.ts/navigationPermissions.ts — esta Tarefa só
            conecta as rotas reais. */}
        <Route
          path="/administrativo/documentos"
          element={
            <RequirePermission permission="document-managements_view">
              {lazyRoute(DocumentosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/documentos/novo"
          element={
            <RequirePermission permission="document-managements_view">
              {lazyRoute(CreateOrUpdateDocumento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/documentos/:documentUuid"
          element={
            <RequirePermission permission="document-managements_view">
              {lazyRoute(CreateOrUpdateDocumento)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Adiantamento Salarial (Advance,
            TASK-FE-adiant-salarial, 97-Esteiras/034): rotas REAIS de grid +
            form create/edit + detalhe, declaradas ANTES do catch-all
            /administrativo/* para vencerem o RoutePlaceholder. `/novo`
            declarada ANTES de `/:advanceUuid` (não é capturada como se fosse
            um uuid). Item de menu (adm-gp-adi) e permissão (advances_view)
            JÁ existem — TODAS as 4 rotas gateadas só por `advances_view`
            (Tarefa §Tela/Rotas); create/edit são gateados no BOTÃO, dentro
            da tela (`usePermissions().can('advances_create'/'advances_edit')`). */}
        <Route
          path="/administrativo/adiantamento"
          element={
            <RequirePermission permission="advances_view">
              {lazyRoute(AdiantamentoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/adiantamento/novo"
          element={
            <RequirePermission permission="advances_view">
              {lazyRoute(CreateOrUpdateAdiantamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/adiantamento/:advanceUuid"
          element={
            <RequirePermission permission="advances_view">
              {lazyRoute(CreateOrUpdateAdiantamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/adiantamento/:advanceUuid/detalhe"
          element={
            <RequirePermission permission="advances_view">
              {lazyRoute(AdiantamentoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Registro de Eventos (Bonus, esteira 037): rotas
            REAIS de grid + form create/edit + detalhe, declaradas ANTES do
            catch-all /administrativo/* para vencerem o RoutePlaceholder.
            `/novo` declarada ANTES de `/:bonusUuid` (não é capturada como se
            fosse um uuid). Item de menu (adm-gp-reg) e permissão
            (bonuses_view) JÁ existem — TODAS as 4 rotas gateadas só por
            `bonuses_view`; create/edit/delete são gateados no BOTÃO, dentro
            da tela (`usePermissions().can('bonuses_create'/'bonuses_edit'/
            'bonuses_delete')`). */}
        <Route
          path="/administrativo/registro-eventos"
          element={
            <RequirePermission permission="bonuses_view">
              {lazyRoute(RegistroEventosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/registro-eventos/novo"
          element={
            <RequirePermission permission="bonuses_view">
              {lazyRoute(CreateOrUpdateRegistroEvento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/registro-eventos/:bonusUuid"
          element={
            <RequirePermission permission="bonuses_view">
              {lazyRoute(CreateOrUpdateRegistroEvento)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/registro-eventos/:bonusUuid/detalhe"
          element={
            <RequirePermission permission="bonuses_view">
              {lazyRoute(RegistroEventoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Suprimentos (Relatório SLA, TASK-SLA-FE-02, esteira
            97-Esteiras/037) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado de
            `contratos-venda`/`pagar` acima. O bucket de permissão `rel-sup`
            (navigationPermissions.ts) cobre 7 relatórios do hub
            Suprimentos — SÓ o Relatório SLA tem backend pronto hoje; os
            outros 6 continuam caindo no catch-all abaixo até serem
            extraídos/migrados (decisão default do Arquiteto, reversível). */}
        <Route
          path="/relatorios/suprimentos"
          element={
            <RequirePermission permission="status-sla_report_view">
              {lazyRoute(SupplyStatusSlaReportPage)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Suprimentos — Gerencial de Solicitações (F-310,
            TASK-053-F310-FE-02, esteira 97-Esteiras/053) — DECLARADA ANTES
            do catch-all /relatorios/*, mesmo cuidado do bloco irmão "SLA"
            acima. `rel-sup` reestruturado de item-folha para grupo com 2
            filhos (navigationTree.ts) — a rota do SLA acima NÃO MUDA uma
            linha. */}
        <Route
          path="/relatorios/suprimentos/gerencial-de-solicitacoes"
          element={
            <RequirePermission permission="request-purchase-management_report_view">
              {lazyRoute(RequestPurchaseManagementReportPage)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Suprimentos — Produtos x Prev. Entrega (F-309,
            TASK-058-F309-FE-02, esteira 97-Esteiras/058) — DECLARADA ANTES
            do catch-all /relatorios/*, mesmo cuidado dos blocos irmãos "SLA"/
            "Gerencial de Solicitações" acima. Permissão gateia só `pdf`/
            `excel` no backend (`options` é protegido apenas por
            `farm.context`) — o gate de rota/menu é só visual/roteamento,
            mirror do padrão já usado pelos 2 filhos irmãos. */}
        <Route
          path="/relatorios/suprimentos/produtos-prev-entrega"
          element={
            <RequirePermission permission="request-purchase-forecast-report_report_view">
              {lazyRoute(RequestPurchaseForecastReportPage)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Suprimentos — ANS (F-229, lote 076,
            `F-229-ans-report-contrato-api.md`) — DECLARADA ANTES do
            catch-all /relatorios/*, mesmo cuidado dos blocos irmãos "SLA"/
            "Gerencial de Solicitações" acima. 3º filho de `rel-sup`
            (navigationTree.ts) — a rota-raiz do SLA e a de Gerencial de
            Solicitações acima NÃO MUDAM uma linha. */}
        <Route
          path="/relatorios/suprimentos/ans"
          element={
            <RequirePermission permission="ans_report_view">
              {lazyRoute(AnsRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Suprimentos — Savings (F-319, execução 013,
            TASK-013-F319-FE-01/02) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "SLA"/"Gerencial de Solicitações" acima. `rel-sup`
            ganha o 3º filho (navigationTree.ts) — as rotas dos 2 irmãos
            acima NÃO MUDAM uma linha.
            SEM `RequirePermission` DE PROPÓSITO — o endpoint
            `GET /request-quotations/savings-report*` não exige permissão
            nenhuma no backend (`OQ-005` `MANTER_COMO_IS`, preservado AS-IS
            por decisão do dono). Envolver esta rota num guard introduziria
            no cliente uma restrição que o servidor não tem — mirror
            `EvolucaoRebanho`/`GAP-EVO-01`/`HorasLogadas` (blocos acima). O
            item de MENU (`rel-sup-savings`) permanece gateado por
            `savings_view` (mirror do legado, EV-017) — só a ROTA fica
            aberta. */}
        <Route path="/relatorios/suprimentos/savings" element={lazyRoute(SavingsRelatorio)} />

        {/* Relatórios — Suprimentos — Suprimentos (F-325, `supplies-report`,
            execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52) — DECLARADA
            ANTES do catch-all /relatorios/* para vencer o RoutePlaceholder,
            mesmo cuidado dos blocos irmãos "SLA"/"Gerencial de Solicitações"/
            "ANS"/"Savings" acima. `rel-sup` ganha o 5º filho
            (navigationTree.ts) — as rotas dos 4 irmãos acima NÃO MUDAM uma
            linha. Gateada por `supplies_view` (mirror `rel-sup-savings`/
            `rel-sup-ans`, JÁ presente no `anyOf` do pai). */}
        <Route
          path="/relatorios/suprimentos/supplies-report"
          element={
            <RequirePermission permission="supplies_view">
              {lazyRoute(SuppliesReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Gestão Fiscal — Partida Dobrada (F-257, TASK-PDR-FE-04,
            97-Esteiras/069) — DECLARADA ANTES do catch-all /relatorios/* para
            vencer o RoutePlaceholder, mesmo cuidado do bloco irmão
            "Suprimentos" acima. Guard de ROTA usa a permissão ESPECÍFICA
            `double-entry-accountings_report` (mirror exato do `permission:`
            do Controller) — NUNCA o `anyOf` de 3 permissões do item de menu
            `rel-gfi` (esse fica só no menu, contrato-tela §7).
            PATH ajustado (pedido do dono, 2026-09-01): "Gestão Fiscal" virou
            item-pai/submenu em navigationTree.ts (mirror do padrão já usado
            por "Pecuária" → "Evolução/Rebanho"), "Partida Dobrada" passa a
            ser o filho navegável — rota migrada de `/relatorios/gestao-fiscal`
            para `/relatorios/gestao-fiscal/partida-dobrada`. O path-pai
            (sem tela própria) cai no catch-all `/relatorios/*`
            (RoutePlaceholder) igual a `/relatorios/pecuaria` hoje. */}
        <Route
          path="/relatorios/gestao-fiscal/partida-dobrada"
          element={
            <RequirePermission permission="double-entry-accountings_report">
              {lazyRoute(PartidaDobradaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Gestão Fiscal — Faturamento (F-286, esteira
            97-Esteiras/054, TASK-054-286-FE-02) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Partida Dobrada" acima. 2º filho de
            `rel-gfi` em navigationTree.ts. */}
        <Route
          path="/relatorios/gestao-fiscal/faturamento"
          element={
            <RequirePermission permission="nfe_product_report">
              {lazyRoute(FaturamentoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Gestão Fiscal — NFe/Emitidas (F-287, esteira
            97-Esteiras/079, TASK-F287-FE-02) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Partida Dobrada"/"Faturamento" acima.
            3º filho de `rel-gfi` em navigationTree.ts. */}
        <Route
          path="/relatorios/gestao-fiscal/nfe-report"
          element={
            <RequirePermission permission="nfe_report">
              {lazyRoute(NfeReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — DRE (F-259, TASK-DRE-FE-02, esteira
            97-Esteiras/049) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado do bloco irmão
            "Partida Dobrada" acima. `rel-fin` vira grupo/submenu com filho
            "DRE" em navigationTree.ts — path/icon do pai PRESERVADOS. */}
        <Route
          path="/relatorios/financeiro/dre"
          element={
            <RequirePermission permission="dre_view">{lazyRoute(DreRelatorio)}</RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — DRE Anual (F-258, TASK-DRE-FE-04,
            esteira 97-Esteiras/049) — mesmo bloco/posicionamento da rota
            irmã acima, 2º filho de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/dre-anual"
          element={
            <RequirePermission permission="dre_annual_view">
              {lazyRoute(DreAnualRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Contas a Pagar (F-262, TASK-050-262-FE-02,
            esteira 97-Esteiras/050) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "DRE" acima. 3º filho de `rel-fin` em
            navigationTree.ts — path/icon do pai PRESERVADOS. */}
        <Route
          path="/relatorios/financeiro/contas-a-pagar"
          element={
            <RequirePermission permission="expenses_report">
              {lazyRoute(ContasAPagarRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Contas Pagas (F-291, TASK-050-291-FE-02,
            esteira 97-Esteiras/050) — mesmo bloco/posicionamento da rota
            irmã acima, 4º filho de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/contas-pagas"
          element={
            <RequirePermission permission="expenses_paid_report">
              {lazyRoute(ContasPagasRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Contas Tributárias (F-327, esteira
            97-Esteiras/060, TASK-F327-FRONT-01) — tela NOVA, mesmo
            bloco/posicionamento das rotas irmãs acima. Guard de ROTA usa
            `tax_accounts_report` (slug EXATO do backend). */}
        <Route
          path="/relatorios/financeiro/contas-tributarias"
          element={
            <RequirePermission permission="tax_accounts_report">
              {lazyRoute(ContasTributariasRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Contas a Receber (F-271,
            TASK-050-271-FE-02, esteira 97-Esteiras/050) — DECLARADA ANTES
            do catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. 5º filho de `rel-fin` em
            navigationTree.ts. */}
        <Route
          path="/relatorios/financeiro/contas-a-receber"
          element={
            <RequirePermission permission="incomes_report">
              {lazyRoute(ContasAReceberRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Contas Recebidas (F-292,
            TASK-050-292-FE-02, esteira 97-Esteiras/050) — mesmo
            bloco/posicionamento da rota irmã acima, 6º e ÚLTIMO filho de
            `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/contas-recebidas"
          element={
            <RequirePermission permission="incomes_paid_report">
              {lazyRoute(ContasRecebidasRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Pagamento Previsto × Real (F-289,
            esteira 97-Esteiras/054, TASK-289-FE-02) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Filho de `rel-fin` em
            navigationTree.ts. Distinto do irmão `rel-fin-prev-real` (F-238,
            lado Recebimentos) — id/rota/label nunca colidem. */}
        <Route
          path="/relatorios/financeiro/pagamento-previsto-real"
          element={
            <RequirePermission permission="pag_prev_report">
              {lazyRoute(PagamentoPrevistoRealRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Recebimento Previsto × Real (F-297,
            esteira 97-Esteiras/079, TASK-079-297-FE-02) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Filho de `rel-fin` em
            navigationTree.ts. Distinto do irmão `rel-fin-prev-real` (F-238,
            Planejamento Orçamentário) — id/rota/label nunca colidem. */}
        <Route
          path="/relatorios/financeiro/recebimento-previsto-real"
          element={
            <RequirePermission permission="rec_prev_report">
              {lazyRoute(RecebimentoPrevistoRealRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Juros Pagos (F-290, TASK-290-FE-02,
            esteira 97-Esteiras/073) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "DRE"/"DRE Anual" acima. 3º filho de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/juros-pagos"
          element={
            <RequirePermission permission="paid_interest_report">
              {lazyRoute(JurosPagosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Juros Recebidos (esteira 97-Esteiras/014,
            Tarefa 49) — DECLARADA ANTES do catch-all /relatorios/* para
            vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            "Juros Pagos"/"Apuração de Custo" acima. Filho de `rel-fin` em
            navigationTree.ts, logo após `rel-fin-juros-pagos`. */}
        <Route
          path="/relatorios/financeiro/juros-recebidos"
          element={
            <RequirePermission permission="received_interest_report">
              {lazyRoute(JurosRecebidosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Apuração de Custo (F-245, TASK-245-FE-02,
            esteira 97-Esteiras/073) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "DRE"/"DRE Anual"/"Juros Pagos" acima. 4º filho de
            `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/apuracao-de-custo"
          element={
            <RequirePermission permission="cost_calculation_report">
              {lazyRoute(ApuracaoCustoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Centro de Custo (F-247, TASK-052-247-FE-02,
            esteira 97-Esteiras/052) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "DRE"/"DRE Anual"/"Juros Pagos"/"Apuração de Custo"
            acima. Filho NOVO de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/centro-de-custo"
          element={
            <RequirePermission permission="cost_centers_report">
              {lazyRoute(CentroCustoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Livro Razão (F-274, TASK-FE-LR-03,
            esteira 97-Esteiras/008) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "DRE"/"DRE Anual"/"Juros Pagos"/"Apuração de
            Custo"/"Centro de Custo" acima. Filho NOVO de `rel-fin`.

            Rota GUARDADA (diferente de `TASK-FE-PA-01`, onde deliberadamente
            NÃO se guardou): aqui o servidor enforça em DUPLA barreira —
            `Middleware('permission:ledger-report_view')` em
            `LedgerReportController::middleware()` E `authorize()` em
            `LedgerReportRequest`. Guardar a rota é espelhar o servidor,
            mirror de `rel-fin-centro-custo`. */}
        <Route
          path="/relatorios/financeiro/livro-razao"
          element={
            <RequirePermission permission="ledger-report_view">
              {lazyRoute(LivroRazaoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Consolidado (Pagar/Receber) (F-214,
            TASK-052-214-FE-02, esteira 97-Esteiras/052) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "DRE"/"Contas a Pagar"/"Centro de
            Custo" acima. Filho NOVO de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/consolidado-pagar-receber"
          element={
            <RequirePermission permission="accounts_payable_receivable_report">
              {lazyRoute(ConsolidadoPagarReceberRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Fluxo de Caixa Mensal (F-240,
            TASK-053-240-FE-03, esteira 97-Esteiras/053) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "DRE"/"Centro de Custo"/"Consolidado"
            acima. Filho NOVO de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/fluxo-de-caixa-mensal"
          element={
            <RequirePermission permission="cashflow_by_category_report">
              {lazyRoute(FluxoCaixaMensalRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Estoque Financeiro (F-241,
            TASK-013-241-FE-04, esteira 97-Esteiras/013) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "DRE"/"Centro de Custo"/"Consolidado"/
            "Fluxo de Caixa Mensal" acima. Filho NOVO de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/estoque-financeiro"
          element={
            <RequirePermission permission="cashflow_product_report">
              {lazyRoute(EstoqueFinanceiroRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Custo de Produção (F-272, TASK-272-FE-02/03,
            esteira 97-Esteiras/073) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "DRE"/"DRE Anual"/"Juros Pagos"/"Apuração de Custo"
            acima. 5º filho de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/custo-de-producao"
          element={
            <RequirePermission permission="incomestatement_view">
              {lazyRoute(CustoProducaoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Custo de Produção Acumulado (F-217,
            TASK-058-F217-FE-02, esteira 97-Esteiras/058) — DECLARADA ANTES
            do catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Custo de Produção" acima. 6º filho de
            `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/custo-de-producao-acumulado"
          element={
            <RequirePermission permission="accumulatedincomestatement_view">
              {lazyRoute(CustoProducaoAcumuladoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Movimento Bancário (F-264,
            TASK-058-F264-FE-02, esteira 97-Esteiras/058) — DECLARADA ANTES
            do catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. 7º filho de `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/movimento-bancario"
          element={
            <RequirePermission permission="financial-movement-report_view">
              {lazyRoute(MovimentoBancarioRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Custo Produção Batida (F-267, TASK-267-FE-01,
            esteira 97-Esteiras/073) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "DRE"/"Juros Pagos"/"Apuração de Custo" acima.
            `rel-est` vira grupo/submenu com este único filho —
            path/icon do pai PRESERVADOS (mirror `rel-gfi`). */}
        <Route
          path="/relatorios/estoque/custo-producao-batida"
          element={
            <RequirePermission permission="food-beat_report">
              {lazyRoute(CustoProducaoBatidaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Recebimentos (F-305, TASK-RCB-FE-02,
            esteira 97-Esteiras/074) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "Custo Produção Batida" acima. 2º filho de
            `rel-est`. */}
        <Route
          path="/relatorios/estoque/recebimentos"
          element={
            <RequirePermission permission="receipts_report">
              {lazyRoute(RecebimentosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Movimentação de Estoque (F-1f1d23e3,
            TASK-MOV-FE-02, esteira 97-Esteiras/074) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Custo Produção Batida"/"Recebimentos"
            acima. Filho de `rel-est`. */}
        <Route
          path="/relatorios/estoque/movimentacao-estoque"
          element={
            <RequirePermission permission="stock_movement_report">
              {lazyRoute(MovimentacaoEstoqueRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Lote/Fornecedor (F-324, TASK-052-324-FE-02,
            esteira 97-Esteiras/052) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Custo Produção Batida"/"Recebimentos"/
            "Movimentação de Estoque" acima. Filho de `rel-est`. */}
        <Route
          path="/relatorios/estoque/lote-fornecedor"
          element={
            <RequirePermission permission="stocks-lot-provider_report">
              {lazyRoute(LoteFornecedorRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Curva ABC/Estoque (F-322, esteira
            97-Esteiras/077, CONTRATOS/front/F-322-plano-front.md) —
            DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos "Custo Produção
            Batida"/"Recebimentos"/"Movimentação de Estoque"/
            "Lote/Fornecedor" acima. Filho de `rel-est`. */}
        <Route
          path="/relatorios/estoque/curva-abc"
          element={
            <RequirePermission permission="stocks-abc_report">
              {lazyRoute(StockAbcReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Saídas x Centro Custo (F-301, esteira
            97-Esteiras/078, F-301-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Custo Produção Batida"/
            "Recebimentos"/"Movimentação de Estoque"/"Lote/Fornecedor"/
            "Baixa de Estoque"/"Curva ABC/Estoque" acima. Filho de
            `rel-est`. */}
        <Route
          path="/relatorios/estoque/saidas-centro-custo"
          element={
            <RequirePermission permission="products-exit-cost-center_report">
              {lazyRoute(SaidasCentroCustoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Requisição/Saída (F-312, esteira
            97-Esteiras/078, F-312-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Custo Produção Batida"/
            "Recebimentos"/"Movimentação de Estoque"/"Lote/Fornecedor"/
            "Baixa de Estoque"/"Curva ABC/Estoque"/"Saídas x Centro Custo"
            acima. Filho de `rel-est`. */}
        <Route
          path="/relatorios/estoque/requisicao-saida"
          element={
            <RequirePermission permission="requisitions_report">
              {lazyRoute(RequisicaoSaidaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Estoque — Estoque Consolidado (F-323, feature_id
            e70b8cad, esteira 97-Esteiras/079, F-323-plano-frontend.md) —
            DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos "Custo Produção
            Batida"/"Recebimentos"/"Movimentação de Estoque"/"Lote/
            Fornecedor"/"Baixa de Estoque"/"Curva ABC/Estoque"/"Saídas x
            Centro Custo"/"Requisição/Saída" acima. Filho de `rel-est`. */}
        <Route
          path="/relatorios/estoque/estoque-consolidado"
          element={
            <RequirePermission permission="stocks-consolidated_report">
              {lazyRoute(StockConsolidatedReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Financiamentos (F-265, esteira
            97-Esteiras/078, F-265-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Saídas x Centro Custo" acima. Filho de
            `rel-fin`. */}
        <Route
          path="/relatorios/financeiro/financiamentos"
          element={
            <RequirePermission permission="financings_report">
              {lazyRoute(FinanciamentosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Fluxo Mensal de Pagamento (F-293,
            esteira 97-Esteiras/078, F-293-plano-frontend.md) — DECLARADA
            ANTES do catch-all /relatorios/* para vencer o RoutePlaceholder,
            mesmo cuidado do bloco irmão "Financiamentos" acima. Filho de
            `rel-fin`. Slug `monthly-payment-flow_view` reusado (já no
            `anyOf` do pai, seedado em `PermissionTree.php`). */}
        <Route
          path="/relatorios/financeiro/fluxo-mensal-pagamento"
          element={
            <RequirePermission permission="monthly-payment-flow_view">
              {lazyRoute(FluxoMensalPagamentoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Extrato Financeiro (F-233, esteira
            97-Esteiras/079, F-233-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Fluxo Mensal de Pagamento" acima. Filho de
            `rel-fin`. Slug `movements_report` reusado (já no `anyOf` do pai,
            seedado em `PermissionTree.php`), sem colisão com
            `rel-fin-movimento-bancario` (`financial-movement-report_view`). */}
        <Route
          path="/relatorios/financeiro/extrato-financeiro"
          element={
            <RequirePermission permission="movements_report">
              {lazyRoute(ExtratoFinanceiroRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Conciliação de Contas (F-213, lote 079,
            rework FE, F-213-plano-frontend-rework.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Extrato Financeiro" acima. Filho de
            `rel-fin`. Rota MOVIDA de `/financeiro/conciliacao-consolidada`
            (feature nunca commitada/entregue, sem link/bookmark a
            preservar) — permissão `account-reconciliation_report`
            (controller real, `AccountReconciliationReportController`, JÁ no
            `anyOf` de `rel-fin`, sem edição adicional lá). */}
        <Route
          path="/relatorios/financeiro/conciliacao-de-contas"
          element={
            <RequirePermission permission="account-reconciliation_report">
              {lazyRoute(RelatorioConsolidadoConciliacao)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Descarte Romaneio (F-256, esteira
            97-Esteiras/078, F-256-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Saídas x Centro Custo"/"Financiamentos"
            acima. Filho de `rel-agr` (Agricultura — evidência legada,
            `sidebar.blade.php:2202`, irmão de "Pesagem Rodoviária"), NÃO
            Estoque. */}
        <Route
          path="/relatorios/agricultura/descarte-romaneio"
          element={
            <RequirePermission permission="discards_report">
              {lazyRoute(DescarteRomaneioRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Estoque/Rebanho (F-228, esteira
            97-Esteiras/078, F-228-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Descarte Romaneio"/"Financiamentos"
            acima. Filho de `rel-pec` (Pecuária — evidência legada,
            `sidebar.blade.php:2858`, submenu `#pecuariarelatorio`). */}
        <Route
          path="/relatorios/pecuaria/estoque-rebanho"
          element={
            <RequirePermission permission="animals-report_view">
              {lazyRoute(EstoqueRebanhoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Suprimentos — Orçamentos (`request-quotation.report`,
            F-311, esteira 97-Esteiras/078, F-311-plano-frontend.md) —
            DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos "Saídas x
            Centro Custo"/"Financiamentos"/"Descarte Romaneio" acima. Filho de
            `rel-sup`. Slug `request-quotation_report_view` reusado EXATO do
            legado (DEC-006), já no `anyOf` de `rel-sup`
            (navigationPermissions.ts) — nenhuma edição no bucket do pai. */}
        <Route
          path="/relatorios/suprimentos/orcamentos"
          element={
            <RequirePermission permission="request-quotation_report_view">
              {lazyRoute(OrcamentosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Frotas — Máquinas (F-278, TASK-052-278-FE-02, esteira
            97-Esteiras/052) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            acima. 1º filho do grupo `rel-gfr` ("Gestão de Frotas"), que era
            um flatItem FOLHA e vira item-PAI (navigationTree.ts). */}
        <Route
          path="/relatorios/frotas/maquinas"
          element={
            <RequirePermission permission="machinesreport_view">
              {lazyRoute(MaquinasRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Frotas — Abastecimentos (F-277, esteira
            97-Esteiras/054, TASK-054-277-FE-02) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Máquinas" acima. 2º filho de `rel-gfr`
            em navigationTree.ts. */}
        <Route
          path="/relatorios/frotas/abastecimentos"
          element={
            <RequirePermission permission="machines-supply_view">
              {lazyRoute(AbastecimentosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Frotas — Manutenções (F-276, esteira
            97-Esteiras/078, F-276-plano-frontend.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Máquinas"/"Abastecimentos" acima. 3º
            filho de `rel-gfr` em navigationTree.ts. */}
        <Route
          path="/relatorios/frotas/manutencoes"
          element={
            <RequirePermission permission="machines-maintenance_view">
              {lazyRoute(ManutencoesRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Evolução/Rebanho (Tarefa 27,
            spa-contract-evolucao-rebanho.md §5) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Suprimentos" acima.
            SEM `RequirePermission` DE PROPÓSITO — `GET /evolutions/report`
            não exige permissão nenhuma no backend (`GAP-EVO-01`,
            [PARA ANÁLISE] na camada `api`, preservado AS-IS por decisão do
            dono, DEC-027). Envolver esta rota num guard introduziria no
            cliente uma restrição que o servidor não tem. O item de MENU
            (`rel-pec-evo`) permanece gateado por
            `evolution-animal-report_view` (mirror do legado,
            `GAP-EVO-FE-04`) — só a ROTA fica aberta. */}
        <Route
          path="/relatorios/pecuaria/evolucao-rebanho"
          element={lazyRoute(EvolucaoRebanhoRelatorio)}
        />

        {/* Relatórios — Pecuária — Sanitário/Lote (F-318, esteira 078,
            F-318-plano-frontend.md, TASK-F318-F04) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Evolução/Rebanho" acima.
            RE-ALINHAMENTO: o slug de permissão estava STALE
            (`sanitary_view`, genérico do CRUD raiz Sanitário) — a API foi
            RE-MIGRADA (SFC-318-PERM) e agora exige o slug DEDICADO
            `sanitaries-batch-report_view` (já catalogado, `PermissionTree.php:3206`,
            já no `anyOf` do grupo Pecuária em navigationPermissions.ts).
            Item de MENU criado nesta mesma Tarefa
            (`rel-pec-sanitario-lote`, navigationTree.ts) — a tela deixa de
            ser acessível só pelo hub de Relatórios > Pecuária. */}
        <Route
          path="/relatorios/pecuaria/sanitario-lote"
          element={
            <RequirePermission permission="sanitaries-batch-report_view">
              {lazyRoute(SanitarioLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Vacas Prenhas (Tarefa 46,
            frontend-contract-vacas-prenhas.md §2.3) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Evolução/Rebanho"/"Sanitário/Lote"
            acima. Rota GATEADA (mirror `SanitarioLote`) por
            `pregnancy-diagnosis_view` — permissão REAL exigida pelo endpoint
            `GET /pregnant-cows-report` (`GAP-VACAS-01`); a permissão
            reservada `pregnant-cows-report_view` nunca foi seedada no
            backend novo, então NÃO é usada aqui (ficaria eternamente
            invisível). Item de MENU dedicado (`rel-pec-vac`,
            navigationTree.ts) — diferente do `SanitarioLote` (sem menu). */}
        <Route
          path="/relatorios/pecuaria/vacas-prenhas"
          element={
            <RequirePermission permission="pregnancy-diagnosis_view">
              {lazyRoute(VacasPrenhasRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Performance Animal (F-234, TASK-FE-PA-01,
            Tarefa 57) — DECLARADA ANTES do catch-all /relatorios/* para
            vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos acima.
            SEM `RequirePermission` DE PROPÓSITO — `GET /batch-profitability-
            report` não exige permissão no servidor (`DEC-DOM-19`, reversão
            documentada no Controller/Request; mirror EXATO do precedente
            `EvolucaoRebanhoRelatorio`/`GAP-EVO-01`). Envolver a ROTA num
            guard introduziria no cliente uma restrição que o servidor não
            tem — não fazer. O item de MENU (`rel-pec-pfa`) continua gateado
            pela permissão existente `batch-profitability-report_view`
            (navigationPermissions.ts), mirror do legado (só controlava o
            menu, nunca a rota), exatamente como `rel-pec-evo`. */}
        <Route
          path="/relatorios/pecuaria/performance-animal"
          element={lazyRoute(PerformanceAnimalRelatorio)}
        />

        {/* Relatórios — Pecuária — Manejo/Lote (F-279, esteira 051,
            TASK-279-FE-03) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            "Evolução/Rebanho"/"Sanitário/Lote"/"Vacas Prenhas" acima. Rota
            GATEADA por `management-batch-report_view` — permissão REAL
            exigida pelo endpoint de geração do PDF
            (`ManagementBatchReportController::middleware()`,
            DECISAO_DE_ESCOPO já adjudicada pelo dono no roteiro de
            arquitetura da API, mirror SR-06/OQ-01): o legado só checava a
            permissão no MENU (`@can(...)`), a API nova corrigiu por
            construção e o front replica o guard aqui. Item de MENU
            dedicado (`rel-pec-man`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/manejo-lote"
          element={
            <RequirePermission permission="management-batch-report_view">
              {lazyRoute(ManejoLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Pesagem/Lote (Tarefa 49, esteira
            CORE_WORKSPACE/97-Esteiras/014) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Vacas Prenhas"/"Manejo/Lote" acima. Rota GATEADA
            por `accumulated-weighing-batch-report_view` — permissão REAL
            exigida pelos 2 endpoints (options + download,
            `AccumulatedWeighingBatchReportController::middleware()`,
            api-architecture-pesagem-lote.md §"SURF-MENU-001"). Item de MENU
            dedicado (`rel-pec-pes`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/pesagem-lote"
          element={
            <RequirePermission permission="accumulated-weighing-batch-report_view">
              {lazyRoute(PesagemLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Animais por Lote (Tarefa 51, esteira
            CORE_WORKSPACE/97-Esteiras/015) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Pesagem/Lote"/"Manejo/Lote" acima. Rota GATEADA
            por `animals-per-batch-report_view` — permissão REAL exigida
            pelo endpoint de download (`AnimalsPerBatchReportController::
            middleware()`, api-contract-animais-por-lote.md §2#1, achado
            `C22` já corrigido na API por construção). Item de MENU dedicado
            (`rel-pec-apl`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/animais-por-lote"
          element={
            <RequirePermission permission="animals-per-batch-report_view">
              {lazyRoute(AnimaisPorLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Ficha Animal (F-225, 97-Esteiras/012,
            Tarefa 47, frontend-contract-ficha-animal.md §2.3) — DECLARADA
            ANTES do catch-all /relatorios/* para vencer o RoutePlaceholder,
            mesmo cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `VacasPrenhas`/`SanitarioLote`) por `animal-record-report_view` —
            permissão REAL exigida pelo endpoint `GET /api/v1/animal-record-
            report` (duas barreiras reais no servidor, api-contract-ficha-
            animal.md §4.1). Item de MENU dedicado (`rel-pec-fic`,
            navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/ficha-animal"
          element={
            <RequirePermission permission="animal-record-report_view">
              {lazyRoute(FichaAnimalRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Histórico Reprodutivo (execução 074,
            historico-reprodutivo-contrato-front.md §6) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `VacasPrenhas`) por `reproductive-history-report_view` —
            permissão REAL exigida pelo endpoint
            `GET /reproductive-history-report`, já provisionada no backend
            (sem workaround, diferente do sibling `GAP-VACAS-01`). Item de
            MENU dedicado (`rel-pec-hist`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/historico-reprodutivo"
          element={
            <RequirePermission permission="reproductive-history-report_view">
              {lazyRoute(HistoricoReprodutivoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Produtividade/Receptora (F-307, lote 079,
            F-307-plano-frontend.md §5 TASK-F307-FE-03) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `HistoricoReprodutivo`) por `receiver-cow-productivity-report_view`
            — permissão REAL exigida pelo endpoint
            `GET /receiver-cow-productivity-report`, já provisionada no
            backend (sem workaround, diferente do sibling `GAP-VACAS-01`).
            Item de MENU dedicado (`rel-pec-recept`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/produtividade-receptora"
          element={
            <RequirePermission permission="receiver-cow-productivity-report_view">
              {lazyRoute(ProdutividadeReceptoraRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Custeio/Lote (execução 074,
            custeio-lote-contrato-front.md §6) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos acima. Rota GATEADA (mirror `HistoricoReprodutivo`)
            por `costing-batch-report_view` — permissão REAL exigida pelo
            endpoint `GET /costing-batch-report`, já provisionada no backend
            (sem workaround, diferente do sibling `GAP-VACAS-01`). Item de
            MENU dedicado (`rel-pec-cus`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/custeio-lote"
          element={
            <RequirePermission permission="costing-batch-report_view">
              {lazyRoute(CusteioLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Custeio/Animal (F-248, esteira 075,
            CusteioAnimal-contrato-front.md §6) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão acima. Rota GATEADA (mirror `CusteioLote`)
            por `costing-animal-report_view` — permissão REAL exigida pelo
            endpoint `GET /costing-animal-report`, já provisionada no
            backend (sem workaround). Item de MENU dedicado
            (`rel-pec-cus-an`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/custeio-animal"
          element={
            <RequirePermission permission="costing-animal-report_view">
              {lazyRoute(CusteioAnimalRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Custeio/Área (F-251,
            CusteioAreaPecuaria-contrato-api.md, lote 076) — DECLARADA ANTES
            do catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `CusteioAnimal`/`CusteioLote`) por `cust-area-pec-report_view` —
            permissão REAL exigida pelo endpoint `GET /costing-livestock-
            area-report`, já provisionada no backend (sem workaround). Item
            de MENU dedicado (`rel-pec-cus-area`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/custeio-area-pecuaria"
          element={
            <RequirePermission permission="cust-area-pec-report_view">
              {lazyRoute(CusteioAreaPecuariaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Custeio/Módulo (F-250, esteira 080,
            Custeio-Modulo-Contrato-Front.md §2) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `CusteioAreaPecuaria`/`CusteioAnimal`/`CusteioLote`) por
            `costing-grazing-report_view` — permissão REAL exigida pelo
            endpoint `GET /costing-grazing-report`, já provisionada no
            backend (sem workaround). Item de MENU dedicado
            (`rel-pec-cus-md`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/custeio-modulo"
          element={
            <RequirePermission permission="costing-grazing-report_view">
              {lazyRoute(CusteioModuloRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Desempenho Pesagem Confinamento (F-263,
            lote 076, `FeedlotWeighingPerformanceReport-contrato-api.md`) —
            DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos acima. Rota
            GATEADA (mirror `CusteioAreaPecuaria`) por
            `feedlot-weighing-performance-report_view` — permissão REAL
            exigida pelo endpoint `GET /feedlot-weighing-performance-report`,
            já provisionada no backend (sem workaround). Item de MENU
            dedicado (`rel-pec-desempenho-pesagem-confinamento`,
            navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/desempenho-pesagem-confinamento"
          element={
            <RequirePermission permission="feedlot-weighing-performance-report_view">
              {lazyRoute(DesempenhoPesagemConfinamentoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Aplicação/Manejo (F-230, esteira
            97-Esteiras/077, F-230-plano-front.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `CusteioAreaPecuaria`) por `application-management-report_view`
            — permissão REAL exigida pelo endpoint `GET /application-
            management-report`, já provisionada no backend. Rota GATEADA
            fecha o bypass de autorização do legado (achado CL-02/
            POSSIVEL_LEGACY_DEFECT, "autorização apenas por visibilidade de
            menu"). Item de MENU dedicado (`rel-pec-am`,
            navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/aplicacao-manejo"
          element={
            <RequirePermission permission="application-management-report_view">
              {lazyRoute(AplicacaoManejoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Movimentação/Rebanho (F-224, lote 076,
            `AnimalMovementReport-contrato.md`) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `DesempenhoPesagemConfinamento`) por
            `animal-movements-report_view` — permissão REAL exigida pelo
            endpoint `GET /animal-movements-report`, já provisionada no
            backend (sem workaround). Item de MENU dedicado
            (`rel-pec-mov`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/movimentacao-rebanho"
          element={
            <RequirePermission permission="animal-movements-report_view">
              {lazyRoute(MovimentacaoRebanhoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Estq. Animais/Categoria (F-242, esteira
            97-Esteiras/077, F-242-plano-front.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `MovimentacaoRebanho`) por `category-animal-report_view` —
            permissão REAL exigida pelo endpoint planejado `GET /api/v1/
            category-animal-report`, já no `anyOf` do pai `rel-pec` (linha
            994). Item de MENU dedicado (`rel-pec-cat`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/estoque-animais-categoria"
          element={
            <RequirePermission permission="category-animal-report_view">
              {lazyRoute(CategoryAnimalReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Transf/Lote/Módulo/Área (F-329, esteira
            97-Esteiras/077, F-329-plano-front.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `CategoryAnimalReport`) por
            `transfer-batch-module-area-report_view` — permissão REAL
            exigida pelo endpoint `GET /api/v1/transfer-batch-grazing-area-
            report`, já no `anyOf` do pai `rel-pec` (linha 1003). Item de
            MENU dedicado (`rel-pec-tba`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/transferencia-lote-modulo-area"
          element={
            <RequirePermission permission="transfer-batch-module-area-report_view">
              {lazyRoute(TransferenciaLoteModuloAreaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Vendas/Animais (F-227, esteira
            97-Esteiras/077, F-227-plano-front.md) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA (mirror
            `CategoryAnimalReport`) por `animals-sales-report_view` —
            permissão REAL exigida pelo endpoint `GET /api/v1/
            animals-sales-report`, já no `anyOf` do pai `rel-pec` (linha
            1010). Item de MENU dedicado (`rel-pec-vda`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/vendas-animais"
          element={
            <RequirePermission permission="animals-sales-report_view">
              {lazyRoute(AnimalsSaleReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Custo Total de Reprodução (F-328,
            97-Esteiras/008, TASK-FE-CTR-02) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos acima. Rota GATEADA (mirror `HistoricoReprodutivo`,
            NÃO `PerformanceAnimal`) por `total-cost-of-reproduction-
            report_view` — diferente dos precedentes `PerformanceAnimal`/
            `EvolucaoRebanho` (API sem enforce), aqui o dono decidiu enforce
            (`GAP-CTR-01` opção B) e a API tem 2 barreiras
            (`Controller::middleware()` + `Request::authorize()`). Item de
            MENU dedicado (`rel-pec-cus-rep`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/custo-total-reproducao"
          element={
            <RequirePermission permission="total-cost-of-reproduction-report_view">
              {lazyRoute(CustoTotalReproducaoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Nascimentos/SISBOV (F-235, esteira
            97-Esteiras/052, TASK-052-235-FE-02, roteiro-front-F235-
            nascimentos-sisbov.md) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos acima. Rota GATEADA (mirror `CusteioLote`/
            `HistoricoReprodutivo`) por `birth-animals-sisbovs-report_view`
            — permissão REAL exigida pelo endpoint `GET /api/v1/birth-
            animals-sisbovs-report`, já no `anyOf` do pai `rel-pec`. Item de
            MENU dedicado (`rel-pec-nascimentos-sisbov`, navigationTree.ts).
            Tela SÓ PDF (sem Select de formato), ambas as datas opcionais —
            PDF vazio é resposta FIEL (DEC-225 §7.3), não erro. */}
        <Route
          path="/relatorios/pecuaria/nascimentos-sisbov"
          element={
            <RequirePermission permission="birth-animals-sisbovs-report_view">
              {lazyRoute(NascimentosSisbovRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Mortes/SISBOV (F-253, esteira
            97-Esteiras/054, TASK-054-253-FE-02) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Nascimentos/SISBOV" acima. Rota GATEADA
            por `death-animals-sisbovs-report_view` — permissão REAL exigida
            pelo endpoint `GET /api/v1/death-animals-sisbovs-report`, já no
            `anyOf` do pai `rel-pec`. Tela SÓ PDF, ambas as datas opcionais. */}
        <Route
          path="/relatorios/pecuaria/mortes-sisbov"
          element={
            <RequirePermission permission="death-animals-sisbovs-report_view">
              {lazyRoute(MortesSisbovRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Identificação/SISBOV (F-270, esteira
            97-Esteiras/078, TASK-F270-F04, CONTRATOS/F-270-contrato-
            legado.md) — DECLARADA ANTES do catch-all /relatorios/* para
            vencer o RoutePlaceholder, mesmo cuidado do bloco irmão
            "Nascimentos/SISBOV"/"Mortes/SISBOV" acima. Rota GATEADA por
            `identification-animals-sisbovs-report_view` — permissão REAL
            exigida pelo endpoint
            `GET /api/v1/identification-animals-sisbovs-report`, já no
            `anyOf` do pai `rel-pec`. Item de MENU dedicado
            (`rel-pec-identificacao-sisbov`, navigationTree.ts). Tela SÓ PDF,
            AMBAS as datas OBRIGATÓRIAS (contrato F-270 — diverge dos irmãos
            SISBOV, que são opcionais). */}
        <Route
          path="/relatorios/pecuaria/identificacao-sisbov"
          element={
            <RequirePermission permission="identification-animals-sisbovs-report_view">
              {lazyRoute(IdentificacaoSisbovRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Mortes GENÉRICO (F-254, esteira
            97-Esteiras/077, CONTRATOS/front/F-254-plano-front.md) —
            DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado do bloco irmão "Mortes/SISBOV"
            acima. Rota GATEADA por `death-animals-report_view` — permissão
            REAL exigida pelo endpoint planejado
            `GET /api/v1/death-animals-report`, já no `anyOf` do pai
            `rel-pec`. Item de MENU dedicado (`rel-pec-mor`,
            navigationTree.ts). Tela PDF+Excel (Select `format`), ambas as
            datas OBRIGATÓRIAS — contrato de tela distinto do irmão SISBOV. */}
        <Route
          path="/relatorios/pecuaria/mortes"
          element={
            <RequirePermission permission="death-animals-report_view">
              {lazyRoute(DeathAnimalReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Nascimentos GENÉRICO (F-236, esteira
            97-Esteiras/053, TASK-053-236-FE-02, roteiro-front-F236-
            nascimentos.md) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            acima. Rota GATEADA (mirror `NascimentosSisbov`/`CusteioLote`)
            por `birth-report_view` — permissão REAL exigida pelo endpoint
            `GET /api/v1/birth-report`, já no `anyOf` do pai `rel-pec`. Item
            de MENU dedicado (`rel-pec-nascimentos`, navigationTree.ts).
            Tela PDF+Excel (Select `format`), ambas as datas OBRIGATÓRIAS,
            com filtro de categoria — contrato de tela distinto do irmão
            SISBOV. */}
        <Route
          path="/relatorios/pecuaria/nascimentos"
          element={
            <RequirePermission permission="birth-report_view">
              {lazyRoute(NascimentosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Nutrição/Lote (F-288, esteira
            97-Esteiras/053, TASK-288-FE-02, roteiro-front-F288-nutricao.md)
            — DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos acima. Rota
            GATEADA por `nutrition-consumption-report_view` — permissão
            REAL exigida pelos 2 endpoints do
            `NutritionConsumptionReportController` (`options`+`__invoke`),
            já no `anyOf` do pai `rel-pec` (corrigida da entrada STALE
            `nutrition_report` na mesma Tarefa). Item de MENU dedicado
            (`rel-pec-nut`, navigationTree.ts). Tela PDF+Excel (Select
            `format`), ambas as datas OBRIGATÓRIAS, filtros categoria/lote
            independentes SEM cascata — não confundir com a irmã
            `ManejoLoteRelatorio` (mesmo domínio de dados, rota/ícone
            distintos). */}
        <Route
          path="/relatorios/pecuaria/nutricao-consumo-lote"
          element={
            <RequirePermission permission="nutrition-consumption-report_view">
              {lazyRoute(NutricaoConsumoLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Composição Rebanho (F-269, lote 079,
            F-269-plano-frontend.md §6 TASK-F269-FE-03) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Rota GATEADA por
            `herd-composition-report_view` — permissão REAL exigida pelos 2
            endpoints do `HerdCompositionReportController` (`options`+
            `__invoke`), já no `anyOf` do pai `rel-pec` (fundação parcial
            já semeada, ver §0 do plano). Item de MENU dedicado
            (`rel-pec-composicao-rebanho`, navigationTree.ts). Tela
            filtro+seletor de 18 colunas+download PDF/Excel via `report_type`,
            SEM grid/prévia. */}
        <Route
          path="/relatorios/pecuaria/composicao-rebanho"
          element={
            <RequirePermission permission="herd-composition-report_view">
              {lazyRoute(ComposicaoRebanhoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Apontamento Máquina (Tarefa 46,
            frontend-contract-apontamento-maquina.md §2) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Evolução/Rebanho"/"Sanitário/Lote"
            acima. Diferente de `EvolucaoRebanho` (GAP-EVO-01, rota aberta de
            propósito), esta rota É gateada — mirror `SanitarioLote`: a API
            corrigiu a autorização por construção (`GAP-APONT-01`), então o
            front replica o guard em vez de preservar a lacuna do legado. */}
        <Route
          path="/relatorios/agricultura/apontamento-maquina"
          element={
            <RequirePermission permission="appropriation_equipments_report">
              {lazyRoute(ApontamentoMaquinaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Ocorrências Talhões (F-232, Tarefa 50,
            esteira CORE_WORKSPACE/97-Esteiras/015) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Apontamento Máquina" acima. Rota
            GATEADA — a API corrigiu a autorização por construção (FID-G3A
            #1 da API), então o front replica o guard em vez de preservar a
            lacuna do legado. */}
        <Route
          path="/relatorios/agricultura/ocorrencias-talhoes"
          element={
            <RequirePermission permission="appropriation-occurrences-report_view">
              {lazyRoute(OcorrenciasTalhoesRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Prev. Área/Receita (F-280,
            TASK-MFA-FE-03, esteira 075) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "Apontamento Máquina" acima. Rota GATEADA — a API
            corrigiu a autorização por construção (`CL-05`), então o front
            replica o guard em vez de preservar a lacuna do legado. */}
        <Route
          path="/relatorios/agricultura/previsao-area-receita"
          element={
            <RequirePermission permission="markings_prev_area_view">
              {lazyRoute(PrevisaoAreaReceitaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Gestão Pessoal — Apuração Mensal (TASK-07-57,
            feature F-285, `97-Esteiras/007`) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Evolução/Rebanho"/"Vacas Prenhas"/"Apontamento
            Máquina" acima. SEM `RequirePermission` DE PROPÓSITO — `GET
            /monthly-calculation-report` não exige permissão nenhuma no
            backend (DEC-DOM-19, fidelidade estrita ao legado
            `monthlycalculation.report`), mirror EXATO `GAP-EVO-01`
            (`EvolucaoRebanhoRelatorio`). Envolver esta rota num guard
            introduziria no cliente uma restrição que o servidor não tem. O
            item de MENU (`rel-gpe-apu`) permanece gateado por
            `earnings_view` (navigationTree.ts/navigationPermissions.ts) —
            só a ROTA fica aberta. */}
        <Route
          path="/relatorios/gestao-pessoal/apuracao-mensal"
          element={lazyRoute(ApuracaoMensalRelatorio)}
        />

        {/* Relatórios — Agricultura — Produção/Custeio/Área (F-298, esteira
            051, TASK-298-FE-03) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "Apontamento Máquina" logo acima. Rota GATEADA por
            `production_cost_area_view` — permissão REAL exigida pelo
            endpoint de geração do PDF (`ProductionCostingAreaReportController::
            middleware()`, DECISAO_DE_ESCOPO C-09 já adjudicada pelo dono no
            roteiro de arquitetura da API): o legado não tinha NENHUMA
            checagem de servidor (só o gate visual do menu), a API nova
            corrigiu por construção e o front replica o guard aqui. */}
        <Route
          path="/relatorios/agricultura/producao-custeio-area"
          element={
            <RequirePermission permission="production_cost_area_view">
              {lazyRoute(ProducaoCusteioAreaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Custeio/Área (F-252, esteira 079,
            F-252-plano-frontend.md TASK-252-FE-03) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Produção/Custeio/Área" logo acima. Tela
            NOVA, distinta de `production-costing-area-report`/F-298 (rota/
            controller/permissão diferentes, §0 do roteiro). Rota GATEADA
            por `cost_area_view` — permissão REAL exigida pelo endpoint de
            geração do PDF (`CostingAreaReportController::middleware()`):
            o legado não tinha NENHUMA checagem de servidor (só o gate
            visual do menu, CLM-016), a API nova corrigiu por construção e
            o front replica o guard aqui. */}
        <Route
          path="/relatorios/agricultura/custeio-area"
          element={
            <RequirePermission permission="cost_area_view">
              {lazyRoute(CusteioAreaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Prod./Colaborador (F-300, esteira 079,
            F-300-plano-frontend.md TASK-300-FE-03) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Produção/Custeio/Área" logo acima. Rota
            GATEADA por `prod_employee_view` — permissão REAL exigida pelo
            endpoint de geração do PDF (`ProductionPerWorkerReportController::
            middleware()`, correção por construção C-09/C20-C22 do contrato
            legado): o legado nunca enforçava no servidor (só o gate visual
            do menu), a API nova corrigiu por construção e o front replica o
            guard aqui. */}
        <Route
          path="/relatorios/agricultura/producao-colaborador"
          element={
            <RequirePermission permission="prod_employee_view">
              {lazyRoute(ProducaoColaboradorRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Pesagem Rodoviária (F-284, ajuste do
            lote 075) — DECLARADA ANTES do catch-all /relatorios/* para
            vencer o RoutePlaceholder, mesmo cuidado do bloco irmão
            "Prev. Área/Receita" acima. NÃO é um componente novo — reusa o
            `ModuleWeighingRelatorio` já lazy-importado acima (const
            compartilhada com a rota operacional
            `/operacional/pesagem-rodoviaria/relatorio`, que permanece
            inalterada); apenas um 2º ponto de entrada, agora também em
            Relatórios → Agricultura. Rota GATEADA pela mesma permissão já
            usada na rota operacional (`module-weighings_report`). */}
        <Route
          path="/relatorios/agricultura/pesagem-rodoviaria"
          element={
            <RequirePermission permission="module-weighings_report">
              {lazyRoute(ModuleWeighingRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Vendas — Vendas/Produto (F-315, esteira 051,
            TASK-315-FE-03) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado do bloco irmão
            "Produção/Custeio/Área" logo acima. Rota GATEADA por
            `sales-products_report` — permissão REAL exigida pelo endpoint
            de geração do relatório (`SaleProductReportController::
            middleware()`, já implementada no backend, TASK-BE-043-SALE-COM-08,
            anterior a esta esteira): o legado só checava a permissão no
            MENU (`@can(...)`, OQ-01/DEF-02), a API nova corrigiu por
            construção e o front replica o guard aqui. Item de menu "Vendas"
            (`rel-ven`) JÁ EXISTE, folha, e já aponta para este path
            (navigationTree.ts:2516) — nenhuma edição de menu nesta Tarefa. */}
        <Route
          path="/relatorios/vendas"
          element={
            <RequirePermission permission="sales-products_report">
              {lazyRoute(VendasProdutoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Bens — Inventário Patrimonial (F-260, TASK-INV-FE-02,
            esteira 075) — DECLARADA ANTES do catch-all /relatorios/* para
            vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos acima.
            Rota GATEADA por `equipments_report` — permissão REAL exigida
            pelo endpoint `GET /equipments-inventory-report`, já
            provisionada no backend (contrato de API `DA-INV-01`). Item de
            MENU dedicado (`rel-ben-inventario`, navigationTree.ts). */}
        <Route
          path="/relatorios/bens/inventario"
          element={
            <RequirePermission permission="equipments_report">
              {lazyRoute(InventarioRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Vendas — Cliente/Produto (F-313, esteira
            97-Esteiras/054, TASK-054-313-T1) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "Vendas/Produto" acima. `rel-ven` vira grupo/submenu
            com 2 filhos (mirror `rel-gfi`/`rel-pec`) — a rota do irmão F-315
            acima permanece INTOCADA. Guard de ROTA usa a permissão
            específica `sale-clients_report` (já no `anyOf` de `rel-ven`,
            que fica só no MENU). */}
        <Route
          path="/relatorios/vendas/cliente-produto"
          element={
            <RequirePermission permission="sale-clients_report">
              {lazyRoute(ClienteProdutoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Vendas — Cliente (F-317, esteira 97-Esteiras/077,
            F-317-plano-front.md) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Vendas/Produto"/"Cliente/Produto" acima. `rel-ven`
            já é grupo/submenu com os 2 filhos acima; este é o 3º filho
            (mirror `rel-gfi`/`rel-pec`/`rel-ven-cliente-produto`). Guard de
            ROTA usa a permissão específica `sales_report` (já no `anyOf` de
            `rel-ven`, que fica só no MENU). Endpoint-alvo `GET /sales-report`
            ainda em migração cirúrgica no motor da API
            (`F-317-plano-CIRURGICO.md`, risco 1) — dependência de
            sequenciamento registrada para o Tester. */}
        <Route
          path="/relatorios/vendas/cliente"
          element={
            <RequirePermission permission="sales_report">
              {lazyRoute(SaleGeneralReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Vendas — Funcionário (F-314, esteira 97-Esteiras/079,
            F-314-plano-frontend.md) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Vendas/Produto"/"Cliente/Produto"/"Cliente" acima.
            `rel-ven` já é grupo/submenu com os 3 filhos acima; este é o 4º
            filho (mirror EXATO). Guard de ROTA usa a permissão específica
            `sale-employees_report` (já no `anyOf` de `rel-ven`, que fica só
            no MENU). */}
        <Route
          path="/relatorios/vendas/funcionario"
          element={
            <RequirePermission permission="sale-employees_report">
              {lazyRoute(SaleEmployeeReportRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Rentabilidade/Cultura (F-302, esteira
            077, F-302-plano-front.md) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "Produção/Custeio/Área" acima. Rota GATEADA por
            `profitability-by-crop_report` — a API fecha o gap de
            enforcement server-side do legado (achado `[LACUNA]` do
            contrato) via `HasMiddleware`. */}
        <Route
          path="/relatorios/agricultura/rentabilidade-cultura"
          element={
            <RequirePermission permission="profitability-by-crop_report">
              {lazyRoute(RentabilidadeCulturaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Romaneio/Diferença (Tarefa 49, esteira
            97-Esteiras/014, front-architecture-romaneio-diferenca.md §2) —
            DECLARADA ANTES do catch-all /relatorios/* para vencer o
            RoutePlaceholder, mesmo cuidado do bloco irmão
            "Rentabilidade/Cultura" acima.
            SEM `RequirePermission` DE PROPÓSITO — `GET
            /transfer-differences-report` não exige permissão nenhuma no
            backend (`GAP-RMD-02`, `[AVALIADO]` na camada `api`, preservado
            AS-IS por decisão do dono, `DEC-043`). Envolver esta rota num
            guard introduziria no cliente uma restrição que o servidor não
            tem — mirror EXATO de `EvolucaoRebanhoRelatorio`/`GAP-EVO-01`
            acima. O item de MENU (`rel-agr-rom-dif`) permanece gateado por
            `transfer_difference_report` (mirror do legado, `SR-008`) — só a
            ROTA fica aberta. */}
        <Route
          path="/relatorios/agricultura/romaneio-diferenca"
          element={lazyRoute(RomaneioDiferencaRelatorio)}
        />

        {/* Relatórios — Agricultura — Prod./Área (Tarefa 47,
            frontend-contract-prod-area.md §2.3) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Apontamento Máquina" acima. Rota
            GATEADA: o backend exige `prod_area_view` por dupla barreira
            (contrato de API §11, `C-08`). */}
        <Route
          path="/relatorios/agricultura/producao-por-area"
          element={
            <RequirePermission permission="prod_area_view">
              {lazyRoute(ProducaoAreaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Pesagens/Colheita (F-335, execução
            053, roteiro-front-F335-pesagens-colheita.md) — DECLARADA ANTES
            do catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado do bloco irmão "Prod./Área" logo acima. Rota GATEADA por
            `weighing-harvest_report` — permissão JÁ REGISTRADA
            (`PermissionTree.php:3090-3093`), órfã no legado (só escondia o
            link do menu, DIV-01); a API nova liga a dupla barreira
            (Controller + Request) e o front replica o guard aqui. */}
        <Route
          path="/relatorios/agricultura/pesagens-colheita"
          element={
            <RequirePermission permission="weighing-harvest_report">
              {lazyRoute(PesagensColheitaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Romaneio/Vendas/Contrato (F-331,
            97-Esteiras/008, TASK-RVC-FE-02) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado do
            bloco irmão "Pesagens/Colheita" acima. Rota GATEADA (dupla
            barreira real do backend: HasMiddleware + authorize() do
            Request) — mirror `pesagens-colheita`, NÃO o precedente de rota
            aberta de `evolucao-rebanho`/`apuracao-mensal`. Filho de
            `rel-agr` em navigationTree.ts. */}
        <Route
          path="/relatorios/agricultura/romaneio-vendas-contrato"
          element={
            <RequirePermission permission="transfer-sales-contract_report">
              {lazyRoute(RomaneioVendasContratoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Gestão Pessoal — Horas Logadas (Tarefa 47,
            frontend-contract-horas-logadas.md §2.3 v2, FID-G3F
            fid-g3f-horas-logadas.md §2) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Prod./Área"/"Apontamento Máquina" acima.
            SEM `RequirePermission` DE PROPÓSITO — `GET /logged-hours-report`
            não exige permissão nenhuma no backend (`DEF-01`,
            api-contract-horas-logadas.md §0/§8, preservado AS-IS por
            decisão do dono). Envolver esta rota num guard introduziria no
            cliente uma restrição que o servidor não tem — mirror
            `EvolucaoRebanho`/`GAP-EVO-01` (router/index.tsx acima). O item
            de MENU (`rel-gpe-horas-logadas`) permanece gateado por
            `logged-hours_view` (mirror do legado, EV-09/EV-10) — só a
            ROTA fica aberta. */}
        <Route
          path="/relatorios/gestao-pessoal/horas-logadas"
          element={lazyRoute(HorasLogadasRelatorio)}
        />

        {/* Relatórios — Financeiro — Adiantamento (F-219, esteira
            97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            de `rel-fin` acima. Filho de `rel-fin` em navigationTree.ts. */}
        <Route
          path="/relatorios/financeiro/adiantamento"
          element={
            <RequirePermission permission="advance-titles_report">
              {lazyRoute(AdiantamentoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Previsão Fazenda/Receita (F-281,
            esteira 97-Esteiras/055) — DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos de `rel-agr` acima. Filho de `rel-agr` em
            navigationTree.ts. */}
        <Route
          path="/relatorios/agricultura/previsao-fazenda-receita"
          element={
            <RequirePermission permission="markings_prev_farm_view">
              {lazyRoute(PrevisaoFazendaReceitaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Agenda de Recebimentos (F-304, esteira
            97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            de `rel-fin` acima. Filho de `rel-fin` em navigationTree.ts. */}
        <Route
          path="/relatorios/financeiro/agenda-recebimentos"
          element={
            <RequirePermission permission="receipt-schedule_view">
              {lazyRoute(AgendaRecebimentosRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Financeiro — Fiscal/Não Fiscal (F-266, lote 076,
            `FiscalDifferenceReport-contrato.md`) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos de `rel-fin` acima. Filho de `rel-fin`
            em navigationTree.ts. */}
        <Route
          path="/relatorios/financeiro/fiscal-nao-fiscal"
          element={
            <RequirePermission permission="fiscal-difference-report_view">
              {lazyRoute(FiscalNaoFiscalRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Registro Genealógico (F-222, esteira
            97-Esteiras/055) — DECLARADA ANTES do catch-all /relatorios/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            de `rel-pec` acima. Filho de `rel-pec` em navigationTree.ts. */}
        <Route
          path="/relatorios/pecuaria/registro-genealogico"
          element={
            <RequirePermission permission="animal-family-tree-report_view">
              {lazyRoute(RegistroGenealogicoRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Pecuária — Histórico de Animais/Lote (F-221, esteira
            97-Esteiras/058, FRONT-F221-plano.md §2.1) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos de `rel-pec` acima. Rota GATEADA por
            `animal-batch-history-report_view` — permissão REAL exigida pelo
            endpoint `GET /animal-batch-history-report` (duas barreiras reais
            no servidor, `HasMiddleware` + `authorize()`). Item de MENU
            dedicado (`rel-pec-hal`, navigationTree.ts). */}
        <Route
          path="/relatorios/pecuaria/historico-animais-lote"
          element={
            <RequirePermission permission="animal-batch-history-report_view">
              {lazyRoute(HistoricoAnimaisLoteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Romaneio Cliente (F-332, esteira
            97-Esteiras/058, FRONT-F332-plano.md §2.1) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos de `rel-agr` acima. Rota GATEADA por
            `transfers_view` — REUSA a permissão canônica já existente do
            CRUD de Romaneios (mesma já seeded, sem slug novo). Item de MENU
            dedicado (`rel-agr-romaneio-cliente`, navigationTree.ts). */}
        <Route
          path="/relatorios/agricultura/romaneio-cliente"
          element={
            <RequirePermission permission="transfers_view">
              {lazyRoute(RomaneioClienteRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — Agricultura — Pesagem Entrada/Saída (F-336, esteira
            97-Esteiras/058, FRONT-F336-plano.md §2.1) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos de `rel-agr` acima. Rota GATEADA por
            `weighing-in-out_report` — permissão JÁ SEEDED (D-058-07, plano
            §2.1). Item de MENU dedicado (`rel-agr-pesagem-entrada-saida`,
            navigationTree.ts). */}
        <Route
          path="/relatorios/agricultura/pesagem-entrada-saida"
          element={
            <RequirePermission permission="weighing-in-out_report">
              {lazyRoute(PesagemEntradaSaidaRelatorio)}
            </RequirePermission>
          }
        />

        {/* Relatórios — 9 telas da execução 059 (F-273/F-223/F-216/F-282/
            F-294/F-303/F-334/F-337/F-220) — BLOCO DE FIAÇÃO GLOBAL (Executor
            Front v2, integração). Cada rota DECLARADA ANTES do catch-all
            /relatorios/* para vencer o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos acima. Item de MENU dedicado por feature em
            navigationTree.ts/navigationPermissions.ts. */}
        <Route
          path="/relatorios/financeiro/razao-categoria"
          element={
            <RequirePermission permission="ledger_caregory_report">
              {lazyRoute(RazaoCategoriaRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/pecuaria/analise-movimentacao-lote"
          element={
            <RequirePermission permission="animal-movement-analysis-report_view">
              {lazyRoute(AnaliseMovimentacaoLoteRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/bens/depreciacao-acumulada"
          element={
            <RequirePermission permission="accumulateddepreciationreport_view">
              {lazyRoute(DepreciacaoAcumuladaRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/agricultura/previsao-colheita-area"
          element={
            <RequirePermission permission="markings_prev_farm_view">
              {lazyRoute(PrevisaoColheitaAreaRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/financeiro/agenda-pagamentos"
          element={
            <RequirePermission permission="payment-schedule_view">
              {lazyRoute(AgendaPagamentosRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/financeiro/fluxo-mensal-recebimento"
          element={
            <RequirePermission permission="monthly-receipt-flow_view">
              {lazyRoute(FluxoMensalRecebimentoRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/pecuaria/pesagem-animal"
          element={
            <RequirePermission permission="weighing-batch-report_view">
              {lazyRoute(PesagemAnimalRelatorio)}
            </RequirePermission>
          }
        />
        {/* Desmamas (F-333, esteira 97-Esteiras/060,
            ROTEIRO-F333-FRONT-desmamas-tela.md §6) — DECLARADA ANTES do
            catch-all /relatorios/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. Permissão `weaning-report_view`
            é o MESMO slug já usado por `HeaderTable.tsx`/`WeaningController`
            (`can('weaning-report_view')`) — não inventar/kebabar. */}
        <Route
          path="/relatorios/pecuaria/desmamas"
          element={
            <RequirePermission permission="weaning-report_view">
              {lazyRoute(DesmamasRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/relatorios/estoque/pesagem-armazem-cliente"
          element={
            <RequirePermission permission="weighing-stock-client_report">
              {lazyRoute(WeighingStockClientReportRelatorio)}
            </RequirePermission>
          }
        />
        {/* DFe/Lançadas (F-255, execução 061, ROTEIRO-061 — correção do
            defeito de menu/breadcrumb reportado pelo Tester runtime). Rota
            PRÓPRIA sob `/relatorios/estoque/...`, mesmo prefixo das
            telas-irmã acima, apontando para o MESMO componente lazy
            `DfeReport` (declarado ~L3216) e MESMO gate `dfe_report` da rota
            legada. A rota antiga `/fiscal/dfes/relatorio` é MANTIDA como
            alias (mudança mínima, nenhum consumidor quebrado) — só o item
            de menu `rel-est-dfe-lancadas` (navigationTree.ts) passou a
            apontar para esta rota nova, o que resolve a colisão de
            destaque de sidebar com "DFe Recebidas" (mesmo prefixo
            `/fiscal/dfes`). */}
        <Route
          path="/relatorios/estoque/dfe-lancadas"
          element={
            <RequirePermission permission="dfe_report">{lazyRoute(DfeReport)}</RequirePermission>
          }
        />
        <Route
          path="/relatorios/agricultura/aplicacao-manejo-talhoes"
          element={
            <RequirePermission permission="agriculture-application-management-report_view">
              {lazyRoute(AplicacaoManejoTalhoesRelatorio)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Apuração Mensal (Earning, 97-Esteiras/002,
            Tarefas 07/08/09): listagem+filtro+seletor de funcionário
            ("Lançar Apuração") + import/export planilha + "Gerar Financeiro"
            (Tarefa 09) + detalhe read-only (Tarefa 07) + formulário único de
            upsert (Tarefa 08), declaradas ANTES do catch-all
            /administrativo/* para vencerem o RoutePlaceholder. `/:employeeUuid/editar`
            declarada ANTES de `/:employeeUuid` (mesma armadilha de ordem já
            documentada nos blocos acima — senão "editar" seria capturado
            como se fosse o próprio segmento de detalhe). Item de menu
            (adm-gp-apu) e permissão de navegação (earnings_view) JÁ
            EXISTIAM (navigationTree.ts:498) — path real `/administrativo/apuracao`
            (não `/administrativo/apuracao-mensal`). */}
        <Route
          path="/administrativo/apuracao"
          element={
            <RequirePermission permission="earnings_view">
              {lazyRoute(EarningList)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/apuracao/:employeeUuid/editar"
          element={
            <RequirePermission permission="earnings_edit">
              {lazyRoute(CreateOrUpdateEarning)}
            </RequirePermission>
          }
        />
        <Route
          path="/administrativo/apuracao/:employeeUuid"
          element={
            <RequirePermission permission="earnings_view">
              {lazyRoute(EarningDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Reprodução — Estação de Monta (97-Esteiras/003
            Tarefas 12/13) — DECLARADAS ANTES do catch-all /operacional/*
            para vencerem o RoutePlaceholder, mesmo cuidado de
            `contratos-venda`/`apuracao` acima. `/nova` declarada ANTES de
            `/:breedingSeasonUuid/editar`, e esta ANTES de
            `/:breedingSeasonUuid` puro (mesma ordem defensiva já usada nos
            blocos irmãos, ainda que o React Router 6 resolva por
            especificidade). Rota-raiz mapeada direto para esta feature
            (`GAP-ESTACAOMONTA-FE-02`) — as 5 telas dependentes futuras do
            submódulo "Reprodução" não são tocadas por esta Tarefa. */}
        <Route
          path="/operacional/reproducao"
          element={
            <RequirePermission permission="breeding-seasons_view">
              {lazyRoute(EstacaoDeMontaList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/reproducao/nova"
          element={
            <RequirePermission permission="breeding-seasons_create">
              {lazyRoute(CreateOrUpdateEstacaoDeMonta)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/reproducao/:breedingSeasonUuid/editar"
          element={
            <RequirePermission permission="breeding-seasons_edit">
              {lazyRoute(CreateOrUpdateEstacaoDeMonta)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/reproducao/:breedingSeasonUuid"
          element={
            <RequirePermission permission="breeding-seasons_view">
              {lazyRoute(EstacaoDeMontaDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Reprodução — Touros/Sêmen/Embrião (BullSeedSeason,
            97-Esteiras/005 Tarefas 24/25) — DECLARADAS ANTES do catch-all
            /operacional/* para vencerem o RoutePlaceholder, mesmo cuidado
            do bloco irmão "Estação de Monta" acima. Path FLAT, não aninhado
            sob /operacional/reproducao/ (mirror EXATO da convenção já usada
            por "Manejo"→"Pastagem", contrato de tela §3). `/novo` declarada
            ANTES de `:uuid/editar`, e esta ANTES de `:uuid` puro (mesma
            ordem defensiva já usada no bloco irmão "Estação de Monta"). */}
        <Route
          path="/operacional/touros-semen-embriao"
          element={
            <RequirePermission permission="bull-seed-season_view">
              {lazyRoute(BullSeedSeasonList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/touros-semen-embriao/novo"
          element={
            <RequirePermission permission="bull-seed-season_create">
              {lazyRoute(CreateOrUpdateBullSeedSeason)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/touros-semen-embriao/:bullSeedSeasonUuid/editar"
          element={
            <RequirePermission permission="bull-seed-season_edit">
              {lazyRoute(CreateOrUpdateBullSeedSeason)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/touros-semen-embriao/:bullSeedSeasonUuid"
          element={
            <RequirePermission permission="bull-seed-season_view">
              {lazyRoute(BullSeedSeasonDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Reprodução — Lotes/Reprodução (BreedingBatch,
            97-Esteiras/048 Tarefas 04-07) — DECLARADAS ANTES do catch-all
            /operacional/* para vencerem o RoutePlaceholder, mesmo cuidado
            dos blocos irmãos "Estação de Monta"/"Touros/Sêmen/Embrião"
            acima. `/nova` declarada ANTES de `:breedingBatchUuid/editar`, e
            esta ANTES de `:breedingBatchUuid` puro (mesma ordem defensiva
            já usada nos blocos irmãos — sem isso, a rota genérica
            capturaria "nova"/"editar" como se fossem um uuid). Gate
            `breeding-batch_view/create/edit`, NUNCA `batch_*` (achado
            #2/CLM-03, contrato de tela §2). */}
        <Route
          path="/operacional/lotes-reproducao"
          element={
            <RequirePermission permission="breeding-batch_view">
              {lazyRoute(LoteReproducaoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lotes-reproducao/nova"
          element={
            <RequirePermission permission="breeding-batch_create">
              {lazyRoute(CreateOrUpdateLoteReproducao)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lotes-reproducao/:breedingBatchUuid/editar"
          element={
            <RequirePermission permission="breeding-batch_edit">
              {lazyRoute(CreateOrUpdateLoteReproducao)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lotes-reproducao/:breedingBatchUuid"
          element={
            <RequirePermission permission="breeding-batch_view">
              {lazyRoute(LoteReproducaoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Reprodução — Protocolos/Estação (ProtocolSeason,
            F-057, execução 040, contrato-frontend §4.7) — DECLARADAS ANTES
            do catch-all /operacional/* para vencerem o RoutePlaceholder,
            mesmo cuidado dos blocos irmãos acima. `/nova` declarada ANTES de
            `:uuid/editar`, e esta ANTES de `:uuid` puro (mesma ordem
            defensiva já usada nos blocos irmãos). */}
        <Route
          path="/operacional/protocolos-estacao"
          element={
            <RequirePermission permission="protocols-season_view">
              {lazyRoute(ProtocolSeasonsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/protocolos-estacao/nova"
          element={
            <RequirePermission permission="protocols-season_create">
              {lazyRoute(CreateOrUpdateProtocolSeason)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/protocolos-estacao/:uuid/editar"
          element={
            <RequirePermission permission="protocols-season_edit">
              {lazyRoute(CreateOrUpdateProtocolSeason)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/protocolos-estacao/:uuid"
          element={
            <RequirePermission permission="protocols-season_view">
              {lazyRoute(ProtocolSeasonDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Reprodução — Acasalamento + Diagnóstico de Gestação
            (BreedingMating/PregnancyDiagnosis, TASK-BM-FE-09, contrato-tela-
            lane-b-breeding-mating-frontend.md §3/§9) — DECLARADAS ANTES do
            catch-all /operacional/* para vencerem o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos "Reprodução" acima. Ordem exata:
            listagem, `/novo` ANTES de `/:uuid/editar` ANTES de
            `/proxima-etapa` ANTES de `/:uuid` puro; dentro do subcaminho de
            Diagnóstico de Gestação, `/diagnostico-gestacao/novo` ANTES de
            `/diagnostico-gestacao/:pregnancyDiagnosisUuid` ANTES de
            `/diagnostico-gestacao` puro (mesma ordem defensiva já usada nos
            blocos irmãos). Diagnóstico de Gestação NÃO tem item de menu
            próprio (OWN-DEC-001) — alcançado só por dentro de Acasalamento. */}
        <Route
          path="/operacional/acasalamento"
          element={
            <RequirePermission permission="breeding-matings_view">
              {lazyRoute(AcasalamentoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/novo"
          element={
            <RequirePermission permission="breeding-matings_create">
              {lazyRoute(CreateOrUpdateAcasalamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/:breedingMatingUuid/editar"
          element={
            <RequirePermission permission="breeding-matings_edit">
              {lazyRoute(CreateOrUpdateAcasalamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/:breedingMatingUuid/proxima-etapa"
          element={
            <RequirePermission permission="breeding-matings_edit">
              {lazyRoute(AcasalamentoProximaEtapa)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/:breedingMatingUuid/diagnostico-gestacao/novo"
          element={
            <RequirePermission permission="pregnancy-diagnosis_create">
              {lazyRoute(CreateDiagnosticoGestacao)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/:breedingMatingUuid/diagnostico-gestacao/:pregnancyDiagnosisUuid"
          element={
            <RequirePermission permission="pregnancy-diagnosis_view">
              {lazyRoute(DiagnosticoGestacaoDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/:breedingMatingUuid/diagnostico-gestacao"
          element={
            <RequirePermission permission="pregnancy-diagnosis_view">
              {lazyRoute(DiagnosticoGestacaoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/acasalamento/:breedingMatingUuid"
          element={
            <RequirePermission permission="breeding-matings_view">
              {lazyRoute(AcasalamentoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Agricultura — Colheita de Frutas (HarvestProduct,
            F-040, execução 040, HarvestProduct-contrato-arquitetural.md §7.9)
            — DECLARADAS ANTES do catch-all /operacional/* para vencerem o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos acima. `/nova` e
            `:uuid/editar` declaradas ANTES de `:uuid` puro (ordem defensiva,
            mesmo padrão do sibling `protocolos-estacao`). */}
        <Route
          path="/operacional/colheita-frutas"
          element={
            <RequirePermission permission="harvest-products_view">
              {lazyRoute(HarvestProductsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/colheita-frutas/nova"
          element={
            <RequirePermission permission="harvest-products_create">
              {lazyRoute(CreateOrUpdateHarvestProduct)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/colheita-frutas/:uuid/editar"
          element={
            <RequirePermission permission="harvest-products_edit">
              {lazyRoute(CreateOrUpdateHarvestProduct)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/colheita-frutas/:uuid"
          element={
            <RequirePermission permission="harvest-products_view">
              {lazyRoute(HarvestProductDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Reprodução — Gerenciamento Avançado
            (AdvancedReproductive, F-011, 97-Esteiras/056 TASK-AR-FE-03) —
            DECLARADA ANTES do catch-all /operacional/* para vencer o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos "Estação de
            Monta"/"Touros/Sêmen/Embrião"/"Lotes/Reprodução" acima. Path
            FLAT sob /operacional/ (mirror EXATO da convenção já usada por
            "Touros/Sêmen/Embrião", contrato de tela §4). Única rota desta
            feature — tela 100% leitura, sem `/nova`, `/:uuid` ou
            `/:uuid/editar`. Gate `advanced-reproductive_view` (reuso,
            DEC-006). */}
        <Route
          path="/operacional/gerenciamento-avancado"
          element={
            <RequirePermission permission="advanced-reproductive_view">
              {lazyRoute(GerenciamentoAvancadoList)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Dieta (Diet, TASK-FE-DIET-07): 3 rotas
            REAIS (listagem, criar, editar), declaradas ANTES do catch-all
            /operacional/* para vencerem o RoutePlaceholder, mirror EXATO
            do bloco Food em /administrativo/fabrica*. `/novo` ANTES de
            `/:dietId` (segmentos literais distintos, sem colisão de
            path-param, mesma convenção já usada em Food/Batida). */}
        <Route
          path="/operacional/dietas"
          element={
            <RequirePermission permission="diets_view">{lazyRoute(DietList)}</RequirePermission>
          }
        />
        <Route
          path="/operacional/dietas/novo"
          element={
            <RequirePermission permission="diets_create">
              {lazyRoute(CreateOrUpdateDiet)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/dietas/:dietId"
          element={
            <RequirePermission permission="diets_view">
              {lazyRoute(CreateOrUpdateDiet)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Batida (DietBeat, TASK-FE-DIET-07): 3
            rotas REAIS, declaradas ANTES do catch-all /operacional/* para
            vencerem o RoutePlaceholder, mirror EXATO do bloco Batida em
            /administrativo/fabrica/batidas*. Path-base
            `/operacional/dietas/batidas` (segmento fixo, não colide com
            `/operacional/dietas/:dietId`). `:dietBeatId` gated por
            `diet-beats_view` (não `_edit`) — mesmo padrão exato de
            Food/FoodBeat: o botão de submit dentro do form é quem checa
            `diet-beats_edit`, não a rota. */}
        <Route
          path="/operacional/dietas/batidas"
          element={
            <RequirePermission permission="diet-beats_view">
              {lazyRoute(DietBeatList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/dietas/batidas/novo"
          element={
            <RequirePermission permission="diet-beats_create">
              {lazyRoute(CreateOrUpdateDietBeat)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/dietas/batidas/:dietBeatId"
          element={
            <RequirePermission permission="diet-beats_view">
              {lazyRoute(CreateOrUpdateDietBeat)}
            </RequirePermission>
          }
        />

        {/* Operacional / Confinamento — Pátio (FeedlotYard, TASK-PT-FE-01/02,
            execução 046): 4 rotas REAIS (listagem, criar, editar, detalhe),
            declaradas ANTES do catch-all /operacional/* para vencerem o
            RoutePlaceholder, mirror do bloco Dieta acima. `/novo` ANTES de
            `/:feedlotYardUuid` (mesma armadilha de ordem de registro já
            documentada para CentroCusto/DocumentType/Dieta). Guarda de
            `/novo`: `feedlot-yards_view` (ação real gateada por
            `feedlot-yards_create` no botão "Novo" da listagem — mesmo padrão
            de guarda mínima usado por CentroCusto); `/:feedlotYardUuid`
            (editar) guardada por `feedlot-yards_edit` (contrato de tela
            §4 — diferente da guarda mínima do create). */}
        <Route
          path="/operacional/patios"
          element={
            <RequirePermission permission="feedlot-yards_view">
              {lazyRoute(FeedlotYardList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/patios/novo"
          element={
            <RequirePermission permission="feedlot-yards_view">
              {lazyRoute(CreateOrUpdateFeedlotYard)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/patios/:feedlotYardUuid"
          element={
            <RequirePermission permission="feedlot-yards_edit">
              {lazyRoute(CreateOrUpdateFeedlotYard)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/patios/:feedlotYardUuid/detalhe"
          element={
            <RequirePermission permission="feedlot-yards_view">
              {lazyRoute(DetalheFeedlotYard)}
            </RequirePermission>
          }
        />

        {/* Operacional / Confinamento — Setor (FeedlotSector,
            TASK-FS-FE-01/02): 4 rotas REAIS (listagem, criar, editar,
            detalhe), declaradas ANTES do catch-all /operacional/* para
            vencerem o RoutePlaceholder, mirror do bloco Pátio acima. `/novo`
            ANTES de `/:feedlotSectorUuid` (mesma armadilha de ordem de
            registro já documentada para CentroCusto/DocumentType/Dieta/
            FeedlotYard). Guarda de `/novo`: `feedlot-sectors_view` (ação
            real gateada por `feedlot-sectors_create` no botão "Novo" da
            listagem — mesmo padrão de guarda mínima usado por FeedlotYard);
            `/:feedlotSectorUuid` (editar) guardada por `feedlot-sectors_edit`
            (contrato de tela §4 — diferente da guarda mínima do create). */}
        <Route
          path="/operacional/setores"
          element={
            <RequirePermission permission="feedlot-sectors_view">
              {lazyRoute(FeedlotSectorList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/setores/novo"
          element={
            <RequirePermission permission="feedlot-sectors_view">
              {lazyRoute(CreateOrUpdateFeedlotSector)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/setores/:feedlotSectorUuid"
          element={
            <RequirePermission permission="feedlot-sectors_edit">
              {lazyRoute(CreateOrUpdateFeedlotSector)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/setores/:feedlotSectorUuid/detalhe"
          element={
            <RequirePermission permission="feedlot-sectors_view">
              {lazyRoute(DetalheFeedlotSector)}
            </RequirePermission>
          }
        />

        {/* Operacional / Confinamento — Curral standalone (FeedlotCorral,
            F-035, lote 043, TASK-043-CUR-T01 — fundação): 5 rotas REAIS
            (listagem, criar, editar, detalhe, histórico), declaradas ANTES
            do catch-all /operacional/* para vencerem o RoutePlaceholder,
            mirror do bloco Setor acima. `/novo` ANTES de `/:uuid` (mesma
            armadilha de ordem já documentada para CentroCusto/DocumentType/
            Dieta/FeedlotYard/FeedlotSector). Guarda de `/novo`:
            `feedlot-corrals_view` (ação real gateada por
            `feedlot-corrals_create` no botão "Novo" da listagem — mesmo
            padrão de guarda mínima usado por FeedlotSector/FeedlotYard);
            `/:uuid` (editar) guardada por `feedlot-corrals_edit` (contrato
            de tela §5, DoD T01). CASCA MÍNIMA nesta Tarefa — T02 (lista),
            T03 (wizard), T07 (detalhe) e T09 (histórico, BLOQUEADA por
            GAP-API-01) substituem cada página por inteiro. */}
        <Route
          path="/operacional/currais"
          element={
            <RequirePermission permission="feedlot-corrals_view">
              {lazyRoute(FeedlotCorralList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/currais/novo"
          element={
            <RequirePermission permission="feedlot-corrals_view">
              {lazyRoute(CreateOrUpdateFeedlotCorral)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/currais/:uuid"
          element={
            <RequirePermission permission="feedlot-corrals_edit">
              {lazyRoute(CreateOrUpdateFeedlotCorral)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/currais/:uuid/detalhe"
          element={
            <RequirePermission permission="feedlot-corrals_view">
              {lazyRoute(DetalheFeedlotCorral)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/currais/:uuid/historico"
          element={
            <RequirePermission permission="feedlot-corrals_view">
              {lazyRoute(HistoricoFeedlotCorral)}
            </RequirePermission>
          }
        />

        {/* Operacional / Confinamento — Mapa de Confinamento (FeedlotMap,
            TASK-FE-042-200, execução 042): 1 rota REAL (árvore completa,
            sem paginação), declarada ANTES do catch-all /operacional/* para
            vencer o RoutePlaceholder, mirror do bloco Setor acima. Guarda
            `feedlot-map_view` (leitura da árvore) — mutações (reorder/CRUD/
            diálogos) são gateadas por `feedlot-map_manage`/permissões
            próprias de cada recurso reusado dentro dos diálogos, nunca na
            rota. */}
        <Route
          path="/operacional/mapa"
          element={
            <RequirePermission permission="feedlot-map_view">
              {lazyRoute(FeedlotMapDashboard)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária/Confinamento — Fases de Alimentação
            (FeedingPhase, F-034, TASK-FP-FE-04): 3 rotas REAIS (listagem,
            criar, editar), declaradas ANTES do catch-all /operacional/*
            para vencerem o RoutePlaceholder, mirror EXATO do bloco Dieta
            acima. `/novo` ANTES de `/:feedingPhaseId` (segmentos literais
            distintos, sem colisão de path-param). Sem rota `show` dedicada
            — `:feedingPhaseId` gated por `feeding-phases_view` (não
            `_edit`): o botão de submit dentro do form é quem checa
            `feeding-phases_edit`, não a rota (mirror Dieta/Food). */}
        <Route
          path="/operacional/fases-alimentacao"
          element={
            <RequirePermission permission="feeding-phases_view">
              {lazyRoute(FeedingPhaseList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/fases-alimentacao/novo"
          element={
            <RequirePermission permission="feeding-phases_create">
              {lazyRoute(CreateOrUpdateFeedingPhase)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/fases-alimentacao/:feedingPhaseId"
          element={
            <RequirePermission permission="feeding-phases_view">
              {lazyRoute(CreateOrUpdateFeedingPhase)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Evolução/Rebanho (Evolution, Tarefa 26,
            spa-contract-evolucao-rebanho.md §4) — DECLARADA ANTES do
            catch-all /operacional/* para vencer o RoutePlaceholder, mesmo
            cuidado dos blocos irmãos acima. 100% somente-leitura — só a
            rota de listagem, sem `/novo`/`:uuid`/`:uuid/editar` (sem
            endpoint de escrita, sem UI de criação — as evoluções são
            geradas pelo job diário). */}
        <Route
          path="/operacional/evolucao-rebanho"
          element={
            <RequirePermission permission="evolutions_view">
              {lazyRoute(EvolutionsList)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Transferência Animais/Lote (BatchTransfer,
            feature `426be835`, Tarefas 26/27, frontend-contract-animais-lote.md
            §3) — DECLARADAS ANTES do catch-all /operacional/* para vencerem o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos acima. `/novo`
            declarada antes da listagem só por organização (não há rota
            paramétrica `/:uuid` nesta feature — `->only(['index','create',
            'store'])` no legado — então não há armadilha de captura). Guard
            da listagem: só `transference_animal_batch` (contrato §3). Guard
            do formulário: `allOf` com `batch_view` (default do
            `GAP-LOTE-FE-05` — o picker de animais exige `batch_view`; sem
            ele o formulário abre vazio e quebrado). */}
        <Route
          path="/operacional/transferencia-animais-lote/novo"
          element={
            <RequirePermission allOf={['transference_animal_batch', 'batch_view']}>
              {lazyRoute(CreateBatchTransfer)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/transferencia-animais-lote"
          element={
            <RequirePermission permission="transference_animal_batch">
              {lazyRoute(BatchTransfersList)}
            </RequirePermission>
          }
        />

        {/* Operacional / Agricultura — Descontos/Classificação
            (DiscountTable, F-032, TASK-DT-FE-04): 3 rotas REAIS (listagem,
            criar, editar), declaradas ANTES do catch-all /operacional/*
            para vencerem o RoutePlaceholder, mirror EXATO do bloco Fases de
            Alimentação acima. `/create` ANTES de `/:id` (segmentos
            literais distintos, sem colisão de path-param). Sem rota `show`
            dedicada — `:id` gated por `discount-tables_view` (não `_edit`):
            o botão de submit dentro do form é quem checa
            `discount-tables_edit`/`_create` (`canSave`), não a rota (mirror
            FeedingPhase/Diet). */}
        <Route
          path="/operacional/discount-tables"
          element={
            <RequirePermission permission="discount-tables_view">
              {lazyRoute(DiscountTableList)}
            </RequirePermission>
          }
        />
        {/* Operacional/Agricultura — Planejamentos (Planning, raiz da árvore
            de Planejamento de Cultura/Variedade, TASK-FE-PLAN-01/02, esteira
            97-Esteiras/007) — DECLARADAS ANTES do catch-all /operacional/*
            para vencerem o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            acima. `/novo` declarada ANTES de `/:planningUuid` (mesma
            armadilha "novo" vs UUID de Nascimentos/Equipes/Faltas/Vendas/
            Desmama/Marcação/Lista de OS). `/novo` e `/:planningUuid` apontam
            para a MESMA página (`CreateOrUpdatePlanning`) — rota ÚNICA de
            criação/edição por "Decisão de arquitetura de tela" do manifesto
            FID-G3F (form raiz no topo + árvore embutida abaixo, SÓ em
            edição; NUNCA duas rotas separadas como em `ServiceOrders`, o
            legado nunca teve duas telas). Item de menu (`ope-agr-pla`) e
            permissão (`plannings_view`) JÁ EXISTIAM em `navigationTree.ts`/
            `navigationPermissions.ts` antes de `TASK-FE-PLAN-01` — nenhuma
            edição neles. Guarda única `plannings_view` nas 3 rotas (leitura
            mínima — `CreateOrUpdatePlanning` decide `canSave` por
            `plannings_create`/`plannings_edit` internamente, mesmo padrão de
            Apontamentos/Lista de OS). */}
        <Route
          path="/operacional/planejamentos"
          element={
            <RequirePermission permission="plannings_view">
              {lazyRoute(PlanejamentosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/discount-tables/create"
          element={
            <RequirePermission permission="discount-tables_create">
              {lazyRoute(CreateOrUpdateDiscountTable)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/planejamentos/novo"
          element={
            <RequirePermission permission="plannings_view">
              {lazyRoute(CreateOrUpdatePlanning)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/discount-tables/:id"
          element={
            <RequirePermission permission="discount-tables_view">
              {lazyRoute(CreateOrUpdateDiscountTable)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/planejamentos/:planningUuid"
          element={
            <RequirePermission permission="plannings_view">
              {lazyRoute(CreateOrUpdatePlanning)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Manejo / Sanitário (Sanitary, F-062,
            TASK-SAN-FE-09, contrato-tela-lane-c-sanitario-frontend.md §9)
            — ÚLTIMA Tarefa da esteira, fecha o `surface_manifest` completo
            do módulo (listagem, form criar/editar, visualização, criação
            múltipla via diálogo — sem rota própria — e relatório, este
            último no bloco /relatorios/* acima). 4 rotas REAIS declaradas
            ANTES do catch-all /operacional/* para vencerem o
            RoutePlaceholder, mirror EXATO do bloco "Reprodução → Estação de
            Monta" acima. `/novo` ANTES de `/:sanitarioUuid/editar`, e esta
            ANTES de `/:sanitarioUuid` puro (mesma ordem defensiva
            estático→dinâmico já usada nos blocos irmãos). Item de menu
            (`ope-pec-man-san`) e permissão (`sanitary_view`) em
            navigationTree.ts/navigationPermissions.ts — nenhum slug novo. */}
        <Route
          path="/operacional/sanitario"
          element={
            <RequirePermission permission="sanitary_view">
              {lazyRoute(SanitarioList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/sanitario/novo"
          element={
            <RequirePermission permission="sanitary_create">
              {lazyRoute(CreateOrUpdateSanitario)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/sanitario/:sanitarioUuid/editar"
          element={
            <RequirePermission permission="sanitary_edit">
              {lazyRoute(CreateOrUpdateSanitario)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/sanitario/:sanitarioUuid"
          element={
            <RequirePermission permission="sanitary_view">
              {lazyRoute(SanitarioDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Manejo / Pesagem (Weighing, F-071,
            TASK-PES-FE-08, contrato-tela-lane-c-pesagem-frontend.md §9)
            — ÚLTIMA Tarefa da esteira, fecha o `surface_manifest` completo
            do módulo (listagem, form criar/editar, visualização — importar
            planilha é ação dentro da listagem, sem rota própria; relatório
            individual é download direto por linha, sem tela própria). 4
            rotas REAIS declaradas ANTES do catch-all /operacional/* para
            vencerem o RoutePlaceholder, mirror EXATO do bloco "Operacional
            → Sanitário" acima. `/novo` ANTES de `/:uuid/editar`, e esta
            ANTES de `/:uuid` puro (mesma ordem defensiva
            estático→dinâmico já usada nos blocos irmãos). Item de menu
            (`ope-pec-man-pes`) e permissão (`weighing_view`) em
            navigationTree.ts/navigationPermissions.ts — nenhum slug novo. */}
        <Route
          path="/operacional/pesagem"
          element={
            <RequirePermission permission="weighing_view">
              {lazyRoute(PesagemList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem/novo"
          element={
            <RequirePermission permission="weighing_create">
              {lazyRoute(CreateOrUpdateWeighing)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem/:uuid/editar"
          element={
            <RequirePermission permission="weighing_edit">
              {lazyRoute(CreateOrUpdateWeighing)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem/:uuid"
          element={
            <RequirePermission permission="weighing_view">
              {lazyRoute(WeighingDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional / Pecuária — Inventariado (Inventoried, F-041,
            CORE_WORKSPACE/97-Esteiras/060, TASK-INV-FE-02/04) — DECLARADAS
            ANTES do catch-all /operacional/* para vencerem o
            RoutePlaceholder, mesmo cuidado dos blocos irmãos acima. Item de
            menu `ope-pec-inv` JÁ EXISTE (`navigationTree.ts:1442` →
            `/operacional/inventariado`) — só a rota estava ausente. `:uuid`
            declarada DEPOIS da base (sem literal conflitante nesta feature,
            mesmo cuidado defensivo dos demais blocos). SEM `_edit` — feature
            sem formulário de criar/editar (SR-06 do legado). */}
        <Route
          path="/operacional/inventariado"
          element={
            <RequirePermission permission="inventoried-animals_view">
              {lazyRoute(InventariadoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/inventariado/:uuid"
          element={
            <RequirePermission permission="inventoried-animals_view">
              {lazyRoute(InventariadoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional — Pesagem Rodoviária (ModuleWeighing, F-045, execução
            044, TASK-MWG-FE-01..13 — esteira COMPLETA) — rotas REAIS
            declaradas ANTES do catch-all `/operacional/*` para vencerem o
            `RoutePlaceholder`, mesma ordem defensiva estático→dinâmico dos
            blocos irmãos acima: `/novo` e `/relatorio` (segmentos ESTÁTICOS)
            ANTES de `/:uuid/editar`/`/:uuid/etapa`/`/:uuid/finalizar`, e
            estas ANTES de `/:uuid` puro (contrato-tela §5). PINO CRÍTICO:
            `ModuleWeighing` ≠ `Weighing` (bloco "Operacional — Pesagem"
            acima, pesagem ANIMAL, F-071, já em produção) — permissões
            `module-weighing_*` deliberadamente disjuntas de `weighing_*`
            (`CONTRATO-TELA-PESAGEM-FE §1`). Item de menu: `ope-agr-pes`
            (`navigationTree.ts`/`navigationPermissions.ts`, `TASK-MWG-FE-13`). */}
        <Route
          path="/operacional/pesagem-rodoviaria"
          element={
            <RequirePermission permission="module-weighing_view">
              {lazyRoute(ModuleWeighingList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem-rodoviaria/novo"
          element={
            <RequirePermission permission="module-weighing_create">
              {lazyRoute(CreateOrUpdateModuleWeighing)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem-rodoviaria/relatorio"
          element={
            <RequirePermission permission="module-weighings_report">
              {lazyRoute(ModuleWeighingRelatorio)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem-rodoviaria/:uuid/editar"
          element={
            <RequirePermission permission="module-weighing_edit">
              {lazyRoute(CreateOrUpdateModuleWeighing)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem-rodoviaria/:uuid/etapa"
          element={
            <RequirePermission permission="module-weighing_edit">
              {lazyRoute(ModuleWeighingWizard)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem-rodoviaria/:uuid/finalizar"
          element={
            <RequirePermission permission="module-weighing_edit">
              {lazyRoute(FinalizarModuleWeighing)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pesagem-rodoviaria/:uuid"
          element={
            <RequirePermission permission="module-weighing_view">
              {lazyRoute(ModuleWeighingComprovante)}
            </RequirePermission>
          }
        />

        {/* Dashboards analíticos (execução 046) — rotas REAIS, declaradas
            ANTES do catch-all /dashboards/* para vencerem o RoutePlaceholder.
            Ordem obrigatória UA → LC → AT → ABC (CHK-1, `00-CONTRATO-FRONT-046
            -fundacao-e-chokepoints.md §7`). */}
        <Route
          path="/dashboards/usuarios"
          element={
            <RequirePermission permission="user_analysis_dashboard_view">
              {lazyRoute(DashboardUserAnalysis)}
            </RequirePermission>
          }
        />
        <Route
          path="/dashboards/lotacao-currais"
          element={
            <RequirePermission permission="feedlot_dashboard_view">
              {lazyRoute(DashboardFeedlot)}
            </RequirePermission>
          }
        />
        <Route
          path="/dashboards/ativos"
          element={
            <RequirePermission permission="assets_dashboard_view">
              {lazyRoute(DashboardAssets)}
            </RequirePermission>
          }
        />
        <Route
          path="/dashboards/abc-indicators"
          element={
            <RequirePermission permission="abc_indicators_dashboard_view">
              {lazyRoute(DashboardAbcIndicators)}
            </RequirePermission>
          }
        />
        {/* Pluviometria (execução 048, TASK-01-FE) — 1ª rota nova do lote 048,
            mesma faixa das 4 rotas 046 acima. */}
        <Route
          path="/dashboards/pluviometria"
          element={
            <RequirePermission permission="rainfall_dashboard_view">
              {lazyRoute(DashboardRainfall)}
            </RequirePermission>
          }
        />
        {/* Livro Caixa (execução 048, TASK-03-FE) — 2ª rota nova do lote 048,
            mesma faixa. Backend JÁ EXISTE (`cash_book_dashboard_view`). */}
        <Route
          path="/dashboards/livro-caixa"
          element={
            <RequirePermission permission="cash_book_dashboard_view">
              {lazyRoute(DashboardCashbook)}
            </RequirePermission>
          }
        />
        {/* Depreciações (execução 048, TASK-02-FE) — 3ª rota nova do lote
            048, mesma faixa. */}
        <Route
          path="/dashboards/depreciacoes"
          element={
            <RequirePermission permission="depreciation_dashboard_view">
              {lazyRoute(DashboardDepreciation)}
            </RequirePermission>
          }
        />
        {/* Financeiro (execução 048, TASK-04-FE) — 4ª rota nova do lote 048,
            mesma faixa. DEC-191: sem heatmap de receita por hora. */}
        <Route
          path="/dashboards/financeiro"
          element={
            <RequirePermission permission="financial_dashboard_view">
              {lazyRoute(DashboardFinancial)}
            </RequirePermission>
          }
        />
        {/* Pecuária de Corte (execução 048, TASK-05-FE) — 5ª e última rota
            nova do lote 048, mesma faixa. */}
        <Route
          path="/dashboards/pecuaria"
          element={
            <RequirePermission permission="livestock_dashboard_view">
              {lazyRoute(DashboardLivestock)}
            </RequirePermission>
          }
        />

        {/* Dashboard de Suprimentos (SupplyDashboard, Tarefas 38/39,
            esteira 97-Esteiras/009) — declarada ANTES do catch-all
            `/dashboards/*` (mirror do padrão dos demais blocos de módulo,
            ex.: `document-types`/`documentos`). */}
        <Route
          path="/dashboards/suprimentos"
          element={
            <RequirePermission permission="supply_dashboard_view">
              {lazyRoute(SupplyDashboardPage)}
            </RequirePermission>
          }
        />

        {/* Gestão de Frota — Abastecimentos (Supply, Tarefas 40/41, esteira
            97-Esteiras/009) — 4 rotas reais, declaradas ANTES do catch-all
            `/frota/*` vencerem por especificidade (mirror Apontamentos/
            Planos acima). PRIMEIRA tela real do módulo `/frota/*` (hoje
            100% `<RoutePlaceholder />`). Permissão por VERBO (contrato de
            API §3, distinto do "leitura mínima" único de Apontamentos):
            `/novo` exige `appropriation-supplies_create`, `/:supplyId`
            (edição) exige `appropriation-supplies_edit`, listagem/detalhe
            exigem `appropriation-supplies_view`. `/novo` declarada ANTES de
            `/:supplyId` para não ser capturada como uuid (mirror
            `CreateOrUpdateAppropriation.tsx` — nessa rota literal
            `supplyId` chega `undefined`, sem precisar comparar a string
            `'novo'` no componente). Item de menu (`fro-aba`) e permissão
            (`appropriation-supplies_view`) JÁ EXISTIAM em
            `navigationTree.ts`/`navigationPermissions.ts` — NENHUMA edição
            neles. */}
        <Route
          path="/frota/abastecimentos"
          element={
            <RequirePermission permission="appropriation-supplies_view">
              {lazyRoute(AbastecimentosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/abastecimentos/novo"
          element={
            <RequirePermission permission="appropriation-supplies_create">
              {lazyRoute(CreateOrUpdateAbastecimento)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/abastecimentos/:supplyId"
          element={
            <RequirePermission permission="appropriation-supplies_edit">
              {lazyRoute(CreateOrUpdateAbastecimento)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/abastecimentos/:supplyId/detalhe"
          element={
            <RequirePermission permission="appropriation-supplies_view">
              {lazyRoute(AbastecimentoDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/revisoes"
          element={
            <RequirePermission permission="scheduled-reviews_view">
              {lazyRoute(RevisoesList)}
            </RequirePermission>
          }
        />
        {/* Transferência de Máquinas (EquipmentTransfer, F-101,
            97-Esteiras/005, TASK-ETR-FE-05) — 4 rotas reais, declaradas ANTES
            do catch-all `/frota/*` (abaixo) vencerem por especificidade.
            `/novo` declarada ANTES de `/:uuid/...` para não ser capturada
            como uuid (mirror `/frota/abastecimentos` acima). SEM rota
            `/:uuid` nua — edição excluída por decisão do dono (OD-001) e
            `equipment-transfer_edit` NÃO EXISTE em `permissionsCatalog.json`
            (quebraria `validate:permissions` no build). Item de menu
            (`fro-tra`) e permissão (`equipment-transfer_view`) JÁ EXISTIAM em
            `navigationTree.ts`/`navigationPermissions.ts` — NENHUMA edição
            neles. */}
        <Route
          path="/frota/transferencias"
          element={
            <RequirePermission permission="equipment-transfer_view">
              {lazyRoute(TransferenciasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/transferencias/novo"
          element={
            <RequirePermission permission="equipment-transfer_create">
              {lazyRoute(CreateTransferencia)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/transferencias/:uuid/detalhe"
          element={
            <RequirePermission permission="equipment-transfer_view">
              {lazyRoute(TransferenciaDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/transferencias/:uuid/receber"
          element={
            <RequirePermission permission="equipment-transfer_create">
              {lazyRoute(ReceberTransferencia)}
            </RequirePermission>
          }
        />

        {/* Gestão de Frota — Manutenções Preventivas (MaintenancePreventive,
            Tarefas 43/44, esteira 97-Esteiras/010) — 4 rotas reais, MESMO
            bloco `Gestão de Frota`, declaradas ANTES do catch-all `/frota/*`
            (mirror exato do bloco `/frota/abastecimentos*` acima).
            Permissão por VERBO (contrato Tarefa 40): `/novo` exige
            `maintenance-preventives_create`, `/:maintenancePreventiveId`
            (edição) exige `maintenance-preventives_edit`, listagem/detalhe
            exigem `maintenance-preventives_view`. `/novo` declarada ANTES de
            `/:maintenancePreventiveId` para não ser capturada como uuid.
            Item de menu (`fro-pre`) e permissão
            (`maintenance-preventives_view`) JÁ EXISTIAM em
            `navigationTree.ts`/`navigationPermissions.ts` — NENHUMA edição
            neles. */}
        <Route
          path="/frota/preventivas"
          element={
            <RequirePermission permission="maintenance-preventives_view">
              {lazyRoute(ManutencoesPreventivasList)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/preventivas/novo"
          element={
            <RequirePermission permission="maintenance-preventives_create">
              {lazyRoute(CreateOrUpdateManutencaoPreventiva)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/preventivas/:maintenancePreventiveId"
          element={
            <RequirePermission permission="maintenance-preventives_edit">
              {lazyRoute(CreateOrUpdateManutencaoPreventiva)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/preventivas/:maintenancePreventiveId/detalhe"
          element={
            <RequirePermission permission="maintenance-preventives_view">
              {lazyRoute(ManutencaoPreventivaDetalhe)}
            </RequirePermission>
          }
        />

        {/* Gestão de Frota — Manutenções (Maintenance, F-103, Tarefas
            43/44/45, esteira 97-Esteiras/010) — 5 rotas reais, MESMO bloco
            `Gestão de Frota`, declaradas ANTES do catch-all `/frota/*`
            (mirror exato dos blocos `/frota/abastecimentos*`/
            `/frota/preventivas*` acima). Permissão por VERBO (contrato
            Tarefa 43/44/45 backend): `/novo` exige `maintenances_create`,
            `/:maintenanceId` (edição) exige `maintenances_edit`,
            listagem/detalhe exigem `maintenances_view`,
            `/gerar-financeiro` exige `maintenances_generate_financial`
            (permissão NOVA, corrige CL-3/CL-4 do legado). `/novo` declarada
            ANTES de `/:maintenanceId` para não ser capturada como uuid.
            Item de menu (`fro-man`) e permissão (`maintenances_view`) JÁ
            EXISTIAM em `navigationTree.ts:2193`/
            `navigationPermissions.ts:854` — NENHUMA edição neles.
            "Gerar Financeiro" é fluxo DESCENDENTE (rota própria, nunca um
            Dialog, FID-G3F §0/§4) — só alcançável pelo botão condicional da
            Visualização, nunca por item de menu. */}
        <Route
          path="/frota/manutencoes"
          element={
            <RequirePermission permission="maintenances_view">
              {lazyRoute(ManutencoesList)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/manutencoes/novo"
          element={
            <RequirePermission permission="maintenances_create">
              {lazyRoute(CreateOrUpdateManutencao)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/manutencoes/:maintenanceId/detalhe"
          element={
            <RequirePermission permission="maintenances_view">
              {lazyRoute(ManutencaoDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/manutencoes/:maintenanceId/gerar-financeiro"
          element={
            <RequirePermission permission="maintenances_generate_financial">
              {lazyRoute(GerarFinanceiroManutencao)}
            </RequirePermission>
          }
        />
        <Route
          path="/frota/manutencoes/:maintenanceId"
          element={
            <RequirePermission permission="maintenances_edit">
              {lazyRoute(CreateOrUpdateManutencao)}
            </RequirePermission>
          }
        />

        {/* Administrativo — Sistema — Logs do Sistema (execução 079, DD-079-05):
            papel `Gestor_Plataf` (RequireRole) E permissão `system-logs_view`
            (RequirePermission), aditivos — mesma barreira dupla da API (403 real).
            Declaradas ANTES do catch-all /administrativo/* para vencer o
            RoutePlaceholder. Path do arquivo em `?path=` (relativo a storage/logs). */}
        <Route
          path="/administrativo/logs"
          element={
            <RequireRole role="Gestor_Plataf">
              <RequirePermission permission="system-logs_view">
                {lazyRoute(SystemLogsExplorer)}
              </RequirePermission>
            </RequireRole>
          }
        />
        <Route
          path="/administrativo/logs/arquivo"
          element={
            <RequireRole role="Gestor_Plataf">
              <RequirePermission permission="system-logs_view">
                {lazyRoute(SystemLogViewer)}
              </RequirePermission>
            </RequireRole>
          }
        />
        {/* Administrativo — Atividades Recentes (UT-000690 / F-349): somente leitura,
            gate `recent-activities_view`. ANTES do catch-all /administrativo/*. */}
        <Route
          path="/administrativo/atividades-recentes"
          element={
            <RequirePermission permission="recent-activities_view">
              {lazyRoute(RecentActivitiesList)}
            </RequirePermission>
          }
        />
        {/* Módulos do GB Cerne — catch-all por módulo (árvore completa em navigationTree.ts) */}
        <Route path="/favoritos/*" element={<RoutePlaceholder />} />
        <Route path="/dashboards/*" element={<RoutePlaceholder />} />
        <Route path="/cadastros-base/*" element={<RoutePlaceholder />} />
        <Route path="/administrativo/*" element={<RoutePlaceholder />} />
        {/* Operacional — Nutrição (Nutrition, F-050, esteira 066,
            TASK-NT-FE-02/03/05) — DECLARADA ANTES do catch-all /operacional/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            acima (Sanitário/Pesagem). `/novo`/`/:id` acrescentadas em
            TASK-NT-FE-03 (form único de criar/editar, SRF-03/04/05/09);
            `/:id/visualizar` acrescentada em TASK-NT-FE-05 (visualização
            read-only, SRF-07) — fecha o CRUD visual do módulo. Guard por
            AÇÃO em cada rota (`RequirePermission`, mirror EXATO das demais
            rotas deste router) — guard de MÓDULO é implícito pelo catch-all
            `/operacional/*` + `navigationTree.ts` (`ope-pec-man-nut`).
            `ProtectedModuleRoute` citado no texto da Tarefa NÃO existe neste
            router (padrão abstrato de outro projeto/versão) — divergência de
            fidelidade declarada, ver docblock de `ViewNutrition.tsx`. */}
        <Route
          path="/operacional/nutricao"
          element={
            <RequirePermission permission="nutrition_view">
              {lazyRoute(NutritionList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/nutricao/novo"
          element={
            <RequirePermission permission="nutrition_create">
              {lazyRoute(CreateOrUpdateNutrition)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/nutricao/:id/visualizar"
          element={
            <RequirePermission permission="nutrition_view">
              {lazyRoute(ViewNutrition)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/nutricao/:id"
          element={
            <RequirePermission permission="nutrition_edit">
              {lazyRoute(CreateOrUpdateNutrition)}
            </RequirePermission>
          }
        />

        {/* Operacional — Gestão Animais (tela DEDICADA, execução 017,
            reversão de SD-01) — DECLARADA ANTES do catch-all /operacional/*
            para vencer o RoutePlaceholder, mesmo cuidado dos blocos irmãos
            acima (Nutrição/Sanitário/Pesagem). Guarda dupla idêntica à de
            `/cadastros-base/rebanho` (`animals_view`/`animals-management_view`)
            — mesmo recurso de backend, MESMO componente de tela
            (`AnimalListScreen`, Tarefa 53), só rota/menu/i18n próprios. Ver
            contrato de tela 97-Esteiras/017/CONTRATOS/contrato-tela-gestao-
            animais-dedicada.md §3. */}
        <Route
          path="/operacional/gestao-animais"
          element={
            <RequirePermission anyOf={['animals_view', 'animals-management_view']}>
              {lazyRoute(GestaoAnimaisList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/gestao-animais/novo"
          element={
            <RequirePermission anyOf={['animals_view', 'animals-management_view']}>
              {lazyRoute(CreateOrUpdateAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/gestao-animais/:animalId"
          element={
            <RequirePermission anyOf={['animals_view', 'animals-management_view']}>
              {lazyRoute(CreateOrUpdateAnimal)}
            </RequirePermission>
          }
        />

        <Route path="/operacional/*" element={<RoutePlaceholder />} />
        <Route path="/financeiro/*" element={<RoutePlaceholder />} />
        <Route path="/frota/*" element={<RoutePlaceholder />} />
        <Route path="/fiscal/*" element={<RoutePlaceholder />} />
        <Route path="/relatorios/*" element={<RoutePlaceholder />} />

        {/* Integrações — Compartilhamento (Sharing, F-122, 97-Esteiras/070,
            TASK-CP-FE-01/02/03) — DECLARADAS ANTES do catch-all
            /integracoes/* para vencerem o RoutePlaceholder, mesmo cuidado dos
            blocos irmãos "Operacional"/"Cadastros Base" acima. Ordem exata:
            listagem, `/novo` ANTES de `/:sharingUuid/editar` ANTES de
            `/:sharingUuid` puro (mesma ordem defensiva já usada em
            `acasalamento/novo`+`acasalamento/:id/editar`+`acasalamento/:id`
            — o segmento fixo `/editar` precisa vencer o parâmetro dinâmico no
            matching do React Router). */}
        <Route
          path="/integracoes/compartilhamento"
          element={
            <RequirePermission permission="sharings_view">
              {lazyRoute(CompartilhamentoList)}
            </RequirePermission>
          }
        />
        <Route
          path="/integracoes/compartilhamento/novo"
          element={
            <RequirePermission permission="sharings_create">
              {lazyRoute(CreateOrUpdateCompartilhamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/integracoes/compartilhamento/:sharingUuid/editar"
          element={
            <RequirePermission permission="sharings_edit">
              {lazyRoute(CreateOrUpdateCompartilhamento)}
            </RequirePermission>
          }
        />
        <Route
          path="/integracoes/compartilhamento/:sharingUuid"
          element={
            <RequirePermission permission="sharings_view">
              {lazyRoute(CompartilhamentoDetalhe)}
            </RequirePermission>
          }
        />

        {/* Exportação NFS-e → Domínio (F-119, CANÁRIO Integrações) —
            DECLARADA ANTES do catch-all /integracoes/* para vencer o
            RoutePlaceholder. Path `/integracoes/exp-nfse` mirror exato do
            item de menu `int-exp-nfse` já cadastrado. */}
        <Route
          path="/integracoes/exp-nfse"
          element={
            <RequirePermission permission="export_nfs_dominio_view">
              {lazyRoute(ExportNfseDominio)}
            </RequirePermission>
          }
        />

        {/* Exportação Movimento Bancário → Domínio (F-116, irmã do canário
            F-119) — DECLARADA ANTES do catch-all /integracoes/* para vencer
            o RoutePlaceholder. Path `/integracoes/exp-bancario` mirror
            exato do item de menu `int-exp-bco` já cadastrado. */}
        <Route
          path="/integracoes/exp-bancario"
          element={
            <RequirePermission permission="export_movements_dominios_view">
              {lazyRoute(ExportMovementsDominio)}
            </RequirePermission>
          }
        />

        {/* Exportação Folha Salarial → Domínio (F-117, irmã do canário
            F-119) — DECLARADA ANTES do catch-all /integracoes/* para vencer
            o RoutePlaceholder. Path `/integracoes/exp-folha` mirror exato
            do item de menu `int-exp-fol` já cadastrado. */}
        <Route
          path="/integracoes/exp-folha"
          element={
            <RequirePermission permission="export_payments_dominio_view">
              {lazyRoute(ExportEarningsDominio)}
            </RequirePermission>
          }
        />

        {/* Exportação Financeira CSV → C. Pagas/Recebidas (F-120, irmã do
            canário F-119) — DECLARADA ANTES do catch-all /integracoes/*
            para vencer o RoutePlaceholder. Path `/integracoes/csv` mirror
            exato do item de menu `int-csv` já cadastrado. */}
        <Route
          path="/integracoes/csv"
          element={
            <RequirePermission permission="financial_export">
              {lazyRoute(ExportFinancialCsv)}
            </RequirePermission>
          }
        />

        {/* Exportação Domínio → Contas a Pagar/Receber (F-118, irmã do
            canário F-119) — DECLARADA ANTES do catch-all /integracoes/*
            para vencer o RoutePlaceholder. Path `/integracoes/exp-cp`
            mirror exato do item de menu `int-exp-cp` já cadastrado. */}
        <Route
          path="/integracoes/exp-cp"
          element={
            <RequirePermission permission="export_expenses_incomes_dominio_view">
              {lazyRoute(ExportCPagarReceberDominio)}
            </RequirePermission>
          }
        />

        {/* Software Domínio (IntegrationDominio, F-121, CRUD-pai da área
            Integrações) — DECLARADAS ANTES do catch-all /integracoes/* para
            vencer o RoutePlaceholder. Path mirror exato do item de menu
            int-dom-soft (/integracoes/dominio) já cadastrado. Ordem exata:
            `/novo` ANTES de `/:uuid/editar` ANTES de `/:uuid` puro ANTES da
            listagem — mesmo cuidado defensivo do bloco irmão
            "compartilhamento" acima (segmento fixo `/editar` precisa vencer
            o parâmetro dinâmico no matching do React Router). */}
        <Route
          path="/integracoes/dominio/novo"
          element={
            <RequirePermission permission="integration_dominios_create">
              {lazyRoute(CreateOrUpdateIntegrationDominio)}
            </RequirePermission>
          }
        />
        <Route
          path="/integracoes/dominio/:uuid/editar"
          element={
            <RequirePermission permission="integration_dominios_edit">
              {lazyRoute(CreateOrUpdateIntegrationDominio)}
            </RequirePermission>
          }
        />
        <Route
          path="/integracoes/dominio/:uuid"
          element={
            <RequirePermission permission="integration_dominios_view">
              {lazyRoute(IntegrationDominioDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/integracoes/dominio"
          element={
            <RequirePermission permission="integration_dominios_view">
              {lazyRoute(SoftwareDominioList)}
            </RequirePermission>
          }
        />

        <Route path="/integracoes/*" element={<RoutePlaceholder />} />

        {/* Planos (PlanRole, TASK-FE-2704) — 4 rotas reais. Listagem/edição/
            detalhe guardadas por `plan_view` (botões internos checam
            `plan_create`/`plan_edit`/`plan_delete` via `usePermissions`,
            mesmo padrão de Apps); `/create` guardada por `plan_create`
            (achado do Tester front — GAP-FE-233 resolvido reabriu a
            CRIAÇÃO real, a rota precisa da permissão específica, não da
            genérica `plan_view`). `/create` ANTES de `/:uuid` para não ser
            capturado como uuid. Ícone Gem do NavRail continua abrindo
            `/planos` — zero código de navegação novo. */}
        <Route
          path="/planos"
          element={
            <RequirePermission permission="plan_view">{lazyRoute(PlanosList)}</RequirePermission>
          }
        />
        {/* `/planos/contratar` ANTES de `/planos/:uuid` (senão vira uuid). */}
        <Route path="/planos/contratar" element={lazyRoute(ContratacaoPlano)} />
        <Route
          path="/planos/create"
          element={
            <RequirePermission permission="plan_create">
              {lazyRoute(CreateOrUpdatePlanRole)}
            </RequirePermission>
          }
        />
        <Route
          path="/planos/:uuid"
          element={
            <RequirePermission permission="plan_view">
              {lazyRoute(CreateOrUpdatePlanRole)}
            </RequirePermission>
          }
        />
        <Route
          path="/planos/:uuid/detalhe"
          element={
            <RequirePermission permission="plan_view">
              {lazyRoute(DetalhePlanRole)}
            </RequirePermission>
          }
        />

        {/* Operacional — Apontamentos (Appropriation, TASK-FE-2713, execução
            033/Onda 3) — 5 rotas reais, declaradas ANTES do catch-all
            `/operacional/*` vencerem por especificidade (mirror Cochos/
            Bebedouros/Planos acima). Guarda ÚNICA `appropriations_view` nas
            5 (leitura mínima — create/edit/delete reais ficam a cargo do
            backend, 403; mirror a nota já usada no bloco de Cochos). `/novo`
            declarada ANTES de `/:appropriationId`; `/:appropriationId/detalhe`
            e `/:appropriationId/apropriar` são sufixos estáticos distintos
            depois de `:appropriationId` — ordem entre eles não importa, mas
            ambos vêm DEPOIS de `/:appropriationId` puro. Domínio de rota
            `Operacional` (não `BaseRegistrations`/`CadastrosBase` — a URL é
            `/operacional/...`, mirror `Administrativo/Funcoes`/
            `Financeiro/MercadoPago`), por isso `src/pages/Operacional/
            Appropriations/` em vez de `BaseRegistrations`. Item de menu
            (`ope-agr-apo`) e permissão (`appropriations_view`) já existiam em
            `navigationTree.ts`/`navigationPermissions.ts` — NENHUMA edição
            neles. */}
        <Route
          path="/operacional/apontamentos"
          element={
            <RequirePermission permission="appropriations_view">
              {lazyRoute(AppropriationsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/apontamentos/novo"
          element={
            <RequirePermission permission="appropriations_view">
              {lazyRoute(CreateOrUpdateAppropriation)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/apontamentos/:appropriationId"
          element={
            <RequirePermission permission="appropriations_view">
              {lazyRoute(CreateOrUpdateAppropriation)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/apontamentos/:appropriationId/detalhe"
          element={
            <RequirePermission permission="appropriations_view">
              {lazyRoute(AppropriationDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/apontamentos/:appropriationId/apropriar"
          element={
            <RequirePermission permission="appropriations_view">
              {lazyRoute(AppropriateAppropriation)}
            </RequirePermission>
          }
        />
        {/* TASK-FE-715 (execução 034) — Finalização é uma TRANSIÇÃO DE
            ESCRITA (O→F), não leitura — guarda `appropriations_edit` (mirror
            o guard interno `canSubmit`/`showFinish` já usado no Form e na
            Listagem para decidir QUANDO oferecer o botão, aqui promovido a
            guarda de ROTA), diferente das demais 4 rotas acima
            (`appropriations_view`, leitura mínima). */}
        <Route
          path="/operacional/apontamentos/:appropriationId/finalizar"
          element={
            <RequirePermission permission="appropriations_edit">
              {lazyRoute(FinishAppropriation)}
            </RequirePermission>
          }
        />

        {/* Operacional — Pastagem (Pasture, TASK-PAST-FE-08, execução 041) —
            declaradas ANTES do catch-all `/operacional/*` vencer por
            especificidade (mirror Apontamentos acima). Guarda ÚNICA
            `pastures_view` nas 4 rotas de leitura/navegação (mirror
            Apontamentos — create/edit/delete reais ficam a cargo do
            backend, 403). `/criar` declarada ANTES de `/:uuid`;
            `/:uuid/visualizar` e `/:uuid/apropriacao` são sufixos estáticos
            distintos depois de `:uuid` — ambos vêm DEPOIS de `/:uuid`
            puro. */}
        <Route
          path="/operacional/pastagem"
          element={
            <RequirePermission permission="pastures_view">
              {lazyRoute(PastagemList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pastagem/criar"
          element={
            <RequirePermission permission="pastures_view">
              {lazyRoute(CreateOrUpdatePastagem)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pastagem/:uuid"
          element={
            <RequirePermission permission="pastures_view">
              {lazyRoute(CreateOrUpdatePastagem)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pastagem/:uuid/visualizar"
          element={
            <RequirePermission permission="pastures_view">
              {lazyRoute(ShowPastagem)}
            </RequirePermission>
          }
        />
        {/* Apropriação é uma TRANSIÇÃO DE ESCRITA (F→A) — guarda
            `pastures_edit` (mirror `/apontamentos/:id/finalizar`),
            diferente das 4 rotas acima (`pastures_view`, leitura mínima). */}
        <Route
          path="/operacional/pastagem/:uuid/apropriacao"
          element={
            <RequirePermission permission="pastures_edit">
              {lazyRoute(AppropriatePastagem)}
            </RequirePermission>
          }
        />

        {/* Operacional — Romaneios (Transfer, TASK-TRF-FE-01/02, esteira
            97-Esteiras/001) — declaradas ANTES do catch-all `/operacional/*`
            vencer por especificidade (mirror Apontamentos acima). Guarda
            `transfers_view` nas 3 (leitura mínima — create/edit/delete reais
            ficam a cargo do backend, 403 — mesmo padrão de Apontamentos).
            Item de menu (`ope-agr-rom`) e permissão (`transfers_view`) já
            existiam em `navigationTree.ts`/`navigationPermissions.ts` —
            NENHUMA edição neles. `/novo` declarada ANTES de
            `/:transferUuid` (contrato de tela §3); `/:transferUuid/detalhe`
            fica reservada por comentário para TASK-TRF-FE-05, DEPOIS de
            `/:transferUuid` puro. */}
        <Route
          path="/operacional/romaneios"
          element={
            <RequirePermission permission="transfers_view">
              {lazyRoute(RomaneiosList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/romaneios/novo"
          element={
            <RequirePermission permission="transfers_view">
              {lazyRoute(CreateOrUpdateRomaneio)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/romaneios/:transferUuid"
          element={
            <RequirePermission permission="transfers_view">
              {lazyRoute(CreateOrUpdateRomaneio)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/romaneios/:transferUuid/detalhe"
          element={
            <RequirePermission permission="transfers_view">
              {lazyRoute(RomaneioDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/romaneios/:transferUuid/finalizar"
          element={
            <RequirePermission permission="transfers_edit">
              {lazyRoute(FinishRomaneio)}
            </RequirePermission>
          }
        />

        {/* Operacional — Carregamento (Charge, TASK-FE-CG-02, esteira
            97-Esteiras/045) — declarada ANTES do catch-all `/operacional/*`
            vencer por especificidade (mirror Romaneios acima). Guarda
            `charge_view` (leitura mínima — a ROTA usa a permissão mínima
            real de leitura, mirror `transfers_view` em Romaneios; create/
            edit/delete reais ficam a cargo do backend, 403). Item de menu
            (`ope-agr-car`) e permissão (gate `anyOf` cobrindo `charge_*` em
            `navigationPermissions.ts`) JÁ EXISTIAM — NENHUMA edição neles,
            apenas esta reconciliação de rota. `/novo` e `/:chargeUuid`
            nascem em `TASK-FE-CG-03` (mesma tela cobre criar/editar/
            visualizar — sem sub-rota `/detalhe`, nota técnica 5 do plano de
            arquitetura frontend: Charge não tem surface de "Visualizar"
            separada, diferente de Romaneios). */}
        <Route
          path="/operacional/carregamento"
          element={
            <RequirePermission permission="charge_view">
              {lazyRoute(CarregamentoList)}
            </RequirePermission>
          }
        />
        {/* `/novo` declarada ANTES de `/:chargeUuid` (contrato de especificidade,
            mirror Romaneios) — TASK-FE-CG-03: mesma tela cobre criar/editar/
            visualizar (nota técnica 5 do plano, sem sub-rota `/detalhe`). */}
        <Route
          path="/operacional/carregamento/novo"
          element={
            <RequirePermission permission="charge_view">
              {lazyRoute(CreateOrUpdateCharge)}
            </RequirePermission>
          }
        />
        {/* `/:chargeUuid/finalizar` declarada ANTES de `/:chargeUuid` puro
            (sufixo estático mais específico, mirror do contrato de
            especificidade acima) — TASK-FE-CG-05, AM-05. Gate `charge_edit`
            (decisão a do dono, já fechada na camada `api`), NÃO `charge_view`
            (finalizar é sempre uma escrita). */}
        <Route
          path="/operacional/carregamento/:chargeUuid/finalizar"
          element={
            <RequirePermission permission="charge_edit">
              {lazyRoute(FinishCharge)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/carregamento/:chargeUuid"
          element={
            <RequirePermission permission="charge_view">
              {lazyRoute(CreateOrUpdateCharge)}
            </RequirePermission>
          }
        />

        {/* Operacional — Agricultura — Carregamento — Contas a Receber
            (ChargeBillIncome, F-026, TASK-CBI-FE-01/02/03/04, esteira
            97-Esteiras/059) — declarada ANTES do catch-all `/operacional/*`
            vencer por especificidade (mirror Carregamento/Fechamento Semana
            acima). Lista/detalhe usam `charge_income_view` (leitura mínima);
            `/novo` usa `charge_income_create`; `/:chargeBillIncomeUuid`
            (edit, TASK-CBI-FE-03) usa `charge_income_edit`.
            `:chargeBillIncomeUuid/detalhe` declarada ANTES da forma bare de
            edição (mirror `Orçamentos`, especificidade de segmento resolvida
            pelo React Router, sem ambiguidade). */}
        <Route
          path="/operacional/carregamento/contas-a-receber"
          element={
            <RequirePermission permission="charge_income_view">
              {lazyRoute(ChargeBillIncomesList)}
            </RequirePermission>
          }
        />
        {/* `/novo` (TASK-CBI-FE-03) — declarada ANTES de `/:chargeBillIncomeUuid`
            (contrato de especificidade, mirror Carregamento/Romaneios) para
            "novo" não ser interpretado como o parâmetro de uuid. Gate
            `charge_income_create` (mirror `charge_edit` de FinishCharge —
            ação de escrita distinta da leitura mínima da lista). */}
        <Route
          path="/operacional/carregamento/contas-a-receber/novo"
          element={
            <RequirePermission permission="charge_income_create">
              {lazyRoute(CreateOrUpdateChargeBillIncome)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/carregamento/contas-a-receber/:chargeBillIncomeUuid/detalhe"
          element={
            <RequirePermission permission="charge_income_view">
              {lazyRoute(ChargeBillIncomeDetalhe)}
            </RequirePermission>
          }
        />
        {/* `/:chargeBillIncomeUuid` (edit, TASK-CBI-FE-03) — declarada DEPOIS
            de `/:chargeBillIncomeUuid/detalhe` (sufixo estático mais
            específico primeiro, mesmo contrato de especificidade do bloco
            Carregamento/`:chargeUuid/finalizar` acima). Gate
            `charge_income_edit`. */}
        <Route
          path="/operacional/carregamento/contas-a-receber/:chargeBillIncomeUuid"
          element={
            <RequirePermission permission="charge_income_edit">
              {lazyRoute(CreateOrUpdateChargeBillIncome)}
            </RequirePermission>
          }
        />

        {/* Operacional — Agricultura — Carregamento — Contas a Pagar
            (ChargeBillExpense, TASK-CBE-04/05/06/07, esteira
            97-Esteiras/062) — declarada ANTES do catch-all `/operacional/*`
            vencer por especificidade (mirror bloco Contas a Receber acima).
            Lista/detalhe usam `charge_expense_view` (leitura mínima);
            `/novo` usa `charge_expense_create`; `/:chargeBillExpenseUuid`
            (edit) usa `charge_expense_edit`. `:chargeBillExpenseUuid/detalhe`
            declarada ANTES da forma bare de edição (mesmo contrato de
            especificidade do gêmeo). */}
        <Route
          path="/operacional/carregamento/contas-a-pagar"
          element={
            <RequirePermission permission="charge_expense_view">
              {lazyRoute(ChargeBillExpensesList)}
            </RequirePermission>
          }
        />
        {/* `/novo` — declarada ANTES de `/:chargeBillExpenseUuid` (contrato de
            especificidade, mirror gêmeo) para "novo" não ser interpretado
            como o parâmetro de uuid. Gate `charge_expense_create`. */}
        <Route
          path="/operacional/carregamento/contas-a-pagar/novo"
          element={
            <RequirePermission permission="charge_expense_create">
              {lazyRoute(CreateOrUpdateChargeBillExpense)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/carregamento/contas-a-pagar/:chargeBillExpenseUuid/detalhe"
          element={
            <RequirePermission permission="charge_expense_view">
              {lazyRoute(ChargeBillExpenseDetalhe)}
            </RequirePermission>
          }
        />
        {/* `/:chargeBillExpenseUuid` (edit) — declarada DEPOIS de
            `/:chargeBillExpenseUuid/detalhe` (sufixo estático mais específico
            primeiro, mesmo contrato de especificidade do gêmeo). Gate
            `charge_expense_edit`. */}
        <Route
          path="/operacional/carregamento/contas-a-pagar/:chargeBillExpenseUuid"
          element={
            <RequirePermission permission="charge_expense_edit">
              {lazyRoute(CreateOrUpdateChargeBillExpense)}
            </RequirePermission>
          }
        />

        {/* Operacional — Fechamento Semana (ClosingWeek, TASK-FE-FS-02/03/04,
            esteira 97-Esteiras/053) — declarada ANTES do catch-all
            `/operacional/*` vencer por especificidade (mirror Carregamento
            acima). Guarda `closing_weeks_view` (leitura mínima). Permissões
            `closing_weeks_view/create/delete` JÁ EXISTIAM em
            `PermissionTree` (backend) — nenhuma permissão nova cunhada. */}
        <Route
          path="/operacional/fechamento-semana"
          element={
            <RequirePermission permission="closing_weeks_view">
              {lazyRoute(FechamentoSemanaList)}
            </RequirePermission>
          }
        />
        {/* `/novo` (Novo Fechamento, TASK-FE-FS-04) — declarada ANTES de
            `/:uuid` abaixo (contrato de especificidade, mirror
            Romaneios/Carregamento acima), guarda `closing_weeks_create`. */}
        <Route
          path="/operacional/fechamento-semana/novo"
          element={
            <RequirePermission permission="closing_weeks_create">
              {lazyRoute(CreateClosingWeek)}
            </RequirePermission>
          }
        />
        {/* `/:uuid` (Detalhe read-only, TASK-FE-FS-03) — declarada DEPOIS de
            `/novo` acima (contrato de especificidade). */}
        <Route
          path="/operacional/fechamento-semana/:uuid"
          element={
            <RequirePermission permission="closing_weeks_view">
              {lazyRoute(ShowClosingWeek)}
            </RequirePermission>
          }
        />

        {/* Operacional — Vendas — Orçamentos (Budget, F-018, TASK-BG-FE-02,
            esteira 97-Esteiras/054) — declarada ANTES do catch-all
            `/operacional/*` vencer por especificidade (mirror Fechamento
            Semana acima). Guarda `budgets_view` (leitura mínima — as ações
            de linha decidem `canEdit`/`canDelete` por permissão própria).
            Item de menu/permissão de navegação JÁ EXISTIAM — nenhuma edição
            em `navigationTree.ts`/`navigationPermissions.ts`. */}
        <Route
          path="/operacional/orcamentos"
          element={
            <RequirePermission permission="budgets_view">
              {lazyRoute(BudgetsList)}
            </RequirePermission>
          }
        />
        {/* TASK-BG-FE-03 — form de criar/editar, MESMO componente (mirror
            `Invoices`). `/novo` DEVE vir ANTES de `/:uuid` na ordem de
            declaração para não ser capturado como GUID (mesma disciplina de
            todos os blocos `/novo`+`/:id` acima, ex. Requisição/Devolução). */}
        <Route
          path="/operacional/orcamentos/novo"
          element={
            <RequirePermission permission="budgets_create">
              {lazyRoute(CreateOrUpdateBudget)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/orcamentos/:uuid"
          element={
            <RequirePermission permission="budgets_edit">
              {lazyRoute(CreateOrUpdateBudget)}
            </RequirePermission>
          }
        />
        {/* TASK-BG-FE-05 — visualização somente-leitura, guarda `budgets_view`
            (mirror `InvoiceDetalhe`/`/administrativo/doc-fiscal/:invoiceId/
            visualizar`). Declarada DEPOIS de `/:uuid` (mesma ordem já usada
            no bloco de Invoice acima) — `:uuid/visualizar` vence por
            especificidade de segmento, sem ambiguidade com `/:uuid`. */}
        <Route
          path="/operacional/orcamentos/:uuid/visualizar"
          element={
            <RequirePermission permission="budgets_view">
              {lazyRoute(BudgetDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional — Vendas — Pedidos (Order, F-051, PED-FE-02,
            97-Esteiras/043) — declarada ANTES do catch-all `/operacional/*`
            vencer por especificidade (mirror Orçamentos acima). Guarda
            `orders_view` (leitura mínima — as ações de linha decidem
            `canEdit`/`canDelete`/`sales_create` por permissão própria, ver
            `OrderActionsMenu.tsx`). Item de menu/permissão de navegação JÁ
            EXISTIAM — nenhuma edição em `navigationTree.ts`/
            `navigationPermissions.ts`. */}
        <Route
          path="/operacional/pedidos"
          element={
            <RequirePermission permission="orders_view">{lazyRoute(OrdersList)}</RequirePermission>
          }
        />
        {/* PED-FE-03 — form de criar/editar, MESMO componente (mirror
            `Orçamentos` acima). `/novo` DEVE vir ANTES de `/:uuid` na ordem
            de declaração para não ser capturado como GUID (mesma disciplina
            de todos os blocos `/novo`+`/:id`). */}
        <Route
          path="/operacional/pedidos/novo"
          element={
            <RequirePermission permission="orders_create">
              {lazyRoute(CreateOrUpdateOrder)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pedidos/:uuid"
          element={
            <RequirePermission permission="orders_edit">
              {lazyRoute(CreateOrUpdateOrder)}
            </RequirePermission>
          }
        />
        {/* PED-FE-06 — visualização somente-leitura, guarda `orders_view`
            (mirror `/operacional/orcamentos/:uuid/visualizar` acima).
            Declarada DEPOIS de `/:uuid` — `:uuid/detalhe` vence por
            especificidade de segmento, sem ambiguidade com `/:uuid`. */}
        <Route
          path="/operacional/pedidos/:uuid/detalhe"
          element={
            <RequirePermission permission="orders_view">
              {lazyRoute(OrderDetalhe)}
            </RequirePermission>
          }
        />
        {/* SALE-FE-COM-10 (97-Esteiras/063) — "Gerar Venda" a partir do
            Pedido, backend já em produção desde a execução 043. Declarada
            DEPOIS de `/:uuid/detalhe` — vence por especificidade de
            segmento, mesma disciplina do bloco Pedidos. Guarda
            `sales_create` (não `orders_edit`/`orders_view` — a ação cria uma
            `Sale`, RBAC própria, mirror `OrderActionsMenu.tsx`). */}
        <Route
          path="/operacional/pedidos/:uuid/gerar-venda"
          element={
            <RequirePermission permission="sales_create">
              {lazyRoute(GerarVendaFromOrder)}
            </RequirePermission>
          }
        />

        {/* Operacional — Vendas — Vendas Comercial (Sale, 97-Esteiras/043) —
            declarada ANTES do catch-all `/operacional/*` vencer por
            especificidade (mirror Pedidos acima). Guarda `sales_view`
            (leitura mínima — ações de linha decidem `can_edit`/`can_delete`
            pelos flags do `SaleListResource` + RBAC própria, ver
            `SaleActionsMenu.tsx`). Item de menu/permissão de navegação JÁ
            EXISTIAM — nenhuma edição em `navigationTree.ts`/
            `navigationPermissions.ts` (contrato-tela §4/§10). NÃO é Venda de
            Animais (`MovementSale`) — nada aqui toca `movement-sales/*`. */}
        <Route
          path="/operacional/vendas"
          element={
            <RequirePermission permission="sales_view">{lazyRoute(SalesList)}</RequirePermission>
          }
        />
        {/* SALE-FE-COM-03 — form de criar/editar, MESMO componente (mirror
            `CreateOrUpdateOrder`). `/novo` DEVE vir ANTES de `/:uuid/editar`
            na ordem de declaração para não ser capturado como GUID (mesma
            disciplina de todos os blocos `/novo`+`/:id` do fork). */}
        <Route
          path="/operacional/vendas/novo"
          element={
            <RequirePermission permission="sales_create">
              {lazyRoute(CreateOrUpdateSale)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/vendas/:uuid/editar"
          element={
            <RequirePermission permission="sales_edit">
              {lazyRoute(CreateOrUpdateSale)}
            </RequirePermission>
          }
        />
        {/* SALE-FE-COM-05 — visualização somente-leitura, declarada DEPOIS
            de `/:uuid/editar` (vence por especificidade de segmento, mesma
            disciplina do bloco Pedidos). Destino da ação Visualizar (`A004`,
            `SaleActionsMenu.tsx`). */}
        <Route
          path="/operacional/vendas/:uuid/detalhe"
          element={
            <RequirePermission permission="sales_view">{lazyRoute(SaleDetalhe)}</RequirePermission>
          }
        />
        {/* SALE-FE-COM-07/08 — Adiantamento da Venda (`A005`, `S-SCREEN-006`).
            Guarda `incomes_create` (contrato-api §8 DEC-02 — o legado NÃO
            declarava permissão própria, `D011`; a API adota o efeito real de
            criar um título financeiro a receber). Declarada DEPOIS de
            `/:uuid/detalhe` — sufixo estático próprio, sem ambiguidade. */}
        <Route
          path="/operacional/vendas/:uuid/adiantamento"
          element={
            <RequirePermission permission="incomes_create">
              {lazyRoute(SaleAdvanceIncome)}
            </RequirePermission>
          }
        />

        {/* Operacional — Lista de OS (ServiceOrder, TASK-FE-2001/2002/2003
            fatia READ + TASK-FE-2004/2005 fatia WRITE, esteira 038) —
            declaradas ANTES do catch-all `/operacional/*` vencer por
            especificidade (mirror Apontamentos/Romaneios acima). Guarda
            ÚNICA `service-orders_view` nas 4 (leitura mínima — o
            `CreateOrUpdateServiceOrder` decide `canSave` por
            `service-orders_create`/`_edit` internamente; delete real fica a
            cargo do backend, 403; mesmo padrão de Apontamentos/Romaneios).
            `/novo` declarada ANTES de `/:serviceOrderId`; `/:serviceOrderId/
            detalhe` é sufixo estático depois de `:serviceOrderId` puro.
            `/novo` e `/:serviceOrderId` apontam para
            `CreateOrUpdateServiceOrder` (D-FRONT-01/03/04 RESOLVIDAS —
            substitui o placeholder `ServiceOrderFormPending`, removido
            nesta Tarefa). Item de menu (`ope-os-lis`) e permissão
            (`service-orders_view`) já existiam em `navigationTree.ts`/
            `navigationPermissions.ts` — NENHUMA edição neles. */}
        <Route
          path="/operacional/lista-os"
          element={
            <RequirePermission permission="service-orders_view">
              {lazyRoute(ServiceOrdersList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lista-os/novo"
          element={
            <RequirePermission permission="service-orders_view">
              {lazyRoute(CreateOrUpdateServiceOrder)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lista-os/:serviceOrderId"
          element={
            <RequirePermission permission="service-orders_view">
              {lazyRoute(CreateOrUpdateServiceOrder)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lista-os/:serviceOrderId/detalhe"
          element={
            <RequirePermission permission="service-orders_view">
              {lazyRoute(ServiceOrderDetalhe)}
            </RequirePermission>
          }
        />

        {/* Operacional — Monitoramento (MonitoringServiceOrder, F-046,
            TASK-MO-FE-05) — tela ÚNICA de listagem/filtro, SEM CRUD
            (mode_matrix do contrato legado: criar/editar/excluir
            NAO_APLICAVEL). Declarada ANTES do catch-all `/operacional/*`
            vencer por especificidade (mirror Lista de OS acima). Item de
            menu (`ope-os-mon`) e permissão de navegação
            (`monitoring-service-orders_view`) JÁ EXISTIAM em
            `navigationTree.ts`/`navigationPermissions.ts` — NENHUMA edição
            neles. */}
        <Route
          path="/operacional/monitoramento"
          element={
            <RequirePermission permission="monitoring-service-orders_view">
              {lazyRoute(MonitoringList)}
            </RequirePermission>
          }
        />

        {/* Operacional / Agricultura — Rastreabilidade (Traceability +
            TraceabilityConfig, F-067, TASK-TR-FE-11, esteira 97-Esteiras/058)
            — declaradas ANTES do catch-all `/operacional/*` vencer por
            especificidade (mirror Carregamento/Fechamento Semana acima).
            `/produtos/create` declarada ANTES de `/produtos/:uuid` (contrato
            de especificidade, mesma disciplina de todos os blocos `/novo`+
            `/:id` acima); `/produtos/:uuid/galeria` (sufixo estático) segue
            depois, capturada corretamente pelo roteador por ser mais
            específica que `/produtos/:uuid` mesmo vindo depois (react-router
            v6 ranking por segmento). Item de menu (`ope-agr-ras`) e gates
            JÁ RECONCILIADOS em `navigationTree.ts`/`navigationPermissions.ts`
            (ver comentários no bloco de import acima). */}
        <Route
          path="/operacional/rastreabilidade/produtos"
          element={
            <RequirePermission permission="traceab_view">
              {lazyRoute(TraceabilityList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/rastreabilidade/produtos/create"
          element={
            <RequirePermission permission="traceab_create">
              {lazyRoute(CreateOrUpdateTraceability)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/rastreabilidade/produtos/:uuid/galeria"
          element={
            <RequirePermission permission="traceab_view">
              {lazyRoute(TraceabilityGalery)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/rastreabilidade/produtos/:uuid"
          element={
            <RequirePermission permission="traceab_edit">
              {lazyRoute(CreateOrUpdateTraceability)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/rastreabilidade/configuracao"
          element={
            <RequirePermission permission="tracconfig_view">
              {lazyRoute(TraceabilityConfigList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/rastreabilidade/configuracao/create"
          element={
            <RequirePermission permission="tracconfig_view">
              {lazyRoute(CreateOrUpdateTraceabilityConfig)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/rastreabilidade/configuracao/:uuid"
          element={
            <RequirePermission permission="tracconfig_view">
              {lazyRoute(CreateOrUpdateTraceabilityConfig)}
            </RequirePermission>
          }
        />

        {/* Operacional — Avaliações (RatingServiceOrder, TASK-FE-041-AVL-01/
            02/03, esteira 041) — declaradas ANTES do catch-all
            `/operacional/*`, mesmo precedente de Lista de OS acima.
            Listagem guardada por `rating-service-orders_view`; form de
            avaliação por `rating-service-orders_edit` (mirror
            `RatingServiceOrderController::middleware()` no backend). Item
            de menu (`ope-os-ava`) e permissão já existiam em
            `navigationTree.ts`/`navigationPermissions.ts` — nenhuma edição
            neles. Sem `/novo` — `mode_matrix.criar = NAO_APLICAVEL`, a
            rota só é alcançável com `:uuid`. */}
        <Route
          path="/operacional/avaliacoes"
          element={
            <RequirePermission permission="rating-service-orders_view">
              {lazyRoute(RatingServiceOrdersList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/avaliacoes/:uuid"
          element={
            <RequirePermission permission="rating-service-orders_view">
              {lazyRoute(RatingServiceOrderForm)}
            </RequirePermission>
          }
        />

        {/* Operacional — Minhas OS (MyServiceOrder, esteira 063,
            TASK-MOS-FE-04/05/08) — declaradas ANTES do catch-all
            `/operacional/*`, mesmo precedente de Avaliações acima. Listagem
            guardada por `my-service-orders_view`; form de execução por
            `my-service-orders_edit` (mirror
            `MyServiceOrderController::middleware()`/RT-02/RT-03 do contrato
            de tela). Item de menu (`ope-os-min`) e as 4 permissões já
            existiam em `navigationTree.ts`/`navigationPermissions.ts`/
            `permissionsCatalog.json` — nenhuma edição neles. Sem `/novo` —
            `mode_matrix.criar = NAO_APLICAVEL`, a rota só é alcançável com
            `:uuid`. */}
        <Route
          path="/operacional/minhas-os"
          element={
            <RequirePermission permission="my-service-orders_view">
              {lazyRoute(MyServiceOrdersList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/minhas-os/:uuid"
          element={
            <RequirePermission permission="my-service-orders_view">
              {lazyRoute(MyServiceOrderExecutionForm)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Transferência ABC de Animais entre
            Lotes (TransferAbcBatch, 97-Esteiras/039, TASK-FE-039-ABC-02/03).
            Item de menu (`ope-pec-tra`, "Transferências") e permissão de
            navegação JÁ EXISTIAM (`navigationTree.ts:1312`/
            `navigationPermissions.ts:288`) — só liga as rotas reais. `/novo`
            declarada ANTES de `/:uuid` (armadilha "novo" vs UUID, mesmo
            precedente de Venda de Animais/Equipes). Sem rota de edição (D3,
            parity). */}
        <Route
          path="/operacional/transferencias"
          element={
            <RequirePermission permission="transfer_abc_batch_view">
              {lazyRoute(TransferAbcBatchList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/transferencias/novo"
          element={
            <RequirePermission permission="transfer_abc_batch_create">
              {lazyRoute(CreateTransferAbcBatch)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/transferencias/:uuid"
          element={
            <RequirePermission permission="transfer_abc_batch_view">
              {lazyRoute(TransferAbcBatchDetalhe)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Transferência de Lote entre Fazendas
            (TransferBatchFarm, 97-Esteiras/041, TASK-FE-041-LF-01..04). Item
            de menu NOVO (`ope-pec-tra-lf`, filho de "Transferências") e
            permissões NOVAS (`transfer_batch_farms_{view,create,delete}`) —
            ver `navigationTree.ts`/`navigationPermissions.ts`. `/novo`
            declarada ANTES de `/:uuid/financeiro` (mesma armadilha "novo" vs
            UUID já documentada acima para `TransferAbcBatch`). ⚠️ NÃO
            confundir com `/operacional/transferencias` (TransferAbcBatch,
            acima) nem com `/operacional/transferencia-animais-lote`
            (BatchTransfers) — 3 domínios distintos no mesmo grupo de menu. */}
        <Route
          path="/operacional/lote-fazenda/transferencias"
          element={
            <RequirePermission permission="transfer_batch_farms_view">
              {lazyRoute(TransferBatchFarmList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lote-fazenda/transferencias/novo"
          element={
            <RequirePermission permission="transfer_batch_farms_create">
              {lazyRoute(CreateOrUpdateTransferBatchFarm)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lote-fazenda/transferencias/:uuid/financeiro"
          element={
            <RequirePermission permission="transfer_batch_farms_create">
              {lazyRoute(TransferBatchFarmFinancial)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Lote/Módulo/Área
            (BatchModuleAreaTransfer, 97-Esteiras/070, TASK-LMA-FE-01..04).
            Item de menu (`ope-pec-tra-lma`, filho de "Transferências") e
            permissões (`batch_module_area_transfers_{view,create}`) — ver
            `navigationTree.ts`/`navigationPermissions.ts`. ⚠️ NÃO confundir
            com `/operacional/lote-fazenda/transferencias` (TransferBatchFarm,
            acima, transfere lote ENTRE FAZENDAS) nem com
            `/cadastros-base/lote-modulo` (feature-irmã já migrada, cadastro
            base). `/:batchUuid` (formulário de transferência, TASK-LMA-FE-03/
            04) declarada DEPOIS da rota fixa da listagem, mesma convenção do
            resto do arquivo. */}
        <Route
          path="/operacional/lote-modulo-area/transferencias"
          element={
            <RequirePermission permission="batch_module_area_transfers_view">
              {lazyRoute(BatchModuleAreaTransfersList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/lote-modulo-area/transferencias/:batchUuid"
          element={
            <RequirePermission permission="batch_module_area_transfers_create">
              {lazyRoute(TransferBatchModuleArea)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Transferência de Animal entre
            Fazendas (TransferAnimalFarm, 97-Esteiras/042,
            TASK-FE-042-102). Item de menu NOVO (`ope-pec-tra-af`, filho de
            "Transferências") e permissões NOVAS
            (`transfer_animal_farms_{view,create,delete}`) — ver
            `navigationTree.ts`/`navigationPermissions.ts`. `/novo` declarada
            ANTES de `/:uuid` e `/:uuid/financeiro` (mesma armadilha "novo"
            vs UUID já documentada acima para `TransferBatchFarm`). ⚠️ NÃO
            confundir com `/operacional/lote-fazenda/transferencias` (acima,
            transfere LOTES) — domínios distintos no mesmo grupo de menu.
            `:uuid` (Visualizar) é NOVA nesta feature — a irmã Lote/Fazenda
            não tem rota de show. */}
        <Route
          path="/operacional/animal-fazenda/transferencias"
          element={
            <RequirePermission permission="transfer_animal_farms_view">
              {lazyRoute(TransferAnimalFarmList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/animal-fazenda/transferencias/novo"
          element={
            <RequirePermission permission="transfer_animal_farms_create">
              {lazyRoute(CreateOrUpdateTransferAnimalFarm)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/animal-fazenda/transferencias/:uuid/financeiro"
          element={
            <RequirePermission permission="transfer_animal_farms_create">
              {lazyRoute(TransferAnimalFarmFinancial)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/animal-fazenda/transferencias/:uuid"
          element={
            <RequirePermission permission="transfer_animal_farms_view">
              {lazyRoute(ShowTransferAnimalFarm)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Venda de Animais (MovementSale,
            TASK-VD-FE-01/02, frontend-contract-vendas.md §2.3). Item de menu
            NOVO (`ope-pec-ven`) e permissão NOVA (`mov_sale_view`) —
            ver `navigationTree.ts`/`navigationPermissions.ts`, TASK-VD-FE-01.
            `/novo`/`/:saleUuid/editar` (TASK-VD-FE-02, mesmo componente,
            gate de rota `mov_sale_view`, botão Salvar gateado por
            `mov_sale_create`/`mov_sale_edit` dentro da tela) —
            `/novo` declarada ANTES de `/:saleUuid` (armadilha "novo" vs
            UUID, mesmo precedente de Equipes/Faltas). `/:saleUuid/finalizar`
            e `/finalizar-lote` ficam para a Tarefa 16. */}
        <Route
          path="/operacional/venda-animais"
          element={
            <RequirePermission permission="mov_sale_view">
              {lazyRoute(VendaAnimaisList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/venda-animais/novo"
          element={
            <RequirePermission permission="mov_sale_view">
              {lazyRoute(CreateOrUpdateMovementSale)}
            </RequirePermission>
          }
        />
        {/* TASK-VD-FE-03 (contrato §2.3) — segmento ESTÁTICO, declarado ANTES
            de `/:saleUuid` (mesma armadilha "novo" vs UUID). UUIDs
            selecionados via query param `?ids=` (§8.2, substitui
            `session('data-return')` do legado). */}
        <Route
          path="/operacional/venda-animais/finalizar-lote"
          element={
            <RequirePermission permission="mov_sale_edit">
              {lazyRoute(FinishMovementSaleMany)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/venda-animais/:saleUuid"
          element={
            <RequirePermission permission="mov_sale_view">
              {lazyRoute(MovementSaleDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/venda-animais/:saleUuid/editar"
          element={
            <RequirePermission permission="mov_sale_view">
              {lazyRoute(CreateOrUpdateMovementSale)}
            </RequirePermission>
          }
        />
        {/* TASK-VD-FE-03 (contrato §2.3/§8.1) — Ação A7 "Finalizar", mirror
            `FinishAppropriation` — gate `mov_sale_edit` DIRETO (é uma
            TRANSIÇÃO DE ESCRITA, nunca `_view`). */}
        <Route
          path="/operacional/venda-animais/:saleUuid/finalizar"
          element={
            <RequirePermission permission="mov_sale_edit">
              {lazyRoute(FinishMovementSale)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Compra de Animais (MovementPurchase,
            TASK-CP-04/05/06/07/08/09, contrato-frontend-compras-movimento.md
            §6). Item de menu NOVO (`ope-pec-com`) e permissão REUSADA
            (`mov_purchase_view`, DEC-006) — ver `navigationTree.ts`/
            `navigationPermissions.ts`, TASK-CP-04. `/novo`/`/:uuid/editar`
            (TASK-CP-06/07, mesmo componente, gate de rota `mov_purchase_view`,
            botão Salvar gateado por `mov_purchase_create`/`mov_purchase_edit`
            dentro da tela) — `/novo` declarada ANTES de `/:uuid`, que por sua
            vez vem ANTES de `/:uuid/editar` (mesma armadilha "novo" vs UUID
            de Vendas/Nascimentos/Equipes/Faltas). `/:uuid` (Detalhe,
            TASK-CP-09) acrescentada nesta Tarefa. */}
        <Route
          path="/operacional/compra-animais"
          element={
            <RequirePermission permission="mov_purchase_view">
              {lazyRoute(CompraAnimaisList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/compra-animais/novo"
          element={
            <RequirePermission permission="mov_purchase_view">
              {lazyRoute(CreateOrUpdateMovementPurchase)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/compra-animais/:uuid"
          element={
            <RequirePermission permission="mov_purchase_view">
              {lazyRoute(MovementPurchaseDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/compra-animais/:uuid/editar"
          element={
            <RequirePermission permission="mov_purchase_view">
              {lazyRoute(CreateOrUpdateMovementPurchase)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Nascimentos (BirthAnimal,
            TASK-NASC-FE-01, frontend-contract-nascimentos.md §2.3). Item de
            menu NOVO (`ope-pec-nas`) e permissão NOVA (`birth_animals_view`) —
            ver `navigationTree.ts`/`navigationPermissions.ts`, mesma Tarefa
            (GAP-NASCIMENTOS-FE-02). Só listagem + Detalhe nesta Tarefa
            (fundação); `/novo` e `/:birthAnimalUuid/editar` ficam para a
            Tarefa 19. */}
        <Route
          path="/operacional/nascimentos"
          element={
            <RequirePermission permission="birth_animals_view">
              {lazyRoute(BirthAnimalsList)}
            </RequirePermission>
          }
        />
        {/* `/novo` declarada ANTES de `/:birthAnimalUuid` (mesma armadilha
            "novo" vs UUID de `Rebanho`/`Equipes`/Faltas/Vendas). Gate de
            rota é `birth_animals_view` — o botão Salvar é gateado por
            `birth_animals_create` DENTRO do componente (contrato §2.3). */}
        <Route
          path="/operacional/nascimentos/novo"
          element={
            <RequirePermission permission="birth_animals_view">
              {lazyRoute(CreateOrUpdateBirthAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/nascimentos/:birthAnimalUuid"
          element={
            <RequirePermission permission="birth_animals_view">
              {lazyRoute(BirthAnimalDetalhe)}
            </RequirePermission>
          }
        />
        {/* Mesmo componente do `/novo`, em modo edição — gate de rota
            `birth_animals_view`, botão Salvar gateado por `birth_animals_edit`
            DENTRO do componente; esconde/redireciona para o Detalhe se
            `has_weaning` (contrato §2.3/§7.5). */}
        <Route
          path="/operacional/nascimentos/:birthAnimalUuid/editar"
          element={
            <RequirePermission permission="birth_animals_view">
              {lazyRoute(CreateOrUpdateBirthAnimal)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Perdas (LossAnimal, F-043, execução
            040, LossAnimal-contrato-arquitetural.md §7.5.4). Item de menu
            NOVO (`ope-pec-per`) e permissão NOVA (`loss_animals_view`) — ver
            `navigationTree.ts`/`navigationPermissions.ts`. As 3 rotas usam o
            MESMO gate `loss_animals_view` — granularidade create/edit é
            checada DENTRO da página (achado confirmado, contrato §7.5.4).
            `/nova` declarada ANTES de `/:lossAnimalUuid` (mesma armadilha
            "novo" vs UUID de `Nascimentos`/Equipes/Faltas/Vendas). */}
        <Route
          path="/operacional/perdas"
          element={
            <RequirePermission permission="loss_animals_view">
              {lazyRoute(LossAnimalList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/perdas/nova"
          element={
            <RequirePermission permission="loss_animals_view">
              {lazyRoute(CreateOrUpdateLossAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/perdas/:lossAnimalUuid/editar"
          element={
            <RequirePermission permission="loss_animals_view">
              {lazyRoute(CreateOrUpdateLossAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/perdas/:lossAnimalUuid"
          element={
            <RequirePermission permission="loss_animals_view">
              {lazyRoute(LossAnimalDetalhe)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Mortes (DeathAnimal, TASK-DA-FE-01/02,
            esteira 97-Esteiras/049). Item de menu NOVO (`ope-pec-mor`) e
            permissão NOVA (`death_animals_view`) — ver
            `navigationTree.ts`/`navigationPermissions.ts`, mesma Tarefa.
            `/novo` declarada ANTES de `/:deathAnimalUuid` (mesma armadilha
            "novo" vs UUID de `CentroCusto`/`FeedlotYard`/Nascimentos). Gate
            de rota é `death_animals_view` — ações de criar/editar/excluir
            são gateadas por `death_animals_create/edit/delete` DENTRO do
            componente. */}
        <Route
          path="/operacional/mortes"
          element={
            <RequirePermission permission="death_animals_view">
              {lazyRoute(DeathAnimalsList)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Processamentos (Processing,
            97-Esteiras/039, TASK-FE-039-PROC-02/03). Listagem + Detalhe
            gate `processing_view`; `/finalizar` gate `processing_create`
            (transição de ESCRITA, mirror `/venda-animais/:saleUuid/
            finalizar`). SEM `/novo`/`/editar` — a API só expõe
            index/show/finish (front-plan-proc.md §1.1). */}
        <Route
          path="/operacional/processamentos"
          element={
            <RequirePermission permission="processing_view">
              {lazyRoute(ProcessingList)}
            </RequirePermission>
          }
        />

        <Route
          path="/operacional/mortes/novo"
          element={
            <RequirePermission permission="death_animals_view">
              {lazyRoute(CreateOrUpdateDeathAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/processamentos/:uuid"
          element={
            <RequirePermission permission="processing_view">
              {lazyRoute(ProcessingDetalhe)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/mortes/:deathAnimalUuid"
          element={
            <RequirePermission permission="death_animals_edit">
              {lazyRoute(CreateOrUpdateDeathAnimal)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/mortes/:deathAnimalUuid/detalhe"
          element={
            <RequirePermission permission="death_animals_view">
              {lazyRoute(DetalheDeathAnimal)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Pluviometria (Rainfall, execução 041,
            TASK-FE-041-PLV-01..05). Item de menu (`ope-plu`) e permissão
            (`rainfall_view`) JÁ existentes em `navigationTree.ts`/
            `navigationPermissions.ts` — só faltava a rota. `/novo` declarada
            ANTES de `/:rainfallUuid` (mesma armadilha "novo" vs UUID de
            `CentroCusto`/`FeedlotYard`/`DeathAnimals`). Gate de rota
            `rainfall_view` — criar/editar/excluir/importar são gateados por
            `rainfall_create/edit/delete` DENTRO do componente. */}
        <Route
          path="/operacional/pluviometria"
          element={
            <RequirePermission permission="rainfall_view">
              {lazyRoute(RainfallList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pluviometria/novo"
          element={
            <RequirePermission permission="rainfall_view">
              {lazyRoute(CreateOrUpdateRainfall)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pluviometria/:rainfallUuid"
          element={
            <RequirePermission permission="rainfall_edit">
              {lazyRoute(CreateOrUpdateRainfall)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/pluviometria/:rainfallUuid/detalhe"
          element={
            <RequirePermission permission="rainfall_view">
              {lazyRoute(RainfallDetalhe)}
            </RequirePermission>
          }
        />

        <Route
          path="/operacional/processamentos/:uuid/finalizar"
          element={
            <RequirePermission permission="processing_create">
              {lazyRoute(FinishProcessing)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Desmama (Weaning, TASK-WN-FE-06,
            02-arquitetura-frontend-desmama.md §4.4). Item de menu NOVO
            (`ope-pec-man-des`, filho de `ope-pec-man`) e permissão
            `weaning_view` — ver `navigationTree.ts`/`navigationPermissions.ts`.
            Gate de rota é `weaning_view`; `weaning_create`/`weaning_edit`/
            `weaning_delete` são checados DENTRO do componente (mirror
            Nascimentos). Sem rota de Detalhe própria (contrato §2 —
            `SURFACE-WEANINGS-SHOW` reusa o mesmo componente de editar). */}
        <Route
          path="/operacional/desmame"
          element={
            <RequirePermission permission="weaning_view">
              {lazyRoute(WeaningsList)}
            </RequirePermission>
          }
        />
        {/* `/novo` declarada ANTES de `/:uuid` (mesma armadilha "novo" vs
            UUID de Nascimentos/Equipes/Faltas/Vendas). */}
        <Route
          path="/operacional/desmame/novo"
          element={
            <RequirePermission permission="weaning_create">
              {lazyRoute(CreateOrUpdateWeaning)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Apartação (Separation,
            97-Esteiras/005 Tarefa 24, frontend-contract-apartacao.md §2.3).
            Item de menu NOVO (`ope-pec-apa`) e permissão EXISTENTE
            (`separation_view`) — ver `navigationTree.ts`/
            `navigationPermissions.ts`, mesma Tarefa (`GAP-APARTACAO-FE-01`). */}
        <Route
          path="/operacional/apartacao"
          element={
            <RequirePermission permission="separation_view">
              {lazyRoute(SeparationsList)}
            </RequirePermission>
          }
        />
        {/* `/novo` declarada ANTES de `/:separationUuid` (mesma armadilha
            "novo" vs UUID de `Nascimentos`/`Equipes`/Faltas/Vendas). Gate de
            rota é `separation_view` — o botão Salvar é gateado por
            `separation_create` DENTRO do componente (contrato §2.3,
            TASK-APART-FE-02). */}
        <Route
          path="/operacional/apartacao/novo"
          element={
            <RequirePermission permission="separation_view">
              {lazyRoute(CreateOrUpdateSeparation)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/desmame/:uuid"
          element={
            <RequirePermission permission="weaning_edit">
              {lazyRoute(CreateOrUpdateWeaning)}
            </RequirePermission>
          }
        />
        {/* Visualizar: mesmo componente, forçado somente-leitura
            (`isViewOnlyRoute`, mirror Congelamentos). UT-000794 item 2. */}
        <Route
          path="/operacional/desmame/:uuid/visualizar"
          element={
            <RequirePermission permission="weaning_view">
              {lazyRoute(CreateOrUpdateWeaning)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Localizar Animal (Find Animal,
            TASK-FA-FE-06, contrato-tela-lane-a-find-animal-frontend.md
            §6.1/§9). Item de menu NOVO (`ope-pec-man-loc`, filho de
            `ope-pec-man`) e permissão `find-animal_view` — ver
            `navigationTree.ts`/`navigationPermissions.ts`. UMA única rota —
            os 5 endpoints de CRUD são `EXCLUDED_BY_OWNER` (sem `/novo`,
            `/:uuid`, `/editar`); `find-animal_edit` é checado DENTRO do
            componente (TASK-FA-FE-05), mirror `separation_create` de
            Apartação. */}
        <Route
          path="/operacional/localizar-animal"
          element={
            <RequirePermission permission="find-animal_view">
              {lazyRoute(FindAnimalPage)}
            </RequirePermission>
          }
        />

        {/* ---- Privado: Operacional — Marcação (Marking, TASK-MC-FE-09,
            97-Esteiras/044, `ARCHITECTURE-MARCACAO-FE.md §6`). Item de menu
            NOVO (`ope-pec-man-mar`, filho de `ope-pec-man`) e permissão
            `markings_view` — ver `navigationTree.ts`/
            `navigationPermissions.ts`. `create`/`previsao-lote`/
            `realizacao-lote` (literais) declaradas ANTES de `:uuid` para não
            serem capturadas pelo parâmetro dinâmico. */}
        <Route
          path="/operacional/marcacao"
          element={
            <RequirePermission permission="markings_view">
              {lazyRoute(MarkingsList)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/marcacao/create"
          element={
            <RequirePermission permission="markings_create">
              {lazyRoute(CreateOrUpdateMarking)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/marcacao/previsao-lote"
          element={
            <RequirePermission permission="markings_forecast">
              {lazyRoute(PrevisaoLoteMarking)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/marcacao/realizacao-lote"
          element={
            <RequirePermission permission="markings_done">
              {lazyRoute(RealizacaoLoteMarking)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/marcacao/:uuid/previsao"
          element={
            <RequirePermission permission="markings_forecast">
              {lazyRoute(PrevisaoMarking)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/marcacao/:uuid/realizado"
          element={
            <RequirePermission permission="markings_done">
              {lazyRoute(RealizadoMarking)}
            </RequirePermission>
          }
        />
        <Route
          path="/operacional/marcacao/:uuid"
          element={
            <RequirePermission permission="markings_view">
              {lazyRoute(CreateOrUpdateMarking)}
            </RequirePermission>
          }
        />

        <Route
          path="/operacional/apartacao/:separationUuid"
          element={
            <RequirePermission permission="separation_view">
              {lazyRoute(SeparationDetalhe)}
            </RequirePermission>
          }
        />
        {/* Mesmo componente do `/novo`, em modo edição — gate de rota
            `separation_view`, botão Salvar gateado por `separation_edit`
            DENTRO do componente; redireciona para o Detalhe se
            `finished_processing` (contrato §2.3/§7.3). */}
        <Route
          path="/operacional/apartacao/:separationUuid/editar"
          element={
            <RequirePermission permission="separation_view">
              {lazyRoute(CreateOrUpdateSeparation)}
            </RequirePermission>
          }
        />

        {/* Módulo de EXEMPLO — só por URL direta (não aparece no menu) */}
        <Route path="/exemplo" element={lazyRoute(ExampleResources)} />
        <Route path="/exemplo/create" element={lazyRoute(ExampleResourceForm)} />
        <Route path="/exemplo/:resourceId" element={lazyRoute(ExampleResourceForm)} />

        {/* 404 dentro do layout autenticado */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Fallback global -> login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
