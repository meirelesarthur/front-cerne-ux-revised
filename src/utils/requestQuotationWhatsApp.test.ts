// src/utils/requestQuotationWhatsApp.test.ts
// -----------------------------------------------------------------------------
// Smoke ad hoc (agente) da TASK-CQ-FE-09 — cobre o builder de mensagem/link
// de WhatsApp (AM-06): fidelidade da mensagem (EV-081), DDI 55 fixo,
// resolução de contato (provider vs. `contactOverride`/vendedor) e os 2
// erro tipado (`missing-provider`; número vazio não bloqueia, PQ10). Ambiente `node`
// (default do `vitest.config.ts`) — util 100% puro, sem `window`.
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import {
  buildRequestQuotationPublicFormUrl,
  buildRequestQuotationWhatsAppLink,
  buildRequestQuotationWhatsAppMessage,
  resolveRequestQuotationWhatsAppContact,
} from './requestQuotationWhatsApp';

const text = languagePtBr.BR.requestQuotations.requestQuotation.whatsApp;

const purchase = {
  code: 'SOL-0001',
  description: 'Compra de insumos para a safra',
  farmDescription: 'Fazenda Boa Vista',
};

describe('resolveRequestQuotationWhatsAppContact', () => {
  it('resolve o contato principal do fornecedor quando não há override', () => {
    const contact = resolveRequestQuotationWhatsAppContact({
      provider: { uuid: 'p-1', name: 'Fornecedor & Cia', email: null, cellphone: '11988887777' },
    });

    expect(contact).toEqual({ name: 'Fornecedor & Cia', phone: '11988887777', email: null });
  });

  it('prioriza o contactOverride (vendedor específico) quando fornecido', () => {
    const contact = resolveRequestQuotationWhatsAppContact(
      { provider: { uuid: 'p-1', name: 'Fornecedor', email: null, cellphone: '11988887777' } },
      { name: 'Vendedor X', phone: '11999998888', email: 'v@x.com' }
    );

    expect(contact).toEqual({ name: 'Vendedor X', phone: '11999998888', email: 'v@x.com' });
  });

  it('devolve null quando não há provider nem override (mirror IG-10)', () => {
    expect(resolveRequestQuotationWhatsAppContact({ provider: undefined })).toBeNull();
  });
});

describe('buildRequestQuotationPublicFormUrl', () => {
  it('monta a URL do formulário público a partir do hash (Opção 1, gate 6.1)', () => {
    const url = buildRequestQuotationPublicFormUrl('abc123hash', 'https://app.gbcerne.com.br');

    expect(url).toBe('https://app.gbcerne.com.br/orcamento/abc123hash');
  });
});

describe('buildRequestQuotationWhatsAppMessage — fidelidade EV-081', () => {
  it('reproduz título, fazenda, código, descrição, fornecedor, convite, assinatura e link', () => {
    const message = buildRequestQuotationWhatsAppMessage(
      {
        contactName: 'Fornecedor Exemplo',
        creatorName: 'Maria Solicitante',
        purchase,
        formUrl: 'https://app.gbcerne.com.br/orcamento/abc123hash',
      },
      text
    );

    expect(message).toContain('*Solicitação de orçamento*');
    expect(message).toContain('```#Fazenda Fazenda Boa Vista# ```');
    expect(message).toContain('Código da solicitação: SOL-0001');
    expect(message).toContain('Descrição/Chamado:\nCompra de insumos para a safra');
    expect(message).toContain('```Fornecedor:\nFornecedor Exemplo```');
    expect(message).toContain('_Gostaríamos, através desse contato');
    expect(message).toContain('_Preencha as informações com atenção');
    expect(message).toContain('```Atenciosamente:```');
    expect(message).toContain('```Maria Solicitante```');
    expect(message).toContain(
      '*Link do formulário:*\nhttps://app.gbcerne.com.br/orcamento/abc123hash'
    );
  });

  it('remove "&" do nome do contato (str_replace do legado, EV-081)', () => {
    const message = buildRequestQuotationWhatsAppMessage(
      {
        contactName: 'Fornecedor & Cia',
        creatorName: null,
        purchase,
        formUrl: 'https://app.gbcerne.com.br/orcamento/abc123hash',
      },
      text
    );

    // `str_replace('&', '', $name)` do legado remove só o caractere `&`,
    // preservando os espaços ao redor (mesmo resultado aqui: "Fornecedor  Cia").
    expect(message).toContain('```Fornecedor:\nFornecedor  Cia```');
    expect(message).not.toContain('&');
  });

  it('inclui "O mesmo já está disponível no email {destinatário}." entre o convite e a instrução (PQ08)', () => {
    const message = buildRequestQuotationWhatsAppMessage(
      {
        contactName: 'Fornecedor Exemplo',
        contactEmail: 'forn@exemplo.com',
        creatorName: 'Maria Solicitante',
        purchase,
        formUrl: 'https://app.gbcerne.com.br/orcamento/abc123hash',
      },
      text
    );

    const invitation = message.indexOf('_Gostaríamos');
    const emailLine = message.indexOf('O mesmo já está disponível no email forn@exemplo.com.\n\n');
    const instruction = message.indexOf('_Preencha as informações');
    expect(invitation).toBeGreaterThan(-1);
    expect(emailLine).toBeGreaterThan(invitation);
    expect(instruction).toBeGreaterThan(emailLine);
  });

  it('omite a frase do e-mail quando o destinatário não tem e-mail (legado saía "no email .")', () => {
    const message = buildRequestQuotationWhatsAppMessage(
      {
        contactName: 'Fornecedor Exemplo',
        contactEmail: null,
        creatorName: 'Maria Solicitante',
        purchase,
        formUrl: 'https://app.gbcerne.com.br/orcamento/abc123hash',
      },
      text
    );

    expect(message).not.toMatch(/email/i);
  });

  it('texto completo na ordem literal do legado (RQC:355-366)', () => {
    const message = buildRequestQuotationWhatsAppMessage(
      {
        contactName: 'Vendedor X',
        contactEmail: 'v@x.com',
        creatorName: 'Maria Solicitante',
        purchase,
        formUrl: 'https://app.gbcerne.com.br/orcamento/abc123hash',
      },
      text
    );

    expect(message).toBe(
      '*Solicitação de orçamento*\n' +
        '```#Fazenda Fazenda Boa Vista# ```\n' +
        'Código da solicitação: SOL-0001\n\n' +
        'Descrição/Chamado:\nCompra de insumos para a safra\n\n' +
        '```Fornecedor:\nVendedor X```\n\n' +
        '_Gostaríamos, através desse contato, solicitar o orçamento dos itens listados no formulário que está disponível no link que se encontra no final desta mensagem._\n\n' +
        'O mesmo já está disponível no email v@x.com.\n\n' +
        '_Preencha as informações com atenção, o formulário poderá ser enviado apenas uma vez._\n\n' +
        '```Atenciosamente:```\n' +
        '```Maria Solicitante```\n\n' +
        '*Link do formulário:*\nhttps://app.gbcerne.com.br/orcamento/abc123hash\n\n'
    );
  });
});

