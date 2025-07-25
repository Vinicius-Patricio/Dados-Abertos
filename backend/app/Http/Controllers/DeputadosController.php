<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class DeputadosController extends Controller
{
    public function buscarDados()
    {
        $response = Http::get('https://dadosabertos.camara.leg.br/api/v2/deputados');
        if ($response->successful()) {
            return response()->json($response->json());
        } else {
            return response()->json(['erro' => 'Falha ao buscar dados'], 500);
        }
    }
}