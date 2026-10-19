// src/pages/Invoices/InvoiceActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Invoice — Visualizar/Editar/
// Imprimir/Excluir. TASK-FE-2762.
//
// ⚠️ CORREÇÃO DE PREMISSA do planejamento: o packet desta Tarefa registrou
// "não há na SPA nenhum menu de ações (kebab) por linha hoje" e propôs
// desenhar `Menu.Root` do zero. Isso NÃO é verdade — `src/components/
// Action.tsx` (`Actions`/`Actions.Item`) JÁ É esse primitivo (kebab
// `BiDotsVerticalRounded`, `Menu.Root`/`Menu.Content` com `Portal`, tom
// `danger` para ações destrutivas) e já é usado com 3-4 itens por linha em
// `PlanAccount/index.tsx` (Ver subcontas/Editar/Ativar-Inativar/Excluir) e no
// header de várias grids. Este componente é só uma composição FINA sobre
// `Actions` (fidelidade ao padrão real, não invenção de um 2º primitivo de
// menu no fork) — reaproveitável entre a listagem e, se fizer sentido no
// futuro, a Visualização.
//
// Ações OMITIDAS nesta v1 (contrato-first, sem endpoint/Tarefa correspondente
// — mesma decisão para "Relatório Pagamento"/"Documentos"/"Gerar DANFE"/
// "Baixar XML" da spec-visual §3): nenhuma delas tem contrato de API na v1.0
// do `InvoiceRequest`/rotas reais. Menos ruído que deixá-las desabilitadas.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiPrinter, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface InvoiceActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  labels: {
    view: string;
    edit: string;
    print: string;
    delete: string;
  };
}

export function InvoiceActionsMenu({
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onPrint,
  onDelete,
  isDeleting = false,
  labels,
}: InvoiceActionsMenuProps) {
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
      {canView && (
        <Actions.Item icon={<Icon as={FiPrinter} />} onClick={onPrint}>
          {labels.print}
        </Actions.Item>
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
