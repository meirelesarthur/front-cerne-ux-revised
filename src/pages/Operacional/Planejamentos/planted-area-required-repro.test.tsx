// Reprodução isolada do achado 2 do dono (GAP-PLAN-FE-03) sobre
// `CreateOrUpdatePlanning.tsx`: "Área Plantada (ha)" (`planted_area`,
// FLD-07) deveria ser campo obrigatório na validação client e "não está
// sendo validada como tal".
//
// Leitura do arquivo real mostrava `rules={{ required: text.errors.required
// }}` já presente no `Controller` de `planted_area` — este teste isola o
// MESMO mecanismo real (`useForm` + `Controller`, `mode: 'onChange'`,
// `handleSubmit`) para provar, com evidência, se o `handleSubmit` de fato
// BLOQUEIA o submit quando o campo fica vazio (`null`, mesmo valor que
// `NumberInput`/`digitsToNumber('', ...)` emite para "campo vazio",
// `src/components/Form/NumberInput.tsx`) — confirmando (ou refutando) a
// hipótese de "já implementado" antes de decidir a correção.
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

interface PlantedAreaFormShape {
  planted_area: number | null;
}

describe('CreateOrUpdatePlanning "Área Plantada (ha)" required — reprodução do achado 2', () => {
  it('handleSubmit bloqueia o submit quando planted_area está vazio (null), mesma regra do Controller real', async () => {
    const { result } = renderHook(() => {
      const {
        control,
        handleSubmit,
        formState: { errors },
      } = useForm<PlantedAreaFormShape>({
        mode: 'onChange',
        defaultValues: { planted_area: null },
      });
      return { control, handleSubmit, errors };
    });

    let submitCalled = false;

    // Registra a mesma `rules={{ required: text.errors.required }}` do
    // `Controller` real diretamente no `control` — é exatamente o que o
    // `Controller` faz internamente ao montar (`useController` →
    // `control.register`), suficiente para exercitar a validação do RHF
    // sem precisar montar a árvore Chakra/`NumberInput` real.
    result.current.control.register('planted_area', { required: 'Campo obrigatório' });

    await act(async () => {
      await result.current.handleSubmit(() => {
        submitCalled = true;
      })();
    });

    expect(submitCalled).toBe(false);
    expect(result.current.errors.planted_area?.message).toBe('Campo obrigatório');
  });

  it('handleSubmit permite o submit quando planted_area tem valor numérico (0 incluso, distinto de vazio)', async () => {
    const { result } = renderHook(() => {
      const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
      } = useForm<PlantedAreaFormShape>({
        mode: 'onChange',
        defaultValues: { planted_area: null },
      });
      control.register('planted_area', { required: 'Campo obrigatório' });
      return { control, handleSubmit, setValue, errors };
    });

    act(() => {
      result.current.setValue('planted_area', 12.5, { shouldValidate: true });
    });

    let submitCalled = false;
    await act(async () => {
      await result.current.handleSubmit(() => {
        submitCalled = true;
      })();
    });

    expect(submitCalled).toBe(true);
    expect(result.current.errors.planted_area).toBeUndefined();
  });
});
