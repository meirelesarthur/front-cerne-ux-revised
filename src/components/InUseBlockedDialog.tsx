// src/components/InUseBlockedDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo GENÉRICO de aviso quando uma exclusão é BLOQUEADA pelo 422
// estruturado `errors.in_use` (ver `extractInUseItems` em
// `@/utils/extractApiErrorMessage.ts`). Extraído 1:1 da casca visual/
// comportamental de `AddressingInUseDialog.tsx` (o mais completo e
// representativo dos ~12 diálogos hoje duplicados por módulo), parametrizando
// o que antes era fixo por módulo (título/descrição/template/dicionário de
// rótulo/itens). Ver
// `CORE_WORKSPACE/97-Esteiras/004/CONTRATOS/FRONT-03-InUseBlockedDialog.md`.
//
// Decisão de rótulo (Estratégia C do contrato): este componente NÃO embute
// nenhum mapa `table -> label`. O `resource` cru devolvido pelo backend é
// IGNORADO deliberadamente — string PT-BR hardcoded no PHP (Achado crítico do
// contrato), não confiável para i18n. Cada chamador injeta seu próprio
// `getResourceLabel(table)` (dicionário por módulo, mesmo padrão já usado em
// Fodder/Grazing/ParameterWeight — `fodder-in-use-table-labels.ts`), com
// fallback defensivo simples (`?? table`) por conta do chamador.
//
// Padronizado sobre `CustomDialog` (EST-07/esteira 006), mesmo precedente já
// aplicado em `DeleteConfirmDialog.tsx` — herda `bg cardBG`, divisor no
// header/footer e footer com gap padrão. 100% da API pública preservada
// (nenhum callsite muda). Continua sendo um estado de AVISO/bloqueio (sem
// ação de confirmar exclusão) — só o botão "Fechar" no footer.
// -----------------------------------------------------------------------------

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';

export interface InUseBlockedItem {
  table: string;
  count: number;
}

export interface InUseBlockedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** i18n já resolvido pelo chamador (ex.: languageGB.xxx.deleteBlocked.title). */
  title: string;
  /** i18n já resolvido pelo chamador (ex.: languageGB.xxx.deleteBlocked.description). */
  description: string;
  itemName?: string;
  items: InUseBlockedItem[] | null;
  /** Label do botão "Fechar" — resolvido pelo chamador (ex.: languageGB.defaltStrings.close). */
  closeLabel: string;
  /** Template i18n do chamador, ex. '{count} vínculo(s) em {resource}' —
   *  placeholders literais `{count}` e `{resource}` substituídos via
   *  `.replace()` (sem lib de interpolação no projeto). */
  resourceLabelTemplate: string;
  /** Dicionário por módulo (table -> label traduzido) — recomendado com
   *  fallback defensivo `?? table` como último recurso. */
  getResourceLabel: (table: string) => string;
}

export function InUseBlockedDialog({
  isOpen,
  onClose,
  title,
  description,
  itemName,
  items,
  closeLabel,
  resourceLabelTemplate,
  getResourceLabel,
}: InUseBlockedDialogProps) {
  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      minW="min(440px, 92vw)"
      title={title}
      titleIcon={FiAlertTriangle}
      titleIconColor="feedBack.warnMain"
      footer={<Button title={closeLabel} variant="outline" onClick={onClose} />}
    >
      <Text py={1}>
        {description}
        {itemName && (
          <>
            {': '}
            <Text as="span" fontWeight="bold">
              {itemName}
            </Text>
          </>
        )}
        .
      </Text>

      <VStack align="stretch" gap={2} mt={4}>
        {(items ?? []).map((item) => (
          <Flex key={item.table} align="center" gap={2}>
            <Box boxSize="6px" borderRadius="full" bg="feedBack.warnMain" flexShrink={0} />
            <Text fontSize="sm" color="fg.muted">
              {resourceLabelTemplate
                .replace('{count}', String(item.count))
                .replace('{resource}', getResourceLabel(item.table))}
            </Text>
          </Flex>
        ))}
      </VStack>
    </CustomDialog>
  );
}
