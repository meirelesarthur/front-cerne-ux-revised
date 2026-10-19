import { describe, expect, it } from 'vitest';

import {
  applyGridDraft,
  beginGridDraft,
  buildGridStorageKey,
  buildGridStorageKeyV2,
  cancelGridDraft,
  commitGridLayout,
  createDefaultLayout,
  createDefaultSettings,
  createDefaultStoredSettingsV2,
  createDeterministicPresetId,
  createGridDraftPreset,
  createGridPresetId,
  createGridSettingsState,
  deleteGridDraftPreset,
  GridColumnOption,
  GridLayout,
  GridPresetIdFactory,
  GridSettingsState,
  GridSettingsStorage,
  layoutFromColumnState,
  layoutToColumnState,
  MAX_GRID_PRESETS,
  migrateV1ToV2,
  normalizePresetName,
  parseStoredGridSettings,
  parseStoredGridSettingsV2,
  persistGridSettingsV2,
  readGridSettingsV2,
  reconcileGridSettings,
  reconcileStoredGridSettingsV2,
  renameGridDraftPreset,
  resetGridDraftLayout,
  resolveActivePresetId,
  selectGridDraftPreset,
  setGridDraftLayout,
  StoredGridSettingsV2,
  updateGridDraftPresetFromLayout,
  validatePresetName,
} from './useGridSettings';

const columns: GridColumnOption[] = [
  {
    id: 'code',
    label: 'Código',
    hideable: true,
    orderPolicy: 'movable',
    dataColumn: true,
  },
  {
    id: 'description',
    label: 'Descrição',
    hideable: false,
    orderPolicy: 'movable',
    dataColumn: true,
  },
  {
    id: 'acoes',
    label: 'Ações',
    hideable: false,
    orderPolicy: 'fixed-end',
    dataColumn: false,
  },
];

describe('createDefaultSettings', () => {
  it('ancora fixed-start no início mesmo quando o schema o declara no meio', () => {
    const unorderedColumns: GridColumnOption[] = [
      columns[0],
      {
        id: 'selecao',
        label: 'Seleção',
        hideable: false,
        orderPolicy: 'fixed-start',
        dataColumn: false,
      },
      columns[1],
      columns[2],
    ];

    const defaults = createDefaultSettings(unorderedColumns);

    expect(defaults.columnOrder).toEqual(['selecao', 'code', 'description', 'acoes']);
  });

  it('marca todas as colunas como visíveis, inclusive as não ocultáveis', () => {
    const defaults = createDefaultSettings(columns);

    expect(defaults.columnVisibility).toEqual({
      code: true,
      description: true,
      acoes: true,
    });
  });
});

