// @vitest-environment jsdom
import { createElement } from 'react';
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: string[] = [];
const selectFarmMock = vi.fn();
const setActiveFarmMock = vi.fn((uuid: string) => {
  calls.push(`setActiveFarm:${uuid}`);
});

vi.mock('@/services/v2/Farms/farm-service', () => ({
  selectFarm: (uuid: string) => selectFarmMock(uuid),
}));

vi.mock('use-context-selector', async (importOriginal) => {
  const original = await importOriginal<typeof import('use-context-selector')>();
  return {
    ...original,
    useContextSelector: (_context: unknown, selector: (ctx: unknown) => unknown) =>
      selector({ setActiveFarm: setActiveFarmMock }),
  };
});

const { useActivateFarm } = await import('@/hooks/useActivateFarm');

const FARM_UUID = '0b7f8a5e-0000-4000-8000-000000000001';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async () => {
    calls.push('invalidateQueries');
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(() => useActivateFarm(), { wrapper });
  return { result, invalidateSpy };
}

describe('TASK-072-FE-09 — useActivateFarm', () => {
  beforeEach(() => {
    calls.length = 0;
    selectFarmMock.mockReset();
    setActiveFarmMock.mockClear();
  });

  it('ordem: select → setActiveFarm → invalidateQueries() sem filtro', async () => {
    selectFarmMock.mockImplementation(async (uuid: string) => {
      calls.push(`select:${uuid}`);
      return { uuid, description: 'Fazenda 1' };
    });
    const { result, invalidateSpy } = setup();

    await act(async () => {
      await result.current.mutateAsync(FARM_UUID);
    });

    expect(calls).toEqual([
      `select:${FARM_UUID}`,
      `setActiveFarm:${FARM_UUID}`,
      'invalidateQueries',
    ]);
    expect(invalidateSpy).toHaveBeenCalledWith();
  });

  it('erro no select não chama setActiveFarm nem invalida', async () => {
    selectFarmMock.mockRejectedValue(new Error('403'));
    const { result, invalidateSpy } = setup();

    await act(async () => {
      await expect(result.current.mutateAsync(FARM_UUID)).rejects.toThrow('403');
    });

    expect(setActiveFarmMock).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
