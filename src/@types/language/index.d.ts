import { languageContextTypes } from '@/constants/languages';

import { DefaltStrings } from './defalt-string';
import { Home } from './home';
import { ModuleAbsences } from './module-absences';
import { ModuleRecentActivities } from './module-recent-activities';
import { ModuleAnimalsReport } from './module-animals-report';
import { ModuleCategoryMatrix } from './module-category-matrix';
import { ModuleCategoryProducts } from './module-category-products';
import { ModuleCities } from './module-cities';
import { ModuleClients } from './module-clients';
import { ModuleCommon } from './module-common';
import { ModuleConfiguracoes } from './module-configuracoes';
import { ModuleContadores } from './module-contadores';
import { ModuleContracts } from './module-contracts';
import { ModuleCorrecaoEstoque } from './module-correcao-estoque';
import { ModuleCostCenters } from './module-cost-centers';
import { ModuleCultivation } from './module-cultivation';
import { ModuleDashboards } from './module-dashboards';
import { ModuleDeathLosses } from './module-death-losses';
import { ModuleDepreciationForecast } from './module-depreciation-forecast';
import { ModuleDepreciations } from './module-depreciations';
import { ModuleDevolutions } from './module-devolutions';
import { ModuleDietBeats } from './module-diet-beats';
import { ModuleDiets } from './module-diets';
import { ModuleDiscountTables } from './module-discount-tables';
import { ModuleFeedingPhases } from './module-feeding-phases';
import { ModuleDocument } from './module-document';
import { ModuleEarnings } from './module-earnings';
import { ModuleEmployeeEvents } from './module-employee-events';
import { ModuleEmployees } from './module-employees';
import { ModuleEquipmentTransfers } from './module-equipment-transfers';
import { ModuleEquipments } from './module-equipments';
import { ModuleEvents } from './module-events';
import { ModuleEvolutions } from './module-evolutions';
import { ModuleExamples } from './module-examples';
import { ModuleSubscription } from './module-subscription';
import { ModuleFarmTransfers } from './module-farm-transfers';
import { ModuleFarms } from './module-farms';
import { ModuleFechamentoSemana } from './module-fechamento-semana';
import { ModuleMonitoring } from './module-monitoring';
import { ModuleFeedlotYards } from './module-feedlot-yards';
import { ModuleFinancial } from './module-financial';
import { ModuleFinancialCategories } from './module-financial-categories';
import { ModuleFindAnimal } from './module-find-animal';
import { ModuleFoodBeats } from './module-food-beats';
import { ModuleFoods } from './module-foods';
import { ModuleFunctions } from './module-functions';
import { ModuleGroupers } from './module-groupers';
import { ModuleHarvestProduct } from './module-harvest-product';
import { ModuleHarvests } from './module-harvests';
import { ModuleIncomes } from './module-incomes';
import { ModuleInputEntries } from './module-input-entries';
import { ModuleInventoried } from './module-inventoried';
import { ModuleInvoices } from './module-invoices';
import { ModuleIssuers } from './module-issuers';
import { ModuleKinds } from './module-kinds';
import { ModuleLossAnimals } from './module-loss-animals';
import { ModuleMarcacao } from './module-marcacao';
import { ModuleMarkers } from './module-markers';
import { ModuleMaster } from './module-master';
import { ModuleMovementPurchases } from './module-movement-purchases';
import { ModuleMovementSales } from './module-movement-sales';
import { ModuleMovementSheets } from './module-movement-sheets';
import { ModuleMovements } from './module-movements';
import { ModuleNatureOperations } from './module-nature-operations';
import { ModuleAccountingEntries } from './module-accounting-entries';
import { ModuleDre } from './module-dre';
import { ModuleDreAnnual } from './module-dre-annual';
import { ModuleMonthlyCalculationReport } from './module-monthly-calculation-report';
import { ModulePaidInterestReport } from './module-paid-interest-report';
import { ModuleReceivedInterestReport } from './module-received-interest-report';
import { ModuleCostCalculationReport } from './module-cost-calculation-report';
import { ModuleCostCenterReport } from './module-cost-center-report';
import { ModuleLedgerReport } from './module-ledger-report';
import { ModuleAccountsPayableReceivableReport } from './module-accounts-payable-receivable-report';
import { ModuleFinancialMovementReport } from './module-financial-movement-report';
import { ModuleTransferDifferenceReport } from './module-transfer-difference-report';
import { ModuleIncomeStatementReport } from './module-income-statement-report';
import { ModuleFoodBeatAggregateReport } from './module-food-beat-aggregate-report';
import { ModuleProductionCostingAreaReport } from './module-production-costing-area-report';
import { ModuleCostingAreaReport } from './module-costing-area-report';
import { ModuleProductionPerWorkerReport } from './module-production-per-worker-report';
import { ModuleAccumulatedWeighingBatchReport } from './module-accumulated-weighing-batch-report';
import { ModuleManagementBatchReport } from './module-management-batch-report';
import { ModuleTransferBatchGrazingAreaReport } from './module-transfer-batch-grazing-area-report';
import { ModuleSaleProductReport } from './module-sale-product-report';
import { ModuleSaleEmployeeReport } from './module-sale-employee-report';
import { ModuleProductionAreaReport } from './module-production-area-report';
import { ModuleLoggedHoursReport } from './module-logged-hours-report';
import { ModuleAnimalRecordReport } from './module-animal-record-report';
import { ModuleBirthAnimalSisbovReport } from './module-birth-animal-sisbov-report';
import { ModuleStockProviderLotReport } from './module-stock-provider-lot-report';
import { ModuleStockAbcReport } from './module-stock-abc-report';
import { ModuleStockConsolidatedReport } from './module-stock-consolidated-report';
import { ModuleDeathAnimalReport } from './module-death-animal-report';
import { ModuleIdentificationAnimalSisbovReport } from './module-identification-animal-sisbov-report';
import { ModuleCategoryAnimalReport } from './module-category-animal-report';
import { ModuleAnimalsSaleReport } from './module-animals-sale-report';
import { ModuleMachinesReport } from './module-machines-report';
import { ModuleWeighingHarvestReport } from './module-weighing-harvest-report';
import { ModuleAnimalBatchHistoryReport } from './module-animal-batch-history-report';
import { ModuleTransferClienteReport } from './module-transfer-cliente-report';
import { ModuleWeighingInOutReport } from './module-weighing-in-out-report';
import { ModuleBirthReport } from './module-birth-report';
import { ModuleCashFlowByCategoryReport } from './module-cash-flow-by-category-report';
import { ModuleFiscalDifferenceReport } from './module-fiscal-difference-report';
import { ModuleAnsReport } from './module-ans-report';
import { ModuleFeedlotWeighingPerformanceReport } from './module-feedlot-weighing-performance-report';
import { ModuleAnimalMovementsReport } from './module-animal-movements-report';
import { ModuleCashflowProductReport } from './module-cashflow-product-report';
import { ModuleSavingsReport } from './module-savings-report';
import { ModuleSuppliesReport } from './module-supplies-report';
import { ModuleProductsExitCostCenterReport } from './module-products-exit-cost-center-report';
import { ModuleRequisitionsReport } from './module-requisitions-report';
import { ModuleFinancingsReport } from './module-financings-report';
import { ModuleDiscardsReport } from './module-discards-report';
import { ModuleRequestQuotationReport } from './module-request-quotation-report';
import { ModuleNutritionConsumptionReport } from './module-nutrition-consumption-report';
import { ModuleRequestPurchaseManagementReport } from './module-request-purchase-management-report';
import { ModuleRequestPurchaseForecastReport } from './module-request-purchase-forecast-report';
import { ModuleCostingBatchReport } from './module-costing-batch-report';
import { ModuleCostingAnimalReport } from './module-costing-animal-report';
import { ModuleCostingGrazingReport } from './module-costing-grazing-report';
import { ModuleReceiptsReport } from './module-receipts-report';
import { ModuleReceiptScheduleReport } from './module-receipt-schedule-report';
import { ModuleAnimalFamilyTreeReport } from './module-animal-family-tree-report';
import { ModuleMarkingsFarmForecastReport } from './module-markings-farm-forecast-report';
import { ModuleStockMovementReport } from './module-stock-movement-report';
import { ModuleEquipmentInventoryReport } from './module-equipment-inventory-report';
import { ModuleMarkingForecastAreaReport } from './module-marking-forecast-area-report';
import { ModuleAppropriationOccurrenceReport } from './module-appropriation-occurrence-report';
import { ModuleAnimalsPerBatchReport } from './module-animals-per-batch-report';
import { ModuleAccounts } from './module-accounts';
import { ModuleAccountsReports } from './module-accounts-reports';
import { ModuleActivities } from './module-activities';
import { ModuleAdmin } from './module-admin';
import { ModuleAdvancedReproductive } from './module-advanced-reproductive';
import { ModuleAdvances } from './module-advances';
import { ModuleAfiliados } from './module-afiliados';
import { ModuleOfxImports } from './module-ofx-imports';
import { ModuleXmlDocuments } from './module-xml-documents';
import { ModuleOpenMovements } from './module-open-movements';
import { ModuleOpeningBalances } from './module-opening-balances';
import { ModuleOperations } from './module-operations';
import { ModulePackages } from './module-packages';
import { ModuleParameterAnimals } from './module-parameter-animals';
import { ModuleParameters } from './module-parameters';
import { ModulePastures } from './module-pastures';
import { ModuleAreas } from './module-areas';
import { ModulePeople } from './module-people';
import { ModulePlanAccounts } from './module-plan-accounts';
import { ModulePlanos } from './module-planos';
import { ModuleProcessing } from './module-processing';
import { ModuleProductGroups } from './module-product-groups';
import { ModuleProductionCycles } from './module-production-cycles';
import { ModuleProducts } from './module-products';
import { ModuleProprietaries } from './module-proprietaries';
import { ModuleProtocolSeason } from './module-protocol-season';
import { ModuleProviders } from './module-providers';
import { ModuleRastreabilidade } from './module-rastreabilidade';
import { ModuleRequestAuthorizations } from './module-request-authorizations';
import { ModuleRequestAuthorizers } from './module-request-authorizers';
import { ModuleRequestPurchases } from './module-request-purchases';
import { ModuleRequestQuotations } from './module-request-quotations';
import { ModuleRequestReceipts } from './module-request-receipts';
import { ModuleRequisitions } from './module-requisitions';
import { ModuleRoles } from './module-roles';
import { ModuleSaleContracts } from './module-sale-contracts';
import { ModuleSanitary } from './module-sanitary';
import { ModuleScheduledReviews } from './module-scheduled-reviews';
import { ModuleSeparations } from './module-separations';
import { ModuleServiceOrders } from './module-service-orders';
import { ModuleRatingServiceOrders } from './module-rating-service-orders';
import { ModuleMaintenancePreventives } from './module-maintenance-preventives';
import { ModuleMaintenances } from './module-maintenances';
import { ModuleMyServiceOrders } from './module-my-service-orders';
import { ModuleSpecies } from './module-species';
import { ModuleStates } from './module-states';
import { ModuleStockWriteoffs } from './module-stock-writeoffs';
import { ModuleStocks } from './module-stocks';
import { ModuleSupplies } from './module-supplies';
import { ModuleSupplyDashboard } from './module-supply-dashboard';
import { ModuleSupplyStatusSlaReport } from './module-supply-status-sla-report';
import { ModuleSupplyStatusSlas } from './module-supply-status-slas';
import { ModuleSystemLogs } from './module-system-logs';
import { ModuleTaxRules } from './module-tax-rules';
import { TeamsLanguage } from './module-teams';
import { ModuleTransferAbcBatch } from './module-transfer-abc-batch';
import { ModuleLoteFazenda } from './module-lote-fazenda';
import { ModuleLoteModuloArea } from './module-lote-modulo-area';
import { ModuleAnimalFazenda } from './module-animal-fazenda';
import { ModuleAnimals } from './module-animals';
import { ModuleAnimals } from './module-animals';
import { ModuleAppropriations } from './module-appropriations';
import { ModuleAppropriations } from './module-appropriations';
import { ModuleBaseRegistrations } from './module-base-registrations';
import { ModuleBaseRegistrations } from './module-base-registrations';
import { ModuleBatchTransfers } from './module-batch-transfers';
import { ModuleBatches } from './module-batches';
import { ModuleBirthAnimals } from './module-birth-animals';
import { ModuleWarehouseTransfers } from './module-warehouse-transfers';
import { ModuleWorkTeams } from './module-work-teams';
import { ModuleTransfers } from './module-transfers';
import { ModuleServiceOrders } from './module-service-orders';
import { ModuleMovementSales } from './module-movement-sales';
import { ModuleMovementPurchases } from './module-movement-purchases';
import { ModuleBirthAnimals } from './module-birth-animals';
import { ModuleBonuses } from './module-bonuses';
import { ModuleBonuses } from './module-bonuses';
import { ModuleBreedingBatch } from './module-breeding-batch';
import { ModuleBreedingBatch } from './module-breeding-batch';
import { ModuleBreedingMating } from './module-breeding-mating';
import { ModuleBreedingSeasons } from './module-breeding-seasons';
import { ModuleBreedingSeasons } from './module-breeding-seasons';
import { ModuleBreeds } from './module-breeds';
import { ModuleBreeds } from './module-breeds';
import { ModuleBudgets } from './module-budgets';
import { ModuleBullSeedSeason } from './module-bull-seed-season';
import { ModuleBullSeedSeason } from './module-bull-seed-season';
import { ModuleCarregamentos } from './module-carregamentos';
import { ModuleCarregamentos } from './module-carregamentos';
import { ModuleCashBooks } from './module-cash-books';
import { ModuleCategoryAnimals } from './module-category-animals';
import { ModuleChargeBillExpenses } from './module-charge-bill-expenses';
import { ModuleChargeBillIncomes } from './module-charge-bill-incomes';
import { ModuleMarcacao } from './module-marcacao';
import { ModuleMdfes } from './module-mdfes';
import { ModuleNfes } from './module-nfes';
import { ModuleNutritions } from './module-nutritions';
import { ModulePastures } from './module-pastures';
import { ModulePlannings } from './module-plannings';
import { ModulePlanos } from './module-planos';
import { ModuleRainfalls } from './module-rainfalls';
import { ModuleSeparations } from './module-separations';
import { ModuleSeparations } from './module-separations';
import { ModuleSite } from './module-site';
import { ModuleWeaning } from './module-weaning';
import { ModuleWorkTeams } from './module-work-teams';
import { ModuleWriteOff } from './module-writeoff';
import { ModuleIntegrationDominios } from './module-integration-dominios';
import { ModuleSharings } from './module-sharings';
import { ModuleIntegrations } from './module-integrations';
import { ModulePentestManager } from './pentest-maneger';
import { Sidebar } from './sidebar';
import { ModuleMachinesMaintenanceReport } from './module-machines-maintenance-report';
import { ModulePaymentCashflowReport } from './module-payment-cashflow-report';
import { ModuleBankStatementReport } from './module-bank-statement-report';
import { ModuleMachinesSupplyReport } from './module-machines-supply-report';
import { ModuleNfeProductReport } from './module-nfe-product-report';
import { ModuleNfeReport } from './module-nfe-report';
import { ModuleHerdCompositionReport } from './module-herd-composition-report';
import { ModuleDeathAnimalSisbovReport } from './module-death-animal-sisbov-report';
import { ModuleSaleClientReport } from './module-sale-client-report';
import { ModuleAccumulatedIncomeStatementReport } from './module-accumulated-income-statement-report';
import { ModuleSaleGeneralReport } from './module-sale-general-report';
import { ModuleProfitabilityByCropReport } from './module-profitability-by-crop-report';
import { ModuleCostingLivestockAreaReport } from './module-costing-livestock-area-report';
import { ModuleApplicationManagementReport } from './module-application-management-report';
import { ModuleCteManifestacoes } from './module-cte-manifestacoes';
import { ModuleCtes } from './module-ctes';
import { ModuleDeathAnimals } from './module-death-animals';
import { ModuleDfes } from './module-dfes';
import { ModuleEvolutions } from './module-evolutions';
import { ModuleFeedlotCorrals } from './module-feedlot-corrals';
import { ModuleFeedlotMap } from './module-feedlot-map';
import { ModuleFeedlotSectors } from './module-feedlot-sectors';
import { ModuleFeedlotYards } from './module-feedlot-yards';
import { ModuleGrouperBatch } from './module-grouper-batch';
import { ModuleInputEntries } from './module-input-entries';
import { ModuleInvoices } from './module-invoices';
import { ModuleModuleWeighing } from './module-module-weighing';
import { ModuleOrders } from './module-orders';
import { ModuleSales } from './module-sales';
import { ModuleTransfers } from './module-transfers';
import { ModuleUsers } from './module-users';
import { ModuleVaccines } from './module-vaccines';
import { ModuleWarehouses } from './module-warehouses';
import { ModuleWeighing } from './module-weighing';
// Execução 059 (Relatórios F-273/F-223/F-216/F-282/F-294/F-303/F-334/
// F-337/F-220) — BLOCO DE FIAÇÃO GLOBAL (Executor Front v2, integração das
// 9 telas de relatório escritas em paralelo). Cada tipo `Module*` abaixo já
// existe em `src/@types/language/module-*` (escrito pela Tarefa da própria
// tela); só a REGISTRAÇÃO top-level em `LanguageDate` faltava.
import { ModuleLedgerCategoryReport } from './module-ledger-category-report';
import { ModuleAnimalMovementAnalysisReport } from './module-animal-movement-analysis-report';
import { ModuleAccumulatedDepreciationReport } from './module-accumulated-depreciation-report';
import { ModuleMarkingForecastHarvestAreaReport } from './module-marking-forecast-harvest-area-report';
import { ModulePaymentScheduleReport } from './module-payment-schedule-report';
import { ModuleReceiptCashflowReport } from './module-receipt-cashflow-report';
import { ModuleWeighingBatchReport } from './module-weighing-batch-report';
import { ModuleWeighingStockClientReport } from './module-weighing-stock-client-report';
import { ModuleAgricultureApplicationManagementReport } from './module-agriculture-application-management-report';
import { ModuleTaxAccountsReport } from './module-tax-accounts-report';
import { ModuleTotalCostOfReproductionReport } from './module-total-cost-of-reproduction-report';
import { ModuleTransferSalesContractReport } from './module-transfer-sales-contract-report';