describe('reconcileGridSettings', () => {
  it('remove IDs extintos e duplicados e inclui colunas novas', () => {
    const reconciled = reconcileGridSettings(
      {
        columnOrder: ['description', 'removed', 'description'],
        columnVisibility: { description: false, removed: false },
      },
      columns
    );

    expect(reconciled.columnOrder).toEqual(['description', 'code', 'acoes']);
    expect(reconciled.columnVisibility).toEqual({
      code: true,
      description: true,
      acoes: true,
    });
  });

  it('mantém coluna fixa visível e no fim declarado pelo schema', () => {
    const reconciled = reconcileGridSettings(
      {
        columnOrder: ['acoes', 'description', 'code'],
        columnVisibility: { code: true, description: true, acoes: false },
      },
      columns
    );

    expect(reconciled.columnOrder).toEqual(['description', 'code', 'acoes']);
    expect(reconciled.columnVisibility.acoes).toBe(true);
  });

  it('força ao menos uma coluna de dados a permanecer visível', () => {
    const hideableDataColumns: GridColumnOption[] = [
      { ...columns[0], id: 'code' },
      { ...columns[0], id: 'description' },
      columns[2],
    ];
    const reconciled = reconcileGridSettings(
      {
        columnOrder: ['code', 'description', 'acoes'],
        columnVisibility: { code: false, description: false, acoes: true },
      },
      hideableDataColumns
    );

    expect(reconciled.columnVisibility.code).toBe(true);
    expect(reconciled.columnVisibility.description).toBe(false);
  });

  it('preserva a ordem customizada válida escolhida pelo usuário', () => {
    const reconciled = reconcileGridSettings(
      {
        columnOrder: ['description', 'code', 'acoes'],
        columnVisibility: { code: true, description: true, acoes: true },
      },
      columns
    );

    expect(reconciled.columnOrder).toEqual(['description', 'code', 'acoes']);
  });

  it('acrescenta coluna nova do schema no fim das movíveis e já visível', () => {
    const extendedColumns: GridColumnOption[] = [
      columns[0],
      columns[1],
      {
        id: 'costCenterType',
        label: 'Tipo',
        hideable: true,
        orderPolicy: 'movable',
        dataColumn: true,
      },
      columns[2],
    ];

    const reconciled = reconcileGridSettings(
      {
        columnOrder: ['description', 'code', 'acoes'],
        columnVisibility: { code: true, description: true, acoes: true },
      },
      extendedColumns
    );

    expect(reconciled.columnOrder).toEqual(['description', 'code', 'costCenterType', 'acoes']);
    expect(reconciled.columnVisibility.costCenterType).toBe(true);
  });

  it('é idempotente: reconciliar o resultado não muda mais nada', () => {
    const stored = {
      columnOrder: ['acoes', 'removed', 'description'],
      columnVisibility: { code: false, description: true, acoes: false },
    };
    const once = reconcileGridSettings(stored, columns);
    const twice = reconcileGridSettings(once, columns);

    expect(twice).toEqual(once);
  });

  // Caso real do Centro de Custo: `description` é a coluna não ocultável, então
  // ocultar `code` não pode acionar o guard de mínima coluna visível.
  it('não força visibilidade quando já há coluna de dados fixa visível', () => {
    const reconciled = reconcileGridSettings(
      {
        columnOrder: ['code', 'description', 'acoes'],
        columnVisibility: { code: false, description: true, acoes: true },
      },
      columns
    );

    expect(reconciled.columnVisibility.code).toBe(false);
    expect(reconciled.columnVisibility.description).toBe(true);
  });
});

describe('buildGridStorageKey', () => {
  it('compõe a chave com namespace, versão, escopo e chave da grid', () => {
    expect(
      buildGridStorageKey(
        'grid-settings',
        'user-42:farm-3f1c',
        'CadastrosBaseCentroCustocost-centers-list'
      )
    ).toBe('grid-settings:v1:user-42:farm-3f1c:CadastrosBaseCentroCustocost-centers-list');
  });

  it('devolve null quando não há escopo estável', () => {
    expect(buildGridStorageKey('grid-settings', null, 'qualquer-grid')).toBeNull();
  });
});

describe('parseStoredGridSettings', () => {
  it('recupera o padrão quando o JSON é inválido', () => {
    const parsed = parseStoredGridSettings('{invalid', columns);

    expect(parsed.canPersist).toBe(true);
    expect(parsed.settings.columnOrder).toEqual(['code', 'description', 'acoes']);
    expect(parsed.settings.columnVisibility).toEqual({
      code: true,
      description: true,
      acoes: true,
    });
  });

  it('bloqueia persistência para não sobrescrever uma versão futura', () => {
    const parsed = parseStoredGridSettings(
      JSON.stringify({
        version: 2,
        columnOrder: ['description'],
        columnVisibility: { description: false },
      }),
      columns
    );

    expect(parsed.canPersist).toBe(false);
    expect(parsed.settings.columnOrder).toEqual(['code', 'description', 'acoes']);
  });

  it('entrega o padrão persistível quando não há nada gravado', () => {
    const parsed = parseStoredGridSettings(null, columns);

    expect(parsed.canPersist).toBe(true);
    expect(parsed.settings).toEqual(createDefaultSettings(columns));
  });

  it.each([
    ['version ausente', { columnOrder: ['description'], columnVisibility: { description: true } }],
    [
      'version como string',
      { version: '1', columnOrder: ['description'], columnVisibility: { description: true } },
    ],
    [
      'visibilidade não booleana',
      { version: 1, columnOrder: ['description'], columnVisibility: { description: 'sim' } },
    ],
  ])('recupera o padrão persistível com %s', (_label, rawSettings) => {
    const parsed = parseStoredGridSettings(JSON.stringify(rawSettings), columns);

    expect(parsed.canPersist).toBe(true);
    expect(parsed.settings).toEqual(createDefaultSettings(columns));
  });
});

