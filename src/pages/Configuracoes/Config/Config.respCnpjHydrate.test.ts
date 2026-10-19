import { describe, expect, it } from 'vitest';

import { formatCnpj } from '@/utils/masks/document';

// Hidratação de `resp_cnpj` (index.tsx): `data.resp_cnpj ? formatCnpj(data.resp_cnpj) : ''`.
describe('Config resp_cnpj hidratação formatada', () => {
  it('formata CNPJ numérico vindo cru da API', () => {
    expect(formatCnpj('60806083000132')).toBe('60.806.083/0001-32');
  });
  it('formata CNPJ alfanumérico', () => {
    expect(formatCnpj('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
  });
});
