import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SERVICE_TYPE_PARAMS,
  appointmentPreview,
  fieldAppliesToUse,
  normalizeParamsForUse,
  validateServiceTypeParams,
  type ServiceTypeParams,
} from './serviceTypeParams';

const base = (over: Partial<ServiceTypeParams> = {}): ServiceTypeParams => ({ ...DEFAULT_SERVICE_TYPE_PARAMS, ...over });

describe('regras de uso do Tipo de serviço', () => {
  it('lote só quando o uso não é agricultura', () => {
    expect(fieldAppliesToUse('requires_batch', 'agricultura')).toBe(false);
    expect(fieldAppliesToUse('requires_batch', 'pecuaria')).toBe(true);
    expect(fieldAppliesToUse('requires_batch', 'ambos')).toBe(true);
  });

  it('safra, cultura e área utilizada só quando o uso não é pecuária', () => {
    (['requires_harvest', 'requires_cultivation', 'requires_used_area'] as const).forEach((field) => {
      expect(fieldAppliesToUse(field, 'pecuaria')).toBe(false);
      expect(fieldAppliesToUse(field, 'agricultura')).toBe(true);
      expect(fieldAppliesToUse(field, 'ambos')).toBe(true);
    });
  });

  it('ao trocar o uso, desliga o que não se aplica e mantém o resto', () => {
    const all = base({
      use: 'ambos',
      requires_harvest: true,
      requires_cultivation: true,
      requires_used_area: true,
      requires_batch: true,
      required_inputs: true,
    });
    expect(normalizeParamsForUse({ ...all, use: 'pecuaria' })).toMatchObject({
      requires_harvest: false,
      requires_cultivation: false,
      requires_used_area: false,
      requires_batch: true,
      required_inputs: true,
    });
    expect(normalizeParamsForUse({ ...all, use: 'agricultura' })).toMatchObject({
      requires_harvest: true,
      requires_batch: false,
    });
  });
});

describe('validação dos números', () => {
  it('aceita os valores padrão', () => {
    expect(validateServiceTypeParams(base())).toEqual([]);
  });

  it('texto máximo não pode ser menor que o mínimo', () => {
    expect(validateServiceTypeParams(base({ text_min: 50, text_max: 20 }))).toEqual(['textMaxLessThanMin']);
    expect(validateServiceTypeParams(base({ text_min: 50, text_max: 50 }))).toEqual([]);
  });

  it('máximo zero significa sem limite', () => {
    expect(validateServiceTypeParams(base({ text_min: 50, text_max: 0 }))).toEqual([]);
  });

  it('fotos e textos não podem ser negativos', () => {
    expect(validateServiceTypeParams(base({ min_photos: -1 }))).toEqual(['minPhotosNegative']);
    expect(validateServiceTypeParams(base({ text_min: -1 }))).toEqual(['textNegative']);
  });
});

describe('prévia "Como fica o Apontamento"', () => {
  it('sem exigências, a lista vem vazia', () => {
    expect(appointmentPreview(base())).toEqual([]);
  });

  it('lista, na ordem do formulário, só o que o tipo pede', () => {
    const preview = appointmentPreview(
      base({
        use: 'agricultura',
        requires_harvest: true,
        requires_cultivation: true,
        requires_used_area: true,
        required_inputs: true,
        generates_production: true,
        min_photos: 2,
        text_min: 20,
        text_max: 200,
        notify_on_finish: true,
      })
    );
    expect(preview.map((i) => i.key)).toEqual([
      'harvest',
      'cultivation',
      'usedArea',
      'inputs',
      'production',
      'photos',
      'text',
      'notify',
    ]);
    expect(preview.find((i) => i.key === 'photos')?.count).toBe(2);
    expect(preview.find((i) => i.key === 'text')).toMatchObject({ min: 20, max: 200 });
  });

  it('não mostra o que não se aplica ao uso', () => {
    const preview = appointmentPreview(
      base({ use: 'pecuaria', requires_harvest: true, requires_used_area: true, requires_batch: true })
    );
    expect(preview.map((i) => i.key)).toEqual(['batch']);
  });

  it('"Gera execução" não muda o Apontamento (só a compra)', () => {
    expect(appointmentPreview(base({ generates_execution: false }))).toEqual([]);
  });

  it('texto só com máximo também aparece', () => {
    expect(appointmentPreview(base({ text_max: 100 }))).toEqual([{ key: 'text', min: 0, max: 100 }]);
  });
});
