// src/pages/Financeiro/ContasAPagar/ExpenseActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Expense (Contas a Pagar) —
// Visualizar/Editar/Excluir/Baixas. Composição fina sobre `Actions`
// (`@/components/Action`), mirror `InvoiceActionsMenu.tsx`/`ServiceExpenses/
// index.tsx`. SEM "Imprimir" (nenhum endpoint de impressão no contrato desta
// fatia, diferente do Invoice).
//
// Guardas de estado (esteira 036, TASK-FE-036-112, FID-G3F AM12/AM13/SE07) —
// `editDisabled`/`deleteDisabled` chegam JÁ CALCULADOS de `index.tsx`
// (`hasExpenseMoved`/`payment_type===4`); este componente continua
// "composição fina", SEM lógica de domínio — só decide cursor/tooltip/opacity
// a partir do booleano recebido.
//
// "Baixas" (AM08/AM10, TASK-FE-036-118, ONDA 3 sub-onda 3a) — abre o Drawer
// que consome o módulo COMPARTILHADO de baixa manual (`WriteOffCreateModal`/
// `WriteOffActiveList`, `segment='expenses'`); o disclosure do Drawer e o
// cálculo de `canWriteOff` (AM08 `balance>0 && (payment_type∉{4,5} || sem
// baixa ativa)` OU AM10 `balance!==amount && payment_type∉{4,5}`) vivem em
// `index.tsx` — este menu só repassa o clique via `onWriteOff`, mirror
// `IncomeActionsMenu.tsx` (AM09).
//
// "Documentos" (AM05, TASK-FE-036-120, ONDA 3 sub-onda 3c) — abre o Drawer
// que consome o `DocumentPanel` COMPARTILHADO (`segment='expenses'`,
// Tarefa 338); o disclosure do Drawer, o `segment` e as 3 permissões
// DEDICADAS (`canUpload`/`canDelete` repassadas ao próprio `DocumentPanel`)
// vivem em `index.tsx` — este menu só repassa o clique via `onDocuments`,
// gateado por `canViewDocuments` (`expensedocument_view`, NUNCA
// `expenses_edit`/`expenses_view` — permissão DEDICADA e INDEPENDENTE das
// demais deste menu, mirror `IncomeActionsMenu.tsx` AM06).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
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

export interface ExpenseActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  /** B-12 (TASK-FE-036-B12-CAP) — mesmo gate de "Visualizar"
   *  (`expenses_view`, leitura de documento). Backend também é a 2ª
   *  barreira real (`permission:expenses_view`). */
  canGenerateReceipt: boolean;
  onGenerateReceipt: () => void;
  isGeneratingReceipt?: boolean;
  /** AM12 — `true` quando a linha é Adiantamento (`payment_type===4`). */
  editDisabled?: boolean;
  /** Hint exibido no tooltip quando `editDisabled=true`. */
  editDisabledReason?: string;
  /** AM13/SE07 — `true` quando a linha já tem baixa (`hasExpenseMoved`). */
  deleteDisabled?: boolean;
  /** Hint exibido no tooltip quando `deleteDisabled=true` (não some durante
   *  `isDeleting`, que é só o loading transitório da mutation). */
  deleteDisabledReason?: string;
  /** AM08/AM10 — `true` quando ao menos UMA das duas operações de baixa
   *  (nova baixa OU cancelar baixa ativa) é possível para a linha; oculta a
   *  ação inteira quando nenhuma vale (mirror do legado, que também some com
   *  o botão nesse caso). */
  canWriteOff: boolean;
  onWriteOff: () => void;
  /** AM05 (TASK-FE-036-120) — permissão DEDICADA `expensedocument_view`,
   *  domínio de permissão INDEPENDENTE de `canView`/`canEdit`/`canDelete`
   *  deste mesmo menu (um usuário pode ver/editar o título e não ter
   *  permissão de documentos, ou vice-versa). */
  canViewDocuments: boolean;
  onDocuments: () => void;
  /** AM11 (TASK-FE-036-122, B-11) — gateado por `expenses_create` (busca o
   *  draft e cria um NOVO título, mirror da permissão real do backend,
   *  `expenses_create` no middleware de `duplicate`). SEM confirmação —
   *  nada é persistido pelo clique (mirror do racional de `onWriteOff`, que
   *  também não é destrutivo). */
  canDuplicate: boolean;
  onDuplicate: () => void;
  isDuplicating?: boolean;
  labels: {
    view: string;
    edit: string;
    delete: string;
    /** "Baixas Ativas" (`languageGB.writeOff.list.title`, namespace
     *  COMPARTILHADO — reaproveitado aqui, nenhuma chave nova de idioma). */
    writeOff: string;
    /** AM05 (TASK-FE-036-120) — item de menu "Documentos". */
    documents: string;
    /** AM11 (TASK-FE-036-122) — item de menu "Duplicar". */
    duplicate: string;
    /** B-12 (TASK-FE-036-B12-CAP) — item de menu "Gerar Recibo". */
    receipt: string;
  };
}

export function ExpenseActionsMenu({
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  editDisabled = false,
  editDisabledReason,
  deleteDisabled = false,
  deleteDisabledReason,
  canWriteOff,
  onWriteOff,
  canViewDocuments,
  onDocuments,
  canDuplicate,
  onDuplicate,
  isDuplicating = false,
  canGenerateReceipt,
  onGenerateReceipt,
  isGeneratingReceipt = false,
  labels,
}: ExpenseActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canGenerateReceipt && (
        <Actions.Item
          icon={<Icon as={FiDownload} />}
          onClick={onGenerateReceipt}
          disabled={isGeneratingReceipt}
        >
          {labels.receipt}
        </Actions.Item>
      )}
      {canEdit && (
        <Actions.Item
          icon={<Icon as={FiEdit} />}
          onClick={onEdit}
          disabled={editDisabled}
          disabledReason={editDisabled ? editDisabledReason : undefined}
        >
          {labels.edit}
        </Actions.Item>
      )}
      {canWriteOff && (
        <Actions.Item icon={<Icon as={FiDollarSign} />} onClick={onWriteOff}>
          {labels.writeOff}
        </Actions.Item>
      )}
      {canViewDocuments && (
        <Actions.Item icon={<Icon as={FiPaperclip} />} onClick={onDocuments}>
          {labels.documents}
        </Actions.Item>
      )}
      {canDuplicate && (
        <Actions.Item icon={<Icon as={FiCopy} />} onClick={onDuplicate} disabled={isDuplicating}>
          {labels.duplicate}
        </Actions.Item>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={onDelete}
            disabled={isDeleting || deleteDisabled}
            disabledReason={!isDeleting && deleteDisabled ? deleteDisabledReason : undefined}
          >
            {labels.delete}
          </Actions.Item>
        </>
      )}
    </Actions>
  );
}
