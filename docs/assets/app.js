/* App */



(function () {
  'use strict';

  const boot = window.__BOOT__ || { ok: false };
  let DADOS = boot.ok ? boot.data : null;

  const temGS = typeof google !== 'undefined' && google.script && google.script.history;
  const reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  let contadorId = 0;
  let rotaAtual = null;
  let tokenRender = 0;
  let roteadorAtivo = false;
  let ouvintesAtivos = false;
  let menuAberto = false;

  

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

  

  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        const v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    const filhos = Array.prototype.slice.call(arguments, 2).flat(Infinity);
    filhos.forEach(function (f) {
      if (f === null || f === undefined || f === false || f === '') return;
      el.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
    });
    return el;
  }

  function frag() {
    const f = document.createDocumentFragment();
    Array.prototype.slice.call(arguments).flat(Infinity).forEach(function (n) {
      if (n) f.appendChild(n);
    });
    return f;
  }

  function svg(viewBox, classe, conteudoFixo) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    if (classe) s.setAttribute('class', classe);
    s.innerHTML = conteudoFixo;
    return s;
  }

  function icone(nome, classe) {
    return svg('0 0 24 24', 'ico' + (classe ? ' ' + classe : ''), ICONES[nome] || ICONES.luz);
  }

   
  function lampada(classe, comBrilho) {
    const id = 'brilho-' + (++contadorId);
    let raios = '';
    if (comBrilho) {
      for (let a = -180; a <= 0; a += 30) {
        const r = a * Math.PI / 180;
        raios += '<line x1="' + (120 + Math.cos(r) * 88).toFixed(1) + '" y1="' + (118 + Math.sin(r) * 88).toFixed(1) +
          '" x2="' + (120 + Math.cos(r) * 106).toFixed(1) + '" y2="' + (118 + Math.sin(r) * 106).toFixed(1) + '"/>';
      }
    }
    const conteudo =
      (comBrilho
        ? '<defs><radialGradient id="' + id + '" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" class="lamp-stop1"/><stop offset="100%" class="lamp-stop2"/></radialGradient></defs>' +
          '<circle class="lamp-brilho" cx="120" cy="118" r="118" fill="url(#' + id + ')"/>' +
          '<g class="lamp-raios">' + raios + '</g>'
        : '') +
      '<path class="lamp-vidro" d="M83 186C63 170 50 148 50 118A70 70 0 0 1 190 118C190 148 177 170 157 186L154 204H86Z"/>' +
      '<g transform="translate(84.34 98.86) scale(1.1)"><path class="lamp-peca" d="M4 0L18 0C19.5 0 20.5 -1 20 -3A7.5 7.5 0 1 1 28 -3C27.5 -1 28.5 0 30 0L44 0A4 4 0 0 1 48 4L48 18C48 19.5 49 20.5 51 20A7.5 7.5 0 1 1 51 28C49 27.5 48 28.5 48 30L48 44A4 4 0 0 1 44 48L30 48C28.5 48 27.5 47 28 45A7.5 7.5 0 1 0 20 45C20.5 47 19.5 48 18 48L4 48A4 4 0 0 1 0 44L0 30C0 28.5 1 27.5 3 28A7.5 7.5 0 1 0 3 20C1 20.5 0 19.5 0 18L0 4A4 4 0 0 1 4 0Z"/></g>' +
      '<rect class="lamp-base" x="84" y="212" width="72" height="12" rx="6"/>' +
      '<rect class="lamp-base lamp-base--2" x="90" y="230" width="60" height="12" rx="6"/>' +
      '<rect class="lamp-base lamp-base--3" x="104" y="248" width="32" height="10" rx="5"/>';
    return svg(comBrilho ? '0 0 240 270' : '44 40 152 222', classe, conteudo);
  }

  function onda() {
    const s = svg('0 0 1440 80', 'onda', '<path d="M0 48C240 80 480 80 720 56S1200 8 1440 32V80H0Z"/>');
    s.setAttribute('preserveAspectRatio', 'none');
    return s;
  }

   
  function ancora(link, props) {
    const filhos = Array.prototype.slice.call(arguments, 2);
    const p = Object.assign({}, props);
    if (/^#\/[a-z0-9-]+(\/[a-z0-9-]+)?$/i.test(link)) {
      p.href = link;
      p['data-rota'] = link.slice(2).toLowerCase();
    } else if (/^#[a-z0-9-]+$/i.test(link)) {
      p.href = link;
      p['data-rolar'] = link.slice(1);
    } else if (/^https:\/\//i.test(link)) {
      p.href = link;
      p.target = '_blank';
      p.rel = 'noopener noreferrer';
      filhos.push(h('span', { class: 'sr-only' }, ' (abre em nova aba)'));
    } else {
      return h('div', props, filhos);
    }
    return h('a', p, filhos);
  }

  function botao(rotulo, link, variante, nomeIcone) {
    return ancora(link, { class: 'botao botao--' + variante }, nomeIcone ? icone(nomeIcone) : null, rotulo);
  }

  function nomeProjeto() {
    return (DADOS && DADOS.config.NOME_PROJETO) || 'Projeto Luz da Inclusão';
  }

  function pagina(id) {
    return (DADOS ? DADOS.navegacao : []).filter(function (n) { return n.id === id; })[0] || { id: id, rotulo: '', resumo: '' };
  }

  function slug(texto) {
    return String(texto || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function marca() {
    const logo = DADOS && DADOS.config.LOGO_URL;
    const simbolo = logo
      ? h('img', { src: logo, alt: '', class: 'marca__img', width: 36, height: 36, decoding: 'async' })
      : lampada('marca__simbolo', false);
    const partes = nomeProjeto().match(/^(Projeto)\s+(.+)$/i);
    const texto = partes
      ? h('span', { class: 'marca__texto' }, h('span', { class: 'marca__pre' }, partes[1]), h('span', { class: 'marca__nome' }, partes[2]))
      : h('span', { class: 'marca__texto' }, h('span', { class: 'marca__nome' }, nomeProjeto()));
    return [simbolo, texto];
  }

  function estado(opcoes) {
    const nivel = opcoes.nivel || 'h2';
    return h('section', { class: 'estado', role: opcoes.carregando ? 'status' : null, 'aria-live': opcoes.carregando ? 'polite' : null },
      h('div', { class: 'estado__luz', 'aria-hidden': 'true' }),
      h(nivel, { class: 'estado__titulo' }, opcoes.titulo),
      opcoes.texto ? h('p', { class: 'estado__texto' }, opcoes.texto) : null,
      opcoes.acao || null
    );
  }

  function estadoErro() {
    return estado({
      titulo: 'Não conseguimos carregar este conteúdo.',
      texto: 'Verifique sua conexão e tente de novo.',
      acao: h('button', {
        class: 'botao botao--escuro', type: 'button',
        onclick: function () { renderizar(rotaAtual, { foco: true }); }
      }, 'Tentar de novo')
    });
  }

   
  function topoPagina(opcoes) {
    const trilha = opcoes.trilha || [];
    return h('section', { class: 'pagina-topo escuro' },
      h('div', { class: 'container' },
        trilha.length ? h('nav', { class: 'trilha', 'aria-label': 'Você está em' },
          h('ol', null, trilha.map(function (t, i) {
            const ultimo = i === trilha.length - 1;
            return h('li', null, ultimo || !t.rota
              ? h('span', { 'aria-current': ultimo ? 'page' : null }, t.rotulo)
              : h('a', { href: '#/' + t.rota, 'data-rota': t.rota }, t.rotulo));
          }))
        ) : null,
        h('h1', { class: 'pagina-topo__titulo' + (opcoes.tituloLongo ? ' pagina-topo__titulo--longo' : '') }, opcoes.titulo),
        opcoes.resumo ? h('p', { class: 'pagina-topo__resumo' }, opcoes.resumo) : null
      ),
      onda()
    );
  }

  

  function inline(texto) {
    return String(texto).split(/\*\*(.+?)\*\*/g).map(function (parte, i) {
      return i % 2 ? h('strong', null, parte) : parte;
    });
  }

  function textoRico(texto) {
    const conteudo = document.createDocumentFragment();
    const secoes = [];
    const usados = {};
    let lista = null;

    function fecharLista() {
      if (lista) { conteudo.appendChild(lista); lista = null; }
    }
    function idUnico(titulo) {
      let base = 'sec-' + (slug(titulo) || 'secao');
      let id = base;
      let n = 2;
      while (usados[id]) { id = base + '-' + n++; }
      usados[id] = true;
      return id;
    }

    String(texto || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (bruta) {
      const linha = bruta.trim();
      let m;
      if (!linha) { fecharLista(); return; }
      if ((m = linha.match(/^###\s+(.+)$/))) {
        fecharLista();
        conteudo.appendChild(h('h3', null, inline(m[1])));
      } else if ((m = linha.match(/^##\s+(.+)$/))) {
        fecharLista();
        const id = idUnico(m[1]);
        secoes.push({ id: id, titulo: m[1].replace(/\*\*/g, '') });
        conteudo.appendChild(h('h2', { id: id, tabindex: '-1' }, inline(m[1])));
      } else if ((m = linha.match(/^[-•]\s+(.+)$/))) {
        if (!lista) lista = h('ul');
        lista.appendChild(h('li', null, inline(m[1])));
      } else if ((m = linha.match(/^>\s?(.+)$/))) {
        fecharLista();
        conteudo.appendChild(h('aside', { class: 'nota' }, icone('luz', 'nota__icone'), h('p', null, inline(m[1]))));
      } else {
        fecharLista();
        conteudo.appendChild(h('p', null, inline(linha)));
      }
    });
    fecharLista();
    return { conteudo: conteudo, secoes: secoes };
  }

  

  const cacheApi = {};

  function api(nome) {
    const args = Array.prototype.slice.call(arguments, 1);
    const chave = nome + ':' + JSON.stringify(args);
    if (cacheApi[chave]) return cacheApi[chave];
    const promessa = new Promise(function (resolver, rejeitar) {
      if (!temGS || !google.script.run) { rejeitar(new Error('indisponivel')); return; }
      const executor = google.script.run
        .withSuccessHandler(function (r) {
          if (r && r.ok) resolver(r.data);
          else rejeitar(new Error('falha'));
        })
        .withFailureHandler(rejeitar);
      executor[nome].apply(executor, args);
    });
    cacheApi[chave] = promessa;
    promessa.catch(function () { delete cacheApi[chave]; });
    return promessa;
  }

  

  const MAPA_CORES = {
    COR_AZUL: '--azul', COR_NOITE: '--noite', COR_AMARELO: '--amarelo', COR_VERMELHO: '--vermelho',
    COR_VERDE: '--verde', COR_LARANJA: '--laranja', COR_CREME: '--creme', COR_TINTA: '--tinta'
  };

  function aplicarCores(config) {
    Object.keys(MAPA_CORES).forEach(function (chave) {
      const valor = config[chave];
      if (/^#[0-9A-F]{6}$/i.test(valor || '')) {
        document.documentElement.style.setProperty(MAPA_CORES[chave], valor);
      }
    });
  }

  

  

  const GRUPOS_MENU = [
    { titulo: 'Aprender', itens: ['entenda', 'glossario', 'pergunte', 'simbolos', 'historia'] },
    { titulo: 'Inclusão na prática', itens: [['na-pratica', 'Todos os ambientes']],
      sub: [['na-pratica/na-igreja', 'Na igreja'], ['checklist', 'Checklist: minha igreja é inclusiva?'], ['na-pratica/na-familia', 'Na família'], ['na-pratica/na-escola', 'Na escola'], ['na-pratica/no-trabalho', 'No trabalho']] },
    { titulo: 'Fé', itens: ['fe-e-inclusao', 'ministracoes'] },
    { titulo: 'Recursos', itens: ['materiais', 'calendario'] },
    { titulo: 'O projeto', itens: ['projeto', 'palestras', 'privacidade'] }
  ];

  function navTopo() { return (DADOS ? DADOS.navegacao : []).filter(function (n) { return n.topo; }); }

  function gruposDoMenu() {
    const nav = DADOS ? DADOS.navegacao : [];
    const existe = function (id) { return nav.some(function (n) { return n.id === id; }); };
    const usados = { inicio: true };
    const grupos = GRUPOS_MENU.map(function (g) {
      const itens = g.itens.map(function (it) {
        const id = Array.isArray(it) ? it[0] : it;
        if (!existe(id)) return null;
        usados[id] = true;
        return { id: id, rotulo: Array.isArray(it) ? it[1] : paginaPorId(id).rotulo };
      }).filter(Boolean);
      
      (g.sub || []).forEach(function (sb) { usados[sb[0].split('/')[0]] = true; });
      return { titulo: g.titulo, itens: itens, sub: g.sub || [] };
    }).filter(function (g) { return g.itens.length; });
    const linkKids = DADOS && DADOS.config ? DADOS.config.LINK_KIDS : '';
    if (linkKids) grupos.push({ titulo: 'Para as crianças', itens: [], sub: [], externos: [['Portal Kids', linkKids]] });
    const resto = nav.filter(function (n) { return !usados[n.id]; });
    if (resto.length) grupos.push({ titulo: 'Mais', itens: resto.map(function (n) { return { id: n.id, rotulo: n.rotulo }; }), sub: [] });
    return grupos;
  }

  function paginaPorId(id) {
    const nav = DADOS ? DADOS.navegacao : [];
    for (let i = 0; i < nav.length; i++) if (nav[i].id === id) return nav[i];
    return { id: id, rotulo: id };
  }

  function montarTopo() {
    const topo = document.getElementById('topo');
    const nav = navTopo();
    const c = DADOS ? DADOS.config : {};

    const linksDesktop = nav.map(function (n) {
      if (n.id === 'pergunte') {
        return h('li', null, h('a', { class: 'topo__link topo__link--ia', href: '#/pergunte', 'data-rota': 'pergunte' },
          icone('luz'), h('span', { class: 'topo__ia-curto' }, 'Pergunte'), h('span', { class: 'topo__ia-longo' }, ' à Luz')));
      }
      return h('li', null, h('a', { class: 'topo__link', href: '#/' + n.id, 'data-rota': n.id }, n.rotulo));
    });
    const temAssistente = nav.some(function (n) { return n.id === 'pergunte'; });

    const painel = h('nav', { class: 'tudo', 'aria-label': 'Todas as páginas' },
      h('a', { class: 'menu-movel__link tudo__inicio', href: '#/inicio', 'data-rota': 'inicio' }, 'Início'),
      gruposDoMenu().map(function (g) {
        return h('section', { class: 'tudo__grupo' },
          h('h2', { class: 'tudo__titulo' }, g.titulo),
          h('ul', null,
            g.itens.map(function (it) {
              return h('li', null, h('a', { class: 'menu-movel__link', href: '#/' + it.id, 'data-rota': it.id }, it.rotulo));
            }),
            (g.externos || []).map(function (ex) {
              return h('li', null, ancora(ex[1], { class: 'menu-movel__link' }, ex[0]));
            }),
            g.sub.map(function (sb) {
              return h('li', null, h('a', { class: 'tudo__sub', href: '#/' + sb[0], 'data-rota': sb[0] }, sb[1]));
            })
          )
        );
      })
    );

    topo.replaceChildren(
      h('div', { class: 'container topo__barra' },
        h('a', { class: 'marca', href: '#/inicio', 'data-rota': 'inicio', 'aria-label': nomeProjeto() + ', página inicial' }, marca()),
        nav.length ? h('nav', { class: 'topo__nav', 'aria-label': 'Principal' }, h('ul', null, linksDesktop)) : null,
        h('div', { class: 'topo__acoes' },
          temAssistente ? h('a', { class: 'topo__ia-btn', href: '#/pergunte', 'data-rota': 'pergunte' },
            icone('luz'), h('span', { class: 'topo__ia-rotulo' }, 'Pergunte')) : null,
          nav.length ? h('button', {
            class: 'topo__busca-btn', type: 'button',
            onclick: function () { if (window.LUZ && window.LUZ.abrirBusca) window.LUZ.abrirBusca(); }
          }, icone('lupa'), h('span', { class: 'topo__busca-rotulo' }, 'Buscar')) : null,
          nav.length ? h('button', {
            class: 'topo__menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'menu-movel', onclick: abrirMenu
          }, icone('menu'), h('span', { class: 'topo__menu-rotulo' }, 'Tudo'), h('span', { class: 'sr-only' }, ': ver todas as páginas')) : null
        )
      ),
      nav.length ? h('div', { class: 'menu-fundo', hidden: true, onclick: function () { fecharMenu(true); } }) : null,
      nav.length ? h('div', { class: 'menu-movel', id: 'menu-movel', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Todas as páginas' },
        h('div', { class: 'menu-movel__topo' },
          h('span', { class: 'marca', 'aria-hidden': 'true' }, marca()),
          h('button', { class: 'topo__menu-btn topo__menu-btn--fechar', type: 'button', onclick: function () { fecharMenu(true); } },
            icone('fechar'), h('span', { class: 'sr-only' }, 'Fechar'))
        ),
        painel,
        h('div', { class: 'menu-movel__rodape' },
          c.PRINCIPIO ? h('p', null, c.PRINCIPIO) : null,
          c.INSTAGRAM_URL ? ancora(c.INSTAGRAM_URL, null, 'Acompanhe no Instagram') : null
        )
      ) : null
    );
  }

  function abrirMenu() {
    const painel = document.getElementById('menu-movel');
    const btn = document.querySelector('.topo__barra .topo__menu-btn');
    if (!painel) return;
    painel.hidden = false;
    const fundo = document.querySelector('.menu-fundo');
    if (fundo) fundo.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('travado');
    menuAberto = true;
    document.addEventListener('keydown', teclaNoMenu);
    const ativo = painel.querySelector('[aria-current="page"]') || painel.querySelector('a, button');
    if (ativo) ativo.focus();
  }

  function fecharMenu(devolverFoco) {
    if (!menuAberto) return;
    const painel = document.getElementById('menu-movel');
    const btn = document.querySelector('.topo__barra .topo__menu-btn');
    painel.hidden = true;
    const fundo = document.querySelector('.menu-fundo');
    if (fundo) fundo.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('travado');
    menuAberto = false;
    document.removeEventListener('keydown', teclaNoMenu);
    if (devolverFoco) btn.focus();
  }

  function teclaNoMenu(e) {
    if (e.key === 'Escape') { fecharMenu(true); return; }
    if (e.key !== 'Tab') return;
    const focaveis = Array.prototype.slice.call(
      document.getElementById('menu-movel').querySelectorAll('a[href], button:not([disabled])')
    );
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }

  function marcarNavAtiva(id) {
    document.querySelectorAll('.topo__nav a[data-rota], .menu-movel a[data-rota]').forEach(function (a) {
      if (a.getAttribute('data-rota') === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  

   
  const RODAPE_GRUPOS = {
    aprender: ['glossario', 'simbolos', 'historia', 'calendario'],
    recursos: ['materiais', 'checklist', 'ministracoes'],
    projeto: ['projeto', 'privacidade']
  };
  const RODAPE_ROTULOS = { checklist: 'Checklist da igreja', calendario: 'Calendário da inclusão' };

  function paginasRodape(ids) {
    const nav = DADOS ? DADOS.navegacao : [];
    return ids.map(function (id) { return nav.filter(function (n) { return n.id === id && !n.topo; })[0]; }).filter(Boolean);
  }

  function paginasSoltasRodape() {
    const usados = [].concat(RODAPE_GRUPOS.aprender, RODAPE_GRUPOS.recursos, RODAPE_GRUPOS.projeto, ['inicio']);
    return (DADOS ? DADOS.navegacao : []).filter(function (n) { return !n.topo && usados.indexOf(n.id) === -1; });
  }

  function itemRodape(n) {
    return h('li', null, h('a', { href: '#/' + n.id, 'data-rota': n.id }, RODAPE_ROTULOS[n.id] || n.rotulo));
  }

  function colunaRodape(titulo, paginas, extra) {
    if (!paginas.length && !extra) return null;
    return h('nav', { class: 'rodape__coluna', 'aria-label': titulo },
      h('h2', { class: 'rodape__titulo' }, titulo),
      h('ul', null, paginas.map(itemRodape), extra || null));
  }

  function montarRodape() {
    const rodape = document.getElementById('rodape');
    const c = DADOS.config;
    const lema = String(c.RODAPE_LEMA || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    const usuario = String(c.INSTAGRAM_USUARIO || '').replace(/^@/, '');

    rodape.replaceChildren(
      h('div', { class: 'container rodape__grade' },
        h('div', null,
          h('div', { class: 'rodape__marca' }, marca()),
          lema.length ? h('p', { class: 'rodape__lema' }, lema.map(function (l) { return h('span', null, l); })) : null
        ),
        colunaRodape('Navegue', DADOS.navegacao.filter(function (n) { return n.topo; })),
        colunaRodape('Aprender', paginasRodape(RODAPE_GRUPOS.aprender)),
        colunaRodape('Recursos', paginasRodape(RODAPE_GRUPOS.recursos).concat(paginasSoltasRodape()),
          c.LINK_KIDS ? h('li', null, ancora(c.LINK_KIDS, null, 'Portal Kids')) : null),
        h('div', { class: 'rodape__coluna' },
          h('h2', { class: 'rodape__titulo' }, 'O projeto'),
          h('ul', null,
            paginasRodape(RODAPE_GRUPOS.projeto).map(itemRodape),
            c.INSTAGRAM_URL
              ? h('li', null, ancora(c.INSTAGRAM_URL, null, icone('instagram'), usuario ? '@' + usuario : 'Instagram'))
              : null,
            c.EMAIL ? h('li', null, h('a', { href: 'mailto:' + c.EMAIL }, icone('email'), c.EMAIL)) : null
          )
        )
      ),
      h('div', { class: 'container rodape__base' },
        c.RODAPE_MENSAGEM ? h('p', { class: 'rodape__mensagem' }, c.RODAPE_MENSAGEM) : null,
        h('p', { class: 'rodape__copy' }, '© ' + DADOS.ano + ' ' + nomeProjeto())
      )
    );
  }

  

  function viewInicio() {
    const c = DADOS.config;
    const home = DADOS.home || {};
    return frag(
      secaoHero(c),
      home.pilares && home.pilares.length ? secaoPilares(c, home.pilares) : null,
      c.PRINCIPIO ? secaoPrincipio(c) : null,
      c.BASE_TEXTO || DADOS.base ? secaoBase(c, DADOS.base) : null,
      home.temas && home.temas.length ? secaoTemas(c, home.temas) : null,
      c.ASSISTENTE_DISPONIVEL === 'SIM' && window.LUZ && window.LUZ.blocoAssistente ? window.LUZ.blocoAssistente() : null,
      c.LINK_KIDS ? secaoKids(c) : null,
      secaoConvite(c)
    );
  }

  function secaoHero(c) {
    return h('section', { class: 'hero escuro', 'aria-labelledby': 'hero-titulo' },
      h('div', { class: 'container hero__grade' },
        h('div', { class: 'hero__arte' }, lampada('lampada lampada--acende', true)),
        h('div', null,
          h('p', { class: 'hero__nome' }, nomeProjeto()),
          h('h1', { id: 'hero-titulo', class: 'hero__titulo' }, c.HERO_TITULO || nomeProjeto()),
          c.HERO_TEXTO ? h('p', { class: 'hero__texto' }, c.HERO_TEXTO) : null,
          h('div', { class: 'hero__acoes' },
            botao('Conheça o projeto', '#/projeto', 'luz'),
            botao('Entenda a inclusão', '#/entenda', 'claro'),
            botao('Explore os temas', '#temas', 'link')
          )
        )
      ),
      onda()
    );
  }

  function secaoPilares(c, pilares) {
    return h('section', { class: 'secao pilares', 'aria-labelledby': 'pilares-titulo' },
      h('div', { class: 'container' },
        h('h2', { id: 'pilares-titulo', class: 'titulo-secao' }, c.PILARES_TITULO || 'O que nos move'),
        h('ul', { class: 'pilares__lista' }, pilares.map(function (p) {
          return h('li', { class: 'pilar c-' + p.cor },
            h('div', { class: 'pilar__topo' },
              h('h3', { class: 'pilar__verbo' }, p.titulo),
              h('span', { class: 'pilar__icone' }, icone(p.icone))
            ),
            p.texto ? h('p', { class: 'pilar__texto' }, p.texto) : null
          );
        }))
      )
    );
  }

  function secaoPrincipio(c) {
    return h('section', { class: 'secao principio', 'aria-label': 'Nosso princípio' },
      h('div', { class: 'container principio__caixa' },
        icone('peca', 'principio__peca'),
        h('p', { class: 'principio__frase' }, c.PRINCIPIO),
        c.PRINCIPIO_TEXTO ? h('p', { class: 'principio__texto' }, c.PRINCIPIO_TEXTO) : null
      )
    );
  }

  function secaoBase(c, v) {
    let figura = null;
    if (v && v.texto) {
      const temDetalhes = v.contexto || v.reflexao || v.aplicacao;
      figura = h('figure', { class: 'versiculo escuro' },
        h('blockquote', { class: 'versiculo__texto' }, h('p', null, '“' + v.texto + '”')),
        h('figcaption', { class: 'versiculo__ref' }, v.referencia),
        temDetalhes ? h('details', { class: 'versiculo__contexto' },
          h('summary', null, 'Contexto e reflexão'),
          v.contexto ? h('p', null, h('strong', null, 'Contexto. '), v.contexto) : null,
          v.reflexao ? h('p', null, h('strong', null, 'Reflexão. '), v.reflexao) : null,
          v.aplicacao ? h('p', null, h('strong', null, 'Na prática. '), v.aplicacao) : null
        ) : null
      );
    }
    return h('section', { class: 'secao base', id: 'nossa-base', 'aria-labelledby': 'base-titulo' },
      h('div', { class: 'container base__grade' },
        h('div', { class: 'base__texto' },
          h('h2', { id: 'base-titulo', class: 'titulo-secao' }, c.BASE_TITULO || 'Nossa base'),
          c.BASE_TEXTO ? h('p', null, c.BASE_TEXTO) : null,
          botao('Ler sobre fé e inclusão', '#/fe-e-inclusao', 'escuro')
        ),
        figura
      )
    );
  }

  function secaoTemas(c, temas) {
    return h('section', { class: 'secao temas', id: 'temas', tabindex: '-1', 'aria-labelledby': 'temas-titulo' },
      h('div', { class: 'container' },
        h('h2', { id: 'temas-titulo', class: 'titulo-secao' }, c.TEMAS_TITULO || 'O que você encontra aqui'),
        c.TEMAS_TEXTO ? h('p', { class: 'intro' }, c.TEMAS_TEXTO) : null,
        h('ul', { class: 'temas__grade' }, temas.map(function (t) {
          return h('li', null,
            ancora(t.link, { class: 'cartao c-' + t.cor },
              h('span', { class: 'cartao__icone' }, icone(t.icone)),
              h('h3', { class: 'cartao__titulo' }, t.titulo),
              t.texto ? h('p', { class: 'cartao__texto' }, t.texto) : null
            )
          );
        }))
      )
    );
  }

   
  function secaoKids(c) {
    const bolas = [1, 2, 3, 4].map(function (n) { return h('span', { class: 'kids-faixa__bola kids-faixa__bola--' + n, 'aria-hidden': 'true' }); });
    return h('section', { class: 'kids-faixa', 'aria-labelledby': 'kids-titulo' },
      h('div', { class: 'container' },
        h('div', { class: 'kids-faixa__caixa escuro' },
          bolas,
          h('div', { class: 'kids-faixa__texto' },
            h('span', { class: 'kids-faixa__pill' }, 'Para as crianças'),
            h('h2', { id: 'kids-titulo', class: 'kids-faixa__titulo' }, 'Luz da Inclusão Kids'),
            h('p', { class: 'kids-faixa__lema' }, 'Aqui todo mundo tem lugar.'),
            h('p', { class: 'kids-faixa__desc' }, 'Histórias da Bíblia, jogos, desenhos para colorir e atividades para as crianças aprenderem sobre amizade, diferenças e o amor de Deus.'),
            h('ul', { class: 'kids-faixa__itens' }, ['📖 Histórias', '🎮 Jogos', '🎨 Colorir', '✂️ Atividades'].map(function (t) { return h('li', null, t); })),
            ancora(c.LINK_KIDS, { class: 'botao botao--luz' }, 'Conhecer o portal Kids')
          ),
          h('div', { class: 'kids-faixa__arte', 'aria-hidden': 'true' }, lampada('lampada', true))
        )
      )
    );
  }

  function secaoConvite(c) {
    return h('section', { class: 'convite', 'aria-labelledby': 'convite-titulo' },
      h('div', { class: 'container' },
        h('div', { class: 'convite__caixa escuro' },
          icone('instagram', 'convite__decor'),
          h('h2', { id: 'convite-titulo' }, c.INSTAGRAM_TITULO || 'Continue essa conversa com a gente.'),
          c.INSTAGRAM_TEXTO ? h('p', null, c.INSTAGRAM_TEXTO) : null,
          c.INSTAGRAM_URL
            ? botao('Conheça nosso Instagram', c.INSTAGRAM_URL, 'luz', 'instagram')
            : h('p', { class: 'convite__breve' }, 'Em breve teremos novidades por aqui.')
        )
      )
    );
  }

  

  function viewEmBreve(sub, id) {
    const p = pagina(id);
    return frag(
      topoPagina({ trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }], titulo: p.rotulo, resumo: p.resumo }),
      estado({
        titulo: 'Estamos preparando essa luz. 💡',
        texto: 'Em breve teremos novidades por aqui.',
        acao: botao('Voltar para o início', '#/inicio', 'escuro')
      })
    );
  }

  const VIEWS = { inicio: function () { return viewInicio(); } };

  function registrarView(id, fn) {
    VIEWS[id] = fn;
  }

  

  function idsValidos() {
    return DADOS.navegacao.map(function (n) { return n.id; });
  }

  function rotaDe(hash) {
    const partes = String(hash || '').replace(/^#?\/?/, '').split(/[?&]/)[0].toLowerCase().split('/').filter(Boolean);
    const id = idsValidos().indexOf(partes[0]) > -1 ? partes[0] : 'inicio';
    const sub = id !== 'inicio' && partes[1] && /^[a-z0-9-]{1,80}$/.test(partes[1]) ? partes[1] : '';
    return sub ? id + '/' + sub : id;
  }

  function concluirRender(no, opcoes) {
    const main = document.getElementById('conteudo');
    main.replaceChildren(no);
    
    try { window.dispatchEvent(new CustomEvent('luz:rota', { detail: { caminho: rotaAtual } })); } catch (erro) {   }
    if (opcoes && opcoes.foco) {
      window.scrollTo(0, 0);
      const titulo = main.querySelector('h1');
      if (titulo) {
        titulo.setAttribute('tabindex', '-1');
        titulo.focus({ preventScroll: true });
      }
    }
  }

  function renderizar(caminho, opcoes) {
    rotaAtual = caminho;
    const partes = caminho.split('/');
    const id = partes[0];
    const sub = partes[1] || '';
    const token = ++tokenRender;
    const view = VIEWS[id] || viewEmBreve;

    marcarNavAtiva(id);
    fecharMenu(false);

    let resultado;
    try {
      resultado = view(sub, id);
    } catch (erro) {
      resultado = estadoErro();
    }

    if (resultado && typeof resultado.then === 'function') {
      concluirRender(estado({ carregando: true, titulo: 'Estamos preparando essa luz. 💡' }), { foco: false });
      if (opcoes && opcoes.foco) window.scrollTo(0, 0);
      resultado
        .then(function (no) { if (token === tokenRender) concluirRender(no, opcoes); })
        .catch(function () { if (token === tokenRender) concluirRender(estadoErro(), opcoes); });
    } else {
      concluirRender(resultado, opcoes);
    }
  }

  function navegar(caminho) {
    if (caminho === rotaAtual) {
      fecharMenu(false);
      window.scrollTo({ top: 0, behavior: reduz ? 'auto' : 'smooth' });
      return;
    }
    if (temGS) {
      google.script.history.push({ rota: caminho }, {}, '/' + caminho);
      renderizar(caminho, { foco: true });
    } else {
      window.location.hash = '/' + caminho;
    }
  }

  function iniciarRoteador() {
    if (roteadorAtivo) return;
    roteadorAtivo = true;
    if (temGS && google.script.url) {
      google.script.history.setChangeHandler(function (e) {
        renderizar(rotaDe(e && e.location ? e.location.hash : ''), { foco: true });
      });
      google.script.url.getLocation(function (local) {
        renderizar(rotaDe(local.hash), { foco: false });
      });
    } else {
      window.addEventListener('hashchange', function () {
        renderizar(rotaDe(window.location.hash), { foco: true });
      });
      renderizar(rotaDe(window.location.hash), { foco: false });
    }
  }

  function rolarPara(id) {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    alvo.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
  }

  function registrarOuvintes() {
    if (ouvintesAtivos) return;
    ouvintesAtivos = true;

    document.addEventListener('click', function (e) {
      const a = e.target.closest ? e.target.closest('a[data-rota], a[data-rolar]') : null;
      if (!a) return;
      e.preventDefault();
      if (a.hasAttribute('data-rota')) navegar(a.getAttribute('data-rota'));
      else rolarPara(a.getAttribute('data-rolar'));
    });

    const topo = document.getElementById('topo');
    window.addEventListener('scroll', function () {
      topo.classList.toggle('topo--rolado', window.scrollY > 8);
    }, { passive: true });
  }

  

  function mostrarErro() {
    montarTopo();
    document.getElementById('conteudo').replaceChildren(estado({
      nivel: 'h1',
      titulo: 'Não conseguimos acender essa luz agora.',
      texto: 'Verifique sua conexão e tente de novo em alguns instantes.',
      acao: h('button', { class: 'botao botao--escuro', type: 'button', onclick: tentarNovamente }, 'Tentar de novo')
    }));
  }

  function tentarNovamente(e) {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Carregando…';
    const restaurar = function () {
      btn.disabled = false;
      btn.textContent = 'Tentar de novo';
    };
    if (!temGS) { window.location.reload(); return; }
    google.script.run
      .withSuccessHandler(function (r) {
        if (r && r.ok) { DADOS = r.data; iniciar(); } else { restaurar(); }
      })
      .withFailureHandler(restaurar)
      .getPortalData();
  }

  

  function iniciar() {
    if (!DADOS) { mostrarErro(); return; }
    aplicarCores(DADOS.config);
    montarTopo();
    montarRodape();
    registrarOuvintes();
    iniciarRoteador();
  }

   
  window.LUZ = {
    h: h,
    frag: frag,
    icone: icone,
    ancora: ancora,
    botao: botao,
    estado: estado,
    topoPagina: topoPagina,
    textoRico: textoRico,
    api: api,
    pagina: pagina,
    slug: slug,
    normalizar: normalizar,
    registrarView: registrarView,
    navegar: function (caminho) { if (/^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,80})?$/.test(caminho)) navegar(caminho); },
    lampada: lampada,
    fecharMenu: fecharMenu,
    config: function () { return DADOS ? DADOS.config : {}; },
    iniciar: iniciar
  };
})();

;
/* Entenda */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;

  const AVISO = 'Este conteúdo é educativo. Ele não faz diagnóstico, não indica tratamento e não substitui a avaliação de profissionais de saúde. Cada pessoa é única.';
  const ROTAS_COM_AVISO = ['entenda', 'na-pratica'];

  const PONTES = {
    glossario: {
      titulo: 'Encontrou uma palavra difícil?',
      texto: 'O glossário explica termos técnicos de forma simples, com exemplos do dia a dia.',
      rotulo: 'Abrir o glossário', link: '#/glossario', icone: 'lupa', cor: 'azul'
    },
    pratica: {
      titulo: 'Entendeu? Agora é hora de agir.',
      texto: 'Veja atitudes simples para acolher pessoas e famílias na igreja, na escola e no dia a dia.',
      rotulo: 'Ver inclusão na prática', link: '#/na-pratica', icone: 'coracao', cor: 'vermelho'
    },
    entenda: {
      titulo: 'Quer entender melhor os conceitos?',
      texto: 'TEA, TDAH, Síndrome de Down e deficiências explicados de forma simples e responsável.',
      rotulo: 'Ir para Entenda', link: '#/entenda', icone: 'peca', cor: 'azul'
    }
  };

  function ponte(nome) {
    const p = PONTES[nome];
    if (!p) return null;
    return h('aside', { class: 'ponte c-' + p.cor },
      h('div', null,
        h('h2', { class: 'ponte__titulo' }, p.titulo),
        h('p', { class: 'ponte__texto' }, p.texto)
      ),
      L.botao(p.rotulo, p.link, 'escuro', p.icone)
    );
  }

  const NOMES_AREA = { entenda: 'Entenda', 'na-pratica': 'Na prática' };

  

  function linkPortal(caminho) {
    const base = String(L.config().LINK_COMPARTILHAR || '').trim();
    if (!/^https:\/\//.test(base)) return '';
    if (!/^[a-z0-9-]+(\/[a-z0-9-]+)?$/.test(caminho)) return base;
    return base + (base.indexOf('?') > -1 ? '&' : '?') + 'r=' + encodeURIComponent(caminho);
  }

  function botaoWhatsApp(texto, caminho, rotulo, extraClasse) {
    const link = linkPortal(caminho);
    if (!link) return null;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'whats__ico');
    svg.innerHTML = '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    return L.ancora('https://wa.me/?text=' + encodeURIComponent(texto + '\n\n' + link),
      { class: 'whats' + (extraClasse ? ' ' + extraClasse : '') }, svg, rotulo || 'Compartilhar no WhatsApp');
  }

   
  const ARTE = {
    tea: '<path d="M10 32C10 20 24 20 32 32C40 44 54 44 54 32C54 20 40 20 32 32C24 44 10 44 10 32Z" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>',
    'sindrome-de-down': '<g fill="#0F1B4C"><rect x="10" y="14" width="9" height="36" rx="4.5" transform="rotate(-20 14.5 32)"/><rect x="10" y="14" width="9" height="36" rx="4.5" transform="rotate(20 14.5 32)"/><rect x="27.5" y="14" width="9" height="36" rx="4.5" transform="rotate(-20 32 32)"/><rect x="27.5" y="14" width="9" height="36" rx="4.5" transform="rotate(20 32 32)"/><rect x="45" y="14" width="9" height="36" rx="4.5" transform="rotate(-20 49.5 32)"/><rect x="45" y="14" width="9" height="36" rx="4.5" transform="rotate(20 49.5 32)"/></g>',
    tdah: '<path d="M36 8L16 36h14l-4 20 22-30H34z" fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="round"/>',
    neurodiversidade: '<circle cx="22" cy="24" r="9" fill="#FFC83D"/><circle cx="42" cy="22" r="7" fill="#fff"/><circle cx="30" cy="42" r="10" fill="#0F1B4C"/><circle cx="48" cy="40" r="6" fill="#E04A3F"/>',
    tpac: '<path d="M38 22c0-7-5-12-12-12s-12 5-12 12c0 6 4 8 6 12s-1 9 4 12c4 2 8-1 8-5" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M44 20c3 4 3 12 0 16M50 14c6 7 6 21 0 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    dislexia: '<text x="32" y="44" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="700" font-size="30" fill="#fff">b d</text>',
    'altas-habilidades': '<path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="none" stroke="#0F1B4C" stroke-width="4.5" stroke-linejoin="round"/>',
    'paralisia-cerebral': '<circle cx="34" cy="12" r="5" fill="#fff"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M33 20L31 37H44L48 51"/><path d="M31 27H42"/><path d="M23 31A13 13 0 1 0 44 45"/></g>',
    deficiencias: '<path d="M8 32s9-14 24-14 24 14 24 14-9 14-24 14S8 32 8 32z" fill="none" stroke="#fff" stroke-width="4.5"/><circle cx="32" cy="32" r="6" fill="#fff"/>'
  };
  const MOSAICO = [
    ['tea', 'Autismo (TEA)', 'azul'],
    ['sindrome-de-down', 'Síndrome de Down', 'amarelo'],
    ['tdah', 'TDAH', 'laranja'],
    ['neurodiversidade', 'Neurodiversidade', 'verde'],
    ['tpac', 'TPAC', 'azul'],
    ['dislexia', 'Dislexia', 'vermelho'],
    ['altas-habilidades', 'Altas habilidades', 'amarelo'],
    ['paralisia-cerebral', 'Paralisia cerebral', 'verde'],
    ['#deficiencias', 'Deficiências', 'vermelho']
  ];

  function mosaico(dados) {
    const todos = {};
    (dados.categorias || []).forEach(function (cat) { cat.conteudos.forEach(function (c) { todos[c.slug] = c; }); });
    const temDeficiencias = (dados.categorias || []).some(function (c) { return c.slug === 'deficiencias' && c.conteudos.length; });
    const blocos = MOSAICO.filter(function (m) { return m[0] === '#deficiencias' ? temDeficiencias : todos[m[0]]; });
    if (blocos.length < 4) return null;
    return h('section', { class: 'mosaico', 'aria-labelledby': 'mosaico-titulo' },
      h('h2', { id: 'mosaico-titulo', class: 'sr-only' }, 'Temas'),
      h('ul', { class: 'mosaico__grade' }, blocos.map(function (m, i) {
        const ehAncora = m[0].charAt(0) === '#';
        const chave = ehAncora ? m[0].slice(1) : m[0];
        const arte = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arte.setAttribute('viewBox', '0 0 64 64'); arte.setAttribute('aria-hidden', 'true'); arte.setAttribute('class', 'mosaico__arte');
        arte.innerHTML = ARTE[chave] || '';
        const info = !ehAncora && todos[chave] && todos[chave].leitura ? h('span', { class: 'mosaico__tempo' }, todos[chave].leitura + ' min') : null;
        const attrs = ehAncora
          ? { class: 'mosaico__bloco c-' + m[2] + (i === 0 ? ' mosaico__bloco--grande' : ''), href: '#cat-' + chave, 'data-rolar': 'cat-' + chave }
          : { class: 'mosaico__bloco c-' + m[2] + (i === 0 ? ' mosaico__bloco--grande' : ''), href: '#/entenda/' + chave, 'data-rota': 'entenda/' + chave };
        return h('li', { class: i === 0 ? 'mosaico__item--grande' : '' }, h('a', attrs, arte, h('span', { class: 'mosaico__nome' + (m[1].length > 14 && i > 0 ? ' mosaico__nome--longo' : '') }, m[1]), info));
      }))
    );
  }

  function comecePorAqui(dados) {
    const passos = [
      ['entenda/inclusao-e-acessibilidade', 'O que é inclusão', 'O ponto de partida: inclusão e acessibilidade.'],
      ['entenda/neurodiversidade', 'Neurodiversidade', 'Por que cada cérebro funciona de um jeito.'],
      ['na-pratica/inclusao-no-cotidiano', 'Na prática', 'Pequenas atitudes para começar hoje.']
    ];
    return h('section', { class: 'comece', 'aria-labelledby': 'comece-titulo' },
      h('h2', { id: 'comece-titulo', class: 'comece__titulo' }, 'Comece por aqui'),
      h('p', { class: 'comece__texto' }, 'Nunca leu sobre o assunto? Siga estes 3 passos.'),
      h('ol', { class: 'comece__lista' }, passos.map(function (p, i) {
        return h('li', null, h('a', { class: 'comece__passo', href: '#/' + p[0], 'data-rota': p[0] },
          h('span', { class: 'comece__num' }, '0' + (i + 1)),
          h('span', { class: 'comece__info' }, h('strong', null, p[1]), h('span', null, p[2]))));
      }))
    );
  }

  

  function seta() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', 'indice__seta');
    s.innerHTML = '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  function listaIndice(categorias, rota, opcoes) {
    opcoes = opcoes || {};
    const cats = (categorias || []).filter(function (c) { return c.conteudos && c.conteudos.length; });
    if (!cats.length) return null;
    return h('div', { class: 'indice' + (cats.length === 1 ? ' indice--um' : '') }, cats.map(function (cat) {
      const titulo = opcoes.titulo || cat.nome;
      return h('section', { class: 'indice__bloco c-' + cat.cor + (opcoes.semCabeca ? ' indice__bloco--sem-cabeca' : ''), 'aria-labelledby': opcoes.semCabeca ? null : 'cat-' + cat.slug },
        opcoes.semCabeca ? null : h('div', { class: 'indice__cabeca' },
          h('span', { class: 'indice__icone' }, L.icone(cat.icone)),
          h('div', null,
            h(opcoes.nivel || 'h3', { id: 'cat-' + cat.slug, class: 'indice__titulo', tabindex: '-1' }, titulo),
            cat.descricao ? h('p', { class: 'indice__desc' }, cat.descricao) : null)),
        h('ul', { class: 'indice__lista' }, cat.conteudos.map(function (c) {
          const caminho = rota + '/' + c.slug;
          return h('li', null, h('a', { class: 'indice__item', href: '#/' + caminho, 'data-rota': caminho },
            h('span', { class: 'indice__texto' },
              h('span', { class: 'indice__nome' }, c.titulo),
              c.resumo ? h('span', { class: 'indice__resumo' }, c.resumo) : null),
            c.leitura ? h('span', { class: 'indice__meta' }, c.leitura + ' min') : null,
            seta()));
        }))
      );
    }));
  }

  function cartaoConteudo(c, cor, rota, mostrarArea) {
    return h('li', null,
      L.ancora('#/' + rota + '/' + c.slug, { class: 'cartao cartao--leitura c-' + cor },
        mostrarArea && NOMES_AREA[rota] ? h('span', { class: 'cartao__area' }, NOMES_AREA[rota]) : null,
        h('h3', { class: 'cartao__titulo' }, c.titulo),
        c.resumo ? h('p', { class: 'cartao__texto' }, c.resumo) : null,
        h('span', { class: 'cartao__rodape' },
          h('span', { class: 'cartao__ler' }, 'Ler conteúdo'),
          c.leitura ? h('span', { class: 'cartao__tempo' }, c.leitura + ' min de leitura') : null)
      )
    );
  }

  function avisoEducativo() {
    return h('aside', { class: 'aviso', 'aria-label': 'Aviso importante' },
      L.icone('info', 'aviso__icone'),
      h('p', null, AVISO)
    );
  }

   
  function viewIndice(opcoes) {
    const p = L.pagina(opcoes.rota);
    const c = L.config();
    return L.api(opcoes.api).then(function (dados) {
      const grupos = (dados.categorias || []).filter(function (cat) { return cat.conteudos.length; });

      const corpo = grupos.length
        ? grupos.map(function (cat) {
            return h('section', { class: 'entenda__grupo', 'aria-labelledby': 'cat-' + cat.slug },
              h('div', { class: 'entenda__cabeca c-' + cat.cor },
                h('span', { class: 'pilar__icone' }, L.icone(cat.icone)),
                h('div', null,
                  h('h2', { id: 'cat-' + cat.slug, class: 'entenda__titulo' }, cat.nome),
                  cat.descricao ? h('p', { class: 'entenda__desc' }, cat.descricao) : null
                )
              ),
              h('ul', { class: 'entenda__grade' }, cat.conteudos.map(function (item) {
                return cartaoConteudo(item, cat.cor, opcoes.rota);
              }))
            );
          })
        : L.estado({ titulo: 'Em breve teremos novidades por aqui.', texto: 'Os conteúdos desta área estão sendo preparados.' });

      const destaque = opcoes.destaque === 'principio' ? c.PRINCIPIO : opcoes.destaque;

      return L.frag(
        L.topoPagina({
          trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }],
          titulo: p.rotulo,
          resumo: p.resumo
        }),
        h('div', { class: 'container entenda' },
          destaque ? h('p', { class: 'entenda__principio' }, destaque) : null,
          opcoes.rota === 'entenda' ? mosaico(dados) : null,
          opcoes.rota === 'entenda' ? comecePorAqui(dados) : null,
          opcoes.rota === 'entenda' && grupos.length ? h('h2', { class: 'portas__todos' }, 'Todos os temas') : null,
          opcoes.rota === 'entenda' && grupos.length ? listaIndice(grupos, 'entenda') : corpo,
          opcoes.rota === 'entenda' && L.blocoExplorar ? L.blocoExplorar() : null,
          (opcoes.pontes || []).map(ponte)
        )
      );
    });
  }

   
  function naoEncontrado(rota) {
    const p = L.pagina(rota);
    return L.frag(
      L.topoPagina({
        trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo, rota: rota }, { rotulo: 'Não encontrado' }],
        titulo: 'Conteúdo não encontrado'
      }),
      L.estado({
        titulo: 'Esse endereço não leva a nenhum conteúdo.',
        texto: 'Ele pode ter mudado de lugar. Veja todos os temas disponíveis.',
        acao: L.botao('Ver todos os temas', '#/' + rota, 'escuro')
      })
    );
  }

  function viewConteudo(slug, rotaPagina) {
    return L.api('getConteudo', slug).then(function (c) {
      if (!c) return naoEncontrado(rotaPagina);
      const rota = c.rota || rotaPagina;
      const p = L.pagina(rota);
      const rico = L.textoRico(c.conteudo);
      const cor = c.categoria ? c.categoria.cor : 'azul';

      const sumario = rico.secoes.length > 2
        ? h('nav', { class: 'sumario', 'aria-label': 'Nesta página' },
            h('details', { class: 'sumario__caixa', open: window.innerWidth >= 1020 },
              h('summary', null, 'Nesta página'),
              h('ol', null, rico.secoes.map(function (s) {
                return h('li', null, h('a', { href: '#' + s.id, 'data-rolar': s.id }, s.titulo));
              }))
            )
          )
        : null;

      const relacionados = (c.relacionados || []).length
        ? h('section', { class: 'secao relacionados', 'aria-labelledby': 'rel-titulo' },
            h('div', { class: 'container' },
              h('h2', { id: 'rel-titulo', class: 'titulo-secao' }, 'Continue aprendendo'),
              h('ul', { class: 'entenda__grade' }, c.relacionados.map(function (r) {
                const rotaItem = r.rota || rota;
                return cartaoConteudo(r, rotaItem === rota ? cor : 'vermelho', rotaItem, rotaItem !== rota);
              }))
            )
          )
        : null;

      return L.frag(
        h('div', { class: 'progresso', 'aria-hidden': 'true' }, h('span', { class: 'progresso__barra' })),
        L.topoPagina({
          trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo, rota: rota }, { rotulo: c.titulo }],
          titulo: c.titulo,
          tituloLongo: c.titulo.length > 28,
          resumo: c.resumo
        }),
        h('div', { class: 'container leitura c-' + cor + (sumario ? '' : ' leitura--simples') },
          sumario,
          h('article', { class: 'artigo', 'aria-label': c.titulo },
            c.categoria ? h('p', { class: 'artigo__categoria' }, c.categoria.nome + (c.leitura ? ' · ' + c.leitura + ' min de leitura' : '')) : null,
            (c.resumoRapido || []).length ? h('section', { class: 'rapido', 'aria-labelledby': 'rapido-titulo' },
              h('h2', { id: 'rapido-titulo', class: 'rapido__titulo' }, '⏱ Em 30 segundos'),
              h('ul', { class: 'rapido__lista' }, c.resumoRapido.map(function (x) { return h('li', null, x); }))
            ) : null,
            rico.conteudo,
            h('div', { class: 'compartilhar' },
              h('p', { class: 'compartilhar__texto' }, 'Este conteúdo pode ajudar alguém?'),
              h('div', { class: 'compartilhar__botoes' },
                botaoWhatsApp(c.titulo + (c.resumo ? ': ' + c.resumo : '') + '\n\nLeia no portal do Projeto Luz da Inclusão 💡', rota + '/' + c.slug),
                L.botaoImagem ? L.botaoImagem(function () {
                  const rapido = c.resumoRapido || [];
                  return {
                    etiqueta: rapido.length ? 'Em 30 segundos' : (c.categoria ? c.categoria.nome : 'Projeto Luz da Inclusão'),
                    titulo: c.titulo,
                    linhas: rapido.length ? rapido : null,
                    texto: rapido.length ? '' : c.resumo,
                    cor: cor,
                    nomeArquivo: c.slug
                  };
                }) : null)),
            (c.termos || []).length
              ? h('aside', { class: 'termos', 'aria-labelledby': 'termos-titulo' },
                  h('h2', { id: 'termos-titulo', class: 'termos__titulo' }, 'Palavras do glossário neste conteúdo'),
                  h('ul', { class: 'termos__lista' }, c.termos.map(function (t) {
                    return h('li', null, h('a', { class: 'chip chip--link', href: '#/glossario/' + t.id, 'data-rota': 'glossario/' + t.id }, t.termo));
                  })))
              : null,
            ROTAS_COM_AVISO.indexOf(rota) > -1 ? avisoEducativo() : null
          )
        ),
        relacionados,
        h('div', { class: 'container ponte-final' }, ponte(rota === 'entenda' ? 'pratica' : 'glossario'))
      );
    });
  }

  L.registrarView('entenda', function (sub, id) {
    if (sub) return viewConteudo(sub, id);
    return viewIndice({ rota: 'entenda', api: 'getEntenda', destaque: 'principio', pontes: ['glossario', 'pratica'] });
  });

  window.addEventListener('scroll', function () {
    const barra = document.querySelector('.progresso__barra');
    if (!barra) return;
    const artigo = document.querySelector('.artigo');
    if (!artigo) return;
    const r = artigo.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const feito = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
    barra.style.transform = 'scaleX(' + feito.toFixed(3) + ')';
  }, { passive: true });

   
  L.botaoWhatsApp = botaoWhatsApp;
  L.listaIndice = listaIndice;
  L.viewIndice = viewIndice;
  L.viewConteudo = viewConteudo;
  L.cartaoConteudo = cartaoConteudo;
  L.ponte = ponte;
})(window.LUZ);

