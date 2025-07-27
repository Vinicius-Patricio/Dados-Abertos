<?php

namespace App\Jobs;

use App\Models\Deputado;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SincronizarTodosDeputados implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600;
    public $tries = 2;

    public function __construct()
    {
    }

    public function handle(): void
    {
        try {
            $response = Http::timeout(60)->get('https://dadosabertos.camara.leg.br/api/v2/deputados');
            
            if (!$response->successful()) {
                Log::error("Erro ao buscar deputados: " . $response->status());
                throw new \Exception("Erro na API de deputados: " . $response->status());
            }

            $dados = $response->json();
            $deputados = $dados['dados'] ?? [];

            if (empty($deputados)) {
                return;
            }

            $contador = 0;
            foreach ($deputados as $deputadoApi) {
                $deputado = Deputado::updateOrCreate(
                    ['id_api' => $deputadoApi['id']],
                    [
                        'nome' => $deputadoApi['nome'],
                        'sigla_partido' => $deputadoApi['siglaPartido'],
                        'sigla_uf' => $deputadoApi['siglaUf'],
                        'email' => $deputadoApi['email'] ?? null,
                        'url_foto' => $deputadoApi['urlFoto'] ?? null,
                        'dados_api' => $deputadoApi
                    ]
                );

                SincronizarDespesasDeputado::dispatch($deputadoApi['id'])
                    ->delay(now()->addSeconds($contador * 2)); 

                $contador++;
            }

        } catch (\Exception $e) {
            Log::error("Erro na sincronização de deputados: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Job de sincronização de deputados falhou: " . $exception->getMessage());
    }
}
