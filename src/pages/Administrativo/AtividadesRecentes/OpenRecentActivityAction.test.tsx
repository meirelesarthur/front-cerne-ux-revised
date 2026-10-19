// @vitest-environment jsdom
// UT-000690 / TASK-092-FE-02 — T-FE-02.04/05/06: ação "Abrir" (ARQ-FE §5).

import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { RecentActivityListItem } from '@/@types/v2/RecentActivities';

const navigateMock = vi.fn();
const mutateAsyncMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
let activeFarm: string | null = 'farm-A';

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('use-context-selector', async (importOriginal) => {
  const original = await importOriginal<typeof import('use-context-selector')>();
  return {
    ...original,
    useContextSelector: (_ctx: unknown, selector: (c: unknown) => unknown) =>
      selector({ activeFarmUuid: activeFarm }),
  };
});
vi.mock('@/contexts/AuthContext', () => ({ AuthContext: {} }));
vi.mock('@/hooks/useActivateFarm', () => ({
  useActivateFarm: () => ({ mutateAsync: mutateAsyncMock }),
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: languagePtBr.BR }),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    success: (...a: unknown[]) => toastSuccessMock(...a),
    error: (...a: unknown[]) => toastErrorMock(...a),
  },
}));

import { isSafeSpaPath, useOpenRecentActivity } from './hooks/useOpenRecentActivity';
import { OpenRecentActivityAction } from './OpenRecentActivityAction';

const languageGB: any = languagePtBr.BR;

function makeItem(over: Partial<RecentActivityListItem> = {}): RecentActivityListItem {
  return {
    type: 'death_animal',
    type_label: 'Mortes',
    uuid: 'item-1',
    created_at: '2026-10-05T13:42:10.000000Z',
    farm: { uuid: 'farm-A', name: 'Fazenda A' },
    api_path: '/api/v1/death-animals/item-1',
    spa_path: '/operacional/mortes/item-1/detalhe',
    status: null,
    ...over,
  };
}

function Harness({ items }: { items: RecentActivityListItem[] }) {
  const { handleOpen, openingKey } = useOpenRecentActivity();
  return (
    <ChakraProvider value={system}>
      {items.map((item) => (
        <div key={item.uuid} data-testid={`row-${item.uuid}`}>
          <OpenRecentActivityAction
            item={item}
            languageGB={languageGB}
            openingKey={openingKey}
            onOpen={handleOpen}
          />
        </div>
      ))}
    </ChakraProvider>
  );
}

beforeEach(() => {
  activeFarm = 'farm-A';
});
afterEach(() => {
  cleanup();
  navigateMock.mockReset();
  mutateAsyncMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
});

describe('isSafeSpaPath', () => {
  it('só aceita caminho relativo da SPA', () => {
    expect(isSafeSpaPath('/operacional/mortes/1')).toBe(true);
    expect(isSafeSpaPath(null)).toBe(false);
    expect(isSafeSpaPath('//evil.com')).toBe(false);
    expect(isSafeSpaPath('https://evil.com')).toBe(false);
    expect(isSafeSpaPath('/\\evil.com')).toBe(false);
    expect(isSafeSpaPath('')).toBe(false);
  });
});

describe('OpenRecentActivityAction', () => {
  it('T-FE-02.04 — spa_path null: botão desabilitado e sem navegação', () => {
    render(<Harness items={[makeItem({ spa_path: null })]} />);
    const button = screen.getByRole('button', { name: 'Abrir' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('spa_path absoluto (inseguro) também fica desabilitado', () => {
    render(<Harness items={[makeItem({ spa_path: 'https://evil.com/x' })]} />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('T-FE-02.05 — mesma fazenda: navega direto, sem trocar de fazenda', () => {
    render(<Harness items={[makeItem()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(navigateMock).toHaveBeenCalledWith('/operacional/mortes/item-1/detalhe');
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('T-FE-02.06 — outra fazenda: troca, toast de sucesso e navega (nessa ordem)', async () => {
    const calls: string[] = [];
    mutateAsyncMock.mockImplementation(async (uuid: string) => {
      calls.push(`switch:${uuid}`);
    });
    toastSuccessMock.mockImplementation(() => calls.push('toast'));
    navigateMock.mockImplementation(() => calls.push('navigate'));

    render(<Harness items={[makeItem({ farm: { uuid: 'farm-B', name: 'Fazenda B' } })]} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    });

    expect(calls).toEqual(['switch:farm-B', 'toast', 'navigate']);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: languageGB.defaltStrings.farmSwitcher.changedToastTitle,
        description: 'Fazenda B',
      })
    );
    expect(navigateMock).toHaveBeenCalledWith('/operacional/mortes/item-1/detalhe');
  });

  it('T-FE-02.06 — falha na troca: toast de erro e NÃO navega', async () => {
    mutateAsyncMock.mockRejectedValue(new Error('falhou'));
    render(<Harness items={[makeItem({ farm: { uuid: 'farm-B', name: 'Fazenda B' } })]} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    });

    expect(toastErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: languageGB.defaltStrings.farmSwitcher.changeErrorToastTitle,
      })
    );
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('T-FE-02.06 — duplo clique dispara UMA mutation; as demais linhas ficam desabilitadas', async () => {
    let release: () => void = () => undefined;
    mutateAsyncMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const farmB = { uuid: 'farm-B', name: 'Fazenda B' };
    render(
      <Harness
        items={[
          makeItem({ uuid: 'i1', farm: farmB }),
          makeItem({ uuid: 'i2', farm: farmB, spa_path: '/operacional/mortes/i2/detalhe' }),
        ]}
      />
    );
    const first = within1('row-i1');
    await act(async () => {
      fireEvent.click(first);
      fireEvent.click(first);
    });

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    expect((within1('row-i2') as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      release();
    });
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});

function within1(testId: string): HTMLElement {
  return screen.getByTestId(testId).querySelector('button') as HTMLElement;
}