;
/* Glossario */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const CORES = ['azul', 'verde', 'laranja', 'vermelho', 'amarelo'];

   
  function corDaCategoria(categoria) {
    const s = L.normalizar(categoria || '');
    let n = 0;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973;
    return s ? CORES[n % CORES.length] : 'azul';
  }

  function textoCompartilhar(t) {
    return t.termo + (t.nomeCompleto ? ' (' + t.nomeCompleto + ')' : '') + ': ' + (t.explicacaoSimples || '') +
      '\n\nVeja no glossário do Projeto Luz da Inclusão 💡';
  }

   
  function itemTermo(t) {
    const cor = corDaCategoria(t.categoria);
    const resumo = t.explicacaoSimples && t.explicacaoSimples.length > 190 ? t.explicacaoSimples.slice(0, 187).replace(/\s+\S*$/, '') + '…' : t.explicacaoSimples;
    return h('li', { class: 'termo termo--resumo c-' + cor, id: 'termo-' + t.id },
      h('div', { class: 'termo__cabeca' },
        h('h2', { class: 'termo__nome' },
          h('a', { class: 'termo__link', href: '#/glossario/' + t.id, 'data-rota': 'glossario/' + t.id }, t.termo)),
        t.categoria ? h('span', { class: 'termo__categoria' }, t.categoria) : null
      ),
      t.nomeCompleto ? h('p', { class: 'termo__completo' }, t.nomeCompleto) : null,
      resumo ? h('p', { class: 'termo__resumo' }, resumo) : null,
      h('span', { class: 'termo__mais', 'aria-hidden': 'true' }, 'Ver explicação completa', h('span', { class: 'termo__seta' }, '→'))
    );
  }

  function viewLista() {
    const p = L.pagina('glossario');
    return L.api('getGlossario').then(function (dados) {
      const termos = dados.termos || [];
      const categorias = dados.categorias || [];

      const indice = termos.map(function (t) {
        return {
          t: t,
          nome: L.normalizar(t.termo + ' ' + t.nomeCompleto),
          tudo: L.normalizar([t.termo, t.nomeCompleto, t.explicacaoSimples, t.definicaoTecnica, t.exemplo].join(' '))
        };
      });

      let busca = '';
      let categoria = '';

      const campo = h('input', {
        id: 'busca-glossario', class: 'busca__campo', type: 'search',
        placeholder: 'Digite um termo...', autocomplete: 'off', spellcheck: 'false',
        enterkeyhint: 'search', 'aria-controls': 'lista-termos'
      });
      const contador = h('p', { class: 'busca__contador', role: 'status', 'aria-live': 'polite' });
      const lista = h('ul', { class: 'glossario__lista', id: 'lista-termos' });
      const vazio = h('div', { class: 'glossario__vazio', hidden: true },
        h('p', { class: 'estado__titulo' }, 'Nenhum termo encontrado.'),
        h('p', { class: 'estado__texto' }, 'Tente outra palavra ou limpe a busca para ver todos os termos.'),
        h('button', { class: 'botao botao--escuro', type: 'button', onclick: limpar }, 'Limpar busca')
      );

      const chips = [{ valor: '', rotulo: 'Todos' }].concat(categorias.map(function (c) { return { valor: c, rotulo: c }; }))
        .map(function (op) {
          return h('button', {
            class: 'chip', type: 'button', 'aria-pressed': op.valor === '' ? 'true' : 'false',
            'data-valor': op.valor,
            onclick: function (e) {
              categoria = e.currentTarget.getAttribute('data-valor');
              chips.forEach(function (b) {
                b.setAttribute('aria-pressed', b.getAttribute('data-valor') === categoria ? 'true' : 'false');
              });
              atualizar();
            }
          }, op.rotulo);
        });

      function atualizar() {
        const q = L.normalizar(busca);
        const resultado = indice
          .filter(function (i) {
            return (!categoria || i.t.categoria === categoria) && (!q || i.tudo.indexOf(q) > -1);
          })
          .sort(function (a, b) {
            if (!q) return 0;
            const pa = a.nome.indexOf(q) === 0 ? 0 : a.nome.indexOf(q) > -1 ? 1 : 2;
            const pb = b.nome.indexOf(q) === 0 ? 0 : b.nome.indexOf(q) > -1 ? 1 : 2;
            return pa - pb;
          })
          .map(function (i) { return i.t; });

        lista.replaceChildren.apply(lista, resultado.map(itemTermo));
        vazio.hidden = resultado.length > 0;
        contador.textContent = resultado.length === 1 ? '1 termo' : resultado.length + ' termos';
      }

      function limpar() {
        busca = '';
        campo.value = '';
        categoria = '';
        chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-valor') === '' ? 'true' : 'false'); });
        atualizar();
        campo.focus();
      }

      campo.addEventListener('input', function () { busca = campo.value; atualizar(); });
      campo.addEventListener('keydown', function (e) { if (e.key === 'Escape' && campo.value) { e.preventDefault(); limpar(); } });
      atualizar();

      if (!termos.length) {
        return L.frag(
          L.topoPagina({ trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }], titulo: p.rotulo, resumo: p.resumo }),
          L.estado({ titulo: 'Em breve teremos novidades por aqui.', texto: 'Os termos do glossário estão sendo preparados.' })
        );
      }

      return L.frag(
        L.topoPagina({ trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }], titulo: p.rotulo, resumo: p.resumo }),
        h('div', { class: 'container glossario' },
          h('div', { class: 'busca', role: 'search' },
            h('label', { for: 'busca-glossario', class: 'busca__rotulo' }, 'Buscar no glossário'),
            h('div', { class: 'busca__caixa' }, L.icone('lupa', 'busca__icone'), campo),
            h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar por categoria' }, chips),
            contador
          ),
          lista,
          vazio
        )
      );
    });
  }

   
  function viewTermo(id) {
    const p = L.pagina('glossario');
    return L.api('getTermo', id).then(function (t) {
      const trilhaBase = [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo || 'Glossário', rota: 'glossario' }];

      if (!t) {
        return L.frag(
          L.topoPagina({ trilha: trilhaBase.concat([{ rotulo: 'Termo não encontrado' }]), titulo: 'Termo não encontrado' }),
          L.estado({
            titulo: 'Não encontramos esse termo.',
            texto: 'Ele pode ter mudado de nome. Veja a lista completa do glossário.',
            acao: L.botao('Ver o glossário', '#/glossario', 'escuro')
          })
        );
      }

      const cor = corDaCategoria(t.categoria);
      const compartilhar = h('div', { class: 'compartilhar termo-pag__compartilhar' },
        h('p', { class: 'compartilhar__texto' }, 'Este termo pode ajudar alguém?'),
        h('div', { class: 'compartilhar__botoes' },
          L.botaoWhatsApp ? L.botaoWhatsApp(textoCompartilhar(t), 'glossario/' + t.id, 'WhatsApp') : null,
          L.botaoImagem ? L.botaoImagem(function () {
            return {
              etiqueta: 'Glossário da inclusão', titulo: t.termo, subtitulo: t.nomeCompleto,
              texto: t.explicacaoSimples, cor: cor, nomeArquivo: 'termo-' + t.id
            };
          }) : null
        )
      );

      const relacionados = (t.relacionados || []).length
        ? h('section', { class: 'termo-pag__secao', 'aria-labelledby': 'termo-rel-titulo' },
            h('h2', { id: 'termo-rel-titulo', class: 'termo-pag__subtitulo' }, 'Termos relacionados'),
            h('ul', { class: 'termo-pag__relacionados' }, t.relacionados.map(function (r) {
              return h('li', null,
                h('a', { class: 'termo-rel', href: '#/glossario/' + r.id, 'data-rota': 'glossario/' + r.id },
                  h('span', { class: 'termo-rel__nome' }, r.termo),
                  r.explicacao ? h('span', { class: 'termo-rel__texto' }, r.explicacao.length > 110 ? r.explicacao.slice(0, 107).replace(/\s+\S*$/, '') + '…' : r.explicacao) : null));
            })))
        : null;

      const conteudos = (t.conteudos || []).length && L.cartaoConteudo
        ? h('section', { class: 'termo-pag__secao', 'aria-labelledby': 'termo-cont-titulo' },
            h('h2', { id: 'termo-cont-titulo', class: 'termo-pag__subtitulo' }, 'Conteúdos que falam sobre isso'),
            h('ul', { class: 'entenda__grade' }, t.conteudos.map(function (c) { return L.cartaoConteudo(c, cor, c.rota, true); })))
        : null;

      const navegacao = t.anterior || t.proximo
        ? h('nav', { class: 'termo-pag__nav', 'aria-label': 'Outros termos em ordem alfabética' },
            t.anterior ? h('a', { class: 'termo-nav termo-nav--ant', href: '#/glossario/' + t.anterior.id, 'data-rota': 'glossario/' + t.anterior.id },
              h('span', { class: 'termo-nav__rotulo' }, '← Termo anterior'), h('span', { class: 'termo-nav__nome' }, t.anterior.termo)) : h('span'),
            t.proximo ? h('a', { class: 'termo-nav termo-nav--prox', href: '#/glossario/' + t.proximo.id, 'data-rota': 'glossario/' + t.proximo.id },
              h('span', { class: 'termo-nav__rotulo' }, 'Próximo termo →'), h('span', { class: 'termo-nav__nome' }, t.proximo.termo)) : h('span'))
        : null;

      return L.frag(
        L.topoPagina({
          trilha: trilhaBase.concat([{ rotulo: t.termo }]),
          titulo: t.termo,
          tituloLongo: t.termo.length > 28,
          resumo: t.nomeCompleto
        }),
        h('div', { class: 'container termo-pag c-' + cor },
          h('article', { class: 'termo-pag__artigo', 'aria-label': t.termo },
            h('p', { class: 'termo-pag__meta' },
              t.categoria ? h('span', { class: 'termo__categoria' }, t.categoria) : null,
              t.total ? h('span', { class: 'termo-pag__posicao' }, 'Termo ' + t.posicao + ' de ' + t.total + ' no glossário') : null),
            t.explicacaoSimples ? h('section', { class: 'termo-pag__simples', 'aria-labelledby': 'termo-simples' },
              h('h2', { id: 'termo-simples', class: 'termo-pag__rotulo' }, 'Em palavras simples'),
              h('p', null, t.explicacaoSimples)) : null,
            t.definicaoTecnica ? h('section', { class: 'termo-pag__bloco', 'aria-labelledby': 'termo-tecnico' },
              h('h2', { id: 'termo-tecnico', class: 'termo-pag__rotulo' }, 'Definição técnica'),
              h('p', null, t.definicaoTecnica)) : null,
            t.exemplo ? h('aside', { class: 'termo-pag__exemplo', 'aria-labelledby': 'termo-exemplo' },
              L.icone('luz', 'termo-pag__exemplo-icone'),
              h('div', null,
                h('h2', { id: 'termo-exemplo', class: 'termo-pag__rotulo' }, 'Exemplo prático'),
                h('p', null, t.exemplo))) : null,
            compartilhar
          ),
          relacionados,
          conteudos,
          navegacao,
          h('p', { class: 'termo-pag__voltar' }, L.botao('Ver todos os termos', '#/glossario', 'escuro'))
        )
      );
    });
  }

  L.registrarView('glossario', function (sub) { return sub ? viewTermo(sub) : viewLista(); });
})(window.LUZ);

