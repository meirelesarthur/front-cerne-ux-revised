// src/pages/Financeiro/OfxImport/Reconciliation/OfxReconciliationTab.tsx
// -----------------------------------------------------------------------------
// Workspace de CONCILIAÇÃO BANCÁRIA da Importação OFX. Rota
// `/financeiro/ofx/:uuid/conciliacao` (guardada `import_ofx_edit`).
//
// FASES 1–2 da proposta `docs/ux/funcionalidades/conciliacao-ofx.md`: casca mestre–detalhe (fila à
// esquerda, painel à direita), abas por estado, resumo em R$, ação rápida "Confirmar" com
// Desfazer e painel INLINE com abas Vincular · Criar lançamento · Transferência — os MESMOS
// formulários dos antigos modais, em variante `panel` (`FormSurface`), com saldo de rateio ao
// vivo (`RemainingBalance`). Tudo COMPOSTO por componentes do kit; esta página só carrega
// dados, deriva estados e liga as ações. Só a baixa em lote final (`WriteOffBatchModal`,
// compartilhada) segue em diálogo.
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
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { HIGH_CONFIDENCE } from '@/components/ui/ConfidenceMeter';
import { MatchCandidateCard } from '@/components/ui/MatchCandidateCard';
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
  confirmOfxReconciliation,
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

// `review` = há candidatos, mas com confiança abaixo do limiar (precisa de olho humano).
type ItemState = 'ready' | 'review' | 'noMatch' | 'reconciled';
// 2 abas (Pendentes · Conciliadas); dentro de Pendentes, um filtro leve separa o que já está pronto
// para confirmar do que precisa de olho humano (sugestão < 90% ou sem sugestão).
type TabKey = 'review' | 'reconciled';
type FilterKey = 'all' | 'ready' | 'attention';

const hasCandidates = (item: OfxReconciliationItem) => (item.candidates?.length ?? 0) > 0;

/** Melhor pontuação da linha: candidato do backend (fase 3) ou 100 se já veio casada (legado). */
const topScore = (item: OfxReconciliationItem): number | null =>
  item.candidates?.[0]?.score ?? (item.matched_movement_uuid ? 100 : null);

/** Estado de uma linha a partir do que o backend entrega (ver `OfxReconciliationItem`). */
const stateOf = (item: OfxReconciliationItem): ItemState => {
  if (item.reconciled) return 'reconciled';
  const score = topScore(item);
  if (score === null) return 'noMatch';
  return score >= HIGH_CONFIDENCE ? 'ready' : 'review';
};

const belongsToView = (state: ItemState, tab: TabKey, filter: FilterKey) => {
  if (tab === 'reconciled') return state === 'reconciled';
  if (state === 'reconciled') return false;
  if (filter === 'ready') return state === 'ready';
  if (filter === 'attention') return state !== 'ready';
  return true;
};

/**
 * Modo do painel: `match` (candidatos com score), `overview` (sugestão legada, só confirmar tudo)
 * ou um dos 3 caminhos de conciliação inline.
 */
type PanelMode = 'match' | 'overview' | 'link' | 'create' | 'transfer';
const defaultModeFor = (item: OfxReconciliationItem): PanelMode =>
  hasCandidates(item) ? 'match' : stateOf(item) === 'ready' ? 'overview' : 'create';

