// src/pages/Operacional/Nascimentos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Nascimentos — mirror
// `Operacional/VendaAnimais/HeaderTable.tsx`.
//
//   - "Adicionar" (`ButtonAdd`, gate `birth_animals_create`) — navega para
//     `/operacional/nascimentos/novo`.
//   - `ButtonFilter` (badge de contagem dos 4 filtros do drawer).
//   - Botão de import/export (contrato §5.4, TASK-NASC-FE-03) — abre
//     `BirthAnimalImportModal` (mirror `CadastrosBase/Rebanho/HeaderTable.tsx`
//     item "Importar"). Visível se o usuário tem `birth_animals_view` OU
//     `birth_animals_create` (download/import são gates INDEPENDENTES,
//     repassados ao modal — GAP-NASC-02, checklist da Tarefa 20).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

import { BirthAnimalImportModal } from './BirthAnimalImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.birthAnimals.birthAnimal;

  const canViewImportExport = can('birth_animals_view');
  const canCreate = can('birth_animals_create');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      {(canViewImportExport || canCreate) && (
        <Button
          title={text.excel.headerButtonLabel}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={() => setIsImportModalOpen(true)}
        />
      )}
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/nascimentos/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <BirthAnimalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        canDownload={canViewImportExport}
        canImport={canCreate}
      />
    </>
  );
}
