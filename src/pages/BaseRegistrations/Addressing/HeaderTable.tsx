// src/pages/BaseRegistrations/Addressing/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da árvore de Endereçamentos (padrão de
// `Cultivation/HeaderTable.tsx`) — SÓ os botões de ação (adicionar
// Endereçamento raiz / abrir filtro). A árvore em si vive no index.tsx.
//
// "Novo Endereçamento" cria SEMPRE um Setor raiz (`parent_uuid` omitido/
// `null`), sem contexto de linha — diferente da ação "Adicionar {nível}" de
// uma linha específica da árvore (`AddressingTreeRow`), que navega com
// `?parentUuid=`.
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
      {can("addressings_create") && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/enderecos/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
