// src/config/v2/navigationPermissions.ts
// Mapa item-de-menu → permissão Spatie exigida para VER o item.
//
// GERADO pela reconciliação navigationTree.ts × App\Support\PermissionTree
// (backend GB.Cerne) — casa cada folha do menu com a permissão `recurso_view`
// do catálogo real (~905 nomes, expostos por GET /api/v1/auth/me e
// GET /api/v1/permissions/tree). Mantido em arquivo próprio (chaveado pelo
// `id` do item) para não poluir o navigationTree.ts, que é porte 1:1 do
// design system e deve permanecer auditável contra a fonte.
//
// Semântica:
// - `permission`: o usuário precisa DESTA permissão para ver o item.
// - `anyOf`: o item representa uma SEÇÃO do legado (várias telas); basta
//   QUALQUER uma das permissões listadas (ex.: relatórios por área).
// - `sameAs`: o item HERDA a regra de outro item (1 salto). Usado pelos
//   placeholders do módulo Favoritos: favorito não tem permissão própria —
//   vale a do item-alvo (regra do legado getMenu()/extractFavorites). Essas
//   entradas somem quando os favoritos ficarem dinâmicos por usuário
//   (GAP-BE-023: favorites embutidos no GET /auth/me + endpoint de escrita).
// - `role`: ADITIVO — além de `permission`/`anyOf` (se houver), o usuário
//   precisa ter este PAPEL. Exceção à regra "100% permissão", só para regra
//   modelada por papel no backend (execução 079 / DD-079-05: Logs do Sistema,
//   `Gestor_Plataf`). Regras existentes não usam `role` e não mudam.
// - id AUSENTE deste mapa: item visível para qualquer usuário autenticado.
//
// Isto é UX, não segurança — o enforcement real é do backend (middleware
// `permission:` + `authorize()` dos Form Requests).

export interface NavPermissionRule {
  permission?: string;
  anyOf?: string[];
  sameAs?: string;
  role?: string;
}

