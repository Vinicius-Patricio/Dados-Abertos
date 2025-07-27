<?php

namespace App\Http\Controllers;

use App\Jobs\SincronizarDespesasDeputado;
use App\Jobs\SincronizarTodosDeputados;
use App\Models\Deputado;
use App\Models\Despesa;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SincronizacaoController extends Controller
{

    public function sincronizarTodos(Request $request): JsonResponse
    {
        SincronizarTodosDeputados::dispatch();
        
        return response()->json([
            'mensagem' => 'Sincronização iniciada com sucesso - todas as despesas de todos os anos serão buscadas',
            'status' => 'enviado_para_fila'
        ]);
    }

    public function sincronizarDeputado(Request $request, $deputadoId): JsonResponse
    {
        $deputado = Deputado::where('id_api', $deputadoId)->first();
        
        if (!$deputado) {
            return response()->json([
                'erro' => 'Deputado não encontrado'
            ], 404);
        }
        
        SincronizarDespesasDeputado::dispatch($deputadoId);
        
        return response()->json([
            'mensagem' => 'Sincronização de despesas iniciada',
            'deputado' => $deputado->nome,
            'status' => 'enviado_para_fila'
        ]);
    }

    public function status(): JsonResponse
    {
        $totalDeputados = Deputado::count();
        $deputadosComDespesas = Deputado::whereNotNull('ultima_sincronizacao_despesas')->count();
        $totalDespesas = Despesa::count();
        
        $ultimaSincronizacao = Deputado::whereNotNull('ultima_sincronizacao_despesas')
            ->orderBy('ultima_sincronizacao_despesas', 'desc')
            ->first();
        
        // Verificar se há jobs na fila
        $jobsNaFila = \DB::table('jobs')->count();
        $jobsFalhados = \DB::table('failed_jobs')->count();
        
        return response()->json([
            'total_deputados' => $totalDeputados,
            'deputados_com_despesas' => $deputadosComDespesas,
            'total_despesas' => $totalDespesas,
            'ultima_sincronizacao' => $ultimaSincronizacao?->ultima_sincronizacao_despesas,
            'deputado_ultima_sinc' => $ultimaSincronizacao?->nome,
            'jobs_na_fila' => $jobsNaFila,
            'jobs_falhados' => $jobsFalhados,
            'sincronizacao_em_andamento' => $jobsNaFila > 0
        ]);
    }

    public function listarDeputados(): JsonResponse
    {
        $deputados = Deputado::select([
            'id',
            'id_api',
            'nome',
            'sigla_partido',
            'sigla_uf',
            'ultima_sincronizacao_despesas',
            'created_at'
        ])
        ->withCount('despesas')
        ->orderBy('nome')
        ->get();
        
        return response()->json([
            'deputados' => $deputados
        ]);
    }

    public function despesasDeputado($deputadoId): JsonResponse
    {
        $deputado = Deputado::where('id_api', $deputadoId)->first();
        
        if (!$deputado) {
            return response()->json([
                'erro' => 'Deputado não encontrado'
            ], 404);
        }

        // Filtros
        $dataInicial = request('data_inicial');
        $dataFinal = request('data_final');
        $valorMinimo = request('valor_minimo');
        $valorMaximo = request('valor_maximo');
        $fornecedor = request('fornecedor');
        
        $query = Despesa::where('deputado_id', $deputado->id);


        if ($dataInicial) {
            $query->where('data_documento', '>=', $dataInicial);
        }
        if ($dataFinal) {
            $query->where('data_documento', '<=', $dataFinal);
        }
        if ($valorMinimo) {
            $query->where('valor', '>=', $valorMinimo);
        }
        if ($valorMaximo) {
            $query->where('valor', '<=', $valorMaximo);
        }
        if ($fornecedor) {
            $query->where('fornecedor', 'ilike', '%' . $fornecedor . '%');
        }
        
        $despesas = $query
            ->orderBy('data_documento', 'desc')
            ->orderBy('ano', 'desc')
            ->orderBy('mes', 'desc')
            ->orderBy('valor', 'desc')
            ->paginate(50);
        

        return response()->json([
            'deputado' => [
                'id' => $deputado->id_api,
                'nome' => $deputado->nome,
                'partido' => $deputado->sigla_partido,
                'uf' => $deputado->sigla_uf,
                'urlFoto' => $deputado->url_foto,
                'ultima_sincronizacao' => $deputado->ultima_sincronizacao_despesas
            ],
            'despesas' => $despesas,
            'filtros' => [
                'data_inicial' => $dataInicial,
                'data_final' => $dataFinal,
                'valor_minimo' => $valorMinimo,
                'valor_maximo' => $valorMaximo,
                'fornecedor' => $fornecedor
            ]
        ]);
    }
}
