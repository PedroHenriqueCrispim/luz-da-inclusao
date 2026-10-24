/**
 * Gerador do site do Projeto Luz da Inclusão.
 *
 * Busca os conteúdos públicos na "porta" do Apps Script (?api=site) e monta páginas HTML
 * prontas, que o GitHub Pages publica. Sem bibliotecas externas: só Node.js puro
 * (menos dependências = menos risco de segurança).
 *
 * Variáveis (definidas no arquivo .github/workflows/gerar-site.yml):
 *   PORTAL_API  endereço da porta (…/exec?api=site)
 *   BASE_PATH   caminho base do site (ex.: /luz-da-inclusao/site-novo/ no teste; / com domínio próprio)
 *   SAIDA       pasta onde as páginas são gravadas (ex.: site-novo)
 *   DADOS_ARQUIVO (opcional, só para testes locais) arquivo JSON no lugar da porta
 *
 * Etapa 2: estrutura (topo, rodapé, estilos) e a página inicial.
 */

import { mkdir, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const API = process.env.PORTAL_API || '';
const BASE = normalizarBase(process.env.BASE_PATH || '/');
const SAIDA = process.env.SAIDA || 'site-novo';

/* ------------------------------------------------------------------ Segurança básica */

/** Escapa texto para HTML (conteúdo e atributos). Todo dado da planilha passa por aqui. */
function esc(valor) {
  return String(valor === undefined || valor === null ? '' : valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizarBase(b) {
  let x = String(b).trim();
  if (!x.startsWith('/')) x = '/' + x;
  if (!x.endsWith('/')) x += '/';
  if (!/^\/[a-z0-9\-/]*$/i.test(x)) throw new Error('BASE_PATH inválido');
  return x;
}

/** Caminho interno de uma página (ex.: "entenda/tea" → /base/entenda/tea/). */
function rota(caminho) {
  const c = String(caminho || '').replace(/^#?\/?/, '').replace(/\/+$/, '');
  if (!c || c === 'inicio') return BASE;
  if (!/^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,80})?$/.test(c)) return BASE;
  return BASE + c + '/';
}

/** Converte os links da planilha: #/pagina vira caminho do site; https:// fica; o resto é descartado. */
function link(valor) {
  const v = String(valor || '').trim();
  if (!v) return '';
  if (v.startsWith('#/')) return rota(v.slice(2));
  if (/^#[a-z0-9-]{1,60}$/i.test(v)) return v;
  if (/^https:\/\/[^\s"'<>]+$/i.test(v)) return v;
  return '';
}

function externo(href) { return /^https:/i.test(href); }

/* ------------------------------------------------------------------ Peças visuais (iguais ao portal) */

const ICONES = {
  livro: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14"/><path d="M8 7h8"/>',
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  coracao: '<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20z"/>',
  pessoas: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-1.5A4.5 4.5 0 0 1 6.5 15h5a4.5 4.5 0 0 1 4.5 4.5V21"/><path d="M16 3.3a4 4 0 0 1 0 7.4M22 21v-1.5a4.5 4.5 0 0 0-3-4.2"/>',
  peca: '<path d="M 3.67 7.43 L 7.77 7.43 C 8.21 7.43 8.51 7.14 8.36 6.55 A 2.2 2.2 0 1 1 10.7 6.55 C 10.56 7.14 10.85 7.43 11.29 7.43 L 15.39 7.43 A 1.17 1.17 0 0 1 16.56 8.6 L 16.56 12.7 C 16.56 13.14 16.86 13.44 17.44 13.29 A 2.2 2.2 0 1 1 17.44 15.63 C 16.86 15.49 16.56 15.78 16.56 16.22 L 16.56 20.32 A 1.17 1.17 0 0 1 15.39 21.49 L 11.29 21.49 C 10.85 21.49 10.56 21.2 10.7 20.61 A 2.2 2.2 0 1 0 8.36 20.61 C 8.51 21.2 8.21 21.49 7.77 21.49 L 3.67 21.49 A 1.17 1.17 0 0 1 2.5 20.32 L 2.5 16.22 C 2.5 15.78 2.79 15.49 3.38 15.63 A 2.2 2.2 0 1 0 3.38 13.29 C 2.79 13.44 2.5 13.14 2.5 12.7 L 2.5 8.6 A 1.17 1.17 0 0 1 3.67 7.43Z"/>',
  cruz: '<path d="M12 3v18M7 8.5h10"/>',
  microfone: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  luz: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
  maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'
};
const CORES = ['azul', 'amarelo', 'vermelho', 'verde', 'laranja'];
const cor = (c) => (CORES.includes(c) ? c : 'azul');

function icone(nome, classe = '') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="ico${classe ? ' ' + classe : ''}">${ICONES[nome] || ICONES.luz}</svg>`;
}

let contadorId = 0;
function lampada(classe, comBrilho) {
  const id = 'brilho-' + (++contadorId);
  let raios = '';
  if (comBrilho) {
    for (let a = -180; a <= 0; a += 30) {
      const r = a * Math.PI / 180;
      raios += `<line x1="${(120 + Math.cos(r) * 88).toFixed(1)}" y1="${(118 + Math.sin(r) * 88).toFixed(1)}" x2="${(120 + Math.cos(r) * 106).toFixed(1)}" y2="${(118 + Math.sin(r) * 106).toFixed(1)}"/>`;
    }
  }
  const brilho = comBrilho
    ? `<defs><radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" class="lamp-stop1"/><stop offset="100%" class="lamp-stop2"/></radialGradient></defs><circle class="lamp-brilho" cx="120" cy="118" r="118" fill="url(#${id})"/><g class="lamp-raios">${raios}</g>`
    : '';
  return `<svg viewBox="${comBrilho ? '0 0 240 270' : '44 40 152 222'}" aria-hidden="true" focusable="false" class="${classe}">${brilho}` +
    '<path class="lamp-vidro" d="M83 186C63 170 50 148 50 118A70 70 0 0 1 190 118C190 148 177 170 157 186L154 204H86Z"/>' +
    '<g transform="translate(84.34 98.86) scale(1.1)"><path class="lamp-peca" d="M4 0L18 0C19.5 0 20.5 -1 20 -3A7.5 7.5 0 1 1 28 -3C27.5 -1 28.5 0 30 0L44 0A4 4 0 0 1 48 4L48 18C48 19.5 49 20.5 51 20A7.5 7.5 0 1 1 51 28C49 27.5 48 28.5 48 30L48 44A4 4 0 0 1 44 48L30 48C28.5 48 27.5 47 28 45A7.5 7.5 0 1 0 20 45C20.5 47 19.5 48 18 48L4 48A4 4 0 0 1 0 44L0 30C0 28.5 1 27.5 3 28A7.5 7.5 0 1 0 3 20C1 20.5 0 19.5 0 18L0 4A4 4 0 0 1 4 0Z"/></g>' +
    '<rect class="lamp-base" x="84" y="212" width="72" height="12" rx="6"/><rect class="lamp-base lamp-base--2" x="90" y="230" width="60" height="12" rx="6"/><rect class="lamp-base lamp-base--3" x="104" y="248" width="32" height="10" rx="5"/></svg>';
}

const onda = () => '<svg viewBox="0 0 1440 80" aria-hidden="true" focusable="false" class="onda" preserveAspectRatio="none"><path d="M0 48C240 80 480 80 720 56S1200 8 1440 32V80H0Z"/></svg>';

function ancora(href, classe, conteudo) {
  const h = link(href);
  if (!h) return `<span class="${esc(classe)}">${conteudo}</span>`;
  const ext = externo(h) ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a class="${esc(classe)}" href="${esc(h)}"${ext}>${conteudo}</a>`;
}
const botao = (rotulo, href, variante, nomeIcone) => ancora(href, 'botao botao--' + variante, (nomeIcone ? icone(nomeIcone) : '') + esc(rotulo));

/* ------------------------------------------------------------------ Topo, menu e rodapé */

const GRUPOS_MENU = [
  { titulo: 'Aprender', itens: ['entenda', 'glossario', 'pergunte', 'simbolos', 'historia'] },
  { titulo: 'Inclusão na prática', itens: [['na-pratica', 'Todos os ambientes']],
    sub: [['na-pratica/na-igreja', 'Na igreja'], ['checklist', 'Checklist: minha igreja é inclusiva?'], ['na-pratica/na-familia', 'Na família'], ['na-pratica/na-escola', 'Na escola'], ['na-pratica/no-trabalho', 'No trabalho']] },
  { titulo: 'Fé', itens: ['fe-e-inclusao', 'ministracoes'] },
  { titulo: 'Recursos', itens: ['materiais', 'calendario'] },
  { titulo: 'O projeto', itens: ['projeto', 'palestras', 'privacidade'] }
];
const RODAPE_GRUPOS = { aprender: ['glossario', 'simbolos', 'historia', 'calendario'], recursos: ['materiais', 'checklist', 'ministracoes'], projeto: ['projeto', 'privacidade'] };
const RODAPE_ROTULOS = { checklist: 'Checklist da igreja', calendario: 'Calendário da inclusão' };

function marca(D) {
  const nome = D.config.NOME_PROJETO || 'Projeto Luz da Inclusão';
  const p = nome.match(/^(Projeto)\s+(.+)$/i);
  const texto = p
    ? `<span class="marca__texto"><span class="marca__pre">${esc(p[1])}</span><span class="marca__nome">${esc(p[2])}</span></span>`
    : `<span class="marca__texto"><span class="marca__nome">${esc(nome)}</span></span>`;
  return lampada('marca__simbolo', false) + texto;
}

function topo(D, atual) {
  const nav = D.navegacao.filter((n) => n.topo);
  const atualAttr = (id) => (id === atual ? ' aria-current="page"' : '');
  const links = nav.map((n) => n.id === 'pergunte'
    ? `<li><a class="topo__link topo__link--ia" href="${rota('pergunte')}"${atualAttr('pergunte')}>${icone('luz')}<span class="topo__ia-curto">Pergunte</span><span class="topo__ia-longo"> à Luz</span></a></li>`
    : `<li><a class="topo__link" href="${rota(n.id)}"${atualAttr(n.id)}>${esc(n.rotulo)}</a></li>`).join('');
  const temLuz = nav.some((n) => n.id === 'pergunte');

  const existe = (id) => D.navegacao.some((n) => n.id === id);
  const rotulo = (id) => (D.navegacao.find((n) => n.id === id) || { rotulo: id }).rotulo;
  const usados = { inicio: true };
  const grupos = GRUPOS_MENU.map((g) => {
    const itens = g.itens.map((it) => {
      const id = Array.isArray(it) ? it[0] : it;
      if (!existe(id)) return '';
      usados[id] = true;
      return `<li><a class="menu-movel__link" href="${rota(id)}"${atualAttr(id)}>${esc(Array.isArray(it) ? it[1] : rotulo(id))}</a></li>`;
    }).join('');
    (g.sub || []).forEach((sb) => { usados[sb[0].split('/')[0]] = true; });
    const subs = (g.sub || []).map((sb) => `<li><a class="tudo__sub" href="${rota(sb[0])}">${esc(sb[1])}</a></li>`).join('');
    return itens ? `<section class="tudo__grupo"><h2 class="tudo__titulo">${esc(g.titulo)}</h2><ul>${itens}${subs}</ul></section>` : '';
  }).join('');
  const kids = link(D.config.LINK_KIDS);
  const resto = D.navegacao.filter((n) => !usados[n.id]);
  const extras = (kids ? `<section class="tudo__grupo"><h2 class="tudo__titulo">Para as crianças</h2><ul><li><a class="menu-movel__link" href="${esc(kids)}" target="_blank" rel="noopener noreferrer">Portal Kids</a></li></ul></section>` : '') +
    (resto.length ? `<section class="tudo__grupo"><h2 class="tudo__titulo">Mais</h2><ul>${resto.map((n) => `<li><a class="menu-movel__link" href="${rota(n.id)}">${esc(n.rotulo)}</a></li>`).join('')}</ul></section>` : '');
  const insta = link(D.config.INSTAGRAM_URL);

  return `<header class="topo escuro" id="topo">
<div class="container topo__barra">
<a class="marca" href="${BASE}" aria-label="${esc(D.config.NOME_PROJETO || 'Projeto Luz da Inclusão')}, página inicial">${marca(D)}</a>
<nav class="topo__nav" aria-label="Principal"><ul>${links}</ul></nav>
<div class="topo__acoes">
${temLuz ? `<a class="topo__ia-btn" href="${rota('pergunte')}">${icone('luz')}<span class="topo__ia-rotulo">Pergunte</span></a>` : ''}
<button class="topo__menu-btn" type="button" aria-expanded="false" aria-controls="menu-movel" data-abrir-menu>${icone('menu')}<span class="topo__menu-rotulo">Tudo</span><span class="sr-only">: ver todas as páginas</span></button>
</div>
</div>
<div class="menu-fundo" hidden data-fechar-menu></div>
<div class="menu-movel" id="menu-movel" hidden role="dialog" aria-modal="true" aria-label="Todas as páginas">
<div class="menu-movel__topo"><span class="marca" aria-hidden="true">${marca(D)}</span><button class="topo__menu-btn topo__menu-btn--fechar" type="button" data-fechar-menu>${icone('fechar')}<span class="sr-only">Fechar</span></button></div>
<nav class="tudo" aria-label="Todas as páginas"><a class="menu-movel__link tudo__inicio" href="${BASE}"${atualAttr('inicio')}>Início</a>${grupos}${extras}</nav>
<div class="menu-movel__rodape">${D.config.PRINCIPIO ? `<p>${esc(D.config.PRINCIPIO)}</p>` : ''}${insta ? `<a href="${esc(insta)}" target="_blank" rel="noopener noreferrer">Acompanhe no Instagram</a>` : ''}</div>
</div>
</header>`;
}

function rodape(D) {
  const c = D.config;
  const lema = String(c.RODAPE_LEMA || '').split('|').map((s) => s.trim()).filter(Boolean);
  const usuario = String(c.INSTAGRAM_USUARIO || '').replace(/^@/, '');
  const pag = (ids) => ids.map((id) => D.navegacao.find((n) => n.id === id && !n.topo)).filter(Boolean);
  const usados = [].concat(RODAPE_GRUPOS.aprender, RODAPE_GRUPOS.recursos, RODAPE_GRUPOS.projeto, ['inicio']);
  const soltas = D.navegacao.filter((n) => !n.topo && !usados.includes(n.id));
  const item = (n) => `<li><a href="${rota(n.id)}">${esc(RODAPE_ROTULOS[n.id] || n.rotulo)}</a></li>`;
  const coluna = (titulo, lista, extra = '') => (lista.length || extra)
    ? `<nav class="rodape__coluna" aria-label="${esc(titulo)}"><h2 class="rodape__titulo">${esc(titulo)}</h2><ul>${lista.map(item).join('')}${extra}</ul></nav>` : '';
  const kids = link(c.LINK_KIDS);
  const insta = link(c.INSTAGRAM_URL);
  const email = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(c.EMAIL || '') ? c.EMAIL : '';
  return `<div class="faixa-cores" aria-hidden="true"></div>
<footer class="rodape escuro" id="rodape">
<div class="container rodape__grade">
<div><div class="rodape__marca">${marca(D)}</div>${lema.length ? `<p class="rodape__lema">${lema.map((l) => `<span>${esc(l)}</span>`).join('')}</p>` : ''}</div>
${coluna('Navegue', D.navegacao.filter((n) => n.topo))}
${coluna('Aprender', pag(RODAPE_GRUPOS.aprender))}
${coluna('Recursos', pag(RODAPE_GRUPOS.recursos).concat(soltas), kids ? `<li><a href="${esc(kids)}" target="_blank" rel="noopener noreferrer">Portal Kids</a></li>` : '')}
<div class="rodape__coluna"><h2 class="rodape__titulo">O projeto</h2><ul>${pag(RODAPE_GRUPOS.projeto).map(item).join('')}
${insta ? `<li><a href="${esc(insta)}" target="_blank" rel="noopener noreferrer">${icone('instagram')}${esc(usuario ? '@' + usuario : 'Instagram')}</a></li>` : ''}
${email ? `<li><a href="mailto:${esc(email)}">${icone('email')}${esc(email)}</a></li>` : ''}</ul></div>
</div>
<div class="container rodape__base">${c.RODAPE_MENSAGEM ? `<p class="rodape__mensagem">${esc(c.RODAPE_MENSAGEM)}</p>` : ''}<p class="rodape__copy">© ${esc(D.ano)} ${esc(c.NOME_PROJETO || 'Projeto Luz da Inclusão')}</p></div>
</footer>`;
}

/* ------------------------------------------------------------------ Página (moldura) */

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0F1B4C"/><path d="M24 44h16M26 50h12M32 12a14 14 0 0 0-8 25.5c1.3 1 2 2.5 2 4V42h12v-.5c0-1.5.7-3 2-4A14 14 0 0 0 32 12z" fill="none" stroke="#FFC83D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>');

/** Política de segurança: o navegador só carrega estilos, fontes, imagens e scripts de origens permitidas. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https://pedrohenriquecrispim.github.io",
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

function documento(D, { titulo, descricao, atual, corpo }) {
  const nome = D.config.NOME_PROJETO || 'Projeto Luz da Inclusão';
  const tituloFinal = titulo ? `${titulo} · ${nome}` : nome;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(tituloFinal)}</title>
<meta name="description" content="${esc(descricao || D.config.META_DESCRICAO || '')}">
<meta name="theme-color" content="#0F1B4C">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&amp;family=Bricolage+Grotesque:opsz,wght@12..96,500..800&amp;display=swap">
<link rel="stylesheet" href="${BASE}assets/estilos.css">
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${topo(D, atual)}
<main id="conteudo" tabindex="-1">
${corpo}
</main>
${rodape(D)}
<script src="${BASE}assets/site.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ Página inicial */

function paginaInicial(D) {
  const c = D.config;
  const home = D.home || {};
  const v = D.base;
  const hero = `<section class="hero escuro" aria-labelledby="hero-titulo">
<div class="container hero__grade">
<div class="hero__arte">${lampada('lampada lampada--acende', true)}</div>
<div>
<p class="hero__nome">${esc(c.NOME_PROJETO || 'Projeto Luz da Inclusão')}</p>
<h1 id="hero-titulo" class="hero__titulo">${esc(c.HERO_TITULO || c.NOME_PROJETO || '')}</h1>
${c.HERO_TEXTO ? `<p class="hero__texto">${esc(c.HERO_TEXTO)}</p>` : ''}
<div class="hero__acoes">${botao('Conheça o projeto', '#/projeto', 'luz')}${botao('Entenda a inclusão', '#/entenda', 'claro')}${botao('Explore os temas', '#temas', 'link')}</div>
</div>
</div>
${onda()}
</section>`;

  const pilares = (home.pilares || []).length ? `<section class="secao pilares" aria-labelledby="pilares-titulo"><div class="container">
<h2 id="pilares-titulo" class="titulo-secao">${esc(c.PILARES_TITULO || 'O que nos move')}</h2>
<ul class="pilares__lista">${home.pilares.map((p) => `<li class="pilar c-${cor(p.cor)}"><div class="pilar__topo"><h3 class="pilar__verbo">${esc(p.titulo)}</h3><span class="pilar__icone">${icone(p.icone)}</span></div>${p.texto ? `<p class="pilar__texto">${esc(p.texto)}</p>` : ''}</li>`).join('')}</ul>
</div></section>` : '';

  const principio = c.PRINCIPIO ? `<section class="secao principio" aria-label="Nosso princípio"><div class="container principio__caixa">${icone('peca', 'principio__peca')}<p class="principio__frase">${esc(c.PRINCIPIO)}</p>${c.PRINCIPIO_TEXTO ? `<p class="principio__texto">${esc(c.PRINCIPIO_TEXTO)}</p>` : ''}</div></section>` : '';

  let figura = '';
  if (v && v.texto) {
    const detalhes = v.contexto || v.reflexao || v.aplicacao;
    figura = `<figure class="versiculo escuro"><blockquote class="versiculo__texto"><p>“${esc(v.texto)}”</p></blockquote><figcaption class="versiculo__ref">${esc(v.referencia)}</figcaption>${detalhes ? `<details class="versiculo__contexto"><summary>Contexto e reflexão</summary>${v.contexto ? `<p><strong>Contexto. </strong>${esc(v.contexto)}</p>` : ''}${v.reflexao ? `<p><strong>Reflexão. </strong>${esc(v.reflexao)}</p>` : ''}${v.aplicacao ? `<p><strong>Na prática. </strong>${esc(v.aplicacao)}</p>` : ''}</details>` : ''}</figure>`;
  }
  const base = (c.BASE_TEXTO || v) ? `<section class="secao base" id="nossa-base" aria-labelledby="base-titulo"><div class="container base__grade"><div class="base__texto"><h2 id="base-titulo" class="titulo-secao">${esc(c.BASE_TITULO || 'Nossa base')}</h2>${c.BASE_TEXTO ? `<p>${esc(c.BASE_TEXTO)}</p>` : ''}${botao('Ler sobre fé e inclusão', '#/fe-e-inclusao', 'escuro')}</div>${figura}</div></section>` : '';

  const temas = (home.temas || []).length ? `<section class="secao temas" id="temas" tabindex="-1" aria-labelledby="temas-titulo"><div class="container">
<h2 id="temas-titulo" class="titulo-secao">${esc(c.TEMAS_TITULO || 'O que você encontra aqui')}</h2>
${c.TEMAS_TEXTO ? `<p class="intro">${esc(c.TEMAS_TEXTO)}</p>` : ''}
<ul class="temas__grade">${home.temas.map((t) => `<li>${ancora(t.link, 'cartao c-' + cor(t.cor), `<span class="cartao__icone">${icone(t.icone)}</span><h3 class="cartao__titulo">${esc(t.titulo)}</h3>${t.texto ? `<p class="cartao__texto">${esc(t.texto)}</p>` : ''}`)}</li>`).join('')}</ul>
</div></section>` : '';

  const luz = c.ASSISTENTE_DISPONIVEL === 'SIM' ? `<section class="luz-convite" aria-labelledby="luz-convite-titulo"><div class="container"><div class="luz-convite__caixa">
<span class="luz-avatar luz-avatar--convite">${lampada('luz-avatar__svg', true)}</span>
<div class="luz-convite__texto"><h2 id="luz-convite-titulo" class="luz-convite__titulo">Ficou com alguma dúvida? Pergunte à Luz.</h2>
<p>A Luz é a assistente do portal: ela responde em linguagem simples e mostra onde ler mais.</p>
<div class="luz-convite__acoes">${botao('Conversar com a Luz', '#/pergunte', 'luz', 'luz')}</div></div>
</div></div></section>` : '';

  const kidsLink = link(c.LINK_KIDS);
  const kids = kidsLink ? `<section class="kids-faixa" aria-labelledby="kids-titulo"><div class="container"><div class="kids-faixa__caixa escuro">
${[1, 2, 3, 4].map((n) => `<span class="kids-faixa__bola kids-faixa__bola--${n}" aria-hidden="true"></span>`).join('')}
<div class="kids-faixa__texto"><span class="kids-faixa__pill">Para as crianças</span><h2 id="kids-titulo" class="kids-faixa__titulo">Luz da Inclusão Kids</h2>
<p class="kids-faixa__lema">Aqui todo mundo tem lugar.</p>
<p class="kids-faixa__desc">Histórias da Bíblia, jogos, desenhos para colorir e atividades para as crianças aprenderem sobre amizade, diferenças e o amor de Deus.</p>
<ul class="kids-faixa__itens"><li>📖 Histórias</li><li>🎮 Jogos</li><li>🎨 Colorir</li><li>✂️ Atividades</li></ul>
<a class="botao botao--luz" href="${esc(kidsLink)}" target="_blank" rel="noopener noreferrer">Conhecer o portal Kids</a></div>
<div class="kids-faixa__arte" aria-hidden="true">${lampada('lampada', true)}</div>
</div></div></section>` : '';

  const insta = link(c.INSTAGRAM_URL);
  const convite = `<section class="convite" aria-labelledby="convite-titulo"><div class="container"><div class="convite__caixa escuro">${icone('instagram', 'convite__decor')}
<h2 id="convite-titulo">${esc(c.INSTAGRAM_TITULO || 'Continue essa conversa com a gente.')}</h2>${c.INSTAGRAM_TEXTO ? `<p>${esc(c.INSTAGRAM_TEXTO)}</p>` : ''}
${insta ? `<a class="botao botao--luz" href="${esc(insta)}" target="_blank" rel="noopener noreferrer">${icone('instagram')}Conheça nosso Instagram</a>` : '<p class="convite__breve">Em breve teremos novidades por aqui.</p>'}
</div></div></section>`;

  return hero + pilares + principio + base + temas + luz + kids + convite;
}

/* ------------------------------------------------------------------ Execução */

async function carregarDados() {
  let texto;
  if (process.env.DADOS_ARQUIVO) {
    texto = await readFile(process.env.DADOS_ARQUIVO, 'utf8');
  } else {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec\?api=site$/.test(API)) {
      throw new Error('PORTAL_API inválido. Confira o endereço no arquivo do workflow.');
    }
    const r = await fetch(API, { redirect: 'follow', headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error('A porta do Apps Script respondeu HTTP ' + r.status);
    texto = await r.text();
  }
  const pacote = JSON.parse(texto);
  if (!pacote || pacote.ok !== true || !pacote.data || pacote.data.versao !== 1) {
    throw new Error('Pacote inválido: ' + (pacote && pacote.message ? pacote.message : 'formato inesperado'));
  }
  return pacote.data;
}

async function gravar(caminhoRelativo, conteudo) {
  const destino = join(SAIDA, caminhoRelativo);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, conteudo, 'utf8');
}

async function principal() {
  const dados = await carregarDados();
  const D = dados.portal;
  if (!D || !D.config || !Array.isArray(D.navegacao)) throw new Error('Pacote sem configuração do portal.');

  // Recomeça a pasta do zero, para não sobrar página antiga.
  await rm(SAIDA, { recursive: true, force: true });
  await mkdir(join(SAIDA, 'assets'), { recursive: true });
  await copyFile(join(AQUI, 'estilos.css'), join(SAIDA, 'assets', 'estilos.css'));
  await copyFile(join(AQUI, 'site.js'), join(SAIDA, 'assets', 'site.js'));

  await gravar('index.html', documento(D, { titulo: '', descricao: D.config.META_DESCRICAO, atual: 'inicio', corpo: paginaInicial(D) }));

  // Evita que o GitHub Pages processe a pasta com o Jekyll.
  await writeFile(join(SAIDA, '.nojekyll'), '');
  console.log(`Site gerado em "${SAIDA}" (base ${BASE}). Pacote de ${dados.geradoEm}.`);
}

principal().catch((erro) => {
  console.error('Falha ao gerar o site:', erro.message);
  process.exit(1);
});
