// src/pages/Operacional/PesagemRodoviaria/ModuleWeighingReceipt.tsx
// -----------------------------------------------------------------------------
// Comprovante/visualização printable (FE-SCR-05, TASK-MWG-FE-08) — rota
// `/operacional/pesagem-rodoviaria/:uuid` (`module-weighing_view`).
//
// `GET show` (RT-004) NÃO gera PDF no servidor nesta migração — decisão de
// arquitetura FE (`CONTRATO-TELA-PESAGEM-FE §5`): visualização on-screen
// "printable" (layout dedicado + `window.print()`), mesmo conteúdo do
// legado (peso bruto/tara/líquido, desconto, custos, histórico — `LM-019`/
// `LM-039`/`CV-007`), forma de entrega diferente (não é download de PDF).
//
// `@media print` força paleta clara (o layout impresso deve ser sempre
// claro/legível independente do tema ativo) e esconde a navegação/header
// do app — mirror `InvoiceDetalhe.tsx`/`NfeDetalhe.tsx`.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Skeleton,
  Table as ChakraTable,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiFileText, FiPrinter } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import { moduleWeighingStatusOptions } from '@/constants/ModuleWeighing/options/module-weighing-status-options';
import { queryKey } from '@/constants/query-key';

import { getModuleWeighingById } from '@/services/v2/ModuleWeighing/module-weighing-service';

import type { ModuleWeighingStatus } from '@/@types/v2/ModuleWeighing/module-weighing';

export default function ModuleWeighingReceipt() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing;

  const detailQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, uuid],
    queryFn: async () => (await getModuleWeighingById(uuid!)).data,
    enabled: !!uuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const item = detailQuery.data;
  const isLoading = detailQuery.isPending;

  if (!isLoading && (detailQuery.isError || !item)) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex justify="center" py={16}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiFileText} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.backAction}
                variant="outline"
                size="sm"
                onClick={() => navigate('/operacional/pesagem-rodoviaria')}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // Peso líquido — exibido com a mesma normalização que a API já corrige
  // para `type=Avulsa` invertido (`DV-014`); o front só exibe o que a API
  // devolve, não reimplementa a correção.
  const netWeight =
    item?.gross_weight != null && item?.tare_weight != null
      ? item.gross_weight - item.tare_weight
      : (item?.final_weight ?? null);

  return (
    <FormContainer
      title={item ? `${text.singularLabel} — ${item.code}` : text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0} className="module-weighing-receipt-actions">
            <Button
              title={text.detail.printButton}
              icon={FiPrinter as ElementType}
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            />
          </Flex>
        )
      }
    >
      <style>
        {`@media print {
          .module-weighing-receipt-actions { display: none !important; }
          .module-weighing-receipt-content { background: white !important; color: black !important; }
        }`}
      </style>

      {isLoading ? (
        <Skeleton height="300px" borderRadius="md" />
      ) : (
        <Box className="module-weighing-receipt-content" px={{ base: 4, md: 10 }} pb={8}>
          <VStack align="flex-start" gap={2} mb={6}>
            <Text>
              {text.detail.fields.code}: {item!.code}
            </Text>
            <Text>
              {text.detail.fields.date}: {item!.date}
            </Text>
            <Text>
              {text.detail.fields.product}: {item!.product?.description ?? '-'}
            </Text>
            <Text>
              {text.list.table.status}:{' '}
              {/* Correção 050 (BUG-10) — mesma causa-raiz de BUG-4/5: `status`
                  chega como STRING backed-enum da API (`getModuleWeighingById`
                  não normaliza), e `getLabel` usa `Map.get` (chave tipada,
                  sem coerção implícita) — Number(...) na fronteira de
                  consumo, mesma técnica do BUG-10 na listagem. */}
              {moduleWeighingStatusOptions.getLabel(
                Number(item!.status) as ModuleWeighingStatus,
                languageGB
              )}
            </Text>
          </VStack>

          <VStack align="flex-start" gap={2} mb={6}>
            <Text>
              {text.detail.fields.grossWeight}: {item!.gross_weight ?? '-'} kg
            </Text>
            <Text>
              {text.detail.fields.tareWeight}: {item!.tare_weight ?? '-'} kg
            </Text>
            <Text fontWeight="bold">
              {text.detail.fields.netWeight}: {netWeight ?? '-'} kg
            </Text>
            <Text>
              {text.detail.fields.measurement}: {item!.measurement?.description ?? '-'}
            </Text>
            <Text>
              {text.detail.fields.discount}: {item!.classification_discount ?? '-'}
            </Text>
            <Text>
              {text.detail.fields.averageCost}: {item!.average_cost ?? '-'}
            </Text>
            <Text fontWeight="bold">
              {text.detail.fields.total}: {item!.total ?? '-'}
            </Text>
          </VStack>

          {item!.movements.length > 0 && (
            <>
              <Text fontWeight="medium" mb={2}>
                {text.detail.history.title}
              </Text>
              <ChakraTable.Root size="sm">
                <ChakraTable.Header>
                  <ChakraTable.Row>
                    <ChakraTable.ColumnHeader>
                      {text.detail.history.datetime}
                    </ChakraTable.ColumnHeader>
                    <ChakraTable.ColumnHeader>
                      {text.detail.history.status}
                    </ChakraTable.ColumnHeader>
                    <ChakraTable.ColumnHeader>
                      {text.detail.history.inputType}
                    </ChakraTable.ColumnHeader>
                  </ChakraTable.Row>
                </ChakraTable.Header>
                <ChakraTable.Body>
                  {item!.movements.map((movement) => (
                    <ChakraTable.Row key={movement.uuid}>
                      <ChakraTable.Cell>{movement.datetime}</ChakraTable.Cell>
                      <ChakraTable.Cell>
                        {moduleWeighingStatusOptions.getLabel(
                          Number(movement.status) as ModuleWeighingStatus,
                          languageGB
                        )}
                      </ChakraTable.Cell>
                      <ChakraTable.Cell>
                        {movement.input_type === 'A'
                          ? text.detail.history.inputTypeAuto
                          : text.detail.history.inputTypeManual}
                      </ChakraTable.Cell>
                    </ChakraTable.Row>
                  ))}
                </ChakraTable.Body>
              </ChakraTable.Root>
            </>
          )}
        </Box>
      )}
    </FormContainer>
  );
}
