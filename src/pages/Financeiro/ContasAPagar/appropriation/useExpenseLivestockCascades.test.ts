// @vitest-environment jsdom
// UT-000795 — cascatas do bloco Pecuária (RHF real via renderHook).
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listBatchOptionsForFormMock = vi.fn();
const listAnimalOptionsMock = vi.fn();

vi.mock('@/services/v2/Batches/batch-service', () => ({
  listBatchOptionsForForm: (...args: unknown[]) => listBatchOptionsForFormMock(...args),
}));
vi.mock('@/services/v2/Animals/animal-service', () => ({
  listAnimalOptions: (...args: unknown[]) => listAnimalOptionsMock(...args),
}));

import { useExpenseLivestockCascades } from './useExpenseLivestockCascades';

const opt = (value: string) => ({ label: value, value });

function setup(defaults: Record<string, unknown> = {}) {
  return renderHook(() => {
    const form = useForm<any>({
      defaultValues: {
        aprop_pec_area_uuid: null,
        aprop_pec_grazing_uuid: null,
        aprop_pec_batch_uuid: null,
        aprop_pec_animal_uuid: null,
        aprop_pec_operation_uuid: null,
        aprop_pec_activity_uuid: null,
        ...defaults,
      },
    });
    const cascades = useExpenseLivestockCascades({
      setValue: form.setValue,
      getValues: form.getValues,
      clearErrors: form.clearErrors,
    });
    // lê `dirtyFields` no render para assinar o proxy do formState
    const { dirtyFields } = form.formState;
    return { form, cascades, dirtyFields };
  });
}

beforeEach(() => {
  listBatchOptionsForFormMock.mockReset().mockResolvedValue({ data: { items: [] } });
  listAnimalOptionsMock.mockReset().mockResolvedValue({ data: { items: [] } });
});

describe('cascatas Área / Módulo / Lote / Operação', () => {
  const filled = {
    aprop_pec_area_uuid: opt('area'),
    aprop_pec_grazing_uuid: opt('graz'),
    aprop_pec_batch_uuid: opt('batch'),
    aprop_pec_animal_uuid: opt('animal'),
    aprop_pec_operation_uuid: opt('op'),
    aprop_pec_activity_uuid: opt('act'),
  };

  it('Área com valor limpa Módulo, Lote e Animal', () => {
    const { result } = setup(filled);
    act(() => result.current.cascades.handleAreaChange(true));
    const v = result.current.form.getValues();
    expect(v.aprop_pec_grazing_uuid).toBeNull();
    expect(v.aprop_pec_batch_uuid).toBeNull();
    expect(v.aprop_pec_animal_uuid).toBeNull();
  });

  it('Área limpa (sem valor) limpa Lote e Animal e MANTÉM o Módulo', () => {
    const { result } = setup({ ...filled, aprop_pec_area_uuid: null });
    act(() => result.current.cascades.handleAreaChange(false));
    const v = result.current.form.getValues();
    expect(v.aprop_pec_grazing_uuid).toEqual(opt('graz'));
    expect(v.aprop_pec_batch_uuid).toBeNull();
    expect(v.aprop_pec_animal_uuid).toBeNull();
  });

  it('Módulo com valor limpa Área, Lote e Animal; sem valor mantém a Área', () => {
    const { result } = setup(filled);
    act(() => result.current.cascades.handleGrazingChange(true));
    let v = result.current.form.getValues();
    expect(v.aprop_pec_area_uuid).toBeNull();
    expect(v.aprop_pec_batch_uuid).toBeNull();
    expect(v.aprop_pec_animal_uuid).toBeNull();

    const second = setup({ ...filled, aprop_pec_grazing_uuid: null });
    act(() => second.result.current.cascades.handleGrazingChange(false));
    v = second.result.current.form.getValues();
    expect(v.aprop_pec_area_uuid).toEqual(opt('area'));
    expect(v.aprop_pec_batch_uuid).toBeNull();
  });

  it('Lote limpa Animal; Operação limpa Atividade (e só isso)', () => {
    const { result } = setup(filled);
    act(() => result.current.cascades.handleBatchChange());
    let v = result.current.form.getValues();
    expect(v.aprop_pec_animal_uuid).toBeNull();
    expect(v.aprop_pec_batch_uuid).toEqual(opt('batch'));

    act(() => result.current.cascades.handleOperationChange());
    v = result.current.form.getValues();
    expect(v.aprop_pec_activity_uuid).toBeNull();
    expect(v.aprop_pec_operation_uuid).toEqual(opt('op'));
  });

  it('limpeza do usuário marca o form como sujo', () => {
    const { result } = setup(filled);
    act(() => result.current.cascades.handleBatchChange());
    expect(result.current.dirtyFields.aprop_pec_animal_uuid).toBe(true);
  });

  it('HIDRATAÇÃO NÃO LIMPA: reset() com Lote, Animal e Atividade preenchidos mantém os três', () => {
    const { result } = setup();
    act(() => {
      result.current.form.reset({ ...filled });
    });
    const v = result.current.form.getValues();
    expect(v.aprop_pec_batch_uuid).toEqual(opt('batch'));
    expect(v.aprop_pec_animal_uuid).toEqual(opt('animal'));
    expect(v.aprop_pec_activity_uuid).toEqual(opt('act'));
  });
});

describe('lookups dependentes', () => {
  it('Lote sem Área e sem Módulo NÃO chama a API', async () => {
    const { result } = setup();
    const page = await result.current.cascades.listBatchOptions({ search: 'x' });
    expect(listBatchOptionsForFormMock).not.toHaveBeenCalled();
    expect(page.data.items).toEqual([]);
  });

  it('Lote por Área envia areaUuid; por Módulo envia grazingUuid', async () => {
    const byArea = setup({ aprop_pec_area_uuid: opt('area-1') });
    await byArea.result.current.cascades.listBatchOptions({ search: 'l' });
    expect(listBatchOptionsForFormMock).toHaveBeenLastCalledWith({
      search: 'l',
      areaUuid: 'area-1',
      grazingUuid: undefined,
    });
    const byGrazing = setup({ aprop_pec_grazing_uuid: opt('graz-1') });
    await byGrazing.result.current.cascades.listBatchOptions({});
    expect(listBatchOptionsForFormMock).toHaveBeenLastCalledWith({
      search: undefined,
      areaUuid: undefined,
      grazingUuid: 'graz-1',
    });
  });

  it('Animal sem Lote NÃO chama a API', async () => {
    const { result } = setup();
    await result.current.cascades.listAnimalOptions({ page: 1 });
    expect(listAnimalOptionsMock).not.toHaveBeenCalled();
  });

  it('Animal por Lote envia batch_uuid, statuses A/P e per_page 100', async () => {
    const { result } = setup({ aprop_pec_batch_uuid: opt('batch-1') });
    await result.current.cascades.listAnimalOptions({ page: 2, search: 'br' });
    expect(listAnimalOptionsMock).toHaveBeenCalledWith({
      page: 2,
      per_page: 100,
      search: 'br',
      batch_uuid: 'batch-1',
      statuses: ['A', 'P'],
    });
  });
});
