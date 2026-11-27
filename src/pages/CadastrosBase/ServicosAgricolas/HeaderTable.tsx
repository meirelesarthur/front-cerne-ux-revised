// src/pages/CadastrosBase/ServicosAgricolas/HeaderTable.tsx
// PROTÓTIPO (27/11/2026, não portar) — botão "Novo(a)" da lista de Serviços e abertura da edição ao
// clicar na linha (mesmo padrão de CadastrosBase/Atividades/HeaderTable.tsx).

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

import { SERVICES_ROUTE } from '../TiposServico/serviceTypeRoutes';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as { uuid?: string } | undefined;
    if (selected?.uuid && can('activities_edit')) navigate(`${SERVICES_ROUTE}/${selected.uuid}`);
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('activities_create') && (
        <ButtonAdd onClick={() => navigate(`${SERVICES_ROUTE}/novo`)} languageGB={languageGB} />
      )}
    </>
  );
}
