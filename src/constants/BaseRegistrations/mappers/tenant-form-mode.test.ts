// TASK-072-FE-06 — matriz de modo do formulário de Contratante (I9).
import { describe, expect, it } from 'vitest';

import { resolveTenantFormMode } from '@/constants/BaseRegistrations/mappers/tenant-form-mode';

const none = { canCreate: false, canEdit: false, canView: false };

describe('TASK-072-FE-06 — resolveTenantFormMode', () => {
  it('create: rota /novo com tenants_create', () => {
    expect(resolveTenantFormMode({ ...none, isEditing: false, canCreate: true })).toBe('create');
  });

  it('create sem tenants_create → denied (view/edit não liberam /novo)', () => {
    expect(
      resolveTenantFormMode({ isEditing: false, canCreate: false, canEdit: true, canView: true })
    ).toBe('denied');
  });

  it('edit: /:uuid com tenants_edit (prevalece sobre view)', () => {
    expect(resolveTenantFormMode({ ...none, isEditing: true, canEdit: true })).toBe('edit');
    expect(
      resolveTenantFormMode({ isEditing: true, canCreate: true, canEdit: true, canView: true })
    ).toBe('edit');
  });

  it('view: /:uuid só com tenants_view', () => {
    expect(resolveTenantFormMode({ ...none, isEditing: true, canView: true })).toBe('view');
    expect(
      resolveTenantFormMode({ isEditing: true, canCreate: true, canEdit: false, canView: true })
    ).toBe('view');
  });

  it('sem permissão → denied', () => {
    expect(resolveTenantFormMode({ ...none, isEditing: true })).toBe('denied');
    expect(resolveTenantFormMode({ ...none, isEditing: true, canCreate: true })).toBe('denied');
  });
});
