// Ações do usuário (botões, campos e janelas). Chamadas pelo despachante de eventos em main.js.
import { CATEGORIAS_SUGERIDAS, FORMAS_COM_PARCELA, FORMAS_PAGAMENTO, MAX_BACKUP_BYTES, NOMES_MESES, PALETA, nomePag } from './constantes.js';
import { brl, centavos, chaveMes, curto, dataBR, diaDoMes, esc, ev, hojeChave, hojeISO, mesValido, num, pad, reais, uid } from './util.js';
import { S } from './estado.js';
import { migrar, validarBackup } from './dados.js';
import { achaMes, acharSugestao, aplicarFixas, aplicarFixasTodos, catDoItem, catPorId, dataDeCobranca, gerarSerie, limitesMes, mesDoCalendario, posicaoCronologica, totais } from './calculos.js';
import { lerSnapshots, salvar, salvarSnapshot } from './armazenamento.js';
import { abrir, aplicarEstilos, avisar, confirmar, fechar, focarCampo, limparErro, marcado, marcarRadio, mostrarErro, mostrarToast, val, valorRadio } from './ui.js';
import { chipsRadio, renderLista } from './views.js';

export function dispensarBoasVindas() { S.estado.boasVindasOk = true; salvar(); }

export function adiarBackup() {
    const d = new Date(Date.now() + 30 * 86400000);
    S.estado.backupAdiadoAte = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    salvar();
}

export function sugerirCategoria(mid) {
    const s = acharSugestao(val('novoDesc_' + mid));
    if (!s) return;
    marcarRadio('novoCat_' + mid, s.categoriaId);
    marcarRadio('novaPag_' + mid, s.pagamento);
    mostrarParcelas(mid);
}

// Enter na descrição aplica a sugestão e leva o foco ao botão Inserir
export function aposDescLanc(mid) {
    sugerirCategoria(mid);
    focarCampo('btnInserir_' + mid);
}

export async function restaurarPonto(id) {
    const ponto = (await lerSnapshots()).find(x => x.id === id);
    if (!ponto) return;
    if (!(await confirmar('Voltar para este ponto vai substituir os dados atuais. Um ponto com os dados de agora é guardado antes, para você poder voltar.', { ok: 'Restaurar', perigo: true }))) return;
    await salvarSnapshot(JSON.stringify(S.estado), 'atualizacao');
    S.estado = migrar(JSON.parse(ponto.json));
    salvar();
    mostrarToast('Dados restaurados.');
}

// As parcelas só aparecem quando a forma de pagamento é crédito
export function mostrarParcelas(mid) {
    const credito = FORMAS_COM_PARCELA.includes(valorRadio('novaPag_' + mid));
    const box = document.getElementById('boxParcelas_' + mid);
    if (box) box.classList.toggle('hidden', !credito);
}

export function fixaTipoMudou() {
    const receita = val('fixaTipo') === 'receita';
    ['boxFixaCat', 'boxFixaPag'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('hidden', receita); });
}

export function adicionarFixa() {
    const tipo = val('fixaTipo') === 'receita' ? 'receita' : 'gasto';
    const desc = val('fixaDesc').trim(), v = centavos(val('fixaValor')), dia = parseInt(val('fixaDia')) || 0;
    const ini = val('fixaInicio'), fim = val('fixaFim');
    let msg = '';
    if (!desc || v <= 0) msg = 'Preencha a descrição e um valor maior que zero.';
    else if (dia < 1 || dia > 31) msg = 'Informe o dia do mês, de 1 a 31.';
    else if (!mesValido(ini)) msg = 'Informe o mês de início (formato 2026-11).';
    else if (fim && (!mesValido(fim) || chaveMes(fim) < chaveMes(ini))) msg = 'O mês final precisa ser igual ou posterior ao inicial.';
    limparErro('erroFixa');
    if (msg) { mostrarErro('erroFixa', msg); return; }
    const catPadrao = (S.estado.categorias.find(c => c.tipo === 'gasto') || S.estado.categorias[0] || {}).id || null;
    S.estado.contasFixas.push({ id: 'f_' + uid(), descricao: desc, valor: v, tipo, categoriaId: tipo === 'receita' ? catPadrao : val('fixaCat'), pagamento: tipo === 'receita' ? '' : val('fixaPag'), dia, inicio: ini, fim });
    aplicarFixasTodos();
    salvar();
}

