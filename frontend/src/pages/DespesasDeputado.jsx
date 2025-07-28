import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function DespesasDeputado() {
    const { id } = useParams();
    const navigate = useNavigate();
    const deputadoId = id;
    
    const [despesas, setDespesas] = useState([]);
    const [deputado, setDeputado] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [paginacao, setPaginacao] = useState({});
    const [sincronizando, setSincronizando] = useState(false);
    const [mensagemSincronizacao, setMensagemSincronizacao] = useState('');
    const [filtros, setFiltros] = useState({
        data_inicial: '',
        data_final: '',
        valor_minimo: '',
        valor_maximo: '',
        fornecedor: ''
    });
    const [filtrosAplicados, setFiltrosAplicados] = useState({
        data_inicial: '',
        data_final: '',
        valor_minimo: '',
        valor_maximo: '',
        fornecedor: ''
    });
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const getFotoUrl = (deputado) => {
        return deputado.urlFoto || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFASiuRnDSREyWEtfH5sU1SIXfwZRjjF475Q&s';
    };

    const construirUrlComFiltros = (pagina = 1) => {
        const params = new URLSearchParams();
        params.append('page', pagina);
        
        if (filtrosAplicados.data_inicial) params.append('data_inicial', filtrosAplicados.data_inicial);
        if (filtrosAplicados.data_final) params.append('data_final', filtrosAplicados.data_final);
        if (filtrosAplicados.valor_minimo) params.append('valor_minimo', filtrosAplicados.valor_minimo);
        if (filtrosAplicados.valor_maximo) params.append('valor_maximo', filtrosAplicados.valor_maximo);
        if (filtrosAplicados.fornecedor) params.append('fornecedor', filtrosAplicados.fornecedor);
        
        return `http://localhost:8000/api/sincronizacao/deputado/${deputadoId}/despesas?${params.toString()}`;
    };

    const buscarDespesas = async (pagina = 1) => {
        setCarregando(true);
        setErro(null);

        try {
            const url = construirUrlComFiltros(pagina);
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setDespesas(data.despesas?.data || []);
                setDeputado(data.deputado);
                setPaginacao({
                    current_page: data.despesas?.current_page || 1,
                    last_page: data.despesas?.last_page || 1,
                    per_page: data.despesas?.per_page || 50,
                    total: data.despesas?.total || 0
                });
            } else {
                setErro(data.erro || 'Erro ao buscar despesas');
            }
        } catch (error) {
            console.error('Erro ao buscar despesas:', error);
            setErro('Erro de conexão com o servidor');
        } finally {
            setCarregando(false);
        }
    };

    const sincronizarDespesas = async () => {
        setSincronizando(true);
        setMensagemSincronizacao('');

        try {
            const response = await fetch(`http://localhost:8000/api/sincronizacao/deputado/${deputadoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMensagemSincronizacao('Sincronização iniciada! Aguarde...');
                
                setTimeout(() => {
                    setSincronizando(false);
                    setMensagemSincronizacao('Sincronização concluída! Atualizando dados...');
                    buscarDespesas(paginaAtual);
                    setTimeout(() => {
                        setMensagemSincronizacao('');
                    }, 5000);
                }, 5000);
                
            } else {
                setSincronizando(false);
                setMensagemSincronizacao(data.erro || 'Erro ao iniciar sincronização');
                setTimeout(() => {
                    setMensagemSincronizacao('');
                }, 5000);
            }
        } catch (error) {
            console.error('Erro ao sincronizar despesas:', error);
            setSincronizando(false);
            setMensagemSincronizacao('Erro de conexão com o servidor');
            setTimeout(() => {
                setMensagemSincronizacao('');
            }, 5000);
        }
    };

    const aplicarFiltros = () => {
        setFiltrosAplicados(filtros);
        setPaginaAtual(1);
    };

    const limparFiltros = () => {
        const filtrosVazios = {
            data_inicial: '',
            data_final: '',
            valor_minimo: '',
            valor_maximo: '',
            fornecedor: ''
        };
        setFiltros(filtrosVazios);
        setFiltrosAplicados(filtrosVazios);
        setPaginaAtual(1);
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    useEffect(() => {
        if (deputadoId) {
            buscarDespesas(paginaAtual);
        }
    }, [deputadoId, paginaAtual, filtrosAplicados]);

    const proximaPagina = () => {
        if (paginaAtual < paginacao.last_page) {
            setPaginaAtual(paginaAtual + 1);
        }
    };

    const paginaAnterior = () => {
        if (paginaAtual > 1) {
            setPaginaAtual(paginaAtual - 1);
        }
    };

    const irParaPagina = (pagina) => {
        setPaginaAtual(pagina);
    };

    const gerarPaginasVisiveis = () => {
        const paginaAtualNum = paginaAtual;
        const totalPaginas = paginacao.last_page || 1;
        
        if (totalPaginas <= 5) {
            return Array.from({ length: totalPaginas }, (_, i) => i + 1);
        }
        
        const paginas = [];
        const maxPaginasVisiveis = 5;
        
        paginas.push(1);
        
        if (paginaAtualNum <= 4) {
            for (let i = 2; i <= Math.min(maxPaginasVisiveis - 1, totalPaginas - 1); i++) {
                paginas.push(i);
            }
            if (totalPaginas > maxPaginasVisiveis - 1) {
                paginas.push('...');
            }
        } else if (paginaAtualNum >= totalPaginas - 3) {
            if (totalPaginas > maxPaginasVisiveis - 1) {
                paginas.push('...');
            }
            for (let i = Math.max(2, totalPaginas - maxPaginasVisiveis + 2); i < totalPaginas; i++) {
                paginas.push(i);
            }
        } else {
            paginas.push('...');
            for (let i = paginaAtualNum - 1; i <= paginaAtualNum + 1; i++) {
                paginas.push(i);
            }
            paginas.push('...');
        }

        if (totalPaginas > 1 && !paginas.includes(totalPaginas)) {
            paginas.push(totalPaginas);
        }
        
        return paginas;
    };

    const formatarValor = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const formatarData = (data) => {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const voltarParaLista = () => {
        navigate('/');
    };

    const temFiltrosAtivos = Object.values(filtrosAplicados).some(valor => valor !== '');

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-4 flex items-center text-sm text-gray-600">
                    <button
                        onClick={voltarParaLista}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Lista de Deputados
                    </button>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-blue-600">
                        {deputado?.nome || 'Deputado'}
                    </span>
                </div>

                {deputado && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex items-center space-x-4">
                            <img
                                src={getFotoUrl(deputado)}
                                alt={`Foto de ${deputado.nome}`}
                                className="w-20 h-24 object-cover rounded border"
                                onError={(e) => {
                                    e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFASiuRnDSREyWEtfH5sU1SIXfwZRjjF475Q&s';
                                }}
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{deputado.nome}</h1>
                                <p className="text-gray-600">{deputado.partido} - {deputado.uf}</p>
                                <p className="text-sm text-gray-500">
                                    Última sincronização: {deputado.ultima_sincronizacao ? formatarData(deputado.ultima_sincronizacao) : 'Nunca'}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={sincronizarDespesas}
                                    disabled={sincronizando}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {sincronizando ? 'Sincronizando...' : 'Sincronizar Despesas'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mensagemSincronizacao && (
                    <div className={`mb-6 p-4 rounded-lg relative ${
                        mensagemSincronizacao.includes('concluída') || mensagemSincronizacao.includes('sucesso')
                            ? 'bg-green-100 border border-green-400 text-green-700'
                            : mensagemSincronizacao.includes('iniciada')
                            ? 'bg-blue-100 border border-blue-400 text-blue-700'
                            : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                        <span className="font-medium">{mensagemSincronizacao}</span>
                    </div>
                )}

                <div className="mb-4 flex justify-between items-center">
                    <button
                        onClick={voltarParaLista}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Voltar para Lista</span>
                    </button>
                    
                    <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                        {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                </div>

                {mostrarFiltros && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Inicial
                                </label>
                                <input
                                    type="date"
                                    value={filtros.data_inicial}
                                    onChange={(e) => handleFiltroChange('data_inicial', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Final
                                </label>
                                <input
                                    type="date"
                                    value={filtros.data_final}
                                    onChange={(e) => handleFiltroChange('data_final', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor Mínimo (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={filtros.valor_minimo}
                                    onChange={(e) => handleFiltroChange('valor_minimo', e.target.value)}
                                    placeholder="0,00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor Máximo (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={filtros.valor_maximo}
                                    onChange={(e) => handleFiltroChange('valor_maximo', e.target.value)}
                                    placeholder="0,00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fornecedor
                                </label>
                                <input
                                    type="text"
                                    value={filtros.fornecedor}
                                    onChange={(e) => handleFiltroChange('fornecedor', e.target.value)}
                                    placeholder="Digite o nome do fornecedor"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={limparFiltros}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Limpar Filtros
                            </button>
                            <button
                                onClick={aplicarFiltros}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                )}


                {erro && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {erro}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {carregando ? (
                        <div className="text-center text-gray-500 py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            Carregando...
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-200">
                                    <thead className="bg-blue-600">
                                        <tr>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Data</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Fornecedor</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Valor</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Ano/Mês</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {despesas.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                                    {temFiltrosAtivos ? 'Nenhuma despesa encontrada com os filtros aplicados.' : 'Nenhuma despesa encontrada.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            despesas.map((despesa) => (
                                                <tr key={despesa.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatarData(despesa.data_documento)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {despesa.tipo_despesa}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {despesa.fornecedor || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                        {formatarValor(despesa.valor)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {despesa.ano}/{despesa.mes.toString().padStart(2, '0')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {paginacao.last_page > 1 && (
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Página {paginacao.current_page} de {paginacao.last_page} • {paginacao.total} despesas
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={paginaAnterior}
                                                disabled={paginaAtual <= 1}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Anterior
                                            </button>
                                            {gerarPaginasVisiveis().map((pagina, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => irParaPagina(pagina)}
                                                    className={`px-4 py-2 text-sm font-medium ${
                                                        pagina === paginaAtual ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                                                    } border border-gray-300 rounded-md hover:bg-gray-50 transition-colors`}
                                                    disabled={pagina === '...'}
                                                >
                                                    {pagina}
                                                </button>
                                            ))}
                                            <button
                                                onClick={proximaPagina}
                                                disabled={paginaAtual >= paginacao.last_page}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Próxima
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DespesasDeputado; 