// src/pages/Administrativo/Sla/SlaTableRow.test.tsx
// T-081-FE-04 — token da bolinha por status, contador e validação inteira >= 0.

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { supplyStatusSlaSchema } from '@/validations/schemas/SupplyStatusSlas/supply-status-sla-schema';

import { formatSlaRecordsCount, slaStatusDotToken } from './slaStatusDot';

describe('slaStatusDotToken', () => {
  it('devolve o token supplyStatusN para os 11 status', () => {
    for (let status = 1; status <= 11; status += 1) {
      expect(slaStatusDotToken(status)).toBe(`supplyStatus${status}`);
    }
  });

  it('sem bolinha para status fora de 1..11', () => {
    expect(slaStatusDotToken(0)).toBeNull();
    expect(slaStatusDotToken(12)).toBeNull();
    expect(slaStatusDotToken(undefined)).toBeNull();
  });
});

describe('formatSlaRecordsCount', () => {
  it('monta "N. Registros: 11"', () => {
    expect(formatSlaRecordsCount('N. Registros: {total}', 11)).toBe('N. Registros: 11');
  });
});

describe('supplyStatusSlaSchema', () => {
  const schema = supplyStatusSlaSchema(languagePtBr.BR as never);

  it('aceita inteiro >= 0', async () => {
    await expect(schema.isValid({ max_hours: 0 })).resolves.toBe(true);
    await expect(schema.isValid({ max_hours: 48 })).resolves.toBe(true);
  });

  it('rejeita negativo, decimal e vazio', async () => {
    await expect(schema.isValid({ max_hours: -1 })).resolves.toBe(false);
    await expect(schema.isValid({ max_hours: 1.5 })).resolves.toBe(false);
    await expect(schema.isValid({ max_hours: undefined })).resolves.toBe(false);
  });
});
