// -----------------------------------------------------------------------------
// DEV MOCKS — Tipos de serviço e Serviços de DEMONSTRAÇÃO (protótipo, 27/11/2026, não portar).
//
// Simula o cadastro novo (decisão do dono, 26/11): o Tipo de serviço (antiga Operação) guarda todos
// os parâmetros do Apontamento e o "Gera execução"; o Serviço (antiga Atividade) é só nome, descrição
// e situação, e pode estar em vários Tipos de serviço. Tudo em memória (recarregar a página volta ao
// início). Caminhos próprios, que não colidem com `/operations` nem `/activities`:
//   /prototype/service-types   (lista, detalhe, criar, editar, excluir, /options, /grouper-options, /next-order)
//   /prototype/services        (lista, detalhe, criar, editar, excluir)
// Ligado por `PURCHASE_ORDER_PROTOTYPE`, como as Ordens de compra de demonstração. Nomes fictícios.
// -----------------------------------------------------------------------------

import type { MockRoute } from '../index';

import {
  DEFAULT_SERVICE_TYPE_PARAMS,
  type ServiceTypeParams,
} from '@/pages/CadastrosBase/TiposServico/serviceTypeParams';

interface DemoGrouper {
  uuid: string;
  code: string;
  name: string;
}

const GROUPERS: Record<'coe' | 'inv' | 'rb', DemoGrouper> = {
  coe: { uuid: 'demo-grp-coe', code: '01', name: 'Custo Operacional Efetivo - COE' },
  inv: { uuid: 'demo-grp-inv', code: '02', name: 'Investimentos - I' },
  rb: { uuid: 'demo-grp-rb', code: '03', name: 'Receita Bruta - RB' },
};

interface DemoServiceType extends ServiceTypeParams {
  uuid: string;
  name: string;
  description: string | null;
  grouper_uuid: string | null;
  order: number;
  is_enabled: boolean;
}

interface DemoService {
  uuid: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  service_type_uuids: string[];
}

const typeUuid = (n: number) => `demo-st-${String(n).padStart(3, '0')}`;
const serviceUuid = (n: number) => `demo-sv-${String(n).padStart(3, '0')}`;

type TypeSeed = Partial<ServiceTypeParams> & {
  n: number;
  name: string;
  order: number;
  grouper: keyof typeof GROUPERS;
  description?: string;
  is_enabled?: boolean;
};

const TYPE_SEEDS: TypeSeed[] = [
  { n: 1, name: 'Abertura Áreas de Produção', order: 18, grouper: 'inv', use: 'agricultura', requires_used_area: true, required_machines: true, min_photos: 1, description: 'Limpeza e preparo de áreas novas.' },
  { n: 2, name: 'Armazenagem', order: 8, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_cultivation: true, generates_execution: false, description: 'Guarda e secagem da produção.' },
  { n: 3, name: 'Colheita', order: 6, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_cultivation: true, requires_used_area: true, required_machines: true, generates_production: true },
  { n: 4, name: 'Conservação do Solo', order: 2, grouper: 'coe', use: 'agricultura', requires_used_area: true, required_machines: true },
  { n: 5, name: 'Construção Instalações', order: 17, grouper: 'inv', use: 'ambos', min_photos: 2, generates_execution: false, is_enabled: false },
  { n: 6, name: 'Gradagem', order: 20, grouper: 'rb', use: 'agricultura', requires_used_area: true, required_machines: true },
  { n: 7, name: 'Identificação Animal', order: 13, grouper: 'coe', use: 'pecuaria', requires_batch: true, required_labor: true },
  { n: 8, name: 'Manutenção Culturas Perenes', order: 15, grouper: 'coe', use: 'agricultura', requires_cultivation: true, requires_used_area: true, required_labor: true },
  { n: 9, name: 'Manutenção Instalações', order: 14, grouper: 'coe', use: 'ambos', generates_execution: false },
  { n: 10, name: 'Plantio', order: 21, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_cultivation: true, requires_used_area: true, required_inputs: true, generates_production: false },
  { n: 11, name: 'Preparo do Solo', order: 4, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_used_area: true, required_machines: true },
  { n: 12, name: 'Pulverização', order: 7, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_cultivation: true, requires_used_area: true, required_inputs: true, required_machines: true, requires_occurrence: true, notify_on_finish: true, text_min: 20 },
  { n: 13, name: 'Tratos Culturais', order: 5, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_cultivation: true, requires_used_area: true, required_labor: true, min_photos: 1, text_max: 300 },
  { n: 14, name: 'Colheita Mecanizada', order: 9, grouper: 'coe', use: 'agricultura', requires_harvest: true, requires_cultivation: true, requires_used_area: true, required_labor: true, required_machines: true, generates_production: true, requires_signature: true },
];

const buildTypes = (): DemoServiceType[] =>
  TYPE_SEEDS.map(({ n, name, order, grouper, description, is_enabled, ...params }) => ({
    ...DEFAULT_SERVICE_TYPE_PARAMS,
    generates_execution: true,
    ...params,
    uuid: typeUuid(n),
    name,
    description: description ?? null,
    grouper_uuid: GROUPERS[grouper].uuid,
    order,
    is_enabled: is_enabled ?? true,
  }));

