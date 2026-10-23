// src/pages/Financeiro/OfxImport/Reconciliation/OfxReconciliationTab.tsx
// -----------------------------------------------------------------------------
// Workspace de CONCILIAÇÃO BANCÁRIA da Importação OFX. Rota
// `/financeiro/ofx/:uuid/conciliacao` (guardada `import_ofx_edit`).
//
// FASE 1 da proposta `docs/ux/funcionalidades/conciliacao-ofx.md`: casca mestre–detalhe
// (fila à esquerda, painel à direita), abas por estado, resumo em R$ e ação rápida
// "Confirmar" nas sugestões prontas — tudo COMPOSTO por componentes do kit
// (`ReconciliationWorkspace/Summary/Row/DetailPanel`, `QueueTabs`, `Badge`). Esta página só
// carrega dados, deriva estados e liga as ações; (fase 1: os modais (vincular título,
// criar movimento) agora são o painel INLINE (FASE 2): abas Vincular · Criar lançamento ·
// Transferência, com os MESMOS formulários dos antigos modais em variante `panel`
// (`FormSurface`); o saldo do rateio é ao vivo (`RemainingBalance`) e confirmar sugestões
// tem Desfazer. Só a baixa em lote final (`WriteOffBatchModal`, compartilhada) segue em diálogo.
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
import { SegmentedControl } from '@/components/ui/SegmentedControl';
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

/** Modo do painel: `overview` (sugestão pronta) ou um dos 3 caminhos de conciliação inline. */
type PanelMode = 'overview' | 'link' | 'create' | 'transfer';
const defaultModeFor = (state: ItemState): PanelMode => (state === 'ready' ? 'overview' : 'create');

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
  const [mode, setMode] = useState<PanelMode>('create');
  const lastApplied = useRef<string[]>([]);
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
  const selectedState: ItemState | null = selected ? stateOf(selected) : null;

  // Ao trocar de transação, o painel volta ao modo padrão do estado dela.
  useEffect(() => {
    if (selectedState) setMode(defaultModeFor(selectedState));
  }, [selectedId, selectedState]);

  function navigate(delta: -1 | 1) {
    if (visibleItems.length === 0) return;
    const index = visibleItems.findIndex((i) => i.fit_id === selectedId);
    const next = Math.min(visibleItems.length - 1, Math.max(0, index + delta));
    setSelectedId(visibleItems[next].fit_id);
  }

  // ---- Desfazer: desconcilia os movimentos que acabaram de ser aplicados ----
  async function undoApplied(movementUuids: string[]) {
    try {
      await Promise.all(movementUuids.map((id) => unreconcileMovement(id)));
      toaster.success({ title: text.actions.apply, description: ws.panel.undoneToast });
    } catch (error) {
      toaster.error({ title: ws.panel.undo, description: extractApiErrorMessage(error) ?? ws.panel.undoError });
    }
    refetchReconciliation();
  }

  function requestConfirm() {
    lastApplied.current = items
      .filter((i) => stateOf(i) === 'ready' && i.matched_movement_uuid)
      .map((i) => i.matched_movement_uuid as string);
    setConfirmOpen(true);
  }

  // ---- Confirmar sugestões (POST aplica TODAS as linhas já casadas) ----
  const applyMutation = useMutation({
    mutationFn: () => applyOfxReconciliation(uuid!),
    onSuccess: () => {
      const applied = lastApplied.current;
      toaster.success({
        title: text.actions.apply,
        description: `${applied.length} ${ws.panel.confirmedToast}`,
        duration: 9000,
        action: { label: ws.panel.undo, onClick: () => undoApplied(applied) },
      });
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
                <Button title={ws.detail.confirmOne} size="sm" onClick={requestConfirm} />
              ) : undefined
            }
          />
        );
      })
    );

  // ---- Detalhe ----
  // Formulários INLINE (mesmos formulários dos antigos modais, em variante `panel`): o
  // usuário decide ao lado da lista, sem perder o contexto.
  const backToDefault = () => selectedState && setMode(defaultModeFor(selectedState));
  const formProps = { isOpen: true, variant: 'panel' as const, onClose: backToDefault, onSuccess: refetchReconciliation };

  const modeOptions = [
    { key: 'link' as const, label: ws.panel.modes.link },
    { key: 'create' as const, label: ws.panel.modes.create },
    { key: 'transfer' as const, label: ws.panel.modes.transfer },
  ];

  const detail = selected ? (
    <ReconciliationDetailPanel
      title={selected.memo}
      meta={`${formatDateBR(selected.date)} · ${selected.type === 'E' ? ws.kinds.entry : ws.kinds.exit} · ${accountLabel}`}
      amount={`${selected.type === 'E' ? '+' : '−'} ${formatCurrencyBRL(selected.value)}`}
      direction={selected.type === 'E' ? 'in' : 'out'}
      badges={classificationBadge(selected)}
      status={
        selectedState === 'ready'
          ? { tone: 'info', title: ws.detail.readyTitle, body: ws.detail.readyBody }
          : selectedState === 'reconciled'
            ? { tone: 'success', title: ws.detail.reconciledTitle, body: ws.detail.reconciledBody }
            : { tone: 'neutral', title: ws.detail.noMatchTitle, body: ws.detail.noMatchBody }
      }
      actions={
        canEdit && selectedState === 'reconciled' ? (
          <Button
            title={text.actions.unreconcile}
            variant="secondary"
            onClick={() =>
              selected.matched_movement_uuid &&
              setMovementToUnreconcile({ uuid: selected.matched_movement_uuid, label: selected.memo })
            }
          />
        ) : canEdit && selectedState === 'ready' && mode === 'overview' ? (
          <>
            <Button title={ws.panel.linkOther} variant="secondary" onClick={() => setMode('link')} />
            <Button title={ws.detail.confirmAction} onClick={requestConfirm} />
          </>
        ) : undefined
      }
    >
      {canEdit && selectedState !== 'reconciled' && mode !== 'overview' && (
        <Box>
          <Flex align="center" justify="space-between" gap={3} mb={4} wrap="wrap">
            <SegmentedControl options={modeOptions} value={mode} onChange={setMode} ariaLabel={ws.panel.modes.link} />
            {selectedState === 'ready' && (
              <Button title={ws.panel.back} variant="ghost" size="sm" onClick={() => setMode('overview')} />
            )}
          </Flex>

          {mode === 'link' &&
            (selected.type === 'E' ? (
              <WriteoffIncomeModal {...formProps} item={selected} />
            ) : (
              <WriteoffExpenseModal {...formProps} item={selected} />
            ))}
          {mode === 'create' && (
            <NewMovementModal
              key={`${selected.fit_id}-create`}
              {...formProps}
              item={selected}
              accountUuid={accountUuid ?? ''}
              accountLabel={accountLabel}
            />
          )}
          {mode === 'transfer' && (
            <NewMovementModal
              key={`${selected.fit_id}-transfer`}
              {...formProps}
              item={selected}
              accountUuid={accountUuid ?? ''}
              accountLabel={accountLabel}
              initialTypeCategory="T"
            />
          )}
        </Box>
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
                        onClick={requestConfirm}
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
