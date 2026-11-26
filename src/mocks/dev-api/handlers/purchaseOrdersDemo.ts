// -----------------------------------------------------------------------------
// DEV MOCKS — Ordens de compra de DEMONSTRAÇÃO (protótipo visual, 25/11/2026).
//
// Conjunto fixo e coerente de ordens de fazenda (fertilizante, semente, diesel,
// peças, serviço, frete…) para apresentar o fluxo antes da API. Substitui os
// dados gerados automaticamente só nas rotas da Ordem de compra; o resto segue
// no mock sintético. Ligado por `PURCHASE_ORDER_PROTOTYPE`
// (`config/v2/purchaseOrderPrototype.ts`). Todos os nomes são fictícios.
//
// Rotas: listas das 9 visões da tela única (`/request-purchases`, `?scope=all`,
// `my-processes`, `rejected`, `in-quotation`, `in-purchase`,
// `/request-authorizations`, `/request-receipts`), o detalhe
// (`/request-purchases/{uuid}`) e as cotações (`/request-purchases/{uuid}/quotations`).
// Campos que a API ainda não tem (`flow_profile`, `winning_provider`, `buyer`,
// `cancelled_at_step`) vêm junto, para o protótipo (ver `purchaseOrderSteps.ts`).
// -----------------------------------------------------------------------------

import type { MockRoute } from '../index';

const ME = { uuid: '00000000-0000-4000-8000-0000000000aa', name: 'Usuário UX (dev)' };
const ANA = { uuid: 'demo-user-ana', name: 'Ana Paula Ribeiro' };
const JOAO = { uuid: 'demo-user-joao', name: 'João Batista Lima' };
const CARLOS = { uuid: 'demo-user-carlos', name: 'Carlos Menezes' };
const MARINA = { uuid: 'demo-user-marina', name: 'Marina Duarte' };

const SANTA_RITA = { uuid: '00000000-0000-4000-8000-000000000001', description: 'Fazenda Santa Rita' };
const BOA_VISTA = { uuid: 'demo-farm-boa-vista', description: 'Fazenda Boa Vista' };

const PROVIDERS = {
  agronutri: { uuid: 'demo-prov-agronutri', name: 'AgroNutri Insumos Ltda', email: 'vendas@agronutri.test', cellphone: '(34) 99812-4410' },
  campoforte: { uuid: 'demo-prov-campoforte', name: 'Campo Forte Fertilizantes', email: 'comercial@campoforte.test', cellphone: '(34) 99730-2215' },
  cerrado: { uuid: 'demo-prov-cerrado', name: 'Cerrado Agro Comércio', email: 'pedidos@cerradoagro.test', cellphone: '(64) 99654-8832' },
  sementesbrasil: { uuid: 'demo-prov-sementes', name: 'Sementes Brasil Central', email: 'vendas@sementesbc.test', cellphone: '(62) 99421-7790' },
  postoestrada: { uuid: 'demo-prov-posto', name: 'Posto Estrada Real', email: 'faturamento@postoestrada.test', cellphone: '(34) 99118-3301' },
  tratormaq: { uuid: 'demo-prov-tratormaq', name: 'TratorMaq Peças Agrícolas', email: 'pecas@tratormaq.test', cellphone: '(34) 99265-0042' },
};

const STATUS_LABEL: Record<number, string> = {
  1: 'Solicitação',
  2: 'Cotação em Andamento',
  3: 'Aguardando Aprovação',
  4: 'Aguardando Ciência',
  5: 'Pedido Não Aprovado',
  6: 'Aguardando a Compra',
  7: 'Compra Efetuada',
  8: 'Compra Recebida',
  9: 'Pedido Finalizado',
  10: 'Pedido Cancelado',
  11: 'Analisar Processo',
};

const TYPE_LABEL: Record<string, string> = {
  P: 'Produto',
  S: 'Serviço',
  A: 'Adiantamento',
  R: 'Reembolso',
  D: 'Diária',
  C: 'Empreitada',
  F: 'Compra Efetuada',
  E: 'Frete',
  M: 'Manutenção',
  U: 'Emergencial',
  B: 'Despesas Fixas',
};

const PRIORITY_LABEL: Record<number, string> = { 0: 'Alta', 1: 'Média', 2: 'Baixa' };

interface DemoItem {
  description: string;
  quantity: number | null;
  amount: number;
  product?: string;
  /** Quantidade já recebida (padrão: tudo se a ordem foi recebida, senão 0). */
  received?: number;
  cancelled?: boolean;
}

interface DemoPayment {
  condition: string;
  installments: { seq: number; due_date: string; value: number; status: 'open' | 'paid' }[];
  expenses: { freight: number; insurance: number; other: number };
}

interface DemoInvoice {
  uuid: string;
  issuer: string;
  number: string;
  series: string;
  issued_at: string;
  entered_at: string;
  value: number;
}

interface DemoDelivery {
  freight_type: 'CIF' | 'FOB';
  place: string;
  carrier?: string;
  needs_unloading: boolean;
  note?: string;
}

interface DemoMovement {
  status: number;
  user: { uuid: string; name: string };
  at: string;
  elapsed: string;
  justify?: string;
}

interface DemoQuotation {
  provider: keyof typeof PROVIDERS;
  status: 1 | 2 | 3;
  total: number;
  discount?: number;
  date?: string;
}

