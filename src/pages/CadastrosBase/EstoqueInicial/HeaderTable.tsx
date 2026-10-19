// src/pages/CadastrosBase/EstoqueInicial/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Estoque Inicial (mirror mecânico de
// `Armazem/HeaderTable.tsx`). TASK-FE-1042 (execução 026).
//
// SÓ os botões de ação (adicionar / abrir filtro / Excel) — as colunas vivem
// no index.tsx. O botão "Novo" respeita SOMENTE `openingbalances_create`. Ao
// selecionar uma linha, navega para a edição (mesmo padrão do projeto).
//
// Rota `/novo` NÃO é wired nesta Tarefa (TASK-FE-1046, roteamento) — o botão
// aponta para o path já reservado pelo contrato de tela (§3), navegação real
// só funciona quando a rota existir.
//
// TASK-FE-1047 (Roteiro item 3) acrescenta o menu `Actions` (mirror
// `PlanAccount/HeaderTable.tsx`, TASK-PA-07/08) com as 3 ações do legado
// (`openingbalances/index.blade.php`, dropdown "Importar arquivo"/"Exportar
// arquivo"/download do modelo): "Baixar modelo" (`GET /opening-balances/
// download`) e "Exportar" (`GET /opening-balances/export`) — download
// síncrono via blob, gate `openingbalances_view`; "Importar" (`POST
// /opening-balances/import`) abre `OpeningBalanceImportModal` (máquina de
// estados própria, `useMutation` direto), gate DUPLO `openingbalances_create`
// E `openingbalances_edit` (mirror `ImportOpeningBalanceRequest::
// authorize()`, contrato §3/§7.2 — import cria E atualiza em massa). Sem
// TanStack mutation para download/export (só `useState` local por botão, sem
// invalidação de cache nem estado de servidor a sincronizar) — mesmo racional
// do mirror de Plano de Contas.
//
// Mudança MÍNIMA registrada: `index.tsx` (TASK-FE-1042) NÃO precisou de
// nenhuma alteração — o slot `HeaderGrid.header` já renderiza este
// componente, então as 3 ações penduram inteiramente aqui, sem tocar no
// arquivo do chokepoint paralelo (TASK-FE-1043/1045).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Icon, useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiFileText, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { downloadBlob } from '@/utils/downloadBlob';

import {
  downloadOpeningBalanceImportTemplate,
  exportOpeningBalances,
} from '@/services/v2/OpeningBalances/opening-balance-service';

import { LanguageDate } from '@/@types/language';

import { OpeningBalanceImportModal } from './OpeningBalanceImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();
  const text = languageGB.openingBalances.openingBalance;

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Import — gate DUPLO (espelha `ImportOpeningBalanceRequest::authorize()`
  // real do backend: exige as DUAS permissões, não só uma — contrato §3).
  const canImport = can('openingbalances_create') && can('openingbalances_edit');
  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/estoques-iniciais/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadOpeningBalanceImportTemplate();
      downloadBlob(blob, 'modelo-estoque-inicial.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportOpeningBalances();
      downloadBlob(blob, 'estoque-inicial.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.exportError });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {can('openingbalances_view') && (
        <Actions tooltipLabel={languageGB.defaltStrings?.actions}>
          <Actions.Item
            icon={<Icon as={FiDownload} />}
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {text.excel.downloadTemplate}
          </Actions.Item>
          <Actions.Item
            icon={<Icon as={FiFileText} />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {text.excel.export}
          </Actions.Item>
          {canImport && (
            <Actions.Item icon={<Icon as={FiUpload} />} onClick={onOpenImportModal}>
              {text.excel.import.menuLabel}
            </Actions.Item>
          )}
        </Actions>
      )}
      {can('openingbalances_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/estoques-iniciais/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <OpeningBalanceImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
