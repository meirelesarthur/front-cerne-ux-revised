// src/pages/Fiscal/ArquivosXml/XmlDocumentGroup.tsx
// -----------------------------------------------------------------------------
// Seção de UM grupo (tipo de documento) da listagem agregada de Arquivos XML
// (F-133, esteira 97-Esteiras/008, Tarefa 36). Componente PURO — sem query
// própria, recebe o `group` já resolvido pelo pai. Mirror `Table.Root`/
// `Table.Header`/`Table.Body` de `Fiscal/NfeEmitidas/NfeDetalhe.tsx:448-477`
// + `Table.Footer` (único do fork) de
// `Administrativo/BaixaEstoque/BaixaEstoqueDetalhe.tsx:300-312` (mecanismo do
// subtotal por grupo).
//
// 6 colunas (5 fixas de `spa-contract-arquivos-xml.md §5.4` + coluna 0 de
// seleção da Tarefa 37) — NENHUM header clicável, NENHUMA ordenação
// client-side (a API não aceita `orderBy`). `nsu` NÃO vira coluna (não era
// exibido no legado).
//
// Seleção (Tarefa 37, `spa-contract-arquivos-xml.md §3.3`/AD-F06): chave
// composta `${type}:${uuid}` (`XmlSelectionKey`, exportado abaixo — 4 tabelas
// distintas na projeção, `uuid` isolado não é único entre ramos). Estado
// controlado no PAI (`index.tsx`, AD-F10 — sem `TableProvider` nesta tela);
// este componente é PURO, só recebe `selectedKeys`/callbacks/`isSelectable`.
// MDFe/DFe (GAP-XML-03 Opção A/DEC-037) continuam listados e somados — só a
// linha/checkbox fica `disabled`, com `Tooltip` explicando o motivo.
// -----------------------------------------------------------------------------

import { Badge, Box, Table, Text } from '@chakra-ui/react';

import { Tooltip } from '@/components/TooLtip';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { xmlDocumentStateColorPalette } from '@/constants/Fiscal/xml-document/xml-document-state';

import type {
  XmlDocumentExportItem,
  XmlDocumentGroupData,
  XmlDocumentType,
} from '@/@types/v2/Fiscal/xml-document';

// `${type}:${uuid}` — chave composta de seleção (item 1/armadilha 4 da
// Tarefa 37). Único ponto de declaração deste tipo — `index.tsx` importa
// daqui (o estado de seleção mora lá, esta tela só é a projeção pura).
export type XmlSelectionKey = `${XmlDocumentType}:${string}`;

export interface XmlDocumentGroupProps {
  group: XmlDocumentGroupData;
  selectedKeys: Record<XmlSelectionKey, XmlDocumentExportItem>;
  onToggleItem: (item: XmlDocumentExportItem) => void;
  onToggleGroup: (group: XmlDocumentGroupData, checked: boolean) => void;
  // GAP-XML-03 (Opção A) / DEC-037 — decisão do dono, declarada em ÚNICO
  // ponto no pai (`index.tsx`): MDFe/DFe ainda não têm XML resolvido nesta
  // fatia. Recebida como prop para este componente permanecer puro.
  isSelectable: (type: XmlDocumentType) => boolean;
}

export function XmlDocumentGroup({
  group,
  selectedKeys,
  onToggleItem,
  onToggleGroup,
  isSelectable,
}: XmlDocumentGroupProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.xmlDocuments;

  const groupSelectable = isSelectable(group.document_type);
  const eligibleItems = group.items.filter((item) => isSelectable(item.document_type));
  const allSelected =
    eligibleItems.length > 0 &&
    eligibleItems.every((item) => Boolean(selectedKeys[`${item.document_type}:${item.uuid}`]));
  const someSelected = eligibleItems.some((item) =>
    Boolean(selectedKeys[`${item.document_type}:${item.uuid}`])
  );

  async function handleCopyChave(chave: string | null) {
    if (!chave) return;
    try {
      await navigator.clipboard.writeText(chave);
      toaster.success({ description: text.copiedKeyLabel });
    } catch {
      // Ambiente sem `navigator.clipboard` (HTTP não-seguro/permissão
      // negada) — sem crash, feedback honesto ao usuário (SEM MOCK).
      toaster.error({ description: text.copyKeyError });
    }
  }

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Text fontSize="sm" fontWeight="semibold" color="fg.default">
          {group.document_label} —{' '}
          {text.list.groupFooterCount.replace('{{count}}', String(group.count))}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color="fg.default">
          {formatCurrencyBRL(group.subtotal)}
        </Text>
      </Box>

      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader width="1">
                <Tooltip
                  label={text.actions.notExportableReason}
                  content={text.actions.notExportableReason}
                  disabled={groupSelectable}
                >
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => onToggleGroup(group, !allSelected)}
                    disabled={!groupSelectable}
                    aria-label={text.actions.selectAllInGroup}
                  />
                </Tooltip>
              </Table.ColumnHeader>
              <Table.ColumnHeader>{text.list.table.counterpartyName}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.list.table.chave}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">{text.list.table.amount}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">{text.list.table.state}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.list.table.emittedAt}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {group.items.map((item) => {
              const itemSelectable = isSelectable(item.document_type);
              const itemKey: XmlSelectionKey = `${item.document_type}:${item.uuid}`;

              return (
                <Table.Row key={itemKey}>
                  <Table.Cell>
                    <Tooltip
                      label={text.actions.notExportableReason}
                      content={text.actions.notExportableReason}
                      disabled={itemSelectable}
                    >
                      <Checkbox
                        checked={Boolean(selectedKeys[itemKey])}
                        onCheckedChange={() =>
                          onToggleItem({ type: item.document_type, uuid: item.uuid })
                        }
                        disabled={!itemSelectable}
                        aria-label={item.chave ?? itemKey}
                      />
                    </Tooltip>
                  </Table.Cell>
                  <Table.Cell>{item.counterparty_name ?? '--'}</Table.Cell>
                  <Table.Cell>
                    {item.chave ? (
                      <Tooltip label={item.chave} content={item.chave}>
                        <Text
                          as="span"
                          cursor="pointer"
                          color="brandColorText"
                          textDecoration="underline"
                          onClick={() => handleCopyChave(item.chave)}
                        >
                          {item.chave}
                        </Text>
                      </Tooltip>
                    ) : (
                      '--'
                    )}
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {formatCurrencyBRL(item.amount)}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Badge colorPalette={xmlDocumentStateColorPalette(item.state)} variant="subtle">
                      {item.state?.toUpperCase() ?? '--'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {item.emitted_at ? formatDate(item.emitted_at, 'dd/MM/yyyy HH:mm') : '--'}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Cell />
              <Table.Cell fontWeight="semibold">
                {text.list.groupFooterCount.replace('{{count}}', String(group.count))}
              </Table.Cell>
              <Table.Cell />
              <Table.Cell textAlign="end" fontWeight="semibold" fontVariantNumeric="tabular-nums">
                {formatCurrencyBRL(group.subtotal)}
              </Table.Cell>
              <Table.Cell />
              <Table.Cell />
            </Table.Row>
          </Table.Footer>
        </Table.Root>
      </Box>
    </Box>
  );
}
