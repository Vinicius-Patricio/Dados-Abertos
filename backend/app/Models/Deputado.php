<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deputado extends Model
{
    use HasFactory;

    protected $table = 'deputados';

    protected $fillable = [
        'id_api',
        'nome',
        'sigla_partido',
        'sigla_uf',
        'email',
        'url_foto',
        'ultima_sincronizacao_despesas',
        'dados_api'
    ];

    protected $casts = [
        'ultima_sincronizacao_despesas' => 'datetime',
        'dados_api' => 'array'
    ];

    public function despesas()
    {
        return $this->hasMany(Despesa::class);
    }
}