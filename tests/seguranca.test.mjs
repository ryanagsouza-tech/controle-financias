// Testes de segurança: nenhum texto do usuário vira código, e o HTML não tem JavaScript embutido.
import { tagsEAtributos } from './auxiliar.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const raiz = new URL('../', import.meta.url);
const ler = f => fs.readFileSync(new URL(f, raiz), 'utf8');

const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { ev, esc } = await import('../js/util.js');
const views = await import('../js/views.js');
const { ACOES } = await import('../js/mapa.js');

const HOSTIL = '"><img src=x onerror=alert(1)><script>alert(2)</script>';

function estadoHostil() {
    S.estado = migrar({
        versao: 6, saldoInicial: 0,
        categorias: [{ id: 'Lazer', nome: HOSTIL, cor: '#10b981', tipo: 'gasto', orcamento: 0 }],
        contasFixas: [{ id: 'f1', descricao: HOSTIL, valor: 1000, categoriaId: 'Lazer', tipo: 'gasto', dia: 5, inicio: '2026-11', fim: '', pagamento: '' }],
        meses: [{ id: 'm_2026_11', ano: 2026, mes: 11, nome: HOSTIL, receitas: [{ id: 'r1', descricao: HOSTIL, valor: 100000 }], fixasAplicadas: [],
            lancamentos: [{ id: 'l1', data: '2026-11-02', categoriaId: 'Lazer', descricao: HOSTIL, valor: 5000, pagamento: 'credito', grupo: null, parcela: '', fixaId: '' }] }]
    });
    S.abaAtiva = 'm_2026_11';
}

function todasAsTelas() {
    estadoHostil();
    return {
        geral: views.viewGeral(), fixas: views.viewFixas(), config: views.viewConfig(),
        mes: views.viewMes(S.estado.meses[0]), tri: views.viewTrimestre('2026-T4')
    };
}

const PROIBIDAS = ['script', 'img', 'iframe', 'object', 'embed', 'link', 'meta', 'style', 'base', 'form'];

test('texto hostil é escapado em todas as telas (nenhuma tag nova aparece)', () => {
    for (const [nome, html] of Object.entries(todasAsTelas())) {
        const usadas = tagsEAtributos(html).map(t => t.tag);
        for (const p of PROIBIDAS) assert.ok(!usadas.includes(p), nome + ': tag <' + p + '> apareceu');
        assert.ok(!html.includes('<img'), nome + ': <img> sem escape');
        assert.ok(!html.includes('<script'), nome + ': <script> sem escape');
    }
});

test('nenhuma tela usa handlers inline, style= nem javascript: nos atributos', () => {
    for (const [nome, html] of Object.entries(todasAsTelas())) {
        for (const { tag, attrs } of tagsEAtributos(html)) {
            for (const a of attrs) {
                assert.ok(!/^on/.test(a), nome + ': <' + tag + '> tem o atributo ' + a);
                assert.notEqual(a, 'style', nome + ': <' + tag + '> tem style=');
            }
        }
        assert.ok(!/href\s*=\s*["']?\s*javascript:/i.test(html), nome + ': tem href javascript:');
    }
});

test('todo data-click, data-change, data-input e data-enter aponta para uma ação permitida', () => {
    const fontes = Object.values(todasAsTelas()).join('\n') + ler('index.html') + ler('js/render.js') + ler('js/ui.js');
    const nomes = new Set([...fontes.matchAll(/data-(?:click|change|input|enter)="(\w+)"/g)].map(m => m[1]));
    for (const n of ['trocarAba', 'alternarAno', 'adicionarLanc', 'removerLanc', 'desfazer']) nomes.add(n);
    for (const nome of nomes) assert.equal(typeof ACOES[nome], 'function', 'ação sem função no mapa: ' + nome);
});

test('o mapa de ações é imutável', () => {
    assert.ok(Object.isFrozen(ACOES));
});

test('argumentos de ev() ficam escapados dentro do atributo', () => {
    const attr = ev('click', 'trocarAba', '"><b>x</b>');
    assert.ok(!attr.includes('<b>'));
    assert.ok(!/"\s*>/.test(attr.replace(/^data-click="trocarAba"/, '')));
    assert.equal(esc('<>&"\''), '&lt;&gt;&amp;&quot;&#39;');
});

test('index.html: política de segurança, sem scripts nem handlers nem estilos embutidos', () => {
    const html = ler('index.html');
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/);
    assert.ok(csp, 'sem política de segurança');
    assert.match(csp[1], /script-src 'self'(;|$)/);
    assert.ok(!/unsafe-inline|unsafe-eval/.test(csp[1]), 'a política não pode liberar inline nem eval');
    assert.match(csp[1], /object-src 'none'/);
    for (const { tag, attrs } of tagsEAtributos(html)) {
        if (tag === 'script') assert.ok(attrs.includes('src'), 'tem <script> embutido');
        for (const a of attrs) {
            assert.ok(!/^on/.test(a), '<' + tag + '> tem o atributo ' + a);
            assert.notEqual(a, 'style', '<' + tag + '> tem style=');
        }
    }
    assert.match(html, /<script type="module" src="js\/main.js"><\/script>/);
});

test('o código não usa eval, new Function nem document.write', () => {
    for (const f of fs.readdirSync(new URL('js/', raiz))) {
        const t = ler('js/' + f).replace(/\/\/[^\n]*/g, '');
        assert.ok(!/\beval\s*\(/.test(t), f + ': usa eval');
        assert.ok(!/new\s+Function\s*\(/.test(t), f + ': usa new Function');
        assert.ok(!/document\.write\s*\(/.test(t), f + ': usa document.write');
    }
});

test('cores e larguras vindas dos dados só são aplicadas se tiverem formato válido', async () => {
    const { aplicarEstilos } = await import('../js/ui.js');
    const ok = { dataset: { bg: '#10b981', larg: '150', cor: 'red; background:url(x)' }, style: {} };
    const raizFalsa = { querySelectorAll: s => (s === '[data-bg]' ? [ok] : s === '[data-larg]' ? [ok] : [ok]) };
    aplicarEstilos(raizFalsa);
    assert.equal(ok.style.backgroundColor, '#10b981');
    assert.equal(ok.style.width, '100%');
    assert.equal(ok.style.color, undefined, 'cor inválida não pode ser aplicada');
});
