// src/pages/Financeiro/OfxImport/Reconciliation/OfxReconciliationTab.tsx
// -----------------------------------------------------------------------------
// Workspace de CONCILIAÇÃO BANCÁRIA da Importação OFX (F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-02). Rota
// `/financeiro/ofx/:uuid/conciliacao` (guardada `import_ofx_edit`, ação
// "Conciliar" de SURF-013 já navega para cá desde a TASK-064-OFX-FE-01).
//
// Referência UX: `GB.Cerne.UX/src/components/ui/ReconciliationWorkspace.tsx`
// + `OfxImportPage.tsx` (commit âncora `24bd91603a6ee4e19b58fa5efe2221835c83e306`)
// — duas colunas conceituais (transação bancária × movimento casado)
// ADAPTADAS para uma lista única de cards (`Box`/`Flex` do Chakra v3,
// arquitetura-ofx-frontend.md §2) com status por linha, mais fiel ao
// `ReconciliationsList` real do legado (uma tabela, não duas colunas soltas)
// — o protótipo não cobria cards de totalização/filtro/lote/writeoff
// (EXTENSAO_ADITIVA, §5 da arquitetura), reproduzidos aqui com os
// componentes reais do catálogo `GB.Cerne.FrontEnd` (`Button`, `Badge`,
// `Input`, `Actions`), nunca importados do `ux_root`.
//
// DoD: `GET` (preview) NUNCA dispara mutação — só é chamado no mount e após
// uma ação explícita do usuário (nunca polling); `POST` (aplicar) invalida
// a MESMA query; cascatas dos modais preservadas 1:1 (ver cada modal
// dedicado); soma do rateio validada antes do submit (Yup do
// `movement-schema.ts`, reusado); banner de lote só quando
// `pending_investments` não vazio; "Desconciliar" só em itens `reconciled`.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Input, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiGitMerge, FiPlus, FiSearch, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { getOfxImport } from '@/services/v2/Financeiro/OfxImports/ofx-import-service';
import {
  applyOfxReconciliation,
  getOfxReconciliationPreview,
} from '@/services/v2/Financeiro/OfxImports/ofx-reconciliation-service';
import { unreconcileMovement } from '@/services/v2/Movements/movement-service';

import type { OfxImportDetail } from '@/@types/v2/Financeiro/ofxImport';
import type { OfxReconciliationItem } from '@/@types/v2/Financeiro/ofxImport/reconciliation';

import { BulkInvestmentBanner } from './BulkInvestmentBanner';
import { NewMovementModal } from './NewMovementModal';
import { WriteoffExpenseModal } from './WriteoffExpenseModal';
import { WriteoffIncomeModal } from './WriteoffIncomeModal';

