// src/pages/CadastrosBase/Cidades/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Cidades — SOMENTE o botão de filtro (mirror
// simplificado de Especies/HeaderTable.tsx/TecnicasDiagnostico/HeaderTable.tsx
// MENOS tudo que é escrita, TASK-FE-023):
//   - SEM `ButtonAdd` — não existe permissão `cities_create`, único gate do
//     módulo é `cities_view`;
//   - SEM `useEffect` de navegação ao selecionar linha — não existe tela de
//     detalhe/edição de Cidade, clique na linha não navega para lugar nenhum.
// -----------------------------------------------------------------------------

import { ButtonFilter } from '@/components/ButtonFilter';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
}

export function HeaderTable({ onOpenFilter, filtersApplied }: HeaderTableProps) {
  return <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />;
}
