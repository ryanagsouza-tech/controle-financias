// Telas: funções que devolvem texto HTML. Nenhuma delas mexe no DOM nem usa JavaScript dentro do HTML.
import { ABREV_MESES, CATEGORIAS_SUGERIDAS, FORMAS_PAGAMENTO, LIXEIRA, VERSAO_APP, nomePag } from './constantes.js';
import { brl, curto, dataBR, esc, ev, hojeChave, hojeISO, mesAtualISO, num, reais, semAcento } from './util.js';
import { S } from './estado.js';
import { acumulados, catDoItem, dataPadrao, gastosPorCategoria, limitesMes, mesesCronologicos, rotuloTri, totais, triDe } from './calculos.js';
import { lerTema } from './tema.js';

export function card(rotulo, valor, cor, sub, fundo) {
    return `<div class="${fundo || 'bg-white border-slate-200'} p-4 rounded-2xl shadow-sm border">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">${rotulo}</span>
        <div class="text-lg font-bold mt-1 ${cor}">${valor}</div>
        ${sub ? `<p class="text-[11px] text-slate-400 mt-0.5">${sub}</p>` : ''}
    </div>`;
}

/* ---- Gráficos (SVG, sem biblioteca) ---- */
export function graficoMensal(acc) {
    const ms = S.estado.meses;
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

export function barrasCategorias(lista, total) {
    if (!lista.length) return '<p class="text-sm text-slate-400 italic">Nenhum gasto lançado ainda.</p>';
    return `<div class="space-y-3">${lista.map(x => {
        const pct = total > 0 ? x.total / total * 100 : 0;
        return `<div>
            <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">${esc(curto(x.cat.nome))}</span>
                <span class="text-slate-900 font-bold">${brl(x.total)} <span class="text-slate-400 font-normal">(${pct.toFixed(1)}%)</span></span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" data-larg="${Math.min(pct, 100)}" data-bg="${x.cat.cor}"></div></div>
        </div>`;
    }).join('')}</div>`;
}

/* ---- Visão geral ---- */
export function viewGeral() {
    return boasVindas() + viewGeralCorpo();
}

export function boasVindas() {
    const vazio = S.estado.meses.every(m => !m.receitas.length && !m.lancamentos.length);
    if (S.estado.boasVindasOk || !vazio) return '';
    const hoje = new Date();
    const atual = S.estado.meses.find(m => m.ano === hoje.getFullYear() && m.mes === hoje.getMonth() + 1) || S.estado.meses[0];
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
                <button ${ev('click', 'trocarAba', 'config')} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow">Saldo e categorias</button>
                ${atual ? `<button ${ev('click', 'trocarAba', atual.id)} class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow">Abrir ${esc(atual.nome)}</button>` : ''}
                <button ${ev('click', 'dispensarBoasVindas')} class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-300">Não mostrar mais</button>
            </div>
        </div>`;
}

export function viewGeralCorpo() {
    const acc = acumulados();
    let R = 0, G = 0, I = 0;
    S.estado.meses.forEach(m => { R += acc[m.id].receitas; G += acc[m.id].gastos; I += acc[m.id].invest; });
    const si = num(S.estado.saldoInicial);
    // Saldo e patrimônio contam só até o mês atual: parcelas e contas fixas de meses futuros ainda não saíram da conta
    const agora = hojeChave();
    const ate = mesesCronologicos().filter(m => m.ano && m.mes && m.ano * 12 + m.mes <= agora);
    const ult = ate.length ? acc[ate[ate.length - 1].id] : null;
    const semData = S.estado.meses.filter(m => !(m.ano && m.mes)).map(m => totais(m));
    const conta = (ult ? ult.conta : si) + semData.reduce((a, t) => a + t.sobra, 0);
    const investido = (ult ? ult.invAcum : 0) + semData.reduce((a, t) => a + t.invest, 0);
    const porCat = gastosPorCategoria(S.estado.meses);
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
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span>Receitas</span>
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-rose-500"></span>Gastos</span>
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-cyan-500"></span>Investido</span>
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
                        ${S.estado.meses.map(m => { const t = acc[m.id]; return `
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 font-semibold text-slate-900">${esc(m.nome)}</td>
                            <td class="p-3 text-right text-emerald-600">${brl(t.receitas)}</td>
                            <td class="p-3 text-right text-rose-600">${brl(t.gastos)}</td>
                            <td class="p-3 text-right text-cyan-600">${brl(t.invest)}</td>
                            <td class="p-3 text-right font-semibold ${t.sobra >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${brl(t.sobra)}</td>
                            <td class="p-3 text-right font-bold ${t.conta >= 0 ? 'text-slate-900' : 'text-rose-600'}">${brl(t.conta)}</td>
                            <td class="p-3 text-center"><button ${ev('click', 'trocarAba', m.id)} class="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-lg">Abrir</button></td>
                        </tr>`; }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

/* ---- Trimestre ---- */
export function viewTrimestre(k) {
    const ms = S.estado.meses.filter(m => triDe(m) === k);
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
                <button ${ev('click', 'trocarAba', m.id)} class="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition">Abrir mês</button>
            </div>`; }).join('')}
        </div>`;
}

// O aviso é discreto: só aparece sem nenhum backup (depois de 10 registros) ou com o último passando de 90 dias,
// e pode ser adiado por 30 dias. Os pontos de restauração automáticos cobrem erros do dia a dia.
export function avisoBackup() {
    const qtd = S.estado.meses.reduce((a, m) => a + m.lancamentos.length + m.receitas.length, 0);
    if (qtd < 10) return '';
    if (S.estado.backupAdiadoAte && hojeISO() < S.estado.backupAdiadoAte) return '';
    const ult = S.estado.ultimoBackup;
    const dias = ult ? Math.floor((Date.now() - new Date(ult + 'T12:00:00').getTime()) / 86400000) : null;
    if (ult && dias < 90) return '';
    return `<div class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
        <span>${ult ? 'Seu último backup foi há ' + dias + ' dias.' : 'Você ainda não guardou uma cópia dos seus dados fora do aparelho.'} Se perder o celular ou limpar os dados do navegador, eles somem.</span>
        <span class="flex gap-2 shrink-0">
            <button ${ev('click', 'adiarBackup')} class="bg-white hover:bg-amber-100 text-amber-800 font-bold px-3 py-2 rounded-lg border border-amber-300">Depois</button>
            <button ${ev('click', 'exportarDados')} class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-lg">Fazer backup</button>
        </span>
    </div>`;
}

export function resumoPagamento(mes) {
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

/* ---- Contas fixas ---- */
export function viewFixas() {
    const campo = 'w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    const rot = 'block text-[10px] font-bold text-slate-500 uppercase mb-1';
    const opcCat = sel => S.estado.categorias.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
    const opcPag = sel => '<option value="">Não informar</option>' + FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>${f.nome}</option>`).join('');
    const soma = t => S.estado.contasFixas.filter(f => f.tipo === t).reduce((a, f) => a + num(f.valor), 0);
    const temG = S.estado.contasFixas.some(f => f.tipo !== 'receita'), temR = S.estado.contasFixas.some(f => f.tipo === 'receita');
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
                <div><label for="fixaTipo" class="${rot}">Tipo</label><select id="fixaTipo" ${ev('change', 'fixaTipoMudou')} class="${campo}"><option value="gasto">Gasto</option><option value="receita">Receita</option></select></div>
                <div class="md:col-span-2"><label for="fixaDesc" class="${rot}">Descrição</label><input type="text" id="fixaDesc" ${ev('enter', 'focarCampo', 'fixaValor')} placeholder="Ex: Aluguel, Salário" class="${campo}"></div>
                <div><label for="fixaValor" class="${rot}">Valor (R$)</label><input type="number" step="0.01" inputmode="decimal" id="fixaValor" ${ev('enter', 'focarCampo', 'fixaDia')} placeholder="0.00" class="${campo} text-right"></div>
                <div><label for="fixaDia" class="${rot}">Dia do mês</label><input type="number" min="1" max="31" inputmode="numeric" id="fixaDia" ${ev('enter', 'adicionarFixa')} value="5" class="${campo}"></div>
                <div id="boxFixaCat" class="col-span-2"><label for="fixaCat" class="${rot}">Categoria</label><select id="fixaCat" class="${campo}">${opcCat('CustosFixos')}</select></div>
                <div id="boxFixaPag"><label for="fixaPag" class="${rot}">Pagamento</label><select id="fixaPag" class="${campo}">${opcPag('')}</select></div>
                <div><label for="fixaInicio" class="${rot}">A partir de</label><input type="month" id="fixaInicio" value="${mesAtualISO()}" class="${campo}"></div>
                <div><label for="fixaFim" class="${rot}">Até (opcional)</label><input type="month" id="fixaFim" class="${campo}"></div>
                <div class="col-span-2 flex items-end"><button ${ev('click', 'adicionarFixa')} class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow">+ Adicionar conta fixa</button></div>
            </div>
        </div>

        <div class="space-y-3">
            ${S.estado.contasFixas.length ? S.estado.contasFixas.map(f => `
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                <div class="flex gap-2">
                    <input type="text" value="${esc(f.descricao)}" aria-label="Descrição" ${ev('change', 'editarFixa', f.id, 'descricao')} class="${campo} flex-1 min-w-0">
                    <input type="number" step="0.01" inputmode="decimal" value="${reais(f.valor)}" aria-label="Valor" ${ev('change', 'editarFixa', f.id, 'valor')} class="${campo} w-28 text-right">
                </div>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                    ${f.tipo === 'receita'
                        ? `<div class="col-span-2 md:col-span-2 flex items-end"><span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg">Receita fixa</span></div>`
                        : `<div class="col-span-2 md:col-span-1"><label class="${rot}">Categoria</label><select ${ev('change', 'editarFixa', f.id, 'categoriaId')} class="${campo}">${opcCat(f.categoriaId)}</select></div>
                           <div><label class="${rot}">Pagamento</label><select ${ev('change', 'editarFixa', f.id, 'pagamento')} class="${campo}">${opcPag(f.pagamento)}</select></div>`}
                    <div><label class="${rot}">Dia</label><input type="number" min="1" max="31" inputmode="numeric" value="${f.dia}" ${ev('change', 'editarFixa', f.id, 'dia')} class="${campo}"></div>
                    <div><label class="${rot}">A partir de</label><input type="month" value="${f.inicio}" ${ev('change', 'editarFixa', f.id, 'inicio')} class="${campo}"></div>
                    <div><label class="${rot}">Até</label><input type="month" value="${f.fim}" ${ev('change', 'editarFixa', f.id, 'fim')} class="${campo}"></div>
                </div>
                <button ${ev('click', 'removerFixa', f.id)} aria-label="Excluir conta fixa" class="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg">${LIXEIRA} Excluir conta fixa</button>
            </div>`).join('') : '<p class="text-sm text-slate-400 italic">Nenhuma conta fixa cadastrada ainda.</p>'}
        </div>`;
}

