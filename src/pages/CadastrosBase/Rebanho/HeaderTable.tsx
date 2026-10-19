// src/pages/CadastrosBase/Rebanho/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid do Rebanho (mirror `EstoqueInicial/HeaderTable.tsx`/
// `PlanAccount/HeaderTable.tsx`). TASK-FE-881 (Baixar modelo/Exportar) +
// TASK-FE-886 (Importar).
//
// "Baixar modelo" e "Exportar" são REAIS desde TASK-FE-881
// (`animal-service.ts` já expõe `downloadAnimalImportTemplate`/
// `exportAnimals` — blob síncrono via `downloadBlob`, sem TanStack mutation,
// mesmo racional do mirror de Estoque Inicial/Plano de Contas). "Importar"
// (TASK-FE-886) abre `AnimalImportModal` (máquina de estados própria, upload
// .xlsx, ABORT-ALL) — gate SÓ `animals_create` (achado real,
// `AnimalController::middleware()`/`ImportAnimalRequest::authorize()` no
// api_root exigem só essa permissão para `import`, NÃO o gate duplo
// `animals_create` E `animals_edit` que o task-packet original assumia por
// mirror de `ImportOpeningBalanceRequest` — ver docblock de
// `AnimalImportModal.tsx`).
//
// Botão "Novo Animal" respeita SOMENTE `animals_create`.
//
// AD-F02 (Tarefa 27, Gestão Animais — feature 3596a556) — o `useEffect` que
// navegava para a edição ao selecionar uma linha (`table.getSelectedRowModel()
// .rows[0]`, viabilizado por `enableMultiRowSelection={false}`) FOI REMOVIDO
// DELIBERADAMENTE, não apagado por engano. Com seleção múltipla ligada
// (barra de ações em lote), esse atalho faria a tela navegar para fora no
// primeiro checkbox marcado. A edição continua acessível pelo item "Editar"
// do menu de linha (`index.tsx`), que já existe e já é gateado por
// `animals_edit`. Ver contrato de tela §7/AD-F02 e FID-G3F §0/§4. `useTable`
// deixou de ser necessário aqui (nenhum outro consumo do `table` neste
// arquivo) — `ButtonAdd` continua navegando via `useNavigate` normalmente.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Icon } from '@chakra-ui/react';
import { FiDownload, FiFileText, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';

import { downloadAnimalImportTemplate, exportAnimals } from '@/services/v2/Animals/animal-service';

import { LanguageDate } from '@/@types/language';

import { AnimalImportModal } from './AnimalImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  basePath: string;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  basePath,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.animals.animal;

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadAnimalImportTemplate();
      downloadBlob(blob, 'modelo-rebanho.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportAnimals();
      downloadBlob(blob, 'rebanho.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.exportError });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {(can('animals_view') || can('animals_create')) && (
        <Actions tooltipLabel={languageGB.defaltStrings?.actions}>
          {can('animals_view') && (
            <>
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
            </>
          )}
          {/* "Importar" (TASK-FE-886) — gate SÓ `animals_create` (achado
              real, ver docblock do cabeçalho: diverge do gate duplo que o
              task-packet original assumia por mirror de
              `ImportOpeningBalanceRequest`). */}
          {can('animals_create') && (
            <Actions.Item icon={<Icon as={FiUpload} />} onClick={() => setIsImportModalOpen(true)}>
              {text.excel.import.menuLabel}
            </Actions.Item>
          )}
        </Actions>
      )}
      {can('animals_create') && (
        <ButtonAdd onClick={() => navigate(`${basePath}/novo`)} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <AnimalImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </>
  );
}