// ---------------------------------------------------------------------------
// Envelope V2
// ---------------------------------------------------------------------------

const NAMESPACE = 'grid-settings';
const SCOPE = 'user-42:farm-3f1c';
const GRID_KEY = 'CadastrosBaseCentroCustocost-centers-list';
const V1_KEY = buildGridStorageKey(NAMESPACE, SCOPE, GRID_KEY) as string;
const V2_KEY = buildGridStorageKeyV2(NAMESPACE, SCOPE, GRID_KEY) as string;

interface StorageDouble extends GridSettingsStorage {
  writes: { key: string; value: string }[];
  data: Map<string, string>;
}

function createStorageDouble(seed: Record<string, string> = {}): StorageDouble {
  const data = new Map(Object.entries(seed));
  const writes: { key: string; value: string }[] = [];

  return {
    data,
    writes,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      writes.push({ key, value });
      data.set(key, value);
    },
  };
}

function createFailingStorage(seed: Record<string, string> = {}): GridSettingsStorage {
  const data = new Map(Object.entries(seed));

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
}

function buildLayout(order: string[], hidden: string[] = []): GridLayout {
  return {
    order,
    visibleColumnIds: order.filter((id) => !hidden.includes(id)),
    hiddenColumnIds: order.filter((id) => hidden.includes(id)),
  };
}

function createState(envelope?: StoredGridSettingsV2): GridSettingsState {
  return createGridSettingsState(
    {
      settings: envelope ?? createDefaultStoredSettingsV2(columns),
      canPersist: true,
      source: envelope ? 'v2' : 'default',
    },
    V2_KEY
  );
}

/**
 * Fábrica determinística injetada — prova que o ID não depende de `crypto`.
 * @param {string[]} existingIds - IDs já usados.
 * @return {string} Próximo ID `stub-N`.
 */
const stubPresetId: GridPresetIdFactory = (existingIds) => `stub-${existingIds.length + 1}`;

function seedPresets(state: GridSettingsState, total: number): GridSettingsState {
  let current = beginGridDraft(state);
  for (let index = 1; index <= total; index += 1) {
    current = createGridDraftPreset(current, `Preset ${index}`, stubPresetId).state;
  }

  return current;
}

describe('buildGridStorageKeyV2', () => {
  it('mantém o mesmo scoping da V1 mudando apenas a versão', () => {
    expect(V2_KEY).toBe(`grid-settings:v2:${SCOPE}:${GRID_KEY}`);
    expect(V1_KEY).toBe(`grid-settings:v1:${SCOPE}:${GRID_KEY}`);
    expect(V2_KEY).not.toBe(V1_KEY);
  });

  it('devolve null quando não há escopo estável', () => {
    expect(buildGridStorageKeyV2(NAMESPACE, null, GRID_KEY)).toBeNull();
  });
});

