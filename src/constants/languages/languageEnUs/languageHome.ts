import { Home } from "@/@types/language/home";

export const languageHome: Home = {
  greeting: "Good morning, let's get started!",
  searchPlaceholder: "Search modules, records, reports…",
  moduleDescriptions: {
    painel: "Overview and key metrics",
    favoritos: "Your most-used shortcuts",
    dashboards: "Interactive charts and analytics",
    cadastros: "Structure, people and products",
    administrativo: "Procurement, inventory and HR",
    operacional: "Farming, livestock and work orders",
    financeiro: "Accounts, cash flow and reconciliations",
    frota: "Maintenance and refueling",
    fiscal: "e-Invoice, e-Freight, e-Manifest and LCDPR",
    relatorios: "All system reports",
    integracoes: "Domínio, CSV and exports",
  },
  panels: {
    recentAccess: { title: "Recent Access", action: "View all" },
    farms: { title: "Farms", action: "View all", addButton: "New farm" },
    favorites: { title: "Favorites", action: "Manage" },
  },
  farmStatus: { active: "Active", inactive: "Inactive" },
} as const;
