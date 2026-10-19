// src/pages/Administrativo/CorrecaoEstoque/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Correção de Estoque (TASK-FE-COR-01).
//
// Diferente de `PlanAccount` (3 itens agrupados num menu `Actions` — baixar
// modelo/exportar/importar), aqui há apenas 1 ação de escrita (não existe
// endpoint de export de dados reais, só `import/template` em branco) — NÃO
// criar um menu `Actions` para 1 item só (contrato de tela §2.2). Estrutura:
//   - Botão "Importar planilha" (`Button` direto, ícone `FiUpload`, gate
//     `stock-corrections_create`) — abre `StockCorrectionImportModal`.
//   - `ButtonFilter` (badge de contagem) — sem gate adicional (a rota já
//     exige `stock-corrections_view`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { useDisclosure } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

import { StockCorrectionImportModal } from './StockCorrectionImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const { can } = usePermissions();
  const text = languageGB.stockCorrections.stockCorrection;

  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  return (
    <>
      {can('stock-corrections_create') && (
        <Button
          title={text.importModal.menuButtonLabel}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={onOpenImportModal}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <StockCorrectionImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
