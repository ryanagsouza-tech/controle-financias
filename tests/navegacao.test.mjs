// Testes do menu lateral e da navegação entre telas.
import { els, cats } from './auxiliar.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { mesDoCalendario } = await import('../js/calculos.js');
const render = await import('../js/render.js');

const A = new Date().getFullYear(), M = new Date().getMonth() + 1;
beforeEach(() => {
    S.estado = migrar({ versao: 7, categorias: cats, contasFixas: [], meses: [] });
    S.abaAtiva = 'resumo_geral'; S.anosAbertos = new Set([A]);
    S.renderizar = render.renderizar;
});

test('menu: Categorias e Configurações são destinos separados', () => {
    mesDoCalendario(A, M);
    render.renderizarNav();
    const nav = els.navPrincipal.innerHTML;
    for (const rotulo of ['Visão Geral', 'Contas Fixas', 'Categorias', 'Configurações']) assert.ok(nav.includes(`<span>${rotulo}</span>`), rotulo);
    assert.ok(nav.includes('"trocarAba"') || nav.includes('data-click="trocarAba"'));
});

test('cada destino abre a sua tela', () => {
    mesDoCalendario(A, M);
    const esperado = { resumo_geral: 'Visão Geral', fixas: 'Contas Fixas', config: 'Categorias e Orçamento', ajustes: 'Configurações' };
    for (const [aba, texto] of Object.entries(esperado)) {
        S.abaAtiva = aba;
        render.renderizarConteudo();
        assert.ok(els.conteudoPrincipal.innerHTML.includes(texto), aba);
    }
});

test('Categorias não tem mais saldos nem cartão, e Configurações não tem a lista de categorias', () => {
    mesDoCalendario(A, M);
    S.abaAtiva = 'config'; render.renderizarConteudo();
    const cat = els.conteudoPrincipal.innerHTML;
    assert.ok(!cat.includes('Saldos iniciais') && !cat.includes('Cartão de crédito'));
    S.abaAtiva = 'ajustes'; render.renderizarConteudo();
    const aj = els.conteudoPrincipal.innerHTML;
    assert.ok(aj.includes('Saldos iniciais') && aj.includes('Cartão de crédito') && aj.includes('Metas de economia') && aj.includes('Pontos de restauração'));
    assert.ok(!aj.includes('Nova categoria'));
});

test('meses agrupados por ano, com trimestres e ano atual aberto', () => {
    mesDoCalendario(A, M); mesDoCalendario(A - 1, 12);
    render.renderizarNav();
    const html = els.navMeses.innerHTML;
    assert.ok(html.includes(`${A}`) && html.includes(`${A - 1}`));
    assert.match(html, /aria-expanded="true"[^>]*>▾ \d{4}/);
    assert.match(html, /aria-expanded="false"[^>]*>▸ \d{4}/);
    assert.match(html, /aria-label="\dº Trimestre \d{4}"/);
});

test('alternar o ano abre e fecha sem sair da tela', () => {
    mesDoCalendario(A - 1, 12);
    render.alternarAno(A - 1);
    assert.ok(S.anosAbertos.has(A - 1));
    render.alternarAno(A - 1);
    assert.ok(!S.anosAbertos.has(A - 1));
});

test('o ano do mês aberto fica sempre expandido', () => {
    const m = mesDoCalendario(A - 1, 12);
    S.anosAbertos = new Set();
    S.abaAtiva = m.id;
    render.renderizarNav();
    assert.ok(S.anosAbertos.has(A - 1));
});

test('menu lateral abre e fecha pelo botão, sem puxador', () => {
    const sb = globalThis.document.getElementById('sidebar'), ov = globalThis.document.getElementById('sidebarOverlay');
    sb.classList.add('-translate-x-full'); ov.classList.add('hidden');
    render.toggleMobileSidebar();
    assert.equal(sb.classList.contains('-translate-x-full'), false);
    assert.equal(ov.classList.contains('hidden'), false);
    render.toggleMobileSidebar();
    assert.equal(sb.classList.contains('-translate-x-full'), true);
});

test('trocar de aba fecha o menu no celular e guarda o último mês visto', () => {
    const m = mesDoCalendario(A, M);
    const sb = globalThis.document.getElementById('sidebar');
    sb.classList.remove('-translate-x-full');
    globalThis.window.innerWidth = 400;
    render.trocarAba(m.id);
    assert.equal(S.ultimoMes, m.id);
    assert.equal(sb.classList.contains('-translate-x-full'), true, 'o menu fechou');
    globalThis.window.innerWidth = 1200;
});

test('aba que não existe mais volta para a Visão Geral', () => {
    S.abaAtiva = 'm_inexistente';
    render.validarAba();
    assert.equal(S.abaAtiva, 'resumo_geral');
    S.abaAtiva = '2099-T1';
    render.validarAba();
    assert.equal(S.abaAtiva, 'resumo_geral');
});

test('um erro ao desenhar mostra aviso em vez de tela em branco', () => {
    S.estado = null;
    render.renderizar();
    assert.match(els.conteudoPrincipal.innerHTML, /Erro ao renderizar/);
});
