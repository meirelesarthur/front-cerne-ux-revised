import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import type { ColumnDef, ColumnOrderState, VisibilityState } from '@tanstack/react-table';

const GRID_SETTINGS_VERSION = 1;
export const GRID_SETTINGS_VERSION_V2 = 2;
const DEFAULT_STORAGE_NAMESPACE = 'grid-settings';

export const MAX_GRID_PRESETS = 8;
export const GRID_PRESET_NAME_MAX_LENGTH = 50;
const GRID_PRESET_ID_FALLBACK_PREFIX = 'preset';

export interface GridColumnOption {
  id: string;
  label: string;
  hideable: boolean;
  orderPolicy: 'movable' | 'fixed-start' | 'fixed-end';
  dataColumn: boolean;
}

/** Envelope V1 (legado). Continua sendo LIDO para migração; nunca mais é escrito. */
export interface StoredGridSettings {
  version: typeof GRID_SETTINGS_VERSION;
  columnOrder: ColumnOrderState;
  columnVisibility: VisibilityState;
}

export interface ParsedGridSettings {
  settings: StoredGridSettings;
  canPersist: boolean;
}

// ---------------------------------------------------------------------------
// Envelope V2
// ---------------------------------------------------------------------------

/**
 * Layout é a unidade transportável da personalização: ordem explícita + partição
 * visível/oculto. Só IDs são persistidos — `label` é derivado do schema/tradução
 * em tempo de render e gravá-lo congelaria o idioma dentro do storage.
 */
export interface GridLayout {
  order: string[];
  visibleColumnIds: string[];
  hiddenColumnIds: string[];
}

export interface GridPreset {
  id: string;
  name: string;
  layout: GridLayout;
}

export interface StoredGridSettingsV2 {
  version: typeof GRID_SETTINGS_VERSION_V2;
  revision: number;
  appliedLayout: GridLayout;
  appliedPresetId: string | null;
  presets: GridPreset[];
}

/** De onde o estado da sessão veio — insumo de diagnóstico para a futura UI. */
export type GridSettingsSource = 'v2' | 'migrated-v1' | 'default' | 'future-version';

/**
 * `disabled` = sem escopo estável (não há onde gravar sem misturar usuários).
 * `read-only` = há dado de uma versão futura na chave; a sessão funciona, mas
 * nada é escrito por cima. `unavailable` = o browser recusou o localStorage.
 */
export type GridPersistenceStatus = 'idle' | 'persisted' | 'disabled' | 'read-only' | 'unavailable';

export interface ParsedGridSettingsV2 {
  settings: StoredGridSettingsV2;
  canPersist: boolean;
  source: GridSettingsSource;
}

/** Superfície mínima do storage — permite injetar um duplo nos testes puros. */
export interface GridSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type GridPresetIdFactory = (existingIds: readonly string[]) => string;

export type GridPresetError =
  'no-draft' | 'empty-name' | 'name-too-long' | 'duplicate-name' | 'limit-reached' | 'not-found';

/** Rascunho transacional: existe só em memória e nunca é persistido sozinho. */
export interface GridSettingsDraft {
  layout: GridLayout;
  presetId: string | null;
  presets: GridPreset[];
}

export interface GridSettingsState {
  applied: StoredGridSettingsV2;
  draft: GridSettingsDraft | null;
  canPersist: boolean;
  source: GridSettingsSource;
  sourceKey: string | null;
  persistence: GridPersistenceStatus;
}

export interface GridPresetMutation {
  state: GridSettingsState;
  error: GridPresetError | null;
}

interface UseGridSettingsProps<TData> {
  storageKey: string;
  /** Escopo estável (ex.: `user-42`). `null` desativa a persistência. */
  storageScope: string | null;
  storageNamespace?: string;
  columns: ColumnDef<TData, any>[];
  /** Injetável para tornar a geração de ID determinística em teste. */
  createPresetId?: GridPresetIdFactory;
}

interface UseGridSettingsResult {
  // --- API V1 (adapter temporário: é o que o Centro de Custo consome hoje) ---
  columnOptions: GridColumnOption[];
  columnOrder: ColumnOrderState;
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>;
  columnVisibility: VisibilityState;
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>;
  applyGridSettings: (columnOrder: ColumnOrderState, columnVisibility: VisibilityState) => void;
  resetGridSettings: () => void;
  isCustomized: boolean;

  // --- API V2 (para a futura UI; nenhuma tela consome ainda) ---
  revision: number;
  appliedLayout: GridLayout;
  activePresetId: string | null;
  presets: GridPreset[];
  persistenceStatus: GridPersistenceStatus;
  settingsSource: GridSettingsSource;
  canPersist: boolean;
  isDraftOpen: boolean;
  isDraftDirty: boolean;
  canCreatePreset: boolean;
  draftLayout: GridLayout | null;
  draftPresetId: string | null;
  draftPresets: GridPreset[] | null;
  previewColumnOrder: ColumnOrderState;
  previewColumnVisibility: VisibilityState;
  beginDraft: () => void;
  cancelDraft: () => void;
  applyDraft: () => void;
  setDraftColumnState: (columnOrder: ColumnOrderState, columnVisibility: VisibilityState) => void;
  resetDraft: () => void;
  selectPreset: (presetId: string | null) => GridPresetError | null;
  createPreset: (name: string) => GridPresetError | null;
  renamePreset: (presetId: string, name: string) => GridPresetError | null;
  deletePreset: (presetId: string) => GridPresetError | null;
  updatePresetFromDraft: (presetId: string) => GridPresetError | null;
}

