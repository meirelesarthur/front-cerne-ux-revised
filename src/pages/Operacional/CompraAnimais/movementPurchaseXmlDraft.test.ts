// @vitest-environment jsdom
// 088 D4-FE-T1 — aplicação do draft do XML ao form da Compra (função pura):
// duplicatas irregulares como vieram, sem duplicata, defaults do título,
// Classificação, fornecedor de outro tipo, avisos, total ≠ Σ duplicatas e
// reescala por mudança de total mantendo as datas.
import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { movementPurchaseSchema } from '@/validations/schemas/MovementPurchases/movement-purchase-schema';

import type { MovementPurchaseXmlDraft } from '@/services/v2/MovementPurchases/movement-purchase-service';

import {
  applyRecalculationToRows,
  captureFinancialBaseline,
  type AllocationBaselineRow,
} from './movementPurchaseFinancialBaseline';
import { recalculateForTotal, toCents } from './movementPurchaseFinancialMath';
import {
  buildMovementPurchaseXmlApplication,
  resolveXmlWarningMessage,
} from './movementPurchaseXmlDraft';

const lang = languagePtBr.BR;
const xmlText = lang.movementPurchases.movementPurchase.form.xmlImport;

const CURRENT = {
  code: '000001',
  seller_uuid: null,
  type_payment: { label: 'x', value: '01' },
  gtas: 'GTA-1',
  other_values: 0,
};

function draft(overrides: Partial<MovementPurchaseXmlDraft> = {}): MovementPurchaseXmlDraft {
  return {
    number: '142',
    serie: '1',
    dt_sale: '2026-10-01',
    chave: '3'.repeat(44),
    note: 'infCpl do XML',
    provider: {
      uuid: 'prov-1',
      matched: true,
      nif: '123',
      name: 'Fornecedor XML',
      type: 1,
      is_enabled: true,
      created: false,
    },
    total_products: 900,
    freight: 100,
    discount: 0,
    total: 1000,
    items: [
      { category_uuid: null, description: 'Boi gordo', quantity: 10, value_unit: 90, amount: 900 },
    ],
    installments: [
      { number: '001', due_date: '2026-11-01', amount: 500 },
      { number: '002', due_date: '2026-12-15', amount: 300 },
      { number: '003', due_date: '2027-01-02', amount: 200 },
    ],
    interval_days: 44,
    financial_defaults: {
      number: '142',
      type_title: { uuid: 'tt-4', description: 'Compra de animais' },
      proprietary: null,
      note: 'infCpl do XML',
      fiscal_document: true,
      classification: 'N',
      has_input: false,
    },
    warnings: [],
    ...overrides,
  };
}

