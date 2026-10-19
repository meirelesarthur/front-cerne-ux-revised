// src/pages/Operacional/FechamentoSemana/ShowClosingWeek.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) do Fechamento Semana — TASK-FE-FS-03
// (contrato de tela §5, FID-G3F SR-04/SB-05/CV-06).
//
// Rota: `/operacional/fechamento-semana/:uuid`, guarda `closing_weeks_view`
// (`src/router/index.tsx`, registrada DEPOIS de `/novo` — contrato de
// especificidade, mirror `Carregamento`/`Romaneios`).
//
// Molde de código (sibling-first): `Operacional/Romaneios/RomaneioDetalhe.tsx`
// — sem `useForm`, seções via `InfoField`/`SectionTitle`, `checkLoadingStatus`,
// `EmptyState` de "não encontrado", footer só com "Voltar". Diferente de
// Romaneios, NENHUM satélite aqui é `{uuid}`-only: `ClosingWeekResource` já
// resolve `user.name` direto (DEC-FS-13, fecha OQ-07 — NUNCA `user.people
// .name`) e `ItemClosingWeekResource` já resolve `cultivation.name` direto —
// zero requests satélite adicionais.
//
// Campos confirmados contra `ClosingWeekResource`/`ItemClosingWeekResource`
// REAIS (`GB.Cerne.Api/app/Http/Resources/V1/`, leitura desta Tarefa):
//   ClosingWeekResource: uuid, code, date (YYYY-MM-DD), start_date, end_date,
//     week, user{uuid,name}|null, items[] (whenLoaded), created_at, updated_at.
//   ItemClosingWeekResource: uuid, cultivation{uuid,name}|null, quality,
//     amount (float).
// Nenhum campo do contrato de tela §5 ficou de fora e nenhum campo foi
// fabricado além do Resource real — sem gap de exposição nesta Tarefa.
//
// Armadilhas desta Tarefa (mirror da Leitura do dev):
//   1. SEM `useForm`/`reset()` — leitura direta de `closingWeekQuery.data`
//      (`ClosingWeekDetail`), via `useClosingWeekDetail` (mirror
//      `useTransferDetail`).
//   2. Guard de UUID malformado ANTES de montar a tela — redireciona para a
//      listagem (mirror `useEffect` de `FinishCharge.tsx`), nunca chama a API.
//   3. `user.name` DIRETO — nunca `user.people.name` (LACUNA do legado,
//      OQ-07, já resolvida na API, DEC-FS-13).
//   4. Sem botão "Editar"/"Excluir" (DEC-FS-15 — não existe modo de edição;
//      exclusão só existe na listagem) — único botão é "Voltar".
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiInbox } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { ClosingWeekDetail } from '@/@types/v2/FechamentoSemana';

import { useClosingWeekDetail } from './useFechamentoSemana';

const CLOSING_WEEKS_LIST_ROUTE = '/operacional/fechamento-semana';
const NO_DATA = '—';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      mb={4}
      pb={2}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      {children}
    </Text>
  );
}

export default function ShowClosingWeek() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.fechamentoSemana.closingWeek;
  const detailText = text.detail;

  const isValidId = isValidGuid(uuid);

  // Armadilha #2 — guard de UUID malformado ANTES de qualquer chamada.
  useEffect(() => {
    if (uuid && !isValidId) {
      navigate(CLOSING_WEEKS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, isValidId, navigate]);

  const closingWeekQuery = useClosingWeekDetail(isValidId ? uuid : undefined);

  const isLoading = checkLoadingStatus([closingWeekQuery as any]);
  const item = closingWeekQuery.data as ClosingWeekDetail | undefined;
  const notFound = !isLoading && (closingWeekQuery as any).isError;

  if (uuid && !isValidId) {
    return null;
  }

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.notFound}</EmptyState.Title>
              </VStack>
              <Button
                title={detailText.backButton}
                variant="outline"
                size="sm"
                onClick={() => navigate(CLOSING_WEEKS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? `${text.singularLabel} Nº ${item.code}` : text.singularLabel}
      footer={
        <Button
          title={detailText.backButton}
          variant="outline"
          type="button"
          onClick={() => navigate(CLOSING_WEEKS_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6} mt={2}>
          {/* ---- Seção 1 — Cabeçalho (contrato §5) ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Skeleton loading={isLoading}>
                <InfoField label={detailText.fields.code} value={item ? item.code : NO_DATA} />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.date}
                  value={item ? formatDate(item.date) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.startDate}
                  value={item ? formatDate(item.start_date) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.endDate}
                  value={item ? formatDate(item.end_date) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.week}
                  value={item ? String(item.week) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                {/* Armadilha #3 — `user.name` DIRETO (DEC-FS-13), nunca
                    `user.people.name`. */}
                <InfoField
                  label={detailText.fields.responsible}
                  value={item?.user?.name ?? NO_DATA}
                />
              </Skeleton>
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens salvos (`items[]`, `whenLoaded`) ---- */}
          <Box>
            <SectionTitle>{detailText.itemsSectionTitle}</SectionTitle>
            {isLoading ? (
              <Skeleton height="10" borderRadius="md" />
            ) : (item?.items ?? []).length === 0 ? (
              <EmptyState.Root size="sm">
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <Icon as={FiInbox} boxSize={6} color="fg.muted" />
                  </EmptyState.Indicator>
                  <EmptyState.Title>{detailText.itemsEmptyState}</EmptyState.Title>
                </EmptyState.Content>
              </EmptyState.Root>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.itemsTable.cultivation}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.quality}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.amount}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.cultivation?.name ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.quality ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.amount)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
