// Testes do despachante de eventos: só ações da lista permitida executam.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executar, instalar } from '../js/eventos.js';

const el = (dataset, value = '') => ({ dataset, value, tagName: 'BUTTON' });

test('chama a ação com os argumentos do atributo e o valor do campo no fim', () => {
    const chamadas = [];
    const acoes = { editar: (...a) => chamadas.push(a) };
    executar(acoes, el({ change: 'editar', changeArgs: JSON.stringify(['id1', 'valor']) }, '12,5'), 'change', {});
    assert.deepEqual(chamadas[0].slice(0, 3), ['id1', 'valor', '12,5']);
});

test('ação fora da lista é ignorada', () => {
    const acoes = { ok: () => {} };
    assert.equal(executar(acoes, el({ click: 'apagarTudo' }), 'click', {}), false);
});

test('nomes herdados do Object não executam (constructor, __proto__, toString)', () => {
    for (const nome of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
        assert.equal(executar({}, el({ click: nome }), 'click', {}), false, nome);
    }
});

test('JSON inválido ou que não é lista é ignorado', () => {
    const acoes = { a: () => { throw new Error('não deveria executar'); } };
    assert.equal(executar(acoes, el({ click: 'a', clickArgs: '{quebrado' }), 'click', {}), false);
    assert.equal(executar(acoes, el({ click: 'a', clickArgs: '{"x":1}' }), 'click', {}), false);
});

test('instalar liga clique, mudança, digitação, Enter e fechar pelo fundo', () => {
    const ouvintes = {};
    const doc = { addEventListener: (tipo, fn) => { ouvintes[tipo] = fn; } };
    const log = [];
    const acoes = { x: (...a) => log.push(['x', ...a]), fechar: id => log.push(['fechar', id]), y: () => log.push(['y']) };
    instalar(doc, acoes);
    const alvo = el({ click: 'x', clickArgs: '[1]' });
    ouvintes.click({ target: { closest: s => (s === '[data-click]' ? alvo : null) } });
    assert.equal(log[0][0], 'x');
    const fundo = { dataset: { fundo: 'modalMes' } };
    ouvintes.click({ target: Object.assign(fundo, { closest: s => (s === '[data-fundo]' ? fundo : null) }) });
    assert.deepEqual(log[1], ['fechar', 'modalMes']);
    // clique dentro da janela (não no fundo) não fecha
    const dentro = { closest: s => (s === '[data-fundo]' ? fundo : null) };
    ouvintes.click({ target: dentro });
    assert.equal(log.length, 2);
    // Enter só vale em <input>
    let impediu = false;
    const campo = { dataset: { enter: 'y' }, tagName: 'INPUT', value: '', closest: () => campo };
    ouvintes.keydown({ key: 'Enter', target: campo, preventDefault: () => { impediu = true; } });
    assert.ok(impediu);
    assert.equal(log[2][0], 'y');
    const botao = { dataset: { enter: 'y' }, tagName: 'BUTTON', closest: () => botao };
    ouvintes.keydown({ key: 'Enter', target: botao, preventDefault: () => {} });
    assert.equal(log.length, 3);
});
