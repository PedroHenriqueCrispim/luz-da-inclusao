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
 *   RECURSOS_VIVOS "sim" liga Luz, avaliação, pedido de palestra e métricas (envios para o Apps Script).
 *   SITE_ORIGEM    endereço do site sem barra no fim (teste: https://pedrohenriquecrispim.github.io)
 *   INDEXAR        "sim" deixa o Google indexar; "nao" (área de teste) pede para o Google ignorar
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
const ORIGEM = String(process.env.SITE_ORIGEM || '').replace(/\/+$/, '');
const INDEXAR = String(process.env.INDEXAR || '').toLowerCase() === 'sim';
if (ORIGEM && !/^https:\/\/[a-z0-9.-]+$/i.test(ORIGEM)) throw new Error('SITE_ORIGEM inválido');
const urlCompleta = (r) => ORIGEM + (r === 'inicio' ? BASE : BASE + r + '/');

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

/** Dados estruturados (schema.org) que ajudam o Google a entender a página. */
function dadosEstruturados(rota, portal, titulo, descricao) {
  const c = portal.config;
  const nome = c.NOME_PROJETO || 'Projeto Luz da Inclusão';
  if (!ORIGEM) return null;
  const org = { '@type': 'Organization', name: nome, url: ORIGEM + BASE, logo: ORIGEM + BASE + 'assets/og.png' };
  const insta = /^https:\/\//.test(c.INSTAGRAM_URL || '') ? String(c.INSTAGRAM_URL).split('?')[0] : '';
  if (insta) org.sameAs = [insta];
  if (rota === 'inicio') {
    return { '@context': 'https://schema.org', '@graph': [org, { '@type': 'WebSite', name: nome, url: ORIGEM + BASE, inLanguage: 'pt-BR', description: descricao }] };
  }
  if (/^(entenda|na-pratica)\/[a-z0-9-]+$/.test(rota)) {
    return { '@context': 'https://schema.org', '@type': 'Article', headline: titulo, description: descricao, inLanguage: 'pt-BR', url: urlCompleta(rota), publisher: org, isAccessibleForFree: true };
  }
  if (/^glossario\/[a-z0-9-]+$/.test(rota)) {
    return { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: titulo, description: descricao, url: urlCompleta(rota), inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glossário da inclusão', url: urlCompleta('glossario') } };
  }
  return null;
}

function pagina(portal, versao, { titulo, descricao, topo = '', main = '', rodape = '' }, rota = 'inicio') {
  const c = portal.config;
  const nome = c.NOME_PROJETO || 'Projeto Luz da Inclusão';
  const tituloFinal = titulo && titulo !== nome && titulo !== c.HERO_TITULO ? `${titulo} · ${nome}` : nome;
  const desc = String(descricao || c.META_DESCRICAO || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const canonico = ORIGEM ? urlCompleta(rota) : '';
  const imagem = ORIGEM ? ORIGEM + BASE + 'assets/og.png' : '';
  const ld = dadosEstruturados(rota, portal, titulo || nome, desc);
  const seo = [
    `<meta name="robots" content="${INDEXAR ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}">`,
    canonico ? `<link rel="canonical" href="${esc(canonico)}">` : '',
    '<meta property="og:locale" content="pt_BR">',
    `<meta property="og:site_name" content="${esc(nome)}">`,
    `<meta property="og:type" content="${rota === 'inicio' ? 'website' : 'article'}">`,
    `<meta property="og:title" content="${esc(titulo || nome)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    canonico ? `<meta property="og:url" content="${esc(canonico)}">` : '',
    imagem ? `<meta property="og:image" content="${esc(imagem)}">` : '',
    imagem ? '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' : '',
    imagem ? `<meta property="og:image:alt" content="${esc(nome + ': informação, acolhimento e fé a serviço da inclusão')}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    ld ? `<script type="application/ld+json">${jsonJs(ld)}</script>` : ''
  ].filter(Boolean).join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(tituloFinal)}</title>
<meta name="description" content="${esc(desc)}">
${seo}
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
  const api = VIVOS && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec\?api=site$/.test(API) ? API.replace(/\?api=site$/, '') : '';
  await gravar('assets/boot.js', `window.__SITE__=${jsonJs({ base: BASE, versao, api })};window.__BOOT__=${jsonJs({ ok: true, data: portal })};\n`);

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
  for (const r of rotas) await gravar(arquivoDaRota(r), pagina(portal, versao, { titulo: '', descricao: '' }, r));

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
        await gravar(arquivoDaRota(r), pagina(portal, versao, s, r));
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

/* ------------------------------------------------------------------ 4. Google e compartilhamento */

/** Imagem de compartilhamento (WhatsApp, Instagram, Facebook): 1200×630, gerada com o Chrome. */
async function gerarImagemCompartilhamento(portal) {
  const c = portal.config;
  const lampada = '<svg viewBox="0 0 240 270" width="300"><defs><radialGradient id="g"><stop offset="0" stop-color="#FFC83D" stop-opacity=".55"/><stop offset="1" stop-color="#FFC83D" stop-opacity="0"/></radialGradient></defs><circle cx="120" cy="118" r="118" fill="url(#g)"/><g stroke="#FFC83D" stroke-width="8" stroke-linecap="round"><line x1="32" y1="118" x2="14" y2="118"/><line x1="43.8" y1="74" x2="28.2" y2="65"/><line x1="76" y1="41.8" x2="67" y2="26.2"/><line x1="120" y1="30" x2="120" y2="12"/><line x1="164" y1="41.8" x2="173" y2="26.2"/><line x1="196.2" y1="74" x2="211.8" y2="65"/><line x1="208" y1="118" x2="226" y2="118"/></g><path d="M83 186C63 170 50 148 50 118A70 70 0 0 1 190 118C190 148 177 170 157 186L154 204H86Z" fill="rgba(255,200,61,.12)" stroke="#FFC83D" stroke-width="9" stroke-linejoin="round"/><g transform="translate(84.34 98.86) scale(1.1)"><path fill="#FFC83D" d="M4 0L18 0C19.5 0 20.5 -1 20 -3A7.5 7.5 0 1 1 28 -3C27.5 -1 28.5 0 30 0L44 0A4 4 0 0 1 48 4L48 18C48 19.5 49 20.5 51 20A7.5 7.5 0 1 1 51 28C49 27.5 48 28.5 48 30L48 44A4 4 0 0 1 44 48L30 48C28.5 48 27.5 47 28 45A7.5 7.5 0 1 0 20 45C20.5 47 19.5 48 18 48L4 48A4 4 0 0 1 0 44L0 30C0 28.5 1 27.5 3 28A7.5 7.5 0 1 0 3 20C1 20.5 0 19.5 0 18L0 4A4 4 0 0 1 4 0Z"/></g><rect x="84" y="212" width="72" height="12" rx="6" fill="#FFC83D"/><rect x="90" y="230" width="60" height="12" rx="6" fill="#FFC83D" opacity=".85"/><rect x="104" y="248" width="32" height="10" rx="5" fill="#FFC83D" opacity=".7"/></svg>';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Atkinson+Hyperlegible:wght@400;700&display=swap"><style>
*{margin:0;padding:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;background:#0F1B4C;font-family:'Atkinson Hyperlegible',Arial,sans-serif;color:#FAF5EA;position:relative}
.c{position:absolute;border-radius:50%}.c1{width:420px;height:420px;background:#E04A3F;right:-140px;top:-160px}.c2{width:300px;height:300px;background:#2448B8;left:-120px;bottom:-140px}
.l{position:absolute;right:110px;top:160px}.t{position:absolute;left:80px;top:120px;width:660px}
.pre{color:#FFC83D;font-weight:700;font-size:30px}h1{font-family:'Bricolage Grotesque',Arial,sans-serif;font-weight:800;font-size:64px;line-height:1.02;letter-spacing:-1.5px;margin:14px 0 22px}
p{font-size:30px;line-height:1.35;color:#D9DEF0}.f{position:absolute;left:0;right:0;bottom:0;height:14px;display:flex}.f span{flex:1}</style></head><body>
<div class="c c1"></div><div class="c c2"></div><div class="l">${lampada}</div>
<div class="t"><p class="pre">${esc(c.NOME_PROJETO || 'Projeto Luz da Inclusão')}</p><h1>Inclusão é enxergar a pessoa antes do diagnóstico.</h1><p>Informação, acolhimento e fé a serviço da inclusão.</p></div>
<div class="f"><span style="background:#2448B8"></span><span style="background:#FFC83D"></span><span style="background:#E04A3F"></span><span style="background:#2E9A6B"></span><span style="background:#F28A2E"></span></div></body></html>`;
  await gravar('assets/og-card.html', html);
  await new Promise((resolver) => {
    const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--window-size=1200,630',
      '--virtual-time-budget=8000', '--screenshot=' + join(SAIDA, 'assets', 'og.png'), 'file://' + join(SAIDA, 'assets', 'og-card.html')], { stdio: 'ignore' });
    const limite = setTimeout(() => p.kill('SIGKILL'), 60000);
    p.on('close', () => { clearTimeout(limite); resolver(); });
    p.on('error', () => { clearTimeout(limite); resolver(); });
  });
  await rm(join(SAIDA, 'assets', 'og-card.html'), { force: true });
}

/** Mapa do site, robots.txt e página "não encontrada". */
async function gerarArquivosGoogle(rotas, portal, versao, geradoEm) {
  if (ORIGEM) {
    const dia = String(geradoEm || new Date().toISOString()).slice(0, 10);
    const urls = rotas.map((r) => `<url><loc>${esc(urlCompleta(r))}</loc><lastmod>${dia}</lastmod></url>`).join('\n');
    await gravar('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  }
  // O robots.txt só vale quando o site estiver na raiz do domínio (Etapa 6).
  await gravar('robots.txt', INDEXAR
    ? `User-agent: *\nAllow: /\n${ORIGEM ? `Sitemap: ${ORIGEM}${BASE}sitemap.xml\n` : ''}`
    : 'User-agent: *\nDisallow: /\n');
  const naoEncontrada = `<section class="pagina-topo escuro"><div class="container"><h1 class="pagina-topo__titulo">Página não encontrada</h1><p class="pagina-topo__resumo">O endereço pode ter mudado ou foi digitado errado.</p></div></section>
<section class="estado"><div class="estado__luz" aria-hidden="true"></div><h2 class="estado__titulo">Vamos te levar de volta para a luz. 💡</h2><p class="estado__texto">Use o menu acima ou volte para a página inicial.</p><a class="botao botao--escuro" href="${BASE}">Ir para o início</a></section>`;
  // Reaproveita o topo e o rodapé já montados da página inicial.
  const inicio = await readFile(join(SAIDA, 'index.html'), 'utf8');
  const topo = (inicio.match(/<header class="topo escuro" id="topo">([\s\S]*?)<\/header>/) || [])[1] || '';
  const rodape = (inicio.match(/<footer class="rodape escuro" id="rodape">([\s\S]*?)<\/footer>/) || [])[1] || '';
  const html = pagina(portal, versao, { titulo: 'Página não encontrada', descricao: '', topo, rodape, main: naoEncontrada }, 'inicio')
    .replace(/<link rel="canonical"[^>]*>\n?/, '')
    .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex">')
    .replace(/<script src="[^"]*app\.js[^"]*"><\/script>\n?/, '');
  await gravar('404.html', html);
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
  await gerarImagemCompartilhamento(portal);
  await gerarArquivosGoogle(rotas, portal, versao, d.geradoEm);
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
