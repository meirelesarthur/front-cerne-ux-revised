// src/pages/CadastrosBase/Batches/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Lotes Animais — REGENERADO (TASK-FE-1080), mesmo
// padrão de `Administrativo/Funcoes/HeaderTable.tsx`/
// `CadastrosBase/CategoriasAnimais/HeaderTable.tsx`: SÓ os botões de ação
// (adicionar / abrir filtro) — componentes REAIS `ButtonAdd`/`ButtonFilter`
// (o arquivo antigo importava `SearchBar` de `@/components/Form/InputForm` e
// `FilterBadge` de `@/components/FilterBadge`, ambos INEXISTENTES).
//
// TASK-FE-1082 acrescenta o menu `Actions` (mirror `PlanAccount/HeaderTable.tsx`/
// `Inventario/HeaderTable.tsx`) com as 2 ações reais do backend entregue hoje
// (`GET /animal-batches/download`, `POST /animal-batches/import`, contrato
// v1.1 §8): "Baixar modelo" — download síncrono via blob, sem TanStack
// mutation (só `useState` local, mesmo racional de `PlanAccount`/`Inventario`,
// NÃO é export de dados, é sempre um modelo XLSX em branco) — e "Importar
// planilha", que abre `BatchImportModal` (máquina de estados própria,
// `useMutation` direto). Gate ÚNICO `batch_create` nos 2 — mesma permissão
// exigida por `AnimalBatchImportRequest::authorize()`/rota real (download e
// import têm o mesmo público: quem pode criar Lote), sem permissão nova.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Icon, useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';

import { downloadBatchTemplate } from '@/services/v2/Batches/batch-service';

import type { LanguageDate } from '@/@types/language';

import { BatchImportModal } from './BatchImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.batches.batch;

  const canCreate = can('batch_create');

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadBatchTemplate();
      downloadBlob(blob, 'modelo-lote-animais.xlsx');
    } catch {
      toaster.error({
        title: text.singularLabel,
        description: text.importExport.downloadTemplateError,
      });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  return (
    <>
      {canCreate && (
        <Actions tooltipLabel={languageGB.defaltStrings?.actions}>
          <Actions.Item
            icon={<Icon as={FiDownload} />}
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {text.importExport.downloadTemplate}
          </Actions.Item>
          <Actions.Item icon={<Icon as={FiUpload} />} onClick={onOpenImportModal}>
            {text.importExport.importSpreadsheet}
          </Actions.Item>
        </Actions>
      )}
      {canCreate && <ButtonAdd onClick={() => navigate('/batches/novo')} languageGB={languageGB} />}

      <BatchImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
