// Desenha as telas no DOM e controla a navegação.
import { ICONES, NOMES_MESES } from './constantes.js';
import { dataBR, esc, ev, hojeChave } from './util.js';
import { S } from './estado.js';
import { ehAbaTri, mesesCronologicos, rotuloTri, triDe } from './calculos.js';
import { lerSnapshots } from './armazenamento.js';
import { aplicarEstilos } from './ui.js';
import { avisoBackup, viewAjustes, viewConfig, viewFixas, viewGeral, viewMes, viewTrimestre } from './views.js';

export function renderizar() {
    try {
        validarAba();
        renderizarNav();
        renderizarBarra();
        renderizarConteudo();
        document.getElementById('avisoStorage').innerHTML = S.storageOk ? '' :
            '<div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">Este navegador não está permitindo salvar os dados. O que você lançar pode se perder ao fechar. Abra o arquivo no Chrome e use o botão Backup com frequência.</div>';
        document.getElementById('avisoBackup').innerHTML = avisoBackup();
        aplicarEstilos(document);
    } catch (err) {
        console.error(err);
        document.getElementById('conteudoPrincipal').innerHTML = '<div class="bg-rose-100 p-4 text-rose-700 rounded-xl text-sm">Erro ao renderizar os dados. Use Restaurar para carregar um backup.</div>';
    }
}

export function validarAba() {
    if (['resumo_geral', 'config', 'fixas', 'ajustes'].includes(S.abaAtiva)) return;
    if (ehAbaTri(S.abaAtiva)) {
        if (!S.estado.meses.some(m => triDe(m) === S.abaAtiva)) S.abaAtiva = 'resumo_geral';
    } else if (!S.estado.meses.some(m => m.id === S.abaAtiva)) {
        S.abaAtiva = 'resumo_geral';
    }
}

export function renderizarNav() {
    const item = (id, icone, texto) => {
        const ativo = S.abaAtiva === id;
        return `
        <button ${ev('click', 'trocarAba', id)} ${ativo ? 'aria-current="page"' : ''} class="w-full flex items-center gap-3 px-3 rounded-lg text-sm font-semibold transition ${ativo ? 'bg-sky-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            ${icone}<span>${texto}</span>
        </button>`;
    };
    document.getElementById('navPrincipal').innerHTML = item('resumo_geral', ICONES.inicio, 'Visão Geral') + item('fixas', ICONES.fixas, 'Contas Fixas') + item('config', ICONES.categorias, 'Categorias') + item('ajustes', ICONES.config, 'Configurações');

    // O ano do que está aberto fica sempre expandido
    const ativo = S.estado.meses.find(m => m.id === S.abaAtiva);
    const rt = /^(\d{4})-T/.exec(S.abaAtiva);
    if (ativo && ativo.ano) S.anosAbertos.add(ativo.ano);
    if (rt) S.anosAbertos.add(Number(rt[1]));

    const datados = S.estado.meses.filter(m => m.ano && m.mes);
    const anos = [...new Set(datados.map(m => m.ano))].sort((a, b) => a - b);
    let html = '';
    anos.forEach(ano => {
        const aberto = S.anosAbertos.has(ano);
        const meses = datados.filter(m => m.ano === ano).sort((a, b) => a.mes - b.mes);
        const tris = [...new Set(meses.map(triDe))].sort();
        html += `
        <div>
            <div class="flex items-center justify-between gap-2">
                <button ${ev('click', 'alternarAno', ano)} aria-expanded="${aberto}" class="flex-1 text-left text-sm font-bold text-slate-700">${aberto ? '▾' : '▸'} ${ano}</button>
                <div class="flex gap-1">${tris.map(k => `<button ${ev('click', 'trocarAba', k)} ${S.abaAtiva === k ? 'aria-current="page"' : ''} aria-label="${rotuloTri(k)}" title="${rotuloTri(k)}" class="px-2 rounded text-xs font-bold ${S.abaAtiva === k ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">T${k.slice(-1)}</button>`).join('')}</div>
            </div>
            ${aberto ? `<div class="grid grid-cols-4 gap-1 mt-1">${meses.map(m => `<button ${ev('click', 'trocarAba', m.id)} ${S.abaAtiva === m.id ? 'aria-current="page"' : ''} aria-label="${esc(m.nome)}" title="${esc(m.nome)}" class="py-1.5 rounded-md text-xs font-semibold transition ${S.abaAtiva === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">${NOMES_MESES[m.mes - 1].slice(0, 3)}</button>`).join('')}</div>` : ''}
        </div>`;
    });
    const sem = S.estado.meses.filter(m => !(m.ano && m.mes));
    if (sem.length) {
        html += `<div><p class="text-sm font-bold text-slate-700 py-1">Sem data</p>${sem.map(m => `<button ${ev('click', 'trocarAba', m.id)} class="w-full text-left truncate px-2 rounded-md text-xs font-semibold ${S.abaAtiva === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">${esc(m.nome)}</button>`).join('')}</div>`;
    }
    document.getElementById('navMeses').innerHTML = html;
}

