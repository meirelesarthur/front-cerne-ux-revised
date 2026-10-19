import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import {
  extractCategoryHarvestErrors,
  resolveHeaderHarvestUuid,
  resolveRowHarvestUuid,
} from './expenseHarvest';

const H = { label: 'Safra 24/25', value: 'harvest-uuid-1' };

function axios422(errors: Record<string, string[]>) {
  const err = new AxiosError('x', '422', undefined, undefined, {
    status: 422,
    data: { errors },
  } as any);
  return err;
}

describe('Safra por modo (UT-000765 / D-101-06)', () => {
  it('criar: cabecalho envia a Safra e as linhas vao null', () => {
    expect(resolveHeaderHarvestUuid(false, H)).toBe('harvest-uuid-1');
    expect(resolveRowHarvestUuid(false, H)).toBeNull();
  });

  it('criar sem Safra: cabecalho null (nunca obrigatoria)', () => {
    expect(resolveHeaderHarvestUuid(false, null)).toBeNull();
  });

  it('editar: cabecalho null e Safra por linha', () => {
    expect(resolveHeaderHarvestUuid(true, H)).toBeNull();
    expect(resolveRowHarvestUuid(true, H)).toBe('harvest-uuid-1');
    expect(resolveRowHarvestUuid(true, null)).toBeNull();
  });

  it('422 categories.N.harvest_uuid mapeado por linha; demais chaves ignoradas', () => {
    const result = extractCategoryHarvestErrors(
      axios422({
        'categories.1.harvest_uuid': ['Safra invalida'],
        'categories.0.value': ['x'],
        harvest_uuid: ['y'],
      })
    );
    expect(result).toEqual([{ key: 'categories.1.harvest_uuid', message: 'Safra invalida' }]);
  });

  it('erro nao-422 nao mapeia nada', () => {
    expect(extractCategoryHarvestErrors(new Error('boom'))).toEqual([]);
  });
});
