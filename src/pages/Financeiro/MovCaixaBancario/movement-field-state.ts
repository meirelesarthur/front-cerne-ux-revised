// src/pages/Financeiro/MovCaixaBancario/movement-field-state.ts
// -----------------------------------------------------------------------------
// UT-000796 (F-113 Mov. Caixa/Bancário) — máquina de estado PURA das
// dependências Tipo × Tp. Categoria × Cliente × Fornecedor × Conta destino ×
// Gera Obrigação (D-102-02/03/05/06/07/08). Sem React, sem i18n, sem UI.
//
// Consumida por `CreateOrUpdateMovimento.tsx` (tela principal) e por
// `NewMovementModal.tsx` (Conciliação OFX), para que ambos tenham o MESMO
// comportamento e enviem payload coerente com as validações 422 da API.
//
// Regra de ouro: a LIMPEZA de campos acontece só em handlers de ação do
// usuário (planOn*), NUNCA na hidratação da edição.
// -----------------------------------------------------------------------------

import type {
  MovementTypeCategoryCode,
  MovementTypeCode,
} from '@/constants/Financial/movement/movement-status';

import type { ListFinancialCategoryOptionsParams } from '@/services/v2/FinancialCategories/financial-category-service';

export type { MovementTypeCategoryCode, MovementTypeCode };

export interface MovementFieldStateInput {
  type: MovementTypeCode | null;
  typeCategory: MovementTypeCategoryCode | null;
  /** 'edit' + categoria ORIGINAL do registro (só para o readonly de T, D-102-06). */
  mode: 'create' | 'edit';
  originalTypeCategory?: MovementTypeCategoryCode | null;
}

export interface MovementFieldState {
  /** E/S dependem do Tipo; T/F nunca são desabilitadas. */
  typeCategoryDisabledOptions: Record<MovementTypeCategoryCode, boolean>;
  clientEnabled: boolean;
  providerEnabled: boolean;
  /** D-102-10: o "+" desabilita junto com o campo (permissão continua no componente). */
  clientAddButtonEnabled: boolean;
  providerAddButtonEnabled: boolean;
  destinationAccountVisible: boolean;
  destinationAccountRequired: boolean;
  /** Tipo=E -> Conta Origem; demais -> Conta Destino. */
  destinationAccountLabelKey: 'origin' | 'destination';
  /** Derivado: Tp. Categoria === 'F' (D-102-05). Readonly na UI. */
  generatesObligation: boolean;
  /** D-102-06: edição de uma Transferência (original T) trava Tipo e Tp. Categoria. */
  typeReadOnly: boolean;
  typeCategoryReadOnly: boolean;
}

type Party = 'client' | 'provider' | 'none';

function resolveParty(
  type: MovementTypeCode | null,
  typeCategory: MovementTypeCategoryCode | null
): Party {
  switch (typeCategory) {
    case 'E':
      return 'client';
    case 'S':
      return 'provider';
    case 'T':
      return 'none';
    case 'F':
      // Financiamento inverte a parte: Tipo E -> Fornecedor, Tipo S -> Cliente.
      if (type === 'E') return 'provider';
      if (type === 'S') return 'client';
      return 'none';
    default:
      // Tp. Categoria vazia: o Tipo governa (D-102-02). Ambos vazios -> nenhuma (P1).
      if (type === 'E') return 'client';
      if (type === 'S') return 'provider';
      return 'none';
  }
}

export function deriveMovementFieldState(input: MovementFieldStateInput): MovementFieldState {
  const { type, typeCategory, mode, originalTypeCategory } = input;
  const party = resolveParty(type, typeCategory);
  const clientEnabled = party === 'client';
  const providerEnabled = party === 'provider';
  const isTransfer = typeCategory === 'T';
  const lockedTransfer = mode === 'edit' && originalTypeCategory === 'T';

  return {
    typeCategoryDisabledOptions: {
      E: type !== 'E',
      S: type !== 'S',
      T: false,
      F: false,
    },
    clientEnabled,
    providerEnabled,
    clientAddButtonEnabled: clientEnabled,
    providerAddButtonEnabled: providerEnabled,
    destinationAccountVisible: isTransfer,
    destinationAccountRequired: isTransfer,
    destinationAccountLabelKey: type === 'E' ? 'origin' : 'destination',
    generatesObligation: typeCategory === 'F',
    typeReadOnly: lockedTransfer,
    typeCategoryReadOnly: lockedTransfer,
  };
}

/** Plano de limpeza executado por handlers de AÇÃO DO USUÁRIO (D-102-03/08). */
export interface FieldResetPlan {
  clearTypeCategory?: true;
  clearClient?: true;
  clearProvider?: true;
  clearDestination?: true;
  clearAllocationCategories?: true;
  setGeneratesObligation: boolean;
}

