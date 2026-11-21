// Testes de acessibilidade: abas, gráfico e movimento reduzido.
import './auxiliar.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { instalar } from '../js/eventos.js';

const ler = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { mesDoCalendario } = await import('../js/calculos.js');
const views = await import('../js/views.js');
const { cats } = await import('./auxiliar.mjs');

function ligar(acoes) {
    const ouvintes = {};
    instalar({ addEventListener: (tipo, fn) => { ouvintes[tipo] = fn; } }, acoes);
    return ouvintes;
}
// Abas de mentira: cada uma com seu dataset e um registro de foco
function abas(nomes, registro) {
    const pai = { querySelectorAll: () => lista };
    const lista = nomes.map(n => {
        const el = { dataset: { click: 'abaDoMes', clickArgs: JSON.stringify([n]) }, parentElement: pai, tagName: 'BUTTON', value: '', focus: () => registro.push('foco:' + n) };
        el.closest = s => (s === '[role="tab"]' ? el : null);
        return el;
    });
    return lista;
}

test('abas: as setas, Home e End trocam de aba e movem o foco', () => {
    const chamadas = [], foco = [];
    const o = ligar({ abaDoMes: n => chamadas.push(n) });
    const lista = abas(['resumo', 'lancamentos', 'receitas'], foco);
    const tecla = (key, de) => o.keydown({ key, target: lista[de], preventDefault() {} });
    tecla('ArrowRight', 0); tecla('ArrowRight', 2); tecla('ArrowLeft', 0); tecla('End', 0); tecla('Home', 2);
    assert.deepEqual(chamadas, ['lancamentos', 'resumo', 'receitas', 'receitas', 'resumo']);
    assert.equal(foco[0], 'foco:lancamentos');
});

test('meses do gráfico (role=button que não é botão) respondem a Enter e Espaço', () => {
    const chamadas = [];
    const o = ligar({ mostrarValoresMes: id => chamadas.push(id) });
    const g = { dataset: { click: 'mostrarValoresMes', clickArgs: '["m1"]' }, tagName: 'g', value: '', getAttribute: n => (n === 'role' ? 'button' : null) };
    g.closest = s => (s === '[data-click]' ? g : null);
    let impediu = 0;
    o.keydown({ key: 'Enter', target: g, preventDefault: () => { impediu++; } });
    o.keydown({ key: ' ', target: g, preventDefault: () => { impediu++; } });
    o.keydown({ key: 'a', target: g, preventDefault: () => { impediu++; } });
    assert.deepEqual(chamadas, ['m1', 'm1']);
    assert.equal(impediu, 2);
});

test('um botão de verdade não é acionado duas vezes (Enter e Espaço ficam com o navegador)', () => {
    const chamadas = [];
    const o = ligar({ x: () => chamadas.push(1) });
    const b = { dataset: { click: 'x' }, tagName: 'BUTTON', getAttribute: () => 'button', value: '' };
    b.closest = s => (s === '[data-click]' ? b : null);
    o.keydown({ key: 'Enter', target: b, preventDefault() {} });
    assert.equal(chamadas.length, 0);
});

test('abas do mês: cada aba controla um painel e só a aberta recebe Tab', () => {
    S.estado = migrar({ versao: 7, categorias: cats, meses: [] });
    S.abaMes = 'resumo';
    const html = views.viewMes(mesDoCalendario(new Date().getFullYear(), new Date().getMonth() + 1));
    for (const k of ['resumo', 'lancamentos', 'receitas']) {
        assert.match(html, new RegExp(`id="tab_${k}" aria-controls="sec_${k}"`));
        assert.match(html, new RegExp(`id="sec_${k}" role="tabpanel" aria-labelledby="tab_${k}"`));
    }
    assert.match(html, /id="tab_resumo"[^>]*tabindex="0"/);
    assert.match(html, /id="tab_lancamentos"[^>]*tabindex="-1"/);
});

test('o gráfico tem itens focáveis com nome e o CSS respeita movimento reduzido', () => {
    S.estado = migrar({ versao: 7, categorias: cats, meses: [] });
    mesDoCalendario(new Date().getFullYear(), new Date().getMonth() + 1);
    assert.match(views.viewGeral(), /<g [^>]*tabindex="0" role="button" aria-label="Ver valores de/);
    assert.match(ler('src/input.css'), /@media \(prefers-reduced-motion: reduce\)[^}]*transition-duration: 0\.01ms/s);
});

test('só a tela do mês tem role="tab" (sem abas soltas pelo app)', () => {
    for (const f of fs.readdirSync(new URL('../js/', import.meta.url))) {
        const t = ler('js/' + f);
        if (f !== 'views.js' && f !== 'eventos.js') assert.ok(!t.includes('role="tab"'), f);
    }
});
