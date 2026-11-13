// Regras de negócio: totais, saldos acumulados, parcelas e contas fixas. Sem acesso ao DOM.
import { NOMES_MESES } from './constantes.js';
import { chaveMes, diaDoMes, hojeChave, hojeISO, num, pad, semAcento, uid } from './util.js';
import { S } from './estado.js';

export const catPorId = id => S.estado.categorias.find(c => c.id === id);

export const catDoItem = l => catPorId(l.categoriaId) || { id: null, nome: 'Sem categoria', cor: '#94a3b8', tipo: 'gasto', orcamento: 0 };

export function totais(m) {
    let r = 0, g = 0, i = 0;
    m.receitas.forEach(x => { r += num(x.valor); });
    m.lancamentos.forEach(l => {
        const v = num(l.valor);
        if (catDoItem(l).tipo === 'investimento') i += v; else g += v;
    });
    return { receitas: r, gastos: g, invest: i, sobra: r - g - i };
}

export const chaveCron = m => (m.ano && m.mes ? m.ano * 12 + m.mes : Infinity);

export function mesesCronologicos() {
    return S.estado.meses.slice().sort((a, b) => (chaveCron(a) < chaveCron(b) ? -1 : chaveCron(a) > chaveCron(b) ? 1 : 0));
}

// Saldo e patrimônio acumulados seguem a ordem cronológica (meses sem data vão para o fim).
// A ordem da barra lateral é só visual e não muda as contas.
export function acumulados() {
    let conta = num(S.estado.saldoInicial), inv = 0;
    const out = {};
    mesesCronologicos().forEach(m => {
        const t = totais(m);
        conta += t.sobra; inv += t.invest;
        out[m.id] = { ...t, conta, invAcum: inv, patrimonio: conta + inv };
    });
    return out;
}

export function gastosPorCategoria(meses) {
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

export function limitesMes(m) {
    if (!(m.ano && m.mes)) return null;
    const base = m.ano + '-' + pad(m.mes) + '-';
    return { ini: base + '01', fim: base + pad(new Date(m.ano, m.mes, 0).getDate()) };
}

export function dataPadrao(m) {
    const hoje = hojeISO(), lim = limitesMes(m);
    if (!lim) return hoje;
    return hoje >= lim.ini && hoje <= lim.fim ? hoje : lim.ini;
}

export function triDe(m) { return m.ano && m.mes ? m.ano + '-T' + Math.ceil(m.mes / 3) : 'sem'; }

export function ehAbaTri(id) { return id === 'sem' || /^\d{4}-T[1-4]$/.test(id); }

export function rotuloTri(k) { const r = /^(\d{4})-T([1-4])$/.exec(k); return r ? r[2] + 'º Trimestre ' + r[1] : 'Sem trimestre'; }

export function chavesTrimestres() {
    return [...new Set(S.estado.meses.map(triDe))].sort((a, b) => a === 'sem' ? 1 : b === 'sem' ? -1 : a.localeCompare(b));
}

// Sugere categoria e forma de pagamento pela última vez que você lançou a mesma descrição
export const chaveDesc = t => semAcento(String(t).replace(/\s*\(\d+\/\d+\)\s*$/, '')).trim();

export function acharSugestao(desc) {
    const k = chaveDesc(desc);
    if (!k) return null;
    let achado = null;
    S.estado.meses.forEach(m => m.lancamentos.forEach(l => {
        if (chaveDesc(l.descricao) === k && l.categoriaId && (!achado || (l.data || '') >= (achado.data || ''))) achado = l;
    }));
    return achado ? { categoriaId: achado.categoriaId, pagamento: achado.pagamento || '' } : null;
}

// Cada conta fixa vira um lançamento comum em cada mês dentro do período dela. O mês guarda quais contas já recebeu
// (fixasAplicadas), então um lançamento que você apagar manualmente num mês não volta sozinho.
export function aplicarFixas(m) {
    if (!(m.ano && m.mes)) return;
    const k = m.ano * 12 + m.mes;
    S.estado.contasFixas.forEach(f => {
        if (m.fixasAplicadas.includes(f.id)) return;
        if (k < chaveMes(f.inicio) || (f.fim && k > chaveMes(f.fim))) return;
        if (f.tipo === 'receita') m.receitas.push({ id: uid(), descricao: f.descricao, valor: f.valor, fixaId: f.id });
        else m.lancamentos.push({ id: uid(), data: diaDoMes(m.ano, m.mes, f.dia), categoriaId: f.categoriaId, descricao: f.descricao, valor: f.valor, pagamento: f.pagamento, grupo: null, parcela: '', fixaId: f.id });
        m.fixasAplicadas.push(f.id);
    });
}

export function aplicarFixasTodos() { S.estado.meses.forEach(aplicarFixas); }

// Se o app ficou sem meses até hoje, cria os meses que faltam depois do último (com as contas fixas)
export function garantirMesAtual() {
    const alvo = hojeChave();
    const datados = S.estado.meses.filter(m => m.ano && m.mes);
    if (!datados.length) return;
    let ult = Math.max(...datados.map(m => m.ano * 12 + m.mes));
    if (alvo - ult > 24) ult = alvo - 24;
    for (let k = ult + 1; k <= alvo; k++) mesDoCalendario(Math.floor((k - 1) / 12), ((k - 1) % 12) + 1);
}

export const achaMes = id => S.estado.meses.find(m => m.id === id);

// Acha o mês do calendário ou cria na posição cronológica
export function mesDoCalendario(ano, mes) {
    let x = S.estado.meses.find(d => d.ano === ano && d.mes === mes);
    if (!x) {
        let id = 'm_' + ano + '_' + pad(mes);
        while (S.estado.meses.some(d => d.id === id)) id += '_x';
        x = { id, ano, mes, nome: NOMES_MESES[mes - 1] + ' / ' + ano, receitas: [], fixasAplicadas: [], lancamentos: [] };
        S.estado.meses.splice(posicaoCronologica(ano, mes), 0, x);
        aplicarFixas(x);
    }
    return x;
}

// Compra parcelada no crédito: divide o total em centavos (a sobra vai para a 1ª parcela) e espalha pelos meses seguintes.
export function gerarSerie(data, catId, desc, valor, pagamento, qtd) {
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

export function posicaoCronologica(ano, mes) {
    const chave = ano * 12 + mes;
    const i = S.estado.meses.findIndex(d => d.ano && d.mes && d.ano * 12 + d.mes > chave);
    return i === -1 ? S.estado.meses.length : i;
}
