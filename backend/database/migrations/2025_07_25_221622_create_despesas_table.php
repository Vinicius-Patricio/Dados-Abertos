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
        Schema::create('despesas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deputado_id')->constrained('deputados')->onDelete('cascade');
            $table->integer('ano');
            $table->integer('mes');
            $table->string('tipo_despesa');
            $table->string('fornecedor');
            $table->decimal('valor', 10, 2);
            $table->date('data_documento')->nullable();
            $table->string('url_documento')->nullable();
            $table->json('dados_api')->nullable();
            $table->timestamps();
            
            $table->index(['deputado_id', 'ano', 'mes']);
            $table->index('tipo_despesa');
            $table->index('valor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('despesas');
    }
};
