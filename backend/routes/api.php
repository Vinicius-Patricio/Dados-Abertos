<?php

use App\Http\Controllers\DeputadosController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/teste', function () {
    return 'rota teste ok';
});

Route::get('/dados-publicos' , [DeputadosController::class , 'buscarDados']);