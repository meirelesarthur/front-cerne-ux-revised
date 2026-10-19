import { describe, expect, it } from 'vitest';

import {
  attachmentsRequired,
  canRemoveAttachment,
  canRemoveItem,
  dropEmptyAttachmentRows,
  emptyItemRow,
  isAttachmentRowIncomplete,
  isDailyNifReadOnly,
  isItemRowIncomplete,
} from './itemRowGuards';

describe('itemRowGuards (execução 081, FE-05)', () => {
  it('Serviço nasce com quantidade 1; os demais tipos sem quantidade', () => {
    expect(emptyItemRow('S').quantity).toBe(1);
    expect(emptyItemRow('P').quantity).toBeNull();
    expect(emptyItemRow(null).quantity).toBeNull();
  });

  it('P/M/U: produto não conta para a linha incompleta (opcional), descrição e quantidade contam', () => {
    expect(isItemRowIncomplete('P', { quantity: 2, description: 'Parafuso' })).toBe(false);
    expect(isItemRowIncomplete('U', { quantity: 2, description: '' })).toBe(true);
    expect(isItemRowIncomplete('M', { quantity: null, description: 'x' })).toBe(true);
  });

  it('F/E: produto opcional; descrição e valor obrigatórios', () => {
    expect(isItemRowIncomplete('F', { amount: 10, description: 'Nota' })).toBe(false);
    expect(isItemRowIncomplete('E', { amount: null, description: 'Frete' })).toBe(true);
  });

  it('C/B: Descrição de serviços e valor', () => {
    expect(isItemRowIncomplete('C', { amount: 5, service_description: 'Cerca' })).toBe(false);
    expect(isItemRowIncomplete('B', { amount: 5, service_description: '' })).toBe(true);
  });

  it('Diária: os cinco campos são obrigatórios', () => {
    const full = {
      name: 'João',
      nif: '12345678909',
      phone: '11999999999',
      service_description: 'Roço',
      daily_quantity: 2,
    };
    expect(isItemRowIncomplete('D', full)).toBe(false);
    expect(isItemRowIncomplete('D', { ...full, phone: '' })).toBe(true);
  });

  it('sem tipo, a linha é considerada incompleta (bloqueia adicionar)', () => {
    expect(isItemRowIncomplete(null, { quantity: 1 })).toBe(true);
  });

  it('o último item não pode ser removido', () => {
    expect(canRemoveItem(1)).toBe(false);
    expect(canRemoveItem(2)).toBe(true);
  });

  it('F/E/U mantêm ao menos 1 anexo; demais tipos podem esvaziar', () => {
    expect(canRemoveAttachment('F', 1)).toBe(false);
    expect(canRemoveAttachment('U', 2)).toBe(true);
    expect(canRemoveAttachment('P', 1)).toBe(true);
    expect(attachmentsRequired('E')).toBe(true);
    expect(attachmentsRequired('S')).toBe(false);
  });

  it('anexo incompleto: sem descrição ou sem arquivo (gravado dispensa arquivo novo)', () => {
    const file = new File(['x'], 'a.pdf');
    expect(isAttachmentRowIncomplete({ name: 'Nota', file })).toBe(false);
    expect(isAttachmentRowIncomplete({ name: 'Nota', attachment_uuid: 'u-1' })).toBe(false);
    expect(isAttachmentRowIncomplete({ name: '', file })).toBe(true);
    expect(isAttachmentRowIncomplete({ name: 'Nota' })).toBe(true);
  });

  it('CPF da Diária é somente leitura só em linha já gravada', () => {
    expect(isDailyNifReadOnly({ item_uuid: 'abc' })).toBe(true);
    expect(isDailyNifReadOnly({ item_uuid: null })).toBe(false);
    expect(isDailyNifReadOnly(undefined)).toBe(false);
  });

  it('descarta linhas de anexo totalmente vazias do payload', () => {
    const rows = [
      { attachment_uuid: null, name: '', file: null },
      { attachment_uuid: 'u-1', name: 'Nota', file: null },
      { attachment_uuid: null, name: 'Sem arquivo', file: null },
    ];
    expect(dropEmptyAttachmentRows(rows)).toHaveLength(2);
  });
});
