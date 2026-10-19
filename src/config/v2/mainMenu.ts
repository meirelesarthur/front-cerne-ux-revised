// src/config/v2/mainMenu.ts
// Configuração do menu principal de módulos do GB Cerne (shell mínimo).
//
// Os 10 módulos espelham o design de referência (cerne). A fidelidade visual
// (ícones definitivos, ordem, agrupamentos) será tratada em outra tarefa; aqui
// os ícones são apenas razoáveis. Sem gates de permissão/tier/admin — o shell
// mínimo não tem mais billing/admin.

import { IconType } from "react-icons";
import {
  FiBriefcase,
  FiClipboard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiHome,
  FiPieChart,
  FiShare2,
  FiTruck,
} from "react-icons/fi";
import { LuTractor } from "react-icons/lu";

export interface MainMenuItem {
  id: string;
  label: string;
  path: string;
  icon: IconType;
  description?: string;
  /** Indica se o módulo tem sidebar próprio (nenhum tem, por ora). */
  hasSidebar: boolean;
  /** Indica se o módulo está disponível (para "Coming soon"). */
  isAvailable: boolean;
}

export interface MainMenuConfig {
  items: MainMenuItem[];
}

/**
 * Configuração dos módulos principais do GB Cerne.
 */
export const mainMenuConfig: MainMenuConfig = {
  items: [
    {
      id: "home",
      label: "Home",
      path: "/home",
      icon: FiHome,
      description: "Página inicial",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "dashboards",
      label: "Dashboards",
      path: "/dashboards",
      icon: FiPieChart,
      description: "Indicadores e painéis",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "cadastros-base",
      label: "Cadastros Base",
      path: "/cadastros-base",
      icon: FiDatabase,
      description: "Cadastros fundamentais",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "administrativo",
      label: "Administrativo",
      path: "/administrativo",
      icon: FiBriefcase,
      description: "Gestão administrativa",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "operacional",
      label: "Operacional",
      path: "/operacional",
      icon: LuTractor,
      description: "Operações",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "financeiro",
      label: "Financeiro",
      path: "/financeiro",
      icon: FiDollarSign,
      description: "Gestão financeira",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "frota",
      label: "Frota",
      path: "/frota",
      icon: FiTruck,
      description: "Gestão de frota",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "fiscal",
      label: "Fiscal",
      path: "/fiscal",
      icon: FiFileText,
      description: "Gestão fiscal",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "relatorios",
      label: "Relatórios",
      path: "/relatorios",
      icon: FiClipboard,
      description: "Relatórios",
      hasSidebar: false,
      isAvailable: true,
    },
    {
      id: "integracoes",
      label: "Integrações",
      path: "/integracoes",
      icon: FiShare2,
      description: "Integrações externas",
      hasSidebar: false,
      isAvailable: true,
    },
  ],
};

/**
 * Retorna o módulo ativo baseado na rota atual.
 */
export function getActiveModule(pathname: string): MainMenuItem | undefined {
  // Ordena por comprimento de path desc para casar o mais específico primeiro.
  return [...mainMenuConfig.items]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(item.path + "/"));
}

/**
 * Retorna a configuração de um módulo pelo ID.
 */
export function getModuleById(moduleId: string): MainMenuItem | undefined {
  return mainMenuConfig.items.find((item) => item.id === moduleId);
}
