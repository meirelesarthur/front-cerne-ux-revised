// Reprodução isolada do bug real (AF_REJECTED 2026-09-01, dono) em
// `CreateOrUpdateAbastecimento.tsx::onSubmit`: em edição, alterar a
// "Quantidade" de um item existente e clicar Salvar não disparava NENHUMA
// requisição (nenhum PUT /api/v1/supplies/...) — o formulário permanecia
// aberto, sem mensagem de erro. Comprovado reprodutível: salvar SEM editar
// quantidade funcionava (PUT 200); editar quantidade e salvar falhava
// silenciosamente. Causa raiz: o guard de "nada mudou → só sai sem salvar"
// usava `isEditing && isEmpty(dirtyFields)` (SEM `!`).
//
// `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM alguma chave
// própria (nome invertido do utilitário) — então o guard correto (mirror
// `CreateOrUpdateEstacaoDeMonta.tsx`, `CreateOrUpdateBullSeedSeason.tsx`,
// `CreateOrUpdateManutencao.tsx`) é `isEditing && !isEmpty(dirtyFields)`.
// Sem a negação, o guard disparava `return` (sem chamar a mutação) sempre
// que HAVIA alteração (dirtyFields não-vazio) — exatamente o inverso do
// pretendido — fazendo Salvar nunca chamar a API em NENHUMA edição real
// (ex.: campo "Quantidade" de um item de Abastecimento).
//
// Este teste isola o mecanismo real de `react-hook-form` (register de campo
// numérico simples, mesmo shape de `items.0.quantity` no form real) para
// provar:
// 1) `dirtyFields` do form fica corretamente marcado quando o usuário edita
//    "Quantidade" (a mudança é detectada normalmente pelo RHF, inclusive em
//    caminho aninhado de field array);
// 2) a guarda SEM `!` (bug) bloqueia o salvamento nesse cenário — reproduz
//    exatamente o sintoma relatado (nenhuma chamada, form permanece aberto,
//    sem toast de erro);
// 3) a guarda COM `!` (fix aplicado em produção) chama a mutação normalmente
//    quando há alteração real, e ainda assim pula o PUT (só `return`, SEM
//    navegar — comportamento preservado de `CreateOrUpdateAbastecimento.tsx`,
//    diferente do mirror `EstacaoDeMonta` que usa `navigate(-1)`) quando NADA
//    mudou.
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { isEmpty } from '@/utils/isEmpty';

interface FormShape {
  items: Array<{ equipment_uuid: string; quantity: number | null }>;
}

function setup(initial: FormShape) {
  return renderHook(() => {
    // `formState: { dirtyFields }` desestruturado DIRETO na assinatura —
    // mirror EXATO de `CreateOrUpdateAbastecimento.tsx`
    // (`formState: { errors, dirtyFields, isSubmitting }`).
    const {
      register,
      handleSubmit,
      formState: { dirtyFields },
    } = useForm<FormShape>({ mode: 'onChange', defaultValues: initial });
    return { register, handleSubmit, dirtyFields };
  });
}

const initialForm: FormShape = {
  items: [{ equipment_uuid: 'equip-1', quantity: 10 }],
};

describe('Abastecimento onSubmit dirty guard — reprodução do bug real (AF_REJECTED 2026-09-01)', () => {
  it('dirtyFields fica marcado quando "items.0.quantity" é editado (RHF detecta corretamente)', () => {
    const { result } = setup(initialForm);

    expect(isEmpty(result.current.dirtyFields)).toBe(false);

    act(() => {
      result.current.register('items.0.quantity').onChange({
        target: { name: 'items.0.quantity', value: 25 },
      } as any);
    });

    expect(isEmpty(result.current.dirtyFields)).toBe(true);
    expect(result.current.dirtyFields.items?.[0]?.quantity).toBeTruthy();
  });

  it('guarda SEM `!` (bug reportado) bloqueia o save mesmo com "Quantidade" alterada', async () => {
    const { result } = setup(initialForm);

    act(() => {
      result.current.register('items.0.quantity').onChange({
        target: { name: 'items.0.quantity', value: 25 },
      } as any);
    });

    let returnedWithoutSaving = false;
    let saveCalled = false;
    const isEditing = true;

    async function buggyOnSubmit() {
      if (isEditing && isEmpty(result.current.dirtyFields)) {
        returnedWithoutSaving = true;
        return;
      }
      saveCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(buggyOnSubmit)();
    });

    expect(returnedWithoutSaving).toBe(true);
    expect(saveCalled).toBe(false);
  });

  it('guarda COM `!` (fix aplicado) chama o save quando "Quantidade" foi alterada', async () => {
    const { result } = setup(initialForm);

    act(() => {
      result.current.register('items.0.quantity').onChange({
        target: { name: 'items.0.quantity', value: 25 },
      } as any);
    });

    let returnedWithoutSaving = false;
    let saveCalled = false;
    const isEditing = true;

    async function fixedOnSubmit() {
      if (isEditing && !isEmpty(result.current.dirtyFields)) {
        returnedWithoutSaving = true;
        return;
      }
      saveCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(returnedWithoutSaving).toBe(false);
    expect(saveCalled).toBe(true);
  });

  it('guarda COM `!` (fix) ainda sai sem salvar (sem navegar) quando NADA mudou', async () => {
    const { result } = setup(initialForm);

    let returnedWithoutSaving = false;
    let saveCalled = false;
    const isEditing = true;

    async function fixedOnSubmit() {
      if (isEditing && !isEmpty(result.current.dirtyFields)) {
        returnedWithoutSaving = true;
        return;
      }
      saveCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(returnedWithoutSaving).toBe(true);
    expect(saveCalled).toBe(false);
  });
});
