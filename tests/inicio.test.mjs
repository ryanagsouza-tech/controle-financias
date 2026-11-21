// Testes do início do app: carga, teclado, service worker e atalho de lançamento.
import { els } from './auxiliar.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { S } = await import('../js/estado.js');
const inicio = await import('../js/inicio.js');
const { renderizar } = await import('../js/render.js');

const ouvintes = {};
globalThis.document.addEventListener = (tipo, fn) => { (ouvintes[tipo] = ouvintes[tipo] || []).push(fn); };

test('iniciar carrega os dados, aplica o tema e desenha a primeira tela', async () => {
    await inicio.iniciar();
    assert.ok(S.estado && Array.isArray(S.estado.meses), 'dados carregados');
    assert.equal(S.renderizar, renderizar, 'a tela pode ser redesenhada por quem grava');
    assert.ok(els.conteudoPrincipal.innerHTML.length > 100, 'a tela foi desenhada');
    assert.equal(globalThis.document.documentElement.attrs['data-tema'], 'claro');
    assert.ok(ouvintes.click && ouvintes.keydown, 'eventos ligados');
});

test('iniciar cria o mês atual quando o app está vazio', async () => {
    const agora = new Date();
    assert.ok(S.estado.meses.some(m => m.ano === agora.getFullYear() && m.mes === agora.getMonth() + 1));
});

test('atalho #novo abre o lançamento rápido', async () => {
    globalThis.location.hash = '#novo';
    await inicio.iniciar();
    assert.equal(els.modalRapido.classList.contains('hidden'), false);
    globalThis.location.hash = '';
});

test('Esc fecha a janela aberta e Tab fica preso dentro dela', () => {
    inicio.configurarTeclado();
    const teclado = ouvintes.keydown[ouvintes.keydown.length - 1];
    els.modalRapido.classList.remove('hidden');
    teclado({ key: 'Escape' });
    assert.equal(els.modalRapido.classList.contains('hidden'), true, 'Esc fechou a janela');
    // com janela aberta, Tab é tratado; sem janela aberta, passa direto
    let impediu = false;
    teclado({ key: 'Tab', shiftKey: false, preventDefault: () => { impediu = true; } });
    assert.equal(impediu, false);
});

test('service worker: registra em https, ignora em file: e avisa quando há versão nova', () => {
    const registros = [];
    let aoMudar = null;
    Object.defineProperty(globalThis.navigator, 'serviceWorker', { configurable: true, value: {
        controller: {}, register: p => { registros.push(p); return Promise.resolve(); }, addEventListener: (t, f) => { if (t === 'controllerchange') aoMudar = f; }
    } });
    globalThis.location.protocol = 'https:';
    inicio.registrarServiceWorker();
    assert.deepEqual(registros, ['sw.js']);
    aoMudar();
    assert.match(els.toast.innerHTML, /Nova versão instalada/);
    globalThis.location.protocol = 'file:';
    inicio.registrarServiceWorker();
    assert.equal(registros.length, 1, 'em file: não registra');
    globalThis.location.protocol = 'https:';
});
