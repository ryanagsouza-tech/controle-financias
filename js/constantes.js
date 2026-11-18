// Constantes do app: versões, categorias padrão, formas de pagamento e ícones.
export const VERSAO_APP = '4.3.0';
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // tamanho máximo de um arquivo de backup

export const VERSAO_DADOS = 7; // 1 = lista de meses, 2 = reais, 3 = centavos, 4 = categorias e pagamento, 5 = contas fixas, 6 = categorias enxutas, 7 = saldos iniciais, cartão de crédito e metas

export const CHAVE_V3 = 'controle_financeiro_v3'; // só usada se o IndexedDB não estiver disponível

export const CHAVES_ANTIGAS = ['controle_financeiro_v2', 'controle_financeiro_dados', 'controle_financas_saas_dados', 'controle_financas_dados'];

export const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const ABREV_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const PALETA = ['#3b82f6', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4', '#84cc16', '#f97316'];

// As 6 categorias que já vêm no app. Qualquer uma pode ser renomeada, recolorida ou excluída.
export const CATEGORIAS_PADRAO = [
    { id: 'CustosFixos', nome: 'Moradia e Contas (Aluguel, Condomínio, Luz, Água, Internet)', cor: '#3b82f6', tipo: 'gasto', orcamento: 0 },
    { id: 'Alimentacao', nome: 'Alimentação (Mercado, Feira, Refeição)', cor: '#f59e0b', tipo: 'gasto', orcamento: 0 },
    { id: 'Transporte', nome: 'Transporte (Combustível, Condução, Carro)', cor: '#ef4444', tipo: 'gasto', orcamento: 0 },
    { id: 'Saude', nome: 'Saúde (Consultas, Medicamentos)', cor: '#14b8a6', tipo: 'gasto', orcamento: 0 },
    { id: 'Lazer', nome: 'Lazer & Passeios', cor: '#10b981', tipo: 'gasto', orcamento: 0 },
    { id: 'Investimentos', nome: 'Investimentos & Poupança', cor: '#06b6d4', tipo: 'investimento', orcamento: 0 }
];

// Categorias que o usuário pode adicionar com um toque, em Categorias, no menu "+ Sugeridas"
export const CATEGORIAS_SUGERIDAS = [
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

export const CATEGORIAS_TODAS = [...CATEGORIAS_PADRAO, ...CATEGORIAS_SUGERIDAS];

export const FORMAS_PAGAMENTO = [
    { id: 'debito', nome: 'Débito' }, { id: 'credito', nome: 'Crédito' }, { id: 'pix', nome: 'Pix' },
    { id: 'dinheiro', nome: 'Dinheiro' }, { id: 'boleto', nome: 'Boleto' }
];

// Formas de pagamento que podem ser divididas em parcelas (cartão de crédito e boleto parcelado/carnê)
export const FORMAS_COM_PARCELA = ['credito', 'boleto'];

export const nomePag = id => (FORMAS_PAGAMENTO.find(f => f.id === id) || {}).nome || '';

export const LIXEIRA = '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';

// Ícones desenhados em SVG, para ficarem iguais em qualquer aparelho (emoji muda de um celular para outro)
const svg = d => `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
export const ICONES = {
    inicio: svg('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
    mes: svg('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
    fixas: svg('M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'),
    mais: svg('M4 6h16M4 12h16M4 18h16'),
    config: svg('M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'),
    esq: svg('M15 19l-7-7 7-7'),
    dir: svg('M9 5l7 7-7 7')
};