;
/* Pratica */



(function (L) {
  'use strict';
  if (!L || !L.viewIndice) return;
  const h = L.h;

  const AMBIENTES = ['na-igreja', 'na-familia', 'na-escola', 'no-trabalho'];
  const GERAL = 'acolher-pessoas';
  const PONTES = {
    'na-igreja': ['materiais', 'fe-e-inclusao'],
    'na-familia': ['materiais', 'entenda'],
    'na-escola': ['materiais', 'glossario'],
    'no-trabalho': ['entenda', 'glossario']
  };

  function plural(n) { return n === 1 ? '1 conteúdo' : n + ' conteúdos'; }

  function porta(cat) {
    return h('li', null, h('a', { class: 'cartao porta c-' + cat.cor, href: '#/na-pratica/' + cat.slug, 'data-rota': 'na-pratica/' + cat.slug },
      h('span', { class: 'cartao__icone' }, L.icone(cat.icone)),
      h('h3', { class: 'cartao__titulo' }, cat.nome),
      cat.descricao ? h('p', { class: 'cartao__texto' }, cat.descricao) : null,
      h('span', { class: 'porta__qtd' }, cat.conteudos.length ? plural(cat.conteudos.length) : 'Em breve')
    ));
  }

  function grupo(cat, titulo, id) {
    return h('section', { class: 'entenda__grupo', id: id || null, 'aria-labelledby': 'cat-' + cat.slug },
      h('div', { class: 'entenda__cabeca c-' + cat.cor },
        h('span', { class: 'pilar__icone' }, L.icone(cat.icone)),
        h('div', null,
          h('h2', { id: 'cat-' + cat.slug, class: 'entenda__titulo' }, titulo || cat.nome),
          cat.descricao ? h('p', { class: 'entenda__desc' }, cat.descricao) : null
        )
      ),
      h('ul', { class: 'entenda__grade' }, cat.conteudos.map(function (item) {
        return L.cartaoConteudo(item, cat.cor, 'na-pratica');
      }))
    );
  }

  function topo(trilhaFinal, titulo, resumo) {
    const p = L.pagina('na-pratica');
    const trilha = [{ rotulo: 'Início', rota: 'inicio' }];
    if (trilhaFinal) { trilha.push({ rotulo: p.rotulo, rota: 'na-pratica' }); trilha.push({ rotulo: trilhaFinal }); }
    else trilha.push({ rotulo: p.rotulo });
    return L.topoPagina({ trilha: trilha, titulo: titulo || p.rotulo, resumo: resumo === undefined ? p.resumo : resumo });
  }

   
  function viewGeral() {
    return L.api('getPratica').then(function (d) {
      const cats = (d.categorias || []);
      const ambientes = AMBIENTES.map(function (s) { return cats.filter(function (c) { return c.slug === s; })[0]; }).filter(Boolean);
      const outros = cats.filter(function (c) { return AMBIENTES.indexOf(c.slug) === -1 && c.conteudos.length; });

      return L.frag(
        topo(),
        h('div', { class: 'container entenda' },
          h('p', { class: 'entenda__principio' }, 'Conhecer um conceito não basta. Inclusão acontece quando a informação vira atitude.'),
          ambientes.length ? h('section', { class: 'portas', 'aria-labelledby': 'portas-titulo' },
            h('h2', { id: 'portas-titulo', class: 'entenda__titulo' }, 'Onde você quer praticar?'),
            h('ul', { class: 'portas__grade' }, ambientes.map(porta))
          ) : null,
          h('h2', { class: 'portas__todos' }, 'Todos os conteúdos'),
          L.listaIndice ? L.listaIndice(ambientes.concat(outros), 'na-pratica')
            : ambientes.filter(function (c) { return c.conteudos.length; }).concat(outros).map(function (c) { return grupo(c); }),
          L.blocoExplorar ? L.blocoExplorar() : null,
          ['entenda', 'glossario'].map(L.ponte)
        )
      );
    });
  }

   
  function viewAmbiente(slug) {
    return L.api('getPratica').then(function (d) {
      const cats = d.categorias || [];
      const cat = cats.filter(function (c) { return c.slug === slug; })[0];
      if (!cat) {
        return L.frag(topo('Em breve', 'Em breve', ''), L.estado({
          titulo: 'Este ambiente ainda está sendo preparado.',
          acao: L.botao('Ver todos os ambientes', '#/na-pratica', 'escuro')
        }));
      }
      const geral = cats.filter(function (c) { return c.slug === GERAL && c.conteudos.length; })[0];
      const outros = AMBIENTES.filter(function (s) { return s !== slug; })
        .map(function (s) { return cats.filter(function (c) { return c.slug === s; })[0]; }).filter(Boolean);

      return L.frag(
        topo(cat.nome, 'Inclusão ' + cat.nome.charAt(0).toLowerCase() + cat.nome.slice(1), cat.descricao || ''),
        h('div', { class: 'container entenda' },
          cat.conteudos.length
            ? h('ul', { class: 'entenda__grade ambiente__grade' }, cat.conteudos.map(function (item) { return L.cartaoConteudo(item, cat.cor, 'na-pratica'); }))
            : L.estado({ titulo: 'Os conteúdos deste ambiente estão sendo preparados.' }),
          slug === 'na-igreja' && L.chamadaChecklist ? L.chamadaChecklist() : null,
          geral ? h('section', { class: 'secao-extra', 'aria-labelledby': 'geral-titulo' },
            h('h2', { id: 'geral-titulo', class: 'portas__todos' }, 'Vale em qualquer lugar'),
            h('p', { class: 'secao-extra__texto' }, geral.descricao || 'Atitudes que valem em todos os ambientes.'),
            L.listaIndice ? L.listaIndice([geral], 'na-pratica', { semCabeca: true }) : grupo(geral)
          ) : null,
          outros.length ? h('section', { class: 'portas', 'aria-labelledby': 'outros-titulo' },
            h('h2', { id: 'outros-titulo', class: 'entenda__titulo' }, 'Outros ambientes'),
            h('ul', { class: 'portas__grade portas__grade--3' }, outros.map(porta))
          ) : null,
          (PONTES[slug] || ['entenda']).map(L.ponte)
        )
      );
    });
  }

  L.registrarView('na-pratica', function (sub, id) {
    if (sub && AMBIENTES.indexOf(sub) > -1) return viewAmbiente(sub);
    if (sub) return L.viewConteudo(sub, id);
    return viewGeral();
  });
})(window.LUZ);

;
/* FeInclusao */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const CORES = ['vermelho', 'azul', 'laranja', 'verde', 'amarelo'];

  function cartaoVersiculo(v) {
    return h('article', { class: 'palavra', id: 'v-' + v.id, 'aria-label': v.referencia },
      h('blockquote', { class: 'palavra__texto' }, h('p', null, '“' + v.texto + '”')),
      h('p', { class: 'palavra__ref' }, v.referencia),
      h('dl', { class: 'palavra__lista' },
        v.contexto ? h('div', { class: 'palavra__bloco' }, h('dt', null, 'Contexto'), h('dd', null, v.contexto)) : null,
        v.reflexao ? h('div', { class: 'palavra__bloco' }, h('dt', null, 'Reflexão'), h('dd', null, v.reflexao)) : null,
        v.aplicacao ? h('div', { class: 'palavra__bloco palavra__bloco--pratica' }, h('dt', null, 'Na prática'), h('dd', null, v.aplicacao)) : null
      ),
      L.botaoImagem ? L.botaoImagem(function () {
        return { etiqueta: 'Fé e inclusão', citacao: v.texto, referencia: v.referencia, cor: 'amarelo', nomeArquivo: v.id };
      }, 'Imagem para stories', 'img-btn--pequeno') : null
    );
  }

  function secaoTema(t, i) {
    return h('section', { class: 'fe__tema c-' + CORES[i % CORES.length], id: 'tema-' + t.slug, 'aria-labelledby': 'titulo-' + t.slug },
      h('h2', { id: 'titulo-' + t.slug, class: 'fe__tema-titulo' }, t.tema),
      h('div', { class: 'fe__lista' }, t.versiculos.map(cartaoVersiculo))
    );
  }

  function viewFe() {
    const p = L.pagina('fe-e-inclusao');
    const c = L.config();
    return L.api('getFe').then(function (dados) {
      const temas = dados.temas || [];
      const intro = c.FE_TEXTO ? L.textoRico(c.FE_TEXTO).conteudo : null;

      return L.frag(
        L.topoPagina({
          trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }],
          titulo: p.rotulo,
          resumo: p.resumo
        }),
        h('div', { class: 'container fe' },
          h('section', { class: 'fe__intro', 'aria-labelledby': 'fe-intro-titulo' },
            h('h2', { id: 'fe-intro-titulo', class: 'titulo-secao' }, c.FE_TITULO || 'Fé que vira cuidado'),
            intro ? h('div', { class: 'fe__intro-texto' }, intro) : null
          ),
          temas.length > 1
            ? h('nav', { class: 'fe__temas', 'aria-label': 'Temas desta página' },
                h('ul', null, temas.map(function (t) {
                  return h('li', null, h('a', { class: 'chip chip--link', href: '#tema-' + t.slug, 'data-rolar': 'tema-' + t.slug }, t.tema));
                }))
              )
            : null,
          temas.length
            ? temas.map(secaoTema)
            : L.estado({ titulo: 'Em breve teremos novidades por aqui.', texto: 'Os textos desta área estão sendo preparados.' }),
          L.ponte ? L.ponte('pratica') : null,
          c.BIBLIA_CREDITO ? h('p', { class: 'fe__credito' }, c.BIBLIA_CREDITO) : null
        )
      );
    });
  }

  L.registrarView('fe-e-inclusao', function () { return viewFe(); });
})(window.LUZ);

;
/* Projeto */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;

  function imagem(src, alt, classe) {
    if (!src) return null;
    return h('img', { src: src, alt: alt || '', class: classe, loading: 'lazy', decoding: 'async' });
  }

  function texto(bruto) {
    return L.textoRico(bruto).conteudo;
  }

   
  function secaoSobre(d) {
    const narrativa = d.origem.concat(d.proposito);
    const temCartoes = d.missao.length || d.visao.length || d.valores.length;
    if (!narrativa.length && !temCartoes) {
      return h('section', { class: 'projeto__secao', id: 'quem-somos', 'aria-labelledby': 'sobre-titulo' },
        h('h2', { id: 'sobre-titulo', class: 'titulo-secao' }, 'Quem somos'),
        h('p', { class: 'intro' }, 'Em breve contaremos a nossa história por aqui.')
      );
    }

    function cartao(itens, rotulo, cor) {
      if (!itens.length) return null;
      return h('article', { class: 'proposito c-' + cor },
        h('h3', { class: 'proposito__rotulo' }, itens[0].titulo || rotulo),
        itens.map(function (i) { return h('div', { class: 'proposito__texto' }, texto(i.texto)); })
      );
    }

    return h('section', { class: 'projeto__secao', id: 'quem-somos', 'aria-labelledby': 'sobre-titulo' },
      h('h2', { id: 'sobre-titulo', class: 'titulo-secao' }, 'Quem somos'),
      narrativa.length
        ? h('div', { class: 'sobre__narrativa c-azul' }, narrativa.map(function (b) {
            return h('div', { class: 'sobre__bloco' },
              b.titulo ? h('h3', { class: 'sobre__titulo' }, b.titulo) : null,
              imagem(b.imagem, b.imagemAlt, 'sobre__imagem'),
              h('div', { class: 'artigo' }, texto(b.texto))
            );
          }))
        : null,
      temCartoes
        ? h('div', { class: 'proposito__grade' },
            cartao(d.missao, 'Missão', 'azul'),
            cartao(d.visao, 'Visão', 'amarelo'),
            cartao(d.valores, 'Valores', 'verde')
          )
        : null
    );
  }

   
  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/);
    return ((partes[0] || '')[0] || '') + (partes.length > 1 ? (partes[partes.length - 1][0] || '') : '');
  }

  function blocoPessoa(c, rotulo, id) {
    if (!c.PALESTRANTE_NOME) return null;
    const primeiroNome = c.PALESTRANTE_NOME.split(' ')[0];
    return h('section', { class: 'pessoa', id: id, 'aria-labelledby': id + '-titulo' },
      c.PALESTRANTE_FOTO
        ? h('img', { class: 'pessoa__foto', src: c.PALESTRANTE_FOTO, alt: c.PALESTRANTE_FOTO_ALT || 'Foto de ' + c.PALESTRANTE_NOME, loading: 'lazy', decoding: 'async' })
        : h('div', { class: 'pessoa__foto pessoa__foto--iniciais', 'aria-hidden': 'true' }, iniciais(c.PALESTRANTE_NOME).toUpperCase()),
      h('div', { class: 'pessoa__texto' },
        h('h2', { id: id + '-titulo', class: 'pessoa__rotulo' }, rotulo),
        h('p', { class: 'pessoa__nome' }, c.PALESTRANTE_NOME),
        c.PALESTRANTE_BIO ? h('div', { class: 'pessoa__bio' }, texto(c.PALESTRANTE_BIO)) : null,
        c.PALESTRANTE_INSTAGRAM ? L.botao('Instagram de ' + primeiroNome, c.PALESTRANTE_INSTAGRAM, 'escuro', 'instagram') : null
      )
    );
  }
  L.blocoPessoa = blocoPessoa;

   
  const CORES_PROJETO = ['azul', 'amarelo', 'vermelho', 'verde', 'laranja'];

  function desenhoIdentidade(titulo) {
    const t = L.normalizar(titulo);
    if (t.indexOf('lampada') > -1) return h('span', { class: 'identidade__lampada' }, L.lampada ? L.lampada('identidade__svg', false) : null);
    if (t.indexOf('luz') > -1) return h('span', { class: 'identidade__luz', 'aria-hidden': 'true' });
    if (t.indexOf('peca') > -1 || t.indexOf('quebra') > -1) return h('span', { class: 'identidade__peca' }, L.icone('peca'));
    if (t.indexOf('cor') > -1) return h('span', { class: 'identidade__cores', 'aria-hidden': 'true' },
      CORES_PROJETO.map(function (c) { return h('span', { class: 'c-' + c }); }));
    return h('span', { class: 'identidade__peca' }, L.icone('luz'));
  }

  function secaoIdentidade(d) {
    if (!d.identidade || !d.identidade.length) return null;
    return h('section', { class: 'projeto__secao identidade', id: 'identidade', 'aria-labelledby': 'identidade-titulo' },
      h('h2', { id: 'identidade-titulo', class: 'titulo-secao' }, 'Nossa identidade'),
      h('p', { class: 'intro' }, 'O que cada elemento da nossa marca quer dizer.'),
      h('ul', { class: 'identidade__lista' }, d.identidade.map(function (b) {
        return h('li', { class: 'identidade__item' },
          desenhoIdentidade(b.titulo),
          h('div', null,
            h('h3', { class: 'identidade__titulo' }, b.titulo),
            h('div', { class: 'identidade__texto' }, texto(b.texto)))
        );
      }))
    );
  }

   
  function cartaoAcao(a) {
    return h('li', { class: 'acao' + (a.destaque ? ' acao--destaque' : ''), 'data-categoria': a.categoria },
      a.imagem
        ? h('figure', { class: 'acao__foto' }, imagem(a.imagem, a.imagemAlt || a.titulo))
        : null,
      h('div', { class: 'acao__corpo' },
        a.categoria ? h('p', { class: 'acao__categoria' }, a.categoria) : null,
        h('h3', { class: 'acao__titulo' }, a.titulo),
        a.data || a.local
          ? h('p', { class: 'acao__meta' },
              a.data ? h('span', null, h('span', { class: 'sr-only' }, 'Data: '), a.data) : null,
              a.local ? h('span', null, h('span', { class: 'sr-only' }, 'Local: '), a.local) : null)
          : null,
        a.descricao ? h('div', { class: 'acao__texto' }, texto(a.descricao)) : null
      )
    );
  }

  function secaoAcoes(d, c) {
    const acoes = d.acoes || [];
    const categorias = [];
    acoes.forEach(function (a) { if (a.categoria && categorias.indexOf(a.categoria) === -1) categorias.push(a.categoria); });

    const lista = h('ul', { class: 'acoes__lista' }, acoes.map(cartaoAcao));
    const contador = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });

    let filtros = null;
    if (categorias.length > 1) {
      const botoes = [''].concat(categorias).map(function (cat) {
        return h('button', {
          class: 'chip', type: 'button', 'data-valor': cat, 'aria-pressed': cat === '' ? 'true' : 'false',
          onclick: function () {
            botoes.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-valor') === cat ? 'true' : 'false'); });
            let visiveis = 0;
            lista.querySelectorAll('.acao').forEach(function (item) {
              const mostrar = !cat || item.getAttribute('data-categoria') === cat;
              item.hidden = !mostrar;
              if (mostrar) visiveis++;
            });
            contador.textContent = visiveis === 1 ? '1 ação' : visiveis + ' ações';
          }
        }, cat || 'Todas');
      });
      filtros = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar ações por categoria' }, botoes);
    }

    return h('section', { class: 'projeto__secao', id: 'em-acao', 'aria-labelledby': 'acoes-titulo' },
      h('h2', { id: 'acoes-titulo', class: 'titulo-secao' }, 'Projeto em ação'),
      c.PROJETO_ACOES_TEXTO ? h('p', { class: 'intro' }, c.PROJETO_ACOES_TEXTO) : null,
      acoes.length
        ? [filtros, contador, lista]
        : h('div', { class: 'acoes__vazio' },
            h('p', { class: 'estado__titulo' }, 'Em breve compartilharemos as ações por aqui.'),
            c.INSTAGRAM_URL
              ? h('p', { class: 'estado__texto' }, 'Enquanto isso, acompanhe o projeto no Instagram.')
              : null,
            c.INSTAGRAM_URL ? L.botao('Conheça nosso Instagram', c.INSTAGRAM_URL, 'escuro', 'instagram') : null
          )
    );
  }

   
  function secaoSupa(d) {
    if (!d.supa.length) return null;
    return h('section', { class: 'projeto__secao supa escuro', id: 'supa', 'aria-labelledby': 'supa-titulo' },
      h('h2', { id: 'supa-titulo', class: 'supa__titulo' }, 'SUPA'),
      h('div', { class: 'supa__grade' }, d.supa.map(function (b) {
        return h('article', { class: 'supa__bloco' },
          b.titulo ? h('h3', null, b.titulo) : null,
          imagem(b.imagem, b.imagemAlt, 'supa__imagem'),
          texto(b.texto)
        );
      }))
    );
  }

   
  function viewProjeto() {
    const p = L.pagina('projeto');
    const c = L.config();
    return L.api('getProjeto').then(function (d) {
      const atalhos = [['quem-somos', 'Quem somos']];
      if (c.PALESTRANTE_NOME) atalhos.push(['quem-esta-a-frente', 'Quem está à frente']);
      if (d.identidade && d.identidade.length) atalhos.push(['identidade', 'Nossa identidade']);
      atalhos.push(['em-acao', 'Projeto em ação']);
      if (d.supa.length) atalhos.push(['supa', 'SUPA']);

      return L.frag(
        L.topoPagina({
          trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }],
          titulo: p.rotulo,
          resumo: p.resumo
        }),
        h('div', { class: 'container projeto' },
          h('nav', { class: 'fe__temas', 'aria-label': 'Nesta página' },
            h('ul', null, atalhos.map(function (a) {
              return h('li', null, h('a', { class: 'chip chip--link', href: '#' + a[0], 'data-rolar': a[0] }, a[1]));
            }))
          ),
          secaoSobre(d),
          blocoPessoa(c, 'Quem está à frente', 'quem-esta-a-frente'),
          secaoIdentidade(d),
          c.PRINCIPIO ? h('p', { class: 'projeto__principio' }, c.PRINCIPIO) : null,
          secaoAcoes(d, c),
          secaoSupa(d),
          L.ponte ? L.ponte('pratica') : null
        )
      );
    });
  }

  L.registrarView('projeto', function () { return viewProjeto(); });
})(window.LUZ);

