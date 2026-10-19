// src/pages/BaseRegistrations/Cultivation/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da árvore de Cultura/Variedade (padrão da camada de exemplo
// / Perfil) — SÓ os botões de ação (adicionar Cultura / abrir filtro). A
// árvore em si vive no index.tsx.
// -----------------------------------------------------------------------------

import { useNavigate } from "react-router-dom";

import { LanguageDate } from "@/@types/language";
import { ButtonAdd } from "@/components/ButtonAdd";
import { ButtonFilter } from "@/components/ButtonFilter";
import { usePermissions } from "@/hooks/usePermissions";

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
  const { can } = usePermissions();

  return (
    <>
      {can("cultivations_create") && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/cultura/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
