#!/bin/bash

# Script de Deploy Automatizado para VPS
# Protecar CRM - Docker Deployment

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Verificar se está rodando como root ou com sudo
check_permissions() {
    if [ "$EUID" -eq 0 ]; then 
        print_warning "Rodando como root. Recomendado usar um usuário normal com Docker configurado."
    fi
}

# Verificar pré-requisitos
check_requirements() {
    print_header "Verificando Pré-requisitos"
    
    # Docker
    if command -v docker &> /dev/null; then
        print_success "Docker instalado: $(docker --version)"
    else
        print_error "Docker não encontrado! Instale o Docker primeiro."
        exit 1
    fi
    
    # Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose instalado: $(docker-compose --version)"
    else
        print_error "Docker Compose não encontrado! Instale o Docker Compose primeiro."
        exit 1
    fi
    
    # Git
    if command -v git &> /dev/null; then
        print_success "Git instalado: $(git --version)"
    else
        print_warning "Git não encontrado. Não será possível usar 'git pull' para atualizações."
    fi
}

# Verificar arquivo .env
check_env_file() {
    print_header "Verificando Arquivo .env"
    
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado!"
        
        if [ -f ".env.example" ]; then
            print_info "Copiando .env.example para .env..."
            cp .env.example .env
            print_success ".env criado a partir do .env.example"
            print_warning "IMPORTANTE: Edite o arquivo .env com suas configurações antes de continuar!"
            print_info "Execute: nano .env"
            
            read -p "Deseja editar o .env agora? (s/n): " edit_env
            if [ "$edit_env" = "s" ] || [ "$edit_env" = "S" ]; then
                ${EDITOR:-nano} .env
            else
                print_warning "Lembre-se de editar o .env antes de fazer o deploy!"
                exit 0
            fi
        else
            print_error ".env.example não encontrado! Crie um arquivo .env manualmente."
            exit 1
        fi
    else
        print_success "Arquivo .env encontrado"
    fi
}

# Menu de opções
show_menu() {
    clear
    print_header "🚀 Deploy Protecar CRM - VPS"
    echo "Escolha uma opção:"
    echo ""
    echo "1) 🆕 Deploy Inicial (primeira vez)"
    echo "2) 🔄 Atualizar Deploy (rebuild)"
    echo "3) 🔍 Ver Status dos Containers"
    echo "4) 📋 Ver Logs"
    echo "5) ⏹️  Parar Containers"
    echo "6) ▶️  Iniciar Containers"
    echo "7) 🔁 Reiniciar Containers"
    echo "8) 🧹 Limpar Tudo (containers + volumes)"
    echo "9) 📊 Estatísticas de Uso"
    echo "0) ❌ Sair"
    echo ""
}

# Deploy inicial
initial_deploy() {
    print_header "🆕 Deploy Inicial"
    
    print_info "Parando containers antigos (se existirem)..."
    docker-compose down 2>/dev/null || true
    
    print_info "Limpando builds anteriores..."
    docker-compose build --no-cache
    
    print_info "Iniciando containers..."
    docker-compose up -d
    
    print_success "Deploy inicial concluído!"
    
    sleep 3
    print_info "Aguardando containers iniciarem..."
    sleep 5
    
    show_status
}

# Atualizar deploy
update_deploy() {
    print_header "🔄 Atualizar Deploy"
    
    # Git pull se disponível
    if command -v git &> /dev/null; then
        print_info "Atualizando código do repositório..."
        if git pull; then
            print_success "Código atualizado"
        else
            print_warning "Não foi possível fazer git pull (talvez não seja um repositório git)"
        fi
    fi
    
    print_info "Parando containers..."
    docker-compose stop
    
    print_info "Rebuilding imagens..."
    docker-compose build --no-cache
    
    print_info "Iniciando containers..."
    docker-compose up -d
    
    print_success "Deploy atualizado!"
    
    sleep 3
    show_status
}

# Ver status
show_status() {
    print_header "🔍 Status dos Containers"
    docker-compose ps
    echo ""
    
    # Verificar saúde dos containers
    if docker ps --filter "name=crm-" --format "{{.Names}}" | grep -q "crm-"; then
        print_success "Containers estão rodando"
        echo ""
        print_info "Acesse a aplicação em:"
        echo "  Frontend: http://seu-ip:3000"
        echo "  Backend:  http://seu-ip:3001"
    else
        print_warning "Nenhum container rodando"
    fi
}

# Ver logs
show_logs() {
    print_header "📋 Ver Logs"
    echo "Escolha:"
    echo "1) Todos os serviços"
    echo "2) Backend"
    echo "3) Frontend"
    echo "4) Postgres"
    echo ""
    read -p "Opção: " log_option
    
    case $log_option in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f backend ;;
        3) docker-compose logs -f frontend ;;
        4) docker-compose logs -f postgres ;;
        *) print_error "Opção inválida" ;;
    esac
}

# Parar containers
stop_containers() {
    print_header "⏹️  Parar Containers"
    docker-compose stop
    print_success "Containers parados"
}

# Iniciar containers
start_containers() {
    print_header "▶️  Iniciar Containers"
    docker-compose start
    print_success "Containers iniciados"
    sleep 3
    show_status
}

# Reiniciar containers
restart_containers() {
    print_header "🔁 Reiniciar Containers"
    docker-compose restart
    print_success "Containers reiniciados"
    sleep 3
    show_status
}

# Limpar tudo
clean_all() {
    print_header "🧹 Limpar Tudo"
    print_warning "ATENÇÃO: Isso vai remover todos os containers e VOLUMES (incluindo o banco de dados)!"
    read -p "Tem certeza? Digite 'SIM' para confirmar: " confirm
    
    if [ "$confirm" = "SIM" ]; then
        print_info "Removendo containers e volumes..."
        docker-compose down -v
        
        print_info "Limpando sistema Docker..."
        docker system prune -af
        
        print_success "Limpeza concluída!"
    else
        print_info "Operação cancelada"
    fi
}

# Estatísticas
show_stats() {
    print_header "📊 Estatísticas de Uso"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Verificação inicial
check_permissions
check_requirements
check_env_file

# Loop do menu
while true; do
    show_menu
    read -p "Escolha uma opção: " option
    
    case $option in
        1) initial_deploy ;;
        2) update_deploy ;;
        3) show_status ;;
        4) show_logs ;;
        5) stop_containers ;;
        6) start_containers ;;
        7) restart_containers ;;
        8) clean_all ;;
        9) show_stats ;;
        0) 
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida!"
            sleep 2
            ;;
    esac
    
    if [ "$option" != "4" ]; then
        echo ""
        read -p "Pressione ENTER para continuar..."
    fi
done
