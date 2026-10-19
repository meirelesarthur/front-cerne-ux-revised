// src/pages/CadastrosBase/Inventario/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Inventário (Equipment) — TASK-FE-1004, execução
// 026. Mesmo padrão de `Produtos/Catalogo/HeaderTable.tsx` (SÓ os botões de
// ação — adicionar/abrir filtro; as colunas vivem no `index.tsx`).
//
// Botão "Adicionar" respeita `equipments_create` (Equipment-Frontend-Contrato
// §3/§11 — permissão já cadastrada em `permissionsCatalog.json:350-354`, sem
// edição de catálogo necessária). Ao selecionar uma linha da grid, navega
// para o DETALHE (view-only, `TASK-FE-1010`, RN "show" do legado) — mesmo
// racional de `Produtos/Catalogo/HeaderTable.tsx` (Equipment TEM uma rota de
// detalhe própria no contrato §3, diferente do precedente Kind/CentroCusto
// sem detalhe dedicado).
//
// ⚠️ Rota `/cadastros-base/inventario/*` só existe de verdade após
// `TASK-FE-1011` (roteamento, CHOKEPOINT desta execução — outra Tarefa é
// dona de `router/index.tsx`) — `navigate()` aqui é código PRONTO, não
// alcançável por clique real até o roteamento fechar (mesma observação já
// registrada na Tarefa/contrato §3).
//
// TASK-FE-1012 acrescenta o menu `Actions` (mirror `OpeningBalance/
// HeaderTable.tsx`/`PlanAccount/HeaderTable.tsx`) com as 3 ações do legado
// (`equipments/download`|`import`|`export`, `agro365/routes/web.php:216-218`):
// "Baixar modelo" e "Exportar" — download síncrono via blob, sem TanStack
// mutation (só `useState` local por botão); "Importar" abre
// `EquipmentImportModal` (máquina de estados própria, `useMutation` direto).
// Gate ÚNICO `equipments_report` nos 3 (Equipment-contrato.md linha 208-210,
// D-EQ6 — "fechamento de lacuna de segurança do legado, não gate para o dev,
// instrução direta") — NÃO `equipments_view`/`equipments_create` (a Tarefa
// original tinha essa premissa antes do contrato de API publicar D-EQ6).
// Endpoints dependem da `TASK-BE-706`, ainda não executada (ver Tarefa) —
// wiring PRONTO, sem prova de runtime possível agora.
//
// Mudança MÍNIMA registrada: nenhum outro arquivo do módulo precisou mudar —
// as 3 ações penduram inteiramente aqui, mesmo racional já registrado por
// `TASK-FE-1047` (OpeningBalance).
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
  downloadEquipmentImportTemplate,
  exportEquipments,
} from '@/services/v2/Equipments/equipment-service';

import { LanguageDate } from '@/@types/language';

import { EquipmentImportModal } from './EquipmentImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();
  const text = languageGB.equipments.equipment;

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canReport = can('equipments_report');
  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  // Ao selecionar uma linha da grid, navega para o DETALHE (view-only) — ver
  // nota de topo do arquivo.
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/inventario/${selected.uuid}/detalhe`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadEquipmentImportTemplate();
      downloadBlob(blob, 'modelo-inventario.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportEquipments();
      downloadBlob(blob, 'inventario.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.exportError });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {canReport && (
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
          <Actions.Item icon={<Icon as={FiUpload} />} onClick={onOpenImportModal}>
            {text.excel.import.menuLabel}
          </Actions.Item>
        </Actions>
      )}
      {can('equipments_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/inventario/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <EquipmentImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