/* ---- Configurações: categorias, orçamento, saldo inicial ---- */
export function viewConfig() {
    return viewConfigCorpo() + blocoPontos() + blocoAparencia();
}

export function blocoPontos() {
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div>
                <h3 class="font-bold text-slate-900">Pontos de restauração automáticos</h3>
                <p class="text-xs text-slate-500">O app guarda sozinho uma cópia por dia (os últimos 7 dias) e uma antes de cada atualização. Use para voltar de um erro, sem baixar nada. As cópias ficam neste aparelho, junto com os dados.</p>
            </div>
            <div id="listaPontos" class="space-y-2"><p class="text-sm text-slate-400">Carregando...</p></div>
            <p id="statusArmazenamento" class="text-[11px] text-slate-400"></p>
        </div>`;
}

export function blocoAparencia() {
    const pref = lerTema();
    const opt = (v, t) => `<option value="${v}" ${pref === v ? 'selected' : ''}>${t}</option>`;
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
            <label for="tema" class="block text-sm font-bold text-slate-900">Aparência</label>
            <select id="tema" ${ev('change', 'definirTema')} class="bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium">
                ${opt('auto', 'Seguir o aparelho')}${opt('claro', 'Claro')}${opt('escuro', 'Escuro')}
            </select>
            <p class="text-[11px] text-slate-400">Controle Financeiro, versão ${VERSAO_APP}</p>
        </div>`;
}