function getColumnId<TData>(column: ColumnDef<TData, any>): string | null {
  if (typeof column.id === 'string' && column.id.length > 0) return column.id;

  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return column.accessorKey;
  }

  return null;
}

function getColumnOptions<TData>(columns: ColumnDef<TData, any>[]): GridColumnOption[] {
  return columns.flatMap((column) => {
    const id = getColumnId(column);
    if (!id) return [];

    const label =
      column.meta?.gridLabel ?? (typeof column.header === 'string' ? column.header : id);
    const hideable = column.enableHiding !== false;
    const orderPolicy = column.meta?.gridOrder ?? 'movable';
    const dataColumn = column.meta?.gridDataColumn !== false;

    return [{ id, label, hideable, orderPolicy, dataColumn }];
  });
}

// Ordem canônica da grid: âncoras primeiro, movíveis na ordem declarada pelo
// schema, âncoras de fim por último. É a mesma base usada por
// `reconcileGridSettings`, então o padrão e o reconciliado nunca divergem.
function buildAnchoredOrder(columns: GridColumnOption[]): ColumnOrderState {
  return [
    ...columns.filter((column) => column.orderPolicy === 'fixed-start').map((column) => column.id),
    ...columns.filter((column) => column.orderPolicy === 'movable').map((column) => column.id),
    ...columns.filter((column) => column.orderPolicy === 'fixed-end').map((column) => column.id),
  ];
}

export function createDefaultSettings(columns: GridColumnOption[]): StoredGridSettings {
  return {
    version: GRID_SETTINGS_VERSION,
    columnOrder: buildAnchoredOrder(columns),
    columnVisibility: Object.fromEntries(columns.map((column) => [column.id, true])),
  };
}

// `null` desliga a persistência (sem escopo estável não há onde gravar sem
// misturar preferências de usuários/fazendas); a grid segue funcional.
export function buildGridStorageKey(
  storageNamespace: string,
  storageScope: string | null,
  storageKey: string
): string | null {
  if (!storageScope) return null;

  return `${storageNamespace}:v${GRID_SETTINGS_VERSION}:${storageScope}:${storageKey}`;
}

/**
 * Chave do envelope V2 — separada da V1 e com o MESMO scoping funcional. As duas
 * coexistem: a V1 permanece intacta no disco depois da migração, de forma que
 * uma versão anterior do app continue lendo o que sempre leu.
 * @param {string} storageNamespace - Namespace base da chave (ex.: `grid-settings`).
 * @param {string | null} storageScope - Escopo estável (ex.: `user-42`); `null` desativa a persistência.
 * @param {string} storageKey - Identificador da grid dentro do escopo.
 * @return {string | null} Chave V2 pronta para o storage, ou `null` sem escopo.
 */
