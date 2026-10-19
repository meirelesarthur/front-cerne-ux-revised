// ─────────────────────────────────────────────────────────────────────────────
// Tokens de cor primitivos — remapeados para o design system GB CERNE.
// Estratégia de MENOR RISCO: os NOMES de escala (green, blue, gray, red, yellow)
// são preservados para não quebrar nenhuma referência de recipe/semantic-token
// existente (colorPalette, {colors.blue.500}, etc.). Apenas os VALORES foram
// trocados pela paleta do CERNE.
//   • green  → rampa `brand` do CERNE (verde identidade — 600 principal / 700 hover)
//   • blue   → também aponta para a rampa `brand` do CERNE, porque os tokens
//              semânticos de "primário" do app (primaryMain, buttonSolidBG,
//              sidebar ativo, etc.) referenciam `blue.*`. Assim toda a UI primária
//              passa a ser verde-CERNE sem tocar em nenhum token semântico/recipe.
//              (`blue.900` = brand[700] p/ o hover hardcoded do botão ficar verde.)
//   • gray   → rampa `neutral` do CERNE
//   • red    → rampa `red` do CERNE (feedback de erro)
//   • yellow → rampa `amber` do CERNE (feedback de warning)
//   • feedback / info → tokens novos com bg/border/text/solid do CERNE
// ─────────────────────────────────────────────────────────────────────────────

// Rampa brand do CERNE (usada por `green` e `blue`)
const brandRamp = {
  900: { value: "#064e3b" },
  800: { value: "#065f46" },
  700: { value: "#047857" }, // hover
  600: { value: "#059669" }, // principal
  500: { value: "#22c55e" },
  400: { value: "#4ade80" },
  300: { value: "#86efac" },
  200: { value: "#bbf7d0" },
  100: { value: "#dcfce7" },
  50: { value: "#f0fdf4" },
};

