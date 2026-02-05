# 🚀 Démarrage Rapide - Bot IA Solana Trading

## ⚡ 5 Minutes de Configuration

### 1️⃣ Préparer l'environnement

```bash
# Cloner ou télécharger le projet
cd Solana-Copy-Trading-grpc

# Installer les dépendances
npm install
```

### 2️⃣ Configurer la clé API

**Sur Windows (PowerShell):**
```powershell
# Créer .env
@"
AI_GATEWAY_API_KEY=votre_cle_ici
DATABASE_URL=postgresql://localhost/trading_db
PORT=3000
"@ | Out-File -Encoding UTF8 .env
```

**Sur Mac/Linux:**
```bash
# Créer .env
cat > .env << EOF
AI_GATEWAY_API_KEY=votre_cle_ici
DATABASE_URL=postgresql://localhost/trading_db
PORT=3000
EOF
```

### 3️⃣ Obtenir la clé API

1. Allez sur **[vercel.com](https://vercel.com)**
2. **Settings** → **Tokens**
3. Créez un token AI Gateway
4. Collez dans `.env`

### 4️⃣ Tester

```bash
# Lancer les tests
node tests/ai-bot.test.js
```

✅ Vous devriez voir les tests réussir!

### 5️⃣ Démarrer

```bash
# Mode développement
npm run dev

# Production
npm start
```

Accédez à: `http://localhost:3000`

## 📊 Vérifications

### ✓ Vérifier la clé API
```bash
node -e "console.log('API:', process.env.AI_GATEWAY_API_KEY)"
```

### ✓ Vérifier les dépendances
```bash
npm list dotenv ai
```

### ✓ Lancer les tests
```bash
npm test
```

## 🐛 Problèmes Courants

### ❌ "AI_GATEWAY_API_KEY not set"
```bash
# Solution: Mettez à jour .env
nano .env
# ou sur Windows
notepad .env
```

### ❌ "Module not found: dotenv"
```bash
npm install dotenv
```

### ❌ "Database connection failed"
```bash
# Vérifiez DATABASE_URL dans .env
# Pour local PostgreSQL:
DATABASE_URL=postgresql://localhost/trading_db
```

## 📁 Structure Important

```
Solana-Copy-Trading-grpc/
├── .env                          # Variables d'environnement
├── services/
│   ├── aiAnalysis.js            # Logique IA
│   ├── aiPersistence.js         # Base de données
│   └── riskManager.js           # Gestion des risques
├── tests/
│   └── ai-bot.test.js          # Tests
├── dashboard/
│   ├── server.js               # API endpoints
│   └── public/
│       ├── ai-bot.js          # Interface IA
│       └── index.html         # Dashboard
└── scripts/
    ├── setup.sh               # Installation (Mac/Linux)
    ├── setup.bat              # Installation (Windows)
    └── create-ai-analysis-tables.sql  # Base de données
```

## 🎯 Fonctionnalités Activées

✅ **Analyse IA des marchés** - Détecte les opportunités  
✅ **Suggestions de trading** - Recommandations intelligentes  
✅ **Analyse de tokens** - Score de sécurité  
✅ **Évaluation des risques** - Portfolio risk assessment  
✅ **Historique** - Base de données PostgreSQL  
✅ **Dashboard** - Interface web complète  

## 📚 Documentation Complète

| Document | Contenu |
|----------|---------|
| `SETUP_INSTRUCTIONS.md` | Configuration détaillée |
| `QUICK_START.md` | Guide rapide |
| `AI_BOT_README.md` | Vue d'ensemble |
| `FIXES_APPLIED.md` | Corrections appliquées |
| `DEPLOYMENT.md` | Déploiement Vercel |

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev              # Développement avec rechargement
npm start               # Production
npm test                # Tests

# Database
npm run db:init         # Initialiser la BD
npm run db:reset        # Réinitialiser

# Nettoyage
npm run clean           # Nettoyer les fichiers temporaires
npm run lint            # Vérifier le code
```

## 🚀 Déploiement sur Vercel

```bash
# Connecter à GitHub
git push origin main

# Vercel détecte automatiquement et déploie
# Accédez à: https://votre-projet.vercel.app
```

## ⏱️ Prochaines Actions

- [ ] Cloner le projet
- [ ] Installer les dépendances: `npm install`
- [ ] Obtenir clé API Vercel
- [ ] Configurer `.env`
- [ ] Lancer les tests: `npm test`
- [ ] Démarrer le serveur: `npm start`
- [ ] Accéder au dashboard
- [ ] Intégrer au trading

## 💡 Tips

1. **Utilisez variables d'environnement** pour la sécurité
2. **Gardez `.env` secret** - Ne le poussez pas sur GitHub
3. **Testez d'abord** avant de trader réellement
4. **Monitorez les logs** pour les erreurs
5. **Graduellement augmentez** les montants tradés

## ❓ Support

**Issues?** Consultez:
- Documentation dans les fichiers `.md`
- Les logs du serveur
- Tests: `node tests/ai-bot.test.js`

**Besoin d'aide?** Contactez l'équipe Vercel ou consultez les docs:
- [Vercel Docs](https://vercel.com/docs)
- [AI SDK Docs](https://sdk.vercel.ai)
- [Neon Docs](https://neon.tech/docs)

---

**Bon trading! 🚀**
