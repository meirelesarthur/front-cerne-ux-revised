// src/pages/Fiscal/Dfe/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de DFe Recebidas (Dfe — domínio Fiscal, execução
// 044, TASK-DFE-FE-05). Depende de `TASK-DFE-FE-03` (fundação) e
// `TASK-DFE-FE-04` (filtro). Consome `GET /api/v1/dfes`
// (`CONTRATO-API-DFE.md §6`). Mirror estrutural
// `BaseRegistrations/NfseRecebidas/index.tsx` (mesmo domínio Fiscal, mesmo
// tipo de tela — documento fiscal de terceiro, sem CRUD) combinado com a
// seleção em massa controlada de `Administrativo/SaldoEstoque/index.tsx`
// (`CONTRATO-TELA-DFE-FE.md §4`).
//
// 12 colunas (LST-01..12, `contrato-dfe-norm.md`): integracao, selecao,
// fornecedor(Emissor), ie_fornecedor, ie_destinatario, numero_nfe, valor,
// data_emissao, manifesto, prazo_manifesto, lancada, acoes.
//
// Seleção em massa (`rowSelection: RowSelectionState`, `getRowId=uuid`):
// ÚNICO ponto de validação (`handleRowSelectionChange`) fecha 2 regras ao
// mesmo tempo — (1) cap de 20 (`ACT-05`/`IG-06`/`IG-08`, toast + rejeita
// mudança) e (2) elegibilidade `tipo_evento ∈ {0,1}` (`§6.2`), fechando o
// loophole de clique de célula em linha inelegível (`Table.tsx` chama
// `row.getToggleSelectedHandler()` em qualquer célula não-`acoes`/`select`).
//
// Ações de lançamento cross-módulo (Produto/Animal, TASK-DFE-FE-08) e
// "Lançar Retorno" (destino `DfeReturnLinking`, TASK-DFE-FE-09) — a Dfe NÃO
// tem endpoint próprio de lançamento (`CONTRATO-API-DFE.md §6.1`): Produto/
// Animal baixam o XML (`downloadDfeXml`, reuso), convertem para `File`
// (`blobToFile`) e chamam DIRETO o MESMO service/endpoint que o upload
// manual dos módulos de destino já chama (`parseInvoiceXml`/
// `importMovementPurchaseXml`) — nenhuma lógica de criação duplicada. O
// draft resolvido viaja via `state` de navegação para
// `/administrativo/doc-fiscal/novo`/`/operacional/compra-animais/novo`, que
// aplicam o MESMO `handleXmlImported`/`handleApplyXmlDraft` que já rodam no
// upload manual (edição mínima nesses 2 arquivos — só pular o passo do
// picker quando o draft já chega pronto, ver comentário local em cada um).
//
// Despesa (`canLaunchExpense`) permanece OCULTA — GAP registrado nesta
// Tarefa (não um "ainda não implementado" igual ao batch anterior): o
// endpoint real `POST /expenses/xml`
// (`ParseExpenseNfseXmlAction::loadXml`) REJEITA explicitamente qualquer XML
// cuja raiz exponha `NFe`/`infNFe` ("Este XML não é de NFSe") — o parser é
// EXCLUSIVO para o layout municipal de NFSe. O XML de uma `Dfe` (`GET
// /dfes/{uuid}/xml`) É SEMPRE uma NFe (mirror `chave` = chave de acesso NFe
// real, 44 dígitos). Encaminhar esse XML para `/expenses/xml` sempre
// resultaria em 422 de negócio — `CONTRATO-API-DFE.md §6.1` presumiu
// compatibilidade que o código real do backend não tem. Handoff ao
// Architect (Gap `[PARA ANÁLISE]`, ver relatório de entrega desta Tarefa) —
// SEM MOCK, não inventado nenhum encaminhamento alternativo.
//
// Retorno não baixa XML nenhum (`CONTRATO-TELA-DFE-FE.md §3`): só leva
// `chave`/`cpf_cnpj`/`valor`/`razao_social`, já em mãos nesta linha, via
// `state` de navegação para `DfeReturnLinking` (TASK-DFE-FE-09).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';
import { useMemo, useState } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  HStack,
  Icon,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { blobToFile } from '@/utils/blobToFile';
