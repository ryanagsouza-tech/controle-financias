// Testes dos recursos da versão 4.3: cartão de crédito, saldos iniciais, reembolso, metas, abas do mês e gráfico.
import { els, elemento, cats, escolher, janela } from './auxiliar.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const raiz = new URL('../', import.meta.url);
const ler = f => fs.readFileSync(new URL(f, raiz), 'utf8');

const { S } = await import('../js/estado.js');
const { migrar, normalizarCredito } = await import('../js/dados.js');
const calc = await import('../js/calculos.js');
const { mesDoCalendario, achaMes, dataDeCobranca, progressoMeta, acumulados, totais } = calc;
const views = await import('../js/views.js');
const a = await import('../js/acoes.js');
const ui = await import('../js/ui.js');

const agora = new Date();
const A = agora.getFullYear(), M = agora.getMonth() + 1;
const p2 = n => String(n).padStart(2, '0');
const mesId = (ano, mes) => `m_${ano}_${p2(mes)}`;
const campo = (id, valor) => { els[id] = els[id] || elemento(); els[id].value = valor; };

const novo = extra => migrar({ versao: 7, saldoInicial: 0, categorias: cats, contasFixas: [], meses: [], ...extra });
beforeEach(() => {
    S.renderizar = () => {};
    S.estado = novo();
    S.desfazerSnap = null;
    S.abaMes = 'resumo';
    janela.respostas = []; janela.avisos = []; janela.textos = [];
});

// ---------- cartão de crédito ----------
test('crédito, jeito antigo (vence no mesmo mês, sem fechamento): usa a data da compra', () => {
    const r = dataDeCobranca('2026-11-20', { vence: 'mesmo', diaVencimento: 5, diaFechamento: 0 });
    assert.deepEqual(r, { ano: 2026, mes: 11, data: '2026-11-20', compra: '' });
});

test('crédito com fatura no mês seguinte: compra de 20/11 vence em 05/12', () => {
    const r = dataDeCobranca('2026-11-20', { vence: 'seguinte', diaVencimento: 5, diaFechamento: 0 });
    assert.deepEqual(r, { ano: 2026, mes: 12, data: '2026-12-05', compra: '2026-11-20' });
});

test('crédito: dezembro vira janeiro do ano seguinte', () => {
    const r = dataDeCobranca('2026-12-20', { vence: 'seguinte', diaVencimento: 5, diaFechamento: 0 });
    assert.equal(r.data, '2027-01-05');
    assert.equal(r.ano, 2027);
});

test('crédito com fechamento: compra depois do fechamento entra na fatura seguinte', () => {
    const cfg = { vence: 'seguinte', diaVencimento: 5, diaFechamento: 25 };
    assert.equal(dataDeCobranca('2026-11-20', cfg).data, '2026-12-05');
    assert.equal(dataDeCobranca('2026-11-28', cfg).data, '2027-01-05');
});

test('crédito: dia de vencimento 31 em fevereiro vira dia 28', () => {
    const r = dataDeCobranca('2026-01-10', { vence: 'seguinte', diaVencimento: 31, diaFechamento: 0 });
    assert.equal(r.data, '2026-02-28');
});

test('configuração do cartão inválida volta para valores seguros', () => {
    assert.deepEqual(normalizarCredito(null), { vence: 'mesmo', diaVencimento: 5, diaFechamento: 0 });
    assert.deepEqual(normalizarCredito({ vence: 'x', diaVencimento: 99, diaFechamento: -3 }), { vence: 'mesmo', diaVencimento: 31, diaFechamento: 0 });
});

async function lancarCredito(desc, valor, data, parc = '1', pag = 'credito') {
    const id = mesId(A, M);
    campo('novaData_' + id, data); escolher('novoCat_' + id, 'Alimentacao'); campo('novoDesc_' + id, desc);
    campo('novoValor_' + id, valor); escolher('novaPag_' + id, pag); campo('novaParc_' + id, parc);
    els['novoEstorno_' + id] = els['novoEstorno_' + id] || elemento(); els['novoEstorno_' + id].checked = false;
    a.adicionarLanc(id);
}

test('compra no crédito com fatura no mês seguinte vai para o mês seguinte, não para o atual', async () => {
    S.estado.credito = { vence: 'seguinte', diaVencimento: 5, diaFechamento: 0 };
    mesDoCalendario(A, M);
    const data = `${A}-${p2(M)}-20`;
    await lancarCredito('Pizza', '40', data);
    assert.equal(achaMes(mesId(A, M)).lancamentos.length, 0, 'não entra no gasto deste mês');
    const prox = M === 12 ? mesId(A + 1, 1) : mesId(A, M + 1);
    const l = achaMes(prox).lancamentos[0];
    assert.equal(l.valor, 4000);
    assert.equal(l.compra, data);
    assert.match(l.data, /-05$/);
    assert.match(els.toast.innerHTML, /fatura de/);
});

