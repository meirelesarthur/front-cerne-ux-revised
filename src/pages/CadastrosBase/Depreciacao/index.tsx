// src/pages/CadastrosBase/Depreciacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de DEPRECIAÇÃO MENSAL / DEPRECIAÇÃO ANIMAL
// (Depreciation — Cadastros Base / Bens-Ativos, execução 027, TASK-FE-845).
//
// Rota: /cadastros-base/depreciacao-mensal (ativação da rota real é
// TASK-FE-842, RETIDA nesta leva — este arquivo não mexe em rota/menu).
//
// `[DECISÃO DE DESENHO]` já fechada no contrato de tela §2: 1 ROTA ÚNICA com
// 2 ABAS (`Tabs.Root`, mirror `CreateOrUpdatePerfil.tsx:198-286` — Chakra v3
// direto, com os mesmos `@ts-ignore` de tipos ainda incompatíveis da versão
// instalada), cada uma com seu próprio `TableProvider`/grid/paginação/filtro
// INDEPENDENTES, deep-link `?tab=0|1` via `useCustomSearch`. 1 botão "Gerar"
// único no `HeaderTable`, FORA das abas — sempre alcançável, gated só por
// `depreciations_create` (fecha o defeito do legado: o modal de Equipamento
// nunca tinha trigger).
//
// Read-only PURO — sem create/edit/delete de linha, sem coluna de ações
// (Doc Bruta: só `index()` em ambos os Controllers legados).
//
// `pageSize: 10` nas DUAS grids (mirror `per_page ?? 10` do backend) — NÃO
// o `pageSize: 15` de `Funcoes`. Teto de paginação 100 é respeitado por
// CONSTRUÇÃO: `<Table>` sem `pageSizeOptions` custom usa o default
// `[5,10,25,50,100]` de `SelectPagination.tsx` — o usuário nunca consegue
// selecionar um `per_page` acima de 100 pela própria UI, então o 422 de teto
// do backend nunca é alcançável por uso normal (nada a tratar reativamente).
//
// Fidelidade F-030 (execução 055, roteiro-front-fidelidade-depreciation-
// animal.md): a aba Animal reflete as 8 COLUNAS do Blade legado, NA ORDEM
// e com os NOMES do legado — `App\Animal` já tem Resource formal
// (TASK-DEPA-01), então "Animal" mostra `animal.identification` (o uuid
// truncado passa a Tooltip secundário, não mais o texto visível).
//
// Ambos os hooks de listagem (`useDepreciationEquipmentList`/
// `useDepreciationAnimalList`) são chamados incondicionalmente (regra dos
// hooks) — se o usuário só tem 1 das 2 permissões, a aba correspondente
// simplesmente não é renderizada (a rota já é gated por `anyOf`, então pelo
// menos 1 permissão sempre existe); a query da aba oculta pode retornar 403
// sem efeito visível (sem `onError`/toast configurado em
// `useCustomGridQuery`, mesmo comportamento inofensivo de outras telas com
// abas sempre montadas, ex.: `CreateOrUpdatePerfil.tsx`).
//
// [ADENDO — execução 055, DECISÃO DO DONO "navegação fiel ao legado"]
// Prop `mode` (`'both'` default | `'animal'`) parametriza esta MESMA tela p/
// atender também a rota STANDALONE `/cadastros-base/depreciacao-animal`
// (item de menu próprio "Depreciação Animal", mirror do legado — não é mais
// só uma aba). `mode="animal"` força `canViewEquipment=false` — como TODO o
// bloco Equipamento (Tabs.List/Content/FilterSide) já é gated por
// `canViewEquipment`, ele simplesmente some, SEM duplicar JSX/lógica; o
// conteúdo da aba Animal (`animalPanel`) é extraído 1x e reusado tanto
// dentro de `Tabs.Root` (`mode="both"`) quanto solto, sem barra de abas
// (`mode="animal"`). `useDepreciationEquipmentList` continua disparando em
// background nesse modo (mesmo efeito inofensivo já documentado acima p/
// aba oculta) — não há chamada nova, só a UI de Equipamento não aparece.
// `mode="both"` (rota `/cadastros-base/depreciacao-mensal`) permanece 100%
// IDÊNTICO ao comportamento anterior — Equipamento intocado.
// -----------------------------------------------------------------------------

