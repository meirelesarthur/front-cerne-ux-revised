// src/pages/Operacional/Pastagem/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pastagem — TASK-PAST-FE-02. "Adicionar Novo"
// (`ButtonAdd`, gate `pastures_create`) + `ButtonFilter` + botão Ajuda-vídeo
// (surf-past-action-help, sem backend). SEM MOCK: nenhuma URL de vídeo real
// foi confirmada nesta execução (não faz parte do contrato de API nem do
// legado lido) — botão entra DESABILITADO com tooltip "Disponível em breve",
// mesmo padrão já usado em `Appropriations/HeaderTable.tsx` para os 2
// botões de escopo de produto deferido.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiHelpCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { Tooltip } from '@/components/TooLtip';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
  onCreate: () => void;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
  onCreate,
}: HeaderTableProps) {
  const text = languageGB.pastures.pasture.list;

  return (
    <>
      {canCreate && <ButtonAdd onClick={onCreate} languageGB={languageGB} />}
      <Tooltip label={text.actions.helpVideoComingSoon} placement="top">
        <Button
          title={text.actions.helpVideo}
          variant="ghost"
          icon={FiHelpCircle as ElementType}
          disabled
        />
      </Tooltip>
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