interface DemoOrder {
  n: number;
  /** Previsão de entrega da ORDEM (fornecedor único ⇒ uma data só), 26/11/2026. */
  forecast?: string;
  code: string;
  type: string;
  status: number;
  priority: number;
  date: string;
  description: string;
  justification: string;
  observation?: string;
  user: { uuid: string; name: string };
  responsible: { uuid: string; name: string };
  farm: { uuid: string; description: string };
  duration: string;
  items: DemoItem[];
  movements: DemoMovement[];
  quotations?: DemoQuotation[];
  authorizer?: { uuid: string; name: string };
  authorizationDate?: string;
  finalJustification?: string;
  classification?: 'N' | 'C' | 'O';
  dueDate?: string;
  nfe?: string;
  profile?: 'simples' | 'padrao' | 'completo';
  winner?: keyof typeof PROVIDERS;
  buyer?: { uuid: string; name: string };
  cancelledAt?: 'pedido' | 'cotacao' | 'aprovacao' | 'compra' | 'recebimento';
  ratio?: { category: string; center: string; percent: number }[];
  delivery?: DemoDelivery;
  approvals?: DemoApproval[];
  /** Número da ordem de origem (ordem separada/derivada). */
  parent?: number;
  payment?: DemoPayment;
  invoices?: DemoInvoice[];
  /** Situação antes de cancelar/encerrar (para "Reabrir"). */
  previousStatus?: number;
  /** Protótipo (26/11): Ordens de compra geradas por esta Solicitação, uma por fornecedor. */
  generated?: {
    provider: keyof typeof PROVIDERS;
    items: { index: number; quantity: number }[];
    /** Previsão de entrega da ordem (definida na tela da Ordem). */
    forecast?: string;
    date?: string;
    /** Situação da ordem (padrão 6, Aguardando a Compra). */
    status?: number;
  }[];
}

const installments = (values: number[], firstDue: string, stepDays: number, paid = 0) =>
  values.map((value, index) => {
    const due = new Date(`${firstDue}T12:00:00`);
    due.setDate(due.getDate() + index * stepDays);
    return { seq: index + 1, due_date: due.toISOString().slice(0, 10), value, status: index < paid ? ('paid' as const) : ('open' as const) };
  });

interface DemoApproval {
  level: number;
  label: string;
  user: { uuid: string; name: string };
  status: 'approved' | 'rejected' | 'pending';
  at?: string;
  note?: string;
}

const LEVEL_1 = 'Encarregado';
const LEVEL_2 = 'Diretoria — acima de R$ 100.000';
const LEVEL_SCIENCE = 'Ciência da diretoria — serviços acima de R$ 50.000';