// [nome, descrição, números dos tipos de serviço (TYPE_SEEDS.n), inativo?]
type ServiceSeed = [string, string | null, number[], boolean?];

const SERVICE_SEEDS: ServiceSeed[] = [
  ['Adubação Cobertura Manual', null, [13]],
  ['Adubação de Cobertura Mecanizada', null, [13]],
  ['Adubação de Covas Manual', 'Adubação de Covas', [10]],
  ['Adubação Foliar', null, [13]],
  ['Adubação Orgânica Manual', null, [10, 11]],
  ['Adubação Orgânica Mecanizada', null, [10, 11]],
  ['Aplicação de herbicida', 'Controle de plantas daninhas', [12, 13]],
  ['Aplicação de fungicida', null, [12]],
  ['Aplicação de inseticida', null, [12]],
  ['Calagem', 'Correção da acidez do solo', [11, 4]],
  ['Gradagem pesada', null, [6, 11]],
  ['Gradagem leve', null, [6]],
  ['Plantio mecanizado', null, [10]],
  ['Plantio manual', null, [10]],
  ['Capina manual', null, [13]],
  ['Roçada', 'Corte de mato entre as linhas', [13, 8], true],
  ['Poda', null, [8]],
  ['Colheita mecanizada de grãos', null, [3, 14]],
  ['Colheita manual', null, [3]],
  ['Transporte interno da produção', null, [2, 3]],
  ['Secagem e limpeza de grãos', null, [2]],
  ['Construção de curral', null, [5]],
  ['Reforma de cerca', 'Troca de mourões e arame', [9, 5]],
  ['Manutenção de bebedouros', null, [9]],
  ['Brincagem de animais', 'Colocação de brinco de identificação', [7]],
  ['Terraceamento', null, [4]],
  ['Destocamento', null, [1]],
  ['Enleiramento', null, [1]],
];

const buildServices = (): DemoService[] =>
  SERVICE_SEEDS.map(([name, description, typeNumbers, inactive], index) => ({
    uuid: serviceUuid(index + 1),
    name,
    description,
    is_enabled: !inactive,
    service_type_uuids: typeNumbers.map(typeUuid),
  }));

let types = buildTypes();
let services = buildServices();
let typeCounter = 100;
let serviceCounter = 100;

// ---- utilidades -------------------------------------------------------------

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

const norm = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'pt-BR');

