// src/pages/CadastrosBase/PlanAccount/CategoryTreeSelector.tsx
// -----------------------------------------------------------------------------
// Árvore de 2 níveis (grupo Sintético + folhas Analíticas) para o card
// "Categorias Financeiras" do formulário de Plano de Contas (TASK-PA-16,
// Opção C do `ROTEIRO-05`) — fiel a `CategoryTreeField.tsx` do UX oficial
// (`ux_root`, commit `f450732`), consumindo `GET /financial-categories/tree`
// (`useFinancialCategoryTree`, `usePlanAccounts.tsx`).
//
// Adaptado de `Perfil/PermissionTreeSelector.tsx` (precedente real já em
// produção), com simplificações deliberadas — a árvore de `FinancialCategory`
// é mais simples que a de permissões:
//   - Só 2 níveis FIXOS (grupo → folha) — sem `GroupBlock` recursivo;
//   - Sem `canAssign` / folha `drift` — não existem neste domínio (nenhuma
//     anti-escalação de privilégio, nenhuma folha sem seed);
//   - Colapso simples por grupo (`Record<string, boolean>`), sem
//     `Accordion.Root` do Chakra — mesmo padrão do UX oficial (volume bem
//     menor que a árvore de permissões, ~980 folhas).
//
// Nó HOMOGÊNEO (`class: 1` grupo / `class: 2` folha, `children[]` sempre
// presente) — sem necessidade de type-guard `isLeaf()` (usa
// `children.length` para decidir se o grupo tem folhas do tenant atual).
//
// Contrato de seleção (default, `selectableGroups` ausente/false): só as
// FOLHAS (Analíticas) são selecionáveis. O consumidor (`CreateOrUpdatePlan
// Account.tsx`) recebe `onChange(next: Set<string>)` com o conjunto COMPLETO
// de uuids de folha selecionados e escreve de volta em `category_uuids` via
// `setValue(..., { shouldDirty: true })` — blindagem `GAP-PA-02` preservada
// no consumidor, não neste componente.
//
// TASK-FE-316 (execução 023, pedido do dev pós-E2E) — ESTENDE este componente
// (aditivo, não duplica) com 2 props novas e OPCIONAIS, ambas default
// `false`, para o card de Categorias Financeiras do Centro de Custo:
//   - `searchable` — Input de busca acima da árvore, preservando o CAMINHO
//     até o nó (grupo aparece se ele próprio bater OU se alguma folha-filha
//     bater), auto-expandindo os grupos com match (busca limpa → volta ao
//     colapso manual anterior do usuário). Lógica adaptada (não copiada 1:1)
//     de `filterNodes`/auto-expansão de `PermissionTreeSelector.tsx` para o
//     nó homogêneo `FinancialCategoryTreeNode` (`class`/`children`, sem
//     `title`/`items`/`name`).
//   - `selectableGroups` — o próprio `uuid` do GRUPO passa a integrar o `Set`
//     selecionado (não é só um agregador visual): marcar o grupo cascateia
//     grupo + TODAS as folhas (reais, não só as visíveis num filtro de
//     busca) juntos; desmarcar desfaz os dois juntos. O tri-state do
//     checkbox do grupo passa a considerar `[group.uuid, ...leafUuids]`
//     (mais o atalho de que o grupo sozinho no `Set`, mesmo sem nenhuma
//     folha marcada, já conta como "selecionado" — cobre o prefill em que o
//     backend devolve só o uuid do grupo).
//
// `CreateOrUpdatePlanAccount.tsx` NÃO passa nenhuma das duas props novas nem
// a prop `strings` — o default de cada uma preserva o comportamento
// HISTÓRICO byte-a-byte (inclusive o texto, que cai de volta no path
// hardcoded `languageGB.planAccounts.planAccount.form.categoriesTree`), então
// aquele arquivo continua INTOCADO por esta Tarefa.
//
// TASK-FE-317 (execução 023) — GENERALIZA o tipo do prop `tree`: de
// `FinancialCategoryTreeNode[] | undefined` (import de domínio específico)
// para `CategoryTreeSelectorNode[] | undefined`, um tipo LOCAL a este
// componente com os mesmos 6 campos. Mudança type-only, ZERO mudança de
// runtime — o componente sempre operou só sobre `.uuid/.code/.description/
// .class/.children` (nunca importou nada específico de `FinancialCategory`
// além do próprio tipo). `FinancialCategoryTreeNode` (`CreateOrUpdatePlan
// Account.tsx`/`CreateOrUpdateCentroCusto.tsx`) e o novo `CostCenterTreeNode`
// (`CreateOrUpdateFinancialCategory.tsx`, 3º consumidor, sentido INVERSO —
// Centro de Custo dentro do form de Categoria) permanecem tipos próprios de
// cada domínio, ambos estruturalmente compatíveis com `CategoryTreeSelector
// Node` (TypeScript é estrutural — nenhum `extends` explícito necessário).
// Também acrescenta `isError?`/`onRetry?` (aditivas, ambas opcionais): quando
// `isError` é `true`, o corpo da árvore vira um estado de erro (mesmo padrão
// visual de `CheckboxListField.tsx` — ícone + texto + botão "tentar
// novamente"). Ausentes/`undefined` nos 2 consumidores existentes → ZERO
// mudança de comportamento lá (nenhum deles tem estado de erro dedicado
// hoje, continuam sem ele).
//
// TASK-FE-1087 — acrescenta `showExpandCollapse?`/`hideEmptyGroupLabel?`
// (aditivas, ambas opcionais, default preserva o histórico: `true`/`false`
// respectivamente). Motivadas pelo card de Centros de Custo do form de
// Categoria Financeira, que passa a consumir `useCostCenterTree({
// onlyTopLevel: true })` + `selectableGroups` — árvore em que NENHUM nó tem
// `children` (backend `only_top_level=true`), então: (a) "Expandir Tudo"
// perde sentido (nada a revelar) → escondido com `showExpandCollapse=false`;
// (b) o rótulo `emptyGroup` ficaria enganoso em toda linha (o item É o
// próprio centro de custo selecionável, não um grupo vazio) → suprimido com
// `hideEmptyGroupLabel=true`. `CreateOrUpdatePlanAccount.tsx`/
// `CreateOrUpdateCentroCusto.tsx` não passam nenhuma das duas — zero mudança
// de comportamento lá.
//
// TASK-FE-1087 (complemento) — `markAll()` deixa de SUBSTITUIR `selected`
// inteiro; agora preserva qualquer uuid já selecionado que não pertença ao
// universo visível (`allSelectableUuids`) — cobre o cenário de uuid
// "invisível" (ex.: folha analítica salva pelo comportamento antigo, fora
// da árvore `only_top_level=true`). Comportamento anterior só distinguia
// tudo/nada sobre o universo inteiro conhecido; como nenhum dos 2
// consumidores existentes jamais teve uuid selecionado fora do universo
// (a árvore completa sempre continha tudo que estava em `selected`), o
// ajuste é transparente para eles.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge, Box, Flex, Icon, Input, Spinner, Text, VStack } from '@chakra-ui/react';
import { FiAlertCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/ui/checkbox';

import type { LanguageDate } from '@/@types/language';

type GroupCheckState = boolean | 'indeterminate';

/**
 * Nó HOMOGÊNEO genérico de árvore de 2 níveis (grupo→folha) — TASK-FE-317.
 * Mesma forma estrutural de `FinancialCategoryTreeNode`/`CostCenterTreeNode`
 * (6 campos, `children` sempre presente, vazio na folha). Este componente
 * NUNCA importa um tipo de domínio específico — qualquer árvore uuid/code/
 * description/class/children é compatível (TypeScript estrutural).
 */
export interface CategoryTreeSelectorNode {
  uuid: string;
  code: string;
  description: string;
  /** 1 = grupo (Sintético) · 2 = folha (Analítico) — mesmo valor em qualquer domínio consumidor. */
  class: 1 | 2;
  class_label: string;
  is_enabled: boolean;
  children: CategoryTreeSelectorNode[];
}

/**
 * Normaliza para busca: minúsculas e sem acentos (mesma regra de `PermissionTreeSelector`).
 * @param {string} text texto cru (título/código digitado ou do nó).
 * @return {string} texto normalizado, apto à comparação `.includes(term)`.
 */
function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Tri-state do checkbox de GRUPO.
 *
 * `selectableGroups=false` (default, Plano de Contas): considera só as
 * folhas — idêntico ao comportamento histórico.
 *
 * `selectableGroups=true` (Centro de Custo): o próprio `group.uuid` no `Set`
 * já basta para `true` (cobre o prefill "só o grupo foi vinculado, sem
 * nenhuma folha individual"); senão, cai para o cálculo por cobertura de
 * folhas (todas ⇒ true, nenhuma ⇒ false, parte ⇒ indeterminate).
 * @param {CategoryTreeSelectorNode} group nó do grupo (folhas REAIS, não filtradas por busca).
 * @param {Set<string>} selected conjunto completo de uuids selecionados.
 * @param {boolean} selectableGroups se o uuid do grupo participa da seleção.
 * @return {GroupCheckState} `false` (nenhuma), `true` (grupo ou todas as folhas) ou `'indeterminate'` (parcial).
 */
function groupCheckState(
  group: CategoryTreeSelectorNode,
  selected: Set<string>,
  selectableGroups: boolean
): GroupCheckState {
  if (selectableGroups && selected.has(group.uuid)) return true;

  const leafUuids = group.children.map((leaf) => leaf.uuid);
  if (leafUuids.length === 0) return false;
  const selectedCount = leafUuids.filter((uuid) => selected.has(uuid)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === leafUuids.length) return true;
  return 'indeterminate';
}

/** Bloco de textos do card — mesmas 6 chaves históricas + 2 novas, opcionais (só usadas com `searchable`). */
export interface CategoryTreeSelectorStrings {
  expandAll: string;
  collapseAll: string;
  selectAll: string;
  deselectAll: string;
  /** Grupo Sintético sem nenhuma folha do tenant atual. */
  emptyGroup: string;
  /** Árvore inteira sem nenhum grupo (universo vazio). */
  noCategories: string;
  /** Só usado quando `searchable`. */
  searchPlaceholder?: string;
  /** Só usado quando `searchable` — busca sem nenhum match. */
  noResults?: string;
  /** TASK-FE-317 — só usado quando `isError`. */
  errorLabel?: string;
  /** TASK-FE-317 — rótulo do botão de retry, só usado quando `isError`. */
  retryLabel?: string;
}

export interface CategoryTreeSelectorProps {
  /** Título do card (reaproveita `text.form.fields.categories`, sem string nova). */
  title: string;
  tree: CategoryTreeSelectorNode[] | undefined;
  isLoading: boolean;
  /** Uuids selecionados (folhas sempre; + o(s) uuid(s) de grupo quando `selectableGroups`). */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Sem permissão de salvar → árvore somente leitura (checkboxes desabilitados). */
  readOnly?: boolean;
  languageGB: LanguageDate;
  /**
   * TASK-FE-316 — mostra Input de busca acima da árvore (default `false`,
   * comportamento idêntico ao anterior quando ausente).
   */
  searchable?: boolean;
  /**
   * TASK-FE-316 — o uuid do próprio GRUPO passa a integrar o `Set`
   * selecionado, cascateando junto com as folhas (default `false`,
   * comportamento idêntico ao anterior quando ausente — só folha
   * selecionável).
   */
  selectableGroups?: boolean;
  /**
   * TASK-FE-316 — bloco de textos do consumidor (ex.: `costCenters.costCenter
   * .form.categoriesTree`). Opcional: quando ausente, cai no path hardcoded
   * histórico (`languageGB.planAccounts.planAccount.form.categoriesTree`),
   * preservando `CreateOrUpdatePlanAccount.tsx` intocado.
   */
  strings?: CategoryTreeSelectorStrings;
  /**
   * TASK-FE-317 — quando `true`, o corpo da árvore vira um estado de erro de
   * rede (mesmo padrão visual de `CheckboxListField.tsx`). Default `false`/
   * ausente → zero mudança de comportamento nos 2 consumidores existentes
   * (nenhum tinha estado de erro dedicado neste componente antes).
   */
  isError?: boolean;
  /** TASK-FE-317 — chamado pelo botão "tentar novamente" do estado de erro. */
  onRetry?: () => void;
  /**
   * TASK-FE-1087 — default `true` (comportamento histórico intocado nos 2
   * consumidores existentes). `false` esconde o botão "Expandir Tudo/
   * Recolher" — usado pelo card de Centros de Custo do form de Categoria
   * Financeira, cuja árvore (`only_top_level=true` no backend) não tem
   * `children` em nenhum nó: expandir/recolher perde sentido (nada a
   * revelar), então o botão é escondido em vez de ficar visível e inerte.
   */
  showExpandCollapse?: boolean;
  /**
   * TASK-FE-1087 — default `false` (comportamento histórico intocado).
   * `true` suprime o rótulo `strings.emptyGroup` nas linhas sem `children`.
   * Existe porque, com `selectableGroups=true` e uma árvore só-de-topo (sem
   * NENHUM nó com filhos), toda linha cairia no ramo "sem filhos" e
   * mostraria "Nenhum centro de custo neste grupo" ao lado de um item que É
   * o próprio centro de custo selecionável — rótulo enganoso neste caso
   * específico. NÃO reaproveita a flag `selectableGroups` para essa decisão
   * porque `CentroCusto/CreateOrUpdateCentroCusto.tsx` também usa
   * `selectableGroups=true` sobre uma árvore de 2 níveis REAL, onde
   * `emptyGroup` ainda é informação verdadeira (grupo sem nenhuma categoria
   * financeira no tenant) — mudar o comportamento por `selectableGroups`
   * quebraria aquele consumidor.
   */
  hideEmptyGroupLabel?: boolean;
}

export function CategoryTreeSelector({
  title,
  tree,
  isLoading,
  selected,
  onChange,
  readOnly = false,
  languageGB,
  searchable = false,
  selectableGroups = false,
  strings: stringsProp,
  isError = false,
  onRetry,
  showExpandCollapse = true,
  hideEmptyGroupLabel = false,
}: CategoryTreeSelectorProps) {
  const strings: CategoryTreeSelectorStrings =
    stringsProp ?? languageGB.planAccounts.planAccount.form.categoriesTree;
  const selectedCountLabel = languageGB.common.aleexAssistant.vulnerabilitiesPanel.selectedCount;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  // Snapshot do colapso MANUAL do usuário (fora de uma busca ativa) — restaurado
  // quando a busca é limpa, em vez de sempre colapsar tudo de novo.
  const manualExpandedRef = useRef<Record<string, boolean>>({});

  const term = searchable ? normalizeSearch(search.trim()) : '';

  const groups = useMemo(() => tree ?? [], [tree]);
  const groupsByUuid = useMemo(() => new Map(groups.map((group) => [group.uuid, group])), [groups]);

  // Grupos exibidos: filtrados pelo termo de busca (mantendo o CAMINHO até o
  // nó — grupo aparece se o próprio título/código bater OU se alguma folha
  // bater, só com as folhas que batem). Sem busca ativa (ou `searchable`
  // ausente), é a árvore inteira, sem transformação — igual ao histórico.
  const displayGroups = useMemo(() => {
    if (!term) return groups;
    return groups.flatMap((group): CategoryTreeSelectorNode[] => {
      const selfMatch =
        normalizeSearch(group.description).includes(term) ||
        normalizeSearch(group.code).includes(term);
      if (selfMatch) return [group];

      const matchingChildren = group.children.filter(
        (leaf) =>
          normalizeSearch(leaf.description).includes(term) ||
          normalizeSearch(leaf.code).includes(term)
      );
      return matchingChildren.length > 0 ? [{ ...group, children: matchingChildren }] : [];
    });
  }, [groups, term]);

  // Busca ativa → expande os grupos com match; busca limpa → volta ao
  // colapso manual anterior do usuário (não força tudo fechado de novo).
  useEffect(() => {
    if (!searchable) return;
    if (term) {
      const next: Record<string, boolean> = {};
      displayGroups.forEach((group) => {
        next[group.uuid] = true;
      });
      setExpanded(next);
    } else {
      setExpanded(manualExpandedRef.current);
    }
    // `displayGroups` deliberadamente fora do array de deps: já deriva de
    // `[groups, term]` — incluí-lo re-executaria este efeito a cada render
    // de `groups` (nova referência de array a cada fetch) sem necessidade,
    // já coberto pela dependência em `term`.
  }, [term, searchable]);

  // Universo de seleção "tudo/nada" (Selecionar Todos, contadores) — sempre a
  // ÁRVORE REAL completa, nunca só o recorte visível de um filtro de busca
  // (evita que "Marcar Todos" durante uma busca deixe de fora quem está
  // fora do filtro no momento).
  const allSelectableUuids = useMemo(
    () =>
      groups.flatMap((group) => {
        const leafUuids = group.children.map((leaf) => leaf.uuid);
        return selectableGroups ? [group.uuid, ...leafUuids] : leafUuids;
      }),
    [groups, selectableGroups]
  );

  const allExpanded =
    displayGroups.length > 0 && displayGroups.every((group) => expanded[group.uuid]);
  const allSelected =
    allSelectableUuids.length > 0 && allSelectableUuids.every((uuid) => selected.has(uuid));

  function expandAll() {
    const next: Record<string, boolean> = {};
    displayGroups.forEach((group) => {
      next[group.uuid] = true;
    });
    setExpanded(next);
    if (!term) manualExpandedRef.current = next;
  }

  function collapseAll() {
    setExpanded({});
    if (!term) manualExpandedRef.current = {};
  }

  function toggleGroupExpanded(group: CategoryTreeSelectorNode) {
    setExpanded((prev) => {
      const next = { ...prev, [group.uuid]: !prev[group.uuid] };
      if (!term) manualExpandedRef.current = next;
      return next;
    });
  }

  function toggleLeaf(uuid: string) {
    if (readOnly) return;
    const next = new Set(selected);
    if (next.has(uuid)) {
      next.delete(uuid);
    } else {
      next.add(uuid);
    }
    onChange(next);
  }

  // Cascata pai→filhos. SEMPRE opera sobre o nó REAL (`groupsByUuid`, folhas
  // completas), nunca sobre o nó filtrado pela busca — clicar no checkbox de
  // um grupo com resultado parcial visível ainda marca/desmarca TODAS as
  // folhas reais do grupo, não só as que batem no filtro no momento.
  function toggleGroup(displayGroup: CategoryTreeSelectorNode) {
    if (readOnly) return;
    const group = groupsByUuid.get(displayGroup.uuid) ?? displayGroup;
    const leafUuids = group.children.map((leaf) => leaf.uuid);
    const idsToToggle = selectableGroups ? [group.uuid, ...leafUuids] : leafUuids;
    if (idsToToggle.length === 0) return;

    const state = groupCheckState(group, selected, selectableGroups);
    const next = new Set(selected);
    if (state === true) {
      idsToToggle.forEach((uuid) => next.delete(uuid));
    } else {
      idsToToggle.forEach((uuid) => next.add(uuid));
    }
    onChange(next);
  }

  // TASK-FE-1087 (complemento) — "Marcar/Desmarcar Todos" opera SÓ sobre o
  // universo visível (`allSelectableUuids`), preservando qualquer uuid já
  // selecionado que não pertença a ele (`preserved` abaixo). Existe porque
  // `selected` pode conter uuid "invisível" na árvore atual — ex.: folha
  // analítica salva pelo comportamento antigo, que não aparece na árvore
  // `only_top_level=true` do card de Centros de Custo da Categoria
  // Financeira. Antes desta correção, `onChange(new Set())`/`onChange(new
  // Set(allSelectableUuids))` SUBSTITUÍA o `Set` inteiro e descartava esse
  // uuid em silêncio; agora ele sobrevive a qualquer clique em "Marcar/
  // Desmarcar Todos".
  function markAll() {
    if (readOnly || allSelectableUuids.length === 0) return;
    const selectableSet = new Set(allSelectableUuids);
    const preserved = new Set([...selected].filter((uuid) => !selectableSet.has(uuid)));
    if (!allSelected) {
      allSelectableUuids.forEach((uuid) => preserved.add(uuid));
    }
    onChange(preserved);
  }

  return (
    <Box border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={3}
        px={4}
        py={3}
        bg="bg.muted"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Flex align="center" gap={2} wrap="wrap">
          <Text fontSize="sm" fontWeight="semibold">
            {title}
          </Text>
          {selected.size > 0 && (
            <Badge colorPalette="green" variant="subtle">
              {selectedCountLabel.replace('{count}', String(selected.size))}
            </Badge>
          )}
        </Flex>

        <Flex gap={2}>
          {showExpandCollapse && (
            <Button
              title={allExpanded ? strings.collapseAll : strings.expandAll}
              variant="outline"
              onClick={allExpanded ? collapseAll : expandAll}
              disabled={displayGroups.length === 0}
            />
          )}
          <Button
            title={allSelected ? strings.deselectAll : strings.selectAll}
            variant={allSelected ? 'outline' : 'solid'}
            colorPalette="green"
            onClick={markAll}
            disabled={readOnly || allSelectableUuids.length === 0}
          />
        </Flex>
      </Flex>

      {searchable && (
        <Box px={4} py={2} borderBottom="1px solid" borderColor="border.subtle">
          <Input
            size="sm"
            maxW="420px"
            placeholder={strings.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Box>
      )}

      <Box p={4} maxH="420px" overflowY="auto">
        {isLoading ? (
          <Flex justify="center" py={8}>
            <Spinner />
          </Flex>
        ) : isError ? (
          <Flex direction="column" align="center" gap={2} py={8}>
            <Icon as={FiAlertCircle} boxSize={5} color="red.400" />
            <Text fontSize="sm" color="fg.muted">
              {strings.errorLabel ?? 'Erro ao carregar a lista.'}
            </Text>
            {onRetry && (
              <Button
                title={strings.retryLabel ?? 'Tentar novamente'}
                variant="outline"
                onClick={onRetry}
              />
            )}
          </Flex>
        ) : groups.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            {strings.noCategories}
          </Text>
        ) : displayGroups.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            {strings.noResults ?? strings.noCategories}
          </Text>
        ) : (
          <VStack align="stretch" gap={1}>
            {displayGroups.map((displayGroup) => {
              const group = groupsByUuid.get(displayGroup.uuid) ?? displayGroup;
              const state = groupCheckState(group, selected, selectableGroups);
              const isOpen = expanded[group.uuid] ?? false;
              const visibleChildren = displayGroup.children;
              const hasChildren = visibleChildren.length > 0;
              const groupDisabled = readOnly || (!selectableGroups && group.children.length === 0);

              return (
                <Box key={group.uuid}>
                  <Flex
                    align="center"
                    gap={2}
                    py={1.5}
                    px={1}
                    borderRadius="md"
                    cursor={hasChildren ? 'pointer' : 'default'}
                    _hover={hasChildren ? { bg: 'bg.subtle' } : undefined}
                    onClick={() => {
                      if (hasChildren) toggleGroupExpanded(group);
                    }}
                  >
                    <Box onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        size="sm"
                        colorPalette="green"
                        checked={state}
                        disabled={groupDisabled}
                        onCheckedChange={() => toggleGroup(displayGroup)}
                        aria-label={group.description}
                      />
                    </Box>
                    <Text flex="1" fontSize="sm" fontWeight="semibold" lineClamp="1">
                      {group.description}
                    </Text>
                    {hasChildren ? (
                      <Icon
                        as={isOpen ? FiChevronDown : FiChevronRight}
                        color="fg.muted"
                        boxSize={4}
                        flexShrink={0}
                      />
                    ) : hideEmptyGroupLabel ? null : (
                      <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                        {strings.emptyGroup}
                      </Text>
                    )}
                  </Flex>

                  {isOpen && hasChildren && (
                    <VStack align="stretch" gap={1.5} pl={7} pt={1} pb={1.5}>
                      {visibleChildren.map((leaf) => (
                        <Checkbox
                          key={leaf.uuid}
                          size="sm"
                          colorPalette="green"
                          checked={selected.has(leaf.uuid)}
                          disabled={readOnly}
                          onCheckedChange={() => toggleLeaf(leaf.uuid)}
                        >
                          <Text fontSize="sm" color="fg.muted">
                            {leaf.description}
                          </Text>
                        </Checkbox>
                      ))}
                    </VStack>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
