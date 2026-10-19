// src/pages/Operacional/BatchTransfers/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de animais elegíveis (contrato §5.5) — mirror
// `CadastrosBase/Batches/HeaderTable.tsx`, SEM os botões de import/export
// (não existem no legado desta tela). Só "Nova Transferência" (gated por
// `transference_animal_batch`) + botão de filtro.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

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

  const canCreate = can('transference_animal_batch');

  return (
    <>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/transferencia-animais-lote/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
