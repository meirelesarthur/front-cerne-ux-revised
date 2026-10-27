// src/pages/CadastrosBase/Perfil/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Perfis (padrão da camada de exemplo).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Novo" respeita `roles_tenant_create` (UX; o enforcement
// real é o 403 do backend). Ao selecionar uma linha, navega para a edição.
// -----------------------------------------------------------------------------

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { LanguageDate } from "@/@types/language";
import { ButtonAdd } from "@/components/ButtonAdd";
import { ButtonFilter } from "@/components/ButtonFilter";
import { usePermissions } from "@/hooks/usePermissions";
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
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/perfil/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can("roles_tenant_create") && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/perfil/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
