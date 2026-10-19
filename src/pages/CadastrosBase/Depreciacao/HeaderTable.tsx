// src/pages/CadastrosBase/Depreciacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da tela de DEPRECIAÇÃO (Depreciation — execução 027,
// TASK-FE-845). Mesmo padrão de `Funcoes/HeaderTable.tsx`/
// `CentroCusto/HeaderTable.tsx` — SÓ os botões de ação (as colunas/abas vivem
// no `index.tsx`).
//
// Botão "Gerar" — gated `depreciations_create` (contrato de tela §2/§9: o
// único gate de escrita do domínio), **fora das abas**, sempre alcançável
// (fecha o defeito do legado: o modal de Equipamento nunca tinha trigger).
// Não usa `ButtonAdd` (rótulo fixo "Novo") — usa `Button` genérico com o
// rótulo próprio "Gerar Depreciação" (i18n `generateModal.title`).
//
// `ButtonFilter` abre o drawer contextual à aba ATIVA — `onOpenFilter` e
// `filtersApplied` já chegam resolvidos pelo `index.tsx` conforme
// `resolvedTabIndex`.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiPlay } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  onOpenGenerateModal: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({
  onOpenFilter,
  onOpenGenerateModal,
  filtersApplied,
  languageGB,
}: HeaderTableProps) {
  const { can } = usePermissions();

  return (
    <>
      {can('depreciations_create') && (
        <Button
          title={languageGB.depreciations.generateModal.title}
          icon={FiPlay as ElementType}
          onClick={onOpenGenerateModal}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