import { ElementType, useMemo } from 'react';

import { Box, Tabs, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiActivity, FiTool } from 'react-icons/fi';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Tooltip } from '@/components/ui/tooltip';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { depreciationGenerateType } from '@/@types/v2/Depreciations';
import type {
  DepreciationAnimalFilterForm,
  DepreciationAnimalListItem,
  DepreciationEquipmentListItem,
  DepreciationFilterForm,
  DepreciationGenerateType,
} from '@/@types/v2/Depreciations';

import { FilterSideDepreciacao } from './FilterSideDepreciacao';
import { GerarDepreciacaoModal } from './GerarDepreciacaoModal';
import { HeaderTable } from './HeaderTable';
import {
  useDepreciationAnimalList,
  useDepreciationEquipmentList,
  useGenerateDepreciation,
} from './useDepreciacao';

// Companheiro display-only do `SelectAsyncPaginate` de `equipment_uuid`
// (mirror `cbo_uuid_label` de Funcoes) — nunca conta como filtro real na
// badge "Filtros(N)".
const DISPLAY_ONLY_FILTER_KEYS = ['equipment_uuid_label'];

// Competência `MM/AAAA` — mirror `PrevisaoDepreciacao.tsx` (sem
// `Intl`/`date-fns`, contrato de tela §7.1).
function formatCompetencia(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${year}`;
}

function formatCurrencyBRL(value: number): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export interface DepreciacaoListProps {
  /** `'both'` (default) — tela unificada com abas Equipamento/Animal,
   *  mirror da rota `/cadastros-base/depreciacao-mensal` (execução 027,
   *  comportamento INTOCADO). `'animal'` — modo STANDALONE (execução 055,
   *  navegação fiel ao legado): renderiza SÓ o conteúdo da aba Animal, SEM
   *  a barra de abas, reusando a mesma lógica/hooks/colunas/filtro/modal —
   *  consumido pela rota dedicada `/cadastros-base/depreciacao-animal`. */
  mode?: 'both' | 'animal';
}

export default function DepreciacaoList({ mode = 'both' }: DepreciacaoListProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.depreciations.list;
  const tabsText = languageGB.depreciations.tabs;

  const isAnimalOnly = mode === 'animal';
  const canViewEquipment = !isAnimalOnly && can('depreciations_view');
  const canViewAnimal = can('depreciation_animals_view');

  // ---- Abas (deep-link `?tab=0|1`) ----------------------------------------
  const { tabIndex, handleTabsChange } = useCustomSearch(0);

  const availableTabIndexes = [canViewEquipment ? 0 : null, canViewAnimal ? 1 : null].filter(
    (value): value is number => value !== null
  );
  // A rota já é gated por `anyOf: [depreciations_view, depreciation_animals_view]`
  // (TASK-FE-842) — pelo menos 1 índice sempre existe em produção; o
  // fallback `?? 0` é só defensivo (ex.: preview isolado deste componente).
  const resolvedTabIndex = availableTabIndexes.includes(tabIndex)
    ? tabIndex
    : (availableTabIndexes[0] ?? 0);

  // ---- Aba Equipamento (`depreciations_view`) -----------------------------
  const defaultQueryOptionsEquipment = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        'CadastrosBaseDepreciacaoEquipment' + queryKey.depreciations.depreciationEquipmentList,
    }),
    []
  );

  const {
    paginatedQuery: paginatedQueryEquipment,
    handlePaginatedQuery: handlePaginatedQueryEquipment,
    handleFilterChange: handleFilterChangeEquipment,
    handleResetFilter: handleResetFilterEquipment,
  } = userPaginatedQuery<DepreciationFilterForm>(defaultQueryOptionsEquipment);

  const {
    open: isFilterOpenEquipment,
    onOpen: onOpenFilterEquipment,
    onClose: onCloseFilterEquipment,
  } = useDisclosure();

  const filtersAppliedEquipment = useMemo(
    () =>
      Object.entries(paginatedQueryEquipment.filter ?? {}).filter(
        ([key, v]) =>
          !DISPLAY_ONLY_FILTER_KEYS.includes(key) && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQueryEquipment.filter]
  );

  const equipmentList = useDepreciationEquipmentList({
    paginatedQuery: paginatedQueryEquipment,
    setPaginatedQuery: handlePaginatedQueryEquipment,
    filter: paginatedQueryEquipment.filter ?? undefined,
  });

  const equipmentColumnHelper = createColumnHelper<DepreciationEquipmentListItem>();
  const equipmentColumns = useMemo(
    () => [
      equipmentColumnHelper.display({
        id: 'competencia',
        header: text.equipment.table.period,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatCompetencia(row.original.month, row.original.year)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      equipmentColumnHelper.display({
        id: 'equipment',
        header: text.equipment.table.equipment,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.equipment.code} — {row.original.equipment.description}
          </Text>
        ),
      }),
      equipmentColumnHelper.accessor('vl_depreciate', {
        header: text.equipment.table.valueToDepreciate,
        cell: ({ row }) => (
          <Text lineClamp="1">{formatCurrencyBRL(row.original.vl_depreciate)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      equipmentColumnHelper.accessor('vl_depreciation', {
        header: text.equipment.table.monthlyDepreciation,
        cell: ({ row }) => (
          <Text lineClamp="1">{formatCurrencyBRL(row.original.vl_depreciation)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      equipmentColumnHelper.accessor('sd_depreciate', {
        header: text.equipment.table.remainingBalance,
        cell: ({ row }) => (
          <Text lineClamp="1">{formatCurrencyBRL(row.original.sd_depreciate)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      equipmentColumnHelper.accessor('processed_date', {
        header: text.equipment.table.processedDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.processed_date)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [text]
  );

  const isLoadingEquipment = checkLoadingStatus([equipmentList]);
  const equipmentItems = equipmentList.data?.data?.items;
  const isEmptyEquipment = !isLoadingEquipment && (equipmentItems?.length ?? 0) === 0;

  // ---- Aba Animal (`depreciation_animals_view`) ---------------------------
  const defaultQueryOptionsAnimal = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseDepreciacaoAnimal' + queryKey.depreciations.depreciationAnimalList,
    }),
    []
  );

  const {
    paginatedQuery: paginatedQueryAnimal,
    handlePaginatedQuery: handlePaginatedQueryAnimal,
    handleFilterChange: handleFilterChangeAnimal,
    handleResetFilter: handleResetFilterAnimal,
  } = userPaginatedQuery<DepreciationAnimalFilterForm>(defaultQueryOptionsAnimal);

  const {
    open: isFilterOpenAnimal,
    onOpen: onOpenFilterAnimal,
    onClose: onCloseFilterAnimal,
  } = useDisclosure();

  const filtersAppliedAnimal = useMemo(
    () =>
      Object.values(paginatedQueryAnimal.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQueryAnimal.filter]
  );

  const animalList = useDepreciationAnimalList({
    paginatedQuery: paginatedQueryAnimal,
    setPaginatedQuery: handlePaginatedQueryAnimal,
    filter: paginatedQueryAnimal.filter ?? undefined,
  });

  // Ordem/nomes/fontes EXATOS do grid de 8 colunas do Blade legado (roteiro
  // §"Gap vs legado" — F-030). NÃO reordenar, NÃO reusar `text.equipment.table.*`.
  const animalColumnHelper = createColumnHelper<DepreciationAnimalListItem>();
  const animalColumns = useMemo(
    () => [
      // 1. Animal — animal.identification (Resource já expõe); uuid vira Tooltip secundário.
      animalColumnHelper.display({
        id: 'animal',
        header: text.animal.table.animal,
        cell: ({ row }) => (
          <Tooltip content={row.original.animal.uuid}>
            <Text fontSize="sm" lineClamp="1" cursor="default">
              {row.original.animal.identification}
            </Text>
          </Tooltip>
        ),
      }),
      // 2. Data de Entrada — animal.entry_date (coluna NOVA).
      animalColumnHelper.display({
        id: 'entry_date',
        header: text.animal.table.entryDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.animal.entry_date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      // 3. Vl.p/depreciar — vl_depreciate.
      animalColumnHelper.accessor('vl_depreciate', {
        header: text.animal.table.valueToDepreciate,
        cell: ({ row }) => (
          <Text lineClamp="1">{formatCurrencyBRL(row.original.vl_depreciate)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      // 4. Dt. Processamento — created_at (NÃO processed_date, decisão nº7).
      animalColumnHelper.accessor('created_at', {
        header: text.animal.table.processedDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.created_at)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      // 5. Mês — month (número cru, coluna NOVA separada de Competência).
      animalColumnHelper.accessor('month', {
        header: text.animal.table.month,
        cell: ({ row }) => <Text fontSize="sm">{row.original.month}</Text>,
        meta: styleColumTable.sm,
      }),
      // 6. Ano — year (coluna NOVA separada de Competência).
      animalColumnHelper.accessor('year', {
        header: text.animal.table.year,
        cell: ({ row }) => <Text fontSize="sm">{row.original.year}</Text>,
        meta: styleColumTable.sm,
      }),
      // 7. Vl. Dep. Mês — vl_depreciation.
      animalColumnHelper.accessor('vl_depreciation', {
        header: text.animal.table.monthlyDepreciation,
        cell: ({ row }) => (
          <Text lineClamp="1">{formatCurrencyBRL(row.original.vl_depreciation)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      // 8. Sd. á Depreciar — sd_depreciate.
      animalColumnHelper.accessor('sd_depreciate', {
        header: text.animal.table.remainingBalance,
        cell: ({ row }) => (
          <Text lineClamp="1">{formatCurrencyBRL(row.original.sd_depreciate)}</Text>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [text]
  );

  const isLoadingAnimal = checkLoadingStatus([animalList]);
  const animalItems = animalList.data?.data?.items;
  const isEmptyAnimal = !isLoadingAnimal && (animalItems?.length ?? 0) === 0;

  // ---- Filtro contextual à aba ATIVA (botão único no HeaderTable) --------
  function handleOpenFilter() {
    if (resolvedTabIndex === 0) {
      onOpenFilterEquipment();
    } else {
      onOpenFilterAnimal();
    }
  }

  const activeFiltersApplied =
    resolvedTabIndex === 0 ? filtersAppliedEquipment : filtersAppliedAnimal;
  const activeSubtitle =
    resolvedTabIndex === 0 ? text.equipment.pageSubtitle : text.animal.pageSubtitle;

  // ---- Modal "Gerar" — botão único, FORA das abas, gated `depreciations_create` (§2/§9) ----
  const {
    open: isOpenGenerateModal,
    onOpen: onOpenGenerateModal,
    onClose: onCloseGenerateModal,
  } = useDisclosure();

  const generateMutation = useGenerateDepreciation({
    onSuccess: () => {
      onCloseGenerateModal();
    },
  });

  const generateDefaultType: DepreciationGenerateType =
    resolvedTabIndex === 0 ? depreciationGenerateType.equipment : depreciationGenerateType.animal;

  // ---- Conteúdo da aba Animal extraído 1x (execução 055) — reusado dentro
  // de `Tabs.Content` (mode="both") e solto, sem barra de abas (mode="animal").
  const animalPanel = (
    <Box pt={4}>
      <TableProvider
        data={animalItems}
        columns={animalColumns}
        pagination={paginatedQueryAnimal}
        setPagination={handlePaginatedQueryAnimal}
        enableMultiRowSelection={false}
      >
        <Table
          isLoading={isLoadingAnimal}
          isError={animalList.isError}
          error={animalList.error}
          isEmpty={isEmptyAnimal}
          onRetry={() => animalList.refetch()}
          isRetrying={animalList.isFetching}
          retryLabel={text.animal.error.retry}
          emptyIcon={FiActivity as ElementType}
          emptyTitle={
            filtersAppliedAnimal > 0
              ? text.animal.emptyState.titleFiltered
              : text.animal.emptyState.titleEmpty
          }
          emptyDescription={
            filtersAppliedAnimal > 0
              ? text.animal.emptyState.descriptionFiltered
              : text.animal.emptyState.descriptionEmpty
          }
          canCreate={false}
        />
      </TableProvider>
    </Box>
  );

  return (
    <ContainerGrid>
      <HeaderGrid
        header={
          <HeaderTable
            onOpenFilter={handleOpenFilter}
            onOpenGenerateModal={onOpenGenerateModal}
            filtersApplied={activeFiltersApplied}
            languageGB={languageGB}
          />
        }
      >
        <VStack align="flex-start" gap={1}>
          <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
            {isAnimalOnly ? text.animal.pageTitle : text.equipment.pageTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {activeSubtitle}
          </Text>
        </VStack>
      </HeaderGrid>

      <Box mt={6}>
        {isAnimalOnly ? (
          // mode="animal" (execução 055) — tela STANDALONE, SEM barra de
          // abas, reusando o mesmo `animalPanel` da aba (nenhuma
          // duplicação de lógica/colunas/filtro/modal).
          canViewAnimal && animalPanel
        ) : (
          /* @ts-ignore - Chakra UI v3 Tabs API */
          <Tabs.Root
            value={String(resolvedTabIndex)}
            onValueChange={(e: any) => handleTabsChange(Number(e.value))}
            variant="line"
          >
            {/* @ts-ignore */}
            <Tabs.List>
              {canViewEquipment && (
                // @ts-ignore
                <Tabs.Trigger value="0">{tabsText.equipment}</Tabs.Trigger>
              )}
              {canViewAnimal && (
                // @ts-ignore
                <Tabs.Trigger value="1">{tabsText.animal}</Tabs.Trigger>
              )}
            </Tabs.List>

            {canViewEquipment && (
              // @ts-ignore
              <Tabs.Content value="0">
                <Box pt={4}>
                  <TableProvider
                    data={equipmentItems}
                    columns={equipmentColumns}
                    pagination={paginatedQueryEquipment}
                    setPagination={handlePaginatedQueryEquipment}
                    enableMultiRowSelection={false}
                  >
                    <Table
                      isLoading={isLoadingEquipment}
                      isError={equipmentList.isError}
                      error={equipmentList.error}
                      isEmpty={isEmptyEquipment}
                      onRetry={() => equipmentList.refetch()}
                      isRetrying={equipmentList.isFetching}
                      retryLabel={text.equipment.error.retry}
                      emptyIcon={FiTool as ElementType}
                      emptyTitle={
                        filtersAppliedEquipment > 0
                          ? text.equipment.emptyState.titleFiltered
                          : text.equipment.emptyState.titleEmpty
                      }
                      emptyDescription={
                        filtersAppliedEquipment > 0
                          ? text.equipment.emptyState.descriptionFiltered
                          : text.equipment.emptyState.descriptionEmpty
                      }
                      canCreate={false}
                    />
                  </TableProvider>
                </Box>
              </Tabs.Content>
            )}

            {canViewAnimal && (
              // @ts-ignore
              <Tabs.Content value="1">{animalPanel}</Tabs.Content>
            )}
          </Tabs.Root>
        )}
      </Box>

      {canViewEquipment && (
        <FilterSideDepreciacao
          domain="equipment"
          isOpen={isFilterOpenEquipment}
          onClose={onCloseFilterEquipment}
          handleFilterChange={(data) => handleFilterChangeEquipment(data as DepreciationFilterForm)}
          handleReset={handleResetFilterEquipment}
          filter={paginatedQueryEquipment.filter}
          languageGB={languageGB}
        />
      )}

      {canViewAnimal && (
        <FilterSideDepreciacao
          domain="animal"
          isOpen={isFilterOpenAnimal}
          onClose={onCloseFilterAnimal}
          handleFilterChange={(data) =>
            handleFilterChangeAnimal(data as DepreciationAnimalFilterForm)
          }
          handleReset={handleResetFilterAnimal}
          filter={paginatedQueryAnimal.filter}
          languageGB={languageGB}
        />
      )}

      <GerarDepreciacaoModal
        isOpen={isOpenGenerateModal}
        onClose={onCloseGenerateModal}
        defaultType={generateDefaultType}
        languageGB={languageGB}
        mutation={generateMutation}
      />
    </ContainerGrid>
  );
}
