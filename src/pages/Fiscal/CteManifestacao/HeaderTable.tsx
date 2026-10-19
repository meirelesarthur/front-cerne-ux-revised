// src/pages/Fiscal/CteManifestacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Manifestação de CT-e (TASK-CTE-FE-12). Botões:
// "Consultar novos documentos" (`cte_manifest`, abre `ConsultarDocumentosDialog`),
// "Filtrar", "Ajuda" (link externo, `VITE_CTE_MANIFESTACAO_HELP_URL` via env,
// nunca hardcode) — mirror `Fiscal/Cte/HeaderTable.tsx`.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiHelpCircle, FiSearch } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

const CTE_MANIFESTACAO_HELP_URL =
  import.meta.env.VITE_CTE_MANIFESTACAO_HELP_URL || 'https://ajuda.gbcerne.com.br/cte-manifestacao';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  onOpenConsultar: () => void;
}

export function HeaderTable({ onOpenFilter, filtersApplied, onOpenConsultar }: HeaderTableProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.cteManifestacoes.cteManifestacao.list;

  return (
    <>
      <Button
        variant="ghost"
        title={text.helpLink}
        icon={FiHelpCircle as ElementType}
        onClick={() => window.open(CTE_MANIFESTACAO_HELP_URL, '_blank', 'noopener,noreferrer')}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
      {can('cte_manifest') && (
        <Button
          title={text.consultarButton}
          icon={FiSearch as ElementType}
          onClick={onOpenConsultar}
        />
      )}
    </>
  );
}

export default HeaderTable;
