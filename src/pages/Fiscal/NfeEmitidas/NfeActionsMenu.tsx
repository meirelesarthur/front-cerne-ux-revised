// src/pages/Fiscal/NfeEmitidas/NfeActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de NFe Emitida — Visualizar/Editar/
// Excluir. TASK-FE-036-403. Mirror `InvoiceActionsMenu.tsx` (composição fina
// sobre `Actions`/`Actions.Item`, mesmo primitivo real do fork).
//
// SEM "Imprimir" — a tela de Visualização (`NfeDetalhe.tsx`) tem seu próprio
// botão de impressão; replicar aqui é decisão do Executor sem impacto de
// contrato (contrato de tela §3), omitido para não inflar o menu.
//
// Editar/Excluir só aparecem quando `isEditable` (contrato de tela §3, mirror
// doc bruta `mode_matrix.edit.guard`/`destroy.UI_guard`: "editar/excluir só
// para estado novo ou rejeitado") — a guarda é calculada pelo caller
// (`nfeEstadoOptions`/`isNfeEditable`) e passada como prop, este componente
// só OCULTA (nunca desabilita) os itens conforme a combinação
// permissão×estado.
//
// **Correção NFE-R2-004 (REAUDITORIA-036-2a-rodada.md)** — "Duplicar"
// restaurado, mirror `index.blade.php:174-179`
// (`route('nfe.duplicate', $item->id)`, confirmado por leitura direta de
// `NfeController::duplicateNfe()`: monta o payload da NFe atual e abre o
// formulário de CRIAÇÃO pré-preenchido — NÃO depende de emissão SEFAZ).
// Disponível independente do `estado` (o legado mostra Duplicar sempre que
// `nfe_create`, mesma guarda de `canDuplicate` = `can('nfe_create')` no
// caller), diferente de Editar/Excluir.
//
// **TASK-FE-036-515 (Onda 2)** — Emitir/Cancelar/Corrigir/Consultar
// somam-se ao kebab da listagem. Guarda por estado×permissão é calculada
// pelo CALLER (mesmo contrato de Editar/Excluir: este componente só OCULTA,
// nunca desabilita) — mirror 1:1 dos gates reais do backend
// (`NfeEmissionController::middleware()`): `nfe_edit` (novo/rejeitado),
// `nfe_delete` (cancelar) / `nfe_edit` (CC-e) (aprovado), `nfe_view` para Consultar. As 4
// ações NAVEGAM para `NfeDetalhe.tsx` (`onEmit`/`onCancel`/`onCorrect`/
// `onConsult` — mesmo destino de `onView`), onde `NfeEmissionPanel.tsx`
// hospeda os modais/mutações reais — evita duplicar toda a orquestração de
// emissão SEFAZ (modais de confirmação/motivo, banners de rejeição) dentro
// da tela de listagem.
//
// **TASK-FE-036-560/562 (Onda 3)** — "Baixar XML"/"Baixar DANFE" somam-se
// ao kebab, mesmo padrão de navegação (`onDownloadXml`/`onDownloadDanfe`
// levam para `NfeDetalhe.tsx`, mesmo destino de `onView`) — o download
// binário em si (preview vs. final, conforme `estado`) mora só em
// `NfeEmissionPanel.tsx`, evitando duplicar a lógica de blob/nome de
// arquivo aqui na listagem. Gate único `nfe_view` (mesma permissão de
// Consultar/Visualizar — leitura de documento, não escrita).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import {
  FiCopy,
  FiDownload,
  FiEdit,
  FiEye,
  FiSearch,
  FiSend,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface NfeActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  /** NFE-R2-004 — mirror `@can('nfe_create')` do legado. */
  canDuplicate?: boolean;
  onDuplicate?: () => void;
  /** TASK-FE-036-515 — mirror `permission:nfe_edit`, só `novo`/`rejeitado`. */
  canEmit?: boolean;
  onEmit?: () => void;
  /** TASK-FE-036-515 — mirror `permission:nfe_delete`, só `aprovado`. */
  canCancel?: boolean;
  onCancel?: () => void;
  /** TASK-FE-036-515 — mirror `permission:nfe_edit`, só `aprovado`. */
  canCorrect?: boolean;
  onCorrect?: () => void;
  /** TASK-FE-036-515 — reusa `nfe_view` (mirror `NfeEmissionController::
   *  middleware()`, `only: ['consult']` exige só `nfe_view`). */
  canConsult?: boolean;
  onConsult?: () => void;
  /** TASK-FE-036-560/562 — reusa `nfe_view` (leitura de documento,
   *  `NfeDocumentController`); preview vs. final é decidido pelo
   *  `NfeEmissionPanel.tsx` no destino da navegação. */
  canDownloadXml?: boolean;
  onDownloadXml?: () => void;
  canDownloadDanfe?: boolean;
  onDownloadDanfe?: () => void;
  labels: {
    view: string;
    edit: string;
    delete: string;
    duplicate: string;
    emit?: string;
    cancel?: string;
    correct?: string;
    consult?: string;
    downloadXml?: string;
    downloadDanfe?: string;
  };
}

export function NfeActionsMenu({
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  canDuplicate = false,
  onDuplicate,
  canEmit = false,
  onEmit,
  canCancel = false,
  onCancel,
  canCorrect = false,
  onCorrect,
  canConsult = false,
  onConsult,
  canDownloadXml = false,
  onDownloadXml,
  canDownloadDanfe = false,
  onDownloadDanfe,
  labels,
}: NfeActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canEdit && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}
      {canDuplicate && onDuplicate && (
        <Actions.Item icon={<Icon as={FiCopy} />} onClick={onDuplicate}>
          {labels.duplicate}
        </Actions.Item>
      )}
      {canEmit && onEmit && labels.emit && (
        <Actions.Item icon={<Icon as={FiSend} />} onClick={onEmit}>
          {labels.emit}
        </Actions.Item>
      )}
      {canConsult && onConsult && labels.consult && (
        <Actions.Item icon={<Icon as={FiSearch} />} onClick={onConsult}>
          {labels.consult}
        </Actions.Item>
      )}
      {canCorrect && onCorrect && labels.correct && (
        <Actions.Item onClick={onCorrect}>{labels.correct}</Actions.Item>
      )}
      {(canDownloadXml || canDownloadDanfe) && (
        <>
          <Actions.Separator />
          {canDownloadXml && onDownloadXml && labels.downloadXml && (
            <Actions.Item icon={<Icon as={FiDownload} />} onClick={onDownloadXml}>
              {labels.downloadXml}
            </Actions.Item>
          )}
          {canDownloadDanfe && onDownloadDanfe && labels.downloadDanfe && (
            <Actions.Item icon={<Icon as={FiDownload} />} onClick={onDownloadDanfe}>
              {labels.downloadDanfe}
            </Actions.Item>
          )}
        </>
      )}
      {canCancel && onCancel && labels.cancel && (
        <>
          <Actions.Separator />
          <Actions.Item icon={<Icon as={FiXCircle} />} tone="danger" onClick={onCancel}>
            {labels.cancel}
          </Actions.Item>
        </>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {labels.delete}
          </Actions.Item>
        </>
      )}
    </Actions>
  );
}
