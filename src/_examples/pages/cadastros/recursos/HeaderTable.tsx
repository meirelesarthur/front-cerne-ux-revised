// src/_examples/pages/cadastros/recursos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — header de AÇÕES da grid.
//
// SÓ os botões de ação (adicionar / abrir filtro). NÃO renderiza colunas da
// tabela — isso é responsabilidade do `index.tsx`. Espelha exatamente o
// `HeaderTable.tsx` real do padrão (Rank → Admin/Agents/HeaderTable.tsx):
// reaproveita os componentes GLOBAIS do projeto e o hook `useTable` para,
// ao selecionar uma linha, navegar para a edição.
//
// Componentes REUTILIZADOS (não recriados aqui):
//  - @/components/ButtonAdd     (botão "Novo")
//  - @/components/ButtonFilter  (botão "Filtros ( n )")
//  - @/hooks/useTable           (contexto da tabela → linha selecionada)
// -----------------------------------------------------------------------------

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { LanguageDate } from "@/@types/language";
import { ButtonAdd } from "@/components/ButtonAdd";
import { ButtonFilter } from "@/components/ButtonFilter";
import { useTable } from "@/hooks/useTable";

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.id) {
      navigate(`/exemplo/${selected.id}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      <ButtonAdd
        onClick={() => navigate(`/exemplo/create`)}
        languageGB={languageGB}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
