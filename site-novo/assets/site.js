/* Projeto Luz da Inclusão — scripts do site (etapa 2: menu "Tudo"). Sem bibliotecas externas. */
(function () {
  'use strict';
  var painel = document.getElementById('menu-movel');
  var fundo = document.querySelector('.menu-fundo');
  var botao = document.querySelector('[data-abrir-menu]');
  if (!painel || !botao) return;

  function focaveis() {
    return Array.prototype.slice.call(painel.querySelectorAll('a[href], button:not([disabled])'));
  }
  function tecla(e) {
    if (e.key === 'Escape') { fechar(true); return; }
    if (e.key !== 'Tab') return;
    var f = focaveis();
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function abrir() {
    painel.hidden = false;
    if (fundo) fundo.hidden = false;
    botao.setAttribute('aria-expanded', 'true');
    document.body.classList.add('travado');
    document.addEventListener('keydown', tecla);
    var ativo = painel.querySelector('[aria-current="page"]') || focaveis()[0];
    if (ativo) ativo.focus();
  }
  function fechar(devolverFoco) {
    if (painel.hidden) return;
    painel.hidden = true;
    if (fundo) fundo.hidden = true;
    botao.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('travado');
    document.removeEventListener('keydown', tecla);
    if (devolverFoco) botao.focus();
  }
  botao.addEventListener('click', abrir);
  document.querySelectorAll('[data-fechar-menu]').forEach(function (el) {
    el.addEventListener('click', function () { fechar(true); });
  });
})();