// A ordem do roteiro é a 0012 (fertilizante, compra efetuada, recebimento em 2 cargas).
const ORDERS: DemoOrder[] = [
  {
    n: 12,
    code: '0012',
    type: 'P',
    status: 7,
    priority: 0,
    date: '2026-11-03',
    description: 'Adubação de plantio — soja safra 26/27',
    justification: 'Plantio começa em 05/12; o estoque cobre só 30% da área.',
    observation: 'Entrega em duas cargas, na sede da Santa Rita.',
    user: ANA,
    responsible: ME,
    farm: SANTA_RITA,
    duration: '22d 4h',
    forecast: '2026-11-28',
    // 26/11: esta Solicitação já gerou a sua Ordem (AgroNutri, compra efetuada).
    generated: [
      {
        provider: 'agronutri',
        items: [
          { index: 0, quantity: 40 },
          { index: 1, quantity: 12 },
        ],
        forecast: '2026-11-28',
        date: '2026-11-10',
        status: 7,
      },
    ],
    items: [
      { description: 'Fertilizante NPK 20-05-20 (t)', quantity: 40, amount: 138000, product: 'NPK 20-05-20' },
      { description: 'Ureia agrícola 45% N (t)', quantity: 12, amount: 46680, product: 'Ureia 45%' },
    ],
    movements: [
      { status: 1, user: ANA, at: '2026-11-03T08:12:00', elapsed: '2h' },
      { status: 2, user: CARLOS, at: '2026-11-03T10:30:00', elapsed: '4d 3h', justify: 'Cotação com 3 fornecedores da região.' },
      { status: 3, user: CARLOS, at: '2026-11-07T14:05:00', elapsed: '1d 2h' },
      { status: 6, user: JOAO, at: '2026-11-08T16:40:00', elapsed: '3d', justify: 'Aprovado: menor valor final e prazo de entrega antes do plantio.' },
      { status: 7, user: CARLOS, at: '2026-11-11T09:15:00', elapsed: '14d 4h', justify: 'Pedido confirmado com a AgroNutri.' },
    ],
    quotations: [
      { provider: 'agronutri', status: 3, total: 189900, discount: 5220, date: '2026-11-05T11:00:00' },
      { provider: 'campoforte', status: 3, total: 192400, discount: 2400, date: '2026-11-06T09:20:00' },
      { provider: 'cerrado', status: 3, total: 197850, discount: 0, date: '2026-11-06T15:45:00' },
    ],
    authorizer: JOAO,
    authorizationDate: '2026-11-08',
    finalJustification: 'Aprovado: menor valor final e prazo de entrega antes do plantio.',
    classification: 'O',
    dueDate: '2026-12-15',
    profile: 'padrao',
    winner: 'agronutri',
    buyer: CARLOS,
    approvals: [
      { level: 1, label: LEVEL_1, user: JOAO, status: 'approved', at: '2026-11-08T15:10:00', note: 'Menor valor final e entrega antes do plantio.' },
      { level: 2, label: LEVEL_2, user: MARINA, status: 'approved', at: '2026-11-08T16:35:00', note: 'Dentro do orçamento de insumos da safra 26/27.' },
    ],
    ratio: [
      { category: 'Insumos agrícolas', center: 'Soja — Santa Rita', percent: 100 },
    ],
    payment: {
      condition: '30/60/90 dias da entrega',
      installments: installments([61560, 61560, 61560], '2026-12-15', 30),
      expenses: { freight: 0, insurance: 0, other: 0 },
    },
    delivery: {
      freight_type: 'CIF',
      place: 'Fazenda Santa Rita — armazém de insumos',
      carrier: 'Transportes Rio Grande',
      needs_unloading: true,
      note: 'Duas cargas; descarga com 2 chapas e pá carregadeira.',
    },
  },
  {
    n: 13,
    code: '0013',
    type: 'P',
    status: 3,
    priority: 0,
    date: '2026-11-18',
    description: 'Semente de soja — talhões 4 a 9',
    justification: 'Troca de cultivar indicada pelo agrônomo para áreas de reboleira.',
    user: ME,
    responsible: JOAO,
    farm: SANTA_RITA,
    duration: '7d 2h',
    forecast: '2026-12-02',
    items: [{ description: 'Semente soja TMG 7063 IPRO (sc 40 kg)', quantity: 320, amount: 108800, product: 'Soja TMG 7063' }],
    delivery: { freight_type: 'CIF', place: 'Fazenda Santa Rita — galpão de sementes', needs_unloading: true, note: 'Descarga com empilhadeira (big bags).' },
    movements: [
      { status: 1, user: ME, at: '2026-11-18T07:50:00', elapsed: '1h' },
      { status: 2, user: CARLOS, at: '2026-11-18T09:00:00', elapsed: '5d' },
      { status: 3, user: CARLOS, at: '2026-11-23T10:10:00', elapsed: '2d 2h' },
    ],
    quotations: [
      { provider: 'sementesbrasil', status: 3, total: 108800, discount: 3264, date: '2026-11-20T10:00:00' },
      { provider: 'cerrado', status: 3, total: 112000, discount: 0, date: '2026-11-21T16:00:00' },
    ],
    profile: 'padrao',
    winner: 'sementesbrasil',
    buyer: CARLOS,
    approvals: [
      { level: 1, label: LEVEL_1, user: JOAO, status: 'pending' },
      { level: 2, label: LEVEL_2, user: MARINA, status: 'pending' },
    ],
  },
  {
    n: 14,
    code: '0014',
    type: 'P',
    status: 2,
    priority: 1,
    date: '2026-11-21',
    description: 'Diesel S10 — abastecimento do plantio',
    justification: 'Consumo previsto de 18 mil litros entre dezembro e janeiro.',
    user: ANA,
    responsible: CARLOS,
    farm: BOA_VISTA,
    duration: '4d 6h',
    forecast: '2026-12-01',
    items: [{ description: 'Óleo diesel S10 (L)', quantity: 18000, amount: 112860, product: 'Diesel S10' }],
    delivery: { freight_type: 'CIF', place: 'Fazenda Boa Vista — tanque de combustível', carrier: 'Posto Estrada Real', needs_unloading: false },
    movements: [
      { status: 1, user: ANA, at: '2026-11-21T13:00:00', elapsed: '3h' },
      { status: 2, user: CARLOS, at: '2026-11-21T16:00:00', elapsed: '4d 3h' },
    ],
    quotations: [
      { provider: 'postoestrada', status: 3, total: 112860, discount: 900, date: '2026-11-24T08:00:00' },
      { provider: 'cerrado', status: 2, total: 0 },
      { provider: 'agronutri', status: 1, total: 0 },
    ],
    profile: 'padrao',
    buyer: CARLOS,
  },
  {
    n: 15,
    code: '0015',
    type: 'M',
    status: 1,
    priority: 0,
    date: '2026-11-25',
    description: 'Rolamento e retentor do cubo — trator JD 6125J',
    justification: 'Trator parado na Boa Vista desde ontem; plantio em 10 dias.',
    user: ME,
    responsible: ME,
    farm: BOA_VISTA,
    duration: '5h',
    forecast: '2026-11-27',
    items: [
      { description: 'Rolamento do cubo dianteiro', quantity: 2, amount: 1840, product: 'Rolamento 32212' },
      { description: 'Retentor do cubo', quantity: 2, amount: 310, product: 'Retentor JD' },
    ],
    delivery: { freight_type: 'FOB', place: 'Retirada na TratorMaq (Uberlândia)', needs_unloading: false, note: 'O motorista da fazenda retira no balcão.' },
    movements: [{ status: 1, user: ME, at: '2026-11-25T07:30:00', elapsed: '5h' }],
    profile: 'simples',
  },
  {
    n: 16,
    code: '0016',
    type: 'S',
    status: 6,
    priority: 1,
    date: '2026-11-10',
    description: 'Aplicação aérea de dessecante — 420 ha',
    justification: 'Dessecação pré-plantio; janela de chuva fecha em 20 dias.',
    user: MARINA,
    responsible: CARLOS,
    farm: SANTA_RITA,
    duration: '15d',
    forecast: '2026-11-22',
    items: [{ description: 'Aplicação aérea (ha)', quantity: 420, amount: 54600 }],
    movements: [
      { status: 1, user: MARINA, at: '2026-11-10T08:00:00', elapsed: '1d' },
      { status: 2, user: CARLOS, at: '2026-11-11T08:00:00', elapsed: '6d' },
      { status: 3, user: CARLOS, at: '2026-11-17T09:00:00', elapsed: '1d' },
      { status: 4, user: JOAO, at: '2026-11-18T09:00:00', elapsed: '2d' },
      { status: 6, user: ME, at: '2026-11-20T11:00:00', elapsed: '5d', justify: 'Ciência dada pela diretoria (valor acima da alçada).' },
    ],
    quotations: [
      { provider: 'cerrado', status: 3, total: 54600, discount: 1600, date: '2026-11-14T10:00:00' },
      { provider: 'agronutri', status: 3, total: 58800, discount: 0, date: '2026-11-15T10:00:00' },
    ],
    authorizer: JOAO,
    authorizationDate: '2026-11-18',
    finalJustification: 'Melhor preço por hectare e disponibilidade de aeronave.',
    profile: 'completo',
    winner: 'cerrado',
    buyer: CARLOS,
    payment: {
      condition: '28 dias após a aplicação',
      installments: installments([54600], '2026-12-20', 0),
      expenses: { freight: 0, insurance: 0, other: 0 },
    },
    approvals: [
      { level: 1, label: LEVEL_1, user: JOAO, status: 'approved', at: '2026-11-18T09:00:00', note: 'Melhor preço por hectare.' },
      { level: 2, label: LEVEL_SCIENCE, user: ME, status: 'approved', at: '2026-11-20T11:00:00', note: 'Ciente; janela de aplicação curta.' },
    ],
  },
  {
    n: 17,
    code: '0017',
    type: 'E',
    status: 9,
    priority: 2,
    date: '2026-10-02',
    description: 'Frete de milho — armazém Uberlândia',
    justification: 'Venda fechada para entrega em outubro.',
    user: ANA,
    responsible: ANA,
    farm: BOA_VISTA,
    duration: '18d',
    forecast: '2026-10-15',
    items: [{ description: 'Frete rodoviário (t)', quantity: 600, amount: 42000 }],
    delivery: { freight_type: 'FOB', place: 'Armazém Cerrado Grãos — Uberlândia', carrier: 'Transportes Rio Grande', needs_unloading: false },
    movements: [
      { status: 1, user: ANA, at: '2026-10-02T08:00:00', elapsed: '1d' },
      { status: 6, user: CARLOS, at: '2026-10-03T08:00:00', elapsed: '2d' },
      { status: 7, user: CARLOS, at: '2026-10-05T08:00:00', elapsed: '12d' },
      { status: 8, user: ANA, at: '2026-10-17T08:00:00', elapsed: '3d' },
      { status: 9, user: ANA, at: '2026-10-20T08:00:00', elapsed: '—', justify: 'Frete conferido com os tíquetes de balança.' },
    ],
    nfe: '000.482.117',
    profile: 'simples',
    buyer: CARLOS,
    payment: {
      condition: 'À vista na entrega',
      installments: installments([42000], '2026-10-17', 0, 1),
      expenses: { freight: 0, insurance: 0, other: 0 },
    },
    invoices: [
      { uuid: 'demo-nf-17-1', issuer: 'Transportes Rio Grande', number: '482117', series: '1', issued_at: '2026-10-16', entered_at: '2026-10-17', value: 42000 },
    ],
  },
  {
    n: 18,
    code: '0018',
    type: 'U',
    status: 5,
    priority: 0,
    date: '2026-11-14',
    description: 'Inseticida para lagarta — emergência talhão 12',
    justification: 'Infestação acima do nível de controle no milho safrinha.',
    user: ME,
    responsible: ME,
    farm: SANTA_RITA,
    duration: '3d',
    items: [{ description: 'Inseticida (L)', quantity: 120, amount: 21600, product: 'Inseticida lagarta' }],
    movements: [
      { status: 1, user: ME, at: '2026-11-14T07:00:00', elapsed: '2h' },
      { status: 3, user: CARLOS, at: '2026-11-14T09:00:00', elapsed: '3d' },
      { status: 5, user: JOAO, at: '2026-11-17T10:00:00', elapsed: '—', justify: 'Recusado: o agrônomo indicou controle biológico já em estoque.' },
    ],
    authorizer: JOAO,
    finalJustification: 'Recusado: o agrônomo indicou controle biológico já em estoque.',
    profile: 'padrao',
    buyer: CARLOS,
    approvals: [
      { level: 1, label: LEVEL_1, user: JOAO, status: 'rejected', at: '2026-11-17T10:00:00', note: 'O agrônomo indicou controle biológico já em estoque.' },
    ],
  },
  {
    n: 19,
    code: '0019',
    type: 'B',
    status: 10,
    priority: 2,
    date: '2026-11-01',
    description: 'Energia elétrica — pivôs 1 a 3 (novembro)',
    justification: 'Conta mensal da concessionária.',
    user: MARINA,
    responsible: MARINA,
    farm: SANTA_RITA,
    duration: '2d',
    items: [{ description: 'Energia elétrica (mês)', quantity: null, amount: 18400 }],
    movements: [
      { status: 1, user: MARINA, at: '2026-11-01T08:00:00', elapsed: '2d' },
      { status: 10, user: MARINA, at: '2026-11-03T08:00:00', elapsed: '—', justify: 'Cancelada: a conta passou para débito automático.' },
    ],
    profile: 'simples',
    cancelledAt: 'pedido',
  },
  {
    n: 20,
    code: '0020',
    type: 'A',
    status: 8,
    priority: 1,
    date: '2026-11-12',
    description: 'Adiantamento — equipe de colheita de café',
    justification: 'Pagamento semanal da equipe temporária.',
    user: ME,
    responsible: ANA,
    farm: BOA_VISTA,
    duration: '9d',
    forecast: '2026-11-15',
    items: [{ description: 'Adiantamento de mão de obra', quantity: null, amount: 9600 }],
    movements: [
      { status: 1, user: ME, at: '2026-11-12T08:00:00', elapsed: '1d' },
      { status: 7, user: CARLOS, at: '2026-11-13T08:00:00', elapsed: '5d' },
      { status: 8, user: ANA, at: '2026-11-18T08:00:00', elapsed: '3d' },
    ],
    profile: 'simples',
    buyer: CARLOS,
  },
  {
    n: 21,
    code: '0021',
    type: 'M',
    status: 4,
    priority: 1,
    date: '2026-11-19',
    description: 'Revisão do pivô central 2 — motorredutores',
    justification: 'Pivô para irrigação do feijão de inverno.',
    user: ME,
    responsible: JOAO,
    farm: SANTA_RITA,
    duration: '6d',
    forecast: '2026-11-24',
    items: [
      { description: 'Motorredutor 1,5 cv', quantity: 3, amount: 16500, product: 'Motorredutor pivô' },
      { description: 'Mão de obra de revisão', quantity: 1, amount: 4800 },
    ],
    delivery: { freight_type: 'CIF', place: 'Fazenda Santa Rita — pivô 2', carrier: 'TratorMaq Peças Agrícolas', needs_unloading: true, note: 'Instalação feita pelo técnico do fornecedor.' },
    movements: [
      { status: 1, user: ME, at: '2026-11-19T08:00:00', elapsed: '1d' },
      { status: 2, user: CARLOS, at: '2026-11-20T08:00:00', elapsed: '3d' },
      { status: 3, user: CARLOS, at: '2026-11-23T08:00:00', elapsed: '1d' },
      { status: 4, user: JOAO, at: '2026-11-24T08:00:00', elapsed: '1d 6h' },
    ],
    quotations: [
      { provider: 'tratormaq', status: 3, total: 21300, discount: 800, date: '2026-11-22T10:00:00' },
      { provider: 'cerrado', status: 3, total: 23950, discount: 0, date: '2026-11-22T15:00:00' },
    ],
    authorizer: JOAO,
    profile: 'completo',
    winner: 'tratormaq',
    buyer: CARLOS,
    payment: {
      condition: '30/60 dias',
      installments: installments([10825, 10825], '2026-12-24', 30),
      expenses: { freight: 350, insurance: 0, other: 0 },
    },
    approvals: [
      { level: 1, label: LEVEL_1, user: JOAO, status: 'approved', at: '2026-11-24T08:00:00', note: 'Pivô necessário para o feijão de inverno.' },
      { level: 2, label: LEVEL_SCIENCE, user: MARINA, status: 'pending' },
    ],
  },
  // Separada da 0013 (Vínculos: origem e derivada).
  {
    n: 22,
    code: '0022',
    type: 'P',
    status: 2,
    priority: 1,
    date: '2026-11-23',
    description: 'Semente de milho — talhão 12 (separada da 0013)',
    justification: 'Item de milho separado da solicitação de sementes de soja para cotar com outro fornecedor.',
    user: ME,
    responsible: CARLOS,
    farm: SANTA_RITA,
    duration: '2d',
    forecast: '2026-12-05',
    items: [{ description: 'Semente milho híbrido (sc 60 mil sementes)', quantity: 45, amount: 40500, product: 'Milho híbrido' }],
    movements: [
      { status: 1, user: ME, at: '2026-11-23T10:00:00', elapsed: '1h', justify: 'Separada da ordem 0013.' },
      { status: 2, user: CARLOS, at: '2026-11-23T11:00:00', elapsed: '2d' },
    ],
    quotations: [
      { provider: 'sementesbrasil', status: 2, total: 0 },
      { provider: 'cerrado', status: 3, total: 40500, discount: 500, date: '2026-11-24T14:00:00' },
    ],
    profile: 'padrao',
    buyer: CARLOS,
    parent: 13,
  },
];

