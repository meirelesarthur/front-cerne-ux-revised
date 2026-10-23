import pg from 'pg';

// numeric/bigint chegam como string no `pg`; o front espera number nos campos numéricos.
pg.types.setTypeParser(20, (v) => Number(v)); // int8
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v))); // numeric

export const TENANT_ID = Number(process.env.DEV_TENANT_ID ?? 5);

export const pool = new pg.Pool({
  host: process.env.DEV_PG_HOST ?? '127.0.0.1',
  port: Number(process.env.DEV_PG_PORT ?? 54329),
  user: process.env.DEV_PG_USER ?? 'postgres',
  password: process.env.DEV_PG_PASSWORD ?? 'devpass',
  database: process.env.DEV_PG_DATABASE ?? 'gbcerne',
  options: '-c search_path=gbcerne',
  max: 6,
});

export const query = (text, params = []) => pool.query(text, params).then((r) => r.rows);