describe('parseStoredGridSettingsV2', () => {
  it('lê o envelope V2 válido e o reconcilia com o schema atual', () => {
    const stored: StoredGridSettingsV2 = {
      version: 2,
      revision: 7,
      appliedLayout: buildLayout(['description', 'code', 'removed', 'acoes'], ['code']),
      appliedPresetId: null,
      presets: [],
    };

    const parsed = parseStoredGridSettingsV2(JSON.stringify(stored), null, columns);

    expect(parsed.source).toBe('v2');
    expect(parsed.canPersist).toBe(true);
    expect(parsed.settings.revision).toBe(7);
    expect(parsed.settings.appliedLayout.order).toEqual(['description', 'code', 'acoes']);
    expect(parsed.settings.appliedLayout.hiddenColumnIds).toEqual(['code']);
  });

  it('migra a V1 válida quando a V2 ainda não existe', () => {
    const rawV1 = JSON.stringify({
      version: 1,
      columnOrder: ['description', 'code', 'acoes'],
      columnVisibility: { code: false, description: true, acoes: true },
    });

    const parsed = parseStoredGridSettingsV2(null, rawV1, columns);

    expect(parsed.source).toBe('migrated-v1');
    expect(parsed.canPersist).toBe(true);
    expect(parsed.settings.revision).toBe(0);
    expect(parsed.settings.appliedLayout.order).toEqual(['description', 'code', 'acoes']);
    expect(parsed.settings.appliedLayout.hiddenColumnIds).toEqual(['code']);
    expect(parsed.settings.presets).toEqual([]);
  });

  it('migra a V1 quando o envelope V2 está corrompido', () => {
    const rawV1 = JSON.stringify({
      version: 1,
      columnOrder: ['description', 'code', 'acoes'],
      columnVisibility: { code: false, description: true, acoes: true },
    });

    const parsed = parseStoredGridSettingsV2('{não é json', rawV1, columns);

    expect(parsed.source).toBe('migrated-v1');
    expect(parsed.settings.appliedLayout.hiddenColumnIds).toEqual(['code']);
  });

  it('cai no padrão seguro quando V2 e V1 estão corrompidas', () => {
    const parsed = parseStoredGridSettingsV2('{invalid', 'também inválido', columns);

    expect(parsed.source).toBe('default');
    expect(parsed.canPersist).toBe(true);
    expect(parsed.settings).toEqual(createDefaultStoredSettingsV2(columns));
  });

  it.each([
    ['revision não numérico', { version: 2, revision: 'x', appliedLayout: null, presets: [] }],
    ['appliedLayout ausente', { version: 2, revision: 1, appliedPresetId: null, presets: [] }],
    [
      'preset malformado',
      {
        version: 2,
        revision: 1,
        appliedLayout: { order: [], visibleColumnIds: [], hiddenColumnIds: [] },
        appliedPresetId: null,
        presets: [{ id: 'a' }],
      },
    ],
  ])('trata %s como envelope corrompido', (_label, raw) => {
    const parsed = parseStoredGridSettingsV2(JSON.stringify(raw), null, columns);

    expect(parsed.source).toBe('default');
    expect(parsed.settings).toEqual(createDefaultStoredSettingsV2(columns));
  });

  it('bloqueia a persistência diante de uma version futura', () => {
    const parsed = parseStoredGridSettingsV2(
      JSON.stringify({ version: 3, revision: 1, algoNovo: true }),
      null,
      columns
    );

    expect(parsed.source).toBe('future-version');
    expect(parsed.canPersist).toBe(false);
    expect(parsed.settings).toEqual(createDefaultStoredSettingsV2(columns));
  });

  it('não migra a V1 quando já existe uma V2 válida', () => {
    const rawV1 = JSON.stringify({
      version: 1,
      columnOrder: ['description', 'code', 'acoes'],
      columnVisibility: { code: false, description: true, acoes: true },
    });
    const rawV2 = JSON.stringify(createDefaultStoredSettingsV2(columns));

    const parsed = parseStoredGridSettingsV2(rawV2, rawV1, columns);

    expect(parsed.source).toBe('v2');
    expect(parsed.settings.appliedLayout.hiddenColumnIds).toEqual([]);
  });
});

