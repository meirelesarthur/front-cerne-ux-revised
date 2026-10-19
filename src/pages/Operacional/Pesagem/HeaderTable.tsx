// src/pages/Operacional/Pesagem/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pesagem — mirror `Sanitario/HeaderTable.tsx`/
// `Weaning/HeaderTable.tsx` (contrato-tela-lane-c-pesagem-frontend.md §6.1,
// TASK-PES-FE-02) + import/template (TASK-PES-FE-03, Tarefa 36).
//
//   - "Novo" (`ButtonAdd`, gate `weighing_create`) — navega para
//     `/operacional/pesagem/novo` (rota registrada só na Tarefa 41 — até lá,
//     404 esperado ao navegar, mesma decisão de "Objetivo" da Tarefa).
//   - `ButtonFilter` (badge de contagem do filtro do drawer).
//   - "Importar"/"Baixar Modelo" (contrato-tela §6.1/§6.3, gate ÚNICO
//     `weighing_create` para AMBOS — diferente de `Nascimentos/HeaderTable.tsx`,
//     que tem 1 botão combinado + gates independentes; aqui a matriz FID-G3F
//     §2.4 documenta os 2 botões distintos do `action_manifest` legado
//     ("Importar"/"Baixar template"), ambos abrindo o MESMO
//     `WeighingImportModal` (que já abre no step 'upload', onde o próprio
//     botão "Baixar Modelo" interno também existe) — mirror mecânico do
//     padrão de 2 pontos de entrada para a mesma tela.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { FiDownload, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

import { WeighingImportModal } from './WeighingImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.weighing.weighing.list;

  const canCreate = can('weighing_create');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      {canCreate && (
        <>
          <Button
            title={text.importButton}
            variant="outline"
            icon={FiUpload as ElementType}
            onClick={() => setIsImportModalOpen(true)}
          />
          <Button
            title={text.downloadTemplateButton}
            variant="outline"
            icon={FiDownload as ElementType}
            onClick={() => setIsImportModalOpen(true)}
          />
        </>
      )}
      {canCreate && (
        <ButtonAdd onClick={() => navigate('/operacional/pesagem/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <WeighingImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        canDownload={canCreate}
        canImport={canCreate}
      />
    </>
  );
}

export default HeaderTable;
