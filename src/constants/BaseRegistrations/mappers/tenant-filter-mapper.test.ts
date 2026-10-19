import { describe, expect, it } from 'vitest';

import {
  countAppliedTenantFilters,
  tenantFilterPristineValues,
  toFilterRequest,
  toInternalValues,
  toTenantListParams,
} from '@/constants/BaseRegistrations/mappers/tenant-filter-mapper';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import type {
  TenantsFilterForm,
  TenantsFilterFormInternal,
} from '@/@types/v2/BaseRegistrations/tenant';

const languageGB = languagePtBr.BR;
const ROLE_UUID = '9b2f4a52-7d3c-4c1e-9a53-1f0a6f3b2c11';
const PLAN_UUID = '0c8e1d74-5a21-4f6b-8e3d-7b9a2c4d6e22';

const fullInternal: TenantsFilterFormInternal = {
  search: 'Fazenda Boa Vista',
  status: { label: 'Habilitado', value: 1 },
  signature: { label: 'Bianual', value: 6 },
  due_month: { label: 'Março', value: 3 },
  due_day: { label: 'Dia 10', value: 10 },
  dt_accession: '2026-01-15',
  start_date: '2026-01-01',
  end_date: '2026-06-30',
  role_uuid: { label: 'Rastreabilidade', value: ROLE_UUID },
  plan_uuid: { label: 'Plano Ouro', value: PLAN_UUID },
};

describe('TASK-072-FE-07 — tenant-filter-mapper', () => {
  it('round-trip interno → request → interno preserva todos os campos', () => {
    const request = toFilterRequest(fullInternal);
    expect(request).toEqual({
      search: 'Fazenda Boa Vista',
      status: 1,
      signature: 6,
      due_month: 3,
      due_day: 10,
      dt_accession: '2026-01-15',
      start_date: '2026-01-01',
      end_date: '2026-06-30',
      role_uuid: ROLE_UUID,
      plan_uuid: PLAN_UUID,
      role_label: 'Rastreabilidade',
      plan_label: 'Plano Ouro',
    });

    const back = toInternalValues(request, languageGB);
    expect(back).toEqual({
      ...fullInternal,
      // rótulos das fábricas (tradução corrente)
      status: { label: 'Habilitado', value: 1 },
      signature: { label: 'Bianual', value: 6 },
      due_month: { label: 'Março', value: 3 },
      due_day: { label: 'Dia 10', value: 10 },
    });
  });

  it('cada filtro gera o param correto do GET /tenants (sem rótulos de apresentação)', () => {
    expect(toTenantListParams(toFilterRequest(fullInternal))).toEqual({
      search: 'Fazenda Boa Vista',
      status: 1,
      signature: 6,
      due_month: 3,
      dt_accession: '2026-01-15',
      due_day: 10,
      start_date: '2026-01-01',
      end_date: '2026-06-30',
      role_uuid: ROLE_UUID,
      plan_uuid: PLAN_UUID,
    });
  });

  it('vazios são omitidos (request e params)', () => {
    expect(toFilterRequest(tenantFilterPristineValues)).toEqual({});
    expect(toFilterRequest({ ...tenantFilterPristineValues, search: '   ' })).toEqual({});
    expect(toTenantListParams({})).toEqual({});
    expect(toTenantListParams(null)).toEqual({});
    expect(toTenantListParams({ search: '', role_label: 'x' } as TenantsFilterForm)).toEqual({});
  });

  it('datas preservadas como Y-m-d; formato inválido descartado', () => {
    const request = toFilterRequest({
      ...tenantFilterPristineValues,
      dt_accession: '2026-02-28',
      start_date: '28/02/2026',
      end_date: '2026-03-01',
    });
    expect(request).toEqual({ dt_accession: '2026-02-28', end_date: '2026-03-01' });

    const internal = toInternalValues(
      { dt_accession: '2026-02-28', start_date: '2026-02-30T00:00:00Z' },
      languageGB
    );
    expect(internal.dt_accession).toBe('2026-02-28');
    expect(internal.start_date).toBeNull();
  });

  it('Options inválidas → null', () => {
    const internal = toInternalValues(
      {
        status: 9 as never,
        signature: 7 as never,
        due_month: 13 as never,
        due_day: 20 as never,
        role_uuid: 'nao-e-uuid',
        plan_uuid: '',
      },
      languageGB
    );
    expect(internal).toEqual(tenantFilterPristineValues);
  });

  it('valores persistidos como string (storage) ainda casam a Option', () => {
    const internal = toInternalValues(
      { status: '2' as never, due_month: '12' as never },
      languageGB
    );
    expect(internal.status?.value).toBe(2);
    expect(internal.due_month?.value).toBe(12);
  });

  it('atribuição/plano sem rótulo salvo usam o uuid como rótulo provisório', () => {
    const internal = toInternalValues({ role_uuid: ROLE_UUID }, languageGB);
    expect(internal.role_uuid).toEqual({ value: ROLE_UUID, label: ROLE_UUID });
  });

  it('contagem de filtros aplicados ignora rótulos de apresentação', () => {
    expect(countAppliedTenantFilters(toFilterRequest(fullInternal))).toBe(10);
    expect(countAppliedTenantFilters({ role_uuid: ROLE_UUID, role_label: 'Rastreabilidade' })).toBe(
      1
    );
    expect(countAppliedTenantFilters(undefined)).toBe(0);
  });
});
