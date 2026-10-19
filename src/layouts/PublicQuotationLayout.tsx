// src/layouts/PublicQuotationLayout.tsx
// -----------------------------------------------------------------------------
// Layout STANDALONE do formulário público do fornecedor (hash, RequestQuotation
// — esteira 97-Esteiras/035, TASK-CQ-FE-10). Mirror ESTRUTURAL de
// `AuthLayout.tsx` (`Box` + `Outlet`, sem sidebar/header GBCN) — roteiro
// frontend §1.2/§5.1: "página standalone, só o card do formulário
// centralizado", sem qualquer chrome do app autenticado (faz sentido: o
// fornecedor externo não tem sessão nem permissão nenhuma).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1) — este arquivo NUNCA importa
// `@/contexts/AuthContext`, `@/hooks/useAuth`, `@/stores/*Farm*`, nem
// qualquer componente de chrome autenticado (`DashboardLayout`/`NavRail`/
// `SecondaryNav`). Tema (light/dark) e i18n continuam funcionando
// normalmente aqui — `ThemeProvider`/`LanguageProvider` são globais
// (`main.tsx`/`App.tsx`, envolvem TODAS as rotas, inclusive `/login`) e não
// dependem de sessão/tenant.
// -----------------------------------------------------------------------------

import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

// `bodyBackground` — MESMO token de canvas usado em `DashboardLayout`
// (`styles/theme/semantic/{light,dark}.ts`), garante paridade light/dark com
// o resto do app sem reinventar cor.
export function PublicQuotationLayout() {
  return (
    <Box minH="100vh" bg="bodyBackground">
      <Outlet />
    </Box>
  );
}
