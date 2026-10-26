import type { SemanticTokensColors } from "@/@types/theme";

// Definição das cores semânticas para o tema "dark"
const colors: SemanticTokensColors = {
  brandColorText: { value: '{colors.blue.200}' },
  loadingBG: { value: 'rgba(255, 255, 255, 0.03)' },
  primitiveBG: { value: '{colors.gray.900}' },
  primitiveBGHover: { value: '{colors.gray.700}' },
  primitiveTexteColor: { value: '{colors.white}' },
  secondaryTexteColor: { value: '{colors.gray.900}' },
  primitiveDisableTextColor: { value: '{colors.white}' },
  primaryMain: { value: '{colors.blue.400}' },
  primaryDarker: { value: '{colors.blue.400}' },
  primaryDark: { value: '{colors.blue.400}' },
  primaryLight: { value: '{colors.blue.700}' },
  primaryLighter: { value: '{colors.blue.900}' },
  primary: { value: '{colors.blue.700}' },
  primary2: { value: '{colors.blue.900}' },
  primary300: { value: '{colors.blue.600}' },
  primary400: { value: '{colors.blue.500}' },
  primary500: { value: '{colors.blue.700}' },
  secondaryMain: { value: '{colors.gray.400}' },
  secondaryDark: { value: '{colors.gray.300}' },
  secondaryDarker: { value: '{colors.gray.100}' },
  secondaryLight: { value: '{colors.gray.700}' },
  secondaryLighter: { value: '{colors.gray.900}' },
  secondary: { value: '{colors.gray.700}' },
  secondary2: { value: '{colors.gray.900}' },
  secondary300: { value: '{colors.gray.600}' },
  secondary400: { value: '{colors.gray.500}' },
  secondaryBG: { value: '{colors.gray.500}' },
  outlineBorder: { value: '{colors.gray.200}' },
  headerPanelBG: { value: '{colors.gray.700}' },
  menuBG: { value: '{colors.gray.900}' },
  menuTextColor: { value: '{colors.gray.200}' },
  menuSelectedTextColor: { value: '{colors.gray.500}' },
  menuLateralBG: { value: '{colors.gray.600}' },
  menuSelectedBG: { value: '{colors.gray.900}' },
  border1: { value: '{colors.gray.400}' },
  border2: { value: '{colors.gray.600}' },
  borderGrid: { value: '#1c3f2c' }, // GBMode border.default (= cardBorder)
  formBG: { value: '#0e2a1d' }, // GBMode bg.surface
  classSyntheticBG: { value: '{colors.green.900}' }, // GBMode verde escuro (badge Sintético)
  classSyntheticText: { value: '{colors.green.200}' }, // verde claro legível
  bg: { muted: { value: '#132f22' } }, // GBMode: superfície muted verde (não #111827 ardósia)
  gridBG: { value: '#0e2a1d' }, // GBMode bg.surface (= cardBG/formBG)
  gridBGAlternate: { value: '#0b1e14' }, // GBMode bg.subtle (zebra)
  // Suprimentos (execução 081, T-081-FE-01) — mesmos tokens do light, ajustados para contraste no dark (o navy #0f294b do status 11 some em fundo escuro).
  supplyEmergencyRowBg: { value: '#7A2E45' },
  supplyStatus1: { value: '#9A9CAB' },
  supplyStatus2: { value: '#FEC02C' },
  supplyStatus3: { value: '#D4A017' },
  supplyStatus4: { value: '#8DCDA3' },
  supplyStatus5: { value: '#FF69B4' },
  supplyStatus6: { value: '#10B981' },
  supplyStatus7: { value: '#22D3EE' },
  supplyStatus8: { value: '#5B7BFF' },
  supplyStatus9: { value: '#A16BFF' },
  supplyStatus10: { value: '#E05A5A' },
  supplyStatus11: { value: '#5C7FB8' },
  gridHeadEndFooter: { value: '#132f22' }, // GBMode bg.input (paginação)
  gridHeadSecondary: { value: '#132f22' }, // GBMode bg.input (header)
  textGridColor: { value: '#e2f0e8' }, // GBMode fg.default
  selectedTextGridColor: { value: 'rgba(16,185,129,0.15)' }, // GBMode accent (linha selecionada)
  textInlineBG: { value: '{colors.gray.450}' },
  tabSelectedBG: { value: '{colors.gray.900}' },
  tabBG: { value: '{colors.gray.700}' },
  textReadOnlyColor: { value: '{colors.white}' },
  buttonOutlineBG: { value: '{colors.transparent}' },
  buttonOutlineColor: { value: '{colors.blue.500}' },
  buttonSolidBG: { value: '{colors.blue.800}' },
  buttonSolidColor: { value: '{colors.gray.200}' },
  paginationColor: { value: '{colors.gray.100}' },
  paginationBG: { value: '{colors.transparent}' },
  paginationSelectedBG: { value: '{colors.blue.600}' },
  paginationSelectedColor: { value: '{colors.white}' },
  cardColor: { value: '{colors.green.500}' },
  placeholderColor: { value: '{colors.gray.400}' },
  // GBMode: superfície de input verde-escura do cerne (bg.input), não o neutro genérico.
  inputBG: { value: '#132f22' },
  tabs: {
    textColor: { value: '{colors.white}' },
    textSelectedColor: { value: '{colors.white}' },
    tabBG: { value: '{colors.gray.600}' },
    tabBG2: { value: '{colors.gray.450}' },
    tabSelectedBGPrimary: { value: '{colors.blue.800}' },
    tabSelectedBG: { value: '{colors.black}' },
    tabSelectedBG2: { value: '{colors.gray.450}' },
    tabDisabledBG: { value: '{colors.gray.600}' },
    painelBG: { value: '{colors.gray.500}' },
  },
  headerWindowBG: {
    create: { value: '{colors.green.700}' },
    update: { value: '{colors.green.900}' },
    consult: { value: '{colors.blue.500}' },
  },
  headerWindowColor: {
    create: { value: '{colors.white}' },
    update: { value: '{colors.white}' },
    consult: { value: '{colors.white}' },
  },
  text: {
    primary: { value: '{colors.gray.100}' },
    secondary: { value: '{colors.gray.300}' },
    disabled: { value: '{colors.gray.600}' },
    inverse: { value: '{colors.gray.900}' },
  },
  semanticNeutral: {
    100: { value: '{colors.gray.900}' },
    200: { value: '{colors.gray.700}' },
    300: { value: '{colors.gray.600}' },
    400: { value: '{colors.gray.500}' },
    500: { value: '{colors.gray.400}' },
    600: { value: '{colors.gray.500}' },
    700: { value: '{colors.gray.200}' },
    800: { value: '{colors.gray.300}' },
    900: { value: '{colors.white}' },
  },
  foreground: {
    1: { value: '{colors.gray.500}' },
    2: { value: '{colors.gray.200}' },
    3: { value: '{colors.gray.300}' },
    '3.2': { value: '{colors.gray.300}' },
    4: { value: '{colors.gray.600}' },
  },
  feedBack: {
    successMain: { value: '{colors.green.500}' },
    warnMain: { value: '{colors.yellow.900}' },
    errorMain: { value: '{colors.red.800}' },
    infoMain: { value: '{colors.blue.500}' },
    success: { value: '{colors.green.700}' },
    warn: { value: '{colors.yellow.500}' },
    error: { value: '{colors.red.200}' },
    info: { value: '{colors.blue.100}' },
  },
  colorCicle: {
    success: { value: '{colors.green.500}' },
    warn: { value: '{colors.yellow.500}' },
    error: { value: '{colors.red.800}' },
    info: { value: '{colors.blue.500}' },
  },
  colorIcon: {
    success: { value: '{colors.blue.100}' },
    warn: { value: '{colors.yellow.200}' },
    error: { value: '{colors.red.200}' },
    info: { value: '{colors.green.200}' },
  },
  bodyBackground: { value: '#051008' }, // GBMode bg.canvas
  bodyColor: { value: '#e2f0e8' }, // GBMode fg.default
  // Card externo de conteúdo (envolve Header+SecondaryNav+página) — bg.outer do CERNE.
  // No dark mode, bg.outer (#081a12) coincide com bg.sidebar — mesmo tom, ambos
  // distintos de cardBG/bg.surface (#0e2a1d, mais claro, usado por cards internos).
  contentOuterBG: { value: '#081a12' }, // GBMode bg.outer
  // Login page specific colors — GBMode
  loginBackground: { value: '#081a12' },
  loginCardBG: { value: 'rgba(255, 255, 255, 0.16)' },
  loginTextWhite: { value: '#ffffff' },
  loginInputBG: { value: '#132f22' }, // GBMode bg.input
  loginInputBorder: { value: '#1c3f2c' }, // GBMode border.default
  loginInputIcon: { value: '#7da893' }, // GBMode fg.muted
  loginButtonPrimary: { value: '#10b981' }, // GBMode accent.default
  // TopBar colors — GBMode
  topBarBG: { value: '#081a12' }, // bg.outer / bg.sidebar
  topBarBorder: { value: '#1c3f2c' }, // border.default
  topBarIconColor: { value: '#7da893' }, // fg.muted
  topBarTextColor: { value: '#e2f0e8' }, // fg.default
  topBarTextSecondary: { value: 'rgba(216,237,226,0.6)' }, // fg.subtle
  topBarNotificationBadge: { value: '{colors.red.500}' },
  // Header Module Navigation colors — GBMode nav.*
  headerModuleColor: { value: 'rgba(216,237,226,0.55)' }, // nav.text
  headerModuleActiveColor: { value: '#10b981' }, // nav.headerText
  headerModuleActiveBG: { value: 'rgba(16,185,129,0.12)' }, // nav.headerBg
  headerModuleHoverBG: { value: 'rgba(255,255,255,0.04)' }, // nav.itemHover
  // Sidebar colors — GBMode nav.*
  sidebarBG: { value: '#081a12' }, // bg.sidebar
  sidebarBorder: { value: '#1c3f2c' }, // border.default
  sidebarTextColor: { value: 'rgba(216,237,226,0.55)' }, // nav.text
  sidebarTextHover: { value: '#d8ede2' }, // nav.textActive
  sidebarTitleColor: { value: '#d8ede2' }, // nav.textActive
  sidebarSubtitleColor: { value: 'rgba(216,237,226,0.45)' }, // nav.textMuted
  sidebarItemHoverBG: { value: 'rgba(255,255,255,0.04)' }, // nav.itemHover
  sidebarItemActiveBG: { value: 'rgba(16, 185, 129, 0.12)' }, // nav.itemActive (realce translúcido verde marca)
  sidebarItemActiveText: { value: '#10b981' }, // accent.default
  // Card colors — GBMode
  cardBG: { value: '#0e2a1d' }, // bg.surface
  cardBorder: { value: '#1c3f2c' }, // border.default
  cardTextPrimary: { value: '#e2f0e8' }, // fg.default
  cardTextSecondary: { value: '#7da893' }, // fg.muted
  // Painel de resumo (simulador de planos): bloco de contraste, mesmo valor em qualquer tema
  summaryBg: { value: "#0b2519" },
  summaryAccent: { value: "#10b981" },
  summaryText: { value: "#e2f0e8" },
  summaryMuted: { value: "#9fc2b0" },
  summaryFaint: { value: "#7da893" },
  summaryIcon: { value: "#6ee7b7" },
  summaryPositive: { value: "#4ade80" },
  summaryAdded: { value: "#f0abcf" },
  addonText: { value: "#8a3b6b" }, // valor avulso/adicional no catálogo de planos
  cardShadow: { value: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)' }, // DS shadow.cardDark
  // Chart colors
  chartGridLine: { value: '{colors.gray.700}' },
  chartAxisText: { value: '{colors.gray.500}' },
  chartTooltipBG: { value: '{colors.gray.800}' },
  chartTooltipBorder: { value: '{colors.gray.600}' },
  // Stat Card colors (para painéis de estatísticas)
  // DARK MODE: Fundos neutros com apenas ícones coloridos para evitar visual "arco-íris"
  statCard: {
    // Card padrão (neutro)
    defaultBG: { value: '{colors.gray.700}' },
    defaultBorder: { value: '{colors.gray.500}' },
    defaultText: { value: '{colors.gray.300}' },
    defaultIcon: { value: '{colors.gray.400}' },
    // Card de sucesso (verde) - fundo neutro, borda com tint de cor
    successBG: { value: '{colors.gray.700}' },
    successBorder: { value: '{colors.green.900}' },
    successText: { value: '{colors.gray.200}' },
    successIcon: { value: '{colors.green.400}' },
    // Card primário (azul) - fundo neutro, borda com tint de cor
    primaryBG: { value: '{colors.gray.200}' },
    primaryBorder: { value: '{colors.blue.900}' },
    primaryText: { value: '{colors.gray.200}' },
    primaryIcon: { value: '{colors.blue.400}' },
    // Card de aviso (laranja) - fundo neutro, borda com tint de cor
    warningBG: { value: '{colors.gray.700}' },
    warningBorder: { value: '{colors.orange.900}' },
    warningText: { value: '{colors.gray.200}' },
    warningIcon: { value: '{colors.orange.400}' },
    // Card roxo (para grupos/categorias) - fundo neutro, borda com tint de cor
    purpleBG: { value: '{colors.gray.700}' },
    purpleBorder: { value: '{colors.purple.900}' },
    purpleText: { value: '{colors.gray.200}' },
    purpleIcon: { value: '{colors.purple.400}' },
  },
  // Permission UI colors
  // DARK MODE: Fundo neutro com borda colorida sutil para indicar ativo
  permissionActive: {
    bg: { value: '{colors.gray.700}' },
    bgHover: { value: '{colors.gray.600}' },
    border: { value: '{colors.green.800}' },
    icon: { value: '{colors.green.400}' },
  },
  permissionInactive: {
    bg: { value: '{colors.gray.700}' },
    bgHover: { value: '{colors.gray.600}' },
    border: { value: '{colors.gray.500}' },
    icon: { value: '{colors.gray.400}' },
  },
  // Terminal colors (sempre escuro como PowerShell)
  terminal: {
    // Fundo azul bem escuro (tonalidade do protótipo), não preto. Header mantido.
    bg: { value: '#0d1526' },
    headerBG: { value: '{colors.gray.700}' },
    headerBorder: { value: '{colors.gray.600}' },
    contentBG: { value: '#111b2e' },
    text: { value: '{colors.gray.100}' },
    textMuted: { value: '{colors.gray.300}' },
    textDisabled: { value: '{colors.gray.600}' },
    border: { value: '{colors.gray.700}' },
    cardBG: { value: '#172238' },
    cardBorder: { value: '{colors.gray.600}' },
    phaseBG: { value: '#141f33' },
    phaseActiveBG: { value: '#1a2332' },
    phaseActiveBorder: { value: '{colors.blue.600}' },
    outputBG: { value: '#0d1422' },
    streamingBG: { value: 'rgba(59, 130, 246, 0.1)' },
    streamingBorder: { value: 'rgba(59, 130, 246, 0.3)' },
    successBG: { value: 'rgba(34, 197, 94, 0.1)' },
    successBorder: { value: 'rgba(34, 197, 94, 0.3)' },
    successText: { value: '{colors.green.400}' },
    errorBG: { value: 'rgba(239, 68, 68, 0.1)' },
    errorBorder: { value: 'rgba(239, 68, 68, 0.3)' },
    errorText: { value: '{colors.red.400}' },
    statusRunning: { value: '{colors.blue.400}' },
    statusCompleted: { value: '{colors.green.400}' },
    statusError: { value: '{colors.red.400}' },
    statusPending: { value: '{colors.yellow.400}' },
    liveIndicator: { value: '{colors.green.400}' },
  },
  // Trial Banner colors
  trialBanner: {
    bg: { value: 'rgba(147, 51, 234, 0.08)' },
    border: { value: '{colors.purple.800}' },
    text: { value: '{colors.purple.200}' },
    icon: { value: '{colors.purple.400}' },
    ctaBg: { value: '{colors.purple.500}' },
    ctaText: { value: '{colors.white}' },
  },
  // Classification/taxonomy badge colors — mirror light.ts (mesmos slots),
  // padrão dark do statCard: fundo neutro + texto/borda com tint de cor.
  classification: {
    slot1: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.blue.400}' },
      border: { value: '{colors.blue.800}' },
    },
    slot2: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.green.400}' },
      border: { value: '{colors.green.800}' },
    },
    slot3: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.orange.400}' },
      border: { value: '{colors.orange.800}' },
    },
    slot4: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.red.400}' },
      border: { value: '{colors.red.800}' },
    },
    slot5: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.purple.400}' },
      border: { value: '{colors.purple.800}' },
    },
    slot6: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.yellow.400}' },
      border: { value: '{colors.yellow.800}' },
    },
    slot7: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.gray.300}' },
      border: { value: '{colors.gray.500}' },
    },
    slot8: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.gray.400}' },
      border: { value: '{colors.gray.600}' },
    },
    neutral: {
      bg: { value: '{colors.gray.700}' },
      fg: { value: '{colors.gray.400}' },
      border: { value: '{colors.gray.500}' },
    },
  },
  // Paleta categórica de séries dos gráficos de dashboard (execução 046,
  // TASK-DASH-FE-01) — espelha `light.ts`. Os 8 hex categóricos do `cerne`
  // (mesma fonte, GB.Cerne.UX/src/design/tokens.ts@8663490) são mantidos
  // IDÊNTICOS em dark: são cores de MARCA de série (não de superfície), já
  // suficientemente saturadas para contraste sobre o canvas escuro — mesma
  // decisão de projeto de paletas categóricas D3/Recharts, que não invertem
  // por tema. `grid`/`surface` (canvas) sim mudam, espelhando os tokens
  // FLAT equivalentes já existentes (`chartGridLine`, `cardBG`) no dark.
  chart: {
    series: {
      0: { value: '#059669' },
      1: { value: '#3b82f6' },
      2: { value: '#f59e0b' },
      3: { value: '#7c3aed' },
      4: { value: '#ef4444' },
      5: { value: '#0891b2' },
      6: { value: '#d97706' },
      7: { value: '#65a30d' },
    },
    grid: { value: '{colors.gray.700}' }, // mesmo valor de chartGridLine (dark)
    surface: { value: '#0e2a1d' }, // mesmo valor de cardBG (dark, bg.surface)
  },
};

// Definição dos estilos globais específicos para este tema
const styles = {
  global: {
    "html, body": {
      backgroundColor: "#051008", // GBMode bg.canvas
      color: "bodyColor",
    },
    html: {
      fontSize: { base: "87.5%", md: "93.75%", lg: "100%" },
    },
    ".chakra-button__icon": { fontSize: "2xl" },
    ".chakra-menu__icon-wrapper": { fontSize: "2xl!important" },
    // DS GBMode: scrollbar fina de 4px, visível (thumb #1c3f2c, hover #2a5c40).
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "#1c3f2c transparent",
    },
    "*::-webkit-scrollbar": { width: "4px", height: "4px" },
    "*::-webkit-scrollbar-track": { background: "transparent" },
    "*::-webkit-scrollbar-thumb": { background: "#1c3f2c", borderRadius: "9999px" },
    "*::-webkit-scrollbar-thumb:hover": { background: "#2a5c40" },
  },
};

// Exporta um objeto contendo ambas as definições
export const darkTheme = {
  colors,
  styles,
};
