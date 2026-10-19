// src/pages/Operacional/Sanitario/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Sanitário — mirror `Weaning/HeaderTable.tsx` /
// `Acasalamento/HeaderTable.tsx` (contrato-tela-lane-c-sanitario-frontend.md
// §6.1, TASK-SAN-FE-02).
//
//   - "Criar em Lote" (gate `sanitary_create`, ADR-FE-SAN-01) — abre
//     `CreateSanitariesMultipleDialog` (TASK-SAN-FE-07). O componente é
//     self-contained: possui o próprio `useDisclosure` e renderiza o
//     diálogo (via `Portal`, mirror `Dialog.Root`) como sibling dos botões
//     — nenhuma mudança em `index.tsx` (`SanitarioList`) foi necessária,
//     mesmo padrão de encapsulamento de `DeleteConfirmDialog` embutido em
//     outras telas que preferem manter o dono do estado de abertura junto
//     do gatilho, não do container da grid.
//   - "Novo" (`ButtonAdd`, gate `sanitary_create`) — navega para
//     `/operacional/sanitario/novo`.
//   - `ButtonFilter` (badge de contagem do filtro do drawer).
// -----------------------------------------------------------------------------

import { useDisclosure } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

import { CreateSanitariesMultipleDialog } from './CreateSanitariesMultipleDialog';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.sanitary.sanitary;

  const canCreate = can('sanitary_create');

  const {
    open: isCreateMultipleOpen,
    onOpen: onOpenCreateMultiple,
    onClose: onCloseCreateMultiple,
  } = useDisclosure();

  return (
    <>
      {canCreate && (
        <Button
          title={text.list.createMultipleButton}
          variant="outline"
          onClick={onOpenCreateMultiple}
        />
      )}
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/sanitario/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      {canCreate && (
        <CreateSanitariesMultipleDialog
          isOpen={isCreateMultipleOpen}
          onClose={onCloseCreateMultiple}
        />
      )}
    </>
  );
}

export default HeaderTable;
