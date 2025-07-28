import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';

function ListaDeputados() {
    const [dados, setDados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [paginacao, setPaginacao] = useState({});
    const [erro, setErro] = useState(null);
    const [paginaAtual, setPaginaAtual] = useLocalStorage('paginaAtual', 1);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtros, setFiltros] = useState({
        nome: '',
        id: '',
        partido: '',
        uf: ''
    });
    const [filtrosAplicados, setFiltrosAplicados] = useState({
        nome: '',
        id: '',
        partido: '',
        uf: ''
    });
    const navigate = useNavigate();

    const construirUrlComFiltros = (pagina = 1) => {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('itens_por_pagina', '20');

        if (filtrosAplicados.nome) params.append('nome', filtrosAplicados.nome);
        if (filtrosAplicados.id) params.append('id', filtrosAplicados.id);
        if (filtrosAplicados.partido) params.append('partido', filtrosAplicados.partido);
        if (filtrosAplicados.uf) params.append('uf', filtrosAplicados.uf);

        return `http://localhost:8000/api/dados-publicos?${params.toString()}`;
    };

    const buscarDeputados = async (pagina = 1) => {
        setCarregando(true);
        setErro(null);
        try {
            const url = construirUrlComFiltros(pagina);
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setDados(data.dados || []);
                setPaginacao(data.paginacao || {});
            } else {
                setErro(data.erro || 'Erro ao buscar dados');
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            setErro('Erro de conexão com o servidor');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarDeputados(paginaAtual);
    }, [paginaAtual, filtrosAplicados]);

    const proximaPagina = () => {
        if (paginacao.tem_proxima_pagina) {
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
        const totalPaginas = Math.ceil((paginacao.total_deputados || 0) / 20);
        
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

    const getFotoUrl = (deputado) => {
        return deputado.urlFoto || 'https://via.placeholder.com/60x80?text=Sem+Foto';
    };

    const verDespesas = (deputado) => {
        navigate(`/deputado/${deputado.id}`);
    };

    const aplicarFiltros = () => {
        setFiltrosAplicados(filtros);
        setPaginaAtual(1);
    };

    const limparFiltros = () => {
        const filtrosVazios = {
            nome: '',
            id: '',
            partido: '',
            uf: ''
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

    const temFiltrosAtivos = Object.values(filtrosAplicados).some(valor => valor !== '');

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-4 flex items-center text-sm text-gray-600">
                    {paginaAtual > 1 && (
                        <>
                            <span className="mx-2">•</span>
                            <span>Página {paginaAtual}</span>
                        </>
                    )}
                </div>
                <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">Lista de Deputados</h1>

                <div className="mb-4 flex justify-end">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={filtros.nome}
                                    onChange={(e) => handleFiltroChange('nome', e.target.value)}
                                    placeholder="Digite o nome do deputado"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ID
                                </label>
                                <input
                                    type="number"
                                    value={filtros.id}
                                    onChange={(e) => handleFiltroChange('id', e.target.value)}
                                    placeholder="Digite o ID do deputado"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Partido
                                </label>
                                <input
                                    type="text"
                                    value={filtros.partido}
                                    onChange={(e) => handleFiltroChange('partido', e.target.value)}
                                    placeholder="Ex: PT, PSDB, PL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UF
                                </label>
                                <input
                                    type="text"
                                    value={filtros.uf}
                                    onChange={(e) => handleFiltroChange('uf', e.target.value)}
                                    placeholder="Ex: SP, RJ, MG"
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
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Foto</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider"># ID</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Nome</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Partido</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">UF</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">E-mail</th>
                                            <th className="px-6 py-4 text-center text-sm font-medium text-white uppercase tracking-wider">Despesas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dados.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                                    {temFiltrosAtivos ? 'Nenhum deputado encontrado com os filtros aplicados.' : 'Nenhum deputado encontrado.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            dados.map((dep) => (
                                                <tr key={dep.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <img
                                                            src={getFotoUrl(dep)}
                                                            alt={`Foto de ${dep.nome}`}
                                                            className="w-12 h-16 object-cover rounded border"
                                                            onError={(e) => { e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFASiuRnDSREyWEtfH5sU1SIXfwZRjjF475Q&s'; }}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"># {dep.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{dep.nome}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dep.siglaPartido}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dep.siglaUf}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dep.email || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => verDespesas(dep)}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                                        >
                                                            Ver Despesas
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Página {paginacao.pagina_atual || 1} • {dados.length} deputados nesta página
                                        {paginacao.total_deputados && ` • Total: ${paginacao.total_deputados} deputados`}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={paginaAnterior}
                                            disabled={paginaAtual <= 1}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Anterior
                                        </button>
                                        {gerarPaginasVisiveis().map((page, index) => (
                                            <button
                                                key={index}
                                                onClick={() => irParaPagina(page)}
                                                className={`px-4 py-2 text-sm font-medium ${
                                                    page === paginaAtual ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                                                } border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                disabled={page === '...'}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={proximaPagina}
                                            disabled={!paginacao.tem_proxima_pagina}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ListaDeputados; 