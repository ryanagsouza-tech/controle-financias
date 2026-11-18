// Telas: funções que devolvem texto HTML. Nenhuma delas mexe no DOM nem usa JavaScript dentro do HTML.
import { ABREV_MESES, CATEGORIAS_SUGERIDAS, FORMAS_PAGAMENTO, ICONES, LIXEIRA, NOMES_MESES, VERSAO_APP, nomePag } from './constantes.js';
import { brl, curto, dataBR, esc, ev, hojeChave, hojeISO, mesAtualISO, num, pad, reais, semAcento } from './util.js';
import { S } from './estado.js';
import { acumulados, catDoItem, catPorId, dataDeCobranca, dataPadrao, gastosPorCategoria, limitesMes, mesesCronologicos, progressoMeta, rotuloTri, totais, triDe } from './calculos.js';
import { lerTema } from './tema.js';

export function card(rotulo, valor, cor, sub, fundo) {
    return `<div class="${fundo || 'bg-white border-slate-200'} p-4 rounded-2xl shadow-sm border">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">${rotulo}</span>
        <div class="text-lg font-bold mt-1 ${cor}">${valor}</div>
        ${sub ? `<p class="text-xs text-slate-500 mt-0.5">${sub}</p>` : ''}
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
        return `<g ${ev('click', 'mostrarValoresMes', m.id)} tabindex="0" role="button" aria-label="Ver valores de ${esc(m.nome)}" class="cursor-pointer"><rect x="${x0 - 4}" y="0" width="${larg - 4}" height="${base + 24}" fill="transparent"/>`
            + mk(t.receitas, 0, '#10b981', 'Receitas') + mk(t.gastos, 1, '#f43f5e', 'Gastos') + mk(t.invest, 2, '#06b6d4', 'Investido')
            + `<text x="${x0 + 21}" y="${base + 16}" text-anchor="middle" font-size="12" fill="#64748b">${rot}</text></g>`;
    }).join('');
    return `<div class="overflow-x-auto"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="Receitas, gastos e investimentos por mês. Toque em um mês para ver os valores.">
        <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#94a3b8" stroke-opacity="0.5"/>${barras}</svg></div>`;
}

