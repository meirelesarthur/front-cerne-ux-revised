// src/pages/Operacional/VendaAnimais/VendaAnimaisActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Venda de Animais — mirror
// `RomaneioActionsMenu.tsx` (props `can*`/`isLocked`/`on*`, `Tooltip` em ação
// desabilitada). Contrato de tela §5.3.
//
// Escopo original (TASK-VD-FE-01, fundação): só Visualizar (A1) e Excluir
// (A9) FUNCIONAIS; Editar (A8)/Finalizar (A7) navegam para rotas das Tarefas
// 15/16. Imprimir/Documentos/Emitir NFe/SISBOV (A2-A6) eram omitidos por
// completo (ausência limpa) — pertencem à Tarefa 17 (fluxos satélites).
//
// Tarefa 17.a (task-packet §6, fatia "Relatórios PDF") acrescenta Imprimir
// (A2)/SISBOV Recria (A5)/SISBOV Abate (A6) — os 3 gated só por
// `canView`/`mov_sale_view` (mesmo gate dos 3 endpoints reais, matriz
// FID-G3F #4-#6). SISBOV Recria/Abate são MUTUAMENTE exclusivos por
// `typeSale` (computável hoje na própria linha da listagem, sem Gap).
//
// Tarefa 17.b (task-packet §6, fatia "Documentos") acrescenta Documentos
// (A3) — gate `canView`/`mov_sale_view` também (achado C da matriz
// FID-G3F §3.1: o endpoint de escrita `POST .../documents` é gateado pela
// permissão de LEITURA, mirror consciente do legado — decisão já tomada na
// camada API, não é bug deste menu).
//
// Tarefa 17.c (task-packet §6, fatia "Emitir NFe") acrescenta Emitir NFe
// (A4) — abre `MovementSaleEmitNfeDialog` (handoff). Gate DUPLO (§2.5): o
// item some sem `canEdit`/`mov_sale_edit` (mesmo gate do endpoint
// `POST .../nfe-issue`, matriz FID-G3F #3) e fica DESABILITADO com
// `Tooltip` explicativo quando falta `nfe_create` (a rota de destino,
// `/fiscal/nfe-emitidas/novo`, responde 403 sem essa 2ª permissão) —
// convenção do fork (mirror `RomaneioActionsMenu`/Editar abaixo: nunca botão
// morto sem explicação).
//
// Esta fatia FECHA a ordem do dropdown na posição final do legado
// (`SCR-B3`, `index.blade.php:131-176`): Visualizar → Imprimir →
// Documentos → Emitir NFe → SISBOV Recria → SISBOV Abate → Finalizar →
// Editar → Excluir — as 3 fatias (17.a/17.b/17.c) juntas fecham a Tarefa 17
// inteira (task-packet §6, "toque único de reorder final").
//
// `onEdit`/`onFinish` são opcionais para o componente já nascer com o
// contrato final de props (Tarefas 15/16 não precisam redesenhar este
// arquivo) — se ausentes, o item correspondente não é renderizado. Mesmo
// racional para `onPrint`/`onSisbovRearing`/`onSisbovSlaughter` (Tarefa 17.a),
// `onDocuments` (Tarefa 17.b) e `onEmitNfe` (Tarefa 17.c).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiFile,
  FiFileText,
  FiPrinter,
  FiSend,
  FiTrash2,
} from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

import type { MovementSaleType } from '@/@types/v2/MovementSales';

