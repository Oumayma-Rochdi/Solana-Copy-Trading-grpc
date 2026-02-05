# 📋 Étapes Précises pour Démarrer

## Vous êtes ici: C:\Users\Oumayma\OneDrive\Desktop\M2 2IAD\BlockChain\Solana-Copy-Trading-grpc

---

## ÉTAPE 1: Vérifier que .env existe

Votre fichier `.env` doit avoir cette structure:

```env
AI_GATEWAY_API_KEY=macleapi
DATABASE_URL=postgresql://user:password@localhost/trading_db
PORT=3000
NODE_ENV=development
MAX_DAILY_LOSS=5
MAX_SINGLE_LOSS=1
MAX_POSITIONS=10
MIN_TRADE_AMOUNT=0.1
MAX_TRADE_AMOUNT=100
```

**Comment vérifier**:
```bash
# Affiche le contenu de .env
type .env

# Ou affiche juste la clé API
findstr "AI_GATEWAY_API_KEY" .env
```

**Si .env n'existe pas**:
```bash
# Créer le fichier
type nul > .env

# Puis ajouter les variables avec Notepad
notepad .env
```

---

## ÉTAPE 2: Vérifier que dotenv est installé

```bash
npm list dotenv
```

**Résultat attendu**:
```
└── dotenv@16.x.x
```

**Si pas trouvé**, installer:
```bash
npm install dotenv
```

---

## ÉTAPE 3: Vérifier que le test charge les variables

**Ouvrir**: `tests/ai-bot.test.js`

**Ligne 1-10 DOIT être**:
```javascript
/**
 * AI Bot Integration Tests
 * Tests the AI analysis service and API endpoints
 */

// Load environment variables from .env file
import 'dotenv/config'

import aiAnalysis from '../services/aiAnalysis.js'
import aiPersistence from '../services/aiPersistence.js'
```

**Vérification**: Line 7 doit avoir `import 'dotenv/config'`

---

## ÉTAPE 4: Vérifier que riskManager a la méthode

**Ouvrir**: `services/riskManager.js`

**Chercher** la méthode `getTotalExposure`:

```bash
# Chercher dans le fichier
findstr "getTotalExposure" services\riskManager.js
```

**Résultat attendu**:
```
getTotalExposure() {
```

**Si pas trouvé**, contacter l'équipe ou consulter le fichier original

---

## ÉTAPE 5: Installer/Mettre à jour les dépendances

```bash
npm install
```

Cela doit installer/mettre à jour:
- dotenv
- ai
- Autres dépendances

---

## ÉTAPE 6: Tester la configuration

### Test 1: Variables d'environnement
```bash
node -e "console.log('API Key:', process.env.AI_GATEWAY_API_KEY)"
```

**Résultat attendu**:
```
API Key: macleapi
```

### Test 2: dotenv chargé
```bash
node -e "import('dotenv/config').then(() => console.log('✓ dotenv works'))"
```

**Résultat attendu**:
```
✓ dotenv works
```

### Test 3: riskManager.getTotalExposure
```bash
node -e "import('./services/riskManager.js').then(m => console.log('getTotalExposure:', typeof m.default.getTotalExposure))"
```

**Résultat attendu**:
```
getTotalExposure: function
```

---

## ÉTAPE 7: Lancer les tests complets

```bash
node tests/ai-bot.test.js
```

### Résultats Possibles

#### ✅ RÉUSSI (API key valide)
```
========== Test Results ==========
Passed:  6
Failed:  0
Skipped: 0
Total:   6
✓ All tests passed!
```

#### ⚠️ PARTIEL (Base de données non configurée)
```
Passed:  2
Failed:  4
Skipped: 0
```
C'est normal si DATABASE_URL n'est pas correct

#### ❌ ÉCHOUÉ (API key invalide)
```
Unauthenticated request to AI Gateway...
```
Vérifiez votre AI_GATEWAY_API_KEY dans .env

---

## ÉTAPE 8: Si Erreur - Diagnostic

### Erreur: "Unauthenticated request to AI Gateway"

```bash
# Étape 1: Vérifier .env existe
if not exist .env echo ✗ .env MANQUANT

# Étape 2: Vérifier clé API
findstr "AI_GATEWAY_API_KEY" .env

# Étape 3: Vérifier test importe dotenv
findstr "dotenv" tests\ai-bot.test.js

# Étape 4: Test direct
node -e "import('dotenv/config').then(() => console.log(process.env.AI_GATEWAY_API_KEY))"
```

### Erreur: "getTotalExposure is not a function"

```bash
# Vérifier la méthode existe
findstr "getTotalExposure" services\riskManager.js
```

Si pas trouvé, relire le fichier ou réappliquer la correction

### Erreur: "Cannot find module 'dotenv'"

```bash
# Installer dotenv
npm install dotenv

# Vérifier installation
npm list dotenv
```

---

## ÉTAPE 9: Commandes Rapides de Test

```bash
# Test 1: Variables
node -e "import('dotenv/config').then(() => console.log('✓ .env loaded'))"

# Test 2: API chargée
node -e "import('dotenv/config').then(() => console.log('API:', process.env.AI_GATEWAY_API_KEY ? 'OK' : 'MISSING'))"

# Test 3: Base de données
node -e "import('dotenv/config').then(() => console.log('DB:', process.env.DATABASE_URL))"

# Test 4: Tous les tests
node tests/ai-bot.test.js
```

---

## ÉTAPE 10: Une Fois Prêt - Démarrer

```bash
# Mode développement
npm run dev

# Ou production
npm start
```

Accédez à: **http://localhost:3000**

---

## 🎯 Résumé des Fichiers Modifiés

### ✅ Créés Automatiquement
- `.env` - Configuration

### ✅ Modifiés
- `tests/ai-bot.test.js` - Ligne 7 ajoutée: `import 'dotenv/config'`
- `services/riskManager.js` - Méthode `getTotalExposure()` ajoutée

---

## ✨ Vérification Finale

| Point de Vérification | Commande | Résultat Attendu |
|----------------------|----------|-----------------|
| .env existe | `type .env` | Affiche le contenu |
| API key dans .env | `findstr "AI_GATEWAY_API_KEY" .env` | `macleapi` |
| dotenv installé | `npm list dotenv` | `dotenv@x.x.x` |
| Test importe dotenv | `findstr "dotenv" tests\ai-bot.test.js` | `import 'dotenv/config'` |
| getTotalExposure existe | `findstr "getTotalExposure" services\riskManager.js` | `getTotalExposure() {` |

---

## 🆘 PROBLÈME RÉSIDUEL?

1. Vérifier chaque point du tableau ci-dessus
2. Lancer `npm install` pour réinstaller
3. Supprimer `.env` et le créer de nouveau
4. Consulter `SETUP_INSTRUCTIONS.md`
5. Vérifier les logs: `npm test 2>&1`

---

## 📞 Commande Pour Obtenir de l'Aide

```bash
# Afficher tous les fichiers importants
dir .env tests\ai-bot.test.js services\riskManager.js scripts\

# Afficher la configuration
type .env

# Lancer diagnostique complet
node tests/ai-bot.test.js
```

---

**Vous êtes maintenant prêt! 🚀**

Prochaine étape: `npm test` puis `npm start`
