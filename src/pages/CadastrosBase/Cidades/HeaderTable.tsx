// src/pages/CadastrosBase/Cidades/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Cidades — sem ações de escrita; o botão de filtro vive agora no
// `ListToolbar` da tela (busca inline + Filtros). Fica vazio de propósito (mirror
// simplificado de Especies/HeaderTable.tsx/TecnicasDiagnostico/HeaderTable.tsx
// MENOS tudo que é escrita, TASK-FE-023):
//   - SEM `ButtonAdd` — não existe permissão `cities_create`, único gate do
//     módulo é `cities_view`;
//   - SEM `useEffect` de navegação ao selecionar linha — não existe tela de
//     detalhe/edição de Cidade, clique na linha não navega para lugar nenhum.
// -----------------------------------------------------------------------------


interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
}

export function HeaderTable(_props: HeaderTableProps) {
  return null;
}
