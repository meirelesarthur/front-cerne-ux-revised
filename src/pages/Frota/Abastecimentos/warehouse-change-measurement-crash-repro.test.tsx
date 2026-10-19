// Reprodução isolada do bug real reportado pelo dono via teste manual
// (Esteira 017, item 1, pós-fix do guard de dirty do commit anterior):
//
// > "Abastecimentos agora atualiza os campos, porém em alguns casos quando
// > seleciono um armazém específico, recebo um erro: Abastecimento / Sem
// > resposta do servidor (erro de rede) — mas nenhuma requisição é enviada
// > para o back."
//
// Causa raiz confirmada (evidência abaixo): `tryPersistSupply`
// (`CreateOrUpdateAbastecimento.tsx`) montava o payload com
// `measurement_uuid: item.measurement_uuid!.value` — non-null assertion SEM
// guarda real. `measurement_uuid` fica `null` sempre que o usuário troca o
// Armazém de uma linha (`SupplyItemRow.tsx`, onChange do Controller
// `warehouse_uuid` chama `setValue(items.${index}.stock_uuid, null)` +
// `setValue(items.${index}.measurement_uuid, null)` — gate de sequência
// documentado no próprio componente) — se o form for submetido ANTES do
// usuário re-selecionar Produto/Estoque (ex.: armazém sem estoque
// disponível para escolher, ou o usuário simplesmente esquece), o acesso
// `item.measurement_uuid!.value` lança um `TypeError` client-side, SÍNCRONO,
// ANTES de qualquer `await updateSupply/createSupply` — ou seja, ANTES de
// qualquer requisição de rede sair.
//
// Esse `TypeError` não é um `AxiosError` (não tem `.response`), então
// `getBusinessMutationErrorMessage` (`src/utils/extractApiErrorMessage.ts`,
// branch `!isAxiosError(error) || !error.response`) devolve
// `languageGB.common.errorLog.networkError` — EXATAMENTE a string
// "Sem resposta do servidor (erro de rede)" relatada pelo dono — com o
// título do toast = `entityName` ("Abastecimento", `useRequest.tsx` linha
// `title: entityName`). Isso prova o mecanismo completo: erro 100%
// client-side, disfarçado de falha de rede, zero requisição disparada.
//
// Este teste isola (mirror do padrão já usado em
// `dirty-guard-repro.test.tsx`) o mecanismo real de `react-hook-form` (mesmo
// shape aninhado `items.0.measurement_uuid`) para provar:
// 1) o payload builder BUGADO (`!.value` sem guarda) lança o `TypeError`
//    exato quando `measurement_uuid` é `null` — reproduz o crash;
// 2) esse `TypeError`, passado por `getBusinessMutationErrorMessage` (a
//    MESMA função usada pelo `useRequest.tsx` de produção), produz a MESMA
//    mensagem que o dono viu — prova que a causa raiz explica o sintoma
//    reportado, não é só uma suposição;
// 3) a validação do FIX aplicado em `CreateOrUpdateAbastecimento.tsx::onSubmit`
//    detecta a linha incompleta e IMPEDE que o payload builder (e, portanto,
//    qualquer chamada de mutação/rede) seja sequer chamado — nenhum throw,
//    nenhuma requisição, erro sinalizado no campo em vez de toast fantasma.

import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { getBusinessMutationErrorMessage } from '@/utils/extractApiErrorMessage';

import { LanguageDate } from '@/@types/language';

interface ItemShape {
  equipment_uuid: { value: string; label: string } | null;
  warehouse_uuid: { value: string; label: string } | null;
  stock_uuid: { value: string; label: string } | null;
  measurement_uuid: { value: string; label: string } | null;
}

interface FormShape {
  items: ItemShape[];
}

// Mock mínimo de languageGB — mesma técnica de `extractApiErrorMessage.test.ts`
// (a função só acessa `common.errorLog`).
const languageGBMock = {
  common: {
    errorLog: {
      networkError: 'Sem resposta do servidor (erro de rede)',
      unknownError: 'Ocorreu um erro desconhecido',
      byStatus: {
        forbidden: 'Você não tem permissão para executar esta ação.',
        notFound: 'Registro não encontrado.',
        conflict: 'Conflito.',
        server: 'Erro interno.',
      },
    },
  },
} as unknown as LanguageDate;

function setup(initial: FormShape) {
  return renderHook(() => {
    const {
      control,
      handleSubmit,
      setValue,
      setError,
      formState: { errors },
    } = useForm<FormShape>({ mode: 'onChange', defaultValues: initial });
    return { control, handleSubmit, setValue, setError, errors };
  });
}

// Item já com Equipamento escolhido e Armazém RECÉM-trocado (mirror EXATO do
// `onChange` do Controller `warehouse_uuid` em `SupplyItemRow.tsx`, que zera
// `stock_uuid`/`measurement_uuid` da mesma linha) — usuário ainda NÃO
// re-selecionou Produto/Estoque.
const itemAfterWarehouseChange: ItemShape = {
  equipment_uuid: { value: 'equip-1', label: 'Trator 01' },
  warehouse_uuid: { value: 'wh-specific', label: 'Armazém Específico' },
  stock_uuid: null,
  measurement_uuid: null,
};

