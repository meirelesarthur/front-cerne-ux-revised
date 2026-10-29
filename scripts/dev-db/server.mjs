// -----------------------------------------------------------------------------
// API LOCAL DE DEV — serve ao front os dados REAIS do dump restaurado em um
// PostgreSQL local. SOMENTE LEITURA e SOMENTE DEV: não é o backend do produto.
//
//   node scripts/dev-db/server.mjs        (porta 8080; ver README em docs/ux)
//
// - Fala o MESMO contrato do front (envelope ApiResponse: success/message/data/
//   errors/meta + meta de paginação) para os recursos registrados em `resources/`.
// - O dump é o schema LEGADO (sem uuid): o UUID de cada linha é determinístico e
//   reversível (`uuidFor(kind, id)` / `idFrom(uuid)`), só para o front funcionar.
// - Escopo: um contratante (`DEV_TENANT_ID`, default 5). Rotas sem recurso
//   registrado devolvem lista vazia (GET) / sucesso genérico (escrita), igual aos
//   mocks. Escritas NÃO persistem no banco (fica intacto); só os recursos COM ESTADO em memória
//   (OFX, Safras, Usuários) aceitam salvar/editar/excluir até a API reiniciar.
// - Dados reais vivem só no Postgres local; nada daqui é commitado.
// -----------------------------------------------------------------------------

import http from 'node:http';

import { pool } from './lib/db.mjs';
import { envelope, parseQuery } from './lib/http.mjs';
import { farmRoutes } from './resources/farms.mjs';
import { peopleRoutes } from './resources/people.mjs';
import { catalogRoutes } from './resources/catalog.mjs';
import { financeRoutes } from './resources/finance.mjs';
import { productRoutes } from './resources/products.mjs';
import { ofxRoutes } from './resources/ofx.mjs';
import { harvestUserRoutes } from './resources/harvests-users.mjs';
import { writeRoutes } from './resources/writes.mjs';

const PORT = Number(process.env.DEV_API_PORT ?? 8080);
const ALLOWED_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const routes = [
  // escrita simulada primeiro: envolve as leituras do dump (Bancos, Plano de Contas, Embalagens)
  ...writeRoutes,
  ...farmRoutes,
  ...peopleRoutes,
  ...catalogRoutes,
  ...financeRoutes,
  ...productRoutes,
  ...ofxRoutes,
  ...harvestUserRoutes,
];

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGIN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'x-dev-fallback');
  }
}

function parseMultipart(buf, boundary) {
  const fields = {};
  const sep = Buffer.from('--' + boundary);
  let pos = buf.indexOf(sep);
  while (pos !== -1) {
    const next = buf.indexOf(sep, pos + sep.length);
    if (next === -1) break;
    const part = buf.subarray(pos + sep.length + 2, next - 2); // tira CRLF antes/depois
    const split = part.indexOf('\r\n\r\n');
    if (split !== -1) {
      const head = part.subarray(0, split).toString('utf8');
      const name = head.match(/name="([^"]*)"/)?.[1];
      const isFile = /filename="/.test(head);
      if (name) {
        const value = isFile ? '[arquivo]' : part.subarray(split + 4).toString('utf8');
        if (name in fields) fields[name] = [].concat(fields[name], value);
        else fields[name] = value;
      }
    }
    pos = next;
  }
  return fields;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const buf = Buffer.concat(chunks);
  const type = req.headers['content-type'] ?? '';
  if (type.startsWith('multipart/form-data')) {
    const boundary = type.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    return boundary ? parseMultipart(buf, boundary[1] ?? boundary[2]) : {};
  }
  try {
    const raw = buf.toString('utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api\/v1/, '') || '/';
  const method = req.method.toLowerCase();
  const query = parseQuery(url.searchParams);
  const farmId = req.headers['x-farm-id'] ?? null;

  const send = (status, payload, extraHeaders = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
    res.end(status === 204 ? '' : JSON.stringify(payload));
  };

  try {
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = path.match(route.pattern);
      if (!match) continue;
      const body = method === 'get' ? {} : await readBody(req);
      const out = await route.handler({ match, query, body, farmId, path });
      const status = out.status ?? 200;
      if (status >= 400) {
        send(status, { success: false, message: out.message ?? 'Os dados informados são inválidos.', data: null, errors: out.errors ?? null, meta: null });
      } else {
        send(status, status === 204 ? null : envelope(out.body, out.meta ?? null));
      }
      console.log(`${method.toUpperCase()} ${path} -> ${status}`);
      return;
    }

    // Fallback: sem recurso registrado
    // O cabeçalho avisa o front (mocks de UX) de que esta rota NÃO é atendida aqui.
    const fb = { 'x-dev-fallback': '1' };
    if (method === 'get') {
      send(200, envelope([], { total: 0, count: 0, per_page: 10, current_page: 1, last_page: 1, from: null, to: null }), fb);
    } else if (method === 'delete') {
      send(204, null, fb);
    } else {
      send(200, envelope({}, null), fb);
    }
    console.log(`${method.toUpperCase()} ${path} -> fallback`);
  } catch (err) {
    console.error(`ERRO ${method.toUpperCase()} ${path}:`, err.message);
    send(500, { success: false, message: err.message, data: null, errors: null, meta: null });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`dev-api em http://localhost:${PORT}/api/v1  (tenant ${process.env.DEV_TENANT_ID ?? 5})`);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
