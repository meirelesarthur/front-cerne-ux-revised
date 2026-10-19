// TASK-072-FE-03 — mapper puro do payload de Contratante.
import { describe, expect, it } from 'vitest';

import { buildTenantPayload } from '@/constants/BaseRegistrations/mappers/tenant-payload';

import type { TenantForm } from '@/@types/v2/BaseRegistrations/tenant';

function makeForm(overrides: Partial<TenantForm> = {}): TenantForm {
  return {
    country: { value: 'uuid-br', label: 'Brasil', codigo: 1058 },
    nif: '529.982.247-25',
    nickname: ' Fazenda Boa Vista Ltda ',
    name: 'Boa Vista',
    email: 'contato@boavista.com.br',
    phone: '(11) 3456-7890',
    cellphone: '',
    role_id: { value: 'uuid-role', label: 'Rastreabilidade' },
    plan_uuid: { value: 'uuid-plan', label: 'Plano Pro' },
    list_all_farms: { value: false, label: 'Não' },
    qtd_farms: 1,
    qtd_users: 2,
    qtd_issuers: 10,
    qtd_nfe: 10,
    qtd_cte: 10,
    qtd_mdfe: 10,
    export_xls: { value: true, label: 'Sim' },
    zip_code: '01001-000',
    address: 'Praça da Sé',
    city: { value: 'uuid-city', label: 'São Paulo — SP' },
    contact: '',
    contact_phone: '',
    status: { value: 1, label: 'Habilitado' },
    uses_cash_book: { value: false, label: 'Não' },
    use_fiscal: { value: true, label: 'Sim' },
    signature: { value: 2, label: 'Mensal' },
    dt_accession: '2026-09-01',
    due_date: '2027-09-01',
    due_day: { value: 10, label: 'Dia 10' },
    value: 150,
    generate_financial: { value: false, label: 'Não' },
    generate_ticket: { value: false, label: 'Não' },
    cancellation_reason: 'motivo digitado',
    centers: ['uuid-cc-1'],
    ...overrides,
  };
}

describe('TASK-072-FE-03 — buildTenantPayload', () => {
  it('preserva o NIF pontuado de CPF e de CNPJ (sem cleanMask)', () => {
    expect(buildTenantPayload(makeForm(), {}).person.nif).toBe('529.982.247-25');
    expect(buildTenantPayload(makeForm({ nif: '11.222.333/0001-81' }), {}).person.nif).toBe(
      '11.222.333/0001-81'
    );
  });

  it('envia o CEP formatado 00000-000 e o país/cidade por uuid', () => {
    const payload = buildTenantPayload(makeForm(), {});
    expect(payload.person.zip_code).toBe('01001-000');
    expect(payload.country_uuid).toBe('uuid-br');
    expect(payload.person.city_uuid).toBe('uuid-city');
    expect(payload.person.nickname).toBe('Fazenda Boa Vista Ltda');
  });

  it('due_date é null quando signature = 99 (Indeterminado)', () => {
    const payload = buildTenantPayload(
      makeForm({ signature: { value: 99, label: 'Indeterminado' } }),
      {}
    );
    expect(payload.due_date).toBeNull();
    expect(buildTenantPayload(makeForm(), {}).due_date).toBe('2027-09-01');
  });

  it('cancellation_reason só entra com status = 4 (Cancelado)', () => {
    expect(buildTenantPayload(makeForm(), {}).cancellation_reason).toBeUndefined();
    expect(
      buildTenantPayload(
        makeForm({ status: { value: 4, label: 'Cancelado' }, cancellation_reason: ' atraso ' }),
        {}
      ).cancellation_reason
    ).toBe('atraso');
  });

  it('plan_uuid e centers só entram quando dirty', () => {
    const clean = buildTenantPayload(makeForm(), {});
    expect('plan_uuid' in clean).toBe(false);
    expect('centers' in clean).toBe(false);

    const dirty = buildTenantPayload(makeForm(), { plan_uuid: true, centers: [true] });
    expect(dirty.plan_uuid).toBe('uuid-plan');
    expect(dirty.centers).toEqual(['uuid-cc-1']);
  });

  it('opcionais vazios viram null/undefined como antes da extração', () => {
    const payload = buildTenantPayload(makeForm({ zip_code: '', phone: '' }), {});
    expect(payload.person.zip_code).toBeUndefined();
    expect(payload.person.phone).toBeNull();
    expect(payload.cellphone).toBeNull();
    expect(payload.contact).toBeNull();
  });
});
