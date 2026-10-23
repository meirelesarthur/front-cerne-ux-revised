// src/pages/Financeiro/OfxImport/Reconciliation/OfxReconciliationTab.tsx
// -----------------------------------------------------------------------------
// Workspace de CONCILIAÇÃO BANCÁRIA da Importação OFX. Rota
// `/financeiro/ofx/:uuid/conciliacao` (guardada `import_ofx_edit`).
//
// FASE 1 da proposta `docs/ux/funcionalidades/conciliacao-ofx.md`: casca mestre–detalhe
// (fila à esquerda, painel à direita), abas por estado, resumo em R$ e ação rápida
// "Confirmar" nas sugestões prontas — tudo COMPOSTO por componentes do kit
// (`ReconciliationWorkspace/Summary/Row/DetailPanel`, `QueueTabs`, `Badge`). Esta página só
// carrega dados, deriva estados e liga as ações; os modais atuais (vincular título,
// criar movimento) seguem como estão até a fase 2 (painel com abas, sem modal).
//
// Contrato do backend preservado: `GET` (preview) não muta; `POST` aplica TODAS as linhas já
// casadas (o servidor ainda não confirma uma linha só — por isso o "Confirmar" pede
// confirmação explícita e fala em "sugestões", no plural); "Desconciliar" só em `reconciled`.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Flex, Input, Skeleton, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { QueueTabs } from '@/components/ui/QueueTabs';
import { ReconciliationDetailPanel } from '@/components/ui/ReconciliationDetailPanel';
import { ReconciliationRow } from '@/components/ui/ReconciliationRow';
import { ReconciliationSummary } from '@/components/ui/ReconciliationSummary';
import { ReconciliationWorkspace } from '@/components/ui/ReconciliationWorkspace';
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

type ItemState = 'ready' | 'noMatch' | 'reconciled';
type TabKey = 'review' | 'ready' | 'noMatch' | 'reconciled';

/** Estado de uma linha a partir do que o backend entrega (ver `OfxReconciliationItem`). */
const stateOf = (item: OfxReconciliationItem): ItemState =>
  item.reconciled ? 'reconciled' : item.matched_movement_uuid ? 'ready' : 'noMatch';

