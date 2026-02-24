import { Pool } from 'pg';

const isLocalHost = (host: string) =>
  !host || host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');

const dbHost = process.env.DB_HOST || '192.168.56.1';
const useSsl = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalHost(dbHost));

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'db_taskia',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ...(useSsl && {
    // Aceptar certificados autofirmados (común en DBs cloud). Para exigir cert válido: DB_SSL_REJECT_UNAUTHORIZED=true
    ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' },
  }),
});

// Verificar conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
  process.exit(-1);
});

export default pool;

// Helper para ejecutar queries
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// Helper para ejecutar una query y obtener un solo resultado
export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// Helper para ejecutar queries de inserción/actualización
export async function execute(text: string, params?: unknown[]): Promise<{ rowCount: number; rows: unknown[] }> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rowCount: result.rowCount || 0, rows: result.rows };
  } finally {
    client.release();
  }
}