;
/* Palestras */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const CORES = ['azul', 'laranja', 'verde', 'vermelho', 'amarelo'];
  const temGS = typeof google !== 'undefined' && google.script && google.script.run;

  function rolarAte(id, focar) {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    const reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    alvo.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
    const foco = focar ? document.getElementById(focar) : alvo;
    if (foco) foco.focus({ preventScroll: true });
  }

   
  function cartaoPalestra(p, i, aoSolicitar) {
    return h('li', { class: 'palestra c-' + CORES[i % CORES.length] },
      h('h3', { class: 'palestra__titulo' }, p.titulo),
      p.descricao ? h('div', { class: 'palestra__texto' }, L.textoRico(p.descricao).conteudo) : null,
      h('dl', { class: 'palestra__lista' },
        p.publico ? h('div', null, h('dt', null, 'Para quem'), h('dd', null, p.publico)) : null,
        p.formato ? h('div', null, h('dt', null, 'Formato'), h('dd', null, p.formato)) : null,
        p.temas.length ? h('div', null, h('dt', null, 'Temas'),
          h('dd', null, h('ul', { class: 'palestra__temas' }, p.temas.map(function (t) { return h('li', null, t); })))) : null
      ),
      h('button', { class: 'palestra__pedir', type: 'button', onclick: function () { aoSolicitar(p); } },
        'Pedir esta palestra', h('span', { class: 'sr-only' }, ': ' + p.titulo))
    );
  }

  function cartaoRealizada(r) {
    return h('li', { class: 'realizada' },
      r.imagem ? h('figure', { class: 'acao__foto' }, h('img', { src: r.imagem, alt: r.imagemAlt || r.instituicao, loading: 'lazy', decoding: 'async' })) : null,
      h('div', { class: 'acao__corpo' },
        h('h3', { class: 'acao__titulo' }, r.instituicao),
        r.cidade || r.data
          ? h('p', { class: 'acao__meta' },
              r.cidade ? h('span', null, h('span', { class: 'sr-only' }, 'Cidade: '), r.cidade) : null,
              r.data ? h('span', null, h('span', { class: 'sr-only' }, 'Data: '), r.data) : null)
          : null,
        r.tema ? h('p', { class: 'realizada__tema' }, r.tema) : null,
        r.descricao ? h('div', { class: 'acao__texto' }, L.textoRico(r.descricao).conteudo) : null
      )
    );
  }

   
  function formulario(d) {
    const inicio = Date.now();
    const campos = {};
    const erros = {};

    function grupo(id, rotulo, controle, opcoes) {
      opcoes = opcoes || {};
      const idDica = opcoes.dica ? id + '-dica' : null;
      const idErro = id + '-erro';
      controle.setAttribute('id', id);
      controle.setAttribute('aria-describedby', [idDica, idErro].filter(Boolean).join(' '));
      if (opcoes.obrigatorio) controle.setAttribute('aria-required', 'true');
      campos[id] = controle;
      erros[id] = h('p', { class: 'campo__erro', id: idErro, hidden: true });
      return h('div', { class: 'campo' + (opcoes.largo ? ' campo--largo' : '') },
        h('label', { for: id, class: 'campo__rotulo' }, rotulo,
          opcoes.obrigatorio ? h('span', { class: 'campo__obrigatorio' }, ' (obrigatório)') : h('span', { class: 'campo__opcional' }, ' (opcional)')),
        opcoes.dica ? h('p', { class: 'campo__dica', id: idDica }, opcoes.dica) : null,
        controle,
        erros[id]
      );
    }

    const campoTema = h('textarea', { class: 'campo__controle', rows: 3, maxlength: 600 });
    const status = h('p', { class: 'form__status', role: 'status', 'aria-live': 'polite' });
    const botaoEnviar = h('button', { class: 'botao botao--escuro-cheio', type: 'submit' }, 'Enviar pedido');

    const consentimento = h('input', { type: 'checkbox', id: 'f-consentimento', class: 'campo__check', 'aria-describedby': 'f-consentimento-erro', 'aria-required': 'true' });
    campos['f-consentimento'] = consentimento;
    erros['f-consentimento'] = h('p', { class: 'campo__erro', id: 'f-consentimento-erro', hidden: true });

    const form = h('form', { class: 'form', novalidate: true, 'aria-labelledby': 'solicitar-titulo' },
      grupo('f-nome', 'Seu nome', h('input', { type: 'text', class: 'campo__controle', maxlength: 120, autocomplete: 'name' }), { obrigatorio: true }),
      grupo('f-contato', 'WhatsApp ou e-mail', h('input', { type: 'text', class: 'campo__controle', maxlength: 160, autocomplete: 'on' }),
        { obrigatorio: true, dica: 'Para WhatsApp, inclua o DDD. Ex.: (11) 99999-9999' }),
      grupo('f-instituicao', 'Escola, igreja ou instituição', h('input', { type: 'text', class: 'campo__controle', maxlength: 160, autocomplete: 'organization' }), { obrigatorio: true }),
      grupo('f-cidade', 'Cidade', h('input', { type: 'text', class: 'campo__controle', maxlength: 120, autocomplete: 'address-level2' })),
      grupo('f-data', 'Data desejada', h('input', { type: 'date', class: 'campo__controle' })),
      grupo('f-tema', 'Tema ou assunto de interesse', campoTema,
        { largo: true, dica: 'Pode ser um dos temas acima ou outro assunto ligado à inclusão.' }),
      grupo('f-mensagem', 'Mensagem', h('textarea', { class: 'campo__controle', rows: 4, maxlength: 2000 }),
        { largo: true, dica: 'Público (idade ou série), quantidade de pessoas, duração ou o que mais quiser contar.' }),
      h('div', { class: 'campo campo--largo campo--check' },
        h('label', { for: 'f-consentimento', class: 'opcao opcao--check' }, consentimento,
          h('span', null, 'Autorizo o uso destes dados apenas para o retorno sobre este pedido.')),
        erros['f-consentimento']
      ),
      h('div', { class: 'campo-isca', 'aria-hidden': 'true' },
        h('label', { for: 'f-site' }, 'Não preencha este campo'),
        h('input', { type: 'text', id: 'f-site', tabindex: '-1', autocomplete: 'off' })
      ),
      h('div', { class: 'form__acoes campo--largo' }, botaoEnviar, status)
    );

    function mostrarErro(id, msg) {
      const controle = campos[id];
      const erro = erros[id];
      if (!controle || !erro) return;
      erro.textContent = msg || '';
      erro.hidden = !msg;
      if (msg) controle.setAttribute('aria-invalid', 'true');
      else controle.removeAttribute('aria-invalid');
    }

    const MAPA_SERVIDOR = { nome: 'f-nome', contato: 'f-contato', instituicao: 'f-instituicao', dataDesejada: 'f-data', consentimento: 'f-consentimento' };

    function validar() {
      const v = {};
      const contato = campos['f-contato'].value.trim();
      const digitos = contato.replace(/\D/g, '');
      const contatoOk = contato.indexOf('@') > -1 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato) : digitos.length >= 10 && digitos.length <= 13;
      v['f-nome'] = campos['f-nome'].value.trim().length < 2 ? 'Informe seu nome.' : '';
      v['f-contato'] = !contatoOk ? 'Informe um WhatsApp com DDD ou um e-mail válido.' : '';
      v['f-instituicao'] = campos['f-instituicao'].value.trim().length < 2 ? 'Informe o nome da escola, igreja ou instituição.' : '';
      v['f-consentimento'] = !consentimento.checked ? 'Para enviar, autorize o uso dos dados para o retorno do pedido.' : '';
      let primeiro = null;
      Object.keys(v).forEach(function (id) {
        mostrarErro(id, v[id]);
        if (v[id] && !primeiro) primeiro = id;
      });
      return primeiro;
    }

    function sucesso() {
      const titulo = h('h3', { class: 'form__ok-titulo', tabindex: '-1' }, 'Pedido enviado! 💡');
      const caixa = h('div', { class: 'form__ok', role: 'status' },
        titulo,
        h('p', null, 'Obrigado pelo convite. Vamos entrar em contato pelo WhatsApp ou e-mail que você informou.'),
        h('button', { class: 'botao botao--escuro', type: 'button', onclick: function () { caixa.replaceWith(formulario(d).form); } }, 'Enviar outro pedido')
      );
      form.replaceWith(caixa);
      titulo.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      const invalido = validar();
      if (invalido) {
        status.textContent = 'Confira os campos destacados.';
        campos[invalido].focus();
        return;
      }
      const isca = document.getElementById('f-site');
      const dados = {
        tipoPedido: 'Palestra',
        nome: campos['f-nome'].value,
        contato: campos['f-contato'].value,
        instituicao: campos['f-instituicao'].value,
        cidade: campos['f-cidade'].value,
        dataDesejada: campos['f-data'].value,
        tema: campos['f-tema'].value,
        mensagem: campos['f-mensagem'].value,
        consentimento: consentimento.checked === true,
        site: isca ? isca.value : '',
        tempo: Date.now() - inicio
      };

      if (!temGS) { status.textContent = 'Envio disponível apenas no portal publicado.'; return; }

      botaoEnviar.disabled = true;
      botaoEnviar.textContent = 'Enviando…';
      const liberar = function () { botaoEnviar.disabled = false; botaoEnviar.textContent = 'Enviar pedido'; };

      google.script.run
        .withSuccessHandler(function (r) {
          if (r && r.ok) { sucesso(); return; }
          liberar();
          status.textContent = (r && r.message) || 'Não foi possível enviar agora. Tente de novo em alguns instantes.';
          if (r && r.campos) {
            let primeiro = null;
            Object.keys(r.campos).forEach(function (k) {
              const id = MAPA_SERVIDOR[k];
              if (id) { mostrarErro(id, r.campos[k]); if (!primeiro) primeiro = id; }
            });
            if (primeiro) campos[primeiro].focus();
          }
        })
        .withFailureHandler(function () {
          liberar();
          status.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente de novo.';
        })
        .enviarSolicitacao(dados);
    });

    return {
      form: form,
      preencher: function (p) { campoTema.value = p.titulo; }
    };
  }

   
  function viewPalestras() {
    const pg = L.pagina('palestras');
    const c = L.config();
    return L.api('getPalestras').then(function (d) {
      d.palestras = d.palestras || [];
      d.realizadas = d.realizadas || [];
      const publicos = String(c.PALESTRAS_PUBLICOS || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
      const f = formulario(d);

      function solicitar(p) {
        f.preencher(p);
        rolarAte('solicitar', 'f-nome');
      }

      const atalhos = [];
      if (c.PALESTRANTE_NOME) atalhos.push(['quem-apresenta', 'Quem apresenta']);
      atalhos.push(['lista-palestras', 'Palestras']);
      if (d.realizadas.length) atalhos.push(['onde-ja-estivemos', 'Onde já estivemos']);
      atalhos.push(['solicitar', 'Solicitar']);

      return L.frag(
        L.topoPagina({
          trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: pg.rotulo }],
          titulo: pg.rotulo,
          resumo: pg.resumo
        }),
        h('div', { class: 'container palestras' },
          c.PALESTRAS_TEXTO ? h('p', { class: 'palestras__abertura' }, c.PALESTRAS_TEXTO) : null,
          h('div', { class: 'hero__acoes palestras__acoes' },
            L.botao('Solicitar uma palestra', '#solicitar', 'escuro-cheio'),
            d.palestras.length ? L.botao('Conhecer os temas', '#lista-palestras', 'escuro') : null
          ),
          h('nav', { class: 'fe__temas', 'aria-label': 'Nesta página' },
            h('ul', null, atalhos.map(function (a) {
              return h('li', null, h('a', { class: 'chip chip--link', href: '#' + a[0], 'data-rolar': a[0] }, a[1]));
            }))
          ),

          h('div', { class: 'palestras__info' },
            c.PALESTRAS_OBJETIVO ? h('section', { class: 'info c-azul', 'aria-labelledby': 'obj-titulo' },
              h('h2', { id: 'obj-titulo', class: 'info__titulo' }, 'Objetivo'),
              h('p', null, c.PALESTRAS_OBJETIVO)) : null,
            publicos.length ? h('section', { class: 'info c-laranja', 'aria-labelledby': 'pub-titulo' },
              h('h2', { id: 'pub-titulo', class: 'info__titulo' }, 'Para quem'),
              h('ul', { class: 'info__publicos' }, publicos.map(function (s) { return h('li', null, s); }))) : null,
            c.PALESTRAS_COMO_FUNCIONA ? h('section', { class: 'info c-verde', 'aria-labelledby': 'como-titulo' },
              h('h2', { id: 'como-titulo', class: 'info__titulo' }, 'Como funciona'),
              h('div', { class: 'artigo' }, L.textoRico(c.PALESTRAS_COMO_FUNCIONA).conteudo)) : null
          ),

          L.blocoPessoa ? L.blocoPessoa(c, 'Quem apresenta', 'quem-apresenta') : null,

          h('section', { class: 'projeto__secao', id: 'lista-palestras', tabindex: '-1', 'aria-labelledby': 'lista-titulo' },
            h('h2', { id: 'lista-titulo', class: 'titulo-secao' }, 'Temas das palestras'),
            d.palestras.length
              ? h('ul', { class: 'palestras__lista' }, d.palestras.map(function (p, i) { return cartaoPalestra(p, i, solicitar); }))
              : h('div', { class: 'acoes__vazio' },
                  h('p', { class: 'estado__titulo' }, 'Em breve teremos novidades por aqui.'),
                  h('p', { class: 'estado__texto' }, 'Você já pode fazer um pedido pelo formulário.'))
          ),

          d.realizadas.length
            ? h('section', { class: 'projeto__secao', id: 'onde-ja-estivemos', tabindex: '-1', 'aria-labelledby': 'realizadas-titulo' },
                h('h2', { id: 'realizadas-titulo', class: 'titulo-secao' }, 'Onde já estivemos'),
                h('ul', { class: 'acoes__lista' }, d.realizadas.map(cartaoRealizada)))
            : null,

          h('section', { class: 'projeto__secao solicitar', id: 'solicitar', tabindex: '-1', 'aria-labelledby': 'solicitar-titulo' },
            h('h2', { id: 'solicitar-titulo', class: 'titulo-secao' }, 'Solicite uma palestra'),
            c.SOLICITAR_TEXTO ? h('p', { class: 'intro' }, c.SOLICITAR_TEXTO) : null,
            f.form,
            c.PALESTRAS_LINK
              ? h('p', { class: 'solicitar__alternativa' }, 'Prefere conversar direto? ',
                  L.ancora(c.PALESTRAS_LINK, { class: 'solicitar__link' }, 'Fale com a gente'))
              : null,
            h('p', { class: 'solicitar__privacidade' }, 'Seus dados são usados apenas para responder a este pedido e não aparecem no site.')
          ),

          h('aside', { class: 'ponte c-amarelo' },
            h('div', null,
              h('h2', { class: 'ponte__titulo' }, 'Procurando pregações?'),
              h('p', { class: 'ponte__texto' }, 'As mensagens bíblicas para crianças, adolescentes e jovens estão na página Ministrações.')
            ),
            L.botao('Ver ministrações', '#/ministracoes', 'escuro', 'cruz')
          )
        )
      );
    });
  }

  L.registrarView('palestras', function () { return viewPalestras(); });
})(window.LUZ);

;
/* Ministracoes */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const CORES = ['azul', 'laranja', 'verde', 'vermelho', 'amarelo'];

  function cartaoMensagem(p, i) {
    return h('li', { class: 'palestra c-' + CORES[i % CORES.length] },
      p.textoBase ? h('p', { class: 'palestra__base' }, p.textoBase) : null,
      h('h3', { class: 'palestra__titulo' }, p.titulo),
      p.descricao ? h('div', { class: 'palestra__texto' }, L.textoRico(p.descricao).conteudo) : null,
      p.temas.length
        ? h('div', { class: 'palestra__lista' },
            h('p', { class: 'sr-only' }, 'Temas:'),
            h('ul', { class: 'palestra__temas' }, p.temas.map(function (t) { return h('li', null, t); })))
        : null
    );
  }

  function viewMinistracoes() {
    const pg = L.pagina('ministracoes');
    const c = L.config();
    return L.api('getPalestras').then(function (d) {
      const mensagens = d.pregacoes || [];
      const insta = c.PALESTRANTE_INSTAGRAM || c.INSTAGRAM_URL;
      const nome = c.PALESTRANTE_NOME ? c.PALESTRANTE_NOME.split(' ')[0] : '';

      return L.frag(
        L.topoPagina({
          trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: pg.rotulo }],
          titulo: pg.rotulo,
          resumo: pg.resumo
        }),
        h('div', { class: 'container palestras' },
          c.PREGACOES_TEXTO ? h('p', { class: 'palestras__abertura' }, c.PREGACOES_TEXTO) : null,
          h('section', { class: 'info c-laranja ministracoes__publico', 'aria-labelledby': 'min-publico' },
            h('h2', { id: 'min-publico', class: 'info__titulo' }, 'Para quem'),
            h('ul', { class: 'info__publicos' }, ['Crianças', 'Adolescentes', 'Jovens'].map(function (s) { return h('li', null, s); }))
          ),

          L.blocoPessoa ? L.blocoPessoa(c, 'Quem ministra', 'quem-ministra') : null,

          h('section', { class: 'projeto__secao', id: 'mensagens', 'aria-labelledby': 'mensagens-titulo' },
            h('h2', { id: 'mensagens-titulo', class: 'titulo-secao' }, 'Mensagens'),
            mensagens.length
              ? h('ul', { class: 'palestras__lista' }, mensagens.map(cartaoMensagem))
              : h('div', { class: 'acoes__vazio' },
                  h('p', { class: 'estado__titulo' }, 'Em breve teremos novidades por aqui.'))
          ),

          insta
            ? h('aside', { class: 'convite__caixa escuro palestras__convite' },
                L.icone('cruz', 'convite__decor'),
                h('h2', null, 'Quer convidar para ministrar?'),
                h('p', null, nome
                  ? 'Os convites para cultos, células e encontros são combinados diretamente com ' + nome + ' pelo Instagram.'
                  : 'Os convites para cultos, células e encontros são combinados pelo Instagram.'),
                L.botao('Falar pelo Instagram', insta, 'luz', 'instagram'))
            : null
        )
      );
    });
  }

  L.registrarView('ministracoes', function () { return viewMinistracoes(); });
})(window.LUZ);

