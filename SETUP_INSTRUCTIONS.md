# Configuration du Bot IA - Guide Complet

## 🚀 Installation Rapide

### Étape 1: Installer les dépendances

```bash
npm install
```

### Étape 2: Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet avec:

```env
# AI Gateway Configuration
AI_GATEWAY_API_KEY=votre_cle_api_vercel

# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Étape 3: Installer dotenv (si nécessaire)

```bash
npm install dotenv
```

## 🗄️ Configuration de la Base de Données

### Option 1: Utiliser Neon (Recommandé)

1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte et un projet
3. Copiez votre `DATABASE_URL`
4. Collez-la dans le `.env`

### Option 2: PostgreSQL Local

1. Assurez-vous que PostgreSQL est installé
2. Créez une base de données:

```bash
createdb trading_db
```

3. Obtenez votre connection string:

```bash
DATABASE_URL=postgresql://localhost/trading_db
```

### Créer les tables de la BD

```bash
psql -d $DATABASE_URL -f scripts/create-ai-analysis-tables.sql
```

Ou directement:

```bash
node -e "import('./services/aiPersistence.js').then(m => m.default.initialize())"
```

## 🔑 Obtenir la clé AI Gateway

### Étape 1: Vercel Account

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous ou créez un compte

### Étape 2: AI Gateway API Key

1. Allez dans **Settings** → **Tokens**
2. Créez un nouveau token pour AI Gateway
3. Copiez le token

### Étape 3: Ajouter à `.env`

```env
AI_GATEWAY_API_KEY=your_token_here
```

## ✅ Vérifier la Configuration

### Test 1: Variables d'environnement

```bash
node -e "console.log('AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY)"
```

Vous devriez voir votre clé s'afficher.

### Test 2: Base de données

```bash
node -e "import('./services/aiPersistence.js').then(m => m.default.initialize()).then(() => console.log('✓ BD connectée'))"
```

### Test 3: Suite complète

```bash
node tests/ai-bot.test.js
```

## 🐛 Dépannage

### Erreur: "Unauthenticated request to AI Gateway"

**Solution**: Vérifiez que:
- `AI_GATEWAY_API_KEY` est défini dans `.env`
- Le fichier de test import `'dotenv/config'` en premier
- La clé API est valide et active

```bash
# Vérifiez:
cat .env | grep AI_GATEWAY_API_KEY
```

### Erreur: "Cannot find module 'dotenv'"

**Solution**: Installez dotenv:

```bash
npm install dotenv --save
```

### Erreur: "Database connection failed"

**Solution**:
1. Vérifiez que `DATABASE_URL` est correct
2. Vérifiez la connexion à la BD:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

3. Créez les tables:

```bash
psql -d $DATABASE_URL -f scripts/create-ai-analysis-tables.sql
```

### Erreur: "getTotalExposure is not a function"

**Solution**: Assurez-vous que vous avez la dernière version de `riskManager.js` avec la méthode ajoutée.

## 📝 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `.env` | Variables d'environnement |
| `services/aiAnalysis.js` | Logique d'analyse IA |
| `services/aiPersistence.js` | Persistance en BD |
| `dashboard/server.js` | API endpoints |
| `tests/ai-bot.test.js` | Suite de tests |
| `scripts/create-ai-analysis-tables.sql` | Schéma BD |

## 🚀 Démarrage du Projet

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Tests

```bash
npm test
# ou
node tests/ai-bot.test.js
```

## 📊 Vérifier le Statut

Une fois le bot lancé, vérifiez:

1. **API IA**: `http://localhost:3000/api/ai/current-suggestions`
2. **Historique**: `http://localhost:3000/api/ai/history`
3. **Statistiques**: `http://localhost:3000/api/ai/statistics`

## 🎯 Prochaines Étapes

1. ✓ Configuration complète
2. ✓ Tests passent
3. → Intégrer au dashboard
4. → Déployer sur Vercel
5. → Monitorer les performances

## ❓ Questions?

Consultez:
- `AI_BOT_README.md` - Vue d'ensemble complète
- `QUICK_START.md` - Guide rapide
- `AI_BOT_INTEGRATION.md` - Architecture technique
