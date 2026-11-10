import http from 'node:http';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const pool = new pg.Pool({ connectionTimeoutMillis: 3000 });
const json = (res, status, data) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data)); };
const fail = (message, status = 400) => Object.assign(new Error(message), {status});
const id = value => { const n = Number(value); if (!Number.isSafeInteger(n) || n <= 0) throw fail('Selecione um registro válido.'); return n; };
async function body(req) {
  let value = ''; for await (const chunk of req) { value += chunk; if (value.length > 10000) throw fail('Requisição muito grande.',413); }
  try { return JSON.parse(value); } catch { throw fail('Dados inválidos.'); }
}
async function transaction(fn) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
  catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
const files = {'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
const types = {html:'text/html',js:'text/javascript',css:'text/css'};
const server = http.createServer(async (req,res) => {
 try {
  const url = new URL(req.url,'http://localhost');
  if (req.method === 'GET' && files[url.pathname]) {
   const file = files[url.pathname]; res.writeHead(200,{'Content-Type':types[file.split('.').pop()]+'; charset=utf-8'}); res.end(await readFile(new URL('./public/'+file,import.meta.url))); return;
  }
  if (req.method === 'GET' && url.pathname === '/api/dados') {
   const queries = {
    usuarios:'SELECT * FROM usuario ORDER BY nome',
    materiais:'SELECT * FROM material ORDER BY nome',
    pontos:'SELECT * FROM ponto_coleta WHERE ativo = TRUE ORDER BY nome',
    recompensas:`SELECT r.*, p.nome AS parceiro FROM recompensa r JOIN parceiro p USING(id_parceiro) WHERE r.ativo = TRUE AND p.ativo = TRUE AND (r.data_validade IS NULL OR r.data_validade >= CURRENT_DATE) ORDER BY custo_pontos`,
    descartes:`SELECT d.*, m.nome AS material, m.pontos_kg, p.nome AS ponto, FLOOR(d.quantidade_kg * m.pontos_kg)::int AS pontos FROM descarte d JOIN material m USING(id_material) JOIN ponto_coleta p USING(id_ponto) ORDER BY data_descarte DESC, id_descarte DESC`,
    resgates:`SELECT r.*, re.nome AS recompensa FROM resgate r JOIN recompensa re USING(id_recompensa) ORDER BY data_resgate DESC, id_resgate DESC`
   };
   const entries = await Promise.all(Object.entries(queries).map(async ([key,sql])=>[key,(await pool.query(sql)).rows]));
   json(res,200,Object.fromEntries(entries)); return;
  }
  if (req.method === 'POST' && url.pathname === '/api/descartes') {
   const b = await body(req); const usuario = id(b.id_usuario), material = id(b.id_material), ponto = id(b.id_ponto);
   if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(b.quantidade_kg)) || Number(b.quantidade_kg) <= 0 || Number(b.quantidade_kg) > 10000) throw fail('Informe um peso entre 0,01 e 10.000 kg, com até duas casas decimais.');
   const result = await transaction(async c => {
    const u = await c.query('SELECT id_usuario FROM usuario WHERE id_usuario=$1 FOR UPDATE',[usuario]);
    if (!u.rowCount) throw fail('Participante não encontrado.');
    const m = await c.query('SELECT pontos_kg FROM material WHERE id_material=$1',[material]);
    const p = await c.query('SELECT id_ponto FROM ponto_coleta WHERE id_ponto=$1 AND ativo=TRUE',[ponto]);
    if (!m.rowCount || !p.rowCount) throw fail('Material ou ponto de coleta indisponível.');
    const calculation = await c.query('SELECT FLOOR($1::numeric * $2::numeric)::integer AS pontos',[b.quantidade_kg,m.rows[0].pontos_kg]);
    const pontos = calculation.rows[0].pontos;
    await c.query('INSERT INTO descarte (id_usuario,id_material,id_ponto,quantidade_kg,data_descarte) VALUES ($1,$2,$3,$4,LOCALTIMESTAMP)',[usuario,material,ponto,b.quantidade_kg]);
    await c.query('UPDATE usuario SET saldo_pontos=COALESCE(saldo_pontos,0)+$1 WHERE id_usuario=$2',[pontos,usuario]);
    return {message:'Descarte registrado!',pontos};
   }); json(res,201,result); return;
  }
  if (req.method === 'POST' && url.pathname === '/api/resgates') {
   const b = await body(req); const usuario = id(b.id_usuario), recompensa = id(b.id_recompensa);
   const result = await transaction(async c => {
    const u = await c.query('SELECT saldo_pontos FROM usuario WHERE id_usuario=$1 FOR UPDATE',[usuario]);
    const r = await c.query(`SELECT r.* FROM recompensa r JOIN parceiro p USING(id_parceiro) WHERE r.id_recompensa=$1 AND r.ativo=TRUE AND p.ativo=TRUE AND (r.data_validade IS NULL OR r.data_validade >= CURRENT_DATE) FOR UPDATE OF r`,[recompensa]);
    if (!u.rowCount || !r.rowCount) throw fail('Participante ou recompensa indisponível.');
    const reward = r.rows[0];
    if (reward.quantidade_disponivel <= 0) throw fail('Recompensa sem estoque.');
    if ((u.rows[0].saldo_pontos ?? 0) < reward.custo_pontos) throw fail('Saldo de pontos insuficiente.');
    await c.query('UPDATE usuario SET saldo_pontos=saldo_pontos-$1 WHERE id_usuario=$2',[reward.custo_pontos,usuario]);
    await c.query('UPDATE recompensa SET quantidade_disponivel=quantidade_disponivel-1 WHERE id_recompensa=$1',[recompensa]);
    await c.query('INSERT INTO resgate (id_usuario,id_recompensa,pontos_utilizados,data_resgate) VALUES ($1,$2,$3,LOCALTIMESTAMP)',[usuario,recompensa,reward.custo_pontos]);
    return {message:'Recompensa resgatada! Confira seu histórico.'};
   }); json(res,201,result); return;
  }
  json(res,404,{message:'Página não encontrada.'});
 } catch(error) {
  const code = error.code || error.errors?.[0]?.code;
  const databaseErrors = {
   '28P01': 'A senha ou o usuário do PostgreSQL não foi aceito. Confira PGUSER e PGPASSWORD no arquivo .env.',
   '28000': 'O PostgreSQL recusou a autenticação. Confira o usuário e as regras de conexão do servidor.',
   '3D000': 'O banco informado em PGDATABASE não existe nesse servidor. Confira no pgAdmin o nome exato do banco e ajuste o .env.',
   '42P01': 'A conexão funcionou, mas falta uma tabela do projeto no banco selecionado. Confira PGDATABASE e importe o SQL do projeto se as tabelas ainda não foram criadas.',
   '42703': 'A conexão funcionou, mas as colunas do banco são diferentes das esperadas pelo projeto. Confira a estrutura das tabelas.',
   ECONNREFUSED: 'Nenhum PostgreSQL aceitou a conexão no endereço e porta configurados. Verifique se o serviço está iniciado e confira PGHOST e PGPORT.',
   ENOTFOUND: 'O endereço do PostgreSQL não foi encontrado. Confira PGHOST no arquivo .env.',
   EACCES: 'O acesso ao PostgreSQL foi bloqueado por permissão do ambiente ou do Windows.',
   ETIMEDOUT: 'O PostgreSQL não respondeu a tempo. Confira o endereço, a porta e se o servidor está acessível.'
  };
  const message = error.status ? error.message : databaseErrors[code] || 'Não foi possível consultar o banco. Confira o PostgreSQL e a estrutura das tabelas do projeto.';
  console.error(`[Banco/API${code ? ' ' + code : ''}] ${message}`);
  json(res,error.status || 503,{message, ...(code && {code})});
 }
});
const port = Number(process.env.PORT || 8080);
server.on('error', async error => {
 if (error.code === 'EACCES') {
  console.error(`O Windows bloqueou a abertura da porta ${port}. Altere PORT no arquivo .env para outra porta e inicie novamente.`);
 } else if (error.code === 'EADDRINUSE') {
  console.error(`A porta ${port} já está em uso. Feche a outra instância ou altere PORT no arquivo .env.`);
 } else {
  console.error('Não foi possível iniciar o servidor:', error.code || error.message);
 }
 await pool.end();
 process.exitCode = 1;
});
server.listen(port,'127.0.0.1',()=>console.log(`DescartaFacens: http://localhost:${port}`));
