// Despachante de eventos. O HTML não tem JavaScript: botões e campos trazem atributos
// data-click, data-change, data-input e data-enter com o nome de uma ação, e este módulo
// chama a ação correspondente, mas só se ela estiver na lista de ações permitidas.

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
        if (e.key !== 'Enter') return;
        const el = achar(e, '[data-enter]');
        if (el && el.tagName === 'INPUT') { e.preventDefault(); executar(acoes, el, 'enter', e); }
    });
}
