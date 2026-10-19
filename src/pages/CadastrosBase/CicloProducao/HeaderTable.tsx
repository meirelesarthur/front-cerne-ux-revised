// src/pages/CadastrosBase/CicloProducao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Ciclo de Produção — mirror de Safra/HeaderTable.tsx.
// Sem `ButtonFilter` nesta Tarefa (TASK-FE-01 não materializa drawer de
// filtro — ver nota de cabeçalho de useProductionCycles.tsx). `ButtonAdd`
// aponta para `/novo` (rota reservada para TASK-FE-02 — formulário create/
// edit; NÃO registrada nesta Tarefa) e é gated por `production-cycles_create`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('production-cycles_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/ciclo-producao/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