;
/* Explorar */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const SEMANA_LONGA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  function svg(viewBox, classe, conteudo, rotulo) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('class', classe || '');
    s.setAttribute('focusable', 'false');
    if (rotulo) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo); }
    else s.setAttribute('aria-hidden', 'true');
    s.innerHTML = conteudo;
    return s;
  }

   
  const LACO = 'M32 12C25 12 21 17 21 23C21 29 26 35 32 42C38 35 43 29 43 23C43 17 39 12 32 12Z';
  const PECA = 'M4 0L18 0C19.5 0 20.5 -1 20 -3A7.5 7.5 0 1 1 28 -3C27.5 -1 28.5 0 30 0L44 0A4 4 0 0 1 48 4L48 18C48 19.5 49 20.5 51 20A7.5 7.5 0 1 1 51 28C49 27.5 48 28.5 48 30L48 44A4 4 0 0 1 44 48L30 48C28.5 48 27.5 47 28 45A7.5 7.5 0 1 0 20 45C20.5 47 19.5 48 18 48L4 48A4 4 0 0 1 0 44L0 30C0 28.5 1 27.5 3 28A7.5 7.5 0 1 0 3 20C1 20.5 0 19.5 0 18L0 4A4 4 0 0 1 4 0Z';
  let contadorGrad = 0;

  function laco(stroke) {
    return '<g fill="none" stroke="' + stroke + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + LACO + '"/><path d="M28 35L18 56M36 35L46 56"/></g>';
  }

  function desenho(nome) {
    const id = 'g' + (++contadorGrad);
    const d = {
      acesso: { bg: 'var(--azul)', svg:
        '<circle cx="34" cy="12" r="5" fill="#fff"/>' +
        '<g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M33 20L31 37H44L48 51"/><path d="M31 27H42"/><path d="M23 31A13 13 0 1 0 44 45"/></g>' },
      girassol: { bg: 'var(--verde)', svg: (function () {
        let p = '';
        for (let i = 0; i < 12; i++) p += '<ellipse cx="32" cy="15" rx="5" ry="10" fill="#FFC83D" transform="rotate(' + (i * 30) + ' 32 32)"/>';
        return p + '<circle cx="32" cy="32" r="10" fill="#6B3E1F"/><circle cx="29" cy="30" r="1.4" fill="#3B210F"/><circle cx="35" cy="31" r="1.4" fill="#3B210F"/><circle cx="31" cy="36" r="1.4" fill="#3B210F"/>';
      })() },
      'quebra-cabeca': { bg: 'var(--creme-2, #F4EAD5)', svg: '<g transform="translate(5 17.5) scale(0.84)"><path fill="var(--azul)" d="' + PECA + '"/></g>' },
      'fita-quebra-cabeca': { bg: 'var(--creme-2, #F4EAD5)', svg:
        '<defs><linearGradient id="' + id + '" x1="10" y1="0" x2="54" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="var(--vermelho)"/><stop offset=".25" stop-color="var(--vermelho)"/><stop offset=".25" stop-color="var(--amarelo)"/><stop offset=".5" stop-color="var(--amarelo)"/>' +
        '<stop offset=".5" stop-color="var(--azul)"/><stop offset=".75" stop-color="var(--azul)"/><stop offset=".75" stop-color="var(--verde)"/><stop offset="1" stop-color="var(--verde)"/></linearGradient></defs>' +
        laco('url(#' + id + ')') },
      infinito: { bg: '#121633', svg:
        '<defs><linearGradient id="' + id + '" x1="10" y1="0" x2="54" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#E04A3F"/><stop offset=".25" stop-color="#F28A2E"/><stop offset=".45" stop-color="#FFC83D"/><stop offset=".65" stop-color="#2E9A6B"/><stop offset=".85" stop-color="#2448B8"/><stop offset="1" stop-color="#8E44AD"/></linearGradient></defs>' +
        '<path d="M12 32C12 21 25 21 32 32C39 43 52 43 52 32C52 21 39 21 32 32C25 43 12 43 12 32Z" fill="none" stroke="url(#' + id + ')" stroke-width="7" stroke-linejoin="round"/>' },
      'laco-down': { bg: 'var(--creme-2, #F4EAD5)', svg:
        '<defs><linearGradient id="' + id + '" x1="18" y1="0" x2="46" y2="0" gradientUnits="userSpaceOnUse">' +
        '<stop offset=".5" stop-color="var(--azul)"/><stop offset=".5" stop-color="var(--amarelo)"/></linearGradient></defs>' + laco('url(#' + id + ')') },
      meias: { bg: 'var(--creme-2, #F4EAD5)', svg:
        '<g><path d="M14 8H25V36C25 44 20 48 14 48H8C3 48 3 40 8 40H14Z" fill="var(--amarelo)"/>' +
        '<rect x="14" y="14" width="11" height="4" fill="var(--vermelho)"/><rect x="14" y="24" width="11" height="4" fill="var(--vermelho)"/></g>' +
        '<g transform="translate(26 6)"><path d="M14 8H25V36C25 44 20 48 14 48H8C3 48 3 40 8 40H14Z" fill="var(--azul)"/>' +
        '<circle cx="18" cy="16" r="2" fill="#fff"/><circle cx="21" cy="25" r="2" fill="#fff"/><circle cx="17" cy="33" r="2" fill="#fff"/></g>' },
      surdez: { bg: 'var(--azul)', svg:
        '<g fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M42 22C42 14 36 9 29 9C21 9 17 15 17 22C17 29 22 31 24 36C26 41 23 46 28 49C32 51 36 48 36 44"/>' +
        '<path d="M26 23C26 18 33 17 34 22C35 27 29 28 29 32"/><path d="M12 54L52 12"/></g>' },
      libras: { bg: 'var(--laranja)', svg:
        '<path d="M22 50V30C22 27 26 27 26 30V20C26 17 30 17 30 20V18C30 15 34 15 34 18V20C34 17 38 17 38 20V35L41 31C43 28 47 30 45 34L38 46C36 50 33 52 29 52H24C23 52 22 51 22 50Z" fill="#fff"/>' +
        '<g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M13 18C9 23 9 31 13 36"/><path d="M51 16C55 21 55 29 51 34"/></g>' },
      bengala: { bg: '#121633', svg:
        '<g fill="none" stroke-width="5" stroke-linecap="round"><path d="M20 12C17 6 10 7 10 13" stroke="#fff"/><path d="M20 12L39 47" stroke="#fff"/><path d="M39 47L43 55" stroke="#E04A3F"/></g>' },
      pata: { bg: 'var(--amarelo)', svg:
        '<g fill="#121633"><ellipse cx="32" cy="40" rx="12" ry="10"/><circle cx="18" cy="27" r="5.5"/><circle cx="27" cy="18" r="5.5"/><circle cx="37" cy="18" r="5.5"/><circle cx="46" cy="27" r="5.5"/></g>' },
      'laco-azul': { bg: 'var(--creme-2, #F4EAD5)', svg: laco('var(--azul)') },
      'laco-verde': { bg: 'var(--creme-2, #F4EAD5)', svg: laco('var(--verde)') },
      'laco-laranja': { bg: 'var(--creme-2, #F4EAD5)', svg: laco('var(--laranja)') },
      'laco-azul-escuro': { bg: 'var(--creme-2, #F4EAD5)', svg: laco('#1B2A6B') }
    }[nome];
    if (!d) return h('div', { class: 'simbolo__arte simbolo__arte--vazia', 'aria-hidden': 'true' }, L.icone('luz'));
    const arte = h('div', { class: 'simbolo__arte', 'aria-hidden': 'true' });
    arte.style.background = d.bg;
    arte.appendChild(svg('0 0 64 64', 'simbolo__svg', d.svg));
    return arte;
  }

   
  const ICO = {
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    historia: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    simbolo: '<path d="M12 21s-7-4.4-9.2-8.6C1.2 9.2 3 5.5 6.6 5.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.4 3.7 3.8 6.9C19 16.6 12 21 12 21z"/>'
  };
  function ico(nome) {
    const s = svg('0 0 24 24', 'ico', ICO[nome] || ICO.simbolo);
    return s;
  }

  function topo(id) {
    const p = L.pagina(id);
    return L.topoPagina({ trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: 'Entenda', rota: 'entenda' }, { rotulo: p.rotulo }], titulo: p.rotulo, resumo: p.resumo });
  }

  function vazio(texto) {
    return L.estado({ titulo: 'Em breve teremos novidades por aqui.', texto: texto || '' });
  }

  

  function blocoExplorar() {
    const itens = [
      ['simbolos', 'Símbolos e cores', 'O que significam o girassol, o infinito, o laço azul e amarelo e outros.', 'simbolo', 'amarelo'],
      ['calendario', 'Calendário da inclusão', 'As datas importantes do ano, com explicação de cada uma.', 'calendario', 'azul'],
      ['historia', 'História da inclusão', 'Da exclusão à inclusão: os marcos que mudaram tudo.', 'historia', 'vermelho'],
      ['materiais', 'Materiais para baixar', 'Rotina visual, prancha de comunicação, checklist e mais.', 'baixar', 'verde']
    ];
    return h('section', { class: 'explorar', 'aria-labelledby': 'explorar-titulo' },
      h('h2', { id: 'explorar-titulo', class: 'entenda__titulo' }, 'Explore também'),
      h('ul', { class: 'explorar__grade' }, itens.map(function (i) {
        return h('li', null, h('a', { class: 'cartao explorar__cartao c-' + i[4], href: '#/' + i[0], 'data-rota': i[0] },
          h('span', { class: 'cartao__icone' }, ico(i[3])),
          h('h3', { class: 'cartao__titulo' }, i[1]),
          h('p', { class: 'cartao__texto' }, i[2])));
      }))
    );
  }

  

  function cartaoSimbolo(s) {
    const detalhes = [
      s.historia ? h('div', { class: 'simbolo__bloco' }, h('dt', null, 'História'), h('dd', null, s.historia)) : null,
      s.comoUsar ? h('div', { class: 'simbolo__bloco' }, h('dt', null, 'No dia a dia'), h('dd', null, s.comoUsar)) : null,
      s.atencao ? h('div', { class: 'simbolo__bloco simbolo__bloco--atencao' }, h('dt', null, 'Atenção'), h('dd', null, s.atencao)) : null
    ].filter(Boolean);
    return h('li', { class: 'simbolo', id: 'simbolo-' + s.id },
      desenho(s.desenho),
      h('div', { class: 'simbolo__corpo' },
        h('h3', { class: 'simbolo__nome' }, s.nome),
        s.significado ? h('p', { class: 'simbolo__significado' }, s.significado) : null,
        detalhes.length ? h('details', { class: 'simbolo__mais' },
          h('summary', null, 'Saiba mais'),
          h('dl', { class: 'simbolo__lista' }, detalhes)) : null
      )
    );
  }

  function viewSimbolos() {
    return L.api('getSimbolos').then(function (d) {
      const grupos = d.grupos || [];
      return L.frag(
        topo('simbolos'),
        h('div', { class: 'container explorar-pagina' },
          h('p', { class: 'entenda__principio' }, 'Símbolos ajudam a identificar, conscientizar e acolher. Conhecer o significado de cada um é um jeito simples de praticar a inclusão.'),
          grupos.length > 1 ? h('nav', { class: 'fe__temas', 'aria-label': 'Grupos de símbolos' },
            h('ul', null, grupos.map(function (g) {
              const id = 'grupo-' + L.slug(g.grupo);
              return h('li', null, h('a', { class: 'chip chip--link', href: '#' + id, 'data-rolar': id }, g.grupo));
            }))) : null,
          grupos.length ? grupos.map(function (g) {
            const id = 'grupo-' + L.slug(g.grupo);
            return h('section', { class: 'simbolos__grupo', id: id, tabindex: '-1', 'aria-labelledby': id + '-t' },
              h('h2', { id: id + '-t', class: 'entenda__titulo' }, g.grupo),
              h('ul', { class: 'simbolos__grade' }, g.simbolos.map(cartaoSimbolo)));
          }) : vazio('Os símbolos estão sendo preparados.'),
          L.ponte ? L.ponte('glossario') : null
        )
      );
    });
  }

  

  function viewCalendario() {
    return L.api('getDatas').then(function (d) {
      const datas = d.datas || [];
      const hoje = new Date();
      const ano = hoje.getFullYear();
      let mes = hoje.getMonth() + 1;
      let selecionada = null;

      const tituloMes = h('h2', { class: 'cal__mes', 'aria-live': 'polite' });
      const faixas = h('div', { class: 'cal__faixas' });
      const grade = h('div', { class: 'cal__grade' });
      const detalhe = h('section', { class: 'cal__detalhe', 'aria-live': 'polite', tabindex: '-1', id: 'cal-detalhe' });
      const listaMes = h('ul', { class: 'cal__lista' });
      const chipsMes = MESES.map(function (m, i) {
        return h('button', { class: 'chip cal__chip', type: 'button', 'data-mes': i + 1, onclick: function () { irPara(i + 1); } }, m.slice(0, 3));
      });

      function datasDoMes(m) { return datas.filter(function (x) { return x.mes === m; }); }
      function eventosDoDia(m, dia) {
        return datas.filter(function (x) {
          if (x.mes !== m || x.periodo === 'Mês' || !x.dia) return false;
          return x.diaFim ? dia >= x.dia && dia <= x.diaFim : dia === x.dia;
        });
      }
      function quando(x) {
        if (x.periodo === 'Mês') return 'Todo o mês de ' + MESES[x.mes - 1].toLowerCase();
        if (x.diaFim) return x.dia + ' a ' + x.diaFim + ' de ' + MESES[x.mes - 1].toLowerCase();
        return x.dia + ' de ' + MESES[x.mes - 1].toLowerCase();
      }

      function mostrarDetalhe(x, focar) {
        selecionada = x;
        if (!x) {
          detalhe.replaceChildren(h('p', { class: 'cal__dica' }, 'Toque em uma data destacada para ver o que ela significa.'));
        } else {
          detalhe.className = 'cal__detalhe c-' + x.cor;
          detalhe.replaceChildren(
            h('p', { class: 'cal__quando' }, quando(x)),
            h('h3', { class: 'cal__titulo' }, x.titulo),
            x.resumo ? h('p', { class: 'cal__resumo' }, x.resumo) : null,
            x.explicacao ? h('p', null, x.explicacao) : null,
            x.comoParticipar ? h('div', { class: 'cal__participar' }, h('strong', null, 'Como participar: '), x.comoParticipar) : null,
            x.fonte ? h('p', { class: 'cal__fonte' }, 'Referência: ' + x.fonte) : null,
            L.botaoImagem ? L.botaoImagem(function () {
              return { etiqueta: 'Calendário da inclusão', pre: quando(x), titulo: x.titulo, texto: x.resumo, cor: x.cor, nomeArquivo: x.id };
            }, 'Imagem para stories', 'img-btn--pequeno') : null
          );
        }
        grade.querySelectorAll('.cal__dia--evento').forEach(function (b) {
          b.setAttribute('aria-pressed', x && b.getAttribute('data-ids').split(',').indexOf(x.id) > -1 ? 'true' : 'false');
        });
        if (focar) detalhe.focus({ preventScroll: false });
      }

      function renderMes() {
        tituloMes.textContent = MESES[mes - 1] + ' de ' + ano;
        chipsMes.forEach(function (c) { c.setAttribute('aria-pressed', Number(c.getAttribute('data-mes')) === mes ? 'true' : 'false'); });

        const doMes = datasDoMes(mes);
        faixas.replaceChildren.apply(faixas, doMes.filter(function (x) { return x.periodo === 'Mês'; }).map(function (x) {
          return h('button', { class: 'cal__faixa c-' + x.cor, type: 'button', onclick: function () { mostrarDetalhe(x, true); } },
            h('strong', null, x.titulo), h('span', null, x.resumo));
        }));

        const celulas = SEMANA.map(function (s, i) { return h('div', { class: 'cal__semana', 'aria-hidden': 'true', title: SEMANA_LONGA[i] }, s); });
        const primeiro = new Date(ano, mes - 1, 1).getDay();
        const total = new Date(ano, mes, 0).getDate();
        for (let i = 0; i < primeiro; i++) celulas.push(h('div', { class: 'cal__vazio', 'aria-hidden': 'true' }));
        for (let dia = 1; dia <= total; dia++) {
          const ev = eventosDoDia(mes, dia);
          const ehHoje = dia === hoje.getDate() && mes === hoje.getMonth() + 1;
          if (ev.length) {
            const principal = ev[0];
            celulas.push(h('button', {
              class: 'cal__dia cal__dia--evento c-' + principal.cor + (ehHoje ? ' cal__dia--hoje' : ''), type: 'button',
              'data-ids': ev.map(function (x) { return x.id; }).join(','), 'aria-pressed': 'false',
              'aria-label': dia + ' de ' + MESES[mes - 1].toLowerCase() + ': ' + ev.map(function (x) { return x.titulo; }).join(' e '),
              onclick: function () { mostrarDetalhe(principal, true); }
            }, h('span', { class: 'cal__num' }, String(dia)), h('span', { class: 'cal__ponto', 'aria-hidden': 'true' })));
          } else {
            celulas.push(h('div', { class: 'cal__dia' + (ehHoje ? ' cal__dia--hoje' : ''), 'aria-hidden': 'true' }, h('span', { class: 'cal__num' }, String(dia))));
          }
        }
        grade.replaceChildren.apply(grade, celulas);

        listaMes.replaceChildren.apply(listaMes, doMes.length
          ? doMes.map(function (x) {
              return h('li', null, h('button', { class: 'cal__item c-' + x.cor, type: 'button', onclick: function () { mostrarDetalhe(x, true); } },
                h('span', { class: 'cal__item-quando' }, quando(x)), h('span', { class: 'cal__item-titulo' }, x.titulo)));
            })
          : [h('li', { class: 'cal__sem' }, 'Nenhuma data cadastrada neste mês.')]);

        
        const dias = doMes.filter(function (x) { return x.periodo !== 'Mês'; });
        const proxima = mes === hoje.getMonth() + 1 ? dias.filter(function (x) { return (x.diaFim || x.dia) >= hoje.getDate(); })[0] : null;
        mostrarDetalhe(proxima || dias[0] || doMes[0] || null, false);
      }

      function irPara(m) {
        mes = ((m - 1 + 12) % 12) + 1;
        renderMes();
      }

      renderMes();

      const anoInteiro = h('details', { class: 'cal__ano' },
        h('summary', null, 'Ver todas as datas do ano em lista'),
        h('ol', { class: 'cal__ano-lista' }, MESES.map(function (m, i) {
          const doMes = datasDoMes(i + 1);
          if (!doMes.length) return null;
          return h('li', null, h('h3', null, m), h('ul', null, doMes.map(function (x) {
            return h('li', null, h('strong', null, quando(x) + ': '), x.titulo);
          })));
        }))
      );

      if (!datas.length) return L.frag(topo('calendario'), vazio('As datas estão sendo preparadas.'));

      return L.frag(
        topo('calendario'),
        h('div', { class: 'container explorar-pagina' },
          h('div', { class: 'cal' },
            h('div', { class: 'cal__painel' },
              h('div', { class: 'cal__nav' },
                h('button', { class: 'cal__seta', type: 'button', onclick: function () { irPara(mes - 1); } }, '‹', h('span', { class: 'sr-only' }, ' mês anterior')),
                tituloMes,
                h('button', { class: 'cal__seta', type: 'button', onclick: function () { irPara(mes + 1); } }, '›', h('span', { class: 'sr-only' }, ' próximo mês'))
              ),
              h('div', { class: 'cal__chips', role: 'group', 'aria-label': 'Escolher mês' }, chipsMes),
              faixas,
              grade,
              h('h3', { class: 'cal__lista-titulo' }, 'Datas deste mês'),
              listaMes
            ),
            detalhe
          ),
          anoInteiro,
          h('p', { class: 'cal__nota' }, 'Dica: o calendário também é um ótimo planejamento de conteúdos e ações para o ano todo.')
        )
      );
    });
  }

  

  function diagrama(tipo) {
    
    const cinza = [[22, 30], [30, 22], [40, 26], [44, 36], [34, 40], [24, 40], [32, 31]];
    const cores = ['var(--vermelho)', 'var(--azul)', 'var(--verde)', 'var(--laranja)'];
    let s = '<circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".55"/>';
    cinza.forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2" fill="#9AA0B8"/>'; });
    let fora = [];
    if (tipo === 'exclusao') fora = [[6, 10], [58, 12], [8, 56], [57, 54]];
    if (tipo === 'segregacao') { s += '<circle cx="54" cy="54" r="9" fill="none" stroke="currentColor" stroke-width="2" opacity=".55"/>'; fora = [[51, 51], [57, 51], [51, 57], [57, 57]]; }
    if (tipo === 'integracao') { s += '<circle cx="32" cy="48" r="7" fill="none" stroke="currentColor" stroke-width="2" opacity=".55"/>'; fora = [[29.5, 45.5], [34.5, 45.5], [29.5, 50.5], [34.5, 50.5]]; }
    if (tipo === 'inclusao') fora = [[27, 26], [38, 33], [28, 35], [37, 21]];
    fora.forEach(function (p, i) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2" fill="' + cores[i] + '"/>'; });
    return svg('0 0 64 64', 'historia__diagrama', s);
  }

  function viewHistoria() {
    return L.api('getHistoria').then(function (d) {
      const paradigmas = d.paradigmas || [];
      const marcos = d.marcos || [];
      const lista = h('ol', { class: 'linha' });
      let filtro = '';

      function desenhar() {
        lista.replaceChildren.apply(lista, marcos.filter(function (m) { return !filtro || m.escopo === filtro; }).map(function (m) {
          return h('li', { class: 'linha__item linha__item--' + L.slug(m.escopo) },
            h('span', { class: 'linha__ano' }, m.ano),
            h('div', { class: 'linha__caixa' },
              h('span', { class: 'linha__escopo' }, m.escopo),
              h('h3', { class: 'linha__titulo' }, m.titulo),
              m.texto ? h('p', null, m.texto) : null));
        }));
      }
      desenhar();

      const filtros = ['', 'Brasil', 'Mundo'].map(function (f) {
        return h('button', {
          class: 'chip', type: 'button', 'aria-pressed': f === '' ? 'true' : 'false', 'data-f': f,
          onclick: function (e) {
            filtro = e.currentTarget.getAttribute('data-f');
            filtros.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === filtro ? 'true' : 'false'); });
            desenhar();
          }
        }, f || 'Todos');
      });

      if (!paradigmas.length && !marcos.length) return L.frag(topo('historia'), vazio());

      return L.frag(
        topo('historia'),
        h('div', { class: 'container explorar-pagina' },
          paradigmas.length ? h('section', { class: 'historia__caminhos', 'aria-labelledby': 'caminhos-titulo' },
            h('h2', { id: 'caminhos-titulo', class: 'entenda__titulo' }, 'Quatro formas de enxergar a deficiência'),
            h('p', { class: 'intro' }, 'Nos desenhos, os pontos cinza são pessoas sem deficiência e os coloridos, pessoas com deficiência.'),
            h('ol', { class: 'caminhos' }, paradigmas.map(function (p) {
              return h('li', { class: 'caminho' },
                diagrama(L.slug(p.titulo).replace(/-/g, '')),
                h('h3', { class: 'caminho__titulo' }, p.titulo),
                p.texto ? h('p', null, p.texto) : null);
            }))
          ) : null,
          marcos.length ? h('section', { class: 'historia__linha', 'aria-labelledby': 'linha-titulo' },
            h('h2', { id: 'linha-titulo', class: 'entenda__titulo' }, 'Linha do tempo'),
            h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar marcos' }, filtros),
            lista
          ) : null,
          L.ponte ? L.ponte('pratica') : null
        )
      );
    });
  }

  

  function viewMateriais() {
    return L.api('getMateriais').then(function (d) {
      const materiais = d.materiais || [];
      const cores = ['azul', 'verde', 'laranja', 'vermelho'];
      return L.frag(
        topo('materiais'),
        h('div', { class: 'container explorar-pagina' },
          h('p', { class: 'entenda__principio' }, 'Recursos gratuitos para imprimir e usar. Pode compartilhar à vontade.'),
          materiais.length
            ? h('ul', { class: 'materiais__grade' }, materiais.map(function (m, i) {
                return h('li', { class: 'material c-' + cores[i % cores.length] },
                  h('span', { class: 'cartao__icone' }, ico('baixar')),
                  h('h2', { class: 'material__titulo' }, m.titulo),
                  m.descricao ? h('p', { class: 'material__texto' }, m.descricao) : null,
                  m.paraQue || m.comoUsar ? h('div', { class: 'material__guia' },
                    m.paraQue ? h('div', { class: 'material__bloco' }, h('p', { class: 'material__rotulo' }, '💡 Para que serve'), h('p', null, m.paraQue)) : null,
                    m.comoUsar ? h('div', { class: 'material__bloco' }, h('p', { class: 'material__rotulo' }, '✂️ Como usar'), h('p', null, m.comoUsar)) : null) : null,
                  h('dl', { class: 'material__info' },
                    m.publico ? h('div', null, h('dt', null, 'Para quem'), h('dd', null, m.publico)) : null,
                    h('div', null, h('dt', null, 'Formato'), h('dd', null, m.formato + (m.paginas ? ', ' + m.paginas : '')))
                  ),
                  L.ancora(m.link, { class: 'botao botao--escuro-cheio material__baixar' }, ico('baixar'), 'Baixar ' + m.formato));
              }))
            : vazio('Os materiais estão sendo preparados.'),
          h('p', { class: 'cal__nota' }, 'Os materiais abrem em uma nova aba. Para imprimir, use a opção de impressão do navegador ou do leitor de PDF.')
        )
      );
    });
  }

  L.registrarView('simbolos', function () { return viewSimbolos(); });
  L.registrarView('calendario', function () { return viewCalendario(); });
  L.registrarView('historia', function () { return viewHistoria(); });
  L.registrarView('materiais', function () { return viewMateriais(); });
  L.blocoExplorar = blocoExplorar;
})(window.LUZ);

;
/* Busca */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;

   
  const SINONIMOS = {
    autismo: ['tea', 'autis', 'espectro'],
    autista: ['tea', 'autis', 'espectro'],
    autistas: ['tea', 'autis', 'espectro'],
    tea: ['autis', 'espectro'],
    tdah: ['deficit de atencao', 'hiperatividade'],
    hiperativo: ['tdah', 'hiperatividade'],
    hiperatividade: ['tdah'],
    down: ['sindrome de down', 'trissomia'],
    surdo: ['auditiva', 'libras', 'surdez'],
    surda: ['auditiva', 'libras', 'surdez'],
    surdez: ['auditiva', 'surdo', 'libras'],
    cego: ['visual', 'cegueira', 'braille', 'cao-guia'],
    cega: ['visual', 'cegueira', 'braille', 'cao-guia'],
    cegueira: ['visual', 'cego', 'braille'],
    cadeirante: ['fisica', 'cadeira de rodas', 'mobilidade'],
    deficiente: ['deficiencia'],
    especial: ['deficiencia', 'inclusao'],
    preconceito: ['capacitismo', 'barreira atitudinal'],
    crise: ['sobrecarga', 'meltdown', 'shutdown', 'regulacao'],
    birra: ['crise', 'sobrecarga', 'meltdown'],
    escola: ['escola', 'pei', 'aee', 'professor'],
    igreja: ['igreja', 'culto', 'ministerio'],
    biblia: ['versiculo', 'mateus', 'joao', 'salmo'],
    pregacao: ['ministracoes', 'mensagem'],
    pregacoes: ['ministracoes', 'mensagem'],
    palestra: ['palestras'],
    lei: ['lei', 'lbi', 'direitos']
  };

  const SUGESTOES = ['TEA', 'TDAH', 'Síndrome de Down', 'Acessibilidade', 'Capacitismo', 'Igreja', 'Escola', 'Libras'];

  let dialogo = null;
  let campo = null;
  let lista = null;
  let status = null;
  let indice = null;
  let aberto = false;
  let focoAnterior = null;
  let esperaRegistro = null;
  const ESPERA_REGISTRO_MS = 2000;

  function preparar(itens) {
    return itens.map(function (i) {
      return { item: i, titulo: L.normalizar(i.ti), resumo: L.normalizar(i.r), extra: L.normalizar(i.x) };
    });
  }

  function alternativas(palavra) {
    return [palavra].concat(SINONIMOS[palavra] || []);
  }

   
  function pontuar(registro, palavras) {
    let total = 0;
    for (let i = 0; i < palavras.length; i++) {
      let melhor = 0;
      alternativas(palavras[i]).forEach(function (alt) {
        let p = 0;
        if (registro.titulo.indexOf(alt) === 0) p = 10;
        else if (registro.titulo.indexOf(alt) > -1) p = 6;
        else if (registro.resumo.indexOf(alt) > -1) p = 3;
        else if (registro.extra.indexOf(alt) > -1) p = 1;
        if (alt !== palavras[i]) p = p * 0.8;
        if (p > melhor) melhor = p;
      });
      if (!melhor) return 0;
      total += melhor;
    }
    return total;
  }

  function buscar(texto) {
    const palavras = L.normalizar(texto).split(/\s+/).filter(function (p) { return p.length >= 2; });
    if (!palavras.length || !indice) return [];
    return indice
      .map(function (r, ordem) { return { r: r, p: pontuar(r, palavras), ordem: ordem }; })
      .filter(function (x) { return x.p > 0; })
      .sort(function (a, b) { return b.p - a.p || a.ordem - b.ordem; })
      .slice(0, 30)
      .map(function (x) { return x.r.item; });
  }

  function resultado(i) {
    return h('li', null,
      h('a', { class: 'busca-res', href: '#/' + i.h, 'data-rota': i.h, onclick: function () { fecharBusca(false); } },
        h('span', { class: 'busca-res__tipo' }, i.t),
        h('span', { class: 'busca-res__titulo' }, i.ti),
        i.r ? h('span', { class: 'busca-res__resumo' }, i.r.length > 150 ? i.r.slice(0, 147) + '…' : i.r) : null
      )
    );
  }

  function mostrarSugestoes() {
    lista.replaceChildren(
      h('li', { class: 'busca-sugestoes' },
        h('p', { class: 'busca-sugestoes__titulo' }, 'Sugestões'),
        h('div', { class: 'busca-sugestoes__lista' }, SUGESTOES.map(function (s) {
          return h('button', { class: 'chip', type: 'button', onclick: function () { campo.value = s; atualizar(); campo.focus(); } }, s);
        }))
      )
    );
    status.textContent = '';
  }

  function atualizar() {
    if (!indice) return;
    clearTimeout(esperaRegistro);
    const texto = campo.value.trim();
    if (texto.length < 2) { mostrarSugestoes(); return; }

    if (L.ehCrise && L.ehCrise(texto)) {
      lista.replaceChildren(h('li', { class: 'busca-acolhe' }, L.cartaoAcolhimento({ compacto: true })));
      status.textContent = 'Mensagem de apoio: CVV, ligue 188.';
      return;
    }

    const achados = buscar(texto);
    if (!achados.length) {
      lista.replaceChildren(h('li', { class: 'busca-vazia' },
        h('p', { class: 'estado__titulo' }, 'Nenhum resultado para "' + texto + '".'),
        h('p', { class: 'estado__texto' }, 'Tente outra palavra, como TEA, acolhimento ou acessibilidade.'),
        L.abrirAssistente ? h('button', {
          class: 'botao botao--luz busca-vazia__ia', type: 'button',
          onclick: function () { fecharBusca(false); L.abrirAssistente(texto); }
        }, 'Perguntar ao assistente') : null));
      status.textContent = 'Nenhum resultado.';
      
      esperaRegistro = setTimeout(function () {
        if (campo.value.trim() === texto && L.registrarBuscaVazia) L.registrarBuscaVazia(texto);
      }, ESPERA_REGISTRO_MS);
      return;
    }
    lista.replaceChildren.apply(lista, achados.map(resultado));
    status.textContent = achados.length === 1 ? '1 resultado.' : achados.length + ' resultados.';
  }

  function criarDialogo() {
    campo = h('input', {
      id: 'busca-global', class: 'busca__campo', type: 'search', placeholder: 'Ex.: autismo, acolhimento, Libras...',
      autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search', 'aria-controls': 'busca-resultados'
    });
    status = h('p', { class: 'busca-dialogo__status', role: 'status', 'aria-live': 'polite' });
    lista = h('ul', { class: 'busca-dialogo__lista', id: 'busca-resultados' });

    let espera = null;
    campo.addEventListener('input', function () {
      clearTimeout(espera);
      espera = setTimeout(atualizar, 120);
    });
    campo.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        const primeiro = lista.querySelector('a, button');
        if (primeiro) { e.preventDefault(); primeiro.focus(); }
      }
    });

    dialogo = h('div', { class: 'busca-dialogo', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'busca-dialogo-titulo' },
      h('div', { class: 'busca-dialogo__fundo', onclick: function () { fecharBusca(true); } }),
      h('div', { class: 'busca-dialogo__painel' },
        h('div', { class: 'busca-dialogo__topo' },
          h('label', { for: 'busca-global', id: 'busca-dialogo-titulo', class: 'busca-dialogo__titulo' }, 'O que você procura?'),
          h('button', { class: 'busca-dialogo__fechar', type: 'button', onclick: function () { fecharBusca(true); } },
            L.icone('fechar'), h('span', { class: 'sr-only' }, 'Fechar busca'))
        ),
        h('div', { class: 'busca__caixa' }, L.icone('lupa', 'busca__icone'), campo),
        status,
        lista
      )
    );
    document.body.appendChild(dialogo);
  }

  function teclas(e) {
    if (!aberto) return;
    if (e.key === 'Escape') { e.preventDefault(); fecharBusca(true); return; }
    if (e.key !== 'Tab') return;
    const focaveis = Array.prototype.slice.call(dialogo.querySelectorAll('input, button, a[href]'))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }

  function abrirBusca(textoInicial) {
    if (!dialogo) criarDialogo();
    if (typeof textoInicial === 'string' && textoInicial.trim()) campo.value = textoInicial.trim().slice(0, 120);
    if (L.fecharMenu) L.fecharMenu(false);
    focoAnterior = document.activeElement;
    dialogo.hidden = false;
    aberto = true;
    document.body.classList.add('travado');
    document.addEventListener('keydown', teclas);
    campo.focus();

    if (indice) { atualizar(); return; }
    lista.replaceChildren(h('li', { class: 'busca-vazia' }, h('p', { class: 'estado__texto' }, 'Carregando…')));
    L.api('getBusca')
      .then(function (d) { indice = preparar(d.itens || []); atualizar(); })
      .catch(function () {
        lista.replaceChildren(h('li', { class: 'busca-vazia' },
          h('p', { class: 'estado__texto' }, 'Não foi possível carregar a busca agora. Tente de novo em alguns instantes.')));
      });
  }

  function fecharBusca(devolverFoco) {
    if (!aberto) return;
    clearTimeout(esperaRegistro);
    dialogo.hidden = true;
    aberto = false;
    document.body.classList.remove('travado');
    document.removeEventListener('keydown', teclas);
    if (devolverFoco && focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

   
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || aberto) return;
    const alvo = e.target;
    const digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT' || alvo.isContentEditable);
    if (digitando) return;
    e.preventDefault();
    abrirBusca();
  });

  L.abrirBusca = abrirBusca;
  L.fecharBusca = fecharBusca;
})(window.LUZ);

