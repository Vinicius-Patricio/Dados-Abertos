<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class DeputadosController extends Controller
{
    public function buscarDados(Request $request)
    {
        $pagina = $request->get('pagina', 1);
        $itensPorPagina = $request->get('itens_por_pagina', 20);
        
        $nome = $request->get('nome');
        $id = $request->get('id');
        $partido = $request->get('partido');
        $uf = $request->get('uf');
        
        $url = 'https://dadosabertos.camara.leg.br/api/v2/deputados';
        $params = [
            'ordem' => 'ASC',
            'ordenarPor' => 'nome',
            'pagina' => $pagina,
            'itens' => $itensPorPagina
        ];
        
        if ($nome) {
            $params['nome'] = $nome;
        }
        if ($id) {
            $params['id'] = $id;
        }
        if ($partido) {
            $params['siglaPartido'] = $partido;
        }
        if ($uf) {
            $params['siglaUf'] = $uf;
        }
        
        $response = Http::get($url, $params);
        
        if ($response->successful()) {
            $dados = $response->json();
            
            $dados['paginacao'] = [
                'pagina_atual' => (int) $pagina,
                'itens_por_pagina' => (int) $itensPorPagina,
                'total_itens' => $dados['dados'] ? count($dados['dados']) : 0,
                'tem_proxima_pagina' => count($dados['dados']) >= $itensPorPagina,
                'total_deputados' => $dados['links'] ? $this->extrairTotalDeputados($dados['links']) : 0
            ];

            $dados['filtros'] = [
                'nome' => $nome,
                'id' => $id,
                'partido' => $partido,
                'uf' => $uf
            ];
            
            return response()->json($dados);
        } else {
            return response()->json(['erro' => 'Falha ao buscar dados'], 500);
        }
    }

    private function extrairTotalDeputados($links)
    {
        foreach ($links as $link) {
            if ($link['rel'] === 'last') {
                $url = $link['href'];
                if (preg_match('/pagina=(\d+)/', $url, $matches)) {
                    $ultimaPagina = (int) $matches[1];
                    return $ultimaPagina * 20;
                }
            }
        }
        return 0;
    }
}