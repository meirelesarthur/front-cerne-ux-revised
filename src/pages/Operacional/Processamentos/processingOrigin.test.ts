// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { isMovementPurchaseOrigin, resolveProcessingOriginKey } from './processingOrigin';

describe('isMovementPurchaseOrigin', () => {
  it.each(['App\\Models\\MovementPurchase', 'App\\MovementPurchase', 'movement_purchase'])(
    'aceita %s',
    (value) => {
      expect(isMovementPurchaseOrigin(value)).toBe(true);
    }
  );

  it.each([
    'App\\Models\\Weaning',
    'App\\TransferBatchFarm',
    'separation',
    'MovementPurchaseX',
    'App\\Models\\MovementPurchaseItem',
    null,
    undefined,
    '',
  ])('rejeita %s', (value) => {
    expect(isMovementPurchaseOrigin(value)).toBe(false);
  });
});

describe('resolveProcessingOriginKey', () => {
  it('normaliza FQCN nos dois namespaces', () => {
    expect(resolveProcessingOriginKey('App\\Models\\Weaning')).toBe('weaning');
    expect(resolveProcessingOriginKey('App\\TransferAnimalFarm')).toBe('transfer_animal_farm');
  });

  it('devolve null para desconhecido', () => {
    expect(resolveProcessingOriginKey('App\\Models\\Foo')).toBeNull();
  });
});
