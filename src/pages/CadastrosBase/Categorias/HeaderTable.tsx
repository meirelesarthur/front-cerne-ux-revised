// src/pages/CadastrosBase/Categorias/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da listagem de Categorias Financeiras (mesmo padrão de
// Agrupadores/HeaderTable.tsx) — só os botões de ação (adicionar / abrir
// filtro).
//
// TASK-FE-1072 — botão "Novo +" de criação de RAIZ (navega para
// `/cadastros-base/categorias/novo`, SEM `?parentUuid`). Visível SOMENTE
// para `Gestor_Plataf` (pedido do dev: criar categoria de topo é operação de
// plataforma, espelha o legado `agro365` — `financialcategories/index.blade.php`
// só mostra "Novo" quando NÃO há fazenda/tenant em sessão). Mesmo padrão
// canônico de `Fazendas/HeaderTable.tsx` — mas com a POLARIDADE OPOSTA à de
// `CentroCusto/HeaderTable.tsx` (lá é `!hasRole('Gestor_Plataf')`, inversão
// consciente documentada naquele arquivo; NÃO confundir as duas). A criação
// de FILHO (`onCreateChild`, index.tsx, a partir de uma linha de GRUPO na
// listagem) não muda.
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
  const { can, hasRole } = usePermissions();

  return (
    <>
      {can('financialcategories_create') && hasRole('Gestor_Plataf') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/categorias/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
