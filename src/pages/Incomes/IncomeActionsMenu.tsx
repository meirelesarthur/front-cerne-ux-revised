// src/pages/Incomes/IncomeActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações de linha da listagem de Contas a Receber — mirror da
// composição `Actions`/`Actions.Item` já usada em `CentroCusto/index.tsx`
// (TASK-FE-036-311). Gates por `incomes_view`/`incomes_edit`/`incomes_delete`
// — SEM lógica de `is_locked` aqui (a UI de bloqueio vive no formulário,
// TASK-FE-036-313, GAP-FE-036-300).
//
// "Baixar" (AM09, TASK-FE-036-333) — abre o `WriteOffCreateModal`
// COMPARTILHADO (Tarefas 330/331); o disclosure e o `segment='incomes'`
// vivem em `index.tsx` (este menu só repassa o clique via `onWriteOff`).
// Gate reaproveita `isIncomeEligibleForWriteOff` (`income-status.ts`), MESMA
// condição já usada na seleção em lote (`index.tsx`, INC-R15) — não
// duplicada aqui.
//
// "Documentos" (AM06, TASK-FE-036-339) — abre o `DocumentPanel` COMPARTILHADO
// (Tarefa 338) num Drawer; o disclosure e o `segment='incomes'` vivem em
// `index.tsx` (mirror EXATO de `onWriteOff`). Gate DEDICADO
// `incomedocument_view` — NUNCA `incomes_edit` (permissões de Documentos são
// próprias, confirmado na Tarefa 337/339, não reaproveitar o atalho da Baixa).
// -----------------------------------------------------------------------------

import { Flex, Icon } from '@chakra-ui/react';
import {
  FiCopy,
  FiDollarSign,
  FiDownload,
  FiEdit,
  FiEye,
  FiPaperclip,
  FiTrash2,
} from 'react-icons/fi';

import { Actions } from '@/components/Action';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';
import type { IncomeListItem } from '@/@types/v2/Incomes';

import { isIncomeEligibleForWriteOff } from './income-status';

export interface IncomeActionsMenuProps {
  income: IncomeListItem;
  languageGB: LanguageDate;
  onView: (income: IncomeListItem) => void;
  onEdit: (income: IncomeListItem) => void;
  onDelete: (income: IncomeListItem) => void;
  onWriteOff: (income: IncomeListItem) => void;
  onDocuments: (income: IncomeListItem) => void;
  /** AM11 (TASK-FE-036-320, B-11) — gateado por `incomes_create` (busca o
   *  draft e navega para a criação, mirror da permissão real do backend no
   *  middleware de `duplicate`). SEM confirmação — nada é persistido pelo
   *  clique (mirror do racional de `onWriteOff`, não-destrutivo). */
  onDuplicate: (income: IncomeListItem) => void;
  /** B-12 (TASK-FE-036-B12-CAR) — abre/baixa o PDF do recibo do título via
   *  `getIncomeReceipt` + `downloadBlob` (mirror EXATO da fatia irmã de
   *  Contas a Pagar). Gate `canGenerateReceipt` calculado INTERNAMENTE
   *  (`can('incomes_view')`), mirror do padrão já usado por
   *  `canView`/`canDuplicate`/`canViewDocuments` neste mesmo arquivo. */
  onGenerateReceipt: (income: IncomeListItem) => void;
  isDeleting?: boolean;
  isDuplicating?: boolean;
  isGeneratingReceipt?: boolean;
}

export function IncomeActionsMenu({
  income,
  languageGB,
  onView,
  onEdit,
  onDelete,
  onWriteOff,
  onDocuments,
  onDuplicate,
  onGenerateReceipt,
  isDeleting = false,
  isDuplicating = false,
  isGeneratingReceipt = false,
}: IncomeActionsMenuProps) {
  const { can } = usePermissions();
  const text = languageGB.incomes.income.list.actions;

  const canView = can('incomes_view');
  // B-12 (TASK-FE-036-B12-CAR) — MESMA permissão de "Visualizar" (leitura de
  // documento, não é ação de escrita). Backend já é a 2ª barreira real
  // (`permission:incomes_view`, contrato de API §3).
  const canGenerateReceipt = can('incomes_view');
  // AM11 (TASK-FE-036-320) — mirror da permissão real do backend
  // (`incomes_create` no middleware de `duplicate`).
  const canDuplicate = can('incomes_create');
  // AM06 (TASK-FE-036-339) — permissão DEDICADA de Documentos, DIFERENTE do
  // padrão `incomes_edit` usado por "Editar"/"Baixar" neste mesmo menu.
  const canViewDocuments = can('incomedocument_view');
  // TASK-FE-036-320 (Onda 1 segurança/FID-G3F AM07) — restaura o gate do
  // legado: o `action_manifest` só oferece "Editar" quando
  // `payment_type != 4 (ADIANTAMENTO) && !ticket_id`. O braço `!ticket_id`
  // fica PENDENTE (Boleto/Ticket MISSING na API migrada, decisão de escopo
  // já registrada em FID-G3A — `IncomeListItem` não tem `ticket_id`/
  // `has_ticket` hoje, e este ponto não inventa o campo). Implementa só o
  // braço `payment_type !== 4`, acionável hoje.
  const canEdit = can('incomes_edit') && income.payment_type !== 4;
  const canDelete = can('incomes_delete');
  // AM09 — mirror do gate simplificado do Roteiro da Tarefa 333 (baixa
  // cruzada com adiantamento não existe na API migrada, TASK-FE-036-330).
  const canWriteOff = can('incomes_edit') && isIncomeEligibleForWriteOff(income);

  return (
    <Flex justify="flex-end">
      <Actions size="sm">
        {canView && (
          <Actions.Item icon={<Icon as={FiEye} />} onClick={() => onView(income)}>
            {text.view}
          </Actions.Item>
        )}
        {canGenerateReceipt && (
          <Actions.Item
            icon={<Icon as={FiDownload} />}
            onClick={() => onGenerateReceipt(income)}
            disabled={isGeneratingReceipt}
          >
            {text.receipt}
          </Actions.Item>
        )}
        {canEdit && (
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(income)}>
            {text.edit}
          </Actions.Item>
        )}
        {canWriteOff && (
          <Actions.Item icon={<Icon as={FiDollarSign} />} onClick={() => onWriteOff(income)}>
            {text.writeOff}
          </Actions.Item>
        )}
        {canViewDocuments && (
          <Actions.Item icon={<Icon as={FiPaperclip} />} onClick={() => onDocuments(income)}>
            {text.documents}
          </Actions.Item>
        )}
        {canDuplicate && (
          <Actions.Item
            icon={<Icon as={FiCopy} />}
            onClick={() => onDuplicate(income)}
            disabled={isDuplicating}
          >
            {text.duplicate}
          </Actions.Item>
        )}
        {canDelete && (
          <>
            <Actions.Separator />
            <Actions.Item
              icon={<Icon as={FiTrash2} />}
              onClick={() => onDelete(income)}
              tone="danger"
              disabled={isDeleting}
            >
              {text.delete}
            </Actions.Item>
          </>
        )}
      </Actions>
    </Flex>
  );
}
