const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ─── Silencia requisição automática do Chrome DevTools ─── */
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => res.json({}));

/* ═══════════════════════════════════
   NEON POSTGRESQL — conexão
   
═══════════════════════════════════ */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET  = process.env.JWT_SECRET  || 'leal_fashion_secret_2025';
const ADMIN_USER  = process.env.ADMIN_USER  || 'admin';
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'leal@admin2025';

/* ═══════════════════════════════════
   INIT BANCO
═══════════════════════════════════ */
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id         SERIAL PRIMARY KEY,
        nome       VARCHAR(120) NOT NULL,
        cep        VARCHAR(9),
        telefone   VARCHAR(20),
        senha_hash VARCHAR(255) NOT NULL,
        foto_url   TEXT,
        criado_em  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS produtos (
        id            SERIAL PRIMARY KEY,
        emoji         VARCHAR(10)  NOT NULL,
        nome          VARCHAR(120) NOT NULL,
        preco_display VARCHAR(30)  NOT NULL,
        preco_val     NUMERIC(10,2) NOT NULL,
        tag           VARCHAR(40)  NOT NULL,
        descricao     TEXT,
        ativo         BOOLEAN DEFAULT true,
        criado_em     TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vendas (
        id                SERIAL PRIMARY KEY,
        cliente_id        INTEGER REFERENCES clientes(id),
        cliente_nome      VARCHAR(120),
        total             NUMERIC(10,2) NOT NULL,
        metodo_pagamento  VARCHAR(30),
        status            VARCHAR(20) DEFAULT 'confirmado',
        endereco          JSONB,
        itens             JSONB NOT NULL,
        criado_em         TIMESTAMP DEFAULT NOW()
      );
    `);

    const { rows } = await client.query('SELECT COUNT(*) FROM produtos');
    if (parseInt(rows[0].count) === 0) {
      await seedProdutos(client);
    }

    console.log('✅ Banco de dados inicializado');
  } finally {
    client.release();
  }
}

async function seedProdutos(client) {
  const prods = [
    { emoji:'👟', nome:'Tênis Pro Run',    preco_display:'R$ 349,90', preco_val:349.90, tag:'Esportes',    descricao:'Tênis de alta performance para corridas urbanas. Solado EVA, cabedal respirável.' },
    { emoji:'🚴', nome:'Capacete Bike',    preco_display:'R$ 179,90', preco_val:179.90, tag:'Esportes',    descricao:'22 ventilações, viseira magnética, ajuste micro-ratchet, 280g.' },
    { emoji:'🏊', nome:'Óculos Natação',   preco_display:'R$ 89,90',  preco_val:89.90,  tag:'Esportes',    descricao:'Lentes anti-UV, vedação de silicone, ajuste fácil.' },
    { emoji:'⚽', nome:'Bola Society',     preco_display:'R$ 119,90', preco_val:119.90, tag:'Esportes',    descricao:'Termotecida, 32 gomos, costura reforçada. Tamanho 5.' },
    { emoji:'🏋️', nome:'Haltere 10kg',    preco_display:'R$ 99,90',  preco_val:99.90,  tag:'Fitness',     descricao:'Neoprene antiderrapante, núcleo ferro fundido.' },
    { emoji:'🧘', nome:'Tapete Yoga',      preco_display:'R$ 119,90', preco_val:119.90, tag:'Fitness',     descricao:'6mm TPE ecológico, antiderrapante, 183x61cm.' },
    { emoji:'🎧', nome:'Fone Bluetooth',   preco_display:'R$ 189,90', preco_val:189.90, tag:'Eletrônicos', descricao:'Over-ear, cancelamento de ruído, 30h de bateria, Bluetooth 5.3.' },
    { emoji:'⌚', nome:'Smartwatch X2',    preco_display:'R$ 599,90', preco_val:599.90, tag:'Eletrônicos', descricao:'Monitor cardíaco, GPS, 7 dias de bateria, 100+ modos esportivos.' },
    { emoji:'🎮', nome:'Controle Gamer',   preco_display:'R$ 219,90', preco_val:219.90, tag:'Games',       descricao:'Gatilhos adaptáveis, vibração háptica, 20h de bateria.' },
    { emoji:'👜', nome:'Bolsa Premium',    preco_display:'R$ 279,90', preco_val:279.90, tag:'Moda',        descricao:'Couro sintético premium, forro interno, fechamento magnético.' },
    { emoji:'👔', nome:'Camisa Social',    preco_display:'R$ 159,90', preco_val:159.90, tag:'Moda',        descricao:'Slim fit algodão premium, antirrugas, corte moderno.' },
    { emoji:'🧴', nome:'Kit Skincare',     preco_display:'R$ 189,90', preco_val:189.90, tag:'Beleza',      descricao:'Sérum vitamina C, hidratante FPS30, tônico. Vegano.' },
    { emoji:'🛋️', nome:'Almofada Zen',    preco_display:'R$ 59,90',  preco_val:59.90,  tag:'Casa',        descricao:'45x45cm, veludo removível, fibra siliconada premium.' },
    { emoji:'☕', nome:'Cafeteira Elét.',  preco_display:'R$ 229,90', preco_val:229.90, tag:'Cozinha',     descricao:'1,5L programável, filtro permanente, 12 xícaras.' },
    { emoji:'🏕️', nome:'Barraca 2p',      preco_display:'R$ 499,90', preco_val:499.90, tag:'Aventura',    descricao:'Fibra de vidro, impermeável 2000mm, montagem 5min.' },
  ];
  for (const p of prods) {
    await client.query(
      `INSERT INTO produtos (emoji,nome,preco_display,preco_val,tag,descricao) VALUES ($1,$2,$3,$4,$5,$6)`,
      [p.emoji, p.nome, p.preco_display, p.preco_val, p.tag, p.descricao]
    );
  }
  console.log('✅ Produtos seed inseridos');
}

/* ═══════════════════════════════════
   MIDDLEWARES AUTH
═══════════════════════════════════ */
function authCliente(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

function authAdmin(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Acesso negado' });
    req.user = decoded; next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
}

/* ═══════════════════════════════════
   ROTAS — CLIENTES
═══════════════════════════════════ */
app.post('/api/clientes/cadastro', async (req, res) => {
  const { nome, cep, telefone, senha } = req.body;
  if (!nome || !senha || senha.length < 4)
    return res.status(400).json({ error: 'Dados inválidos' });
  try {
    const exists = await pool.query('SELECT id FROM clientes WHERE LOWER(nome)=$1', [nome.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Nome já cadastrado' });
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO clientes (nome,cep,telefone,senha_hash) VALUES ($1,$2,$3,$4) RETURNING id,nome,cep,telefone,criado_em`,
      [nome, cep||'', telefone||'', hash]
    );
    const cliente = result.rows[0];
    const token = jwt.sign({ id: cliente.id, nome: cliente.nome }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, cliente });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