export function barrasCategorias(lista, total) {
    if (!lista.length) return '<p class="text-sm text-slate-500 italic">Nenhum gasto lançado ainda.</p>';
    return `<div class="space-y-3">${lista.map(x => {
        const pct = total > 0 ? x.total / total * 100 : 0;
        return `<div>
            <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">${esc(curto(x.cat.nome))}</span>
                <span class="text-slate-900 font-bold">${brl(x.total)} <span class="text-slate-500 font-normal">(${pct.toFixed(1)}%)</span></span>
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
                <button ${ev('click', 'trocarAba', 'config')} class="btn btn-primario">Saldo e categorias</button>
                ${atual ? `<button ${ev('click', 'trocarAba', atual.id)} class="btn btn-primario">Abrir ${esc(atual.nome)}</button>` : ''}
                <button ${ev('click', 'dispensarBoasVindas')} class="btn btn-secundario">Não mostrar mais</button>
            </div>
        </div>`;
}

export function viewGeralCorpo() {
    const acc = acumulados();
    let R = 0, G = 0, I = 0;
    S.estado.meses.forEach(m => { R += acc[m.id].receitas; G += acc[m.id].gastos; I += acc[m.id].invest; });
    const si = num(S.estado.saldoInicial);
    const gi = num(S.estado.gastoInicial), ii = num(S.estado.saldoInicialInvest);
    // Saldo e patrimônio contam só até o mês atual: parcelas e contas fixas de meses futuros ainda não saíram da conta
    const agora = hojeChave();
    const ate = mesesCronologicos().filter(m => m.ano && m.mes && m.ano * 12 + m.mes <= agora);
    const ult = ate.length ? acc[ate[ate.length - 1].id] : null;
    const semData = S.estado.meses.filter(m => !(m.ano && m.mes)).map(m => totais(m));
    const conta = (ult ? ult.conta : si) + semData.reduce((a, t) => a + t.sobra, 0);
    const investido = (ult ? ult.invAcum : ii) + semData.reduce((a, t) => a + t.invest, 0);
    const porCat = gastosPorCategoria(S.estado.meses);
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-900">Visão Geral</h2>
            <p class="text-xs text-slate-500">Receitas, gastos e investimentos somam todos os meses cadastrados. Saldo e patrimônio contam só até o mês atual.</p>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
            ${card('Receitas', brl(R), 'text-emerald-700')}
            ${card('Gastos', brl(G + gi), 'text-rose-600', gi > 0 ? 'inclui ' + brl(gi) + ' de antes do app' : '')}
            ${card('Investido', brl(I + ii), 'text-cyan-700', ii > 0 ? 'inclui ' + brl(ii) + ' de antes do app' : '')}
            ${card('Saldo na conta', brl(conta), conta >= 0 ? 'text-emerald-900' : 'text-rose-600', 'até o mês atual' + (si !== 0 ? ', com saldo inicial de ' + brl(si) : ''), 'bg-emerald-50 border-emerald-200')}
            ${card('Patrimônio', brl(conta + investido), 'text-sky-900', 'conta + investimentos, até o mês atual', 'bg-sky-50 border-sky-200')}
        </div>
        ${blocoMetasProgresso()}

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Evolução mensal</h3>
            <div class="flex flex-wrap gap-4 text-xs text-slate-500">
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span>Receitas</span>
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-rose-500"></span>Gastos</span>
                <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-cyan-500"></span>Investido</span>
            </div>
            ${graficoMensal(acc)}
            <p id="detalheGrafico" aria-live="polite" class="text-sm text-slate-600">Toque em um mês do gráfico para ver os valores.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Gastos por categoria no período</h3>
            ${barrasCategorias(porCat, G)}
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Resumo mês a mês</h3>
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr>
                        <th class="p-3">Mês</th><th class="p-3 text-right">Receitas</th><th class="p-3 text-right">Gastos</th>
                        <th class="p-3 text-right">Investido</th><th class="p-3 text-right">Sobra</th><th class="p-3 text-right">Saldo acumulado</th><th class="p-3"></th>
                    </tr></thead>
                    <tbody class="divide-y divide-slate-100">
                        ${S.estado.meses.map(m => { const t = acc[m.id]; return `
                        <tr class="hover:bg-slate-50">
                            <td class="p-3 font-semibold text-slate-900">${esc(m.nome)}</td>
                            <td class="p-3 text-right text-emerald-700">${brl(t.receitas)}</td>
                            <td class="p-3 text-right text-rose-600">${brl(t.gastos)}</td>
                            <td class="p-3 text-right text-cyan-700">${brl(t.invest)}</td>
                            <td class="p-3 text-right font-semibold ${t.sobra >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${brl(t.sobra)}</td>
                            <td class="p-3 text-right font-bold ${t.conta >= 0 ? 'text-slate-900' : 'text-rose-600'}">${brl(t.conta)}</td>
                            <td class="p-3 text-center"><button ${ev('click', 'trocarAba', m.id)} class="btn btn-secundario btn-sm">Abrir</button></td>
                        </tr>`; }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="md:hidden space-y-3">
                ${S.estado.meses.map(m => { const t = acc[m.id]; return `
                <div class="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-slate-900">${esc(m.nome)}</span>
                        <button ${ev('click', 'trocarAba', m.id)} class="btn btn-secundario btn-sm">Abrir</button>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div><p class="text-xs text-slate-500">Receitas</p><p class="text-sm font-bold text-emerald-700">${brl(t.receitas)}</p></div>
                        <div><p class="text-xs text-slate-500">Gastos</p><p class="text-sm font-bold text-rose-600">${brl(t.gastos)}</p></div>
                        <div><p class="text-xs text-slate-500">Investido</p><p class="text-sm font-bold text-cyan-700">${brl(t.invest)}</p></div>
                    </div>
                    <div class="flex justify-between text-sm"><span class="text-slate-500">Sobra do mês</span><span class="font-bold ${t.sobra >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${brl(t.sobra)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-slate-500">Saldo acumulado</span><span class="font-bold ${t.conta >= 0 ? 'text-slate-900' : 'text-rose-600'}">${brl(t.conta)}</span></div>
                </div>`; }).join('')}
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
                ${card('Receitas', brl(R), 'text-emerald-700', '', 'bg-slate-50 border-slate-100')}
                ${card('Gastos', brl(G), 'text-rose-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Investido', brl(I), 'text-cyan-700', '', 'bg-slate-50 border-slate-100')}
                ${card('Sobra do trimestre', brl(sobra), sobra >= 0 ? 'text-emerald-900' : 'text-rose-600', '', 'bg-emerald-50 border-emerald-100')}
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            ${ms.map(m => { const t = totais(m); return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 class="font-bold text-base text-slate-900 border-b pb-2">${esc(m.nome)}</h3>
                <div class="flex justify-between text-sm"><span class="text-slate-500">Receitas:</span><span class="font-semibold text-emerald-700">${brl(t.receitas)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-slate-500">Gastos:</span><span class="font-semibold text-rose-600">${brl(t.gastos)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-slate-500">Investido:</span><span class="font-semibold text-cyan-700">${brl(t.invest)}</span></div>
                <div class="flex justify-between text-sm border-t pt-2 font-bold"><span class="text-slate-500">Sobra:</span><span class="${t.sobra >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${brl(t.sobra)}</span></div>
                <button ${ev('click', 'trocarAba', m.id)} class="btn btn-primario btn-sm w-full">Abrir mês</button>
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
            <button ${ev('click', 'adiarBackup')} class="btn btn-secundario btn-sm">Depois</button>
            <button ${ev('click', 'exportarDados')} class="btn btn-primario btn-sm">Fazer backup</button>
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
                <p class="text-xs text-slate-500">O total do crédito é o que vai para a fatura do cartão com os lançamentos deste mês.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                ${chaves.map(k => `
                <div class="${k === 'credito' ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-100'} border rounded-xl p-3">
                    <p class="text-xs font-bold text-slate-500 uppercase">${k === '_' ? 'Não informado' : nomePag(k)}</p>
                    <p class="text-sm font-bold text-slate-900 mt-0.5">${brl(mapa[k])}</p>
                </div>`).join('')}
            </div>
        </div>`;
}

