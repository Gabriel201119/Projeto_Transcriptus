#!/bin/bash

# 🚀 Script de Deploy Automatizado - Transcriptus
# Uso: ./deploy.sh [railway|render|heroku|vps]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  🚀 Deploy Transcriptus 🚀${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar se o Node.js está instalado
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado. Instale Node.js 18+ primeiro."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js versão 18+ é necessário. Versão atual: $(node --version)"
        exit 1
    fi
    
    print_message "Node.js $(node --version) detectado ✓"
}

# Verificar se o Git está configurado
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git não está instalado."
        exit 1
    fi
    
    if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
        print_warning "Git não está configurado. Configure com:"
        echo "git config --global user.name 'Seu Nome'"
        echo "git config --global user.email 'seu@email.com'"
        exit 1
    fi
    
    print_message "Git configurado ✓"
}

# Instalar dependências
install_dependencies() {
    print_message "Instalando dependências..."
    npm install
    print_message "Dependências instaladas ✓"
}

# Configurar Prisma
setup_prisma() {
    print_message "Configurando Prisma..."
    npx prisma generate
    print_message "Prisma configurado ✓"
}

# Deploy no Railway
deploy_railway() {
    print_message "Iniciando deploy no Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_message "Instalando Railway CLI..."
        npm install -g @railway/cli
    fi
    
    print_message "Fazendo login no Railway..."
    railway login
    
    print_message "Iniciando deploy..."
    railway up
    
    print_message "Deploy no Railway concluído! ✓"
    print_message "Acesse: https://railway.app/dashboard"
}

# Deploy no Render
deploy_render() {
    print_message "Iniciando deploy no Render..."
    
    print_message "Fazendo commit das alterações..."
    git add .
    git commit -m "Deploy: Configuração para Render" || true
    
    print_message "Fazendo push para o repositório..."
    git push origin main
    
    print_message "Deploy no Render concluído! ✓"
    print_message "Acesse: https://render.com/dashboard"
}

# Deploy no Heroku
deploy_heroku() {
    print_message "Iniciando deploy no Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI não está instalado. Instale primeiro:"
        echo "https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    print_message "Fazendo login no Heroku..."
    heroku login
    
    print_message "Criando app no Heroku..."
    heroku create transcriptus-$(date +%s) || true
    
    print_message "Adicionando PostgreSQL..."
    heroku addons:create heroku-postgresql:hobby-dev
    
    print_message "Configurando variáveis de ambiente..."
    print_warning "Configure as seguintes variáveis no dashboard do Heroku:"
    echo "- JWT_SECRET"
    echo "- BING_TRANSLATE_API_KEY"
    echo "- GEMINI_API_KEY"
    
    print_message "Fazendo deploy..."
    git push heroku main
    
    print_message "Deploy no Heroku concluído! ✓"
    print_message "Acesse: https://dashboard.heroku.com"
}

# Deploy no VPS
deploy_vps() {
    print_message "Iniciando deploy no VPS..."
    
    print_warning "Para deploy no VPS, siga o guia completo em deploy-guide.md"
    print_message "Resumo dos comandos:"
    echo "1. Conecte-se ao seu VPS via SSH"
    echo "2. Clone o repositório: git clone <seu-repo>"
    echo "3. Configure o banco PostgreSQL"
    echo "4. Configure as variáveis de ambiente"
    echo "5. Execute: npm install && npx prisma generate && npx prisma db push"
    echo "6. Configure PM2: pm2 start server.js --name transcriptus"
    echo "7. Configure Nginx como proxy reverso"
}

# Função principal
main() {
    print_header
    
    # Verificações básicas
    check_node
    check_git
    
    # Instalar dependências
    install_dependencies
    setup_prisma
    
    # Deploy baseado no argumento
    case "${1:-railway}" in
        "railway")
            deploy_railway
            ;;
        "render")
            deploy_render
            ;;
        "heroku")
            deploy_heroku
            ;;
        "vps")
            deploy_vps
            ;;
        *)
            print_error "Opção inválida: $1"
            echo "Uso: ./deploy.sh [railway|render|heroku|vps]"
            exit 1
            ;;
    esac
    
    print_message "Deploy concluído com sucesso! 🎉"
}

# Executar função principal
main "$@"

