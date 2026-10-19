// src/pages/Operacional/Pesagem/WeighingAnimalsSection.checkDateReject.test.tsx
// -----------------------------------------------------------------------------
// `check-date` (EP-PES-09) NÃO-BLOQUEANTE na Pesagem (TASK-PES-PAS-FE).
// A API devolve `{valid, message}` (nunca `has_warning`):
//   - `valid === false` → toast de aviso com o `message` da API. No
//     cabeçalho (sem animal) é só informativo; na seleção do animal é
//     BLOQUEANTE como no legado (`_forms.blade.php:938-961`): avisa e LIMPA o
//     animal da linha (com Último Peso/Data);
//   - `valid === true` → sem aviso;
//   - 422/erro de rede → silencioso e NÃO trava a tela (os testes antigos,
//     que digitavam em "Último Peso" após o 422, perderam o objeto: o campo
//     agora é somente leitura — ver `...lastWeightAfterFilterChange.test.tsx`).
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const { checkWeighingDateMock, toasterCreateMock } = vi.hoisted(() => ({
  checkWeighingDateMock: vi.fn(),
  toasterCreateMock: vi.fn(),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { username: 'dev.teste' },
    profile: null,
    error: null,
    isAuthenticated: true,
    loading: false,
    activeFarmUuid: 'farm-uuid-1',
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMyFarms', () => ({
  useMyFarms: () => ({
    data: [{ uuid: 'farm-uuid-1', description: 'Fazenda Teste' }],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    permissions: [],
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    hasRole: () => false,
    hasFarm: true,
    isFarmScoped: () => false,
  }),
}));

vi.mock('@/services/v2/Batches/batch-service', () => ({
  listBatchOptionsForForm: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/CategoryAnimals/category-animal-service', () => ({
  listCategoryAnimalOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Animals/animal-service', () => ({
  listAnimalOptions: vi.fn(() =>
    Promise.resolve({
      success: true,
      message: '',
      data: {
        items: [],
        pagination: { total: 0, count: 0, per_page: 10, current_page: 1, total_pages: 1 },
      },
    })
  ),
}));
vi.mock('@/services/v2/Weighing/weighing-service', () => ({
  checkWeighingDate: (params?: unknown) => checkWeighingDateMock(params),
  getWeighingNextCode: vi.fn(() => Promise.resolve({ data: { next_code: 'PES-0001' } })),
  getWeighingByUuid: vi.fn(),
  createWeighing: vi.fn(),
  updateWeighing: vi.fn(),
}));

vi.mock('@/components/ui/toaster', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/toaster')>();
  return { ...actual, toaster: { ...actual.toaster, create: toasterCreateMock } };
});

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div>
      <span data-testid={`select-${props.name}-value`}>{props.value?.label ?? ''}</span>
      <button
        type="button"
        data-testid={`select-${props.name}-pick-a`}
        onClick={() => props.onChange({ label: 'Opção A', value: `${props.name}-opt-a` })}
      >
        pick-a-{props.name}
      </button>
    </div>
  ),
}));

vi.mock('@/components/DateInput', () => ({
  DateInput: (props: any) => (
    <input
      data-testid={`dateinput-${props.label ?? 'unnamed'}`}
      value={props.value ?? ''}
      onChange={(e: any) => props.onChange(e.target.value || null)}
    />
  ),
}));

import CreateOrUpdateWeighing from './CreateOrUpdateWeighing';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={['/operacional/pesagem/novo']}>
          <Routes>
            <Route path="/operacional/pesagem/novo" element={<CreateOrUpdateWeighing />} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  checkWeighingDateMock.mockReset();
  toasterCreateMock.mockReset();
});

afterEach(() => {
  cleanup();
});

async function waitForDebounce() {
  // Debounce local de 400ms do cabeçalho (`WeighingHeaderFields.tsx`).
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  });
}

