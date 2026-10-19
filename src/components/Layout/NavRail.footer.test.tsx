// @vitest-environment jsdom
// src/components/Layout/NavRail.footer.test.tsx
// Execução 071, TASK-071-FE-06 (FE06-T01, SRF-071-07) — o rodapé (tema,
// idioma, planos, configurações, sair) foi removido da sidebar: os 5 itens
// migraram para o menu da conta do Header (TASK-071-FE-05). Este teste prova
// que nenhum deles sobrevive na NavRail, e que os módulos continuam intactos.

import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

function FakeIcon() {
  return null;
}

vi.mock('@/hooks/useMenuModules', () => ({
  useMenuModules: () => [
    { id: 'home', label: 'Início', icon: FakeIcon, path: '/home' },
    { id: 'cadastros', label: 'Cadastros', icon: FakeIcon, path: '/cadastros-base' },
  ],
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', updateTheme: vi.fn() }),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: {
      common: { navRail: { toggleSidebar: 'Recolher menu', notifications: 'Notificações' } },
      defaltStrings: { exit: 'Sair' },
      // `NavRailContent` lê `languageGB.sidebar.navigation[module.id]` como
      // rótulo preferencial, com fallback em `module.label` — objeto vazio
      // aqui é suficiente para o fallback disparar.
      sidebar: { navigation: {} },
    },
    languageInUse: 'BR',
    updateLanguageGB: vi.fn(),
  }),
}));

import { NavRail } from './NavRail';

describe('NavRail — rodapé removido (FE06-T01)', () => {
  it('não renderiza aria-label de tema/idioma/sair/Planos/Configurações; módulos continuam', () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <NavRail
            collapsed={false}
            onToggleCollapse={() => {}}
            isOpen={false}
            onClose={() => {}}
            expandedModuleId={null}
            onModuleClick={() => {}}
          />
        </MemoryRouter>
      </ChakraProvider>
    );

    expect(screen.queryByLabelText(/^tema$/i)).toBeNull();
    expect(screen.queryByLabelText(/idioma/i)).toBeNull();
    expect(screen.queryByLabelText(/^sair$/i)).toBeNull();
    expect(screen.queryByLabelText(/^planos$/i)).toBeNull();
    expect(screen.queryByLabelText(/^configurações$/i)).toBeNull();

    // Módulos continuam renderizados (a lista de navegação não foi tocada).
    expect(screen.getAllByText('Início').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cadastros').length).toBeGreaterThan(0);
  });
});
