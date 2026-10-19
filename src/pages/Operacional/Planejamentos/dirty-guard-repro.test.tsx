// Reprodução isolada do bug real (teste manual do dono, GAP-PLAN-FE-03 item
// 6) em `CreateOrUpdatePlanning.tsx::onSubmit`: em edição, o guard de "nada
// mudou → só navega" usava `isEditing && isEmpty(dirtyFields)` (SEM `!`).
//
// `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM alguma chave
// própria (nome invertido do utilitário) — então o guard correto (mirror
// `CreateOrUpdateEstacaoDeMonta.tsx`, `CreateOrUpdateCentroCusto.tsx`, etc.)
// é `isEditing && !isEmpty(dirtyFields)`. Sem a negação, o guard disparava
// `navigate(PLANNINGS_LIST_ROUTE)` sempre que HAVIA alteração (`dirtyFields`
// não-vazio) — exatamente o inverso do pretendido — fazendo "Salvar" NUNCA
// chamar `planningMutation.mutateAsync` em NENHUMA edição de Planning. Isso
// reproduz exatamente o sintoma relatado pelo dono: "editar um Planning
// existente e salvar não persiste nada, só volta para a página inicial."
//
// Mesma classe de defeito já catalogada e corrigida uma vez em
// `CreateOrUpdateBullSeedSeason.tsx` (ver o
// `dirty-guard-repro.test.tsx` daquela pasta — mesmo mecanismo, mirror aqui
// para o form raiz de Planning, que não usa `useFieldArray`).
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { isEmpty } from '@/utils/isEmpty';

interface PlanningFormShape {
  planted_area: number | null;
  commercial_dollar: number | null;
}

// Mirror do `useForm<PlanningFormType>` real de `CreateOrUpdatePlanning.tsx`
// (`formState: { dirtyFields }` desestruturado direto na assinatura, mesmo
// padrão de leitura preguiçosa do Proxy do RHF exercitado no primeiro
// render).
function setup(initial: PlanningFormShape) {
  return renderHook(() => {
    const {
      control,
      handleSubmit,
      setValue,
      formState: { dirtyFields },
    } = useForm<PlanningFormShape>({
      defaultValues: initial,
    });
    return { control, handleSubmit, setValue, dirtyFields };
  });
}

describe('CreateOrUpdatePlanning onSubmit dirty guard — reprodução do bug real (GAP-PLAN-FE-03 item 6)', () => {
  it('dirtyFields fica marcado quando um campo simples do form raiz muda', () => {
    const { result } = setup({ planted_area: 10, commercial_dollar: 5 });

    expect(isEmpty(result.current.dirtyFields)).toBe(false);

    act(() => {
      result.current.setValue('planted_area', 20, { shouldDirty: true });
    });

    expect(isEmpty(result.current.dirtyFields)).toBe(true);
    expect(result.current.dirtyFields.planted_area).toBeTruthy();
  });

  it('guarda SEM `!` (bug real do arquivo antes da correção) bloqueia o save mesmo com campo alterado', async () => {
    const { result } = setup({ planted_area: 10, commercial_dollar: 5 });

    act(() => {
      result.current.setValue('planted_area', 20, { shouldDirty: true });
    });

    let navigatedToIndex = false;
    let mutationCalled = false;
    const isEditing = true;

    async function buggyOnSubmit() {
      // Fórmula SEM a negação — a que causava o bug relatado pelo dono.
      if (isEditing && isEmpty(result.current.dirtyFields)) {
        navigatedToIndex = true;
        return;
      }
      mutationCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(buggyOnSubmit)();
    });

    expect(navigatedToIndex).toBe(true);
    expect(mutationCalled).toBe(false);
  });

  it('guarda COM `!` (fix aplicado em `CreateOrUpdatePlanning.tsx`) chama a mutação quando o campo mudou', async () => {
    const { result } = setup({ planted_area: 10, commercial_dollar: 5 });

    act(() => {
      result.current.setValue('planted_area', 20, { shouldDirty: true });
    });

    let navigatedToIndex = false;
    let mutationCalled = false;
    const isEditing = true;

    async function fixedOnSubmit() {
      // Fórmula COM a negação — mirror exato do fix aplicado no arquivo real.
      if (isEditing && !isEmpty(result.current.dirtyFields)) {
        navigatedToIndex = true;
        return;
      }
      mutationCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(navigatedToIndex).toBe(false);
    expect(mutationCalled).toBe(true);
  });

  it('guarda COM `!` (fix) ainda navega de volta sem salvar quando NADA mudou', async () => {
    const { result } = setup({ planted_area: 10, commercial_dollar: 5 });

    let navigatedToIndex = false;
    let mutationCalled = false;
    const isEditing = true;

    async function fixedOnSubmit() {
      if (isEditing && !isEmpty(result.current.dirtyFields)) {
        navigatedToIndex = true;
        return;
      }
      mutationCalled = true;
    }

    await act(async () => {
      await result.current.handleSubmit(fixedOnSubmit)();
    });

    expect(navigatedToIndex).toBe(true);
    expect(mutationCalled).toBe(false);
  });
});
