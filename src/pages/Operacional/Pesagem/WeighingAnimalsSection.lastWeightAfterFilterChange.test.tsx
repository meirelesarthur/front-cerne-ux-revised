// src/pages/Operacional/Pesagem/WeighingAnimalsSection.lastWeightAfterFilterChange.test.tsx
// -----------------------------------------------------------------------------
// "Último Peso" / "Data Últ. Pesagem" da linha de animal da Pesagem
// (TASK-PES-PAS-FE, decisão do dono 2026-10-08; legado
// `weighings/_card-item.blade.php:22,25` + `_forms.blade.php:941-1000`):
//   - SOMENTE LEITURA (nunca digitados) — substitui os testes antigos, que
//     digitavam nos campos (a investigação "campo trava" deixou de existir:
//     o campo não aceita digitação);
//   - preenchidos ao selecionar o animal, a partir da opção
//     (`with_last_weighing=true`); trocar o animal substitui; limpar esvazia;
//   - animal S/ID (opção com `null` nos dois campos): campos, Ganho e GMD
//     vazios e sem obrigatoriedade (schema) — payload `0` + data da pesagem;
//   - EDIÇÃO: mostra o valor GRAVADO e só recalcula se o animal for trocado;
//   - linha nova nasce vazia, sem herdar os valores da anterior.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { weighingSchema } from '@/validations/schemas/Weighing/weighing-schema';

import type { WeighingFormValues } from '@/@types/v2/Weighing';

import { mapFormValuesToSaveRequest } from './weighing-form-mapper';
import { WeighingAnimalsSection } from './WeighingAnimalsSection';

const { listAnimalOptionsMock } = vi.hoisted(() => ({ listAnimalOptionsMock: vi.fn() }));

vi.mock('@/services/v2/Animals/animal-service', () => ({
  listAnimalOptions: listAnimalOptionsMock,
}));

vi.mock('@/services/v2/Weighing/weighing-service', () => ({
  checkWeighingDate: vi.fn(() => Promise.resolve({ data: { valid: true } })),
}));

// Opções cruas como a API devolve com `with_last_weighing=true`; o mock do
// Select aplica o `mapOptions` REAL da linha (cobre o mapeamento).
const WEIGHED = {
  uuid: 'animal-a',
  label: '1111',
  last_weight: 450.5,
  last_weight_date: '2026-07-01',
};
const OTHER = { uuid: 'animal-b', label: '2222', last_weight: 380, last_weight_date: '2026-06-15' };
const SEM_ID = { uuid: 'animal-c', label: 'S/ID', last_weight: null, last_weight_date: null };

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => {
    const raws: Record<string, unknown> = {
      weighed: WEIGHED,
      other: OTHER,
      semid: SEM_ID,
    };
    return (
      <div>
        {Object.entries(raws).map(([key, raw]) => (
          <button
            key={key}
            type="button"
            data-testid={`pick-${key}-${props.name}`}
            onClick={() => props.onChange(props.mapOptions(raw))}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          data-testid={`clear-${props.name}`}
          onClick={() => props.onChange(null)}
        >
          clear
        </button>
        <button
          type="button"
          data-testid={`load-${props.name}`}
          onClick={() => {
            void props.service({ page: 1 });
          }}
        >
          load
        </button>
      </div>
    );
  },
}));

const languageGB = languagePtBr.BR;

function emptyRow(): WeighingFormValues['animals'][number] {
  return {
    animal_uuid: null,
    weight: 500,
    last_weight: '',
    last_weight_date: null,
    has_ultrasound: false,
    aol: null,
    egs: null,
    marm: null,
    classification: null,
  };
}

function Harness({ animals }: { animals: WeighingFormValues['animals'] }) {
  const { control, setValue } = useForm<WeighingFormValues>({
    defaultValues: {
      date: '2026-07-31',
      batch_uuid: null,
      category_uuid: null,
      is_stock: false,
      arroba_value: '',
      animals,
      sanitary: false,
      sanitary_items: [],
    },
  });
  return <WeighingAnimalsSection control={control} setValue={setValue} languageGB={languageGB} />;
}

