// Funções puras de uso geral: dinheiro em centavos, datas, texto e escape de HTML.
export const pad = n => String(n).padStart(2, '0');

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };

export const brl = c => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num(c) / 100);

// Todo valor guardado no app é um número inteiro de centavos. Estas duas funções convertem de e para texto em reais.
export const centavos = v => Math.round(num(v) * 100);

export const reais = c => (num(c) / 100).toFixed(2);

export const curto = n => String(n || '').split('(')[0].trim();

export const semAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const dataBR = d => { const p = String(d || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; };

export function mesAtualISO() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }

export function hojeChave() { const d = new Date(); return d.getFullYear() * 12 + d.getMonth() + 1; }

export const chaveMes = iso => { const p = String(iso).split('-').map(Number); return p[0] * 12 + p[1]; };

export const mesValido = v => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v || ''));

export function diaDoMes(ano, mes, dia) { return ano + '-' + pad(mes) + '-' + pad(Math.min(dia, new Date(ano, mes, 0).getDate())); }

export function hojeISO() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

// Gera os atributos data- que o despachante de eventos (eventos.js) entende.
// Assim nenhum JavaScript vai dentro do HTML e a política de segurança pode bloquear scripts embutidos.
export const ev = (tipo, acao, ...args) =>
    `data-${tipo}="${acao}"${args.length ? ` data-${tipo}-args="${esc(JSON.stringify(args))}"` : ''}`;
