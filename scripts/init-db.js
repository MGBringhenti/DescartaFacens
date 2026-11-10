import pg from 'pg';
import { readFile } from 'node:fs/promises';
const pool = new pg.Pool();
const client = await pool.connect();
try {
  const existing = await client.query("SELECT to_regclass('public.usuario') AS tabela");
  if (existing.rows[0].tabela) throw new Error('O banco já contém a tabela usuario. Nenhum dado foi alterado.');
  await client.query('BEGIN');
  await client.query(await readFile(new URL('../database/bancoDescartaFacens.sql', import.meta.url), 'utf8'));
  await client.query('COMMIT');
  console.log('Tabelas e dados de exemplo criados.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error.message); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