describe('reconcileStoredGridSettingsV2', () => {
  it('normaliza nomes, remove duplicados e aplica o teto de presets', () => {
    const layout = createDefaultLayout(columns);
    const envelope: StoredGridSettingsV2 = {
      version: 2,
      revision: 2,
      appliedLayout: layout,
      appliedPresetId: 'inexistente',
      presets: [
        { id: 'a', name: '  Comercial   Sul  ', layout },
        { id: 'a', name: 'Repetido por ID', layout },
        { id: 'b', name: 'comercial sul', layout },
        { id: 'c', name: '   ', layout },
        { id: 'd', name: 'x'.repeat(51), layout },
        ...Array.from({ length: 10 }, (_item, index) => ({
          id: `extra-${index}`,
          name: `Extra ${index}`,
          layout,
        })),
      ],
    };

    const reconciled = reconcileStoredGridSettingsV2(envelope, columns);

    expect(reconciled.presets).toHaveLength(MAX_GRID_PRESETS);
    expect(reconciled.presets[0]).toMatchObject({ id: 'a', name: 'Comercial Sul' });
    expect(reconciled.presets.map((preset) => preset.id)).not.toContain('b');
    expect(reconciled.presets.map((preset) => preset.id)).not.toContain('c');
    expect(reconciled.presets.map((preset) => preset.id)).not.toContain('d');
    expect(reconciled.appliedPresetId).toBeNull();
  });

  it('reconcilia o layout de cada preset contra o schema atual', () => {
    const preset = {
      id: 'p1',
      name: 'Só descrição',
      layout: buildLayout(['description', 'extinta']),
    };
    const envelope: StoredGridSettingsV2 = {
      version: 2,
      revision: 0,
      appliedLayout: createDefaultLayout(columns),
      appliedPresetId: 'p1',
      presets: [preset],
    };

    const reconciled = reconcileStoredGridSettingsV2(envelope, columns);

    expect(reconciled.presets[0].layout.order).toEqual(['description', 'code', 'acoes']);
    expect(reconciled.appliedPresetId).toBe('p1');
  });
});

describe('migrateV1ToV2', () => {
  it('preserva a chave V1 como entrada e nasce com revision zero e sem presets', () => {
    const migrated = migrateV1ToV2(
      {
        columnOrder: ['description', 'code', 'acoes'],
        columnVisibility: { code: false, description: true, acoes: true },
      },
      columns
    );

    expect(migrated.version).toBe(2);
    expect(migrated.revision).toBe(0);
    expect(migrated.appliedPresetId).toBeNull();
    expect(migrated.presets).toEqual([]);
    expect(migrated.appliedLayout.visibleColumnIds).toEqual(['description', 'acoes']);
  });
});

describe('readGridSettingsV2 / persistGridSettingsV2', () => {
  it('lê a V2 e nunca escreve na chave V1', () => {
    const rawV1 = JSON.stringify({
      version: 1,
      columnOrder: ['description', 'code', 'acoes'],
      columnVisibility: { code: false, description: true, acoes: true },
    });
    const storage = createStorageDouble({ [V1_KEY]: rawV1 });

    const parsed = readGridSettingsV2(storage, { v1: V1_KEY, v2: V2_KEY }, columns);
    persistGridSettingsV2(storage, V2_KEY, parsed.settings);

    expect(parsed.source).toBe('migrated-v1');
    expect(storage.writes).toHaveLength(1);
    expect(storage.writes[0].key).toBe(V2_KEY);
    expect(storage.data.get(V1_KEY)).toBe(rawV1);
  });

  it('desativa a persistência quando não há chave V2 (escopo instável)', () => {
    const storage = createStorageDouble();

    const parsed = readGridSettingsV2(storage, { v1: null, v2: null }, columns);

    expect(parsed.canPersist).toBe(false);
    expect(createGridSettingsState(parsed, null).persistence).toBe('disabled');
  });

  it('marca read-only diante de uma version futura e não grava nada', () => {
    const rawFuture = JSON.stringify({ version: 3, revision: 9 });
    const storage = createStorageDouble({ [V2_KEY]: rawFuture });

    const parsed = readGridSettingsV2(storage, { v1: V1_KEY, v2: V2_KEY }, columns);
    const state = createGridSettingsState(parsed, V2_KEY);

    expect(state.canPersist).toBe(false);
    expect(state.persistence).toBe('read-only');
    expect(storage.writes).toHaveLength(0);
    expect(storage.data.get(V2_KEY)).toBe(rawFuture);
  });

  it('devolve unavailable sem lançar quando o storage recusa a escrita', () => {
    const storage = createFailingStorage();

    expect(persistGridSettingsV2(storage, V2_KEY, createDefaultStoredSettingsV2(columns))).toBe(
      'unavailable'
    );
    expect(persistGridSettingsV2(null, V2_KEY, createDefaultStoredSettingsV2(columns))).toBe(
      'unavailable'
    );
  });

  it('não persiste labels de coluna no envelope', () => {
    const storage = createStorageDouble();
    const state = applyGridDraft(seedPresets(createState(), 2), columns);

    persistGridSettingsV2(storage, V2_KEY, state.applied);

    const payload = storage.writes[0].value;
    expect(payload).not.toContain('Descrição');
    expect(payload).not.toContain('Ações');
    expect(payload).toContain('description');
  });
});