import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { getDfeManifestDeadline } from '@/utils/dfeManifestDeadline';
import {
  canDocuments,
  canLaunchInvoiceOrAnimal,
  canLaunchReturn,
  canManifestRow,
  canTogglePersonal,
  canToggleShipment,
  isRowSelectable,
} from '@/utils/dfeRowRules';
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { extractBlobApiError } from '@/utils/extractBlobApiError';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { getDfeManifestEventSlot } from '@/constants/Fiscal/dfe/dfe-manifest-event';
import {
  dfeStatusOptions,
  DfeStatusValue,
} from '@/constants/Fiscal/dfe/options/dfe-status-options';
import { queryKey } from '@/constants/query-key';

import {
  downloadDfeXml,
  generateDfeDanfe,
  listDfes,
  toggleDfePersonal,
  toggleDfeShipment,
} from '@/services/v2/Fiscal/dfe-service';
import { parseInvoiceXml } from '@/services/v2/Invoices/invoice-service';
import { importMovementPurchaseXml } from '@/services/v2/MovementPurchases/movement-purchase-service';

import type { DfeFilterForm, DfeListItem } from '@/@types/v2/Fiscal/dfe';

import { DfeActionsMenu } from './DfeActionsMenu';
import { DfeManifestModal } from './DfeManifestModal';
import { FilterSideDfe } from './FilterSideDfe';
import { HeaderTable } from './HeaderTable';
import { DFE_RECEBIDAS_STORAGE_KEY } from './storage';

import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table';

import { PageHeader } from '@/components/ui/PageHeader';

// ACT-05/IG-06/IG-08 — cap de seleção em massa (individual OU lote).
const MAX_BULK_SELECTION = 20;

// P-FE-02 (default): o DANFE abre em nova aba; a Object URL é revogada depois.
const DANFE_URL_REVOKE_DELAY_MS = 60_000;

// Mensagem REAL da API também em downloads `responseType: 'blob'` (o corpo do
// erro chega como Blob — `extractBlobApiError` o decodifica), com fallback.
async function resolveDocumentErrorMessage(error: unknown, fallback: string): Promise<string> {
  return (await extractBlobApiError(error)) ?? extractApiErrorMessage(error) ?? fallback;
}

