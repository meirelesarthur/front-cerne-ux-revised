// TASK-072-FE-05 (I5) — mapper puro do lookup por NIF.
import { describe, expect, it } from 'vitest';

import {
  lookupCityToOption,
  lookupToTenantFields,
} from '@/constants/BaseRegistrations/mappers/tenant-nif-autofill';

const CITY_SP = {
  uuid: 'uuid-sp',
  name: 'São Paulo',
  iso: 3550308,
  state: { uuid: 'uuid-uf-sp', uf: 'SP' },
};

describe('TASK-072-FE-05 — lookupToTenantFields', () => {
  it('mapeia nickname (razão social), name (fantasia) e preserva o phone só com dígitos', () => {
    const fields = lookupToTenantFields({
      nickname: 'ACME COMERCIO LTDA',
      name: 'ACME',
      email: 'contato@acme.com.br',
      phone: '1133334444',
      zip_code: '01001-000',
      address: 'Praça da Sé, 100, Sé',
      city: CITY_SP,
    });

    expect(fields).toEqual({
      nickname: 'ACME COMERCIO LTDA',
      name: 'ACME',
      email: 'contato@acme.com.br',
      phone: '1133334444',
      zip_code: '01001000',
      address: 'Praça da Sé, 100, Sé',
      city: { label: 'São Paulo — SP', value: 'uuid-sp' },
    });
  });

  it('telefone mascarado da pessoa sai só com dígitos', () => {
    const fields = lookupToTenantFields({
      nickname: null,
      name: null,
      email: null,
      phone: '(11) 98765-4321',
      zip_code: null,
      address: null,
      city: null,
    });

    expect(fields.phone).toBe('11987654321');
  });

  it('tolera city null e campos nulos (vazio = não informado)', () => {
    const fields = lookupToTenantFields({
      nickname: null,
      name: null,
      email: null,
      phone: null,
      zip_code: null,
      address: null,
      city: null,
    });

    expect(fields).toEqual({
      nickname: '',
      name: '',
      email: '',
      phone: '',
      zip_code: '',
      address: '',
      city: null,
    });
  });

  it('label da cidade traz a UF; sem estado usa só o nome', () => {
    expect(lookupCityToOption(CITY_SP)).toEqual({ label: 'São Paulo — SP', value: 'uuid-sp' });
    expect(lookupCityToOption({ ...CITY_SP, state: null })).toEqual({
      label: 'São Paulo',
      value: 'uuid-sp',
    });
    expect(lookupCityToOption(null)).toBeNull();
  });
});