describe('transação: preview, cancel e apply', () => {
  it('preview altera só o rascunho e preserva a identidade do estado aplicado', () => {
    const base = createState();
    const opened = beginGridDraft(base);
    const previewed = setGridDraftLayout(
      opened,
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );

    // A escrita observa a REFERÊNCIA de `applied`; mantê-la significa não gravar.
    expect(opened.applied).toBe(base.applied);
    expect(previewed.applied).toBe(base.applied);
    expect(previewed.applied.revision).toBe(base.applied.revision);
    expect(previewed.draft?.layout.hiddenColumnIds).toEqual(['code']);
  });

  it('cancel restaura exatamente o estado aplicado anterior', () => {
    const base = createState();
    const previewed = setGridDraftLayout(
      beginGridDraft(base),
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );

    const cancelled = cancelGridDraft(previewed);

    expect(cancelled.draft).toBeNull();
    expect(cancelled.applied).toBe(base.applied);
    expect(cancelled.applied).toEqual(base.applied);
  });

  it('apply promove o rascunho trocando `applied` uma vez e somando 1 à revision', () => {
    const base = createState();
    const previewed = setGridDraftLayout(
      beginGridDraft(base),
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );

    const applied = applyGridDraft(previewed, columns);

    expect(applied.draft).toBeNull();
    expect(applied.applied).not.toBe(base.applied);
    expect(applied.applied.revision).toBe(base.applied.revision + 1);
    expect(applied.applied.appliedLayout.hiddenColumnIds).toEqual(['code']);
    // Sem rascunho aberto, reaplicar é no-op: nenhuma escrita adicional.
    expect(applyGridDraft(applied, columns)).toBe(applied);
    expect(applyGridDraft(applied, columns).applied.revision).toBe(1);
  });

  it('preview repetido não acumula revision antes do apply', () => {
    const base = createState();
    const hiddenCode = buildLayout(['code', 'description', 'acoes'], ['code']);
    let state = beginGridDraft(base);
    state = setGridDraftLayout(state, hiddenCode, columns);
    state = setGridDraftLayout(state, buildLayout(['description', 'code', 'acoes']), columns);
    state = setGridDraftLayout(state, buildLayout(['code', 'description', 'acoes']), columns);

    expect(state.applied).toBe(base.applied);

    const applied = applyGridDraft(state, columns);

    expect(applied.applied.revision).toBe(1);
  });

  it('beginDraft é idempotente e não descarta uma edição em andamento', () => {
    const previewed = setGridDraftLayout(
      beginGridDraft(createState()),
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );

    expect(beginGridDraft(previewed)).toBe(previewed);
  });
});

describe('reset do rascunho', () => {
  it('volta ao layout padrão sem apagar presets e sem tocar no aplicado', () => {
    const seeded = seedPresets(createState(), 2);
    const customized = setGridDraftLayout(
      seeded,
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );

    const reset = resetGridDraftLayout(customized, columns);

    expect(reset.draft?.layout).toEqual(createDefaultLayout(columns));
    expect(reset.draft?.presets).toHaveLength(2);
    expect(reset.draft?.presetId).toBeNull();
    expect(reset.applied).toBe(seeded.applied);
    expect(reset.applied.presets).toEqual([]);
  });
});