const initialForm: FormShape = {
  items: [itemAfterWarehouseChange],
};

// Mirror EXATO da linha bugada de produção (`CreateOrUpdateAbastecimento.tsx`
// `tryPersistSupply`, antes do fix): `measurement_uuid!.value` sem guarda.
function buggyBuildPayload(items: ItemShape[]) {
  return {
    items: items
      .filter((item) => item.equipment_uuid)
      .map((item) => ({
        equipment_uuid: item.equipment_uuid!.value,
        warehouse_uuid: item.warehouse_uuid?.value ?? undefined,
        stock_uuid: item.stock_uuid?.value || undefined,
        // BUG: sem `?.`/guarda — `measurement_uuid` pode ser `null` aqui.
        measurement_uuid: item.measurement_uuid!.value,
      })),
  };
}

// Mirror EXATO da validação do FIX (`onSubmit`, `CreateOrUpdateAbastecimento.tsx`):
// bloqueia ANTES de montar o payload.
function findIncompleteItemIndex(items: ItemShape[]): number {
  return items.findIndex((item) => item.equipment_uuid && !item.measurement_uuid);
}

describe('Abastecimentos — crash "erro de rede" fantasma ao trocar Armazém sem re-selecionar Produto (Esteira 017)', () => {
  it('CAUSA RAIZ: payload builder bugado lança TypeError síncrono (não-Axios) quando measurement_uuid é null', () => {
    expect(() => buggyBuildPayload(initialForm.items)).toThrow(TypeError);
    expect(() => buggyBuildPayload(initialForm.items)).toThrow(
      /Cannot read propert(y|ies) of null/
    );
  });

  it('CAUSA RAIZ: o TypeError do payload builder NÃO é AxiosError — nenhuma requisição de rede é responsável', () => {
    let captured: unknown;
    try {
      buggyBuildPayload(initialForm.items);
    } catch (error) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(TypeError);
    expect((captured as any).isAxiosError).toBeUndefined();
    expect((captured as any).response).toBeUndefined();
  });

  it('PROVA O SINTOMA: o mesmo TypeError, passado pela função de produção `getBusinessMutationErrorMessage`, gera a MESMA mensagem relatada pelo dono ("Sem resposta do servidor (erro de rede)")', () => {
    let captured: unknown;
    try {
      buggyBuildPayload(initialForm.items);
    } catch (error) {
      captured = error;
    }
    const message = getBusinessMutationErrorMessage(captured, languageGBMock);
    expect(message).toBe('Sem resposta do servidor (erro de rede)');
    expect(message).toBe(languageGBMock.common.errorLog.networkError);
  });

  it('FIX: validação client-side detecta a linha incompleta e bloqueia o submit ANTES do payload builder ser chamado (zero throw, zero requisição)', async () => {
    const { result } = setup(initialForm);

    const buildPayloadSpy = vi.fn(buggyBuildPayload);
    const mutateAsyncSpy = vi.fn();
    let itemsErrorSet: string | null = null;

    async function fixedOnSubmit(data: FormShape) {
      const incompleteItemIndex = findIncompleteItemIndex(data.items);
      if (incompleteItemIndex !== -1) {
        itemsErrorSet = 'Revise os campos destacados.';
        result.current.setError(`items.${incompleteItemIndex}.measurement_uuid`, {
          type: 'manual',
          message: itemsErrorSet,
        });
        return;
      }
      buildPayloadSpy(data.items);
      mutateAsyncSpy(data);
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    // A validação barrou o fluxo — o payload builder bugado NUNCA foi chamado,
    // logo nenhum throw ocorreu e nenhuma mutação/requisição foi disparada.
    expect(buildPayloadSpy).not.toHaveBeenCalled();
    expect(mutateAsyncSpy).not.toHaveBeenCalled();
    expect(itemsErrorSet).toBe('Revise os campos destacados.');
    expect(result.current.errors.items?.[0]?.measurement_uuid?.message).toBe(
      'Revise os campos destacados.'
    );
  });

  it('FIX: quando a linha ESTÁ completa (measurement_uuid presente), o submit segue normalmente e chama a mutação', async () => {
    const completeForm: FormShape = {
      items: [
        {
          ...itemAfterWarehouseChange,
          stock_uuid: { value: 'stock-1', label: 'Produto X' },
          measurement_uuid: { value: 'um-1', label: 'Litro' },
        },
      ],
    };
    const { result } = setup(completeForm);

    const buildPayloadSpy = vi.fn(buggyBuildPayload);
    const mutateAsyncSpy = vi.fn();

    async function fixedOnSubmit(data: FormShape) {
      const incompleteItemIndex = findIncompleteItemIndex(data.items);
      if (incompleteItemIndex !== -1) {
        result.current.setError(`items.${incompleteItemIndex}.measurement_uuid`, {
          type: 'manual',
          message: 'Revise os campos destacados.',
        });
        return;
      }
      buildPayloadSpy(data.items);
      mutateAsyncSpy(data);
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(buildPayloadSpy).toHaveBeenCalledTimes(1);
    expect(mutateAsyncSpy).toHaveBeenCalledTimes(1);
  });
});
