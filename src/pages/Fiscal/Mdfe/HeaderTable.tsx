// src/pages/Fiscal/Mdfe/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de MDFe — mirror `Dfe/HeaderTable.tsx` (só os
// botões; as colunas vivem no `index.tsx`). TASK-MDFE-FE-02
// (`CONTRATO-FRONT-MDFE.md §4.4/§4.5`).
//
// Botão "Novo" — navega para `/fiscal/mdfe-nova` (rota PRÉ-CADASTRADA,
// `fis-mdf-nov`), NÃO pré-checa cota (o gate de cota mensal é responsabilidade
// da tela de destino, `CreateOrUpdateMdfe.tsx`, `TASK-MDFE-FE-03`).
//
// Botão "Não encerrados" — `AC002`, navega para
// `/fiscal/mdfe-lista/nao-encerrados` sob a permissão `mdfe_create`
// (preservar exatamente essa permissão do legado, NÃO `mdfe_view`).
//
// Botão "Ajuda" (`AC001`) — `NAO_APLICAVEL`: esta SPA não tem mecanismo de
// `helper.url` equivalente ao legado (nenhum componente de ajuda contextual
// por rota confirmado no fork); declarado aqui, não inventado.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
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

  return (
    <>
      {can('mdfe_create') && (
        <Button
          title={languageGB.mdfes.mdfe.list.naoEncerradosButton}
          variant="outline"
          onClick={() => navigate('/fiscal/mdfe-lista/nao-encerrados')}
        />
      )}
      {can('mdfe_create') && (
        <ButtonAdd onClick={() => navigate('/fiscal/mdfe-nova')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
