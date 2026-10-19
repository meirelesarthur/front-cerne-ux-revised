// src/pages/Operacional/PesagemRodoviaria/DfeEligibleList.tsx
// -----------------------------------------------------------------------------
// Lista de DFe elegível para vínculo na Finalização (FE-SCR-04,
// TASK-MWG-FE-07) — só renderizada quando `type=CompraEntrada` E
// `dfe_lookup_unavailable=false`. Estado vazio EXPLÍCITO quando
// `dfe_lookup_unavailable=true` (GAP-PES-08) — nunca fallback silencioso
// nem seção escondida sem explicação.
// -----------------------------------------------------------------------------

import { EmptyState, Icon, Table as ChakraTable, VStack } from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { ModuleWeighingEligibleDfe } from '@/@types/v2/ModuleWeighing/module-weighing';

export interface DfeEligibleListProps {
  dfeLookupUnavailable: boolean;
  eligibleDfes: ModuleWeighingEligibleDfe[];
  selectedDfeUuid: string | null;
  onSelect: (uuid: string) => void;
  labels: {
    title: string;
    emptyUnavailable: string;
    number: string;
    issuer: string;
    issueDate: string;
    select: string;
  };
}

export function DfeEligibleList({
  dfeLookupUnavailable,
  eligibleDfes,
  selectedDfeUuid,
  onSelect,
  labels,
}: DfeEligibleListProps) {
  if (dfeLookupUnavailable) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Icon as={FiFileText} boxSize={8} color="fg.muted" />
          </EmptyState.Indicator>
          <VStack textAlign="center" gap={1}>
            <EmptyState.Title>{labels.title}</EmptyState.Title>
            <EmptyState.Description>{labels.emptyUnavailable}</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    );
  }

  if (eligibleDfes.length === 0) return null;

  return (
    <ChakraTable.Root size="sm">
      <ChakraTable.Header>
        <ChakraTable.Row>
          <ChakraTable.ColumnHeader>{labels.number}</ChakraTable.ColumnHeader>
          <ChakraTable.ColumnHeader>{labels.issuer}</ChakraTable.ColumnHeader>
          <ChakraTable.ColumnHeader>{labels.issueDate}</ChakraTable.ColumnHeader>
          <ChakraTable.ColumnHeader />
        </ChakraTable.Row>
      </ChakraTable.Header>
      <ChakraTable.Body>
        {eligibleDfes.map((dfe) => (
          <ChakraTable.Row key={dfe.uuid}>
            <ChakraTable.Cell>{dfe.number ?? '-'}</ChakraTable.Cell>
            <ChakraTable.Cell>{dfe.issuer_name ?? '-'}</ChakraTable.Cell>
            <ChakraTable.Cell>{dfe.issue_date ?? '-'}</ChakraTable.Cell>
            <ChakraTable.Cell>
              <Button
                type="button"
                size="xs"
                variant={selectedDfeUuid === dfe.uuid ? 'solid' : 'outline'}
                title={labels.select}
                onClick={() => onSelect(dfe.uuid)}
              />
            </ChakraTable.Cell>
          </ChakraTable.Row>
        ))}
      </ChakraTable.Body>
    </ChakraTable.Root>
  );
}

export default DfeEligibleList;
