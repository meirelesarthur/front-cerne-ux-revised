// src/pages/Operacional/Pesagem/WeighingAnimalsSection.editReset.test.tsx
// -----------------------------------------------------------------------------
// BUG-PES-EDIT-01 (AF_REJECTED, execução 017 item 2/3 — dono ao vivo, "Editar
// Pesagem: seção Animais carrega vazia, sem dados salvos preenchidos").
//
// Mirror do racional de `SanitaryItemsSection.editReset.test.tsx`, adaptado à
// causa raiz REAL deste bug (que é a cascata de `batch_uuid`/`category_uuid`
// de `WeighingAnimalsSection`, não o "1ª linha vazia no mount" da seção
// sanitária). Reproduz a sequência REAL de `CreateOrUpdateWeighing.tsx` em
// modo editar:
//   1. `useForm` monta com `batch_uuid: null`/`animals: []` (defaultValues
//      reais da casca).
//   2. `WeighingAnimalsSection` (não-mockado) monta e captura
//      `cascadeKeyRef = null` (mount).
//   3. SÓ DEPOIS a query resolve e `fillForm` chama
//      `reset(mapWeighingDetailToFormValues(data))`, que muda
//      `batch_uuid`(null→real) E `animals` (hidratados) JUNTOS — isso é o que
//      disparava a cascata e apagava os animais.
//
// Cenário 1 (bug corrigido): hidratação de edição preserva os animais.
// Cenário 2 (anti-regressão): troca de lote/categoria pelo usuário DEPOIS da
// tela já carregada continua limpando a lista (comportamento original).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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

const HYDRATED_ANIMALS: WeighingFormValues['animals'] = [
  {
    row_uuid: 'row-uuid-1',
    animal_uuid: { label: '1234', value: 'animal-uuid-1' },
    weight: 320,
    last_weight: 300,
    last_weight_date: '2026-07-01',
    has_ultrasound: false,
    aol: null,
    egs: null,
    marm: null,
    classification: null,
  },
  {
    row_uuid: 'row-uuid-2',
    animal_uuid: { label: '5678', value: 'animal-uuid-2' },
    weight: 280,
    last_weight: 260,
    last_weight_date: '2026-07-01',
    has_ultrasound: false,
    aol: null,
    egs: null,
    marm: null,
    classification: null,
  },
];

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

// Harness mirror EXATO da sequência real de `CreateOrUpdateWeighing.tsx`
// (`fillForm`): monta com defaults reais, e só depois (`setTimeout`, mirror
// `useCustomFormQueryById` assíncrono real) seta a flag (synchronamente,
// exatamente como `fillForm` faz ANTES do `reset()`) e chama `reset(...)`
// com o payload hidratado real (batch_uuid + animals juntos).
function EditHarness({
  onControlReady,
}: {
  onControlReady?: (setValue: any, skipRef: MutableRefObject<boolean>) => void;
}) {
  const { control, setValue, reset } = useForm<WeighingFormValues>({
    defaultValues: defaultFormValues,
  });
  const skipNextAnimalsCascadeRef = useRef(false);

  useEffect(() => {
    if (onControlReady) onControlReady(setValue, skipNextAnimalsCascadeRef);
    const timer = setTimeout(() => {
      // Mirror EXATO `fillForm` corrigido: flag setada ANTES do reset.
      skipNextAnimalsCascadeRef.current = true;
      reset({
        ...defaultFormValues,
        batch_uuid: { label: 'Lote 700 animais', value: 'batch-uuid-1' },
        animals: HYDRATED_ANIMALS,
      });
    }, 10);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [reset]);

  return (
    <WeighingAnimalsSection
      control={control}
      setValue={setValue}
      languageGB={languageGBStub}
      isDisabled={false}
      skipNextCascadeRef={skipNextAnimalsCascadeRef}
    />
  );
}

function renderHarness(props?: {
  onControlReady?: (setValue: any, skipRef: MutableRefObject<boolean>) => void;
}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <EditHarness onControlReady={props?.onControlReady} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

// `SelectAsyncPaginate` (react-select) mantém um LOG `aria-live` acessório
// que ACUMULA anúncios antigos (não reflete só o valor atual) — usar esse
// texto para asserção seria falso-positivo/falso-negativo. O valor
// REALMENTE exibido ao usuário vive no nó `singleValue` (classe emotion
// termina em "-singleValue", estável entre builds porque vem do label
// interno do styled-component do `react-select`, não de um hash de
// conteúdo). Consulta escopada a esse nó para refletir só o que a TELA
// mostra.
function getVisibleAnimalSelectValues(): string[] {
  return Array.from(document.querySelectorAll('[class*="singleValue"]')).map(
    (el) => el.textContent ?? ''
  );
}

// Este arquivo de setup (`vitest.config.ts`) não habilita `test.globals`, e
// `@testing-library/react` só registra seu auto-cleanup quando detecta um
// `afterEach` global — sem isso, o DOM de um `it()` anterior (no mesmo
// describe) permanece montado e vaza para as asserções globais
// (`document.querySelectorAll`) do próximo teste. `SanitaryItemsSection.
// editReset.test.tsx` (mirror) nunca precisou disso por ter só 1 `it()`;
// este arquivo tem 2, então o cleanup explícito é obrigatório.
afterEach(() => {
  cleanup();
});

describe('WeighingAnimalsSection — BUG-PES-EDIT-01 (hidratação de edição vs. cascata de lote/categoria)', () => {
  it('cenário 1 — hidratação de edição (reset com batch_uuid+animals juntos) preserva os 2 animais, não fica vazio', async () => {
    renderHarness();

    await waitFor(
      () => {
        const values = getVisibleAnimalSelectValues();
        expect(values).toContain('1234');
        expect(values).toContain('5678');
      },
      { timeout: 3000 }
    );

    // "Nenhum animal adicionado." NÃO deve aparecer — a seção não está vazia.
    expect(screen.queryByText('Nenhum animal adicionado.')).toBeNull();
  });

  it('cenário 2 — troca de lote pelo usuário DEPOIS da tela carregada ainda limpa a lista (sem regressão)', async () => {
    let capturedSetValue: any;
    let capturedSkipRef: MutableRefObject<boolean> | undefined;
    renderHarness({
      onControlReady: (setValue, skipRef) => {
        capturedSetValue = setValue;
        capturedSkipRef = skipRef;
      },
    });

    // Espera a hidratação (cenário 1) terminar primeiro — E que a flag de
    // skip já tenha sido CONSUMIDA (`false`) pelo efeito de cascata do
    // filho, não só que o DOM já mostre o texto (evita corrida entre o
    // commit do `reset()` e o passive effect que consome a flag).
    await waitFor(
      () => {
        const values = getVisibleAnimalSelectValues();
        expect(values).toContain('1234');
        expect(values).toContain('5678');
        expect(capturedSkipRef?.current).toBe(false);
      },
      { timeout: 3000 }
    );

    // Simula o USUÁRIO trocando o lote manualmente (flag já foi consumida
    // pela hidratação do cenário 1 — este é um cascadeKey change REAL).
    act(() => {
      capturedSetValue(
        'batch_uuid',
        { label: 'Outro Lote', value: 'batch-uuid-2' },
        { shouldDirty: true }
      );
    });

    await waitFor(() => {
      // A cascata deve limpar para 1 linha vazia (EMPTY_ANIMAL_ROW) — o
      // valor VISÍVEL não deve mais conter os animais hidratados.
      const values = getVisibleAnimalSelectValues();
      expect(values).not.toContain('1234');
      expect(values).not.toContain('5678');
    });
  });
});
