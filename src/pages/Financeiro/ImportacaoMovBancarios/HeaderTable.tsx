// src/pages/Financeiro/ImportacaoMovBancarios/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Importação Mov. Bancários (TASK-064-MOV-FE-01/02).
//
// Mirror `Administrativo/CorrecaoEstoque/HeaderTable.tsx`: 1 ação de escrita
// só (não existe endpoint de export de dados reais, só `download` do modelo
// em branco) — NÃO criar um menu `Actions` para 1 item só (manifesto
// SURF-INDEX-DROPDOWN). Estrutura:
//   - Botão "Importar planilha" (`Button` direto, ícone `FiUpload`, gate
//     `movement-sheets_create`) — abre o `MovementSheetImportModal`
//     (TASK-064-MOV-FE-02, família ABORT-ALL, mirror
//     `StockCorrectionImportModal`/`RainfallImportModal`).
//   - `ButtonFilter` (badge de contagem) — sem gate adicional (a rota já
//     exige `movement-sheets_view`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { useDisclosure } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

import { MovementSheetImportModal } from './MovementSheetImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const { can } = usePermissions();
  const text = languageGB.movementSheets.movementSheet;

  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  return (
    <>
      {can('movement-sheets_create') && (
        <Button
          title={text.list.importButtonLabel}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={onOpenImportModal}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <MovementSheetImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
