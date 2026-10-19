import { Home } from "@/@types/language/home";

export const languageHome: Home = {
  greeting: "Buenos días, ¡vamos a empezar!",
  searchPlaceholder: "Buscar módulos, registros, informes…",
  moduleDescriptions: {
    painel: "Visión general e indicadores",
    favoritos: "Sus atajos más usados",
    dashboards: "Análisis y gráficos interactivos",
    cadastros: "Estructura, personas y productos",
    administrativo: "Suministros, inventario y RR.HH.",
    operacional: "Agricultura, ganadería y órdenes de servicio",
    financeiro: "Cuentas, flujo y conciliaciones",
    frota: "Mantenimientos y abastecimientos",
    fiscal: "Factura electrónica, CT-e, MDF-e y LCDPR",
    relatorios: "Todos los informes del sistema",
    integracoes: "Domínio, CSV y exportaciones",
  },
  panels: {
    recentAccess: { title: "Accesos Recientes", action: "Ver todos" },
    farms: { title: "Fincas", action: "Ver todas", addButton: "Nueva finca" },
    favorites: { title: "Favoritos", action: "Gestionar" },
  },
  farmStatus: { active: "Activa", inactive: "Inactiva" },
} as const;
