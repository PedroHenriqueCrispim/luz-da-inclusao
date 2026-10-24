/**
 * Gerador do site do Projeto Luz da Inclusão.
 *
 * Como funciona:
 *  1. Busca na "porta" do Apps Script (?api=site) os conteúdos públicos E o código/estilos do portal.
 *  2. Grava os arquivos do site: estilos, código, "ponte" e os dados (dados/*.json).
 *  3. Abre cada página num Chrome invisível, deixa o próprio código do portal montar a página
 *     e salva o resultado como HTML pronto (é isso que o Google lê).
 *  No navegador do visitante, o mesmo código "assume" a página e tudo funciona como no portal.
 *
 * Sem bibliotecas externas: só Node.js e o Chrome que já vem no computador do GitHub.
 *
 * Variáveis (no .github/workflows/gerar-site.yml):
 *   PORTAL_API     endereço da porta (…/exec?api=site)
 *   BASE_PATH      caminho base (teste: /luz-da-inclusao/site-novo/ · com domínio próprio: /)
 *   SAIDA          pasta onde o site é gravado
 *   CHROME         programa do Chrome (no GitHub: google-chrome)
 *   RECURSOS_VIVOS "sim" liga Luz/avaliação/pedido (Etapa 4). Enquanto não, a Luz fica escondida.
 *   DADOS_ARQUIVO  (só para teste local) arquivo JSON no lugar da porta
 */

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { dirname, join, normalize, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const AQUI = dirname(fileURLToPath(import.meta.url));
const API = process.env.PORTAL_API || '';
const BASE = normalizarBase(process.env.BASE_PATH || '/');
const SAIDA = resolve(process.env.SAIDA || 'site-novo');
const CHROME = process.env.CHROME || 'google-chrome';
const VIVOS = String(process.env.RECURSOS_VIVOS || '').toLowerCase() === 'sim';
const PARALELO = 4;

/* ------------------------------------------------------------------ Utilidades seguras */

function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function normalizarBase(b) {
  let x = String(b).trim();
  if (!x.startsWith('/')) x = '/' + x;
  if (!x.endsWith('/')) x += '/';
  if (!/^\/[a-z0-9\-/]*$/i.test(x)) throw new Error('BASE_PATH inválido');
  return x;
}
const ROTA_OK = /^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,80})?$/;
const SLUG_OK = /^[a-z0-9-]{1,80}$/;
/** JSON seguro para colocar dentro de arquivo .js (sem "</script>"). */
const jsonJs = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

async function gravar(rel, conteudo) {
  const destino = join(SAIDA, rel);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, conteudo, 'utf8');
}
const arquivoDaRota = (r) => (r === 'inicio' ? '' : r + '/') + 'index.html';

/* ------------------------------------------------------------------ 1. Dados */

