import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/dados-publicos')
      .then(response => response.json())
      .then(data => {
        setDados(data.dados || []); // ajuste conforme o retorno da API
        setCarregando(false);
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-red-100 flex flex-col items-center py-8 px-2">
      <h1 className="text-3xl font-bold mb-8 text-blue-700">Lista de Deputados</h1>
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg overflow-x-auto p-4">
        {carregando ? (
          <div className="text-center text-gray-500 py-8">Carregando...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Partido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">UF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">E-mail</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">Nenhum deputado encontrado.</td>
                </tr>
              ) : (
                dados.map((dep) => (
                  <tr key={dep.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap">{dep.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-semibold">{dep.nome}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dep.siglaPartido}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dep.siglaUf}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{dep.email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
