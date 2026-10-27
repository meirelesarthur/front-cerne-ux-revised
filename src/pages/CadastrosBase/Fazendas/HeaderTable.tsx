// src/pages/CadastrosBase/Fazendas/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Fazendas (mesmo padrão de
// FamiliaBens/HeaderTable.tsx/CentroCusto/HeaderTable.tsx) — só os botões de
// ação (adicionar/abrir filtro); as colunas vivem em `index.tsx`.
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
      {/* Gestor_Plataf NÃO vê "Novo(a)" — o `FarmRequest` do backend exige
          `tenant_id` explícito no payload para este papel (`prohibited` para
          os demais) e a tela de criação não expõe esse campo; o botão levaria
          a um fluxo que nunca conclui. Pedido do dev no E2E de 2026-07-31. */}
      {can('farms_create') && !hasRole('Gestor_Plataf') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/fazendas/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