function paginate<T>(rows: T[], params: Record<string, any>) {
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

const grouperName = (uuid: string | null) => Object.values(GROUPERS).find((g) => g.uuid === uuid)?.name ?? null;

const typeDetail = (t: DemoServiceType) => ({ ...t, grouper_name: grouperName(t.grouper_uuid) });

const serviceView = (s: DemoService) => ({
  uuid: s.uuid,
  name: s.name,
  description: s.description,
  is_enabled: s.is_enabled,
  service_types: s.service_type_uuids
    .map((uuid) => types.find((t) => t.uuid === uuid))
    .filter((t): t is DemoServiceType => !!t)
    .map((t) => ({ uuid: t.uuid, name: t.name }))
    .sort(byName),
});

const matchesFlag = (value: boolean, param: unknown) => param === undefined || param === '' || String(value) === String(param);

const nextOrder = () => types.reduce((max, t) => Math.max(max, t.order), 0) + 1;

const MISSING = { status: 404, body: null };

// ---- Tipos de serviço ---------------------------------------------------------

const serviceTypeRoutes: MockRoute[] = [
  {
    method: 'get',
    pattern: /^\/prototype\/service-types\/options$/,
    handler: () => ({ body: types.filter((t) => t.is_enabled).sort(byName).map((t) => ({ uuid: t.uuid, name: t.name })) }),
  },
  {
    method: 'get',
    pattern: /^\/prototype\/service-types\/grouper-options$/,
    handler: () => ({ body: Object.values(GROUPERS) }),
  },
  {
    method: 'get',
    pattern: /^\/prototype\/service-types\/next-order$/,
    handler: () => ({ body: { next_order: nextOrder() } }),
  },
  {
    method: 'get',
    pattern: /^\/prototype\/service-types$/,
    handler: ({ params }) => {
      const search = norm(params.search).trim();
      const rows = types
        .filter((t) => !search || norm(`${t.name} ${t.description ?? ''} ${grouperName(t.grouper_uuid) ?? ''}`).includes(search))
        .filter((t) => !params.use || t.use === params.use)
        .filter((t) => !params.grouper_uuid || t.grouper_uuid === params.grouper_uuid)
        .filter((t) => matchesFlag(t.is_enabled, params.is_enabled))
        .filter((t) => matchesFlag(t.generates_execution, params.generates_execution))
        .sort(byName)
        .map(typeDetail);
      return paginate(rows, params);
    },
  },
  {
    method: 'get',
    pattern: /^\/prototype\/service-types\/([^/]+)$/,
    handler: ({ match }) => {
      const found = types.find((t) => t.uuid === match[1]);
      return found ? { body: typeDetail(found) } : MISSING;
    },
  },
  {
    method: 'post',
    pattern: /^\/prototype\/service-types$/,
    handler: ({ body }) => {
      const input = parseBody(body);
      if (!String(input.name ?? '').trim()) return { status: 422, body: null };
      typeCounter += 1;
      const created: DemoServiceType = {
        ...DEFAULT_SERVICE_TYPE_PARAMS,
        ...input,
        uuid: `demo-st-new-${typeCounter}`,
        name: String(input.name).trim(),
        description: input.description ?? null,
        grouper_uuid: input.grouper_uuid ?? null,
        order: nextOrder(), // quem manda na ordem é o sistema, como no cadastro de hoje
        is_enabled: input.is_enabled !== false,
      };
      types = [...types, created];
      return { status: 201, body: typeDetail(created) };
    },
  },
  {
    method: 'put',
    pattern: /^\/prototype\/service-types\/([^/]+)$/,
    handler: ({ match, body }) => {
      const input = parseBody(body);
      const current = types.find((t) => t.uuid === match[1]);
      if (!current) return MISSING;
      const updated: DemoServiceType = {
        ...current,
        ...input,
        uuid: current.uuid,
        order: current.order, // a ordem é preservada na edição
        name: String(input.name ?? current.name).trim(),
        description: input.description ?? null,
        grouper_uuid: input.grouper_uuid ?? null,
      };
      types = types.map((t) => (t.uuid === current.uuid ? updated : t));
      return { body: typeDetail(updated) };
    },
  },
  {
    method: 'delete',
    pattern: /^\/prototype\/service-types\/([^/]+)$/,
    handler: ({ match }) => {
      if (!types.some((t) => t.uuid === match[1])) return MISSING;
      types = types.filter((t) => t.uuid !== match[1]);
      // o Serviço continua existindo; só perde a ligação com este tipo
      services = services.map((s) => ({ ...s, service_type_uuids: s.service_type_uuids.filter((u) => u !== match[1]) }));
      return { status: 204, body: null };
    },
  },
];

// ---- Serviços -----------------------------------------------------------------

const serviceRoutes: MockRoute[] = [
  {
    method: 'get',
    pattern: /^\/prototype\/services$/,
    handler: ({ params }) => {
      const search = norm(params.search).trim();
      const rows = services
        .map(serviceView)
        .filter((s) => !search || norm(`${s.name} ${s.description ?? ''} ${s.service_types.map((t) => t.name).join(' ')}`).includes(search))
        .filter((s) => !params.service_type_uuid || s.service_types.some((t) => t.uuid === params.service_type_uuid))
        .filter((s) => matchesFlag(s.is_enabled, params.is_enabled))
        .sort(byName);
      return paginate(rows, params);
    },
  },
  {
    method: 'get',
    pattern: /^\/prototype\/services\/([^/]+)$/,
    handler: ({ match }) => {
      const found = services.find((s) => s.uuid === match[1]);
      return found ? { body: serviceView(found) } : MISSING;
    },
  },
  {
    method: 'post',
    pattern: /^\/prototype\/services$/,
    handler: ({ body }) => {
      const input = parseBody(body);
      const typeIds: string[] = Array.isArray(input.service_type_uuids) ? input.service_type_uuids : [];
      if (!String(input.name ?? '').trim() || typeIds.length === 0) return { status: 422, body: null };
      serviceCounter += 1;
      const created: DemoService = {
        uuid: `demo-sv-new-${serviceCounter}`,
        name: String(input.name).trim(),
        description: input.description ?? null,
        is_enabled: input.is_enabled !== false,
        service_type_uuids: typeIds,
      };
      services = [...services, created];
      return { status: 201, body: serviceView(created) };
    },
  },
  {
    method: 'put',
    pattern: /^\/prototype\/services\/([^/]+)$/,
    handler: ({ match, body }) => {
      const input = parseBody(body);
      const current = services.find((s) => s.uuid === match[1]);
      if (!current) return MISSING;
      const updated: DemoService = {
        ...current,
        name: String(input.name ?? current.name).trim(),
        description: input.description ?? null,
        is_enabled: input.is_enabled !== false,
        service_type_uuids: Array.isArray(input.service_type_uuids) ? input.service_type_uuids : current.service_type_uuids,
      };
      services = services.map((s) => (s.uuid === current.uuid ? updated : s));
      return { body: serviceView(updated) };
    },
  },
  {
    method: 'delete',
    pattern: /^\/prototype\/services\/([^/]+)$/,
    handler: ({ match }) => {
      if (!services.some((s) => s.uuid === match[1])) return MISSING;
      services = services.filter((s) => s.uuid !== match[1]);
      return { status: 204, body: null };
    },
  },
];

export const serviceTypesDemoRoutes: MockRoute[] = [...serviceTypeRoutes, ...serviceRoutes];
