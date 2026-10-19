// src/pages/Operacional/FeedlotMapDashboard/useFeedlotMapDialogState.ts
// Estado central de "diálogo ativo" do Mapa de Confinamento — local ao
// componente da tela (NUNCA rota, mirror `get_pwa_screen_and_router_pattern`
// "estado local para modal", `[[05-front-tela-mapa]]` §2.3). Compartilhado
// pelas Tarefas `TASK-FE-042-204..216`: cada uma consome `dialog`/`openDialog`/
// `closeDialog` para o SEU `kind`, sem precisar tocar nesta Tarefa (201) de
// novo.

import { useState } from 'react';

import type { CorralCardData } from '@/@types/v2/FeedlotMap';

export type FeedlotMapDialogKind =
  | 'yard'
  | 'sector'
  | 'corral'
  | 'street'
  | 'status'
  | 'lotes'
  | 'transfer'
  | 'dates'
  | 'diet'
  | 'weighing'
  | 'sanitary'
  | 'death';

export interface FeedlotMapDialogState {
  kind: FeedlotMapDialogKind;
  targetUuid?: string;
  sectorUuid?: string;
  yardUuid?: string;
  /** Nome do pátio pai — pré-preenche o `SelectAsyncPaginate` do diálogo de Setor no create (`TASK-FE-042-205`), sem 2º fetch. */
  yardName?: string;
  /** Nome do setor pai — mesma finalidade, diálogo de Curral/Rua (`TASK-FE-042-206/207`). */
  sectorName?: string;
  /** Distingue Editar de Duplicar no diálogo de Curral (`AM06`, mirror `handleDuplicateCorral`). */
  mode?: 'create' | 'edit' | 'duplicate';
  /**
   * Valores atuais da Rua clicada (`targetUuid`) — o card já traz `description`/
   * `orientation` embutidos na árvore (`GET /feedlot-map`); não existe `GET
   * /feedlot-streets/{uuid}` consumido por esta feature (`TASK-FE-042-207`),
   * então o diálogo de EDITAR hidrata a partir destes valores, sem 2º fetch.
   */
  streetDescription?: string;
  streetOrientation?: 'H' | 'V';
  /**
   * Snapshot do card do curral clicado (`targetUuid`) — os diálogos
   * `status`/`lotes`/`transfer`/`dates`/`diet`/`weighing`/`sanitary`/`death`
   * (`TASK-FE-042-208..216`) precisam de campos já presentes na árvore
   * (`status`/`batches`/`entry_date`/`exit_date`/`diet_id`/`feed_intake`/
   * `expected_adg`/`animals_count`/...) — evita 2º fetch redundante quando o
   * dado já está em memória (mirror do racional de `streetDescription`).
   */
  corralData?: CorralCardData;
}

export function useFeedlotMapDialogState() {
  const [dialog, setDialog] = useState<FeedlotMapDialogState | null>(null);

  function openDialog(state: FeedlotMapDialogState) {
    setDialog(state);
  }

  function closeDialog() {
    setDialog(null);
  }

  return { dialog, openDialog, closeDialog };
}
