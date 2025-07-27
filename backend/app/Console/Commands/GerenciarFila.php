<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class GerenciarFila extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fila:gerenciar {acao : start|stop|status|clear}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gerenciar a fila de jobs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $acao = $this->argument('acao');

        switch ($acao) {
            case 'start':
                $this->startWorker();
                break;
            case 'stop':
                $this->stopWorker();
                break;
            case 'status':
                $this->showStatus();
                break;
            case 'clear':
                $this->clearFailed();
                break;
            default:
                $this->error('Ação inválida. Use: start, stop, status ou clear');
                return 1;
        }

        return 0;
    }

    private function startWorker()
    {
        $this->info('Iniciando worker da fila...');
        $this->info('Pressione Ctrl+C para parar');
        
        Artisan::call('queue:work', [
            '--timeout' => 1800,
            '--tries' => 3,
            '--max-jobs' => 1000,
            '--max-time' => 7200,
            '--verbose' => true
        ]);
    }

    private function stopWorker()
    {
        $this->info('Parando worker da fila...');
        Artisan::call('queue:restart');
    }

    private function showStatus()
    {
        $this->info('=== Status da Fila ===');
        
        $pending = \DB::table('jobs')->count();
        $this->info("Jobs pendentes: {$pending}");
        
        $failed = \DB::table('failed_jobs')->count();
        $this->info("Jobs falhados: {$failed}");
    }

    private function clearFailed()
    {
        $this->info('Limpando jobs falhados...');
        Artisan::call('queue:flush');
    }
}