export const navigationPermissions: Record<string, NavPermissionRule> = {
  'fav-dfe': { sameAs: 'adm-est-dfe2' },
  'fav-pagar': { sameAs: 'fin-pag' },
  'fav-receber': { sameAs: 'fin-rec' },
  'fav-caixa': { sameAs: 'fin-cai' },
  'fav-ofx': { sameAs: 'fin-cnc-ofx' },
  'dash-overview': {
    anyOf: [
      'financial_dashboard_view',
      'cash_book_dashboard_view',
      'supply_dashboard_view',
      'livestock_dashboard_view',
      'abc_indicators_dashboard_view',
      'depreciation_dashboard_view',
      'assets_dashboard_view',
      'user_analysis_dashboard_view',
      'rainfall_dashboard_view',
      'feedlot_dashboard_view',
      'feedlot_cost_dashboard_view',
      'feedlot_performance_dashboard_view',
      'nutrition-stock-dashboard_view',
      'feed-consumption-dashboard_view',
    ],
  },
  'dash-fin': { permission: 'financial_dashboard_view' },
  'dash-sup': { permission: 'supply_dashboard_view' },
  'dash-pec': { permission: 'livestock_dashboard_view' },
  'dash-dep': { permission: 'depreciation_dashboard_view' },
  'dash-ati': { permission: 'assets_dashboard_view' },
  'dash-usr': { permission: 'user_analysis_dashboard_view' },
  'dash-plu': { permission: 'rainfall_dashboard_view' },
  'dash-lcx': { permission: 'cash_book_dashboard_view' },
  'dash-cur': { permission: 'feedlot_dashboard_view' },
  'dash-des': { permission: 'feedlot_performance_dashboard_view' },
  'dash-nut': { permission: 'nutrition-stock-dashboard_view' },
  'dash-rac': { permission: 'feed-consumption-dashboard_view' },
  'dash-cco': { permission: 'feedlot_cost_dashboard_view' },
  // Programa ABC Corte (execução 046, TASK-DASH-FE-05) — mesma permissão já
  // referenciada no `anyOf` de `dash-overview` (linha acima nesta mesma
  // tabela), agora com folha própria no menu.
  'dash-abc': { permission: 'abc_indicators_dashboard_view' },
  'cad-est-cc': { permission: 'costcenters_view' },
  'cad-est-faz': { permission: 'farms_view' },
  'cad-est-saf': { permission: 'harvests_view' },
  // TASK-083: novo nó-pai do submenu "Produtos" (reagrupamento de menu,
  // rejeição AD F-173) — mesmo anyOf agregador que já existia em
  // `cad-est-pro-lista` abaixo, agora no pai que carrega os children.
  // Esteira feature/produtos-submenu-reorg (Variante B): anyOf ampliado para
  // a união das permissões dos 9 filhos finais (Embalagens/Endereçamentos/
  // Armazéns/Estoque Inicial entraram como children deste nó).
  'cad-est-pro': {
    anyOf: [
      'products_view',
      'groupproducts_view',
      'kinds_view',
      'categoryproducts_view',
      'measurements_view',
      'product-packages_view',
      'addressings_view',
      'warehouses_view',
      'openingbalances_view',
    ],
  },
  'cad-est-pro-lista': {
    anyOf: [
      'products_view',
      'groupproducts_view',
      'categoryproducts_view',
      'kinds_view',
      'measurements_view',
    ],
  },
  'cad-est-pro-gru': { permission: 'groupproducts_view' },
  // Kind (Classes de Produto, execução 024, TASK-FE-463) — permissão REAL do
  // backend é `kinds_view` (TASK-BE-897/TASK-FE-916: `product_kinds_view` era
  // um nome FANTASMA — nunca existiu na tabela `permissions`, só no código do
  // fork; `can('product_kinds_view')` sempre resolvia `false`. Corrigido para
  // o nome real confirmado contra o banco).
  'cad-est-pro-cla': { permission: 'kinds_view' },
  'cad-est-pro-cat': { permission: 'categoryproducts_view' },
  'cad-est-emb': { permission: 'product-packages_view' },
  'cad-est-arm': { permission: 'warehouses_view' },
  // Atualizações do Sistema (SystemUpdate, execução 031, TASK-FE-1104).
  'cad-est-sis': { permission: 'system_updates_view' },
  'cad-est-med': { permission: 'measurements_view' },
  // TASK-FE-1041: corrige bug de scaffold anterior — apontava para
  // "open-movements_view" (permissão de OUTRO item, "cad-fin-sal"), que
  // nunca habilitava este nó. Permissão real do catálogo (linhas 652-655).
  'cad-est-sal-ini': { permission: 'openingbalances_view' },
  'cad-est-end': { permission: 'addressings_view' },
  // TASK-AP-FE-09: item novo "Rateios / Categorias" (Apportionment) — slug
  // próprio do módulo, já cadastrado em `permissionsCatalog.json`.
  'cad-est-rat': { permission: 'apportionments_view' },
  'cad-pes-per': { permission: 'roles_tenant_view' },
  'cad-pes-uni': { permission: 'people_view' },
  // TASK-PY-FE-02: item novo "Proprietários", separado de "Pessoas" —
  // permissão legada `proprietaries_view`, já reservada em
  // permissionsCatalog.json (linhas 751-754) e órfã até esta Tarefa.
  'cad-pes-prp': { permission: 'proprietaries_view' },
  // TASK-EMP-FE-02: item novo "Funcionários", separado de "Pessoas" (DEC-006
  // — permissão legada `employees_view`, já registrada em PermissionTree.php
  // (legado) e reservada em permissionsCatalog.json (linhas 346-349).
  'cad-pes-fun': { permission: 'employees_view' },
  // TASK-PR-FE-02: item novo "Fornecedores", separado de "Pessoas" (DEC-006
  // — permissão legada `providers_view`, já reservada e órfã até esta Tarefa).
  'cad-for-lis': { permission: 'providers_view' },
  // TASK-CL-FE-02: item novo "Clientes", separado de "Pessoas" — permissão
  // legada `clients_view`, já reservada em permissionsCatalog.json (linhas
  // 204-207) e órfã até esta Tarefa. SCAFFOLD ADIANTADO POR ESPELHAMENTO.
  'cad-pes-cli': { permission: 'clients_view' },
  'cad-pes-usr': { permission: 'users_view' },
  'cad-pes-aut': { permission: 'request-authorizers_view' },
  // Partner (Afiliados, execução 024, TASK-FE-433) — item de menu NOVO,
  // logo após Autorizadores (mesma ordem do legado, contrato de tela §3.2).
  'cad-pes-afi': { permission: 'partners_view' },
  // Contratantes (Tenant, TASK-TN-FE-02) MOVIDO de `cad-gerais`
  // (homologação do dono, 2026-08-13) — id renomeado de `cad-ger-contr`
  // para `cad-pes-contr` (convenção de prefixo do grupo `cad-pessoas`).
  // Permissão inalterada.
  'cad-pes-contr': { permission: 'tenants_view' },
  'cad-fin-bco': { permission: 'accounts_view' },
  'cad-fin-sal': { permission: 'open-movements_view' },
  'cad-fin-cnd': { permission: 'paymentterms_view' },
  'cad-fin-agr': { permission: 'groupers_view' },
  'cad-fin-acg': { permission: 'accounting_groupers_view' },
  'cad-fin-cat': { permission: 'financialcategories_view' },
  'cad-fin-cty': { permission: 'categorytypes_view' },
  'cad-fin-tt': { permission: 'typetitles_view' },
  'cad-fin-bnk': { permission: 'banks_view' },
  'cad-fin-mba': { permission: 'lowreasons_view' },
  'cad-fin-idx': { permission: 'indexers_view' }, // NOVO
  'cad-fis-emi': { permission: 'issue_view' },
  'cad-fis-sin': { permission: 'issue-dfe-sync-time_view' },
  'cad-fis-nfse': { permission: 'nfse_view' },
  'cad-fis-reg': { permission: 'tax-rules_view' },
  'cad-fis-cnt': { permission: 'ctdr_view' },
  'cad-fis-nat': { permission: 'natop_view' },
  'cad-fis-inf': { permission: 'additional-info_view' },
  'cad-fis-pla': { permission: 'plan-accounts_view' },
  'cad-agr-ope': { permission: 'operations_view' },
  'cad-agr-ati': { permission: 'activities_view' },
  'cad-agr-cul': { permission: 'cultivations_view' },
  'cad-agr-cic': { permission: 'production-cycles_view' },
  'cad-pec-rac': { permission: 'breeds_view' },
  'cad-pec-vac': { permission: 'vaccine_view' },
  'cad-pec-esp': { permission: 'specie_view' },
  'cad-pec-cat': { permission: 'categoryanimals_view' },
  'cad-pec-dia': { permission: 'diagnosis_pregnancies_view' },
  // DEC-006 — slug reusado do legado (`bodys_view`), nenhuma permissão nova
  // cunhada (TASK-BS-FE-03).
  'cad-pec-esc': { permission: 'bodys_view' },
  'cad-pec-cmp': { permission: 'death_loss_view' },
  'cad-pec-est': { permission: 'catymt_view' },
  'cad-pec-dtc': { permission: 'diagnostic_techniques_view' },
  'cad-pec-tid': { permission: 'idanimal_view' },
  'cad-pec-obn': { permission: 'birth_note_view' }, // NOVO
  'cad-pec-par': { permission: 'parameter-weight_view' },
  'cad-pec-pan': { permission: 'parameter-animals_view' },
  'cad-pec-for': { permission: 'fodder_view' },
  'cad-pec-reb': { permission: 'animals_view' },
  'cad-pec-mod': { permission: 'grazing_view' },
  'cad-pec-coc': { permission: 'troughs_view' },
  // NOVO (execução 029, TASK-FE-2304 — chokepoint de FUNDAÇÃO) — item de
  // menu "Bebedouros" recém-criado em navigationTree.ts.
  'cad-pec-beb': { permission: 'drinking-fountains_view' },
  'cad-pec-lot': { permission: 'batch_view' },
  'cad-pec-lmo': { permission: 'batch_grazing_view' },
  'cad-pec-lar': { permission: 'batch_area_view' },
  'cad-ben-fam': { permission: 'familyequipments_view' },
  'cad-ben-inv': { permission: 'equipments_view' },
  // Depreciação Mensal (Depreciation, TASK-FE-842, execução 027) — 1 tela,
  // 2 abas (Equipamento/Animal); usuário com QUALQUER uma das 2 visões
  // precisa alcançar o item de menu (mirror `adm-est-fab`, item que também
  // representa mais de 1 permissão de leitura).
  'cad-ben-dep': { anyOf: ['depreciations_view', 'depreciation_animals_view'] },
  // Depreciação Animal STANDALONE (execução 055, DECISÃO DO DONO
  // "navegação fiel ao legado") — item PRÓPRIO, gate único (reuso,
  // DEC-006 — mesma permissão já usada no `anyOf` acima).
  'cad-ben-dep-ani': { permission: 'depreciation_animals_view' },
  'cad-ben-pre': { permission: 'depreciation-forecast_view' },
  'cad-ger-cid': { permission: 'cities_view' },
  'cad-ger-est': { permission: 'states_view' },
  'cad-ger-svc': { permission: 'service_view' }, // NOVO
  'cad-ger-rev': { permission: 'reversal_view' },
  'cad-ger-par': { permission: 'tenant-parameters_edit' },
  // Marcadores (Marker, TASK-MK-FE-01) — slug legado DEC-006, já catalogado
  // em permissionsCatalog.json (linhas 574-577), nenhum slug novo cunhado.
  // Item movido de `cad-gerais` para o módulo de topo `configuracoes`
  // (97-Esteiras/019, decisão do dono 2026-08-05); id renomeado para o
  // prefixo do novo módulo — permissão inalterada.
  'cfg-mrc': { permission: 'markers_view' },
  // Testeiras (Headband, TASK-HB-FE-04, 97-Esteiras/019) — slug legado
  // `headbands_view` já catalogado em permissionsCatalog.json, nenhum slug
  // novo cunhado. Item movido de `cad-gerais` para o módulo de topo
  // `configuracoes` (decisão do dono 2026-08-05); id renomeado para o
  // prefixo do novo módulo. Sem esta entrada o item fica visível para
  // qualquer usuário autenticado (id ausente do mapa = sem gate).
  'cfg-tst': { permission: 'headbands_view' },
  // Tutoriais (Help, TASK-HP-06) — item de menu adicionado em navigationTree.ts
  // em correção de homologação (2026-08-06, packet do Maestro): a tela e a
  // rota já existiam e já estavam ✅ validadas, só faltava o item de menu.
  // Permissão já reservada em permissionsCatalog.json (linha 479) e já usada
  // no gate de rota (`RequirePermission permission="helpers_view"`,
  // router/index.tsx:1319) — nenhum slug novo cunhado aqui, mesmo padrão de
  // `cfg-tst`/`cfg-mrc` acima.
  'cfg-hlp': { permission: 'helpers_view' },
  // Configuração (Config, execução 032, TASK-FE-2603) — item NOVO, slug
  // `config_view` já catalogado em permissionsCatalog.json:213 (junto com
  // `config_edit`, adicionado nesta mesma Tarefa), nenhum slug novo cunhado.
  'cfg-cnf': { permission: 'config_view' },
  // Aplicativos (App, TASK-APP-FE-01) — item de menu incluído desde o
  // início da Tarefa (não em correção posterior). Permissão já reservada em
  // App-contrato.md Seção 3 (`apps_view`/`apps_create`/`apps_edit`/
  // `apps_delete`, reuso dos 4 slugs legados, DEC-006) e já usada no gate de
  // rota (`RequirePermission permission="apps_view"`, router/index.tsx) —
  // nenhum slug novo cunhado aqui, mesmo padrão de `cfg-tst`/`cfg-mrc`/
  // `cfg-hlp` acima.
  'cfg-app': { permission: 'apps_view' },
  // Parâmetros (Parameter, execução 031, TASK-FE-031-43) — item NOVO, slug
  // `parameters_view` já catalogado em permissionsCatalog.json:671-674 (junto
  // com create/edit/delete), nenhum slug novo cunhado.
  'cfg-par': { permission: 'parameters_view' },
  // Permissões (Permission, execução 032, TASK-FE-2404) — item NOVO, slug
  // `permissions_view` já catalogado em permissionsCatalog.json:699 (junto
  // com create/edit/delete), nenhum slug novo cunhado.
  'cfg-per': { permission: 'permissions_view' },
  // IBPT (Ibpt, execução 032, TASK-FE-2414) — item NOVO, slug `ibpts_view`
  // reservado pelo contrato de API §10 (junto com `ibpts_create`/
  // `ibpts_delete` — SEM `ibpts_edit`, não há endpoint de update), nenhum
  // slug novo cunhado aqui.
  'cfg-ibp': { permission: 'ibpts_view' },
  // Termos e Condições (PlatformDocument, execução 032, TASK-FE-2502) — item
  // NOVO, slug `terms_view` reservado pelo contrato de API §5
  // (`PermissionTree.php`, junto com `terms_create` reaproveitada do
  // legado), nenhum slug novo cunhado aqui.
  'cfg-trm': { permission: 'terms_view' },
  // Planos (PlanRole, AJUSTE de navegação, packet do Maestro 2026-08-07) —
  // item novo em navigationTree.ts, mirror da permissão já usada pelo guard
  // da rota `/planos` (`RequirePermission permission="plan_view"`,
  // router/index.tsx) e pelo ícone dedicado do NavRail (Gem). Nenhum slug
  // novo cunhado aqui.
  'cfg-pln': { permission: 'plan_view' },
  'adm-sup-sla': { permission: 'supply-status-sla_view' },
  'adm-sup-meu': { permission: 'request-purchases_view' },
  'adm-sup-sol': { permission: 'request-purchases_view' },
  // Rejeitados/Cancelados: `rejected-requests_view`, igual ao legado (tela Blade
  // `rejected-requests`, papel próprio) e ao que `GET /request-purchases/rejected`
  // passou a exigir (T-081-API-03). Supera o GAP-UX-CPS-01 (execução 036), que
  // tinha consolidado no slug `request-purchases_view` do hub (T-081-FE-02).
  'adm-sup-rej': { permission: 'rejected-requests_view' },
  'adm-sup-cot': { permission: 'request-quotation_view' },
  'adm-sup-aut': { permission: 'request-authorization_view' },
  // Compras (fila `in-purchase`): `request-buy_view`, igual ao legado
  // (`Admin\RequestBuyController`, papel próprio) e à API (T-081-API-03).
  // Supera o GAP-UX-CPS-01 (execução 036), que tinha consolidado no slug do hub
  // (T-081-FE-02).
  'adm-sup-com': { permission: 'request-buy_view' },
  'adm-sup-rec': { permission: 'request-receipts_view' },
  'adm-est-dfe': { permission: 'invoices_view' },
  'adm-est-dfe2': { permission: 'dfe_view' },
  'adm-est-eis': { permission: 'input_entries_view' },
  'adm-est-bai': { permission: 'stock-writeoffs_view' },
  'adm-est-req': { permission: 'requisitions_view' },
  'adm-est-dev': { permission: 'devolution_view' },
  'adm-est-cor': { permission: 'stock-corrections_view' },
  'adm-est-trm': { permission: 'warehouse-transfer_view' },
  'adm-est-trf': { permission: 'warehouse-transfer-farm_view' },
  'adm-est-sal': { permission: 'stocks_view' },
  'adm-est-fab': {
    anyOf: [
      'food_view',
      'food_create',
      'food_edit',
      'food_delete',
      'food-beat_view',
      'food-beat_create',
      'food-beat_edit',
      'food-beat_delete',
    ],
  },
  // Fábrica → Formulação / Fábrica → Batida (TASK-FB-FE-07 v2.0, decisão do
  // dono 2026-08-12): gate de cada FILHO do grupo "Fábrica", mirror exato da
  // permissão já usada na rota real de cada tela (Food: `food_view`;
  // FoodBeat: `food-beat_view`). A regra do PAI (linha acima) permanece
  // inalterada (mais permissiva, `anyOf`, decide se o GRUPO aparece).
  'adm-est-fab-for': { permission: 'food_view' },
  'adm-est-fab-bat': { permission: 'food-beat_view' },
  'adm-gp-eve': { permission: 'events_view' },
  'adm-gp-fun': { permission: 'functions_view' },
  'adm-gp-equ': { permission: 'teams_view' },
  'adm-gp-fal': { permission: 'absences_view' },
  'adm-gp-adi': { permission: 'advances_view' },
  'adm-gp-reg': { permission: 'bonuses_view' },
  'adm-gp-fxe': { permission: 'employeeevents_view' },
  'adm-gp-apu': { permission: 'earnings_view' },
  'adm-gd-tip': { permission: 'document-types_view' },
  'adm-gd-doc': { permission: 'document-managements_view' },
  // Atividades Recentes (UT-000690 / F-349, DP-FE-01): somente leitura.
  'adm-atv-rec': { permission: 'recent-activities_view' },
  // Logs do Sistema (execução 079, DD-079-05): papel `Gestor_Plataf` E
  // permissão `system-logs_view` — mesma barreira dupla da API
  // (`SystemLogRequest::authorize`). A permissão sozinha não abre o item.
  'adm-sis-log': { permission: 'system-logs_view', role: 'Gestor_Plataf' },
  'ope-agr-pla': { permission: 'plannings_view' },
  'ope-agr-apo': { permission: 'appropriations_view' },
  'ope-agr-rom': { permission: 'transfers_view' },
  // Agricultura → Colheita de Frutas (HarvestProduct, F-040, execução 040,
  // HarvestProduct-contrato-arquitetural.md §7.9) — permissão JÁ existente no
  // backend (`PermissionTree`, nenhuma permissão nova cunhada).
  'ope-agr-col': { permission: 'harvest-products_view' },
  // Agricultura → Marcação (Marking, TASK-MC-FE-09, esteira 97-Esteiras/044)
  // — FIX de placement (bug reportado pelo dono, ver navigationTree.ts):
  // movido de "Pecuária → Manejo" (`ope-pec-man-mar`, removido) para item-
  // folha de "Agricultura" (mirror exato dos irmãos `ope-agr-*` acima/
  // abaixo — gate simples por permissão única, sem `anyOf` de grupo-pai,
  // já que `ope-agricultura` não tem entrada própria neste arquivo).
  // Mesma permissão legada `markings_view` (`agro365/app/Permission.php`,
  // grupo "Agricultura" → "Marcação"; `MarkingController::middleware()`
  // no fork) — nenhuma permissão nova cunhada (DEC-006).
  'ope-agr-mar': { permission: 'markings_view' },
  // `anyOf` do PAI mantido INALTERADO (homologação do dono, 2026-08-25,
  // "Carregamento" virou item-pai com 2 filhos em navigationTree.ts): já
  // cobria `charge_*` (Carregamentos) e `closing_weeks_*` (Fechamento
  // Semana) antes da reestruturação — mesmo padrão de "Manejo"/"Reprodução"
  // (o PAI mantém `anyOf` amplo que cobre a(s) permissão(ões) do(s)
  // filho(s), para não desaparecer enquanto algum filho estiver visível).
  'ope-agr-car': {
    anyOf: [
      'charge_view',
      'charge_create',
      'charge_edit',
      'charge_delete',
      'charge_expense_view',
      'charge_expense_create',
      'charge_expense_edit',
      'charge_expense_delete',
      'charge_income_view',
      'charge_income_create',
      'charge_income_edit',
      'charge_income_delete',
      'closing_weeks_view',
      'closing_weeks_create',
      'closing_weeks_delete',
    ],
  },
  // Carregamentos (filho de "Carregamento", homologação do dono,
  // 2026-08-25): mesma permissão mínima já usada na rota real
  // (`RequirePermission permission="charge_view"`, router/index.tsx) para a
  // feature que antes vivia direto no item-pai.
  'ope-agr-car-car': { permission: 'charge_view' },
  // Fechamento Semana (filho NOVO de "Carregamento", homologação do dono,
  // 2026-08-25): fecha a lacuna de menu apontada pelo dono — rota
  // (`/operacional/fechamento-semana`) e permissão já existiam, só faltava o
  // nó. Mesma permissão mínima já usada na rota
  // (`RequirePermission permission="closing_weeks_view"`,
  // router/index.tsx) — nenhuma permissão nova cunhada.
  'ope-agr-car-fec': { permission: 'closing_weeks_view' },
  // Contas a Receber (filho NOVO de "Carregamento", ChargeBillIncome, F-026,
  // TASK-CBI-FE-01, esteira 97-Esteiras/059): mesma permissão mínima já
  // usada na rota real (`RequirePermission permission="charge_income_view"`,
  // router/index.tsx) — nenhuma permissão nova cunhada (já existia no
  // `anyOf` do PAI acima, preparado desde a reestruturação de 2026-08-25).
  'ope-agr-car-cbi': { permission: 'charge_income_view' },
  // Contas a Pagar (filho NOVO de "Carregamento", ChargeBillExpense, TASK-CBE-07,
  // esteira 97-Esteiras/062): mesma permissão mínima já usada na rota real
  // (`RequirePermission permission="charge_expense_view"`, router/index.tsx)
  // — nenhuma permissão nova cunhada (já existia no `anyOf` do PAI acima,
  // preparado desde a reestruturação de 2026-08-25).
  'ope-agr-car-cbe': { permission: 'charge_expense_view' },
  // `anyOf` do PAI mantido INALTERADO (F-067, TASK-TR-FE-11, esteira
  // 97-Esteiras/058, mirror do padrão já aprovado para "Carregamento" acima):
  // já cobria `tracconfig_*`/`traceab_*` antes da reestruturação de
  // item-folha STUB para item-pai com 2 filhos (`navigationTree.ts`) — o PAI
  // mantém o `anyOf` amplo que cobre a(s) permissão(ões) do(s) filho(s), para
  // não desaparecer enquanto algum filho estiver visível. `site_edit` JÁ
  // estava neste `anyOf` desde a TASK-SITE-07 original (então cobrindo só a
  // permissão de referência do menu antigo `cfg-site`); com o reposicionamento
  // de Site para 3º filho (`ope-agr-ras-site`, decisão do dono na
  // homologação, esteira 061, 2026-08-27) esta entrada passa a cobrir o
  // filho real — sem alteração de valores, edição ADITIVA nula (já cobria).
  'ope-agr-ras': {
    anyOf: [
      'tracconfig_view',
      'traceab_view',
      'traceab_create',
      'traceab_edit',
      'traceab_delete',
      'site_edit',
    ],
  },
  // Produtos (filho NOVO de "Rastreabilidade", F-067, TASK-TR-FE-11): `anyOf`
  // com `traceab_view`/`create`/`edit`/`delete` (mirror `ope-pec-pro`, item-
  // folha com múltiplos verbos) para exibir o item mesmo com permissão
  // parcial (ex.: usuário só com `traceab_create`, sem `traceab_view`, ainda
  // precisa ver o link para cadastrar) — a ROTA real usa a permissão mínima
  // de cada ação (`traceab_view`/`traceab_create`/`traceab_edit`,
  // `router/index.tsx`), não este `anyOf` do menu.
  'ope-agr-ras-pro': {
    anyOf: ['traceab_view', 'traceab_create', 'traceab_edit', 'traceab_delete'],
  },
  // Configuração (filho NOVO de "Rastreabilidade", F-067, TASK-TR-FE-11):
  // permissão única `tracconfig_view` — mesmo slug cobre TODOS os verbos de
  // Configuração (`## 6.1` do contrato de destino da API) — nenhuma
  // permissão nova cunhada (DEC-006).
  'ope-agr-ras-cfg': { permission: 'tracconfig_view' },
  // Site (Site, esteira 97-Esteiras/061) — 3º filho de "Rastreabilidade",
  // REPOSICIONADO por decisão do dono na homologação (2026-08-27): gate
  // dedicado com a mesma permissão que já guarda a rota real
  // (`RequirePermission permission="site_edit"`, `router/index.tsx`), slug
  // reusado do legado (DEC-006). `anyOf` do PAI (`ope-agr-ras`, acima) já
  // cobria `site_edit` — nenhuma alteração adicional necessária ali.
  'ope-agr-ras-site': { permission: 'site_edit' },
  'ope-agr-des': { permission: 'discount-tables_view' },
  'ope-agr-pes': { permission: 'module-weighing_view' },
  'ope-agr-con': { permission: 'sale-contracts_view' },
  'ope-pec-ges': { permission: 'animals-management_view' },
  'ope-pec-inv': { permission: 'inventoried-animals_view' },
  'ope-pec-pla': { permission: 'planning-livestock_view' },
  'ope-pec-tra': {
    anyOf: [
      'evolutions_view',
      'transference_animal_batch',
      'grouper_batches',
      'transfer_batch_module_area',
      'transfer_batch_farm',
      'transfer_animal_farm',
      'transfer_abc_batch_view',
      'transfer_abc_batch_create',
      'transfer_abc_batch_delete',
      // 97-Esteiras/041, TASK-FE-041-LF-01 — permissões REAIS emitidas pelo
      // backend novo (`TransferBatchFarmController::middleware()`,
      // `PermissionTree`) para o filho `ope-pec-tra-lf` abaixo. O
      // `transfer_batch_farm` (singular) acima é resíduo do catálogo
      // legado/placeholder — preservado sem alteração (fora do escopo desta
      // Tarefa remover), as 3 entradas novas é que gateiam o item real.
      'transfer_batch_farms_view',
      'transfer_batch_farms_create',
      'transfer_batch_farms_delete',
      // 97-Esteiras/042, TASK-FE-042-102 — permissões REAIS emitidas pelo
      // backend novo (`TransferAnimalFarmController::middleware()`) para o
      // filho `ope-pec-tra-af` abaixo (transfere ANIMAIS, diferente de
      // `transfer_batch_farms_*` acima, que transfere LOTES inteiros).
      'transfer_animal_farms_view',
      'transfer_animal_farms_create',
      'transfer_animal_farms_delete',
      // 97-Esteiras/070, TASK-LMA-FE-02 — permissões REAIS emitidas pelo
      // backend novo (`BatchModuleAreaTransferController`/`PermissionTree`)
      // para o filho `ope-pec-tra-lma` abaixo (transfere Módulo/Área/Curral
      // DENTRO da mesma fazenda, diferente de `transfer_batch_farms_*`/
      // `transfer_animal_farms_*` acima, que transferem ENTRE fazendas).
      'batch_module_area_transfers_view',
      'batch_module_area_transfers_create',
    ],
  },
  // GAP-VENDAS-FE-02 — limpeza mandatória: as 4 entradas `mov_sale_*` foram
  // removidas deste `anyOf` (mortas após o rename 1:1 para `mov_sale_*`
  // na API, `api-contract-vendas.md §6` — Vendas ganhou item de menu PRÓPRIO,
  // `ope-pec-ven` abaixo). GAP-NASCIMENTOS-FE-02 — limpeza mandatória: as 4
  // entradas `birth_animals_*` (underscore, legado morto) TAMBÉM foram
  // removidas deste `anyOf` (a permissão real da API nova é hifenizada,
  // `birth_animals_*`, usada pelo item PRÓPRIO `ope-pec-nas` abaixo).
  // TASK-CP-04 (contrato-frontend-compras-movimento.md §4.3) — limpeza
  // mandatória adicional: as 4 entradas `mov_purchase_*` foram REMOVIDAS
  // deste `anyOf` (Compras ganhou item de menu PRÓPRIO, `ope-pec-com`
  // abaixo, mirror exato da limpeza já aplicada para `mov_sale_*`).
  // ATUALIZAÇÃO (homologação do dono, 2026-08-24): `ope-pec-mov` deixou de
  // ser LEAF e passou a SUBGRUPO com único filho "Mortes" (`ope-pec-mor`,
  // `navigationTree.ts`) — limpeza adicional mandatória: as 9 entradas
  // remanescentes (`loss_animals_*`, `depreciation_animals_view`, e as 3
  // variantes `death_animals_create/edit/delete`) foram REMOVIDAS por não
  // corresponderem a nenhum filho real deste subgrupo (eram resíduo do
  // antigo placeholder morto).
  //
  // ATUALIZAÇÃO (homologação do dono, 2026-09-22): `navigationTree.ts` moveu
  // Nascimentos/Venda de Animais/Processamentos/Perdas/Compras (que eram
  // irmãos DIRETOS de "Pecuária") para DENTRO de "Movimentações", junto de
  // "Mortes" — o subgrupo agora tem 6 filhos. Mirror do padrão de subgrupo
  // já usado por "Transferências"/"Manejo" (`ope-pec-tra`/`ope-pec-man`: o
  // PAI mantém `anyOf` que cobre a(s) permissão(ões) de TODOS os filhos,
  // para não desaparecer enquanto qualquer filho estiver visível —
  // `pruneItems`, `useMenuModules.ts`, não deriva a visibilidade do pai a
  // partir dos filhos automaticamente). `anyOf` ampliado de 1 para 6
  // entradas — a permissão de VIEW de cada filho, na MESMA regra já usada
  // pela entrada própria do filho (`ope-pec-mor`/`ope-pec-nas`/
  // `ope-pec-ven`/`ope-pec-pro`/`ope-pec-per`/`ope-pec-com`, abaixo). Os
  // gates próprios dos 6 filhos permanecem INALTERADOS — só o `anyOf` do
  // PAI mudou.
  'ope-pec-mov': {
    anyOf: [
      'death_animals_view',
      'birth_animals_view',
      'mov_sale_view',
      'processing_view',
      'loss_animals_view',
      'mov_purchase_view',
    ],
  },
  // Nascimentos (TASK-NASC-FE-01, GAP-NASCIMENTOS-FE-02) — MOVIDO de item
  // próprio DIRETO de "Pecuária" para filho de "Movimentações"
  // (`ope-pec-mov`, homologação do dono, 2026-09-22, ver comentário do PAI
  // acima). Regra própria INALTERADA — permissão NOVA hifenizada
  // (`birth_animals_view`), DISTINTA da antiga `birth_animals_view`
  // (underscore) já removida do `anyOf` de `ope-pec-mov` anteriormente. O
  // PAI `ope-pec-mov` (acima) espelha esta mesma permissão em seu `anyOf`.
  'ope-pec-nas': { permission: 'birth_animals_view' },
  // Mortes (DeathAnimal, TASK-DA-FE-01, execução 049) — MOVIDO de filho
  // DIRETO de "Pecuária" para filho do subgrupo "Movimentações"
  // (`ope-pec-mov`, homologação do dono, 2026-08-24). Regra própria
  // INALTERADA (`death_animals_view`) — o PAI `ope-pec-mov` (acima) espelha
  // esta mesma permissão em seu `anyOf`, mesmo padrão de "Transferências →
  // Evolução/Rebanho" (`ope-pec-tra`/`ope-pec-tra-evo`).
  'ope-pec-mor': { permission: 'death_animals_view' },
  // Venda de Animais (TASK-VD-FE-01) — MOVIDO de item próprio DIRETO de
  // "Pecuária" para filho de "Movimentações" (`ope-pec-mov`, homologação do
  // dono, 2026-09-22, ver comentário do PAI acima). Regra própria
  // INALTERADA — o PAI `ope-pec-mov` (acima) espelha esta mesma permissão
  // em seu `anyOf`.
  'ope-pec-ven': { permission: 'mov_sale_view' },
  // Processamentos (correção de lacuna, execução 039) — MOVIDO de item
  // próprio DIRETO de "Pecuária" para filho de "Movimentações"
  // (`ope-pec-mov`, homologação do dono, 2026-09-22, ver comentário do PAI
  // acima). Regra própria INALTERADA — permissões canônicas reais do
  // backend (mesmas já presentes no `anyOf` de `ope-pec-man` abaixo, que
  // continua intocado — overlap intencional, mesmo padrão de
  // `ope-pec-tra`/`ope-pec-ven` acima). O PAI `ope-pec-mov` (acima) espelha
  // `processing_view` (a permissão de VIEW) em seu `anyOf`.
  'ope-pec-pro': { anyOf: ['processing_view', 'processing_create', 'processing_delete'] },
  // Compras (TASK-CP-04, contrato-frontend-compras-movimento.md §4.3) —
  // MOVIDO de item próprio DIRETO de "Pecuária" para filho de
  // "Movimentações" (`ope-pec-mov`, homologação do dono, 2026-09-22, ver
  // comentário do PAI acima). Regra própria INALTERADA — permissão REUSADA
  // `mov_purchase_view` (DEC-006, já existente no `permissionsCatalog.json`
  // e antes no `anyOf` de `ope-pec-mov`, removida anteriormente) — nenhuma
  // permissão nova cunhada. O PAI `ope-pec-mov` (acima) espelha esta mesma
  // permissão em seu `anyOf`.
  'ope-pec-com': { permission: 'mov_purchase_view' },
  // Perdas (F-043 Perdas/LossAnimal, execução 040) — MOVIDO de item próprio
  // DIRETO de "Pecuária" para filho de "Movimentações" (`ope-pec-mov`,
  // homologação do dono, 2026-09-22, ver comentário do PAI acima). Regra
  // própria INALTERADA — permissão `loss_animals_view`, já seedada no
  // backend (contrato de tela §4/§7). O PAI `ope-pec-mov` (acima) espelha
  // esta mesma permissão em seu `anyOf`.
  'ope-pec-per': { permission: 'loss_animals_view' },
  // `anyOf` reformatado para MULTI-LINHA (uma entrada de permissão por linha,
  // 97-Esteiras/005 Tarefa 24, `GAP-APARTACAO-FE-01`) — mesmo conteúdo do
  // array de uma linha só anterior, redução de risco de colisão de merge
  // para esta e futuras edições desta mesma chave (recomendação do Gap,
  // baixo custo, nenhuma mudança de comportamento). As 4 entradas
  // `separation_*` foram REMOVIDAS deste `anyOf` (limpeza mandatória do Gap —
  // ficam redundantes: a tela ganhou item PRÓPRIO `ope-pec-apa` abaixo,
  // gate `separation_view`). As demais ~49 entradas (incluindo
  // `bull-seed-season_*`, de responsabilidade da feature irmã
  // Touros/Sêmen/Embrião) permanecem INTOCADAS.
  'ope-pec-man': {
    anyOf: [
      'processing_view',
      'processing_create',
      'processing_delete',
      'weighing_view',
      'weighing_create',
      'weighing_edit',
      'weighing_delete',
      'weighing_stock',
      'nutrition_view',
      'nutrition_create',
      'nutrition_edit',
      'nutrition_delete',
      'sanitary_view',
      'sanitary_create',
      'sanitary_edit',
      'sanitary_delete',
      'weaning_view',
      'weaning_create',
      'weaning_edit',
      'weaning_delete',
      'find-animal_view',
      'find-animal_create',
      'find-animal_edit',
      'find-animal_delete',
      'pastures_view',
      'pastures_create',
      'pastures_edit',
      'pastures_delete',
      'advanced-reproductive_view',
      'breeding-seasons_view',
      'breeding-seasons_create',
      'breeding-seasons_edit',
      'breeding-seasons_delete',
      'breeding-batch_view',
      'breeding-batch_create',
      'breeding-batch_edit',
      'breeding-batch_delete',
      'bull-seed-season_view',
      'bull-seed-season_create',
      'bull-seed-season_edit',
      'bull-seed-season_delete',
      'protocols-season_view',
      'protocols-season_create',
      'protocols-season_edit',
      'protocols-season_delete',
      'breeding-matings_view',
      'breeding-matings_create',
      'breeding-matings_edit',
      'breeding-matings_delete',
      'pregnancy-diagnosis_view',
      'pregnancy-diagnosis_create',
      'pregnancy-diagnosis_edit',
      'pregnancy-diagnosis_delete',
    ],
  },
  // Item NOVO (97-Esteiras/005 Tarefa 24, `GAP-APARTACAO-FE-01`) — gate do
  // item PRÓPRIO `ope-pec-apa` (`navigationTree.ts`, grupo "Pecuária").
  // Permissão JÁ EXISTENTE no catálogo (`permissionsCatalog.json:852-855`,
  // sem hífen) — nenhum slug novo cunhado.
  'ope-pec-apa': { permission: 'separation_view' },
  // Manejo → Pastagem (Pasture, TASK-PAST-FE-08, execução 041) — gate do
  // FILHO recém-criado em navigationTree.ts (packet de homologação do dono,
  // 2026-08-19), mirror exato do padrão já usado por "Fábrica → Formulação/
  // Batida" (`adm-est-fab-for`/`adm-est-fab-bat`, acima): o PAI mantém o
  // `anyOf` amplo (já incluía `pastures_view`, linha acima), o FILHO recebe
  // sua permissão própria e exata, mesmo slug já usado nas rotas de leitura
  // de Pastagem (`RequirePermission permission="pastures_view"`,
  // router/index.tsx). Nenhum slug novo cunhado.
  'ope-pec-man-pas': { permission: 'pastures_view' },
  // Manejo → Desmama (Weaning, TASK-WN-FE-06, esteira 97-Esteiras/043) —
  // gate do FILHO novo em navigationTree.ts, mirror exato do padrão usado
  // por "Manejo → Pastagem" (`ope-pec-man-pas`, acima): o PAI mantém o
  // `anyOf` amplo (já incluía `weaning_view`), o FILHO recebe sua permissão
  // própria e exata, mesmo slug já usado nas rotas de Desmama
  // (`RequirePermission permission="weaning_view"`, router/index.tsx).
  // Nenhuma permissão nova cunhada.
  'ope-pec-man-des': { permission: 'weaning_view' },
  // Manejo → Localizar Animal (Find Animal, TASK-FA-FE-06, F-042,
  // contrato-tela-lane-a-find-animal-frontend.md §6.1/§9) — gate do FILHO
  // novo em navigationTree.ts, mirror exato do padrão usado por "Manejo →
  // Desmama" (`ope-pec-man-des`, acima): o PAI mantém o `anyOf` amplo (já
  // incluía `find-animal_view`, ver bloco `ope-pec-man` acima), o FILHO
  // recebe sua permissão própria e exata, mesmo slug já usado na rota
  // (`RequirePermission permission="find-animal_view"`, router/index.tsx).
  // Nenhuma permissão nova cunhada — os 4 slugs `find-animal_*` já constam
  // em `permissionsCatalog.json` (linhas 429-432), arquivo NÃO tocado.
  'ope-pec-man-loc': { permission: 'find-animal_view' },
  // Manejo → Sanitário (Sanitary, TASK-SAN-FE-09, F-062, contrato-tela-
  // lane-c-sanitario-frontend.md §9) — gate do FILHO novo em
  // navigationTree.ts, mirror exato do padrão usado por "Manejo →
  // Localizar Animal" (`ope-pec-man-loc`, acima): o PAI mantém o `anyOf`
  // amplo (já incluía `sanitary_view/create/edit/delete`, ver bloco
  // `ope-pec-man` acima), o FILHO recebe sua permissão própria e exata,
  // mesmo slug já usado nas rotas de leitura de Sanitário
  // (`RequirePermission permission="sanitary_view"`, router/index.tsx).
  // Nenhum slug novo cunhado — os 4 `sanitary_*` já constam em
  // `permissionsCatalog.json` (linhas 849-852), arquivo NÃO tocado.
  'ope-pec-man-san': { permission: 'sanitary_view' },
  // Manejo → Pesagem (Weighing, TASK-PES-FE-08, F-071, contrato-tela-
  // lane-c-pesagem-frontend.md §9) — gate do FILHO novo em
  // navigationTree.ts, mirror exato do padrão usado por "Manejo →
  // Sanitário" (`ope-pec-man-san`, acima): o PAI mantém o `anyOf` amplo
  // (já incluía `weighing_view/create/edit/delete/stock`, L510-514 do
  // bloco `ope-pec-man` acima), o FILHO recebe sua permissão própria e
  // exata, mesmo slug já usado nas rotas de leitura de Pesagem
  // (`RequirePermission permission="weighing_view"`, router/index.tsx).
  // Nenhum slug novo cunhado — os 5 `weighing_*` já constam em
  // `permissionsCatalog.json` (linhas 1001-1008). Arquivo NÃO tocado.
  'ope-pec-man-pes': { permission: 'weighing_view' },
  // Manejo → Nutrição (Nutrition, F-050, esteira 066, TASK-NT-FE-02) — gate
  // do FILHO novo em navigationTree.ts, mirror exato do padrão usado por
  // "Manejo → Pesagem" (`ope-pec-man-pes`, acima): o PAI mantém o `anyOf`
  // amplo (já incluía `nutrition_view/create/edit/delete`, bloco
  // `ope-pec-man` acima), o FILHO recebe sua permissão própria e exata,
  // mesmo slug já usado na rota real (`RequirePermission
  // permission="nutrition_view"`, router/index.tsx). Nenhum slug novo
  // cunhado — os 4 `nutrition_*` já constam no catálogo real.
  'ope-pec-man-nut': { permission: 'nutrition_view' },
  'ope-pec-rep': {
    anyOf: [
      'advanced-reproductive_view',
      'breeding-seasons_view',
      'breeding-seasons_create',
      'breeding-seasons_edit',
      'breeding-seasons_delete',
      'breeding-batch_view',
      'breeding-batch_create',
      'breeding-batch_edit',
      'breeding-batch_delete',
      'bull-seed-season_view',
      'bull-seed-season_create',
      'bull-seed-season_edit',
      'bull-seed-season_delete',
      'protocols-season_view',
      'protocols-season_create',
      'protocols-season_edit',
      'protocols-season_delete',
      'breeding-matings_view',
      'breeding-matings_create',
      'breeding-matings_edit',
      'breeding-matings_delete',
      'pregnancy-diagnosis_view',
      'pregnancy-diagnosis_create',
      'pregnancy-diagnosis_edit',
      'pregnancy-diagnosis_delete',
    ],
  },
  // Reprodução → Touros/Sêmen/Embrião (BullSeedSeason, 97-Esteiras/005
  // Tarefa 24, `GAP-BSS-FE-01`) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror exato do padrão já usado por "Manejo →
  // Pastagem" (`ope-pec-man-pas`, acima): o PAI mantém o `anyOf` amplo (já
  // inclui `bull-seed-season_view`, linha acima), o FILHO recebe sua
  // permissão própria e exata. Nenhum slug novo cunhado.
  // Reprodução → Estação de Monta (BreedingSeason, reportado pelo dono —
  // item ausente no submenu) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror exato do padrão já usado pelos filhos
  // irmãos: o PAI mantém o `anyOf` amplo (já inclui `breeding-seasons_view`,
  // linha 430), o FILHO recebe sua permissão própria e exata — mesmo slug
  // já usado na rota-raiz `/operacional/reproducao`
  // (`RequirePermission permission="breeding-seasons_view"`,
  // router/index.tsx). Nenhum slug novo cunhado.
  'ope-pec-rep-bs': { permission: 'breeding-seasons_view' },
  'ope-pec-rep-bss': { permission: 'bull-seed-season_view' },
  // Reprodução → Lotes/Reprodução (BreedingBatch, 97-Esteiras/048 Tarefa 07,
  // contrato de tela §2) — gate do FILHO recém-criado em navigationTree.ts,
  // mirror exato do padrão já usado por "Reprodução → Touros/Sêmen/Embrião"
  // (`ope-pec-rep-bss`, acima): o PAI mantém o `anyOf` amplo (já inclui
  // `breeding-batch_view/create/edit/delete`, linha 362-365), o FILHO
  // recebe sua permissão própria e exata. Nenhum slug novo cunhado.
  'ope-pec-rep-lb': { permission: 'breeding-batch_view' },
  // Reprodução → Acasalamento (BreedingMating, TASK-BM-FE-09, contrato-tela-
  // lane-b-breeding-mating-frontend.md §3/§9) — gate do FILHO recém-criado
  // em navigationTree.ts, mirror exato do padrão já usado por "Reprodução →
  // Lotes/Reprodução" (`ope-pec-rep-lb`, acima): o PAI mantém o `anyOf`
  // amplo (já inclui `breeding-matings_view/create/edit/delete`, acima), o
  // FILHO recebe sua permissão própria e exata — mesmo slug já usado nas
  // rotas de Acasalamento (`RequirePermission permission=
  // "breeding-matings_view"`, router/index.tsx). Nenhum slug novo cunhado.
  // Diagnóstico de Gestação NÃO tem item de menu próprio (OWN-DEC-001) —
  // sem regra de permissão de menu correspondente aqui.
  'ope-pec-rep-bm': { permission: 'breeding-matings_view' },
  // Reprodução → Protocolos/Estação (ProtocolSeason, F-057, execução 040,
  // contrato de tela §4.7) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror exato do padrão já usado por "Reprodução →
  // Lotes/Reprodução" (`ope-pec-rep-lb`, acima): o PAI mantém o `anyOf`
  // amplo (já inclui `protocols-season_view/create/edit/delete`, linha
  // acima), o FILHO recebe sua permissão própria e exata. Nenhum slug novo
  // cunhado.
  'ope-pec-rep-pse': { permission: 'protocols-season_view' },
  // Reprodução → Gerenciamento Avançado (AdvancedReproductive, F-011,
  // 97-Esteiras/056 TASK-AR-FE-03) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror exato do padrão já usado por "Reprodução →
  // Touros/Sêmen/Embrião"/"Reprodução → Lotes/Reprodução" (acima): o PAI
  // `ope-pec-rep` mantém o `anyOf` amplo (já inclui
  // `advanced-reproductive_view`, linha 486/537, reuso DEC-006), o FILHO
  // recebe sua permissão própria e exata. Nenhum slug novo cunhado.
  'ope-pec-rep-adv': { permission: 'advanced-reproductive_view' },
  // Transferências → Transferência ABC (TransferAbcBatch, correção de bug de
  // menu, Execução 041, packet do Maestro, 2026-08-25) — gate do FILHO
  // recém-criado em navigationTree.ts (a lista ABC estava órfã: o PAI
  // `ope-pec-tra` virou grupo ao ganhar filhos e `SecondaryNav.tsx` nunca
  // navega ao `path` de um nó com `children`). Mirror exato do padrão dos
  // irmãos `ope-pec-tra-evo`/`ope-pec-tra-anl`/`ope-pec-tra-lf` abaixo: o PAI
  // `ope-pec-tra` já mantém `transfer_abc_batch_view` no `anyOf` (linha 395),
  // o FILHO recebe essa mesma permissão. Nenhum slug novo cunhado.
  'ope-pec-tra-abc': { permission: 'transfer_abc_batch_view' },
  // Transferências → Evolução/Rebanho (Evolution, Tarefa 26,
  // spa-contract-evolucao-rebanho.md §3.1) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror exato do padrão já usado por "Manejo →
  // Pastagem"/"Reprodução → Touros" (acima): o PAI `ope-pec-tra` mantém o
  // `anyOf` amplo (já inclui `evolutions_view`, linha 288), o FILHO recebe
  // sua permissão própria e exata. Nenhum slug novo cunhado.
  'ope-pec-tra-evo': { permission: 'evolutions_view' },
  // Transferências → Transferência Animais/Lote (BatchTransfer, feature
  // `426be835`, TASK-LOTE-FE-01) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror exato do padrão do irmão `ope-pec-tra-evo`
  // acima: o PAI `ope-pec-tra` mantém o `anyOf` amplo (já inclui
  // `transference_animal_batch`, linha 288), o FILHO recebe sua permissão
  // própria e exata. Nenhum slug novo cunhado.
  'ope-pec-tra-anl': { permission: 'transference_animal_batch' },
  // Transferências → Lote/Fazenda (TransferBatchFarm, 97-Esteiras/041,
  // TASK-FE-041-LF-01) — gate do FILHO recém-criado em navigationTree.ts,
  // mirror exato do padrão dos irmãos `ope-pec-tra-evo`/`ope-pec-tra-anl`
  // acima: o PAI `ope-pec-tra` mantém o `anyOf` amplo (já inclui
  // `transfer_batch_farms_view`, linha 288+), o FILHO recebe sua permissão
  // própria e exata.
  'ope-pec-tra-lf': { permission: 'transfer_batch_farms_view' },
  // Transferências → Agrupar Lotes (GrouperBatch, execução 042,
  // TASK-FE-042-306) — gate do FILHO recém-criado em navigationTree.ts,
  // mirror exato do padrão dos irmãos `ope-pec-tra-evo`/`ope-pec-tra-anl`/
  // `ope-pec-tra-lf` acima: o PAI `ope-pec-tra` mantém o `anyOf` amplo (já
  // inclui `grouper_batches`, linha 391), o FILHO recebe sua permissão
  // própria e exata.
  'ope-pec-tra-ag': { permission: 'grouper_batches' },
  // Transferências → Animal/Fazenda (TransferAnimalFarm, 97-Esteiras/042,
  // TASK-FE-042-102) — gate do FILHO recém-criado em navigationTree.ts,
  // mirror exato do padrão do irmão `ope-pec-tra-lf` acima: o PAI
  // `ope-pec-tra` mantém o `anyOf` amplo (já inclui
  // `transfer_animal_farms_view`, adicionado acima), o FILHO recebe sua
  // permissão própria e exata.
  'ope-pec-tra-af': { permission: 'transfer_animal_farms_view' },
  // Lote/Módulo/Área (BatchModuleAreaTransfer, 97-Esteiras/070,
  // TASK-LMA-FE-02) — mirror exato do padrão dos irmãos `ope-pec-tra-lf`/
  // `ope-pec-tra-af` acima: o PAI `ope-pec-tra` mantém o `anyOf` amplo (já
  // inclui `batch_module_area_transfers_view`/`_create`, ver acima).
  'ope-pec-tra-lma': { permission: 'batch_module_area_transfers_view' },
  // Confinamento (pedido do dono, homologação Dieta, 2026-08-20) — id
  // RENOMEADO de `ope-pec-die` para `ope-pec-conf` (mirror do item de menu
  // fundido em `navigationTree.ts`, ver comentário lá sobre a limitação de
  // profundidade do renderer). Regra INALTERADA (mesma `anyOf`, só a chave
  // mudou de nome) — decide se o item aparece a partir de QUALQUER
  // permissão de Dietas/Batidas.
  'ope-pec-conf': {
    anyOf: [
      'diets_view',
      'diets_create',
      'diets_edit',
      'diets_delete',
      'diet-beats_view',
      'diet-beats_create',
      'diet-beats_edit',
      'diet-beats_delete',
      // Pátios (FeedlotYard, TASK-PT-FE-01, execução 046) — o PAI precisa
      // incluir `feedlot-yards_view` para não ficar oculto a um usuário que
      // só tem permissão de Pátios (contrato de tela §4).
      'feedlot-yards_view',
      // Setores (FeedlotSector, TASK-FS-FE-01) — idem, para não ficar
      // oculto a um usuário que só tem permissão de Setores.
      'feedlot-sectors_view',
      // Currais (FeedlotCorral, MANUTENÇÃO FRONT — item de menu NOVO
      // `ope-pec-die-cur` em navigationTree.ts) — idem, para não ficar
      // oculto a um usuário que só tem permissão de Currais.
      'feedlot-corrals_view',
      // Mapa de Confinamento (FeedlotMap, TASK-FE-042-200, execução 042) —
      // idem, para não ficar oculto a um usuário que só tem permissão do
      // Mapa.
      'feedlot-map_view',
      // Fases de Alimentação (FeedingPhase, F-034, TASK-FP-FE-04) — idem,
      // para não ficar oculto a um usuário que só tem permissão de Fases de
      // Alimentação.
      'feeding-phases_view',
      'feeding-phases_create',
      'feeding-phases_edit',
      'feeding-phases_delete',
    ],
  },
  // Confinamento → Dietas / Confinamento → Batidas (TASK-FE-DIET-07, mirror
  // EXATO `adm-est-fab-for`/`adm-est-fab-bat`): gate de cada FILHO-FOLHA,
  // ids/permissões INALTERADOS (Dietas: `diets_view`; Batidas:
  // `diet-beats_view`) — a fusão de nível só afetou o PAI, nunca as folhas.
  'ope-pec-die-die': { permission: 'diets_view' },
  'ope-pec-die-bat': { permission: 'diet-beats_view' },
  // Confinamento → Pátios (FeedlotYard, TASK-PT-FE-01, execução 046) — mirror
  // exato de `ope-pec-die-die` (gate do FILHO-FOLHA).
  'ope-pec-die-pat': { permission: 'feedlot-yards_view' },
  // Confinamento → Setores (FeedlotSector, TASK-FS-FE-01) — mirror exato de
  // `ope-pec-die-pat` (gate do FILHO-FOLHA).
  'ope-pec-die-set': { permission: 'feedlot-sectors_view' },
  // Confinamento → Currais (FeedlotCorral, MANUTENÇÃO FRONT) — mirror exato
  // de `ope-pec-die-set` (gate do FILHO-FOLHA), mesma permissão já usada na
  // rota real (`RequirePermission permission="feedlot-corrals_view"`,
  // router/index.tsx). Nenhum slug novo cunhado.
  'ope-pec-die-cur': { permission: 'feedlot-corrals_view' },
  // Confinamento → Mapa de Confinamento (FeedlotMap, TASK-FE-042-200,
  // execução 042) — mirror exato de `ope-pec-die-set` (gate do FILHO-FOLHA).
  'ope-pec-mapa': { permission: 'feedlot-map_view' },
  // Confinamento → Fases de Alimentação (FeedingPhase, F-034, TASK-FP-FE-04)
  // — mirror exato de `ope-pec-die-set` (gate do FILHO-FOLHA).
  'ope-pec-die-fas': { permission: 'feeding-phases_view' },
  'ope-plu': { permission: 'rainfall_view' },
  'ope-ven-orc': { permission: 'budgets_view' },
  'ope-ven-ped': { permission: 'orders_view' },
  'ope-ven-ven': { permission: 'sales_view' },
  'ope-os-min': { permission: 'my-service-orders_view' },
  'ope-os-lis': { permission: 'service-orders_view' },
  'ope-os-mon': { permission: 'monitoring-service-orders_view' },
  'ope-os-ava': { permission: 'rating-service-orders_view' },
  'fin-pag': { permission: 'expenses_view' },
  'fin-rec': { permission: 'incomes_view' },
  'fin-cai': { permission: 'movements_view' },
  'fin-flu': { permission: 'cashflow_view' },
  'fin-con': { permission: 'contracts_view' },
  'fin-pre': { permission: 'budget-plannings_view' },
  'fin-cng': { permission: 'financial-freeze_view' },
  'fin-imp': { permission: 'movement-sheets_view' },
  'fin-mp': { permission: 'finan_view' },
  'fin-cnc-ofx': { permission: 'import_ofx_view' },
  'fin-cnc-mes': { permission: 'import_ofx' },
  'fro-man': { permission: 'maintenances_view' },
  'fro-aba': { permission: 'appropriation-supplies_view' },
  'fro-pre': { permission: 'maintenance-preventives_view' },
  'fro-rev': { permission: 'scheduled-reviews_view' },
  'fro-tra': { permission: 'equipment-transfer_view' },
  'fis-nfe-emi': { permission: 'nfe_view' },
  'fis-nfe-xml': { permission: 'xml_view' },
  'fis-nfe-dfe': { permission: 'dfe_fiscal_view' },
  'fis-cte-lis': { permission: 'cte_view' },
  'fis-cte-nov': { permission: 'cte_create' },
  'fis-cte-man': { permission: 'cte_manifest' },
  'fis-mdf-lis': { permission: 'mdfe_view' },
  'fis-mdf-nov': { permission: 'mdfe_create' },
  'fis-lcd': { permission: 'cash-book_view' },
  'fis-par': { permission: 'double-entry-accountings_view' },
  'rel-ben': { anyOf: ['equipments_report', 'accumulateddepreciationreport_view'] },
  // Relatórios → Bens / Ativo → Inventário Patrimonial (F-260, TASK-INV-FE-02,
  // esteira 075) — gate do FILHO recém-criado em navigationTree.ts, mirror
  // EXATO do gate já aplicado a `rel-agr-apo` (permissão específica do
  // Controller, já contida no `anyOf` amplo do pai `rel-ben` acima).
  'rel-ben-inventario': { permission: 'equipments_report' },
  // Depreciação Acumulada (F-216, execução 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-ben-inventario` acima.
  // `accumulateddepreciationreport_view` já está no `anyOf` de `rel-ben`
  // (acima) — nenhuma edição lá.
  'rel-ben-depreciacao-acumulada': { permission: 'accumulateddepreciationreport_view' },
  'rel-agr': {
    anyOf: [
      'transfers_view',
      'prod_employee_view',
      'prod_area_view',
      'cost_area_view',
      'production_cost_area_view',
      'markings_prev_area_view',
      'markings_prev_farm_view',
      'charge_week_report',
      'charge_product_report',
      'planning_area_report',
      'markings_report',
      'agriculture-application-management-report_view',
      'appropriation-occurrences-report_view',
      'module-weighings_report',
      'discards_report',
      'appropriation_equipments_report',
      'transfer_difference_report',
      'profitability-by-crop_report',
      'weighing-harvest_report',
      'transfer-sales-contract_report',
      'weighing-in-out_report',
      'weighing-stock-client_report',
      'harvest-products_report',
      'transfers_view',
    ],
  },
  // Relatórios → Agricultura → Apontamento Máquina (Tarefa 46, frontend-
  // contract-apontamento-maquina.md §2) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror EXATO do gate já aplicado a `rel-pec-evo`
  // (`appropriation_equipments_report`, já no `anyOf` do pai `rel-agr`
  // acima). Diferente de `rel-pec-evo`, a ROTA de destino (`/relatorios/
  // agricultura/apontamento-maquina`) TAMBÉM é gateada — a API corrigiu a
  // autorização por construção (`GAP-APONT-01`), então o front replica o
  // guard tanto no menu quanto na rota (ver router/index.tsx).
  'rel-agr-apo': { permission: 'appropriation_equipments_report' },
  // Relatórios → Agricultura → Ocorrências Talhões (F-232, Tarefa 50, esteira
  // CORE_WORKSPACE/97-Esteiras/015) — gate do FILHO recém-criado em
  // navigationTree.ts (`rel-agr-ocor`), mirror EXATO do gate já aplicado a
  // `rel-agr-apo` acima (`appropriation-occurrences-report_view`, já contida
  // no `anyOf` amplo do pai `rel-agr` acima — nenhuma edição lá). Rota
  // TAMBÉM gateada (router/index.tsx) — a API corrigiu a autorização por
  // construção (FID-G3A #1 da API).
  'rel-agr-ocor': { permission: 'appropriation-occurrences-report_view' },
  // Relatórios → Agricultura → Prev. Área/Receita (F-280, TASK-MFA-FE-03,
  // esteira 075) — gate do FILHO recém-criado em navigationTree.ts, mirror
  // EXATO do gate já aplicado a `rel-agr-apo` (permissão específica do
  // Controller, `markings_prev_area_view`, já contida no `anyOf` amplo do
  // pai `rel-agr` acima). Rota TAMBÉM gateada (router/index.tsx) — a API
  // corrige a autorização por construção (`CL-05`).
  'rel-agr-prev': { permission: 'markings_prev_area_view' },
  // Relatórios → Agricultura → Pesagem Rodoviária (F-284, ajuste do lote
  // 075) — gate do FILHO recém-criado em navigationTree.ts, mirror EXATO
  // do gate já aplicado a `rel-agr-prev` (permissão específica do
  // Controller, `module-weighings_report`, já contida no `anyOf` amplo do
  // pai `rel-agr` acima). Rota TAMBÉM gateada (router/index.tsx) — mesma
  // permissão já usada para gatear a tela em Operacional.
  'rel-agr-pesagem-rodoviaria': { permission: 'module-weighings_report' },
  // Relatórios → Agricultura → Descarte Romaneio (F-256, esteira
  // 97-Esteiras/078, F-256-plano-frontend.md) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-agr-pesagem-rodoviaria` acima.
  // `discards_report` já está no `anyOf` de `rel-agr` (linhas acima) — NÃO
  // duplicar. A ROTA de destino
  // (`/relatorios/agricultura/descarte-romaneio`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx), mirror do slug server-side
  // (`DiscardsReportController`, `permission:discards_report`).
  'rel-agr-descarte-romaneio': { permission: 'discards_report' },
  // Relatórios → Agricultura → Produção/Custeio/Área (F-298, esteira 051,
  // TASK-298-FE-03) — gate do FILHO recém-criado em navigationTree.ts,
  // mirror EXATO do gate `rel-agr-apo` acima (`production_cost_area_view`,
  // já no `anyOf` do pai `rel-agr`). A ROTA de destino (`/relatorios/
  // agricultura/producao-custeio-area`) TAMBÉM é gateada — a API corrigiu a
  // autorização por construção (C-09), então o front replica o guard tanto
  // no menu quanto na rota (ver router/index.tsx).
  'rel-agr-pca': { permission: 'production_cost_area_view' },
  // Relatórios → Agricultura → Custeio/Área (F-252, lote 079,
  // F-252-plano-frontend.md TASK-252-FE-03) — gate do FILHO recém-criado em
  // navigationTree.ts (`rel-agr-cus`), mirror EXATO do gate `rel-agr-pca`
  // acima. `cost_area_view` já está no `anyOf` do pai `rel-agr` (linha
  // ~896) — NÃO duplicar. A ROTA de destino
  // (`/relatorios/agricultura/custeio-area`) TAMBÉM é gateada — correção
  // por construção do CLM-016 (legado só gateava o menu, ver router/
  // index.tsx).
  'rel-agr-cus': { permission: 'cost_area_view' },
  // Relatórios → Agricultura → Prod./Área (F-299, 97-Esteiras/012,
  // Tarefa 47, frontend-contract-prod-area.md §2.1) — gate do FILHO
  // recém-criado em navigationTree.ts (`rel-agr-pro`), mirror EXATO do
  // gate já aplicado a `rel-agr-apo` acima. `prod_area_view` já está no
  // `anyOf` do pai `rel-agr` — não duplicar. ROTA de destino
  // (`/relatorios/agricultura/producao-por-area`) TAMBÉM é gateada (ver
  // router/index.tsx) — dupla barreira decidida pelo Arquiteto de API
  // (`C-08`, contrato de API §11).
  'rel-agr-pro': { permission: 'prod_area_view' },
  // Relatórios → Agricultura → Pesagens/Colheita (F-335, execução 053,
  // roteiro-front-F335-pesagens-colheita.md) — gate do FILHO recém-criado
  // em navigationTree.ts (`rel-agr-pes`), mirror EXATO do gate já aplicado
  // a `rel-agr-pro` acima. `weighing-harvest_report` já está no `anyOf` do
  // pai `rel-agr` (linha acima, `PermissionTree.php:3090-3093`) — não
  // duplicar. ROTA de destino (`/relatorios/agricultura/pesagens-colheita`)
  // TAMBÉM é gateada (ver router/index.tsx) — dupla barreira
  // (Controller + Request).
  'rel-agr-pes': { permission: 'weighing-harvest_report' },
  // Relatórios → Agricultura → Romaneio/Vendas/Contrato (F-331,
  // 97-Esteiras/008, TASK-RVC-FE-02) — gate do FILHO recém-criado em
  // navigationTree.ts (`rel-agr-rvc`), mirror EXATO do gate já aplicado a
  // `rel-agr-pes` acima. `transfer-sales-contract_report` JÁ está no `anyOf`
  // do pai `rel-agr` (linha 912 acima, reservado desde antes desta
  // feature) — NÃO duplicar/editar o `anyOf`. ROTA de destino
  // (`/relatorios/agricultura/romaneio-vendas-contrato`) TAMBÉM é gateada
  // (ver router/index.tsx) — dupla barreira real (HasMiddleware +
  // authorize() do Request).
  'rel-agr-rvc': { permission: 'transfer-sales-contract_report' },
  // Previsão Fazenda/Receita (F-281, esteira 97-Esteiras/055) — gate do
  // FILHO recém-criado em navigationTree.ts (`rel-agr-pfr`), mirror EXATO
  // do gate já aplicado a `rel-agr-pes` acima. `markings_prev_farm_view`
  // já está no `anyOf` do pai `rel-agr` acima — não duplicar. ROTA de
  // destino (`/relatorios/agricultura/previsao-fazenda-receita`) TAMBÉM é
  // gateada (ver router/index.tsx) — dupla barreira (Controller + Request).
  'rel-agr-pfr': { permission: 'markings_prev_farm_view' },
  // Relatórios → Agricultura → Romaneio Cliente (F-332, esteira
  // 97-Esteiras/058, FRONT-F332-plano.md §2.1) — gate do FILHO recém-criado
  // em navigationTree.ts (`rel-agr-romaneio-cliente`), mirror EXATO do gate
  // já aplicado a `rel-agr-pfr` acima. `transfers_view` é
  // permissão NOVA dedicada (D-058-07, GAP-058-F332-01 — ainda NÃO wireada
  // no backend nesta sessão, fail-closed esperado até o Maestro concluir o
  // wiring), distinta de `transfers_view` (CRUD "Romaneios") — já incluída
  // no `anyOf` do pai `rel-agr` acima. ROTA de destino
  // (`/relatorios/agricultura/romaneio-cliente`) TAMBÉM é gateada (ver
  // router/index.tsx) — dupla barreira.
  'rel-agr-romaneio-cliente': { permission: 'transfers_view' },
  // Relatórios → Agricultura → Pesagem Entrada/Saída (F-336, esteira
  // 97-Esteiras/058, FRONT-F336-plano.md §2.1) — gate do FILHO recém-criado
  // em navigationTree.ts (`rel-agr-pesagem-entrada-saida`), mirror EXATO do
  // gate já aplicado a `rel-agr-romaneio-cliente` acima.
  // `weighing-in-out_report` já está no `anyOf` do pai `rel-agr` acima — não
  // duplicar. ROTA de destino (`/relatorios/agricultura/pesagem-entrada-
  // saida`) TAMBÉM é gateada (ver router/index.tsx) — dupla barreira.
  'rel-agr-pesagem-entrada-saida': { permission: 'weighing-in-out_report' },
  // Relatórios → Agricultura → Rentabilidade/Cultura (F-302, esteira 077,
  // F-302-plano-front.md §6) — gate do FILHO recém-criado em
  // navigationTree.ts (`rel-agr-ren`), mirror EXATO do gate já aplicado a
  // `rel-agr-pfr` acima. `profitability-by-crop_report` já está no `anyOf`
  // do pai `rel-agr` acima (linha 910) — não duplicar. ROTA de destino
  // (`/relatorios/agricultura/rentabilidade-cultura`) TAMBÉM é gateada (ver
  // router/index.tsx) — a API fecha o gap de enforcement do legado.
  'rel-agr-ren': { permission: 'profitability-by-crop_report' },
  // Relatórios → Agricultura → Romaneio/Diferença (Tarefa 49, esteira
  // 97-Esteiras/014) — gate do FILHO recém-criado em navigationTree.ts
  // (`rel-agr-rom-dif`), mirror EXATO do gate já aplicado a `rel-agr-ren`
  // acima. `transfer_difference_report` já está no `anyOf` do pai
  // `rel-agr` acima — não duplicar. ROTA de destino
  // (`/relatorios/agricultura/romaneio-diferenca`) NÃO é gateada
  // (`GAP-RMD-02`/`DEC-043`, preservado AS-IS por decisão do dono — mirror
  // `rel-pec-evo`/`GAP-EVO-01`, ver router/index.tsx) — só o item de MENU
  // fica gateado aqui.
  'rel-agr-rom-dif': { permission: 'transfer_difference_report' },
  // Relatórios → Agricultura → Prod./Colaborador (F-300, esteira 079,
  // F-300-plano-frontend.md TASK-300-FE-03) — gate do FILHO recém-criado em
  // navigationTree.ts (`rel-agr-poc`), mirror EXATO do gate já aplicado a
  // `rel-agr-pca` (F-298). `prod_employee_view` já está no `anyOf` do pai
  // `rel-agr` acima — não duplicar. ROTA de destino
  // (`/relatorios/agricultura/producao-colaborador`) TAMBÉM é gateada (ver
  // router/index.tsx) — a API fecha o gap de enforcement do legado
  // (correção por construção C-09/C20-C22 do contrato legado).
  'rel-agr-poc': { permission: 'prod_employee_view' },
  // Previsão Colheita/Área (F-282, esteira 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO dos irmãos acima. MESMA permissão de
  // `rel-agr-pfr` — já no `anyOf` de `rel-agr` (acima), nenhuma edição lá.
  'rel-agr-prev-colheita-area': { permission: 'markings_prev_farm_view' },
  // Aplicação/Manejo Talhões (F-220, execução 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO dos irmãos acima.
  // `agriculture-application-management-report_view` já está no `anyOf` de
  // `rel-agr` (acima) — nenhuma edição lá.
  'rel-agr-aplicacao-manejo-talhoes': {
    permission: 'agriculture-application-management-report_view',
  },

  'rel-pec': {
    anyOf: [
      'herd-composition-report_view',
      'cust-area-pec-report_view',
      'weighing-batch-report_view',
      'accumulated-weighing-batch-report_view',
      'feedlot-weighing-performance-report_view',
      // CORRIGIDO (F-288 "Nutrição Consumo/Lote", esteira 97-Esteiras/053,
      // TASK-288-FE-01, roteiro-front-F288-nutricao.md §"Menu/Rota/
      // Permissão"): a entrada 'nutrition_report' era STALE — permissão
      // renomeada no backend pela migration
      // `2026_09_06_100000_rename_nutrition_report_permission_to_consumption_report_view.php`
      // (commit `d7e5d3ddd`). Slug real: 'nutrition-consumption-report_view'
      // (cobre os 2 endpoints do `NutritionConsumptionReportController`,
      // `options`+`__invoke`). Não confundir com 'nutrition_view'
      // (`ope-pec-man-nut`, linha 659 — CRUD de lançamento de nutrição,
      // NÃO renomeada, intocada).
      'nutrition-consumption-report_view',
      'sanitaries-batch-report_view',
      'management-batch-report_view',
      'category-animal-report_view',
      'transfer-batch-module-area-report_view',
      'animals-report_view',
      'application-management-report_view',
      'animal-movements-report_view',
      'weaning-report_view',
      'birth-report_view',
      'death-animals-report_view',
      'animal-record-report_view',
      // TROCADO (Tarefa 46, frontend-contract-vacas-prenhas.md §2.1,
      // `GAP-VACAS-01`): 'pregnant-cows-report_view' NUNCA foi seedada no
      // backend novo (confirmado por grep em GB.Cerne.Api-vacas-prenhas) —
      // deixaria o item eternamente invisível. Permissão REAL exigida pelo
      // endpoint (`pregnancy-diagnosis_view`), já viva em outros 2 nós deste
      // arquivo (linhas 591/683) — não duplica o `anyOf` deste grupo.
      'pregnancy-diagnosis_view',
      'animals-sales-report_view',
      'evolution-animal-report_view',
      'identification-animals-sisbovs-report_view',
      'death-animals-sisbovs-report_view',
      'birth-animals-sisbovs-report_view',
      'abc_indicators_report_view',
      'costing-batch-report_view',
      'costing-grazing-report_view',
      'costing-animal-report_view',
      'total-cost-of-reproduction-report_view',
      'batch-profitability-report_view',
      'reproductive-history-report_view',
      'animal-family-tree-report_view',
      'bull-reproductive-efficiency-report_view',
      'animal-movement-analysis-report_view',
      'receiver-cow-productivity-report_view',
      'animals-per-batch-report_view',
      'animal-batch-history-report_view',
      'feedlot-batch-control-report_view',
      'feedlot-planned-consumption-report_view',
      'feedlot-summary-activity-report_view',
    ],
  },
  // Relatórios → Pecuária → Evolução/Rebanho (Tarefa 27,
  // spa-contract-evolucao-rebanho.md §3.2, `GAP-EVO-FE-04`) — gate do FILHO
  // recém-criado em navigationTree.ts, mirror EXATO do gate que o próprio
  // legado aplicava no MENU (`evolution-animal-report_view`, já no `anyOf`
  // do pai `rel-pec` acima). A ROTA de destino (`/relatorios/pecuaria/
  // evolucao-rebanho`) fica SEM `RequirePermission` — decisão do dono
  // preservando `GAP-EVO-01` (endpoint sem permissão no backend); só o
  // item de MENU é gateado, mirror do legado.
  'rel-pec-evo': { permission: 'evolution-animal-report_view' },
  // Relatórios → Pecuária → Vacas Prenhas (Tarefa 46,
  // frontend-contract-vacas-prenhas.md §2.1/§2.2, `GAP-VACAS-01`) — gate do
  // FILHO `rel-pec-vac` (navigationTree.ts), mirror EXATO do gate do irmão
  // `rel-pec-evo` acima. Diferente daquele (rota aberta de propósito por
  // GAP-EVO-01), a ROTA desta feature também é gateada nesta MESMA
  // permissão real (ver src/router/index.tsx) — o backend fechou RBAC real.
  'rel-pec-vac': { permission: 'pregnancy-diagnosis_view' },
  // Relatórios → Pecuária → Performance Animal (F-234, TASK-FE-PA-01,
  // Tarefa 57) — gate do FILHO `rel-pec-pfa` (navigationTree.ts), mirror
  // EXATO do gate do irmão `rel-pec-evo` acima. `batch-profitability-
  // report_view` JÁ estava presente no `anyOf` do pai `rel-pec` (linha 958)
  // antes desta Tarefa — nenhuma alteração naquele array foi necessária.
  // A ROTA de destino (`/relatorios/pecuaria/performance-animal`) fica SEM
  // `RequirePermission` (decisão do dono, `DEC-DOM-19` — endpoint sem
  // permissão no backend, mirror `GAP-EVO-01`); só o item de MENU é
  // gateado, mirror do legado (ver src/router/index.tsx).
  'rel-pec-pfa': { permission: 'batch-profitability-report_view' },
  // Relatórios → Pecuária → Manejo/Lote (F-279, esteira 051, TASK-279-FE-03)
  // — gate do FILHO recém-criado em navigationTree.ts, mirror EXATO do gate
  // `rel-pec-vac` acima (`management-batch-report_view`, já no `anyOf` do
  // pai `rel-pec`). A ROTA de destino (`/relatorios/pecuaria/manejo-lote`)
  // TAMBÉM é gateada — a API corrigiu a autorização por construção
  // (SR-06/OQ-01), então o front replica o guard tanto no menu quanto na
  // rota (ver router/index.tsx).
  'rel-pec-man': { permission: 'management-batch-report_view' },
  // Relatórios → Pecuária → Pesagem/Lote (Tarefa 49, esteira
  // CORE_WORKSPACE/97-Esteiras/014) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror EXATO do gate `rel-pec-man` acima
  // (`accumulated-weighing-batch-report_view`, já no `anyOf` do pai
  // `rel-pec`). A ROTA de destino (`/relatorios/pecuaria/pesagem-lote`)
  // TAMBÉM é gateada nesta MESMA permissão (ver router/index.tsx) —
  // `HasMiddleware` real nos 2 endpoints (options + download).
  'rel-pec-pes': { permission: 'accumulated-weighing-batch-report_view' },
  // Relatórios → Pecuária → Animais por Lote (Tarefa 51, esteira
  // CORE_WORKSPACE/97-Esteiras/015) — gate do FILHO recém-criado em
  // navigationTree.ts, mirror EXATO do gate `rel-pec-pes` acima
  // (`animals-per-batch-report_view`, já no `anyOf` do pai `rel-pec`, linha
  // 1052 — pré-semeada especulativamente, NÃO alterada aqui). A ROTA de
  // destino (`/relatorios/pecuaria/animais-por-lote`) TAMBÉM é gateada
  // nesta MESMA permissão (ver router/index.tsx) — achado `C22` (autorização
  // só no menu no legado) já corrigido na API por construção.
  'rel-pec-apl': { permission: 'animals-per-batch-report_view' },
  // Relatórios → Pecuária → Ficha Animal (F-225, 97-Esteiras/012, Tarefa 47,
  // frontend-contract-ficha-animal.md §2.1/§2.2) — gate do FILHO
  // `rel-pec-fic` (navigationTree.ts), mirror EXATO do gate do irmão
  // `rel-pec-vac` acima. `animal-record-report_view` já está no `anyOf` do
  // pai `rel-pec` (linha acima) — NÃO duplicar. Diferente de Vacas Prenhas
  // (`GAP-VACAS-01`, permissão reservada nunca seedada), esta permissão é
  // REAL e enforced no servidor (api-contract-ficha-animal.md §4.1) — a
  // ROTA de destino também é gateada nesta MESMA permissão (ver
  // src/router/index.tsx).
  'rel-pec-fic': { permission: 'animal-record-report_view' },
  // Relatórios → Pecuária → Histórico Reprodutivo (execução 074,
  // historico-reprodutivo-contrato-front.md §6) — gate do FILHO
  // `rel-pec-hist` (navigationTree.ts), mirror EXATO do gate do irmão
  // `rel-pec-vac` acima. A permissão real do endpoint
  // (`reproductive-history-report_view`) já está no `anyOf` de `rel-pec`
  // (linha 959) — nenhuma edição adicional lá.
  'rel-pec-hist': { permission: 'reproductive-history-report_view' },
  // Relatórios — Pecuária — Custeio/Lote (execução 074,
  // custeio-lote-contrato-front.md §6) — gate do FILHO `rel-pec-cus`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-hist`
  // acima. A permissão real do endpoint (`costing-batch-report_view`) já
  // está no `anyOf` de `rel-pec` (linha 954) — nenhuma edição adicional lá.
  'rel-pec-cus': { permission: 'costing-batch-report_view' },
  // Relatórios — Pecuária — Custeio/Animal (F-248, esteira 075,
  // CusteioAnimal-contrato-front.md §6) — gate do FILHO `rel-pec-cus-an`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-cus` acima.
  // A permissão real do endpoint (`costing-animal-report_view`) já está no
  // `anyOf` de `rel-pec` (linha 956) — nenhuma edição adicional lá.
  'rel-pec-cus-an': { permission: 'costing-animal-report_view' },
  // Relatórios — Pecuária — Custeio/Área (F-251,
  // CusteioAreaPecuaria-contrato-api.md, lote 076) — gate do FILHO
  // `rel-pec-cus-area` (navigationTree.ts), mirror EXATO do gate do irmão
  // `rel-pec-cus-an` acima. A permissão real do endpoint
  // (`cust-area-pec-report_view`) já está no `anyOf` de `rel-pec` (linha
  // 977) — nenhuma edição adicional lá.
  'rel-pec-cus-area': { permission: 'cust-area-pec-report_view' },
  // Relatórios — Pecuária — Custeio/Módulo (F-250, esteira 080,
  // Custeio-Modulo-Contrato-Front.md §2) — gate do FILHO `rel-pec-cus-md`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-cus-area`
  // acima. A permissão real do endpoint (`costing-grazing-report_view`) já
  // está no `anyOf` de `rel-pec` (linha 1117) — nenhuma edição adicional lá
  // (sem workaround, sem duplicação).
  'rel-pec-cus-md': { permission: 'costing-grazing-report_view' },
  // Relatórios — Pecuária — Aplicação/Manejo (F-230, esteira
  // 97-Esteiras/077, F-230-plano-front.md §7) — gate do FILHO `rel-pec-am`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-cus-area`
  // acima. `application-management-report_view` JÁ está no `anyOf` do pai
  // `rel-pec` (linha 997) — não duplicar. A ROTA de destino (`/relatorios/
  // pecuaria/aplicacao-manejo`) TAMBÉM é gateada (ver router/index.tsx) —
  // dupla barreira (Controller + Request), fechando o bypass de autorização
  // do legado (achado CL-02/POSSIVEL_LEGACY_DEFECT do contrato legado).
  'rel-pec-am': { permission: 'application-management-report_view' },
  // Relatórios — Pecuária — Desempenho Pesagem Confinamento (F-263, lote 076,
  // `FeedlotWeighingPerformanceReport-contrato-api.md`) — gate do FILHO
  // `rel-pec-desempenho-pesagem-confinamento` (navigationTree.ts), mirror
  // EXATO do gate do irmão `rel-pec-cus-area` acima. A permissão real do
  // endpoint (`feedlot-weighing-performance-report_view`) já está no
  // `anyOf` de `rel-pec` (linha 980) — nenhuma edição adicional lá.
  'rel-pec-desempenho-pesagem-confinamento': {
    permission: 'feedlot-weighing-performance-report_view',
  },
  // Relatórios — Pecuária — Movimentação/Rebanho (F-224, lote 076,
  // `AnimalMovementReport-contrato.md`) — gate do FILHO `rel-pec-mov`
  // (navigationTree.ts), mirror EXATO do gate do irmão
  // `rel-pec-desempenho-pesagem-confinamento` acima. A permissão real do
  // endpoint (`animal-movements-report_view`) já está no `anyOf` de
  // `rel-pec` (linha 998) — nenhuma edição adicional lá.
  'rel-pec-mov': { permission: 'animal-movements-report_view' },
  // Relatórios — Pecuária — Estq. Animais/Categoria (F-242, esteira
  // 97-Esteiras/077, F-242-plano-front.md) — gate do FILHO `rel-pec-cat`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-mov` acima.
  // A permissão real do endpoint (`category-animal-report_view`) já está no
  // `anyOf` de `rel-pec` (linha 994) — nenhuma edição adicional lá.
  'rel-pec-cat': { permission: 'category-animal-report_view' },
  // Relatórios — Pecuária — Transf/Lote/Módulo/Área (F-329, esteira
  // 97-Esteiras/077, F-329-plano-front.md) — gate do FILHO `rel-pec-tba`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-cat` acima.
  // `transfer-batch-module-area-report_view` JÁ está no `anyOf` do pai
  // `rel-pec` (linha 1003) — não duplicar. A ROTA de destino (`/relatorios/
  // pecuaria/transferencia-lote-modulo-area`) TAMBÉM é gateada (ver
  // router/index.tsx) — o plano de API fecha o bypass de autorização do
  // legado (achado POSSÍVEL_LEGACY_DEFECT §1, "autorização apenas por
  // visibilidade de menu") via `HasMiddleware`.
  'rel-pec-tba': { permission: 'transfer-batch-module-area-report_view' },
  // Relatórios — Pecuária — Vendas/Animais (F-227, esteira 97-Esteiras/077,
  // F-227-plano-front.md) — gate do FILHO `rel-pec-vda` (navigationTree.ts),
  // mirror EXATO do gate do irmão `rel-pec-cat` acima. A permissão real do
  // endpoint (`animals-sales-report_view`) já está no `anyOf` de `rel-pec`
  // (linha 1010) — nenhuma edição adicional lá.
  'rel-pec-vda': { permission: 'animals-sales-report_view' },
  // Relatórios — Pecuária — Estoque/Rebanho (F-228, execução
  // 97-Esteiras/078, F-228-plano-frontend.md) — gate do FILHO
  // `rel-pec-estoque-rebanho` (navigationTree.ts), mirror EXATO do gate do
  // irmão `rel-pec-vda` acima. `animals-report_view` já está no `anyOf` de
  // `rel-pec` (linha 1013) — NÃO cunhar novo slug, NÃO editar o `anyOf`. A
  // ROTA de destino (`/relatorios/pecuaria/estoque-rebanho`) TAMBÉM é
  // gateada nesta MESMA permissão (ver router/index.tsx).
  'rel-pec-estoque-rebanho': { permission: 'animals-report_view' },
  // Relatórios → Pecuária → Sanitário/Lote (F-318, execução 97-Esteiras/078,
  // F-318-plano-frontend.md, TASK-F318-F04) — gate do FILHO NOVO em
  // navigationTree.ts, mirror EXATO do gate do irmão
  // `rel-pec-estoque-rebanho` acima. `sanitaries-batch-report_view` JÁ
  // estava presente no `anyOf` do pai `rel-pec` (linha 1009) antes desta
  // Tarefa — nenhuma alteração naquele array foi necessária. A ROTA de
  // destino (`/relatorios/pecuaria/sanitario-lote`) TAMBÉM é gateada nesta
  // MESMA permissão — RE-ALINHAMENTO corrigiu o slug STALE `sanitary_view`
  // que a rota usava antes (ver router/index.tsx).
  'rel-pec-sanitario-lote': { permission: 'sanitaries-batch-report_view' },
  // Relatórios → Pecuária → Produtividade/Receptora (F-307, lote 079,
  // F-307-plano-frontend.md §5 TASK-F307-FE-03) — gate do FILHO NOVO em
  // navigationTree.ts, mirror EXATO do gate do irmão `rel-pec-hist` acima.
  // `receiver-cow-productivity-report_view` JÁ estava presente no `anyOf`
  // do pai `rel-pec` (linha 1072) antes desta Tarefa — nenhuma alteração
  // naquele array foi necessária. A ROTA de destino
  // (`/relatorios/pecuaria/produtividade-receptora`) TAMBÉM é gateada
  // nesta MESMA permissão (ver router/index.tsx).
  'rel-pec-recept': { permission: 'receiver-cow-productivity-report_view' },
  // Relatórios — Pecuária — Custo Total de Reprodução (F-328, esteira
  // 97-Esteiras/008, TASK-FE-CTR-02) — gate do FILHO `rel-pec-cus-rep`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-cus-an`
  // acima. A permissão real do endpoint
  // (`total-cost-of-reproduction-report_view`) já está no `anyOf` de
  // `rel-pec` (linha 1019) — NÃO duplicar. A ROTA de destino
  // (`/relatorios/pecuaria/custo-total-reproducao`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx) — dupla barreira no cliente
  // espelhando as 2 barreiras do servidor (`Controller::middleware()` +
  // `Request::authorize()`, `GAP-CTR-01` opção B, decisão do dono
  // 2026-09-09).
  'rel-pec-cus-rep': { permission: 'total-cost-of-reproduction-report_view' },
  // Relatórios → Pecuária → Nascimentos/SISBOV (F-235, esteira
  // 97-Esteiras/052, TASK-052-235-FE-02, roteiro-front-F235-nascimentos-
  // sisbov.md) — gate do FILHO `rel-pec-nascimentos-sisbov`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-cus` acima.
  // `birth-animals-sisbovs-report_view` já está no `anyOf` de `rel-pec`
  // (linha 969) — NÃO duplicar. A ROTA de destino
  // (`/relatorios/pecuaria/nascimentos-sisbov`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx).
  'rel-pec-nascimentos-sisbov': { permission: 'birth-animals-sisbovs-report_view' },
  // Relatórios → Pecuária → Mortes/SISBOV (F-253, esteira 97-Esteiras/054,
  // TASK-054-253-FE-02, roteiro-front-F253-mortes-sisbov.md) — gate do FILHO
  // `rel-pec-mortes-sisbov` (navigationTree.ts), mirror EXATO do gate do
  // irmão `rel-pec-nascimentos-sisbov` acima. `death-animals-sisbovs-
  // report_view` já está no `anyOf` de `rel-pec` — NÃO duplicar. A ROTA de
  // destino (`/relatorios/pecuaria/mortes-sisbov`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx).
  'rel-pec-mortes-sisbov': { permission: 'death-animals-sisbovs-report_view' },
  // Relatórios → Pecuária → Identificação/SISBOV (F-270, esteira
  // 97-Esteiras/078, CONTRATOS/F-270-contrato-legado.md) — gate do FILHO
  // `rel-pec-identificacao-sisbov` (navigationTree.ts), mirror EXATO do gate
  // do irmão `rel-pec-mortes-sisbov` acima. `identification-animals-sisbovs-
  // report_view` já está no `anyOf` de `rel-pec` (linha 1029) — NÃO
  // duplicar. A ROTA de destino (`/relatorios/pecuaria/identificacao-
  // sisbov`) TAMBÉM é gateada nesta MESMA permissão (ver router/index.tsx).
  'rel-pec-identificacao-sisbov': { permission: 'identification-animals-sisbovs-report_view' },
  // Relatórios → Pecuária → Mortes GENÉRICO (F-254, esteira
  // 97-Esteiras/077, CONTRATOS/front/F-254-plano-front.md) — gate do FILHO
  // `rel-pec-mor` (navigationTree.ts), mirror EXATO do gate do irmão
  // `rel-pec-mortes-sisbov` acima. `death-animals-report_view` já está no
  // `anyOf` de `rel-pec` — NÃO duplicar. A ROTA de destino
  // (`/relatorios/pecuaria/mortes`) TAMBÉM é gateada nesta MESMA permissão
  // (ver router/index.tsx).
  'rel-pec-mor': { permission: 'death-animals-report_view' },
  // Relatórios → Pecuária → Nascimentos GENÉRICO (F-236, esteira
  // 97-Esteiras/053, TASK-053-236-FE-02, roteiro-front-F236-nascimentos.md)
  // — gate do FILHO `rel-pec-nascimentos` (navigationTree.ts), mirror EXATO
  // do gate do irmão `rel-pec-nascimentos-sisbov` acima. `birth-report_view`
  // já está no `anyOf` do pai `rel-pec` — não duplicar. ROTA de destino
  // (`/relatorios/pecuaria/nascimentos`) TAMBÉM é gateada (ver
  // router/index.tsx) — dupla barreira (Controller + Request).
  'rel-pec-nascimentos': { permission: 'birth-report_view' },
  // Relatórios → Pecuária → Nutrição/Lote (F-288, esteira 97-Esteiras/053,
  // TASK-288-FE-01, roteiro-front-F288-nutricao.md §"Menu/Rota/Permissão")
  // — gate do FILHO `rel-pec-nut` (navigationTree.ts), mirror EXATO do gate
  // do irmão `rel-pec-nascimentos` acima. Permissão real do endpoint
  // (`nutrition-consumption-report_view`) já está no `anyOf` de `rel-pec`
  // (linha 955, corrigida da entrada STALE `nutrition_report` acima) — NÃO
  // duplicar. A ROTA de destino (`/relatorios/pecuaria/nutricao-consumo-
  // lote`) TAMBÉM é gateada nesta MESMA permissão (ver router/index.tsx).
  'rel-pec-nut': { permission: 'nutrition-consumption-report_view' },
  // Composição Rebanho (F-269, lote 079, F-269-plano-frontend.md §6
  // TASK-F269-FE-03) — gate do FILHO `rel-pec-composicao-rebanho`
  // (navigationTree.ts), mirror EXATO do gate do irmão `rel-pec-nut` acima.
  // Permissão real dos 2 endpoints do `HerdCompositionReportController`
  // (`herd-composition-report_view`) já está no `anyOf` de `rel-pec` acima
  // (fundação parcial já semeada, ver §0 do plano) — NÃO duplicar. A ROTA
  // de destino (`/relatorios/pecuaria/composicao-rebanho`) TAMBÉM é gateada
  // nesta MESMA permissão (ver router/index.tsx).
  'rel-pec-composicao-rebanho': { permission: 'herd-composition-report_view' },
  // Registro Genealógico (F-222, esteira 97-Esteiras/055) — gate do FILHO
  // recém-criado em navigationTree.ts (`rel-pec-arv`), mirror EXATO do
  // gate já aplicado a `rel-pec-nut` acima. `animal-family-tree-report_view`
  // já está no `anyOf` de `rel-pec` acima — NÃO duplicar. A ROTA de
  // destino (`/relatorios/pecuaria/registro-genealogico`) TAMBÉM é
  // gateada nesta MESMA permissão (ver router/index.tsx).
  'rel-pec-arv': { permission: 'animal-family-tree-report_view' },
  // Histórico de Animais/Lote (F-221, esteira 97-Esteiras/058,
  // FRONT-F221-plano.md §2.1) — gate do FILHO recém-criado em
  // navigationTree.ts (`rel-pec-hal`), mirror EXATO do gate já aplicado a
  // `rel-pec-arv` acima. `animal-batch-history-report_view` já está no
  // `anyOf` de `rel-pec` acima — NÃO duplicar. A ROTA de destino
  // (`/relatorios/pecuaria/historico-animais-lote`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx).
  'rel-pec-hal': { permission: 'animal-batch-history-report_view' },
  // Análise de Movimentação de Lote (F-223, esteira 059) — gate do FILHO
  // novo em navigationTree.ts, mirror EXATO dos irmãos acima.
  // `animal-movement-analysis-report_view` já está no `anyOf` de `rel-pec`
  // (acima) — nenhuma edição lá.
  'rel-pec-analise-mov-lote': { permission: 'animal-movement-analysis-report_view' },
  // Pesagem/Animal (F-334, execução 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO dos irmãos acima.
  // `weighing-batch-report_view` já está no `anyOf` de `rel-pec` (acima) —
  // nenhuma edição lá.
  'rel-pec-pesagem-animal': { permission: 'weighing-batch-report_view' },
  // Desmamas (F-333, esteira 97-Esteiras/060,
  // ROTEIRO-F333-FRONT-desmamas-tela.md §6, TASK-F333-FRONT-01) — FILHO novo
  // em navigationTree.ts (`rel-pec-des`), mirror EXATO de
  // `rel-pec-pesagem-animal` acima. `weaning-report_view` JÁ está no `anyOf`
  // de `rel-pec` (linha 1053, acima) — NÃO duplicar.
  'rel-pec-des': { permission: 'weaning-report_view' },
  'rel-fin': {
    anyOf: [
      'payment-schedule_view',
      'receipt-schedule_view',
      'expenses_report',
      'expenses_paid_report',
      'incomes_report',
      'incomes_paid_report',
      'received_interest_report',
      'paid_interest_report',
      'movements_report',
      'ledger_report',
      'ledger_caregory_report',
      'rec_prev_report',
      'pag_prev_report',
      'budget-plannings_view',
      'cashflow_by_category_report',
      'financial-movement-report_view',
      // Permissão NOVA dedicada (F-264, esteira 97-Esteiras/058, D-058-07) —
      // `financial-movement-report_view` (snake_case, server-side, 2 barreiras:
      // `HasMiddleware`+`authorize()`) — DISTINTA da chave legada
      // `financial-movement-report_view` acima (kebab-case, só
      // menu/visibilidade, `POSSIVEL_LEGACY_DEFECT` CL-05, nunca checada
      // server-side no legado). Ambas convivem no `anyOf`: a nova gateia a
      // ROTA/dado real; a antiga é resíduo do mapeamento de menu legado, fora
      // do escopo desta Tarefa remover.
      'financial-movement-report_view',
      'fiscal-difference-report_view',
      'incomestatement_view',
      'accumulatedincomestatement_view',
      'dre_view',
      'dre_annual_view',
      'monthly-payment-flow_view',
      'monthly-receipt-flow_view',
      'cashflow_product_report',
      'cost_centers_report',
      'cost_calculation_report',
      'financings_report',
      'advance-titles_report',
      'account-reconciliation_report',
      'cost_centers_unified_report',
      'tax_accounts_report',
      'accounts_payable_receivable_report',
      // ADITIVO (F-274 Livro Razão, esteira 97-Esteiras/008, TASK-FE-LR-03)
      // — ÚNICA edição de `anyOf` deste lote. A API criou um nó NOVO,
      // `ledger-report_view` (`app/Support/PermissionTree.php`), distinto
      // dos slugs LEGADOS `ledger_report`/`ledger_caregory_report` acima
      // (herdados do menu Blade do agro365, GAP-LR-05) — sem esta linha, um
      // usuário com APENAS `ledger-report_view` veria o grupo "Financeiro"
      // inteiro oculto. Os 2 legados permanecem INTOCADOS.
      'ledger-report_view',
    ],
  },
  // `rel-fin` reestruturado de item-folha para grupo/submenu (F-259/F-258,
  // esteira 97-Esteiras/049, TASK-DRE-FE-02/04) — mirror EXATO de
  // `rel-gfi`/`rel-pec` acima. `anyOf` do grupo INALTERADO — já contém
  // `dre_view`/`dre_annual_view` desde antes desta feature (linha acima); a
  // visibilidade do item pai continua resolvida pela própria regra dele
  // (`useMenuModules.ts::pruneItems`), não por agregação dos filhos.
  'rel-fin-dre': { permission: 'dre_view' },
  'rel-fin-dre-annual': { permission: 'dre_annual_view' },
  // Relatórios → Financeiro → Contas a Pagar/Contas Pagas (F-262/F-291,
  // esteira 97-Esteiras/050, TASK-050-262-FE-02/TASK-050-291-FE-02) — gate
  // dos FILHOS novos em navigationTree.ts, mirror EXATO de
  // `rel-fin-dre`/`rel-fin-dre-annual` acima. `anyOf` do pai `rel-fin`
  // INALTERADO — já contém `expenses_report`/`expenses_paid_report` desde
  // antes desta feature.
  'rel-fin-contas-a-pagar': { permission: 'expenses_report' },
  'rel-fin-contas-pagas': { permission: 'expenses_paid_report' },
  // Relatórios → Financeiro → Contas a Receber/Contas Recebidas (F-271/F-292,
  // esteira 97-Esteiras/050, TASK-050-271-FE-02/TASK-050-292-FE-02) — gate
  // dos FILHOS novos em navigationTree.ts, mirror EXATO de
  // `rel-fin-contas-a-pagar`/`rel-fin-contas-pagas` acima. `anyOf` do pai
  // `rel-fin` INALTERADO — já contém `incomes_report`/`incomes_paid_report`
  // desde antes desta feature.
  'rel-fin-contas-a-receber': { permission: 'incomes_report' },
  'rel-fin-contas-recebidas': { permission: 'incomes_paid_report' },
  // Relatórios → Financeiro → Pagamento Previsto × Real (F-289, esteira
  // 97-Esteiras/054, TASK-289-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-contas-a-pagar`/
  // `rel-fin-contas-pagas` acima. `pag_prev_report` já está no `anyOf` de
  // `rel-fin` (linha acima) — nenhuma edição lá. Distinto do irmão
  // `rel-fin-prev-real` (F-238, lado Recebimentos) — id/permissão nunca
  // colidem.
  'rel-fin-pag-prev-real': { permission: 'pag_prev_report' },
  // Relatórios → Financeiro → Recebimento Previsto × Real (F-297, esteira
  // 97-Esteiras/079, TASK-079-297-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-pag-prev-real` acima.
  // `rec_prev_report` já está no `anyOf` de `rel-fin` (linha acima) —
  // nenhuma edição lá. Distinto do irmão `rel-fin-prev-real` (F-238,
  // Planejamento Orçamentário) — id/permissão nunca colidem.
  'rel-fin-rec-prev-real': { permission: 'rec_prev_report' },
  // Relatórios → Financeiro → Juros Pagos (F-290, esteira 97-Esteiras/073,
  // TASK-290-FE-02) — gate do FILHO novo em navigationTree.ts, mirror EXATO
  // de `rel-fin-dre`/`rel-fin-dre-annual` acima. `paid_interest_report` já
  // está no `anyOf` de `rel-fin` (linha acima) — nenhuma edição lá.
  'rel-fin-juros-pagos': { permission: 'paid_interest_report' },
  // Relatórios → Financeiro → Juros Recebidos (esteira 97-Esteiras/014,
  // Tarefa 49) — gate do FILHO novo em navigationTree.ts, mirror EXATO de
  // `rel-fin-juros-pagos` acima. `received_interest_report` já está no
  // `anyOf` de `rel-fin` (linha acima) — nenhuma edição lá.
  'rel-fin-juros-recebidos': { permission: 'received_interest_report' },
  // Relatórios → Financeiro → Apuração de Custo (F-245, esteira
  // 97-Esteiras/073, TASK-245-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-dre`/`rel-fin-juros-pagos`
  // acima. `cost_calculation_report` já está no `anyOf` de `rel-fin` (linha
  // acima) e já cadastrado em `permissionsCatalog.json` — nenhuma edição lá
  // (confirmado por grep antes desta edição).
  'rel-fin-apuracao-custo': { permission: 'cost_calculation_report' },
  // Relatórios → Financeiro → Centro de Custo (F-247, esteira
  // 97-Esteiras/052, TASK-052-247-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-apuracao-custo` acima.
  // `cost_centers_report` já está no `anyOf` de `rel-fin` (linhas acima) —
  // nenhuma edição lá.
  'rel-fin-centro-custo': { permission: 'cost_centers_report' },
  // Relatórios → Financeiro → Livro Razão (F-274, esteira 97-Esteiras/008,
  // TASK-FE-LR-03) — gate do FILHO novo em navigationTree.ts, mirror EXATO
  // de `rel-fin-centro-custo` acima. Diferente dos irmãos recentes: o `anyOf`
  // do pai `rel-fin` NÃO continha `ledger-report_view` (slug novo da API,
  // distinto dos legados `ledger_report`/`ledger_caregory_report`) — edição
  // aditiva feita acima (GAP-LR-05).
  'rel-fin-livro-razao': { permission: 'ledger-report_view' },
  // Relatórios → Financeiro → Consolidado (Pagar/Receber) (F-214, esteira
  // 97-Esteiras/052, TASK-052-214-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-centro-custo` acima.
  // `accounts_payable_receivable_report` já está no `anyOf` de `rel-fin`
  // (linhas acima) — nenhuma edição lá.
  'rel-fin-consolidado': { permission: 'accounts_payable_receivable_report' },
  // Relatórios → Financeiro → Fluxo de Caixa Mensal (F-240, esteira
  // 97-Esteiras/053, TASK-053-240-FE-03) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-centro-custo`/
  // `rel-fin-consolidado` acima. `cashflow_by_category_report` já está no
  // `anyOf` de `rel-fin` (linhas acima) — nenhuma edição lá.
  'rel-fin-cashflow-por-categoria': { permission: 'cashflow_by_category_report' },
  // Relatórios → Financeiro → Estoque Financeiro (F-241, esteira
  // 97-Esteiras/013, TASK-013-241-FE-04) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-cashflow-por-categoria`
  // acima. `cashflow_product_report` já está no `anyOf` de `rel-fin`
  // (linhas acima) — nenhuma edição lá.
  'rel-fin-estoque-financeiro': { permission: 'cashflow_product_report' },
  // Relatórios → Financeiro → Custo de Produção (F-272, esteira
  // 97-Esteiras/073, TASK-272-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-apuracao-custo`/
  // `rel-fin-juros-pagos` acima. `incomestatement_view` já está no `anyOf` de
  // `rel-fin` (linha acima, confirmado por leitura direta antes desta
  // Tarefa) — nenhuma edição no `anyOf` nem em `permissionsCatalog.json`.
  'rel-fin-custo-producao': { permission: 'incomestatement_view' },
  // Relatórios → Financeiro → Previsto × Realizado (F-238,
  // HOMOLOGAÇÃO/correção 2026-09-05) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-fin-dre`/`rel-fin-custo-
  // producao` acima. Permissão CONFIRMADA pelo gate real da rota
  // (`router/index.tsx`, `/financeiro/previsao/relatorio-previsto-
  // realizado` → `RequirePermission permission="budget-plannings_view"`,
  // o que `BudgetPlanningPredictedReportRequest::authorize()` REALMENTE
  // exige no backend) — NÃO o slug órfão `budget-planning-predicted_view`
  // que estava (GAP-PO-05) no `anyOf` de `rel-fin`. Correção completa
  // (2026-09-05): o órfão foi SUBSTITUÍDO por `budget-plannings_view` no
  // `anyOf` acima (linha ~1018) — aditivo em cobertura, demais permissões
  // do grupo (DRE etc.) inalteradas — para que um usuário com apenas essa
  // permissão veja o grupo "Financeiro" e alcance este filho.
  'rel-fin-prev-real': { permission: 'budget-plannings_view' },
  // Adiantamento (F-219, esteira 97-Esteiras/055) — gate do FILHO novo em
  // navigationTree.ts (`rel-fin-adiantamento`), mirror EXATO de
  // `rel-fin-prev-real`/`rel-fin-custo-producao` acima.
  // `advance-titles_report` já está no `anyOf` de `rel-fin` acima — NÃO
  // duplicar. A ROTA de destino (`/relatorios/financeiro/adiantamento`)
  // TAMBÉM é gateada nesta MESMA permissão (ver router/index.tsx).
  'rel-fin-adiantamento': { permission: 'advance-titles_report' },
  // Agenda/Recebimentos (F-304, esteira 97-Esteiras/055) — gate do FILHO
  // novo em navigationTree.ts (`rel-fin-agenda-recebimentos`), mirror
  // EXATO de `rel-fin-adiantamento` acima. `receipt-schedule_view` já está
  // no `anyOf` de `rel-fin` acima — NÃO duplicar. A ROTA de destino
  // (`/relatorios/financeiro/agenda-recebimentos`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx).
  'rel-fin-agenda-recebimentos': { permission: 'receipt-schedule_view' },
  // Custo de Produção Acumulado (F-217, esteira 97-Esteiras/058) — gate do
  // FILHO novo em navigationTree.ts (`rel-fin-custo-producao-acumulado`),
  // mirror EXATO de `rel-fin-custo-producao`/`rel-fin-adiantamento` acima.
  // `accumulatedincomestatement_view` já está no `anyOf` de `rel-fin` acima
  // — NÃO duplicar. A ROTA de destino
  // (`/relatorios/financeiro/custo-de-producao-acumulado`) TAMBÉM é
  // gateada nesta MESMA permissão (ver router/index.tsx).
  'rel-fin-custo-producao-acumulado': { permission: 'accumulatedincomestatement_view' },
  // Movimento Bancário (F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-02)
  // — gate do FILHO novo em navigationTree.ts
  // (`rel-fin-movimento-bancario`), mirror EXATO de
  // `rel-fin-custo-producao-acumulado`/`rel-fin-adiantamento` acima.
  // `financial-movement-report_view` (permissão canônica já existente,
  // reusada — nunca slug novo) já foi incluída no `anyOf` de `rel-fin` acima. A ROTA de destino
  // (`/relatorios/financeiro/movimento-bancario`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx).
  'rel-fin-movimento-bancario': { permission: 'financial-movement-report_view' },
  // Fiscal/Não Fiscal (F-266, lote 076, `FiscalDifferenceReport-contrato.md`)
  // — gate do FILHO novo em navigationTree.ts
  // (`rel-fin-fiscal-nao-fiscal`), mirror EXATO de `rel-fin-agenda-
  // recebimentos` acima. `fiscal-difference-report_view` já está no `anyOf`
  // de `rel-fin` acima — NÃO duplicar. A ROTA de destino
  // (`/relatorios/financeiro/fiscal-nao-fiscal`) TAMBÉM é gateada nesta
  // MESMA permissão (ver router/index.tsx).
  'rel-fin-fiscal-nao-fiscal': { permission: 'fiscal-difference-report_view' },
  // Razão Categoria (F-273, execução 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO dos irmãos acima.
  // `ledger_caregory_report` já está no `anyOf` de `rel-fin` (acima) —
  // nenhuma edição lá (grafia legada preservada, mesma da API).
  'rel-fin-razao-categoria': { permission: 'ledger_caregory_report' },
  // Agenda/Pagamentos (F-294, esteira 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO dos irmãos acima. `payment-schedule_view`
  // já está no `anyOf` de `rel-fin` (acima) — nenhuma edição lá.
  'rel-fin-agenda-pagamentos': { permission: 'payment-schedule_view' },
  // Fluxo Mensal de Recebimento (F-303, esteira 059) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO dos irmãos acima.
  // `monthly-receipt-flow_view` já está no `anyOf` de `rel-fin` (acima) —
  // nenhuma edição lá.
  'rel-fin-fluxo-mensal-recebimento': { permission: 'monthly-receipt-flow_view' },
  // Contas Tributárias (F-327, esteira 97-Esteiras/060) — gate do FILHO novo
  // em navigationTree.ts, mirror EXATO dos irmãos acima. `tax_accounts_report`
  // já está no `anyOf` de `rel-fin` (acima) — nenhuma edição lá.
  'rel-fin-contas-tributarias': { permission: 'tax_accounts_report' },
  // Relatórios → Financeiro → Financiamentos (F-265, execução
  // 97-Esteiras/078, F-265-plano-frontend.md) — gate do FILHO novo em
  // navigationTree.ts (`rel-fin-financiamentos`), mirror EXATO de
  // `rel-fin-fiscal-nao-fiscal` acima. `financings_report` já está no
  // `anyOf` de `rel-fin` (linhas acima) — NÃO duplicar.
  'rel-fin-financiamentos': { permission: 'financings_report' },
  // Fluxo Mensal de Pagamento (F-293, execução 97-Esteiras/078) — filho
  // novo em navigationTree.ts (`rel-fin-fluxo-mensal-pagamento`), mirror
  // EXATO de `rel-fin-financiamentos`/`rel-fin-fiscal-nao-fiscal` acima.
  // `monthly-payment-flow_view` já está no `anyOf` de `rel-fin` acima — NÃO
  // duplicar.
  'rel-fin-fluxo-mensal-pagamento': { permission: 'monthly-payment-flow_view' },
  // Extrato Financeiro (F-233, execução 97-Esteiras/079) — gate do FILHO
  // novo em navigationTree.ts (`rel-fin-extrato-financeiro`), mirror EXATO
  // de `rel-fin-fluxo-mensal-pagamento` acima. `movements_report` já está no
  // `anyOf` de `rel-fin` (linha acima) — NÃO duplicar, sem leaf usando-o
  // antes desta Tarefa.
  'rel-fin-extrato-financeiro': { permission: 'movements_report' },
  // Conciliação de Contas (F-213, lote 079, rework FE) — gate do FILHO NOVO
  // em navigationTree.ts (`rel-fin-conciliacao-contas`), mirror EXATO de
  // `rel-fin-extrato-financeiro` acima. `account-reconciliation_report` JÁ
  // está no `anyOf` de `rel-fin` (linha ~1324) — NÃO duplicar; permissão
  // real do controller (`AccountReconciliationReportController`), não
  // `import_ofx` (já corrigido no guard da rota em router/index.tsx).
  'rel-fin-conciliacao-contas': { permission: 'account-reconciliation_report' },
  'rel-est': {
    anyOf: [
      'stock_movement_report',
      'requisitions_report',
      'stock_writeoffs_report',
      'dfe_report',
      'food-beat_report',
      'stocks-abc_report',
      'receipts_report',
      'stocks-consolidated_report',
      'stocks-lot-provider_report',
      'products-exit-cost-center_report',
      // Adicionada nesta Tarefa (F-337, execução 059) — item de MENU
      // "Pesagem/Armazém/Cliente" agora vive em `rel-est` (domínio correto
      // = Estoque, decisão desta Tarefa). A menção antiga em `rel-agr`
      // (`navigationPermissions.ts`, bloco `rel-agr` acima) é preservada
      // AS-IS, sem remoção sem decisão do dono.
      'weighing-stock-client_report',
    ],
  },
  // Relatórios → Estoque → Custo Produção Batida (F-267, esteira
  // 97-Esteiras/073, TASK-267-FE-01) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-gfi-partida-dobrada`/
  // `rel-fin-juros-pagos`. `food-beat_report` já está no `anyOf` de
  // `rel-est` (acima) — nenhuma edição lá.
  'rel-est-custo-batida': { permission: 'food-beat_report' },
  // Relatórios → Estoque → Recebimentos (F-305, esteira 97-Esteiras/074,
  // TASK-RCB-FE-02) — gate do FILHO novo em navigationTree.ts, mirror EXATO
  // de `rel-est-custo-batida` acima. `receipts_report` já está no `anyOf` de
  // `rel-est` (linha acima) — nenhuma edição lá.
  'rel-est-recebimentos': { permission: 'receipts_report' },
  // Relatórios → Estoque → Movimentação de Estoque (F-1f1d23e3, esteira
  // 97-Esteiras/074, TASK-MOV-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-est-custo-batida`/
  // `rel-est-recebimentos` acima. `stock_movement_report` já está no
  // `anyOf` de `rel-est` (linha acima) — nenhuma edição lá.
  'rel-est-mov-estoque': { permission: 'stock_movement_report' },
  // Relatórios → Estoque → Lote/Fornecedor (F-324, esteira 97-Esteiras/052,
  // TASK-052-324-FE-02) — gate do FILHO novo em navigationTree.ts, mirror
  // EXATO de `rel-est-custo-batida`/`rel-est-recebimentos`/
  // `rel-est-mov-estoque` acima. `stocks-lot-provider_report` já está no
  // `anyOf` de `rel-est` (linha acima) — nenhuma edição lá.
  'rel-est-lote-fornecedor': { permission: 'stocks-lot-provider_report' },
  // Relatórios → Estoque → Baixa de Estoque (F-321, execução 013, correção
  // de conformidade) — gate do FILHO novo em navigationTree.ts, mirror
  // EXATO de `rel-est-custo-batida`/`rel-est-recebimentos`/
  // `rel-est-mov-estoque`/`rel-est-lote-fornecedor` acima.
  // `stock_writeoffs_report` já está no `anyOf` de `rel-est` (linha acima)
  // — nenhuma edição lá.
  'rel-est-baixa-estoque': { permission: 'stock_writeoffs_report' },
  // Relatórios → Estoque → Curva ABC/Estoque (F-322, esteira
  // 97-Esteiras/077, CONTRATOS/front/F-322-plano-front.md) — gate do FILHO
  // novo em navigationTree.ts, mirror EXATO de `rel-est-custo-batida`/
  // `rel-est-recebimentos`/`rel-est-mov-estoque`/`rel-est-lote-fornecedor`/
  // `rel-est-baixa-estoque` acima. `stocks-abc_report` já está no `anyOf`
  // de `rel-est` (linha acima) — nenhuma edição lá.
  'rel-est-curva-abc': { permission: 'stocks-abc_report' },
  // Pesagem/Armazém/Cliente (F-337, execução 059) — gate do FILHO novo em
  // navigationTree.ts (grupo `rel-est`, domínio correto = Estoque).
  // `weighing-stock-client_report` ADICIONADA ao `anyOf` de `rel-est`
  // (acima) nesta Tarefa.
  'rel-est-pesagem-armazem-cliente': { permission: 'weighing-stock-client_report' },
  // DFe/Lançadas (F-255, execução 044, item de menu órfão fechado na
  // execução 061) — gate do FILHO novo em navigationTree.ts, mirror EXATO
  // de `rel-est-custo-batida`/.../`rel-est-pesagem-armazem-cliente` acima.
  // `dfe_report` já está no `anyOf` de `rel-est` (linha acima) desde a
  // execução 044 — nenhuma edição no pai.
  'rel-est-dfe-lancadas': { permission: 'dfe_report' },
  // Relatórios → Estoque → Saídas x Centro Custo (F-301, esteira
  // 97-Esteiras/078, F-301-plano-frontend.md) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-est-custo-batida`/
  // `rel-est-recebimentos`/`rel-est-mov-estoque`/`rel-est-lote-fornecedor`/
  // `rel-est-baixa-estoque`/`rel-est-curva-abc` acima.
  // `products-exit-cost-center_report` já está no `anyOf` de `rel-est`
  // (linha acima) — nenhuma edição lá.
  'rel-est-saidas-centro-custo': { permission: 'products-exit-cost-center_report' },
  // Relatórios → Estoque → Requisição/Saída (F-312, esteira 97-Esteiras/078,
  // F-312-plano-frontend.md) — gate do FILHO novo em navigationTree.ts,
  // mirror EXATO de `rel-est-custo-batida`/`rel-est-recebimentos`/
  // `rel-est-mov-estoque`/`rel-est-lote-fornecedor`/`rel-est-baixa-estoque`/
  // `rel-est-curva-abc`/`rel-est-saidas-centro-custo` acima.
  // `requisitions_report` já está no `anyOf` de `rel-est` (linha 1372) —
  // nenhuma edição lá.
  'rel-est-requisicao-saida': { permission: 'requisitions_report' },
  // Relatórios → Estoque → Estoque Consolidado (F-323, feature_id e70b8cad,
  // esteira 97-Esteiras/079, F-323-plano-frontend.md) — gate do FILHO novo
  // em navigationTree.ts, mirror EXATO de `rel-est-custo-batida`/
  // `rel-est-recebimentos`/`rel-est-mov-estoque`/`rel-est-lote-fornecedor`/
  // `rel-est-baixa-estoque`/`rel-est-curva-abc`/
  // `rel-est-saidas-centro-custo`/`rel-est-requisicao-saida` acima.
  // `stocks-consolidated_report` já está no `anyOf` de `rel-est` (linha
  // acima) — nenhuma edição lá.
  'rel-est-consolidado': { permission: 'stocks-consolidated_report' },
  // Relatórios → Suprimentos → Savings (F-319, execução 013,
  // TASK-013-F319-FE-01) — gate do FILHO NOVO em navigationTree.ts, mirror
  // EXATO de `rel-fin-cashflow-por-categoria`/`rel-fin-estoque-financeiro`
  // acima. `savings_view` já está no `anyOf` de `rel-sup` (linhas abaixo) —
  // nenhuma edição lá. A ROTA em si NÃO é gateada (`OQ-005` `MANTER_COMO_IS`
  // — só o item de MENU).
  'rel-sup-savings': { permission: 'savings_view' },
  'rel-sup': {
    anyOf: [
      'supplies_view',
      'savings_view',
      'ans_report_view',
      'request-quotation_report_view',
      'request-purchase-forecast-report_report_view',
      'status-sla_report_view',
      'request-purchase-management_report_view',
    ],
  },
  // `rel-sup` reestruturado de item-folha para grupo/submenu (F-310, esteira
  // 97-Esteiras/053, TASK-053-F310-FE-02) — mirror EXATO de
  // `rel-fin-dre`/`rel-est-custo-batida` acima. `anyOf` do pai INALTERADO —
  // já contém `status-sla_report_view`/
  // `request-purchase-management_report_view` desde antes desta esteira
  // (linhas acima, confirmado por leitura direta antes desta Tarefa).
  'rel-sup-sla': { permission: 'status-sla_report_view' },
  'rel-sup-gerencial-solicitacoes': { permission: 'request-purchase-management_report_view' },
  // 3º filho de `rel-sup` — "Produtos x Prev. Entrega" (F-309, esteira
  // 97-Esteiras/058, TASK-058-F309-FE-02). `anyOf` do pai já contém
  // `request-purchase-forecast-report_report_view` (linha acima) —
  // nenhuma edição lá.
  'rel-sup-produtos-prev-entrega': { permission: 'request-purchase-forecast-report_report_view' },
  // ANS (F-229, lote 076, `F-229-ans-report-contrato-api.md`) — gate do
  // FILHO `rel-sup-ans` (navigationTree.ts), mirror EXATO do gate dos irmãos
  // `rel-sup-sla`/`rel-sup-gerencial-solicitacoes` acima. `ans_report_view`
  // já estava no `anyOf` do pai `rel-sup` (linha acima) — nenhuma edição no
  // bucket do pai.
  'rel-sup-ans': { permission: 'ans_report_view' },
  // Relatórios → Suprimentos → Suprimentos (F-325, `supplies-report`,
  // execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52) — gate do FILHO NOVO
  // `rel-sup-supplies-report` (navigationTree.ts), mirror EXATO dos gates dos
  // irmãos `rel-sup-savings`/`rel-sup-ans` acima. `supplies_view` já está no
  // `anyOf` do pai `rel-sup` (acima, 1ª posição do array) — nenhuma edição no
  // bucket do pai.
  'rel-sup-supplies-report': { permission: 'supplies_view' },
  // Orçamentos (`request-quotation.report`, F-311, execução 97-Esteiras/078,
  // TASK-F311-F04) — gate do FILHO NOVO `rel-sup-orcamentos`
  // (navigationTree.ts), mirror EXATO dos irmãos `rel-sup-savings`/
  // `rel-sup-ans` acima. `request-quotation_report_view` já está no `anyOf`
  // de `rel-sup` (linhas acima) — nenhuma edição no bucket do pai.
  'rel-sup-orcamentos': { permission: 'request-quotation_report_view' },
  'rel-ven': {
    anyOf: [
      'sales_report',
      'sales-products_report',
      'sale-clients_report',
      'sale-employees_report',
      'sales-abc_report',
    ],
  },
  // "Vendas" (Relatórios) reestruturado de item-folha para grupo/submenu
  // (F-313, esteira 97-Esteiras/054, TASK-054-313-T1) — mirror EXATO de
  // `rel-sup-sla`/`rel-sup-gerencial-solicitacoes` acima (grupo com `anyOf`
  // amplo INALTERADO + 2 filhos com `permission` específica). Filho 1
  // (`rel-ven-produto`) preserva a permissão do relatório já em produção
  // (F-315) na MESMA posição de path; filho 2 (`rel-ven-cliente-produto`) é
  // a rota nova. `sales-products_report`/`sale-clients_report` já estão no
  // `anyOf` de `rel-ven` (acima) — nenhuma edição lá.
  'rel-ven-produto': { permission: 'sales-products_report' },
  'rel-ven-cliente-produto': { permission: 'sale-clients_report' },
  // "Vendas/Cliente" (F-317, esteira 97-Esteiras/077, F-317-plano-front.md)
  // — gate do FILHO `rel-ven-cliente` (navigationTree.ts), mirror EXATO dos
  // irmãos acima. `sales_report` já estava no `anyOf` de `rel-ven` (acima)
  // — nenhuma edição no bucket do pai.
  'rel-ven-cliente': { permission: 'sales_report' },
  // "Vendas/Funcionário" (F-314, esteira 97-Esteiras/079,
  // F-314-plano-frontend.md) — gate do FILHO NOVO `rel-ven-funcionario`
  // (navigationTree.ts), mirror EXATO dos irmãos acima. `sale-employees_report`
  // já está no `anyOf` de `rel-ven` (acima) — nenhuma edição no bucket do pai.
  'rel-ven-funcionario': { permission: 'sale-employees_report' },
  'rel-gpe': {
    anyOf: ['earnings_view', 'birthdays_view', 'logged-hours_view', 'active-employees_view'],
  },
  // `rel-gpe` reestruturado de item-folha para grupo/submenu (TASK-07-57,
  // feature F-285, `97-Esteiras/007`, e também Horas Logadas F-275 abaixo,
  // mescladas no mesmo grupo) — mirror EXATO de `rel-pec`/`rel-fin` acima.
  // `anyOf` do grupo INALTERADO (já contém `earnings_view`/`logged-hours_view`
  // desde antes destas features); a visibilidade do item pai continua
  // resolvida pela própria regra dele (`useMenuModules.ts::pruneItems`),
  // não por agregação dos filhos.
  'rel-gpe-apu': { permission: 'earnings_view' },
  // Relatórios → Gestão Pessoal → Horas Logadas (F-275, esteira
  // 97-Esteiras/012, Tarefa 47) — gate do FILHO novo em navigationTree.ts,
  // mirror EXATO de `rel-gfi-partida-dobrada`/`rel-pec-vac`.
  // `logged-hours_view` já está no `anyOf` de `rel-gpe` (acima) — nenhuma
  // edição lá. Gate SÓ do item de MENU — a ROTA (`router/index.tsx`) fica
  // SEM `RequirePermission` de propósito (`DEF-01` preservado, mirror
  // `EvolucaoRebanho`/`GAP-EVO-01`; contrato de tela §2.1/§2.3 v2).
  'rel-gpe-horas-logadas': { permission: 'logged-hours_view' },
  // `rel-gfi` reestruturado de item-folha para grupo/submenu (ajuste de
  // navegação pedido pelo dono, 2026-09-01) — mirror EXATO de `rel-pec`
  // acima (grupo com `anyOf` amplo reservando espaço para telas futuras +
  // filho com `permission` específica). `anyOf` do grupo INALTERADO — a
  // visibilidade do item pai continua resolvida pela própria regra dele
  // (`useMenuModules.ts::pruneItems`), não por agregação dos filhos; já
  // reserva os 2 relatórios de NF-e (`nfe_report`/`nfe_product_report`)
  // ainda sem tela própria.
  'rel-gfi': { anyOf: ['double-entry-accountings_report', 'nfe_report', 'nfe_product_report'] },
  'rel-gfi-partida-dobrada': { permission: 'double-entry-accountings_report' },
  // Relatórios → Gestão Fiscal → Faturamento (F-286, esteira
  // 97-Esteiras/054, TASK-054-286-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-gfi-partida-dobrada` acima.
  // `nfe_product_report` já está no `anyOf` de `rel-gfi` (linha acima) —
  // nenhuma edição lá.
  'rel-gfi-faturamento': { permission: 'nfe_product_report' },
  // Relatórios → Gestão Fiscal → NFe/Emitidas (F-287, esteira
  // 97-Esteiras/079, TASK-F287-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-gfi-faturamento` acima.
  // `nfe_report` já está no `anyOf` de `rel-gfi` (linha acima) — nenhuma
  // edição lá.
  'rel-gfi-nfe-report': { permission: 'nfe_report' },
  'rel-gfr': {
    anyOf: ['machinesreport_view', 'machines-supply_view', 'machines-maintenance_view'],
  },
  // Relatórios → Gestão de Frotas → Máquinas (F-278, esteira
  // 97-Esteiras/052, TASK-052-278-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-est-lote-fornecedor`/
  // `rel-agr-pro`. `machinesreport_view` já está no `anyOf` de `rel-gfr`
  // (linha acima) — nenhuma edição lá. A ROTA de destino (`/relatorios/
  // frotas/maquinas`) TAMBÉM é gateada (ver router/index.tsx).
  'rel-gfr-maquinas': { permission: 'machinesreport_view' },
  // Relatórios → Gestão de Frotas → Abastecimentos (F-277, esteira
  // 97-Esteiras/054, TASK-054-277-FE-02) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-gfr-maquinas` acima.
  // `machines-supply_view` já está no `anyOf` de `rel-gfr` (linha acima) —
  // nenhuma edição lá. A ROTA de destino (`/relatorios/frotas/
  // abastecimentos`) TAMBÉM é gateada (ver router/index.tsx).
  'rel-gfr-abastecimentos': { permission: 'machines-supply_view' },
  // Relatórios → Gestão de Frotas → Manutenções (F-276, execução
  // 97-Esteiras/078, F-276-plano-frontend.md) — gate do FILHO novo em
  // navigationTree.ts, mirror EXATO de `rel-gfr-abastecimentos` acima.
  // `machines-maintenance_view` já está no `anyOf` de `rel-gfr` (linha
  // acima) — nenhuma edição lá. A ROTA de destino (`/relatorios/frotas/
  // manutencoes`) TAMBÉM é gateada (ver router/index.tsx).
  'rel-gfr-manutencoes': { permission: 'machines-maintenance_view' },
  'int-dom-soft': { permission: 'integration_dominios_view' },
  'int-exp-bco': { permission: 'export_movements_dominios_view' },
  'int-exp-fol': { permission: 'export_payments_dominio_view' },
  'int-exp-cp': { permission: 'export_expenses_incomes_dominio_view' },
  'int-exp-nfse': { permission: 'export_nfs_dominio_view' },
  'int-csv': { permission: 'financial_export' },
  // Compartilhamento (Sharing, F-122, 97-Esteiras/070, TASK-CP-FE-01).
  'int-compartilhamento': { permission: 'sharings_view' },
};
