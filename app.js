
/* ============ Constantes ============ */
const VERSAO_APP = '3.3.0';
const VERSAO_DADOS = 6; // 1 = lista de meses, 2 = valores em reais, 3 = valores em centavos, 4 = categorias novas e forma de pagamento, 5 = contas fixas, 6 = categorias enxutas, receita fixa e data do último backup
const CHAVE_V3 = 'controle_financeiro_v3'; // só usada se o IndexedDB não estiver disponível
const CHAVES_ANTIGAS = ['controle_financeiro_v2', 'controle_financeiro_dados', 'controle_financas_saas_dados', 'controle_financas_dados'];
const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const ABREV_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const PALETA = ['#3b82f6', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4', '#84cc16', '#f97316'];
// As 6 categorias que já vêm no app. Qualquer uma pode ser renomeada, recolorida ou excluída.
const CATEGORIAS_PADRAO = [
    { id: 'CustosFixos', nome: 'Moradia e Contas (Aluguel, Condomínio, Luz, Água, Internet)', cor: '#3b82f6', tipo: 'gasto', orcamento: 0 },
    { id: 'Alimentacao', nome: 'Alimentação (Mercado, Feira, Refeição)', cor: '#f59e0b', tipo: 'gasto', orcamento: 0 },
    { id: 'Transporte', nome: 'Transporte (Combustível, Condução, Carro)', cor: '#ef4444', tipo: 'gasto', orcamento: 0 },
    { id: 'Saude', nome: 'Saúde (Consultas, Medicamentos)', cor: '#14b8a6', tipo: 'gasto', orcamento: 0 },
    { id: 'Lazer', nome: 'Lazer & Passeios', cor: '#10b981', tipo: 'gasto', orcamento: 0 },
    { id: 'Investimentos', nome: 'Investimentos & Poupança', cor: '#06b6d4', tipo: 'investimento', orcamento: 0 }
];
// Categorias que o usuário pode adicionar com um toque, em Categorias, no menu "+ Sugeridas"
const CATEGORIAS_SUGERIDAS = [
    { id: 'Educacao', nome: 'Educação (Faculdade, Cursos, Livros)', cor: '#8b5cf6', tipo: 'gasto', orcamento: 0 },
    { id: 'Vestuario', nome: 'Vestuário (Roupas, Calçados)', cor: '#ec4899', tipo: 'gasto', orcamento: 0 },
    { id: 'Assinaturas', nome: 'Assinaturas e Serviços (Streaming, Celular, Aplicativos)', cor: '#6366f1', tipo: 'gasto', orcamento: 0 },
    { id: 'CuidadosPessoais', nome: 'Cuidados Pessoais (Beleza, Higiene, Academia)', cor: '#d946ef', tipo: 'gasto', orcamento: 0 },
    { id: 'Familia', nome: 'Família e Pets (Filhos, Animais, Ajuda a familiares)', cor: '#f97316', tipo: 'gasto', orcamento: 0 },
    { id: 'Presentes', nome: 'Presentes e Doações', cor: '#eab308', tipo: 'gasto', orcamento: 0 },
    { id: 'Impostos', nome: 'Impostos e Taxas (IPVA, IPTU, Tarifas bancárias)', cor: '#78716c', tipo: 'gasto', orcamento: 0 },
    { id: 'Dividas', nome: 'Dívidas e Financiamentos (Empréstimos, Juros)', cor: '#b91c1c', tipo: 'gasto', orcamento: 0 },
    { id: 'Outros', nome: 'Outros e Imprevistos', cor: '#64748b', tipo: 'gasto', orcamento: 0 },
    { id: 'Reserva', nome: 'Reserva de Emergência', cor: '#84cc16', tipo: 'investimento', orcamento: 0 }
];
const CATEGORIAS_TODAS = [...CATEGORIAS_PADRAO, ...CATEGORIAS_SUGERIDAS];
const FORMAS_PAGAMENTO = [
    { id: 'debito', nome: 'Débito' }, { id: 'credito', nome: 'Crédito' }, { id: 'pix', nome: 'Pix' },
    { id: 'dinheiro', nome: 'Dinheiro' }, { id: 'boleto', nome: 'Boleto' }
];
// Formas de pagamento que podem ser divididas em parcelas (cartão de crédito e boleto parcelado/carnê)
const FORMAS_COM_PARCELA = ['credito', 'boleto'];
const nomePag = id => (FORMAS_PAGAMENTO.find(f => f.id === id) || {}).nome || '';

/* ============ Utilidades ============ */
const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const brl = c => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num(c) / 100);
// Todo valor guardado no app é um número inteiro de centavos. Estas duas funções convertem de e para texto em reais.
const centavos = v => Math.round(num(v) * 100);
const reais = c => (num(c) / 100).toFixed(2);
const curto = n => String(n || '').split('(')[0].trim();
const semAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const val = id => (document.getElementById(id) || {}).value || '';
const dataBR = d => { const p = String(d || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; };
function mesAtualISO() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function hojeChave() { const d = new Date(); return d.getFullYear() * 12 + d.getMonth() + 1; }
const chaveMes = iso => { const p = String(iso).split('-').map(Number); return p[0] * 12 + p[1]; };
const mesValido = v => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v || ''));
function diaDoMes(ano, mes, dia) { return ano + '-' + pad(mes) + '-' + pad(Math.min(dia, new Date(ano, mes, 0).getDate())); }
function hojeISO() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function abrir(id) {
    const m = document.getElementById(id);
    m.classList.remove('hidden'); m.classList.add('flex');
    const f = m.querySelector && m.querySelector('input:not([type=hidden]), select, button');
    if (f && f.focus) setTimeout(() => f.focus(), 30);
}
function fechar(id) { const m = document.getElementById(id); m.classList.add('hidden'); m.classList.remove('flex'); }

const LIXEIRA = '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';

// Janelas próprias no lugar do confirm/alert do navegador, que mostram o endereço do site
let dialogoResolve = null;
function dialogo(texto, o = {}) {
    return new Promise(res => {
        dialogoResolve = res;
        document.getElementById('confirmaTexto').textContent = texto;
        const ok = document.getElementById('confirmaOk'), cancelar = document.getElementById('confirmaCancelar');
        ok.textContent = o.ok || 'OK';
        ok.className = 'px-4 py-2 text-xs font-bold text-white rounded-lg shadow ' + (o.perigo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700');
        cancelar.textContent = o.cancelar || 'Cancelar';
        cancelar.classList.toggle('hidden', !!o.apenasOk);
        abrir('modalConfirma');
    });
}
const confirmar = (texto, o) => dialogo(texto, o);
const avisar = texto => dialogo(texto, { apenasOk: true });
function fecharDialogo(v) {
    fechar('modalConfirma');
    const r = dialogoResolve; dialogoResolve = null;
    if (r) r(v);
}

// Aviso rápido com opção de desfazer a última exclusão
let desfazerSnap = null, toastTimer = null;
function mostrarToast(msg, snap) {
    desfazerSnap = snap || null;
    const el = document.getElementById('toast');
    el.innerHTML = `<span>${esc(msg)}</span>${snap ? '<button onclick="desfazer()" class="font-bold text-sky-300 hover:text-sky-200 px-2 py-1">Desfazer</button>' : ''}`;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 8000);
}
function desfazer() {
    if (!desfazerSnap) return;
    estado = migrar(JSON.parse(desfazerSnap));
    desfazerSnap = null;
    document.getElementById('toast').classList.add('hidden');
    salvar();
}

/* ============ Estado, migração e armazenamento ============ */
let estado;
let abaAtiva = 'resumo_geral';
let filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
let anosAbertos = new Set([new Date().getFullYear()]);
let storageOk = true;
let editando = null;

function interpretarMes(m) {
    const ano = parseInt(m.ano), mes = parseInt(m.mes);
    if (ano >= 1900 && ano <= 2999 && mes >= 1 && mes <= 12) return { ano, mes };
    const mid = /^([a-z]{3})_(\d{4})$/.exec(String(m.id || ''));
    if (mid && ABREV_MESES.includes(mid[1])) return { ano: +mid[2], mes: ABREV_MESES.indexOf(mid[1]) + 1 };
    const nome = semAcento(m.nome);
    const a = /(\d{4})/.exec(nome);
    const idx = NOMES_MESES.findIndex(n => nome.includes(semAcento(n)));
    if (a && idx >= 0) return { ano: +a[1], mes: idx + 1 };
    return { ano: null, mes: null };
}

function resolverCat(l, cats) {
    if (l.categoriaId && cats.some(c => c.id === l.categoriaId)) return l.categoriaId;
    const alvo = semAcento(curto(l.categoria));
    const c = cats.find(c => semAcento(curto(c.nome)) === alvo)
        || (alvo.includes('investimento') ? cats.find(c => c.tipo === 'investimento') : null);
    return c ? c.id : null;
}

// Leva qualquer versão antiga dos dados para a versão atual. Para criar a versão 4 no futuro,
// aumente VERSAO_DADOS e trate a nova mudança dentro de normalizar().
function migrar(bruto) {
    const versao = Array.isArray(bruto) ? 1 : (parseInt(bruto.versao) || 2);
    return normalizar(bruto, versao);
}

