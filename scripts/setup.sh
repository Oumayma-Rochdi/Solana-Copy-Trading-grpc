#!/bin/bash

# AI Bot Setup Script
# Installe et configure le bot IA automatiquement

echo "========================================="
echo "🚀 Configuration du Bot IA Solana Trading"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Node.js
log_info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé!"
    echo "Visitez: https://nodejs.org"
    exit 1
fi
log_success "Node.js $(node -v) détecté"

# Check npm
log_info "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé!"
    exit 1
fi
log_success "npm $(npm -v) détecté"

# Install dependencies
echo ""
log_info "Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    log_success "Dépendances installées"
else
    log_error "Erreur lors de l'installation des dépendances"
    exit 1
fi

# Create .env if not exists
echo ""
log_info "Configuration du fichier .env..."

if [ -f .env ]; then
    log_warning ".env existe déjà"
    read -p "Voulez-vous le remplacer? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Utilisation du .env existant"
    fi
else
    log_info "Création du fichier .env..."
    cat > .env << 'EOF'
# AI Gateway Configuration
AI_GATEWAY_API_KEY=your_api_key_here

# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost/trading_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Risk Management
MAX_DAILY_LOSS=5
MAX_SINGLE_LOSS=1
MAX_POSITIONS=10

# Trading Configuration
MIN_TRADE_AMOUNT=0.1
MAX_TRADE_AMOUNT=100
EOF
    log_success ".env créé"
    log_warning "⚠️  Mettez à jour AI_GATEWAY_API_KEY et DATABASE_URL dans .env"
fi

# Create database tables
echo ""
log_info "Configuration de la base de données..."

if [ -z "$DATABASE_URL" ]; then
    log_warning "DATABASE_URL non défini"
    read -p "Entrez votre DATABASE_URL (ou appuyez sur Entrée pour ignorer): " DB_URL
    if [ ! -z "$DB_URL" ]; then
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
        log_success "DATABASE_URL mis à jour"
    fi
else
    log_info "DATABASE_URL trouvé"
fi

# Create tables
log_info "Création des tables de base de données..."
if command -v psql &> /dev/null; then
    psql $DATABASE_URL -f scripts/create-ai-analysis-tables.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        log_success "Tables créées"
    else
        log_warning "Impossible de créer les tables (BD non accessible)"
    fi
else
    log_warning "psql non trouvé - Tables non créées"
fi

# Test setup
echo ""
log_info "Test de la configuration..."

# Test environment variables
if [ -z "$AI_GATEWAY_API_KEY" ]; then
    log_warning "AI_GATEWAY_API_KEY non défini"
else
    log_success "AI_GATEWAY_API_KEY trouvé"
fi

# Run tests
echo ""
log_info "Exécution de la suite de tests..."
node tests/ai-bot.test.js

if [ $? -eq 0 ]; then
    log_success "Tests réussis!"
else
    log_warning "Certains tests ont échoué"
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✓ Installation terminée!${NC}"
echo "========================================="
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Mettez à jour .env avec vos clés API"
echo "  2. Configurez DATABASE_URL"
echo "  3. Exécutez: npm start"
echo ""
echo "🧪 Pour tester:"
echo "  npm run test"
echo ""
echo "📚 Documentation:"
echo "  - SETUP_INSTRUCTIONS.md"
echo "  - QUICK_START.md"
echo "  - AI_BOT_README.md"
echo ""