;
/* Avaliacao */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const temGS = typeof google !== 'undefined' && google.script && google.script.run;

  const CHAVE = 'luz_avaliacao_v1';
  const DIA = 24 * 60 * 60 * 1000;
  const ROTULOS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];
  const memoria = {};

  function ler(k) {
    try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return memoria[k] || null; }
  }
  function gravar(k, v) {
    memoria[k] = v;
    try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {   }
  }

  function enviar(dados) {
    return new Promise(function (resolver, rejeitar) {
      if (!temGS) { rejeitar(); return; }
      google.script.run
        .withSuccessHandler(function (r) { if (r && r.ok) resolver(r); else rejeitar(r); })
        .withFailureHandler(rejeitar)
        .enviarAvaliacao(dados);
    });
  }

  const inicio = Date.now();
  let paginas = 0;
  let ultimaRota = '';
  let rotaAtual = '';
  let botao = null;
  let cartao = null;
  let aberto = false;
  let convidado = false;

  function estado() { return ler(CHAVE) || {}; }
  function jaAvaliou() { return estado().status === 'avaliado'; }
  function podeConvidar() {
    const s = estado();
    if (s.status === 'avaliado' || s.status === 'recusado') return false;
    if (s.status === 'adiado') return Date.now() > (s.ate || 0);
    return true;
  }

   
  function criarBotao() {
    botao = h('button', { class: 'aval-botao', type: 'button', 'aria-haspopup': 'dialog', onclick: function () { abrir(true); } },
      h('span', { class: 'aval-botao__estrela', 'aria-hidden': 'true' }, '★'), 'Avaliar');
    if (jaAvaliou()) botao.hidden = true;
    document.body.appendChild(botao);
  }

   
  function montarCartao() {
    const aberturaEm = Date.now();
    let nota = 0;

    const legenda = h('p', { class: 'aval-legenda', 'aria-live': 'polite' }, '');
    const comentario = h('textarea', { id: 'aval-comentario', class: 'campo__controle aval-comentario', rows: 3, maxlength: 500 });
    const blocoComentario = h('div', { class: 'aval-bloco', hidden: true },
      h('label', { for: 'aval-comentario', class: 'campo__rotulo' }, 'Quer deixar um comentário? ', h('span', { class: 'campo__opcional' }, '(opcional)')),
      comentario
    );
    const isca = h('input', { type: 'text', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', class: 'campo-isca' });
    const status = h('p', { class: 'aval-status', role: 'status', 'aria-live': 'polite' });
    const botaoEnviar = h('button', { class: 'botao botao--escuro-cheio aval-enviar', type: 'button', disabled: true, onclick: enviarNota }, 'Enviar avaliação');

    const rotulosEstrela = [];
    const estrelas = [1, 2, 3, 4, 5].map(function (n) {
      const id = 'aval-n' + n;
      const radio = h('input', {
        type: 'radio', name: 'aval-nota', id: id, value: n, class: 'aval-radio',
        onchange: function () {
          nota = n;
          rotulosEstrela.forEach(function (r, i) { r.classList.toggle('aval-estrela--ativa', i < n); });
          legenda.textContent = n + ' de 5: ' + ROTULOS[n];
          blocoComentario.hidden = false;
          botaoEnviar.disabled = false;
        }
      });
      const rotulo = h('label', { for: id, class: 'aval-estrela', title: ROTULOS[n] },
        h('span', { 'aria-hidden': 'true' }, '★'),
        h('span', { class: 'sr-only' }, n + (n === 1 ? ' estrela: ' : ' estrelas: ') + ROTULOS[n]));
      rotulosEstrela.push(rotulo);
      return [radio, rotulo];
    });

    const corpo = h('div', { class: 'aval-corpo' },
      h('h2', { id: 'aval-titulo', class: 'aval-titulo', tabindex: '-1' }, 'Gostou do portal? 💡'),
      h('p', { class: 'aval-texto' }, 'Sua opinião ajuda a melhorar o Projeto Luz da Inclusão. É anônimo e leva só alguns segundos.'),
      h('fieldset', { class: 'aval-fieldset' },
        h('legend', { class: 'sr-only' }, 'Sua nota para o portal'),
        h('div', { class: 'aval-estrelas' }, estrelas)
      ),
      legenda,
      blocoComentario,
      isca,
      h('div', { class: 'aval-acoes' },
        botaoEnviar,
        h('button', { class: 'aval-link', type: 'button', onclick: function () { adiar(); } }, 'Agora não')
      ),
      h('button', { class: 'aval-link aval-link--pequeno', type: 'button', onclick: function () { recusar(); } }, 'Não quero avaliar'),
      status
    );

    function enviarNota() {
      if (!nota) return;
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = 'Enviando…';
      status.textContent = '';
      enviar({ tipo: 'portal', nota: nota, comentario: comentario.value, pagina: rotaAtual, site: isca.value, tempo: Date.now() - aberturaEm })
        .then(function () {
          gravar(CHAVE, { status: 'avaliado', em: Date.now() });
          if (botao) botao.hidden = true;
          const obrigado = h('div', { class: 'aval-corpo aval-obrigado', role: 'status' },
            h('p', { class: 'aval-titulo' }, 'Obrigado! 💛'),
            h('p', { class: 'aval-texto' }, 'Sua avaliação foi enviada e vai nos ajudar a melhorar.'));
          corpo.replaceWith(obrigado);
          setTimeout(function () { fechar(false); }, 3500);
        })
        .catch(function (r) {
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = 'Enviar avaliação';
          status.textContent = (r && r.message) || 'Não foi possível enviar agora. Tente de novo em alguns instantes.';
        });
    }

    return h('div', { class: 'aval-cartao', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'aval-titulo', hidden: true },
      h('button', { class: 'aval-fechar', type: 'button', onclick: function () { adiar(); } },
        L.icone('fechar'), h('span', { class: 'sr-only' }, 'Fechar')),
      corpo
    );
  }

  function teclas(e) {
    if (e.key === 'Escape' && aberto) { e.preventDefault(); adiar(); }
  }

  function abrir(manual) {
    if (aberto) return;
    if (cartao) cartao.remove();
    cartao = montarCartao();
    document.body.appendChild(cartao);
    cartao.hidden = false;
    aberto = true;
    document.addEventListener('keydown', teclas);
    if (botao) botao.hidden = true;
    
    if (manual) cartao.querySelector('#aval-titulo').focus();
  }

  function fechar(devolverFoco) {
    if (!aberto) return;
    cartao.hidden = true;
    aberto = false;
    document.removeEventListener('keydown', teclas);
    if (botao) {
      botao.hidden = jaAvaliou();
      if (devolverFoco && !botao.hidden) botao.focus();
    }
  }

  function adiar() {
    if (!jaAvaliou()) gravar(CHAVE, { status: 'adiado', ate: Date.now() + 7 * DIA });
    fechar(true);
  }

  function recusar() {
    gravar(CHAVE, { status: 'recusado', em: Date.now() });
    fechar(true);
  }

   
  function seguroParaConvidar() {
    if (document.body.classList.contains('travado')) return false;          
    const ativo = document.activeElement;
    if (ativo && /^(INPUT|TEXTAREA|SELECT)$/.test(ativo.tagName)) return false; 
    return true;
  }

  setInterval(function () {
    if (convidado || aberto || !podeConvidar()) return;
    const tempo = Date.now() - inicio;
    if (tempo >= 60000 || (paginas >= 3 && tempo >= 20000)) {
      if (!seguroParaConvidar()) return;
      convidado = true;
      abrir(false);
    }
  }, 5000);

   
  function inserirUtil(caminho) {
    if (!/^(entenda|na-pratica)\/[a-z0-9-]+$/.test(caminho)) return;
    const artigo = document.querySelector('.artigo');
    if (!artigo || artigo.querySelector('.util')) return;
    const chave = 'luz_util_' + caminho;
    if (ler(chave)) return;

    const criadoEm = Date.now();
    const status = h('p', { class: 'util__status', role: 'status', 'aria-live': 'polite' });
    const bloco = h('section', { class: 'util', 'aria-labelledby': 'util-titulo' });

    function agradecer() {
      gravar(chave, { em: Date.now() });
      bloco.replaceChildren(h('p', { class: 'util__obrigado', role: 'status' }, 'Obrigado pela sua resposta! 💛'));
    }

    function mandar(util, comentario) {
      enviar({ tipo: 'conteudo', pagina: caminho, util: util, comentario: comentario || '', tempo: Date.now() - criadoEm })
        .then(agradecer)
        .catch(function (r) { status.textContent = (r && r.message) || 'Não foi possível enviar agora.'; });
    }

    function pedirMelhoria() {
      const campo = h('textarea', { id: 'util-comentario', class: 'campo__controle', rows: 3, maxlength: 500 });
      bloco.replaceChildren(
        h('label', { for: 'util-comentario', class: 'util__titulo' }, 'O que podemos melhorar? ', h('span', { class: 'campo__opcional' }, '(opcional)')),
        campo,
        h('div', { class: 'util__botoes' },
          h('button', { class: 'botao botao--escuro-cheio', type: 'button', onclick: function () { mandar(false, campo.value); } }, 'Enviar'),
          h('button', { class: 'aval-link', type: 'button', onclick: function () { mandar(false, ''); } }, 'Pular')
        ),
        status
      );
      campo.focus();
    }

    bloco.append(
      h('h2', { id: 'util-titulo', class: 'util__titulo' }, 'Este conteúdo foi útil?'),
      h('div', { class: 'util__botoes' },
        h('button', { class: 'util__opcao', type: 'button', onclick: function () { mandar(true, ''); } }, h('span', { 'aria-hidden': 'true' }, '👍 '), 'Sim'),
        h('button', { class: 'util__opcao', type: 'button', onclick: pedirMelhoria }, h('span', { 'aria-hidden': 'true' }, '👎 '), 'Não')
      ),
      status
    );

    const aviso = artigo.querySelector('.aviso');
    if (aviso) artigo.insertBefore(bloco, aviso); else artigo.appendChild(bloco);
  }

  window.addEventListener('luz:rota', function (e) {
    const caminho = (e.detail && e.detail.caminho) || '';
    rotaAtual = caminho;
    if (caminho !== ultimaRota) { paginas++; ultimaRota = caminho; }
    inserirUtil(caminho);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', criarBotao);
  else criarBotao();
})(window.LUZ);

;
/* Acessibilidade */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;

  const CHAVE = 'luz_acessibilidade_v1';
  const NIVEIS = ['100%', '112%', '125%', '140%'];
  const PADRAO = { fonte: 0, contraste: false, daltonismo: false, espaco: false, semAnimacao: false, links: false, libras: false };
  const memoria = {};

  function ler() {
    try { return JSON.parse(window.localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { return memoria.p || {}; }
  }
  function salvar() {
    memoria.p = prefs;
    try { window.localStorage.setItem(CHAVE, JSON.stringify(prefs)); } catch (e) {   }
  }

  let prefs = Object.assign({}, PADRAO, ler());
  const raiz = document.documentElement;

  function aplicar() {
    raiz.classList.remove('a11y-fonte-1', 'a11y-fonte-2', 'a11y-fonte-3');
    if (prefs.fonte > 0) raiz.classList.add('a11y-fonte-' + prefs.fonte);
    raiz.classList.toggle('a11y-contraste', !!prefs.contraste);
    raiz.classList.toggle('a11y-daltonismo', !!prefs.daltonismo);
    raiz.classList.toggle('a11y-espaco', !!prefs.espaco);
    raiz.classList.toggle('a11y-sem-animacao', !!prefs.semAnimacao);
    raiz.classList.toggle('a11y-links', !!prefs.links);
    atualizarPainel();
  }

   
  const temVoz = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let lendo = false;

  function vozPortugues() {
    const vozes = window.speechSynthesis.getVoices();
    return vozes.filter(function (v) { return /^pt(-|_)BR/i.test(v.lang); })[0] ||
           vozes.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
  }

  function pararLeitura() {
    if (temVoz) window.speechSynthesis.cancel();
    lendo = false;
    atualizarPainel();
  }

  function lerPagina() {
    if (!temVoz) return;
    if (lendo) { pararLeitura(); return; }
    const principal = document.getElementById('conteudo');
    const texto = (principal ? principal.innerText : '').replace(/\s+/g, ' ').trim();
    if (!texto) return;
    window.speechSynthesis.cancel();
    
    const partes = texto.match(/[^.!?…]+[.!?…]*\s*/g) || [texto];
    const voz = vozPortugues();
    lendo = true;
    partes.forEach(function (frase, i) {
      const fala = new SpeechSynthesisUtterance(frase);
      fala.lang = 'pt-BR';
      if (voz) fala.voice = voz;
      fala.rate = 1;
      if (i === partes.length - 1) fala.onend = function () { lendo = false; atualizarPainel(); };
      window.speechSynthesis.speak(fala);
    });
    atualizarPainel();
  }

  window.addEventListener('luz:rota', function () { if (lendo) pararLeitura(); });

   
  let librasCarregado = false;

  function carregarLibras(mostrarStatus) {
    if (librasCarregado) { if (mostrarStatus) mostrarStatus('Tradutor de Libras ativado: toque no ícone azul de mãos na lateral da tela.'); return; }
    const caixa = document.createElement('div');
    caixa.setAttribute('vw', '');
    caixa.className = 'enabled';
    caixa.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(caixa);

    const s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = function () {
      try {
        const onloadAntes = window.onload;
        new window.VLibras.Widget('https://vlibras.gov.br/app');
        
        
        if (typeof window.onload === 'function' && window.onload !== onloadAntes) {
          window.onload(new Event('load'));
        } else {
          window.dispatchEvent(new Event('load'));
        }
        librasCarregado = true;
        if (mostrarStatus) mostrarStatus('Tradutor de Libras ativado: toque no ícone azul de mãos na lateral da tela.');
        conferirLibras(mostrarStatus);
      } catch (erro) {
        if (mostrarStatus) mostrarStatus('Não foi possível iniciar o tradutor de Libras agora.');
      }
    };
    s.onerror = function () {
      caixa.remove();
      if (mostrarStatus) mostrarStatus('Não foi possível carregar o tradutor de Libras agora. Tente de novo mais tarde.');
    };
    document.body.appendChild(s);
  }

   
  function conferirLibras(mostrarStatus) {
    if (!mostrarStatus) return;
    setTimeout(function () {
      const botaoLibras = document.querySelector('[vw-access-button]');
      const visivel = botaoLibras && botaoLibras.getBoundingClientRect().width > 0 && botaoLibras.children.length > 0;
      if (visivel || !prefs.libras) return;
      const caixa = refs.statusLibras;
      if (!caixa) return;
      caixa.replaceChildren(
        document.createTextNode('O tradutor está quase pronto. Se o ícone de mãos não apareceu, '),
        h('a', { href: 'https://pedrohenriquecrispim.github.io/luz-da-inclusao/', target: '_top' }, 'abra o portal de novo'),
        document.createTextNode(': ele já virá com o tradutor ligado.')
      );
    }, 4000);
  }

   
  let botao = null;
  let painel = null;
  let aberto = false;
  let refs = {};

  function alternar(chave) {
    return function () { prefs[chave] = !prefs[chave]; salvar(); aplicar(); };
  }

  function opcao(chave, rotulo, descricao) {
    const b = h('button', { class: 'a11y-opcao', type: 'button', 'aria-pressed': 'false', onclick: alternar(chave) },
      h('span', { class: 'a11y-opcao__texto' }, h('strong', null, rotulo), h('span', null, descricao)),
      h('span', { class: 'a11y-chave', 'aria-hidden': 'true' })
    );
    refs[chave] = b;
    return b;
  }

  function criar() {
    botao = h('button', {
      class: 'a11y-botao', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'a11y-painel',
      onclick: function () { aberto ? fechar(true) : abrir(); }
    },
      h('span', { 'aria-hidden': 'true', class: 'a11y-botao__icone' },
        svgAcessibilidade()),
      h('span', { class: 'sr-only' }, 'Acessibilidade'));

    const status = h('p', { class: 'a11y-status', role: 'status', 'aria-live': 'polite' });
    refs.statusLibras = status;
    const mostrarStatus = function (t) { status.textContent = t; };
    const nivel = h('span', { class: 'a11y-nivel', 'aria-live': 'polite' });
    refs.nivel = nivel;
    refs.menos = h('button', { class: 'a11y-tam', type: 'button', onclick: function () { prefs.fonte = Math.max(0, prefs.fonte - 1); salvar(); aplicar(); } },
      'A−', h('span', { class: 'sr-only' }, ' diminuir texto'));
    refs.mais = h('button', { class: 'a11y-tam', type: 'button', onclick: function () { prefs.fonte = Math.min(3, prefs.fonte + 1); salvar(); aplicar(); } },
      'A+', h('span', { class: 'sr-only' }, ' aumentar texto'));
    refs.ouvir = temVoz ? h('button', { class: 'botao botao--escuro-cheio a11y-acao', type: 'button', onclick: lerPagina }, 'Ouvir esta página') : null;
    refs.libras = h('button', {
      class: 'botao botao--escuro a11y-acao', type: 'button', 'aria-pressed': 'false',
      onclick: function () {
        prefs.libras = !prefs.libras;
        salvar();
        if (prefs.libras) {
          raiz.classList.remove('a11y-sem-libras');
          carregarLibras(mostrarStatus);
        } else {
          raiz.classList.add('a11y-sem-libras');
          mostrarStatus('Tradutor de Libras desativado.');
        }
        atualizarPainel();
      }
    }, 'Tradutor de Libras (VLibras)');

    painel = h('div', { class: 'a11y-painel', id: 'a11y-painel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'a11y-titulo', hidden: true },
      h('div', { class: 'a11y-topo' },
        h('h2', { id: 'a11y-titulo', class: 'a11y-titulo', tabindex: '-1' }, 'Acessibilidade'),
        h('button', { class: 'aval-fechar', type: 'button', onclick: function () { fechar(true); } }, L.icone('fechar'), h('span', { class: 'sr-only' }, 'Fechar'))
      ),
      h('div', { class: 'a11y-grupo' },
        h('p', { class: 'a11y-rotulo' }, 'Tamanho do texto'),
        h('div', { class: 'a11y-tamanho' }, refs.menos, nivel, refs.mais)
      ),
      opcao('contraste', 'Alto contraste', 'Cores mais fortes, preto e branco.'),
      opcao('daltonismo', 'Cores para daltonismo', 'Troca vermelho e verde por cores fáceis de diferenciar.'),
      opcao('espaco', 'Mais espaçamento', 'Letras e linhas mais afastadas, ajuda na leitura.'),
      opcao('semAnimacao', 'Pausar animações', 'Remove movimentos e efeitos da tela.'),
      opcao('links', 'Destacar links', 'Sublinha e realça tudo o que é clicável.'),
      h('div', { class: 'a11y-acoes' }, refs.ouvir, refs.libras),
      status,
      h('button', {
        class: 'aval-link', type: 'button',
        onclick: function () {
          prefs = Object.assign({}, PADRAO);
          salvar();
          raiz.classList.add('a11y-sem-libras');
          aplicar();
          mostrarStatus('Configurações restauradas.');
        }
      }, 'Restaurar padrão')
    );

    document.body.appendChild(botao);
    document.body.appendChild(painel);
    aplicar();
    if (prefs.libras) carregarLibras(null);
  }

  function svgAcessibilidade() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', '26');
    s.setAttribute('height', '26');
    s.setAttribute('focusable', 'false');
    s.innerHTML = '<circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="12" cy="6.6" r="1.6" fill="currentColor"/>' +
      '<path d="M6.5 9.4l5.5 1.2 5.5-1.2M12 10.6v3.6l-2.6 4.6M12 14.2l2.6 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    return s;
  }

  function atualizarPainel() {
    if (!painel) return;
    refs.nivel.textContent = NIVEIS[prefs.fonte];
    refs.menos.disabled = prefs.fonte === 0;
    refs.mais.disabled = prefs.fonte === 3;
    ['contraste', 'daltonismo', 'espaco', 'semAnimacao', 'links'].forEach(function (k) {
      refs[k].setAttribute('aria-pressed', prefs[k] ? 'true' : 'false');
    });
    if (refs.ouvir) refs.ouvir.textContent = lendo ? 'Parar leitura' : 'Ouvir esta página';
    refs.libras.textContent = prefs.libras ? 'Desativar tradutor de Libras' : 'Tradutor de Libras (VLibras)';
    refs.libras.setAttribute('aria-pressed', prefs.libras ? 'true' : 'false');
  }

  function teclas(e) {
    if (e.key === 'Escape' && aberto) { e.preventDefault(); fechar(true); }
  }

  function abrir() {
    painel.hidden = false;
    aberto = true;
    botao.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', teclas);
    painel.querySelector('#a11y-titulo').focus();
  }

  function fechar(devolverFoco) {
    painel.hidden = true;
    aberto = false;
    botao.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', teclas);
    if (devolverFoco) botao.focus();
  }

  
  aplicar();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', criar);
  else criar();
})(window.LUZ);

;
/* Cuidado */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;

  const TERMOS = [
    'suicid', 'me matar', 'se matar', 'quero morrer', 'queria morrer', 'vontade de morrer',
    'quer morrer', 'pensando em morrer', 'penso em morrer', 'desejo de morrer', 'prefiro morrer',
    'tirar minha vida', 'tirar a minha vida', 'tirar a propria vida', 'tirar sua vida', 'tirar a vida dele', 'tirar a vida dela',
    'acabar com a minha vida', 'acabar com minha vida', 'acabar com tudo', 'nao quero mais viver', 'nao quero viver',
    'sem vontade de viver', 'nao aguento mais viver', 'melhor sem mim', 'sumir para sempre', 'desaparecer para sempre',
    'automutil', 'auto mutil', 'autolesao', 'auto lesao', 'autoagress', 'me cortar', 'me corto', 'me cortei',
    'se cortar', 'se corta ', 'cortar os pulsos', 'cortar o pulso', 'cortar meus pulsos', 'me machucar de proposito',
    'me ferir', 'me enforcar', 'overdose', 'tomar todos os remedios', 'pular da ponte', 'pular do predio',
    'me jogar da', 'me jogar de', 'me jogar na frente'
  ];

  function ehCrise(texto) {
    const t = ' ' + L.normalizar(texto).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    return TERMOS.some(function (termo) { return t.indexOf(termo) > -1; });
  }

   
  function cartaoAcolhimento(opcoes) {
    const compacto = opcoes && opcoes.compacto;
    return h('section', { class: 'acolhe' + (compacto ? ' acolhe--compacto' : ''), role: 'note', 'aria-labelledby': 'acolhe-titulo' },
      h('div', { class: 'acolhe__icone', 'aria-hidden': 'true' }, L.icone('coracao')),
      h('div', { class: 'acolhe__corpo' },
        h('h2', { id: 'acolhe-titulo', class: 'acolhe__titulo' }, 'Você não precisa passar por isso sem ajuda.'),
        h('p', null, 'Se você, ou alguém perto de você, está pensando em se machucar ou em tirar a própria vida, converse agora com alguém preparado para ouvir.'),
        h('ul', { class: 'acolhe__lista' },
          h('li', null, h('strong', null, 'CVV – Centro de Valorização da Vida: '), 'ligue ', h('a', { href: 'tel:188', class: 'acolhe__tel' }, '188'), '. A ligação é gratuita e funciona 24 horas, todos os dias.'),
          h('li', null, 'Também dá para conversar por chat em ', L.ancora('https://cvv.org.br', { class: 'acolhe__link' }, 'cvv.org.br'), '.'),
          h('li', null, h('strong', null, 'Em perigo imediato: '), 'ligue ', h('a', { href: 'tel:192', class: 'acolhe__tel' }, '192'), ' (SAMU) ou vá a um pronto-socorro.')
        ),
        h('p', { class: 'acolhe__fe' }, 'Sua vida tem valor. Deus ama você, e você importa para as pessoas ao seu redor. Pedir ajuda é um passo de coragem. 💛')
      )
    );
  }

  L.ehCrise = ehCrise;
  L.cartaoAcolhimento = cartaoAcolhimento;
})(window.LUZ);