export default function DfeRecebidasList() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const text = languageGB.dfes.dfe.list;

  const canManifestPerm = can('dfe_manifest') || can('dfe_fiscal_manifest');
  const canDanfePerm = can('dfe_danfe') || can('dfe_fiscal_danfe');
  const canXmlPerm = can('dfe_xml') || can('dfe_fiscal_xml');
  const canEditPerm = can('dfe_edit') || can('dfe_fiscal_edit');
  // `dfe_launch`/`dfe_fiscal_launch` — permissão de MENU/visibilidade dos 4
  // botões de lançamento (`CONTRATO-API-DFE.md §6.1`); a permissão de
  // ESCRITA em si pertence ao módulo de destino (guardada na PRÓPRIA rota de
  // Invoice/MovementPurchase/MovementSale, Lei 9 — nunca duplicada aqui).
  const canLaunchPerm = can('dfe_launch') || can('dfe_fiscal_launch');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: DFE_RECEBIDAS_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DfeFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const hasIssuer = Boolean(paginatedQuery.filter?.issue_uuid);

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const extraFiltersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) => key !== 'issue_uuid' && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Grid (RN-1: só dispara com Emissor selecionado, mirror NfseRecebidas) ----
  const dfesList = useCustomGridQuery<DfeListItem, DfeFilterForm>({
    asyncFunction: listDfes,
    queryKey: queryKey.dfes.dfesList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as DfeFilterForm),
    enabled: hasIssuer,
  });

  const items = hasIssuer ? dfesList.data?.data?.items : undefined;
  const itemsByUuid = useMemo(
    () => new Map((items ?? []).map((item) => [item.uuid, item])),
    [items]
  );

  // ---- Seleção em massa CONTROLADA (uuid), ÚNICO ponto de validação -------
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater;

    // Fecha o DIV-09-equivalente desta tela: qualquer clique de célula
    // (não só o checkbox) chama `row.getToggleSelectedHandler()` — sem este
    // filtro, uma linha inelegível (`tipo_evento` fora de {0,1}) poderia ser
    // selecionada clicando numa célula de dados, mesmo sem checkbox visível.
    const eligibleEntries = Object.entries(next).filter(([uuid, checked]) => {
      if (!checked) return false;
      const item = itemsByUuid.get(uuid);
      return item ? isRowSelectable(item.tipo_evento) : false;
    });

    if (eligibleEntries.length > MAX_BULK_SELECTION) {
      toaster.warning({
        title: text.pageTitle,
        description: text.bulkSelection.limitExceeded,
      });
      return; // rejeita — mantém a seleção anterior intacta
    }

    setRowSelection(Object.fromEntries(eligibleEntries.map(([uuid]) => [uuid, true])));
  };

  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  function handleToggleSelectAllOnPage() {
    const eligibleUuidsOnPage = (items ?? [])
      .filter((item) => isRowSelectable(item.tipo_evento))
      .map((item) => item.uuid);

    const allSelected =
      eligibleUuidsOnPage.length > 0 && eligibleUuidsOnPage.every((uuid) => rowSelection[uuid]);

    const next = { ...rowSelection };
    eligibleUuidsOnPage.forEach((uuid) => {
      if (allSelected) delete next[uuid];
      else next[uuid] = true;
    });

    handleRowSelectionChange(next);
  }

  // ---- Downloads (leitura, sem mutation — loading POR LINHA) --------------
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  const [generatingDanfeUuid, setGeneratingDanfeUuid] = useState<string | null>(null);

  async function handleDownloadXml(row: DfeListItem) {
    setDownloadingUuid(row.uuid);
    try {
      const blob = await downloadDfeXml(row.uuid);
      downloadBlob(blob, `xml_nfe_${row.chave || row.number}.xml`);
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: await resolveDocumentErrorMessage(error, text.downloadXmlError),
      });
    } finally {
      setDownloadingUuid(null);
    }
  }

  async function handleGenerateDanfe(row: DfeListItem) {
    setGeneratingDanfeUuid(row.uuid);
    try {
      const blob = await generateDfeDanfe(row.uuid);
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, '_blank');
      if (popup) {
        setTimeout(() => URL.revokeObjectURL(url), DANFE_URL_REVOKE_DELAY_MS);
      } else {
        // Popup bloqueado: cai para o download do arquivo.
        URL.revokeObjectURL(url);
        downloadBlob(blob, `danfe-${row.chave || row.number}.pdf`);
      }
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: await resolveDocumentErrorMessage(error, text.generateDanfeError),
      });
    } finally {
      setGeneratingDanfeUuid(null);
    }
  }

  // ---- Lançamentos cross-módulo (Produto/Animal, TASK-DFE-FE-08) ----------
  // Loading POR LINHA (mirror `handleDownloadXml`/`handleGenerateDanfe`
  // acima) — guarda as 3 ações de lançamento contra duplo clique na MESMA
  // linha enquanto o XML é baixado/processado (`DfeActionsMenu.isLaunching`).
  const [launchingUuid, setLaunchingUuid] = useState<string | null>(null);

  async function handleLaunchInvoice(row: DfeListItem) {
    setLaunchingUuid(row.uuid);
    try {
      const blob = await downloadDfeXml(row.uuid);
      const file = blobToFile(blob, `xml_nfe_${row.chave || row.number}.xml`);
      const { data: draft } = await parseInvoiceXml(file);
      // `CreateOrUpdateInvoice.tsx` lê `location.state.dfeXmlDraft` no mount
      // (só em criação) e aplica o MESMO `handleXmlImported` do upload
      // manual — nenhuma tela nova, nenhuma lógica de criação duplicada.
      navigate('/administrativo/doc-fiscal/novo', { state: { dfeXmlDraft: draft } });
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: await resolveDocumentErrorMessage(error, text.launchGenericError),
      });
    } finally {
      setLaunchingUuid(null);
    }
  }

  async function handleLaunchAnimal(row: DfeListItem) {
    setLaunchingUuid(row.uuid);
    try {
      const blob = await downloadDfeXml(row.uuid);
      const file = blobToFile(blob, `xml_nfe_${row.chave || row.number}.xml`);
      const { data: draft } = await importMovementPurchaseXml(file);
      // `CreateOrUpdateMovementPurchase.tsx` lê `location.state.dfeXmlDraft`
      // no mount (só em criação) e aplica o MESMO `handleApplyXmlDraft` do
      // diálogo de upload manual.
      navigate('/operacional/compra-animais/novo', { state: { dfeXmlDraft: draft } });
    } catch (error) {
      toaster.error({
        title: text.pageTitle,
        description: await resolveDocumentErrorMessage(error, text.launchGenericError),
      });
    } finally {
      setLaunchingUuid(null);
    }
  }

  // "Lançar Retorno" — NÃO baixa XML. UT-000752 (T-752-FE-03): navega só com
  // o uuid; o cabeçalho da tela vem da API (`return-candidates`), então o
  // contexto sobrevive a F5 (sem `location.state`).
  function handleLaunchReturn(row: DfeListItem) {
    navigate(`/fiscal/dfes/${row.uuid}/retorno`);
  }

  // ---- Toggles pessoal/remessa (TASK-DFE-FE-06) ---------------------------
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);

  const personalMutation = useMutation({
    mutationFn: (uuid: string) => toggleDfePersonal(uuid),
    onMutate: (uuid) => setTogglingUuid(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.dfes.dfesList] });
      toaster.success({ title: text.pageTitle, description: text.toggleSuccess });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.toggleError,
      });
    },
    onSettled: () => setTogglingUuid(null),
  });

  const shipmentMutation = useMutation({
    mutationFn: (uuid: string) => toggleDfeShipment(uuid),
    onMutate: (uuid) => setTogglingUuid(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.dfes.dfesList] });
      toaster.success({ title: text.pageTitle, description: text.toggleSuccess });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.toggleError,
      });
    },
    onSettled: () => setTogglingUuid(null),
  });

  // ---- Manifestação (individual/lote, TASK-DFE-FE-06) ---------------------
  const {
    open: isManifestModalOpen,
    onOpen: onOpenManifestModal,
    onClose: onCloseManifestModal,
  } = useDisclosure();
  const [manifestUuids, setManifestUuids] = useState<string[]>([]);
  const [manifestSingleDataEmissao, setManifestSingleDataEmissao] = useState<string | undefined>();

  function handleOpenManifestIndividual(row: DfeListItem) {
    setManifestUuids([row.uuid]);
    setManifestSingleDataEmissao(row.data_emissao);
    onOpenManifestModal();
  }

  function handleOpenManifestBatch() {
    if (selectedUuids.length === 0) return;
    setManifestUuids(selectedUuids);
    setManifestSingleDataEmissao(undefined);
    onOpenManifestModal();
  }

  function handleManifestSuccess() {
    setRowSelection({});
  }

  // ---- Colunas --------------------------------------------------------------
  const columnHelper = createColumnHelper<DfeListItem>();
  const defaultColumns = useMemo(
    () => [
      // LST-01 — status de integração (dot cinza=P, azul=E).
      columnHelper.accessor('integration_status', {
        header: text.table.integrationStatus,
        cell: ({ row }) => (
          <Box
            boxSize="2.5"
            borderRadius="full"
            bg={row.original.integration_status === 'E' ? 'blue.500' : 'gray.400'}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.integrationStatus },
      }),
      // LST-02 — checkbox de seleção em massa, só linhas elegíveis (§6.2).
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          if ((items?.length ?? 0) === 0 || (items?.length ?? 0) > MAX_BULK_SELECTION) return null;

          const eligible = table
            .getRowModel()
            .rows.filter((row) => isRowSelectable(row.original.tipo_evento));
          const allSelected = eligible.length > 0 && eligible.every((row) => row.getIsSelected());
          const someSelected = eligible.some((row) => row.getIsSelected());

          return (
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={handleToggleSelectAllOnPage}
              aria-label={text.bulkSelection.selectAllDisabledHint}
              disabled={eligible.length === 0}
            />
          );
        },
        enableHiding: false,
        cell: ({ row }) =>
          isRowSelectable(row.original.tipo_evento) ? (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={() => row.toggleSelected()}
              aria-label={row.original.chave}
            />
          ) : null,
        meta: { gridLabel: '', gridOrder: 'fixed-start', gridDataColumn: false },
      }),
      // LST-03 — Emissor (razao_social desnormalizado).
      columnHelper.accessor('razao_social', {
        header: text.table.emissor,
        cell: ({ row }) => <Text lineClamp="1">{row.original.razao_social}</Text>,
        meta: { gridLabel: text.table.emissor },
      }),
      // LST-04 — IE Fornecedor.
      columnHelper.accessor('issue_ie', {
        header: text.table.ieFornecedor,
        cell: ({ row }) => <Text fontSize="sm">{row.original.issue_ie || '--'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.table.ieFornecedor },
      }),
      // LST-05 — IE Destinatário.
      columnHelper.accessor('ie', {
        header: text.table.ieDestinatario,
        cell: ({ row }) => <Text fontSize="sm">{row.original.ie || '--'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.table.ieDestinatario },
      }),
      // LST-06 — Número (+ Série, quando existir).
      columnHelper.accessor('number', {
        header: text.table.numero,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.number}
            {row.original.serie ? `/${row.original.serie}` : ''}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.numero },
      }),
      // LST-07 — Valor.
      columnHelper.accessor('valor', {
        header: text.table.valor,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.valor)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.valor },
      }),
      // LST-08 — Data de emissão (locale + hora).
      columnHelper.accessor('data_emissao', {
        header: text.table.dtEmissao,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.data_emissao, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.dtEmissao },
      }),
      // LST-09 — Manifesto (badge tipo_evento, `ClassificationBadge`).
      columnHelper.accessor('tipo_evento', {
        header: text.table.manifesto,
        cell: ({ row }) => (
          <ClassificationBadge slot={getDfeManifestEventSlot(row.original.tipo_evento)}>
            {dfeStatusOptions.getLabel(row.original.tipo_evento as DfeStatusValue, languageGB)}
          </ClassificationBadge>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.table.manifesto },
      }),
      // LST-10 — Prazo Manifesto (CALC-01, 100% client-side).
      columnHelper.display({
        id: 'prazo_manifesto',
        header: text.table.prazoManifesto,
        cell: ({ row }) => {
          const deadline = getDfeManifestDeadline(
            row.original.data_emissao,
            row.original.tipo_evento
          );
          const prazoText = languageGB.dfes.dfe.list.prazoManifesto;

          if (deadline.status === 'manifested') {
            return (
              <ClassificationBadge slot="neutral">{prazoText.manifestado}</ClassificationBadge>
            );
          }
          if (deadline.status === 'expired') {
            return <ClassificationBadge slot="slot4">{prazoText.encerrado}</ClassificationBadge>;
          }
          if (deadline.status === 'warning') {
            return (
              <ClassificationBadge slot="slot6">
                {prazoText.restamDias.replace('{{days}}', String(deadline.daysRemaining))}
              </ClassificationBadge>
            );
          }
          return (
            <Text fontSize="sm" color="fg.muted">
              --
            </Text>
          );
        },
        meta: { ...styleColumTable.md, gridLabel: text.table.prazoManifesto },
      }),
      // LST-11 — Lançada (precedência launched_in > Pessoal > Remessa >
      // "Não lançada" — CLM-DFe-039, NUNCA inverter a ordem).
      columnHelper.accessor('launched_in', {
        header: text.table.lancada,
        cell: ({ row }) => {
          const item = row.original;
          const launchedOptions = text.launchedOptions;
          let label = launchedOptions.naoLancada;

          if (item.launched_in === 'invoice') label = launchedOptions.produto;
          else if (item.launched_in === 'animal') label = launchedOptions.animal;
          else if (item.launched_in === 'expense') label = launchedOptions.despesa;
          else if (item.launched_in === 'return') label = launchedOptions.abate;
          else if (item.is_personal) label = languageGB.dfes.dfe.filter.isPersonal;
          else if (item.is_shipment) label = languageGB.dfes.dfe.filter.isShipment;

          return (
            <Badge
              colorPalette={item.launched_in ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {label}
            </Badge>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.table.lancada },
      }),
      // LST-12 — Ações (dropdown por linha).
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const isDocumentEligible = canDocuments(item.tipo_evento);
          const isTogglingThisRow = togglingUuid === item.uuid;

          return (
            <Flex justify="flex-end">
              <DfeActionsMenu
                canManifest={canManifestPerm && canManifestRow(item.tipo_evento)}
                onManifest={() => handleOpenManifestIndividual(item)}
                canLaunchInvoice={canLaunchPerm && canLaunchInvoiceOrAnimal(item)}
                onLaunchInvoice={() => handleLaunchInvoice(item)}
                canLaunchAnimal={canLaunchPerm && canLaunchInvoiceOrAnimal(item)}
                onLaunchAnimal={() => handleLaunchAnimal(item)}
                // Despesa permanece OCULTA — Gap [PARA ANÁLISE] (ver
                // cabeçalho do arquivo): `/expenses/xml` rejeita XML de NFe.
                canLaunchExpense={false}
                onLaunchExpense={() => undefined}
                canLaunchReturn={canLaunchPerm && canLaunchReturn(item)}
                onLaunchReturn={() => handleLaunchReturn(item)}
                isLaunching={launchingUuid === item.uuid}
                canDanfe={canDanfePerm && isDocumentEligible}
                onDanfe={() => handleGenerateDanfe(item)}
                isDanfeLoading={generatingDanfeUuid === item.uuid}
                canXml={canXmlPerm && isDocumentEligible}
                onXml={() => handleDownloadXml(item)}
                isXmlLoading={downloadingUuid === item.uuid}
                canTogglePersonal={canEditPerm && canTogglePersonal(item)}
                onTogglePersonal={() => personalMutation.mutate(item.uuid)}
                canToggleShipment={canEditPerm && canToggleShipment(item)}
                onToggleShipment={() => shipmentMutation.mutate(item.uuid)}
                isToggling={isTogglingThisRow}
                labels={text.actions}
              />
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [
      text,
      languageGB,
      items,
      rowSelection,
      canManifestPerm,
      canDanfePerm,
      canXmlPerm,
      canEditPerm,
      canLaunchPerm,
      downloadingUuid,
      generatingDanfeUuid,
      togglingUuid,
      launchingUuid,
    ]
  );

  const gridSettings = useGridSettings<DfeListItem>({
    storageKey: DFE_RECEBIDAS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = hasIssuer && checkLoadingStatus([dfesList]);
  const isEmpty = hasIssuer && !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection
        getRowId={(row: DfeListItem) => row.uuid}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
        </HeaderGrid>

        {selectedUuids.length > 0 && (
          <HStack justify="flex-end" mt={2} mb={-2}>
            <Text fontSize="sm" color="fg.muted">
              {selectedUuids.length}
            </Text>
            <Button
              title={text.actions.manifestar}
              size="sm"
              onClick={handleOpenManifestBatch}
              disabled={!canManifestPerm}
            />
          </HStack>
        )}

        <Box mt={6}>
          {!hasIssuer ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiSearch} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.emptyState.titleNoIssuer}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.emptyState.descriptionNoIssuer}
                  </EmptyState.Description>
                </VStack>
                <Button title={languageGB.defaltStrings.filters} size="sm" onClick={onOpenFilter} />
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={dfesList.isError}
              error={dfesList.error}
              isEmpty={isEmpty}
              onRetry={() => dfesList.refetch()}
              isRetrying={dfesList.isFetching}
              retryLabel={text.error.retry}
              emptyIcon={FiFileText as ElementType}
              emptyTitle={
                extraFiltersApplied > 0 ? text.emptyState.titleFiltered : text.emptyState.titleEmpty
              }
              emptyDescription={
                extraFiltersApplied > 0
                  ? text.emptyState.descriptionFiltered
                  : text.emptyState.descriptionEmpty
              }
              canCreate={false}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideDfe
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DfeManifestModal
        isOpen={isManifestModalOpen}
        onClose={onCloseManifestModal}
        dfeUuids={manifestUuids}
        singleDfeDataEmissao={manifestSingleDataEmissao}
        languageGB={languageGB}
        onSuccess={handleManifestSuccess}
      />
    </ContainerGrid>
  );
}
