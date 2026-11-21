// Testes de design: tamanho mínimo, contraste, botões padronizados e navegação do celular.
import { els, cats } from './auxiliar.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const raiz = new URL('../', import.meta.url);
const ler = f => fs.readFileSync(new URL(f, raiz), 'utf8');
const arquivosJs = fs.readdirSync(new URL('js/', raiz)).map(f => 'js/' + f);

const { S } = await import('../js/estado.js');
const { migrar } = await import('../js/dados.js');
const { mesDoCalendario } = await import('../js/calculos.js');
const views = await import('../js/views.js');
const render = await import('../js/render.js');
const { ACOES } = await import('../js/mapa.js');

const agora = new Date();
const A = agora.getFullYear(), M = agora.getMonth() + 1;

beforeEach(() => {
    S.estado = migrar({ versao: 6, saldoInicial: 0, categorias: cats, contasFixas: [], meses: [] });
    S.abaAtiva = 'resumo_geral'; S.ultimoMes = null;
    S.filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
});

// Razão de contraste do WCAG entre duas cores #rrggbb
function luz(hex) {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('fonte nunca abaixo de 12 px (sem text-[10px] nem text-[11px])', () => {
    for (const f of [...arquivosJs, 'index.html']) assert.ok(!/text-\[1[01]px\]/.test(ler(f)), f + ' usa fonte menor que 12 px');
});

test('cores principais passam no contraste mínimo de 4,5:1', () => {
    const pares = [
        ['botão principal', '#ffffff', '#0369a1'], ['botão principal ao passar o mouse', '#ffffff', '#075985'],
        ['botão de perigo', '#ffffff', '#be123c'], ['botão de perigo suave', '#be123c', '#fff1f2'],
        ['botão secundário', '#334155', '#f1f5f9'], ['valor de receita', '#047857', '#ffffff'],
        ['valor de investimento', '#0e7490', '#ffffff'], ['valor de gasto', '#e11d48', '#ffffff'],
        ['texto de apoio', '#64748b', '#ffffff'], ['chip de trimestre', '#475569', '#f1f5f9'],
        ['aviso de backup', '#92400e', '#fffbeb']
    ];
    for (const [nome, fg, bg] of pares) assert.ok(contraste(fg, bg) >= 4.5, `${nome}: ${contraste(fg, bg).toFixed(2)}`);
});

test('as cores do CSS dos botões são as que o teste de contraste confere', () => {
    const css = ler('src/input.css');
    assert.match(css, /\.btn-primario \{ background: #0369a1; color: #fff; \}/);
    assert.match(css, /\.btn-perigo \{ background: #be123c; color: #fff; \}/);
    assert.match(css, /\.btn-perigo-suave \{ background: #fff1f2; color: #be123c; \}/);
});

test('classes de cor de baixo contraste não são mais usadas', () => {
    const proibidas = ['text-emerald-600', 'text-cyan-600', 'text-rose-500', 'text-slate-400', 'bg-emerald-600', 'bg-sky-600'];
    for (const f of [...arquivosJs, 'index.html']) {
        const t = ler(f);
        for (const p of proibidas) assert.ok(!t.includes(p), `${f} usa ${p}`);
    }
});

test('CSS garante 44 px de altura nos controles do celular', () => {
    const css = ler('src/input.css');
    assert.match(css, /--alvo: 2\.75rem/);
    assert.match(css, /@media \(max-width: 767px\) \{[^}]*min-height: var\(--alvo\)/s);
    assert.match(css, /\.btn \{[^}]*min-height: var\(--alvo\)/);
    assert.match(css, /\.chip \{[^}]*min-height: var\(--alvo\)/);
});

test('todo botão das telas usa um dos 3 níveis (btn ou btn-icone)', () => {
    const mes = mesDoCalendario(A, M);
    mes.lancamentos.push({ id: 'l', data: `${A}-${String(M).padStart(2, '0')}-02`, categoriaId: 'Lazer', descricao: 'x', valor: 100, pagamento: '', grupo: null, parcela: '', fixaId: '' });
    S.estado.contasFixas.push({ id: 'f', descricao: 'Aluguel', valor: 100, categoriaId: 'Lazer', tipo: 'gasto', dia: 5, inicio: `${A}-01`, fim: '', pagamento: '' });
    const telas = [views.viewGeral(), views.viewMes(mes), views.viewFixas(), views.viewConfig(), views.viewAjustes(), views.renderLista(mes), views.avisoBackup()];
    for (const html of telas) {
        for (const m of html.matchAll(/<button\b([^>]*)>/g)) {
            const cls = (m[1].match(/class="([^"]*)"/) || ['', ''])[1].split(/\s+/);
            assert.ok(cls.includes('btn') || cls.includes('btn-icone'), 'botão fora do padrão: ' + m[1].slice(0, 100));
        }
    }
});

test('botões de ícone têm nome acessível', () => {
    const mes = mesDoCalendario(A, M);
    mes.receitas.push({ id: 'r', descricao: 'Salário', valor: 100, fixaId: '' });
    const html = views.viewMes(mes);
    for (const m of html.matchAll(/<button\b([^>]*)>\s*(<svg[\s\S]*?<\/svg>)\s*<\/button>/g)) {
        assert.match(m[1], /aria-label="[^"]+"/, 'botão só com ícone sem aria-label');
    }
});

test('formulário do mês: valor primeiro, categoria e pagamento em botões de escolha, estorno e erro', () => {
    const mes = mesDoCalendario(A, M);
    const html = views.viewMes(mes);
    assert.ok(html.indexOf('novoValor_') < html.indexOf('novoDesc_'), 'o valor vem antes da descrição');
    assert.match(html, new RegExp(`name="novoCat_${mes.id}"`));
    assert.match(html, new RegExp(`name="novaPag_${mes.id}"`));
    assert.ok(!html.includes(`<select id="novoCat_${mes.id}"`), 'categoria não é mais lista suspensa');
    assert.match(html, new RegExp(`id="novoEstorno_${mes.id}"`));
    assert.match(html, new RegExp(`id="erroLanc_${mes.id}"[^>]*role="alert"`));
    const radios = [...html.matchAll(/<input type="radio"[^>]*id="([^"]+)"/g)].map(m => m[1]);
    for (const id of radios) assert.ok(html.includes(`for="${id}"`), 'radio sem rótulo: ' + id);
});

test('chips: nomes de categoria são escapados', () => {
    S.estado.categorias[0].nome = '<b>x</b> (y)';
    const html = views.chipsRadio('c', [{ valor: 'a"b', rotulo: 'ok' }], 'a"b');
    assert.ok(html.includes('value="a&quot;b"'));
    const tela = views.viewMes(mesDoCalendario(A, M));
    assert.ok(!tela.includes('<b>x</b>'));
});

test('barra inferior: 4 destinos, o ativo marcado e todos ligados a ações permitidas', () => {
    mesDoCalendario(A, M);
    S.abaAtiva = 'resumo_geral';
    render.renderizarBarra();
    const html = els.barraInferior.innerHTML;
    for (const rotulo of ['Início', 'Mês', 'Fixas', 'Mais']) assert.ok(html.includes(`<span>${rotulo}</span>`), rotulo);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    for (const m of html.matchAll(/data-click="(\w+)"/g)) assert.equal(typeof ACOES[m[1]], 'function', m[1]);
});

test('barra inferior marca "Mês" quando um mês está aberto e "Fixas" na tela de contas fixas', () => {
    const m = mesDoCalendario(A, M);
    S.abaAtiva = m.id; render.renderizarBarra();
    assert.match(els.barraInferior.innerHTML, /aria-current="page"[^>]*>[\s\S]*?<span>Mês<\/span>/);
    S.abaAtiva = 'fixas'; render.renderizarBarra();
    assert.match(els.barraInferior.innerHTML, /aria-current="page"[^>]*>[\s\S]*?<span>Fixas<\/span>/);
});

test('botão Mês volta ao último mês visto, ou ao mês atual', () => {
    const atual = mesDoCalendario(A, M);
    const outro = mesDoCalendario(A + 1, 2);
    S.renderizar = () => {};
    render.irParaMes();
    assert.equal(S.abaAtiva, atual.id, 'sem histórico vai para o mês atual');
    render.trocarAba(outro.id);
    render.trocarAba('fixas');
    render.irParaMes();
    assert.equal(S.abaAtiva, outro.id, 'volta ao último mês visto');
});

test('mês anterior e seguinte seguem a ordem do calendário', () => {
    S.renderizar = () => {};
    const a = mesDoCalendario(A, 5), b = mesDoCalendario(A, 6), c = mesDoCalendario(A, 7);
    S.estado.meses.reverse();
    S.abaAtiva = b.id;
    render.mesSeguinte();
    assert.equal(S.abaAtiva, c.id);
    render.mesAnterior(); render.mesAnterior();
    assert.equal(S.abaAtiva, a.id);
    render.mesAnterior();
    assert.equal(S.abaAtiva, a.id, 'no primeiro mês não anda para trás');
});

test('cabeçalho do mês: seletor com todos os meses e setas desligadas nas pontas', () => {
    const a = mesDoCalendario(A, 5), b = mesDoCalendario(A, 6);
    const primeiro = views.viewMes(a), ultimo = views.viewMes(b);
    assert.match(primeiro, /aria-label="Ir para outro mês"/);
    assert.equal((primeiro.match(/<option value="m_/g) || []).length >= 2, true);
    assert.match(primeiro, /aria-label="Mês anterior"[^>]*disabled/);
    assert.ok(!/aria-label="Próximo mês"[^>]*disabled/.test(primeiro));
    assert.match(ultimo, /aria-label="Próximo mês"[^>]*disabled/);
});

test('visão geral: tabela no computador e cartões no celular', () => {
    mesDoCalendario(A, M).receitas.push({ id: 'r', descricao: 'Salário', valor: 100000, fixaId: '' });
    const html = views.viewGeral();
    assert.match(html, /class="hidden md:block overflow-x-auto"/);
    assert.match(html, /class="md:hidden space-y-3"/);
    assert.ok(html.includes('Saldo acumulado'));
});

test('lista: gasto com sinal de menos, estorno com mais e investimento com seta', () => {
    const mes = mesDoCalendario(A, M);
    const base = { data: `${A}-${String(M).padStart(2, '0')}-02`, descricao: 'x', pagamento: '', grupo: null, parcela: '', fixaId: '' };
    mes.lancamentos.push({ id: 'g', categoriaId: 'Lazer', valor: 2500, ...base }, { id: 'e', categoriaId: 'Lazer', valor: -1000, ...base }, { id: 'i', categoriaId: 'Investimentos', valor: 5000, ...base });
    const html = views.renderLista(mes);
    assert.match(html, /-R\$\u00a025,00/);
    assert.match(html, /\+R\$\u00a010,00/);
    assert.match(html, /↗ R\$\u00a050,00/);
});

test('o CSS põe números com a mesma largura para alinhar valores', () => {
    assert.match(ler('src/input.css'), /font-variant-numeric: tabular-nums/);
});

test('não sobrou JavaScript para posicionar elementos (layout vem do CSS)', () => {
    assert.ok(!ler('js/render.js').includes('aplicarLayout'));
    for (const marca of ['data-safe', 'data-fab', 'data-toast', 'data-puxador']) assert.ok(!ler('index.html').includes(marca), marca);
});

test('index.html tem barra inferior, campos de estorno e erro do lançamento rápido', () => {
    const html = ler('index.html');
    assert.match(html, /id="barraInferior"/);
    assert.match(html, /id="rapEstorno"/);
    assert.match(html, /id="rapErro"[^>]*role="alert"/);
    assert.match(html, /id="rapCat" role="radiogroup"/);
});
