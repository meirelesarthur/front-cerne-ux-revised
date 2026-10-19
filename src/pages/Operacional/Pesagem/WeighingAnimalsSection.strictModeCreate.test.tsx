// src/pages/Operacional/Pesagem/WeighingAnimalsSection.strictModeCreate.test.tsx
// -----------------------------------------------------------------------------
// BUG-PES-CREATE-01 (dono ao vivo, print anexado — "Nova Pesagem" abre com 2
// linhas vazias de animal em vez de 1).
//
// Causa raiz confirmada por reprodução real: o `useEffect` que garante
// "mínimo 1 linha" (`fields.length === 0` → `append`) é invocado 2x seguidas
// por `React.StrictMode` (ativo em `main.tsx`) na montagem, ANTES de
// `fields.length` (estado interno do `useFieldArray`, não `useState`)
// refletir o `append` da 1ª invocação — a 2ª invocação ainda vê
// `fields.length === 0` e dispara um 2º `append`, deixando 2 linhas.
//
// Cenário 1 (bug corrigido): montar em modo criação sob `React.StrictMode`
// real mostra exatamente 1 linha.
// Cenário 2 (anti-regressão): "Adicionar animal" continua funcionando
// normalmente (2 linhas após 1 clique).
// -----------------------------------------------------------------------------

import React from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { LanguageDate } from '@/@types/language';
import type { WeighingFormValues } from '@/@types/v2/Weighing';

import { WeighingAnimalsSection } from './WeighingAnimalsSection';

vi.mock('@/services/v2/Animals/animal-service', () => ({
  listAnimalOptions: vi.fn(() =>
    Promise.resolve({
      success: true,
      message: '',
      data: { items: [], meta: null },
      errors: null,
      meta: null,
    })
  ),
}));

vi.mock('@/services/v2/Weighing/weighing-service', () => ({
  checkWeighingDate: vi.fn(),
}));

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
      },
    },
  },
} as unknown as LanguageDate;

const defaultFormValues: WeighingFormValues = {
  date: null,
  batch_uuid: null,
  category_uuid: null,
  is_stock: false,
  arroba_value: '',
  animals: [],
  sanitary: false,
  sanitary_items: [],
};

// Harness mirror do modo CRIAÇÃO real de `CreateOrUpdateWeighing.tsx`: form
// monta direto com `animals: []` (sem `reset` assíncrono de hidratação, ao
// contrário do harness de edição em `WeighingAnimalsSection.editReset.test.tsx`).
function CreateHarness() {
  const { control, setValue } = useForm<WeighingFormValues>({
    defaultValues: defaultFormValues,
  });

  return (
    <WeighingAnimalsSection
      control={control}
      setValue={setValue}
      languageGB={languageGBStub}
      isDisabled={false}
    />
  );
}

function renderHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // `React.StrictMode` real (mirror `main.tsx`) — é o que reproduz o bug:
  // sem ele, o efeito só roda 1x e o teste seria um falso-negativo.
  return render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <CreateHarness />
        </ChakraProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

afterEach(() => {
  cleanup();
});

describe('WeighingAnimalsSection — BUG-PES-CREATE-01 (2 linhas vazias no modo criação sob StrictMode)', () => {
  it('cenário 1 — "Nova Pesagem" (criação) sob React.StrictMode mostra exatamente 1 linha vazia', () => {
    renderHarness();

    expect(screen.getAllByText('Selecione o animal')).toHaveLength(1);
    expect(screen.getAllByText('Remover animal')).toHaveLength(1);
  });

  it('cenário 2 — "Adicionar animal" continua funcionando (1 clique → 2 linhas)', () => {
    renderHarness();

    expect(screen.getAllByText('Selecione o animal')).toHaveLength(1);

    fireEvent.click(screen.getByText('Adicionar animal'));

    expect(screen.getAllByText('Selecione o animal')).toHaveLength(2);
  });
});
