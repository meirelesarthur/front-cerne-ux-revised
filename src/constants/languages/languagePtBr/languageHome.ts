import { Home } from "@/@types/language/home";

export const languageHome: Home = {
  greeting: "Bom dia, vamos começar!",
  searchPlaceholder: "Buscar módulos, cadastros, relatórios…",
  moduleDescriptions: {
    painel: "Visão geral e indicadores",
    favoritos: "Seus atalhos mais usados",
    dashboards: "Análises e gráficos interativos",
    cadastros: "Estrutura, pessoas e produtos",
    administrativo: "Suprimentos, estoque e RH",
    operacional: "Agricultura, pecuária e OS",
    financeiro: "Contas, fluxo e conciliações",
    frota: "Manutenções e abastecimentos",
    fiscal: "NF-e, CT-e, MDF-e e LCDPR",
    relatorios: "Todos os relatórios do sistema",
    integracoes: "Domínio, CSV e exportações",
  },
  panels: {
    recentAccess: { title: "Últimos acessos", action: "Ver todos" },
    farms: { title: "Fazendas", action: "Ver todas", addButton: "Nova fazenda" },
    favorites: { title: "Favoritos", action: "Gerenciar" },
  },
  farmStatus: { active: "Ativa", inactive: "Inativa" },
} as const;
