// src/pages/Operacional/Inventariado/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Inventariado (TASK-INV-FE-02/03).
//
// Feature SEM filtro (`filter_manifest` do legado vazio, prova de ausência) —
// NÃO renderizar `ButtonFilter`. Estrutura:
//   - Botão "Importar/Exportar" (`Button` direto, ícone `FiUpload`, gate
//     `inventoried-animals_create`) — abre `InventariadoImportModal`
//     (TASK-INV-FE-03), mirror `CorrecaoEstoque/HeaderTable.tsx`.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { useDisclosure } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

import { InventariadoImportModal } from './InventariadoImportModal';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const { can } = usePermissions();
  const text = languageGB.inventoried.inventoried;

  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  return (
    <>
      {can('inventoried-animals_create') && (
        <Button
          title={text.list.importButtonLabel}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={onOpenImportModal}
        />
      )}

      <InventariadoImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