test('compra no crédito parcelada começa na fatura seguinte e segue mês a mês', () => {
    S.estado.credito = { vence: 'seguinte', diaVencimento: 5, diaFechamento: 0 };
    calc.gerarSerie('2026-11-20', 'Lazer', 'TV', 30000, 'credito', 3);
    const datas = S.estado.meses.flatMap(m => m.lancamentos).map(l => l.data).sort();
    assert.deepEqual(datas, ['2026-12-05', '2027-01-05', '2027-02-05']);
});

test('Pix e débito não são afetados pela configuração do cartão', async () => {
    S.estado.credito = { vence: 'seguinte', diaVencimento: 5, diaFechamento: 0 };
    mesDoCalendario(A, M);
    await lancarCredito('Lanche', '10', `${A}-${p2(M)}-20`, '1', 'pix');
    assert.equal(achaMes(mesId(A, M)).lancamentos.length, 1);
});

test('tela do cartão mostra o exemplo e salva as escolhas', () => {
    a.definirCredito('vence', 'seguinte');
    a.definirCredito('diaVencimento', '10');
    a.definirCredito('diaFechamento', '25');
    assert.deepEqual(S.estado.credito, { vence: 'seguinte', diaVencimento: 10, diaFechamento: 25 });
    assert.match(views.blocoCartao(), /entra na fatura de/);
    a.definirCredito('vence', 'mesmo'); a.definirCredito('diaFechamento', '');
    assert.match(views.blocoCartao(), /mesmo mês em que foi feita/);
});