export function viewConfigCorpo() {
    const campo = 'bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-900">Categorias e Orçamento</h2>
            <p class="text-xs text-slate-500">Edite os nomes e cores, defina um limite mensal por categoria (0 significa sem limite) e informe o saldo que você já tinha na conta antes do primeiro mês.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
            <label for="saldoInicial" class="block text-sm font-bold text-slate-900">Saldo inicial da conta (R$)</label>
            <input type="number" step="0.01" inputmode="decimal" id="saldoInicial" value="${S.estado.saldoInicial ? reais(S.estado.saldoInicial) : ''}" placeholder="0.00" ${ev('change', 'definirSaldoInicial')} class="${campo} w-48 text-right">
            <p class="text-[11px] text-slate-400">Entra no saldo acumulado a partir do primeiro mês da lista.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-bold text-slate-900">Categorias</h3>
                <div class="flex items-center gap-2">
                    ${CATEGORIAS_SUGERIDAS.some(x => !S.estado.categorias.some(c => c.id === x.id)) ? `<select ${ev('change', 'adicionarSugerida')} aria-label="Adicionar categoria sugerida" class="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"><option value="">+ Sugeridas</option>${CATEGORIAS_SUGERIDAS.filter(x => !S.estado.categorias.some(c => c.id === x.id)).map(x => `<option value="${x.id}">${esc(curto(x.nome))}</option>`).join('')}</select>` : ''}
                    <button ${ev('click', 'adicionarCategoria')} class="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow">+ Nova categoria</button>
                </div>
            </div>
            <div class="space-y-3">
                ${S.estado.categorias.map(c => `
                <div class="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div class="flex items-center gap-2">
                        <input type="color" value="${c.cor}" aria-label="Cor" ${ev('change', 'editarCategoria', c.id, 'cor')} class="w-10 h-10 rounded-lg shrink-0 cursor-pointer">
                        <input type="text" value="${esc(c.nome)}" aria-label="Nome da categoria" ${ev('change', 'editarCategoria', c.id, 'nome')} class="${campo} flex-1 min-w-0">
                    </div>
                    <div class="flex flex-wrap items-end gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select ${ev('change', 'editarCategoria', c.id, 'tipo')} class="${campo}">
                                <option value="gasto" ${c.tipo === 'gasto' ? 'selected' : ''}>Gasto</option>
                                <option value="investimento" ${c.tipo === 'investimento' ? 'selected' : ''}>Investimento</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Limite mensal (R$)</label>
                            <input type="number" step="0.01" inputmode="decimal" value="${c.orcamento ? reais(c.orcamento) : ''}" placeholder="0" ${c.tipo === 'investimento' ? 'disabled' : ''} ${ev('change', 'editarCategoria', c.id, 'orcamento')} class="${campo} w-32 text-right disabled:opacity-40">
                        </div>
                        <button ${ev('click', 'removerCategoria', c.id)} aria-label="Excluir categoria" class="ml-auto inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-2.5 rounded-lg">${LIXEIRA} Excluir</button>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
}

/* ---- Mês detalhado ---- */
export function viewMes(mes) {
    const t = acumulados()[mes.id];
    const lim = limitesMes(mes);
    const campo = 'bg-slate-50 border border-slate-300 rounded-xl p-2 text-sm font-medium';

    const chavePrev = mes.ano && mes.mes ? mes.ano * 12 + mes.mes - 1 : null;
    const prev = chavePrev ? S.estado.meses.find(m => m.ano && m.mes && m.ano * 12 + m.mes === chavePrev) : null;
    const orc = S.estado.categorias.filter(c => c.tipo === 'gasto').map(c => {
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
                    <button ${ev('click', 'excluirMes', mes.id)} aria-label="Excluir mês" class="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-2 rounded-lg transition">${LIXEIRA} Excluir mês</button>
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
                <input type="text" value="${esc(r.descricao)}" aria-label="Descrição da receita" ${ev('change', 'editarReceita', mes.id, r.id, 'descricao')} class="${campo} flex-1 min-w-0">
                <input type="number" step="0.01" inputmode="decimal" value="${reais(r.valor)}" aria-label="Valor da receita" ${ev('change', 'editarReceita', mes.id, r.id, 'valor')} class="${campo} w-28 text-right">
                <button ${ev('click', 'removerReceita', mes.id, r.id)} aria-label="Remover receita" class="text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-2.5 rounded-lg">${LIXEIRA}</button>
            </div>`).join('') : '<p class="text-sm text-slate-400 italic">Nenhuma receita neste mês ainda.</p>'}
            <div class="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100">
                <div class="flex-1 min-w-[8rem]">
                    <label for="recDesc_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Nova receita</label>
                    <input type="text" id="recDesc_${mes.id}" ${ev('enter', 'focarCampo', 'recVal_' + mes.id)} placeholder="Ex: Salário, Extra, 13º" class="${campo} w-full">
                </div>
                <div class="w-28">
                    <label for="recVal_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" inputmode="decimal" id="recVal_${mes.id}" ${ev('enter', 'adicionarReceita', mes.id)} placeholder="0.00" class="${campo} w-full text-right">
                </div>
                <button ${ev('click', 'adicionarReceita', mes.id)} class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow">+ Adicionar</button>
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
                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" data-larg="${Math.min(x.pct, 100)}" data-bg="${x.cor}"></div></div>
                    ${x.status ? `<p class="text-[11px] mt-0.5 font-semibold" data-cor="${x.corStatus}">${x.status}</p>` : ''}
                    ${x.comp ? `<p class="text-[11px] mt-0.5" data-cor="${x.corComp}">${x.comp}</p>` : ''}
                </div>`).join('')}
            </div>
        </div>
        ${resumoPagamento(mes)}

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Adicionar gasto ou investimento</h3>
            <p id="dicaLancamento" class="text-[11px] text-slate-500">Para um estorno ou reembolso, use valor negativo.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                    <label for="novaData_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Data</label>
                    <input type="date" id="novaData_${mes.id}" value="${dataPadrao(mes)}" ${lim ? `min="${lim.ini}" max="${lim.fim}"` : ''} class="${campo} w-full">
                </div>
                <div>
                    <label for="novoCat_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                    <select id="novoCat_${mes.id}" class="${campo} w-full">${S.estado.categorias.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select>
                </div>
                <div>
                    <label for="novoDesc_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                    <input type="text" id="novoDesc_${mes.id}" placeholder="Ex: Mercado, Tesouro" aria-describedby="dicaLancamento" ${ev('change', 'sugerirCategoria', mes.id)} ${ev('enter', 'focarCampo', 'novoValor_' + mes.id)} class="${campo} w-full">
                </div>
                <div>
                    <label for="novoValor_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" inputmode="decimal" id="novoValor_${mes.id}" ${ev('enter', 'adicionarLanc', mes.id)} placeholder="0.00" class="${campo} w-full">
                </div>
                <div class="flex items-end">
                    <button ${ev('click', 'adicionarLanc', mes.id)} class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow">+ Inserir</button>
                </div>
            </div>
            ${pagamentoCampos(mes, lim)}
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Lançamentos do mês</h3>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input type="search" id="filtroTexto" value="${esc(S.filtros.texto)}" placeholder="Buscar por descrição" aria-label="Buscar" ${ev('input', 'filtrar', 'texto', mes.id)} class="${campo}">
                <select aria-label="Filtrar por categoria" ${ev('change', 'filtrar', 'cat', mes.id)} class="${campo}">
                    <option value="">Todas as categorias</option>
                    ${S.estado.categorias.map(c => `<option value="${c.id}" ${S.filtros.cat === c.id ? 'selected' : ''}>${esc(curto(c.nome))}</option>`).join('')}
                </select>
                <select aria-label="Filtrar por forma de pagamento" ${ev('change', 'filtrar', 'pag', mes.id)} class="${campo}">
                    <option value="">Todas as formas</option>
                    ${FORMAS_PAGAMENTO.map(f => `<option value="${f.id}" ${S.filtros.pag === f.id ? 'selected' : ''}>${f.nome}</option>`).join('')}
                    <option value="_" ${S.filtros.pag === '_' ? 'selected' : ''}>Não informado</option>
                </select>
                <select aria-label="Ordenar" ${ev('change', 'filtrar', 'ordem', mes.id)} class="${campo}">
                    <option value="recentes" ${S.filtros.ordem === 'recentes' ? 'selected' : ''}>Data: mais recente</option>
                    <option value="antigos" ${S.filtros.ordem === 'antigos' ? 'selected' : ''}>Data: mais antiga</option>
                    <option value="maior" ${S.filtros.ordem === 'maior' ? 'selected' : ''}>Maior valor</option>
                </select>
            </div>
            <div id="listaLanc">${renderLista(mes)}</div>
        </div>`;
}