/* ---- Contas fixas ---- */
export function viewFixas() {
    const campo = 'w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    const rot = 'block text-xs font-bold text-slate-500 uppercase mb-1';
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
                <p id="erroFixa" role="alert" class="hidden col-span-2 md:col-span-4 text-sm font-semibold text-rose-700"></p>
                <div class="col-span-2 flex items-end"><button ${ev('click', 'adicionarFixa')} class="btn btn-primario w-full">+ Adicionar conta fixa</button></div>
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
                        ? `<div class="col-span-2 md:col-span-2 flex items-end"><span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg">Receita fixa</span></div>`
                        : `<div class="col-span-2 md:col-span-1"><label class="${rot}">Categoria</label><select ${ev('change', 'editarFixa', f.id, 'categoriaId')} class="${campo}">${opcCat(f.categoriaId)}</select></div>
                           <div><label class="${rot}">Pagamento</label><select ${ev('change', 'editarFixa', f.id, 'pagamento')} class="${campo}">${opcPag(f.pagamento)}</select></div>`}
                    <div><label class="${rot}">Dia</label><input type="number" min="1" max="31" inputmode="numeric" value="${f.dia}" ${ev('change', 'editarFixa', f.id, 'dia')} class="${campo}"></div>
                    <div><label class="${rot}">A partir de</label><input type="month" value="${f.inicio}" ${ev('change', 'editarFixa', f.id, 'inicio')} class="${campo}"></div>
                    <div><label class="${rot}">Até</label><input type="month" value="${f.fim}" ${ev('change', 'editarFixa', f.id, 'fim')} class="${campo}"></div>
                </div>
                <button ${ev('click', 'removerFixa', f.id)} aria-label="Excluir conta fixa" class="btn btn-perigo-suave btn-sm">${LIXEIRA} Excluir conta fixa</button>
            </div>`).join('') : '<p class="text-sm text-slate-500 italic">Nenhuma conta fixa cadastrada ainda.</p>'}
        </div>`;
}