export interface VendaAnimaisActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `type_sale===2 && status==='F'` (ver `MovementSaleLockBanners.isMovementSaleLocked`) —
   *  desabilita Editar (`incomes_count` indisponível na API hoje, `GAP-VENDAS-FE-03`). */
  isLocked: boolean;
  /** `status==='P'` — habilita "Finalizar" (contrato §5.3, A7). */
  canFinish: boolean;
  /** `type_sale` da linha (Tarefa 17.a) — gateia SISBOV Recria (`1`) x
   *  SISBOV Abate (`2`), mutuamente exclusivos, computável hoje. */
  typeSale: MovementSaleType;
  onView: () => void;
  onEdit?: () => void;
  onFinish?: () => void;
  /** `GET .../{uuid}/report` (A2, Tarefa 17.a) — sempre disponível a quem
   *  pode visualizar. */
  onPrint?: () => void;
  /** Abre o modal de Documentos (A3, Tarefa 17.b) — `POST .../documents`,
   *  gate `mov_sale_view` (achado C, mirror legado). */
  onDocuments?: () => void;
  /** `GET .../{uuid}/sisbov-report/rearing` (A5) — só `typeSale===1`. */
  onSisbovRearing?: () => void;
  /** `GET .../{uuid}/sisbov-report/slaughter` (A6) — só `typeSale===2`. */
  onSisbovSlaughter?: () => void;
  /** Abre `MovementSaleEmitNfeDialog` (A4, Tarefa 17.c) — some junto com
   *  `canEdit` (mesmo gate `mov_sale_edit` do endpoint
   *  `nfe-issue`). */
  onEmitNfe?: () => void;
  /** `nfe_create` (§2.5) — 2ª permissão do gate duplo: a rota de destino
   *  (`/fiscal/nfe-emitidas/novo`) responde 403 sem ela. Item aparece
   *  DESABILITADO com `Tooltip` quando `false`, nunca oculto (diferente de
   *  `canEdit`, que oculta). */
  canIssueNfe?: boolean;
  onDelete: () => void;
  isDeleting?: boolean;
  /** Baixando o relatório desta LINHA especificamente (não a listagem
   *  inteira) — desabilita só o próprio item, sem travar o resto do menu. */
  isDownloadingReport?: boolean;
  isDownloadingSisbovRearing?: boolean;
  isDownloadingSisbovSlaughter?: boolean;
  labels: {
    view: string;
    print: string;
    documents: string;
    sisbovRearing: string;
    sisbovSlaughter: string;
    emitNfe: string;
    emitNfeDisabledTooltip: string;
    edit: string;
    finish: string;
    delete: string;
    editDisabledTooltip: string;
  };
}

export function VendaAnimaisActionsMenu({
  canView,
  canEdit,
  canDelete,
  isLocked,
  canFinish,
  typeSale,
  onView,
  onEdit,
  onFinish,
  onPrint,
  onDocuments,
  onSisbovRearing,
  onSisbovSlaughter,
  onEmitNfe,
  canIssueNfe = false,
  onDelete,
  isDeleting = false,
  isDownloadingReport = false,
  isDownloadingSisbovRearing = false,
  isDownloadingSisbovSlaughter = false,
  labels,
}: VendaAnimaisActionsMenuProps) {
  return (
    <Actions size="sm">
      {/* Ordem final do legado (`SCR-B3`, Tarefa 17.c fecha a Tarefa 17):
          Visualizar → Imprimir → Documentos → Emitir NFe → SISBOV Recria →
          SISBOV Abate → Finalizar → Editar → Excluir. */}
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canView && onPrint && (
        <Actions.Item
          icon={<Icon as={FiPrinter} />}
          onClick={onPrint}
          disabled={isDownloadingReport}
        >
          {labels.print}
        </Actions.Item>
      )}
      {canView && onDocuments && (
        <Actions.Item icon={<Icon as={FiFile} />} onClick={onDocuments}>
          {labels.documents}
        </Actions.Item>
      )}
      {canEdit && onEmitNfe && (
        <Tooltip
          content={labels.emitNfeDisabledTooltip}
          disabled={canIssueNfe}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item icon={<Icon as={FiSend} />} onClick={onEmitNfe} disabled={!canIssueNfe}>
            {labels.emitNfe}
          </Actions.Item>
        </Tooltip>
      )}
      {canView && typeSale === 1 && onSisbovRearing && (
        <Actions.Item
          icon={<Icon as={FiFileText} />}
          onClick={onSisbovRearing}
          disabled={isDownloadingSisbovRearing}
        >
          {labels.sisbovRearing}
        </Actions.Item>
      )}
      {canView && typeSale === 2 && onSisbovSlaughter && (
        <Actions.Item
          icon={<Icon as={FiFileText} />}
          onClick={onSisbovSlaughter}
          disabled={isDownloadingSisbovSlaughter}
        >
          {labels.sisbovSlaughter}
        </Actions.Item>
      )}
      {canEdit && canFinish && onFinish && (
        <Actions.Item icon={<Icon as={FiCheckCircle} />} onClick={onFinish}>
          {labels.finish}
        </Actions.Item>
      )}
      {canEdit && onEdit && (
        <Tooltip
          content={labels.editDisabledTooltip}
          disabled={!isLocked}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit} disabled={isLocked}>
            {labels.edit}
          </Actions.Item>
        </Tooltip>
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
