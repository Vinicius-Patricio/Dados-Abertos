# DadosAbertos API

Sistema para sincronização e consulta de dados de deputados e despesas da Câmara dos Deputados através da API de Dados Abertos.

## 🚀 Funcionalidades

- **Sincronização Automática**: Jobs em background para sincronizar dados de deputados e despesas
- **Lista de Deputados**: Consulta com filtros por nome, ID, partido e UF
- **Despesas por Deputado**: Visualização detalhada com filtros por período, valor e fornecedor
- **Paginação Avançada**: Navegação intuitiva com múltiplas páginas visíveis
- **Interface Moderna**: Frontend React com design responsivo

## 📋 Pré-requisitos

- Docker e Docker Compose
- Git

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd DadosAbertos-api
```

2. **Inicie os containers**
```bash
docker-compose up -d
```

3. **Configure o banco de dados**
```bash
docker exec laravel_app php artisan migrate
```

4. **Inicie o worker de filas**
```bash
docker exec laravel_app php artisan queue:work --timeout=1800
```

## 🎯 Como Usar

### Acessando a Aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### Sincronizando Dados

1. **Sincronizar todos os deputados**:
```bash
docker exec laravel_app php artisan deputados:sync
```

2. **Sincronizar despesas de um deputado específico**:
```bash
docker exec laravel_app php artisan deputados:sync-despesas {deputado_id}
```

### Gerenciando a Fila
```bash
# Ver status da fila
docker exec laravel_app php artisan fila:status

# Parar worker
docker exec laravel_app php artisan fila:stop

# Iniciar worker
docker exec laravel_app php artisan fila:start
```

## 🏗️ Estrutura do Projeto

```
DadosAbertos-api/
├── backend/                 # API Laravel
│   ├── app/
│   │   ├── Jobs/           # Jobs de sincronização
│   │   ├── Models/         # Modelos Eloquent
│   │   └── Http/Controllers/ # Controllers da API
│   └── database/migrations/ # Migrações do banco
└── frontend/               # Interface React
    └── src/
        ├── pages/          # Páginas da aplicação
        └── hooks/          # Hooks customizados
```

## 🔌 API Endpoints

- `GET /api/deputados` - Lista deputados com filtros
- `GET /api/deputados/{id}/despesas` - Despesas de um deputado
- `POST /api/sincronizar-deputados` - Inicia sincronização
- `POST /api/sincronizar-despesas/{id}` - Sincroniza despesas

## 🛠️ Tecnologias

- **Backend**: Laravel 10, PostgreSQL, Redis
- **Frontend**: React 18, React Router, Tailwind CSS
- **Infraestrutura**: Docker, Docker Compose
- **Filas**: Laravel Queue (database driver)

## 📝 Licença

Este projeto está sob a licença MIT.