const belongsToTab = (state: ItemState, tab: TabKey) =>
  tab === 'review' ? state !== 'reconciled' : tab === state;

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
  const ws = text.workspace;

  const canEdit = can('import_ofx_edit');

  const [tab, setTab] = useState<TabKey>('review');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [movementToUnreconcile, setMovementToUnreconcile] = useState<{
    uuid: string;
    label: string;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ---- Cabeçalho (código/descrição) ----
  const ofxImportQuery = useQuery({
    queryKey: [queryKey.financial.ofxImport, uuid],
    queryFn: () => getOfxImport(uuid!),
    enabled: !!uuid,
    select: (response) => response.data as OfxImportDetail,
  });

  // ---- Preview de conciliação — GET puro, SEM polling. ----
  const reconciliationQuery = useQuery({
    queryKey: [queryKey.financial.ofxReconciliation, uuid],
    queryFn: () => getOfxReconciliationPreview(uuid!),
    enabled: !!uuid,
    select: (response) => response.data,
    refetchOnWindowFocus: false,
  });

  const accountUuid = reconciliationQuery.data?.account?.uuid;
  const accountLabel = reconciliationQuery.data?.account
    ? `${reconciliationQuery.data.account.bank} — ${reconciliationQuery.data.account.description}`
    : '';
  const investmentAccount = reconciliationQuery.data?.account?.investment_account ?? null;

  function refetchReconciliation() {
    queryClient.invalidateQueries({ queryKey: [queryKey.financial.ofxReconciliation, uuid] });
  }

  const items = useMemo(() => reconciliationQuery.data?.items ?? [], [reconciliationQuery.data]);
  const pendingInvestments = reconciliationQuery.data?.pending_investments ?? [];
  const totalItems = reconciliationQuery.data?.total_items ?? 0;
  const reconciledCount = reconciliationQuery.data?.reconciled_count ?? 0;
  const progressPercent = reconciliationQuery.data?.progress_percent ?? 0;

  // ---- Derivados: contagens por aba, somas em R$, linhas visíveis ----
  const counts = useMemo(() => {
    const c = { review: 0, ready: 0, noMatch: 0, reconciled: 0 };
    for (const i of items) {
      const s = stateOf(i);
      if (s !== 'reconciled') c.review += 1;
      c[s] += 1;
    }
    return c;
  }, [items]);

  const money = useMemo(() => {
    const sum = (f: (i: OfxReconciliationItem) => boolean) => items.filter(f).reduce((a, i) => a + i.value, 0);
    const n = (f: (i: OfxReconciliationItem) => boolean) => items.filter(f).length;
    return {
      entries: sum((i) => i.type === 'E' && !i.reconciled),
      entriesN: n((i) => i.type === 'E' && !i.reconciled),
      exits: sum((i) => i.type === 'S' && !i.reconciled),
      exitsN: n((i) => i.type === 'S' && !i.reconciled),
      done: sum((i) => i.reconciled),
      doneN: n((i) => i.reconciled),
    };
  }, [items]);

  // Busca client-side honesta (substring em descrição + data + valor formatado).
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!belongsToTab(stateOf(item), tab)) return false;
      if (!term) return true;
      return `${item.memo} ${formatDateBR(item.date)} ${formatCurrencyBRL(item.value)}`
        .toLowerCase()
        .includes(term);
    });
  }, [items, tab, search]);

  // Seleção sempre válida: se a linha sumiu da aba, vai para a primeira visível.
  useEffect(() => {
    if (visibleItems.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!visibleItems.some((i) => i.fit_id === selectedId)) setSelectedId(visibleItems[0].fit_id);
  }, [visibleItems, selectedId]);

  const selected = items.find((i) => i.fit_id === selectedId) ?? null;

  function navigate(delta: -1 | 1) {
    if (visibleItems.length === 0) return;
    const index = visibleItems.findIndex((i) => i.fit_id === selectedId);
    const next = Math.min(visibleItems.length - 1, Math.max(0, index + delta));
    setSelectedId(visibleItems[next].fit_id);
  }

  // ---- Confirmar sugestões (POST aplica TODAS as linhas já casadas) ----
  const applyMutation = useMutation({
    mutationFn: () => applyOfxReconciliation(uuid!),
    onSuccess: () => {
      toaster.success({ title: text.actions.apply, description: text.actions.applySuccess });
      setConfirmOpen(false);
      refetchReconciliation();
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error) ?? text.actions.applyError;
      toaster.error({ title: text.actions.apply, description: message });
    },
  });

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

  const handleLinkTitle = (item: OfxReconciliationItem) =>
    setActiveModal(item.type === 'E' ? { kind: 'writeoff-income', item } : { kind: 'writeoff-expense', item });
  const handleCreateMovement = (item: OfxReconciliationItem) => setActiveModal({ kind: 'new-movement', item });

  const isLoading = checkLoadingStatus([ofxImportQuery as any, reconciliationQuery as any]);

  // ---- Selo de estado por linha (Badge do kit) ----
  const stateChip = (item: OfxReconciliationItem) => {
    const s = stateOf(item);
    if (s === 'reconciled') return <Badge variant="success" label={ws.chips.reconciled} />;
    if (s === 'ready') return <Badge variant="info" label={ws.chips.ready} />;
    return <Badge variant="neutral" label={ws.chips.noMatch} />;
  };
  const classificationBadge = (item: OfxReconciliationItem) =>
    item.classification !== 'COMMON' ? (
      <Badge
        variant="purple"
        label={item.classification === 'INVESTMENT' ? text.classification.investment : text.classification.redemption}
      />
    ) : undefined;

  // ---- Lista ----
  const list =
    visibleItems.length === 0 ? (
      <Box py={12} px={6} textAlign="center">
        {counts.review === 0 && tab === 'review' ? (
          <>
            <Flex justify="center" color="green.600" mb={2}>
              <Icon name="check-circle" size={26} />
            </Flex>
            <Text fontWeight="semibold">{ws.detail.allDoneTitle}</Text>
            <Text fontSize="base" color="fg.muted">
              {ws.detail.allDoneHint}
            </Text>
          </>
        ) : (
          <>
            <Text fontWeight="semibold">{ws.detail.emptyTab}</Text>
            <Text fontSize="base" color="fg.muted">
              {ws.detail.emptyTabHint}
            </Text>
          </>
        )}
      </Box>
    ) : (
      visibleItems.map((item) => {
        const s = stateOf(item);
        return (
          <ReconciliationRow
            key={item.fit_id}
            direction={item.type === 'E' ? 'in' : 'out'}
            title={item.memo}
            date={formatDateBR(item.date)}
            amount={`${item.type === 'E' ? '+' : '−'} ${formatCurrencyBRL(item.value)}`}
            chip={stateChip(item)}
            extra={classificationBadge(item)}
            selected={item.fit_id === selectedId}
            onSelect={() => setSelectedId(item.fit_id)}
            action={
              canEdit && s === 'ready' ? (
                <Button title={ws.detail.confirmOne} size="sm" onClick={() => setConfirmOpen(true)} />
              ) : undefined
            }
          />
        );
      })
    );

  // ---- Detalhe ----
  const detail = selected ? (
    <ReconciliationDetailPanel
      title={selected.memo}
      meta={`${formatDateBR(selected.date)} · ${selected.type === 'E' ? ws.kinds.entry : ws.kinds.exit} · ${accountLabel}`}
      amount={`${selected.type === 'E' ? '+' : '−'} ${formatCurrencyBRL(selected.value)}`}
      direction={selected.type === 'E' ? 'in' : 'out'}
      badges={classificationBadge(selected)}
      status={
        stateOf(selected) === 'ready'
          ? { tone: 'info', title: ws.detail.readyTitle, body: ws.detail.readyBody }
          : stateOf(selected) === 'reconciled'
            ? { tone: 'success', title: ws.detail.reconciledTitle, body: ws.detail.reconciledBody }
            : { tone: 'neutral', title: ws.detail.noMatchTitle, body: ws.detail.noMatchBody }
      }
    >
      {canEdit && stateOf(selected) === 'reconciled' && (
        <Button
          title={text.actions.unreconcile}
          variant="secondary"
          onClick={() =>
            selected.matched_movement_uuid &&
            setMovementToUnreconcile({ uuid: selected.matched_movement_uuid, label: selected.memo })
          }
        />
      )}
      {canEdit && stateOf(selected) === 'ready' && (
        <>
          <Button title={text.actions.linkTitle} variant="secondary" onClick={() => handleLinkTitle(selected)} />
          <Button title={ws.detail.confirmAction} onClick={() => setConfirmOpen(true)} />
        </>
      )}
      {canEdit && stateOf(selected) === 'noMatch' && (
        <>
          <Button title={text.actions.linkTitle} variant="secondary" onClick={() => handleLinkTitle(selected)} />
          <Button title={text.actions.createMovement} onClick={() => handleCreateMovement(selected)} />
        </>
      )}
    </ReconciliationDetailPanel>
  ) : (
    <Box py={16} px={6} textAlign="center">
      <Text fontWeight="semibold">{ws.detail.emptyTitle}</Text>
      <Text fontSize="base" color="fg.muted">
        {ws.detail.emptyBody}
      </Text>
    </Box>
  );

  const pendingTotal = counts.review;

  return (
    <FormContainer
      fullBleed
      title={
        ofxImportQuery.data
          ? `${text.pageTitlePrefix} — ${ofxImportQuery.data.code}`
          : text.pageTitlePrefix
      }
      subtitle={ofxImportQuery.data?.description}
    >
      <Skeleton loading={isLoading} borderRadius="md" height="100%">
        {reconciliationQuery.isError ? (
          <Text fontSize="sm" color="fg.error" p={6}>
            {text.loadError}
          </Text>
        ) : (
          <Flex direction="column" height="100%" minH={0}>
            {/* SURF-063 — banner de lote de investimentos (só com itens pendentes). */}
            <Box px={5}>
              <BulkInvestmentBanner
                pendingInvestments={pendingInvestments}
                accountUuid={accountUuid ?? ''}
                accountLabel={accountLabel}
                investmentAccountUuid={investmentAccount?.uuid ?? null}
                investmentAccountLabel={investmentAccount?.description ?? null}
                onSuccess={refetchReconciliation}
              />
            </Box>

            <Box flex="1" minH={0}>
              <ReconciliationWorkspace
                onNavigate={navigate}
                searchInputRef={searchRef}
                summary={
                  <ReconciliationSummary
                    stats={[
                      {
                        label: ws.summary.entries,
                        value: formatCurrencyBRL(money.entries),
                        hint: `${money.entriesN} ${ws.summary.transactions}`,
                        tone: 'in',
                      },
                      {
                        label: ws.summary.exits,
                        value: formatCurrencyBRL(money.exits),
                        hint: `${money.exitsN} ${ws.summary.transactions}`,
                        tone: 'out',
                      },
                      {
                        label: ws.summary.reconciled,
                        value: formatCurrencyBRL(money.done),
                        hint: `${money.doneN} ${ws.summary.transactions}`,
                      },
                    ]}
                    progress={{
                      value: progressPercent,
                      title: `${reconciledCount} / ${totalItems} ${ws.summary.ofReconciled}`,
                      subtitle: pendingTotal > 0 ? `${pendingTotal} ${ws.summary.transactions}` : undefined,
                    }}
                  />
                }
                tabs={
                  <QueueTabs<TabKey>
                    value={tab}
                    onChange={setTab}
                    tabs={[
                      { key: 'review', label: ws.tabs.review, count: counts.review },
                      { key: 'ready', label: ws.tabs.ready, count: counts.ready },
                      { key: 'noMatch', label: ws.tabs.noMatch, count: counts.noMatch },
                      { key: 'reconciled', label: ws.tabs.reconciled, count: counts.reconciled },
                    ]}
                  />
                }
                toolbar={
                  <Flex align="center" gap={2} px={4} py={3}>
                    <Input
                      ref={searchRef}
                      placeholder={`${text.search.placeholder} ( / )`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      size="sm"
                      flex="1"
                    />
                    {canEdit && tab === 'ready' && counts.ready > 0 && (
                      <Button
                        title={`${ws.detail.confirmAction} (${counts.ready})`}
                        size="sm"
                        onClick={() => setConfirmOpen(true)}
                      />
                    )}
                  </Flex>
                }
                list={list}
                detail={detail}
              />
            </Box>
          </Flex>
        )}
      </Skeleton>

      {/* SURF-066 — Modal de novo movimento (fase 2 troca por painel). */}
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

      {/* Confirmar sugestões prontas (aplica todas — limitação do backend atual). */}
      <DeleteConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => applyMutation.mutate()}
        isLoading={applyMutation.isPending}
        title={ws.detail.confirmDialogTitle}
        description={ws.detail.confirmDialogDescription}
        hideQuestionMark
        warningText=""
        tone="info"
        confirmButtonText={`${ws.detail.confirmAction} (${counts.ready})`}
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
        confirmButtonText={text.actions.unreconcile}
      />
    </FormContainer>
  );
}