test('lista mostra o vencimento e a data da compra no crédito', async () => {
    S.estado.credito = { vence: 'seguinte', diaVencimento: 5, diaFechamento: 0 };
    mesDoCalendario(A, M);
    await lancarCredito('Pizza', '40', `${A}-${p2(M)}-20`);
    const prox = achaMes(M === 12 ? mesId(A + 1, 1) : mesId(A, M + 1));
    S.filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
    assert.match(views.renderLista(prox), /vence \d\d\/\d\d\/\d{4} · compra 20\//);
});

// ---------- saldos iniciais ----------
test('saldos iniciais de investimento e de gasto são gravados em centavos', () => {
    a.definirSaldoInicialInvest('1500,50');
    a.definirGastoInicial('300');
    assert.equal(S.estado.saldoInicialInvest, 150050);
    assert.equal(S.estado.gastoInicial, 30000);
});

test('investido inicial entra no investido acumulado e no patrimônio', () => {
    a.definirSaldoInicialInvest('1000');
    a.definirSaldoInicial('500');
    const m = mesDoCalendario(A, M);
    const acc = acumulados()[m.id];
    assert.equal(acc.invAcum, 100000);
    assert.equal(acc.patrimonio, 50000 + 100000);
});

test('visão geral soma o gasto inicial ao total de gastos e avisa', () => {
    a.definirGastoInicial('300');
    mesDoCalendario(A, M);
    const html = views.viewGeral();
    assert.match(html, /inclui R\$\u00a0300,00 de antes do app/);
});

test('tela de categorias tem os três saldos iniciais', () => {
    const html = views.viewConfig();
    for (const id of ['saldoInicial', 'saldoInicialInvest', 'gastoInicial']) assert.ok(html.includes(`id="${id}"`), id);
});

test('dados antigos migram com saldos iniciais em zero e cartão no jeito antigo', () => {
    const m = migrar({ versao: 6, saldoInicial: 100000, categorias: cats, contasFixas: [], meses: [] });
    assert.equal(m.saldoInicialInvest, 0);
    assert.equal(m.gastoInicial, 0);
    assert.equal(m.credito.vence, 'mesmo');
    assert.deepEqual(m.metas, []);
});

// ---------- reembolso (pizza dividida) ----------
test('reembolso: paguei 40, o amigo devolveu 20, o gasto fica em 20 e não vira renda', () => {
    const mes = mesDoCalendario(A, M);
    mes.lancamentos.push({ id: 'p', data: `${A}-${p2(M)}-10`, categoriaId: 'Alimentacao', descricao: 'Pizza', valor: 4000, pagamento: 'pix', grupo: null, parcela: '', fixaId: '', compra: '' });
    a.reembolsar(mes.id, 'p');
    assert.equal(els.rapDesc.value, 'Reembolso: Pizza');
    assert.equal(els.rapEstorno.checked, true);
    campo('rapValor', '20'); campo('rapData', `${A}-${p2(M)}-12`); campo('rapParc', '1');
    a.salvarRapido();
    const t = totais(mes);
    assert.equal(t.gastos, 2000, 'o gasto líquido é a sua parte');
    assert.equal(t.receitas, 0, 'o reembolso não conta como renda');
    assert.equal(mes.lancamentos.find(l => l.descricao === 'Reembolso: Pizza').valor, -2000);
});

test('o botão Reembolso aparece nos gastos e não nos investimentos', () => {
    const mes = mesDoCalendario(A, M);
    const base = { data: `${A}-${p2(M)}-10`, descricao: 'x', pagamento: '', grupo: null, parcela: '', fixaId: '', compra: '' };
    mes.lancamentos.push({ id: 'g', categoriaId: 'Alimentacao', valor: 4000, ...base }, { id: 'i', categoriaId: 'Investimentos', valor: 5000, ...base });
    S.filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
    const html = views.renderLista(mes);
    assert.equal((html.match(/>Reembolso<\/button>/g) || []).length, 1);
});

test('reembolso de uma parcela usa o nome sem o (1/3)', () => {
    const mes = mesDoCalendario(A, M);
    mes.lancamentos.push({ id: 'p', data: `${A}-${p2(M)}-10`, categoriaId: 'Alimentacao', descricao: 'TV (1/3)', valor: 1000, pagamento: 'credito', grupo: 'g', parcela: '1/3', fixaId: '', compra: '' });
    a.reembolsar(mes.id, 'p');
    assert.equal(els.rapDesc.value, 'Reembolso: TV');
});

// ---------- metas ----------
const meta = extra => ({ id: 'g1', nome: 'Viagem', alvo: 10000, inicial: 2000, categoriaId: 'Investimentos', prazo: '', ...extra });
const aporte = (mes, valor) => mes.lancamentos.push({ id: 'a' + Math.random(), data: `${mes.ano}-${p2(mes.mes)}-02`, categoriaId: 'Investimentos', descricao: 'Aporte', valor, pagamento: '', grupo: null, parcela: '', fixaId: '', compra: '' });

test('meta: soma o inicial e os aportes até o mês atual, ignorando meses futuros', () => {
    aporte(mesDoCalendario(A, M), 3000);
    aporte(mesDoCalendario(A + 1, 6), 5000);
    const p = progressoMeta(meta());
    assert.equal(p.guardado, 5000);
    assert.equal(p.falta, 5000);
    assert.equal(p.pct, 50);
    assert.equal(p.concluida, false);
});

test('meta atingida e meta com prazo (quanto guardar por mês)', () => {
    aporte(mesDoCalendario(A, M), 9000);
    assert.equal(progressoMeta(meta()).concluida, true);
    S.estado.meses = [];
    aporte(mesDoCalendario(A, M), 1000);
    const fim = new Date(A, M - 1 + 4, 1);
    const prazo = `${fim.getFullYear()}-${p2(fim.getMonth() + 1)}`;
    const p = progressoMeta(meta({ prazo }));
    assert.equal(p.mesesRestantes, 5);
    assert.equal(p.porMes, Math.ceil(7000 / 5));
});

test('adicionar meta valida os campos e grava', () => {
    ['metaNome', 'metaAlvo', 'metaInicial', 'metaCat', 'metaPrazo', 'erroMeta'].forEach(i => campo(i, ''));
    a.adicionarMeta();
    assert.match(els.erroMeta.textContent, /nome/);
    campo('metaNome', 'Viagem'); campo('metaAlvo', '5000'); campo('metaCat', 'Investimentos'); campo('metaInicial', '100');
    a.adicionarMeta();
    assert.equal(S.estado.metas.length, 1);
    assert.equal(S.estado.metas[0].alvo, 500000);
    assert.equal(S.estado.metas[0].inicial, 10000);
});

test('meta só aceita categoria de investimento', () => {
    ['metaNome', 'metaAlvo', 'metaInicial', 'metaCat', 'metaPrazo', 'erroMeta'].forEach(i => campo(i, ''));
    campo('metaNome', 'X'); campo('metaAlvo', '100'); campo('metaCat', 'Alimentacao');
    a.adicionarMeta();
    assert.equal(S.estado.metas.length, 0);
    assert.match(els.erroMeta.textContent, /investimento/);
});

test('editar e excluir meta (com desfazer)', () => {
    S.estado.metas.push(meta());
    a.editarMeta('g1', 'alvo', '200');
    a.editarMeta('g1', 'nome', '  Casa ');
    assert.equal(S.estado.metas[0].alvo, 20000);
    assert.equal(S.estado.metas[0].nome, 'Casa');
    a.removerMeta('g1');
    assert.equal(S.estado.metas.length, 0);
    ui.desfazer();
    assert.equal(S.estado.metas.length, 1);
});

test('Visão Geral mostra o progresso das metas com barra', () => {
    S.estado.metas.push(meta());
    aporte(mesDoCalendario(A, M), 3000);
    const html = views.viewGeral();
    assert.match(html, /Metas de economia/);
    assert.match(html, /data-larg="50"/);
    assert.match(html, /Faltam R\$\u00a050,00/);
});

test('sem metas não aparece o bloco na Visão Geral, e a tela de categorias tem o cadastro', () => {
    mesDoCalendario(A, M);
    assert.ok(!views.viewGeral().includes('Metas de economia'));
    assert.match(views.viewConfig(), /Metas de economia/);
});

test('meta com dados estranhos é normalizada', () => {
    const m = migrar({ versao: 7, categorias: cats, metas: [{ id: '<x>', nome: '', alvo: -5, categoriaId: 'Alimentacao', prazo: '2026-13' }, null] });
    assert.equal(m.metas.length, 1);
    assert.match(m.metas[0].id, /^[a-zA-Z0-9_-]+$/);
    assert.equal(m.metas[0].alvo, 0);
    assert.equal(m.metas[0].categoriaId, 'Investimentos');
    assert.equal(m.metas[0].prazo, '');
});

// ---------- abas do mês ----------
test('tela do mês tem 3 seções e só a aberta aparece no celular', () => {
    const mes = mesDoCalendario(A, M);
    const html = views.viewMes(mes);
    assert.match(html, /role="tablist"/);
    for (const s of ['resumo', 'lancamentos', 'receitas']) assert.match(html, new RegExp(`data-sec="${s}"`));
    assert.match(html, /data-sec="resumo" class=" md:block/);
    assert.match(html, /data-sec="lancamentos" class="hidden md:block/);
    assert.match(html, /data-sec="receitas" class="hidden md:block/);
});

test('trocar de aba só alterna as seções, sem redesenhar a tela', () => {
    const secoes = ['resumo', 'lancamentos', 'receitas'].map(s => Object.assign(elemento(), { dataset: { sec: s } }));
    const botoes = ['resumo', 'lancamentos', 'receitas'].map(s => Object.assign(elemento(), { dataset: { tab: s } }));
    const original = globalThis.document.querySelectorAll;
    globalThis.document.querySelectorAll = seletor => (seletor === '[data-sec]' ? secoes : seletor === '[data-tab]' ? botoes : []);
    try {
        a.abaDoMes('lancamentos');
    } finally { globalThis.document.querySelectorAll = original; }
    assert.equal(S.abaMes, 'lancamentos');
    assert.equal(secoes[1].classList.contains('hidden'), false);
    assert.equal(secoes[0].classList.contains('hidden'), true);
    assert.equal(botoes[1].classList.contains('btn-primario'), true);
    assert.equal(botoes[1].attrs['aria-selected'], 'true');
});

test('o formulário e a lista ficam juntos na seção Lançamentos e as receitas em Receitas', () => {
    const mes = mesDoCalendario(A, M);
    const html = views.viewMes(mes);
    const sec = nome => html.slice(html.indexOf(`data-sec="${nome}"`));
    const lanc = sec('lancamentos').slice(0, sec('lancamentos').indexOf('data-sec="receitas"'));
    assert.ok(lanc.includes('Novo lançamento') && lanc.includes('Lançamentos do mês'));
    assert.ok(sec('receitas').includes('Receitas do mês'));
    assert.ok(html.slice(0, html.indexOf('data-sec="lancamentos"')).includes('Gastos e orçamento'));
});

// ---------- gráfico ao toque ----------
test('cada mês do gráfico é um botão que mostra os valores ao tocar', () => {
    const mes = mesDoCalendario(A, M);
    mes.receitas.push({ id: 'r', descricao: 'Salário', valor: 100000, fixaId: '' });
    const html = views.viewGeral();
    assert.match(html, /role="button"[^>]*aria-label="Ver valores de/);
    assert.match(html, /data-click="mostrarValoresMes"/);
    assert.match(html, /id="detalheGrafico"/);
    a.mostrarValoresMes(mes.id);
    assert.match(els.detalheGrafico.textContent, /receitas R\$\u00a01\.000,00/);
});

// ---------- menu do celular ----------
test('menu do celular: botão à esquerda, sem puxador e sem gestos de arrastar', () => {
    const html = ler('index.html');
    assert.ok(!html.includes('puxador'), 'o puxador foi removido');
    const cab = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    assert.ok(cab.indexOf('toggleMobileSidebar') < cab.indexOf('<h1'), 'o botão do menu vem antes do título');
    for (const f of ['main.js', 'render.js', 'estado.js']) {
        const t = ler('js/' + f);
        assert.ok(!/touchstart|touchend|puxador|toqueX/.test(t), f + ' ainda tem gesto ou puxador');
    }
    assert.ok(!ler('src/input.css').includes('.puxador'));
});
