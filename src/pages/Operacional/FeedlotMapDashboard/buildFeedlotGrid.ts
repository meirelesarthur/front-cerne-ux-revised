// src/pages/Operacional/FeedlotMapDashboard/buildFeedlotGrid.ts
// Monta a grade 2D (linha/coluna) de um Setor a partir do array flat de
// `components[]` — mirror EXATO de `buildGrid()` em
// `agro365/resources/js/components/FeedlotMap/Setor.js` (convenção do
// backend): rua vertical → `line===0`, coluna=X; rua horizontal →
// `column===0`, linha=X; curral → `line>=1 e column>=1`.

import type { FeedlotComponentNode } from '@/@types/v2/FeedlotMap';

export interface FeedlotGridRow {
  line: number;
  isHorizontalStreet: boolean;
  hStreetComponent: FeedlotComponentNode | null;
  corralsByColumn: Record<number, FeedlotComponentNode>;
}

export interface FeedlotGrid {
  rows: FeedlotGridRow[];
  allColumns: number[];
  vStreetByColumn: Record<number, FeedlotComponentNode>;
  vStreetColumns: Set<number>;
}

export function buildFeedlotGrid(components: FeedlotComponentNode[]): FeedlotGrid {
  const vStreets: Record<number, FeedlotComponentNode> = {};
  const hStreetsByLine: Record<number, FeedlotComponentNode> = {};
  const corralsByLine: Record<number, Record<number, FeedlotComponentNode>> = {};

  components.forEach((component) => {
    if (component.type === 'street' && component.line === 0) {
      vStreets[component.column] = component;
    } else if (component.type === 'street' && component.column === 0) {
      hStreetsByLine[component.line] = component;
    } else {
      if (!corralsByLine[component.line]) corralsByLine[component.line] = {};
      corralsByLine[component.line][component.column] = component;
    }
  });

  const columnSet = new Set<number>();
  Object.values(corralsByLine).forEach((byColumn) => {
    Object.keys(byColumn).forEach((column) => columnSet.add(Number(column)));
  });
  Object.keys(vStreets).forEach((column) => columnSet.add(Number(column)));
  const allColumns = Array.from(columnSet).sort((a, b) => a - b);

  const vStreetColumns = new Set(Object.keys(vStreets).map(Number));

  const lineSet = new Set<number>([
    ...Object.keys(hStreetsByLine).map(Number),
    ...Object.keys(corralsByLine).map(Number),
  ]);
  const sortedLines = Array.from(lineSet).sort((a, b) => a - b);

  const rows: FeedlotGridRow[] = sortedLines.map((line) => ({
    line,
    isHorizontalStreet: Boolean(hStreetsByLine[line]),
    hStreetComponent: hStreetsByLine[line] ?? null,
    corralsByColumn: corralsByLine[line] ?? {},
  }));

  return { rows, allColumns, vStreetByColumn: vStreets, vStreetColumns };
}

export function corralColumns(allColumns: number[], vStreetColumns: Set<number>): number[] {
  return allColumns.filter((column) => !vStreetColumns.has(column));
}
