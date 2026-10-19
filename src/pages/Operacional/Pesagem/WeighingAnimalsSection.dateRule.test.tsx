// src/pages/Operacional/Pesagem/WeighingAnimalsSection.dateRule.test.tsx
// -----------------------------------------------------------------------------
// Regra de data da Pesagem (TASK-PES-DATA-FE): a data precisa ser
// estritamente posterior à última pesagem do animal.
//   - troca da data chama `check-date` UMA vez com todos os animais
//     (`animal_uuids[]`) e marca ERRO na linha de cada `invalid_animals[]`
//     (sem remover o animal) e bloqueia o Salvar;
//   - corrigir a data limpa o erro e libera o Salvar;
//   - 422 do Store (`animals.N.*`) aparece na linha certa;
//   - animal S/ID: payload sem `last_weight`/`last_weight_date`.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const { checkWeighingDateMock, createWeighingMock, toasterCreateMock } = vi.hoisted(() => ({
  checkWeighingDateMock: vi.fn(),
  createWeighingMock: vi.fn(),
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
        pagination: { total: 5, count: 5, per_page: 10, current_page: 1, total_pages: 1 },
      },
    })
  ),
}));
vi.mock('@/services/v2/Weighing/weighing-service', () => ({
  checkWeighingDate: (params?: unknown) => checkWeighingDateMock(params),
  getWeighingNextCode: vi.fn(() => Promise.resolve({ data: { next_code: 'PES-0001' } })),
  getWeighingByUuid: vi.fn(),
  createWeighing: (payload: unknown) => createWeighingMock(payload),
  updateWeighing: vi.fn(),
}));
vi.mock('@/components/ui/toaster', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/toaster')>();
  return {
    ...actual,
    toaster: { ...actual.toaster, create: toasterCreateMock, success: vi.fn(), error: vi.fn() },
  };
});

// Mock do Select: expõe o erro recebido e permite escolher animal comum ou S/ID.
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div>
      <span data-testid={`select-${props.name}-value`}>{props.value?.label ?? ''}</span>
      <span data-testid={`select-${props.name}-error`}>{props.error ?? ''}</span>
      <button
        type="button"
        data-testid={`select-${props.name}-pick-a`}
        onClick={() =>
          props.onChange({
            label: props.name.startsWith('animals') ? '1111' : 'Opção A',
            value: `${props.name}-opt-a`,
            last_weight: 400,
            last_weight_date: '2026-09-01',
          })
        }
      >
        pick-a-{props.name}
      </button>
      <button
        type="button"
        data-testid={`select-${props.name}-pick-semid`}
        onClick={() =>
          props.onChange({
            label: 'S/ID',
            value: `${props.name}-semid`,
            last_weight: null,
            last_weight_date: null,
          })
        }
      >
        pick-semid-{props.name}
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

const form = languagePtBr.BR.weighing.weighing.form;

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={['/operacional/pesagem/novo']}>
          <Routes>
            <Route path="/operacional/pesagem/novo" element={<CreateOrUpdateWeighing />} />
            <Route path="/operacional/pesagem" element={<div data-testid="list-page" />} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

async function wait(ms = 600) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function setupWithAnimalAndDate(date = '2026-09-20') {
  renderPage();
  fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
  fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: date } });
  await wait();
  checkWeighingDateMock.mockReset();
  checkWeighingDateMock.mockResolvedValue({ data: { valid: true } });
  fireEvent.click(await screen.findByTestId('select-animals.0.animal_uuid-pick-a'));
  await wait(100);
  checkWeighingDateMock.mockReset();
  toasterCreateMock.mockReset();
}

const saveButton = () => screen.getByRole('button', { name: /salvar|cadastrar/i });

beforeEach(() => {
  checkWeighingDateMock.mockReset();
  createWeighingMock.mockReset();
  toasterCreateMock.mockReset();
  checkWeighingDateMock.mockResolvedValue({ data: { valid: true } });
});

afterEach(() => {
  cleanup();
});