function normalizar(bruto, versaoOrigem) {
    const emCentavos = versaoOrigem >= 3;
    const conv = v => emCentavos ? Math.round(num(v)) : Math.round(num(v) * 100);
    const ehLista = Array.isArray(bruto);
    const listaMeses = ehLista ? bruto : (bruto.meses || []);
    const catsBrutas = !ehLista && Array.isArray(bruto.categorias) && bruto.categorias.length ? bruto.categorias : CATEGORIAS_TODAS;
    const idsCat = new Set();
    const categorias = catsBrutas.filter(c => c && typeof c === 'object').map((c, i) => {
        let id = String(c.id || 'c_' + i).replace(/[^a-zA-Z0-9_-]/g, '_');
        while (idsCat.has(id)) id += '_' + i;
        idsCat.add(id);
        return {
            id,
            nome: String(c.nome || 'Sem nome'),
            cor: /^#[0-9a-f]{6}$/i.test(c.cor) ? c.cor : '#64748b',
            tipo: c.tipo === 'investimento' ? 'investimento' : 'gasto',
            orcamento: Math.max(0, conv(c.orcamento))
        };
    });
    if (versaoOrigem < 4) {
        // Versão 4: atualiza o nome de "Custos Fixos" (se ainda for o original)
        const fixo = categorias.find(c => c.id === 'CustosFixos' && c.nome === 'Custos Fixos (Aluguel, Luz, Internet)');
        if (fixo) fixo.nome = CATEGORIAS_PADRAO.find(c => c.id === 'CustosFixos').nome;
    }
    const usados = new Set();
    const reservados = ['sem', 'config', 'resumo_geral'];
    const meses = listaMeses.filter(m => m && typeof m === 'object').map((m, i) => {
        const { ano, mes } = interpretarMes(m);
        let id = String(m.id || 'mes_' + i).replace(/[^a-zA-Z0-9_-]/g, '_');
        if (reservados.includes(id) || /^\d{4}-T[1-4]$/.test(id)) id = 'm_' + id;
        while (usados.has(id)) id += '_' + i;
        usados.add(id);
        let receitas = [];
        if (Array.isArray(m.receitas)) {
            receitas = m.receitas.filter(r => r && typeof r === 'object').map(r => ({ id: String(r.id || uid()).replace(/[^a-zA-Z0-9_-]/g, '_'), descricao: String(r.descricao || 'Receita'), valor: conv(r.valor), fixaId: r.fixaId ? String(r.fixaId).replace(/[^a-zA-Z0-9_-]/g, '_') : '' }));
        } else if (num(m.salario) > 0) {
            receitas = [{ id: uid(), descricao: 'Salário', valor: conv(m.salario) }];
        }
        return {
            id, ano, mes,
            nome: ano ? NOMES_MESES[mes - 1] + ' / ' + ano : String(m.nome || 'Mês ' + (i + 1)),
            receitas,
            fixasAplicadas: Array.isArray(m.fixasAplicadas) ? m.fixasAplicadas.map(x => String(x).replace(/[^a-zA-Z0-9_-]/g, '_')) : [],
            lancamentos: (Array.isArray(m.lancamentos) ? m.lancamentos : []).map(l => ({
                id: String(l.id || uid()).replace(/[^a-zA-Z0-9_-]/g, '_'),
                data: String(l.data || ''),
                descricao: String(l.descricao || ''),
                valor: conv(l.valor),
                categoriaId: resolverCat(l, categorias),
                grupo: l.grupo ? String(l.grupo).replace(/[^a-zA-Z0-9_-]/g, '_') : null,
                parcela: l.parcela ? String(l.parcela) : '',
                pagamento: FORMAS_PAGAMENTO.some(f => f.id === l.pagamento) ? l.pagamento : '',
                fixaId: l.fixaId ? String(l.fixaId).replace(/[^a-zA-Z0-9_-]/g, '_') : ''
            }))
        };
    });
    const contasFixas = ehLista ? [] : normalizarFixas(bruto.contasFixas, categorias);
    let cats = categorias;
    if (versaoOrigem < 6) {
        // Versão 6: tira as categorias sugeridas que nunca foram usadas nem mexidas (elas voltam pelo menu "+ Sugeridas")
        const emUso = new Set(contasFixas.map(f => f.categoriaId));
        meses.forEach(m => m.lancamentos.forEach(l => emUso.add(l.categoriaId)));
        cats = categorias.filter(c => {
            const sug = CATEGORIAS_SUGERIDAS.find(x => x.id === c.id);
            return !(sug && sug.nome === c.nome && !c.orcamento && !emUso.has(c.id));
        });
    }
    const feitoEm = !ehLista && /^\d{4}-\d{2}-\d{2}$/.test(String(bruto.ultimoBackup || '')) ? String(bruto.ultimoBackup) : '';
    return { versao: VERSAO_DADOS, saldoInicial: ehLista ? 0 : conv(bruto.saldoInicial), boasVindasOk: !ehLista && !!bruto.boasVindasOk, ultimoBackup: feitoEm, categorias: cats, contasFixas, meses };
}

function normalizarFixas(lista, categorias) {
    if (!Array.isArray(lista)) return [];
    const ids = new Set();
    return lista.filter(f => f && typeof f === 'object').map((f, i) => {
        let id = String(f.id || 'f_' + i).replace(/[^a-zA-Z0-9_-]/g, '_');
        while (ids.has(id)) id += '_' + i;
        ids.add(id);
        const cat = categorias.some(c => c.id === f.categoriaId) ? f.categoriaId : ((categorias.find(c => c.tipo === 'gasto') || categorias[0] || {}).id || null);
        return {
            id,
            descricao: String(f.descricao || 'Conta fixa'),
            valor: Math.max(0, Math.round(num(f.valor))),
            categoriaId: cat,
            tipo: f.tipo === 'receita' ? 'receita' : 'gasto',
            pagamento: FORMAS_PAGAMENTO.some(p => p.id === f.pagamento) ? f.pagamento : '',
            dia: Math.min(31, Math.max(1, parseInt(f.dia) || 1)),
            inicio: mesValido(f.inicio) ? String(f.inicio) : mesAtualISO(),
            fim: mesValido(f.fim) ? String(f.fim) : ''
        };
    });
}

function mesesIniciais() {
    const d = new Date(), ano = d.getFullYear(), mes = d.getMonth() + 1;
    return [{ id: 'm_' + ano + '_' + pad(mes), ano, mes, receitas: [], lancamentos: [] }];
}

function contar(bruto) {
    const lista = Array.isArray(bruto) ? bruto : (bruto && Array.isArray(bruto.meses) ? bruto.meses : []);
    return lista.reduce((a, m) => a + (m && Array.isArray(m.lancamentos) ? m.lancamentos.length : 0), 0);
}

