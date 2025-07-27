<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deputados', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_api')->unique();
            $table->string('nome');
            $table->string('sigla_partido');
            $table->string('sigla_uf', 2);
            $table->string('email')->nullable();
            $table->string('url_foto')->nullable();
            $table->timestamp('ultima_sincronizacao_despesas')->nullable();
            $table->json('dados_api')->nullable();
            $table->timestamps();
            
            $table->index('id_api');
            $table->index('sigla_uf');
            $table->index('sigla_partido');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deputados');
    }
};