describe('buildRequestQuotationWhatsAppLink', () => {
  const formUrl = 'https://app.gbcerne.com.br/orcamento/abc123hash';

  it('monta o link api.whatsapp.com com DDI 55 + só dígitos do telefone (PQ09)', () => {
    const outcome = buildRequestQuotationWhatsAppLink(
      {
        provider: {
          uuid: 'p-1',
          name: 'Fornecedor Exemplo',
          email: null,
          cellphone: '(11)98888-7777',
        },
        user: { uuid: 'u-1', name: 'Maria Solicitante' },
      },
      purchase,
      formUrl,
      text
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(
        outcome.url.startsWith('https://api.whatsapp.com/send?phone=5511988887777&text=')
      ).toBe(true);
      expect(decodeURIComponent(outcome.url.split('&text=')[1])).toContain(
        '*Solicitação de orçamento*'
      );
    }
  });

  it('erro "missing-provider" quando a cotação não tem provider nem override', () => {
    const outcome = buildRequestQuotationWhatsAppLink(
      { provider: undefined, user: { uuid: 'u-1', name: 'Maria Solicitante' } },
      purchase,
      formUrl,
      text
    );

    expect(outcome).toEqual({ ok: false, error: 'missing-provider' });
  });

  it('usa o celular e, sem ele, o telefone da pessoa (PQ10: cellphone ?? phone)', () => {
    const base = { uuid: 'p-1', name: 'Fornecedor Exemplo', email: null };
    const user = { uuid: 'u-1', name: 'Maria Solicitante' };

    const withCell = buildRequestQuotationWhatsAppLink(
      { provider: { ...base, cellphone: '11911112222', phone: '1133334444' }, user },
      purchase,
      formUrl,
      text
    );
    const withoutCell = buildRequestQuotationWhatsAppLink(
      { provider: { ...base, cellphone: null, phone: '(11) 3333-4444' }, user },
      purchase,
      formUrl,
      text
    );

    expect(withCell.ok && withCell.url).toContain('phone=5511911112222&');
    expect(withoutCell.ok && withoutCell.url).toContain('phone=551133334444&');
  });

  it('número vazio NÃO bloqueia: abre o WhatsApp sem destino, como o legado (PQ10)', () => {
    const outcome = buildRequestQuotationWhatsAppLink(
      {
        provider: { uuid: 'p-1', name: 'Fornecedor Exemplo', email: null, cellphone: null },
        user: { uuid: 'u-1', name: 'Maria Solicitante' },
      },
      purchase,
      formUrl,
      text
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.url.startsWith('https://api.whatsapp.com/send?phone=55&text=')).toBe(true);
    }
  });

  it('usa o contactOverride (vendedor) em vez do provider quando fornecido', () => {
    const outcome = buildRequestQuotationWhatsAppLink(
      {
        provider: {
          uuid: 'p-1',
          name: 'Fornecedor Exemplo',
          email: null,
          cellphone: '11988887777',
        },
        user: { uuid: 'u-1', name: 'Maria Solicitante' },
      },
      purchase,
      formUrl,
      text,
      { name: 'Vendedor X', phone: '11999998888', email: 'v@x.com' }
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(
        outcome.url.startsWith('https://api.whatsapp.com/send?phone=5511999998888&text=')
      ).toBe(true);
      expect(decodeURIComponent(outcome.url)).toContain('Vendedor X');
      expect(decodeURIComponent(outcome.url)).toContain('email v@x.com.');
    }
  });
});