// IndexedDB guarda o estado inteiro sob a chave "estado"
const DB_NOME = 'controle_financeiro', DB_STORE = 'kv';
let dbPromise = null;
function db() {
    if (!dbPromise) dbPromise = new Promise((res, rej) => {
        if (typeof indexedDB === 'undefined') return rej(new Error('IndexedDB indisponível'));
        const r = indexedDB.open(DB_NOME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    return dbPromise;
}
async function lerDB(chave) {
    const d = await db();
    return new Promise((res, rej) => {
        const q = d.transaction(DB_STORE).objectStore(DB_STORE).get(chave);
        q.onsuccess = () => res(q.result);
        q.onerror = () => rej(q.error);
    });
}
async function gravarDB(chave, valor) {
    const d = await db();
    return new Promise((res, rej) => {
        const t = d.transaction(DB_STORE, 'readwrite');
        t.objectStore(DB_STORE).put(valor, chave);
        t.oncomplete = () => res();
        t.onerror = t.onabort = () => rej(t.error);
    });
}

async function carregar() {
    try {
        const atual = await lerDB('estado');
        if (atual) return migrar(atual);
    } catch (e) { /* cai para o localStorage */ }
    try {
        const v3 = localStorage.getItem(CHAVE_V3);
        if (v3) return migrar(JSON.parse(v3));
        // Primeira abertura desta versão: aproveita o que existir das versões anteriores (localStorage)
        let melhor = null;
        CHAVES_ANTIGAS.forEach(k => {
            const bruto = localStorage.getItem(k);
            if (!bruto) return;
            try {
                const dados = JSON.parse(bruto);
                if (dados && typeof dados === 'object' && (!melhor || contar(dados) > contar(melhor))) melhor = dados;
            } catch (e) { /* chave corrompida */ }
        });
        if (melhor) return migrar(melhor);
    } catch (e) {
        console.error(e);
    }
    return migrar({ versao: VERSAO_DADOS, saldoInicial: 0, categorias: CATEGORIAS_PADRAO, meses: mesesIniciais() });
}

// Avisa as outras abas abertas para recarregarem os dados, evitando que uma sobrescreva a outra
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('controle_financeiro') : null;

async function persistir() {
    try {
        await gravarDB('estado', estado);
        storageOk = true;
    } catch (e) {
        try { localStorage.setItem(CHAVE_V3, JSON.stringify(estado)); storageOk = true; } catch (e2) { storageOk = false; }
    }
    if (canal) canal.postMessage('atualizado');
}

function salvar() {
    renderizar();
    persistir().then(() => { if (!storageOk) renderizar(); });
}

/* ============ Cálculos ============ */
const catPorId = id => estado.categorias.find(c => c.id === id);
const catDoItem = l => catPorId(l.categoriaId) || { id: null, nome: 'Sem categoria', cor: '#94a3b8', tipo: 'gasto', orcamento: 0 };

function totais(m) {
    let r = 0, g = 0, i = 0;
    m.receitas.forEach(x => { r += num(x.valor); });
    m.lancamentos.forEach(l => {
        const v = num(l.valor);
        if (catDoItem(l).tipo === 'investimento') i += v; else g += v;
    });
    return { receitas: r, gastos: g, invest: i, sobra: r - g - i };
}

const chaveCron = m => (m.ano && m.mes ? m.ano * 12 + m.mes : Infinity);
function mesesCronologicos() {
    return estado.meses.slice().sort((a, b) => (chaveCron(a) < chaveCron(b) ? -1 : chaveCron(a) > chaveCron(b) ? 1 : 0));
}

// Saldo e patrimônio acumulados seguem a ordem cronológica (meses sem data vão para o fim).
// A ordem da barra lateral é só visual e não muda as contas.
function acumulados() {
    let conta = num(estado.saldoInicial), inv = 0;
    const out = {};
    mesesCronologicos().forEach(m => {
        const t = totais(m);
        conta += t.sobra; inv += t.invest;
        out[m.id] = { ...t, conta, invAcum: inv, patrimonio: conta + inv };
    });
    return out;
}

function gastosPorCategoria(meses) {
    const mapa = new Map();
    meses.forEach(m => m.lancamentos.forEach(l => {
        const c = catDoItem(l);
        if (c.tipo !== 'gasto') return;
        const k = c.id || '_sem';
        if (!mapa.has(k)) mapa.set(k, { cat: c, total: 0 });
        mapa.get(k).total += num(l.valor);
    }));
    return [...mapa.values()].filter(x => x.total > 0).sort((a, b) => b.total - a.total);
}

function limitesMes(m) {
    if (!(m.ano && m.mes)) return null;
    const base = m.ano + '-' + pad(m.mes) + '-';
    return { ini: base + '01', fim: base + pad(new Date(m.ano, m.mes, 0).getDate()) };
}

function dataPadrao(m) {
    const hoje = hojeISO(), lim = limitesMes(m);
    if (!lim) return hoje;
    return hoje >= lim.ini && hoje <= lim.fim ? hoje : lim.ini;
}

/* ============ Trimestres ============ */
function triDe(m) { return m.ano && m.mes ? m.ano + '-T' + Math.ceil(m.mes / 3) : 'sem'; }
function ehAbaTri(id) { return id === 'sem' || /^\d{4}-T[1-4]$/.test(id); }
function rotuloTri(k) { const r = /^(\d{4})-T([1-4])$/.exec(k); return r ? r[2] + 'º Trimestre ' + r[1] : 'Sem trimestre'; }
function chavesTrimestres() {
    return [...new Set(estado.meses.map(triDe))].sort((a, b) => a === 'sem' ? 1 : b === 'sem' ? -1 : a.localeCompare(b));
}
/* ============ Renderização ============ */
function renderizar() {
    try {
        validarAba();
        renderizarNav();
        renderizarConteudo();
        document.getElementById('avisoStorage').innerHTML = storageOk ? '' :
            '<div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">Este navegador não está permitindo salvar os dados. O que você lançar pode se perder ao fechar. Abra o arquivo no Chrome e use o botão Backup com frequência.</div>';
        document.getElementById('avisoBackup').innerHTML = avisoBackup();
    } catch (err) {
        console.error(err);
        document.getElementById('conteudoPrincipal').innerHTML = '<div class="bg-rose-100 p-4 text-rose-700 rounded-xl text-sm">Erro ao renderizar os dados. Use Restaurar para carregar um backup.</div>';
    }
}

function validarAba() {
    if (abaAtiva === 'resumo_geral' || abaAtiva === 'config' || abaAtiva === 'fixas') return;
    if (ehAbaTri(abaAtiva)) {
        if (!estado.meses.some(m => triDe(m) === abaAtiva)) abaAtiva = 'resumo_geral';
    } else if (!estado.meses.some(m => m.id === abaAtiva)) {
        abaAtiva = 'resumo_geral';
    }
}

function renderizarNav() {
    const item = (id, icone, texto) => `
        <button onclick="trocarAba('${id}')" class="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition ${abaAtiva === id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <span>${icone}</span><span>${texto}</span>
        </button>`;
    document.getElementById('navPrincipal').innerHTML = item('resumo_geral', '📊', 'Visão Geral') + item('fixas', '📌', 'Contas Fixas') + item('config', '⚙️', 'Categorias');

    // O ano do que está aberto fica sempre expandido
    const ativo = estado.meses.find(m => m.id === abaAtiva);
    const rt = /^(\d{4})-T/.exec(abaAtiva);
    if (ativo && ativo.ano) anosAbertos.add(ativo.ano);
    if (rt) anosAbertos.add(Number(rt[1]));

    const datados = estado.meses.filter(m => m.ano && m.mes);
    const anos = [...new Set(datados.map(m => m.ano))].sort((a, b) => a - b);
    let html = '';
    anos.forEach(ano => {
        const aberto = anosAbertos.has(ano);
        const meses = datados.filter(m => m.ano === ano).sort((a, b) => a.mes - b.mes);
        const tris = [...new Set(meses.map(triDe))].sort();
        html += `
        <div>
            <div class="flex items-center justify-between">
                <button onclick="alternarAno(${ano})" aria-expanded="${aberto}" class="flex-1 text-left text-xs font-bold text-slate-700 py-1">${aberto ? '▾' : '▸'} ${ano}</button>
                <div class="flex gap-1">${tris.map(k => `<button onclick="trocarAba('${k}')" aria-label="${rotuloTri(k)}" title="${rotuloTri(k)}" class="px-1.5 py-0.5 rounded text-[10px] font-bold ${abaAtiva === k ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">T${k.slice(-1)}</button>`).join('')}</div>
            </div>
            ${aberto ? `<div class="grid grid-cols-4 gap-1 mt-1">${meses.map(m => `<button onclick="trocarAba('${m.id}')" aria-label="${esc(m.nome)}" title="${esc(m.nome)}" class="py-1.5 rounded-md text-[11px] font-semibold transition ${abaAtiva === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">${NOMES_MESES[m.mes - 1].slice(0, 3)}</button>`).join('')}</div>` : ''}
        </div>`;
    });
    const sem = estado.meses.filter(m => !(m.ano && m.mes));
    if (sem.length) {
        html += `<div><p class="text-xs font-bold text-slate-700 py-1">Sem data</p>${sem.map(m => `<button onclick="trocarAba('${m.id}')" class="w-full text-left truncate px-2 py-1.5 rounded-md text-[11px] font-semibold ${abaAtiva === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">${esc(m.nome)}</button>`).join('')}</div>`;
    }
    document.getElementById('navMeses').innerHTML = html;
}

function alternarAno(ano) {
    if (anosAbertos.has(ano)) anosAbertos.delete(ano); else anosAbertos.add(ano);
    renderizarNav();
}

function renderizarConteudo() {
    const c = document.getElementById('conteudoPrincipal');
    if (abaAtiva === 'resumo_geral') c.innerHTML = viewGeral();
    else if (abaAtiva === 'fixas') c.innerHTML = viewFixas();
    else if (abaAtiva === 'config') c.innerHTML = viewConfig();
    else if (ehAbaTri(abaAtiva)) c.innerHTML = viewTrimestre(abaAtiva);
    else c.innerHTML = viewMes(estado.meses.find(m => m.id === abaAtiva));
}

function toggleMobileSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.toggle('hidden');
    const fechado = sb.classList.contains('-translate-x-full');
    const puxador = document.getElementById('puxador');
    puxador.style.left = fechado ? '0' : '16rem';
    puxador.setAttribute('aria-expanded', fechado ? 'false' : 'true');
}

function trocarAba(id) {
    abaAtiva = id;
    filtros = { texto: '', cat: '', pag: '', ordem: 'recentes' };
    renderizar();
    if (window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        if (!sb.classList.contains('-translate-x-full')) toggleMobileSidebar();
    }
    window.scrollTo(0, 0);
}

function card(rotulo, valor, cor, sub, fundo) {
    return `<div class="${fundo || 'bg-white border-slate-200'} p-4 rounded-2xl shadow-sm border">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">${rotulo}</span>
        <div class="text-lg font-bold mt-1 ${cor}">${valor}</div>
        ${sub ? `<p class="text-[11px] text-slate-400 mt-0.5">${sub}</p>` : ''}
    </div>`;
}

/* ---- Gráficos (SVG, sem biblioteca) ---- */
function graficoMensal(acc) {
    const ms = estado.meses;
    if (!ms.length) return '';
    const larg = 56, W = Math.max(300, ms.length * larg), base = 150, H = 175;
    const max = Math.max(1, ...ms.map(m => Math.max(acc[m.id].receitas, acc[m.id].gastos, acc[m.id].invest)));
    const barras = ms.map((m, i) => {
        const x0 = i * larg + 8;
        const t = acc[m.id];
        const mk = (v, k, cor, nome) => {
            const h = Math.round((v / max) * (base - 12));
            return `<rect x="${x0 + k * 14}" y="${base - h}" width="12" height="${h}" rx="2" fill="${cor}"><title>${esc(m.nome)} - ${nome}: ${brl(v)}</title></rect>`;
        };
        const rot = m.ano ? ABREV_MESES[m.mes - 1] + '/' + String(m.ano).slice(2) : esc(m.nome.slice(0, 5));
        return mk(t.receitas, 0, '#10b981', 'Receitas') + mk(t.gastos, 1, '#f43f5e', 'Gastos') + mk(t.invest, 2, '#06b6d4', 'Investido')
            + `<text x="${x0 + 21}" y="${base + 16}" text-anchor="middle" font-size="10" fill="#64748b">${rot}</text>`;
    }).join('');
    return `<div class="overflow-x-auto"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Receitas, gastos e investimentos por mês">
        <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#94a3b8" stroke-opacity="0.5"/>${barras}</svg></div>`;
}

function barrasCategorias(lista, total) {
    if (!lista.length) return '<p class="text-sm text-slate-400 italic">Nenhum gasto lançado ainda.</p>';
    return `<div class="space-y-3">${lista.map(x => {
        const pct = total > 0 ? x.total / total * 100 : 0;
        return `<div>
            <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">${esc(curto(x.cat.nome))}</span>
                <span class="text-slate-900 font-bold">${brl(x.total)} <span class="text-slate-400 font-normal">(${pct.toFixed(1)}%)</span></span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" style="width:${Math.min(pct, 100)}%;background-color:${x.cat.cor}"></div></div>
        </div>`;
    }).join('')}</div>`;
}

/* ---- Visão geral ---- */
function viewGeral() {
    return boasVindas() + viewGeralCorpo();
}

function boasVindas() {
    const vazio = estado.meses.every(m => !m.receitas.length && !m.lancamentos.length);
    if (estado.boasVindasOk || !vazio) return '';
    const hoje = new Date();
    const atual = estado.meses.find(m => m.ano === hoje.getFullYear() && m.mes === hoje.getMonth() + 1) || estado.meses[0];
    return `
        <div class="bg-sky-50 border border-sky-200 p-5 rounded-2xl space-y-3">
            <h3 class="font-bold text-slate-900 text-lg">Bem-vindo ao Controle Financeiro</h3>
            <p class="text-sm text-slate-600">Tudo o que você lançar fica salvo só neste aparelho. Para começar:</p>
            <ol class="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                <li>Informe o saldo que você tem hoje e revise as categorias.</li>
                <li>Abra o mês atual e lance sua primeira receita.</li>
                <li>Registre os gastos conforme acontecem e use o botão Backup de vez em quando.</li>
            </ol>
            <div class="flex flex-wrap gap-2">
                <button onclick="trocarAba('config')" class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow">Saldo e categorias</button>
                ${atual ? `<button onclick="trocarAba('${atual.id}')" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow">Abrir ${esc(atual.nome)}</button>` : ''}
                <button onclick="dispensarBoasVindas()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-300">Não mostrar mais</button>
            </div>
        </div>`;
}
function dispensarBoasVindas() { estado.boasVindasOk = true; salvar(); }

function viewGeralCorpo() {
    const acc = acumulados();
    let R = 0, G = 0, I = 0;
    estado.meses.forEach(m => { R += acc[m.id].receitas; G += acc[m.id].gastos; I += acc[m.id].invest; });
    const si = num(estado.saldoInicial);
    // Saldo e patrimônio contam só até o mês atual: parcelas e contas fixas de meses futuros ainda não saíram da conta
    const agora = hojeChave();
    const ate = mesesCronologicos().filter(m => m.ano && m.mes && m.ano * 12 + m.mes <= agora);
    const ult = ate.length ? acc[ate[ate.length - 1].id] : null;
    const semData = estado.meses.filter(m => !(m.ano && m.mes)).map(m => totais(m));
    const conta = (ult ? ult.conta : si) + semData.reduce((a, t) => a + t.sobra, 0);
    const investido = (ult ? ult.invAcum : 0) + semData.reduce((a, t) => a + t.invest, 0);
    const porCat = gastosPorCategoria(estado.meses);
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-900">Visão Geral</h2>
            <p class="text-xs text-slate-500">Receitas, gastos e investimentos somam todos os meses cadastrados. Saldo e patrimônio contam só até o mês atual.</p>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
            ${card('Receitas', brl(R), 'text-emerald-600')}
            ${card('Gastos', brl(G), 'text-rose-600')}
            ${card('Investido', brl(I), 'text-cyan-600')}
            ${card('Saldo na conta', brl(conta), conta >= 0 ? 'text-emerald-900' : 'text-rose-600', 'até o mês atual' + (si !== 0 ? ', com saldo inicial de ' + brl(si) : ''), 'bg-emerald-50 border-emerald-200')}
            ${card('Patrimônio', brl(conta + investido), 'text-sky-900', 'conta + investimentos, até o mês atual', 'bg-sky-50 border-sky-200')}
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Evolução mensal</h3>
            <div class="flex flex-wrap gap-4 text-[11px] text-slate-500">
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm" style="background:#10b981"></span>Receitas</span>
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm" style="background:#f43f5e"></span>Gastos</span>
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm" style="background:#06b6d4"></span>Investido</span>
            </div>
            ${graficoMensal(acc)}
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Gastos por categoria no período</h3>
            ${barrasCategorias(porCat, G)}
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Resumo mês a mês</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase"><tr>
                        <th class="p-3">Mês</th><th class="p-3 text-right">Receitas</th><th class="p-3 text-right">Gastos</th>
                        <th class="p-3 text-right">Investido</th><th class="p-3 text-right">Sobra</th><th class="p-3 text-right">Saldo acumulado</th><th class="p-3"></th>
                    </tr></thead>
                    <tbody class="divide-y divide-slate-100">
                        ${estado.meses.map(m => { const t = acc[m.id]; return `
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 font-semibold text-slate-900">${esc(m.nome)}</td>
                            <td class="p-3 text-right text-emerald-600">${brl(t.receitas)}</td>
                            <td class="p-3 text-right text-rose-600">${brl(t.gastos)}</td>
                            <td class="p-3 text-right text-cyan-600">${brl(t.invest)}</td>
                            <td class="p-3 text-right font-semibold ${t.sobra >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${brl(t.sobra)}</td>
                            <td class="p-3 text-right font-bold ${t.conta >= 0 ? 'text-slate-900' : 'text-rose-600'}">${brl(t.conta)}</td>
                            <td class="p-3 text-center"><button onclick="trocarAba('${m.id}')" class="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-lg">Abrir</button></td>
                        </tr>`; }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

/* ---- Trimestre ---- */
function viewTrimestre(k) {
    const ms = estado.meses.filter(m => triDe(m) === k);
    let R = 0, G = 0, I = 0;
    ms.forEach(m => { const t = totais(m); R += t.receitas; G += t.gastos; I += t.invest; });
    const sobra = R - G - I;
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h2 class="text-xl font-bold text-slate-900">${rotuloTri(k)}</h2>
                <p class="text-xs text-slate-500">${ms.length} ${ms.length === 1 ? 'mês' : 'meses'} neste trimestre.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${card('Receitas', brl(R), 'text-emerald-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Gastos', brl(G), 'text-rose-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Investido', brl(I), 'text-cyan-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Sobra do trimestre', brl(sobra), sobra >= 0 ? 'text-emerald-900' : 'text-rose-600', '', 'bg-emerald-50 border-emerald-100')}
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            ${ms.map(m => { const t = totais(m); return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 class="font-bold text-base text-slate-900 border-b pb-2">${esc(m.nome)}</h3>
                <div class="flex justify-between text-sm"><span class="text-slate-500">Receitas:</span><span class="font-semibold text-emerald-600">${brl(t.receitas)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-slate-500">Gastos:</span><span class="font-semibold text-rose-600">${brl(t.gastos)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-slate-500">Investido:</span><span class="font-semibold text-cyan-600">${brl(t.invest)}</span></div>
                <div class="flex justify-between text-sm border-t pt-2 font-bold"><span class="text-slate-500">Sobra:</span><span class="${t.sobra >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${brl(t.sobra)}</span></div>
                <button onclick="trocarAba('${m.id}')" class="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition">Abrir mês</button>
            </div>`; }).join('')}
        </div>`;
}

function avisoBackup() {
    const qtd = estado.meses.reduce((a, m) => a + m.lancamentos.length + m.receitas.length, 0);
    if (qtd < 5) return '';
    const ult = estado.ultimoBackup;
    const dias = ult ? Math.floor((Date.now() - new Date(ult + 'T12:00:00').getTime()) / 86400000) : null;
    if (ult && dias < 30) return '';
    return `<div class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center justify-between gap-3">
        <span>${ult ? 'Seu último backup foi há ' + dias + ' dias.' : 'Você ainda não fez backup dos seus dados.'} Eles ficam só neste aparelho.</span>
        <button onclick="exportarDados()" class="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-lg">Fazer backup</button>
    </div>`;
}

function resumoPagamento(mes) {
    if (!mes.lancamentos.length) return '';
    const mapa = {};
    mes.lancamentos.forEach(l => { const k = l.pagamento || '_'; mapa[k] = (mapa[k] || 0) + num(l.valor); });
    const chaves = Object.keys(mapa).sort((a, b) => mapa[b] - mapa[a]);
    return `<div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div>
                <h3 class="font-bold text-slate-900">Por forma de pagamento</h3>
                <p class="text-xs text-slate-400">O total do crédito é o que vai para a fatura do cartão com os lançamentos deste mês.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                ${chaves.map(k => `
                <div class="${k === 'credito' ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-100'} border rounded-xl p-3">
                    <p class="text-[11px] font-bold text-slate-500 uppercase">${k === '_' ? 'Não informado' : nomePag(k)}</p>
                    <p class="text-sm font-bold text-slate-900 mt-0.5">${brl(mapa[k])}</p>
                </div>`).join('')}
            </div>
        </div>`;
}

// Sugere categoria e forma de pagamento pela última vez que você lançou a mesma descrição
const chaveDesc = t => semAcento(String(t).replace(/\s*\(\d+\/\d+\)\s*$/, '')).trim();
function acharSugestao(desc) {
    const k = chaveDesc(desc);
    if (!k) return null;
    let achado = null;
    estado.meses.forEach(m => m.lancamentos.forEach(l => {
        if (chaveDesc(l.descricao) === k && l.categoriaId && (!achado || (l.data || '') >= (achado.data || ''))) achado = l;
    }));
    return achado ? { categoriaId: achado.categoriaId, pagamento: achado.pagamento || '' } : null;
}
function sugerirCategoria(mid) {
    const s = acharSugestao(val('novoDesc_' + mid));
    if (!s) return;
    const cat = document.getElementById('novoCat_' + mid), pag = document.getElementById('novaPag_' + mid);
    if (cat) cat.value = s.categoriaId;
    if (pag) { pag.value = s.pagamento; mostrarParcelas(mid); }
}

/* ---- Contas fixas ---- */
function viewFixas() {
    const campo = 'w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    const rot = 'block text-[10px] font-bold text-slate-500 uppercase mb-1';
    const opcCat = sel => estado.categorias.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
    const opcPag = sel => '<option value="">Não informar</option>' + FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${f.nome}</option>`).join('');
    const soma = t => estado.contasFixas.filter(f => f.tipo === t).reduce((a, f) => a + num(f.valor), 0);
    const temG = estado.contasFixas.some(f => f.tipo !== 'receita'), temR = estado.contasFixas.some(f => f.tipo === 'receita');
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
            <h2 class="text-xl font-bold text-slate-900">Contas Fixas</h2>
            <p class="text-xs text-slate-500">Cadastre uma vez (aluguel, internet, salário) e a conta entra sozinha em todos os meses a partir do mês de início, inclusive nos meses que você criar depois. Cada lançamento pode ser editado ou excluído só no mês dele.</p>
            ${temG ? `<p class="text-sm font-bold text-slate-900 pt-1">Gastos fixos por mês: ${brl(soma('gasto'))}</p>` : ''}
            ${temR ? `<p class="text-sm font-bold text-slate-900">Receitas fixas por mês: ${brl(soma('receita'))}</p>` : ''}
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Nova conta fixa</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label for="fixaTipo" class="${rot}">Tipo</label><select id="fixaTipo" onchange="fixaTipoMudou()" class="${campo}"><option value="gasto">Gasto</option><option value="receita">Receita</option></select></div>
                <div class="md:col-span-2"><label for="fixaDesc" class="${rot}">Descrição</label><input type="text" id="fixaDesc" placeholder="Ex: Aluguel, Salário" class="${campo}"></div>
                <div><label for="fixaValor" class="${rot}">Valor (R$)</label><input type="number" step="0.01" inputmode="decimal" id="fixaValor" placeholder="0.00" class="${campo} text-right"></div>
                <div><label for="fixaDia" class="${rot}">Dia do mês</label><input type="number" min="1" max="31" inputmode="numeric" id="fixaDia" value="5" class="${campo}"></div>
                <div id="boxFixaCat" class="col-span-2"><label for="fixaCat" class="${rot}">Categoria</label><select id="fixaCat" class="${campo}">${opcCat('CustosFixos')}</select></div>
                <div id="boxFixaPag"><label for="fixaPag" class="${rot}">Pagamento</label><select id="fixaPag" class="${campo}">${opcPag('')}</select></div>
                <div><label for="fixaInicio" class="${rot}">A partir de</label><input type="month" id="fixaInicio" value="${mesAtualISO()}" class="${campo}"></div>
                <div><label for="fixaFim" class="${rot}">Até (opcional)</label><input type="month" id="fixaFim" class="${campo}"></div>
                <div class="col-span-2 flex items-end"><button onclick="adicionarFixa()" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow">+ Adicionar conta fixa</button></div>
            </div>
        </div>

        <div class="space-y-3">
            ${estado.contasFixas.length ? estado.contasFixas.map(f => `
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                <div class="flex gap-2">
                    <input type="text" value="${esc(f.descricao)}" aria-label="Descrição" onchange="editarFixa('${f.id}', 'descricao', this.value)" class="${campo} flex-1 min-w-0">
                    <input type="number" step="0.01" inputmode="decimal" value="${reais(f.valor)}" aria-label="Valor" onchange="editarFixa('${f.id}', 'valor', this.value)" class="${campo} w-28 text-right">
                </div>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                    ${f.tipo === 'receita'
                        ? `<div class="col-span-2 md:col-span-2 flex items-end"><span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg">Receita fixa</span></div>`
                        : `<div class="col-span-2 md:col-span-1"><label class="${rot}">Categoria</label><select onchange="editarFixa('${f.id}', 'categoriaId', this.value)" class="${campo}">${opcCat(f.categoriaId)}</select></div>
                           <div><label class="${rot}">Pagamento</label><select onchange="editarFixa('${f.id}', 'pagamento', this.value)" class="${campo}">${opcPag(f.pagamento)}</select></div>`}
                    <div><label class="${rot}">Dia</label><input type="number" min="1" max="31" inputmode="numeric" value="${f.dia}" onchange="editarFixa('${f.id}', 'dia', this.value)" class="${campo}"></div>
                    <div><label class="${rot}">A partir de</label><input type="month" value="${f.inicio}" onchange="editarFixa('${f.id}', 'inicio', this.value)" class="${campo}"></div>
                    <div><label class="${rot}">Até</label><input type="month" value="${f.fim}" onchange="editarFixa('${f.id}', 'fim', this.value)" class="${campo}"></div>
                </div>
                <button onclick="removerFixa('${f.id}')" aria-label="Excluir conta fixa" class="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg">${LIXEIRA} Excluir conta fixa</button>
            </div>`).join('') : '<p class="text-sm text-slate-400 italic">Nenhuma conta fixa cadastrada ainda.</p>'}
        </div>`;
}