// Mudanças valem do mês atual em diante. Meses passados ficam como estão.
export function sincronizarFixa(f) {
    const agora = hojeChave(), ini = chaveMes(f.inicio), fim = f.fim ? chaveMes(f.fim) : Infinity;
    S.estado.meses.forEach(m => {
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

export function editarFixa(id, campo, v) {
    const f = S.estado.contasFixas.find(x => x.id === id);
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

export async function removerFixa(id) {
    const f = S.estado.contasFixas.find(x => x.id === id);
    if (!f || !(await confirmar('Excluir a conta fixa "' + f.descricao + '"? Ela deixa de entrar nos próximos meses.', { ok: 'Excluir', perigo: true }))) return;
    const tudo = await confirmar('Remover também os lançamentos dela do mês atual e dos meses passados?', { ok: 'Remover tudo', cancelar: 'Manter histórico', perigo: true });
    const snap = JSON.stringify(S.estado);
    const agora = hojeChave();
    S.estado.meses.forEach(m => {
        const k = m.ano && m.mes ? m.ano * 12 + m.mes : -1;
        if (tudo || k > agora) {
            m.lancamentos = m.lancamentos.filter(l => l.fixaId !== id);
            m.receitas = m.receitas.filter(r => r.fixaId !== id);
        }
        m.lancamentos.forEach(l => { if (l.fixaId === id) l.fixaId = ''; });
        m.receitas.forEach(r => { if (r.fixaId === id) r.fixaId = ''; });
        m.fixasAplicadas = m.fixasAplicadas.filter(x => x !== id);
    });
    S.estado.contasFixas = S.estado.contasFixas.filter(x => x.id !== id);
    salvar();
    mostrarToast('Conta fixa excluída.', snap);
}

export function filtrar(campo, mesId, valor) {
    S.filtros[campo] = valor;
    const m = achaMes(mesId);
    if (m) {
        const lista = document.getElementById('listaLanc');
        lista.innerHTML = renderLista(m);
        aplicarEstilos(lista);
    }
}

export function aposDescRapida() { sugerirRapido(); focarCampo('rapCat'); }

export function definirSaldoInicial(v) { S.estado.saldoInicial = centavos(v); salvar(); }
export function definirSaldoInicialInvest(v) { S.estado.saldoInicialInvest = Math.max(0, centavos(v)); salvar(); }
export function definirGastoInicial(v) { S.estado.gastoInicial = Math.max(0, centavos(v)); salvar(); }

// Jeito que o cartão de crédito da pessoa funciona (vencimento no mês seguinte, dia de vencimento e de fechamento)
export function definirCredito(campo, valor) {
    const c = S.estado.credito;
    if (campo === 'vence') c.vence = valor === 'seguinte' ? 'seguinte' : 'mesmo';
    else if (campo === 'diaVencimento') c.diaVencimento = Math.min(31, Math.max(1, parseInt(valor) || c.diaVencimento));
    else if (campo === 'diaFechamento') c.diaFechamento = Math.min(31, Math.max(0, parseInt(valor) || 0));
    salvar();
}

// Texto do aviso quando uma compra no crédito cai em outro mês por causa da fatura
function avisoFatura(data, pag) {
    if (pag !== 'credito') return '';
    const c = dataDeCobranca(data, S.estado.credito);
    return c.compra ? `Compra no crédito lançada na fatura de ${NOMES_MESES[c.mes - 1]} (vence ${dataBR(c.data)}).` : '';
}

export function editarCategoria(id, campo, v) {
    const c = catPorId(id);
    if (!c) return;
    if (campo === 'nome') c.nome = String(v).trim() || 'Sem nome';
    else if (campo === 'cor' && /^#[0-9a-f]{6}$/i.test(v)) c.cor = v;
    else if (campo === 'tipo') c.tipo = v === 'investimento' ? 'investimento' : 'gasto';
    else if (campo === 'orcamento') c.orcamento = Math.max(0, centavos(v));
    salvar();
}

export function adicionarCategoria() {
    S.estado.categorias.push({ id: 'c_' + uid(), nome: 'Nova categoria', cor: PALETA[S.estado.categorias.length % PALETA.length], tipo: 'gasto', orcamento: 0 });
    salvar();
}

export function adicionarSugerida(id) {
    const sug = CATEGORIAS_SUGERIDAS.find(x => x.id === id);
    if (!sug || S.estado.categorias.some(c => c.id === id)) return;
    S.estado.categorias.push({ ...sug });
    salvar();
}

export async function removerCategoria(id) {
    const usados = S.estado.meses.reduce((a, m) => a + m.lancamentos.filter(l => l.categoriaId === id).length, 0)
        + S.estado.contasFixas.filter(f => f.categoriaId === id).length;
    if (usados) { avisar('Esta categoria está em uso (' + usados + ' lançamento(s) ou conta(s) fixa(s)). Mude a categoria deles antes de excluir.'); return; }
    if (S.estado.categorias.length <= 1) { avisar('Mantenha ao menos uma categoria.'); return; }
    if (!(await confirmar('Excluir esta categoria?', { ok: 'Excluir', perigo: true }))) return;
    const snap = JSON.stringify(S.estado);
    S.estado.categorias = S.estado.categorias.filter(c => c.id !== id);
    salvar();
    mostrarToast('Categoria excluída.', snap);
}

export function adicionarReceita(mid) {
    const m = achaMes(mid), v = centavos(val('recVal_' + mid));
    if (!m) return;
    limparErro('erroRec_' + mid);
    if (v <= 0) { mostrarErro('erroRec_' + mid, 'Informe um valor maior que zero.'); focarCampo('recVal_' + mid); return; }
    m.receitas.push({ id: uid(), descricao: val('recDesc_' + mid).trim() || 'Receita', valor: v });
    salvar();
    focarCampo('recDesc_' + mid);
}

export function editarReceita(mid, rid, campo, v) {
    const m = achaMes(mid), r = m && m.receitas.find(x => x.id === rid);
    if (!r) return;
    if (campo === 'valor') r.valor = Math.max(0, centavos(v)); else r.descricao = String(v).trim() || 'Receita';
    salvar();
}

export function removerReceita(mid, rid) {
    const m = achaMes(mid);
    if (!m) return;
    const snap = JSON.stringify(S.estado);
    m.receitas = m.receitas.filter(r => r.id !== rid);
    salvar();
    mostrarToast('Receita excluída.', snap);
}

export function adicionarLanc(mid) {
    const m = achaMes(mid);
    if (!m) return;
    const erro = (msg, campo) => { mostrarErro('erroLanc_' + mid, msg); if (campo) focarCampo(campo + mid); };
    limparErro('erroLanc_' + mid);
    let v = centavos(val('novoValor_' + mid));
    if (marcado('novoEstorno_' + mid)) v = -Math.abs(v);
    const data = val('novaData_' + mid), desc = val('novoDesc_' + mid).trim();
    const cat = valorRadio('novoCat_' + mid), pag = valorRadio('novaPag_' + mid);
    if (v === 0) { erro('Informe o valor (maior que zero, ou marque Estorno).', 'novoValor_'); return; }
    if (!desc) { erro('Informe a descrição.', 'novoDesc_'); return; }
    if (!cat) { erro('Escolha uma categoria.'); return; }
    const lim = limitesMes(m);
    if (!data || (lim && (data < lim.ini || data > lim.fim))) { erro('A data precisa estar dentro de ' + m.nome + '.', 'novaData_'); return; }
    const parcelas = FORMAS_COM_PARCELA.includes(pag) ? (parseInt(val('novaParc_' + mid)) || 1) : 1;
    if (parcelas > 48) { erro('O máximo é 48 parcelas.', 'novaParc_'); return; }
    if (v < 0 && parcelas > 1) { erro('Um estorno não pode ser parcelado.'); return; }
    let aviso = '';
    if (parcelas > 1 && lim) {
        gerarSerie(data, cat, desc, v, pag, parcelas);
        aviso = avisoFatura(data, pag);
    } else if (pag === 'credito' && lim) {
        const c = dataDeCobranca(data, S.estado.credito);
        mesDoCalendario(c.ano, c.mes).lancamentos.push({ id: uid(), data: c.data, compra: c.compra, categoriaId: cat, descricao: desc, valor: v, pagamento: pag, grupo: null, parcela: '', fixaId: '' });
        aviso = avisoFatura(data, pag);
    } else {
        m.lancamentos.push({ id: uid(), data, compra: '', categoriaId: cat, descricao: desc, valor: v, pagamento: pag, grupo: null, parcela: '', fixaId: '' });
    }
    salvar();
    if (aviso) mostrarToast(aviso);
    focarCampo('novoValor_' + mid);
}

export async function removerLanc(mid, lid) {
    const m = achaMes(mid), l = m && m.lancamentos.find(x => x.id === lid);
    if (!l) return;
    const n = parseInt(l.parcela) || 0;
    const depois = y => l.grupo && y.grupo === l.grupo && (parseInt(y.parcela) || 0) > n;
    let seguintes = false;
    if (S.estado.meses.some(x => x.lancamentos.some(depois))) {
        seguintes = await confirmar('Este lançamento faz parte de uma série. Excluir também as parcelas seguintes?', { ok: 'Excluir também', cancelar: 'Só este', perigo: true });
    }
    const snap = JSON.stringify(S.estado);
    S.estado.meses.forEach(x => {
        x.lancamentos = x.lancamentos.filter(y => y.id !== lid && !(seguintes && depois(y)));
    });
    salvar();
    mostrarToast(seguintes ? 'Lançamento e parcelas seguintes excluídos.' : 'Lançamento excluído.', snap);
}

export function abrirEdicao(mid, lid) {
    const m = achaMes(mid), l = m && m.lancamentos.find(x => x.id === lid);
    if (!l) return;
    S.editando = { mid, lid };
    const lim = limitesMes(m);
    const d = document.getElementById('editData');
    d.value = l.data;
    if (lim) { d.setAttribute('min', lim.ini); d.setAttribute('max', lim.fim); } else { d.removeAttribute('min'); d.removeAttribute('max'); }
    document.getElementById('editCat').innerHTML = (l.categoriaId ? '' : '<option value="">Sem categoria</option>')
        + S.estado.categorias.map(c => `<option value="${c.id}" ${c.id === l.categoriaId ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
    document.getElementById('editPag').innerHTML = '<option value="">Não informar</option>'
        + FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${f.id === l.pagamento ? 'selected' : ''}>${f.nome}</option>`).join('');
    document.getElementById('editDesc').value = l.descricao;
    document.getElementById('editValor').value = reais(l.valor);
    document.getElementById('editErro').classList.add('hidden');
    abrir('modalLanc');
}

export function salvarEdicao() {
    if (!S.editando) return;
    const m = achaMes(S.editando.mid), l = m && m.lancamentos.find(x => x.id === S.editando.lid);
    if (!l) { fechar('modalLanc'); return; }
    const erro = document.getElementById('editErro');
    const data = val('editData'), desc = val('editDesc').trim(), v = centavos(val('editValor')), lim = limitesMes(m);
    let msg = '';
    if (!desc || v === 0) msg = 'Preencha a descrição e um valor diferente de zero (negativo para estorno).';
    else if (!data || (lim && (data < lim.ini || data > lim.fim))) msg = 'A data precisa estar dentro de ' + m.nome + '.';
    if (msg) { erro.textContent = msg; erro.classList.remove('hidden'); return; }
    l.data = data; l.descricao = desc; l.valor = v; l.categoriaId = val('editCat') || l.categoriaId;
    l.pagamento = FORMAS_PAGAMENTO.some(f => f.id === val('editPag')) ? val('editPag') : '';
    S.editando = null;
    fechar('modalLanc');
    salvar();
}

export async function excluirMes(id) {
    const m = achaMes(id);
    if (!m) return;
    const q = m.lancamentos.length;
    if (!(await confirmar('Excluir ' + m.nome + ', com ' + q + (q === 1 ? ' lançamento' : ' lançamentos') + ' e suas receitas?', { ok: 'Excluir mês', perigo: true }))) return;
    const snap = JSON.stringify(S.estado);
    S.estado.meses = S.estado.meses.filter(x => x.id !== id);
    S.abaAtiva = 'resumo_geral';
    salvar();
    mostrarToast('Mês excluído.', snap);
}

export function abrirModalMes() {
    const datados = S.estado.meses.filter(d => d.ano && d.mes);
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

export function confirmarNovoMes() {
    const mes = parseInt(val('novoMesSel')), ano = parseInt(val('novoAnoInp'));
    const erro = document.getElementById('modalMesErro');
    let msg = '';
    if (!(mes >= 1 && mes <= 12) || !(ano >= 1900 && ano <= 2999)) msg = 'Informe um mês e um ano válidos.';
    else if (S.estado.meses.some(d => d.ano === ano && d.mes === mes)) msg = NOMES_MESES[mes - 1] + ' / ' + ano + ' já existe.';
    if (msg) { erro.textContent = msg; erro.classList.remove('hidden'); return; }
    let id = 'm_' + ano + '_' + pad(mes);
    while (S.estado.meses.some(d => d.id === id)) id += '_x';
    const novo = { id, ano, mes, nome: NOMES_MESES[mes - 1] + ' / ' + ano, receitas: [], fixasAplicadas: [], lancamentos: [] };
    S.estado.meses.splice(posicaoCronologica(ano, mes), 0, novo);
    aplicarFixas(novo);
    S.abaAtiva = id;
    fechar('modalMes');
    salvar();
}

export function abrirRapido() {
    const gastoPadrao = (S.estado.categorias.find(c => c.tipo === 'gasto') || S.estado.categorias[0] || {}).id || '';
    const cat = S.estado.categorias.some(c => c.id === S.ultimaCatRapida) ? S.ultimaCatRapida : gastoPadrao;
    document.getElementById('rapCat').innerHTML = chipsRadio('rapCat', S.estado.categorias.map(c => ({ valor: c.id, rotulo: esc(curto(c.nome)) })), cat);
    document.getElementById('rapPag').innerHTML = chipsRadio('rapPag', [{ valor: '', rotulo: 'Não informar' }, ...FORMAS_PAGAMENTO.map(f => ({ valor: f.id, rotulo: f.nome }))], '', ev('change', 'rapidoMostrarParcelas'));
    document.getElementById('rapValor').value = '';
    document.getElementById('rapDesc').value = '';
    document.getElementById('rapData').value = hojeISO();
    document.getElementById('rapParc').value = '1';
    document.getElementById('rapEstorno').checked = false;
    document.getElementById('boxRapParc').classList.add('hidden');
    limparErro('rapErro');
    abrir('modalRapido');
}

export function rapidoMostrarParcelas() {
    document.getElementById('boxRapParc').classList.toggle('hidden', !FORMAS_COM_PARCELA.includes(valorRadio('rapPag')));
}

export function sugerirRapido() {
    const s = acharSugestao(val('rapDesc'));
    if (!s) return;
    marcarRadio('rapCat', s.categoriaId);
    marcarRadio('rapPag', s.pagamento);
    rapidoMostrarParcelas();
}

export function salvarRapido() {
    let v = centavos(val('rapValor'));
    if (marcado('rapEstorno')) v = -Math.abs(v);
    const desc = val('rapDesc').trim(), data = val('rapData'), cat = valorRadio('rapCat'), pag = valorRadio('rapPag');
    const parcelas = FORMAS_COM_PARCELA.includes(pag) ? (parseInt(val('rapParc')) || 1) : 1;
    const ano = parseInt(data.slice(0, 4)), mes = parseInt(data.slice(5, 7));
    let msg = '';
    if (v === 0 || !desc) msg = 'Informe o valor (maior que zero, ou marque Estorno) e a descrição.';
    else if (!cat) msg = 'Escolha uma categoria.';
    else if (v < 0 && parcelas > 1) msg = 'Um estorno não pode ser parcelado.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !(ano >= 1900 && ano <= 2999) || !(mes >= 1 && mes <= 12)) msg = 'Informe uma data válida.';
    else if (parcelas < 1 || parcelas > 48) msg = 'As parcelas vão de 1 a 48.';
    if (msg) { mostrarErro('rapErro', msg); return; }
    S.ultimaCatRapida = cat;
    const aviso = avisoFatura(data, pag);
    if (parcelas > 1) {
        gerarSerie(data, cat, desc, v, pag, parcelas);
    } else {
        const c = pag === 'credito' ? dataDeCobranca(data, S.estado.credito) : { ano, mes, data, compra: '' };
        mesDoCalendario(c.ano, c.mes).lancamentos.push({ id: uid(), data: c.data, compra: c.compra, categoriaId: cat, descricao: desc, valor: v, pagamento: pag, grupo: null, parcela: '', fixaId: '' });
    }
    fechar('modalRapido');
    salvar();
    mostrarToast(aviso || ('Lançamento salvo em ' + NOMES_MESES[mes - 1] + ' de ' + ano + '.'));
}

// Reembolso (por exemplo, o amigo devolveu a parte dele): abre o lançamento rápido já como estorno,
// na mesma categoria, para o gasto continuar só com a sua parte
export function reembolsar(mid, lid) {
    const m = achaMes(mid), l = m && m.lancamentos.find(x => x.id === lid);
    if (!l) return;
    abrirRapido();
    document.getElementById('rapDesc').value = 'Reembolso: ' + l.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '');
    marcarRadio('rapCat', l.categoriaId);
    document.getElementById('rapEstorno').checked = true;
    focarCampo('rapValor');
}

export function baixar(conteudo, tipo, nome) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportarDados() {
    S.estado.ultimoBackup = hojeISO();
    baixar(JSON.stringify(S.estado, null, 2), 'application/json', 'Backup_Financeiro_' + hojeISO() + '.json');
    salvar();
}

export function importarDados(_valor, input) {
    const arquivo = input && input.files && input.files[0];
    if (!arquivo) return;
    if (arquivo.size > MAX_BACKUP_BYTES) { avisar('O arquivo é grande demais para ser um backup (limite de 5 MB).'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const imp = JSON.parse(e.target.result);
            const v = validarBackup(imp);
            if (!v.ok) { avisar(v.erro); return; }
            if (!(await confirmar('Restaurar este backup vai substituir todos os dados atuais. Continuar?', { ok: 'Restaurar', perigo: true }))) return;
            await salvarSnapshot(JSON.stringify(S.estado), 'atualizacao');
            S.estado = migrar(imp);
            S.abaAtiva = 'resumo_geral';
            salvar();
            mostrarToast('Backup restaurado com sucesso.');
        } catch (err) {
            avisar('Erro ao carregar o arquivo JSON.');
        }
    };
    reader.readAsText(arquivo);
    input.value = '';
}

export function exportarCSV() {
    const protege = t => /^[=+\-@]/.test(String(t)) ? "'" + t : t;
    const fmt = n => (num(n) / 100).toFixed(2).replace('.', ',');
    const linhas = [['Mês', 'Data', 'Compra', 'Tipo', 'Categoria', 'Pagamento', 'Descrição', 'Valor']];
    S.estado.meses.forEach(m => {
        m.receitas.forEach(r => linhas.push([m.nome, '', '', 'Receita', '', '', protege(r.descricao), fmt(r.valor)]));
        m.lancamentos.slice().sort((a, b) => a.data.localeCompare(b.data)).forEach(l => {
            const c = catDoItem(l);
            linhas.push([m.nome, dataBR(l.data), l.compra ? dataBR(l.compra) : '', c.tipo === 'investimento' ? 'Investimento' : 'Gasto', protege(curto(c.nome)), nomePag(l.pagamento), protege(l.descricao), fmt(l.valor)]);
        });
    });
    const csv = '\ufeff' + linhas.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    baixar(csv, 'text/csv;charset=utf-8', 'Lancamentos_' + hojeISO() + '.csv');
}

export function adicionarMeta() {
    const nome = val('metaNome').trim(), alvo = centavos(val('metaAlvo')), inicial = Math.max(0, centavos(val('metaInicial')));
    const cat = val('metaCat'), prazo = val('metaPrazo');
    limparErro('erroMeta');
    let msg = '';
    if (!nome) msg = 'Dê um nome para a meta.';
    else if (alvo <= 0) msg = 'Informe o valor da meta.';
    else if (!S.estado.categorias.some(c => c.id === cat && c.tipo === 'investimento')) msg = 'Escolha uma categoria de investimento.';
    else if (prazo && !mesValido(prazo)) msg = 'O prazo precisa ser um mês válido.';
    if (msg) { mostrarErro('erroMeta', msg); return; }
    S.estado.metas.push({ id: 'g_' + uid(), nome, alvo, inicial, categoriaId: cat, prazo });
    salvar();
}

export function editarMeta(id, campo, v) {
    const m = S.estado.metas.find(x => x.id === id);
    if (!m) return;
    if (campo === 'nome') m.nome = String(v).trim() || 'Meta';
    else if (campo === 'alvo') m.alvo = Math.max(0, centavos(v));
    else if (campo === 'inicial') m.inicial = Math.max(0, centavos(v));
    else if (campo === 'prazo') m.prazo = mesValido(v) ? v : '';
    salvar();
}

export function removerMeta(id) {
    const snap = JSON.stringify(S.estado);
    S.estado.metas = S.estado.metas.filter(x => x.id !== id);
    salvar();
    mostrarToast('Meta excluída.', snap);
}

// Seção aberta na tela do mês (no celular). Só troca o que aparece, sem redesenhar, para não perder o que foi digitado.
export function abaDoMes(nome) {
    S.abaMes = nome;
    document.querySelectorAll('[data-sec]').forEach(el => el.classList.toggle('hidden', el.dataset.sec !== nome));
    document.querySelectorAll('[data-tab]').forEach(b => {
        const ativo = b.dataset.tab === nome;
        b.setAttribute('aria-selected', String(ativo));
        b.setAttribute('tabindex', ativo ? '0' : '-1');
        b.classList.toggle('btn-primario', ativo);
        b.classList.toggle('btn-secundario', !ativo);
    });
}

// Gráfico da Visão Geral: ao tocar em um mês, mostra os valores dele
export function mostrarValoresMes(id) {
    const m = achaMes(id), el = document.getElementById('detalheGrafico');
    if (!m || !el) return;
    const t = totais(m);
    el.textContent = `${m.nome}: receitas ${brl(t.receitas)}, gastos ${brl(t.gastos)}, investido ${brl(t.invest)}, sobra ${brl(t.sobra)}.`;
}