describe('presets: nome, limite e identidade', () => {
  it('normaliza o nome com trim e colapso de espaços', () => {
    expect(normalizePresetName('  Comercial   Sul  ')).toBe('Comercial Sul');
  });

  it.each([
    ['vazio', '   ', 'empty-name'],
    ['acima de 50 caracteres', 'x'.repeat(51), 'name-too-long'],
  ])('recusa nome %s', (_label, name, error) => {
    const result = createGridDraftPreset(beginGridDraft(createState()), name, stubPresetId);

    expect(result.error).toBe(error);
    expect(result.state.draft?.presets).toEqual([]);
  });

  it('aceita exatamente 50 caracteres', () => {
    const result = createGridDraftPreset(
      beginGridDraft(createState()),
      'x'.repeat(50),
      stubPresetId
    );

    expect(result.error).toBeNull();
    expect(result.state.draft?.presets).toHaveLength(1);
  });

  it('recusa nome duplicado ignorando maiúsculas e espaços', () => {
    const seeded = createGridDraftPreset(
      beginGridDraft(createState()),
      'Comercial Sul',
      stubPresetId
    ).state;

    const duplicated = createGridDraftPreset(seeded, '  COMERCIAL   sul ', stubPresetId);

    expect(duplicated.error).toBe('duplicate-name');
    expect(duplicated.state.draft?.presets).toHaveLength(1);
  });

  it('permite renomear mantendo o próprio nome e recusa colidir com outro', () => {
    const seeded = seedPresets(createState(), 2);

    expect(renameGridDraftPreset(seeded, 'stub-1', ' Preset   1 ').error).toBeNull();
    expect(renameGridDraftPreset(seeded, 'stub-1', 'preset 2').error).toBe('duplicate-name');
    expect(renameGridDraftPreset(seeded, 'inexistente', 'Outro').error).toBe('not-found');
  });

  it('bloqueia a criação acima de 8 presets', () => {
    const full = seedPresets(createState(), MAX_GRID_PRESETS);

    const extra = createGridDraftPreset(full, 'Nono', stubPresetId);

    expect(full.draft?.presets).toHaveLength(MAX_GRID_PRESETS);
    expect(extra.error).toBe('limit-reached');
    expect(extra.state.draft?.presets).toHaveLength(MAX_GRID_PRESETS);
  });

  it('recusa qualquer mutação de preset sem rascunho aberto', () => {
    const closed = createState();

    expect(createGridDraftPreset(closed, 'Novo', stubPresetId).error).toBe('no-draft');
    expect(renameGridDraftPreset(closed, 'stub-1', 'Novo').error).toBe('no-draft');
    expect(deleteGridDraftPreset(closed, 'stub-1').error).toBe('no-draft');
    expect(selectGridDraftPreset(closed, 'stub-1', columns).error).toBe('no-draft');
    expect(updateGridDraftPresetFromLayout(closed, 'stub-1').error).toBe('no-draft');
  });

  it('valida nome contra a lista corrente, ignorando o próprio preset', () => {
    const presets = [
      { id: 'a', name: 'Comercial Sul', layout: createDefaultLayout(columns) },
      { id: 'b', name: 'Financeiro', layout: createDefaultLayout(columns) },
    ];

    expect(validatePresetName('  Comercial Sul ', presets, 'a')).toEqual({
      ok: true,
      name: 'Comercial Sul',
    });
    expect(validatePresetName('financeiro', presets, 'a')).toEqual({
      ok: false,
      error: 'duplicate-name',
    });
  });

  it('gera ID determinístico no fallback, sem relógio nem random', () => {
    expect(createDeterministicPresetId([])).toBe('preset-1');
    expect(createDeterministicPresetId(['preset-1', 'preset-3'])).toBe('preset-2');
    expect(createDeterministicPresetId(['preset-1', 'preset-2'])).toBe('preset-3');
  });

  it('usa crypto.randomUUID quando disponível e cai no fallback quando não', () => {
    const uuid = createGridPresetId([]);

    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBeGreaterThan(0);

    const originalCrypto = globalThis.crypto;
    try {
      Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
      expect(createGridPresetId(['preset-1'])).toBe('preset-2');
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    }
  });

  it('criar, renomear, excluir e atualizar mexem só no rascunho', () => {
    const base = createState();
    const created = createGridDraftPreset(beginGridDraft(base), 'Comercial', stubPresetId).state;
    const renamed = renameGridDraftPreset(created, 'stub-1', 'Comercial Sul').state;
    const repointed = setGridDraftLayout(
      renamed,
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );
    const updated = updateGridDraftPresetFromLayout(repointed, 'stub-1').state;
    const deleted = deleteGridDraftPreset(updated, 'stub-1').state;

    expect(created.applied.presets).toEqual([]);
    expect(renamed.draft?.presets[0].name).toBe('Comercial Sul');
    expect(updated.draft?.presets[0].layout.hiddenColumnIds).toEqual(['code']);
    expect(updated.applied.presets).toEqual([]);
    expect(deleted.draft?.presets).toEqual([]);
    expect(deleted.draft?.presetId).toBeNull();
    expect(deleted.applied).toBe(base.applied);
  });

  it('persiste os presets do rascunho apenas no apply', () => {
    const seeded = seedPresets(createState(), 2);

    expect(seeded.applied.presets).toEqual([]);

    const applied = applyGridDraft(seeded, columns);

    expect(applied.applied.presets.map((preset) => preset.name)).toEqual(['Preset 1', 'Preset 2']);
    expect(applied.applied.revision).toBe(1);
  });
});