export default function OfxReconciliationTab() {
  const { uuid } = useParams<{ uuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.ofxImports.ofxImport.reconciliation;
  const ws = text.workspace;

  const canEdit = can('import_ofx_edit');

  const [tab, setTab] = useState<TabKey>('review');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<PanelMode>('create');
  const lastApplied = useRef<string[]>([]);
  // Seleção em lote (fit_id) e candidato escolhido por linha (default = o de maior score).
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<Record<string, string>>({});
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
    const c = { review: 0, ready: 0, attention: 0, reconciled: 0 };
    for (const i of items) {
      const s = stateOf(i);
      if (s === 'reconciled') c.reconciled += 1;
      else {
        c.review += 1;
        if (s === 'ready') c.ready += 1;
        else c.attention += 1;
      }
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
      if (!belongsToView(stateOf(item), tab, filter)) return false;
      if (!term) return true;
      return `${item.memo} ${formatDateBR(item.date)} ${formatCurrencyBRL(item.value)}`
        .toLowerCase()
        .includes(term);
    });
  }, [items, tab, filter, search]);

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
    if (selected) setMode(defaultModeFor(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedState]);

  /** Candidato escolhido na linha (o do usuário ou o de maior score). */
  const chosenCandidateId = (item: OfxReconciliationItem) =>
    pickedCandidate[item.fit_id] ?? item.candidates?.[0]?.id ?? null;

  const toggleChecked = (fitId: string, value: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (value) next.add(fitId);
      else next.delete(fitId);
      return next;
    });

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

  // ---- FASE 3: confirmação POR LINHA/LOTE do candidato escolhido ----
  const confirmMutation = useMutation({
    mutationFn: (picks: { fit_id: string; candidate_id: string }[]) => confirmOfxReconciliation(uuid!, picks),
    onSuccess: (response, picks) => {
      const confirmed = response.data.confirmed ?? [];
      setChecked(new Set());
      toaster.success({
        title: text.actions.apply,
        description: `${confirmed.length} ${ws.matching.done}`,
        duration: 9000,
        action: { label: ws.panel.undo, onClick: () => undoApplied(confirmed.map((c) => c.matched_movement_uuid)) },
      });
      if (confirmed.length < picks.length) {
        toaster.create({ type: 'warning', title: text.actions.apply, description: ws.matching.partial });
      }
      refetchReconciliation();
    },
    onError: (error) => {
      toaster.error({ title: text.actions.apply, description: extractApiErrorMessage(error) ?? text.actions.applyError });
    },
  });

  /** Confirma as linhas informadas com o candidato escolhido; ignora as sem candidato. */
  function confirmItems(target: OfxReconciliationItem[]) {
    const picks = target
      .filter((i) => !i.reconciled)
      .map((i) => ({ fit_id: i.fit_id, candidate_id: chosenCandidateId(i) }))
      .filter((p): p is { fit_id: string; candidate_id: string } => !!p.candidate_id);
    if (picks.length === 0) {
      toaster.create({ type: 'info', title: text.actions.apply, description: ws.matching.noneEligible });
      return;
    }
    confirmMutation.mutate(picks);
  }

  const readyWithCandidates = items.filter((i) => stateOf(i) === 'ready' && hasCandidates(i));
  const readyLegacy = items.filter((i) => stateOf(i) === 'ready' && !hasCandidates(i));

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
    const score = topScore(item);
    if (s === 'ready') {
      return <Badge variant="info" label={hasCandidates(item) ? `${ws.chips.ready} · ${score}%` : ws.chips.ready} />;
    }
    if (s === 'review') return <Badge variant="warning" label={`${ws.matching.chipReview} · ${score}%`} />;
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
            checked={checked.has(item.fit_id)}
            onCheckedChange={canEdit && s !== 'reconciled' ? (v) => toggleChecked(item.fit_id, v) : undefined}
            checkLabel={ws.matching.selectRow}
            action={
              canEdit && s === 'ready' ? (
                <Button
                  title={ws.detail.confirmOne}
                  size="sm"
                  // Com candidatos: confirma ESTA linha (backend por linha); sem: fluxo legado (confirma todas).
                  onClick={hasCandidates(item) ? () => confirmItems([item]) : requestConfirm}
                  loading={confirmMutation.isPending}
                />
              ) : undefined
            }
          />
        );
      })
    );

  // ---- Detalhe ----
  // Formulários INLINE (mesmos formulários dos antigos modais, em variante `panel`): o
  // usuário decide ao lado da lista, sem perder o contexto.
  const backToDefault = () => selected && setMode(defaultModeFor(selected));
  const formProps = { isOpen: true, variant: 'panel' as const, onClose: backToDefault, onSuccess: refetchReconciliation };

  // Com candidatos, "Sugestões" vira a 1ª aba e a busca manual passa a se chamar "Buscar título".
  const selectedHasCandidates = !!selected && hasCandidates(selected);
  const modeOptions = [
    ...(selectedHasCandidates ? [{ key: 'match' as const, label: ws.matching.modeMatch }] : []),
    { key: 'link' as const, label: selectedHasCandidates ? ws.matching.modeSearch : ws.panel.modes.link },
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
          : selectedState === 'review'
            ? { tone: 'neutral', title: ws.matching.reviewTitle, body: ws.matching.reviewBody }
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
        ) : canEdit && mode === 'match' ? (
          <Button
            title={ws.matching.confirmLink}
            onClick={() => confirmItems([selected])}
            loading={confirmMutation.isPending}
            disabled={!chosenCandidateId(selected)}
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
            <SegmentedControl options={modeOptions} value={mode as (typeof modeOptions)[number]['key']} onChange={setMode} ariaLabel={ws.panel.modes.link} />
            {selectedState === 'ready' && !selectedHasCandidates && (
              <Button title={ws.panel.back} variant="ghost" size="sm" onClick={() => setMode('overview')} />
            )}
          </Flex>

          {mode === 'match' && selected.candidates && (
            <Box>
              <Text fontSize="base" color="fg.muted" mb={3}>
                {ws.matching.pick}
              </Text>
              {selected.candidates.map((candidate) => (
                <MatchCandidateCard
                  key={candidate.id}
                  name={`candidate-${selected.fit_id}`}
                  title={candidate.title}
                  subtitle={candidate.subtitle}
                  score={candidate.score}
                  reasons={candidate.reasons}
                  selected={chosenCandidateId(selected) === candidate.id}
                  onSelect={() => setPickedCandidate((prev) => ({ ...prev, [selected.fit_id]: candidate.id }))}
                  meterLabels={{ high: ws.matching.high, medium: ws.matching.medium, low: ws.matching.low }}
                />
              ))}
            </Box>
          )}

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
                      { key: 'reconciled', label: ws.tabs.reconciled, count: counts.reconciled },
                    ]}
                  />
                }
                toolbar={
                  <>
                    {tab === 'review' && (
                      <Box px={4} pt={3}>
                        <SegmentedControl<FilterKey>
                          value={filter}
                          onChange={setFilter}
                          ariaLabel={ws.tabs.review}
                          options={[
                            { key: 'all', label: `${ws.matching.filterAll} · ${counts.review}` },
                            { key: 'ready', label: `${ws.matching.filterReady} · ${counts.ready}` },
                            { key: 'attention', label: `${ws.matching.filterAttention} · ${counts.attention}` },
                          ]}
                        />
                      </Box>
                    )}
                    <Flex align="center" gap={2} px={4} py={3}>
                      <Input
                        ref={searchRef}
                        placeholder={`${text.search.placeholder} ( / )`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="sm"
                        flex="1"
                      />
                      {canEdit && visibleItems.some((i) => !i.reconciled) && (
                        <Button
                          title={ws.matching.selectVisible}
                          variant="secondary"
                          size="sm"
                          onClick={() => setChecked(new Set(visibleItems.filter((i) => !i.reconciled).map((i) => i.fit_id)))}
                        />
                      )}
                      {canEdit && tab === 'review' && filter === 'ready' && readyWithCandidates.length > 0 && (
                        <Button
                          title={`${ws.matching.confirmHigh} (${readyWithCandidates.length})`}
                          size="sm"
                          onClick={() => confirmItems(readyWithCandidates)}
                          loading={confirmMutation.isPending}
                        />
                      )}
                      {canEdit && tab === 'review' && filter === 'ready' && readyLegacy.length > 0 && (
                        <Button
                          title={`${ws.detail.confirmAction} (${readyLegacy.length})`}
                          size="sm"
                          onClick={requestConfirm}
                        />
                      )}
                    </Flex>
                    {checked.size > 0 && (
                      <BulkActionBar label={`${checked.size} ${ws.matching.selected}`}>
                        <Button
                          title={ws.matching.confirmSelected}
                          size="sm"
                          onClick={() => confirmItems(items.filter((i) => checked.has(i.fit_id) && hasCandidates(i)))}
                          loading={confirmMutation.isPending}
                        />
                        <Button
                          title={ws.matching.clear}
                          variant="secondary"
                          size="sm"
                          onClick={() => setChecked(new Set())}
                        />
                      </BulkActionBar>
                    )}
                  </>
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