describe('check-date da Pesagem — aviso não-bloqueante a partir de { valid, message }', () => {
  it('cabeçalho: valid=false mostra o message da API', async () => {
    checkWeighingDateMock.mockResolvedValue({
      success: true,
      data: {
        valid: false,
        message: 'Data de criação do lote é mais recente que a data da pesagem.',
      },
    });
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();

    expect(checkWeighingDateMock).toHaveBeenCalled();
    expect(toasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        description: 'Data de criação do lote é mais recente que a data da pesagem.',
      })
    );
  });

  it('cabeçalho: valid=true NÃO mostra aviso', async () => {
    checkWeighingDateMock.mockResolvedValue({ success: true, data: { valid: true } });
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();

    expect(checkWeighingDateMock).toHaveBeenCalled();
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });

  it('seleção do animal: chama check-date com animal_uuid, mostra o message quando valid=false e LIMPA o animal', async () => {
    checkWeighingDateMock.mockResolvedValue({ success: true, data: { valid: true } });
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();
    checkWeighingDateMock.mockReset();
    toasterCreateMock.mockReset();
    checkWeighingDateMock.mockResolvedValue({
      success: true,
      data: {
        valid: false,
        message:
          'Animal 1111 teve sua última pesagem em 01/09/2026 e não pode ser pesado em data anterior.',
        invalid_animals: [
          {
            uuid: 'animals.0.animal_uuid-opt-a',
            label: '1111',
            reference_date: '2026-09-01',
            reason: 'last_weighing',
            message:
              'Animal 1111 teve sua última pesagem em 01/09/2026 e não pode ser pesado em data anterior.',
          },
        ],
      },
    });

    fireEvent.click(await screen.findByTestId('select-animals.0.animal_uuid-pick-a'));

    await waitFor(() =>
      expect(toasterCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          description:
            'Animal 1111 teve sua última pesagem em 01/09/2026 e não pode ser pesado em data anterior.',
        })
      )
    );
    expect(checkWeighingDateMock).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-09-20', animal_uuid: 'animals.0.animal_uuid-opt-a' })
    );
    // animal limpo (o mock do Select reflete `value` recebido)
    await waitFor(() =>
      expect(screen.getByTestId('select-animals.0.animal_uuid-value').textContent).toBe('')
    );
  });

  it('seleção do animal: usa a message do ITEM (next_weighing) em vez da do topo e limpa o animal', async () => {
    checkWeighingDateMock.mockResolvedValue({ success: true, data: { valid: true } });
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();
    checkWeighingDateMock.mockReset();
    toasterCreateMock.mockReset();
    checkWeighingDateMock.mockResolvedValue({
      success: true,
      data: {
        valid: false,
        message: '2 animais não podem ser pesados nesta data.',
        invalid_animals: [
          {
            uuid: 'animals.0.animal_uuid-opt-a',
            label: '1111',
            reference_date: '2026-10-01',
            reason: 'next_weighing',
            message: 'Data da pesagem deve ser anterior à próxima pesagem do animal (01/10/2026).',
          },
        ],
      },
    });

    fireEvent.click(await screen.findByTestId('select-animals.0.animal_uuid-pick-a'));

    await waitFor(() =>
      expect(toasterCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description:
            'Data da pesagem deve ser anterior à próxima pesagem do animal (01/10/2026).',
        })
      )
    );
    await waitFor(() =>
      expect(screen.getByTestId('select-animals.0.animal_uuid-value').textContent).toBe('')
    );
  });

  it('seleção do animal: valid=false só do lote (sem o animal em invalid_animals) avisa e MANTÉM o animal', async () => {
    checkWeighingDateMock.mockResolvedValue({ success: true, data: { valid: true } });
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();
    checkWeighingDateMock.mockReset();
    toasterCreateMock.mockReset();
    checkWeighingDateMock.mockResolvedValue({
      success: true,
      data: {
        valid: false,
        message: 'Data de criação do lote é mais recente que a data da pesagem.',
        invalid_animals: [],
      },
    });

    fireEvent.click(await screen.findByTestId('select-animals.0.animal_uuid-pick-a'));

    await waitFor(() =>
      expect(toasterCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Data de criação do lote é mais recente que a data da pesagem.',
        })
      )
    );
    expect(screen.getByTestId('select-animals.0.animal_uuid-value').textContent).toBe('Opção A');
  });

  it('seleção do animal com valid=true MANTÉM o animal', async () => {
    checkWeighingDateMock.mockResolvedValue({ success: true, data: { valid: true } });
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();
    fireEvent.click(await screen.findByTestId('select-animals.0.animal_uuid-pick-a'));

    await waitFor(() => expect(checkWeighingDateMock).toHaveBeenCalledTimes(2));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.getByTestId('select-animals.0.animal_uuid-value').textContent).toBe('Opção A');
  });

  it('erro 422/rede do check-date é silencioso: sem aviso e a tela segue utilizável', async () => {
    checkWeighingDateMock.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 422'), {
        isAxiosError: true,
        response: { status: 422, data: { success: false, errors: {} } },
      })
    );
    renderPage();

    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    await waitForDebounce();

    expect(checkWeighingDateMock).toHaveBeenCalled();
    expect(toasterCreateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('select-animals.0.animal_uuid-pick-a')).toBeTruthy();
  });
});
