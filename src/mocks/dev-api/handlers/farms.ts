// Mock de /farms (listagem paginada, detalhe, exclusão). Dados ilustrativos,
// alinhados à tela de referência "Fazendas" do design system.

import type { MockRoute } from '../index';

const farm = (
  n: number,
  description: string,
  nif: string,
  city: string,
  uf: string,
  type: 1 | 2 | 3,
  label: string,
  area: number,
) => ({
  uuid: `00000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`,
  description,
  descriptive: description,
  total_area: area,
  value_ha: 18000 + n * 1500,
  car: null,
  city_id: n,
  town: { uuid: `town-${n}`, name: city, state: uf },
  note: null,
  is_enabled: n !== 7,
  coordinates: null,
  logo: null,
  logo_url: null,
  rate: null,
  latitude: null,
  longitude: null,
  phone: '(65) 99999-0000',
  nif,
  state_registration: null,
  control_supplies_stock: true,
  cost_processing_date: 1,
  cafir: null,
  caepf: null,
  district: null,
  zip_code: null,
  number: null,
  exploration_type: { value: type, label },
  coin: 'BRL',
  nirf: null,
  ccir: null,
  use_cash_book: false,
  created_at: '2026-01-10T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
});

const FARMS = [
  farm(1, 'Fazenda Santa Luzia', '12.345.678/0001-90', 'Sorriso', 'MT', 1, 'Agrícola', 2450),
  farm(2, 'Fazenda Bela Vista', '987.654.321-00', 'Rondonópolis', 'MT', 2, 'Pecuário', 1800),
  farm(3, 'Fazenda Cerrado Verde', '23.456.789/0001-11', 'Rio Verde', 'GO', 1, 'Agrícola', 3200),
  farm(4, 'Fazenda Três Irmãos', '876.543.210-99', 'Jataí', 'GO', 3, 'Misto', 950),
  farm(5, 'Fazenda Pantanal Sul', '34.567.890/0001-22', 'Cáceres', 'MT', 2, 'Pecuário', 2100),
  farm(6, 'Fazenda Horizonte', '765.432.109-88', 'Uberaba', 'MG', 3, 'Misto', 680),
  farm(7, 'Fazenda São Benedito', '45.678.901/0001-33', 'Uberlândia', 'MG', 1, 'Agrícola', 1250),
  farm(8, 'Fazenda Nova Esperança', '654.321.098-77', 'Primavera do Leste', 'MT', 1, 'Agrícola', 1750),
  farm(9, 'Fazenda Boa Safra', '56.789.012/0001-44', 'Lucas do Rio Verde', 'MT', 1, 'Agrícola', 4100),
  farm(10, 'Fazenda Ouro Verde', '543.210.987-66', 'Campo Grande', 'MS', 2, 'Pecuário', 3600),
  farm(11, 'Fazenda Vale do Sol', '67.890.123/0001-55', 'Dourados', 'MS', 3, 'Misto', 1400),
  farm(12, 'Fazenda Recanto', '432.109.876-55', 'Barreiras', 'BA', 1, 'Agrícola', 2750),
];

export const farmRoutes: MockRoute[] = [
  {
    method: 'get',
    pattern: /^\/farms$/,
    handler: ({ params }) => {
      const page = Number(params.page) || 1;
      const perPage = Number(params.per_page) || 10;
      const search = String(params.search ?? '').trim().toLowerCase();
      const enabled = params.is_enabled as string | undefined;

      const filtered = FARMS.filter(
        (f) =>
          (!search || f.description.toLowerCase().includes(search)) &&
          (!enabled || String(f.is_enabled) === enabled),
      );
      const items = filtered.slice((page - 1) * perPage, page * perPage);

      return {
        body: items,
        meta: {
          total: filtered.length,
          per_page: perPage,
          current_page: page,
          last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
        },
      };
    },
  },
  {
    method: 'get',
    pattern: /^\/farms\/([\w-]+)$/,
    handler: ({ match }) => {
      const found = FARMS.find((f) => f.uuid === match[1]);
      return found ? { body: { ...found, centers: [], areas: [] } } : { status: 404, body: null };
    },
  },
  {
    method: 'delete',
    pattern: /^\/farms\/([\w-]+)$/,
    handler: () => ({ status: 204 }),
  },
];
