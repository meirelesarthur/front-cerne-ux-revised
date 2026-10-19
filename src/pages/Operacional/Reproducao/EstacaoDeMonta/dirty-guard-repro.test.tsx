// Reprodução isolada do bug real (relato do dono, confirmado em local E
// homologação) em `CreateOrUpdateEstacaoDeMonta.tsx::onSubmit`: em edição, o
// botão "Salvar" não disparava NENHUMA requisição — só voltava para a lista,
// sem mensagem alguma. Causa raiz: o guard de "nada mudou → só navega" usava
// `isEditing && isEmpty(dirtyFields)` (SEM `!`).
//
// `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM alguma chave
// própria (nome invertido do utilitário) — então o guard correto (mirror
// `CreateOrUpdateBullSeedSeason.tsx`, `CreateOrUpdateEstagioReprodutivo.tsx`,
// `useProductFormController.ts`) é `isEditing && !isEmpty(dirtyFields)`. Sem
// a negação, o guard disparava `navigate(-1)` sempre que HAVIA alteração
// (dirtyFields não-vazio) — exatamente o inverso do pretendido — fazendo
// Salvar nunca chamar a API em NENHUMA edição real (ex.: campo "Descrição").
//
// Este teste isola o mecanismo real de `react-hook-form` (register de campo
// texto simples, mesmo shape de `description` no form real) para provar:
// 1) `dirtyFields` do form fica corretamente marcado quando o usuário edita
//    "Descrição" (a mudança é detectada normalmente pelo RHF);
// 2) a guarda SEM `!` (bug) bloqueia o salvamento nesse cenário — reproduz
//    exatamente o sintoma relatado (nenhuma chamada, sem toast);
// 3) a guarda COM `!` (fix aplicado em produção) chama a mutação normalmente
//    quando há alteração real, e ainda assim pula o PUT quando NADA mudou.
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { isEmpty } from '@/utils/isEmpty';

interface FormShape {
  code: string;
  description: string;
}

function setup(initial: FormShape) {
  return renderHook(() => {
    // `formState: { dirtyFields }` desestruturado DIRETO na assinatura —
    // mirror EXATO de `CreateOrUpdateEstacaoDeMonta.tsx`
    // (`formState: { errors, dirtyFields }`).
    const {
      register,
      handleSubmit,
      formState: { dirtyFields },
    } = useForm<FormShape>({ defaultValues: initial });
    return { register, handleSubmit, dirtyFields };
  });
}

describe('EstacaoDeMonta onSubmit dirty guard — reprodução do bug real (relato do dono)', () => {
  it('dirtyFields fica marcado quando "description" é editado (RHF detecta corretamente)', () => {
    const { result } = setup({ code: 'EM-001', description: 'original' });

    expect(isEmpty(result.current.dirtyFields)).toBe(false);

    act(() => {
      result.current.register('description').onChange({
        target: { name: 'description', value: 'alterada' },
      } as any);
    });

    expect(isEmpty(result.current.dirtyFields)).toBe(true);
    expect(result.current.dirtyFields.description).toBeTruthy();
  });

  it('guarda SEM `!` (bug reportado) bloqueia o save mesmo com "Descrição" alterada', async () => {
    const { result } = setup({ code: 'EM-001', description: 'original' });

    act(() => {
      result.current.register('description').onChange({
        target: { name: 'description', value: 'alterada' },
      } as any);
    });

    let navigatedBack = false;
    let saveCalled = false;
    const isEditing = true;

    async function buggyOnSubmit() {
      if (isEditing && isEmpty(result.current.dirtyFields)) {
        navigatedBack = true;
        return;
      }
      saveCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(buggyOnSubmit)();
    });

    expect(navigatedBack).toBe(true);
    expect(saveCalled).toBe(false);
  });

  it('guarda COM `!` (fix aplicado) chama o save quando "Descrição" foi alterada', async () => {
    const { result } = setup({ code: 'EM-001', description: 'original' });

    act(() => {
      result.current.register('description').onChange({
        target: { name: 'description', value: 'alterada' },
      } as any);
    });

    let navigatedBack = false;
    let saveCalled = false;
    const isEditing = true;

    async function fixedOnSubmit() {
      if (isEditing && !isEmpty(result.current.dirtyFields)) {
        navigatedBack = true;
        return;
      }
      saveCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(navigatedBack).toBe(false);
    expect(saveCalled).toBe(true);
  });

  it('guarda COM `!` (fix) ainda navega de volta sem salvar quando NADA mudou', async () => {
    const { result } = setup({ code: 'EM-001', description: 'original' });

    let navigatedBack = false;
    let saveCalled = false;
    const isEditing = true;

    async function fixedOnSubmit() {
      if (isEditing && !isEmpty(result.current.dirtyFields)) {
        navigatedBack = true;
        return;
      }
      saveCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(navigatedBack).toBe(true);
    expect(saveCalled).toBe(false);
  });
});