function renderSection(animals: WeighingFormValues['animals'] = [emptyRow()]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <Harness animals={animals} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const pick = (key: string) =>
  fireEvent.click(screen.getByTestId(`pick-${key}-animals.0.animal_uuid`));

beforeEach(() => {
  listAnimalOptionsMock.mockReset();
  listAnimalOptionsMock.mockResolvedValue({
    success: true,
    message: '',
    data: {
      items: [],
      pagination: { total: 0, count: 0, per_page: 10, current_page: 1, total_pages: 1 },
    },
  });
});

afterEach(() => {
  cleanup();
});

describe('Pesagem — Último Peso / Data Últ. Pesagem somente leitura, vindos da opção do animal', () => {
  it('o select de animal pede with_last_weighing=true', async () => {
    renderSection();
    await act(async () => {
      fireEvent.click(screen.getByTestId('load-animals.0.animal_uuid'));
    });
    expect(listAnimalOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ with_last_weighing: true })
    );
  });

  it('nasce vazio e SEM input editável (readonly): não existe campo digitável para os 2 valores', () => {
    renderSection();
    expect(document.querySelectorAll('input[name$=".last_weight"]')).toHaveLength(0);
    expect(document.querySelectorAll('input[name$=".last_weight_date"]')).toHaveLength(0);
    expect(screen.getByText(languageGB.weighing.weighing.form.fields.lastWeight)).toBeTruthy();
    expect(screen.queryByText('450,50')).toBeNull();
  });

  it('preenche ao selecionar o animal e calcula Ganho a partir do valor preenchido', () => {
    renderSection();
    pick('weighed');
    expect(screen.getByText('450,50')).toBeTruthy();
    expect(screen.getByText('01/07/2026')).toBeTruthy();
    // peso 500 - último 450,5
    expect(screen.getByText('49,50')).toBeTruthy();
  });

  it('trocar o animal SUBSTITUI os valores', () => {
    renderSection();
    pick('weighed');
    pick('other');
    expect(screen.queryByText('450,50')).toBeNull();
    expect(screen.getByText('380,00')).toBeTruthy();
    expect(screen.getByText('15/06/2026')).toBeTruthy();
  });

  it('limpar o animal ESVAZIA os valores', () => {
    renderSection();
    pick('weighed');
    fireEvent.click(screen.getByTestId('clear-animals.0.animal_uuid'));
    expect(screen.queryByText('450,50')).toBeNull();
    expect(screen.queryByText('01/07/2026')).toBeNull();
  });

  it('animal S/ID: Último Peso, Data, Ganho e GMD ficam vazios (inclusive ao vir de um animal pesado)', () => {
    renderSection();
    pick('weighed');
    pick('semid');
    expect(screen.queryByText('450,50')).toBeNull();
    expect(screen.queryByText('01/07/2026')).toBeNull();
    // Ganho e GMD sem valor (traço de vazio do componente).
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('EDIÇÃO: mostra o valor GRAVADO e não recalcula; só trocar o animal substitui', () => {
    renderSection([
      {
        ...emptyRow(),
        row_uuid: 'row-1',
        animal_uuid: { label: '1111', value: 'animal-a' },
        last_weight: 300,
        last_weight_date: '2026-05-10',
      },
    ]);
    expect(screen.getByText('300,00')).toBeTruthy();
    expect(screen.getByText('10/05/2026')).toBeTruthy();
    expect(listAnimalOptionsMock).not.toHaveBeenCalled();

    pick('other');
    expect(screen.queryByText('300,00')).toBeNull();
    expect(screen.getByText('380,00')).toBeTruthy();
  });

  it('adicionar animal cria linha vazia sem herdar os valores da linha anterior', async () => {
    renderSection();
    pick('weighed');
    fireEvent.click(screen.getByText(languageGB.weighing.weighing.form.addAnimal));
    await waitFor(() =>
      expect(screen.getAllByTestId(/^pick-weighed-animals\.\d\.animal_uuid$/)).toHaveLength(2)
    );
    // só a linha 0 tem valores; a nova nasce vazia
    expect(screen.getAllByText('450,50')).toHaveLength(1);
  });
});

describe('Pesagem — S/ID sem obrigatoriedade (schema) e payload', () => {
  const rowBase = {
    weight: 500,
    has_ultrasound: false,
    aol: null,
    egs: null,
    marm: null,
    classification: null,
  };

  it('schema: S/ID NÃO exige último peso/data; animal comum exige', async () => {
    const schema = weighingSchema(languageGB);
    const semId = {
      animals: [
        {
          ...rowBase,
          animal_uuid: { label: 'S/ID', value: 'x' },
          last_weight: '',
          last_weight_date: null,
        },
      ],
    };
    await expect(schema.validateAt('animals[0].last_weight', semId)).resolves.toBeUndefined();
    await expect(schema.validateAt('animals[0].last_weight_date', semId)).resolves.toBeNull();

    const common = {
      animals: [
        {
          ...rowBase,
          animal_uuid: { label: '1111', value: 'y' },
          last_weight: '',
          last_weight_date: null,
        },
      ],
    };
    await expect(schema.validateAt('animals[0].last_weight', common)).rejects.toThrow();
    await expect(schema.validateAt('animals[0].last_weight_date', common)).rejects.toThrow();
  });

  it('payload: S/ID vazio OMITE last_weight e last_weight_date (a API grava 0 + hoje); animal comum envia o valor da linha', () => {
    const payload = mapFormValuesToSaveRequest({
      date: '2026-07-31',
      batch_uuid: { label: 'L', value: 'batch-1' },
      category_uuid: null,
      is_stock: false,
      arroba_value: '',
      animals: [
        {
          ...rowBase,
          animal_uuid: { label: 'S/ID', value: 'x' },
          last_weight: '',
          last_weight_date: null,
        },
        {
          ...rowBase,
          animal_uuid: { label: '1111', value: 'y' },
          last_weight: 450.5,
          last_weight_date: '2026-07-01',
        },
      ],
      sanitary: false,
      sanitary_items: [],
    } as unknown as WeighingFormValues);

    expect(payload.animals[0]).not.toHaveProperty('last_weight');
    expect(payload.animals[0]).not.toHaveProperty('last_weight_date');
    expect(payload.animals[1]).toMatchObject({
      last_weight: 450.5,
      last_weight_date: '2026-07-01',
    });
  });
});
