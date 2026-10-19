// src/pages/Operacional/Marcacao/MarkingActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Marcação — 6 ações condicionais
// (`ACT-01..07` do contrato legado), mirror `WeaningActionsMenu.tsx`.
// Composição fina sobre `Actions`/`Actions.Item`.
//
//   - Ver: sempre, sob `markings_view`.
//   - Imprimir: sempre, sob `markings_view` (dispara `downloadMarkingReport`,
//     TASK-MC-FE-08, fora desta Tarefa).
//   - Editar: só `status===1` (Marcado), sob `markings_edit`.
//   - Prever: só `status!==3` (não Realizado), sob `markings_forecast` →
//     navega para a rota do subcadastro (TASK-MC-FE-05, fora desta Tarefa).
//   - Realizar: só `status===2` (Previsto), sob `markings_done` → navega
//     para a rota do subcadastro (TASK-MC-FE-06, fora desta Tarefa).
//   - Excluir: sempre (sem restrição de status), sob `markings_delete`.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiCalendar, FiCheckCircle, FiEdit, FiEye, FiPrinter, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

import type { MarkingStatusValue } from '@/constants/marcacao/marking/marking-status';

export interface MarkingActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canForecast: boolean;
  canDone: boolean;
  canDelete: boolean;
  status: MarkingStatusValue;
  isDeleting?: boolean;
  onView: () => void;
  onPrint: () => void;
  onEdit: () => void;
  onForecast: () => void;
  onDone: () => void;
  onDelete: () => void;
  labels: {
    view: string;
    print: string;
    edit: string;
    editDisabledTooltip: string;
    forecast: string;
    forecastDisabledTooltip: string;
    done: string;
    doneDisabledTooltip: string;
    delete: string;
  };
}

export function MarkingActionsMenu({
  canView,
  canEdit,
  canForecast,
  canDone,
  canDelete,
  status,
  isDeleting = false,
  onView,
  onPrint,
  onEdit,
  onForecast,
  onDone,
  onDelete,
  labels,
}: MarkingActionsMenuProps) {
  const canEditStatus = status === 1;
  const canForecastStatus = status !== 3;
  const canDoneStatus = status === 2;

  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canView && (
        <Actions.Item icon={<Icon as={FiPrinter} />} onClick={onPrint}>
          {labels.print}
        </Actions.Item>
      )}
      {canEdit && (
        <Tooltip
          content={labels.editDisabledTooltip}
          disabled={canEditStatus}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit} disabled={!canEditStatus}>
            {labels.edit}
          </Actions.Item>
        </Tooltip>
      )}
      {canForecast && (
        <Tooltip
          content={labels.forecastDisabledTooltip}
          disabled={canForecastStatus}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item
            icon={<Icon as={FiCalendar} />}
            onClick={onForecast}
            disabled={!canForecastStatus}
          >
            {labels.forecast}
          </Actions.Item>
        </Tooltip>
      )}
      {canDone && (
        <Tooltip
          content={labels.doneDisabledTooltip}
          disabled={canDoneStatus}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item
            icon={<Icon as={FiCheckCircle} />}
            onClick={onDone}
            disabled={!canDoneStatus}
          >
            {labels.done}
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
