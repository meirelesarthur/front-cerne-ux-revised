// @vitest-environment jsdom
// Central genérica de agrupador: um card por item do grupo (podado por permissão),
// item com filhos vira seção, grupo inexistente mostra "Grupo não encontrado".
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';
import type { NavModule } from '@/config/v2/navigationTree';

import GroupHub, { countGroupLeaves } from './index';

const lang = languagePtBr.BR;
const text = lang.sidebar.groupHub;
const navigate = vi.fn();

const MODULES: NavModule[] = [
  {
    id: 'mod-x',
    label: 'Módulo X',
    emoji: '',
    icon: 'grain',
    groups: [
      {
        id: 'grp-a',
        label: 'Grupo A',
        icon: 'grain',
        items: [
          { id: 'it-1', label: 'Tela Um', path: '/x/um', icon: 'cart' },
          { id: 'it-2', label: 'Tela Dois', path: '/x/dois' },
          {
            id: 'it-3',
            label: 'Pasta',
            path: '/x/pasta',
            children: [
              { id: 'it-3a', label: 'Filho A', path: '/x/pasta/a' },
              { id: 'it-3b', label: 'Filho B', path: '/x/pasta/b' },
            ],
          },
        ],
      },
    ],
  },
];

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/useMenuModules', () => ({
  useMenuModules: () => MODULES,
}));

function renderAt(path: string) {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/central/:groupId" element={<GroupHub />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('GroupHub', () => {
  it('mostra o nome do grupo, a contagem e um card por tela', () => {
    renderAt('/central/grp-a');
    expect(screen.getByText('Grupo A')).toBeTruthy();
    expect(screen.getByText(/4 funcionalidades em Módulo X/)).toBeTruthy();
    for (const title of ['Tela Um', 'Tela Dois', 'Filho A', 'Filho B']) {
      expect(screen.getByRole('button', { name: new RegExp(title) })).toBeTruthy();
    }
  });

  it('o card mostra a descrição da funcionalidade quando existe', () => {
    lang.sidebar.descriptions['it-1'] = 'Descrição da tela um.';
    renderAt('/central/grp-a');
    expect(screen.getByText('Descrição da tela um.')).toBeTruthy();
    delete lang.sidebar.descriptions['it-1'];
  });

  it('item com filhos vira seção com o nome do item', () => {
    renderAt('/central/grp-a');
    expect(screen.getByRole('heading', { name: 'Pasta' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Pasta$/ })).toBeNull();
  });

  it('cada card leva à tela', () => {
    renderAt('/central/grp-a');
    fireEvent.click(screen.getByRole('button', { name: /Tela Dois/ }));
    expect(navigate).toHaveBeenCalledWith('/x/dois');
    fireEvent.click(screen.getByRole('button', { name: /Filho B/ }));
    expect(navigate).toHaveBeenCalledWith('/x/pasta/b');
  });

  it('grupo inexistente ou sem acesso mostra "Grupo não encontrado"', () => {
    renderAt('/central/nao-existe');
    expect(screen.getByText(text.notFoundTitle)).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('countGroupLeaves conta folhas e filhos', () => {
    expect(countGroupLeaves(MODULES[0].groups![0].items)).toBe(4);
  });
});
