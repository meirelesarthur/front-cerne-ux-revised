// src/pages/CadastrosBase/Rebanho/gestao-animais-t53-paridade.test.tsx
// -----------------------------------------------------------------------------
// Prova de PARIDADE COMPORTAMENTAL da Tarefa 53 (execução 017, item 4/4 —
// reversão de SD-01, contrato `97-Esteiras/017/CONTRATOS/contrato-tela-
// gestao-animais-dedicada.md` §5). A Tarefa 53 é um refactor puramente
// EXTRATIVO: `Rebanho/index.tsx` deixou de conter a lógica de grid/filtro/
// lote (movida para `AnimalListScreen.tsx`, parametrizada) e virou um
// wrapper fino. Este arquivo prova, com testes REAIS (não fabricados, sem
// mock mascarando produto), que nada mudou do ponto de vista de
// `/cadastros-base/rebanho`:
//
//  1. O wrapper (`index.tsx`) injeta em `AnimalListScreen` exatamente os
//     mesmos valores que estavam hardcoded ANTES do refactor: `basePath`
//     '/cadastros-base/rebanho', `storageKeyPrefix` 'CadastrosBaseRebanho'
//     (byte-a-byte igual ao literal anterior `'CadastrosBaseRebanho' +
//     queryKey.animals.animalsList`), e `pageTitle`/`pageSubtitle` vindos do
//     MESMO namespace i18n (`languageGB.animals.animal.list`) de sempre.
//  2. `HeaderTable` (que ganhou a prop `basePath`, AD-F07) continua
//     navegando para `${basePath}/novo` ao clicar "Novo Animal" — em
//     `/cadastros-base/rebanho` isso resolve para o MESMO path absoluto que
//     estava hardcoded antes (`/cadastros-base/rebanho/novo`).
//  3. O gate de permissão do header (`animals_create`/`animals_view`) NÃO
//     mudou nesta extração — reforça a restrição explícita do dono de NÃO
//     tocar em `animals-management_*` nas ações individuais
//     (`GAP-GESTAO-FE-05`, fora de escopo desta reversão).
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { AuthContext } from '@/contexts/AuthContext';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';
import { queryKey } from '@/constants/query-key';

import { HeaderTable } from './HeaderTable';

// Esta suíte NÃO tem `globals: true` no `vitest.config.ts` (mirror do padrão
// já usado por `FinishProcessing.discardDraft.test.tsx`) — o cleanup
// automático do Testing Library entre `it()`s depende de um `afterEach`
// global que não existe aqui. Sem isto, o DOM do teste anterior (com
// `animals_create`) vazaria para o teste seguinte (sem `animals_create`),
// fazendo o `queryByText` do 3º teste encontrar o botão do 2º.
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Parte 1 — wiring do wrapper `index.tsx` → `AnimalListScreen`
// ---------------------------------------------------------------------------

let capturedAnimalListScreenProps: Record<string, unknown> | null = null;

vi.mock('./AnimalListScreen', () => ({
  AnimalListScreen: (props: Record<string, unknown>) => {
    capturedAnimalListScreenProps = props;
    return null;
  },
}));

describe('Tarefa 53 — RebanhoList (index.tsx) injeta os parâmetros pré-refactor sem alteração', () => {
  it('basePath, storageKeyPrefix e pageTitle/pageSubtitle são byte-a-byte iguais ao comportamento anterior ao refactor', async () => {
    capturedAnimalListScreenProps = null;

    // Import dinâmico DEPOIS do vi.mock acima (hoisted) garantir que
    // `index.tsx` recebe o `AnimalListScreen` mockado, não o real.
    const { default: RebanhoList } = await import('./index');

    render(<RebanhoList />);

    await waitFor(() => expect(capturedAnimalListScreenProps).not.toBeNull());

    const languageGB = getLanguageRouter(languageContextTypes.BR);
    const text = languageGB.animals.animal;

    // AD-F06/F09 do contrato — mesmos valores que estavam HARDCODED em
    // `index.tsx` antes da extração (Tarefa 53, DoD "storageKey efetivo
    // idêntico" e "mesma UI").
    expect(capturedAnimalListScreenProps).toMatchObject({
      basePath: '/cadastros-base/rebanho',
      storageKeyPrefix: 'CadastrosBaseRebanho',
      pageTitle: text.list.pageTitle,
      pageSubtitle: text.list.pageSubtitle,
    });

    // Prova adicional, literal: a storageKey EFETIVA que `AnimalListScreen`
    // vai montar internamente (`storageKeyPrefix + queryKey.animals.animalsList`)
    // é idêntica ao literal hardcoded pré-refactor
    // (`'CadastrosBaseRebanho' + queryKey.animals.animalsList`) — nenhum
    // usuário com filtro/página já persistidos perde esse estado.
    const effectiveStorageKey =
      (capturedAnimalListScreenProps!.storageKeyPrefix as string) + queryKey.animals.animalsList;
    const preRefactorStorageKey = 'CadastrosBaseRebanho' + queryKey.animals.animalsList;
    expect(effectiveStorageKey).toBe(preRefactorStorageKey);
  });
});

