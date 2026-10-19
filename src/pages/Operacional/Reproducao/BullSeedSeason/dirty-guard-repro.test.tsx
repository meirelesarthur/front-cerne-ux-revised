// Reprodução isolada do bug real (teste manual do dono) em
// `CreateOrUpdateBullSeedSeason.tsx::onSubmit`: em edição, o guard de "nada
// mudou → só navega" usava `isEditing && isEmpty(dirtyFields)` (SEM `!`).
//
// `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM alguma chave
// própria (nome invertido do utilitário) — então o guard correto (usado em
// `CreateOrUpdateEstagioReprodutivo.tsx`, `useProductFormController.ts`, etc.)
// é `isEditing && !isEmpty(dirtyFields)`. Sem a negação, o guard disparava
// `navigate(-1)` sempre que HAVIA alteração (dirtyFields não-vazio) —
// exatamente o inverso do pretendido — fazendo Salvar nunca chamar a API em
// NENHUMA edição (campo simples OU subcadastro).
//
// Este teste isola o mecanismo real de `react-hook-form` (useFieldArray +
// Controller aninhado, mesmo shape de `AnimalsFieldArray`/`animals[]`) para
// provar duas coisas com evidência real (não apenas leitura de código):
// 1) o `dirtyFields` do formulário PAI É corretamente marcado quando só um
//    campo DENTRO do repetidor muda (a hipótese de "RHF não propaga dirty de
//    useFieldArray" NÃO se confirma — não é a causa raiz);
// 2) a guarda SEM `!` bloqueia o salvamento nesse cenário; a guarda COM `!`
//    (o fix aplicado no arquivo de produção) chama a mutação normalmente.
import { act, renderHook } from '@testing-library/react';
import { useController, useFieldArray, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { isEmpty } from '@/utils/isEmpty';

interface AnimalRow {
  animal: { label: string; value: string } | null;
}

interface FormShape {
  description: string;
  animals: AnimalRow[];
}

// Mirror EXATO do mecanismo real de `AnimalsFieldArray.tsx`: o repetidor usa
// `Controller`/`useController` por linha (`animals.${index}.animal`), e o
// `onChange` do Select chama `field.onChange(option)` — NUNCA
// `fieldArray.update()`. É esse caminho (Controller.onChange) que precisa
// ser reproduzido para o teste refletir o app real.
function setup(initial: FormShape) {
  return renderHook(() => {
    // `formState: { dirtyFields }` desestruturado DIRETO na assinatura — mirror
    // EXATO de `CreateOrUpdateBullSeedSeason.tsx` (`formState: { errors,
    // dirtyFields }`). RHF só habilita a re-renderização/leitura reativa de
    // `dirtyFields` quando a chave É lida (Proxy de leitura preguiçosa); o
    // componente real já lê no PRIMEIRO render (destructuring), então o teste
    // precisa fazer o mesmo para não medir um artefato do teste em vez do
    // comportamento real do app.
    const {
      control,
      register,
      handleSubmit,
      formState: { dirtyFields },
    } = useForm<FormShape>({
      defaultValues: initial,
    });
    const fieldArray = useFieldArray({ control, name: 'animals' });
    const animalField0 = useController({ control, name: 'animals.0.animal' });
    return { control, register, handleSubmit, dirtyFields, fieldArray, animalField0 };
  });
}

describe('BullSeedSeason onSubmit dirty guard — reprodução do bug real', () => {
  it('dirtyFields do PAI fica marcado quando só um Controller aninhado do repetidor muda (RHF propaga corretamente)', () => {
    const { result } = setup({
      description: 'original',
      animals: [{ animal: { label: 'A1', value: 'uuid-1' } }],
    });

    expect(isEmpty(result.current.dirtyFields)).toBe(false);

    act(() => {
      result.current.animalField0.field.onChange({ label: 'A2', value: 'uuid-2' });
    });

    expect(isEmpty(result.current.dirtyFields)).toBe(true);
    expect(result.current.dirtyFields.animals?.[0]?.animal).toBeTruthy();
  });

  it('guarda SEM `!` (bug) bloqueia o save mesmo com subcadastro alterado', async () => {
    const { result } = setup({
      description: 'original',
      animals: [{ animal: { label: 'A1', value: 'uuid-1' } }],
    });

    act(() => {
      result.current.animalField0.field.onChange({ label: 'A2', value: 'uuid-2' });
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

  it('guarda COM `!` (fix aplicado) chama o save quando só o subcadastro mudou', async () => {
    const { result } = setup({
      description: 'original',
      animals: [{ animal: { label: 'A1', value: 'uuid-1' } }],
    });

    act(() => {
      result.current.animalField0.field.onChange({ label: 'A2', value: 'uuid-2' });
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
    const { result } = setup({
      description: 'original',
      animals: [{ animal: { label: 'A1', value: 'uuid-1' } }],
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

    expect(navigatedBack).toBe(true);
    expect(saveCalled).toBe(false);
  });
});
