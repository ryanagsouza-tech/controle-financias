// Despachante de eventos. O HTML não tem JavaScript: botões e campos trazem atributos
// data-click, data-change, data-input e data-enter com o nome de uma ação, e este módulo
// chama a ação correspondente, mas só se ela estiver na lista de ações permitidas.

const NATIVOS = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];

export function executar(acoes, el, tipo, evento) {
    const nome = el.dataset[tipo];
    const fn = Object.prototype.hasOwnProperty.call(acoes, nome) ? acoes[nome] : null;
    if (typeof fn !== 'function') return false;
    let args = [];
    const bruto = el.dataset[tipo + 'Args'];
    if (bruto) {
        try { args = JSON.parse(bruto); } catch (e) { return false; }
        if (!Array.isArray(args)) return false;
    }
    fn(...args, el.value, el, evento);
    return true;
}

export function instalar(doc, acoes) {
    const achar = (e, seletor) => (e.target && e.target.closest ? e.target.closest(seletor) : null);
    doc.addEventListener('click', e => {
        const fundo = achar(e, '[data-fundo]');
        if (fundo && e.target === fundo) { executar({ fechar: acoes.fechar }, { dataset: { click: 'fechar', clickArgs: JSON.stringify([fundo.dataset.fundo]) } }, 'click', e); return; }
        const el = achar(e, '[data-click]');
        if (el) executar(acoes, el, 'click', e);
    });
    doc.addEventListener('change', e => { const el = achar(e, '[data-change]'); if (el) executar(acoes, el, 'change', e); });
    doc.addEventListener('input', e => { const el = achar(e, '[data-input]'); if (el) executar(acoes, el, 'input', e); });
    doc.addEventListener('keydown', e => {
        // Enter dentro de um campo avança ou envia, conforme data-enter
        if (e.key === 'Enter') {
            const el = achar(e, '[data-enter]');
            if (el && el.tagName === 'INPUT') { e.preventDefault(); executar(acoes, el, 'enter', e); return; }
        }
        // Itens com role="button" que não são botões de verdade (os meses do gráfico) respondem a Enter e Espaço
        if (e.key === 'Enter' || e.key === ' ') {
            const el = achar(e, '[data-click]');
            if (el && el.getAttribute && el.getAttribute('role') === 'button' && !NATIVOS.includes(String(el.tagName).toUpperCase())) {
                e.preventDefault(); executar(acoes, el, 'click', e); return;
            }
        }
        // Abas: setas, Home e End trocam de aba
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            const aba = achar(e, '[role="tab"]');
            if (!aba || !aba.parentElement) return;
            const abas = [...aba.parentElement.querySelectorAll('[role="tab"]')];
            const i = abas.indexOf(aba);
            const destino = e.key === 'Home' ? abas[0] : e.key === 'End' ? abas[abas.length - 1]
                : abas[(i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length];
            e.preventDefault();
            executar(acoes, destino, 'click', e);
            destino.focus();
        }
    });
}
