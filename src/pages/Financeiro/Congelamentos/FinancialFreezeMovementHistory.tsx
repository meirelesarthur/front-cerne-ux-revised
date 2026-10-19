// src/pages/Financeiro/Congelamentos/FinancialFreezeMovementHistory.tsx
// -----------------------------------------------------------------------------
// Bloco de UI "Histórico de Movimentações" do formulário único de Congelamento
// Financeiro (FinancialFreeze — F-110, esteira 97-Esteiras/008, Tarefa 32).
// Mirror EXATO de `Administrativo/Solicitacao/RequestMovementHistory.tsx`:
// componente puro `{ movements }`, 100% READ-ONLY, sem query própria, sem
// `Controller`/`useFieldArray`.
//
// Sem endpoint próprio — `movements[]` já vem embutido no
// `GET /financial-freezes/{uuid}` (`FinancialFreezeDetail.movements`,
// contrato de tela §6/§8). NUNCA montado a partir da resposta do `POST`
// (o `CreateFinancialFreezeAction` só carrega `user.people` — armadilha
// confirmada #1 da Tarefa 32).
//
// Ordem: como vem do servidor (cronológica ascendente, sem `orderBy` no
// Repository) — não reordenar no cliente. Renderizado dentro de um
// `FormSection` pelo formulário-pai (não é aba — decisão FID-G3F §3,
// superfície 7: 3 campos não justificam `Tabs`).
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { financialFreezeStatusColor } from '@/constants/Financial/FinancialFreeze/financial-freeze-status';
import { boolean as booleanOptions } from '@/constants/options/boolean';

import type { FinancialFreezeMovementRow } from '@/@types/v2/FinancialFreeze';

export interface FinancialFreezeMovementHistoryProps {
  movements: FinancialFreezeMovementRow[];
}

export function FinancialFreezeMovementHistory({ movements }: FinancialFreezeMovementHistoryProps) {
  const { languageGB } = useLanguage();
  const historyText = languageGB.financial.financialFreeze.form.historySection;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      {movements.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {historyText.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={0}>
          <Flex
            gap={3}
            px={2}
            py={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
            display={{ base: 'none', md: 'flex' }}
          >
            <Box flex="1" minW="140px">
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                {historyText.columns.isFrozen}
              </Text>
            </Box>
            <Box flex="1" minW="160px">
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                {historyText.columns.responsible}
              </Text>
            </Box>
            <Box flex="1" minW="140px">
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                {historyText.columns.date}
              </Text>
            </Box>
          </Flex>

          {movements.map((movement, index) => (
            // AD-05 — trilha de auditoria read-only sem identificador próprio
            // (ver `@/@types/v2/FinancialFreeze`). A ordem é fixa/estável (vem
            // do servidor sem reordenação client-side), índice como key é
            // seguro aqui — mesma exceção já aceita quando a linha não tem uuid.
            <Flex
              key={`${movement.created_at}-${index}`}
              gap={3}
              px={2}
              py={3}
              borderBottom="1px solid"
              borderColor="border.subtle"
              wrap="wrap"
              align="center"
            >
              <Box flex="1" minW="140px">
                <Badge
                  colorPalette={financialFreezeStatusColor[String(movement.is_frozen)] ?? 'gray'}
                  variant="subtle"
                >
                  {booleanOptions.getLabel(movement.is_frozen, languageGB)}
                </Badge>
              </Box>
              <Box flex="1" minW="160px">
                <Text fontSize="sm">{movement.responsible_name ?? '—'}</Text>
              </Box>
              <Box flex="1" minW="140px">
                <Text fontSize="sm">{formatDate(movement.created_at, 'dd/MM/yyyy HH:mm')}</Text>
              </Box>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
}