export function pagamentoCampos(mes, lim) {
    const campo = 'bg-slate-50 border border-slate-300 rounded-xl p-2 text-sm font-medium';
    const rotulo = 'block text-xs font-bold text-slate-500 mb-1';
    return `
            <div class="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100">
                <div>
                    <label for="novaPag_${mes.id}" class="${rotulo}">Forma de pagamento</label>
                    <select id="novaPag_${mes.id}" ${ev('change', 'mostrarParcelas', mes.id)} class="${campo}">
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

export function renderLista(mes) {
    if (!mes.lancamentos.length) return '<p class="text-sm text-slate-400 italic">Nenhum lançamento neste mês ainda.</p>';
    let itens = mes.lancamentos.slice();
    const q = semAcento(S.filtros.texto);
    if (q) itens = itens.filter(l => semAcento(l.descricao).includes(q) || semAcento(catDoItem(l).nome).includes(q));
    if (S.filtros.cat) itens = itens.filter(l => l.categoriaId === S.filtros.cat);
    if (S.filtros.pag) itens = itens.filter(l => (l.pagamento || '_') === S.filtros.pag);
    if (S.filtros.ordem === 'maior') itens.sort((a, b) => num(b.valor) - num(a.valor));
    else if (S.filtros.ordem === 'antigos') itens.sort((a, b) => a.data.localeCompare(b.data));
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
                    <p class="text-xs text-slate-500 flex items-center gap-1.5"><span class="inline-block w-2 h-2 rounded-full shrink-0" data-bg="${c.cor}"></span><span class="truncate">${esc(curto(c.nome))} · ${dataBR(l.data)}${l.pagamento ? ' · ' + nomePag(l.pagamento) : ''}${l.fixaId ? ' · Conta fixa' : ''}</span></p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="text-sm font-bold ${inv ? 'text-cyan-600' : num(l.valor) < 0 ? 'text-emerald-600' : 'text-rose-600'}">${brl(l.valor)}</span>
                    <button ${ev('click', 'abrirEdicao', mes.id, l.id)} class="text-sky-700 hover:text-sky-900 font-bold text-xs bg-sky-50 px-2.5 py-2 rounded-lg">Editar</button>
                    <button ${ev('click', 'removerLanc', mes.id, l.id)} aria-label="Excluir lançamento" class="text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-2 rounded-lg">${LIXEIRA}</button>
                </div>
            </div>`; }).join('')}</div>`;
}