// ---------------------------------------------------------------------------
// Parte 2 — `HeaderTable` navega via `basePath` (AD-F07) sem mudar destino
// ---------------------------------------------------------------------------

/**
 * Objeto completo do contexto de auth (shape exigido pelo Provider) — só
 * `permissions` varia por teste; os demais campos são os defaults inertes
 * já usados como valor padrão do próprio `createContext` em produção.
 * @param {string[]} permissions Permissões Spatie simuladas para o teste.
 * @return {object} Valor completo do `AuthContextType` para o Provider.
 */
function buildAuthContextValue(permissions: string[]) {
  return {
    isAuthenticated: false,
    loading: false,
    error: '',
    user: null,
    profile: null,
    permissions,
    roles: [],
    favorites: [],
    activeFarmUuid: null,
    farmScopedPermissions: [],
    setActiveFarm: () => {},
    farmContext: null,
    markHasFarms: () => {},
    toggleFavorite: async () => {},
    twoFactorPending: null,
    signIn: async () => {},
    signOut: async () => {},
    clearError: () => {},
    refreshProfile: async () => {},
    verifyTwoFactor: async () => {},
    verifyTwoFactorBackup: async () => {},
    cancelTwoFactor: () => {},
    setSuppressLoadingOverlay: () => {},
  };
}

function LocationProbe({ onChange }: { onChange: (pathname: string) => void }) {
  const location = useLocation();
  onChange(location.pathname);
  return null;
}

function renderHeaderTable({ permissions, basePath }: { permissions: string[]; basePath: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const languageGB = getLanguageRouter(languageContextTypes.BR);
  let currentPath = basePath;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ChakraProvider value={system}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={buildAuthContextValue(permissions)}>
            <MemoryRouter initialEntries={[basePath]}>
              <LocationProbe onChange={(pathname) => (currentPath = pathname)} />
              {children}
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>
      </ChakraProvider>
    );
  }

  render(
    <Wrapper>
      <HeaderTable
        onOpenFilter={() => {}}
        filtersApplied={0}
        languageGB={languageGB}
        basePath={basePath}
      />
    </Wrapper>
  );

  return { languageGB, getCurrentPath: () => currentPath };
}

describe('Tarefa 53 — HeaderTable navega via basePath (AD-F07) preservando o destino de /cadastros-base/rebanho', () => {
  it('clicar em "Novo Animal" navega para `${basePath}/novo` — idêntico ao path hardcoded anterior', async () => {
    const basePath = '/cadastros-base/rebanho';

    const { languageGB, getCurrentPath } = renderHeaderTable({
      permissions: ['animals_create'],
      basePath,
    });

    const addButton = await screen.findByText(languageGB.defaltStrings.new);
    fireEvent.click(addButton);

    await waitFor(() => expect(getCurrentPath()).toBe('/cadastros-base/rebanho/novo'));
  });

  it('gate de permissão do header PERMANECE só `animals_create`/`animals_view` — GAP-GESTAO-FE-05 não corrigido nesta Tarefa', async () => {
    // Perfil só com `animals-management_create` (sem nenhum `animals_*`) —
    // mesmo achado do contrato §6 Risco 2: o botão "Novo Animal" continua
    // AUSENTE, porque esta Tarefa (extração pura) não mexeu no gate.
    renderHeaderTable({
      permissions: ['animals-management_create', 'animals-management_view'],
      basePath: '/cadastros-base/rebanho',
    });

    const languageGB = getLanguageRouter(languageContextTypes.BR);
    expect(screen.queryByText(languageGB.defaltStrings.new)).toBeNull();
  });
});