;
/* Compartilhar */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;

  const W = 1080;
  const H = 1920;
  const MX = 100;
  const TOPO = 260;          
  const BASE = 1660;         
  const RODAPE = 150;
  const FONTE_TITULO = '"Bricolage Grotesque", "Trebuchet MS", system-ui, sans-serif';
  const FONTE_TEXTO = '"Atkinson Hyperlegible", Arial, system-ui, sans-serif';
  const LAMPADA = new Path2D('M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z');

  let palavraQuebrada = false;
  let modal = null;
  let focoAnterior = null;
  let urlAtual = '';

   
  function paleta() {
    const st = getComputedStyle(document.documentElement);
    const v = function (nome, padrao) { const x = (st.getPropertyValue('--' + nome) || '').trim(); return /^#[0-9a-f]{3,8}$/i.test(x) ? x : padrao; };
    return {
      azul: v('azul', '#2448B8'), noite: v('noite', '#0F1B4C'), amarelo: v('amarelo', '#FFC83D'),
      vermelho: v('vermelho', '#E04A3F'), verde: v('verde', '#2E9A6B'), laranja: v('laranja', '#F28A2E'),
      creme: v('creme', '#FAF5EA'), tinta: v('tinta', '#121633')
    };
  }

   
  function quebrar(ctx, texto, largura) {
    const linhas = [];
    String(texto || '').split('\n').forEach(function (paragrafo) {
      let atual = '';
      paragrafo.split(/\s+/).filter(Boolean).forEach(function (palavra) {
        const teste = atual ? atual + ' ' + palavra : palavra;
        if (ctx.measureText(teste).width <= largura) { atual = teste; return; }
        if (atual) linhas.push(atual);
        
        if (ctx.measureText(palavra).width > largura) palavraQuebrada = true;
        while (ctx.measureText(palavra).width > largura && palavra.length > 1) {
          let i = palavra.length - 1;
          while (i > 1 && ctx.measureText(palavra.slice(0, i) + '-').width > largura) i--;
          linhas.push(palavra.slice(0, i) + '-');
          palavra = palavra.slice(i);
        }
        atual = palavra;
      });
      if (atual) linhas.push(atual);
    });
    return linhas;
  }

  function cortar(ctx, linhas, max, largura) {
    if (linhas.length <= max) return linhas;
    const saida = linhas.slice(0, max);
    let ultima = saida[max - 1];
    while (ultima.length > 1 && ctx.measureText(ultima + '…').width > largura) ultima = ultima.slice(0, -1);
    saida[max - 1] = ultima.replace(/[\s,.;:]+$/, '') + '…';
    return saida;
  }

   
  function blocos(ctx, c, k, cor) {
    const largura = W - MX * 2;
    const lista = [];
    function add(texto, peso, familia, tamanho, corTexto, op) {
      op = op || {};
      if (!texto) return;
      const t = Math.round(tamanho * k);
      ctx.font = peso + ' ' + t + 'px ' + familia;
      const recuo = op.marcador ? Math.round(56 * k) : 0;
      let linhas = quebrar(ctx, texto, largura - recuo);
      if (op.max) linhas = cortar(ctx, linhas, op.max, largura - recuo);
      lista.push({ fonte: ctx.font, linhas: linhas, alt: Math.round(t * (op.lh || 1.22)), cor: corTexto, depois: Math.round((op.depois === undefined ? 36 : op.depois) * k), recuo: recuo, marcador: op.marcador, corMarcador: cor, tamanho: t, traco: op.traco });
    }
    if (c.pre) add(c.pre, '700', FONTE_TEXTO, 44, c.paleta.amarelo, { depois: 22, max: 2 });
    if (c.destaque) add(c.destaque, '800', FONTE_TITULO, 250, c.paleta.amarelo, { lh: 1, depois: 10, max: 1 });
    if (c.citacao) add('“' + c.citacao + '”', '700', FONTE_TITULO, 76, c.paleta.creme, { lh: 1.18, depois: 34, max: 9 });
    if (c.titulo) add(c.titulo, '800', FONTE_TITULO, c.destaque ? 72 : 104, c.paleta.creme, { lh: 1.08, depois: 26, max: 5 });
    if (c.subtitulo) add(c.subtitulo, '400', FONTE_TEXTO, 42, 'rgba(250,245,234,0.78)', { depois: 30, max: 3 });
    if (c.referencia) add('— ' + c.referencia, '700', FONTE_TEXTO, 46, c.paleta.amarelo, { depois: 30, max: 2 });
    if (c.texto || (c.linhas && c.linhas.length)) lista.push({ divisor: true, alt: Math.round(10 * k), depois: Math.round(44 * k) });
    if (c.texto) add(c.texto, '400', FONTE_TEXTO, 50, c.paleta.creme, { lh: 1.36, depois: 0, max: 10 });
    (c.linhas || []).slice(0, 5).forEach(function (linha, i, arr) {
      add(linha, '400', FONTE_TEXTO, 48, c.paleta.creme, { lh: 1.32, depois: i === arr.length - 1 ? 0 : 28, marcador: true, max: 4 });
    });
    return lista;
  }

  function alturaTotal(lista) {
    return lista.reduce(function (s, b) { return s + (b.divisor ? b.alt : b.linhas.length * b.alt) + b.depois; }, 0);
  }

  function retanguloArredondado(ctx, x, y, w, alt, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + alt, r);
    ctx.arcTo(x + w, y + alt, x, y + alt, r);
    ctx.arcTo(x, y + alt, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

   
  function desenhar(dados) {
    const p = paleta();
    const cor = p[dados.cor] || p.azul;
    const c = Object.assign({}, dados, { paleta: p });
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    
    ctx.fillStyle = p.noite;
    ctx.fillRect(0, 0, W, H);
    const brilho = ctx.createRadialGradient(W - 140, 300, 40, W - 140, 300, 820);
    brilho.addColorStop(0, 'rgba(255,200,61,0.30)');
    brilho.addColorStop(1, 'rgba(255,200,61,0)');
    ctx.fillStyle = brilho;
    ctx.fillRect(0, 0, W, H);
    const brilho2 = ctx.createRadialGradient(80, H - 240, 20, 80, H - 240, 700);
    brilho2.addColorStop(0, 'rgba(36,72,184,0.45)');
    brilho2.addColorStop(1, 'rgba(36,72,184,0)');
    ctx.fillStyle = brilho2;
    ctx.fillRect(0, 0, W, H);

    
    const faixa = [p.azul, p.amarelo, p.vermelho, p.verde, p.laranja];
    faixa.forEach(function (f, i) {
      ctx.fillStyle = f;
      ctx.fillRect(i * W / 5, 0, W / 5 + 1, 16);
      ctx.fillRect(i * W / 5, H - 16, W / 5 + 1, 16);
    });

    
    ctx.font = '700 38px ' + FONTE_TEXTO;
    const etiqueta = String(dados.etiqueta || 'Projeto Luz da Inclusão');
    const larguraEtiqueta = Math.min(W - MX * 2, ctx.measureText(etiqueta).width + 64);
    ctx.fillStyle = cor;
    retanguloArredondado(ctx, MX, TOPO, larguraEtiqueta, 76, 38);
    ctx.fill();
    ctx.fillStyle = cor === p.amarelo ? p.tinta : '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(etiqueta, MX + 32, TOPO + 40, larguraEtiqueta - 64);
    ctx.textBaseline = 'alphabetic';

    
    const inicio = TOPO + 76 + 70;
    const disponivel = BASE - RODAPE - 60 - inicio;
    let k = 1;
    
    const realce = cor === p.azul ? p.amarelo : cor;
    
    palavraQuebrada = false;
    let lista = blocos(ctx, c, k, realce);
    while ((alturaTotal(lista) > disponivel || palavraQuebrada) && k > 0.56) {
      k -= 0.06;
      palavraQuebrada = false;
      lista = blocos(ctx, c, k, realce);
    }
    let y = inicio + Math.max(0, (disponivel - alturaTotal(lista)) * 0.42);
    lista.forEach(function (b) {
      if (b.divisor) {
        ctx.fillStyle = realce;
        retanguloArredondado(ctx, MX, y, 140, b.alt, b.alt / 2);
        ctx.fill();
        y += b.alt + b.depois;
        return;
      }
      ctx.font = b.fonte;
      ctx.fillStyle = b.cor;
      b.linhas.forEach(function (linha, i) {
        const base = y + b.alt * 0.82;
        if (b.marcador && i === 0) {
          ctx.save();
          ctx.fillStyle = b.corMarcador;
          ctx.beginPath();
          ctx.arc(MX + 14, base - b.tamanho * 0.32, Math.max(8, b.tamanho * 0.2), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillText(linha, MX + b.recuo, base);
        y += b.alt;
      });
      y += b.depois;
    });

    
    const cfg = L.config() || {};
    const yR = BASE - RODAPE + 20;
    ctx.save();
    ctx.translate(MX - 6, yR - 4);
    ctx.scale(4.4, 4.4);
    ctx.fillStyle = 'rgba(255,200,61,0.25)';
    ctx.fill(LAMPADA);
    ctx.strokeStyle = p.amarelo;
    ctx.lineWidth = 1.9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(LAMPADA);
    ctx.restore();
    ctx.fillStyle = p.creme;
    ctx.font = '800 48px ' + FONTE_TITULO;
    ctx.fillText(cfg.NOME_PROJETO || 'Projeto Luz da Inclusão', MX + 120, yR + 46, W - MX * 2 - 120);
    ctx.fillStyle = 'rgba(250,245,234,0.78)';
    ctx.font = '400 34px ' + FONTE_TEXTO;
    const usuario = String(cfg.INSTAGRAM_USUARIO || '').replace(/^@/, '');
    ctx.fillText(dados.chamada || (usuario ? 'Mais no link da bio: @' + usuario : 'Informação, acolhimento e fé'), MX + 120, yR + 96, W - MX * 2 - 120);

    return canvas;
  }

   
  function carregarFontes() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 100px "Bricolage Grotesque"'),
      document.fonts.load('700 40px "Bricolage Grotesque"'),
      document.fonts.load('400 40px "Atkinson Hyperlegible"'),
      document.fonts.load('700 40px "Atkinson Hyperlegible"')
    ]).catch(function () {   });
  }

   
  function criarModal() {
    const img = h('img', { class: 'cartao-img__previa', alt: '' });
    const estado = h('p', { class: 'cartao-img__estado', role: 'status', 'aria-live': 'polite' });
    const btnCompartilhar = h('button', { class: 'botao botao--luz', type: 'button', hidden: true }, 'Compartilhar');
    const linkBaixar = h('a', { class: 'botao botao--escuro-cheio', href: '#', download: 'luz-da-inclusao.png' }, 'Baixar imagem');
    const dica = h('p', { class: 'cartao-img__dica' },
      h('strong', null, 'Não baixou? '),
      'No celular, toque e segure a imagem e escolha “Salvar imagem” (ou “Adicionar às Fotos”). No computador, clique com o botão direito e escolha “Salvar imagem como”.');
    const fechar = h('button', { class: 'cartao-img__fechar', type: 'button', onclick: fecharModal }, L.icone('fechar'), h('span', { class: 'sr-only' }, 'Fechar'));

    linkBaixar.addEventListener('click', function () {
      setTimeout(function () { dica.classList.add('cartao-img__dica--destaque'); }, 1200);
    });

    const painel = h('div', { class: 'cartao-img__painel' },
      h('div', { class: 'cartao-img__topo' },
        h('h2', { id: 'cartao-img-titulo', class: 'cartao-img__titulo' }, 'Imagem para compartilhar'),
        fechar),
      h('p', { class: 'cartao-img__texto' }, 'Pronta para os stories (1080 × 1920). Use do jeito que preferir:'),
      h('div', { class: 'cartao-img__moldura' }, img),
      estado,
      h('div', { class: 'cartao-img__acoes' }, btnCompartilhar, linkBaixar),
      dica
    );
    const raiz = h('div', { class: 'cartao-img', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cartao-img-titulo' },
      h('div', { class: 'cartao-img__fundo', onclick: fecharModal }),
      painel);
    document.body.appendChild(raiz);
    modal = { raiz: raiz, img: img, estado: estado, btnCompartilhar: btnCompartilhar, linkBaixar: linkBaixar, dica: dica, painel: painel, fechar: fechar };
    return modal;
  }

  function teclas(e) {
    if (!modal || modal.raiz.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); fecharModal(); return; }
    if (e.key !== 'Tab') return;
    const focaveis = Array.prototype.slice.call(modal.painel.querySelectorAll('button:not([hidden]), a[href]'));
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }

  function fecharModal() {
    if (!modal || modal.raiz.hidden) return;
    modal.raiz.hidden = true;
    document.body.classList.remove('travado');
    document.removeEventListener('keydown', teclas);
    modal.img.removeAttribute('src');
    if (urlAtual) { try { URL.revokeObjectURL(urlAtual); } catch (erro) {   } urlAtual = ''; }
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

   
  function compartilharImagem(dados) {
    const m = modal || criarModal();
    focoAnterior = document.activeElement;
    m.raiz.hidden = false;
    document.body.classList.add('travado');
    document.addEventListener('keydown', teclas);
    m.dica.classList.remove('cartao-img__dica--destaque');
    m.btnCompartilhar.hidden = true;
    m.linkBaixar.setAttribute('aria-disabled', 'true');
    m.estado.textContent = 'Preparando a imagem…';
    m.fechar.focus();

    const nome = 'luz-da-inclusao-' + (L.slug(dados.nomeArquivo || dados.titulo || 'cartao').slice(0, 50) || 'cartao') + '.png';

    carregarFontes().then(function () {
      const canvas = desenhar(dados);
      const dataUrl = canvas.toDataURL('image/png');
      m.img.src = dataUrl;
      m.img.alt = 'Cartão para stories: ' + [dados.etiqueta, dados.destaque, dados.citacao, dados.titulo, dados.referencia].filter(Boolean).join(' · ');
      m.linkBaixar.href = dataUrl;
      m.linkBaixar.setAttribute('download', nome);
      m.linkBaixar.removeAttribute('aria-disabled');
      m.estado.textContent = 'Imagem pronta.';

      canvas.toBlob(function (blob) {
        if (!blob || typeof File === 'undefined' || !navigator.canShare) return;
        let arquivo;
        try { arquivo = new File([blob], nome, { type: 'image/png' }); } catch (erro) { return; }
        let pode = false;
        try { pode = navigator.canShare({ files: [arquivo] }); } catch (erro) { pode = false; }
        if (!pode) return;
        m.btnCompartilhar.hidden = false;
        m.btnCompartilhar.onclick = function () {
          navigator.share({ files: [arquivo], title: dados.titulo || 'Projeto Luz da Inclusão' }).catch(function (erro) {
            if (erro && erro.name === 'AbortError') return;
            m.btnCompartilhar.hidden = true;
            m.dica.classList.add('cartao-img__dica--destaque');
            m.estado.textContent = 'O compartilhamento direto não está disponível aqui. Use “Baixar imagem” ou toque e segure a imagem.';
          });
        };
      }, 'image/png');
    }).catch(function () {
      m.estado.textContent = 'Não foi possível gerar a imagem neste navegador.';
    });
  }

   
  function botaoImagem(obterDados, rotulo, classeExtra) {
    if (!window.HTMLCanvasElement) return null;
    const ico = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ico.setAttribute('viewBox', '0 0 24 24');
    ico.setAttribute('aria-hidden', 'true');
    ico.setAttribute('class', 'img-btn__ico');
    ico.innerHTML = '<rect x="5" y="2.5" width="14" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 15l2.5-3 2 2.2 1.5-1.7 2 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="10" cy="8" r="1.4" fill="currentColor"/>';
    return h('button', {
      class: 'img-btn' + (classeExtra ? ' ' + classeExtra : ''), type: 'button',
      onclick: function () { compartilharImagem(obterDados()); }
    }, ico, rotulo || 'Imagem para stories');
  }

  L.compartilharImagem = compartilharImagem;
  L.botaoImagem = botaoImagem;
})(window.LUZ);

;
/* Checklist */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const CORES = ['azul', 'verde', 'laranja', 'vermelho', 'amarelo', 'azul'];

  const NIVEIS = [
    { ate: 24, titulo: 'Começando a caminhada', texto: 'Todo caminho começa com um passo. Escolha um dos próximos passos abaixo e comece por ele: pequenas atitudes já fazem muita diferença.' },
    { ate: 49, titulo: 'Primeiros passos dados', texto: 'A sua igreja já começou a abrir portas. Os próximos passos abaixo ajudam a transformar boa vontade em prática.' },
    { ate: 74, titulo: 'No caminho da inclusão', texto: 'Muita coisa já faz parte da rotina da sua igreja. Agora é hora de cuidar dos pontos que ainda ficaram em branco.' },
    { ate: 99, titulo: 'Caminhando bem', texto: 'A sua igreja já acolhe de muitas formas. Os detalhes que faltam podem fazer toda a diferença para alguém.' },
    { ate: 100, titulo: 'Igreja que acolhe', texto: 'Que alegria! Continue ouvindo as famílias e refaça este checklist pelo menos uma vez por ano.' }
  ];

  function nivelDe(pct) {
    for (let i = 0; i < NIVEIS.length; i++) if (pct <= NIVEIS[i].ate) return NIVEIS[i];
    return NIVEIS[NIVEIS.length - 1];
  }

  function anel(pct) {
    const r = 52;
    const circ = 2 * Math.PI * r;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 120 120');
    s.setAttribute('class', 'ck-anel');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<circle cx="60" cy="60" r="52" class="ck-anel__trilho"/>' +
      '<circle cx="60" cy="60" r="52" class="ck-anel__valor" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' +
      (circ * (1 - Math.max(0, Math.min(100, Number(pct) || 0)) / 100)).toFixed(1) + '" transform="rotate(-90 60 60)"/>';
    return s;
  }

  function viewChecklist() {
    const p = L.pagina('checklist');
    return L.api('getChecklist').then(function (dados) {
      const blocos = dados.blocos || [];
      const marcados = {};
      let total = 0;
      blocos.forEach(function (b) { total += b.itens.length; });

      const trilha = [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: 'Inclusão na prática', rota: 'na-pratica' },
        { rotulo: 'Na igreja', rota: 'na-pratica/na-igreja' }, { rotulo: 'Checklist' }];

      if (!total) {
        return L.frag(
          L.topoPagina({ trilha: trilha, titulo: 'Minha igreja é inclusiva?' }),
          L.estado({ titulo: 'O checklist está sendo preparado.', acao: dados.pdf ? L.botao('Baixar o checklist em PDF', dados.pdf, 'escuro') : null })
        );
      }

      const contadorTopo = h('p', { class: 'ck-progresso__texto', 'aria-live': 'polite' });
      const barraTopo = h('span', { class: 'ck-progresso__barra' });
      const contadoresBloco = {};
      const resultado = h('section', { class: 'ck-resultado', id: 'ck-resultado', hidden: true, tabindex: '-1', 'aria-labelledby': 'ck-resultado-titulo' });

      function contar() {
        let feitos = 0;
        blocos.forEach(function (b) {
          const n = b.itens.filter(function (i) { return marcados[i.id]; }).length;
          feitos += n;
          contadoresBloco[b.id].textContent = n + ' de ' + b.itens.length;
        });
        contadorTopo.textContent = feitos + ' de ' + total + ' marcados';
        barraTopo.style.transform = 'scaleX(' + (feitos / total).toFixed(3) + ')';
        return feitos;
      }

      const formularios = blocos.map(function (b, bi) {
        contadoresBloco[b.id] = h('span', { class: 'ck-bloco__contador' });
        return h('fieldset', { class: 'ck-bloco c-' + CORES[bi % CORES.length] },
          h('legend', { class: 'ck-bloco__titulo' }, h('span', null, b.bloco), contadoresBloco[b.id]),
          h('ul', { class: 'ck-lista' }, b.itens.map(function (item) {
            const idCampo = 'ck-' + item.id;
            const caixa = h('input', { type: 'checkbox', id: idCampo, class: 'ck-item__caixa' });
            caixa.addEventListener('change', function () {
              marcados[item.id] = caixa.checked;
              contar();
              if (!resultado.hidden) mostrarResultado(false);
            });
            return h('li', { class: 'ck-item' },
              caixa,
              h('label', { for: idCampo, class: 'ck-item__rotulo' },
                h('span', { class: 'ck-item__marca', 'aria-hidden': 'true' }),
                h('span', { class: 'ck-item__texto' }, item.texto)));
          }))
        );
      });

      function limpar() {
        Object.keys(marcados).forEach(function (k) { delete marcados[k]; });
        document.querySelectorAll('.ck-item__caixa').forEach(function (c) { c.checked = false; });
        resultado.hidden = true;
        contar();
        const primeiro = document.querySelector('.ck-item__caixa');
        if (primeiro) primeiro.focus();
      }

      function mostrarResultado(focar) {
        const feitos = contar();
        const pct = Math.round(feitos * 100 / total);
        const nivel = nivelDe(pct);

        const porBloco = blocos.map(function (b, bi) {
          const n = b.itens.filter(function (i) { return marcados[i.id]; }).length;
          return { b: b, n: n, pct: Math.round(n * 100 / b.itens.length), cor: CORES[bi % CORES.length] };
        });

        
        const passos = [];
        porBloco.slice().sort(function (a, b) { return a.pct - b.pct; }).forEach(function (x) {
          x.b.itens.forEach(function (i) { if (!marcados[i.id]) passos.push({ item: i, bloco: x.b.bloco, cor: x.cor }); });
        });

        resultado.replaceChildren(
          h('div', { class: 'ck-resultado__topo escuro' },
            h('div', { class: 'ck-resultado__anel' }, anel(pct), h('span', { class: 'ck-resultado__pct' }, pct + '%')),
            h('div', { class: 'ck-resultado__texto' },
              h('p', { class: 'ck-resultado__pre' }, 'Em que ponto do caminho a sua igreja está?'),
              h('h2', { id: 'ck-resultado-titulo', class: 'ck-resultado__titulo' }, nivel.titulo),
              h('p', null, feitos + ' de ' + total + ' práticas de inclusão já fazem parte da sua igreja. ' + nivel.texto))
          ),
          h('div', { class: 'ck-resultado__corpo' },
            h('h3', { class: 'ck-resultado__sub' }, 'Por área'),
            h('ul', { class: 'ck-areas' }, porBloco.map(function (x) {
              return h('li', { class: 'ck-area c-' + x.cor },
                h('span', { class: 'ck-area__nome' }, x.b.bloco),
                h('span', { class: 'ck-area__trilho', 'aria-hidden': 'true' }, h('span', { class: 'ck-area__barra', style: 'width:' + x.pct + '%' })),
                h('span', { class: 'ck-area__valor' }, x.n + ' de ' + x.b.itens.length));
            })),
            passos.length ? h('h3', { class: 'ck-resultado__sub' }, 'Próximos passos') : null,
            passos.length ? h('ol', { class: 'ck-passos' }, passos.slice(0, 6).map(function (x) {
              return h('li', { class: 'ck-passo c-' + x.cor },
                h('p', { class: 'ck-passo__area' }, x.bloco),
                h('p', { class: 'ck-passo__item' }, x.item.texto),
                x.item.dica ? h('p', { class: 'ck-passo__dica' }, x.item.dica) : null,
                x.item.link ? L.ancora(x.item.link, { class: 'ck-passo__link' }, 'Saiba mais') : null);
            })) : null,
            passos.length > 6 ? h('p', { class: 'ck-resultado__nota' }, 'E mais ' + (passos.length - 6) + ' ponto(s) para depois. Um passo de cada vez. 💡') : null,
            h('p', { class: 'ck-resultado__nota' }, 'Este resultado não é uma nota: é um retrato de onde vocês estão hoje no caminho.'),
            h('div', { class: 'ck-resultado__acoes' },
              L.botaoImagem ? L.botaoImagem(function () {
                return {
                  etiqueta: 'Minha igreja é inclusiva?', destaque: pct + '%', titulo: nivel.titulo,
                  texto: feitos + ' de ' + total + ' práticas de inclusão já fazem parte da nossa igreja. Em que ponto do caminho a sua está?',
                  cor: 'verde', nomeArquivo: 'checklist-igreja', chamada: 'Faça o checklist no portal: link na bio'
                };
              }, 'Salvar resultado como imagem') : null,
              dados.pdf ? L.ancora(dados.pdf, { class: 'botao botao--escuro' }, 'Baixar o checklist em PDF') : null,
              h('button', { class: 'botao botao--escuro', type: 'button', onclick: limpar }, 'Recomeçar')
            )
          )
        );
        resultado.hidden = false;
        if (focar) {
          resultado.scrollIntoView({ block: 'start' });
          resultado.focus({ preventScroll: true });
        }
      }

      const vista = L.frag(
        L.topoPagina({ trilha: trilha, titulo: 'Minha igreja é inclusiva?', resumo: p.resumo }),
        h('div', { class: 'container ck' },
          h('div', { class: 'ck-intro' },
            h('p', { class: 'ck-intro__texto' }, 'Marque o que a sua igreja já faz. O que ficar em branco vira o próximo passo.'),
            h('p', { class: 'ck-privado' }, L.icone('info', 'ck-privado__icone'),
              'Suas respostas ficam só nesta página: nada é enviado nem guardado. Se fechar ou recarregar, o checklist recomeça.')
          ),
          h('div', { class: 'ck-progresso' },
            contadorTopo,
            h('span', { class: 'ck-progresso__trilho', 'aria-hidden': 'true' }, barraTopo)
          ),
          h('form', { class: 'ck-form', onsubmit: function (e) { e.preventDefault(); mostrarResultado(true); } },
            formularios,
            h('div', { class: 'ck-acoes' },
              h('button', { class: 'botao botao--luz', type: 'submit' }, 'Ver meu resultado'),
              h('button', { class: 'botao botao--escuro', type: 'button', onclick: limpar }, 'Limpar marcações'),
              dados.pdf ? L.ancora(dados.pdf, { class: 'botao botao--link ck-acoes__pdf' }, 'Prefere imprimir? Baixe o PDF') : null
            )
          ),
          resultado
        )
      );
      contar();
      return vista;
    });
  }

   
  function chamadaChecklist() {
    return h('aside', { class: 'ck-chamada escuro', 'aria-labelledby': 'ck-chamada-titulo' },
      h('div', { class: 'ck-chamada__texto' },
        h('h2', { id: 'ck-chamada-titulo', class: 'ck-chamada__titulo' }, 'Sua igreja está no caminho da inclusão?'),
        h('p', null, 'Faça o checklist interativo em poucos minutos e descubra os próximos passos. Nada do que você marcar é guardado.')),
      L.botao('Fazer o checklist', '#/checklist', 'luz')
    );
  }

  L.registrarView('checklist', function () { return viewChecklist(); });
  L.chamadaChecklist = chamadaChecklist;
})(window.LUZ);

;
/* Privacidade */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const ATUALIZADO = 'outubro de 2026';

  function bloco(titulo, paragrafos) {
    return h('section', { class: 'priv__bloco' },
      h('h2', { class: 'priv__titulo' }, titulo),
      paragrafos.map(function (p) { return Array.isArray(p) ? h('ul', { class: 'priv__lista' }, p.map(function (i) { return h('li', null, i); })) : h('p', null, p); }));
  }

  function viewPrivacidade() {
    const p = L.pagina('privacidade');
    const c = L.config();
    const assistente = c.ASSISTENTE_DISPONIVEL === 'SIM';
    const contato = c.EMAIL
      ? h('p', null, 'Dúvidas ou pedidos sobre seus dados: escreva para ', h('a', { href: 'mailto:' + c.EMAIL }, c.EMAIL),
          c.INSTAGRAM_URL ? ' ou fale com a gente pelo Instagram.' : '.')
      : c.INSTAGRAM_URL ? h('p', null, 'Dúvidas ou pedidos sobre seus dados: fale com a gente pelo ', L.ancora(c.INSTAGRAM_URL, null, 'Instagram'), '.') : null;

    const direitos = bloco('Seus direitos', [
      'Pela Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018), você pode pedir para saber, corrigir ou apagar os dados pessoais que enviou pelo formulário de palestra.'
    ]);
    if (contato) direitos.appendChild(contato);

    return L.frag(
      L.topoPagina({ trilha: [{ rotulo: 'Início', rota: 'inicio' }, { rotulo: p.rotulo }], titulo: 'Privacidade', resumo: p.resumo }),
      h('div', { class: 'container priv' },
        h('div', { class: 'priv__resumo' },
          h('h2', { class: 'priv__titulo' }, 'Em resumo'),
          h('ul', { class: 'priv__lista priv__lista--check' },
            h('li', null, 'Não usamos cookies, anúncios nem ferramentas de rastreamento.'),
            h('li', null, 'Não pedimos cadastro e não sabemos quem você é.'),
            h('li', null, 'Contamos as visitas de forma anônima, só para saber quais conteúdos ajudam mais.'),
            h('li', null, 'Nunca vendemos nem repassamos dados.'))),
        bloco('Visitas às páginas', [
          'Contamos quantas vezes cada página foi aberta em cada dia. Só isso: não registramos quem visitou, de onde, em que horário exato, nem guardamos qualquer identificador do seu aparelho.'
        ]),
        bloco('Buscas sem resultado', [
          'Quando uma busca não encontra nada, guardamos só o texto pesquisado e o dia, para descobrir quais conteúdos ainda faltam no portal. Esses registros são apagados automaticamente depois de 90 dias.',
          'Textos que parecem dados pessoais (com números longos, e-mails ou links) e buscas sobre temas de crise nunca são guardados.'
        ]),
        bloco('Avaliações', [
          'As notas e o "este conteúdo foi útil?" são anônimos. O comentário é opcional: por favor, não escreva seu nome ou contato nele.'
        ]),
        bloco('Pedido de palestra ou pregação', [
          'Os dados enviados no formulário (nome, contato, instituição e cidade) são usados só para responder ao seu pedido. Ficam numa planilha privada, que não é publicada no portal, e são anonimizados 12 meses depois de o pedido ser encerrado.'
        ]),
        assistente ? bloco('Assistente "' + (c.ASSISTENTE_NOME || 'Pergunte à Luz') + '"', [
          'O assistente responde com base nos conteúdos do portal. Quando o assunto não está no portal, mas é dos temas do projeto, ele pode dar uma resposta geral, sempre marcada como "Resposta geral". Para gerar a resposta, sua pergunta é enviada ao Google Gemini, um serviço de inteligência artificial do Google.',
          [
            'Não guardamos as perguntas: só contamos quantas foram feitas por dia.',
            'Para entender continuações (como "e na escola?"), as duas últimas perguntas e respostas da conversa vão junto com a nova pergunta. A conversa fica só na página aberta e some quando você recarrega ou clica em "Nova conversa".',
            'Cumprimentos e agradecimentos (como "oi" e "obrigado") são respondidos pelo próprio portal, sem envio ao Google.',
            'Pelos termos do Google para o uso gratuito do Gemini, o conteúdo enviado pode ser usado pelo Google para melhorar os serviços dele. Por isso, não escreva nomes, telefones, e-mails, documentos ou detalhes sobre a saúde de alguém.',
            'Perguntas que parecem conter dados pessoais são recusadas antes de serem enviadas.',
            'Perguntas sobre crise (como suicídio ou automutilação) não são enviadas para a inteligência artificial: o portal mostra na hora uma mensagem de apoio com o CVV (188).',
            'As respostas podem conter erros e não substituem profissionais. Só profissionais de saúde avaliam e diagnosticam.'
          ]
        ]) : null,
        bloco('Preferências guardadas no seu aparelho', [
          'As escolhas do botão de acessibilidade (tamanho do texto, contraste, cores…) e a informação de que você já viu o convite para avaliar ficam guardadas só no seu navegador, para valerem na próxima visita. Elas nunca são enviadas ao portal e você pode apagá-las limpando os dados do site no navegador.'
        ]),
        bloco('Checklist e imagens para compartilhar', [
          'O checklist "Minha igreja é inclusiva?" e as imagens para stories funcionam inteiramente no seu aparelho. Nada do que você marca ou gera é enviado ao portal.'
        ]),
        bloco('Recursos de acessibilidade', [
          [
            'Ouvir esta página: usa a voz do seu próprio navegador. Dependendo do navegador e da voz escolhida, o texto pode ser processado pelo serviço do fabricante (por exemplo, o Google no Chrome).',
            'Tradutor de Libras: usa o VLibras, serviço gratuito do Governo Federal. Ele só é carregado quando você liga o tradutor; a partir daí, o texto que você pede para traduzir é enviado ao VLibras, que segue a política de privacidade do próprio serviço.'
          ]
        ]),
        bloco('Onde o site funciona', [
          'O site projetoluzdainclusao.com.br é publicado no GitHub Pages. Os conteúdos vêm de uma planilha privada do projeto e as partes que precisam de servidor (o assistente, as avaliações, os pedidos de palestra e a contagem anônima de visitas) funcionam no Google Apps Script. O domínio é registrado no Registro.br.',
          'As fontes de letras e os arquivos do site ficam no próprio site: abrir as páginas não faz pedidos a serviços de anúncios ou de rastreamento.',
          'Como em qualquer site, o GitHub e o Google podem registrar dados técnicos de acesso (como o endereço IP) para o funcionamento e a segurança dos serviços deles, de acordo com as políticas de privacidade de cada um. O Projeto Luz da Inclusão não tem acesso a esses registros.'
        ]),
        bloco('Como o site aparece no Google', [
          'Usamos o Google Search Console para saber se o site aparece nas pesquisas do Google e com quais palavras ele é encontrado. Ele não coloca nada no seu navegador: mostra só números gerais das pesquisas feitas no próprio Google, sem identificar ninguém.'
        ]),
        bloco('Links para outros sites', [
          'Botões como "Compartilhar no WhatsApp", o Instagram do projeto e os textos oficiais das leis levam para outros sites, que têm as próprias regras de privacidade.'
        ]),
        direitos,
        h('p', { class: 'priv__data' }, 'Última atualização: ' + ATUALIZADO + '.')
      )
    );
  }

  L.registrarView('privacidade', function () { return viewPrivacidade(); });
})(window.LUZ);

;
/* AssistenteTela */



