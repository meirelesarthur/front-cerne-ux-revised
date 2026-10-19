// Reprodução isolada do bug real (mesmo padrão AF_REJECTED 2026-09-01,
// Abastecimentos — ver `src/pages/Frota/Abastecimentos/dirty-guard-repro.test.tsx`)
// em `CreateOrUpdateFeedlotSector.tsx::onSubmit`: em edição, alterar um campo
// (ex.: "Largura") e clicar Salvar não disparava NENHUMA requisição (nenhum
// PATCH /api/v1/feedlot-sectors/...) — o formulário só navegava de volta
// (`navigate(-1)`), sem chamar `mutateAsync`. Causa raiz: o guard de "nada
// mudou → só sai sem salvar" usava `isEditing && isEmpty(dirtyFields)` (SEM
// `!`).
//
// `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM alguma chave
// própria (nome invertido do utilitário) — então o guard correto (mirror
// `CreateOrUpdateFeedlotYard.tsx`, `CreateOrUpdateEstacaoDeMonta.tsx`,
// `CreateOrUpdateBullSeedSeason.tsx`) é `isEditing && !isEmpty(dirtyFields)`.
// Sem a negação, o guard disparava `navigate(-1)` (sem chamar a mutação)
// sempre que HAVIA alteração (dirtyFields não-vazio) — exatamente o inverso
// do pretendido — fazendo Salvar nunca persistir NENHUMA edição real de
// Setor (ex.: campo "Largura"/"Comprimento"/"Nome").
//
// Este teste isola o mecanismo real de `react-hook-form` (register de campo
// simples, mesmo shape de `width` no form real de FeedlotSector) para
// provar:
// 1) `dirtyFields` do form fica corretamente marcado quando o usuário edita
//    "Largura" (a mudança é detectada normalmente pelo RHF);
// 2) a guarda SEM `!` (bug) bloqueia o salvamento nesse cenário — reproduz
//    exatamente o sintoma relatado (nenhuma chamada, tela só volta pra
//    lista, sem toast de erro);
// 3) a guarda COM `!` (fix aplicado em `CreateOrUpdateFeedlotSector.tsx`)
//    chama a mutação normalmente quando há alteração real, e ainda assim
//    pula o PATCH (só `navigate(-1)`, SEM chamar `mutateAsync`) quando NADA
//    mudou — comportamento preservado.
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { isEmpty } from '@/utils/isEmpty';

interface FormShape {
  name: string;
  width: number | string;
  length: number | string;
}

function setup(initial: FormShape) {
  return renderHook(() => {
    // `formState: { dirtyFields }` desestruturado DIRETO na assinatura —
    // mirror EXATO de `CreateOrUpdateFeedlotSector.tsx`
    // (`formState: { errors, dirtyFields }`).
    const {
      register,
      handleSubmit,
      formState: { dirtyFields },
    } = useForm<FormShape>({ mode: 'onChange', defaultValues: initial });
    return { register, handleSubmit, dirtyFields };
  });
}

const initialForm: FormShape = {
  name: 'Setor A',
  width: 10,
  length: 20,
};