// Barra de navegação inferior do celular: os destinos principais ficam ao alcance do polegar
export function renderizarBarra() {
    const el = document.getElementById('barraInferior');
    if (!el) return;
    const aba = S.abaAtiva;
    const ehMes = S.estado.meses.some(m => m.id === aba);
    const item = (ativo, acao, args, icone, rotulo) => `
        <button ${ev('click', acao, ...args)} ${ativo ? 'aria-current="page"' : ''} class="h-16 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold ${ativo ? 'text-sky-700' : 'text-slate-600'}">${icone}<span>${rotulo}</span></button>`;
    el.innerHTML = item(aba === 'resumo_geral', 'trocarAba', ['resumo_geral'], ICONES.inicio, 'Início')
        + item(ehMes, 'irParaMes', [], ICONES.mes, 'Mês')
        + item(aba === 'fixas', 'trocarAba', ['fixas'], ICONES.fixas, 'Fixas')
        + item(aba === 'config' || aba === 'ajustes' || ehAbaTri(aba), 'toggleMobileSidebar', [], ICONES.mais, 'Mais');
}

// Abre o último mês visto (ou o mês atual, ou o primeiro)
export function irParaMes() {
    let alvo = S.estado.meses.some(m => m.id === S.ultimoMes) ? S.ultimoMes : null;
    if (!alvo) {
        const agora = hojeChave();
        const atual = S.estado.meses.find(m => m.ano && m.mes && m.ano * 12 + m.mes === agora);
        alvo = (atual || S.estado.meses[0] || {}).id;
    }
    if (alvo) trocarAba(alvo);
}
function moverNaLista(passo) {
    const lista = mesesCronologicos();
    const i = lista.findIndex(m => m.id === S.abaAtiva);
    const alvo = lista[i + passo];
    if (i >= 0 && alvo) trocarAba(alvo.id);
}
export function mesAnterior() { moverNaLista(-1); }
export function mesSeguinte() { moverNaLista(1); }

export function alternarAno(ano) {
    if (S.anosAbertos.has(ano)) S.anosAbertos.delete(ano); else S.anosAbertos.add(ano);
    renderizarNav();
}

export function renderizarConteudo() {
    const c = document.getElementById('conteudoPrincipal');
    if (S.abaAtiva === 'resumo_geral') c.innerHTML = viewGeral();
    else if (S.abaAtiva === 'fixas') c.innerHTML = viewFixas();
    else if (S.abaAtiva === 'config') c.innerHTML = viewConfig();
    else if (S.abaAtiva === 'ajustes') { c.innerHTML = viewAjustes(); atualizarPontos(); }
    else if (ehAbaTri(S.abaAtiva)) c.innerHTML = viewTrimestre(S.abaAtiva);
    else c.innerHTML = viewMes(S.estado.meses.find(m => m.id === S.abaAtiva));
}

export function toggleMobileSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.toggle('hidden');
}

export function trocarAba(id) {
    S.abaAtiva = id;
    if (S.estado.meses.some(m => m.id === id)) S.ultimoMes = id;
    S.filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
    renderizar();
    if (window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        if (!sb.classList.contains('-translate-x-full')) toggleMobileSidebar();
    }
    window.scrollTo(0, 0);
}

export async function atualizarPontos() {
    const el = document.getElementById('listaPontos');
    if (!el) return;
    const lista = (await lerSnapshots()).slice().reverse();
    const quando = q => new Date(q).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    el.innerHTML = lista.length ? lista.map(x => {
        const rotulo = x.motivo === 'diario' ? 'Início do dia ' + dataBR(x.dia) : 'Antes de atualizar ou restaurar (' + quando(x.quando) + ')';
        return `<div class="flex items-center justify-between gap-3 border border-slate-200 rounded-xl px-3 py-2">
            <span class="text-sm text-slate-700">${esc(rotulo)}</span>
            <button ${ev('click', 'restaurarPonto', x.id)} class="btn btn-secundario btn-sm shrink-0">Restaurar</button>
        </div>`;
    }).join('') : '<p class="text-sm text-slate-500 italic">Ainda não há pontos de restauração. O primeiro é criado quando você abrir o app amanhã.</p>';
    const st = document.getElementById('statusArmazenamento');
    if (st && navigator.storage && navigator.storage.persisted) {
        try {
            const ok = await navigator.storage.persisted();
            st.textContent = ok ? 'Armazenamento protegido: o navegador não apaga estes dados sozinho.' : 'Dica: instale o app na tela inicial para o navegador tratar os dados como protegidos.';
        } catch (e) { /* ignora */ }
    }
}
