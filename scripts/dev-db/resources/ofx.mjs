// Importação OFX + conciliação — dados SINTÉTICOS e COM ESTADO em memória (o dump não tem
// importações OFX). Serve para testar a tela de conciliação ponta a ponta: o POST de
// "aplicar" concilia as linhas já casadas e o PATCH "unreconcile" desfaz.
import { pageMeta, paging } from '../lib/http.mjs';

const OFX_UUID = 'f0000020-0000-4000-8000-000000000001';
const ACCOUNT = {
  uuid: 'f0000021-0000-4000-8000-000000000001',
  code: '001',
  description: 'Conta Livro Caixa PF',
  bank: 'Banco do Brasil S.A.',
  investment_account: { uuid: 'f0000021-0000-4000-8000-000000000002', description: 'Poupança Aplicação — BB 4412-8' },
};

const mv = (n) => `f0000022-0000-4000-8000-${String(n).padStart(12, '0')}`;

// matched: casada com movimento existente (valor+data+tipo); reconciled: já aplicada.
const items = [
  { fit_id: 'F001', date: '2026-10-01', value: 5000, type: 'E', memo: 'TED RECEBIDA - CLIENTE TESTE LTDA', classification: 'COMMON', matched_movement_uuid: mv(1), reconciled: false },
  { fit_id: 'F002', date: '2026-10-03', value: 1250.75, type: 'S', memo: 'PAGTO BOLETO - FORNECEDOR TESTE SA', classification: 'COMMON', matched_movement_uuid: mv(2), reconciled: false },
  { fit_id: 'F003', date: '2026-10-05', value: 89.9, type: 'S', memo: 'TARIFA PACOTE DE SERVICOS', classification: 'COMMON', matched_movement_uuid: null, reconciled: false },
  { fit_id: 'F004', date: '2026-10-07', value: 12430, type: 'E', memo: 'PIX RECEBIDO - COOPERATIVA AGRO VALE', classification: 'COMMON', matched_movement_uuid: mv(4), reconciled: false },
  { fit_id: 'F005', date: '2026-10-08', value: 2310.4, type: 'S', memo: 'POSTO IPIRANGA JATAI COMBUSTIVEL', classification: 'COMMON', matched_movement_uuid: null, reconciled: false },
  { fit_id: 'F006', date: '2026-10-09', value: 10000, type: 'S', memo: 'APLICACAO FINANCEIRA POUPANCA', classification: 'INVESTMENT', matched_movement_uuid: null, reconciled: false },
  { fit_id: 'F007', date: '2026-10-10', value: 3875.2, type: 'S', memo: 'PAGTO BOLETO - AGROVET INSUMOS', classification: 'COMMON', matched_movement_uuid: null, reconciled: false },
  { fit_id: 'F008', date: '2026-10-12', value: 1500, type: 'E', memo: 'DEP DINHEIRO ATM', classification: 'COMMON', matched_movement_uuid: mv(8), reconciled: true },
];

const result = () => {
  const reconciled = items.filter((i) => i.reconciled).length;
  return {
    account: ACCOUNT,
    items,
    total_items: items.length,
    reconciled_count: reconciled,
    progress_percent: Math.round((reconciled / items.length) * 100),
    pending_investments: items.filter((i) => i.classification === 'INVESTMENT' && !i.matched_movement_uuid),
  };
};

const detail = () => ({
  uuid: OFX_UUID,
  code: 'OFX-0007',
  description: 'Extrato outubro/2026 — BB Livro Caixa',
  account: { uuid: ACCOUNT.uuid, code: ACCOUNT.code, description: ACCOUNT.description, bank: ACCOUNT.bank },
  start_date: '2026-10-01',
  end_date: '2026-10-12',
  created_at: '2026-10-13T09:00:00.000Z',
  updated_at: '2026-10-13T09:00:00.000Z',
  attachments: [],
});

export const ofxRoutes = [
  {
    method: 'get',
    pattern: /^\/ofx-imports$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const { attachments, ...row } = detail();
      return { body: [row], meta: pageMeta(p, 1) };
    },
  },
  { method: 'get', pattern: /^\/ofx-imports\/report$/, handler: async () => ({ body: [], meta: null }) },
  { method: 'get', pattern: /^\/ofx-imports\/([\w-]+)\/reconciliation$/, handler: async () => ({ body: result() }) },
  {
    method: 'post',
    pattern: /^\/ofx-imports\/([\w-]+)\/reconciliation$/,
    handler: async () => {
      for (const i of items) if (i.matched_movement_uuid && !i.reconciled) i.reconciled = true;
      return { body: result() };
    },
  },
  { method: 'get', pattern: /^\/ofx-imports\/([\w-]+)$/, handler: async () => ({ body: detail() }) },
  {
    method: 'patch',
    pattern: /^\/movements\/([\w-]+)\/unreconcile$/,
    handler: async ({ match }) => {
      const item = items.find((i) => i.matched_movement_uuid === match[1]);
      if (item) item.reconciled = false;
      return { body: { uuid: match[1], is_reconciled: false } };
    },
  },
];
