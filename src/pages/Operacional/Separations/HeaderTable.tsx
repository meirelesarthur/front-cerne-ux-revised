// src/pages/Operacional/Separations/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Apartação — mirror `Operacional/Pastagem/
// HeaderTable.tsx` (botão "Ajuda em vídeo" sempre desabilitado, SEM gate de
// permissão nenhum, frontend-contract-apartacao.md §1/§5).
//
// "Adicionar" (`ButtonAdd`, gate `separation_create`) — navega para
// `/operacional/apartacao/novo` (TASK-APART-FE-02, contrato §2.3, mirror
// `Operacional/Nascimentos/HeaderTable.tsx`).
//
// SEM botão/link "Processar" — explicitamente FORA DE ESCOPO desta feature
// (feature futura "Processamentos", contrato §5).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiHelpCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { Tooltip } from '@/components/TooLtip';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.separations.separation.list;

  const canCreate = can('separation_create');

  return (
    <>
      <Tooltip content={text.helpVideoComingSoon} positioning={{ placement: 'top' }}>
        <Button
          title={text.helpVideo}
          variant="ghost"
          icon={FiHelpCircle as ElementType}
          disabled
        />
      </Tooltip>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/apartacao/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