async function carregarDados() {
  let texto;
  if (process.env.DADOS_ARQUIVO) {
    texto = await readFile(process.env.DADOS_ARQUIVO, 'utf8');
  } else {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec\?api=site$/.test(API)) throw new Error('PORTAL_API inválido.');
    const r = await fetch(API, { redirect: 'follow', headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error('A porta do Apps Script respondeu HTTP ' + r.status);
    texto = await r.text();
  }
  const pacote = JSON.parse(texto);
  if (!pacote || pacote.ok !== true || !pacote.data || pacote.data.versao !== 1) {
    throw new Error('Pacote inválido: ' + (pacote && pacote.message ? pacote.message : 'formato inesperado'));
  }
  const d = pacote.data;
  if (!d.portal || !d.portal.config || !Array.isArray(d.portal.navegacao) || !d.cliente || !d.cliente.js || !d.cliente.css) {
    throw new Error('Pacote incompleto: atualize o SiteExport no Apps Script e publique a Nova versão.');
  }
  return d;
}

/** Enquanto as partes vivas não estão ligadas (Etapa 4), a Luz some do site. */
function ajustarPortal(portal) {
  const p = JSON.parse(JSON.stringify(portal));
  if (!VIVOS) {
    p.config.ASSISTENTE_DISPONIVEL = '';
    p.navegacao = p.navegacao.filter((n) => n.id !== 'pergunte');
  }
  return p;
}

/** Lista de todas as páginas a gerar. */
function listarRotas(d, portal) {
  const rotas = new Set(['inicio']);
  portal.navegacao.forEach((n) => { if (SLUG_OK.test(n.id)) rotas.add(n.id); });
  Object.values(d.conteudos || {}).forEach((c) => {
    const area = c.rota === 'na-pratica' ? 'na-pratica' : 'entenda';
    if (SLUG_OK.test(c.slug || '')) rotas.add(area + '/' + c.slug);
  });
  ((d.pratica && d.pratica.categorias) || []).forEach((c) => { if (SLUG_OK.test(c.slug || '')) rotas.add('na-pratica/' + c.slug); });
  Object.keys(d.termos || {}).forEach((id) => { if (SLUG_OK.test(id)) rotas.add('glossario/' + id); });
  return [...rotas].filter((r) => r === 'inicio' || ROTA_OK.test(r));
}

/* ------------------------------------------------------------------ 2. Arquivos do site */

/** Política de segurança: o navegador só carrega o que vem de origens permitidas. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0F1B4C"/><path d="M24 44h16M26 50h12M32 12a14 14 0 0 0-8 25.5c1.3 1 2 2.5 2 4V42h12v-.5c0-1.5.7-3 2-4A14 14 0 0 0 32 12z" fill="none" stroke="#FFC83D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>');

function pagina(portal, versao, { titulo, descricao, topo = '', main = '', rodape = '' }) {
  const c = portal.config;
  const nome = c.NOME_PROJETO || 'Projeto Luz da Inclusão';
  const tituloFinal = titulo && titulo !== nome && titulo !== c.HERO_TITULO ? `${titulo} · ${nome}` : nome;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(tituloFinal)}</title>
<meta name="description" content="${esc(String(descricao || c.META_DESCRICAO || '').slice(0, 300))}">
<meta name="theme-color" content="#0F1B4C">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&amp;family=Bricolage+Grotesque:opsz,wght@12..96,500..800&amp;display=swap">
<link rel="stylesheet" href="${BASE}assets/estilos.css?v=${versao}">
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo escuro" id="topo">${topo}</header>
<main id="conteudo" tabindex="-1">${main}</main>
<div class="faixa-cores" aria-hidden="true"></div>
<footer class="rodape escuro" id="rodape">${rodape}</footer>
<script src="${BASE}assets/boot.js?v=${versao}"></script>
<script src="${BASE}assets/ponte.js?v=${versao}"></script>
<script src="${BASE}assets/app.js?v=${versao}"></script>
</body>
</html>
`;
}

async function gravarArquivos(d, portal, versao) {
  await rm(SAIDA, { recursive: true, force: true });
  await gravar('assets/estilos.css', d.cliente.css);
  await gravar('assets/app.js', d.cliente.js);
  await gravar('assets/ponte.js', await readFile(join(AQUI, 'ponte.js'), 'utf8'));
  await gravar('assets/boot.js', `window.__SITE__=${jsonJs({ base: BASE, versao })};window.__BOOT__=${jsonJs({ ok: true, data: portal })};\n`);

  const dado = (o) => JSON.stringify({ ok: true, data: o === undefined ? null : o });
  await gravar('dados/portal.json', dado(portal));
  for (const nome of ['entenda', 'pratica', 'glossario', 'checklist', 'fe', 'projeto', 'palestras', 'simbolos', 'datas', 'historia', 'materiais', 'busca']) {
    await gravar(`dados/${nome}.json`, dado(d[nome]));
  }
  for (const [slug, c] of Object.entries(d.conteudos || {})) if (SLUG_OK.test(slug)) await gravar(`dados/conteudos/${slug}.json`, dado(c));
  for (const [id, t] of Object.entries(d.termos || {})) if (SLUG_OK.test(id)) await gravar(`dados/termos/${id}.json`, dado(t));
  await writeFile(join(SAIDA, '.nojekyll'), '');
}

/* ------------------------------------------------------------------ 3. Pré-montagem com o Chrome */

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };

