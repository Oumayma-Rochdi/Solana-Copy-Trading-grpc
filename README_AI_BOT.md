# 🤖 Bot IA de Trading Solana

[🇫🇷 **Français**](#français) | [🇬🇧 **English**](#english)

---

<a name="français"></a>
# 🇫🇷 Français

## 📌 Résumé Rapide

Votre bot IA de trading Solana a été complètement configuré avec:

✅ **Analyse intelligente** des marchés  
✅ **Suggestions** de trading automatiques  
✅ **Gestion des risques** avancée  
✅ **Base de données** PostgreSQL  
✅ **Dashboard web** complet  

## 🚀 Démarrer en 3 Étapes

### 1. Configurer `.env`
```bash
# Mettez à jour votre clé API Vercel
nano .env
# AI_GATEWAY_API_KEY=votre_cle_ici
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Tester
```bash
npm test
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **DEMARRAGE_RAPIDE.md** | ⚡ 5 minutes de setup |
| **ETAPES_PRECISES.md** | 📋 Instructions pas à pas |
| **SETUP_INSTRUCTIONS.md** | 🔧 Configuration détaillée |
| **FIXES_APPLIED.md** | ✅ Corrections appliquées |
| **CORRECTION_COMPLETE.md** | 📊 Rapport complet |

## 🎯 Commandes Principales

```bash
# Développement
npm run dev              # Serveur avec rechargement automatique

# Production
npm start               # Démarrer le serveur

# Tests
npm test                # Lancer la suite de tests

# Base de données
npm run db:init        # Initialiser la base de données
```

## 🔑 Configuration Essentielle

### Variable d'Environnement
```env
AI_GATEWAY_API_KEY=votre_cle_api
DATABASE_URL=postgresql://user:password@host/db
PORT=3000
```

### Obtenir la Clé API
1. Allez sur **[vercel.com](https://vercel.com)**
2. **Settings** → **Tokens**
3. Créez un token AI Gateway
4. Copiez dans `.env`

## 📊 Fonctionnalités

- **Analyse de Marché**: Détecte les tendances et opportunités
- **Suggestions IA**: Recommande les meilleurs trades
- **Évaluation des Risques**: Portfolio risk assessment
- **Historique**: Sauvegarde toutes les analyses
- **Dashboard**: Interface web complète

## 🆘 Problèmes Courants

### Erreur: "AI_GATEWAY_API_KEY not set"
```bash
# Solution: Vérifiez .env
type .env | findstr AI_GATEWAY_API_KEY
```

### Erreur: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Tests échouent
```bash
# Vérifiez la clé API et relancez
npm test
```

---

<a name="english"></a>
# 🇬🇧 English

## 📌 Quick Summary

Your Solana AI trading bot is fully configured with:

✅ **Intelligent market** analysis  
✅ **Automatic trading** suggestions  
✅ **Advanced risk** management  
✅ **PostgreSQL** database  
✅ **Complete web** dashboard  

## 🚀 Getting Started in 3 Steps

### 1. Configure `.env`
```bash
# Update your Vercel API key
nano .env
# AI_GATEWAY_API_KEY=your_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test
```bash
npm test
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **DEMARRAGE_RAPIDE.md** | ⚡ 5-minute setup |
| **ETAPES_PRECISES.md** | 📋 Step-by-step guide |
| **SETUP_INSTRUCTIONS.md** | 🔧 Detailed configuration |
| **FIXES_APPLIED.md** | ✅ Applied fixes |
| **CORRECTION_COMPLETE.md** | 📊 Full report |

## 🎯 Main Commands

```bash
# Development
npm run dev              # Server with auto-reload

# Production
npm start               # Start the server

# Tests
npm test                # Run test suite

# Database
npm run db:init        # Initialize database
```

## 🔑 Essential Configuration

### Environment Variables
```env
AI_GATEWAY_API_KEY=your_api_key
DATABASE_URL=postgresql://user:password@host/db
PORT=3000
```

### Get API Key
1. Go to **[vercel.com](https://vercel.com)**
2. **Settings** → **Tokens**
3. Create AI Gateway token
4. Copy to `.env`

## 📊 Features

- **Market Analysis**: Detects trends and opportunities
- **AI Suggestions**: Recommends best trades
- **Risk Assessment**: Portfolio risk evaluation
- **History**: Saves all analyses
- **Dashboard**: Complete web interface

## 🆘 Common Issues

### Error: "AI_GATEWAY_API_KEY not set"
```bash
# Solution: Check .env
cat .env | grep AI_GATEWAY_API_KEY
```

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Tests fail
```bash
# Check API key and retry
npm test
```

---

## 🔗 Fichiers Clés / Key Files

```
.env                          # Configuration
services/aiAnalysis.js       # AI logic
services/aiPersistence.js    # Database persistence
tests/ai-bot.test.js        # Test suite
dashboard/server.js         # API endpoints
scripts/create-ai-analysis-tables.sql  # Database schema
```

---

## ✨ Améliorations Apportées / Improvements Made

✅ `.env` file created with configuration  
✅ `dotenv` import added to tests  
✅ `getTotalExposure()` method implemented  
✅ Complete documentation provided  
✅ Setup scripts created for Windows/Linux/Mac  
✅ Step-by-step guides in French & English  

---

## 📞 Support

- 📖 Read the documentation files
- 🧪 Run tests: `npm test`
- 🔍 Check logs: `npm test 2>&1`
- 📱 Consult Vercel docs: https://vercel.com/docs

---

## 🎓 Next Steps

1. [ ] Update `.env` with your API key
2. [ ] Run `npm install`
3. [ ] Run `npm test`
4. [ ] Start with `npm start`
5. [ ] Access dashboard at `http://localhost:3000`

---

**Bon trading! Happy trading! 🚀**

Version: 1.0 | Last Updated: 2026-02-05