export const colorTokens = {
  black: {
    value: "#000",
  },
  white: {
    value: "#FFF",
  },
  celeste: {
    value: "#BDF5F4",
  },
  whiteSecondary: {
    value: "#FCFCFC",
  },
  transparent: {
    value: "transparent",
  },
  // Verde identidade GB CERNE (rampa brand)
  green: { ...brandRamp },
  // "blue" repontado para a rampa brand: o app usa blue.* como cor primária,
  // então isso torna botões/sidebar/estados ativos verdes sem tocar em semantics.
  // DS: primário = brand[600] #059669, hover/texto = brand[700] #047857. Os semânticos
  // `primaryMain`/`buttonSolidBG` usam blue.500 e o hover usa blue.900, então a rampa
  // `blue` é deslocada (500→brand600, 600/700/900→brand700) em vez de copiar a brand.
  blue: {
    ...brandRamp,
    500: { value: "#059669" },
    600: { value: "#047857" },
    700: { value: "#047857" },
    900: { value: "#047857" },
  },
  // Neutros — rampa neutral do CERNE
  gray: {
    50: { value: "#fafafa" },
    100: { value: "#f5f5f5" },
    200: { value: "#e5e7eb" },
    300: { value: "#d1d5db" },
    400: { value: "#9ca3af" },
    450: { value: "#6b7280" },
    500: { value: "#6b7280" },
    550: { value: "#616161" },
    600: { value: "#404040" },
    650: { value: "#2a2a2a" },
    700: { value: "#1a1a1a" },
    800: { value: "#141414" },
    900: { value: "#111827" },
  },
  // Vermelho — feedback negativo (CERNE red)
  red: {
    50: { value: "#fef2f2" },
    100: { value: "#fee2e2" },
    200: { value: "#fecaca" },
    300: { value: "#fca5a5" },
    400: { value: "#f87171" },
    500: { value: "#ef4444" },
    600: { value: "#dc2626" },
    700: { value: "#b91c1c" },
    800: { value: "#991b1b" },
    900: { value: "#7f1d1d" },
  },
  // Amarelo/âmbar — warning (CERNE amber)
  yellow: {
    50: { value: "#fffbeb" },
    100: { value: "#fef3c7" },
    200: { value: "#fde68a" },
    300: { value: "#fcd34d" },
    400: { value: "#fbbf24" },
    500: { value: "#f59e0b" },
    600: { value: "#d97706" },
    700: { value: "#b45309" },
    800: { value: "#92400e" },
    900: { value: "#78350f" },
  },
  // Azul informativo real (CERNE info) — disponível para feedback "info"
  info: {
    50: { value: "#eff6ff" },
    100: { value: "#dbeafe" },
    200: { value: "#bfdbfe" },
    300: { value: "#93c5fd" },
    400: { value: "#60a5fa" },
    500: { value: "#3b82f6" },
    600: { value: "#2563eb" },
    700: { value: "#1d4ed8" },
    800: { value: "#1e40af" },
    900: { value: "#1e3a8a" },
  },
  // Feedback semântico do CERNE (bg / border / text / solid)
  feedback: {
    success: {
      bg: { value: "#f0fdf4" },
      border: { value: "#bbf7d0" },
      text: { value: "#059669" },
      solid: { value: "#059669" },
    },
    error: {
      bg: { value: "#fee2e2" },
      border: { value: "#fca5a5" },
      text: { value: "#dc2626" },
      solid: { value: "#dc2626" },
    },
    warning: {
      bg: { value: "#fffbeb" },
      border: { value: "#fde68a" },
      text: { value: "#d97706" },
      solid: { value: "#f59e0b" },
    },
    info: {
      bg: { value: "#eff6ff" },
      border: { value: "#bfdbfe" },
      text: { value: "#2563eb" },
      solid: { value: "#3b82f6" },
    },
  },
  // Cores adicionadas do Figma Dashboard (mantidas)
  brand: {
    softer: {
      value: "#f0fdf4",
    },
    soft: {
      value: "#dcfce7",
    },
    medium: {
      value: "#bbf7d0",
    },
    base: {
      value: "#059669",
    },
    strong: {
      value: "#047857",
    },
    darker: {
      value: "#064e3b",
    },
  },
  background: {
    primary: {
      value: "#f0f0f0", // bg.canvas do CERNE (light)
    },
    surface: {
      value: "#fafafa", // bg.outer
    },
  },
  border: {
    base: {
      value: "#e5e7eb", // border.default do CERNE
    },
  },
  text: {
    black: {
      value: "#171717", // fg.default do CERNE
    },
    body: {
      value: "#404040", // fg.muted
    },
    bodySubtle: {
      value: "#6b7280", // fg.subtle
    },
    disabled: {
      value: "#9ca3af",
    },
    dark: {
      value: "#171717",
    },
    secondary: {
      value: "#6b7280",
    },
  },
  status: {
    yellow: {
      value: "#f59e0b",
    },
    pink: {
      value: "#e60076",
    },
    purple: {
      value: "#7c3aed",
    },
    lime: {
      value: "#65a30d",
    },
    danger: {
      value: "#dc2626",
    },
    warning: {
      value: "#f59e0b",
    },
    orange: {
      value: "#ff8a4c",
    },
  },
  // Escala de cores purple (para UI de permissões)
  purple: {
    50: { value: "#faf5ff" },
    100: { value: "#f3e8ff" },
    200: { value: "#e9d5ff" },
    300: { value: "#d8b4fe" },
    400: { value: "#c084fc" },
    500: { value: "#a855f7" },
    600: { value: "#9333ea" },
    700: { value: "#7e22ce" },
    800: { value: "#6b21a8" },
    900: { value: "#581c87" },
  },
  // Escala de cores orange (para UI de avisos)
  orange: {
    50: { value: "#fff7ed" },
    100: { value: "#ffedd5" },
    200: { value: "#fed7aa" },
    300: { value: "#fdba74" },
    400: { value: "#fb923c" },
    500: { value: "#f97316" },
    600: { value: "#ea580c" },
    700: { value: "#c2410c" },
    800: { value: "#9a3412" },
    900: { value: "#7c2d12" },
  },
};
