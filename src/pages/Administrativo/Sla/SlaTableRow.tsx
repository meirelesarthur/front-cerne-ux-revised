// src/pages/Administrativo/Sla/SlaTableRow.tsx
// -----------------------------------------------------------------------------
// Linha da listagem de Parâmetros SLA (TASK-FE-SLA-01) — mirror extração de
// `AccountingGrouperTreeRow.tsx`, adaptado à edição inline de UM campo
// (`max_hours`), 1 linha em modo edição por vez (controlado pelo pai,
// `index.tsx`, via `editingUuid`).
//
// Divergência deliberada do padrão mais comum do projeto (contrato de tela
// §Leitura do dev, "Decisões do Arquiteto" item 3): ação "Editar" como
// `IconButtonTable` DIRETO (`FiEdit`), NÃO dentro do menu `Actions`/
// `Actions.Item` — há APENAS 1 ação por linha em modo leitura (sem
// Excluir/Duplicar) e ela alterna um ESTADO local, não navega/abre modal, um
// menu de 1 item adicionaria um clique sem benefício. Em modo edição, os 2
// novos ícones (Salvar `FiCheck` / Cancelar `FiX`) seguem o mesmo racional.
//
// `IconButtonTable` (não o `IconButton` cru do Chakra) — wrapper já em uso no
// projeto para ícones de ação dentro de listagens tabulares (`Tooltip` +
// `fontSize`/`height` padronizados, ver `CreateOrUpdateCentroCusto.tsx`).
//
// Isolamento do `useForm` local: em vez de chamar `useForm` incondicionalmente
// neste componente (que viveria sempre montado, leitura E edição), o modo de
// edição é delegado a `SlaEditingCells` — um subcomponente que só MONTA
// quando `isEditing` é `true`. Isso dá o mesmo resultado do Roteiro
// (`defaultValues: { max_hours: item.max_hours }` sempre fresco ao entrar em
// edição) sem precisar de um `useEffect` de sincronização manual — ao
// cancelar/salvar, o pai troca `editingUuid` e este subcomponente desmonta,
// descartando o estado do RHF automaticamente junto.
// -----------------------------------------------------------------------------

import { Flex, Icon, Table } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiCheck, FiEdit, FiX } from 'react-icons/fi';

import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { supplyStatusSlaSchemaResolver } from '@/validations/schemas/SupplyStatusSlas/supply-status-sla-schema';

import type { SupplyStatusSlaListItem } from '@/@types/v2/SupplyStatusSlas';

import { StatusTag } from '@/components/ui/StatusTag';

import { slaStatusDotToken } from './slaStatusDot';

export interface SlaTableRowProps {
  item: SupplyStatusSlaListItem;
  isEditing: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onEditClick: () => void;
  onSave: (uuid: string, maxHours: number) => void;
  onCancel: () => void;
}

export function SlaTableRow({
  item,
  isEditing,
  canEdit,
  isSaving,
  onEditClick,
  onSave,
  onCancel,
}: SlaTableRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyStatusSlas.supplyStatusSla;
  const statusColor = slaStatusDotToken(item.status);

  return (
    <Table.Row borderBottom="1px solid" borderColor="borderGrid">
      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <StatusTag label={item.status_label} color={statusColor ?? undefined} />
      </Table.Cell>

      {isEditing ? (
        <SlaEditingCells item={item} isSaving={isSaving} onSave={onSave} onCancel={onCancel} />
      ) : (
        <>
          <Table.Cell
            borderBottom="1px solid"
            borderColor="borderGrid"
            paddingY="10px"
            paddingX="4"
          >
            {item.max_hours}h
          </Table.Cell>
          <Table.Cell
            borderBottom="1px solid"
            borderColor="borderGrid"
            paddingY="10px"
            paddingX="4"
          >
            <Flex justify="flex-end">
              {canEdit && (
                <IconButtonTable
                  aria-label={text.list.table.actions.edit}
                  mensegerTooltip={text.list.table.actions.edit}
                  size="sm"
                  variant="ghost"
                  onClick={onEditClick}
                >
                  <Icon as={FiEdit} />
                </IconButtonTable>
              )}
            </Flex>
          </Table.Cell>
        </>
      )}
    </Table.Row>
  );
}

interface SlaEditingCellsProps {
  item: SupplyStatusSlaListItem;
  isSaving: boolean;
  onSave: (uuid: string, maxHours: number) => void;
  onCancel: () => void;
}

// Só existe montado enquanto a linha está em modo edição — ver nota de topo
// do arquivo (isolamento do `useForm` local, sem violar a regra dos hooks).
function SlaEditingCells({ item, isSaving, onSave, onCancel }: SlaEditingCellsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyStatusSlas.supplyStatusSla;

  const { control, handleSubmit } = useForm<{ max_hours: number }>({
    resolver: supplyStatusSlaSchemaResolver(languageGB),
    defaultValues: { max_hours: item.max_hours },
  });

  function onSubmit(data: { max_hours: number }) {
    onSave(item.uuid, data.max_hours);
  }

  return (
    <>
      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="6px" paddingX="4">
        <Controller
          name="max_hours"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              name={field.name}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              allowDot={false}
              min={0}
              error={error?.message}
              disabled={isSaving}
            />
          )}
        />
      </Table.Cell>
      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Flex justify="flex-end" gap={1}>
          <IconButtonTable
            aria-label={text.list.table.actions.save}
            mensegerTooltip={text.list.table.actions.save}
            size="sm"
            variant="ghost"
            colorPalette="green"
            onClick={handleSubmit(onSubmit)}
            loading={isSaving}
          >
            <Icon as={FiCheck} />
          </IconButtonTable>
          <IconButtonTable
            aria-label={text.list.table.actions.cancel}
            mensegerTooltip={text.list.table.actions.cancel}
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={onCancel}
            disabled={isSaving}
          >
            <Icon as={FiX} />
          </IconButtonTable>
        </Flex>
      </Table.Cell>
    </>
  );
}
