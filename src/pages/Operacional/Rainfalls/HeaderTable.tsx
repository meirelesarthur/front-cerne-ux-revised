// src/pages/Operacional/Rainfalls/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pluviometria — execução 041, TASK-FE-041-PLV-02/05.
// Só os botões de ação (importar / adicionar / abrir filtro) — as colunas
// vivem no index.tsx (mirror `DeathAnimals/HeaderTable.tsx`). Botões "Importar"
// e "Novo" respeitam `rainfall_create` (contrato §4.1 — ambos os gatilhos
// gateados pela mesma permissão de criação).
//
// "Saiba +" (reuso `HelpController::map`, §4.1 do contrato) NÃO tem
// precedente de consumo no `frontend_root` (nenhum service/hook/componente
// já materializado para `/helps/map` em nenhum módulo existente) — omitido
// aqui para não inventar um padrão de integração sem mirror real (Regra 9,
// SEM MOCK); registrado como pendência não-bloqueante para o Arquiteto.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

import { RainfallImportModal } from './RainfallImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.rainfalls.rainfall;
  const canCreate = can('rainfall_create');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      {canCreate && (
        <Button
          variant="outline"
          title={text.list.actions.import}
          icon={FiUpload as ElementType}
          onClick={() => setIsImportModalOpen(true)}
        />
      )}
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/pluviometria/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <RainfallImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </>
  );
}