/** Servidor local, só para o Chrome abrir as páginas durante a geração. */
function servidorLocal() {
  return new Promise((resolver) => {
    const srv = createServer(async (req, res) => {
      try {
        let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (!caminho.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
        caminho = caminho.slice(BASE.length);
        if (caminho === '' || caminho.endsWith('/')) caminho += 'index.html';
        const arq = normalize(join(SAIDA, caminho));
        if (!arq.startsWith(SAIDA)) { res.writeHead(403); res.end(); return; }
        const conteudo = await readFile(arq);
        res.writeHead(200, { 'content-type': TIPOS[extname(arq)] || 'application/octet-stream' });
        res.end(conteudo);
      } catch (e) {
        res.writeHead(404); res.end();
      }
    });
    srv.listen(0, '127.0.0.1', () => resolver(srv));
  });
}

function montarComChrome(url) {
  return new Promise((resolver, rejeitar) => {
    const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-extensions',
      '--virtual-time-budget=20000', '--dump-dom', url];
    const p = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    let saida = '';
    const limite = setTimeout(() => { p.kill('SIGKILL'); rejeitar(new Error('tempo esgotado')); }, 60000);
    p.stdout.on('data', (b) => { saida += b; });
    p.on('error', (e) => { clearTimeout(limite); rejeitar(e); });
    p.on('close', () => {
      clearTimeout(limite);
      const m = saida.match(/<<<SAIDA([\s\S]*?)SAIDA>>>/);
      if (!m) { rejeitar(new Error('a página não terminou de montar')); return; }
      try { resolver(JSON.parse(m[1])); } catch (e) { rejeitar(e); }
    });
  });
}

async function preMontar(rotas, portal, versao) {
  // Primeiro, uma "casca" em cada endereço (é o que o Chrome abre; se algo falhar, ela continua funcionando).
  const casca = pagina(portal, versao, { titulo: '', descricao: '' });
  for (const r of rotas) await gravar(arquivoDaRota(r), casca);

  const srv = await servidorLocal();
  const porta = srv.address().port;
  const falhas = [];
  let feitas = 0;
  const fila = [...rotas];
  async function trabalhador() {
    while (fila.length) {
      const r = fila.shift();
      const url = `http://127.0.0.1:${porta}${BASE}${r === 'inicio' ? '' : r + '/'}?prerender=1`;
      try {
        let s;
        try { s = await montarComChrome(url); } catch (e) { s = await montarComChrome(url); }
        await gravar(arquivoDaRota(r), pagina(portal, versao, s));
        feitas++;
      } catch (e) {
        falhas.push(r + ' (' + e.message + ')');
      }
    }
  }
  await Promise.all(Array.from({ length: PARALELO }, trabalhador));
  srv.close();
  return { feitas, falhas };
}

/* ------------------------------------------------------------------ Execução */

async function principal() {
  const d = await carregarDados();
  const portal = ajustarPortal(d.portal);
  const versao = createHash('sha256').update(String(d.geradoEm) + d.cliente.js.length).digest('hex').slice(0, 10);
  await gravarArquivos(d, portal, versao);
  const rotas = listarRotas(d, portal);
  console.log(`Gerando ${rotas.length} páginas...`);
  const { feitas, falhas } = await preMontar(rotas, portal, versao);
  console.log(`Páginas prontas: ${feitas} de ${rotas.length}.`);
  if (falhas.length) {
    console.log('Páginas que ficaram só com a versão leve (funcionam, mas o Google lê menos):\n- ' + falhas.join('\n- '));
    if (falhas.length > rotas.length / 4) throw new Error('Muitas páginas falharam. Nada foi publicado.');
  }
  console.log(`Site gerado em "${SAIDA}" (base ${BASE}). Pacote de ${d.geradoEm}.`);
}

principal().catch((erro) => {
  console.error('Falha ao gerar o site:', erro.message);
  process.exit(1);
});