app.post('/api/clientes/login', async (req, res) => {
  const { nome, senha } = req.body;
  if (!nome || !senha) return res.status(400).json({ error: 'Dados inválidos' });
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE LOWER(nome)=$1', [nome.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Usuário não encontrado' });
    const cliente = result.rows[0];
    const ok = await bcrypt.compare(senha, cliente.senha_hash);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta' });
    const token = jwt.sign({ id: cliente.id, nome: cliente.nome }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, cliente: { id:cliente.id, nome:cliente.nome, cep:cliente.cep, telefone:cliente.telefone, foto_url:cliente.foto_url } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

app.put('/api/clientes/perfil', authCliente, async (req, res) => {
  const { nome, cep, telefone, foto_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE clientes SET nome=$1,cep=$2,telefone=$3,foto_url=$4 WHERE id=$5 RETURNING id,nome,cep,telefone,foto_url`,
      [nome, cep, telefone, foto_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

/* ═══════════════════════════════════
   ROTAS — PRODUTOS
═══════════════════════════════════ */
app.get('/api/produtos', async (req, res) => {
  const { tag, page=0, limit=12 } = req.query;
  try {
    let q = 'SELECT * FROM produtos WHERE ativo=true';
    const params = [];
    if (tag && tag !== 'Todos') { params.push(tag); q += ` AND tag=$${params.length}`; }
    params.push(parseInt(limit));
    params.push(parseInt(page) * parseInt(limit));
    q += ` ORDER BY id LIMIT $${params.length-1} OFFSET $${params.length}`;
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Erro ao buscar produtos' }); }
});

/* ═══════════════════════════════════
   ROTAS — VENDAS
═══════════════════════════════════ */
app.post('/api/vendas', authCliente, async (req, res) => {
  const { total, metodo_pagamento, status, endereco, itens } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vendas (cliente_id,cliente_nome,total,metodo_pagamento,status,endereco,itens)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,criado_em`,
      [req.user.id, req.user.nome, total, metodo_pagamento, status, JSON.stringify(endereco), JSON.stringify(itens)]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao registrar venda' }); }
});

app.get('/api/vendas/minhas', authCliente, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendas WHERE cliente_id=$1 ORDER BY criado_em DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Erro ao buscar vendas' }); }
});

/* ═══════════════════════════════════
   ROTAS — ADMIN
═══════════════════════════════════ */
app.post('/api/admin/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario !== ADMIN_USER || senha !== ADMIN_PASS)
    return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ isAdmin:true, usuario }, JWT_SECRET, { expiresIn:'8h' });
  res.json({ token });
});

