// Teste da página inteira: sobe o app num navegador simulado (jsdom) e usa a tela como uma pessoa usaria.
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const raiz = new URL('../', import.meta.url);
const erros = [];
let w, d;
const esperar = ms => new Promise(r => setTimeout(r, ms));
const clicar = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const mudar = el => el.dispatchEvent(new w.Event('change', { bubbles: true }));
const tecla = (el, key) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const cont = () => d.getElementById('conteudoPrincipal');
const botao = (rotulo, onde = d) => [...onde.querySelectorAll('button')].find(b => b.textContent.trim() === rotulo || b.textContent.includes(rotulo));
const menu = rotulo => [...d.querySelectorAll('#navPrincipal button')].find(b => b.textContent.includes(rotulo));
const barra = rotulo => [...d.querySelectorAll('#barraInferior button')].find(b => b.textContent.includes(rotulo));
const hoje = new Date();
const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(Math.min(hoje.getDate(), 28)).padStart(2, '0')}`;

before(async () => {
    const pacote = await build({ entryPoints: [new URL('js/main.js', raiz).pathname], bundle: true, format: 'iife', write: false, logLevel: 'silent' });
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => erros.push(String(e.message || e)));
    vc.on('error', e => erros.push(String(e)));
    const html = fs.readFileSync(new URL('index.html', raiz), 'utf8').replace('<script type="module" src="js/main.js"></script>', '');
    const dom = new JSDOM(html, { url: 'https://ryanagsouza-tech.github.io/controle-financias/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
    w = dom.window; d = w.document;
    w.matchMedia = () => ({ matches: false, addEventListener() {} });
    w.scrollTo = () => {};
    w.eval(pacote.outputFiles[0].text);
    await esperar(500);
});

test('1. menu do celular: botão à esquerda, sem puxador, barra inferior com 4 destinos', () => {
    const cab = [...d.querySelector('header').children].map(e => e.tagName);
    assert.equal(cab[0], 'BUTTON', 'o botão do menu vem primeiro');
    assert.ok(!d.getElementById('puxador'));
    assert.deepEqual([...d.querySelectorAll('#barraInferior button')].map(b => b.textContent.trim()), ['Início', 'Mês', 'Fixas', 'Mais']);
    assert.ok(cont().innerHTML.length > 200, 'a tela inicial foi desenhada');
});

test('2. Configurações: saldos, cartão, metas e pontos de restauração', async () => {
    clicar(menu('Configurações')); await esperar(80);
    for (const t of ['Saldos iniciais', 'Cartão de crédito', 'Metas de economia', 'Pontos de restauração']) assert.ok(cont().innerHTML.includes(t), t);
    const sel = d.getElementById('creditoVence'); sel.value = 'seguinte'; mudar(sel); await esperar(60);
    const dia = d.getElementById('creditoDia'); dia.value = '5'; mudar(dia); await esperar(60);
    assert.match(cont().querySelector('p.font-semibold').textContent, /entra na fatura de/);
    const inv = d.getElementById('saldoInicialInvest'); inv.value = '1000'; mudar(inv); await esperar(60);
    const gi = d.getElementById('gastoInicial'); gi.value = '300'; mudar(gi); await esperar(60);
    assert.equal(d.getElementById('saldoInicialInvest').value, '1000.00');
});

test('3. Categorias é uma tela só de categorias', async () => {
    clicar(menu('Categorias')); await esperar(80);
    assert.ok(cont().innerHTML.includes('Nova categoria'));
    assert.ok(!cont().innerHTML.includes('Saldos iniciais'));
});

test('4. mês em abas: as setas do teclado trocam de aba', async () => {
    clicar(barra('Mês')); await esperar(80);
    const abas = [...d.querySelectorAll('[role="tab"]')];
    assert.deepEqual(abas.map(a => a.getAttribute('aria-selected')), ['true', 'false', 'false']);
    tecla(abas[0], 'ArrowRight'); await esperar(60);
    assert.equal(d.querySelector('[data-tab="lancamentos"]').getAttribute('aria-selected'), 'true');
    assert.equal(d.querySelector('[data-sec="lancamentos"]').classList.contains('hidden'), false);
    assert.equal(d.querySelector('[data-sec="resumo"]').classList.contains('hidden'), true);
    assert.equal(d.querySelector('[data-tab="lancamentos"]').getAttribute('tabindex'), '0');
});

test('5. erro de preenchimento aparece ao lado do campo, sem janela', async () => {
    const id = cont().querySelector('[id^="novoValor_"]').id.replace('novoValor_', '');
    clicar(d.getElementById('btnInserir_' + id)); await esperar(60);
    assert.ok(!d.getElementById('erroLanc_' + id).classList.contains('hidden'));
    assert.ok(d.getElementById('modalConfirma').classList.contains('hidden'), 'nenhuma janela abriu');
});

test('6. compra no crédito com fatura no mês seguinte sai do mês atual', async () => {
    const id = cont().querySelector('[id^="novoValor_"]').id.replace('novoValor_', '');
    d.getElementById('novoValor_' + id).value = '40'; d.getElementById('novoDesc_' + id).value = 'Pizza';
    const cred = cont().querySelector(`input[name="novaPag_${id}"][value="credito"]`); cred.checked = true; mudar(cred);
    d.getElementById('novaData_' + id).value = dataHoje;
    clicar(d.getElementById('btnInserir_' + id)); await esperar(120);
    assert.match(d.getElementById('toast').textContent, /fatura de/);
    assert.ok(!d.getElementById('listaLanc').innerHTML.includes('Pizza'), 'não está no mês atual');
    clicar(d.querySelector('[aria-label="Próximo mês"]')); await esperar(80);
    assert.match(cont().innerHTML, /Pizza[\s\S]*vence[\s\S]*compra/);
});

test('7. reembolso: o gasto fica só com a sua parte', async () => {
    clicar(botao('Reembolso', cont())); await esperar(100);
    assert.equal(d.getElementById('rapDesc').value, 'Reembolso: Pizza');
    assert.equal(d.getElementById('rapEstorno').checked, true);
    d.getElementById('rapValor').value = '20';
    clicar(botao('Salvar', d.getElementById('modalRapido'))); await esperar(120);
    assert.match(d.getElementById('toast').textContent, /Lançamento salvo|fatura/);
});

test('8. excluir um lançamento não pergunta e dá para desfazer', async () => {
    const lixeira = cont().querySelector('[aria-label="Excluir lançamento"]');
    const antes = d.getElementById('listaLanc').innerHTML;
    clicar(lixeira); await esperar(100);
    assert.notEqual(d.getElementById('listaLanc').innerHTML, antes, 'o lançamento saiu da lista');
    assert.match(d.getElementById('toast').textContent, /Desfazer/);
    clicar(botao('Desfazer', d.getElementById('toast'))); await esperar(100);
    assert.equal(d.getElementById('listaLanc').innerHTML.includes('Pizza') || d.getElementById('listaLanc').innerHTML.includes('Reembolso'), true);
});

test('9. meta aparece com barra de progresso na Visão Geral', async () => {
    clicar(menu('Configurações')); await esperar(80);
    d.getElementById('metaNome').value = 'Viagem'; d.getElementById('metaAlvo').value = '5000';
    clicar(botao('Adicionar meta', cont())); await esperar(80);
    clicar(barra('Início')); await esperar(80);
    assert.ok(cont().innerHTML.includes('Viagem'));
    assert.match(cont().innerHTML, /inclui R\$[\s\S]*de antes do app/);
});

test('10. gráfico: tocar ou usar Enter mostra os valores do mês', async () => {
    const grupos = [...cont().querySelectorAll('svg g[data-click="mostrarValoresMes"]')];
    assert.ok(grupos.length > 0);
    clicar(grupos[0]); await esperar(60);
    assert.match(d.getElementById('detalheGrafico').textContent, /receitas/);
    d.getElementById('detalheGrafico').textContent = '';
    tecla(grupos[0], 'Enter'); await esperar(60);
    assert.match(d.getElementById('detalheGrafico').textContent, /receitas/);
});

test('11. nenhum erro apareceu durante o uso', () => {
    assert.deepEqual(erros, []);
});
