<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Despesa extends Model
{
    use HasFactory;

    protected $table = 'despesas';

    protected $fillable = [
        'deputado_id',
        'ano',
        'mes',
        'tipo_despesa',
        'fornecedor',
        'valor',
        'data_documento',
        'url_documento',
        'dados_api'
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'data_documento' => 'date',
        'dados_api' => 'array'
    ];

    public function deputado()
    {
        return $this->belongsTo(Deputado::class);
    }
}