// Trocar o Tipo limpa tudo que depende dele, inclusive as categorias do rateio.
export function planOnTypeChange(): FieldResetPlan {
  return {
    clearTypeCategory: true,
    clearClient: true,
    clearProvider: true,
    clearDestination: true,
    clearAllocationCategories: true,
    setGeneratesObligation: false,
  };
}

// Trocar só a Tp. Categoria limpa o que ficou desabilitado/oculto. NÃO limpa
// as categorias do rateio (D-102-08: só o Tipo limpa).
export function planOnTypeCategoryChange(
  newType: MovementTypeCode | null,
  newTypeCategory: MovementTypeCategoryCode | null
): FieldResetPlan {
  const state = deriveMovementFieldState({
    type: newType,
    typeCategory: newTypeCategory,
    mode: 'create',
  });
  const plan: FieldResetPlan = { setGeneratesObligation: state.generatesObligation };
  if (!state.clientEnabled) plan.clearClient = true;
  if (!state.providerEnabled) plan.clearProvider = true;
  if (!state.destinationAccountVisible) plan.clearDestination = true;
  return plan;
}

// Filtro das categorias do rateio (D-102-07). `undefined` = sem filtro.
export function deriveAllocationCategoryParams(
  type: MovementTypeCode | null,
  typeCategory: MovementTypeCategoryCode | null
): Partial<ListFinancialCategoryOptionsParams> | undefined {
  // CategoryType: 1 = Saídas, 2 = Entradas (3 = "Ambas", incluído pela API
  // quando `cost_center_scoped` + `type_id`).
  switch (typeCategory) {
    case 'E':
      return { type_id: 2, cost_center_scoped: 'true' };
    case 'S':
      return { type_id: 1, cost_center_scoped: 'true' };
    case 'F':
      return { type_id: type === 'S' ? 1 : 2, cost_center_scoped: 'true' };
    case 'T':
      return { bank_movement_scoped: 'true', class: 2, is_enabled: 'true' };
    default:
      return undefined;
  }
}

// Filtro "Tipo Cat." do DRAWER da listagem (UT-000796 r2, L5). Regra do legado
// (`index.blade.php:288-352`): mapa fixo E:2, S:1, T:3, F:2 — F usa 2 SEMPRE
// (não depende do Tipo, ao contrário do rateio, por isso função separada de
// `deriveAllocationCategoryParams`). Só configura o lookup de Categoria; NÃO
// filtra linhas. `undefined` = sem Tipo Cat. (Categoria fica desabilitada).
export function deriveFilterCategoryParams(
  categoryType: MovementTypeCategoryCode | null | undefined
): Partial<ListFinancialCategoryOptionsParams> | undefined {
  switch (categoryType) {
    case 'E':
      return { type_id: 2, cost_center_scoped: 'true' };
    case 'S':
      return { type_id: 1, cost_center_scoped: 'true' };
    case 'F':
      return { type_id: 2, cost_center_scoped: 'true' };
    case 'T':
      return { bank_movement_scoped: 'true', class: 2, is_enabled: 'true' };
    default:
      return undefined;
  }
}

/** Aplica o plano de limpeza num `setValue`/`clearErrors` do RHF (ver chamadores). */
export interface FieldResetTargets {
  allocationCount: number;
}

export interface ResetOperation {
  name: string;
  value: null | boolean;
}

// Traduz o plano em operações `setValue` concretas (puro e testável).
export function resetPlanToOperations(
  plan: FieldResetPlan,
  targets: FieldResetTargets
): ResetOperation[] {
  const ops: ResetOperation[] = [];
  if (plan.clearTypeCategory) ops.push({ name: 'type_category', value: null });
  if (plan.clearClient) ops.push({ name: 'client_uuid', value: null });
  if (plan.clearProvider) ops.push({ name: 'provider_uuid', value: null });
  if (plan.clearDestination) ops.push({ name: 'destination_account_uuid', value: null });
  if (plan.clearAllocationCategories) {
    for (let i = 0; i < targets.allocationCount; i += 1) {
      ops.push({ name: `allocations.${i}.category_uuid`, value: null });
    }
  }
  ops.push({ name: 'generates_obligation', value: plan.setGeneratesObligation });
  return ops;
}

// Saneamento do payload pelo estado derivado: o que a tela desabilitou nunca
// vai ao servidor (D-102-03/05), coerente com as 422 da API.
export function sanitizeMovementParties<T extends { value: string } | null>(
  state: MovementFieldState,
  parties: { client: T; provider: T; destination: T }
): { client: T | null; provider: T | null; destination: T | null } {
  return {
    client: state.clientEnabled ? parties.client : null,
    provider: state.providerEnabled ? parties.provider : null,
    destination: state.destinationAccountVisible ? parties.destination : null,
  };
}
