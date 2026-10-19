// src/pages/Operacional/Pesagem/WeighingAnimalsSection.availability.test.tsx
// -----------------------------------------------------------------------------
// Execução 084, item 3 (Pesagem manual):
//  (a) o select de animal da linha envia `exclude_uuids` (animais das OUTRAS
//      linhas) ao servidor — sem filtro client-side;
//  (b) "Adicionar animal" com lote selecionado e todos os animais já escolhidos
//      (`pagination.total === 0`) mostra o aviso e NÃO adiciona linha;
//  (c) com animais disponíveis, adiciona normalmente.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { LanguageDate } from '@/@types/language';
import type { WeighingFormValues } from '@/@types/v2/Weighing';

import { WeighingAnimalsSection } from './WeighingAnimalsSection';

const { listAnimalOptionsMock, toasterCreateMock } = vi.hoisted(() => ({
  listAnimalOptionsMock: vi.fn(),
  toasterCreateMock: vi.fn(),
}));

vi.mock('@/services/v2/Animals/animal-service', () => ({
  listAnimalOptions: listAnimalOptionsMock,
}));

vi.mock('@/services/v2/Weighing/weighing-service', () => ({
  checkWeighingDate: vi.fn(() => Promise.resolve({ data: { has_warning: false } })),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: toasterCreateMock },
}));

const ALL_SELECTED_TEXT = 'Todos os animais já foram selecionados.';

const languageGBStub = {
  weighing: {
    weighing: {
      singularLabel: 'Pesagem',
      form: {
        sections: { animals: 'Animais' },
        fields: {
          animal: 'Animal',
          weight: 'Peso',
          lastWeight: 'Último Peso',
          lastWeightDate: 'Data Últ. Pesagem',
          gain: 'Ganho',
          gmd: 'GMD',
          ultrasound: 'Ultrassom',
          aol: 'AOL',
          egs: 'EGS',
          marm: 'MARM',
          classification: 'Classe',
        },
        placeholders: { animal: 'Selecione o animal' },
        addAnimal: 'Adicionar animal',
        removeAnimal: 'Remover animal',
        emptyAnimalsRow: 'Nenhum animal adicionado.',
        allAnimalsSelected: ALL_SELECTED_TEXT,
      },
    },
  },
} as unknown as LanguageDate;

function animalRow(uuid: string, label: string): WeighingFormValues['animals'][number] {
  return {
    row_uuid: `row-${uuid}`,
    animal_uuid: { label, value: uuid },
    weight: 320,
    last_weight: 300,
    last_weight_date: '2026-07-01',
    has_ultrasound: false,
    aol: null,
    egs: null,
    marm: null,
    classification: null,
  };
}

const defaultValues: WeighingFormValues = {
  date: null,
  batch_uuid: { label: 'Lote 1', value: 'batch-uuid-1' },
  category_uuid: null,
  is_stock: false,
  arroba_value: '',
  animals: [animalRow('animal-uuid-1', '1111'), animalRow('animal-uuid-2', '2222')],
  sanitary: false,
  sanitary_items: [],
};

function Harness({ values = defaultValues }: { values?: WeighingFormValues }) {
  const { control, setValue } = useForm<WeighingFormValues>({ defaultValues: values });
  return (
    <WeighingAnimalsSection
      control={control}
      setValue={setValue}
      languageGB={languageGBStub}
      isDisabled={false}
    />
  );
}

function renderHarness(values?: WeighingFormValues) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <Harness values={values} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

function pagedResponse(total: number) {
  return Promise.resolve({
    success: true,
    message: '',
    data: {
      items: total > 0 ? [{ uuid: 'animal-uuid-3', label: '3333' }] : [],
      pagination: {
        total,
        count: Math.min(total, 1),
        per_page: 1,
        current_page: 1,
        total_pages: total,
      },
    },
  });
}

function rowCount(): number {
  return document.querySelectorAll('[class*="singleValue"], [class*="placeholder"]').length;
}

beforeEach(() => {
  listAnimalOptionsMock.mockReset();
  toasterCreateMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('WeighingAnimalsSection — exclusão no servidor e aviso de esgotamento', () => {
  it('envia exclude_uuids com os animais das OUTRAS linhas ao abrir o select', async () => {
    listAnimalOptionsMock.mockImplementation(() => pagedResponse(1));
    renderHarness();

    const controls = document.querySelectorAll('[class*="-control"]');
    fireEvent.mouseDown(controls[0] as Element, { button: 0 });

    await waitFor(() => expect(listAnimalOptionsMock).toHaveBeenCalled());
    const call = listAnimalOptionsMock.mock.calls[0][0];
    expect(call.exclude_uuids).toEqual(['animal-uuid-2']);
    expect(call.batch_uuid).toBe('batch-uuid-1');
  });

  it('com todos os animais escolhidos: avisa e NÃO adiciona linha', async () => {
    listAnimalOptionsMock.mockImplementation(() => pagedResponse(0));
    renderHarness();
    const before = rowCount();

    fireEvent.click(screen.getByText('Adicionar animal'));

    await waitFor(() => expect(toasterCreateMock).toHaveBeenCalledTimes(1));
    expect(toasterCreateMock.mock.calls[0][0]).toMatchObject({
      type: 'warning',
      description: ALL_SELECTED_TEXT,
    });
    const check = listAnimalOptionsMock.mock.calls[0][0];
    expect(check).toMatchObject({
      page: 1,
      per_page: 1,
      batch_uuid: 'batch-uuid-1',
      exclude_uuids: ['animal-uuid-1', 'animal-uuid-2'],
    });
    expect(rowCount()).toBe(before);
  });

  it('com animais disponíveis: adiciona a linha e não avisa', async () => {
    listAnimalOptionsMock.mockImplementation(() => pagedResponse(5));
    renderHarness();
    const before = rowCount();

    fireEvent.click(screen.getByText('Adicionar animal'));

    await waitFor(() => expect(rowCount()).toBe(before + 1));
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });
});