/* ---- Configurações: categorias, orçamento, saldo inicial ---- */
// Cartão de crédito: cada pessoa tem um jeito (fatura que vence no mês seguinte, dia de fechamento...)
export function blocoCartao() {
    const c = S.estado.credito;
    const campo = 'bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    const rot = 'block text-sm font-bold text-slate-600 mb-1';
    const hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth() + 1;
    const ex = dataDeCobranca(`${ano}-${pad(mes)}-20`, c);
    const exemplo = ex.compra
        ? `Exemplo: uma compra no crédito em 20 de ${NOMES_MESES[mes - 1]} entra na fatura de ${NOMES_MESES[ex.mes - 1]} e vence em ${dataBR(ex.data)}.`
        : 'Exemplo: a compra no crédito entra no mesmo mês em que foi feita.';
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h3 class="font-bold text-slate-900">Cartão de crédito</h3>
                <p class="text-xs text-slate-500">Configure como a sua fatura funciona. As compras no crédito passam a entrar no mês em que a fatura é paga, e não no mês da compra.</p>
            </div>
            <div>
                <label for="creditoVence" class="${rot}">A fatura vence</label>
                <select id="creditoVence" ${ev('change', 'definirCredito', 'vence')} class="${campo} w-full sm:w-auto">
                    <option value="mesmo" ${c.vence === 'mesmo' ? 'selected' : ''}>No mesmo mês da compra</option>
                    <option value="seguinte" ${c.vence === 'seguinte' ? 'selected' : ''}>No mês seguinte</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-3 max-w-sm">
                <div>
                    <label for="creditoDia" class="${rot}">Dia do vencimento</label>
                    <input type="number" min="1" max="31" inputmode="numeric" id="creditoDia" value="${c.diaVencimento}" ${ev('change', 'definirCredito', 'diaVencimento')} class="${campo} w-full">
                </div>
                <div>
                    <label for="creditoFecha" class="${rot}">Dia de fechamento</label>
                    <input type="number" min="0" max="31" inputmode="numeric" id="creditoFecha" value="${c.diaFechamento || ''}" placeholder="0" ${ev('change', 'definirCredito', 'diaFechamento')} class="${campo} w-full">
                </div>
            </div>
            <p class="text-xs text-slate-500">O fechamento é opcional (deixe vazio para não usar). Compras depois desse dia entram na fatura seguinte.</p>
            <p class="text-sm font-semibold text-slate-700">${exemplo}</p>
        </div>`;
}

// Metas de economia: cadastro e edição
export function blocoMetas() {
    const campo = 'bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium w-full';
    const rot = 'block text-xs font-bold text-slate-600 mb-1';
    const invest = S.estado.categorias.filter(c => c.tipo === 'investimento');
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h3 class="font-bold text-slate-900">Metas de economia</h3>
                <p class="text-xs text-slate-500">Cada meta acompanha uma categoria de investimento até um valor. O progresso aparece na Visão Geral.</p>
            </div>
            ${invest.length ? `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div class="col-span-2 md:col-span-1"><label for="metaNome" class="${rot}">Nome</label><input type="text" id="metaNome" placeholder="Ex: Viagem" class="${campo}"></div>
                <div><label for="metaAlvo" class="${rot}">Valor da meta (R$)</label><input type="number" step="0.01" inputmode="decimal" id="metaAlvo" placeholder="0.00" class="${campo} text-right"></div>
                <div><label for="metaInicial" class="${rot}">Já guardado (R$)</label><input type="number" step="0.01" inputmode="decimal" id="metaInicial" placeholder="0.00" class="${campo} text-right"></div>
                <div><label for="metaCat" class="${rot}">Categoria</label><select id="metaCat" class="${campo}">${invest.map(c => `<option value="${c.id}">${esc(curto(c.nome))}</option>`).join('')}</select></div>
                <div><label for="metaPrazo" class="${rot}">Prazo (opcional)</label><input type="month" id="metaPrazo" class="${campo}"></div>
                <div class="flex items-end"><button ${ev('click', 'adicionarMeta')} class="btn btn-primario w-full">+ Adicionar meta</button></div>
            </div>
            <p id="erroMeta" role="alert" class="hidden text-sm font-semibold text-rose-700"></p>` : '<p class="text-sm text-slate-500">Crie uma categoria de investimento em Categorias para usar metas.</p>'}
            <div class="space-y-3">
                ${S.estado.metas.map(m => `
                <div class="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div class="flex gap-2">
                        <input type="text" value="${esc(m.nome)}" aria-label="Nome da meta" ${ev('change', 'editarMeta', m.id, 'nome')} class="${campo} flex-1 min-w-0">
                        <button ${ev('click', 'removerMeta', m.id)} aria-label="Excluir meta" class="btn-icone btn-perigo-suave">${LIXEIRA}</button>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div><label class="${rot}">Valor (R$)</label><input type="number" step="0.01" inputmode="decimal" value="${reais(m.alvo)}" ${ev('change', 'editarMeta', m.id, 'alvo')} class="${campo} text-right"></div>
                        <div><label class="${rot}">Já guardado</label><input type="number" step="0.01" inputmode="decimal" value="${m.inicial ? reais(m.inicial) : ''}" ${ev('change', 'editarMeta', m.id, 'inicial')} class="${campo} text-right"></div>
                        <div><label class="${rot}">Prazo</label><input type="month" value="${m.prazo}" ${ev('change', 'editarMeta', m.id, 'prazo')} class="${campo}"></div>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
}

// Progresso das metas na Visão Geral
export function blocoMetasProgresso() {
    if (!S.estado.metas.length) return '';
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-bold text-slate-900">Metas de economia</h3>
            ${S.estado.metas.map(m => {
                const p = progressoMeta(m), cat = catPorId(m.categoriaId);
                let linha = p.concluida ? 'Meta atingida' : 'Faltam ' + brl(p.falta);
                if (!p.concluida && m.prazo) {
                    const [pa, pm] = m.prazo.split('-').map(Number);
                    linha += p.mesesRestantes > 0 ? ' · ' + brl(p.porMes) + ' por mês até ' + NOMES_MESES[pm - 1].slice(0, 3).toLowerCase() + '/' + pa : ' · prazo vencido';
                }
                return `<div>
                    <div class="flex justify-between gap-2 text-sm font-semibold mb-1">
                        <span class="text-slate-700 truncate">${esc(m.nome)}</span>
                        <span class="text-slate-900 font-bold shrink-0">${brl(p.guardado)} <span class="text-slate-500 font-normal">de ${brl(p.alvo)} (${p.pct.toFixed(0)}%)</span></span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" data-larg="${p.pct}" data-bg="${cat ? cat.cor : '#0369a1'}"></div></div>
                    <p class="text-xs mt-1 ${p.concluida ? 'text-emerald-700 font-semibold' : 'text-slate-500'}">${linha}</p>
                </div>`;
            }).join('')}
        </div>`;
}

export function viewConfig() {
    return viewConfigCorpo() + blocoCartao() + blocoMetas() + blocoPontos() + blocoAparencia();
}

export function blocoPontos() {
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div>
                <h3 class="font-bold text-slate-900">Pontos de restauração automáticos</h3>
                <p class="text-xs text-slate-500">O app guarda sozinho uma cópia por dia (os últimos 7 dias) e uma antes de cada atualização. Use para voltar de um erro, sem baixar nada. As cópias ficam neste aparelho, junto com os dados.</p>
            </div>
            <div id="listaPontos" class="space-y-2"><p class="text-sm text-slate-500">Carregando...</p></div>
            <p id="statusArmazenamento" class="text-xs text-slate-500"></p>
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
            <p class="text-xs text-slate-500">Controle Financeiro, versão ${VERSAO_APP}</p>
        </div>`;
}