export type LanguageContextTypes = (typeof languageContextTypes)[keyof typeof languageContextTypes];

export interface LanguageDate {
  /** Módulo de administração */
  admin: ModuleAdmin;
  /** Módulo de Teams */
  teams: TeamsLanguage;
  /** Módulo Pentest Manager - agrupa dashboard, pentests, honeypots, cves, blockedAttacks, logs */
  pentestManager: ModulePentestManager;
  /** Módulo master/superuser */
  master: ModuleMaster;
  /** Traduções da home/landing */
  home: Home;
  /** Traduções da sidebar */
  sidebar: Sidebar;
  /** Strings padrão reutilizáveis */
  defaltStrings: DefaltStrings;
  /** Traduções comuns (login, comingSoon, aleexAssistant) */
  common: ModuleCommon;
  /** Camada de exemplos de referência (src/_examples/) — ver README lá */
  examples: ModuleExamples;
  /** Página "Contratar ou alterar plano" (simulador de assinatura) */
  subscription: ModuleSubscription;
  /** Módulo de Perfis (Roles RBAC — Cadastros Base) */
  roles: ModuleRoles;
  /** Módulo de Centros de Custo (Cadastros Base) */
  costCenters: ModuleCostCenters;
  /** Módulo de Autorizadores (RequestAuthorizer — Cadastros Base / Pessoas, Lote 06 / esteira 089, Frente C, F-141, SLICE 1) */
  requestAuthorizers: ModuleRequestAuthorizers;
  /** Módulo Configurações — Tutoriais (Help, TASK-HP-06) */
  configuracoes: ModuleConfiguracoes;
  /** Módulo de Raças (Breeds — Cadastros Base) */
  breeds: ModuleBreeds;
  /** Módulo de Causa Morte/Perda (DeathLoss — Cadastros Base / Pecuária) */
  deathLosses: ModuleDeathLosses;
  /** Módulo de Safras (Harvest — Cadastros Base) */
  harvests: ModuleHarvests;
  /** Módulo de Cultura/Variedade (Cultivation — Cadastros Base) */
  cultivation: ModuleCultivation;
  /** Módulo de Dashboards analíticos (execução 046, TASK-DASH-FE-04 — fundação, CHK-2) */
  dashboards: ModuleDashboards;
  /** Módulo de Ciclo de Produção (ProductionCycle — Cadastros Base / Agrícola, TASK-FE-01, 97-Esteiras/033) */
  productionCycles: ModuleProductionCycles;
  /** Módulo de Adiantamento Salarial (Advance — Administrativo, TASK-FE-adiant-salarial, 97-Esteiras/034) */
  advances: ModuleAdvances;
  /** Módulo de Registro de Eventos (Bonus — Administrativo, esteira 037) */
  bonuses: ModuleBonuses;
  /** Módulo de Plano de Contas (PlanAccount — Cadastros Base, domínio Financeiro) */
  planAccounts: ModulePlanAccounts;
  /** Módulo de Armazéns (Warehouse — Cadastros Base) */
  warehouses: ModuleWarehouses;
  /** Módulo de Saldo de Estoque (Stock — Administrativo, 100% leitura, TASK-STK-FE-01) */
  stocks: ModuleStocks;
  /** Módulo de Correção de Estoque (StockCorrection — Administrativo / Estoque, TASK-FE-COR-01/02) */
  stockCorrections: ModuleCorrecaoEstoque;
  /** Módulo de Baixa de Estoque (StockWriteoff — Administrativo, esteira 038, fatia READ TASK-FE-3001/3002/3003) */
  stockWriteoffs: ModuleStockWriteoffs;
  /** Módulo de Inventariado (Inventoried — Operacional / Pecuária, F-041, CORE_WORKSPACE/97-Esteiras/060) */
  inventoried: ModuleInventoried;
  /** Módulo de Espécies (Species — Cadastros Base) */
  species: ModuleSpecies;
  /** Módulo agregador Cadastros Base (Base Registrations) */
  baseRegistrations: ModuleBaseRegistrations;
  /** Módulo de Grupos de Produto (ProductGroups — Cadastros Base) */
  productGroups: ModuleProductGroups;
  /** Módulo de Categorias de Produto (CategoryProducts — Cadastros Base, 2º nível de GroupProduct → CategoryProduct → Kind, sem `parent_id` próprio) */
  categoryProducts: ModuleCategoryProducts;
  /** Módulo de Agrupadores (Grouper — Cadastros Base / Financeiro, hierárquico) */
  groupers: ModuleGroupers;
  /** Módulo de Categorias Financeiras (FinancialCategory — Cadastros Base / Financeiro, hierárquico) */
  financialCategories: ModuleFinancialCategories;
  /** Módulo de Marcadores (Marker — Cadastros Base / Configurações, grupo `cad-gerais`) */
  markers: ModuleMarkers;
  /** Módulo de Funções (Function — cargo/função de RH, Administrativo / Gestão Pessoal) */
  functions: ModuleFunctions;
  /** Módulo de Eventos (Event — rubrica de folha de pagamento, Administrativo / Gestão Pessoal) */
  events: ModuleEvents;
  /** Módulo de Funcionário X Eventos (EmployeeEvent — Administrativo / Gestão Pessoal, TASK-FE-FXE-01/02) */
  employeeEvents: ModuleEmployeeEvents;
  /** Módulo de Atividades (Activity — Cadastros Base / Agrícola) */
  activities: ModuleActivities;
  /** Módulo de Operações (Operation — Cadastros Base / Agrícola) */
  operations: ModuleOperations;
  /** Módulo de Estágio Reprodutivo (CategoryMatrix — Cadastros Base / Pecuária) */
  categoryMatrix: ModuleCategoryMatrix;
  /** Módulo de Estados (State — Cadastros Base / Geografia) */
  states: ModuleStates;
  /** Módulo de Previsão de Depreciação (DepreciationForecast — Cadastros Base / Bens-Ativos, tela única read-only) */
  depreciationForecasts: ModuleDepreciationForecast;
  /** Módulo de Depreciação (Depreciation — Cadastros Base / Bens-Ativos, execução 027, abas Equipamento/Animal) */
  depreciations: ModuleDepreciations;
  /** Módulo de Cidades (City — Cadastros Base / Geografia) */
  cities: ModuleCities;
  /** Módulo de Contador (Escritório de Contabilidade — Cadastros Base, domínio Fiscal/Contábil) */
  contadores: ModuleContadores;
  /** Módulo de Vacinas (Vaccine — Cadastros Base / Pecuária) */
  vaccines: ModuleVaccines;
  /** Módulo de Regras Fiscais (TaxRule — Cadastros Base / Fiscal) */
  taxRules: ModuleTaxRules;
  /** Módulo de Natureza de Operação (NatureOperation — Cadastros Base / Fiscal) */
  natureOperations: ModuleNatureOperations;
  /** Módulo de Emissores NFe (Issuer — Cadastros Base / Fiscal, execução 023) */
  issuers: ModuleIssuers;
  /** Módulo de NFe Emitidas (Nfe — domínio Fiscal, execução 036) */
  nfes: ModuleNfes;
  /** Módulo de DFe Recebidas (Dfe — domínio Fiscal, execução 044, TASK-DFE-FE-03) */
  dfes: ModuleDfes;
  /** Módulo de Partida Dobrada (AccountingEntry — domínio Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-02) */
  accountingEntries: ModuleAccountingEntries;
  /** Módulo de CT-e (Cte — domínio Fiscal, execução 045, Onda 1, TASK-CTE-FE-01) */
  ctes: ModuleCtes;
  /** Módulo de Manifestação de CT-e (CteManifestacao — domínio Fiscal, execução 045, Onda 2, TASK-CTE-FE-12/13) */
  cteManifestacoes: ModuleCteManifestacoes;
  /** Módulo CashBook (LCDPR — Livro Caixa Digital do Produtor Rural, domínio Fiscal, execução 045, TASK-LCDPR-FE-01) */
  cashBooks: ModuleCashBooks;
  /** Módulo de MDFe (Mdfe — domínio Fiscal-Transporte, execução 045, Onda 1, TASK-MDFE-FE-01) */
  mdfes: ModuleMdfes;
  /** Módulo de Arquivos XML (F-133 — Gestão Fiscal, esteira 97-Esteiras/008, Tarefa 36) */
  xmlDocuments: ModuleXmlDocuments;
  /** Módulo de Pessoas Unificado (Person — Cadastros Base, execução 023) */
  people: ModulePeople;
  /** Módulo administrativo de Fazendas (Farm — Cadastros Base, execução 024, CRUD completo) */
  farms: ModuleFarms;
  /** Módulo de Classes de Produto (Kind — Cadastros Base / Estrutura, execução 024) */
  kinds: ModuleKinds;
  /** Módulo de Afiliados (Partner — Cadastros Base / Pessoas, execução 024) */
  afiliados: ModuleAfiliados;
  appropriations: ModuleAppropriations;
  pastures: ModulePastures;
  /** Módulo "Áreas" (Area — subdivisão geoespacial da Fazenda, Cadastros Base
   *  / Estrutura, F-348/UT-000446, esteira 067, TASK-FE-415 fundação).
   *  Namespace `areas` — LIVRE, sem colisão com `pastures`/`farms`/
   *  `batches` (BatchArea, N:N Batch×Area, vive em `batchAreas`/query-key
   *  próprio — módulo distinto). */
  areas: ModuleAreas;
  /** Módulo OPERACIONAL — Pátio (FeedlotYard — Confinamento, execução 046, TASK-PT-FE-01/02) */
  feedlotYards: ModuleFeedlotYards;
  /** Módulo OPERACIONAL — Setor (FeedlotSector — Confinamento, TASK-FS-FE-01/02) */
  feedlotSectors: ModuleFeedlotSectors;
  /** Módulo OPERACIONAL — Mapa de Confinamento (FeedlotMap, execução 042, TASK-FE-042-200..216) */
  feedlotMap: ModuleFeedlotMap;
  /** Módulo OPERACIONAL — tela standalone de Currais (FeedlotCorral, F-035, lote 043, TASK-043-CUR-T01) */
  feedlotCorrals: ModuleFeedlotCorrals;
  /** Módulo OPERACIONAL — Mortes (DeathAnimal — Pecuária, TASK-DA-FE-01/02) */
  deathAnimals: ModuleDeathAnimals;
  /** Módulo OPERACIONAL — Pluviometria (Rainfall, execução 041, TASK-FE-041-PLV-01..05) */
  rainfalls: ModuleRainfalls;
  invoices: ModuleInvoices;
  inputEntries: ModuleInputEntries;
  planos: ModulePlanos;
  /** Módulo "Fornecedores" (Provider — Cadastros Base, fachada dedicada `/api/v1/providers`, TASK-PR-FE-01) */
  providers: ModuleProviders;
  /** Módulo "Contas Bancárias" (Account — Cadastros Base / Financeiros, execução 025, TASK-FE-561) */
  accounts: ModuleAccounts;
  /** Módulo "Categorias Animais" (CategoryAnimal — Cadastros Base / Pecuários, execução 025, TASK-FE-540) */
  categoryAnimals: ModuleCategoryAnimals;
  /** Módulo "Embalagens" (Package — Cadastros Base / Estrutura, execução 025, TASK-FE-520) */
  packages: ModulePackages;
  /** Módulo "Produtos" (Product — Cadastros Base / Estrutura / "Catálogo", execução 025, TASK-FE-500) */
  products: ModuleProducts;
  /** Módulo "Proprietários" (Proprietary — Cadastros Base, fachada dedicada `/api/v1/proprietaries`, TASK-PY-FE-01) */
  proprietaries: ModuleProprietaries;
  /** Módulo "Clientes" (Client — Cadastros Base, fachada dedicada `/api/v1/clients`, TASK-CL-FE-01) —
   *  SCAFFOLD ADIANTADO POR ESPELHAMENTO, escrito ANTES de `Client-contrato.md`/backend existirem. */
  clients: ModuleClients;
  /** Módulo "Funcionários" (Employee — Cadastros Base, fachada dedicada `/api/v1/employees`, TASK-EMP-FE-01) */
  employees: ModuleEmployees;
  /** Módulo "Inventário" (Equipment — Cadastros Base / Bens-Ativos, execução 026, TASK-FE-1002) */
  equipments: ModuleEquipments;
  /** Módulo "Estoque Inicial" (OpeningBalance — Cadastros Base / Estrutura, execução 026, TASK-FE-1040 — fundação de dados) */
  openingBalances: ModuleOpeningBalances;
  /** Módulo "Usuários" (User — Cadastros Base / Pessoas, CRUD administrativo completo, execução 027, TASK-FE-800) */
  users: ModuleUsers;
  /** Módulo "Rebanho" (Animal — Cadastros Base / Pecuários, execução 027, TASK-FE-880) */
  animals: ModuleAnimals;
  /** Módulo "Parâmetros Animais" (ParameterAnimal — Cadastros Base / Pecuários, fundação da regeneração, TASK-FE-1074) */
  parameterAnimals: ModuleParameterAnimals;
  /** Módulo "Lotes Animais" (Batch — Cadastros Base / Pecuários, fundação da regeneração, TASK-FE-1074) */
  batches: ModuleBatches;
  /** Módulo "Agrupar/Lotes" (GrouperBatch — Operacional / Pecuária / Transferências, execução 042, TASK-FE-042-301) */
  grouperBatches: ModuleGrouperBatch;
  /** Módulo "Transferência Animais/Lote" (BatchTransfer — Operacional / Pecuária / Transferências, feature `426be835`, TASK-LOTE-FE-01/02). Namespace `batchTransfers` — LIVRE, sem colisão com `batches`. */
  batchTransfers: ModuleBatchTransfers;
  /** Módulo "Solicitação de Compras" (RequestPurchase — Administrativo / Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-03) */
  requestPurchases: ModuleRequestPurchases;
  /** Módulo "Autorização" (RequestAuthorization — Administrativo / Suprimentos, esteira 97-Esteiras/038, TASK-AUTH-FE-01) — namespace PRÓPRIO, recurso HTTP distinto de `requestPurchases` */
  requestAuthorizations: ModuleRequestAuthorizations;
  /** Módulo "Recebimentos" (RequestReceipt — Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-00) — namespace PRÓPRIO, recurso HTTP distinto de `requestPurchases`/`requestAuthorizations` */
  requestReceipts: ModuleRequestReceipts;
  /** Módulo "Parâmetros SLA" (SupplyStatusSla — Administrativo / Suprimentos, TASK-FE-SLA-01) */
  supplyStatusSlas: ModuleSupplyStatusSlas;
  /** Módulo "Logs do Sistema" (SystemLogs — Administrativo › Sistema, execução 079) — Gestor_Plataf */
  systemLogs: ModuleSystemLogs;
  /** Módulo "Relatório SLA" (SupplyStatusSlaReport — Administrativo / Suprimentos, TASK-SLA-FE-01, esteira 97-Esteiras/037) — DISTINTO de `supplyStatusSlas` (config), sem colisão de namespace */
  supplyStatusSlaReport: ModuleSupplyStatusSlaReport;
  /** Módulo "Suprimentos" (SupplyDashboard — Dashboards, esteira 97-Esteiras/009, Tarefas 38/39) — DISTINTO de `supplyStatusSlas`/`supplyStatusSlaReport`, sem colisão de namespace */
  supplyDashboard: ModuleSupplyDashboard;
  /** Módulo "Abastecimentos" (Supply — Gestão de Frota, esteira 97-Esteiras/009, Tarefas 40/41) — DISTINTO de `supplyDashboard`/`supplyStatusSlas`, sem colisão de namespace */
  supplies: ModuleSupplies;
  /** Módulo "Manutenções Preventivas" (MaintenancePreventive — Gestão de Frota, esteira 97-Esteiras/010, Tarefas 43/44) — MESMO módulo `Frota` de `supplies`, namespace PRÓPRIO (sem campo `requester` no Resource, sem cascata de estoque) */
  maintenancePreventives: ModuleMaintenancePreventives;
  /** Módulo "Manutenções" (Maintenance, F-103 — Gestão de Frota, esteira 97-Esteiras/010, Tarefas 43/44/45) — MESMO módulo `Frota` de `supplies`/`maintenancePreventives`, namespace PRÓPRIO */
  maintenances: ModuleMaintenances;
  /** Módulo "Gestão de Contratos" (Contract — Financeiro, esteira 97-Esteiras/023, TASK-CTR-FE-02) */
  contracts: ModuleContracts;
  /** Módulo "Saldo Inicial" (OpenMovement — Cadastros Base / Financeiros, execução 031, TASK-FE-031-35) */
  openMovements: ModuleOpenMovements;
  /** Módulo "Parâmetros" (Parameter — Configurações, execução 031, TASK-FE-031-40 — chave TOP-LEVEL, mirror `markers`) */
  parameters: ModuleParameters;
  /** Módulo "Financeiro Mercado Pago" (execução 031, TASK-FE-031-44 — listagem read-only, chave TOP-LEVEL, mirror `markers`/`parameters`) */
  financial: ModuleFinancial;
  /** Módulo "Contratos de Venda" (SaleContract — Operacional / Agricultura, esteira 036, TASK-FE-036-201, chave TOP-LEVEL mirror `financial`/`markers`) */
  saleContracts: ModuleSaleContracts;
  /** Módulo "Contas a Receber" (Income — Financeiro, execução 036, TASK-FE-036-310) */
  incomes: ModuleIncomes;
  /** Módulo COMPARTILHADO de Baixa Manual (WriteOff — Financeiro, esteira 036, TASK-FE-036-330). Namespace ISOLADO — consumido por Contas a Receber E Contas a Pagar, nunca dentro de `incomes`/`expenses`. */
  writeOff: ModuleWriteOff;
  /** Módulo COMPARTILHADO de Documentos Anexos (Document — Financeiro, esteira 036, TASK-FE-036-337). Namespace ISOLADO — consumido por Contas a Receber E Contas a Pagar, nunca dentro de `incomes`/`expenses`. */
  document: ModuleDocument;
  /** Módulo "Mov. Caixa/Bancário" (Movement — Financeiro, TASK-MV-FE-01, chave TOP-LEVEL, mirror `openMovements`) */
  movements: ModuleMovements;
  /** Módulo "Importação OFX" (OfxImport — Financeiro, F-114, 97-Esteiras/064,
   *  TASK-064-OFX-FE-01, chave TOP-LEVEL, mirror `movements`) */
  ofxImports: ModuleOfxImports;
  /** Módulo "Importação Mov. Bancários" (MovementSheet — Financeiro, F-112,
   *  97-Esteiras/064, TASK-064-MOV-FE-01, chave TOP-LEVEL, mirror `stockCorrections`) */
  movementSheets: ModuleMovementSheets;
  /** Módulo "Equipes" (Team — equipe de fazenda, Administrativo / Gestão Pessoal, TASK-EQ-FE-01/02/03).
   *  Namespace `workTeams` — NUNCA `teams` (já ocupado pelo domínio SaaS/billing acima, GAP-EQ-FE-01). */
  workTeams: ModuleWorkTeams;
  /** Módulo "Romaneios" (Transfer — venda/colheita manual, Operacional,
   *  TASK-TRF-FE-01..05). Namespace `transfers` — LIVRE (sem colisão,
   *  front-contract-romaneios.md §1.3). */
  transfers: ModuleTransfers;
  /** Módulo "Lista de OS" (ServiceOrder — Operacional, fatia READ,
   *  TASK-FE-2001/2002/2003, esteira 038). Namespace `serviceOrders` — LIVRE
   *  (sem colisão, `00-PLANO-FRONTEND-lista-os.md`). Fatia WRITE bloqueada
   *  por D-FRONT-01 — sem chaves de form/payload aqui. */
  serviceOrders: ModuleServiceOrders;
  /** Módulo "Monitoramento" (MonitoringServiceOrder — Operacional, tela
   *  ÚNICA de listagem/filtro, SEM CRUD, TASK-MO-FE-01..05, esteira
   *  `97-Esteiras/057`). Namespace `monitoring` — PRÓPRIO, NÃO reaproveita
   *  `serviceOrders` (contrato de API/permissão distintos,
   *  `monitoring-service-orders_view` ≠ `service-orders_view`). */
  monitoring: ModuleMonitoring;
  /** Módulo "Avaliações" (RatingServiceOrder — Operacional, avaliação de OS
   *  já concluída, TASK-FE-041-AVL-01, esteira 041). Namespace
   *  `ratingServiceOrders` — LIVRE (sem colisão,
   *  `plano-front-avaliacoes.md`). */
  ratingServiceOrders: ModuleRatingServiceOrders;
  /** Módulo "Minhas OS" (MyServiceOrder — Operacional, listagem+execução
   *  restrita ao executor logado, TASK-MOS-FE-01, esteira `97-Esteiras/063`).
   *  Namespace `myServiceOrders` — LIVRE (sem colisão, mirror
   *  `ratingServiceOrders`). NÃO duplica as chaves de contexto readonly —
   *  essas continuam vindo de `serviceOrders.serviceOrder.detail.*`. */
  myServiceOrders: ModuleMyServiceOrders;
  /** Módulo "Venda de Animais" (MovementSale — Operacional > Pecuária,
   *  TASK-VD-FE-01, frontend-contract-vendas.md). Namespace `movementSales`
   *  — LIVRE, sem colisão com `transfers`/`invoices`. */
  movementSales: ModuleMovementSales;
  /** Módulo "Compra de Animais" (MovementPurchase — Operacional > Pecuária,
   *  TASK-CP-04, contrato-frontend-compras-movimento.md). Namespace
   *  `movementPurchases` — LIVRE, sem colisão com `movementSales`. */
  movementPurchases: ModuleMovementPurchases;
  /** Módulo "Nascimentos" (BirthAnimal — Operacional > Pecuária,
   *  TASK-NASC-FE-01, frontend-contract-nascimentos.md). Namespace
   *  `birthAnimals` — LIVRE, sem colisão com `transfers`/`movementSales`. */
  birthAnimals: ModuleBirthAnimals;
  /** Módulo "Formulação" (Food — Fábrica/Ração, TASK-FOOD-FE-01, chave TOP-LEVEL, mirror `movements`) */
  foods: ModuleFoods;
  /** Módulo "Batida" (FoodBeat — Fábrica, TASK-FB-FE-01, chave TOP-LEVEL, mirror `foods`) */
  foodBeats: ModuleFoodBeats;
  /** Módulo "Trans. Armazém" (WarehouseTransfer — Estoque, escrita, TASK-WT-FE-01, chave TOP-LEVEL, mirror `foodBeats`) */
  warehouseTransfers: ModuleWarehouseTransfers;
  /** Módulo "Trans. Fazendas" (FarmTransfer — Estoque, escrita, Tarefas 01/02/03, chave TOP-LEVEL, mirror `warehouseTransfers`) */
  farmTransfers: ModuleFarmTransfers;
  /** Módulo "Requisição/Saída" (Requisition — Estoque, escrita, 97-Esteiras/002 Tarefas 04/05, chave TOP-LEVEL, mirror `farmTransfers`) */
  requisitions: ModuleRequisitions;
  /** Módulo "Devolução/Entrada" (Devolution — Estoque, escrita, 97-Esteiras/037, chave TOP-LEVEL, mirror `requisitions`) */
  devolutions: ModuleDevolutions;
  /** Módulo "Apuração Mensal" (Earning — Administrativo, 97-Esteiras/002 Tarefas 07/08/09, chave TOP-LEVEL, mirror `warehouseTransfers`) */
  earnings: ModuleEarnings;
  /** Módulo "Transferência ABC de Animais entre Lotes" (TransferAbcBatch — Operacional > Pecuária, 97-Esteiras/039, chave TOP-LEVEL, mirror `farmTransfers`) e
   *  "Localizar Animal" (FindAnimal — Operacional > Pecuária > Manejo, F-042, TASK-FA-FE-01) — mesmo namespace TOP-LEVEL `livestock`,
   *  combinado por interseção (o objeto real faz `{ ...languageTransferAbcBatch, ...languageFindAnimal }` em cada `language{Idioma}/index.ts`). */
  livestock: ModuleTransferAbcBatch & ModuleFindAnimal;
  /** Módulo "Cotações" (RequestQuotation — Administrativo / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01, chave TOP-LEVEL, mirror `requestPurchases`) */
  requestQuotations: ModuleRequestQuotations;
  /** Módulo "Registro de Faltas" (Absence — Administrativo / Gestão Pessoal, 97-Esteiras/003 Tarefas 12/13, chave TOP-LEVEL, mirror `events`/`advances`) */
  absences: ModuleAbsences;
  /** Módulo "Atividades Recentes" (RecentActivity — Administrativo, UT-000690 / F-349, chave TOP-LEVEL, tela somente leitura) */
  recentActivities: ModuleRecentActivities;
  /** Módulo "Estação de Monta" (BreedingSeason — Operacional / Reprodução, 97-Esteiras/003 Tarefas 12/13, chave TOP-LEVEL, mirror `absences`/`events`) */
  breedingSeasons: ModuleBreedingSeasons;
  /** Módulo "Touros/Sêmen/Embrião" (BullSeedSeason — Operacional / Reprodução, 97-Esteiras/005 Tarefa 24, chave TOP-LEVEL, mirror `breedingSeasons`; aggregator SINGULAR por decisão do contrato §1.3) */
  bullSeedSeason: ModuleBullSeedSeason;
  /** Módulo "Lotes/Reprodução" (BreedingBatch — Operacional / Reprodução, 97-Esteiras/048 Tarefas 04/05/06/07, chave TOP-LEVEL, mirror `breedingSeasons`/`bullSeedSeason`) */
  breedingBatches: ModuleBreedingBatch;
  /** Módulo "Protocolos/Estação" (ProtocolSeason — Operacional / Reprodução, F-057, execução 040, TASK-FE-1050..1059, chave TOP-LEVEL, mirror `breedingBatches`/`breedingSeasons`) */
  protocolSeasons: ModuleProtocolSeason;
  /** Módulo "Colheita de Frutas" (HarvestProduct — Operacional / Agricultura, F-040, execução 040, TASK-FE-1092..1101, chave TOP-LEVEL). Namespace `harvestProduct` (singular) — NUNCA `harvest`/`harvests` (módulo de Safra já migrado, ver `harvests` acima, contrato §7.3). */
  harvestProduct: ModuleHarvestProduct;
  /** Módulo "Apartação" (Separation — Operacional / Pecuária, 97-Esteiras/005 Tarefa 24, frontend-contract-apartacao.md). Namespace `separations` — LIVRE, sem colisão com `birthAnimals`/`transfers`. */
  separations: ModuleSeparations;
  /** Módulo "Evolução/Rebanho" (Evolution — Operacional / Pecuária / Transferências e Relatórios / Pecuária, spa-contract-evolucao-rebanho.md, Tarefas 26/27). Namespace `evolutions` — LIVRE, sem colisão com `devolutions`. */
  evolutions: ModuleEvolutions;
  /** Módulo "Dieta" (Diet — Operacional / Pecuária, TASK-FE-DIET-01, chave TOP-LEVEL, mirror `foods`) */
  diets: ModuleDiets;
  /** Módulo "Batida" (DietBeat — Operacional / Pecuária, TASK-FE-DIET-04, chave TOP-LEVEL, mirror `diets`/`foodBeats`) */
  dietBeats: ModuleDietBeats;
  /** Módulo "Fases de Alimentação" (FeedingPhase — Operacional / Pecuária / Confinamento, F-034, TASK-FP-FE-01, chave TOP-LEVEL, mirror `diets`/`dietBeats`) */
  feedingPhases: ModuleFeedingPhases;
  /** Módulo "Descontos/Classificação" (DiscountTable — Operacional / Agricultura, F-032, TASK-DT-FE-01, chave TOP-LEVEL, mirror `diets`/`feedingPhases`) */
  discountTables: ModuleDiscountTables;
  /** Módulo "Processamentos" (Processing — Operacional > Pecuária, 97-Esteiras/039, TASK-FE-039-PROC-01, chave TOP-LEVEL, mirror `livestock`/`dietBeats`) */
  processamentos: ModuleProcessing;
  /** Módulo "Desmama" (Weaning — Operacional > Pecuária > Manejo,
   *  TASK-WN-FE-01, esteira 97-Esteiras/043). Namespace `weaning` — LIVRE,
   *  sem colisão com `birthAnimals`/`movementSales`. */
  weaning: ModuleWeaning;
  /** Módulo "Marcação" (Marking — Operacional > Agricultura > Manejo,
   *  TASK-MC-FE-01, esteira 97-Esteiras/044). Namespace `marcacao` — LIVRE,
   *  sem colisão com `weaning`/`movementSales`. */
  marcacao: ModuleMarcacao;
  /** Módulo "Carregamentos" (Charge — Operacional > Agricultura, esteira
   *  97-Esteiras/045, TASK-FE-CG-01..07). Namespace `carregamentos` — LIVRE,
   *  sem colisão com nenhum bloco existente. */
  carregamentos: ModuleCarregamentos;
  /** Módulo "Rastreabilidade" (Operacional) — entidade TraceabilityConfig
   *  (Configuração de Rastreabilidade, F-066, execução 040, TASK-FE-1040).
   *  Namespace `rastreabilidade` — LIVRE, i18n modular independente. */
  rastreabilidade: ModuleRastreabilidade;
  /** Módulo "Perdas" (LossAnimal — Operacional / Pecuária, F-043, execução
   *  040, TASK-FE-2770..2776). Namespace `lossAnimals` — LIVRE, mirror
   *  `rastreabilidade`/`protocolSeasons`. */
  lossAnimals: ModuleLossAnimals;
  /** Módulo "Fechamento Semana" (ClosingWeek — Operacional, esteira
   *  `97-Esteiras/053`, TASK-FE-FS-01..04). Namespace `fechamentoSemana` —
   *  LIVRE, sem colisão com nenhum bloco existente. */
  fechamentoSemana: ModuleFechamentoSemana;
  /** Módulo "Planejamentos" (Planning — Operacional / Agricultura, raiz da
   *  árvore de Planejamento de Cultura/Variedade, esteira `97-Esteiras/007`,
   *  TASK-FE-PLAN-01, fatia LISTAGEM). Namespace `plannings` — LIVRE, sem
   *  colisão com nenhum bloco existente. */
  plannings: ModulePlannings;
  /** Módulo "Orçamentos" (Budget/BudgetItem/BudgetPayment — Operacional /
   *  Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-01..06). Namespace `budgets`
   *  — TOP-LEVEL, LIVRE, sem colisão com nenhum bloco existente, mirror
   *  `fechamentoSemana`/`carregamentos`. */
  budgets: ModuleBudgets;
  /** Módulo "Pedidos" (Order/OrderItem — Operacional / Vendas, F-051,
   *  97-Esteiras/043, PED-FE-01..08). Namespace `orders` — TOP-LEVEL, LIVRE,
   *  sem colisão com nenhum bloco existente, mirror `budgets`. */
  orders: ModuleOrders;
  /** Módulo "Vendas COMERCIAL" (Sale/SaleItem — Operacional / Vendas, venda
   *  de PRODUTOS, 97-Esteiras/043, SALE-FE-COM-01..08). Namespace `sales` —
   *  TOP-LEVEL, LIVRE, sem colisão com `movementSales` (Venda de ANIMAIS)
   *  nem `saleContracts` (Contratos de Venda). Dicionário CHOKEPOINT — só
   *  `SALE-FE-COM-01` edita este arquivo (contrato-tela §10). */
  sales: ModuleSales;
  /** Módulo "Gerenciamento Avançado" (AdvancedReproductive — Operacional /
   *  Reprodução, F-011, 97-Esteiras/056, TASK-AR-FE-01, chave TOP-LEVEL,
   *  mirror `breedingSeasons`/`bullSeedSeason`/`breedingBatches`; tela 100%
   *  LEITURA, sem bloco `form`/`detail`). */
  advancedReproductive: ModuleAdvancedReproductive;
  /** Módulo "Acasalamento" (BreedingMating — Operacional / Reprodução, F-016,
   *  run-001-gbcerne-20260824, TASK-BM-FE-01, chave TOP-LEVEL, mirror
   *  `breedingBatches`/`bullSeedSeason`). `pregnancyDiagnosis` (Diagnóstico
   *  de Gestação) vive ANINHADO dentro deste módulo — sem chave raiz
   *  própria, espelhando a hierarquia de permissão do legado. */
  breedingMatings: ModuleBreedingMating;
  /** Módulo "Lote/Fazenda" (TransferBatchFarm — Operacional / Pecuária /
   *  Transferências, 97-Esteiras/041, TASK-FE-041-LF-01..04, chave TOP-LEVEL,
   *  mirror `livestock`/`processamentos`). Namespace `loteFazenda` — LIVRE,
   *  sem colisão com `livestock` (`transferAbcBatch`, feature intra-fazenda
   *  DIFERENTE). */
  loteFazenda: ModuleLoteFazenda['loteFazenda'];
  /** Módulo "Lote/Módulo/Área" (BatchModuleAreaTransfer — Operacional /
   *  Pecuária / Transferências, 97-Esteiras/070, TASK-LMA-FE-01..04, chave
   *  TOP-LEVEL, mirror `loteFazenda`). Namespace `loteModuloArea` — LIVRE,
   *  sem colisão com `loteFazenda` (`transferBatchFarm`, transferência ENTRE
   *  FAZENDAS) nem com a feature-irmã já migrada `/cadastros-base/lote-modulo`. */
  loteModuloArea: ModuleLoteModuloArea['loteModuloArea'];
  /** Módulo "Animal/Fazenda" (TransferAnimalFarm — Operacional / Pecuária /
   *  Transferências, 97-Esteiras/042, TASK-FE-042-101..106, chave TOP-LEVEL,
   *  mirror `loteFazenda`). Namespace `animalFazenda` — LIVRE, sem colisão
   *  com `livestock`/`loteFazenda`. */
  animalFazenda: ModuleAnimalFazenda['animalFazenda'];
  /** Módulo "Sanitário" (Sanitary Record — Operacional / Pecuária / Manejo,
   *  F-062, TASK-SAN-FE-01, chave TOP-LEVEL, mirror `weaning` — dupla
   *  aninhamento `languageGB.sanitary.sanitary.*`). Namespace `sanitary` —
   *  LIVRE, sem colisão com `weaning`/`processamentos`; NÃO confundir com
   *  `feedlotMap.feedlotMap.sanitary` (diálogo do Mapa de Confinamento,
   *  execução 042, bounded context diferente, ADR-FE-SAN-00). */
  sanitary: ModuleSanitary;
  /** Módulo "Pesagem" (Weighing — Operacional / Pecuária / Manejo, F-071,
   *  TASK-PES-FE-01, chave TOP-LEVEL, mirror `sanitary`). Namespace
   *  `weighing` — LIVRE, sem colisão com `sanitary`/`weaning`; NÃO confundir
   *  com `feedlotMap.feedlotMap.weighing` (diálogo do Mapa de Confinamento,
   *  execução 042, bounded context diferente). */
  weighing: ModuleWeighing;
  /** Módulo "Pesagem Rodoviária" (ModuleWeighing — Operacional, F-045,
   *  execução 044, TASK-MWG-FE-01, chave TOP-LEVEL, mirror `weighing`).
   *  Namespace `moduleWeighing` — DELIBERADAMENTE disjunto de `weighing`
   *  (pesagem ANIMAL, F-071, acima) — `CONTRATO-TELA-PESAGEM-FE §1`. */
  moduleWeighing: ModuleModuleWeighing;
  /** Módulo "Contas a Receber" (ChargeBillIncome — Operacional / Agricultura /
   *  Carregamento, F-026, esteira `97-Esteiras/059`, TASK-CBI-FE-01). Namespace
   *  `chargeBillIncomes` — LIVRE, sem colisão com `incomes` (Financeiro,
   *  entidade homônima distinta). */
  chargeBillIncomes: ModuleChargeBillIncomes;
  /** Módulo "Contas a Pagar" (ChargeBillExpense — Operacional / Agricultura /
   *  Carregamento, esteira `97-Esteiras/062`, TASK-CBE-04). Namespace
   *  `chargeBillExpenses` — LIVRE, sem colisão com `expenses` (Financeiro,
   *  entidade homônima distinta) nem com `chargeBillIncomes` (gêmeo). */
  chargeBillExpenses: ModuleChargeBillExpenses;
  /** Módulo "Site" (configuração única do site/fazenda — Site.edit/Site.update,
   *  97-Esteiras/061, TASK-SITE-04), chave TOP-LEVEL (mirror `chargeBillExpenses`/
   *  `markers`). Namespace `site` — LIVRE, sem colisão com nenhum módulo existente. */
  site: ModuleSite['site'];
  /** Módulo "Nutrição" (Nutrition — Operacional / Consumo de Ração, F-050,
   *  esteira `97-Esteiras/066`, TASK-NT-FE-01, chave TOP-LEVEL, mirror
   *  `foodBeats`/`dietBeats`). Namespace `nutritions` — LIVRE, sem colisão
   *  com nenhum módulo existente. */
  nutritions: ModuleNutritions;
  /** Módulo "Revisões Agendadas" (ScheduledReview — Gestão de Frota, F-104, 97-Esteiras/005, TASK-REVAG-FE-01, chave TOP-LEVEL, mirror `nutritions`/`weighing`). Namespace `scheduledReviews` — LIVRE, sem colisão com nenhum módulo existente. */
  scheduledReviews: ModuleScheduledReviews;
  /** Módulo "Transferência de Máquinas" (EquipmentTransfer — Gestão de Frota, F-101, 97-Esteiras/005, TASK-ETR-FE-01, chave TOP-LEVEL, mirror `scheduledReviews`). Namespace `equipmentTransfers` — LIVRE, sem colisão com nenhum módulo existente. */
  equipmentTransfers: ModuleEquipmentTransfers;
  /** Módulo "Compartilhamento" (Sharing — Integrações, F-122,
   *  97-Esteiras/070, TASK-CP-FE-01/02/03), chave TOP-LEVEL (mirror
   *  `chargeBillExpenses`/`nutritions`). Namespace `sharings` — LIVRE, sem
   *  colisão com nenhum módulo existente. */
  sharings: ModuleSharings['sharings'];
  /** Módulo "Integrações" (Integrations — telas de export contábil,
   *  F-119 "Exportação NFS-e → Domínio", canário `97-Esteiras/071`,
   *  TASK-NFSE-FE-01), chave TOP-LEVEL (mirror `sharings`/`nutritions`).
   *  Namespace `integrations` — COMPARTILHADO pelas irmãs F-116/117/118/120
   *  (Decisão E do contrato `ExportNfseDominio-contrato-tela.md`). */
  integrations: ModuleIntegrations['integrations'];
  /** Módulo "Software Domínio" (IntegrationDominio — Integrações, F-121,
   *  97-Esteiras/072, TASK-F121-FE-01), chave TOP-LEVEL (mirror `sharings`).
   *  Namespace `integrationDominios` — LIVRE, sem colisão com nenhum módulo
   *  existente. CRUD-pai da área Integrações (Lista/Cadastro/Detalhe +
   *  fluxo "Testar Conexão"). */
  integrationDominios: ModuleIntegrationDominios['integrationDominios'];
  /** Módulo "DRE" (relatório mensal — domínio Financeiro, F-259,
   *  97-Esteiras/049, TASK-DRE-FE-01), chave TOP-LEVEL (mirror
   *  `accountingEntries.report`). Namespace `dre` — LIVRE, sem colisão com
   *  nenhum módulo existente. */
  dre: ModuleDre;
  /** Módulo "DRE Anual" (relatório anual — domínio Financeiro, F-258,
   *  97-Esteiras/049, TASK-DRE-FE-03), chave TOP-LEVEL, mirror `dre`
   *  (tela irmã) — endpoint/permissão/forma de filtro (ano) distintos. */
  dreAnnual: ModuleDreAnnual;
  /** Módulo "Apuração Mensal" (relatório — domínio Relatórios > Gestão
   *  Pessoal, F-285, `97-Esteiras/007`, TASK-07-57), chave TOP-LEVEL, mirror
   *  `dre`/`dreAnnual` (telas irmãs de relatório "gerar e sair"). Namespace
   *  `monthlyCalculationReport` — LIVRE, sem colisão com nenhum módulo
   *  existente. */
  monthlyCalculationReport: ModuleMonthlyCalculationReport;
  /** Módulo "Relatórios de Contas" (Financeiro — F-262 C. à Pagar/F-291 C.
   *  Pagas/F-271 C. a Receber/F-292 C. Recebidas, esteira 97-Esteiras/050,
   *  TASK-050-FE-00), chave TOP-LEVEL, mirror `dre`/`dreAnnual`. Namespace
   *  `accountsReports` — LIVRE, sem colisão com nenhum módulo existente. */
  accountsReports: ModuleAccountsReports;
  /** Módulo "Juros Pagos" (relatório financeiro — F-290, 97-Esteiras/073,
   *  TASK-290-FE-01), chave TOP-LEVEL, mirror `dre` — endpoint/permissão
   *  próprios, sem grid/prévia. Namespace `paidInterestReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  paidInterestReport: ModulePaidInterestReport;
  /** Módulo "Juros Recebidos" (relatório financeiro — 97-Esteiras/014,
   *  Tarefa 49), chave TOP-LEVEL, mirror `paidInterestReport`/
   *  `receiptScheduleReport` — endpoint/permissão próprios, sem grid/prévia
   *  (export PDF/Excel). Namespace `receivedInterestReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  receivedInterestReport: ModuleReceivedInterestReport;
  /** Módulo "Apuração de Custo" (relatório financeiro — F-245, 97-Esteiras/073,
   *  TASK-245-FE-01), chave TOP-LEVEL, mirror `paidInterestReport` —
   *  endpoint/permissão próprios, sem grid/prévia. Namespace
   *  `costCalculationReport` LIVRE, sem colisão com nenhum módulo existente. */
  costCalculationReport: ModuleCostCalculationReport;
  /** Módulo "Centro de Custo" (relatório financeiro — F-247, 97-Esteiras/052,
   *  TASK-052-247-FE-01), chave TOP-LEVEL, mirror `costCalculationReport` —
   *  download-only (PDF+Excel) COM prévia JSON ({title,subtitle,columns,rows,
   *  kpis,filters}). Namespace `costCenterReport` LIVRE, sem colisão com
   *  nenhum módulo existente (distinto do CRUD `CadastrosBase/CentroCusto`). */
  costCenterReport: ModuleCostCenterReport;
  /** Módulo "Livro Razão" (relatório financeiro — F-274, 97-Esteiras/008,
   *  TASK-FE-LR-01), chave TOP-LEVEL, mirror `costCenterReport` —
   *  download-only (PDF+Excel) COM prévia JSON ({title,subtitle,emittedAt,
   *  columns,rows,kpis,filters}). Namespace `ledgerReport` LIVRE, sem
   *  colisão com `paidInterestReport`/`accountsPayableReceivableReport` (a
   *  feature irmã "Partida Dobrada" usa o namespace distinto
   *  `accountingEntries` — GAP-LR-05). */
  ledgerReport: ModuleLedgerReport;
  /** Módulo "Consolidado Pagar/Receber" (relatório financeiro — F-214,
   *  97-Esteiras/052, TASK-052-214-FE-01), chave TOP-LEVEL, mirror
   *  `costCenterReport` — download-only (PDF+Excel via campo `format` único,
   *  SEM prévia). Namespace `accountsPayableReceivableReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  accountsPayableReceivableReport: ModuleAccountsPayableReceivableReport;
  /** Módulo "Movimento Bancário" (relatório financeiro — F-264,
   *  97-Esteiras/058, TASK-058-F264-FE-01), chave TOP-LEVEL, mirror
   *  `costCenterReport` — download-only (PDF+Excel via campo `format`
   *  único), SEM prévia/grid on-screen (CL-12 do contrato legado). Namespace
   *  `financialMovementReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  financialMovementReport: ModuleFinancialMovementReport;
  /** Módulo "Romaneio/Diferença" (relatório agrícola — Tarefa 49,
   *  97-Esteiras/014, feature_id c0b2369d), chave TOP-LEVEL, mirror
   *  `accountsPayableReceivableReport` — download-only (PDF+Excel via campo
   *  `format` único, SEM prévia), `client` SINGLE-select. Namespace
   *  `transferDifferenceReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  transferDifferenceReport: ModuleTransferDifferenceReport;
  /** Módulo "Custo de Produção" (relatório financeiro — F-272, 97-Esteiras/073,
   *  TASK-272-FE-01), chave TOP-LEVEL, mirror `costCalculationReport` —
   *  endpoint/permissão próprios, COM tabela de prévia hierárquica + 3
   *  drill-downs (diferente das 2 telas-irmãs acima, só filtro+PDF). Namespace
   *  `incomeStatementReport` LIVRE, sem colisão com nenhum módulo existente. */
  incomeStatementReport: ModuleIncomeStatementReport;
  /** Módulo "Custo Produção Batida" (relatório AGREGADO de Estoque — F-267,
   *  97-Esteiras/073, TASK-267-FE-01), chave TOP-LEVEL, mirror
   *  `costCalculationReport`/`paidInterestReport` — endpoint/permissão
   *  próprios, sem grid/prévia. Namespace `foodBeatAggregateReport` LIVRE,
   *  sem colisão com nenhum módulo existente. */
  foodBeatAggregateReport: ModuleFoodBeatAggregateReport;
  /** Módulo "Produção/Custeio/Área" (relatório agrícola — F-298,
   *  97-Esteiras/051, TASK-298-FE-01), chave TOP-LEVEL, mirror
   *  `foodBeatAggregateReport` — endpoint/permissão próprios, sem
   *  grid/prévia. CANÁRIO da tela de relatório em código para o fan-out
   *  (F-279/F-238/F-315/F-326). Namespace `productionCostingAreaReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  productionCostingAreaReport: ModuleProductionCostingAreaReport;
  /** Módulo "Custeio/Área" (relatório agrícola — F-252, lote 079,
   *  F-252-plano-frontend.md TASK-252-FE-01), chave TOP-LEVEL, mirror
   *  `productionCostingAreaReport` — endpoint/permissão PRÓPRIOS
   *  (`GET /costing-area-report`, `cost_area_view`), sem grid/prévia. Tela
   *  NOVA e distinta de `productionCostingAreaReport` (F-298, ver §0 do
   *  roteiro). Namespace `costingAreaReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  costingAreaReport: ModuleCostingAreaReport;
  /** Módulo "Prod./Colaborador" (relatório agrícola — F-300, lote 079,
   *  F-300-plano-frontend.md TASK-300-FE-01), chave TOP-LEVEL, mirror
   *  `productionCostingAreaReport` — endpoint/permissão próprios, sem
   *  grid/prévia, acrescido de `teams`/`employees` (2 selects sem cascata
   *  que o F-298 não tem). Namespace `productionPerWorkerReport` LIVRE,
   *  sem colisão com nenhum módulo existente. */
  productionPerWorkerReport: ModuleProductionPerWorkerReport;
  /** Módulo "Manejo/Lote" (relatório pecuário — F-279, 97-Esteiras/051,
   *  TASK-279-FE-01), chave TOP-LEVEL, mirror `productionCostingAreaReport`
   *  — endpoint/permissão próprios, sem grid/prévia, SEM cascata (contrato
   *  legado §6 "cascatas" = `NAO_APLICAVEL`). Fan-out do canário F-298.
   *  Namespace `managementBatchReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  managementBatchReport: ModuleManagementBatchReport;
  /** Módulo "Pesagem/Lote" (relatório pecuário — Tarefa 49, esteira
   *  CORE_WORKSPACE/97-Esteiras/014), chave TOP-LEVEL, mirror
   *  `managementBatchReport` — endpoint/permissão próprios, sem grid/prévia,
   *  acrescido do campo `onlyActiveBatch` (mirror `launched` de
   *  `DfeReport.tsx`) e seletor `format` (PDF portrait/Excel). Namespace
   *  `accumulatedWeighingBatchReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  accumulatedWeighingBatchReport: ModuleAccumulatedWeighingBatchReport;
  /** Módulo "Transf/Lote/Módulo/Área" (relatório pecuário — F-329,
   *  97-Esteiras/077, F-329-plano-front.md), chave TOP-LEVEL, mirror
   *  `managementBatchReport` — endpoint/permissão próprios, sem grid/prévia,
   *  SEM cascata (contrato legado §2). Fan-out do canário F-298. Namespace
   *  `transferBatchGrazingAreaReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  transferBatchGrazingAreaReport: ModuleTransferBatchGrazingAreaReport;
  /** Módulo "Vendas/Produto" (relatório comercial — F-315, 97-Esteiras/051,
   *  TASK-315-FE-01), chave TOP-LEVEL, mirror `managementBatchReport` —
   *  endpoint/permissão próprios, sem grid/prévia, SEM cascata (contrato
   *  legado, dimensão "cascatas" = `NAO_APLICAVEL`). Fan-out do canário
   *  F-298. Namespace `saleProductReport` LIVRE, sem colisão com nenhum
   *  módulo existente (distinto de `ModuleSales`, que é o CRUD de Venda
   *  Comercial). */
  saleProductReport: ModuleSaleProductReport;
  /** Módulo "Vendas/Funcionário" (relatório comercial — F-314, 97-Esteiras/079),
   *  chave TOP-LEVEL, mirror `saleProductReport` — endpoint/permissão próprios,
   *  sem grid/prévia, SEM cascata (contrato legado, dimensão "cascatas" =
   *  `NAO_APLICAVEL`). Namespace `saleEmployeeReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  saleEmployeeReport: ModuleSaleEmployeeReport;
  /** Módulo "Prod./Área" (relatório de Agricultura — F-299, 97-Esteiras/012,
   *  Tarefa 47/48), chave TOP-LEVEL, mirror `costCalculationReport` — mesmo
   *  wire de prévia (`preview`+`pdf`, `{title,subtitle,columns,rows,kpis,
   *  filters}`). Namespace `productionAreaReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  productionAreaReport: ModuleProductionAreaReport;
  /** Módulo "Horas Logadas" (relatório de Gestão Pessoal — F-275,
   *  97-Esteiras/012, Tarefa 47), chave TOP-LEVEL, mirror
   *  `costCalculationReport` — filtro+prévia agrupada, sem drill-down.
   *  Namespace `loggedHoursReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  loggedHoursReport: ModuleLoggedHoursReport;
  /** Módulo "Ficha Animal" (relatório de Pecuária — F-225, 97-Esteiras/012,
   *  Tarefa 47), chave TOP-LEVEL, mirror `productionAreaReport` — tela
   *  "gerar e sair" sem prévia on-screen (contrato de tela §1.2/§R-05): só
   *  3 filtros opcionais (Categoria/Lote/Animal) + botão + toasts. Namespace
   *  `animalRecordReport` LIVRE, sem colisão com nenhum módulo existente. */
  animalRecordReport: ModuleAnimalRecordReport;
  /** Módulo "Recebimentos" (relatório de Estoque — F-305, 97-Esteiras/074,
   *  TASK-RCB-FE-01), chave TOP-LEVEL, mirror
   *  `foodBeatAggregateReport`/`paidInterestReport` — endpoint/permissão
   *  próprios, sem grid/prévia. Namespace `receiptsReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  receiptsReport: ModuleReceiptsReport;
  /** Módulo "Custeio/Lote" (relatório de Pecuária — F-20c552f0,
   *  97-Esteiras/074, TASK-CL-FE-01), chave TOP-LEVEL, mirror
   *  `foodBeatAggregateReport`/`receiptsReport` — endpoint/permissão
   *  próprios, sem grid/prévia. Namespace `costingBatchReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  costingBatchReport: ModuleCostingBatchReport;
  /** Módulo "Custeio/Animal" (relatório de Pecuária — F-248, 97-Esteiras/075,
   *  TASK-CA-FE-01), chave TOP-LEVEL, mirror `costingBatchReport`/
   *  `receiptsReport` — endpoint/permissão próprios, sem grid/prévia.
   *  Namespace `costingAnimalReport` LIVRE, sem colisão com nenhum módulo
   *  existente (confirmado por grep). */
  costingAnimalReport: ModuleCostingAnimalReport;
  /** Módulo "Custeio/Módulo" (relatório de Pecuária — F-250, 97-Esteiras/080,
   *  TASK-CM-FE-01), chave TOP-LEVEL, mirror `costingBatchReport`/
   *  `costingAnimalReport` — endpoint/permissão próprios, sem grid/prévia.
   *  Namespace `costingGrazingReport` LIVRE, sem colisão com nenhum módulo
   *  existente (confirmado por grep). */
  costingGrazingReport: ModuleCostingGrazingReport;
  /** Módulo "Movimentação de Estoque" (relatório de Estoque — F-1f1d23e3,
   *  97-Esteiras/074, TASK-MOV-FE-01), chave TOP-LEVEL, mirror
   *  `costingBatchReport`/`receiptsReport` — endpoint/permissão próprios,
   *  sem grid/prévia. Namespace `stockMovementReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  stockMovementReport: ModuleStockMovementReport;
  /** Módulo "Inventário Patrimonial" (relatório de Bens/Equipamentos —
   *  F-260, 97-Esteiras/075, TASK-INV-FE-01), chave TOP-LEVEL, mirror
   *  `stockMovementReport`/`costingAnimalReport` — endpoint único (PDF/Excel
   *  decidido pelo backend via `type`), sem grid/prévia. Namespace
   *  `equipmentInventoryReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  equipmentInventoryReport: ModuleEquipmentInventoryReport;
  /** Módulo "Prev. Área/Receita" (relatório de Agricultura — F-280,
   *  97-Esteiras/075, TASK-MFA-FE-01), chave TOP-LEVEL, mirror
   *  `stockMovementReport`/`costingAnimalReport` — endpoint/permissão
   *  próprios, sem grid/prévia. Namespace `markingForecastAreaReport` LIVRE,
   *  sem colisão com nenhum módulo existente. */
  markingForecastAreaReport: ModuleMarkingForecastAreaReport;
  /** Módulo "Nascimentos/SISBOV" (relatório de Pecuária — F-235,
   *  97-Esteiras/052, TASK-052-235-FE-01), chave TOP-LEVEL, mirror `dre` —
   *  tela de filtro + download PDF, SEM grid/prévia. Diferente de `dre`,
   *  esta tela é SÓ PDF (sem seletor de formato) e ambas as datas são
   *  opcionais (DEC-225 §7.3). Namespace `birthAnimalSisbovReport` LIVRE,
   *  sem colisão com nenhum módulo existente. */
  birthAnimalSisbovReport: ModuleBirthAnimalSisbovReport;
  /** Módulo "Lote/Fornecedor" (relatório de Estoque — F-324,
   *  97-Esteiras/052, TASK-052-324-FE-01), chave TOP-LEVEL, mirror
   *  `birthAnimalSisbovReport` — tela de filtro + download binário, SEM
   *  grid/prévia. Diferente de `birthAnimalSisbovReport`, esta tela TEM
   *  seletor de formato (PDF+Excel, DEC-225) e `provider` é o único campo
   *  obrigatório; `start_date`/`end_date` são decorativos (CLM-010/DIV-001).
   *  Namespace `stockProviderLotReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  stockProviderLotReport: ModuleStockProviderLotReport;
  /** Módulo "Curva ABC/Estoque" (relatório de Estoque — F-322,
   *  97-Esteiras/077, CONTRATOS/front/F-322-plano-front.md), chave
   *  TOP-LEVEL, mirror `stockProviderLotReport` — tela de filtro + download
   *  binário, SEM grid/prévia. Diferente de `stockProviderLotReport`, esta
   *  tela NÃO tem campo de lookup de entidade e `start_date`/`end_date` são
   *  AMBAS OBRIGATÓRIAS (fidelidade ao legado). Namespace `stockAbcReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  stockAbcReport: ModuleStockAbcReport;
  /** Módulo "Estoque Consolidado" (relatório de Estoque — F-323,
   *  feature_id e70b8cad, 97-Esteiras/079, F-323-plano-frontend.md), chave
   *  TOP-LEVEL, mirror `stockAbcReport` — tela de filtro + download binário,
   *  SEM grid/prévia. Diferente de `stockAbcReport`: 8 campos (cascata
   *  group→category→kind + search + product + date), só `warehouses`
   *  obrigatório. Namespace `stockConsolidatedReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  stockConsolidatedReport: ModuleStockConsolidatedReport;
  /** Módulo "Estq. Animais/Categoria" (relatório de Pecuária — F-242,
   *  97-Esteiras/077, CONTRATOS/front/F-242-plano-front.md), chave
   *  TOP-LEVEL, mirror `stockAbcReport` — tela de filtro + download
   *  binário, SEM grid/prévia. Diferente de `stockAbcReport`, os 3 campos de
   *  lookup (`category`/`batch`/`harvest`) são OPCIONAIS (fiel ao legado
   *  CL-04, nenhum filtro obrigatório). Namespace `categoryAnimalReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  categoryAnimalReport: ModuleCategoryAnimalReport;
  /** Módulo "Vendas/Animais" (relatório de Pecuária — F-227, 97-Esteiras/077,
   *  CONTRATOS/front/F-227-plano-front.md), chave TOP-LEVEL, mirror
   *  `categoryAnimalReport` — tela de filtro + download binário, SEM
   *  grid/prévia. Diferente de `categoryAnimalReport`, os 3 campos de lookup
   *  (`sale`/`batch`/`client`) são OPCIONAIS e SEM CASCATA entre si (fiel ao
   *  legado, `cascatas: NAO_APLICAVEL`), e `start_date`/`end_date` também
   *  são OPCIONAIS/decorativos. Namespace `animalsSaleReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  animalsSaleReport: ModuleAnimalsSaleReport;
  /** Módulo "Máquinas" (relatório de Frotas — F-278, 97-Esteiras/052,
   *  TASK-052-278-FE-01), chave TOP-LEVEL, mirror `stockProviderLotReport`
   *  — tela de filtro + download binário, SEM grid/prévia. Diferente da
   *  irmã Lote/Fornecedor, `equipment_ids` (multi, min 1) é o campo
   *  obrigatório e existe a cascata `maintenance_type`↔`maintenance_executor_id`
   *  (employee↔provider). Namespace `machinesReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  machinesReport: ModuleMachinesReport;
  /** Módulo "Pesagens/Colheita" (relatório de Agricultura — F-335,
   *  97-Esteiras/053, TASK-053-335-FE-01), chave TOP-LEVEL, mirror
   *  `stockProviderLotReport` — tela de filtro + download binário, SEM
   *  grid/prévia. Diferente da irmã Lote/Fornecedor, esta tela tem 2 datas
   *  OBRIGATÓRIAS (`start_date`/`end_date`, CORRIGE CL-09) e 5 filtros
   *  opcionais (produto/área/armazém/cliente/tipo). Namespace
   *  `weighingHarvestReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  weighingHarvestReport: ModuleWeighingHarvestReport;
  /** Módulo "Histórico de Animais/Lote" (relatório de Pecuária — F-221,
   *  97-Esteiras/058, TASK-058-F221-FE-01), chave TOP-LEVEL, mirror
   *  `weighingHarvestReport` — tela de filtro + download binário (PDF/Excel),
   *  SEM grid/prévia, SEM `columns`/`order` (colunas e ordenação são fixas no
   *  servidor). Namespace `animalBatchHistoryReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  animalBatchHistoryReport: ModuleAnimalBatchHistoryReport;
  /** Módulo "Romaneio Cliente" (relatório de Agricultura — F-332,
   *  97-Esteiras/058, TASK-058-F332-FE-01), chave TOP-LEVEL, mirror
   *  `animalBatchHistoryReport` — tela de filtro + download binário
   *  (PDF-ONLY), SEM grid/prévia, SEM `format`/`outputTypeOptions`. Namespace
   *  `transferClienteReport` LIVRE, sem colisão com nenhum módulo existente. */
  transferClienteReport: ModuleTransferClienteReport;
  /** Módulo "Pesagem Entrada/Saída" (relatório de Agricultura — F-336,
   *  97-Esteiras/058, FRONT-F336-plano.md), chave TOP-LEVEL, mirror
   *  `transferClienteReport`/`weighingHarvestReport` — tela de filtro +
   *  download binário (PDF/Excel via `format`), SEM grid/prévia, SEM
   *  `columns`/`order` (colunas e cálculo de saldo são fixos no servidor).
   *  Namespace `weighingInOutReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  weighingInOutReport: ModuleWeighingInOutReport;
  /** Módulo "Nascimentos" GENÉRICO (relatório pecuário — F-236, 97-Esteiras/053,
   *  TASK-053-236-FE-01), chave TOP-LEVEL, mirror `managementBatchReport` —
   *  endpoint/permissão próprios, sem grid/prévia. Distinto do irmão SISBOV
   *  (F-235, `birthAnimalSisbovReport`): este é PDF+Excel, datas obrigatórias,
   *  com filtro de categoria. Namespace `birthReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  birthReport: ModuleBirthReport;
  /** Módulo "Fluxo de Caixa Mensal" (relatório financeiro — F-240,
   *  97-Esteiras/053, TASK-053-240-FE-01), chave TOP-LEVEL, mirror
   *  `costCenterReport` — download-only puro (PDF+Excel via campo `format`
   *  único, SEM prévia, mirror `accountsPayableReceivableReport`). Namespace
   *  `cashFlowByCategoryReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  cashFlowByCategoryReport: ModuleCashFlowByCategoryReport;
  /** Módulo "Fiscal/Não Fiscal" (relatório financeiro — F-266, lote 076,
   *  `FiscalDifferenceReport-contrato.md`), chave TOP-LEVEL, mirror
   *  `cashFlowByCategoryReport` — download-only puro, SEM prévia/grid, MAS 2
   *  botões PDF/Excel (mirror `costingAnimalReport`) em vez de campo
   *  `format` único. Namespace `fiscalDifferenceReport` LIVRE, sem colisão
   *  com nenhum módulo existente. */
  fiscalDifferenceReport: ModuleFiscalDifferenceReport;
  /** Módulo "ANS" (relatório de Suprimentos — F-229, lote 076,
   *  `F-229-ans-report-contrato-api.md`), chave TOP-LEVEL, mirror
   *  `costingAnimalReport` — download-only puro, SEM prévia/grid, 2 botões
   *  PDF/Excel, MAS sem nenhum outro filtro além do par de datas obrigatório.
   *  Namespace `ansReport` LIVRE, sem colisão com nenhum módulo existente. */
  ansReport: ModuleAnsReport;
  /** Módulo "Nutrição/Lote" (relatório pecuário — F-288, 97-Esteiras/053,
   *  TASK-288-FE-01), chave TOP-LEVEL, mirror `managementBatchReport` —
   *  endpoint/permissão próprios, sem grid/prévia, SEM cascata (roteiro-
   *  front-F288-nutricao.md FID-G3F, FM-01/FM-02/CL-10 = `NAO_APLICAVEL`).
   *  Diferente do irmão `managementBatchReport`, esta tela TEM seletor de
   *  formato (PDF+Excel, reuso do catálogo GLOBAL `reportFormatOptions`/
   *  `ReportFormat`). Namespace `nutritionConsumptionReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  nutritionConsumptionReport: ModuleNutritionConsumptionReport;
  /** Módulo "Gerencial de Solicitações" (relatório de Suprimentos — F-310,
   *  97-Esteiras/053, TASK-053-F310-FE-01), chave TOP-LEVEL, mirror
   *  `managementBatchReport`/`costCenterReport` — download-only (PDF+Excel
   *  via 2 rotas dedicadas, SEM campo "formato" único, SEM prévia/grid).
   *  Namespace `requestPurchaseManagementReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  requestPurchaseManagementReport: ModuleRequestPurchaseManagementReport;
  /** Módulo "Produtos x Prev. Entrega" (relatório de Suprimentos — F-309,
   *  97-Esteiras/058, TASK-058-F309-FE-01), chave TOP-LEVEL, mirror
   *  `requestPurchaseManagementReport` — download-only (PDF+Excel via 2
   *  rotas dedicadas, SEM campo "formato" único, SEM prévia/grid). Namespace
   *  `requestPurchaseForecastReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  requestPurchaseForecastReport: ModuleRequestPurchaseForecastReport;
  /** Módulo "Abastecimentos" (relatório de Frotas — F-277, 97-Esteiras/054,
   *  TASK-054-277-FE-01), chave TOP-LEVEL, mirror `machinesReport` — tela de
   *  filtro + download binário (PDF+Excel), SEM grid/prévia. Diferente do
   *  irmão `machinesReport`, os 3 primeiros pickers (máquinas/fazendas/
   *  armazéns) vêm de 1 bundle único (`/machines-supply-report/options`,
   *  D-FE-01), não de lookups remotos independentes. Namespace
   *  `machinesSupplyReport` LIVRE, sem colisão com nenhum módulo existente. */
  machinesSupplyReport: ModuleMachinesSupplyReport;
  /** Módulo "Manutenções" (relatório de Frotas — F-276, 97-Esteiras/078,
   *  TASK-F276-F01), chave TOP-LEVEL, mirror DUPLO `machinesSupplyReport`
   *  (checkbox equipment/farm sobre bundle único `/machines-maintenance-
   *  report/options`) + `requisitionsReport` (warehouse/product single + 2
   *  botões PDF/Excel). Namespace `machinesMaintenanceReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  machinesMaintenanceReport: ModuleMachinesMaintenanceReport;
  /** Módulo "Fluxo Mensal de Pagamento" (`payment-cashflow.report`, relatório
   *  de Financeiro — F-293, execução 97-Esteiras/078, TASK-F293-F01), chave
   *  TOP-LEVEL, mirror `requestQuotationReport` — tela de filtro + 2
   *  downloads (PDF/Excel) independentes, sem grid/prévia, 2
   *  `CheckboxListField` (Contas/Categorias) + 3 selects
   *  (Proprietários/Centro de Custo/Fazenda) alimentados por UM fetch
   *  dedicado. Namespace `paymentCashflowReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  paymentCashflowReport: ModulePaymentCashflowReport;
  /** Módulo "Extrato Financeiro" (relatório de Financeiro — F-233, execução
   *  97-Esteiras/079, TASK-F233-FE-01), mirror `paymentCashflowReport`
   *  (F-293) — tela de filtro + 2 downloads (PDF/Excel), sem grid/prévia, 1
   *  select OBRIGATÓRIO (`account`, único) + 3 selects opcionais + 1
   *  `CheckboxListField` opcional (`categories`) + 1 select `noClearable`
   *  (`condition`). Namespace `bankStatementReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  bankStatementReport: ModuleBankStatementReport;
  /** Módulo "Faturamento" (relatório de Gestão Fiscal — F-286,
   *  97-Esteiras/054, TASK-054-286-FE-01), chave TOP-LEVEL, mirror
   *  `accountsPayableReceivableReport` — tela de filtro + download binário
   *  (PDF+Excel via campo `type` int PRÓPRIO, D-FE-02), SEM grid/prévia e
   *  SEM seletor de colunas (D-FE-01, colunas fixas no servidor). Namespace
   *  `nfeProductReport` LIVRE, sem colisão com nenhum módulo existente. */
  nfeProductReport: ModuleNfeProductReport;
  /** Módulo "Mortes/SISBOV" (relatório de Pecuária — F-253, 97-Esteiras/054,
   *  TASK-054-253-FE-01), chave TOP-LEVEL, mirror EXATO `birthAnimalSisbovReport`
   *  — tela de filtro + download PDF, SEM grid/prévia, SÓ PDF (sem seletor
   *  de formato), ambas as datas opcionais. Namespace `deathAnimalSisbovReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  deathAnimalSisbovReport: ModuleDeathAnimalSisbovReport;
  /** Módulo "Cliente/Produto" (relatório de Vendas — F-313, 97-Esteiras/054,
   *  TASK-054-313-T1), chave TOP-LEVEL, mirror `saleProductReport` — tela de
   *  filtro + download binário, SEM grid/prévia, acrescenta o filtro
   *  `client_uuid` (via `listClientOptions`) ao contrato do irmão F-315.
   *  Namespace `saleClientReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  saleClientReport: ModuleSaleClientReport;
  /** Módulo "Vendas/Cliente" (relatório de Vendas — F-317, 97-Esteiras/077,
   *  F-317-plano-front.md), chave TOP-LEVEL, mirror `saleClientReport` — tela
   *  de filtro + download binário, SEM grid/prévia, lista PLANA sem
   *  agrupamento (distinto do irmão `saleClientReport`/F-313, que agrupa por
   *  cliente+produto). Domínio de formato próprio `report_type:
   *  'pdf'|'excel'` (string) — NUNCA `0|1` (F-313) nem `'pdf'|'xlsx'`
   *  (`AccountsReports.ReportFormat`). Namespace `saleGeneralReport` LIVRE,
   *  sem colisão com nenhum módulo existente. */
  saleGeneralReport: ModuleSaleGeneralReport;
  /** Módulo "Rentabilidade/Cultura" (relatório de Agricultura — F-302,
   *  97-Esteiras/077, F-302-plano-front.md), chave TOP-LEVEL, mirror
   *  `saleClientReport` — tela de filtro + download PDF-only (SEM seletor
   *  de formato), acrescenta `cultivation_uuid` REQUIRED (`SelectAsyncPaginate`
   *  sobre `listCultivationOptions`) + `harvest` OPCIONAL 100% client-side
   *  (cascata de datas, mirror `ProducaoCusteioArea`). Namespace
   *  `profitabilityByCropReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  profitabilityByCropReport: ModuleProfitabilityByCropReport;
  /** Módulo "Agenda/Recebimentos" (relatório Financeiro — F-304,
   *  97-Esteiras/055, TASK-055-F304-FE-01), chave TOP-LEVEL, mirror
   *  `receiptsReport`/`nfeProductReport` — tela de filtro + download binário
   *  (PDF+Excel via `reportFormatOptions` compartilhado), SEM grid/prévia e
   *  SEM seletor de colunas (8 colunas fixas no servidor). Diferente do
   *  irmão `receiptsReport` (F-305), as datas são OPCIONAIS (fidelidade ao
   *  legado, CF304-05). Namespace `receiptScheduleReport` LIVRE, sem colisão
   *  com nenhum módulo existente. */
  receiptScheduleReport: ModuleReceiptScheduleReport;
  /** Módulo "Registro Genealógico" (relatório de Pecuária — F-222,
   *  97-Esteiras/055, TASK-055-F222-FE-01), chave TOP-LEVEL, mirror
   *  `module-animal-record-report` — tela "gerar e sair" sem prévia
   *  on-screen (a árvore pedigree é 100% renderizada dentro do PDF pelo
   *  backend), filtro `animal` OBRIGATÓRIO. Namespace `animalFamilyTreeReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  animalFamilyTreeReport: ModuleAnimalFamilyTreeReport;
  /** Módulo "Previsão Fazenda/Receita" (relatório de Agricultura — F-281,
   *  97-Esteiras/055, roteiro-front-F281-prev-fazenda-receita.md §4/§6-
   *  TASK-01), chave TOP-LEVEL, mirror `module-weighing-harvest-report` —
   *  tela de filtro + download binário, SEM grid/prévia, SÓ PDF (sem
   *  `formatOptions`, divergência declarada do molde SPA, FID-G3F
   *  CL-031/RN-19). Namespace `markingsFarmForecastReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  markingsFarmForecastReport: ModuleMarkingsFarmForecastReport;
  /** Módulo "Custo de Produção Acumulado" (relatório de Financeiro — F-217,
   *  97-Esteiras/058, TASK-058-F217-FE-01), chave TOP-LEVEL, mirror
   *  `module-income-statement-report` (irmão não-acumulado F-272) restrito
   *  aos campos de filtro — tela download-only, SEM grid/prévia on-screen
   *  nem drill-down (D-058-02, divergência deliberada). Namespace
   *  `accumulatedIncomeStatementReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  accumulatedIncomeStatementReport: ModuleAccumulatedIncomeStatementReport;
  /** Módulo "Custeio/Área Pecuária" (relatório de Pecuária — F-251,
   *  CusteioAreaPecuaria-contrato-api.md, lote 076), chave TOP-LEVEL, mirror
   *  `productionCostingAreaReport` (F-298) — tela de filtro + download PDF
   *  único, SEM grid/prévia, mesma cascata client-side IG-01, acrescida do
   *  3º filtro `grazings` (Módulo de Pastejo, sem cascata). Namespace
   *  `costingLivestockAreaReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  costingLivestockAreaReport: ModuleCostingLivestockAreaReport;
  /** Módulo "Aplicação/Manejo" (relatório de Pecuária — F-230, esteira
   *  97-Esteiras/077, F-230-plano-front.md), chave TOP-LEVEL, mirror
   *  `costingLivestockAreaReport` (F-251) — tela de filtro + download PDF
   *  único, SEM grid/prévia, mesma cascata client-side IG-01, SEM o 3º
   *  filtro `grazings` e SEM seletor de formato (PDF-only). Namespace
   *  `applicationManagementReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  applicationManagementReport: ModuleApplicationManagementReport;
  /** Módulo "Desempenho Pesagem Confinamento" (relatório de Pecuária —
   *  F-263, lote 076,
   *  `FeedlotWeighingPerformanceReport-contrato-api.md`), chave TOP-LEVEL,
   *  mirror `costingBatchReport` — download-only puro, SEM prévia/grid, 2
   *  botões PDF/Excel, filtros opcionais `corral`/`batch` (single-select) +
   *  par de datas obrigatório. Namespace `feedlotWeighingPerformanceReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  feedlotWeighingPerformanceReport: ModuleFeedlotWeighingPerformanceReport;
  /** Módulo "Movimentação/Rebanho" (relatório de Pecuária — F-224, lote 076,
   *  `AnimalMovementReport-contrato.md`), chave TOP-LEVEL, mirror
   *  `birthReport` — download-only puro, SEM prévia/grid, 2 botões
   *  PDF/Excel, filtro `harvest_uuid` (obrigatório, único caminho
   *  funcional) + `month` (presente por fidelidade visual, ignorado pelo
   *  servidor, AF-02). Namespace `animalMovementsReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  animalMovementsReport: ModuleAnimalMovementsReport;
  /** Módulo "Estoque Financeiro" (relatório financeiro — F-241,
   *  97-Esteiras/013, TASK-013-241-FE-01), chave TOP-LEVEL, mirror
   *  `cashFlowByCategoryReport` REDUZIDO a 3 campos — download-only puro
   *  (PDF+Excel via campo `format` único, SEM prévia). Namespace
   *  `cashflowProductReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  cashflowProductReport: ModuleCashflowProductReport;
  /** Módulo "Savings" (relatório de Suprimentos — F-319, execução
   *  97-Esteiras/013, TASK-013-F319-FE-01/02), chave TOP-LEVEL, mirror
   *  `stockMovementReport` — tela de filtro + 2 downloads (PDF inline/Excel)
   *  independentes, sem grid/prévia (DEC-FE-01 = sem prévia). Namespace
   *  `savingsReport` LIVRE, sem colisão com nenhum módulo existente. */
  savingsReport: ModuleSavingsReport;
  /** Módulo "Suprimentos" (relatório de Suprimentos — F-325, execução
   *  CORE_WORKSPACE/97-Esteiras/015, Tarefa 52), chave TOP-LEVEL, mirror
   *  `savingsReport` — tela de filtro (8 campos, TODOS opcionais) + 2
   *  downloads (PDF inline/Excel) independentes, sem grid/prévia. Namespace
   *  `suppliesReport` LIVRE, sem colisão com nenhum módulo existente. */
  suppliesReport: ModuleSuppliesReport;
  /** Módulo "Saídas x Centro Custo" (relatório de Estoque — F-301, execução
   *  97-Esteiras/078, TASK-F301-F01), chave TOP-LEVEL, mirror `savingsReport`
   *  — tela de filtro + 2 downloads (PDF/Excel) independentes, sem
   *  grid/prévia. Namespace `productsExitCostCenterReport` LIVRE, sem
   *  colisão com nenhum módulo existente. */
  productsExitCostCenterReport: ModuleProductsExitCostCenterReport;
  /** Módulo "Requisição/Saída" (relatório de Estoque — F-312, execução
   *  97-Esteiras/078, TASK-F312-F01), chave TOP-LEVEL, mirror
   *  `productsExitCostCenterReport` MENOS o campo `center` — tela de filtro
   *  + 2 downloads (PDF/Excel) independentes, sem grid/prévia. Namespace
   *  `requisitionsReport` LIVRE, sem colisão com nenhum módulo existente. */
  requisitionsReport: ModuleRequisitionsReport;
  /** Módulo "Financiamentos" (relatório de Financeiro — F-265, execução
   *  97-Esteiras/078, TASK-F265-F01), chave TOP-LEVEL, mirror
   *  `productsExitCostCenterReport` — tela de filtro + 2 downloads
   *  (PDF/Excel) independentes, sem grid/prévia, SEM selects. Namespace
   *  `financingsReport` LIVRE, sem colisão com nenhum módulo existente. */
  financingsReport: ModuleFinancingsReport;
  /** Módulo "Descarte Romaneio" (relatório de Agricultura — F-256, execução
   *  97-Esteiras/078, TASK-F256-F01), chave TOP-LEVEL, mirror
   *  `productsExitCostCenterReport` — tela de filtro + 2 downloads
   *  (PDF/Excel) independentes, sem grid/prévia, 1 select opcional (Área).
   *  Namespace `discardsReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  discardsReport: ModuleDiscardsReport;
  /** Módulo "Estoque/Rebanho" (relatório de Pecuária — F-228, execução
   *  97-Esteiras/078, TASK-F228-F01), chave TOP-LEVEL, mirror
   *  `discardsReport` — tela de filtro + 1 download **PDF-ONLY** (sem Excel,
   *  fiel ao legado, FRONT-05), `species` MULTISELECT (não 1 `area` single).
   *  Namespace `animalsReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  animalsReport: ModuleAnimalsReport;
  /** Módulo "Orçamentos" (`request-quotation.report`, relatório de
   *  Suprimentos — F-311, execução 97-Esteiras/078, TASK-F311-F01), chave
   *  TOP-LEVEL, mirror `productsExitCostCenterReport` — tela de filtro + 2
   *  downloads (PDF/Excel) independentes, sem grid/prévia, 2 selects
   *  (Fornecedor/Fazenda) alimentados por UM fetch dedicado. Namespace
   *  `requestQuotationReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  requestQuotationReport: ModuleRequestQuotationReport;
  /** Módulo "Mortes" (relatório de Pecuária — F-254, 97-Esteiras/077,
   *  CONTRATOS/front/F-254-plano-front.md), chave TOP-LEVEL, mirror
   *  `stockAbcReport` — tela de filtro + download binário, SEM grid/prévia.
   *  Diferente do irmão de domínio `MortesSisbov`/F-253 (SÓ PDF, ambas as
   *  datas opcionais), aqui há `formatOptions` (PDF/Excel) e
   *  `start_date`/`end_date` são AMBAS OBRIGATÓRIAS (fidelidade ao legado
   *  C-005). Namespace `deathAnimalReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  deathAnimalReport: ModuleDeathAnimalReport;
  /** Módulo "Razão Categoria" (relatório Financeiro — F-273, execução 059,
   *  CONTRATO-F273-razao-categoria.md), chave TOP-LEVEL — tela de filtro +
   *  download binário PURO, SEM grid/prévia (mirror `FluxoCaixaMensal`).
   *  Namespace `ledgerCategoryReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  ledgerCategoryReport: ModuleLedgerCategoryReport;
  /** Módulo "Análise de Movimentação de Lote" (relatório de Pecuária —
   *  F-223, execução 059, CONTRATO-F223-analise-mov-lote.md), chave
   *  TOP-LEVEL, mirror `animalBatchHistoryReport` (F-221) — tela de filtro +
   *  download binário, SEM grid/prévia. Namespace
   *  `animalMovementAnalysisReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  animalMovementAnalysisReport: ModuleAnimalMovementAnalysisReport;
  /** Módulo "Depreciação Acumulada" (relatório de Bens/Ativo — F-216,
   *  execução 059, CONTRATO-F216-depreciacao-acumulada.md), chave
   *  TOP-LEVEL, mirror `equipmentInventoryReport` (Inventário) — tela de
   *  filtro + download binário, SEM grid/prévia. Namespace
   *  `accumulatedDepreciationReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  accumulatedDepreciationReport: ModuleAccumulatedDepreciationReport;
  /** Módulo "Previsão Colheita/Área" (relatório de Agricultura — F-282,
   *  execução 059, CONTRATO-F282-previsao-colheita-area.md), chave
   *  TOP-LEVEL, mirror `productionCostingAreaReport` — tela de filtro +
   *  download PDF-only, cascata IG-01/IG-02 100% client-side. Namespace
   *  `markingForecastHarvestAreaReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  markingForecastHarvestAreaReport: ModuleMarkingForecastHarvestAreaReport;
  /** Módulo "Agenda/Pagamentos" (relatório Financeiro — F-294, execução 059,
   *  CONTRATO-F294-agenda-pagamentos.md), chave TOP-LEVEL, mirror
   *  `receiptScheduleReport` (F-304) — tela de filtro + download binário
   *  (PDF inline/Excel), SEM grid/prévia. Namespace `paymentScheduleReport`
   *  LIVRE, sem colisão com nenhum módulo existente. */
  paymentScheduleReport: ModulePaymentScheduleReport;
  /** Módulo "Fluxo Mensal de Recebimento" (relatório Financeiro — F-303,
   *  execução 059, CONTRATO-F303-fluxo-mensal-recebimento.md), chave
   *  TOP-LEVEL, mirror `cashFlowByCategoryReport`/`receiptScheduleReport` —
   *  tela de filtro + download binário, SEM grid/prévia, SEM Referência UX
   *  própria (UX-GAP declarado no contrato). Namespace
   *  `receiptCashflowReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  receiptCashflowReport: ModuleReceiptCashflowReport;
  /** Módulo "Pesagem/Animal" (relatório de Pecuária — F-334, execução 059,
   *  CONTRATO-F334-pesagem-animal.md), chave TOP-LEVEL, mirror
   *  `accumulatedWeighingBatchReport` (Pesagem/Lote) — tela de filtro +
   *  download binário (PDF inline/Excel), SEM grid/prévia. Namespace
   *  `weighingBatchReport` LIVRE, sem colisão com nenhum módulo existente. */
  weighingBatchReport: ModuleWeighingBatchReport;
  /** Módulo "Pesagem/Armazém/Cliente" (relatório de Estoque — F-337,
   *  execução 059, CONTRATO-F337-pesagem-armazem-cliente.md), chave
   *  TOP-LEVEL, mirror `stockAbcReport` — tela de filtro + download
   *  binário, SEM grid/prévia, SEM filtro de período (só `format`).
   *  Namespace `weighingStockClientReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  weighingStockClientReport: ModuleWeighingStockClientReport;
  /** Módulo "Aplicação/Manejo Talhões" (relatório de Agricultura — F-220,
   *  execução 059, CONTRATO-F220-aplicacao-manejo-talhoes.md), chave
   *  TOP-LEVEL, fan-out por composição de 3 mirrors já homologados
   *  (`producaoCusteioArea`/`stockAbcReport`), SEM Referência UX 1:1
   *  (UX-GAP declarado no contrato). Namespace
   *  `agricultureApplicationManagementReport` LIVRE, sem colisão com nenhum
   *  módulo existente. */
  agricultureApplicationManagementReport: ModuleAgricultureApplicationManagementReport;
  /** Módulo "Contas Tributárias" (relatório de Financeiro — F-327, esteira
   *  060, ROTEIRO-F327-FRONT.md), chave TOP-LEVEL, mirror
   *  `weighingStockClientReport` — tela de filtro + download binário, SEM
   *  grid/prévia. Namespace `taxAccountsReport` LIVRE, sem colisão com
   *  nenhum módulo existente. */
  taxAccountsReport: ModuleTaxAccountsReport;
  /** Módulo "Ocorrências Talhões" (relatório de Agricultura — F-232,
   *  Tarefa 50, esteira CORE_WORKSPACE/97-Esteiras/015), chave TOP-LEVEL,
   *  mirror `accumulatedWeighingBatchReport` REDUZIDO a 4 campos — SEM
   *  `format`/branch Excel (a API só devolve `application/pdf`), SEM campo
   *  Fazenda (farm 100% via `X-Farm-Id`). Namespace
   *  `appropriationOccurrenceReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  appropriationOccurrenceReport: ModuleAppropriationOccurrenceReport;
  /** Módulo "Animais por Lote" (relatório pecuário — F-226, Tarefa 51,
   *  esteira CORE_WORKSPACE/97-Esteiras/015), chave TOP-LEVEL, mirror
   *  `accumulatedWeighingBatchReport` — endpoint/permissão próprios, sem
   *  grid/prévia, acrescido do enum estático `viewTypeOptions`
   *  (`individual`/`aggregated`, correção por construção do achado legado
   *  `C21`, cascata Lote→Animal). Namespace `animalsPerBatchReport` LIVRE,
   *  sem colisão com nenhum módulo existente. */
  animalsPerBatchReport: ModuleAnimalsPerBatchReport;
  /** Módulo "Identificação/SISBOV" (relatório de Pecuária — F-270,
   *  97-Esteiras/078, CONTRATOS/F-270-contrato-legado.md), chave TOP-LEVEL,
   *  mirror `birthAnimalSisbovReport` — tela de filtro + download PDF, SEM
   *  grid/prévia, SÓ PDF (sem seletor de formato). Diferente do irmão
   *  `birthAnimalSisbovReport`, `start_date`/`end_date` são AMBAS
   *  OBRIGATÓRIAS (fidelidade ao contrato F-270 — datas required). Namespace
   *  `identificationAnimalSisbovReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  identificationAnimalSisbovReport: ModuleIdentificationAnimalSisbovReport;
  /** Módulo "NFe/Emitidas" (relatório de Gestão Fiscal — F-287,
   *  97-Esteiras/079, TASK-F287-FE-01), chave TOP-LEVEL, mirror
   *  `nfeProductReport` — tela de filtro + download binário (PDF+Excel via
   *  campo `format` STRING PRÓPRIO 'pdf'|'xlsx', D-FE-02), SEM grid/prévia.
   *  Namespace `nfeReport` LIVRE, sem colisão com nenhum módulo existente. */
  nfeReport: ModuleNfeReport;
  /** Módulo "Composição Rebanho" (relatório de Pecuária — F-269, lote 079,
   *  F-269-plano-frontend.md §6 TASK-F269-FE-01), chave TOP-LEVEL, mirror
   *  `nutritionConsumptionReport` (par `options()`) + `deathAnimalReport`
   *  (campo `report_type` PDF/Excel) — tela de filtro (9 filtros opcionais)
   *  + seletor de 18 colunas (`ReportColumnsField`) + `order`/
   *  `order_direction`/`report_type` + download binário, SEM grid/prévia.
   *  Namespace `herdCompositionReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  herdCompositionReport: ModuleHerdCompositionReport;
  /** Módulo "Custo Total de Reprodução" (relatório de Pecuária — F-328,
   *  97-Esteiras/008, TASK-FE-CTR-01), chave TOP-LEVEL, mirror ESTRUTURAL do
   *  bloco `reproductiveHistoryReport` — tela de filtro + download binário
   *  (PDF+Excel via campo `format` único, `reportFormatOptions`
   *  compartilhado), SEM grid/prévia (a tabela é renderizada pelo Blade do
   *  servidor, `CL-15`), SEM cascata. Namespace
   *  `totalCostOfReproductionReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  totalCostOfReproductionReport: ModuleTotalCostOfReproductionReport;
  /** Módulo "Romaneio/Vendas/Contrato" (relatório de Agricultura — F-331,
   *  97-Esteiras/008, TASK-RVC-FE-01), chave TOP-LEVEL, mirror ESTRUTURAL do
   *  bloco `weighingHarvestReport` — tela de filtro + download binário
   *  (PDF+Excel via campo `format` único, `reportFormatOptions`
   *  compartilhado), SEM grid/prévia (as 9 colunas e os 4 totais são
   *  renderizados no servidor, dentro do PDF/XLSX), SEM cascata. Namespace
   *  `transferSalesContractReport` LIVRE, sem colisão com nenhum módulo
   *  existente. */
  transferSalesContractReport: ModuleTransferSalesContractReport;
  /** Código do país (BR, US, ES) */
  country: LanguageContextTypes;
}

export type LanguagesDate = Record<LanguageContextTypes, LanguageDate>;
