// @vitest-environment jsdom
// src/pages/MeuPerfil/MeuPerfil.beforeunload.test.tsx
// Execução 071, TASK-071-FE-03 (FE03-T10, SRF-071-05) — com alguma alteração
// pendente (Dados pessoais OU Segurança), o `beforeunload` é interceptado
// (`defaultPrevented`); sem nenhuma alteração pendente, não é interceptado.
//
// Isola só o container (`index.tsx`) do resto da tela — os dois cards são
// mockados como componentes controlados que só expõem um botão para simular
// `onDirtyChange(true/false)`, sem precisar montar formulário/query real.

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: { common: { myProfile: { pageTitle: 'Meu perfil', pageDescription: 'desc' } } },
  }),
}));

vi.mock('./AccountSummaryCard', () => ({
  AccountSummaryCard: () => <div>account-summary-stub</div>,
}));

vi.mock('./PersonalDataCard', () => ({
  PersonalDataCard: ({ onDirtyChange }: { onDirtyChange: (d: boolean) => void }) => (
    <button onClick={() => onDirtyChange(true)}>dirty-personal</button>
  ),
}));

vi.mock('./SecurityCard', () => ({
  SecurityCard: ({ onDirtyChange }: { onDirtyChange: (d: boolean) => void }) => (
    <button onClick={() => onDirtyChange(true)}>dirty-security</button>
  ),
}));

import MeuPerfil from './index';

function fireBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
  window.dispatchEvent(event);
  return event;
}

describe('MeuPerfil (index) — guarda de saída (FE03-T10)', () => {
  // `cleanup()` OBRIGATÓRIO — sem auto-cleanup neste projeto, os 3 `it`s
  // acumulariam 3 cópias de "dirty-personal"/"dirty-security" no DOM.
  afterEach(() => {
    cleanup();
  });

  it('sem dirty → beforeunload NÃO é interceptado', () => {
    render(
      <ChakraProvider value={system}>
        <MeuPerfil />
      </ChakraProvider>
    );

    const event = fireBeforeUnload();
    expect(event.defaultPrevented).toBe(false);
  });

  it('com dirty (Dados pessoais) → beforeunload é interceptado (defaultPrevented)', () => {
    render(
      <ChakraProvider value={system}>
        <MeuPerfil />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByText('dirty-personal'));

    const event = fireBeforeUnload();
    expect(event.defaultPrevented).toBe(true);
  });

  it('com dirty (Segurança) → beforeunload é interceptado (defaultPrevented)', () => {
    render(
      <ChakraProvider value={system}>
        <MeuPerfil />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByText('dirty-security'));

    const event = fireBeforeUnload();
    expect(event.defaultPrevented).toBe(true);
  });
});
