import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    style?: object;
    /** Rótulo humano usado por controles genéricos de personalização da grid. */
    gridLabel?: string;
    /** Política de ordem independente da capacidade de ocultar a coluna. */
    gridOrder?: 'movable' | 'fixed-start' | 'fixed-end';
    /** `false` identifica colunas técnicas, como ações. Default: `true`. */
    gridDataColumn?: boolean;
  }
}