describe('preset ativo', () => {
  it('reflete o layout aplicado e zera quando ele diverge', () => {
    const created = createGridDraftPreset(
      beginGridDraft(createState()),
      'Padrão salvo',
      stubPresetId
    ).state;
    const applied = applyGridDraft(created, columns);

    expect(resolveActivePresetId(applied.applied)).toBe('stub-1');

    const diverged = applyGridDraft(
      setGridDraftLayout(
        beginGridDraft(applied),
        buildLayout(['description', 'code', 'acoes'], ['code']),
        columns
      ),
      columns
    );

    expect(diverged.applied.presets).toHaveLength(1);
    expect(resolveActivePresetId(diverged.applied)).toBeNull();
  });

  it('selecionar um preset no rascunho não muda o preset ativo antes do apply', () => {
    const applied = applyGridDraft(
      createGridDraftPreset(beginGridDraft(createState()), 'Salvo', stubPresetId).state,
      columns
    );
    const diverged = applyGridDraft(
      setGridDraftLayout(
        beginGridDraft(applied),
        buildLayout(['description', 'code', 'acoes'], ['code']),
        columns
      ),
      columns
    );

    const selected = selectGridDraftPreset(beginGridDraft(diverged), 'stub-1', columns);

    expect(selected.error).toBeNull();
    expect(selected.state.draft?.presetId).toBe('stub-1');
    expect(resolveActivePresetId(selected.state.applied)).toBeNull();

    const promoted = applyGridDraft(selected.state, columns);

    expect(resolveActivePresetId(promoted.applied)).toBe('stub-1');
  });

  it('selecionar preset inexistente devolve not-found e não altera o rascunho', () => {
    const opened = beginGridDraft(createState());

    const result = selectGridDraftPreset(opened, 'nao-existe', columns);

    expect(result.error).toBe('not-found');
    expect(result.state).toBe(opened);
  });
});

describe('adapter V1 sobre o envelope V2', () => {
  it('converte layout ↔ estado de colunas sem perder ordem nem visibilidade', () => {
    const layout = layoutFromColumnState(
      ['description', 'code', 'acoes'],
      { code: false, description: true, acoes: true },
      columns
    );

    expect(layout.order).toEqual(['description', 'code', 'acoes']);
    expect(layout.visibleColumnIds).toEqual(['description', 'acoes']);
    expect(layout.hiddenColumnIds).toEqual(['code']);

    expect(layoutToColumnState(layout, columns)).toEqual({
      columnOrder: ['description', 'code', 'acoes'],
      columnVisibility: { code: false, description: true, acoes: true },
    });
  });

  it('commit imediato soma 1 à revision e zera o preset ativo divergente', () => {
    const applied = applyGridDraft(
      createGridDraftPreset(beginGridDraft(createState()), 'Salvo', stubPresetId).state,
      columns
    );

    const committed = commitGridLayout(
      applied,
      buildLayout(['description', 'code', 'acoes'], ['code']),
      columns
    );

    expect(committed.applied.revision).toBe(applied.applied.revision + 1);
    expect(committed.applied.presets).toHaveLength(1);
    expect(committed.applied.appliedPresetId).toBeNull();
  });
});
