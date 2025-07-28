#!/bin/bash

# Iniciar o Supervisor (que gerencia o worker)
echo "Iniciando Supervisor..."
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf &

# Aguardar um pouco para o Supervisor inicializar
sleep 3

# Iniciar o servidor Laravel
echo "Iniciando servidor Laravel..."
php artisan serve --host=0.0.0.0 --port=8000 