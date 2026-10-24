/**
 * Ponte do site — faz o código do portal (feito para o Apps Script) funcionar no site.
 *
 * - google.script.run  → leituras vêm dos arquivos de dados do próprio site (dados/*.json);
 *                         envios (Luz, avaliação, pedido de palestra, métricas) vão para o Apps Script,
 *                         que só aceita essa lista fechada de ações e valida tudo de novo.
 * - google.script.history / url → endereços de verdade (/entenda/tea/), com o botão Voltar funcionando.
 * - Links "#/pagina" viram endereços reais, para o Google conseguir seguir.
 * - Modo de pré-montagem (?prerender=1): usado só pelo gerador, para salvar a página pronta.
 * Sem bibliotecas externas.
 */
(function () {
  'use strict';
  var SITE = window.__SITE__;
  if (!SITE) return;
  var BASE = SITE.base;
  var ROTA_OK = /^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,80})?$/;
  var PRE_MONTAGEM = /[?&]prerender=1(&|$)/.test(location.search);

  /* Links antigos no formato ?r=entenda/tea (bio e WhatsApp) vão para o endereço novo. */
  var antigo = /[?&]r=([^&#]+)/.exec(location.search);
  if (antigo && !PRE_MONTAGEM) {
    var r = decodeURIComponent(antigo[1]).replace(/^\/+|\/+$/g, '');
    if (r === 'inicio' || ROTA_OK.test(r)) {
      location.replace((r === 'inicio' ? BASE : BASE + r + '/') + location.hash);
      return;
    }
  }
  var API_OK = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

  /* Envios para o Apps Script (desligados durante a pré-montagem, para não contar visitas falsas). */
  if (!PRE_MONTAGEM && API_OK.test(SITE.api || '')) {
    SITE.enviar = function (nome, args, ok, falha) {
      fetch(SITE.api, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn: nome, args: args.slice(0, 1) }),
        credentials: 'omit',
        redirect: 'follow'
      }).then(function (r) {
        if (!r.ok) throw new Error('indisponivel');
        return r.json();
      }).then(ok, falha);
    };
  }

  function rotaDoEndereco() {
    if (/^#\/[a-z0-9-]/.test(location.hash)) return location.hash.slice(2);
    var p = decodeURIComponent(location.pathname);
    if (p.indexOf(BASE) === 0) p = p.slice(BASE.length);
    p = p.replace(/index\.html$/, '').replace(/^\/+|\/+$/g, '');
    return ROTA_OK.test(p) ? p : 'inicio';
  }
  function endereco(rota) {
    var r = String(rota || '').replace(/^#?\/+/, '').replace(/\/+$/, '');
    return (!r || r === 'inicio' || !ROTA_OK.test(r)) ? BASE : BASE + r + '/';
  }

  /* ---------- Leitura dos dados ---------- */
  var LEITURAS = {
    getPortalData: 'portal', getEntenda: 'entenda', getPratica: 'pratica', getGlossario: 'glossario',
    getChecklist: 'checklist', getFe: 'fe', getProjeto: 'projeto', getPalestras: 'palestras',
    getSimbolos: 'simbolos', getDatas: 'datas', getHistoria: 'historia', getMateriais: 'materiais', getBusca: 'busca'
  };
  var cache = {};
  function arquivo(fn, args) {
    var id = typeof args[0] === 'string' ? args[0] : '';
    if (fn === 'getConteudo') return /^[a-z0-9-]{1,80}$/.test(id) ? 'conteudos/' + id : '';
    if (fn === 'getTermo') return /^[a-z0-9-]{1,80}$/.test(id) ? 'termos/' + id : '';
    return LEITURAS[fn] || '';
  }
  function ler(nome) {
    if (!cache[nome]) {
      cache[nome] = fetch(BASE + 'dados/' + nome + '.json?v=' + SITE.versao, { credentials: 'omit' }).then(function (r) {
        if (r.status === 404) return { ok: true, data: null };
        if (!r.ok) throw new Error('indisponivel');
        return r.json();
      });
      cache[nome].catch(function () { delete cache[nome]; });
    }
    return cache[nome];
  }
  function executor() {
    var ok = function () {};
    var falha = function () {};
    var px = new Proxy({}, {
      get: function (alvo, nome) {
        if (nome === 'withSuccessHandler') return function (f) { ok = f; return px; };
        if (nome === 'withFailureHandler') return function (f) { falha = f; return px; };
        if (nome === 'withUserObject') return function () { return px; };
        return function () {
          var args = Array.prototype.slice.call(arguments);
          var arq = arquivo(nome, args);
          if (arq) { ler(arq).then(ok, falha); return; }
          if (typeof SITE.enviar === 'function') { SITE.enviar(nome, args, ok, falha); return; }
          setTimeout(function () { falha(new Error('indisponivel')); }, 0);
        };
      }
    });
    return px;
  }
  var aoMudar = null;
  window.google = {
    script: {
      run: new Proxy({}, { get: function (a, nome) { return executor()[nome]; } }),
      history: {
        push: function (estado, parametros, rota) { history.pushState({ rota: rota }, '', endereco(rota)); },
        replace: function (estado, parametros, rota) { history.replaceState({ rota: rota }, '', endereco(rota)); },
        setChangeHandler: function (fn) { aoMudar = fn; }
      },
      url: { getLocation: function (cb) { cb({ hash: rotaDoEndereco(), parameter: {}, parameters: {} }); } }
    }
  };
  window.addEventListener('popstate', function () { if (aoMudar) aoMudar({ location: { hash: rotaDoEndereco() } }); });

  /* ---------- Links reais ---------- */
  function corrigirLinks(raiz) {
    var lista = (raiz && raiz.querySelectorAll ? raiz : document).querySelectorAll('a[href^="#/"]');
    Array.prototype.forEach.call(lista, function (a) { a.setAttribute('href', endereco(a.getAttribute('href'))); });
  }
  new MutationObserver(function (mudancas) {
    mudancas.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType !== 1) return;
        if (n.matches && n.matches('a[href^="#/"]')) n.setAttribute('href', endereco(n.getAttribute('href')));
        else corrigirLinks(n);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- Pré-montagem (só para o gerador) ---------- */
  if (PRE_MONTAGEM) {
    var espera = null;
    window.addEventListener('luz:rota', function () {
      clearTimeout(espera);
      espera = setTimeout(salvar, 900);
    });
  }
  function salvar() {
    var main = document.getElementById('conteudo');
    if (main.querySelector('.estado[role="status"]')) { setTimeout(salvar, 300); return; }
    corrigirLinks(document);
    var h1 = main.querySelector('h1');
    var resumo = main.querySelector('.pagina-topo__resumo, .hero__texto');
    if (!resumo || resumo.textContent.trim().length < 40) {
      resumo = Array.prototype.filter.call(main.querySelectorAll('p'), function (p) { return p.textContent.trim().length > 60; })[0] || resumo;
    }
    var saida = {
      topo: document.getElementById('topo').innerHTML,
      main: main.innerHTML,
      rodape: document.getElementById('rodape').innerHTML,
      titulo: h1 ? h1.textContent.trim() : '',
      descricao: resumo ? resumo.textContent.trim() : ''
    };
    var s = document.createElement('script');
    s.type = 'text/plain';
    s.id = '__saida';
    s.textContent = '<<<SAIDA' + JSON.stringify(saida).replace(/</g, '\\u003c') + 'SAIDA>>>';
    document.body.appendChild(s);
  }
})();