/* ---- Configurações: categorias, orçamento, saldo inicial ---- */
function viewConfig() {
    return viewConfigCorpo() + blocoAparencia();
}

function blocoAparencia() {
    const pref = lerTema();
    const opt = (v, t) => `<option value="${v}" ${pref === v ? 'selected' : ''}>${t}</option>`;
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
            <label for="tema" class="block text-sm font-bold text-slate-900">Aparência</label>
            <select id="tema" onchange="definirTema(this.value); renderizar()" class="bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium">
                ${opt('auto', 'Seguir o aparelho')}${opt('claro', 'Claro')}${opt('escuro', 'Escuro')}
            </select>
            <p class="text-[11px] text-slate-400">Controle Financeiro, versão ${VERSAO_APP}</p>
        </div>`;
}

function viewConfigCorpo() {
    const campo = 'bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-900">Categorias e Orçamento</h2>
            <p class="text-xs text-slate-500">Edite os nomes e cores, defina um limite mensal por categoria (0 significa sem limite) e informe o saldo que você já tinha na conta antes do primeiro mês.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
            <label for="saldoInicial" class="block text-sm font-bold text-slate-900">Saldo inicial da conta (R$)</label>
            <input type="number" step="0.01" inputmode="decimal" id="saldoInicial" value="${estado.saldoInicial ? reais(estado.saldoInicial) : ''}" placeholder="0.00" onchange="definirSaldoInicial(this.value)" class="${campo} w-48 text-right">
            <p class="text-[11px] text-slate-400">Entra no saldo acumulado a partir do primeiro mês da lista.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-bold text-slate-900">Categorias</h3>
                <div class="flex items-center gap-2">
                    ${CATEGORIAS_SUGERIDAS.some(x => !estado.categorias.some(c => c.id === x.id)) ? `<select onchange="adicionarSugerida(this.value)" aria-label="Adicionar categoria sugerida" class="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"><option value="">+ Sugeridas</option>${CATEGORIAS_SUGERIDAS.filter(x => !estado.categorias.some(c => c.id === x.id)).map(x => `<option value="${x.id}">${esc(curto(x.nome))}</option>`).join('')}</select>` : ''}
                    <button onclick="adicionarCategoria()" class="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow">+ Nova categoria</button>
                </div>
            </div>
            <div class="space-y-3">
                ${estado.categorias.map(c => `
                <div class="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div class="flex items-center gap-2">
                        <input type="color" value="${c.cor}" aria-label="Cor" onchange="editarCategoria('${c.id}', 'cor', this.value)" class="w-10 h-10 rounded-lg shrink-0 cursor-pointer">
                        <input type="text" value="${esc(c.nome)}" aria-label="Nome da categoria" onchange="editarCategoria('${c.id}', 'nome', this.value)" class="${campo} flex-1 min-w-0">
                    </div>
                    <div class="flex flex-wrap items-end gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select onchange="editarCategoria('${c.id}', 'tipo', this.value)" class="${campo}">
                                <option value="gasto" ${c.tipo === 'gasto' ? 'selected' : ''}>Gasto</option>
                                <option value="investimento" ${c.tipo === 'investimento' ? 'selected' : ''}>Investimento</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Limite mensal (R$)</label>
                            <input type="number" step="0.01" inputmode="decimal" value="${c.orcamento ? reais(c.orcamento) : ''}" placeholder="0" ${c.tipo === 'investimento' ? 'disabled' : ''} onchange="editarCategoria('${c.id}', 'orcamento', this.value)" class="${campo} w-32 text-right disabled:opacity-40">
                        </div>
                        <button onclick="removerCategoria('${c.id}')" aria-label="Excluir categoria" class="ml-auto inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-2.5 rounded-lg">${LIXEIRA} Excluir</button>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
}

