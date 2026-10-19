// src/pages/Operacional/Reproducao/ProtocoloEstacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Protocolos/Estação — mirror
// `Administrativo/Eventos/HeaderTable.tsx` (get_pwa_new_module_execution_plan
// Passo 5: `ButtonFilter` + botão de adicionar). Usa `Button` (não
// `ButtonAdd`) para exibir o rótulo específico do módulo
// (`newButton`: "Novo Protocolo"), mirror `LoteReproducao/index.tsx`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

const PROTOCOL_SEASON_LIST_ROUTE = '/operacional/protocolos-estacao';

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.protocolSeasons.protocolSeason.list;

  return (
    <>
      {can('protocols-season_create') && (
        <Button
          title={text.newButton}
          size="sm"
          onClick={() => navigate(`${PROTOCOL_SEASON_LIST_ROUTE}/nova`)}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderTable;
