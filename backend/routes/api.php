<?php

use App\Http\Controllers\DeputadosController;
use App\Http\Controllers\SincronizacaoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

Route::get('/teste', function () {
    return 'rota teste ok';
});

Route::get('/dados-publicos' , [DeputadosController::class , 'buscarDados']);

Route::get('/teste-paginacao/{deputadoId}/{ano}', function ($deputadoId, $ano) {
    $url = "https://dadosabertos.camara.leg.br/api/v2/deputados/{$deputadoId}/despesas";
    $params = [
        'ano' => $ano,
        'ordem' => 'ASC',
        'ordenarPor' => 'dataDocumento'
    ];
    
    $response = Http::timeout(60)->get($url, $params);
    
    if (!$response->successful()) {
        return response()->json(['erro' => 'Erro na API: ' . $response->status()], 500);
    }
    
    $dados = $response->json();
    $despesas = $dados['dados'] ?? [];
    $links = $dados['links'] ?? [];
    
    $todasDespesas = $despesas;
    $pagina = 1;
    
    // Verificar se há link "next"
    $temProximaPagina = false;
    $urlProximaPagina = null;
    
    foreach ($links as $link) {
        if ($link['rel'] === 'next') {
            $temProximaPagina = true;
            $urlProximaPagina = $link['href'];
            break;
        }
    }
    
    $paginasProcessadas = 1;
    
    while ($temProximaPagina && $pagina < 5) { // Limite de 5 páginas para teste
        $pagina++;
        $paginasProcessadas++;
        
        $responsePagina = Http::timeout(60)->get($urlProximaPagina);
        
        if (!$responsePagina->successful()) {
            break;
        }
        
        $dadosPagina = $responsePagina->json();
        $despesasPagina = $dadosPagina['dados'] ?? [];
        $links = $dadosPagina['links'] ?? [];
        
        $todasDespesas = array_merge($todasDespesas, $despesasPagina);
        
        if (empty($despesasPagina)) {
            break;
        }
        
        // Verificar se há próxima página
        $temProximaPagina = false;
        $urlProximaPagina = null;
        
        foreach ($links as $link) {
            if ($link['rel'] === 'next') {
                $temProximaPagina = true;
                $urlProximaPagina = $link['href'];
                break;
            }
        }
    }
    
    $meses = [];
    foreach ($todasDespesas as $despesa) {
        if (isset($despesa['mes'])) {
            $meses[] = $despesa['mes'];
        }
    }
    
    $mesesUnicos = array_unique($meses);
    sort($mesesUnicos);
    
    return response()->json([
        'ano' => $ano,
        'paginas_processadas' => $paginasProcessadas,
        'total_despesas' => count($todasDespesas),
        'primeira_pagina_despesas' => count($despesas),
        'meses_encontrados' => $mesesUnicos,
        'tem_mais_paginas' => $temProximaPagina
    ]);
});

Route::prefix('sincronizacao')->group(function () {
    Route::post('/todos', [SincronizacaoController::class, 'sincronizarTodos']);
    Route::post('/deputado/{deputadoId}', [SincronizacaoController::class, 'sincronizarDeputado']);
    Route::get('/status', [SincronizacaoController::class, 'status']);
    Route::get('/deputados', [SincronizacaoController::class, 'listarDeputados']);
    Route::get('/deputado/{deputadoId}/despesas', [SincronizacaoController::class, 'despesasDeputado']);
});