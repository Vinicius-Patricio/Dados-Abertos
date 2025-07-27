<?php

namespace App\Jobs;

use App\Models\Deputado;
use App\Models\Despesa;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SincronizarDespesasDeputado implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 1800;
    public $tries = 3;
    public $maxExceptions = 3;

    protected $deputadoId;

    public function __construct($deputadoId)
    {
        $this->deputadoId = $deputadoId;
    }

    public function handle(): void
    {
        try {
            $deputado = Deputado::where('id_api', $this->deputadoId)->first();
            
            if (!$deputado) {
                Log::warning("Deputado não encontrado: {$this->deputadoId}");
                return;
            }

            $anoInicio = null;

            if (!empty($deputado->data)) {
                try {
                    $anoInicio = (int) date('Y', strtotime($deputado->data));
                } catch (\Exception $e) {
                    // Ano padrão se não conseguir extrair
                }
            }

            if (!$anoInicio || $anoInicio < 2000) {
                $anoInicio = 2019;
            }

            $anoAtual = (int) date('Y');
            $totalDespesas = 0;

            $anos = range($anoInicio, $anoAtual);

            foreach ($anos as $ano) {
                
                $url = "https://dadosabertos.camara.leg.br/api/v2/deputados/{$this->deputadoId}/despesas";
                $params = [
                    'ano' => $ano,
                    'ordem' => 'ASC',
                    'ordenarPor' => 'dataDocumento'
                ];

                $response = Http::timeout(120)->get($url, $params);

                $dados = $response->json();
                $despesas = $dados['dados'] ?? [];
                $links = $dados['links'] ?? [];
                
                $totalDespesasAno = count($despesas);
                
                $pagina = 1;
                $todasDespesas = $despesas;
                
                $temProximaPagina = false;
                $urlProximaPagina = null;
                
                foreach ($links as $link) {
                    if ($link['rel'] === 'next') {
                        $temProximaPagina = true;
                        $urlProximaPagina = $link['href'];
                        break;
                    }
                }
                
                while ($temProximaPagina && $pagina < 100) {
                    $pagina++;
                    
                    if (!$urlProximaPagina) {
                        Log::error("URL da próxima página não encontrada para página {$pagina}");
                        break;
                    }
                    
                    $responsePagina = Http::timeout(120)->get($urlProximaPagina);
                    
                    if (!$responsePagina->successful()) {
                        Log::error("Erro ao buscar página {$pagina} para ano {$ano}: " . $responsePagina->status());
                        break;
                    }
                    
                    $dadosPagina = $responsePagina->json();
                    $despesasPagina = $dadosPagina['dados'] ?? [];
                    $links = $dadosPagina['links'] ?? [];
                    
                    $todasDespesas = array_merge($todasDespesas, $despesasPagina);
                    $totalDespesasAno += count($despesasPagina);
                    
                    if (empty($despesasPagina)) {
                        break;
                    }

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

                if (empty($todasDespesas)) {
                    Log::info("Nenhuma despesa encontrada para deputado {$deputado->nome} no ano {$ano}");
                    continue;
                }

                $contador = 0;
                $mesesEncontrados = [];
                foreach ($todasDespesas as $despesaApi) {
                    if (!isset($despesaApi['ano']) || !isset($despesaApi['mes']) ||
                        !isset($despesaApi['tipoDespesa']) || !isset($despesaApi['valorDocumento'])) {
                        Log::warning("Despesa com campos obrigatórios ausentes: " . json_encode($despesaApi));
                        continue;
                    }

                    $mesesEncontrados[] = $despesaApi['mes'];

                    $fornecedor = $despesaApi['nomeFornecedor'] ?? 'Não informado';
                    $dataDocumento = $despesaApi['dataDocumento'] ?? null;
                    $urlDocumento = $despesaApi['urlDocumento'] ?? null;

                    $despesaExistente = Despesa::where('deputado_id', $deputado->id)
                        ->where('ano', $despesaApi['ano'])
                        ->where('mes', $despesaApi['mes'])
                        ->where('tipo_despesa', $despesaApi['tipoDespesa'])
                        ->where('fornecedor', $fornecedor)
                        ->where('valor', $despesaApi['valorDocumento'])
                        ->first();

                    if (!$despesaExistente) {
                        try {
                            Despesa::create([
                                'deputado_id' => $deputado->id,
                                'ano' => $despesaApi['ano'],
                                'mes' => $despesaApi['mes'],
                                'tipo_despesa' => $despesaApi['tipoDespesa'],
                                'fornecedor' => $fornecedor,
                                'valor' => $despesaApi['valorDocumento'],
                                'data_documento' => $dataDocumento,
                                'url_documento' => $urlDocumento,
                                'dados_api' => $despesaApi
                            ]);
                            $contador++;
                            $totalDespesas++;
                        } catch (\Exception $e) {
                            Log::error("Erro ao criar despesa: " . $e->getMessage());
                            continue;
                        }
                    }
                }

                sort($mesesEncontrados);
                $mesesUnicos = array_unique($mesesEncontrados);
                sort($mesesUnicos);
            }

            $deputado->update([
                'ultima_sincronizacao_despesas' => now()
            ]);

        } catch (\Exception $e) {
            Log::error("Erro na sincronização de despesas do deputado {$this->deputadoId}: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Job de sincronização falhou para deputado {$this->deputadoId}: " . $exception->getMessage());
    }
}
