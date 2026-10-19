// src/pages/Operacional/MyServiceOrders/MyServiceOrderChecklistTab.tsx
// -----------------------------------------------------------------------------
// Componente GENÉRICO de aba de checklist editável — esteira 063
// (TASK-MOS-FE-06). Reutilizado pelas 5 abas do form de execução (Mão de
// Obra/Equipamentos/Insumos/Produção/Proteções, TASK-MOS-FE-05, fora desta
// wave — este arquivo é STANDALONE, ainda não montado em nenhum form).
//
// Combinação de 2 padrões já existentes (contrato de tela §3):
//   - Estrutura de tabela de `ServiceOrderDetalhe.tsx` (tabela dentro de
//     `Tabs.Content`, estado vazio com mensagem) — mas EDITÁVEL aqui.
//   - Mecanismo de toggle por array de ids (NÃO `useFieldArray` — a lista de
//     linhas é FIXA, vem da query `MyServiceOrderDetail.{bloco}[]`; só o
//     `is_checked` muda). Cada linha usa `Controller` + `ui/Checkbox`
//     (`onCheckedChange`) que adiciona/remove `line.id` do array do form
//     correspondente (`*_checked_ids: number[]`).
//
// `label` já vem RESOLVIDO pelo backend (`resolveEmployeeLineLabel`/
// `resolveProductLineLabel`, RN-08) — este componente NUNCA recalcula nome,
// só exibe. `id` é a PK interna do pivot (handle de toggle, nunca vira
// rota/URL).
// -----------------------------------------------------------------------------

import { Box, Table, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';

import type {
  MyServiceOrderChecklistLine,
  MyServiceOrderExecutionForm,
} from '@/@types/v2/MyServiceOrders';

import type { Control } from 'react-hook-form';

/** Nome dos 5 campos array de ids marcados do form de execução (FLD-26..32,
 *  mirror 1:1 `MyServiceOrderExecutionRequest::rules()`). */
export type MyServiceOrderChecklistFieldName =
  | 'employees_checked_ids'
  | 'equipments_checked_ids'
  | 'products_checked_ids'
  | 'productions_checked_ids'
  | 'protections_checked_ids';

export interface MyServiceOrderChecklistTabProps {
  /** Linhas fixas do bloco (dado da QUERY, não do form) — nunca `useFieldArray`. */
  lines: MyServiceOrderChecklistLine[];
  control: Control<MyServiceOrderExecutionForm>;
  /** Nome do array de ids marcados correspondente a este bloco. */
  name: MyServiceOrderChecklistFieldName;
  /** Mensagem exibida quando `lines` está vazio (i18n — `form.checklist.emptyRow`). */
  emptyLabel: string;
  /** Rótulo da coluna do id marcado (i18n — `form.checklist.isChecked`). */
  isCheckedLabel: string;
  /** Rótulo da coluna do item (i18n — `form.checklist.itemLabel`). */
  itemLabel: string;
  isDisabled?: boolean;
}

export function MyServiceOrderChecklistTab({
  lines,
  control,
  name,
  emptyLabel,
  isCheckedLabel,
  itemLabel,
  isDisabled = false,
}: MyServiceOrderChecklistTabProps) {
  if (lines.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" py={4}>
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Box overflowX="auto">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{itemLabel}</Table.ColumnHeader>
            <Table.ColumnHeader>{isCheckedLabel}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Controller
            name={name}
            control={control}
            render={({ field }) => {
              const checkedIds: number[] = field.value ?? [];

              function toggle(id: number, checked: boolean) {
                if (checked) {
                  field.onChange([...checkedIds, id]);
                } else {
                  field.onChange(checkedIds.filter((checkedId) => checkedId !== id));
                }
              }

              return (
                <>
                  {lines.map((line) => (
                    <Table.Row key={line.id}>
                      <Table.Cell>
                        <Text fontSize="sm">{line.label ?? '—'}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Checkbox
                          checked={checkedIds.includes(line.id)}
                          disabled={isDisabled}
                          onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                            toggle(line.id, details.checked === true)
                          }
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </>
              );
            }}
          />
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