export function viewConfigCorpo() {
    const campo = 'bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-medium';
    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-900">Categorias e Orçamento</h2>
            <p class="text-xs text-slate-500">Edite os nomes e cores, defina um limite mensal por categoria (0 significa sem limite) e informe o saldo que você já tinha na conta antes do primeiro mês.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h3 class="font-bold text-slate-900">Saldos iniciais</h3>
                <p class="text-xs text-slate-500">Para quem já começa com dinheiro na conta, investido ou gastos de antes do app. Entram a partir do primeiro mês.</p>
            </div>
            <div>
                <label for="saldoInicial" class="block text-sm font-bold text-slate-600 mb-1">Saldo na conta (R$)</label>
                <input type="number" step="0.01" inputmode="decimal" id="saldoInicial" value="${S.estado.saldoInicial ? reais(S.estado.saldoInicial) : ''}" placeholder="0.00" ${ev('change', 'definirSaldoInicial')} class="${campo} w-48 text-right">
                <p class="text-xs text-slate-500 mt-1">O que você tem hoje na conta.</p>
            </div>
            <div>
                <label for="saldoInicialInvest" class="block text-sm font-bold text-slate-600 mb-1">Já investido (R$)</label>
                <input type="number" step="0.01" inputmode="decimal" id="saldoInicialInvest" value="${S.estado.saldoInicialInvest ? reais(S.estado.saldoInicialInvest) : ''}" placeholder="0.00" ${ev('change', 'definirSaldoInicialInvest')} class="${campo} w-48 text-right">
                <p class="text-xs text-slate-500 mt-1">Soma ao total investido e ao patrimônio.</p>
            </div>
            <div>
                <label for="gastoInicial" class="block text-sm font-bold text-slate-600 mb-1">Gastos de antes do app (R$)</label>
                <input type="number" step="0.01" inputmode="decimal" id="gastoInicial" value="${S.estado.gastoInicial ? reais(S.estado.gastoInicial) : ''}" placeholder="0.00" ${ev('change', 'definirGastoInicial')} class="${campo} w-48 text-right">
                <p class="text-xs text-slate-500 mt-1">Aparece no total de gastos da Visão Geral. Não diminui o saldo da conta, que já é o valor de hoje.</p>
            </div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-bold text-slate-900">Categorias</h3>
                <div class="flex items-center gap-2">
                    ${CATEGORIAS_SUGERIDAS.some(x => !S.estado.categorias.some(c => c.id === x.id)) ? `<select ${ev('change', 'adicionarSugerida')} aria-label="Adicionar categoria sugerida" class="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"><option value="">+ Sugeridas</option>${CATEGORIAS_SUGERIDAS.filter(x => !S.estado.categorias.some(c => c.id === x.id)).map(x => `<option value="${x.id}">${esc(curto(x.nome))}</option>`).join('')}</select>` : ''}
                    <button ${ev('click', 'adicionarCategoria')} class="btn btn-primario btn-sm">+ Nova categoria</button>
                </div>
            </div>
            <div class="space-y-3">
                ${S.estado.categorias.map(c => `
                <div class="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div class="flex items-center gap-2">
                        <input type="color" value="${c.cor}" aria-label="Cor" ${ev('change', 'editarCategoria', c.id, 'cor')} class="w-11 h-11 rounded-lg shrink-0 cursor-pointer">
                        <input type="text" value="${esc(c.nome)}" aria-label="Nome da categoria" ${ev('change', 'editarCategoria', c.id, 'nome')} class="${campo} flex-1 min-w-0">
                    </div>
                    <div class="flex flex-wrap items-end gap-2">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select ${ev('change', 'editarCategoria', c.id, 'tipo')} class="${campo}">
                                <option value="gasto" ${c.tipo === 'gasto' ? 'selected' : ''}>Gasto</option>
                                <option value="investimento" ${c.tipo === 'investimento' ? 'selected' : ''}>Investimento</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Limite mensal (R$)</label>
                            <input type="number" step="0.01" inputmode="decimal" value="${c.orcamento ? reais(c.orcamento) : ''}" placeholder="0" ${c.tipo === 'investimento' ? 'disabled' : ''} ${ev('change', 'editarCategoria', c.id, 'orcamento')} class="${campo} w-32 text-right disabled:opacity-40">
                        </div>
                        <button ${ev('click', 'removerCategoria', c.id)} aria-label="Excluir categoria" class="btn btn-perigo-suave btn-sm ml-auto">${LIXEIRA} Excluir</button>
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

    const listaMeses = mesesCronologicos();
    const posicao = listaMeses.findIndex(x => x.id === mes.id);
    const ant = posicao > 0 ? listaMeses[posicao - 1] : null;
    const prox = posicao >= 0 && posicao < listaMeses.length - 1 ? listaMeses[posicao + 1] : null;
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
                corComp = d > 0 ? '#e11d48' : d < 0 ? '#047857' : '#64748b';
            }
        }
        return { c, total, lm, pct, cor, status, corStatus, comp, corComp };
    });
    const estourados = orc.filter(x => x.lm > 0 && x.total > x.lm).length;

    return `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <div class="flex items-center justify-between gap-2">
                <button ${ev('click', 'mesAnterior')} aria-label="Mês anterior" class="btn-icone btn-secundario" ${ant ? '' : 'disabled'}>${ICONES.esq}</button>
                <div class="text-center min-w-0 flex-1">
                    <h2 class="text-xl font-bold text-slate-900 truncate">${esc(mes.nome)}</h2>
                    <select aria-label="Ir para outro mês" ${ev('change', 'trocarAba')} class="${campo} mt-1 max-w-full">${listaMeses.map(x => `<option value="${x.id}" ${x.id === mes.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>
                </div>
                <button ${ev('click', 'mesSeguinte')} aria-label="Próximo mês" class="btn-icone btn-secundario" ${prox ? '' : 'disabled'}>${ICONES.dir}</button>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button ${ev('click', 'excluirMes', mes.id)} aria-label="Excluir mês" class="btn btn-perigo-suave btn-sm">${LIXEIRA} Excluir mês</button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                ${card('Receitas', brl(t.receitas), 'text-emerald-700', '', 'bg-slate-50 border-slate-100')}
                ${card('Gastos', brl(t.gastos), 'text-rose-600', '', 'bg-slate-50 border-slate-100')}
                ${card('Investido', brl(t.invest), 'text-cyan-700', '', 'bg-cyan-50 border-cyan-200')}
                ${card('Sobra do mês', brl(t.sobra), t.sobra >= 0 ? 'text-emerald-900' : 'text-rose-600', 'receitas - gastos - investido', 'bg-emerald-50 border-emerald-200')}
                ${card('Saldo na conta', brl(t.conta), t.conta >= 0 ? 'text-slate-900' : 'text-rose-600', 'acumulado até aqui', 'bg-slate-50 border-slate-200')}
                ${card('Patrimônio', brl(t.patrimonio), 'text-sky-900', 'conta + investido', 'bg-sky-50 border-sky-200')}
            </div>
        </div>

        <div role="tablist" aria-label="Seções do mês" class="md:hidden grid grid-cols-3 gap-2">
            ${[['resumo', 'Resumo'], ['lancamentos', 'Lançamentos'], ['receitas', 'Receitas']].map(([k, r]) => `<button role="tab" aria-selected="${S.abaMes === k}" data-tab="${k}" ${ev('click', 'abaDoMes', k)} class="btn ${S.abaMes === k ? 'btn-primario' : 'btn-secundario'}">${r}</button>`).join('')}
        </div>

        <div data-sec="resumo" class="${S.abaMes === 'resumo' ? '' : 'hidden'} md:block space-y-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
                <h3 class="font-bold text-slate-900">Gastos e orçamento por categoria</h3>
                <p class="text-xs text-slate-500">Com limite definido, a barra mostra o quanto do limite já foi usado. Sem limite, mostra a parte de cada categoria nos gastos do mês.</p>
            </div>
            ${estourados ? `<div class="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl">${estourados} ${estourados === 1 ? 'categoria passou' : 'categorias passaram'} do limite neste mês.</div>` : ''}
            <div class="space-y-3">
                ${orc.map(x => `
                <div>
                    <div class="flex justify-between text-xs font-semibold mb-1 gap-2">
                        <span class="text-slate-700">${esc(curto(x.c.nome))}</span>
                        <span class="text-slate-900 font-bold text-right">${brl(x.total)} <span class="text-slate-500 font-normal">${x.lm > 0 ? 'de ' + brl(x.lm) : '(' + x.pct.toFixed(1) + '%)'}</span></span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" data-larg="${Math.min(x.pct, 100)}" data-bg="${x.cor}"></div></div>
                    ${x.status ? `<p class="text-xs mt-0.5 font-semibold" data-cor="${x.corStatus}">${x.status}</p>` : ''}
                    ${x.comp ? `<p class="text-xs mt-0.5" data-cor="${x.corComp}">${x.comp}</p>` : ''}
                </div>`).join('')}
            </div>
        </div>
        ${resumoPagamento(mes)}
        </div>

        <div data-sec="lancamentos" class="${S.abaMes === 'lancamentos' ? '' : 'hidden'} md:block space-y-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 class="font-bold text-slate-900">Novo lançamento</h3>
            <div>
                <label for="novoValor_${mes.id}" class="block text-sm font-bold text-slate-600 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" inputmode="decimal" id="novoValor_${mes.id}" ${ev('enter', 'focarCampo', 'novoDesc_' + mes.id)} placeholder="0,00" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 h-16 text-3xl font-bold">
            </div>
            <div>
                <label for="novoDesc_${mes.id}" class="block text-sm font-bold text-slate-600 mb-1">Descrição</label>
                <input type="text" id="novoDesc_${mes.id}" placeholder="Ex: Mercado, Tesouro" ${ev('change', 'sugerirCategoria', mes.id)} ${ev('enter', 'aposDescLanc', mes.id)} class="${campo} w-full">
            </div>
            <div>
                <span id="rotCat_${mes.id}" class="block text-sm font-bold text-slate-600 mb-1">Categoria</span>
                ${chipsRadio('novoCat_' + mes.id, S.estado.categorias.map(c => ({ valor: c.id, rotulo: esc(curto(c.nome)) })), (S.estado.categorias.find(c => c.tipo === 'gasto') || S.estado.categorias[0] || {}).id)}
            </div>
            <div>
                <span id="rotPag_${mes.id}" class="block text-sm font-bold text-slate-600 mb-1">Pagamento</span>
                ${chipsRadio('novaPag_' + mes.id, [{ valor: '', rotulo: 'Não informar' }, ...FORMAS_PAGAMENTO.map(f => ({ valor: f.id, rotulo: f.nome }))], '', ev('change', 'mostrarParcelas', mes.id))}
            </div>
            ${lim ? `
            <div id="boxParcelas_${mes.id}" class="hidden">
                <label for="novaParc_${mes.id}" class="block text-sm font-bold text-slate-600 mb-1">Parcelas (1 = à vista)</label>
                <input type="number" min="1" max="48" inputmode="numeric" id="novaParc_${mes.id}" value="1" class="${campo} w-32">
                <p id="dicaParcelas_${mes.id}" class="text-xs text-slate-500 mt-1">O valor é o total da compra, dividido em parcelas mensais (cartão ou carnê de boletos). Os próximos meses são criados se ainda não existirem.</p>
            </div>` : ''}
            <div>
                <label for="novaData_${mes.id}" class="block text-sm font-bold text-slate-600 mb-1">Data</label>
                <input type="date" id="novaData_${mes.id}" value="${dataPadrao(mes)}" ${lim ? `min="${lim.ini}" max="${lim.fim}"` : ''} class="${campo} w-full sm:w-auto">
            </div>
            <label class="flex items-center gap-3 text-sm font-semibold text-slate-700 min-h-[44px]">
                <input type="checkbox" id="novoEstorno_${mes.id}" class="w-6 h-6">
                Estorno ou reembolso (reduz o gasto)
            </label>
            <p id="erroLanc_${mes.id}" role="alert" class="hidden text-sm font-semibold text-rose-700"></p>
            <button id="btnInserir_${mes.id}" ${ev('click', 'adicionarLanc', mes.id)} class="btn btn-primario w-full">Inserir</button>
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
        </div>
        </div>

        <div data-sec="receitas" class="${S.abaMes === 'receitas' ? '' : 'hidden'} md:block space-y-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <h3 class="font-bold text-slate-900">Receitas do mês</h3>
            ${mes.receitas.length ? mes.receitas.map(r => `
            <div class="flex items-center gap-2">
                <input type="text" value="${esc(r.descricao)}" aria-label="Descrição da receita" ${ev('change', 'editarReceita', mes.id, r.id, 'descricao')} class="${campo} flex-1 min-w-0">
                <input type="number" step="0.01" inputmode="decimal" value="${reais(r.valor)}" aria-label="Valor da receita" ${ev('change', 'editarReceita', mes.id, r.id, 'valor')} class="${campo} w-28 text-right">
                <button ${ev('click', 'removerReceita', mes.id, r.id)} aria-label="Remover receita" class="btn-icone btn-perigo-suave">${LIXEIRA}</button>
            </div>`).join('') : '<p class="text-sm text-slate-500 italic">Nenhuma receita neste mês ainda.</p>'}
            <p id="erroRec_${mes.id}" role="alert" class="hidden text-sm font-semibold text-rose-700"></p>
            <div class="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100">
                <div class="flex-1 min-w-[8rem]">
                    <label for="recDesc_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Nova receita</label>
                    <input type="text" id="recDesc_${mes.id}" ${ev('enter', 'focarCampo', 'recVal_' + mes.id)} placeholder="Ex: Salário, Extra, 13º" class="${campo} w-full">
                </div>
                <div class="w-28">
                    <label for="recVal_${mes.id}" class="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" inputmode="decimal" id="recVal_${mes.id}" ${ev('enter', 'adicionarReceita', mes.id)} placeholder="0.00" class="${campo} w-full text-right">
                </div>
                <button ${ev('click', 'adicionarReceita', mes.id)} class="btn btn-primario">+ Adicionar</button>
            </div>
        </div>
        </div>`;
}

// Grupo de botões de escolha (radios escondidos com rótulos que parecem botões). Os rótulos já chegam escapados.
export function chipsRadio(nome, opcoes, selecionado, ligacao = '') {
    return `<div class="flex flex-wrap gap-2" role="radiogroup">${opcoes.map((o, i) => `<span><input type="radio" class="chip-input sr-only" name="${nome}" id="${nome}_${i}" value="${esc(o.valor)}" ${o.valor === selecionado ? 'checked' : ''} ${ligacao}><label for="${nome}_${i}" class="chip">${o.rotulo}</label></span>`).join('')}</div>`;
}

export function renderLista(mes) {
    if (!mes.lancamentos.length) return '<p class="text-sm text-slate-500 italic">Nenhum lançamento neste mês ainda.</p>';
    let itens = mes.lancamentos.slice();
    const q = semAcento(S.filtros.texto);
    if (q) itens = itens.filter(l => semAcento(l.descricao).includes(q) || semAcento(catDoItem(l).nome).includes(q));
    if (S.filtros.cat) itens = itens.filter(l => l.categoriaId === S.filtros.cat);
    if (S.filtros.pag) itens = itens.filter(l => (l.pagamento || '_') === S.filtros.pag);
    if (S.filtros.ordem === 'maior') itens.sort((a, b) => num(b.valor) - num(a.valor));
    else if (S.filtros.ordem === 'antigos') itens.sort((a, b) => a.data.localeCompare(b.data));
    else itens.sort((a, b) => b.data.localeCompare(a.data));
    if (!itens.length) return '<p class="text-sm text-slate-500 italic">Nenhum lançamento encontrado com esses filtros.</p>';
    const soma = itens.reduce((a, l) => a + num(l.valor), 0);
    return `
        <p class="text-xs text-slate-500">${itens.length} ${itens.length === 1 ? 'lançamento' : 'lançamentos'}, total ${brl(soma)}</p>
        <div>${itens.map(l => {
            const c = catDoItem(l), inv = c.tipo === 'investimento';
            const reembolsavel = !inv && num(l.valor) > 0;
            return `
            <div class="py-3 border-b border-slate-100 last:border-0">
                <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800 truncate">${esc(l.descricao)}</p>
                        <p class="text-xs text-slate-500 flex items-center gap-1.5"><span class="inline-block w-2 h-2 rounded-full shrink-0" data-bg="${c.cor}"></span><span class="truncate">${esc(curto(c.nome))} · ${l.compra ? 'vence ' + dataBR(l.data) + ' · compra ' + dataBR(l.compra) : dataBR(l.data)}${l.pagamento ? ' · ' + nomePag(l.pagamento) : ''}${l.fixaId ? ' · Conta fixa' : ''}</span></p>
                    </div>
                    <span class="text-sm font-bold shrink-0 ${inv ? 'text-cyan-700' : num(l.valor) < 0 ? 'text-emerald-700' : 'text-rose-600'}">${inv ? '↗ ' + brl(l.valor) : (num(l.valor) < 0 ? '+' : '-') + brl(Math.abs(num(l.valor)))}</span>
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    ${reembolsavel ? `<button ${ev('click', 'reembolsar', mes.id, l.id)} class="btn btn-secundario btn-sm">Reembolso</button>` : ''}
                    <button ${ev('click', 'abrirEdicao', mes.id, l.id)} class="btn btn-secundario btn-sm">Editar</button>
                    <button ${ev('click', 'removerLanc', mes.id, l.id)} aria-label="Excluir lançamento" class="btn-icone btn-perigo-suave">${LIXEIRA}</button>
                </div>
            </div>`; }).join('')}</div>`;
}
