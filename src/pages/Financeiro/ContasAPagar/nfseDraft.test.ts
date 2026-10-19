// UT-000754 / T-754-FE-03 — FE-DRAFT-01..04 e 06 sobre o mapeador puro do
// rascunho de NFS-e Recebida. (FE-DRAFT-05 — limpeza do `state` — é do efeito
// em CreateOrUpdateExpense e não tem teste de unidade; ver recibo.)
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import type { NfseExpenseDraft } from '@/@types/v2/BaseRegistrations/nfse';

import { mapNfseDraftExtraFields, toExpenseXmlDraft } from './nfseDraft';

const languageGB = getLanguageRouter('BR')!;
const KEY_50 = '35260512345678000190550010000001231000001234567890'.slice(0, 50).padEnd(50, '1');

function makeDraft(partial: Partial<NfseExpenseDraft> = {}): NfseExpenseDraft {
  return {
    xml_key: KEY_50,
    number: '123',
    dt_emission: '2026-05-10',
    due_date: '2026-05-10',
    amount: 1500.5,
    note: 'Serviço de topografia',
    provider_uuid: '11111111-1111-4111-8111-111111111111',
    provider_matched: true,
    proprietary_uuid: '22222222-2222-4222-8222-222222222222',
    farm_uuid: '33333333-3333-4333-8333-333333333333',
    type_note_id: 3,
    type_id: 18,
    fiscal_document: true,
    is_taxation: false,
    payment_type: 1,
    appropriation: 2,
    ...partial,
  };
}

describe('nfseDraft (UT-000754)', () => {
  it('FE-DRAFT-01 mapeia number/datas/amount/note/xml_key(50) e due_date = dt_emission', () => {
    const xml = toExpenseXmlDraft(makeDraft({ due_date: null }));
    expect(xml).toMatchObject({
      number: '123',
      dt_emission: '2026-05-10',
      amount: 1500.5,
      note: 'Serviço de topografia',
      type_note_id: 3,
      type_id: 18,
    });
    expect(xml.xml_key).toHaveLength(50);
    expect(mapNfseDraftExtraFields(makeDraft({ due_date: null }), languageGB).due_date).toBe(
      '2026-05-10'
    );
  });

  it('FE-DRAFT-02 payment_type 1, appropriation 2, fiscal_document true e is_taxation false viram options', () => {
    const extra = mapNfseDraftExtraFields(makeDraft(), languageGB);
    expect(extra.payment_type.value).toBe(1);
    expect(extra.payment_type.label).toBe(
      languageGB.financial.expense.form.paymentTypeOptions.parcelaUnica
    );
    expect(extra.appropriation.value).toBe(2);
    expect(extra.appropriation.label).toBe(
      languageGB.financial.expense.form.appropriationOptions.indirect
    );
    expect(extra.fiscal_document).toEqual({ label: languageGB.defaltStrings.yes, value: true });
    expect(extra.is_taxation).toEqual({ label: languageGB.defaltStrings.no, value: false });
  });

  it('FE-DRAFT-03 número e datas nulos não viram "null"; proprietary_uuid nulo fica nulo no rascunho', () => {
    const draft = makeDraft({
      number: null,
      dt_emission: null,
      due_date: null,
      proprietary_uuid: null,
    });
    const xml = toExpenseXmlDraft(draft);
    expect(xml.number).toBe('');
    expect(xml.dt_emission).toBe('');
    expect(mapNfseDraftExtraFields(draft, languageGB).due_date).toBeNull();
    expect(draft.proprietary_uuid).toBeNull();
  });

  it('FE-DRAFT-04 provider_matched=false é repassado a handleXmlImported (que exibe o aviso)', () => {
    expect(toExpenseXmlDraft(makeDraft({ provider_matched: false })).provider_matched).toBe(false);
    expect(toExpenseXmlDraft(makeDraft({ provider_matched: true })).provider_matched).toBe(true);
  });

  it('FE-DRAFT-06 xml_key de 50 caracteres chega intacto ao payload', () => {
    expect(toExpenseXmlDraft(makeDraft()).xml_key).toBe(KEY_50);
  });

  it('trunca datas com timestamp para yyyy-MM-dd', () => {
    const xml = toExpenseXmlDraft(makeDraft({ dt_emission: '2026-05-10T03:00:00Z' }));
    expect(xml.dt_emission).toBe('2026-05-10');
  });
});