describe('regra de data da Pesagem na tela', () => {
  it('troca da data: 1 chamada com animal_uuids[], marca o animal inválido na linha (sem remover) e bloqueia Salvar', async () => {
    await setupWithAnimalAndDate('2026-09-20');

    checkWeighingDateMock.mockResolvedValue({
      data: {
        valid: false,
        message: 'Há animais com data inválida.',
        invalid_animals: [
          {
            uuid: 'animals.0.animal_uuid-opt-a',
            label: '1111',
            reference_date: '2026-09-25',
            reason: 'last_weighing',
            message: 'Data da pesagem deve ser posterior à última pesagem do animal (25/09/2026).',
          },
        ],
      },
    });
    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-10' } });
    await wait();

    expect(checkWeighingDateMock).toHaveBeenCalledTimes(1);
    expect(checkWeighingDateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-09-10',
        animal_uuids: ['animals.0.animal_uuid-opt-a'],
      })
    );
    // erro na linha + animal mantido
    expect(screen.getByTestId('select-animals.0.animal_uuid-error').textContent).toBe(
      'Data da pesagem deve ser posterior à última pesagem do animal (25/09/2026).'
    );
    expect(screen.getByTestId('select-animals.0.animal_uuid-value').textContent).toBe('1111');
    // Salvar bloqueado, com mensagem visível
    expect((saveButton() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(form.dateConflictBlocked)).toBeTruthy();
  });

  it('next_weighing: mostra só a message da API na linha (sem o código cru nem data duplicada)', async () => {
    await setupWithAnimalAndDate('2026-09-20');
    checkWeighingDateMock.mockResolvedValue({
      data: {
        valid: false,
        message: 'Data da pesagem deve ser anterior à próxima pesagem do animal (01/10/2026).',
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
    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-10-05' } });
    await wait();

    const error = screen.getByTestId('select-animals.0.animal_uuid-error').textContent;
    expect(error).toBe(
      'Data da pesagem deve ser anterior à próxima pesagem do animal (01/10/2026).'
    );
    expect(error).not.toContain('next_weighing');
    expect(error?.match(/01\/10\/2026/g)).toHaveLength(1);
    expect((saveButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('corrigir a data limpa o erro e libera o Salvar', async () => {
    await setupWithAnimalAndDate('2026-09-20');
    checkWeighingDateMock.mockResolvedValue({
      data: {
        valid: false,
        invalid_animals: [
          {
            uuid: 'animals.0.animal_uuid-opt-a',
            label: '1111',
            reference_date: '2026-09-25',
            reason: 'last_weighing',
            message: 'Data inválida.',
          },
        ],
      },
    });
    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-10' } });
    await wait();
    expect((saveButton() as HTMLButtonElement).disabled).toBe(true);

    checkWeighingDateMock.mockResolvedValue({ data: { valid: true, invalid_animals: [] } });
    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-30' } });
    await wait();

    expect(screen.getByTestId('select-animals.0.animal_uuid-error').textContent).toBe('');
    expect((saveButton() as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(form.dateConflictBlocked)).toBeNull();
  });

  it('trocar o animal da linha limpa o erro de data sem nova chamada em lote', async () => {
    await setupWithAnimalAndDate('2026-09-20');
    checkWeighingDateMock.mockResolvedValue({
      data: {
        valid: false,
        invalid_animals: [
          {
            uuid: 'animals.0.animal_uuid-opt-a',
            label: '1111',
            reference_date: '2026-09-25',
            reason: 'last_weighing',
            message: 'Data inválida.',
          },
        ],
      },
    });
    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-10' } });
    await wait();
    expect((saveButton() as HTMLButtonElement).disabled).toBe(true);

    checkWeighingDateMock.mockResolvedValue({ data: { valid: true } });
    fireEvent.click(screen.getByTestId('select-animals.0.animal_uuid-pick-semid'));
    await wait(100);

    expect(screen.getByTestId('select-animals.0.animal_uuid-error').textContent).toBe('');
    expect((saveButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it('422 do Store com animals.N.weight aparece na linha certa', async () => {
    await setupWithAnimalAndDate('2026-09-20');
    createWeighingMock.mockRejectedValue(
      Object.assign(new Error('422'), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { errors: { 'animals.0.animal_uuid': ['Pesagem retroativa não é permitida.'] } },
        },
      })
    );
    fireEvent.change(document.querySelector('input[name="animals.0.weight"]')!, {
      target: { value: '4500' },
    });
    await wait(100);
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(screen.getByTestId('select-animals.0.animal_uuid-error').textContent).toBe(
        'Pesagem retroativa não é permitida.'
      )
    );
  });

  it('S/ID: payload enviado sem last_weight e last_weight_date', async () => {
    renderPage();
    fireEvent.click(screen.getByTestId('select-category_uuid-pick-a'));
    fireEvent.change(screen.getByTestId('dateinput-Data'), { target: { value: '2026-09-20' } });
    await wait();
    fireEvent.click(await screen.findByTestId('select-animals.0.animal_uuid-pick-semid'));
    await wait(100);
    createWeighingMock.mockResolvedValue({ data: { uuid: 'p-1' } });
    fireEvent.change(document.querySelector('input[name="animals.0.weight"]')!, {
      target: { value: '4500' },
    });
    await wait(100);
    fireEvent.click(saveButton());

    await waitFor(() => expect(createWeighingMock).toHaveBeenCalled());
    const animal = createWeighingMock.mock.calls[0][0].animals[0];
    expect(animal.animal_uuid).toBe('animals.0.animal_uuid-semid');
    expect(animal).not.toHaveProperty('last_weight');
    expect(animal).not.toHaveProperty('last_weight_date');
  });
});
