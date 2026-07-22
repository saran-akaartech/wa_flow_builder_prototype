import { Pool } from 'pg';

const globalForPg = global as unknown as { pgPool?: Pool };

export const pool =
    globalForPg.pgPool ??
    new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        user: process.env.DB_USER || "postgres",
        password: "Akaar@2026",
        database: "whatsapp_db"
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPg.pgPool = pool;
}

export function query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
) {
    return pool.query<T>(text, params);
}