(function (L) {
  'use strict';
  if (!L) return;
  const h = L.h;
  const LIMITE_VISITA = 10;
  const MAX = 500;

  const cfg = L.config() || {};
  if (cfg.ASSISTENTE_DISPONIVEL !== 'SIM') return;

  const TEMAS = [
    { titulo: 'Entender', icone: 'livro', cor: 'azul', perguntas: ['O que é TEA?', 'O que é neurodiversidade?'] },
    { titulo: 'Na igreja', icone: 'pessoas', cor: 'vermelho', perguntas: ['Como acolher uma criança autista no culto?', 'Como deixar o ministério infantil mais inclusivo?'] },
    { titulo: 'Família e escola', icone: 'coracao', cor: 'verde', perguntas: ['O que é sobrecarga sensorial?', 'Como apoiar uma criança com TDAH?'] },
    { titulo: 'Fé e inclusão', icone: 'cruz', cor: 'laranja', perguntas: ['O que a Bíblia fala sobre inclusão?', 'Deficiência é castigo de Deus?'] }
  ];
  const ICONE_TIPO = {
    'Entenda': 'livro', 'Na prática': 'coracao', 'Glossário': 'lupa', 'Versículo': 'cruz', 'Fé e inclusão': 'cruz',
    'Símbolos': 'peca', 'Calendário': 'luz', 'Palestras': 'microfone', 'Ministrações': 'cruz', 'Materiais': 'livro'
  };

   
  const CONVERSA = [
    ['identidade', ['quem e voce', 'quem e vc', 'quem e tu', 'quem esta falando', 'o que voce faz', 'o que vc faz', 'o que voce e', 'voce e uma ia', 'vc e uma ia', 'voce e um robo', 'vc e um robo', 'voce e robo', 'voce e uma pessoa', 'voce e humana', 'como voce funciona', 'qual seu nome', 'qual o seu nome', 'qual e o seu nome', 'como voce se chama', 'o que posso perguntar', 'o que eu posso perguntar', 'pode me ajudar', 'me ajuda', 'ajuda']],
    ['agradecimento', ['muito obrigado', 'muito obrigada', 'obrigado', 'obrigada', 'obg', 'brigado', 'brigada', 'valeu', 'vlw', 'grato', 'grata', 'gratidao', 'agradeco', 'deus te abencoe', 'deus abencoe', 'amem']],
    ['despedida', ['ate a proxima', 'ate mais', 'ate logo', 'ate breve', 'tchau', 'tchauzinho', 'falou', 'flw', 'fui']],
    ['elogio', ['que legal', 'muito legal', 'muito bom', 'legal', 'show', 'top', 'gostei', 'amei', 'perfeito', 'incrivel', 'otimo', 'massa', 'maravilha', 'lindo', 'bacana']],
    ['saudacao', ['bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'tudo bom', 'td bem', 'tudo certo', 'tudo joia', 'como vai', 'como voce esta', 'como vc esta', 'como voce ta', 'como vc ta', 'como esta', 'e voce', 'e vc', 'e com voce', 'oii', 'oie', 'oi', 'ola', 'opa', 'e ai', 'eai', 'hey', 'hello', 'salve', 'alo', 'beleza', 'blz', 'de boa']]
  ];
  const ENCHIMENTO = ['luz', 'sim', 'ai', 'tambem', 'gente', 'pessoal', 'querida', 'amiga', 'por', 'favor', 'mesmo', 'de', 'novo'];
  const FRASES = [];
  CONVERSA.forEach(function (g) { g[1].forEach(function (f) { FRASES.push({ f: f, tipo: g[0] }); }); });
  FRASES.sort(function (a, b) { return b.f.length - a.f.length; });

  function conversaLeve(texto) {
    if (texto.length > 70) return null;
    let t = L.normalizar(texto).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    const tipos = {};
    let achou = true;
    while (t && achou) {
      achou = false;
      for (let i = 0; i < FRASES.length; i++) {
        const f = FRASES[i].f;
        if (t === f || t.indexOf(f + ' ') === 0) {
          tipos[FRASES[i].tipo] = true;
          if (f.indexOf('tudo') === 0 || f.indexOf('como') === 0 || f === 'td bem') tipos.tudoBem = true;
          if (f === 'bom dia' || f === 'boa tarde' || f === 'boa noite') tipos.periodo = f.charAt(0).toUpperCase() + f.slice(1);
          t = t.slice(f.length).trim();
          achou = true;
          break;
        }
      }
      if (!achou && Object.keys(tipos).length) {
        const palavra = t.split(' ')[0];
        if (ENCHIMENTO.indexOf(palavra) > -1) { t = t.slice(palavra.length).trim(); achou = true; }
      }
    }
    if (t) return null;
    const ordem = ['identidade', 'agradecimento', 'despedida', 'elogio', 'saudacao'];
    for (let i = 0; i < ordem.length; i++) if (tipos[ordem[i]]) return { tipo: ordem[i], tudoBem: !!tipos.tudoBem, periodo: tipos.periodo || '' };
    return null;
  }

  function sorteia(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

  function periodoDoDia() {
    const hora = new Date().getHours();
    return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  }

  function respostaLeve(c) {
    if (c.tipo === 'identidade') {
      return 'Eu sou a **Luz**, a assistente do Projeto Luz da Inclusão. 💡\nRespondo com base nos conteúdos publicados aqui no portal, em linguagem simples: autismo, TDAH, Síndrome de Down, deficiências, acessibilidade, inclusão na igreja, na família e na escola, e fé.\nNão sou uma pessoa nem profissional de saúde: para avaliação e diagnóstico, procure profissionais. Por onde quer começar?';
    }
    if (c.tipo === 'agradecimento') {
      return sorteia(['Eu que agradeço! 💛 Se surgir outra dúvida, é só perguntar.',
        'Por nada! Que essa informação vire acolhimento aí onde você está. 💡',
        'Fico feliz em ajudar! Quer aproveitar e conhecer outro tema?']);
    }
    if (c.tipo === 'despedida') {
      return sorteia(['Até mais! Volte sempre que precisar. 💡', 'Tchau! Que Deus abençoe você e a sua casa. 💛',
        'Até a próxima! E lembre: inclusão é enxergar a pessoa antes do diagnóstico. 💡']);
    }
    if (c.tipo === 'elogio') {
      return sorteia(['Que bom que você gostou! 😊 Quer saber mais sobre algum tema?',
        'Obrigada! 💛 Fico feliz em ajudar. Tem mais alguma dúvida?']);
    }
    const inicio = (c.periodo ? c.periodo + '! ' : '') + (c.tudoBem
      ? sorteia(['Tudo bem, sim! Obrigada por perguntar. 😊', 'Tudo ótimo por aqui, e espero que com você também! 😊'])
      : c.periodo ? 'Que bom ter você aqui. 💡'
      : sorteia([periodoDoDia() + '! Que bom ter você aqui. 💡', 'Oi! Que alegria ter você por aqui. 💡']));
    return inicio + ' Eu sou a Luz e posso te ajudar com dúvidas sobre inclusão, neurodiversidade, deficiência e fé. Sobre o que você quer conversar?';
  }

   
  function temDadoPessoal(texto) {
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(texto)) return true;
    if (/(?:\d[\s.\-()]*){10,}/.test(texto)) return true;
    return /\b\d{5}-?\d{4}\b/.test(texto);
  }

  function textoSimples(texto) {
    return String(texto || '').replace(/\*\*/g, '').replace(/^[-•>]\s*/gm, '').replace(/\[\d\]/g, '').replace(/\s+/g, ' ').trim();
  }

  function semAnimacao() {
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      document.documentElement.classList.contains('a11y-sem-animacao');
  }

  function avatar(classe) {
    return h('span', { class: 'luz-avatar ' + (classe || '') }, L.lampada('luz-avatar__svg', true));
  }

  function svgIcone(desenho, classe) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', classe);
    s.innerHTML = desenho;
    return s;
  }

   
  
  let ui = null;
  let restantes = LIMITE_VISITA;
  let trocas = [];
  let enviando = false;
  let criadoEm = 0;
  let pendente = '';

  function criarUi() {
    criadoEm = Date.now();

    const conversa = h('ol', { class: 'luz-conversa', 'aria-live': 'polite', 'aria-label': 'Conversa com a Luz' });
    const campo = h('textarea', {
      id: 'luz-campo', class: 'luz-campo', rows: '1', maxlength: String(MAX),
      placeholder: 'Escreva sua pergunta…', autocomplete: 'off', spellcheck: 'true',
      'aria-describedby': 'luz-rodape-dicas'
    });
    const isca = h('input', { type: 'text', name: 'site', tabindex: '-1', autocomplete: 'off', class: 'ia-isca', 'aria-hidden': 'true' });
    const enviarBtn = h('button', { class: 'luz-enviar', type: 'submit' },
      h('span', { class: 'sr-only' }, 'Enviar pergunta'),
      svgIcone('<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', 'luz-enviar__ico'));
    const contador = h('span', { class: 'luz-contador', hidden: true });
    const restantesEl = h('span', { class: 'luz-restantes', hidden: true });
    const status = h('p', { class: 'luz-status', role: 'alert' });
    const avatarGrande = avatar('luz-avatar--grande');
    const avatarTopo = avatar('luz-avatar--topo');

    campo.addEventListener('input', function () { contar(); ajustarAltura(); });
    campo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(); }
    });

    const boasVindas = h('div', { class: 'luz-boas-vindas' },
      avatarGrande,
      h('h1', { class: 'luz-boas-vindas__titulo', tabindex: '-1' }, 'Olá! Eu sou a Luz.'),
      h('p', { class: 'luz-boas-vindas__texto' }, 'Sobre o que você quer conversar hoje? Escreva do seu jeito ou comece por um tema.'),
      h('ul', { class: 'luz-temas' }, TEMAS.map(function (t) {
        return h('li', { class: 'luz-tema c-' + t.cor },
          h('p', { class: 'luz-tema__cabeca' }, h('span', { class: 'luz-tema__icone' }, L.icone(t.icone)), t.titulo),
          h('ul', null, t.perguntas.map(function (p) {
            return h('li', null, h('button', { class: 'luz-tema__pergunta', type: 'button', onclick: function () { perguntar(p); } }, p));
          })));
      }))
    );

    const btnA11y = h('button', {
      class: 'luz-topo__btn luz-topo__a11y', type: 'button', 'aria-label': 'Acessibilidade',
      onclick: function () { const b = document.querySelector('.a11y-botao'); if (b) b.click(); }
    }, svgIcone('<circle cx="12" cy="4.5" r="2" fill="currentColor"/><path d="M4.5 8.5l7.5 1.5 7.5-1.5M12 10v4.5M12 14.5l-3 6M12 14.5l3 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', 'luz-topo__ico'));
    const btnNova = h('button', { class: 'luz-topo__btn luz-topo__nova', type: 'button', onclick: novaConversa },
      svgIcone('<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>', 'luz-topo__ico'),
      h('span', { class: 'luz-topo__nova-texto' }, 'Nova conversa'));

    const topo = h('header', { class: 'luz-topo' },
      h('div', { class: 'luz-topo__marca' }, avatarTopo,
        h('div', null,
          h('p', { class: 'luz-topo__nome' }, 'Luz'),
          h('p', { class: 'luz-topo__status' }, h('span', { class: 'luz-topo__ponto', 'aria-hidden': 'true' }), 'Assistente do Projeto Luz da Inclusão'))),
      h('div', { class: 'luz-topo__acoes' }, btnA11y, btnNova));

    const como = criarComoFunciona();

    const form = h('form', { class: 'luz-form', onsubmit: function (e) { e.preventDefault(); enviar(); } },
      h('label', { for: 'luz-campo', class: 'sr-only' }, 'Sua pergunta para a Luz'),
      h('div', { class: 'luz-form__caixa' }, campo, enviarBtn),
      isca,
      status,
      h('p', { id: 'luz-rodape-dicas', class: 'luz-form__dicas' },
        h('span', null, '🔒 Sem dados pessoais'),
        h('span', { 'aria-hidden': 'true' }, '·'),
        h('button', { class: 'luz-form__link', type: 'button', onclick: como.abrir }, 'Como a Luz funciona'),
        h('span', { 'aria-hidden': 'true' }, '·'),
        h('span', null, 'Precisa conversar? CVV ', h('a', { href: 'tel:188' }, '188')),
        contador, restantesEl));

    const corpo = h('div', { class: 'luz-app__corpo' }, h('div', { class: 'luz-app__coluna' }, boasVindas, conversa));
    const app = h('section', { class: 'luz-app', 'data-estado': 'inicio', 'aria-label': 'Pergunte à Luz' },
      topo, corpo, h('div', { class: 'luz-app__base' }, h('div', { class: 'luz-app__coluna' }, form)), como.painel);

    ui = {
      app: app, corpo: corpo, conversa: conversa, campo: campo, isca: isca, enviar: enviarBtn, contador: contador,
      restantes: restantesEl, status: status, boasVindas: boasVindas, avatares: [avatarGrande, avatarTopo]
    };
    atualizarRestantes();
  }

  function criarComoFunciona() {
    let anterior = null;
    const fechar = function () {
      painel.hidden = true;
      document.removeEventListener('keydown', tecla);
      if (anterior && anterior.focus) anterior.focus();
    };
    const tecla = function (e) { if (e.key === 'Escape') { e.preventDefault(); fechar(); } };
    const fecharBtn = h('button', { class: 'luz-como__fechar', type: 'button', onclick: fechar }, L.icone('fechar'), h('span', { class: 'sr-only' }, 'Fechar'));
    const painel = h('div', { class: 'luz-como', hidden: true },
      h('div', { class: 'luz-como__fundo', onclick: fechar }),
      h('div', { class: 'luz-como__caixa', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'luz-como-titulo' },
        h('div', { class: 'luz-como__topo' }, h('h2', { id: 'luz-como-titulo' }, 'Como a Luz funciona'), fecharBtn),
        h('ul', { class: 'luz-como__lista' },
          h('li', null, h('strong', null, '📚 Com base no portal: '), 'quando o assunto está no portal, a Luz responde com base nele e mostra onde ler mais.'),
          h('li', null, h('strong', null, '💡 Resposta geral: '), 'quando não está, mas é dos temas do projeto, ela dá uma resposta geral, sempre marcada.'),
          h('li', null, h('strong', null, '🔒 Privacidade: '), 'não escreva nomes, telefones, e-mails, documentos ou detalhes de saúde de alguém. As perguntas são processadas pelo Google Gemini e não ficam guardadas no portal. ',
            h('a', { href: '#/privacidade', 'data-rota': 'privacidade', onclick: fechar }, 'Saiba mais'), '.'),
          h('li', null, h('strong', null, '💬 Conversa: '), 'até ' + LIMITE_VISITA + ' perguntas por visita ("oi" e "obrigado" não contam). Tudo some ao recarregar ou clicar em "Nova conversa".'),
          h('li', null, h('strong', null, '🩺 Limites: '), 'a Luz pode errar e não substitui profissionais. Só profissionais de saúde avaliam e diagnosticam.'),
          h('li', null, h('strong', null, '💛 Precisa conversar agora? '), 'O CVV atende de graça, 24 horas: ligue ', h('a', { href: 'tel:188' }, '188'), '.'))));
    return {
      painel: painel,
      abrir: function () {
        anterior = document.activeElement;
        painel.hidden = false;
        document.addEventListener('keydown', tecla);
        fecharBtn.focus();
      }
    };
  }

  function ajustarAltura() {
    ui.campo.style.height = 'auto';
    ui.campo.style.height = Math.min(ui.campo.scrollHeight, 168) + 'px';
  }

  function contar() {
    const n = ui.campo.value.length;
    ui.contador.hidden = n < MAX - 100;
    ui.contador.textContent = n + '/' + MAX;
  }

  function atualizarRestantes() {
    ui.restantes.hidden = restantes > 3;
    ui.restantes.textContent = restantes > 0
      ? (restantes === 1 ? 'Resta 1 pergunta nesta visita' : 'Restam ' + restantes + ' perguntas nesta visita')
      : 'Perguntas desta visita encerradas';
    ui.enviar.disabled = enviando;
  }

  function estadoAvatar(classe) {
    ui.avatares.forEach(function (a) {
      a.classList.remove('luz-avatar--pensando', 'luz-avatar--acendeu');
      if (classe) { void a.offsetWidth; a.classList.add(classe); }
    });
  }

  function iniciarConversa() {
    if (ui.app.getAttribute('data-estado') === 'conversa') return;
    ui.app.setAttribute('data-estado', 'conversa');
  }

   
  function rolarParaFim() {
    const caixa = ui.corpo;
    caixa.scrollTo ? caixa.scrollTo({ top: caixa.scrollHeight, behavior: semAnimacao() ? 'auto' : 'smooth' }) : (caixa.scrollTop = caixa.scrollHeight);
  }

  function msgPessoa(texto) {
    iniciarConversa();
    ui.conversa.appendChild(h('li', { class: 'luz-msg luz-msg--pessoa' }, h('p', { class: 'sr-only' }, 'Você:'), h('p', { class: 'luz-msg__balao' }, texto)));
    rolarParaFim();
  }

  function msgLuz(conteudo, extra) {
    const li = h('li', { class: 'luz-msg luz-msg--luz' + (extra ? ' ' + extra : '') },
      avatar('luz-avatar--msg'),
      h('div', { class: 'luz-msg__corpo' }, h('p', { class: 'sr-only' }, 'Luz:'), conteudo));
    ui.conversa.appendChild(li);
    rolarParaFim();
    return li;
  }

   
  function digitar(alvo, depois) {
    if (semAnimacao()) { if (depois) depois(); return; }
    const nos = [];
    const percorre = document.createTreeWalker(alvo, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = percorre.nextNode())) { nos.push({ no: n, texto: n.nodeValue }); n.nodeValue = ''; }
    const total = nos.reduce(function (s, x) { return s + x.texto.length; }, 0);
    const passo = Math.max(2, Math.ceil(total / 70));
    let i = 0;
    let feitos = 0;
    alvo.classList.add('luz-digitando');
    const tick = function () {
      let restante = passo;
      while (restante > 0 && i < nos.length) {
        const atual = nos[i];
        const falta = atual.texto.length - atual.no.nodeValue.length;
        const pega = Math.min(falta, restante);
        atual.no.nodeValue = atual.texto.slice(0, atual.no.nodeValue.length + pega);
        restante -= pega;
        feitos += pega;
        if (atual.no.nodeValue.length >= atual.texto.length) i++;
      }
      ui.corpo.scrollTop = ui.corpo.scrollHeight;
      if (feitos < total) { requestAnimationFrame(tick); return; }
      alvo.classList.remove('luz-digitando');
      if (depois) depois();
    };
    requestAnimationFrame(tick);
  }

  function botaoCopiar(texto) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return null;
    const b = h('button', { class: 'luz-copiar', type: 'button' },
      svgIcone('<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/>', 'luz-copiar__ico'),
      h('span', null, 'Copiar'));
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(texto).then(function () {
        b.lastChild.textContent = 'Copiado ✓';
        setTimeout(function () { b.lastChild.textContent = 'Copiar'; }, 2000);
      }).catch(function () { b.hidden = true; });
    });
    return b;
  }

  function fontes(lista) {
    const validas = (lista || []).filter(function (f) { return /^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,80})?$/.test(f.rota || ''); });
    if (!validas.length) return null;
    return h('div', { class: 'luz-fontes' },
      h('p', { class: 'luz-fontes__titulo' }, 'Leia mais no portal'),
      h('ul', null, validas.map(function (f) {
        return h('li', null, h('a', { class: 'luz-fonte', href: '#/' + f.rota, 'data-rota': f.rota },
          h('span', { class: 'luz-fonte__icone' }, L.icone(ICONE_TIPO[f.tipo] || 'livro')),
          h('span', { class: 'luz-fonte__texto' },
            h('span', { class: 'luz-fonte__titulo' }, f.titulo),
            f.tipo ? h('span', { class: 'luz-fonte__tipo' }, f.tipo) : null),
          h('span', { class: 'luz-fonte__seta', 'aria-hidden': 'true' }, '→')));
      })));
  }

  function novaConversa() {
    if (enviando) return;
    trocas = [];
    ui.conversa.replaceChildren();
    ui.status.textContent = '';
    estadoAvatar('');
    ui.app.setAttribute('data-estado', 'inicio');
    ui.corpo.scrollTop = 0;
    ui.campo.focus();
  }

   
  function perguntar(texto) {
    ui.campo.value = texto;
    contar();
    enviar();
  }

  function limparCampo() {
    ui.campo.value = '';
    contar();
    ajustarAltura();
  }

  function enviar() {
    if (enviando) return;
    const texto = ui.campo.value.replace(/\s+/g, ' ').trim();
    ui.status.textContent = '';
    if (texto.length < 2) { ui.status.textContent = 'Escreva sua pergunta.'; ui.campo.focus(); return; }

    
    if (L.ehCrise && L.ehCrise(texto)) {
      limparCampo();
      msgPessoa(texto);
      msgLuz(L.cartaoAcolhimento({ compacto: true }), 'luz-msg--acolhe');
      return;
    }
    
    const leve = conversaLeve(texto);
    if (leve) {
      limparCampo();
      msgPessoa(texto);
      estadoAvatar('luz-avatar--acendeu');
      const corpo = h('div', { class: 'luz-resposta' }, L.textoRico(respostaLeve(leve)).conteudo);
      msgLuz(corpo);
      digitar(corpo);
      return;
    }
    
    if (temDadoPessoal(texto)) {
      ui.status.textContent = 'Por segurança, apague da pergunta e-mails, telefones, CPF ou outros números pessoais.';
      ui.campo.focus();
      return;
    }
    if (texto.length < 4) { ui.status.textContent = 'Escreva sua pergunta com um pouco mais de detalhes.'; ui.campo.focus(); return; }
    if (restantes <= 0) {
      ui.status.textContent = 'Você usou as ' + LIMITE_VISITA + ' perguntas desta visita. Continue explorando o portal pela busca 🔍.';
      return;
    }
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      ui.status.textContent = 'O assistente não está disponível neste endereço.';
      return;
    }

    enviando = true;
    restantes--;
    limparCampo();
    atualizarRestantes();
    msgPessoa(texto);
    estadoAvatar('luz-avatar--pensando');
    const carregando = msgLuz(h('p', { class: 'luz-carregando' },
      h('span', { class: 'luz-pontos', 'aria-hidden': 'true' }, h('span'), h('span'), h('span')),
      h('span', null, 'A Luz está pensando…')), 'luz-msg--pensando');

    const concluir = function (no, extra, devolver, animar, depois) {
      enviando = false;
      if (devolver) restantes++;
      carregando.remove();
      estadoAvatar(extra === 'luz-msg--aviso' ? '' : 'luz-avatar--acendeu');
      msgLuz(no, extra);
      atualizarRestantes();
      if (animar) digitar(animar, depois); else if (depois) depois();
      ui.campo.focus({ preventScroll: true });
    };

    google.script.run
      .withSuccessHandler(function (r) {
        if (!r || !r.ok) {
          concluir(h('p', null, (r && r.message) || 'Não consegui responder agora. Tente de novo em alguns instantes.'), 'luz-msg--aviso', true);
          return;
        }
        const d = r.data || {};
        if (d.tipo === 'acolhimento') { concluir(L.cartaoAcolhimento({ compacto: true }), 'luz-msg--acolhe', true); return; }
        if (d.tipo === 'fora' || d.tipo === 'sem-base') {
          const t = h('div', { class: 'luz-resposta' },
            h('p', null, 'Esse assunto foge um pouco do que eu sei responder. 💡'),
            h('p', null, 'Eu converso sobre inclusão, deficiências, neurodiversidade, acessibilidade, família, escola, igreja e fé. Pode perguntar à vontade sobre esses temas!'));
          concluir(t, null, d.tipo === 'sem-base', t);
          return;
        }
        const resposta = String(d.texto || '');
        const geral = d.origem === 'geral';
        trocas.push({ p: texto, r: textoSimples(resposta).slice(0, 700) });
        trocas = trocas.slice(-2);
        
        const corpoTexto = h('div', { class: 'luz-resposta' }, L.textoRico(resposta.replace(/\s*\[\d\]/g, '')).conteudo);
        const extras = h('div', { class: 'luz-extras', hidden: true },
          geral ? h('p', { class: 'luz-geral-nota' }, 'Confira informações importantes com profissionais ou fontes oficiais.') : fontes(d.fontes),
          h('div', { class: 'luz-msg__acoes' }, botaoCopiar(textoSimples(resposta))));
        concluir(h('div', null,
          h('p', { class: 'luz-origem luz-origem--' + (geral ? 'geral' : 'portal') },
            geral ? '💡 Resposta geral (fora do portal)' : '📚 Com base no portal'),
          corpoTexto, extras), null, false, corpoTexto, function () { extras.hidden = false; rolarParaFim(); });
      })
      .withFailureHandler(function () {
        concluir(h('p', null, 'Não consegui responder agora. Verifique sua conexão e tente de novo.'), 'luz-msg--aviso', true);
      })
      .perguntarAssistente({ pergunta: texto, tempo: Date.now() - criadoEm, site: ui.isca.value, historico: trocas.slice(-2) });
  }

   
  function viewPergunte() {
    if (!ui) criarUi();
    if (pendente) {
      const texto = pendente;
      pendente = '';
      setTimeout(function () { ui.campo.value = texto; contar(); ajustarAltura(); ui.campo.focus(); }, 80);
    }
    return ui.app;
  }

   
  function blocoAssistente() {
    return h('section', { class: 'luz-convite', 'aria-labelledby': 'luz-convite-titulo' },
      h('div', { class: 'container' },
        h('div', { class: 'luz-convite__caixa' },
          avatar('luz-avatar--convite'),
          h('div', { class: 'luz-convite__texto' },
            h('h2', { id: 'luz-convite-titulo', class: 'luz-convite__titulo' }, 'Ficou com alguma dúvida? Pergunte à Luz.'),
            h('p', null, 'A Luz é a assistente do portal: ela responde em linguagem simples e mostra onde ler mais.'),
            h('div', { class: 'luz-convite__acoes' },
              L.botao('Conversar com a Luz', '#/pergunte', 'luz', 'luz'))))));
  }

   
  function abrirAssistente(texto, enviarDireto) {
    if (L.fecharBusca) L.fecharBusca(false);
    if (enviarDireto && texto) {
      if (!ui) criarUi();
      if (L.navegar) L.navegar('pergunte');
      setTimeout(function () { perguntar(texto); }, 150);
      return;
    }
    pendente = typeof texto === 'string' ? texto.trim().slice(0, MAX) : '';
    if (L.navegar) L.navegar('pergunte');
  }

  
  window.addEventListener('luz:rota', function (e) {
    const caminho = e && e.detail ? e.detail.caminho : '';
    document.body.classList.toggle('luz-na-pagina', caminho === 'pergunte');
  });

  L.registrarView('pergunte', function () { return viewPergunte(); });
  L.blocoAssistente = blocoAssistente;
  L.abrirAssistente = abrirAssistente;
  L.assistenteAtivo = true;
})(window.LUZ);

;
/* MetricasCliente */



(function (L) {
  'use strict';
  if (!L) return;
  const temGS = typeof google !== 'undefined' && google.script && google.script.run;
  if (!temGS) return;

  const ESPERA_MS = 8000;
  const MAX_LOTE = 10;
  let fila = [];
  let timer = null;
  const buscasEnviadas = {};

  function enviar() {
    clearTimeout(timer);
    timer = null;
    if (!fila.length) return;
    const lote = fila.slice(0, 20);
    fila = [];
    try {
      google.script.run.withFailureHandler(function () {   }).registrarVisitas(lote);
    } catch (erro) {   }
  }

  window.addEventListener('luz:rota', function (e) {
    const caminho = e && e.detail && typeof e.detail.caminho === 'string' ? e.detail.caminho : '';
    if (!/^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,80})?$/.test(caminho)) return;
    fila.push(caminho);
    if (fila.length >= MAX_LOTE) { enviar(); return; }
    if (!timer) timer = setTimeout(enviar, ESPERA_MS);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') enviar();
  });

   
  L.registrarBuscaVazia = function (termo) {
    const t = String(termo || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (t.length < 3 || t.length > 60 || buscasEnviadas[t]) return;
    if (L.ehCrise && L.ehCrise(t)) return;
    buscasEnviadas[t] = true;
    try {
      google.script.run.withFailureHandler(function () {   }).registrarBuscaVazia(t);
    } catch (erro) {   }
  };
})(window.LUZ);

;window.LUZ && window.LUZ.iniciar();
