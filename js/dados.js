// Formato dos dados e migrações entre versões. Funções puras, sem acesso ao navegador.
import { ABREV_MESES, CATEGORIAS_PADRAO, CATEGORIAS_SUGERIDAS, CATEGORIAS_TODAS, FORMAS_PAGAMENTO, NOMES_MESES, VERSAO_DADOS } from './constantes.js';
import { curto, mesAtualISO, mesValido, num, pad, semAcento, uid } from './util.js';

export function interpretarMes(m) {
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

export function resolverCat(l, cats) {
    if (l.categoriaId && cats.some(c => c.id === l.categoriaId)) return l.categoriaId;
    const alvo = semAcento(curto(l.categoria));
    const c = cats.find(c => semAcento(curto(c.nome)) === alvo)
        || (alvo.includes('investimento') ? cats.find(c => c.tipo === 'investimento') : null);
    return c ? c.id : null;
}

// Leva qualquer versão antiga dos dados para a versão atual. Para criar a versão 4 no futuro,
// aumente VERSAO_DADOS e trate a nova mudança dentro de normalizar().
export function migrar(bruto) {
    const versao = Array.isArray(bruto) ? 1 : (parseInt(bruto.versao) || 2);
    return normalizar(bruto, versao);
}

export function normalizar(bruto, versaoOrigem) {
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
    return { versao: VERSAO_DADOS, saldoInicial: ehLista ? 0 : conv(bruto.saldoInicial), boasVindasOk: !ehLista && !!bruto.boasVindasOk, ultimoBackup: feitoEm, backupAdiadoAte: !ehLista && /^\d{4}-\d{2}-\d{2}$/.test(String(bruto.backupAdiadoAte || '')) ? String(bruto.backupAdiadoAte) : '', categorias: cats, contasFixas, meses };
}

export function normalizarFixas(lista, categorias) {
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

export function mesesIniciais() {
    const d = new Date(), ano = d.getFullYear(), mes = d.getMonth() + 1;
    return [{ id: 'm_' + ano + '_' + pad(mes), ano, mes, receitas: [], lancamentos: [] }];
}

export function contar(bruto) {
    const lista = Array.isArray(bruto) ? bruto : (bruto && Array.isArray(bruto.meses) ? bruto.meses : []);
    return lista.reduce((a, m) => a + (m && Array.isArray(m.lancamentos) ? m.lancamentos.length : 0), 0);
}

// Confere se um arquivo de backup tem o formato esperado, antes de tocar nos dados atuais.
export function validarBackup(imp) {
    const ehLista = Array.isArray(imp);
    const lista = ehLista ? imp : (imp && typeof imp === 'object' ? imp.meses : null);
    if (!Array.isArray(lista)) return { ok: false, erro: 'O arquivo não parece ser um backup deste app.' };
    if (lista.length > 1200) return { ok: false, erro: 'O arquivo tem meses demais.' };
    for (const m of lista) {
        if (!m || typeof m !== 'object' || !m.id) return { ok: false, erro: 'Um dos meses do arquivo está incompleto.' };
        for (const campo of ['lancamentos', 'receitas']) {
            if (m[campo] !== undefined && !Array.isArray(m[campo])) return { ok: false, erro: 'Um dos meses tem ' + campo + ' em formato inesperado.' };
            if ((m[campo] || []).length > 50000) return { ok: false, erro: 'Um dos meses tem registros demais.' };
        }
    }
    if (!ehLista) {
        for (const campo of ['categorias', 'contasFixas']) {
            if (imp[campo] !== undefined && !Array.isArray(imp[campo])) return { ok: false, erro: campo + ' em formato inesperado.' };
        }
    }
    return { ok: true, erro: '' };
}