/* ---- Mês detalhado ---- */
function viewMes(mes) {
    const t = acumulados()[mes.id];
    const lim = limitesMes(mes);
    const campo = 'bg-slate-50 border border-slate-300 rounded-xl p-2 text-sm font-medium';

    const chavePrev = mes.ano && mes.mes ? mes.ano * 12 + mes.mes - 1 : null;
    const prev = chavePrev ? estado.meses.find(m => m.ano && m.mes && m.ano * 12 + m.mes === chavePrev) : null;
    const orc = estado.categorias.filter(c => c.tipo === 'gasto').map(c => {
        const total = mes.lancamentos.filter(l => l.categoriaId === c.id).reduce((a, l) => a + num(l.valor), 0);
        const lm = num(c.orcamento);
        let pct = lm > 0 ? total / lm * 100 : (t.gastos > 0 ? total / t.gastos * 100 : 0);
        let cor = c.cor, status = '', corStatus = '#64748b';
        if (lm > 0) {
            if (total > lm) { cor = '#e11d48'; corStatus = '#e11d48'; status = 'Estourou ' + brl(total - lm); }
            else { status = 'Faltam ' + brl(lm - total); if (total >= lm * 0.8) { cor = '#f59e0b'; corStatus = '#b45309'; } }
        }
        let comp = '', corComp = '#64748b';
        if (prev) {
            const antes = prev.lancamentos.filter(l => l.categoriaId === c.id).reduce((a, l) => a + num(l.valor), 0);
            if (antes === 0 && total > 0) comp = 'Sem gasto no mês anterior';
            else if (antes > 0) {
                const d = (total - antes) / antes * 100;
                comp = (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + Math.abs(d).toFixed(0) + '% vs mês anterior';
                corComp = d > 0 ? '#e11d48' : d < 0 ? '#059669' : '#64748b';
            }
        }
        return { c, total, lm, pct, cor, status, corStatus, comp, corComp };
    });
    const estourados = orc.filter(x => x.lm > 0 && x.total > x.lm).length;

    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <span class="text-xs font-bold text-sky-600 uppercase tracking-wider">Mês selecionado</span>
                <h2 class="text-2xl font-bold text-slate-900">${esc(mes.nome)}</h2>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                    <button onclick="excluirMes('${mes.id}')" aria-label="Excluir mês" class="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-2 rounded-lg transition">${LIXEIRA} Excluir mês</button>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                ${card('Receitas', brl(t.receitas), 'text-emerald-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Gastos', brl(t.gastos), 'text-rose-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Investido', brl(t.invest), 'text-cyan-900', '', 'bg-cyan-50 border-cyan-200')}
                ${card('Sobra do mês', brl(t.sobra), t.sobra >= 0 ? 'text-emerald-900' : 'text-rose-600', 'receitas - gastos - investido', 'bg-emerald-50 border-emerald-200')}
                ${card('Saldo na conta', brl(t.conta), t.conta >= 0 ? 'text-slate-900' : 'text-rose-600', 'acumulado até aqui', 'bg-slate-50 border-slate-200')}
                ${card('Patrimônio', brl(t.patrimonio), 'text-sky-900', 'conta + investido', 'bg-sky-50 border-sky-200')}
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Receitas do mês</h3>
            ${mes.receitas.length ? mes.receitas.map(r => `
            <div class="flex items-center gap-2">
                <input type="text" value="${esc(r.descricao)}" aria-label="Descrição da receita" onchange="editarReceita('${mes.id}', '${r.id}', 'descricao', this.value)" class="${campo} flex-1 min-w-0">
                <input type="number" step="0.01" inputmode="decimal" value="${reais(r.valor)}" aria-label="Valor da receita" onchange="editarReceita('${mes.id}', '${r.id}', 'valor', this.value)" class="${campo} w-28 text-right">
                <button onclick="removerReceita('${mes.id}', '${r.id}')" aria-label="Remover receita" class="text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-2.5 rounded-lg">${LIXEIRA}</button>
            </div>`).join('') : '<p class="text-sm text-slate-400 italic">Nenhuma receita neste mês ainda.</p>'}
            <div class="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100">
                <div class="flex-1 min-w-[8rem]">
                    <label for="recDesc_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Nova receita</label>
                    <input type="text" id="recDesc_${mes.id}" placeholder="Ex: Salário, Extra, 13º" class="${campo} w-full">
                </div>
                <div class="w-28">
                    <label for="recVal_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" inputmode="decimal" id="recVal_${mes.id}" placeholder="0.00" class="${campo} w-full text-right">
                </div>
                <button onclick="adicionarReceita('${mes.id}')" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow">+ Adicionar</button>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h3 class="font-bold text-slate-900">Gastos e orçamento por categoria</h3>
                <p class="text-xs text-slate-400">Com limite definido, a barra mostra o quanto do limite já foi usado. Sem limite, mostra a parte de cada categoria nos gastos do mês.</p>
            </div>
            ${estourados ? `<div class="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl">${estourados} ${estourados === 1 ? 'categoria passou' : 'categorias passaram'} do limite neste mês.</div>` : ''}
            <div class="space-y-3">
                ${orc.map(x => `
                <div>
                    <div class="flex justify-between text-xs font-semibold mb-1 gap-2">
                        <span class="text-slate-700">${esc(curto(x.c.nome))}</span>
                        <span class="text-slate-900 font-bold text-right">${brl(x.total)} <span class="text-slate-400 font-normal">${x.lm > 0 ? 'de ' + brl(x.lm) : '(' + x.pct.toFixed(1) + '%)'}</span></span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" style="width:${Math.min(x.pct, 100)}%;background-color:${x.cor}"></div></div>
                    ${x.status ? `<p class="text-[11px] mt-0.5 font-semibold" style="color:${x.corStatus}">${x.status}</p>` : ''}
                    ${x.comp ? `<p class="text-[11px] mt-0.5" style="color:${x.corComp}">${x.comp}</p>` : ''}
                </div>`).join('')}
            </div>
        </div>
        ${resumoPagamento(mes)}

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Adicionar gasto ou investimento</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                    <label for="novaData_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Data</label>
                    <input type="date" id="novaData_${mes.id}" value="${dataPadrao(mes)}" ${lim ? `min="${lim.ini}" max="${lim.fim}"` : ''} class="${campo} w-full">
                </div>
                <div>
                    <label for="novoCat_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                    <select id="novoCat_${mes.id}" class="${campo} w-full">${estado.categorias.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select>
                </div>
                <div>
                    <label for="novoDesc_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                    <input type="text" id="novoDesc_${mes.id}" placeholder="Ex: Mercado, Tesouro" onchange="sugerirCategoria('${mes.id}')" class="${campo} w-full">
                </div>
                <div>
                    <label for="novoValor_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" inputmode="decimal" id="novoValor_${mes.id}" placeholder="0.00" class="${campo} w-full">
                </div>
                <div class="flex items-end">
                    <button onclick="adicionarLanc('${mes.id}')" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow">+ Inserir</button>
                </div>
            </div>
            ${pagamentoCampos(mes, lim)}
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Lançamentos do mês</h3>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input type="search" id="filtroTexto" value="${esc(filtros.texto)}" placeholder="Buscar por descrição" aria-label="Buscar" oninput="filtrar('texto', this.value, '${mes.id}')" class="${campo}">
                <select aria-label="Filtrar por categoria" onchange="filtrar('cat', this.value, '${mes.id}')" class="${campo}">
                    <option value="">Todas as categorias</option>
                    ${estado.categorias.map(c => `<option value="${c.id}" ${filtros.cat === c.id ? 'selected' : ''}>${esc(curto(c.nome))}</option>`).join('')}
                </select>
                <select aria-label="Filtrar por forma de pagamento" onchange="filtrar('pag', this.value, '${mes.id}')" class="${campo}">
                    <option value="">Todas as formas</option>
                    ${FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${filtros.pag === f.id ? 'selected' : ''}>${f.nome}</option>`).join('')}
                    <option value="_" ${filtros.pag === '_' ? 'selected' : ''}>Não informado</option>
                </select>
                <select aria-label="Ordenar" onchange="filtrar('ordem', this.value, '${mes.id}')" class="${campo}">
                    <option value="recentes" ${filtros.ordem === 'recentes' ? 'selected' : ''}>Data: mais recente</option>
                    <option value="antigos" ${filtros.ordem === 'antigos' ? 'selected' : ''}>Data: mais antiga</option>
                    <option value="maior" ${filtros.ordem === 'maior' ? 'selected' : ''}>Maior valor</option>
                </select>
            </div>
            <div id="listaLanc">${renderLista(mes)}</div>
        </div>`;
}

function pagamentoCampos(mes, lim) {
    const campo = 'bg-slate-50 border border-slate-300 rounded-xl p-2 text-sm font-medium';
    const rotulo = 'block text-xs font-bold text-slate-500 mb-1';
    return `
            <div class="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100">
                <div>
                    <label for="novaPag_${mes.id}" class="${rotulo}">Forma de pagamento</label>
                    <select id="novaPag_${mes.id}" onchange="mostrarParcelas('${mes.id}')" class="${campo}">
                        <option value="">Não informar</option>
                        ${FORMAS_PAGAMENTO.map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}
                    </select>
                </div>
                ${lim ? `
                <div id="boxParcelas_${mes.id}" class="hidden">
                    <label for="novaParc_${mes.id}" class="${rotulo}">Parcelas (1 = à vista)</label>
                    <input type="number" min="1" max="48" inputmode="numeric" id="novaParc_${mes.id}" value="1" class="${campo} w-28">
                </div>
                <p id="dicaParcelas_${mes.id}" class="hidden text-[11px] text-slate-400 flex-1 min-w-[10rem]">O valor informado é o total da compra, dividido em parcelas mensais (cartão ou carnê de boletos). Os próximos meses são criados se ainda não existirem.</p>` : ''}
            </div>`;
}

// As parcelas só aparecem quando a forma de pagamento é crédito
function mostrarParcelas(mid) {
    const credito = FORMAS_COM_PARCELA.includes(val('novaPag_' + mid));
    ['boxParcelas_', 'dicaParcelas_'].forEach(p => {
        const el = document.getElementById(p + mid);
        if (el) el.classList.toggle('hidden', !credito);
    });
}

function renderLista(mes) {
    if (!mes.lancamentos.length) return '<p class="text-sm text-slate-400 italic">Nenhum lançamento neste mês ainda.</p>';
    let itens = mes.lancamentos.slice();
    const q = semAcento(filtros.texto);
    if (q) itens = itens.filter(l => semAcento(l.descricao).includes(q) || semAcento(catDoItem(l).nome).includes(q));
    if (filtros.cat) itens = itens.filter(l => l.categoriaId === filtros.cat);
    if (filtros.pag) itens = itens.filter(l => (l.pagamento || '_') === filtros.pag);
    if (filtros.ordem === 'maior') itens.sort((a, b) => num(b.valor) - num(a.valor));
    else if (filtros.ordem === 'antigos') itens.sort((a, b) => a.data.localeCompare(b.data));
    else itens.sort((a, b) => b.data.localeCompare(a.data));
    if (!itens.length) return '<p class="text-sm text-slate-400 italic">Nenhum lançamento encontrado com esses filtros.</p>';
    const soma = itens.reduce((a, l) => a + num(l.valor), 0);
    return `
        <p class="text-xs text-slate-500">${itens.length} ${itens.length === 1 ? 'lançamento' : 'lançamentos'}, total ${brl(soma)}</p>
        <div>${itens.map(l => {
            const c = catDoItem(l), inv = c.tipo === 'investimento';
            return `
            <div class="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate">${esc(l.descricao)}</p>
                    <p class="text-xs text-slate-500 flex items-center gap-1.5"><span class="inline-block w-2 h-2 rounded-full shrink-0" style="background:${c.cor}"></span><span class="truncate">${esc(curto(c.nome))} · ${dataBR(l.data)}${l.pagamento ? ' · ' + nomePag(l.pagamento) : ''}${l.fixaId ? ' · Conta fixa' : ''}</span></p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="text-sm font-bold ${inv ? 'text-cyan-600' : 'text-rose-600'}">${brl(l.valor)}</span>
                    <button onclick="abrirEdicao('${mes.id}', '${l.id}')" class="text-sky-700 hover:text-sky-900 font-bold text-xs bg-sky-50 px-2.5 py-2 rounded-lg">Editar</button>
                    <button onclick="removerLanc('${mes.id}', '${l.id}')" aria-label="Excluir lançamento" class="text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-2 rounded-lg">${LIXEIRA}</button>
                </div>
            </div>`; }).join('')}</div>`;
}

/* ============ Contas fixas ============ */
// Cada conta fixa vira um lançamento comum em cada mês dentro do período dela. O mês guarda quais contas já recebeu
// (fixasAplicadas), então um lançamento que você apagar manualmente num mês não volta sozinho.
function aplicarFixas(m) {
    if (!(m.ano && m.mes)) return;
    const k = m.ano * 12 + m.mes;
    estado.contasFixas.forEach(f => {
        if (m.fixasAplicadas.includes(f.id)) return;
        if (k < chaveMes(f.inicio) || (f.fim && k > chaveMes(f.fim))) return;
        if (f.tipo === 'receita') m.receitas.push({ id: uid(), descricao: f.descricao, valor: f.valor, fixaId: f.id });
        else m.lancamentos.push({ id: uid(), data: diaDoMes(m.ano, m.mes, f.dia), categoriaId: f.categoriaId, descricao: f.descricao, valor: f.valor, pagamento: f.pagamento, grupo: null, parcela: '', fixaId: f.id });
        m.fixasAplicadas.push(f.id);
    });
}
function aplicarFixasTodos() { estado.meses.forEach(aplicarFixas); }

// Se o app ficou sem meses até hoje, cria os meses que faltam depois do último (com as contas fixas)
function garantirMesAtual() {
    const alvo = hojeChave();
    const datados = estado.meses.filter(m => m.ano && m.mes);
    if (!datados.length) return;
    let ult = Math.max(...datados.map(m => m.ano * 12 + m.mes));
    if (alvo - ult > 24) ult = alvo - 24;
    for (let k = ult + 1; k <= alvo; k++) mesDoCalendario(Math.floor((k - 1) / 12), ((k - 1) % 12) + 1);
}

function fixaTipoMudou() {
    const receita = val('fixaTipo') === 'receita';
    ['boxFixaCat', 'boxFixaPag'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', receita); });
}

function adicionarFixa() {
    const tipo = val('fixaTipo') === 'receita' ? 'receita' : 'gasto';
    const desc = val('fixaDesc').trim(), v = centavos(val('fixaValor')), dia = parseInt(val('fixaDia')) || 0;
    const ini = val('fixaInicio'), fim = val('fixaFim');
    let msg = '';
    if (!desc || v <= 0) msg = 'Preencha a descrição e um valor maior que zero.';
    else if (dia < 1 || dia > 31) msg = 'Informe o dia do mês, de 1 a 31.';
    else if (!mesValido(ini)) msg = 'Informe o mês de início (formato 2026-11).';
    else if (fim && (!mesValido(fim) || chaveMes(fim) < chaveMes(ini))) msg = 'O mês final precisa ser igual ou posterior ao inicial.';
    if (msg) { avisar(msg); return; }
    const catPadrao = (estado.categorias.find(c => c.tipo === 'gasto') || estado.categorias[0] || {}).id || null;
    estado.contasFixas.push({ id: 'f_' + uid(), descricao: desc, valor: v, tipo, categoriaId: tipo === 'receita' ? catPadrao : val('fixaCat'), pagamento: tipo === 'receita' ? '' : val('fixaPag'), dia, inicio: ini, fim });
    aplicarFixasTodos();
    salvar();
}

// Mudanças valem do mês atual em diante. Meses passados ficam como estão.
function sincronizarFixa(f) {
    const agora = hojeChave(), ini = chaveMes(f.inicio), fim = f.fim ? chaveMes(f.fim) : Infinity;
    estado.meses.forEach(m => {
        if (!(m.ano && m.mes)) return;
        const k = m.ano * 12 + m.mes;
        if (k < agora) return;
        if (k < ini || k > fim) {
            m.lancamentos = m.lancamentos.filter(l => l.fixaId !== f.id);
            m.receitas = m.receitas.filter(r => r.fixaId !== f.id);
            m.fixasAplicadas = m.fixasAplicadas.filter(x => x !== f.id);
            return;
        }
        m.lancamentos.forEach(l => {
            if (l.fixaId === f.id) { l.descricao = f.descricao; l.valor = f.valor; l.categoriaId = f.categoriaId; l.pagamento = f.pagamento; l.data = diaDoMes(m.ano, m.mes, f.dia); }
        });
        m.receitas.forEach(r => { if (r.fixaId === f.id) { r.descricao = f.descricao; r.valor = f.valor; } });
    });
    aplicarFixasTodos();
}
function editarFixa(id, campo, v) {
    const f = estado.contasFixas.find(x => x.id === id);
    if (!f) return;
    if (campo === 'descricao') f.descricao = String(v).trim() || 'Conta fixa';
    else if (campo === 'valor') f.valor = Math.max(0, centavos(v));
    else if (campo === 'categoriaId' && catPorId(v)) f.categoriaId = v;
    else if (campo === 'pagamento') f.pagamento = FORMAS_PAGAMENTO.some(p => p.id === v) ? v : '';
    else if (campo === 'dia') f.dia = Math.min(31, Math.max(1, parseInt(v) || f.dia));
    else if (campo === 'inicio' && mesValido(v)) f.inicio = v;
    else if (campo === 'fim') f.fim = mesValido(v) && chaveMes(v) >= chaveMes(f.inicio) ? v : '';
    sincronizarFixa(f);
    salvar();
}
async function removerFixa(id) {
    const f = estado.contasFixas.find(x => x.id === id);
    if (!f || !(await confirmar('Excluir a conta fixa "' + f.descricao + '"? Ela deixa de entrar nos próximos meses.', { ok: 'Excluir', perigo: true }))) return;
    const tudo = await confirmar('Remover também os lançamentos dela do mês atual e dos meses passados?', { ok: 'Remover tudo', cancelar: 'Manter histórico', perigo: true });
    const snap = JSON.stringify(estado);
    const agora = hojeChave();
    estado.meses.forEach(m => {
        const k = m.ano && m.mes ? m.ano * 12 + m.mes : -1;
        if (tudo || k > agora) {
            m.lancamentos = m.lancamentos.filter(l => l.fixaId !== id);
            m.receitas = m.receitas.filter(r => r.fixaId !== id);
        }
        m.lancamentos.forEach(l => { if (l.fixaId === id) l.fixaId = ''; });
        m.receitas.forEach(r => { if (r.fixaId === id) r.fixaId = ''; });
        m.fixasAplicadas = m.fixasAplicadas.filter(x => x !== id);
    });
    estado.contasFixas = estado.contasFixas.filter(x => x.id !== id);
    salvar();
    mostrarToast('Conta fixa excluída.', snap);
}

/* ============ Ações ============ */
const achaMes = id => estado.meses.find(m => m.id === id);

function filtrar(campo, valor, mesId) {
    filtros[campo] = valor;
    const m = achaMes(mesId);
    if (m) document.getElementById('listaLanc').innerHTML = renderLista(m);
}

function definirSaldoInicial(v) { estado.saldoInicial = centavos(v); salvar(); }

function adicionarCategoria() {
    estado.categorias.push({ id: 'c_' + uid(), nome: 'Nova categoria', cor: PALETA[estado.categorias.length % PALETA.length], tipo: 'gasto', orcamento: 0 });
    salvar();
}
function editarCategoria(id, campo, v) {
    const c = catPorId(id);
    if (!c) return;
    if (campo === 'nome') c.nome = String(v).trim() || 'Sem nome';
    else if (campo === 'cor' && /^#[0-9a-f]{6}$/i.test(v)) c.cor = v;
    else if (campo === 'tipo') c.tipo = v === 'investimento' ? 'investimento' : 'gasto';
    else if (campo === 'orcamento') c.orcamento = Math.max(0, centavos(v));
    salvar();
}
function adicionarSugerida(id) {
    const sug = CATEGORIAS_SUGERIDAS.find(x => x.id === id);
    if (!sug || estado.categorias.some(c => c.id === id)) return;
    estado.categorias.push({ ...sug });
    salvar();
}
async function removerCategoria(id) {
    const usados = estado.meses.reduce((a, m) => a + m.lancamentos.filter(l => l.categoriaId === id).length, 0)
        + estado.contasFixas.filter(f => f.categoriaId === id).length;
    if (usados) { avisar('Esta categoria está em uso (' + usados + ' lançamento(s) ou conta(s) fixa(s)). Mude a categoria deles antes de excluir.'); return; }
    if (estado.categorias.length <= 1) { avisar('Mantenha ao menos uma categoria.'); return; }
    if (!(await confirmar('Excluir esta categoria?', { ok: 'Excluir', perigo: true }))) return;
    const snap = JSON.stringify(estado);
    estado.categorias = estado.categorias.filter(c => c.id !== id);
    salvar();
    mostrarToast('Categoria excluída.', snap);
}

function adicionarReceita(mid) {
    const m = achaMes(mid), v = centavos(val('recVal_' + mid));
    if (!m) return;
    if (v <= 0) { avisar('Informe um valor maior que zero.'); return; }
    m.receitas.push({ id: uid(), descricao: val('recDesc_' + mid).trim() || 'Receita', valor: v });
    salvar();
}
function editarReceita(mid, rid, campo, v) {
    const m = achaMes(mid), r = m && m.receitas.find(x => x.id === rid);
    if (!r) return;
    if (campo === 'valor') r.valor = Math.max(0, centavos(v)); else r.descricao = String(v).trim() || 'Receita';
    salvar();
}
function removerReceita(mid, rid) {
    const m = achaMes(mid);
    if (!m) return;
    const snap = JSON.stringify(estado);
    m.receitas = m.receitas.filter(r => r.id !== rid);
    salvar();
    mostrarToast('Receita excluída.', snap);
}

function adicionarLanc(mid) {
    const m = achaMes(mid);
    if (!m) return;
    const data = val('novaData_' + mid), desc = val('novoDesc_' + mid).trim(), v = centavos(val('novoValor_' + mid));
    if (!desc || v <= 0) { avisar('Preencha a descrição e um valor maior que zero.'); return; }
    const lim = limitesMes(m);
    if (!data || (lim && (data < lim.ini || data > lim.fim))) { avisar('A data precisa estar dentro de ' + m.nome + '.'); return; }
    const pag = val('novaPag_' + mid);
    const parcelas = FORMAS_COM_PARCELA.includes(pag) ? (parseInt(val('novaParc_' + mid)) || 1) : 1;
    if (parcelas > 48) { avisar('O máximo é 48 parcelas.'); return; }
    if (parcelas > 1 && lim) {
        gerarSerie(data, val('novoCat_' + mid), desc, v, pag, parcelas);
    } else {
        m.lancamentos.push({ id: uid(), data, categoriaId: val('novoCat_' + mid), descricao: desc, valor: v, pagamento: pag, grupo: null, parcela: '' });
    }
    salvar();
}
// Acha o mês do calendário ou cria na posição cronológica
function mesDoCalendario(ano, mes) {
    let x = estado.meses.find(d => d.ano === ano && d.mes === mes);
    if (!x) {
        let id = 'm_' + ano + '_' + pad(mes);
        while (estado.meses.some(d => d.id === id)) id += '_x';
        x = { id, ano, mes, nome: NOMES_MESES[mes - 1] + ' / ' + ano, receitas: [], fixasAplicadas: [], lancamentos: [] };
        estado.meses.splice(posicaoCronologica(ano, mes), 0, x);
        aplicarFixas(x);
    }
    return x;
}

// Compra parcelada no crédito: divide o total em centavos (a sobra vai para a 1ª parcela) e espalha pelos meses seguintes.
function gerarSerie(data, catId, desc, valor, pagamento, qtd) {
    const grupo = uid();
    const dia = parseInt(data.slice(8, 10));
    const base = parseInt(data.slice(0, 4)) * 12 + parseInt(data.slice(5, 7)) - 1;
    const parcela = Math.floor(valor / qtd);
    const resto = valor - parcela * qtd;
    for (let k = 0; k < qtd; k++) {
        const t = base + k, ano = Math.floor(t / 12), mes = (t % 12) + 1;
        const alvo = mesDoCalendario(ano, mes);
        const d = ano + '-' + pad(mes) + '-' + pad(Math.min(dia, new Date(ano, mes, 0).getDate()));
        alvo.lancamentos.push({ id: uid(), data: d, categoriaId: catId, descricao: desc + ' (' + (k + 1) + '/' + qtd + ')', valor: parcela + (k === 0 ? resto : 0), pagamento, grupo, parcela: (k + 1) + '/' + qtd });
    }
}

async function removerLanc(mid, lid) {
    const m = achaMes(mid), l = m && m.lancamentos.find(x => x.id === lid);
    if (!l) return;
    const n = parseInt(l.parcela) || 0;
    const depois = y => l.grupo && y.grupo === l.grupo && (parseInt(y.parcela) || 0) > n;
    let seguintes = false;
    if (estado.meses.some(x => x.lancamentos.some(depois))) {
        seguintes = await confirmar('Este lançamento faz parte de uma série. Excluir também as parcelas seguintes?', { ok: 'Excluir também', cancelar: 'Só este', perigo: true });
    }
    const snap = JSON.stringify(estado);
    estado.meses.forEach(x => {
        x.lancamentos = x.lancamentos.filter(y => y.id !== lid && !(seguintes && depois(y)));
    });
    salvar();
    mostrarToast(seguintes ? 'Lançamento e parcelas seguintes excluídos.' : 'Lançamento excluído.', snap);
}

function abrirEdicao(mid, lid) {
    const m = achaMes(mid), l = m && m.lancamentos.find(x => x.id === lid);
    if (!l) return;
    editando = { mid, lid };
    const lim = limitesMes(m);
    const d = document.getElementById('editData');
    d.value = l.data;
    if (lim) { d.setAttribute('min', lim.ini); d.setAttribute('max', lim.fim); } else { d.removeAttribute('min'); d.removeAttribute('max'); }
    document.getElementById('editCat').innerHTML = (l.categoriaId ? '' : '<option value="">Sem categoria</option>')
        + estado.categorias.map(c => `<option value="${c.id}" ${c.id === l.categoriaId ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
    document.getElementById('editPag').innerHTML = '<option value="">Não informar</option>'
        + FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${f.id === l.pagamento ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('editDesc').value = l.descricao;
    document.getElementById('editValor').value = reais(l.valor);
    document.getElementById('editErro').classList.add('hidden');
    abrir('modalLanc');
}
function salvarEdicao() {
    if (!editando) return;
    const m = achaMes(editando.mid), l = m && m.lancamentos.find(x => x.id === editando.lid);
    if (!l) { fechar('modalLanc'); return; }
    const erro = document.getElementById('editErro');
    const data = val('editData'), desc = val('editDesc').trim(), v = centavos(val('editValor')), lim = limitesMes(m);
    let msg = '';
    if (!desc || v <= 0) msg = 'Preencha a descrição e um valor maior que zero.';
    else if (!data || (lim && (data < lim.ini || data > lim.fim))) msg = 'A data precisa estar dentro de ' + m.nome + '.';
    if (msg) { erro.textContent = msg; erro.classList.remove('hidden'); return; }
    l.data = data; l.descricao = desc; l.valor = v; l.categoriaId = val('editCat') || l.categoriaId;
    l.pagamento = FORMAS_PAGAMENTO.some(f => f.id === val('editPag')) ? val('editPag') : '';
    editando = null;
    fechar('modalLanc');
    salvar();
}

async function excluirMes(id) {
    const m = achaMes(id);
    if (!m) return;
    const q = m.lancamentos.length;
    if (!(await confirmar('Excluir ' + m.nome + ', com ' + q + (q === 1 ? ' lançamento' : ' lançamentos') + ' e suas receitas?', { ok: 'Excluir mês', perigo: true }))) return;
    const snap = JSON.stringify(estado);
    estado.meses = estado.meses.filter(x => x.id !== id);
    abaAtiva = 'resumo_geral';
    salvar();
    mostrarToast('Mês excluído.', snap);
}

function posicaoCronologica(ano, mes) {
    const chave = ano * 12 + mes;
    const i = estado.meses.findIndex(d => d.ano && d.mes && d.ano * 12 + d.mes > chave);
    return i === -1 ? estado.meses.length : i;
}
function abrirModalMes() {
    const datados = estado.meses.filter(d => d.ano && d.mes);
    let ano, mes;
    if (datados.length) {
        const p = datados.reduce((a, b) => (a.ano * 12 + a.mes <= b.ano * 12 + b.mes ? a : b));
        const ant = p.ano * 12 + p.mes - 2;
        ano = Math.floor(ant / 12); mes = (ant % 12) + 1;
    } else {
        const h = new Date(); ano = h.getFullYear(); mes = h.getMonth() + 1;
    }
    document.getElementById('novoMesSel').value = String(mes);
    document.getElementById('novoAnoInp').value = String(ano);
    document.getElementById('modalMesErro').classList.add('hidden');
    abrir('modalMes');
}
function confirmarNovoMes() {
    const mes = parseInt(val('novoMesSel')), ano = parseInt(val('novoAnoInp'));
    const erro = document.getElementById('modalMesErro');
    let msg = '';
    if (!(mes >= 1 && mes <= 12) || !(ano >= 1900 && ano <= 2999)) msg = 'Informe um mês e um ano válidos.';
    else if (estado.meses.some(d => d.ano === ano && d.mes === mes)) msg = NOMES_MESES[mes - 1] + ' / ' + ano + ' já existe.';
    if (msg) { erro.textContent = msg; erro.classList.remove('hidden'); return; }
    let id = 'm_' + ano + '_' + pad(mes);
    while (estado.meses.some(d => d.id === id)) id += '_x';
    const novo = { id, ano, mes, nome: NOMES_MESES[mes - 1] + ' / ' + ano, receitas: [], fixasAplicadas: [], lancamentos: [] };
    estado.meses.splice(posicaoCronologica(ano, mes), 0, novo);
    aplicarFixas(novo);
    abaAtiva = id;
    fechar('modalMes');
    salvar();
}

/* ============ Lançamento rápido ============ */
let ultimaCatRapida = '';
function abrirRapido() {
    const gastoPadrao = (estado.categorias.find(c => c.tipo === 'gasto') || estado.categorias[0] || {}).id || '';
    const cat = estado.categorias.some(c => c.id === ultimaCatRapida) ? ultimaCatRapida : gastoPadrao;
    document.getElementById('rapCat').innerHTML = estado.categorias.map(c => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
    document.getElementById('rapPag').innerHTML = '<option value="">Não informar</option>' + FORMAS_PAGAMENTO.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
    document.getElementById('rapValor').value = '';
    document.getElementById('rapDesc').value = '';
    document.getElementById('rapData').value = hojeISO();
    document.getElementById('rapParc').value = '1';
    document.getElementById('boxRapParc').classList.add('hidden');
    document.getElementById('rapErro').classList.add('hidden');
    abrir('modalRapido');
}
function rapidoMostrarParcelas() {
    document.getElementById('boxRapParc').classList.toggle('hidden', !FORMAS_COM_PARCELA.includes(val('rapPag')));
}
function sugerirRapido() {
    const s = acharSugestao(val('rapDesc'));
    if (!s) return;
    document.getElementById('rapCat').value = s.categoriaId;
    document.getElementById('rapPag').value = s.pagamento;
    rapidoMostrarParcelas();
}
function salvarRapido() {
    const v = centavos(val('rapValor')), desc = val('rapDesc').trim(), data = val('rapData'), cat = val('rapCat'), pag = val('rapPag');
    const parcelas = FORMAS_COM_PARCELA.includes(pag) ? (parseInt(val('rapParc')) || 1) : 1;
    const ano = parseInt(data.slice(0, 4)), mes = parseInt(data.slice(5, 7));
    let msg = '';
    if (v <= 0 || !desc) msg = 'Informe o valor e a descrição.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !(ano >= 1900 && ano <= 2999) || !(mes >= 1 && mes <= 12)) msg = 'Informe uma data válida.';
    else if (parcelas < 1 || parcelas > 48) msg = 'As parcelas vão de 1 a 48.';
    if (msg) { const e = document.getElementById('rapErro'); e.textContent = msg; e.classList.remove('hidden'); return; }
    ultimaCatRapida = cat;
    if (parcelas > 1) gerarSerie(data, cat, desc, v, pag, parcelas);
    else mesDoCalendario(ano, mes).lancamentos.push({ id: uid(), data, categoriaId: cat, descricao: desc, valor: v, pagamento: pag, grupo: null, parcela: '', fixaId: '' });
    fechar('modalRapido');
    salvar();
    mostrarToast('Lançamento salvo em ' + NOMES_MESES[mes - 1] + ' de ' + ano + '.');
}

/* ============ Backup, restauração e CSV ============ */
function baixar(conteudo, tipo, nome) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportarDados() {
    estado.ultimoBackup = hojeISO();
    baixar(JSON.stringify(estado, null, 2), 'application/json', 'Backup_Financeiro_' + hojeISO() + '.json');
    salvar();
}
function importarDados(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const imp = JSON.parse(e.target.result);
            const ok = Array.isArray(imp) ? imp.every(m => m && typeof m === 'object' && m.id) : (imp && Array.isArray(imp.meses));
            if (!ok) { avisar('Arquivo inválido.'); return; }
            if (!(await confirmar('Restaurar este backup vai substituir todos os dados atuais. Continuar?', { ok: 'Restaurar', perigo: true }))) return;
            estado = migrar(imp);
            abaAtiva = 'resumo_geral';
            salvar();
            mostrarToast('Backup restaurado com sucesso.');
        } catch (err) {
            avisar('Erro ao carregar o arquivo JSON.');
        }
    };
    reader.readAsText(arquivo);
    event.target.value = '';
}
function exportarCSV() {
    const protege = t => /^[=+\-@]/.test(String(t)) ? "'" + t : t;
    const fmt = n => (num(n) / 100).toFixed(2).replace('.', ',');
    const linhas = [['Mês', 'Data', 'Tipo', 'Categoria', 'Pagamento', 'Descrição', 'Valor']];
    estado.meses.forEach(m => {
        m.receitas.forEach(r => linhas.push([m.nome, '', 'Receita', '', '', protege(r.descricao), fmt(r.valor)]));
        m.lancamentos.slice().sort((a, b) => a.data.localeCompare(b.data)).forEach(l => {
            const c = catDoItem(l);
            linhas.push([m.nome, dataBR(l.data), c.tipo === 'investimento' ? 'Investimento' : 'Gasto', protege(curto(c.nome)), nomePag(l.pagamento), protege(l.descricao), fmt(l.valor)]);
        });
    });
    const csv = '\ufeff' + linhas.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    baixar(csv, 'text/csv;charset=utf-8', 'Lancamentos_' + hojeISO() + '.csv');
}

/* ============ Tema, PWA e início ============ */
function lerTema() {
    try { return localStorage.getItem('tema') || 'auto'; } catch (e) { return 'auto'; }
}
function aplicarTema() {
    const pref = lerTema();
    const escuro = pref === 'escuro' || (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-tema', escuro ? 'escuro' : 'claro');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', escuro ? '#0b1220' : '#0284c7');
}
function definirTema(v) {
    try { localStorage.setItem('tema', v); } catch (e) { /* ignora */ }
    aplicarTema();
}
function registrarServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Gestos no celular: arrastar da borda esquerda abre o menu, arrastar para a esquerda fecha
let toqueX = null, toqueY = null;
function configurarGestos() {
    document.addEventListener('touchstart', e => { const t = e.touches[0]; toqueX = t.clientX; toqueY = t.clientY; }, { passive: true });
    document.addEventListener('touchend', e => {
        if (toqueX === null || window.innerWidth >= 768) return;
        const t = e.changedTouches[0], dx = t.clientX - toqueX, dy = Math.abs(t.clientY - toqueY);
        const fechado = document.getElementById('sidebar').classList.contains('-translate-x-full');
        if (dy < 60) {
            if (fechado && toqueX < 24 && dx > 60) toggleMobileSidebar();
            else if (!fechado && dx < -60) toggleMobileSidebar();
        }
        toqueX = null;
    }, { passive: true });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const aberta = id => !document.getElementById(id).classList.contains('hidden');
        if (aberta('modalConfirma')) fecharDialogo(false);
        else ['modalRapido', 'modalLanc', 'modalMes'].forEach(id => { if (aberta(id)) fechar(id); });
    });
}

async function iniciar() {
    aplicarTema();
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicarTema);
    estado = await carregar();
    aplicarFixasTodos();
    garantirMesAtual();
    renderizar();
    await persistir();
    if (canal) {
        canal.onmessage = async () => {
            try {
                const e = await lerDB('estado');
                if (e) { estado = migrar(e); renderizar(); }
            } catch (err) { /* ignora */ }
        };
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if (document.addEventListener) configurarGestos();
    registrarServiceWorker();
}

iniciar();
