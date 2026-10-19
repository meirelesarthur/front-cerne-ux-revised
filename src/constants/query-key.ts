import { languageEnUs } from '@/constants/languages/languageEnUs';

export const queryKey = {
  logs: 'logs',
  system: {
    access: 'access',
    companies: 'companies',
  },
  // ============================================
  // Admin Panel (Teams, Roles, Permissions, Models, Users, Agents, Tools, Phases)
  // ============================================
  adminPanel: {
    users: 'admin-users',
    user: 'admin-user',
    teams: 'admin-teams',
    team: 'admin-team',
    teamMembers: 'admin-team-members',
    roles: 'admin-roles',
    role: 'admin-role',
    rolePermissions: 'admin-role-permissions',
    permissions: 'admin-permissions',
    permission: 'admin-permission',
    models: 'admin-models',
    model: 'admin-model',
    userModels: 'admin-user-models',
    // Activity Logs
    activityLogs: 'admin-activity-logs',
    activityLogStats: 'admin-activity-log-stats',
    activityLogDetail: 'admin-activity-log-detail',
    // Agents
    agents: 'admin-agents',
    agent: 'admin-agent',
    agentTools: 'admin-agent-tools',
    userAgents: 'admin-user-agents',
    teamAgents: 'admin-team-agents',
    teamDeletedAgents: 'admin-team-deleted-agents',
    // Tools
    tools: 'admin-tools',
    tool: 'admin-tool',
    // Phases
    phases: 'admin-phases',
    phase: 'admin-phase',
    phaseTools: 'admin-phase-tools',
    // Chats
    chats: 'admin-chats',
    chat: 'admin-chat',
    chatOperations: 'admin-chat-operations',
    // Pentests
    pentests: 'admin-pentests',
    pentest: 'admin-pentest',
    pentestVulnerabilities: 'admin-pentest-vulnerabilities',
    pentestVulnSummary: 'admin-pentest-vuln-summary',
    pentestVulnDetail: 'admin-pentest-vuln-detail',
    pentestComments: 'admin-pentest-comments',
    pentestEvidences: 'admin-pentest-evidences',
    pentestVulnComments: 'admin-pentest-vuln-comments',
    pentestVulnEvidences: 'admin-pentest-vuln-evidences',
    pentestVulnHistory: 'admin-pentest-vuln-history',
    pentestQualityGate: 'admin-pentest-quality-gate',
    pentestWebhooks: 'admin-pentest-webhooks',
    // Scheduled Pentests
    scheduledPentests: 'admin-scheduled-pentests',
    scheduledPentest: 'admin-scheduled-pentest',
    // Tickets (Jira)
    tickets: 'admin-tickets',
    ticket: 'admin-ticket',
    // Operations
    operations: 'admin-operations',
    operation: 'admin-operation',
    // Blacklist
    blacklistRules: 'admin-blacklist-rules',
    blacklistRule: 'admin-blacklist-rule',
    // Referral Links
    referralLinks: 'admin-referral-links',
    referralLink: 'admin-referral-link',
    // MCP Servers (Admin)
    mcpServers: 'admin-mcp-servers',
    mcpServer: 'admin-mcp-server',
    agentMcps: 'admin-agent-mcps',
    // Brandings (Marca de Relatório — Admin)
    brandings: 'admin-brandings',
    branding: 'admin-branding',
  },
  // ============================================
  // MCP Servers (User)
  // ============================================
  mcpServers: {
    list: 'user-mcp-servers',
    detail: 'user-mcp-server',
  },
  // ============================================
  // User Agents (agentes próprios do usuário)
  // ============================================
  agents: {
    list: 'user-agents',
    detail: 'user-agent',
    tools: 'user-agent-tools',
    mcps: 'user-agent-mcps',
  },
  // ============================================
  // Teams Module (User Teams Management)
  // ============================================
  teams: {
    list: 'teams-list',
    team: 'team-detail',
    members: 'team-members',
    roles: 'team-roles',
    role: 'team-role',
    rolePermissions: 'team-role-permissions',
    deletedRoles: 'team-deleted-roles',
    invitations: 'team-invitations',
    myInvitations: 'my-invitations',
    agents: 'team-agents',
    agent: 'team-agent',
    agentTools: 'team-agent-tools',
    agentMcps: 'team-agent-mcps',
    tools: 'team-tools',
    phases: 'team-phases',
    models: 'team-models',
    usageSummary: 'team-usage-summary',
    usageDaily: 'team-usage-daily',
    usageMembers: 'team-usage-members',
    branding: 'team-branding',
    usageHistory: 'team-usage-history',
  },
  master: {
    user: 'master-user',
    users: 'master-users',
    company: 'master-company',
    companies: 'master-companies',
  },
  // ============================================
  // Aleex Assistant (Chat, Messages, Agents, Shortcuts)
  // ============================================
  aleexAssistant: {
    chats: 'aleex-chats',
    chat: 'aleex-chat',
    messages: 'aleex-messages',
    agents: 'aleex-agents',
    shortcuts: 'aleex-shortcuts',
    models: 'aleex-models',
    phases: 'aleex-phases',
    chatVulnerabilities: 'aleex-chat-vulnerabilities',
  },
  // ============================================
  // Auth / Profile
  auth: {
    apiTokens: 'auth-api-tokens',
    apiTokenAvailablePermissions: 'auth-api-token-available-permissions',
    sessions: 'auth-sessions',
    activeSessions: 'auth-active-sessions',
    usageSummary: 'auth-usage-summary',
    usageDaily: 'auth-usage-daily',
    usageHistory: 'auth-usage-history',
    tiers: 'auth-tiers',
    emailVerification: 'auth-email-verification',
    branding: 'auth-branding',
  },
  // ============================================
  // Billing (Faturamento — User & Team)
  // ============================================
  billing: {
    status: 'billing-status',
    invoices: 'billing-invoices',
    teamStatus: 'billing-team-status',
    teamInvoices: 'billing-team-invoices',
    trialStatus: 'billing-trial-status',
    teamTrialStatus: 'billing-team-trial-status',
  },
  // ============================================
  // Pentest Manager (Pentests, Assets, Methodologies, Agents)
  // ============================================
  pentestManager: {
    pentests: 'pm-pentests',
    pentest: 'pm-pentest',
    pentestDetail: 'pm-pentest-detail',
    pentestsActive: 'pm-pentests-active',
    pentestsScheduled: 'pm-pentests-scheduled',
    pentestsCompleted: 'pm-pentests-completed',
    pentestsPaused: 'pm-pentests-paused',
    pentestsCancelled: 'pm-pentests-cancelled',
    pentestsArchived: 'pm-pentests-archived',
    pentestsFailed: 'pm-pentests-failed',
    assets: 'pm-assets',
    asset: 'pm-asset',
    methodologies: 'pm-methodologies',
    methodology: 'pm-methodology',
    phases: 'pm-phases',
    phase: 'pm-phase',
    phaseAgents: 'pm-phase-agents',
    agents: 'pm-agents',
    vulnerabilities: 'pm-vulnerabilities',
    comments: 'pm-comments',
    // Scheduled Pentests
    scheduledPentests: 'pm-scheduled-pentests',
    scheduledPentest: 'pm-scheduled-pentest',
    adminScheduledPentests: 'pm-admin-scheduled-pentests',
    // Vulnerability Resolution
    vulnComments: 'pm-vuln-comments',
    vulnEvidenceFiles: 'pm-vuln-evidence-files',
    vulnHistory: 'pm-vuln-history',
    vulnSummary: 'pm-vuln-summary',
    vulnGlobalSummary: 'pm-vuln-global-summary',
    webhooks: 'pm-webhooks',
    qualityGate: 'pm-quality-gate',
    dashboardStats: 'pm-dashboard-stats',
    pentestLimits: 'pm-pentest-limits',
    // Operations Logs
    operations: 'pm-operations',
    operationsChat: 'pm-operations-chat',
    operationsPentest: 'pm-operations-pentest',
    operation: 'pm-operation',
    // Support / Tickets
    tickets: 'pm-tickets',
    ticket: 'pm-ticket',
  },
  // ============================================
  // Cadastros Base — Perfis (Roles RBAC)
  // ============================================
  roles: {
    list: 'roles-list',
    detail: 'roles-detail',
    permissionTree: 'roles-permission-tree',
  },
  // ============================================
  // Financeiro — Contas a Pagar (Expense, esteira 036, TASK-FE-036-101)
  // ============================================
  expenses: {
    list: 'expenses-list',
    detail: 'expenses-detail',
    // UT-000795 — Select "Tipo" da Apropriação Direta (por fazenda ativa).
    appropriationTypes: 'expenses-appropriation-types',
  },
  // ============================================
  // Cadastros Base — Centros de Custo
  // ============================================
  costCenters: {
    list: 'cost-centers-list',
    detail: 'cost-centers-detail',
    // Árvore completa (grupos Sintéticos + folhas Analíticas do tenant),
    // TASK-BE-351/TASK-FE-317 — mirror de `financialCategories.tree`, campo
    // "Centros de Custo vinculados" do form de Categoria Financeira.
    // TASK-FE-1087 — `useCostCenterTree()` usa esta chave BASE + o boolean
    // `onlyTopLevel` (`[tree, onlyTopLevel]`): CentroCusto/useCostCenters
    // continua em `[tree, false]` (árvore completa, intocado), o form de
    // Categoria Financeira passa a usar `[tree, true]` (só os 22 nós de
    // topo) — chaves DIFERENTES, mesmo `staleTime` de 5min, sem colisão de
    // cache entre as 2 telas.
    tree: 'cost-centers-tree',
  },
  // ============================================
  // Cadastros Base — Pessoas — Autorizadores (RequestAuthorizer, Lote 06 /
  // esteira 089, Frente C, F-141, SLICE 1 — Lista + visibilidade)
  // ============================================
  requestAuthorizers: {
    list: 'request-authorizers-list',
    detail: 'request-authorizers-detail',
  },
  // ============================================
  // Cadastros Base — Raças (Breeds)
  // ============================================
  breeds: {
    list: 'breeds-list',
    detail: 'breeds-detail',
  },
  // ============================================
  // Cadastros Base — Causa Morte/Perda (DeathLoss)
  // ============================================
  deathLosses: {
    list: 'death-losses-list',
    detail: 'death-losses-detail',
  },
  // ============================================
  // Cadastros Base — Safras (Harvests)
  // ============================================
  harvests: {
    list: 'harvests-list',
    detail: 'harvests-detail',
    active: 'harvests-active',
    currentWeek: 'harvests-current-week',
  },
  // ============================================
  // Cadastros Base — Cultura/Variedade (Cultivation)
  // ============================================
  cultivation: {
    tree: 'cultivation-tree',
    detail: 'cultivation-detail',
    active: 'cultivation-active',
  },
  // ============================================
  // Cadastros Base — Agrícola — Ciclo de Produção (ProductionCycle, TASK-FE-01,
  // 97-Esteiras/033). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `stocks`/`foods`, NUNCA string literal.
  // ============================================
  productionCycles: {
    productionCycle: languageEnUs.US.productionCycles.productionCycle.singularLabel,
    productionCycles: languageEnUs.US.productionCycles.productionCycle.pluralLabel,
  },
  // ============================================
  // Administrativo — Adiantamento Salarial (Advance, TASK-FE-adiant-salarial,
  // 97-Esteiras/034). PADRÃO CANÔNICO: derivado da tradução (par singular/
  // plural, `languageEnUs`, chave em inglês) — mirror `productionCycles`.
  // ============================================
  advances: {
    advance: languageEnUs.US.advances.advance.singularLabel,
    advances: languageEnUs.US.advances.advance.pluralLabel,
  },
  // ============================================
  // Administrativo — Registro de Eventos (Bonus, esteira 037). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — mirror `advances`.
  // ============================================
  bonuses: {
    bonus: languageEnUs.US.bonuses.bonus.singularLabel,
    bonuses: languageEnUs.US.bonuses.bonus.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Endereçamentos (Addressing, domínio Estoque)
  // ============================================
  // ============================================
  // Cadastros Base — Plano de Contas (PlanAccount, domínio Financeiro)
  // ============================================
  planAccounts: {
    list: 'plan-accounts-list',
    detail: 'plan-accounts-detail',
    codePreview: 'plan-accounts-code-preview',
  },
  // ============================================
  // Financeiro Mercado Pago (execução 031, TASK-FE-031-44) — SaaS-admin,
  // GLOBAL, sem X-Farm-Id (is_farm:false, contrato de API §1). Placeholder:
  // backend sempre retorna `data: []`/`meta.total: 0` até o billing ser
  // migrado — não é bug, não é mock (contrato de API §0/§6).
  // ============================================
  financial: {
    mercadoPagoTransaction: languageEnUs.US.financial.mercadoPago.singularLabel,
    mercadoPagoTransactions: languageEnUs.US.financial.mercadoPago.pluralLabel,
    // Mov. Caixa/Bancário (Movement, TASK-MV-FE-01) — chave DERIVADA da
    // tradução (par singular/plural, `languageEnUs`, chave em inglês),
    // instrução explícita do task-packet (Movement-contrato-tela.md §3, nota
    // de divergência: diverge do padrão literal-string de 100% dos módulos
    // vizinhos deste MESMO arquivo, ex. `openMovements` acima — aplicado
    // aqui por mandato explícito, não é regressão de padrão a "corrigir").
    movement: languageEnUs.US.movements.movement.singularLabel,
    movements: languageEnUs.US.movements.movement.pluralLabel,
    // Congelamentos Financeiros (FinancialFreeze, F-110, esteira
    // 97-Esteiras/008, Tarefa 31) — chave DERIVADA da tradução (par
    // singular/plural, `languageEnUs`, chave em inglês), padrão canônico,
    // mirror `movement`/`movements` acima.
    financialFreeze: languageEnUs.US.financial.financialFreeze.singularLabel,
    financialFreezes: languageEnUs.US.financial.financialFreeze.pluralLabel,
    // `allocation` (rateio) não tem singular/plural de tradução próprio —
    // é um sub-form de `movement`, não uma entidade nomeada no dicionário
    // (Movement-contrato-tela.md §4). Exceção documentada
    // (get_pwa_constants_and_mappers_pattern §6.1) — literal, não derivada.
    movementAllocation: 'movement-allocation',
    // Importação OFX (OfxImport, F-114, 97-Esteiras/064, TASK-064-OFX-FE-01)
    // — chave DERIVADA da tradução (par singular/plural, `languageEnUs`,
    // chave em inglês), mirror EXATO de `movement`/`movements` acima (mesmo
    // domínio Financeiro, mesma decisão de nomenclatura). Fonte resolvida
    // para o módulo `ModuleOfxImports` (NOSSO, vencedor da reconciliação de
    // merge 065 — ver 97-Esteiras/065/ROTEIROS/
    // arquitetura-reconciliacao-ofx-frontend.md §7.2), não mais
    // `languageEnUs.US.financial.ofxImport` (módulo prunado no mesmo merge).
    ofxImport: languageEnUs.US.ofxImports.ofxImport.singularLabel,
    ofxImports: languageEnUs.US.ofxImports.ofxImport.pluralLabel,
    // Conciliação bancária (TASK-064-OFX-FE-02) — sub-recurso de OfxImport,
    // SEM singular/plural de tradução próprio (mesmo racional de
    // `movementAllocation` acima). Literal, não derivada.
    ofxReconciliation: 'ofx-reconciliation',
    // Agregação mensal de movimentos conciliados (`GET /ofx-imports/report`,
    // TASK-065-OFX-FE-03) — sem entidade nomeada no dicionário (endpoint de
    // agregação, não CRUD) — literal, mirror `ofxReconciliation` acima.
    ofxImportsReport: 'ofx-imports-report',
    // Prev. Orçamentária (BudgetPlanning, F-106, esteira 97-Esteiras/067,
    // TASK-PO-FE-03) — chave DERIVADA da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), padrão canônico, mirror
    // `financialFreeze`/`financialFreezes` acima.
    budgetPlanning: languageEnUs.US.financial.budgetPlanning.singularLabel,
    budgetPlannings: languageEnUs.US.financial.budgetPlanning.pluralLabel,
    // Universo de categorias elegíveis para a grade mensal (GAP-PO-08,
    // TASK-PO-FE-07) — sub-recurso sem entidade nomeada no dicionário
    // (mesmo racional de `ofxReconciliation`/`ofxImportsReport` acima).
    // Literal, não derivada.
    budgetPlanningEligibleCategories: 'budget-plannings-eligible-categories',
    // Fluxo Bancário (CashFlow, F-107, esteira 070, TASK-CF-FE-01) — relatório
    // de agregação (`GET /cashflow`), sem entidade CRUD nomeada no
    // dicionário — literal, mirror `ofxImportsReport`/`budgetPlanningEligibleCategories`
    // acima (não derivada de singular/plural). O contrato de tela §6/a Tarefa
    // exemplificam um namespace `financeiro.cashFlow`, mas o namespace
    // TOP-LEVEL real já em uso por este módulo neste arquivo é `financial`
    // (ver `financialFreeze`/`movement` acima) — adicionado aqui, não em um
    // namespace novo.
    cashFlow: 'cash-flow-report',
  },
  // ============================================
  // Categorias Financeiras — tela de gestão própria (TASK-FE-310..313,
  // execução 023). Nasceu só leitura (multi-select do Plano de Contas,
  // TASK-PA-03b) — `detail` foi acrescentado nesta rodada para o formulário
  // de criar/editar (TASK-FE-312).
  // ============================================
  financialCategories: {
    list: 'financial-categories-list',
    // Árvore completa (grupos Sintéticos + folhas Analíticas do tenant),
    // TASK-PA-16 — card "Categorias Financeiras" do Plano de Contas E
    // modo ÁRVORE (default) da tela de gestão (TASK-FE-311).
    tree: 'financial-categories-tree',
    detail: 'financial-categories-detail',
  },
  // ============================================
  // Cadastros Base — Saldo Inicial (OpenMovement, domínio Financeiro,
  // execução 031, TASK-FE-031-35) — mirror literal de
  // `costCenters`/`financialCategories` acima (NÃO o padrão derivado de
  // tradução de `cadastrosBase.*`, convenção distinta já em uso por outro
  // grupo de chaves — instrução explícita do contrato §9).
  // ============================================
  openMovements: {
    list: 'open-movements-list',
    detail: 'open-movements-detail',
    // Correção pós-E2E rodada 1 (C1) — lookup próprio da Categoria do
    // rateio (`listFinancialCategoryOptions`, filtro estrito), não
    // reaproveita `list`/`detail` (chave/formato diferentes).
    apportionmentCategoryOptions: 'open-movements-apportionment-category-options',
  },
  // ============================================
  // Cadastros Base — Tipos de Categoria (CategoryType) — dado mestre GLOBAL,
  // paginação real (per_page ignorado pelo backend hoje, ver Risco 2 da ficha
  // TASK-CTY-01)
  // ============================================
  // Cadastros Base — Armazéns (Warehouses)
  // ============================================
  warehouses: {
    list: 'warehouses-list',
    detail: 'warehouses-detail',
  },
  // ============================================
  // Administrativo — Saldo de Estoque (Stock, 100% leitura, TASK-STK-FE-01).
  // Chave DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `openingBalances`/`requestPurchases`
  // acima, NUNCA string literal.
  // ============================================
  stocks: {
    stock: languageEnUs.US.stocks.stock.singularLabel,
    stocks: languageEnUs.US.stocks.stock.pluralLabel,
  },
  // ============================================
  // Fábrica — Formulação (Food, TASK-FOOD-FE-01). Chave DERIVADA da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês) — padrão
  // canônico, mirror `stocks`/`openingBalances`, NUNCA string literal.
  // ============================================
  foods: {
    food: languageEnUs.US.foods.food.singularLabel,
    foods: languageEnUs.US.foods.food.pluralLabel,
  },
  // ============================================
  // Fábrica — Batida (FoodBeat, TASK-FB-FE-01). Chave DERIVADA da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês) — padrão
  // canônico, mirror `foods`/`stocks`, NUNCA string literal.
  // ============================================
  foodBeats: {
    foodBeat: languageEnUs.US.foodBeats.foodBeat.singularLabel,
    foodBeats: languageEnUs.US.foodBeats.foodBeat.pluralLabel,
  },
  // ============================================
  // Estoque — Trans. Armazém (WarehouseTransfer, TASK-WT-FE-01). Chave
  // DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `foods`/`foodBeats`, NUNCA string
  // literal.
  // ============================================
  warehouseTransfers: {
    warehouseTransfer: languageEnUs.US.warehouseTransfers.warehouseTransfer.singularLabel,
    warehouseTransfers: languageEnUs.US.warehouseTransfers.warehouseTransfer.pluralLabel,
  },
  // ============================================
  // Estoque — Trans. Fazendas (FarmTransfer, Tarefas 01/02/03). Chave
  // DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `warehouseTransfers`, NUNCA string
  // literal.
  // ============================================
  farmTransfers: {
    farmTransfer: languageEnUs.US.farmTransfers.farmTransfer.singularLabel,
    farmTransfers: languageEnUs.US.farmTransfers.farmTransfer.pluralLabel,
  },
  // ============================================
  // Estoque — Requisição/Saída (Requisition, 97-Esteiras/002, Tarefas
  // 04/05). Chave DERIVADA da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — padrão canônico, mirror `farmTransfers`, NUNCA string
  // literal.
  // ============================================
  requisitions: {
    requisition: languageEnUs.US.requisitions.requisition.singularLabel,
    requisitions: languageEnUs.US.requisitions.requisition.pluralLabel,
  },
  // ============================================
  // Estoque — Devolução/Entrada (Devolution, 97-Esteiras/037). Chave
  // DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `requisitions`, NUNCA string literal.
  // ============================================
  devolutions: {
    devolution: languageEnUs.US.devolutions.devolution.singularLabel,
    devolutions: languageEnUs.US.devolutions.devolution.pluralLabel,
  },
  // ============================================
  // Administrativo — Apuração Mensal (Earning, 97-Esteiras/002, Tarefas
  // 07/08/09). Chave DERIVADA da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês) — padrão canônico, mirror
  // `warehouseTransfers`/`advances`, NUNCA string literal.
  // ============================================
  earnings: {
    earning: languageEnUs.US.earnings.earning.singularLabel,
    earnings: languageEnUs.US.earnings.earning.pluralLabel,
  },
  // ============================================
  // Operacional — Nutrição (Nutrition, F-050, esteira 066, TASK-NT-FE-01).
  // Chave DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `foodBeats`/`dietBeats`, NUNCA string
  // literal.
  // ============================================
  nutritions: {
    nutrition: languageEnUs.US.nutritions.nutrition.singularLabel,
    nutritions: languageEnUs.US.nutritions.nutrition.pluralLabel,
  },
  // ============================================
  // Administrativo — Correção de Estoque (StockCorrection, TASK-FE-COR-01/02).
  // Chave DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `stocks`/`events`, NUNCA string literal.
  // ============================================
  stockCorrections: {
    stockCorrection: languageEnUs.US.stockCorrections.stockCorrection.singularLabel,
    stockCorrectionsList: languageEnUs.US.stockCorrections.stockCorrection.pluralLabel,
  },
  // ============================================
  // Financeiro — Importação Mov. Bancários (MovementSheet, F-112,
  // 97-Esteiras/064, TASK-064-MOV-FE-01). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror literal de `stockCorrections` acima, NUNCA string literal.
  // ============================================
  movementSheets: {
    movementSheet: languageEnUs.US.movementSheets.movementSheet.singularLabel,
    movementSheetsList: languageEnUs.US.movementSheets.movementSheet.pluralLabel,
  },
  // ============================================
  // Administrativo — Baixa de Estoque (StockWriteoff, esteira 038, fatia READ
  // TASK-FE-3001/3002/3003). Chave DERIVADA da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês) — padrão canônico, mirror `stockCorrections`,
  // NUNCA string literal.
  // ============================================
  stockWriteoffs: {
    stockWriteoff: languageEnUs.US.stockWriteoffs.stockWriteoff.singularLabel,
    stockWriteoffsList: languageEnUs.US.stockWriteoffs.stockWriteoff.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Espécies (Species)
  // ============================================
  species: {
    list: 'species-list',
    detail: 'species-detail',
  },
  // ============================================
  // Cadastros Base — Pecuários — Diagnóstico Gestação (DiagnosisPregnancy)
  // ============================================
  baseRegistrations: {
    diagnosisPregnancy: languageEnUs.US.baseRegistrations.diagnosisPregnancy.singularLabel,
    diagnosisPregnancies: languageEnUs.US.baseRegistrations.diagnosisPregnancy.pluralLabel,
    // ============================================
    // Cadastros Base — Pecuários — Escore Corporal (BodyScore, TASK-BS-FE-01)
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), NUNCA string literal — mirror
    // `diagnosisPregnancy`/`diagnosisPregnancies` acima.
    // ============================================
    bodyScore: languageEnUs.US.baseRegistrations.bodyScore.singularLabel,
    bodyScores: languageEnUs.US.baseRegistrations.bodyScore.pluralLabel,
    accountingGroupers: {
      list: 'accounting-groupers-list',
      detail: 'accounting-groupers-detail',
    },
    additionalInfo: languageEnUs.US.baseRegistrations.additionalInfo.singularLabel,
    additionalInfos: languageEnUs.US.baseRegistrations.additionalInfo.pluralLabel,
    addressing: {
      tree: 'addressing-tree',
      detail: 'addressing-detail',
    },
    // ============================================
    // Cadastros Base — Estrutura — Rateio - Categoria Financeira (Apportionment)
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
    // chave em inglês), NUNCA string literal — mirror `bank`/`lowReason` abaixo.
    // ============================================
    apportionment: languageEnUs.US.baseRegistrations.apportionment.singularLabel,
    apportionments: languageEnUs.US.baseRegistrations.apportionment.pluralLabel,
    // Chaves TÉCNICAS auxiliares (rotas de leitura `## 3` do contrato — sem
    // singularLabel próprio, não são entidade com CRUD) — exceção literal,
    // mirror `issueDfeSyncTimeEligibleIssuers`/`ibptItems`.
    apportionmentEligibleFinancialCategories: 'apportionment-eligible-financial-categories',
    apportionmentEligibleActivities: 'apportionment-eligible-activities',
    apportionmentEligibleCostCenters: 'apportionment-eligible-cost-centers',
    apportionmentAvailableHa: 'apportionment-available-ha',
    bank: languageEnUs.US.baseRegistrations.bank.singularLabel,
    banks: languageEnUs.US.baseRegistrations.bank.pluralLabel,
    birthNote: languageEnUs.US.baseRegistrations.birthNote.singularLabel,
    birthNotes: languageEnUs.US.baseRegistrations.birthNote.pluralLabel,
    categoryType: languageEnUs.US.baseRegistrations.categoryType.singularLabel,
    categoryTypes: languageEnUs.US.baseRegistrations.categoryType.pluralLabel,
    diagnosticTechnique: languageEnUs.US.baseRegistrations.diagnosticTechnique.singularLabel,
    diagnosticTechniques: languageEnUs.US.baseRegistrations.diagnosticTechnique.pluralLabel,
    // Administrativo — Gestão Documentos — Documentos (DocumentManagement,
    // TASK-12/13) — chave LITERAL kebab-case (mesma exceção documentada logo
    // abaixo para `documentTypes`, par de módulos "Gestão Documentos"), NÃO o
    // par singular/plural derivado da tradução.
    documentManagements: {
      list: 'document-managements-list',
      detail: 'document-managements-detail',
    },
    // Administrativo — Gestão Documentos — Tipo Documento (DocumentType,
    // TASK-DT-FE-01) — chave LITERAL kebab-case (mesma exceção já
    // estabelecida para `accountingGroupers`/`addressing`: árvore sem
    // paginação real, ver `[[DocumentType-contrato-tela]] §3`), NÃO o par
    // singular/plural derivado da tradução.
    documentTypes: {
      list: 'document-types-list',
      detail: 'document-types-detail',
      options: 'document-types-options',
    },
    familyEquipment: languageEnUs.US.baseRegistrations.familyEquipment.singularLabel,
    familyEquipments: languageEnUs.US.baseRegistrations.familyEquipment.pluralLabel,
    // Cadastros Base — Pecuários — Forragem (Fodder, TASK-FD-FE-01) —
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), NUNCA string literal.
    fodder: languageEnUs.US.baseRegistrations.fodder.singularLabel,
    fodders: languageEnUs.US.baseRegistrations.fodder.pluralLabel,
    // Cadastros Base — Pecuários — Módulo Pastejo (Grazing, TASK-GZ-FE-01) —
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), NUNCA string literal.
    grazing: languageEnUs.US.baseRegistrations.grazing.singularLabel,
    grazings: languageEnUs.US.baseRegistrations.grazing.pluralLabel,
    // Cadastros Base — Configurações — Testeiras (Headband, TASK-HB-FE-01) —
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), NUNCA string literal.
    headband: languageEnUs.US.baseRegistrations.headband.singularLabel,
    headbands: languageEnUs.US.baseRegistrations.headband.pluralLabel,
    // Cadastros Base — Configurações — IBPT (Tabela Fiscal de Incidência
    // Tributária, execução 032, TASK-FE-2410) — PADRÃO CANÔNICO: derivado da
    // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
    // string literal, mirror `permission`/`permissions` acima. `ibptItems` é
    // chave TÉCNICA de cache das linhas paginadas de 1 tabela (mirror
    // `queryKey.meuModuloFilho.list` do Modelo B do catálogo de composições),
    // não uma "entidade" própria com CRUD — entra alfabeticamente ENTRE
    // `ibpt` e `ibpts` (`ibptI` < `ibpts`, `I`/`i` < `s`).
    ibpt: languageEnUs.US.baseRegistrations.ibpt.singularLabel,
    ibptItems: languageEnUs.US.baseRegistrations.ibpt.detail.itemsLabel,
    ibpts: languageEnUs.US.baseRegistrations.ibpt.pluralLabel,
    identificationType: languageEnUs.US.baseRegistrations.identificationType.singularLabel,
    identificationTypes: languageEnUs.US.baseRegistrations.identificationType.pluralLabel,
    indexer: languageEnUs.US.baseRegistrations.indexer.singularLabel,
    indexers: languageEnUs.US.baseRegistrations.indexer.pluralLabel,
    issueDfeSyncTime: languageEnUs.US.baseRegistrations.issueDfeSyncTime.singularLabel,
    issueDfeSyncTimes: languageEnUs.US.baseRegistrations.issueDfeSyncTime.pluralLabel,
    issueDfeSyncTimeEligibleIssuers: 'issue-dfe-sync-times-eligible-issuers',
    lowReason: languageEnUs.US.baseRegistrations.lowReason.singularLabel,
    lowReasons: languageEnUs.US.baseRegistrations.lowReason.pluralLabel,
    measurement: languageEnUs.US.baseRegistrations.measurement.singularLabel,
    measurements: languageEnUs.US.baseRegistrations.measurement.pluralLabel,
    // Cadastros Base — Fiscais — NFSe Recebidas (Nfse, TASK-FE-2730/2735) —
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), NUNCA string literal.
    nfse: languageEnUs.US.baseRegistrations.nfse.singularLabel,
    nfses: languageEnUs.US.baseRegistrations.nfse.pluralLabel,
    // Cadastros Base — Pecuários — Parâmetros / Peso (ParameterWeight)
    parameterWeight: languageEnUs.US.baseRegistrations.parameterWeight.singularLabel,
    parameterWeights: languageEnUs.US.baseRegistrations.parameterWeight.pluralLabel,
    paymentTerm: languageEnUs.US.baseRegistrations.paymentTerm.singularLabel,
    paymentTerms: languageEnUs.US.baseRegistrations.paymentTerm.pluralLabel,
    // Cadastros Base — Configurações — Permissões (Permission, execução 032,
    // TASK-FE-2400) — PADRÃO CANÔNICO: derivado da tradução (par singular/
    // plural, `languageEnUs`), NUNCA string literal. Namespace
    // `baseRegistrations.permission(s)` — NÃO confundir com
    // `adminPanel.permission(s)` (módulo interno SaaS, não relacionado) nem
    // `roles.permissionTree`/`configuracoes.permissionScreens` (leituras
    // auxiliares de outras telas).
    permission: languageEnUs.US.baseRegistrations.permission.singularLabel,
    permissions: languageEnUs.US.baseRegistrations.permission.pluralLabel,
    // Cadastros Base — Configurações — Termos e Condições (PlatformDocument,
    // execução 032, TASK-FE-2500) — PADRÃO CANÔNICO: derivado da tradução,
    // NUNCA string literal. Chave ÚNICA (sem par singular/plural) — mirror
    // `tenantParameters` (também settings-form de registro único, sem
    // listagem).
    platformDocuments: languageEnUs.US.baseRegistrations.platformDocuments.singularLabel,
    reversalExpense: languageEnUs.US.baseRegistrations.reversalExpense.singularLabel,
    reversalExpenses: languageEnUs.US.baseRegistrations.reversalExpense.pluralLabel,
    serviceExpense: languageEnUs.US.baseRegistrations.serviceExpense.singularLabel,
    serviceExpenses: languageEnUs.US.baseRegistrations.serviceExpense.pluralLabel,
    // Cadastros Base — Atualizações do Sistema (SystemUpdate, execução 031,
    // TASK-FE-1100) — PADRÃO CANÔNICO: derivado da tradução (par singular/
    // plural, `languageEnUs`), NUNCA string literal.
    systemUpdate: languageEnUs.US.baseRegistrations.systemUpdate.singularLabel,
    systemUpdates: languageEnUs.US.baseRegistrations.systemUpdate.pluralLabel,
    // Popup do dashboard (GAP-BE-511-systemupdate, Opção A) — consumido só por
    // `src/pages/Home/SystemUpdatePendingModal.tsx`, chave própria (não reusa
    // `systemUpdates` da Listagem para não invalidar/colidir cache entre as
    // duas superfícies).
    systemUpdatesPending: 'system-updates-pending',
    // Cadastros Base — Gerais — Contratantes (Tenant, TASK-TN-FE-01) —
    // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
    // `languageEnUs`, chave em inglês), NUNCA string literal — mirror
    // `bodyScore`/`diagnosisPregnancy` acima. Bloco DISTINTO de
    // `tenantParameters` abaixo (settings singleton do tenant CORRENTE, não
    // um CRUD de Tenants — sem relação).
    tenant: languageEnUs.US.baseRegistrations.tenant.singularLabel,
    tenants: languageEnUs.US.baseRegistrations.tenant.pluralLabel,
    tenantParameters: languageEnUs.US.baseRegistrations.tenantParameters.singularLabel,
    typeTitle: languageEnUs.US.baseRegistrations.typeTitle.singularLabel,
    typeTitles: languageEnUs.US.baseRegistrations.typeTitle.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Grupos de Produto (ProductGroups)
  // ============================================
  productGroups: {
    list: 'product-groups-list',
    detail: 'product-groups-detail',
  },
  // ============================================
  // Cadastros Base — Categorias de Produto (CategoryProducts) — 2º nível da
  // hierarquia GroupProduct → CategoryProduct → Kind, sem `parent_id` próprio
  // (grid flat)
  // ============================================
  categoryProducts: {
    list: 'category-products-list',
    detail: 'category-products-detail',
    activeList: 'category-products-active-list',
  },
  // ============================================
  // Cadastros Base — Bancos (Bank) — dado mestre GLOBAL, sem paginação real
  // ============================================
  // ============================================
  // Cadastros Base — Agrupadores (Grouper) — cadastro HIERÁRQUICO
  // ============================================
  groupers: {
    list: 'groupers-list',
    children: 'groupers-children',
    detail: 'groupers-detail',
  },
  // ============================================
  // Cadastros Base — Agrupadores Contábeis (AccountingGrouper) — módulo
  // IRMÃO de `groupers` (estoque), domínio DRE. SEM paginação — a API
  // devolve a árvore inteira em uma única chamada — por isso SEM chave
  // `children` (não existe endpoint de filhos sob demanda).
  // ============================================
  // ============================================
  // Cadastros Base — Família de Bens (FamilyEquipment)
  // ============================================
  // ============================================
  // Cadastros Base — Marcadores (Marker, grupo `cad-gerais` / "Configurações"
  // do legado) — PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mandato explícito da Tarefa
  // TASK-MK-FE-01 — não copiar o desvio de string literal de
  // `familyEquipments` acima.
  // ============================================
  markers: {
    marker: languageEnUs.US.markers.marker.singularLabel,
    markersList: languageEnUs.US.markers.marker.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Motivos de Baixa (LowReason)
  // ============================================
  // ============================================
  // Cadastros Base — Tipos de Título (TypeTitle)
  // ============================================
  // ============================================
  // Cadastros Base — Informações Complementares (AdditionalInfo)
  // ============================================
  // ============================================
  // Cadastros Base — Condições de Pagamento (PaymentTerm)
  // ============================================
  // ============================================
  // Cadastros Base — Atividades (Activity)
  // ============================================
  activities: {
    list: 'activities-list',
    detail: 'activities-detail',
  },
  // ============================================
  // Cadastros Base — Operações (Operation)
  // ============================================
  // `list` compartilhada com o CheckboxListField "Operações" de Atividade
  // (rodada visual 2, pós-E2E) e com a tela dedicada de Operações
  // (TASK-FE-041/042) — mesmo padrão de `activities.list` (grid + consumidor
  // externo, sem conflito de query key). `detail` NOVO (TASK-FE-041).
  operations: {
    list: 'operations-list',
    detail: 'operations-detail',
    // NOVO (ajuste pós-E2E) — próxima ordem disponível (GET
    // /operations/next-order), consumida só em modo CRIAÇÃO.
    nextOrder: 'operations-next-order',
  },
  // ============================================
  // Cadastros Base — Estágio Reprodutivo (CategoryMatrix)
  // ============================================
  categoryMatrices: {
    list: 'category-matrices-list',
    detail: 'category-matrices-detail',
  },
  // ============================================
  // Cadastros Base — Técnicas Diagnóstico (DiagnosticTechnique)
  // ============================================
  // ============================================
  // Cadastros Base — Estados (State) — catálogo global read-only
  // ============================================
  states: {
    list: 'states-list',
    detail: 'states-detail',
  },
  // ============================================
  // Gestão de Frota — Revisões Agendadas (ScheduledReview, F-104,
  // 97-Esteiras/005, TASK-REVAG-FE-01) — catálogo global read-only. Chave
  // DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `productionCycles`/`stocks`, NUNCA
  // string literal.
  // ============================================
  scheduledReviews: {
    scheduledReview: languageEnUs.US.scheduledReviews.scheduledReview.singularLabel,
    scheduledReviews: languageEnUs.US.scheduledReviews.scheduledReview.pluralLabel,
  },
  // ============================================
  // Gestão de Frota — Transferência de Máquinas (EquipmentTransfer, F-101,
  // 97-Esteiras/005, TASK-ETR-FE-01). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror `scheduledReviews`/`productionCycles`, NUNCA string literal.
  // ============================================
  equipmentTransfers: {
    equipmentTransfer: languageEnUs.US.equipmentTransfers.equipmentTransfer.singularLabel,
    equipmentTransfers: languageEnUs.US.equipmentTransfers.equipmentTransfer.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Tipos de Identificação (IdentificationType) — catálogo
  // global, paginação real
  // ============================================
  // ============================================
  // Cadastros Base — Observação Nascimento (BirthNote) — catálogo global,
  // paginação real + filtro `search`
  // ============================================
  // ============================================
  // Cadastros Base — Indexadores (Indexer) — catálogo global, paginação
  // real + filtro `search` (D9 do contrato de API: busca em `description`
  // OU `descriptive` no backend, UI com 1 único campo)
  // ============================================
  // ============================================
  // Cadastros Base — Previsão de Depreciação (DepreciationForecast) —
  // tela única read-only/simulação, SEM paginação nos 2 endpoints
  // ============================================
  depreciationForecasts: {
    equipmentOptions: 'depreciation-forecasts-equipment-options',
    projection: 'depreciation-forecasts-projection',
  },
  // ============================================
  // Cadastros Base — Un. de Medida (Measurement) — catálogo global, SEM
  // paginação real hoje (GAP-FE-009). `list` reservado para TASK-FE-054
  // (bloqueada) — sem hook próprio ainda; `detail` em uso por TASK-FE-053.
  // ============================================
  // ============================================
  // Cadastros Base — Cidades (City) — catálogo global read-only
  // ============================================
  cities: {
    list: 'cities-list',
    detail: 'cities-detail',
  },
  // ============================================
  // Cadastros Base — Países (Country) — catálogo global read-only, SEM gate
  // de permissão (mirror City/State, TASK-BE-423). Options-source do Select
  // de País do wizard de Fazenda (execução 024, GAP-FE-124/TASK-BE-424).
  // ============================================
  countries: {
    options: 'countries-options',
  },
  // ============================================
  // Cadastros Base — Contador (Escritório de Contabilidade, domínio Fiscal/
  // Contábil)
  // ============================================
  contadores: {
    list: 'contadores-list',
    detail: 'contadores-detail',
    // Emissores Fiscais elegíveis (`GET /contadores/issues-elegiveis`, TASK-
    // CT-03b) — lista SEM paginação, busca client-side no `CheckboxListField`.
    issuesEligible: 'contadores-issues-eligible',
    // Exceção documentada (get_pwa_constants_and_mappers_pattern §6.1) —
    // lookup estático de options (`GET /contadores/options`, CONTRATO-API-
    // LCDPR §10, TASK-LCDPR-FE-01/BE-02), sem label de tradução dedicado
    // (mirror `nfes.issuerOptions`).
    options: 'contadores-options',
  },
  // ============================================
  // Cadastros Base — Sincronização DFe (IssueDfeSyncTime, domínio Fiscal)
  // ============================================
  // TASK-DFE-FE-01 criou o namespace completo (`list`/`detail`/
  // `eligibleIssuers`) para evitar 2 edições neste arquivo — `detail` e
  // `eligibleIssuers` só são CONSUMIDOS pela Tarefa irmã TASK-DFE-FE-02
  // (formulário).
  // ============================================
  // Cadastros Base — Vacinas (Vaccine)
  // ============================================
  vaccines: {
    list: 'vaccines-list',
    detail: 'vaccines-detail',
  },
  // ============================================
  // Cadastros Base — Estorno (ReversalExpense)
  // ============================================
  // ============================================
  // Cadastros Base — Serviços (ServiceExpense)
  // ============================================
  // ============================================
  // Cadastros Base — Parametrizações (TenantParameter) — settings-form de
  // registro único, tenant-scoped (gate por farm ativa, D1 do contrato)
  // ============================================
  // ============================================
  // Cadastros Base — Regras Fiscais (TaxRule)
  // ============================================
  taxRules: {
    list: 'tax-rules-list',
    detail: 'tax-rules-detail',
    options: 'tax-rules-options',
  },
  // ============================================
  // Cadastros Base — Natureza de Operação (NatureOperation)
  // ============================================
  // TASK-NO-FE-01 criou `list` (listagem). TASK-NO-FE-02 adiciona `detail`
  // (formulário create/edit).
  natureOperations: {
    list: 'nature-operations-list',
    detail: 'nature-operations-detail',
  },
  // Cadastros Base — Emissores NFe (Issuer, execução 023)
  // ============================================
  issuers: {
    list: 'issuers-list',
    detail: 'issuers-detail',
    certificate: 'issuers-certificate',
    // PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.7/§3 F-286/F-255 — universo
    // NOVO e DISTINTO de `nfes.issuerOptions` (emissão, força
    // `issues_nfe=true`): `GET /issuers/report-options` (tenant + is_enabled
    // + elegibilidade por fazenda, SEM issues_nfe). Chave própria para não
    // colidir cache com o lookup de emissão.
    reportOptions: 'issuers-report-options',
  },
  // ============================================
  // Fazendas (Farm) — `list` (TASK-FE-320) segue em uso pelo picker "Fazendas
  // Vinculadas" de Emissores NFe (`GET /farms/current-tenant`, sem
  // paginação) — NÃO renomear/remover. `farmsAdminList`/`farmsAdminDetail`
  // (execução 024, TASK-FE-400) são do CRUD administrativo novo
  // (`GET /farms` paginado), recurso de API distinto — ver
  // `farm-admin-service.ts`. `mine` (TASK-FE-920, AJUSTE 3) é o universo do
  // seletor de fazenda ativa do header (`GET /me/farms`, usuário
  // autenticado) — NÃO reaproveitar `list`/`farmsAdminList` (universos e
  // regras de permissão diferentes).
  // ============================================
  farms: {
    list: 'farms-list',
    mine: 'farms-mine',
    // GAP-EMP-01/TASK-EMP-FE-07 — GET /me/farms/current (farm ATIVA/corrente,
    // users_quota). Universo/regra distintos de `mine` (lista) e `list`
    // (picker de Emissores) — NÃO reaproveitar nenhuma das duas chaves.
    current: 'farms-current',
    farmsAdminList: 'farms-admin-list',
    farmsAdminDetail: 'farms-admin-detail',
    // ROTEIRO-FILT-05 (esteira 060, F-264, achado C-P1-06) — `listFarms({
    // only_enabled: true })` do relatório Movimento Bancário. Chave DEDICADA
    // (NÃO reaproveitar `list`) para não colidir no cache do TanStack Query
    // com as ~15 telas que consomem `listFarms()` sem filtro (mesmo
    // `QueryClient` da SPA — chaves iguais compartilhariam o resultado
    // filtrado/não-filtrado entre telas diferentes).
    listEnabled: 'farms-list-enabled',
  },
  // ============================================
  // Cadastros Base — Pessoas Unificado (Person, execução 023)
  // ============================================
  people: {
    list: 'people-list',
    detail: 'people-detail',
  },
  // ============================================
  // Cadastros Base — Fornecedores (Provider, fachada dedicada
  // `/api/v1/providers`, TASK-PR-FE-01) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6.1). Primeiro
  // módulo deste arquivo a seguir o canônico — os demais namespaces acima
  // (string literal kebab/camelCase) são um desvio pré-MCP, não uma
  // referência a clonar (anti-clonagem).
  // ============================================
  cadastrosBase: {
    provider: languageEnUs.US.providers.provider.singularLabel,
    providers: languageEnUs.US.providers.provider.pluralLabel,
    // Contas Bancárias (Account, execução 025, TASK-FE-560) — canônico
    // derivado da tradução, NUNCA string literal (mirror provider acima).
    account: languageEnUs.US.accounts.account.singularLabel,
    accounts: languageEnUs.US.accounts.account.pluralLabel,
    // Proprietários (options-source do CheckboxListField de Account,
    // TASK-FE-567, fecha GAP-FE-155) — derivado da tradução (mirror
    // account/accounts acima), NUNCA string literal.
    proprietaryOptions: languageEnUs.US.accounts.account.form.fields.proprietaries,
    // Proprietários FARM-scoped (`listProprietaryOptions(search, 'farm')`,
    // Custo de Produção Acumulado F-272, esteira 090, correção do 422
    // "proprietário de tenant rejeitado pelo backend farm_proprietary").
    // Chave DEDICADA (mirror `farms.listEnabled`, ROTEIRO-FILT-05/F-264) —
    // NÃO reaproveitar `proprietaryOptions` acima: ~15 telas consomem essa
    // chave com escopo `tenant` (sem filtro); reusar colidiria no cache do
    // mesmo `QueryClient` e vazaria proprietários da fazenda ativa para
    // telas tenant-wide (ou vice-versa) entre navegações na mesma sessão.
    proprietaryOptionsFarmScoped: 'proprietary-options-farm-scoped',
    // Proprietários (Proprietary, fachada dedicada `/api/v1/proprietaries`,
    // TASK-PY-FE-01) — mesmo padrão canônico de `provider`/`providers`.
    proprietary: languageEnUs.US.proprietaries.proprietary.singularLabel,
    proprietaries: languageEnUs.US.proprietaries.proprietary.pluralLabel,
    // Clientes (Client, fachada dedicada `/api/v1/clients`, TASK-CL-FE-01) —
    // SCAFFOLD ADIANTADO POR ESPELHAMENTO (ver nota de cabeçalho de
    // `@/@types/v2/CadastrosBase/client/index.d.ts`) — mesmo padrão canônico
    // de `provider`/`proprietary`.
    client: languageEnUs.US.clients.client.singularLabel,
    clients: languageEnUs.US.clients.client.pluralLabel,
    // Funcionários (Employee, fachada dedicada `/api/v1/employees`,
    // TASK-EMP-FE-01) — mesmo padrão canônico de `provider`/`proprietary`/
    // `client`.
    employee: languageEnUs.US.employees.employee.singularLabel,
    employees: languageEnUs.US.employees.employee.pluralLabel,
    // Áreas (Area — subdivisão geoespacial da Fazenda, F-348/UT-000446,
    // esteira 067, TASK-FE-415 fundação) — mesmo padrão canônico de
    // `provider`/`proprietary`/`client`/`employee` (par singular/plural
    // derivado da tradução, chave em inglês). Namespace `area`/`areas` —
    // DISTINTO de `batchAreas`/`eligibleAreas` (vínculo Lote×Área, módulo
    // BatchArea, chaves próprias mais abaixo neste arquivo).
    area: languageEnUs.US.areas.area.singularLabel,
    areas: languageEnUs.US.areas.area.pluralLabel,
  },
  // ============================================
  // Catálogo de Função/CBO (Functions) — options-source do wizard de Pessoas
  // (papel Employee, TASK-BE-332); sem tela de CRUD própria ainda.
  // ============================================
  functionOptions: {
    list: 'function-options-list',
  },
  // ============================================
  // Administrativo — Gestão Pessoal — Funções (Function, CRUD completo,
  // TASK-FN-FE-01) — PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mesmo padrão de `markers`.
  // Bloco DISTINTO de `functionOptions` acima (que continua intocado,
  // exclusivo do wizard de Pessoas) — evita colisão de queryKey.
  // ============================================
  functions: {
    function: languageEnUs.US.functions.function.singularLabel,
    functionsList: languageEnUs.US.functions.function.pluralLabel,
  },
  // ============================================
  // Administrativo — Gestão Pessoal — Eventos (Event, CRUD completo,
  // TASK-FE-EVT-01/02) — PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `functions`/`markers`.
  // ============================================
  events: {
    event: languageEnUs.US.events.event.singularLabel,
    eventsList: languageEnUs.US.events.event.pluralLabel,
  },
  // ============================================
  // Administrativo — Gestão Pessoal — Funcionário x Eventos (EmployeeEvent,
  // CRUD via `sync`, TASK-FE-FXE-01/02) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `functions`/`events`. Bloco DISTINTO de `cadastrosBase.employee(s)`
  // (Funcionários, TASK-EMP-FE-*) — este namespace é do PIVOT
  // Funcionário×Evento, não do CRUD de Funcionário (reaproveitado apenas
  // como picker/read-only pela Tela 1, sem chave própria adicional).
  // ============================================
  employeeEvents: {
    employeeEvent: languageEnUs.US.employeeEvents.employeeEvent.singularLabel,
    employeeEventsList: languageEnUs.US.employeeEvents.employeeEvent.pluralLabel,
  },
  // ============================================
  // Administrativo — Gestão Pessoal — Equipes (Team, fundação + Tela 1,
  // TASK-EQ-FE-01) — PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `functions`/`events`.
  // Namespace `workTeams` — NUNCA `teams` (bloco `teams` acima é do domínio
  // SaaS/billing, "Meus Times"; GAP-EQ-FE-01, front-contract-equipes.md §1.3).
  // ============================================
  workTeams: {
    workTeam: languageEnUs.US.workTeams.workTeam.singularLabel,
    workTeamsList: languageEnUs.US.workTeams.workTeam.pluralLabel,
    // Satélites de opções do formulário (TASK-EQ-FE-02) — sem contraparte de
    // i18n própria (mesmo padrão de `cboOptions`/`userOptions` abaixo).
    // `memberOptions` é combinada com `type` (2|3) na queryKey pelo hook
    // consumidor (`useMemberOptions`) — cache COMPARTILHADO entre linhas do
    // repeater, uma requisição por tipo por sessão (contrato de tela §5.4).
    supervisorOptions: 'work-teams-supervisor-options',
    memberOptions: 'work-teams-member-options',
  },
  // ============================================
  // Operacional — Romaneios (Transfer, fundação + Tela 1, TASK-TRF-FE-01) —
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `workTeams`/`events`.
  // Namespace `transfers` — LIVRE (front-contract-romaneios.md §1.3), sem
  // colisão com nenhum bloco existente.
  // ============================================
  transfers: {
    transfer: languageEnUs.US.transfers.transfer.singularLabel,
    transfers: languageEnUs.US.transfers.transfer.pluralLabel,
  },
  // ============================================
  // Operacional — Ordens de Serviço (ServiceOrder, fatia READ — fundação +
  // Listagem + Visualização, TASK-FE-2001/2002/2003, esteira 038). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês), NUNCA string literal (get_pwa_constants_and_mappers_
  // pattern §6), mirror `transfers`/`workTeams`. Namespace `serviceOrders` —
  // LIVRE, sem colisão com nenhum bloco existente. Camada de ESCRITA
  // (create/update) BLOQUEADA por D-FRONT-01 — sem chave própria aqui até a
  // TASK-FE-2004 desbloquear.
  // ============================================
  serviceOrders: {
    serviceOrder: languageEnUs.US.serviceOrders.serviceOrder.singularLabel,
    serviceOrders: languageEnUs.US.serviceOrders.serviceOrder.pluralLabel,
  },
  // ============================================
  // Operacional — Monitoramento (MonitoringServiceOrder, tela ÚNICA de
  // listagem/filtro, SEM CRUD, TASK-MO-FE-01, esteira `97-Esteiras/057`).
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `serviceOrders`.
  // Namespace `monitoring` — PRÓPRIO, NÃO reaproveita `serviceOrders`
  // (contrato de API/permissão distintos, `monitoring-service-orders_view`
  // ≠ `service-orders_view`, ver §3 do contrato de tela).
  // ============================================
  monitoring: {
    monitoring: languageEnUs.US.monitoring.singularLabel,
    monitorings: languageEnUs.US.monitoring.pluralLabel,
  },
  // Operacional — Avaliações de Ordem de Serviço (RatingServiceOrder,
  // TASK-FE-041-AVL-01, esteira 041). PADRÃO CANÔNICO: derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês), NUNCA string
  // literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `serviceOrders`. Namespace `ratingServiceOrders` — LIVRE, top-level
  // (não aninhado sob `operacional.*`, mesmo padrão de fato já registrado
  // para `serviceOrders`/`plannings`).
  // ============================================
  ratingServiceOrders: {
    ratingServiceOrder: languageEnUs.US.ratingServiceOrders.ratingServiceOrder.singularLabel,
    ratingServiceOrders: languageEnUs.US.ratingServiceOrders.ratingServiceOrder.pluralLabel,
  },
  // Operacional — Minhas OS (MyServiceOrder, listagem+execução restrita ao
  // executor logado, TASK-MOS-FE-01, esteira `97-Esteiras/063`). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês), NUNCA string literal (get_pwa_constants_and_mappers_
  // pattern §6), mirror literal do bloco `ratingServiceOrders` acima.
  // Namespace `myServiceOrders` — LIVRE, top-level.
  // ============================================
  myServiceOrders: {
    myServiceOrder: languageEnUs.US.myServiceOrders.myServiceOrder.singularLabel,
    myServiceOrders: languageEnUs.US.myServiceOrders.myServiceOrder.pluralLabel,
  },
  // ============================================
  // Operacional/Agricultura — Planejamentos (Planning, raiz da árvore de
  // Planejamento de Cultura/Variedade, TASK-FE-PLAN-01, esteira
  // `97-Esteiras/007`). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `serviceOrders`/
  // `pastures`. Bloco top-level PRÓPRIO (não aninhado sob `operacional.*` —
  // esse namespace não existe hoje neste arquivo; mirror do padrão de fato
  // já registrado acima para `feedlotYards`/`pastures`, não do snippet
  // literal do Roteiro). Namespace `plannings` — LIVRE.
  // ============================================
  plannings: {
    planning: languageEnUs.US.plannings.planning.singularLabel,
    plannings: languageEnUs.US.plannings.planning.pluralLabel,
  },
  // ============================================
  // Venda de Animais (MovementSale — Operacional > Pecuária, TASK-VD-FE-01)
  // Namespace `movementSales` — derivado da tradução (get_pwa_grid_query_pattern).
  // ============================================
  movementSales: {
    movementSale: languageEnUs.US.movementSales.movementSale.singularLabel,
    movementSales: languageEnUs.US.movementSales.movementSale.pluralLabel,
  },
  // ============================================
  // Compra de Animais (MovementPurchase — Operacional > Pecuária, TASK-CP-04)
  // Namespace `movementPurchases` — derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), mirror `movementSales`.
  // ============================================
  movementPurchases: {
    movementPurchase: languageEnUs.US.movementPurchases.movementPurchase.singularLabel,
    movementPurchases: languageEnUs.US.movementPurchases.movementPurchase.pluralLabel,
  },
  // ============================================
  // Nascimentos (BirthAnimal — Operacional > Pecuária, TASK-NASC-FE-01)
  // Namespace `birthAnimals` — derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `transfers`/`movementSales`.
  // ============================================
  birthAnimals: {
    birthAnimal: languageEnUs.US.birthAnimals.birthAnimal.singularLabel,
    birthAnimalsList: languageEnUs.US.birthAnimals.birthAnimal.pluralLabel,
  },
  // ============================================
  // Desmama (Weaning — Operacional > Pecuária > Manejo, TASK-WN-FE-01,
  // esteira 97-Esteiras/043). Namespace `weaning` — derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês), NUNCA string
  // literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `birthAnimals`/`movementSales`.
  // ============================================
  weaning: {
    weaning: languageEnUs.US.weaning.weaning.singularLabel,
    weanings: languageEnUs.US.weaning.weaning.pluralLabel,
  },
  // ============================================
  // Operacional — Agricultura — Marcação (Marking, TASK-MC-FE-01,
  // 97-Esteiras/044). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `weaning`.
  // ============================================
  marcacao: {
    marking: languageEnUs.US.marcacao.marking.singularLabel,
    markings: languageEnUs.US.marcacao.marking.pluralLabel,
  },
  // ============================================
  // Operacional — Agricultura — Carregamentos (Charge, TASK-FE-CG-01,
  // 97-Esteiras/045). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `transfers`/`marcacao`.
  // Namespace `carregamentos` — LIVRE, sem colisão com nenhum bloco existente.
  // ============================================
  carregamentos: {
    charge: languageEnUs.US.carregamentos.charge.singularLabel,
    charges: languageEnUs.US.carregamentos.charge.pluralLabel,
  },
  // ============================================
  // Operacional — Fechamento Semana (ClosingWeek, TASK-FE-FS-01, esteira
  // 97-Esteiras/053). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `carregamentos`/
  // `transfers`. Namespace `fechamentoSemana` — TOP-LEVEL, não aninhado sob
  // `operacional.*` (convenção real deste arquivo, contrato de tela §2).
  // ============================================
  fechamentoSemana: {
    closingWeek: languageEnUs.US.fechamentoSemana.closingWeek.singularLabel,
    closingWeeks: languageEnUs.US.fechamentoSemana.closingWeek.pluralLabel,
  },
  // ============================================
  // Operacional — Vendas — Orçamentos (Budget, F-018, TASK-BG-FE-01,
  // 97-Esteiras/054). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `fechamentoSemana`/
  // `carregamentos`. Namespace `budgets` — TOP-LEVEL, LIVRE.
  // ============================================
  budgets: {
    budget: languageEnUs.US.budgets.budget.singularLabel,
    budgets: languageEnUs.US.budgets.budget.pluralLabel,
    nextCode: 'budgets-next-code',
  },
  // ============================================
  // Operacional — Vendas — Pedidos (Order, F-051, PED-FE-01, 97-Esteiras/043).
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `budgets`. Namespace
  // `orders` — TOP-LEVEL, LIVRE.
  // ============================================
  orders: {
    order: languageEnUs.US.orders.order.singularLabel,
    orders: languageEnUs.US.orders.order.pluralLabel,
    nextCode: 'orders-next-code',
    // SALE-FE-COM-10 — `GET /orders/{uuid}/sale-draft` (hidratação de
    // `GerarVendaFromOrder.tsx`). Chave composta por concatenação de label
    // (nunca literal solto), mirror `sales.saleNfeDraft`.
    saleDraft: languageEnUs.US.orders.order.singularLabel + 'SaleDraft',
  },
  // Cbo não tem módulo de i18n próprio (fora de escopo, DA-FN-05) — string
  // literal é a EXCEÇÃO documentada, mesmo padrão já usado por
  // `functionOptions`/`userOptions` acima (que também não derivam de tradução).
  cboOptions: {
    list: 'cbo-options-list',
  },
  // ============================================
  // Usuários (User) — options-source do picker "Encarregados" de Pessoas;
  // sem tela de CRUD administrativo própria nesta feature.
  // ============================================
  userOptions: {
    list: 'user-options-list',
  },
  // ============================================
  // Usuários (User) — CRUD administrativo completo (Cadastros Base / Pessoas,
  // execução 027, TASK-FE-801). Bloco DISTINTO de `userOptions` ACIMA (que
  // continua intocado, exclusivo do picker de Encarregados de Pessoas) —
  // evita colisão de queryKey. PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `markers`/`functions`.
  // ============================================
  users: {
    user: languageEnUs.US.users.user.singularLabel,
    usersList: languageEnUs.US.users.user.pluralLabel,
    // F-141 (Autorizadores, esteira 089, Slice 2) — sub-chave NOVA, aditiva,
    // para o lookup tenant-wide `listUserAuthorizerOptions`
    // (`GET /users/authorizer-options`). Distinta de `userOptions.list`
    // (picker de Encarregados de Pessoas, `/users/boss-options`) e do bloco
    // `users` acima (CRUD administrativo) — nenhum dos dois é reaproveitado
    // (universos e consumidores diferentes, mesma disciplina de §7.2/§10 do
    // contrato: nunca recriar/colidir bloco existente).
    authorizerOptions: 'users-authorizer-options-list',
  },
  // ============================================
  // Administrativo — Suprimentos — Solicitação de Compras (RequestPurchase,
  // TASK-RP-FE-04). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `users`/`functions`, NUNCA string literal (get_pwa_constants_and_mappers_pattern §6).
  // ============================================
  requestPurchases: {
    requestPurchase: languageEnUs.US.requestPurchases.requestPurchase.singularLabel,
    requestPurchasesList: languageEnUs.US.requestPurchases.requestPurchase.pluralLabel,
    // TASK-RP-FE-13 (GRUPO B) — chaves PRÓPRIAS para "Meus Processos"/
    // "Rejeitados", evitando colisão de cache com `requestPurchasesList`
    // (mesma entidade, filtro de negócio diferente server-side).
    myProcessesList: languageEnUs.US.requestPurchases.requestPurchase.myProcesses.titleModule,
    rejectedList: languageEnUs.US.requestPurchases.requestPurchase.rejected.titleModule,
    // TASK-CQ-FE-13 — chave PRÓPRIA para o hub tenant-wide "Cotações"
    // (`/administrativo/cotacoes`, status IN [1,2]), evitando colisão de
    // cache com `requestPurchasesList` (mesma entidade, escopo diferente:
    // `list()` é user-scoped, `inQuotation()` é tenant-wide).
    inQuotationList: languageEnUs.US.requestPurchases.requestPurchase.inQuotation.titleModule,
    // TASK-CPS-FE-01 (esteira 036) — chave PRÓPRIA para a fila "Compras"
    // (`/administrativo/compras`, `GET /request-purchases/in-purchase`),
    // evitando colisão de cache com `requestPurchasesList`/`inQuotationList`
    // (mesma entidade, escopo/filtro server-side diferente) — mirror
    // `inQuotationList` acima.
    inPurchaseList: languageEnUs.US.requestPurchases.requestPurchase.inPurchase.titleModule,
    // Autorizadores ELEGÍVEIS (`GET /request-purchases/{uuid}/eligible-
    // authorizers`, TASK-CQ-FE-07, Dimensão B do roteiro de Cotações) — lista
    // SEM paginação, escopada por RequestPurchase — mirror
    // `issueDfeSyncTimeEligibleIssuers`/`batchGrazings.eligibleBatches`
    // (exceção documentada: string literal, não par singular/plural
    // derivado da tradução — mesma classe de exceção já usada nesses dois).
    eligibleAuthorizers: 'request-purchases-eligible-authorizers',
    // Execução 081 (T-081-FE-01) — chaves literais (mesma exceção de
    // `eligibleAuthorizers`: queries auxiliares escopadas por solicitação).
    // Candidatos a novo responsável (`GET .../{uuid}/transfer-options`).
    transferOptions: 'request-purchases-transfer-options',
    // Encarregados permitidos ao solicitante (`GET .../authorizer-options`).
    authorizerOptions: 'request-purchases-authorizer-options',
    // Solicitações negadas não lidas (modal "Sua(s) solicitação(ões) foram negada(s):").
    deniedRequests: 'request-purchases-denied-requests',
    // Mapa de Cotações (download xlsx, `GET .../{uuid}/quotation-map`).
    quotationsMap: 'request-purchases-quotation-map',
    // UT-000743 — preview do próximo código (`GET .../next-code`, modo criar);
    // chave literal própria (exceção documentada, mirror `authorizerOptions`),
    // sem colisão com `requestPurchase` (detalhe).
    nextCode: 'request-purchases-next-code',
  },
  // Execução 081 (T-081-FE-01, DEP-API-10) — notificações de Suprimentos
  // (sino global, FE-11). Literais: recurso HTTP distinto das entidades de negócio.
  supplyNotifications: {
    list: 'supply-notifications-list',
  },
  // ============================================
  // Administrativo — Suprimentos — Autorização (RequestAuthorization,
  // TASK-AUTH-FE-01, esteira 97-Esteiras/038). PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `requestPurchases` acima. Namespace PRÓPRIO e MODULAR — NÃO reusa
  // `queryKey.requestPurchases.*` (recurso HTTP distinto,
  // `request-authorizations`, mesmo agregado de domínio `RequestPurchase`,
  // mas cache colidiria).
  // ============================================
  requestAuthorizations: {
    requestAuthorization: languageEnUs.US.requestAuthorizations.requestAuthorization.singularLabel,
    requestAuthorizationsList:
      languageEnUs.US.requestAuthorizations.requestAuthorization.pluralLabel,
  },
  // ============================================
  // Administrativo — Suprimentos — Recebimentos (RequestReceipt, TASK-RCB-FE-00,
  // esteira 97-Esteiras/040). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `requestAuthorizations` acima. Namespace PRÓPRIO e MODULAR — NÃO reusa
  // `queryKey.requestPurchases.*`/`queryKey.requestAuthorizations.*` (recurso
  // HTTP distinto, `request-receipts`, mesmo agregado de domínio
  // `RequestPurchase`, mas cache colidiria).
  // ============================================
  requestReceipts: {
    requestReceipt: languageEnUs.US.requestReceipts.requestReceipt.singularLabel,
    requestReceiptsList: languageEnUs.US.requestReceipts.requestReceipt.pluralLabel,
  },
  // ============================================
  // Administrativo — Suprimentos — Parâmetros SLA (SupplyStatusSla,
  // TASK-FE-SLA-01). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `requestPurchases`/`stocks`, NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6).
  // ============================================
  supplyStatusSlas: {
    supplyStatusSla: languageEnUs.US.supplyStatusSlas.supplyStatusSla.singularLabel,
    supplyStatusSlaList: languageEnUs.US.supplyStatusSlas.supplyStatusSla.pluralLabel,
  },
  // ============================================
  // Administrativo — Sistema — Logs do Sistema (SystemLogs, execução 079).
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`).
  // Sub-chaves por prefixo: [systemLogs, 'directory'|'content'|'search', ...].
  // ============================================
  systemLogs: {
    systemLog: languageEnUs.US.systemLogs.systemLog.singularLabel,
    systemLogs: languageEnUs.US.systemLogs.systemLog.pluralLabel,
  },
  // ============================================
  // Relatório SLA (SupplyStatusSlaReport — Administrativo / Suprimentos,
  // TASK-SLA-FE-01, esteira 97-Esteiras/037). Módulo NOVO e ISOLADO, sem
  // grid/paginação — só download síncrono. Sem consumidor de `useQuery`
  // hoje (a chave existe para consistência do padrão i18n×query-key,
  // get_pwa_i18n_pattern §6 — reservada para eventual cache futuro).
  // ============================================
  supplyStatusSlaReport: {
    supplyStatusSlaReport: languageEnUs.US.supplyStatusSlaReport.titleModule,
  },
  // ============================================
  // Dashboards — Suprimentos (SupplyDashboard, Tarefa 38, esteira
  // 97-Esteiras/009). Agregado só-leitura SEM paginação — `useQuery` DIRETO
  // (PADRÃO 12/Hook 7, `get_pwa_grid_query_pattern`). Chave FIXA (não
  // derivada da tradução, mirror `harvests.detail`) — não há par
  // singular/plural de listagem aqui, é 1 agregado único por filtro.
  // ============================================
  supplyDashboard: {
    detail: 'supply-dashboard-detail',
  },
  // ============================================
  // Financeiro — Gestão de Contratos (Contract, TASK-CTR-FE-05). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — mirror `requestPurchases`/`users`, NUNCA string
  // literal (get_pwa_constants_and_mappers_pattern §6).
  // ============================================
  contracts: {
    contract: languageEnUs.US.contracts.contract.singularLabel,
    contractsList: languageEnUs.US.contracts.contract.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Classes de Produto (Kind — Cadastros Base / Estrutura,
  // execução 024, TASK-FE-460, 3º nível GroupProduct→CategoryProduct→Kind)
  // ============================================
  kinds: {
    list: 'kinds-list',
    detail: 'kinds-detail',
  },
  // ============================================
  // Cadastros Base — Afiliados (Partner — Cadastros Base / Pessoas,
  // execução 024, TASK-FE-430). Catálogo GLOBAL, sem ID de contexto (mirror
  // `kinds`).
  // ============================================
  afiliados: {
    partner: 'afiliados-partner',
    partners: 'afiliados-partners',
  },
  // ============================================
  // Cadastros Base — Categorias Animais (CategoryAnimal — Pecuários,
  // execução 025, TASK-FE-540). Catálogo GLOBAL, sem ID de contexto (mirror
  // `kinds`/`breeds`). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `cadastrosBase.provider/providers`, NUNCA string literal (o padrão de
  // `breeds`/`kinds`/`afiliados` acima é o desvio pré-MCP, não uma referência
  // a clonar).
  // ============================================
  categoryAnimals: {
    categoryAnimal: languageEnUs.US.categoryAnimals.categoryAnimal.singularLabel,
    categoryAnimalsList: languageEnUs.US.categoryAnimals.categoryAnimal.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Embalagens (Package) — catálogo tenant-scoped
  // (farm.context estrito, dado NÃO filtrado por fazenda — ver guard hasFarm
  // em TASK-FE-521/522), mirror estrutural de Kind/Measurement.
  // ============================================
  packages: {
    list: 'packages-list',
    detail: 'packages-detail',
    options: 'packages-options', // NOVO (ERRO-FE-018) — consumido por usePackageOptionsList (Produtos/Catálogo), invalidado pelas 3 mutations de Package (criar/editar/excluir)
  },
  // ============================================
  // Cadastros Base — Produtos (Product — "Catálogo", execução 025,
  // TASK-FE-500). Fundação de dados apenas — a listagem/formulário/detalhe
  // chegam em TASK-FE-502..505. PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `categoryAnimals`/`cadastrosBase.provider/providers`, NUNCA string
  // literal (exigência do task-packet, severidade máxima).
  // ============================================
  products: {
    product: languageEnUs.US.products.product.singularLabel,
    productsList: languageEnUs.US.products.product.pluralLabel,
    // Relatório "Faturamento" (F-286, esteira 97-Esteiras/054,
    // TASK-054-286-FE-01) — options-source do `CheckboxListField` "Produtos"
    // (`listProductOptions`). Sem label de tradução dedicado para "options"
    // (mirror `equipments.options`/`countries.options` acima) — string
    // literal é a EXCEÇÃO documentada, não o par singular/plural.
    options: 'products-options',
  },
  // ============================================
  // Cadastros Base — Inventário (Equipment — Bens/Ativos, execução 026,
  // TASK-FE-1001). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `products`/`categoryAnimals`/`cadastrosBase.provider/providers`, NUNCA
  // string literal (mandato explícito da Tarefa e do task-packet).
  // ============================================
  equipments: {
    equipment: languageEnUs.US.equipments.equipment.singularLabel,
    equipmentsList: languageEnUs.US.equipments.equipment.pluralLabel,
    // NOVO (execução 027, TASK-FE-840) — options-source do
    // `SelectAsyncPaginate` de `equipment_uuid` no filtro de Depreciação
    // (`listEquipmentCatalogOptions`). Sem label de tradução dedicado para
    // "options" (mirror `packages.options`/`countries.options` acima) —
    // string literal é a EXCEÇÃO documentada, não o par singular/plural.
    options: 'equipments-options',
  },
  // ============================================
  // Cadastros Base — Estoque Inicial (OpeningBalance, execução 026,
  // TASK-FE-1040 — fundação de dados). PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) —
  // mirror `equipments`/`products`/`categoryAnimals`/
  // `cadastrosBase.provider/providers`, NUNCA string literal.
  // ============================================
  openingBalances: {
    openingBalance: languageEnUs.US.openingBalances.openingBalance.singularLabel,
    openingBalancesList: languageEnUs.US.openingBalances.openingBalance.pluralLabel,
  },
  // ============================================
  // Cadastros Base — Depreciação Mensal / Depreciação Animal (Depreciation —
  // Bens/Ativos, execução 027, TASK-FE-840). PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `equipments`/`products`/`categoryAnimals`, NUNCA string literal. Chaves
  // compostas (`depreciationEquipmentList`/`depreciationAnimalList`) por
  // concatenação do label plural + sufixo de domínio (mirror
  // `stockAgreements`/`locationSpaces` do catálogo canônico,
  // get_pwa_constants_and_mappers_pattern §6.1) — as 2 abas
  // Equipamento/Animal da mesma tela precisam de queryKeys distintas.
  // ============================================
  depreciations: {
    depreciation: languageEnUs.US.depreciations.depreciation.singularLabel,
    depreciationEquipmentList: languageEnUs.US.depreciations.depreciation.pluralLabel + 'Equipment',
    depreciationAnimalList: languageEnUs.US.depreciations.depreciation.pluralLabel + 'Animal',
  },
  // ============================================
  // Cadastros Base — Pecuários — Rebanho (Animal, execução 027, TASK-FE-880).
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês) — mirror `categoryAnimals`/`products`/
  // `equipments`/`openingBalances`, NUNCA string literal. Root PLURAL
  // ("animals"), mesma convenção dos módulos citados — ajustado da ilustração
  // singular do task-packet à convenção real deste arquivo (a própria Tarefa
  // instrui "ajustar aos nomes reais do dicionário criado nesta Tarefa").
  // ============================================
  animals: {
    animal: languageEnUs.US.animals.animal.singularLabel,
    animalsList: languageEnUs.US.animals.animal.pluralLabel,
    // TASK-FA-FE-02 (F-042, Localizar Animal) — lookup SEM paginação real de
    // entidade própria (`GET /animals/options`, `listAnimalOptions`, já
    // existente e órfã — primeiro consumidor: `SURF-FIELD-ANIMAL-ID`, TASK-
    // FA-FE-03). Sem label de tradução dedicado para "options" — EXCEÇÃO
    // documentada, mirror exato de `batches.options`, NUNCA a regra.
    options: 'animals-options',
  },
  // ============================================
  // Cadastros Base — Pecuários — Lotes (Batch) — options-source do Select de
  // Lote no filtro de Animal (GET /batches/options, TASK-FE-880/881 —
  // reconciliação do Maestro, endpoint entregue pelo backend nesta mesma
  // execução). Sem tela de CRUD própria — sem label de tradução dedicado para
  // "options" (mirror `packages.options`/`equipments.options`/
  // `countries.options` acima) — string literal é a EXCEÇÃO documentada, não
  // o par singular/plural.
  // ============================================
  // PADRÃO CANÔNICO (TASK-FE-1077): `list`/`detail` derivados do par
  // singular/plural de `languageEnUs.US.batches.batch` (mirror `animals`
  // acima) — NUNCA string literal escrita à mão. `options` é a ÚNICA exceção
  // preservada (endpoint `/batches/options`, outro model, sem label de
  // tradução dedicado — TASK-FE-880/881, documentado no header de
  // `batch-service.ts`).
  batches: {
    list: languageEnUs.US.batches.batch.pluralLabel,
    detail: languageEnUs.US.batches.batch.singularLabel,
    options: 'batches-options',
    // TASK-FE-1089 — candidatos de animal a vincular (GET /animal-batches/
    // candidate-animals), outro model/endpoint (sem paginação real, sem par
    // singular/plural próprio) — mesma exceção documentada de `options`
    // acima.
    candidateAnimals: 'batches-candidate-animals',
  },
  // ============================================
  // Operacional — Pecuária — Transferência Animais/Lote (BatchTransfer,
  // feature `426be835`, TASK-LOTE-FE-01/02). Exceção deliberada à regra de
  // derivar da tradução: não existe entidade "lista de transferências" com
  // par singular/plural — são chaves auxiliares de picker/options, mesmo
  // precedente de `batchGrazings.eligibleBatches`/`batches.candidateAnimals`
  // acima.
  // ============================================
  batchTransfers: {
    eligibleAnimals: 'batch-transfers-eligible-animals',
    createOptions: 'batch-transfers-create-options',
  },
  // ============================================
  // Cadastros Base — Pecuários — Parâmetros Animais
  // PADRÃO CANÔNICO (TASK-FE-1077): `list`/`detail` derivados do par
  // singular/plural de `languageEnUs.US.parameterAnimals.parameterAnimal`.
  // ============================================
  parameterAnimals: {
    list: languageEnUs.US.parameterAnimals.parameterAnimal.pluralLabel,
    detail: languageEnUs.US.parameterAnimals.parameterAnimal.singularLabel,
    // TASK-FE-1088 — lookup ENXUTO de Espécie (`/species/options`, outro
    // model, sem label de tradução dedicado no par singular/plural do
    // módulo) para o form de Parâmetro Animal. Mesma exceção documentada em
    // `batches.options` acima — string literal, própria para não colidir
    // com `queryKey.species.list` (grid de administração de Espécies, outro
    // shape de dado, mesmo endpoint-família).
    specieOptions: 'parameter-animals-specie-options',
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing, execução 029,
  // TASK-FE-2000 — chokepoint de FUNDAÇÃO). PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `markers`/`functions`/`users`/`products`/`equipments`/`categoryAnimals`,
  // NUNCA string literal (`contrato-fe-convencoes-chokepoints.md §3`).
  // ============================================
  batchGrazings: {
    batchGrazing: languageEnUs.US.baseRegistrations.batchGrazing.singularLabel,
    batchGrazingsList: languageEnUs.US.baseRegistrations.batchGrazing.pluralLabel,
    // Lotes ELEGÍVEIS (adendo pós-E2E Achados 3+4, TASK-FE-2005,
    // `contrato-adendo-lotes-elegiveis-metricas.md §3/§4.2`) — alimenta o
    // picker "Lote" da criação, SUBSTITUINDO `batches.options` nesta tela.
    // SEM par de tradução — mirror `issueDfeSyncTimeEligibleIssuers`/
    // `batches.options` (exceção documentada, não o par singular/plural).
    eligibleBatches: 'batch-grazings-eligible-batches',
    // Módulos de Pastejo ELEGÍVEIS — correção pós-reprovação de fidelidade
    // (esteira 061-reprovacoes, roteiro-lote-modulo-fidelidade.md §4.1) —
    // alimenta o Select "Módulo" da criação, SUBSTITUINDO o fetch cru de
    // `listGrazings` (que listava TODOS os módulos, inclusive já vinculados
    // — divergência de fidelidade contra `BatchGrazingController::create()`
    // do legado). SEM par de tradução — mesma exceção de `eligibleBatches`.
    eligibleGrazings: 'batch-grazings-eligible-grazings',
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Área (BatchArea, execução 029,
  // TASK-FE-2100 — chokepoint de FUNDAÇÃO). Mesmo padrão canônico de
  // `batchGrazings` acima.
  // ============================================
  batchAreas: {
    batchArea: languageEnUs.US.baseRegistrations.batchArea.singularLabel,
    batchAreasList: languageEnUs.US.baseRegistrations.batchArea.pluralLabel,
    // Lotes ELEGÍVEIS (adendo pós-E2E Achados 3+4, TASK-FE-2105) — mirror
    // exato de `batchGrazings.eligibleBatches` acima.
    eligibleBatches: 'batch-areas-eligible-batches',
    // Áreas ELEGÍVEIS — correção pós-reprovação de fidelidade (esteira
    // 061-reprovacoes, roteiro-lote-area-fidelidade.md §4.1) — alimenta o
    // Select "Área" da criação, SUBSTITUINDO o loop de páginas sobre
    // `listAreas` (que listava TODAS as áreas ativas, inclusive já
    // vinculadas — divergência de fidelidade contra
    // `AreaBatchController::create()` do legado). Mirror
    // `batchGrazings.eligibleGrazings` acima.
    eligibleAreas: 'batch-areas-eligible-areas',
  },
  // ============================================
  // Cadastros Base — Pecuários — Cochos (Trough, execução 029, TASK-FE-2200
  // — chokepoint de FUNDAÇÃO). `options` SEM par de tradução — mirror
  // `packages.options`/`equipments.options`/`batches.options` (exceção
  // documentada, não o par singular/plural).
  // ============================================
  troughs: {
    trough: languageEnUs.US.baseRegistrations.trough.singularLabel,
    troughsList: languageEnUs.US.baseRegistrations.trough.pluralLabel,
    options: 'troughs-options',
  },
  // ============================================
  // Cadastros Base — Pecuários — Bebedouros (DrinkingFountain, execução 029,
  // TASK-FE-2300 — chokepoint de FUNDAÇÃO). Mesmo padrão canônico/exceção de
  // `troughs` acima.
  // ============================================
  drinkingFountains: {
    drinkingFountain: languageEnUs.US.baseRegistrations.drinkingFountain.singularLabel,
    drinkingFountainsList: languageEnUs.US.baseRegistrations.drinkingFountain.pluralLabel,
    options: 'drinking-fountains-options',
  },
  // ============================================
  // Configurações — Parâmetros (Parameter, execução 031, TASK-FE-031-40) —
  // global, sem farm_id (contrato-front-parametros.md §2/§4).
  // ============================================
  parameters: {
    list: 'parameters-list',
    detail: 'parameters-detail',
  },
  // ============================================
  // Configurações — Tutoriais (Help, TASK-HP-06). Chave DERIVADA da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) — padrão
  // canônico (get_pwa_constants_and_mappers_pattern §6.1), mirror de
  // `drinkingFountains`/`baseRegistrations.*` acima. `permissionScreens` é
  // exceção documentada — lookup sem entidade própria de tradução (o
  // catálogo de telas não é uma "entidade" do domínio, não tem
  // singularLabel/pluralLabel dedicados).
  // ============================================
  configuracoes: {
    help: languageEnUs.US.configuracoes.help.singularLabel,
    helps: languageEnUs.US.configuracoes.help.pluralLabel,
    permissionScreens: 'permission-screens',
    // Aplicativos (App — versões de release de app móvel, TASK-APP-FE-01,
    // 2026-08-06). PADRÃO CANÔNICO: derivado da tradução (par
    // singular/plural, `languageEnUs`, chave em inglês) — mirror `help`/
    // `helps` acima, NUNCA string literal.
    app: languageEnUs.US.configuracoes.app.singularLabel,
    apps: languageEnUs.US.configuracoes.app.pluralLabel,
    // Configuração (settings singleton de plataforma, execução 032,
    // TASK-FE-2600) — NOVO. `planRoles` sem entidade de tradução própria
    // (leitura mínima, só para popular o select "Plano padrão" — contrato
    // de tela §6.3/§6.4).
    config: languageEnUs.US.configuracoes.config.singularLabel,
    planRoles: 'plan-roles-options',
  },
  // ============================================
  // Operacional — Contratos de Venda (SaleContract — Agricultura, esteira
  // 036, TASK-FE-036-201). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `products`/`clients`, NUNCA string literal.
  // ============================================
  saleContracts: {
    saleContract: languageEnUs.US.saleContracts.saleContract.singularLabel,
    saleContractsList: languageEnUs.US.saleContracts.saleContract.pluralLabel,
    // `GET /sale-contracts/options` (F-331, TASK-RVC-FE-01) — lookup FLAT
    // farm-scoped consumido por `useOptionsSelectQuery` no relatório
    // Romaneio/Vendas/Contrato. Mirror da convenção `${singularLabel}-options`
    // já usada por `dietOptions`/`productOptions` acima.
    saleContractOptions: `${languageEnUs.US.saleContracts.saleContract.singularLabel}-options`,
  },
  // ============================================
  // Financeiro — Contas a Receber (Income, execução 036, TASK-FE-036-310) —
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6.1) — mirror
  // `cadastrosBase.client/clients`/`products`/`equipments`.
  // ============================================
  incomes: {
    income: languageEnUs.US.incomes.income.singularLabel,
    incomes: languageEnUs.US.incomes.income.pluralLabel,
  },
  // ============================================
  // Planos (PlanRole) — domínio PRÓPRIO, gestão completa (TASK-FE-2700).
  // `planRoles`/`planRole` movidos de `configuracoes.planRoles` (chave
  // literal, TASK-FE-2600) para chave DERIVADA da tradução — mirror
  // `configuracoes.app`/`apps`. Único consumidor do valor antigo
  // (`Configuracoes/Config/index.tsx`, select "Plano padrão") usa
  // `queryKey.planos.planRoles` a partir desta Tarefa.
  // ============================================
  planos: {
    planRole: languageEnUs.US.planos.planRole.singularLabel,
    planRoles: languageEnUs.US.planos.planRole.pluralLabel,
  },
  // ============================================
  // Doc. Fiscal/Entrada (Invoice) — domínio PRÓPRIO (TASK-FE-2760, execução
  // 033/Onda 3). Chave DERIVADA da tradução — mirror `planos`.
  // ============================================
  invoices: {
    invoice: languageEnUs.US.invoices.invoice.singularLabel,
    invoices: languageEnUs.US.invoices.invoice.pluralLabel,
  },
  // ============================================
  // Entrada de Insumos (InputEntry) — domínio PRÓPRIO (esteira 037, mirror
  // `invoices`). Chave DERIVADA da tradução.
  // ============================================
  inputEntries: {
    inputEntry: languageEnUs.US.inputEntries.inputEntry.singularLabel,
    inputEntries: languageEnUs.US.inputEntries.inputEntry.pluralLabel,
  },
  // ============================================
  // Operacional — Apontamentos (Appropriation) — domínio PRÓPRIO (TASK-FE-2705,
  // execução 033/Onda 3). Chave DERIVADA da tradução — mirror `planos`/`invoices`.
  // ============================================
  appropriations: {
    appropriation: languageEnUs.US.appropriations.appropriation.singularLabel,
    appropriations: languageEnUs.US.appropriations.appropriation.pluralLabel,
  },
  // ============================================
  // Gestão de Frota — Abastecimentos (Supply) — domínio PRÓPRIO, tabela
  // dedicada `supplies` (AD-01, esteira 009, Tarefas 40/41). Chave DERIVADA
  // da tradução — mirror `appropriations` (par singular/plural, `languageEnUs`).
  // ============================================
  supplies: {
    supply: languageEnUs.US.supplies.supply.singularLabel,
    supplies: languageEnUs.US.supplies.supply.pluralLabel,
  },
  // ============================================
  // Operacional — Pastagem (Pasture) — domínio PRÓPRIO (TASK-PAST-FE-00,
  // execução 041). Chave DERIVADA da tradução — mirror `appropriations`
  // (par singular/plural, `languageEnUs`, chave em inglês).
  // ============================================
  pastures: {
    pasture: languageEnUs.US.pastures.pasture.singularLabel,
    pastures: languageEnUs.US.pastures.pasture.pluralLabel,
  },
  // ============================================
  // Operacional — Confinamento — Pátio (FeedlotYard) — domínio PRÓPRIO
  // (TASK-PT-FE-01/02, execução 046). Chave DERIVADA da tradução — mirror
  // `appropriations`/`pastures` (par singular/plural, `languageEnUs`, chave
  // em inglês, PADRÃO CANÔNICO — entidade PAGINADA de verdade, não a exceção
  // client-side de `DocumentType`). Nota: a Tarefa original sugeria aninhar
  // sob um namespace `operacional.*`, que não existe hoje em `query-key.ts`
  // (cada módulo Operacional novo ganha seu PRÓPRIO bloco top-level —
  // `appropriations`/`pastures` acima são o precedente real) — mirror do
  // padrão de fato do arquivo, não do snippet literal da ficha.
  // ============================================
  feedlotYards: {
    feedlotYard: languageEnUs.US.feedlotYards.feedlotYard.singularLabel,
    feedlotYards: languageEnUs.US.feedlotYards.feedlotYard.pluralLabel,
  },
  // ============================================
  // Operacional — Confinamento — Setor (FeedlotSector) — domínio PRÓPRIO
  // (TASK-FS-FE-01/02). Chave DERIVADA da tradução — mirror `feedlotYards`
  // (par singular/plural, `languageEnUs`, chave em inglês, TOP-LEVEL — não
  // aninhado sob `operacional.*`, que não é o padrão de fato deste arquivo).
  // ============================================
  feedlotSectors: {
    feedlotSector: languageEnUs.US.feedlotSectors.feedlotSector.singularLabel,
    feedlotSectors: languageEnUs.US.feedlotSectors.feedlotSector.pluralLabel,
  },
  // ============================================
  // Operacional — Confinamento — Mapa de Confinamento (FeedlotMap) — domínio
  // PRÓPRIO (execução 042, TASK-FE-042-200). Chave DERIVADA da tradução —
  // mirror `feedlotYards`/`feedlotSectors` (par singular/plural,
  // `languageEnUs`, chave em inglês). `tree` é a árvore completa (não
  // paginada) — chave composta por template, mirror `stockAgreements`.
  // ============================================
  feedlotMap: {
    feedlotMap: languageEnUs.US.feedlotMap.feedlotMap.singularLabel,
    tree: `${languageEnUs.US.feedlotMap.feedlotMap.singularLabel}Tree`,
  },
  // ============================================
  // Operacional — Confinamento — Curral standalone (FeedlotCorral, F-035,
  // lote 043, TASK-043-CUR-T01) — domínio PRÓPRIO, ADITIVO (namespace novo,
  // `feedlotMap` acima intocado). Chave DERIVADA da tradução — mirror
  // `feedlotSectors` (par singular/plural, `languageEnUs`, chave em inglês).
  // ============================================
  feedlotCorrals: {
    feedlotCorral: languageEnUs.US.feedlotCorrals.feedlotCorral.singularLabel,
    feedlotCorrals: languageEnUs.US.feedlotCorrals.feedlotCorral.pluralLabel,
    // T09/GAP-API-01 — chave PRÓPRIA do sub-recurso de histórico
    // (`useCustomGridQueryById`), mirror `ibptItems` (string literal, chave
    // DERIVADA da tradução do rótulo da tela, não duplica `feedlotCorral(s)`).
    feedlotCorralHistories: languageEnUs.US.feedlotCorrals.feedlotCorral.list.actions.history,
  },
  // ============================================
  // Operacional — Pecuária — Mortes (DeathAnimal) — domínio PRÓPRIO
  // (TASK-DA-FE-01/02). Chave DERIVADA da tradução — mirror `feedlotYards`/
  // `birthAnimals` (par singular/plural, `languageEnUs`, chave em inglês,
  // TOP-LEVEL — não aninhado sob `operacional.*`, que não é o padrão de fato
  // deste arquivo).
  // ============================================
  deathAnimals: {
    deathAnimal: languageEnUs.US.deathAnimals.deathAnimal.singularLabel,
    deathAnimals: languageEnUs.US.deathAnimals.deathAnimal.pluralLabel,
  },
  // ============================================
  // Operacional — Pluviometria (Rainfall, execução 041, TASK-FE-041-PLV-01).
  // Chave DERIVADA da tradução — mirror `deathAnimals`/`feedlotYards` (par
  // singular/plural, `languageEnUs`, chave em inglês, TOP-LEVEL — módulos
  // Operacional recentes não aninham sob `operacional.*`).
  // ============================================
  rainfalls: {
    rainfall: languageEnUs.US.rainfalls.rainfall.singularLabel,
    rainfalls: languageEnUs.US.rainfalls.rainfall.pluralLabel,
  },
  // ============================================
  // Fiscal — NFe Emitidas (Nfe, execução 036, TASK-FE-036-401). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — mirror `equipments`/`animals`/`products`/`invoices`,
  // NUNCA string literal (get_pwa_constants_and_mappers_pattern §6.1).
  // ============================================
  nfes: {
    nfe: languageEnUs.US.nfes.nfe.singularLabel,
    nfesList: languageEnUs.US.nfes.nfe.pluralLabel,
    // Exceção documentada (get_pwa_constants_and_mappers_pattern §6.1) — sem
    // label de tradução dedicado para este lookup de options (GAP-FE-036-516,
    // cascata Emissor→IE do `NfeEmitModal`); mirror `equipmentOptions`/
    // `specieOptions` (string literal como exceção pontual, não regra).
    issuerOptions: 'nfe-issuer-options',
  },
  // ============================================
  // Fiscal — DFe Recebidas (Dfe, execução 044, TASK-DFE-FE-03). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — mirror `nfes` acima (mesmo domínio Fiscal).
  //
  // DIVERGÊNCIA REGISTRADA (Lei do Registro de Lacuna): a Tarefa
  // (`TASK-DFE-FE-03.md`) presumia um namespace aninhado
  // `languageGB.fiscal.dfe`/`fiscal.dfes`, citando "NfeEmitidas já usa
  // languageGB.fiscal.nfe.*" como precedente. Conferido diretamente no
  // código real (`src/pages/Fiscal/NfeEmitidas/*.tsx`): o acessor REAL é
  // `languageGB.nfes.nfe.*` (namespace TOP-LEVEL `nfes`, não `fiscal.nfe`) —
  // não existe NENHUM namespace `fiscal` em `query-key.ts` nem em
  // `constants/languages/**`. Para não introduzir um namespace `fiscal`
  // órfão (usado por nenhum outro módulo do domínio), `dfes` segue aqui o
  // padrão REAL já em produção (`nfes`), top-level, par singular/plural.
  // ============================================
  dfes: {
    dfe: languageEnUs.US.dfes.dfe.singularLabel,
    dfesList: languageEnUs.US.dfes.dfe.pluralLabel,
    // Exceção documentada — lookup estático de eventos de manifestação
    // (LOOK-04, `GET /dfes/manifest-events`), sem label de tradução próprio
    // (mirror `nfes.issuerOptions`).
    manifestEvents: 'dfe-manifest-events',
    // UT-000752 (T-752-FE-03) — candidatos do Retorno
    // (`GET /dfes/{uuid}/return-candidates`); literal próprio (mesma exceção).
    returnCandidates: 'dfe-return-candidates',
  },
  // ============================================
  // Fiscal — CashBook / LCDPR (Livro Caixa Digital do Produtor Rural,
  // execução 045, TASK-LCDPR-FE-01). PADRÃO CANÔNICO: derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês) — mirror `dfes`
  // acima (mesmo domínio Fiscal).
  //
  // DIVERGÊNCIA REGISTRADA (Lei do Registro de Lacuna, mesmo racional já
  // aplicado a `dfes` acima): `CONTRATO-FRONT-LCDPR.md §2` presumia
  // `queryKey.fiscal.cashBook`/`fiscal.cashBooks`, citando um namespace
  // `fiscal.*` que não existe em NENHUM módulo real deste arquivo. Segue
  // aqui o padrão REAL já em produção (`dfes`/`nfes`), top-level, par
  // singular/plural.
  // ============================================
  cashBooks: {
    cashBook: languageEnUs.US.cashBooks.cashBook.singularLabel,
    cashBooksList: languageEnUs.US.cashBooks.cashBook.pluralLabel,
  },
  // ============================================
  // Fiscal — CT-e (Cte, execução 045, Onda 1, TASK-CTE-FE-01/02). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — mirror `dfes`/`cashBooks` acima (mesmo domínio
  // Fiscal, mesmo racional de "sem namespace `fiscal.*` real neste arquivo").
  // ============================================
  ctes: {
    cte: languageEnUs.US.ctes.cte.singularLabel,
    ctesList: languageEnUs.US.ctes.cte.pluralLabel,
    // Onda 2 (TASK-CTE-FE-09/10) — tela agregada de Emissão SEFAZ
    // (`GET /ctes/{uuid}/emissao`) e lookup de emissores elegíveis
    // (GAP-CTE-FE-04). Exceção documentada, sem label de tradução dedicado
    // (mirror `nfes.issuerOptions`).
    cteEmissao: 'cte-emissao',
    issueOptions: 'cte-issue-options',
  },
  // ============================================
  // Fiscal — Manifestação de CT-e (CteManifestacao, execução 045, Onda 2,
  // TASK-CTE-FE-12/13). PADRÃO CANÔNICO: derivado da tradução (par singular/
  // plural, `languageEnUs`, chave em inglês) — mirror `ctes`/`dfes` acima
  // (mesmo domínio Fiscal). Módulo TOP-LEVEL e PRÓPRIO (rota `/fiscal/cte-
  // manifestacoes`, distinta de `/fiscal/ctes`) — NUNCA aninhado sob `ctes`.
  // ============================================
  cteManifestacoes: {
    cteManifestacao: languageEnUs.US.cteManifestacoes.cteManifestacao.singularLabel,
    cteManifestacoesList: languageEnUs.US.cteManifestacoes.cteManifestacao.pluralLabel,
  },
  // ============================================
  // Fiscal — MDFe (Mdfe, execução 045, Onda 1, TASK-MDFE-FE-01). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês) — mirror `dfes`/`cashBooks`/`ctes` acima (mesmo domínio
  // Fiscal, mesmo racional de "sem namespace `fiscal.*` real neste
  // arquivo" — `CONTRATO-FRONT-MDFE.md §2` confirma por leitura direta do
  // código real: NUNCA `queryKey.fiscal.mdfe`).
  // ============================================
  mdfes: {
    mdfe: languageEnUs.US.mdfes.mdfe.singularLabel,
    mdfesList: languageEnUs.US.mdfes.mdfe.pluralLabel,
    issuerOptions: 'mdfe-issuer-options',
  },
  // ============================================
  // Fiscal — Arquivos XML (F-133, esteira 97-Esteiras/008, Tarefa 36).
  // PADRÃO CANÔNICO: derivado da tradução (par singular/plural + rótulo do
  // lookup de emissores, `languageEnUs`, chave em inglês) — mirror `dfes`
  // (mesmo domínio Fiscal). Os filtros aplicados entram como 2º elemento do
  // array na `queryKey` do hook consumidor (`useXmlDocumentList`), nunca
  // concatenados na string.
  // ============================================
  xmlDocuments: {
    list: languageEnUs.US.xmlDocuments.pluralLabel,
    issuers: languageEnUs.US.xmlDocuments.issuersLabel,
  },
  // ============================================
  // Fiscal — Partida Dobrada (AccountingEntry, F-128, esteira
  // 97-Esteiras/068, TASK-PD-FE-03). PADRÃO CANÔNICO: derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês) — mirror `dfes`
  // acima (mesmo domínio Fiscal).
  //
  // DIVERGÊNCIA REGISTRADA (Lei do Registro de Lacuna): a Tarefa
  // (`TASK-PD-FE-03.md`) presumia um namespace aninhado
  // `queryKey.fiscal.accountingEntry(ies)`, mirror do mesmo pressuposto já
  // corrigido para `dfes` (ver a divergência documentada logo acima). Não
  // existe NENHUM namespace `fiscal` em `query-key.ts` nem em
  // `constants/languages/**` — confirmado de novo nesta Tarefa. Para não
  // introduzir um namespace `fiscal` órfão, `accountingEntries` segue aqui o
  // padrão REAL já em produção (top-level, mirror `dfes`/`xmlDocuments`).
  // ============================================
  accountingEntries: {
    accountingEntry: languageEnUs.US.accountingEntries.accountingEntry.singularLabel,
    accountingEntriesList: languageEnUs.US.accountingEntries.accountingEntry.pluralLabel,
  },
  // ============================================
  // Administrativo — Suprimentos — Cotações (RequestQuotation, esteira
  // 97-Esteiras/035, TASK-CQ-FE-01). PADRÃO CANÔNICO: derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `requestPurchases`, NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6.1). `requestQuotationsByPurchase`
  // (nome exato definido no Roteiro frontend §3.1) é chave PRÓPRIA para a
  // grade da aba Cotações (`GET request-purchases/{uuid}/quotations`, RT-10)
  // — o `requestPurchaseUuid` é acrescentado como 2º elemento do array pelo
  // hook consumidor (mirror `requestPurchases.myProcessesList`/`rejectedList`,
  // chave dedicada por recorte de negócio, evita colisão de cache).
  // ============================================
  requestQuotations: {
    requestQuotation: languageEnUs.US.requestQuotations.requestQuotation.singularLabel,
    requestQuotationsList: languageEnUs.US.requestQuotations.requestQuotation.pluralLabel,
    requestQuotationsByPurchase: `${languageEnUs.US.requestQuotations.requestQuotation.pluralLabel}-by-purchase`,
  },
  // ============================================
  // Administrativo — Gestão Pessoal — Registro de Faltas (Absence, CRUD
  // completo, 97-Esteiras/003 Tarefas 12/13) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `events`/`functions`.
  // ============================================
  absences: {
    absence: languageEnUs.US.absences.absence.singularLabel,
    absencesList: languageEnUs.US.absences.absence.pluralLabel,
  },
  // ============================================
  // Administrativo — Atividades Recentes (RecentActivity, somente leitura,
  // UT-000690 / F-349) — PADRÃO CANÔNICO: derivado da tradução (`languageEnUs`).
  // `recentActivityTypes` é composta (singular + 'Types') — options do filtro.
  // ============================================
  recentActivities: {
    recentActivity: languageEnUs.US.recentActivities.recentActivity.singularLabel,
    recentActivities: languageEnUs.US.recentActivities.recentActivity.pluralLabel,
    recentActivityTypes: `${languageEnUs.US.recentActivities.recentActivity.singularLabel}Types`,
  },
  // ============================================
  // Operacional — Reprodução — Estação de Monta (BreedingSeason, CRUD
  // completo, 97-Esteiras/003 Tarefas 12/13) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `absences`/`events`.
  // ============================================
  breedingSeasons: {
    breedingSeason: languageEnUs.US.breedingSeasons.breedingSeason.singularLabel,
    breedingSeasonsList: languageEnUs.US.breedingSeasons.breedingSeason.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária — Dieta (Diet, TASK-FE-DIET-01). Chave DERIVADA
  // da tradução (par singular/plural, `languageEnUs`, chave em inglês) —
  // padrão canônico, mirror `foods`/`breedingSeasons`, NUNCA string literal.
  // ============================================
  diets: {
    diet: languageEnUs.US.diets.diet.singularLabel,
    diets: languageEnUs.US.diets.diet.pluralLabel,
    // Lookup SEM paginação (`GET /diets/diet-options`) — chave dedicada,
    // evita colidir invalidação com a listagem paginada (`diets` acima).
    dietOptions: `${languageEnUs.US.diets.diet.singularLabel}-options`,
  },
  // ============================================
  // Operacional — Pecuária — Batida (DietBeat, TASK-FE-DIET-04). Chave
  // DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `foodBeats`/`diets`, NUNCA string
  // literal.
  // ============================================
  dietBeats: {
    dietBeat: languageEnUs.US.dietBeats.dietBeat.singularLabel,
    dietBeats: languageEnUs.US.dietBeats.dietBeat.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária/Confinamento — Fases de Alimentação
  // (FeedingPhase, F-034, TASK-FP-FE-01). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror `diets`/`dietBeats`, NUNCA string literal.
  // ============================================
  feedingPhases: {
    feedingPhase: languageEnUs.US.feedingPhases.feedingPhase.singularLabel,
    feedingPhases: languageEnUs.US.feedingPhases.feedingPhase.pluralLabel,
  },
  // ============================================
  // Operacional — Agricultura — Descontos/Classificação (DiscountTable,
  // F-032, TASK-DT-FE-01). Chave DERIVADA da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês) — padrão canônico, mirror
  // `feedingPhases`/`dietBeats`, NUNCA string literal.
  // ============================================
  discountTables: {
    discountTable: languageEnUs.US.discountTables.discountTable.singularLabel,
    discountTables: languageEnUs.US.discountTables.discountTable.pluralLabel,
    // Lookup SEM paginação (`GET /discount-tables/product-options`) — chave
    // dedicada, evita colidir invalidação com a listagem paginada
    // (`discountTables` acima), mirror `diets.dietOptions`.
    productOptions: `${languageEnUs.US.discountTables.discountTable.singularLabel}-product-options`,
  },
  // ============================================
  // Operacional — Pecuária — Transferência ABC de Animais entre Lotes
  // (TransferAbcBatch, 97-Esteiras/039, TASK-FE-039-ABC-01). Chave DERIVADA
  // da tradução (par singular/plural, `languageEnUs`, chave em inglês) —
  // padrão canônico, mirror `farmTransfers`/`dietBeats`, NUNCA string
  // literal. Chave TOP-LEVEL `livestock` (mirror do módulo próprio de
  // tradução homônimo).
  // ============================================
  livestock: {
    transferAbcBatch: languageEnUs.US.livestock.transferAbcBatch.singularLabel,
    transferAbcBatches: languageEnUs.US.livestock.transferAbcBatch.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária — Manejo — Localizar Animal (FindAnimal, F-042,
  // TASK-FA-FE-02). Chave DERIVADA da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês) — padrão canônico, mirror
  // `livestock`/`processamentos` acima. O dicionário i18n do módulo mora no
  // MESMO namespace `livestock` (`livestock.findAnimal`, mirror
  // `transferAbcBatch`), mas a query-key usa uma chave TOP-LEVEL própria
  // (`findAnimals`) para não colidir com o bloco `livestock` acima, que já é
  // dedicado ao par `transferAbcBatch`/`transferAbcBatches`.
  // ============================================
  findAnimals: {
    findAnimal: languageEnUs.US.livestock.findAnimal.singularLabel,
    findAnimals: languageEnUs.US.livestock.findAnimal.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária — Processamentos (Processing, 97-Esteiras/039,
  // TASK-FE-039-PROC-01). Chave DERIVADA da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês) — padrão canônico, mirror
  // `livestock`/`dietBeats`, NUNCA string literal.
  // ============================================
  processamentos: {
    processing: languageEnUs.US.processamentos.processing.singularLabel,
    processings: languageEnUs.US.processamentos.processing.pluralLabel,
    // REWORK (039, PROC-04) — chave composta (singularLabel + sufixo literal
    // "Prepare"): não há label de tradução dedicado para o endpoint de
    // hidratação, mesma classe de exceção documentada em
    // get_pwa_constants_and_mappers_pattern §6.1 ("access"/"companies").
    processingPrepare: `${languageEnUs.US.processamentos.processing.singularLabel}Prepare`,
    // Onda 2 (PROCFID-04) — cascata do bloco "Item Sanitário", chaves
    // compostas (singularLabel + sufixo literal), mesma exceção documentada
    // acima para `processingPrepare` (lookups AJAX sem label de tradução
    // dedicado).
    sanitaryWarehouseStock: `${languageEnUs.US.processamentos.processing.singularLabel}SanitaryWarehouseStock`,
    sanitaryMeasurements: `${languageEnUs.US.processamentos.processing.singularLabel}SanitaryMeasurements`,
  },
  // ============================================
  // Operacional — Pecuária — Transferências — Lote/Fazenda (TransferBatchFarm,
  // 97-Esteiras/041, TASK-FE-041-LF-01..04). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror `livestock`/`processamentos`, NUNCA string literal. Chave
  // TOP-LEVEL `loteFazenda` — LIVRE, sem colisão com `livestock`
  // (`transferAbcBatch`, feature intra-fazenda DIFERENTE, ver
  // `plano-front-lote-fazenda.md §1.1).
  // ============================================
  loteFazenda: {
    transferBatchFarm: languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel,
    transferBatchFarms: languageEnUs.US.loteFazenda.transferBatchFarm.pluralLabel,
    // Lookups sem paginação real/sem label dedicado (mesma exceção
    // documentada em `batches.options`/`processamentos.processingPrepare`
    // acima) — chaves compostas literais.
    eligibleBatches: `${languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel}EligibleBatches`,
    eligibleAnimals: `${languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel}EligibleAnimals`,
    financial: `${languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel}Financial`,
    moduleAreaLast: `${languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel}ModuleAreaLast`,
    // 063-est03-9-reprovacoes, TASK-063-PROC-QA3-04 — lookup de Espécie do
    // modal "Novo Lote" (auto-lock quando só 1 espécie acessível), mesma
    // exceção de chave composta literal de `eligibleBatches` acima.
    newBatchSpecieOptions: `${languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel}NewBatchSpecieOptions`,
    // 063-est03-9-reprovacoes, TASK-063-PROC-QA3-06 — lookup de "Curral
    // Confinamento" (opcional) do modal "Novo Lote", mesma exceção de chave
    // composta literal de `newBatchSpecieOptions`/`eligibleBatches` acima.
    newBatchCorralOptions: `${languageEnUs.US.loteFazenda.transferBatchFarm.singularLabel}NewBatchCorralOptions`,
  },
  // ============================================
  // Operacional — Pecuária — Transferências — Lote/Módulo/Área
  // (BatchModuleAreaTransfer, 97-Esteiras/070, TASK-LMA-FE-01). Chave
  // DERIVADA da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês) — padrão canônico, mirror `loteFazenda` acima, NUNCA string
  // literal. Chave TOP-LEVEL `batchModuleAreaTransfer` — LIVRE, sem colisão
  // com `loteFazenda`/`batchGrazings`/`batchAreas`.
  // ============================================
  batchModuleAreaTransfer: {
    transfer: languageEnUs.US.loteModuloArea.batchModuleAreaTransfer.singularLabel,
    transfers: languageEnUs.US.loteModuloArea.batchModuleAreaTransfer.pluralLabel,
    createOptions: `${languageEnUs.US.loteModuloArea.batchModuleAreaTransfer.singularLabel}CreateOptions`,
    last: `${languageEnUs.US.loteModuloArea.batchModuleAreaTransfer.singularLabel}Last`,
  },
  // ============================================
  // Operacional — Pecuária — Transferências — Animal/Fazenda
  // (TransferAnimalFarm, 97-Esteiras/042, TASK-FE-042-101). Chave DERIVADA da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) — padrão
  // canônico, mirror `loteFazenda`, NUNCA string literal. Chave TOP-LEVEL
  // `animalFazenda` — LIVRE, sem colisão com `livestock`/`loteFazenda`
  // (`transferAnimalFarm` transfere ANIMAIS, `transferBatchFarm` transfere
  // LOTES — domínios distintos).
  // ============================================
  animalFazenda: {
    transferAnimalFarm: languageEnUs.US.animalFazenda.transferAnimalFarm.singularLabel,
    transferAnimalFarms: languageEnUs.US.animalFazenda.transferAnimalFarm.pluralLabel,
    // Lookups sem paginação real/sem label dedicado (mesma exceção
    // documentada em `loteFazenda.eligibleAnimals`/`.financial` acima) —
    // chaves compostas literais.
    eligibleAnimals: `${languageEnUs.US.animalFazenda.transferAnimalFarm.singularLabel}EligibleAnimals`,
    aggregates: `${languageEnUs.US.animalFazenda.transferAnimalFarm.singularLabel}Aggregates`,
    financial: `${languageEnUs.US.animalFazenda.transferAnimalFarm.singularLabel}Financial`,
  },
  // ============================================
  // Operacional — Reprodução — Touros/Sêmen/Embrião (BullSeedSeason,
  // 97-Esteiras/005 Tarefa 24) — PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `breedingSeasons`.
  // ============================================
  bullSeedSeason: {
    bullSeedSeason: languageEnUs.US.bullSeedSeason.bullSeedSeason.singularLabel,
    bullSeedSeasonsList: languageEnUs.US.bullSeedSeason.bullSeedSeason.pluralLabel,
  },
  // ============================================
  // Operacional — Reprodução — Lotes/Reprodução (BreedingBatch,
  // 97-Esteiras/048 Tarefas 04/05/06/07) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `breedingSeasons`/`bullSeedSeason`.
  // ============================================
  breedingBatches: {
    breedingBatch: languageEnUs.US.breedingBatches.breedingBatch.singularLabel,
    breedingBatchesList: languageEnUs.US.breedingBatches.breedingBatch.pluralLabel,
  },
  // ============================================
  // Operacional — Reprodução — Protocolos/Estação (ProtocolSeason, F-057,
  // execução 040, TASK-FE-1050..1059) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `breedingSeasons`/`breedingBatches`.
  // ============================================
  protocolSeasons: {
    protocolSeason: languageEnUs.US.protocolSeasons.protocolSeason.singularLabel,
    protocolSeasonsList: languageEnUs.US.protocolSeasons.protocolSeason.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária — Apartação (Separation, 97-Esteiras/005
  // Tarefa 24) — PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `breedingSeasons`/
  // `bullSeedSeason`.
  // ============================================
  separations: {
    separation: languageEnUs.US.separations.separation.singularLabel,
    separationsList: languageEnUs.US.separations.separation.pluralLabel,
  },
  // ============================================
  // Operacional — Evolução/Rebanho (Evolution, 100% leitura,
  // spa-contract-evolucao-rebanho.md, Tarefas 26/27). Chave DERIVADA da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês) — padrão
  // canônico, mirror `separations`/`stocks`, NUNCA string literal.
  // ============================================
  evolutions: {
    evolution: languageEnUs.US.evolutions.evolution.singularLabel,
    evolutionsList: languageEnUs.US.evolutions.evolution.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária — Perdas (LossAnimal, F-043, execução 040,
  // TASK-FE-2770..2776). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `rastreabilidade`/`protocolSeasons`, NUNCA string literal (diferente do
  // desvio observado no sibling `deathLosses` acima, que usa string literal
  // — achado documentado, não copiado, contrato de tela §7.7.7).
  // ============================================
  lossAnimals: {
    lossAnimal: languageEnUs.US.lossAnimals.lossAnimal.singularLabel,
    lossAnimals: languageEnUs.US.lossAnimals.lossAnimal.pluralLabel,
  },
  // ============================================
  // Operacional — Agricultura — Colheita de Frutas (HarvestProduct, F-040,
  // execução 040, TASK-FE-1092..1101). PADRÃO CANÔNICO: derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês) — mirror
  // `lossAnimals`/`protocolSeasons`, NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6). Namespace `harvestProducts`
  // (plural) — NUNCA `harvests` (módulo de Safra já migrado, ver `harvests`
  // acima, contrato §7.3).
  // ============================================
  harvestProducts: {
    harvestProduct: languageEnUs.US.harvestProduct.singularLabel,
    harvestProducts: languageEnUs.US.harvestProduct.pluralLabel,
  },
  // ============================================
  // Operacional — Reprodução — Gerenciamento Avançado (AdvancedReproductive,
  // F-011, 97-Esteiras/056, TASK-AR-FE-01) — PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `breedingSeasons`/`bullSeedSeason`/`breedingBatches`.
  // ============================================
  advancedReproductive: {
    advancedReproductive: languageEnUs.US.advancedReproductive.advancedReproductive.singularLabel,
    advancedReproductiveList: languageEnUs.US.advancedReproductive.advancedReproductive.pluralLabel,
    // Lookup SEM paginação (`GET /advanced-reproductive/protocol-season-
    // options`) — chave dedicada, evita colidir invalidação com a listagem
    // paginada (`advancedReproductive` acima). Mirror `diets.dietOptions`.
    protocolSeasonOptions: `${languageEnUs.US.advancedReproductive.advancedReproductive.singularLabel}-protocol-season-options`,
  },
  // ============================================
  // Operacional — Agricultura — Rastreabilidade (Traceability +
  // TraceabilityConfig, F-067, `97-Esteiras/058`, TASK-TR-FE-02). PADRÃO
  // CANÔNICO: derivado da tradução (par singular/plural, `languageEnUs`,
  // chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `carregamentos`.
  // Namespace `rastreabilidade` — LIVRE, sem colisão com nenhum bloco
  // existente.
  // ============================================
  rastreabilidade: {
    traceability: languageEnUs.US.rastreabilidade.traceability.singularLabel,
    traceabilities: languageEnUs.US.rastreabilidade.traceability.pluralLabel,
    traceabilityConfig: languageEnUs.US.rastreabilidade.traceabilityConfig.singularLabel,
    traceabilityConfigs: languageEnUs.US.rastreabilidade.traceabilityConfig.pluralLabel,
    // Página PÚBLICA de rastreio (sem login, F-067, TASK-TR-PUB-FE-01) —
    // literal (não derivado de tradução: não é entidade CRUD com par
    // singular/plural), mirror `['public-budget', hash]`/`['public-request-
    // quotation', hash]` já usados por `BudgetPublicPage`/
    // `RequestQuotationPublicPage`. Idioma FORA da key (`CONTRATO-TELA-F067-
    // rastreio-publico.md ## 2`) — a API devolve as 3 variantes sempre no
    // mesmo payload, trocar idioma é só apresentação, sem refetch.
    rastreioPublico: 'public-traceability',
  },
  // Operacional — Reprodução — Acasalamento (BreedingMating, F-016,
  // 97-Esteiras/001, TASK-BM-FE-02) — PADRÃO CANÔNICO: derivado da tradução
  // (par singular/plural, `languageEnUs`, chave em inglês), NUNCA string
  // literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `breedingBatches`/`bullSeedSeason`. `pregnancyDiagnosis` (Diagnóstico de
  // Gestação, sub-árvore aninhada) deriva do MESMO namespace de tradução
  // `breedingMatings.pregnancyDiagnosis`, chave própria para não colidir
  // invalidação com a listagem paginada do Acasalamento.
  // ============================================
  breedingMatings: {
    breedingMating: languageEnUs.US.breedingMatings.breedingMating.singularLabel,
    breedingMatingsList: languageEnUs.US.breedingMatings.breedingMating.pluralLabel,
    pregnancyDiagnosis: languageEnUs.US.breedingMatings.pregnancyDiagnosis.singularLabel,
    pregnancyDiagnosesList: languageEnUs.US.breedingMatings.pregnancyDiagnosis.pluralLabel,
  },
  // ============================================
  // Operacional — Vendas COMERCIAL (Sale, 97-Esteiras/043, SALE-FE-COM-01).
  // Namespace `sales` — TOP-LEVEL, LIVRE (não confundir com `movementSales`,
  // Venda de ANIMAIS, nem com `saleContracts`). Derivado da tradução.
  // ============================================
  sales: {
    sale: languageEnUs.US.sales.sale.singularLabel,
    sales: languageEnUs.US.sales.sale.pluralLabel,
    // chaves compostas por concatenação de labels (nunca literal solto):
    saleNfeDraft: languageEnUs.US.sales.sale.singularLabel + 'NfeDraft',
    saleAdvanceIncome: languageEnUs.US.sales.sale.singularLabel + 'AdvanceIncome',
    saleStockAvailability: languageEnUs.US.sales.sale.singularLabel + 'StockAvailability',
  },
  // ============================================
  // Operacional — Pecuária — Inventariado (Inventoried, F-041,
  // CORE_WORKSPACE/97-Esteiras/060, TASK-INV-FE-01..04) — PADRÃO CANÔNICO:
  // derivado da tradução (par singular/plural, `languageEnUs`, chave em
  // inglês), NUNCA string literal (get_pwa_constants_and_mappers_pattern
  // §6), mirror `stockCorrections`/`breedingMatings`.
  // ============================================
  inventoried: {
    inventoried: languageEnUs.US.inventoried.inventoried.singularLabel,
    inventoriedList: languageEnUs.US.inventoried.inventoried.pluralLabel,
  },
  // ============================================
  // Operacional — Agricultura — Carregamento — Contas a Receber
  // (ChargeBillIncome, F-026, CORE_WORKSPACE/97-Esteiras/059, TASK-CBI-FE-01)
  // — PADRÃO CANÔNICO: derivado da tradução (par singular/plural,
  // `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6), mirror `fechamentoSemana`/
  // `carregamentos`. Namespace DISTINTO de `incomes` (domínio Financeiro
  // homônimo, tabela diferente) — nenhuma colisão de invalidação de cache.
  // ============================================
  chargeBillIncomes: {
    chargeBillIncome: languageEnUs.US.chargeBillIncomes.chargeBillIncome.singularLabel,
    chargeBillIncomesList: languageEnUs.US.chargeBillIncomes.chargeBillIncome.pluralLabel,
  },
  // ============================================
  // ChargeBillExpense (Operacional/Agricultura/Carregamento, "Contas a
  // Pagar", TASK-CBE-04, esteira 97-Esteiras/062) — PADRÃO CANÔNICO: derivado
  // da tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6), mirror
  // `chargeBillIncomes`. Namespace DISTINTO de `chargeBillIncomes` (gêmeo) e
  // de `expenses` (domínio Financeiro homônimo) — nenhuma colisão de
  // invalidação de cache.
  // ============================================
  chargeBillExpenses: {
    chargeBillExpense: languageEnUs.US.chargeBillExpenses.chargeBillExpense.singularLabel,
    chargeBillExpensesList: languageEnUs.US.chargeBillExpenses.chargeBillExpense.pluralLabel,
  },
  // ============================================
  // Site (configuração única do site/fazenda, 97-Esteiras/061, TASK-SITE-04)
  // — PADRÃO CANÔNICO: derivado da tradução (`languageEnUs.US.site.
  // singularLabel`), NUNCA string literal (get_pwa_constants_and_mappers_
  // pattern §6). Tela SINGLETON (mirror `configuracoes.config`/
  // `baseRegistrations.tenantParameters`) — 1 chave só, sem par
  // singular/plural distinto (não há listagem).
  // ============================================
  site: languageEnUs.US.site.singularLabel,
  // ============================================
  // Módulo de Exemplo (referência de padrão CRUD)
  // ============================================
  _example: {
    list: 'example-resources',
    detail: 'example-resource',
  },
  // ============================================
  // Operacional — Pecuária — Manejo — Sanitário (Sanitary Record, F-062,
  // TASK-SAN-FE-01, esteira `97-Esteiras/002`). PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6.1), mirror
  // `breedingMatings`/`markers`. Consome `SanitaryRecordController`
  // (`/sanitaries*`, plural) — NÃO confundir com a cascata embutida em
  // Processamento (`src/services/v2/Sanitary/`, execução 039, sem query-key
  // própria, ADR-FE-SAN-00).
  // ============================================
  sanitary: {
    sanitary: languageEnUs.US.sanitary.sanitary.singularLabel,
    sanitaries: languageEnUs.US.sanitary.sanitary.pluralLabel,
  },
  // ============================================
  // Operacional — Pecuária — Manejo — Pesagem (Weighing, F-071,
  // TASK-PES-FE-01, esteira `97-Esteiras/002`). PADRÃO CANÔNICO: derivado da
  // tradução (par singular/plural, `languageEnUs`, chave em inglês), NUNCA
  // string literal (get_pwa_constants_and_mappers_pattern §6.1), mirror
  // `sanitary`/`breedingMatings`. Consome `WeighingController`
  // (`/weighings*`) + 4 lookups reusados de Sanitário (sem chave própria —
  // reusam os services de `sanitaries-service.ts` diretamente).
  // ============================================
  weighing: {
    weighing: languageEnUs.US.weighing.weighing.singularLabel,
    weighings: languageEnUs.US.weighing.weighing.pluralLabel,
  },
  // ============================================
  // Operacional — Pesagem Rodoviária (ModuleWeighing, F-045, TASK-MWG-FE-01,
  // esteira `97-Esteiras/044`). PADRÃO CANÔNICO: derivado da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês), NUNCA string literal
  // (get_pwa_constants_and_mappers_pattern §6.1), mirror `weighing`/
  // `warehouseTransfers`. Consome `ModuleWeighingController`
  // (`/module-weighings*`). PINO CRÍTICO: `moduleWeighing` ≠ `weighing`
  // (pesagem de ANIMAIS, F-071, já em produção acima) — namespace
  // deliberadamente disjunto (`CONTRATO-TELA-PESAGEM-FE §1`).
  // ============================================
  moduleWeighing: {
    moduleWeighing: languageEnUs.US.moduleWeighing.moduleWeighing.singularLabel,
    moduleWeighings: languageEnUs.US.moduleWeighing.moduleWeighing.pluralLabel,
  },
  // ============================================
  // Gestão de Frota — Manutenções Preventivas (MaintenancePreventive, F-102,
  // esteira 97-Esteiras/010, Tarefas 43/44). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror `stocks`/`supplies` (Frota/Abastecimentos), NUNCA string literal.
  // ============================================
  maintenancePreventives: {
    maintenancePreventive:
      languageEnUs.US.maintenancePreventives.maintenancePreventive.singularLabel,
    maintenancePreventives:
      languageEnUs.US.maintenancePreventives.maintenancePreventive.pluralLabel,
  },
  // ============================================
  // Gestão de Frota — Manutenções (Maintenance, F-103, esteira
  // 97-Esteiras/010, Tarefas 43/44/45). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror `stocks`/`supplies`/`maintenancePreventives` (Frota), NUNCA
  // string literal.
  // ============================================
  maintenances: {
    maintenance: languageEnUs.US.maintenances.maintenance.singularLabel,
    maintenances: languageEnUs.US.maintenances.maintenance.pluralLabel,
  },
  // ============================================
  // Dashboards analíticos (execução 046, TASK-DASH-FE-04 — fundação, CHK-3).
  // Nó criado VAZIO pela fundação: cada feature (UA/LC/AT/ABC) acrescenta só
  // as SUAS chaves aqui (derivadas de `languageEnUs.US.dashboards.<tela>.*`,
  // padrão canônico §6.1) — a fundação não inventa chave de tela nenhuma.
  // ============================================
  dashboards: {
    // Análise de Usuários (execução 046, TASK-UA-FE-01) — chave DERIVADA da
    // tradução (`01-CONTRATO-TELA-user-analysis.md §4`), NUNCA string literal.
    userAnalysis: languageEnUs.US.dashboards.userAnalysis.singularLabel,
    userAnalysisSummary:
      languageEnUs.US.dashboards.userAnalysis.singularLabel +
      languageEnUs.US.dashboards.userAnalysis.summaryLabel,
    // Lotação de Currais (execução 046, TASK-LC-FE-01) — chave DERIVADA da
    // tradução (`02-CONTRATO-TELA-feedlot-dashboard.md §4`). Lookups de
    // pátio/setor REUSAM `feedlotYards`/`feedlotSectors` já existentes
    // (linha 1620+) — não duplicados aqui.
    feedlotDashboard: languageEnUs.US.dashboards.feedlotDashboard.singularLabel,
    feedlotDashboardSectors:
      languageEnUs.US.dashboards.feedlotDashboard.singularLabel +
      languageEnUs.US.feedlotSectors.feedlotSector.pluralLabel,
    // Ativos (execução 046, TASK-AT-FE-01) — chave DERIVADA da tradução
    // (`03-CONTRATO-TELA-assets-dashboard.md §4`).
    assetsDashboard: languageEnUs.US.dashboards.assetsDashboard.singularLabel,
    assetsDashboardMaintenance:
      languageEnUs.US.dashboards.assetsDashboard.singularLabel +
      languageEnUs.US.dashboards.assetsDashboard.maintenanceLabel,
    // Programa ABC Corte (execução 046, TASK-ABC-FE-01) — chave DERIVADA da
    // tradução (`04-CONTRATO-TELA-abc-indicators.md §4`).
    abcIndicators: languageEnUs.US.dashboards.abcIndicators.singularLabel,
    abcIndicatorsHarvest:
      languageEnUs.US.dashboards.abcIndicators.singularLabel +
      languageEnUs.US.dashboards.abcIndicators.harvestLabel,
    // Pluviometria (execução 048, TASK-01-FE) — chave DERIVADA da tradução
    // (`contrato-rainfall-dashboard-norm.md`).
    rainfallDashboard: languageEnUs.US.dashboards.rainfallDashboard.singularLabel,
    // Livro Caixa (execução 048, TASK-03-FE) — chave DERIVADA da tradução
    // (`contrato-cashbook-dashboard-norm.md`). Movimentações mensais usam
    // chave própria (query separada, `month` no filtro).
    cashbookDashboard: languageEnUs.US.dashboards.cashbookDashboard.singularLabel,
    cashbookDashboardMovements:
      languageEnUs.US.dashboards.cashbookDashboard.singularLabel +
      languageEnUs.US.dashboards.cashbookDashboard.movements.title,
    // Depreciações (execução 048, TASK-02-FE) — chave DERIVADA da tradução
    // (`CONTRATO-API-048-02-depreciation-dashboard.md`).
    depreciationDashboard: languageEnUs.US.dashboards.depreciationDashboard.singularLabel,
    // Financeiro (execução 048, TASK-04-FE) — chave DERIVADA da tradução
    // (`CONTRATO-API-048-04-financial-dashboard.md`). DEC-191: sem heatmap.
    financialDashboard: languageEnUs.US.dashboards.financialDashboard.singularLabel,
    // Pecuária de Corte (execução 048, TASK-05-FE) — chave DERIVADA da
    // tradução (`CONTRATO-API-048-05-livestock-dashboard.md`).
    livestockDashboard: languageEnUs.US.dashboards.livestockDashboard.singularLabel,
    // Painel de Controle / Visão Geral (F-211, execução 062, TASK-FE-211-00)
    // — chave DERIVADA da tradução (`PainelControle-Frontend-Contrato.md`).
    // Sub-chaves = 1 por endpoint novo (contrato §5) + reuso de
    // `income-statement` (já tem chave própria em outro namespace,
    // consumido diretamente pelos blocos #7/#8 quando essa Tarefa abrir).
    overviewPanel: languageEnUs.US.dashboards.overviewPanel.singularLabel,
    overviewPanelOverview: languageEnUs.US.dashboards.overviewPanel.singularLabel + 'Overview',
    overviewPanelFinancialSummary:
      languageEnUs.US.dashboards.overviewPanel.singularLabel + 'FinancialSummary',
    overviewPanelStockCoverage:
      languageEnUs.US.dashboards.overviewPanel.singularLabel + 'StockCoverage',
    overviewPanelProductResult:
      languageEnUs.US.dashboards.overviewPanel.singularLabel + 'ProductResult',
  },
  // ============================================
  // Integrações — Compartilhamento (Sharing, F-122, 97-Esteiras/070,
  // TASK-CP-FE-01/02/03). Namespace `sharings` — TOP-LEVEL, LIVRE. Chave
  // DERIVADA da tradução (mirror `breedingMatings`/`dashboards` acima) —
  // nunca string kebab-case solta.
  // ============================================
  sharings: {
    list: languageEnUs.US.sharings.pluralLabel,
    detail: languageEnUs.US.sharings.singularLabel,
  },
  // ============================================
  // Integrações — Software Domínio (IntegrationDominio, F-121,
  // 97-Esteiras/072, TASK-F121-FE-01/02/03/04/05). Namespace
  // `integrationDominios` — TOP-LEVEL, LIVRE. Chave DERIVADA da tradução
  // (mirror `sharings` acima) — nunca string kebab-case solta.
  // ============================================
  integrationDominios: {
    list: languageEnUs.US.integrationDominios.pluralLabel,
    detail: languageEnUs.US.integrationDominios.singularLabel,
  },
  // ============================================
  // Relatórios — Financeiro — Custo de Produção (IncomeStatement, F-272,
  // 97-Esteiras/073, TASK-272-FE-02/03) + Apuração de Custo
  // (CostCalculationReport, F-245, homologação de 5 itens). Namespace
  // `relatorios` — TOP-LEVEL. Chaves LITERAIS kebab-case (mirror
  // `financial.cashFlow` — sem singular/plural de tradução, endpoints de
  // agregação/preview, não CRUD).
  // ============================================
  relatorios: {
    incomeStatementPreview: 'income-statement-preview',
    incomeStatementDrillDown: 'income-statement-drill-down',
    // NOVO (homologação, execução 073) — item 3 do lote: prévia em tabela
    // renderizada na própria página, `GET /cost-calculation-report/preview`.
    costCalculationPreview: 'cost-calculation-report-preview',
    // NOVO (F-298 "Produção/Custeio/Área", esteira 051, TASK-298-FE-01) —
    // CANÁRIO da tela de relatório em código para o fan-out (F-279/F-238/
    // F-315/F-326). `GET /production-costing-area-report/options`, mirror
    // `costCalculationPreview` (chave literal kebab-case).
    productionCostingAreaReportOptions: 'production-costing-area-report-options',
    // NOVO (F-300 "Prod./Colaborador", lote 079, F-300-plano-frontend.md
    // TASK-300-FE-02) — `GET /production-per-worker-report/options`, mirror
    // `productionCostingAreaReportOptions` (chave literal kebab-case).
    productionPerWorkerReportOptions: 'production-per-worker-report-options',
    // NOVO (F-279 "Manejo/Lote", esteira 051, TASK-279-FE-01) — fan-out do
    // canário F-298. `GET /management-batch-report/options`, mirror
    // `productionCostingAreaReportOptions` (chave literal kebab-case).
    managementBatchReportOptions: 'management-batch-report-options',
    // NOVO (Tarefa 49 "Pesagem/Lote", esteira CORE_WORKSPACE/97-Esteiras/014)
    // — endpoint PRÓPRIO, mirror `managementBatchReportOptions` (chave
    // literal kebab-case). `GET /accumulated-weighing-batch-report/options`.
    accumulatedWeighingBatchReportOptions: 'accumulated-weighing-batch-report-options',
    // NOVO (F-329 "Transf/Lote/Módulo/Área", esteira 077,
    // F-329-plano-front.md) — `GET /transfer-batch-grazing-area-report/
    // options`, mirror `managementBatchReportOptions` (chave literal
    // kebab-case).
    transferBatchGrazingAreaReportOptions: 'transfer-batch-grazing-area-report-options',
    // NOVO (F-299 Prod./Área, 97-Esteiras/012, Tarefa 47) — opções do select
    // de ciclo + payload da cascata (`GET /production-area-report/production-cycles`).
    // `productionAreaPreview` removida na correção pós-teste-manual (esteira
    // 012): a tela nunca teve prévia em grade, fluxo é filtro→clique→PDF
    // direto (mirror `HorasLogadas`); endpoint `/preview` do backend
    // permanece intocado, decisão separada do dono.
    productionAreaCycles: 'production-area-report-cycles',
    // NOVO (F-275 Horas Logadas, 97-Esteiras/012, Tarefa 47) — prévia em
    // tabela agrupada (`GET /logged-hours-report?format=json`).
    loggedHoursReport: 'logged-hours-report',
    // NOVO (F-247 Centro de Custo, esteira 97-Esteiras/052,
    // TASK-052-247-FE-01) — prévia em tabela renderizada na própria página,
    // `GET /cost-center-report/preview`, mirror `costCalculationPreview`
    // (chave literal kebab-case).
    costCenterReportPreview: 'cost-center-report-preview',
    // NOVO (F-274 Livro Razão, 97-Esteiras/008, TASK-FE-LR-01) — prévia em
    // tabela renderizada na própria página, `GET /ledger-report/preview`,
    // mirror `costCenterReportPreview` (chave literal kebab-case).
    ledgerReportPreview: 'ledger-report-preview',
    // NOVO (F-236 "Nascimentos" genérico, 97-Esteiras/053, TASK-053-236-FE-01)
    // — `GET /birth-report/options`, mirror `managementBatchReportOptions`
    // (chave literal kebab-case).
    birthReportOptions: 'birth-report-options',
    // NOVO (F-288 "Nutrição Consumo/Lote", 97-Esteiras/053,
    // TASK-288-FE-01) — `GET /nutrition-consumption-report/options`, mirror
    // `managementBatchReportOptions` (chave literal kebab-case).
    nutritionConsumptionReportOptions: 'nutrition-consumption-report-options',
    // NOVO (F-310 "Gerencial de Solicitações", 97-Esteiras/053,
    // TASK-053-F310-FE-01) — `GET /request-purchases/management-report/
    // options`, mirror `managementBatchReportOptions` (chave literal
    // kebab-case).
    requestPurchaseManagementReportOptions: 'request-purchase-management-report-options',
    // NOVO (F-309 "Produtos x Prev. Entrega", 97-Esteiras/058,
    // TASK-058-F309-FE-01) — `GET /request-purchases/forecast-report/
    // options`, mirror `requestPurchaseManagementReportOptions` (chave
    // literal kebab-case).
    requestPurchaseForecastReportOptions: 'request-purchase-forecast-report-options',
    // NOVO (F-251 "Custeio/Área Pecuária", CusteioAreaPecuaria-contrato-api.md
    // §7, lote 076) — `GET /costing-livestock-area-report/options`, mirror
    // `productionCostingAreaReportOptions` (chave literal kebab-case,
    // cascata client-side IG-01).
    costingLivestockAreaReportOptions: 'costing-livestock-area-report-options',
    // NOVO (F-230 "Aplicação/Manejo", esteira 97-Esteiras/077,
    // F-230-plano-front.md §6) — `GET /application-management-report/options`,
    // mirror `costingLivestockAreaReportOptions` (chave literal kebab-case).
    applicationManagementReportOptions: 'application-management-report-options',
    // NOVO (F-224 "Movimentação/Rebanho", `AnimalMovementReport-contrato.md`
    // §4.6, lote 076) — `GET /animal-movements-report/options`, mirror
    // `birthReportOptions` (chave literal kebab-case).
    animalMovementsReportOptions: 'animal-movements-report-options',
    // NOVO (F-319 "Savings", execução 97-Esteiras/013, TASK-013-F319-FE-01)
    // — `GET /request-quotations/savings-report/options`, derivado da
    // tradução en-US (`pageTitle`), não string literal solta (regra desta
    // Tarefa) — mirror do padrão `productionCycles`/`advances` (chave
    // DERIVADA), adaptado aqui porque o módulo `savingsReport` não tem par
    // singular/plural próprio (é um relatório, não uma entidade CRUD).
    savingsReport: languageEnUs.US.savingsReport.report.pageTitle,
    savingsReportOptions: `${languageEnUs.US.savingsReport.report.pageTitle}-options`,
    // NOVO (F-282 "Previsão Colheita/Área", execução 059,
    // CONTRATO-F282-previsao-colheita-area.md §5) — `GET /markings/
    // forecast-harvest-area-report/options`, mirror
    // `productionCostingAreaReportOptions` (chave literal kebab-case,
    // cascata client-side IG-01/IG-02). BLOCO DE FIAÇÃO GLOBAL (execução
    // 059) — a página usava uma chave literal local até este registro.
    markingForecastHarvestAreaReportOptions: 'marking-forecast-harvest-area-report-options',
    // NOVO (F-334 "Pesagem/Animal", execução 059,
    // CONTRATO-F334-pesagem-animal.md) — `GET /weighing-batch-report/
    // options`, mirror `accumulatedWeighingBatchReportOptions` (chave
    // literal kebab-case). BLOCO DE FIAÇÃO GLOBAL (execução 059).
    weighingBatchReportOptions: 'weighing-batch-report-options',
    // NOVO (F-220 "Aplicação/Manejo Talhões", execução 059,
    // CONTRATO-F220-aplicacao-manejo-talhoes.md) — `GET /agriculture/
    // application-management-report/options`, mirror
    // `applicationManagementReportOptions` (chave literal kebab-case).
    // BLOCO DE FIAÇÃO GLOBAL (execução 059).
    agricultureApplicationManagementReportOptions:
      'agriculture-application-management-report-options',
    // NOVO (F-232 "Ocorrências Talhões", Tarefa 50, esteira
    // CORE_WORKSPACE/97-Esteiras/015) — `GET /appropriation-occurrences-
    // report/options`, mirror `accumulatedWeighingBatchReportOptions` (chave
    // literal kebab-case).
    appropriationOccurrenceReportOptions: 'appropriation-occurrences-report-options',
    // NOVO (F-325 "Suprimentos", Tarefa 52, esteira
    // CORE_WORKSPACE/97-Esteiras/015) — `GET /request-purchases/
    // supplies-report/options`, mirror `requestPurchaseManagementReportOptions`
    // (chave literal kebab-case).
    suppliesReportOptions: 'supplies-report-options',
    // NOVO (F-301 "Saídas x Centro Custo", execução 97-Esteiras/078,
    // TASK-F301-F01) — `GET /products-exit-cost-center`, derivado da
    // tradução en-US (`pageTitle`), não string literal solta (regra desta
    // Tarefa) — mirror `savingsReport` (chave DERIVADA).
    productsExitCostCenterReport: languageEnUs.US.productsExitCostCenterReport.report.pageTitle,
    // NOVO (F-312 "Requisição/Saída", execução 97-Esteiras/078,
    // TASK-F312-F01) — `GET /requisitions-report`, derivado da tradução
    // en-US (`pageTitle`), não string literal solta (regra desta Tarefa) —
    // mirror `productsExitCostCenterReport` (chave DERIVADA).
    requisitionsReport: languageEnUs.US.requisitionsReport.report.pageTitle,
    // NOVO (F-265 "Financiamentos", execução 97-Esteiras/078, TASK-F265-F01)
    // — `GET /reports/financings`, derivado da tradução en-US (`pageTitle`),
    // não string literal solta (regra desta Tarefa) — mirror
    // `productsExitCostCenterReport` (chave DERIVADA).
    financingsReport: languageEnUs.US.financingsReport.report.pageTitle,
    // NOVO (F-256 "Descarte Romaneio", execução 97-Esteiras/078,
    // TASK-F256-F01) — `GET /discards-report`, derivado da tradução en-US
    // (`pageTitle`), não string literal solta (regra desta Tarefa) — mirror
    // `financingsReport` (chave DERIVADA).
    discardsReport: languageEnUs.US.discardsReport.report.pageTitle,
    // NOVO (F-228 "Estoque/Rebanho", execução 97-Esteiras/078,
    // TASK-F228-F01) — `GET /animals-report`, derivado da tradução en-US
    // (`pageTitle`), não string literal solta (regra desta Tarefa) — mirror
    // `discardsReport` (chave DERIVADA). PDF-ONLY (FRONT-05) — sem par
    // `Options` dedicado (multiselect reusa `listSpecieOptions` já vivo).
    animalsReport: languageEnUs.US.animalsReport.report.pageTitle,
    // NOVO (F-311 "Orçamentos", execução 97-Esteiras/078, TASK-F311-F01) —
    // `GET /request-quotation-report`, derivado da tradução en-US
    // (`pageTitle`), não string literal solta (regra desta Tarefa) — mirror
    // `productsExitCostCenterReport`/`discardsReport` (chave DERIVADA). Par
    // `Options` mirror `savingsReportOptions` (FRONT-06 — 1 fetch dedicado
    // popula `providerOptions`/`farmOptions`, NUNCA `/providers/options`/
    // `/farms/options` genéricos).
    requestQuotationReport: languageEnUs.US.requestQuotationReport.report.pageTitle,
    requestQuotationReportOptions: `${languageEnUs.US.requestQuotationReport.report.pageTitle}-options`,
    // NOVO (F-276 "Manutenções", execução 97-Esteiras/078, TASK-F276-F01) —
    // `GET /machines-maintenance-report`, derivado da tradução en-US
    // (`pageTitle`), não string literal solta (regra desta Tarefa) — mirror
    // `requestQuotationReport`/`requestQuotationReportOptions` (chave
    // DERIVADA). Par `Options` mirror `machinesSupplyReport.options` — 1
    // fetch dedicado popula o bundle {machines,farms,warehouses} (R3), NUNCA
    // `/machines/options`/`/farms/options`/`/warehouses/options` genéricos.
    machinesMaintenanceReport: languageEnUs.US.machinesMaintenanceReport.report.pageTitle,
    machinesMaintenanceReportOptions: `${languageEnUs.US.machinesMaintenanceReport.report.pageTitle}-options`,
    // NOVO (F-293 "Fluxo Mensal de Pagamento", execução 97-Esteiras/078,
    // TASK-F293-F01) — `GET /payment-cashflow-report`, derivado da tradução
    // en-US (`pageTitle`), não string literal solta (regra desta Tarefa) —
    // mirror `requestQuotationReport`/`machinesMaintenanceReport` (chave
    // DERIVADA). Par `Options` mirror `requestQuotationReportOptions` — 1
    // fetch dedicado popula o bundle {accounts,proprietaries,cost_centers,
    // financial_categories,farms} (FRONT-07), NUNCA `/accounts/options`/
    // `/cost-centers/options`/`/proprietaries/options`/`/farms/options`
    // genéricos.
    paymentCashflowReport: languageEnUs.US.paymentCashflowReport.report.pageTitle,
    paymentCashflowReportOptions: `${languageEnUs.US.paymentCashflowReport.report.pageTitle}-options`,
    // NOVO (F-233 "Extrato Financeiro", execução 97-Esteiras/079,
    // TASK-F233-FE-01) — `GET /bank-statement-report`, derivado da tradução
    // en-US (`pageTitle`), não string literal solta (regra desta Tarefa) —
    // mirror `paymentCashflowReport` (chave DERIVADA). Par `Options` mirror
    // `paymentCashflowReportOptions` — 1 fetch dedicado popula o bundle
    // {accounts,proprietaries,cost_centers,financial_categories,farms}
    // (FRONT-09), NUNCA `/accounts/options`/`/cost-centers/options`/
    // `/proprietaries/options`/`/farms/options` genéricos. QueryKey de
    // options reage também ao `farm_id` selecionado no PRÓPRIO filtro
    // (AF#2) — ver `watch('farm_id')` na tela.
    bankStatementReport: languageEnUs.US.bankStatementReport.report.pageTitle,
    bankStatementReportOptions: `${languageEnUs.US.bankStatementReport.report.pageTitle}-options`,
    // RE-ALINHAMENTO (F-318 "Sanitário/Lote", execução 97-Esteiras/078,
    // F-318-plano-frontend.md, TASK-F318-F03) — `GET
    // /sanitaries-batch-report`, derivado da tradução en-US (`pageTitle`),
    // não string literal solta (regra desta Tarefa) — mirror
    // `machinesMaintenanceReport` (chave DERIVADA). Usada apenas pelo
    // `useQuery` do Select "Categoria" (`listCategoryAnimalOptions`,
    // catálogo GLOBAL) desta tela — o download em si não passa por
    // TanStack Query (blob síncrono via botão).
    sanitariesBatchReport: languageEnUs.US.sanitary.sanitary.report.pageTitle,
    // NOVO (F-252 "Custeio/Área", lote 079, F-252-plano-frontend.md
    // TASK-252-FE-01) — `GET /costing-area-report/options`, mirror
    // `productionCostingAreaReportOptions` (chave literal kebab-case).
    // Endpoint/permissão PRÓPRIOS, distinto de `production-costing-area-
    // report-options` (F-298, ver §0 do roteiro).
    costingAreaReportOptions: 'costing-area-report-options',
    // NOVO (F-269 "Composição Rebanho", lote 079, F-269-plano-frontend.md
    // §6 TASK-F269-FE-01) — `GET /herd-composition-report/options`, mirror
    // `managementBatchReportOptions`/`nutritionConsumptionReportOptions`
    // (chave literal kebab-case).
    herdCompositionReportOptions: 'herd-composition-report-options',
    // NOVO (F-213 "Conciliação de Contas", lote 079, rework FE, Fatia 3) —
    // prévia em tabela na tela, `GET /account-reconciliation-report` (JSON,
    // linhas cruas), mirror `costCalculationPreview` (chave literal
    // kebab-case).
    accountReconciliationPreview: 'account-reconciliation-report-preview',
  },
  // ============================================
  // Relatórios — Frotas — Abastecimentos (F-277, esteira 97-Esteiras/054,
  // TASK-054-277-FE-01). `GET /machines-supply-report/options` devolve o
  // bundle ÚNICO {machines,farms,warehouses} (D-FE-01,
  // roteiro-front-F277-abastecimentos.md §3.2) — mirror exceção documentada
  // `equipments.options` (linha ~1419): string literal porque não há par
  // singular/plural de tradução para "options".
  // ============================================
  machinesSupplyReport: {
    options: 'machines-supply-report-options',
  },
  // ============================================
  // Relatórios — Financeiro — Agenda/Recebimentos (F-304, esteira
  // 97-Esteiras/055, TASK-055-F304-FE-01). Chave DERIVADA da tradução (par
  // singular/plural, `languageEnUs`, chave em inglês) — padrão canônico,
  // mirror `stocks`/`foods`/`foodBeats` acima, NUNCA string literal.
  // Namespace reservado para eventual consumidor futuro de `useQuery`
  // próprio deste módulo — a tela em si reusa 100% as chaves de lookup já
  // existentes (`cadastrosBase.clients`, `financialCategories.list`,
  // `cadastrosBase.proprietaryOptions`, `farms.mine`).
  // ============================================
  receiptScheduleReport: {
    receiptScheduleReport:
      languageEnUs.US.receiptScheduleReport.receiptScheduleReport.singularLabel,
    receiptScheduleReports: languageEnUs.US.receiptScheduleReport.receiptScheduleReport.pluralLabel,
  },
  // ============================================
  // Meu perfil (Execução 071, TASK-071-FE-01) — `GET /me/profile`, hidratação
  // única da tela `/profile` via `useCustomFormQuery` (sem ID de contexto:
  // é sempre o usuário autenticado). Invalidada após `updateOwnProfile`
  // (contrato de tela §4.2, SRF-071-15).
  // ============================================
  me: {
    profile: 'me-profile',
  },
} as const;