const uuidOf = (n: number) => `0000d3e0-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Recebido do item (explícito ou, sem registro, tudo quando a ordem já foi recebida).
const receivedOf = (o: DemoOrder, item: DemoItem) =>
  item.received ?? ([8, 9].includes(o.status) ? item.quantity ?? 0 : 0);

// Recebida em parte: compra efetuada, algo recebido e ainda há saldo.
function isPartial(o: DemoOrder) {
  if (o.status !== 7) return false;
  const withQty = o.items.filter((item) => item.quantity !== null && !item.cancelled);
  const received = withQty.some((item) => receivedOf(o, item) > 0);
  const pending = withQty.some((item) => receivedOf(o, item) < (item.quantity ?? 0));
  return received && pending;
}

function listItem(o: DemoOrder) {
  return {
    uuid: uuidOf(o.n),
    code: o.code,
    type: o.type,
    type_label: TYPE_LABEL[o.type],
    status: o.status,
    // Protótipo: "Recebimento parcial" como rótulo da situação 7 com saldo.
    status_label: isPartial(o) ? 'Recebimento parcial' : STATUS_LABEL[o.status],
    receipt_partial: isPartial(o),
    priority: o.priority,
    priority_label: PRIORITY_LABEL[o.priority],
    request_date: o.date,
    justification: o.justification,
    description: o.description,
    duration_label: o.duration,
    user: o.user,
    farm: o.farm,
    responsible: o.responsible,
    quotations_count: o.quotations?.length ?? 0,
    received_quotations_count: o.quotations?.filter((q) => q.status === 3).length ?? 0,
    approved_quotations_count: o.winner ? 1 : 0,
    is_authorizer: o.authorizer?.uuid === ME.uuid,
    has_financial: o.status >= 7,
    nfe: o.nfe ?? null,
    updated_on: o.movements.at(-1)?.at ?? o.date,
    created_at: `${o.date}T08:00:00`,
    // Protótipo: campos que a API ainda não tem.
    flow_profile: o.profile ?? 'padrao',
    winning_provider: o.winner ? { uuid: PROVIDERS[o.winner].uuid, name: PROVIDERS[o.winner].name } : null,
    buyer: o.buyer ?? null,
    cancelled_at_step: o.cancelledAt,
    delivery_forecast: o.forecast ?? null,
  };
}

function detail(o: DemoOrder) {
  const children = ORDERS.filter((c) => c.parent === o.n);
  const parent = ORDERS.find((p) => p.n === o.parent);
  return {
    ...listItem(o),
    parent_uuid: parent ? uuidOf(parent.n) : null,
    parent: parent ? { uuid: uuidOf(parent.n), code: parent.code, justification: parent.justification } : null,
    children_uuids: children.map((c) => uuidOf(c.n)),
    // Protótipo: aprovações por nível de alçada.
    approvals: (o.approvals ?? []).map((a) => ({
      level: a.level,
      level_label: a.label,
      user: a.user,
      status: a.status,
      decided_at: a.at ?? null,
      note: a.note ?? null,
    })),
    observation: o.observation ?? null,
    authorization_date: o.authorizationDate ?? null,
    authorizer: o.authorizer ?? null,
    second_request_authorizer: o.authorizer ?? null,
    harvest: { uuid: 'demo-harvest-2627', description: 'Safra 26/27' },
    items: o.items.map((item, index) => ({
      uuid: `${uuidOf(o.n)}-i${index}`,
      product: item.product ? { uuid: `demo-prod-${o.n}-${index}`, description: item.product } : null,
      description: item.description,
      brand: null,
      observation: null,
      status: o.status >= 8 ? 'E' : 'P',
      status_label: o.status >= 8 ? 'Entregue' : 'Pendente',
      quantity: item.quantity,
      amount: item.amount,
      authorized_quantity: item.quantity,
      name: null,
      nif: null,
      phone: null,
      service_description: null,
      daily_quantity: null,
      delivery_date: null,
      forecast_delivery_date: null, // a previsão é da ordem (`delivery_forecast`), não do item
      is_authorized: o.status >= 6,
      // Protótipo: valor unitário e quantidade recebida (saldo = qtde − recebido).
      unit_price: item.quantity ? item.amount / item.quantity : item.amount,
      received_quantity: item.quantity === null ? null : receivedOf(o, item),
      cancelled: !!item.cancelled,
    })),
    payment: o.payment ?? null,
    invoices: o.invoices ?? [],
    delivery: o.delivery
      ? { ...o.delivery, carrier: o.delivery.carrier ?? null, note: o.delivery.note ?? null }
      : null,
    movements: o.movements.map((m, index) => ({
      uuid: `${uuidOf(o.n)}-m${index}`,
      status: m.status,
      status_label: STATUS_LABEL[m.status],
      justify: m.justify ?? null,
      user: m.user,
      elapsed_label: m.elapsed,
      created_at: m.at,
    })),
    attachments: [],
    available_status_transitions: [],
    updated_at: o.movements.at(-1)?.at ?? o.date,
    classification: o.classification ?? null,
    financial_due_date: o.dueDate ?? null,
    finalization_note: o.status === 9 ? 'Encerrada sem pendências.' : null,
    final_justification: o.finalJustification ?? null,
    receipt_date: o.status >= 8 ? o.movements.at(-1)?.at.slice(0, 10) ?? null : null,
    receipt_note: o.status >= 8 ? 'Recebido conforme pedido.' : null,
    ratio: (o.ratio ?? []).map((r, index) => ({
      category: { uuid: `demo-cat-${index}`, description: r.category },
      center: { uuid: `demo-center-${index}`, description: r.center },
      percent: r.percent,
    })),
    quotation_justification: null,
    children: children.map((c) => ({ uuid: uuidOf(c.n), code: c.code, justification: c.justification })),
    // Protótipo (26/11): Ordens de compra geradas por esta Solicitação e os fornecedores possíveis.
    generated_orders: (o.generated ?? []).map((g, index) => ({
      uuid: `${uuidOf(o.n)}-oc${index + 1}`,
      code: `OC-${o.code}-${index + 1}`,
      provider: { uuid: PROVIDERS[g.provider].uuid, name: PROVIDERS[g.provider].name },
      status_label: STATUS_LABEL[g.status ?? 6],
      delivery_forecast: g.forecast ?? null, // definida na tela da Ordem, com o fornecedor
      items: g.items.map((row) => ({ request_item_uuid: `${uuidOf(o.n)}-i${row.index}`, quantity: row.quantity })),
    })),
    provider_options: Object.values(PROVIDERS).map((p) => ({ uuid: p.uuid, name: p.name })),
  };
}

function quotationsOf(o: DemoOrder) {
  // Saving: economia do valor final sobre a cotação recebida mais cara (%).
  const nets = (o.quotations ?? [])
    .filter((q) => q.status === 3)
    .map((q) => q.total - (q.discount ?? 0));
  const highest = nets.length ? Math.max(...nets) : 0;
  return (o.quotations ?? []).map((q, index) => {
    const provider = PROVIDERS[q.provider];
    const received = q.status === 3;
    const net = q.total - (q.discount ?? 0);
    const saving = received && highest > 0 ? Math.round(((highest - net) / highest) * 10000) / 100 : 0;
    return {
      uuid: `${uuidOf(o.n)}-q${index}`,
      hash: `demo-${o.n}-${index}`,
      quotation_date: received ? q.date ?? null : null,
      expiration_date: null,
      total_value: received ? q.total : 0,
      discount: received ? q.discount ?? 0 : 0,
      saving,
      status: q.status,
      status_label: q.status === 3 ? 'Recebida' : q.status === 2 ? 'Enviada' : 'Aguardando',
      requires_file: false,
      note: null,
      reponsible: provider.name,
      observation: null,
      request_purchase: { uuid: uuidOf(o.n), code: o.code },
      user: CARLOS,
      provider,
      branch: null,
      saving_responsible: null,
      items: [],
      payments: [],
      selected_payment_uuid: null,
      selected: o.winner === q.provider,
      created_at: `${o.date}T10:00:00`,
      updated_at: q.date ?? `${o.date}T10:00:00`,
    };
  });
}

function paginate(rows: unknown[], params: Record<string, any>) {
  const perPage = Number(params.per_page) || 10;
  const page = Number(params.page) || 1;
  const start = (page - 1) * perPage;
  const data = rows.slice(start, start + perPage);
  return {
    body: data,
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(rows.length / perPage)),
      per_page: perPage,
      total: rows.length,
      from: rows.length ? start + 1 : null,
      to: rows.length ? start + data.length : null,
    },
  };
}

function applyFilters(orders: DemoOrder[], params: Record<string, any>) {
  const search = String(params.search ?? '').trim().toLowerCase();
  const status = params.status !== undefined && params.status !== '' ? Number(params.status) : undefined;
  return orders
    .filter((o) => !search || `${o.code} ${o.description} ${o.justification}`.toLowerCase().includes(search))
    .filter((o) => status === undefined || o.status === status)
    .filter((o) => !params.type || o.type === params.type)
    .filter((o) => !params.date_from || o.date >= String(params.date_from).slice(0, 10))
    .filter((o) => !params.date_to || o.date <= String(params.date_to).slice(0, 10));
}

const newestFirst = (a: DemoOrder, b: DemoOrder) => b.date.localeCompare(a.date);

function listRoute(pattern: RegExp, scopeFilter: (o: DemoOrder, params: Record<string, any>) => boolean): MockRoute {
  return {
    method: 'get',
    pattern,
    handler: ({ params }) =>
      paginate(
        applyFilters(ORDERS.filter((o) => scopeFilter(o, params)), params)
          .sort(newestFirst)
          .map(listItem),
        params
      ),
  };
}

const byUuid = (uuid: string) => ORDERS.find((o) => uuidOf(o.n) === uuid);

// ---- Ações simuladas do protótipo (lote 4) ---------------------------------
// Mudam a ordem NA MEMÓRIA (recarregar a página volta ao estado inicial) e
// registram cada ação na linha do tempo, com a justificativa.

const parseBody = (body: unknown) => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, any>;
    } catch {
      return {};
    }
  }
  return (body ?? {}) as Record<string, any>;
};

function addMovement(o: DemoOrder, status: number, justify?: string) {
  // Sem "tempo gasto": a ação acabou de acontecer.
  o.movements.push({ status, user: ME, at: new Date().toISOString(), elapsed: '', justify });
}

const itemIndex = (o: DemoOrder, itemUuid: string) =>
  o.items.findIndex((_, index) => `${uuidOf(o.n)}-i${index}` === itemUuid);

function settleAfterReceipt(o: DemoOrder) {
  const withQty = o.items.filter((item) => item.quantity !== null && !item.cancelled);
  const allReceived = withQty.every((item) => receivedOf(o, item) >= (item.quantity ?? 0));
  if (allReceived && withQty.length) o.status = 8;
}

function actionRoute(action: string, run: (o: DemoOrder, body: Record<string, any>) => void): MockRoute {
  return {
    method: 'post',
    pattern: new RegExp(`^/request-purchases/([0-9a-f-]{36})/prototype/${action}$`),
    handler: ({ match, body }) => {
      const order = byUuid(match[1]);
      if (!order) return { status: 404, body: null };
      run(order, parseBody(body));
      return { body: detail(order) };
    },
  };
}

const actionRoutes: MockRoute[] = [
  // Recebimento (parcial ou total) com a NF: soma ao recebido, liga a NF e, sem saldo, conclui.
  actionRoute('receipt', (o, body) => {
    const invoice = body.invoice ?? {};
    (body.items ?? []).forEach((row: { item_uuid: string; quantity: number }) => {
      const index = itemIndex(o, row.item_uuid);
      const item = o.items.at(index);
      if (!item || item.quantity === null) return;
      const current = receivedOf(o, item);
      item.received = Math.min(item.quantity, current + Number(row.quantity || 0));
    });
    const winner = o.winner ? PROVIDERS[o.winner].name : 'Fornecedor';
    o.invoices = [
      ...(o.invoices ?? []),
      {
        uuid: `demo-nf-${o.n}-${(o.invoices?.length ?? 0) + 1}`,
        issuer: winner,
        number: String(invoice.number ?? ''),
        series: String(invoice.series ?? '1'),
        issued_at: String(invoice.issued_at ?? new Date().toISOString().slice(0, 10)),
        entered_at: new Date().toISOString().slice(0, 10),
        value: Number(invoice.value ?? 0),
      },
    ];
    o.nfe = String(invoice.number ?? o.nfe ?? '');
    settleAfterReceipt(o);
    addMovement(o, o.status, `NF ${invoice.number ?? ''} registrada${o.status === 8 ? '; recebimento concluído.' : '; recebimento parcial.'}`);
  }),
  // Cancelar saldo: o que falta deixa de ser esperado; com algo recebido encerra, senão cancela.
  actionRoute('cancel-balance', (o, body) => {
    o.previousStatus = o.status;
    const received = o.items.some((item) => receivedOf(o, item) > 0);
    o.items.forEach((item) => {
      if (item.quantity !== null && receivedOf(o, item) < item.quantity) item.cancelled = true;
    });
    o.status = received ? 9 : 10;
    o.cancelledAt = 'recebimento';
    addMovement(o, o.status, `Saldo cancelado: ${body.justify ?? ''}`);
  }),
  // Cancelar um item: deixa de ser esperado; sem mais saldo, conclui o recebimento.
  actionRoute('cancel-item', (o, body) => {
    const item = o.items.at(itemIndex(o, body.item_uuid));
    if (!item) return;
    item.cancelled = true;
    settleAfterReceipt(o);
    addMovement(o, o.status, `Item cancelado (${item.description}): ${body.justify ?? ''}`);
  }),
  // Reabrir: volta à situação anterior e os itens cancelados voltam a ser esperados.
  actionRoute('reopen', (o, body) => {
    o.status = o.previousStatus ?? 7;
    o.previousStatus = undefined;
    o.cancelledAt = undefined;
    o.items.forEach((item) => {
      item.cancelled = false;
    });
    addMovement(o, o.status, `Ordem reaberta: ${body.justify ?? ''}`);
  }),
  // Gerar ordens (26/11): uma Ordem de compra por fornecedor; a Solicitação continua viva.
  actionRoute('generate-orders', (o, body) => {
    const byUuid = Object.entries(PROVIDERS) as [keyof typeof PROVIDERS, (typeof PROVIDERS)[keyof typeof PROVIDERS]][];
    (body.orders ?? []).forEach((order: { provider_uuid: string; items: { item_uuid: string; quantity: number }[] }) => {
      const provider = byUuid.find(([, p]) => p.uuid === order.provider_uuid)?.[0];
      if (!provider) return;
      const items = order.items
        .map((row) => ({ index: itemIndex(o, row.item_uuid), quantity: Number(row.quantity) }))
        .filter((row) => row.index >= 0 && row.quantity > 0);
      if (items.length)
        o.generated = [...(o.generated ?? []), { provider, items, date: new Date().toISOString().slice(0, 10) }];
    });
    addMovement(o, o.status, `Ordens de compra geradas: ${(body.orders ?? []).length}.`);
  }),
];

// ---------------------------------------------------------------------------
// ORDENS DE COMPRA (26/11/2026): entidade nova, de UM fornecedor. Nascem de uma
// Solicitação ("Gerar ordens", em `DemoOrder.generated`) ou sozinhas
// (`STANDALONE_ORDERS`). Rotas `/prototype/purchase-orders*` só existem aqui.
// ---------------------------------------------------------------------------

interface DemoPurchaseOrderItem {
  description: string;
  product?: string;
  quantity: number;
  unitPrice: number;
  requestItemUuid?: string;
}

interface DemoPurchaseOrder {
  uuid: string;
  code: string;
  provider: keyof typeof PROVIDERS;
  status: number;
  date: string;
  farm: { uuid: string; description: string };
  /** Onde a previsão fica gravada (a ordem avulsa ou a entrada em `generated`). */
  target: { forecast?: string };
  request?: DemoOrder;
  items: DemoPurchaseOrderItem[];
}

const STANDALONE_ORDERS: (Omit<DemoPurchaseOrder, 'target'> & { forecast?: string })[] = [
  {
    uuid: 'demo-oc-avulsa-0031',
    code: 'OC-0031',
    provider: 'postoestrada',
    status: 6,
    date: '2026-11-24',
    farm: SANTA_RITA,
    forecast: '2026-11-29',
    items: [{ description: 'Óleo diesel S10 (L)', product: 'Diesel S10', quantity: 5000, unitPrice: 6.27 }],
  },
  {
    uuid: 'demo-oc-avulsa-0029',
    code: 'OC-0029',
    provider: 'tratormaq',
    status: 8,
    date: '2026-11-17',
    farm: BOA_VISTA,
    forecast: '2026-11-21',
    items: [
      { description: 'Filtro de óleo do motor', product: 'Filtro JD RE504836', quantity: 4, unitPrice: 180 },
      { description: 'Filtro de combustível', product: 'Filtro JD RE533026', quantity: 4, unitPrice: 145 },
    ],
  },
];

function purchaseOrders(): DemoPurchaseOrder[] {
  const standalone = STANDALONE_ORDERS.map((po) => ({ ...po, target: po }));
  const generated = ORDERS.flatMap((o) =>
    (o.generated ?? []).map((g, index) => ({
      uuid: `${uuidOf(o.n)}-oc${index + 1}`,
      code: `OC-${o.code}-${index + 1}`,
      provider: g.provider,
      status: g.status ?? 6,
      date: g.date ?? o.date,
      farm: o.farm,
      target: g,
      request: o,
      items: g.items.map((row) => {
        const item = o.items[row.index];
        return {
          description: item.description,
          product: item.product,
          quantity: row.quantity,
          unitPrice: item.quantity ? item.amount / item.quantity : item.amount,
          requestItemUuid: `${uuidOf(o.n)}-i${row.index}`,
        };
      }),
    }))
  );
  return [...generated, ...standalone];
}

function purchaseOrderSummary(po: DemoPurchaseOrder) {
  return {
    uuid: po.uuid,
    code: po.code,
    provider: { uuid: PROVIDERS[po.provider].uuid, name: PROVIDERS[po.provider].name },
    status: po.status,
    status_label: STATUS_LABEL[po.status],
    date: po.date,
    farm: po.farm,
    delivery_forecast: po.target.forecast ?? null,
    request: po.request
      ? { uuid: uuidOf(po.request.n), code: po.request.code, description: po.request.description }
      : null,
    items_count: po.items.length,
    total: po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  };
}

function purchaseOrderDetail(po: DemoPurchaseOrder) {
  return {
    ...purchaseOrderSummary(po),
    provider_contact: { email: PROVIDERS[po.provider].email, phone: PROVIDERS[po.provider].cellphone },
    items: po.items.map((item, index) => ({
      uuid: `${po.uuid}-it${index}`,
      description: item.description,
      product: item.product ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.quantity * item.unitPrice,
      request_item_uuid: item.requestItemUuid ?? null,
    })),
  };
}

const purchaseOrderRoutes: MockRoute[] = [
  {
    method: 'post',
    pattern: /^\/prototype\/purchase-orders\/([^/]+)\/forecast$/,
    handler: ({ match, body }) => {
      const po = purchaseOrders().find((row) => row.uuid === match[1]);
      if (!po) return { status: 404, body: null };
      po.target.forecast = String(parseBody(body).date ?? '') || undefined;
      return { body: purchaseOrderDetail(po) };
    },
  },
  {
    method: 'get',
    pattern: /^\/prototype\/purchase-orders\/([^/]+)$/,
    handler: ({ match }) => {
      const po = purchaseOrders().find((row) => row.uuid === match[1]);
      return po ? { body: purchaseOrderDetail(po) } : { status: 404, body: null };
    },
  },
  {
    method: 'get',
    pattern: /^\/prototype\/purchase-orders$/,
    handler: () => ({ body: purchaseOrders().map(purchaseOrderSummary) }),
  },
];

export const purchaseOrderDemoRoutes: MockRoute[] = [
  ...purchaseOrderRoutes,
  ...actionRoutes,
  // Listas específicas antes do detalhe `/{uuid}`.
  listRoute(/^\/request-purchases\/my-processes$/, (o) => o.responsible.uuid === ME.uuid && ![9, 10].includes(o.status)),
  listRoute(/^\/request-purchases\/rejected$/, (o) => [5, 10].includes(o.status)),
  listRoute(/^\/request-purchases\/in-quotation$/, (o) => [1, 2].includes(o.status)),
  listRoute(/^\/request-purchases\/in-purchase$/, (o) => [6, 7].includes(o.status)),
  listRoute(/^\/request-purchases$/, (o, params) => params.scope === 'all' || o.user.uuid === ME.uuid),
  listRoute(/^\/request-authorizations$/, (o) => [3, 4].includes(o.status)),
  listRoute(/^\/request-receipts$/, (o) => [7, 8].includes(o.status)),
  {
    method: 'get',
    pattern: /^\/request-purchases\/([0-9a-f-]{36})\/quotations$/,
    handler: ({ match }) => {
      const order = byUuid(match[1]);
      return order ? { body: quotationsOf(order) } : { status: 404, body: null };
    },
  },
  {
    method: 'get',
    pattern: /^\/request-purchases\/([0-9a-f-]{36})$/,
    handler: ({ match }) => {
      const order = byUuid(match[1]);
      return order ? { body: detail(order) } : { status: 404, body: null };
    },
  },
];