function formatDateBR(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatCurrencyBRL(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type ActiveModal =
  | { kind: 'new-movement'; item: OfxReconciliationItem }
  | { kind: 'writeoff-expense'; item: OfxReconciliationItem }
  | { kind: 'writeoff-income'; item: OfxReconciliationItem }
  | null;

export default function OfxReconciliationTab() {
  const { uuid } = useParams<{ uuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.ofxImports.ofxImport.reconciliation;

  const canEdit = can('import_ofx_edit');

  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [movementToUnreconcile, setMovementToUnreconcile] = useState<{
    uuid: string;
    label: string;
  } | null>(null);

  // ---- Cabeçalho (código/descrição/conta) — reuso do service da FE-01. ----
  const ofxImportQuery = useQuery({
    queryKey: [queryKey.financial.ofxImport, uuid],
    queryFn: () => getOfxImport(uuid!),
    enabled: !!uuid,
    select: (response) => response.data as OfxImportDetail,
  });

  // ---- Preview de conciliação — GET puro, SEM polling (DoD). ----
  const reconciliationQuery = useQuery({
    queryKey: [queryKey.financial.ofxReconciliation, uuid],
    queryFn: () => getOfxReconciliationPreview(uuid!),
    enabled: !!uuid,
    select: (response) => response.data,
    refetchOnWindowFocus: false,
  });

  // UT-000753 (a) — `account` vem AGORA do próprio preview de conciliação
  // (`data.account`, gate ÚNICO `import_ofx_edit`), não mais de
  // `ofxImportQuery.data?.account` (`GET /ofx-imports/{uuid}`, gate
  // SEPARADO `import_ofx_view`, fora do escopo desta correção). Fonte única
  // para `accountUuid`/`accountLabel` consumidos por `NewMovementModal`/
  // `BulkInvestmentBanner` abaixo.
  const accountUuid = reconciliationQuery.data?.account?.uuid;
  const accountLabel = reconciliationQuery.data?.account
    ? `${reconciliationQuery.data.account.bank} — ${reconciliationQuery.data.account.description}`
    : '';

  // Conta de investimento vinculada (SURF-063) — UT-000753 (a, etapa b):
  // `data.account.investment_account` AGORA vem no próprio preview de
  // conciliação (`{uuid, description} | null`, gate ÚNICO `import_ofx_edit`,
  // API_UT753 etapa b) — PAROU de depender de `GET /accounts/{uuid}`
  // (`accounts_view`, nunca afrouxado). Nenhum `useQuery` extra necessário.
  const investmentAccount = reconciliationQuery.data?.account?.investment_account ?? null;

  function refetchReconciliation() {
    queryClient.invalidateQueries({ queryKey: [queryKey.financial.ofxReconciliation, uuid] });
  }

  const items = reconciliationQuery.data?.items ?? [];
  const pendingInvestments = reconciliationQuery.data?.pending_investments ?? [];
  const totalItems = reconciliationQuery.data?.total_items ?? 0;
  const reconciledCount = reconciliationQuery.data?.reconciled_count ?? 0;
  const progressPercent = reconciliationQuery.data?.progress_percent ?? 0;
  const pendingCount = totalItems - reconciledCount;

  // SURF-062/Decisão F4 — busca client-side HONESTA: substring simples em
  // descrição+data formatada, NUNCA um filtro de intervalo/período real
  // (corrige o defeito legado FLD-11/POSSIVEL_LEGACY_DEFECT, sem replicar).
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = `${item.memo} ${formatDateBR(item.date)}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [items, search]);

  // ---- Aplicar Conciliação (bulk, POST) ----
  const applyMutation = useMutation({
    mutationFn: () => applyOfxReconciliation(uuid!),
    onSuccess: () => {
      toaster.success({ title: text.actions.apply, description: text.actions.applySuccess });
      refetchReconciliation();
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error) ?? text.actions.applyError;
      toaster.error({ title: text.actions.apply, description: message });
    },
  });

  const hasMatchedPendingApply = items.some(
    (item) => item.matched_movement_uuid && !item.reconciled
  );

  function handleApply() {
    if (!hasMatchedPendingApply) {
      toaster.create({
        type: 'info',
        title: text.actions.apply,
        description: text.actions.applyNothingToApply,
      });
      return;
    }
    applyMutation.mutate();
  }

  // ---- Desconciliar (PATCH, por item) ----
  const unreconcileMutation = useMutation({
    mutationFn: (movementUuid: string) => unreconcileMovement(movementUuid),
    onSuccess: () => {
      toaster.success({
        title: text.actions.unreconcile,
        description: text.actions.unreconcileSuccess,
      });
      setMovementToUnreconcile(null);
      refetchReconciliation();
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error) ?? text.actions.unreconcileError;
      toaster.error({ title: text.actions.unreconcile, description: message });
    },
  });

  function handleUnreconcileClick(item: OfxReconciliationItem) {
    if (!item.matched_movement_uuid) return;
    setMovementToUnreconcile({ uuid: item.matched_movement_uuid, label: item.memo });
  }

  function handleLinkTitle(item: OfxReconciliationItem) {
    setActiveModal(
      item.type === 'E' ? { kind: 'writeoff-income', item } : { kind: 'writeoff-expense', item }
    );
  }

  function handleCreateMovement(item: OfxReconciliationItem) {
    setActiveModal({ kind: 'new-movement', item });
  }

  const isLoading = checkLoadingStatus([ofxImportQuery as any, reconciliationQuery as any]);

  return (
    <FormContainer
      title={
        ofxImportQuery.data
          ? `${text.pageTitlePrefix} — ${ofxImportQuery.data.code}`
          : text.pageTitlePrefix
      }
      subtitle={ofxImportQuery.data?.description}
      headerActions={
        canEdit ? (
          <Button
            title={text.actions.apply}
            icon={FiGitMerge as ElementType}
            onClick={handleApply}
            loading={applyMutation.isPending}
            disabled={isLoading}
          />
        ) : undefined
      }
    >
      <Skeleton loading={isLoading} borderRadius="md">
        {reconciliationQuery.isError ? (
          <Text fontSize="sm" color="fg.error">
            {text.loadError}
          </Text>
        ) : (
          // Respiro externo do conjunto (cards + filtro + lista) alinhado ao
          // padrão de telas de detalhe irmãs sob `FormContainer` sem footer
          // (ex.: `RomaneioDetalhe`, `ServiceOrderDetalhe`) — o branch sem
          // footer do `FormContainer` entrega os filhos crus, sem padding
          // próprio, então cada tela de detalhe replica este wrapper.
          <Box px={{ base: 4, md: 10 }} pb={8}>
            {/* SURF-061 — cards de totalização. */}
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
              <Box bg="bg.muted" borderRadius="lg" p={4}>
                <Text fontSize="xs" color="fg.muted">
                  {text.cards.total}
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {totalItems}
                </Text>
              </Box>
              <Box bg="bg.muted" borderRadius="lg" p={4}>
                <Text fontSize="xs" color="fg.muted">
                  {text.cards.matched}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {reconciledCount}
                </Text>
              </Box>
              <Box bg="bg.muted" borderRadius="lg" p={4}>
                <Text fontSize="xs" color="fg.muted">
                  {text.cards.pending}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {pendingCount}
                </Text>
              </Box>
              <Box bg="bg.muted" borderRadius="lg" p={4}>
                <Text fontSize="xs" color="fg.muted">
                  {text.cards.progress}
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {progressPercent}%
                </Text>
              </Box>
            </SimpleGrid>

            {/* SURF-063 — banner de lote de investimentos (só quando houver
                itens pendentes de aplicação/resgate). */}
            <BulkInvestmentBanner
              pendingInvestments={pendingInvestments}
              accountUuid={accountUuid ?? ''}
              accountLabel={accountLabel}
              investmentAccountUuid={investmentAccount?.uuid ?? null}
              investmentAccountLabel={investmentAccount?.description ?? null}
              onSuccess={refetchReconciliation}
            />

            {/* SURF-062 — busca client-side honesta (Decisão F4). */}
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiSearch} color="fg.muted" />
              <Input
                placeholder={text.search.placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
                maxW="360px"
              />
            </Flex>

            {/* SURF-064 — tabela transações × movimentos (adaptada para
                lista de cards, ver cabeçalho do arquivo). */}
            {filteredItems.length === 0 ? (
              <Box py={10} textAlign="center">
                <Text fontSize="sm" color="fg.muted">
                  {text.emptyState.title}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {text.emptyState.description}
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap={3}>
                {filteredItems.map((item) => {
                  const isReconciled = item.reconciled;
                  const isMatchedPending = !!item.matched_movement_uuid && !item.reconciled;
                  const isPending = !item.matched_movement_uuid;

                  return (
                    <Flex
                      key={item.fit_id}
                      align="center"
                      gap={4}
                      p={4}
                      border="1px solid"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      wrap="wrap"
                    >
                      <Icon
                        as={item.type === 'E' ? FiTrendingUp : FiTrendingDown}
                        color={item.type === 'E' ? 'green.500' : 'red.500'}
                        boxSize={5}
                      />

                      <Box flex="1" minW="220px">
                        <Text fontSize="sm" fontWeight="medium" lineClamp="1">
                          {item.memo}
                        </Text>
                        <Flex align="center" gap={2}>
                          <Text fontSize="xs" color="fg.muted">
                            {formatDateBR(item.date)}
                          </Text>
                          {item.classification !== 'COMMON' && (
                            <Badge size="sm" colorPalette="purple" variant="subtle">
                              {item.classification === 'INVESTMENT'
                                ? text.classification.investment
                                : text.classification.redemption}
                            </Badge>
                          )}
                        </Flex>
                      </Box>

                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={item.type === 'E' ? 'green.600' : 'red.600'}
                        minW="120px"
                        textAlign="right"
                      >
                        {item.type === 'E' ? '+' : '-'} {formatCurrencyBRL(item.value)}
                      </Text>

                      <Badge
                        colorPalette={isReconciled ? 'green' : isMatchedPending ? 'blue' : 'orange'}
                        variant="subtle"
                      >
                        {isReconciled
                          ? text.status.reconciled
                          : isMatchedPending
                            ? text.status.matchedPendingApply
                            : text.status.pending}
                      </Badge>

                      {canEdit && isReconciled && (
                        <Button
                          title={text.actions.unreconcile}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnreconcileClick(item)}
                        />
                      )}

                      {canEdit && isPending && (
                        <Flex gap={2}>
                          <Button
                            title={text.actions.linkTitle}
                            variant="outline"
                            size="sm"
                            onClick={() => handleLinkTitle(item)}
                          />
                          <Button
                            title={text.actions.createMovement}
                            icon={FiPlus as ElementType}
                            size="sm"
                            onClick={() => handleCreateMovement(item)}
                          />
                        </Flex>
                      )}
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Box>
        )}
      </Skeleton>

      {/* SURF-066 — Modal de novo movimento. */}
      <NewMovementModal
        isOpen={activeModal?.kind === 'new-movement'}
        onClose={() => setActiveModal(null)}
        item={activeModal?.kind === 'new-movement' ? activeModal.item : null}
        accountUuid={accountUuid ?? ''}
        accountLabel={accountLabel}
        onSuccess={refetchReconciliation}
      />

      {/* SURF-067 — Modal writeoff despesa (transação tipo S). */}
      <WriteoffExpenseModal
        isOpen={activeModal?.kind === 'writeoff-expense'}
        onClose={() => setActiveModal(null)}
        item={activeModal?.kind === 'writeoff-expense' ? activeModal.item : null}
        onSuccess={refetchReconciliation}
      />

      {/* SURF-068 — Modal writeoff receita (transação tipo E). */}
      <WriteoffIncomeModal
        isOpen={activeModal?.kind === 'writeoff-income'}
        onClose={() => setActiveModal(null)}
        item={activeModal?.kind === 'writeoff-income' ? activeModal.item : null}
        onSuccess={refetchReconciliation}
      />

      {/* SURF-069 — Confirmação de desconciliar. */}
      <DeleteConfirmDialog
        isOpen={!!movementToUnreconcile}
        onClose={() => setMovementToUnreconcile(null)}
        onConfirm={() =>
          movementToUnreconcile && unreconcileMutation.mutate(movementToUnreconcile.uuid)
        }
        isLoading={unreconcileMutation.isPending}
        title={text.actions.unreconcileConfirmTitle}
        description={text.actions.unreconcileConfirmDescription}
        hideQuestionMark
        tone="warning"
        colorPalette="orange"
        confirmButtonText={text.actions.unreconcile}
      />
    </FormContainer>
  );
}