describe('FeedlotSector onSubmit dirty guard — reprodução do bug real (mirror Abastecimentos AF_REJECTED)', () => {
  it('dirtyFields fica marcado quando "width" é editado (RHF detecta corretamente)', () => {
    const { result } = setup(initialForm);

    expect(isEmpty(result.current.dirtyFields)).toBe(false);

    act(() => {
      result.current.register('width').onChange({
        target: { name: 'width', value: 15 },
      } as any);
    });

    expect(isEmpty(result.current.dirtyFields)).toBe(true);
    expect(result.current.dirtyFields.width).toBeTruthy();
  });

  it('guarda SEM `!` (bug) bloqueia o save mesmo com "Largura" alterada', async () => {
    const { result } = setup(initialForm);

    act(() => {
      result.current.register('width').onChange({
        target: { name: 'width', value: 15 },
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

  it('guarda COM `!` (fix aplicado) chama o save quando "Largura" foi alterada', async () => {
    const { result } = setup(initialForm);

    act(() => {
      result.current.register('width').onChange({
        target: { name: 'width', value: 15 },
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

  it('guarda COM `!` (fix) ainda volta sem salvar (navigate(-1), sem mutateAsync) quando NADA mudou', async () => {
    const { result } = setup(initialForm);

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

describe('FeedlotSector update — payload COMPLETO (bug real 422, confirmado ao vivo pelo dono)', () => {
  // Reprodução do 2º bug (parte 2, mesma branch): editar um Setor e salvar
  // SEM mexer no status disparava 422 "O campo is active é obrigatório."
  // Causa: `tryPersistFeedlotSector` montava um PATCH PARCIAL guardado por
  // `dirtyFields` (só enviava `is_active`/`width`/`length`/etc. se o campo
  // tivesse sido tocado). Mas `FeedlotSectorRequest` (API) declara
  // `name`/`width`/`length`/`is_active` como `required` no update — só
  // `feedlot_yard_uuid` é `prohibited`. Fix: enviar sempre o payload
  // completo (mirror exato de `tryPersistFeedlotSector` pós-fix).
  interface SectorFormShape {
    name: string;
    width: number | string;
    length: number | string;
    is_active: { label: string; value: boolean };
    observation?: string;
  }

  const initialSectorForm: SectorFormShape = {
    name: 'Setor A',
    width: 10,
    length: 20,
    is_active: { label: 'Ativo', value: true },
    observation: '',
  };

  // Mirror exato do payload montado em `tryPersistFeedlotSector` (update).
  function buildUpdatePayload(data: SectorFormShape) {
    return {
      name: data.name,
      width: Number(data.width),
      length: Number(data.length),
      is_active: data.is_active.value,
      observation: data.observation || undefined,
    };
  }

  function setupSectorForm(initial: SectorFormShape) {
    return renderHook(() => {
      const {
        register,
        handleSubmit,
        getValues,
        formState: { dirtyFields },
      } = useForm<SectorFormShape>({ mode: 'onChange', defaultValues: initial });
      return { register, handleSubmit, getValues, dirtyFields };
    });
  }

  it('PATCH parcial (bug) omite is_active/width/length quando só "name" foi editado', () => {
    const { result } = setupSectorForm(initialSectorForm);

    act(() => {
      result.current.register('name').onChange({
        target: { name: 'name', value: 'Setor A editado' },
      } as any);
    });

    // Guarda de PATCH parcial (comportamento ANTIGO, removido do componente):
    // só inclui o campo se `dirtyFields` o marcar.
    const buggyPatch: Partial<SectorFormShape> = {};
    const data = { ...initialSectorForm, name: 'Setor A editado' };
    if (result.current.dirtyFields.name) buggyPatch.name = data.name;
    if (result.current.dirtyFields.width) buggyPatch.width = Number(data.width);
    if (result.current.dirtyFields.length) buggyPatch.length = Number(data.length);
    if (result.current.dirtyFields.is_active) {
      buggyPatch.is_active = data.is_active as any;
    }

    expect(buggyPatch).toHaveProperty('name');
    // Reproduz exatamente o 422: `is_active` (obrigatório na API) some do payload.
    expect(buggyPatch).not.toHaveProperty('is_active');
    expect(buggyPatch).not.toHaveProperty('width');
    expect(buggyPatch).not.toHaveProperty('length');
  });

  it('payload COMPLETO (fix aplicado) inclui is_active/width/length mesmo editando só "name"', () => {
    const { result } = setupSectorForm(initialSectorForm);

    act(() => {
      result.current.register('name').onChange({
        target: { name: 'name', value: 'Setor A editado' },
      } as any);
    });

    expect(result.current.dirtyFields.name).toBeTruthy();
    expect(result.current.dirtyFields.width).toBeFalsy();
    expect(result.current.dirtyFields.is_active).toBeFalsy();

    const data = { ...initialSectorForm, name: 'Setor A editado' };
    const payload = buildUpdatePayload(data);

    // Os campos `required` na API saem sempre, independente de `dirtyFields`.
    expect(payload).toEqual({
      name: 'Setor A editado',
      width: 10,
      length: 20,
      is_active: true,
      observation: undefined,
    });
    expect(payload).not.toHaveProperty('feedlot_yard_uuid');
  });
});