describe('buildMovementPurchaseXmlApplication', () => {
  it('duplicatas irregulares são aplicadas COMO VIERAM (sem regenerar), origin=xml', () => {
    const { values } = buildMovementPurchaseXmlApplication(draft(), CURRENT, '2026-10-03');
    expect(values.financial_installments).toEqual([
      { due_date: '2026-11-01', amount: 500, origin: 'xml' },
      { due_date: '2026-12-15', amount: 300, origin: 'xml' },
      { due_date: '2027-01-02', amount: 200, origin: 'xml' },
    ]);
    expect(values.generator).toEqual({ count: 3, first_due_date: '2026-11-01', interval_days: 44 });
  });

  it('sem duplicata (1 parcela = vNF): interval 0', () => {
    const { values } = buildMovementPurchaseXmlApplication(
      draft({
        installments: [{ number: '001', due_date: '2026-10-01', amount: 1000 }],
        interval_days: 0,
      }),
      CURRENT,
      '2026-10-03'
    );
    expect(values.financial_installments).toHaveLength(1);
    expect(values.generator).toEqual({ count: 1, first_due_date: '2026-10-01', interval_days: 0 });
  });

  it('defaults: financeiro Sim, entrada Não, nº = nNF, tipo do draft, dedutível Sim, Classificação N', () => {
    const { values } = buildMovementPurchaseXmlApplication(draft(), CURRENT, '2026-10-03');
    expect(values.has_financial).toBe(true);
    expect(values.financial_has_input).toBe(false);
    expect(values.financial_input_date).toBeNull();
    expect(values.financial_input_value).toBeNull();
    expect(values.financial_number).toBe('142');
    expect(values.financial_type_title).toEqual({ label: 'Compra de animais', value: 'tt-4' });
    expect(values.financial_proprietary).toBeNull();
    expect(values.financial_note).toBe('infCpl do XML');
    expect(values.financial_fiscal_document).toBe(true);
    expect(values.financial_classification).toBe('N');
    expect(values.financial_write_off).toBe(false);
  });

  it('tipo de título ausente no draft: campo vazio (usuário escolhe)', () => {
    const d = draft();
    d.financial_defaults!.type_title = null;
    const { values } = buildMovementPurchaseXmlApplication(d, CURRENT, '2026-10-03');
    expect(values.financial_type_title).toBeNull();
  });

  it('rateio começa com 1 linha com o total; categoria/conta/centro vazios', () => {
    const { values } = buildMovementPurchaseXmlApplication(draft(), CURRENT, '2026-10-03');
    expect(values.financial_allocations).toEqual([
      { category: null, plan_account: null, center: null, percent: 100, value: 1000 },
    ]);
  });

  it('fornecedor de OUTRO tipo (type=5) vem selecionado com uuid + nome; avisos repassados', () => {
    const warnings = [
      { code: 'PROVIDER_TYPE_MISMATCH', message: 'mismatch da API' },
      { code: 'CITY_NOT_FOUND', message: 'cidade da API' },
    ];
    const d = draft({ warnings });
    d.provider = { ...d.provider, type: 5, uuid: 'prov-5', name: 'Outro Tipo' };
    const result = buildMovementPurchaseXmlApplication(d, CURRENT, '2026-10-03');
    expect(result.values.provider_uuid).toEqual({ label: 'Outro Tipo', value: 'prov-5' });
    expect(result.warnings).toEqual(warnings);
  });

  it('avisos: texto i18n por code; código desconhecido cai na message da API', () => {
    expect(
      resolveXmlWarningMessage({ code: 'CITY_NOT_FOUND', message: 'x' }, xmlText.warnings)
    ).toBe(xmlText.warnings.CITY_NOT_FOUND);
    expect(
      resolveXmlWarningMessage({ code: 'PROVIDER_TYPE_MISMATCH', message: 'x' }, xmlText.warnings)
    ).toBe(xmlText.warnings.PROVIDER_TYPE_MISMATCH);
    expect(resolveXmlWarningMessage({ code: 'NOVO', message: 'da API' }, xmlText.warnings)).toBe(
      'da API'
    );
    // Códigos removidos (decisões P-3/P-4/P-6) não têm texto próprio.
    expect(xmlText.warnings).not.toHaveProperty('TOTAL_DIVERGES_VNF');
    expect(xmlText.warnings).not.toHaveProperty('PROVIDER_DISABLED');
    expect(xmlText.warnings).not.toHaveProperty('QUANTITY_TRUNCATED');
  });

  it('outros valores NÃO é tocado (IPI/seguro/outros do XML são ignorados, igual ao legado)', () => {
    const d = draft({
      xml_totals: { vProd: 900, vFrete: 100, vDesc: 0, vSeg: 0, vIPI: 50, vOutro: 0, vNF: 1050 },
    });
    const { values } = buildMovementPurchaseXmlApplication(d, CURRENT, '2026-10-03');
    expect(values.other_values).toBe(0);
  });

  it('preserva campos da tela que o XML não define (código, vendedor, tipo de pgto, GTA)', () => {
    const { values } = buildMovementPurchaseXmlApplication(draft(), CURRENT, '2026-10-03');
    expect(values.code).toBe('000001');
    expect(values.gtas).toBe('GTA-1');
    expect(values.type_payment).toEqual(CURRENT.type_payment);
    expect(values.chave).toBe('3'.repeat(44));
    expect(values.items[0].item_description).toBe('Boi gordo');
  });
});

describe('total da tela ≠ Σ duplicatas e reescala por mudança de total', () => {
  it('Σ duplicatas ≠ total da tela (IPI): o schema barra o submit com a mensagem de soma', async () => {
    const d = draft({
      installments: [{ number: '001', due_date: '2026-11-01', amount: 1050 }],
      interval_days: 0,
    }); // total da tela = 900 + 100 = 1000; duplicata = 1050
    const { values } = buildMovementPurchaseXmlApplication(d, CURRENT, '2026-10-03');
    await expect(
      movementPurchaseSchema(lang).validate(
        { ...values, total: 1000, total_products: 900 },
        { abortEarly: false }
      )
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'financial_installments',
          message: expect.stringMatching(/1\.050,00/),
        }),
        // categoria/conta/centro do rateio e categoria do item são escolha do usuário.
        expect.objectContaining({ path: 'financial_allocations[0].category' }),
        expect.objectContaining({ path: 'financial_allocations[0].center' }),
      ]),
    });
  });

  it('mudar o total depois: reescala as duplicatas mantendo as datas (resíduo na última)', () => {
    const { values } = buildMovementPurchaseXmlApplication(draft(), CURRENT, '2026-10-03');
    const baseline = captureFinancialBaseline(
      {
        financial_installments: values.financial_installments,
        financial_allocations: values.financial_allocations,
        generator: values.generator,
      },
      toCents(1000)
    );
    expect(baseline.generatedUntouched).toBe(false);

    const result = recalculateForTotal<AllocationBaselineRow>(baseline, toCents(1100), null);
    const applied = applyRecalculationToRows(result, {
      financial_installments: values.financial_installments,
      financial_allocations: values.financial_allocations,
    });
    expect(applied.applyInstallments).toBe(true);
    expect(applied.installments.map((row) => row.due_date)).toEqual([
      '2026-11-01',
      '2026-12-15',
      '2027-01-02',
    ]);
    const sum = applied.installments.reduce((acc, row) => acc + toCents(row.amount), 0);
    expect(sum).toBe(toCents(1100));
    expect(applied.allocations[0].value).toBe(1100);
  });
});