export function buildGridStorageKeyV2(
  storageNamespace: string,
  storageScope: string | null,
  storageKey: string
): string | null {
  if (!storageScope) return null;

  return `${storageNamespace}:v${GRID_SETTINGS_VERSION_V2}:${storageScope}:${storageKey}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isStoredGridSettings(value: unknown): value is StoredGridSettings {
  if (!isRecord(value) || value.version !== GRID_SETTINGS_VERSION) return false;
  if (
    !Array.isArray(value.columnOrder) ||
    !value.columnOrder.every((id) => typeof id === 'string')
  ) {
    return false;
  }
  if (!isRecord(value.columnVisibility)) return false;

  return Object.values(value.columnVisibility).every((visible) => typeof visible === 'boolean');
}

// Reconcilia configurações persistidas com o schema atual da grid: remove IDs
// extintos, inclui colunas novas, mantém ao menos uma coluna de dados visível e
// respeita as âncoras fixed-start/fixed-end sem confundi-las com visibilidade.
export function reconcileGridSettings(
  stored: Pick<StoredGridSettings, 'columnOrder' | 'columnVisibility'>,
  columns: GridColumnOption[]
): StoredGridSettings {
  const movableColumns = columns.filter((column) => column.orderPolicy === 'movable');
  const movableIds = new Set(movableColumns.map((column) => column.id));
  const validMovableOrder = stored.columnOrder.filter(
    (id, index, order) => movableIds.has(id) && order.indexOf(id) === index
  );
  const missingMovableIds = movableColumns
    .filter((column) => !validMovableOrder.includes(column.id))
    .map((column) => column.id);
  const columnOrder = [
    ...columns.filter((column) => column.orderPolicy === 'fixed-start').map((column) => column.id),
    ...validMovableOrder,
    ...missingMovableIds,
    ...columns.filter((column) => column.orderPolicy === 'fixed-end').map((column) => column.id),
  ];
  const columnVisibility: VisibilityState = Object.fromEntries(
    columns.map((column) => [
      column.id,
      column.hideable ? stored.columnVisibility[column.id] !== false : true,
    ])
  );

  const dataColumns = columns.filter((column) => column.dataColumn);
  const hasVisibleDataColumn = dataColumns.some((column) => columnVisibility[column.id] !== false);
  if (dataColumns.length > 0 && !hasVisibleDataColumn) {
    columnVisibility[dataColumns[0].id] = true;
  }

  return {
    version: GRID_SETTINGS_VERSION,
    columnOrder,
    columnVisibility,
  };
}

export function parseStoredGridSettings(
  rawSettings: string | null,
  columns: GridColumnOption[]
): ParsedGridSettings {
  const defaults = createDefaultSettings(columns);

  try {
    if (!rawSettings) return { settings: defaults, canPersist: true };

    const parsedSettings: unknown = JSON.parse(rawSettings);

    // Uma versão antiga do app não destrói dados gravados por um schema mais
    // novo, mesmo se uma chave for reutilizada por engano.
    if (
      isRecord(parsedSettings) &&
      typeof parsedSettings.version === 'number' &&
      parsedSettings.version > GRID_SETTINGS_VERSION
    ) {
      return { settings: defaults, canPersist: false };
    }

    if (!isStoredGridSettings(parsedSettings)) {
      return { settings: defaults, canPersist: true };
    }

    return {
      settings: reconcileGridSettings(parsedSettings, columns),
      canPersist: true,
    };
  } catch {
    return { settings: defaults, canPersist: true };
  }
}

// ---------------------------------------------------------------------------
// Layout: conversão, reconciliação e comparação
// ---------------------------------------------------------------------------

export function layoutFromColumnState(
  columnOrder: ColumnOrderState,
  columnVisibility: VisibilityState,
  columns: GridColumnOption[]
): GridLayout {
  const reconciled = reconcileGridSettings({ columnOrder, columnVisibility }, columns);

  return {
    order: [...reconciled.columnOrder],
    visibleColumnIds: reconciled.columnOrder.filter(
      (id) => reconciled.columnVisibility[id] !== false
    ),
    hiddenColumnIds: reconciled.columnOrder.filter(
      (id) => reconciled.columnVisibility[id] === false
    ),
  };
}

function visibilityFromLayout(layout: GridLayout): VisibilityState {
  const visibility: VisibilityState = {};
  layout.visibleColumnIds.forEach((id) => {
    visibility[id] = true;
  });
  // `hidden` por último: se um ID aparecer dos dois lados de um envelope
  // adulterado, ocultar é a leitura conservadora — a reconciliação ainda
  // garante que colunas não ocultáveis voltem a ficar visíveis.
  layout.hiddenColumnIds.forEach((id) => {
    visibility[id] = false;
  });

  return visibility;
}

export function layoutToColumnState(
  layout: GridLayout,
  columns: GridColumnOption[]
): Pick<StoredGridSettings, 'columnOrder' | 'columnVisibility'> {
  const reconciled = reconcileGridSettings(
    { columnOrder: layout.order, columnVisibility: visibilityFromLayout(layout) },
    columns
  );

  return {
    columnOrder: reconciled.columnOrder,
    columnVisibility: reconciled.columnVisibility,
  };
}

export function reconcileGridLayout(layout: GridLayout, columns: GridColumnOption[]): GridLayout {
  return layoutFromColumnState(layout.order, visibilityFromLayout(layout), columns);
}

export function createDefaultLayout(columns: GridColumnOption[]): GridLayout {
  const defaults = createDefaultSettings(columns);

  return layoutFromColumnState(defaults.columnOrder, defaults.columnVisibility, columns);
}

export function layoutsEqual(a: GridLayout, b: GridLayout): boolean {
  return (
    a.order.join('|') === b.order.join('|') &&
    a.visibleColumnIds.join('|') === b.visibleColumnIds.join('|') &&
    a.hiddenColumnIds.join('|') === b.hiddenColumnIds.join('|')
  );
}

// ---------------------------------------------------------------------------
// Presets: nome, ID e validação
// ---------------------------------------------------------------------------

export function normalizePresetName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validatePresetName(
  name: string,
  presets: readonly GridPreset[],
  ignorePresetId?: string
): { ok: true; name: string } | { ok: false; error: GridPresetError } {
  const normalized = normalizePresetName(name);

  if (normalized.length === 0) return { ok: false, error: 'empty-name' };
  if (normalized.length > GRID_PRESET_NAME_MAX_LENGTH) return { ok: false, error: 'name-too-long' };

  const taken = presets.some(
    (preset) =>
      preset.id !== ignorePresetId &&
      preset.name.toLocaleLowerCase() === normalized.toLocaleLowerCase()
  );
  if (taken) return { ok: false, error: 'duplicate-name' };

  return { ok: true, name: normalized };
}

/**
 * Fallback determinístico: primeiro `preset-N` livre. Sem random, sem relógio.
 * @param {string[]} existingIds - IDs já usados, para evitar colisão.
 * @return {string} Próximo ID `preset-N` livre.
 */
export function createDeterministicPresetId(existingIds: readonly string[] = []): string {
  const taken = new Set(existingIds);
  let index = 1;
  while (taken.has(`${GRID_PRESET_ID_FALLBACK_PREFIX}-${index}`)) index += 1;

  return `${GRID_PRESET_ID_FALLBACK_PREFIX}-${index}`;
}

export const createGridPresetId: GridPresetIdFactory = (existingIds = []) => {
  try {
    const cryptoRef: Crypto | undefined =
      typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

    if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
      const id = cryptoRef.randomUUID();
      if (id && !existingIds.includes(id)) return id;
    }
  } catch {
    // Ambientes sem `crypto` (ou com acesso bloqueado) caem no determinístico.
  }

  return createDeterministicPresetId(existingIds);
};

// ---------------------------------------------------------------------------
// Envelope V2: validação, reconciliação e parse
// ---------------------------------------------------------------------------

function isGridLayout(value: unknown): value is GridLayout {
  return (
    isRecord(value) &&
    isStringArray(value.order) &&
    isStringArray(value.visibleColumnIds) &&
    isStringArray(value.hiddenColumnIds)
  );
}

function isGridPreset(value: unknown): value is GridPreset {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    isGridLayout(value.layout)
  );
}

export function isStoredGridSettingsV2(value: unknown): value is StoredGridSettingsV2 {
  if (!isRecord(value) || value.version !== GRID_SETTINGS_VERSION_V2) return false;
  if (typeof value.revision !== 'number' || !Number.isFinite(value.revision)) return false;
  if (!isGridLayout(value.appliedLayout)) return false;
  if (!(value.appliedPresetId === null || typeof value.appliedPresetId === 'string')) return false;
  if (!Array.isArray(value.presets) || !value.presets.every(isGridPreset)) return false;

  return true;
}

/**
 * Toda entrada (disco ou sessão) passa por aqui: nomes normalizados, IDs e nomes
 * únicos, teto de presets aplicado, layouts reconciliados contra o schema atual
 * e `appliedPresetId` só sobrevive se apontar para um preset existente.
 * @param {StoredGridSettingsV2} envelope - Envelope V2 candidato (disco ou sessão).
 * @param {GridColumnOption[]} columns - Schema atual da grid.
 * @return {StoredGridSettingsV2} Envelope V2 reconciliado contra o schema atual.
 */
export function reconcileStoredGridSettingsV2(
  envelope: StoredGridSettingsV2,
  columns: GridColumnOption[]
): StoredGridSettingsV2 {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const presets: GridPreset[] = [];

  envelope.presets.forEach((preset) => {
    if (presets.length >= MAX_GRID_PRESETS) return;
    if (seenIds.has(preset.id)) return;

    const name = normalizePresetName(preset.name);
    if (name.length === 0 || name.length > GRID_PRESET_NAME_MAX_LENGTH) return;

    const nameKey = name.toLocaleLowerCase();
    if (seenNames.has(nameKey)) return;

    seenIds.add(preset.id);
    seenNames.add(nameKey);
    presets.push({ id: preset.id, name, layout: reconcileGridLayout(preset.layout, columns) });
  });

  const appliedPresetId =
    envelope.appliedPresetId && seenIds.has(envelope.appliedPresetId)
      ? envelope.appliedPresetId
      : null;

  return {
    version: GRID_SETTINGS_VERSION_V2,
    revision: Math.max(0, Math.trunc(envelope.revision)),
    appliedLayout: reconcileGridLayout(envelope.appliedLayout, columns),
    appliedPresetId,
    presets,
  };
}

export function createDefaultStoredSettingsV2(columns: GridColumnOption[]): StoredGridSettingsV2 {
  return {
    version: GRID_SETTINGS_VERSION_V2,
    revision: 0,
    appliedLayout: createDefaultLayout(columns),
    appliedPresetId: null,
    presets: [],
  };
}

export function migrateV1ToV2(
  stored: Pick<StoredGridSettings, 'columnOrder' | 'columnVisibility'>,
  columns: GridColumnOption[]
): StoredGridSettingsV2 {
  return {
    version: GRID_SETTINGS_VERSION_V2,
    revision: 0,
    appliedLayout: layoutFromColumnState(stored.columnOrder, stored.columnVisibility, columns),
    appliedPresetId: null,
    presets: [],
  };
}

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Precedência de leitura: V2 válida → migração da V1 válida → default seguro.
 * Uma `version` maior que a nossa devolve default NÃO persistível, de modo que
 * nenhuma operação da sessão consiga escrever por cima do dado futuro.
 *
 * A chave V1 é só ENTRADA: não é apagada, sobrescrita nem regravada — por isso
 * uma V1 de versão futura não bloqueia a persistência da V2 (chaves distintas).
 * @param {string | null} rawV2 - Conteúdo cru da chave V2.
 * @param {string | null} rawV1 - Conteúdo cru da chave V1 (legado), usado só para migração.
 * @param {GridColumnOption[]} columns - Schema atual da grid.
 * @return {ParsedGridSettingsV2} Envelope V2 resolvido, com origem e persistibilidade.
 */
export function parseStoredGridSettingsV2(
  rawV2: string | null,
  rawV1: string | null,
  columns: GridColumnOption[]
): ParsedGridSettingsV2 {
  const defaults = createDefaultStoredSettingsV2(columns);
  const parsedV2 = safeJsonParse(rawV2);

  if (
    isRecord(parsedV2) &&
    typeof parsedV2.version === 'number' &&
    parsedV2.version > GRID_SETTINGS_VERSION_V2
  ) {
    return { settings: defaults, canPersist: false, source: 'future-version' };
  }

  if (isStoredGridSettingsV2(parsedV2)) {
    return {
      settings: reconcileStoredGridSettingsV2(parsedV2, columns),
      canPersist: true,
      source: 'v2',
    };
  }

  const parsedV1 = safeJsonParse(rawV1);
  if (isStoredGridSettings(parsedV1)) {
    return { settings: migrateV1ToV2(parsedV1, columns), canPersist: true, source: 'migrated-v1' };
  }

  return { settings: defaults, canPersist: true, source: 'default' };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function readGridSettingsV2(
  storage: GridSettingsStorage | null,
  keys: { v1: string | null; v2: string | null },
  columns: GridColumnOption[]
): ParsedGridSettingsV2 {
  const unavailable: ParsedGridSettingsV2 = {
    settings: createDefaultStoredSettingsV2(columns),
    canPersist: false,
    source: 'default',
  };

  if (!storage || !keys.v2) return unavailable;

  try {
    return parseStoredGridSettingsV2(
      storage.getItem(keys.v2),
      keys.v1 ? storage.getItem(keys.v1) : null,
      columns
    );
  } catch {
    return unavailable;
  }
}

/**
 * Uma escrita, uma chave, sem efeito colateral: falha do browser devolve
 * `unavailable` em vez de lançar, então o estado da sessão permanece intacto.
 * @param {GridSettingsStorage | null} storage - Storage injetável (permite duplo em teste).
 * @param {string} storageKey - Chave V2 onde o envelope será gravado.
 * @param {StoredGridSettingsV2} envelope - Envelope V2 a persistir.
 * @return {GridPersistenceStatus} `persisted` ou `unavailable`, conforme o resultado da escrita.
 */
export function persistGridSettingsV2(
  storage: GridSettingsStorage | null,
  storageKey: string,
  envelope: StoredGridSettingsV2
): GridPersistenceStatus {
  if (!storage) return 'unavailable';

  try {
    storage.setItem(storageKey, JSON.stringify(envelope));
    return 'persisted';
  } catch {
    return 'unavailable';
  }
}

function getBrowserStorage(): GridSettingsStorage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Máquina de estados transacional (pura — nada aqui toca o storage)
// ---------------------------------------------------------------------------

function initialPersistenceStatus(
  parsed: ParsedGridSettingsV2,
  sourceKey: string | null
): GridPersistenceStatus {
  if (!sourceKey) return 'disabled';
  if (parsed.canPersist) return 'idle';

  return parsed.source === 'future-version' ? 'read-only' : 'unavailable';
}

export function createGridSettingsState(
  parsed: ParsedGridSettingsV2,
  sourceKey: string | null
): GridSettingsState {
  return {
    applied: parsed.settings,
    draft: null,
    canPersist: parsed.canPersist,
    source: parsed.source,
    sourceKey,
    persistence: initialPersistenceStatus(parsed, sourceKey),
  };
}

export function resolveActivePresetId(applied: StoredGridSettingsV2): string | null {
  const preset = applied.presets.find((item) => item.id === applied.appliedPresetId);
  if (!preset) return null;

  return layoutsEqual(preset.layout, applied.appliedLayout) ? preset.id : null;
}

function draftFromApplied(applied: StoredGridSettingsV2): GridSettingsDraft {
  return {
    layout: applied.appliedLayout,
    presetId: resolveActivePresetId(applied),
    presets: applied.presets,
  };
}

export function beginGridDraft(state: GridSettingsState): GridSettingsState {
  if (state.draft) return state;

  return { ...state, draft: draftFromApplied(state.applied) };
}

/**
 * Cancelar é o caminho barato justamente porque preview nunca tocou `applied`:
 * descartar o rascunho já restaura exatamente o estado aplicado anterior.
 * @param {GridSettingsState} state - Estado atual (com ou sem rascunho aberto).
 * @return {GridSettingsState} Estado com o rascunho descartado.
 */
export function cancelGridDraft(state: GridSettingsState): GridSettingsState {
  if (!state.draft) return state;

  return { ...state, draft: null };
}

export function isGridDraftDirty(state: GridSettingsState): boolean {
  if (!state.draft) return false;

  const { draft, applied } = state;
  if (!layoutsEqual(draft.layout, applied.appliedLayout)) return true;
  if (draft.presetId !== resolveActivePresetId(applied)) return true;
  if (draft.presets.length !== applied.presets.length) return true;

  return draft.presets.some((preset, index) => {
    const current = applied.presets[index];
    return (
      !current ||
      current.id !== preset.id ||
      current.name !== preset.name ||
      !layoutsEqual(current.layout, preset.layout)
    );
  });
}

/**
 * Única transição que muda `applied` a partir do rascunho — e ela troca a
 * referência de `applied` UMA vez, bumpando `revision` UMA vez. O efeito de
 * persistência observa exatamente essa referência, então apply ⇒ uma escrita.
 * @param {GridSettingsState} state - Estado atual, com rascunho a promover.
 * @param {GridColumnOption[]} columns - Schema atual da grid.
 * @return {GridSettingsState} Estado com o rascunho promovido a aplicado.
 */
export function applyGridDraft(
  state: GridSettingsState,
  columns: GridColumnOption[]
): GridSettingsState {
  if (!state.draft) return state;

  const applied = reconcileStoredGridSettingsV2(
    {
      version: GRID_SETTINGS_VERSION_V2,
      revision: state.applied.revision + 1,
      appliedLayout: state.draft.layout,
      appliedPresetId: state.draft.presetId,
      presets: state.draft.presets,
    },
    columns
  );

  return {
    ...state,
    applied: { ...applied, appliedPresetId: resolveActivePresetId(applied) },
    draft: null,
  };
}

/**
 * Escrita imediata em `applied` — usada só pelo adapter V1 (grid ao vivo).
 * @param {GridSettingsState} state - Estado atual.
 * @param {GridLayout} layout - Layout a aplicar imediatamente.
 * @param {GridColumnOption[]} columns - Schema atual da grid.
 * @return {GridSettingsState} Estado com o novo layout aplicado.
 */
export function commitGridLayout(
  state: GridSettingsState,
  layout: GridLayout,
  columns: GridColumnOption[]
): GridSettingsState {
  const applied = reconcileStoredGridSettingsV2(
    {
      version: GRID_SETTINGS_VERSION_V2,
      revision: state.applied.revision + 1,
      appliedLayout: layout,
      appliedPresetId: state.applied.appliedPresetId,
      presets: state.applied.presets,
    },
    columns
  );

  return { ...state, applied: { ...applied, appliedPresetId: resolveActivePresetId(applied) } };
}

function withDraft(state: GridSettingsState, draft: GridSettingsDraft): GridSettingsState {
  return { ...state, draft };
}

export function setGridDraftLayout(
  state: GridSettingsState,
  layout: GridLayout,
  columns: GridColumnOption[]
): GridSettingsState {
  if (!state.draft) return state;

  const nextLayout = reconcileGridLayout(layout, columns);
  const matchedPreset = state.draft.presets.find((preset) =>
    layoutsEqual(preset.layout, nextLayout)
  );

  return withDraft(state, {
    ...state.draft,
    layout: nextLayout,
    presetId: matchedPreset ? matchedPreset.id : null,
  });
}

/**
 * Reset é operação de rascunho: volta ao layout padrão e NÃO apaga presets.
 * @param {GridSettingsState} state - Estado atual, com rascunho aberto.
 * @param {GridColumnOption[]} columns - Schema atual da grid.
 * @return {GridSettingsState} Estado com o rascunho revertido ao layout padrão.
 */
export function resetGridDraftLayout(
  state: GridSettingsState,
  columns: GridColumnOption[]
): GridSettingsState {
  if (!state.draft) return state;

  return withDraft(state, {
    ...state.draft,
    layout: createDefaultLayout(columns),
    presetId: null,
  });
}

export function selectGridDraftPreset(
  state: GridSettingsState,
  presetId: string | null,
  columns: GridColumnOption[]
): GridPresetMutation {
  if (!state.draft) return { state, error: 'no-draft' };

  if (presetId === null) {
    return { state: withDraft(state, { ...state.draft, presetId: null }), error: null };
  }

  const preset = state.draft.presets.find((item) => item.id === presetId);
  if (!preset) return { state, error: 'not-found' };

  return {
    state: withDraft(state, {
      ...state.draft,
      layout: reconcileGridLayout(preset.layout, columns),
      presetId: preset.id,
    }),
    error: null,
  };
}

export function createGridDraftPreset(
  state: GridSettingsState,
  name: string,
  createPresetId: GridPresetIdFactory = createGridPresetId
): GridPresetMutation {
  if (!state.draft) return { state, error: 'no-draft' };
  if (state.draft.presets.length >= MAX_GRID_PRESETS) return { state, error: 'limit-reached' };

  const validation = validatePresetName(name, state.draft.presets);
  if (!validation.ok) return { state, error: validation.error };

  const id = createPresetId(state.draft.presets.map((preset) => preset.id));
  const preset: GridPreset = { id, name: validation.name, layout: state.draft.layout };

  return {
    state: withDraft(state, {
      ...state.draft,
      presets: [...state.draft.presets, preset],
      presetId: id,
    }),
    error: null,
  };
}

export function renameGridDraftPreset(
  state: GridSettingsState,
  presetId: string,
  name: string
): GridPresetMutation {
  if (!state.draft) return { state, error: 'no-draft' };
  if (!state.draft.presets.some((preset) => preset.id === presetId)) {
    return { state, error: 'not-found' };
  }

  const validation = validatePresetName(name, state.draft.presets, presetId);
  if (!validation.ok) return { state, error: validation.error };

  return {
    state: withDraft(state, {
      ...state.draft,
      presets: state.draft.presets.map((preset) =>
        preset.id === presetId ? { ...preset, name: validation.name } : preset
      ),
    }),
    error: null,
  };
}

export function deleteGridDraftPreset(
  state: GridSettingsState,
  presetId: string
): GridPresetMutation {
  if (!state.draft) return { state, error: 'no-draft' };
  if (!state.draft.presets.some((preset) => preset.id === presetId)) {
    return { state, error: 'not-found' };
  }

  return {
    state: withDraft(state, {
      ...state.draft,
      presets: state.draft.presets.filter((preset) => preset.id !== presetId),
      presetId: state.draft.presetId === presetId ? null : state.draft.presetId,
    }),
    error: null,
  };
}

/**
 * Sobrescreve o layout do preset com o layout corrente do rascunho.
 * @param {GridSettingsState} state - Estado atual, com rascunho aberto.
 * @param {string} presetId - ID do preset a atualizar.
 * @return {GridPresetMutation} Estado resultante e erro, se houver.
 */
export function updateGridDraftPresetFromLayout(
  state: GridSettingsState,
  presetId: string
): GridPresetMutation {
  if (!state.draft) return { state, error: 'no-draft' };
  if (!state.draft.presets.some((preset) => preset.id === presetId)) {
    return { state, error: 'not-found' };
  }

  const layout = state.draft.layout;

  return {
    state: withDraft(state, {
      ...state.draft,
      presets: state.draft.presets.map((preset) =>
        preset.id === presetId ? { ...preset, layout } : preset
      ),
      presetId,
    }),
    error: null,
  };
}

/**
 * Reaplica o schema atual sobre `applied` e sobre o rascunho aberto. Devolve o
 * MESMO estado quando nada muda: a identidade de `applied` é o que dispara a
 * escrita, então reconciliar um schema inalterado não pode gerar tráfego novo.
 * @param {GridSettingsState} state - Estado atual.
 * @param {GridColumnOption[]} columns - Schema atual da grid.
 * @return {GridSettingsState} Estado reconciliado (mesma referência se nada mudou).
 */
export function reconcileGridSettingsState(
  state: GridSettingsState,
  columns: GridColumnOption[]
): GridSettingsState {
  const applied = reconcileStoredGridSettingsV2(state.applied, columns);
  const draft = state.draft
    ? {
        layout: reconcileGridLayout(state.draft.layout, columns),
        presetId: state.draft.presetId,
        presets: state.draft.presets.map((preset) => ({
          ...preset,
          layout: reconcileGridLayout(preset.layout, columns),
        })),
      }
    : null;

  const unchanged =
    JSON.stringify(applied) === JSON.stringify(state.applied) &&
    JSON.stringify(draft) === JSON.stringify(state.draft ?? null);

  return unchanged ? state : { ...state, applied, draft };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGridSettings<TData>({
  storageKey,
  storageScope,
  storageNamespace = DEFAULT_STORAGE_NAMESPACE,
  columns,
  createPresetId = createGridPresetId,
}: UseGridSettingsProps<TData>): UseGridSettingsResult {
  // A identidade de `columns` muda a cada render da tela (o array é remontado
  // por `useMemo` com deps voláteis). Memoizar pela assinatura do schema — e
  // não pela referência — evita re-disparar os effects abaixo e descartar o
  // rascunho do diálogo aberto. O `label` entra na assinatura para que troca
  // de idioma continue propagando.
  const rawOptions = getColumnOptions(columns);
  const schemaSignature = rawOptions
    .map(
      (column) =>
        `${column.id}:${column.label}:${column.hideable ? 'h' : 'v'}:${column.orderPolicy}:${column.dataColumn ? 'd' : 't'}`
    )
    .join('|');
  const columnOptions = useMemo(() => rawOptions, [schemaSignature]);
  const legacyStorageKey = buildGridStorageKey(storageNamespace, storageScope, storageKey);
  const fullStorageKey = buildGridStorageKeyV2(storageNamespace, storageScope, storageKey);
  const defaults = useMemo(() => createDefaultSettings(columnOptions), [schemaSignature]);
  const defaultLayout = useMemo(() => createDefaultLayout(columnOptions), [schemaSignature]);

  const [state, setState] = useState<GridSettingsState>(() =>
    createGridSettingsState(
      readGridSettingsV2(
        getBrowserStorage(),
        { v1: legacyStorageKey, v2: fullStorageKey },
        columnOptions
      ),
      fullStorageKey
    )
  );

  // Recarrega somente quando o escopo muda; uma mudança de schema no mesmo
  // escopo é reconciliada sem apagar preferências já vivas na sessão nem
  // descartar o rascunho aberto.
  useEffect(() => {
    setState((current) => {
      if (current.sourceKey === fullStorageKey) {
        return reconcileGridSettingsState(current, columnOptions);
      }

      return createGridSettingsState(
        readGridSettingsV2(
          getBrowserStorage(),
          { v1: legacyStorageKey, v2: fullStorageKey },
          columnOptions
        ),
        fullStorageKey
      );
    });
  }, [fullStorageKey, schemaSignature]);

  // Espelho síncrono do estado: a mutação de preset precisa devolver o erro na
  // hora (a futura UI depende disso) e duas chamadas no mesmo tick têm de ver a
  // anterior — o updater funcional do React só rodaria na renderização seguinte.
  const stateRef = useRef(state);
  stateRef.current = state;

  const applied = state.applied;
  const isActiveKey = state.sourceKey === fullStorageKey;
  const canPersist = state.canPersist;

  // Depende da REFERÊNCIA de `applied`: preview/rascunho não a trocam, então
  // preview nunca escreve e um apply produz exatamente uma escrita. Escrever
  // só na chave V2 mantém a V1 intacta no disco.
  useEffect(() => {
    if (!fullStorageKey || !isActiveKey || !canPersist) return;

    const status = persistGridSettingsV2(getBrowserStorage(), fullStorageKey, applied);
    // Sem `persistence` nas deps: atualizar o status não re-dispara o efeito,
    // então uma falha de storage não vira laço de escrita.
    setState((current) =>
      current.persistence === status ? current : { ...current, persistence: status }
    );
  }, [applied, fullStorageKey, isActiveKey, canPersist]);

  const fallbackApplied = useMemo(
    () => createDefaultStoredSettingsV2(columnOptions),
    [schemaSignature]
  );
  const activeApplied = isActiveKey ? applied : fallbackApplied;
  const activeColumnState = useMemo(
    () => layoutToColumnState(activeApplied.appliedLayout, columnOptions),
    [activeApplied.appliedLayout, schemaSignature]
  );
  const draft = isActiveKey ? state.draft : null;
  const previewColumnState = useMemo(
    () => (draft ? layoutToColumnState(draft.layout, columnOptions) : activeColumnState),
    [draft?.layout, activeColumnState, schemaSignature]
  );

  const commitState = (next: GridSettingsState) => {
    if (next === stateRef.current) return;

    stateRef.current = next;
    setState(next);
  };

  const mutate = (mutation: (current: GridSettingsState) => GridSettingsState) => {
    const current = stateRef.current;
    if (current.sourceKey !== fullStorageKey) return;

    commitState(mutation(current));
  };

  const runPresetMutation = (
    mutation: (current: GridSettingsState) => GridPresetMutation
  ): GridPresetError | null => {
    const current = stateRef.current;
    if (current.sourceKey !== fullStorageKey) return 'no-draft';

    const result = mutation(current);
    commitState(result.state);

    return result.error;
  };

  // --- adapter V1 (imediato, como o Centro de Custo espera hoje) ---
  const setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>> = (update) => {
    mutate((current) => {
      const base = layoutToColumnState(current.applied.appliedLayout, columnOptions);
      const nextOrder = typeof update === 'function' ? update(base.columnOrder) : update;

      return commitGridLayout(
        current,
        layoutFromColumnState(nextOrder, base.columnVisibility, columnOptions),
        columnOptions
      );
    });
  };

  const setColumnVisibility: Dispatch<SetStateAction<VisibilityState>> = (update) => {
    mutate((current) => {
      const base = layoutToColumnState(current.applied.appliedLayout, columnOptions);
      const nextVisibility = typeof update === 'function' ? update(base.columnVisibility) : update;

      return commitGridLayout(
        current,
        layoutFromColumnState(base.columnOrder, nextVisibility, columnOptions),
        columnOptions
      );
    });
  };

  const applyGridSettings = (columnOrder: ColumnOrderState, columnVisibility: VisibilityState) => {
    mutate((current) =>
      commitGridLayout(
        current,
        layoutFromColumnState(columnOrder, columnVisibility, columnOptions),
        columnOptions
      )
    );
  };

  const resetGridSettings = () => {
    mutate((current) => commitGridLayout(current, defaultLayout, columnOptions));
  };

  const isCustomized =
    activeColumnState.columnOrder.join('|') !== defaults.columnOrder.join('|') ||
    columnOptions.some(
      (column) => column.hideable && activeColumnState.columnVisibility[column.id] === false
    );

  return {
    columnOptions,
    columnOrder: activeColumnState.columnOrder,
    setColumnOrder,
    columnVisibility: activeColumnState.columnVisibility,
    setColumnVisibility,
    applyGridSettings,
    resetGridSettings,
    isCustomized,

    revision: activeApplied.revision,
    appliedLayout: activeApplied.appliedLayout,
    activePresetId: resolveActivePresetId(activeApplied),
    presets: activeApplied.presets,
    persistenceStatus: isActiveKey ? state.persistence : 'disabled',
    settingsSource: state.source,
    canPersist: Boolean(fullStorageKey) && isActiveKey && canPersist,
    isDraftOpen: draft !== null,
    isDraftDirty: isActiveKey && isGridDraftDirty(state),
    canCreatePreset: draft !== null && draft.presets.length < MAX_GRID_PRESETS,
    draftLayout: draft?.layout ?? null,
    draftPresetId: draft?.presetId ?? null,
    draftPresets: draft?.presets ?? null,
    previewColumnOrder: previewColumnState.columnOrder,
    previewColumnVisibility: previewColumnState.columnVisibility,
    beginDraft: () => mutate(beginGridDraft),
    cancelDraft: () => mutate(cancelGridDraft),
    applyDraft: () => mutate((current) => applyGridDraft(current, columnOptions)),
    setDraftColumnState: (columnOrder, columnVisibility) =>
      mutate((current) =>
        setGridDraftLayout(
          current,
          layoutFromColumnState(columnOrder, columnVisibility, columnOptions),
          columnOptions
        )
      ),
    resetDraft: () => mutate((current) => resetGridDraftLayout(current, columnOptions)),
    selectPreset: (presetId) =>
      runPresetMutation((current) => selectGridDraftPreset(current, presetId, columnOptions)),
    createPreset: (name) =>
      runPresetMutation((current) => createGridDraftPreset(current, name, createPresetId)),
    renamePreset: (presetId, name) =>
      runPresetMutation((current) => renameGridDraftPreset(current, presetId, name)),
    deletePreset: (presetId) =>
      runPresetMutation((current) => deleteGridDraftPreset(current, presetId)),
    updatePresetFromDraft: (presetId) =>
      runPresetMutation((current) => updateGridDraftPresetFromLayout(current, presetId)),
  };
}
