// src/pages/CadastrosBase/Safra/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Safras — mirror de CentroCusto/HeaderTable.tsx
// COM UMA DIVERGÊNCIA DELIBERADA (TASK-FE-007): este componente NÃO tem o
// `useEffect` de seleção-de-linha-navega-para-edição que CentroCusto/
// HeaderTable.tsx tem. Diferente de Centro de Custo (que não possui tela de
// Detalhe própria e por isso manda o clique de linha para a Edição), Safras
// tem uma tela de Detalhe (TASK-FE-010) — o clique na linha aqui navega para
// lá, e essa navegação vive em `index.tsx` (componente `RowClickToDetail`),
// não neste arquivo. Este componente só renderiza os botões de ação
// (adicionar / abrir filtro).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

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
      {can('harvests_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/safras/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