app.get('/api/admin/stats', authAdmin, async (req, res) => {
  try {
    const [c, p, v] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clientes'),
      pool.query('SELECT COUNT(*) FROM produtos WHERE ativo=true'),
      pool.query('SELECT COUNT(*), COALESCE(SUM(total),0) AS receita FROM vendas'),
    ]);
    res.json({ total_clientes:parseInt(c.rows[0].count), total_produtos:parseInt(p.rows[0].count), total_pedidos:parseInt(v.rows[0].count), receita_total:parseFloat(v.rows[0].receita) });
  } catch (err) { res.status(500).json({ error: 'Erro ao buscar stats' }); }
});

app.get('/api/admin/clientes', authAdmin, async (_req, res) => {
  const result = await pool.query('SELECT id,nome,cep,telefone,criado_em FROM clientes ORDER BY criado_em DESC');
  res.json(result.rows);
});

app.get('/api/admin/vendas', authAdmin, async (_req, res) => {
  const result = await pool.query('SELECT * FROM vendas ORDER BY criado_em DESC LIMIT 200');
  res.json(result.rows);
});

app.get('/api/admin/produtos', authAdmin, async (_req, res) => {
  const result = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/admin/produtos', authAdmin, async (req, res) => {
  const { emoji,nome,preco_display,preco_val,tag,descricao } = req.body;
  const result = await pool.query(
    `INSERT INTO produtos (emoji,nome,preco_display,preco_val,tag,descricao) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [emoji,nome,preco_display,preco_val,tag,descricao]
  );
  res.json(result.rows[0]);
});

app.put('/api/admin/produtos/:id', authAdmin, async (req, res) => {
  const { emoji,nome,preco_display,preco_val,tag,descricao,ativo } = req.body;
  const result = await pool.query(
    `UPDATE produtos SET emoji=$1,nome=$2,preco_display=$3,preco_val=$4,tag=$5,descricao=$6,ativo=$7 WHERE id=$8 RETURNING *`,
    [emoji,nome,preco_display,preco_val,tag,descricao,ativo,req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/admin/produtos/:id', authAdmin, async (req, res) => {
  await pool.query('UPDATE produtos SET ativo=false WHERE id=$1', [req.params.id]);
  res.json({ ok:true });
});

/* ═══════════════════════════════════
   SERVIR HTML
═══════════════════════════════════ */
app.get('/',      (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

/* ═══════════════════════════════════
   START
═══════════════════════════════════ */
const PORT = process.env.PORT || 3000;
initDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 Leal Fashion → http://localhost:${PORT}`)))
  .catch(err => { console.error('❌ Falha ao iniciar:', err.message); process.exit(1); });