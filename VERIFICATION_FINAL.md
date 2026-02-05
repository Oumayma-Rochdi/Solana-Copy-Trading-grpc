## ✅ Vérification Finale: Système de Données Solana

Utilisez cette checklist pour vérifier que tout fonctionne correctement.

---

## 🔍 Phase 1: Vérification de la Configuration

### Fichiers .env
- [ ] `BIRDEYE_API_KEY` est défini
- [ ] `HELIUS_API_KEY` est défini  
- [ ] `DATABASE_URL` est défini
- [ ] `AUTO_START_DATA_SYNC=true` (optionnel)
- [ ] `SYNC_FREQUENCY=30000` (optionnel)

**Vérifier avec:**
```bash
env | grep -E "BIRDEYE|HELIUS|DATABASE"
```

### Base de Données
- [ ] PostgreSQL est accessible
- [ ] `DATABASE_URL` est valide
- [ ] Connexion testée

**Vérifier avec:**
```bash
psql -d $DATABASE_URL -c "SELECT version();"
```

---

## 🔧 Phase 2: Vérification de l'Installation

### Fichiers Créés
- [ ] `scripts/create-solana-data-tables.sql` existe
- [ ] `services/dataProviders/birdeyeProvider.js` existe
- [ ] `services/dataProviders/heliusProvider.js` existe
- [ ] `services/dataProviders/raydiumProvider.js` existe
- [ ] `services/solanaDataSync.js` existe
- [ ] `services/solanaDataQuery.js` existe
- [ ] `services/initialization.js` existe

**Vérifier avec:**
```bash
ls -la services/dataProviders/
ls -la services/solanaData*.js
```

### Tables de Base de Données
- [ ] Tables créées avec succès

**Vérifier avec:**
```bash
psql -d $DATABASE_URL -c "\dt solana_*"
```

**Résultat attendu:**
```
               List of relations
 Schema |         Name          | Type  | Owner
--------+-----------------------+-------+-------
 public | solana_data_sources   | table | ...
 public | solana_liquidity_pools| table | ...
 public | solana_market_metrics | table | ...
 public | solana_orderbook_data | table | ...
 public | solana_sync_logs      | table | ...
 public | solana_token_holders  | table | ...
 public | solana_token_prices   | table | ...
 public | solana_tokens         | table | ...
 public | solana_transactions   | table | ...
```

---

## 🚀 Phase 3: Démarrage et Tests

### Lancer le Bot
```bash
npm start
```

- [ ] Bot démarre sans erreur
- [ ] "Service initialization" apparaît dans les logs
- [ ] Pas d'erreurs de connexion DB

### Tester les Endpoints

#### Health Check
```bash
curl http://localhost:3000/api/health
```

**Résultat attendu:**
```json
{ "status": "healthy", "uptime": 45.123, ... }
```

#### Vérifier que les données commencent à être collectées
```bash
# Attendre 30-60 secondes, puis:
curl http://localhost:3000/api/data/stats/volume
```

**Résultat attendu (après 1-2 minutes):**
```json
{
  "success": true,
  "stats": {
    "total_volume": 1000000000,
    "active_tokens": 100,
    ...
  }
}
```

---

## 📊 Phase 4: Vérification des Données

### 1. Vérifier que les données arrivent

#### Commande
```bash
psql -d $DATABASE_URL -c "SELECT COUNT(*) FROM solana_token_prices WHERE recorded_at > NOW() - INTERVAL '2 minutes';"
```

**Résultat attendu:**
- Devrait afficher un nombre > 0 après 1-2 minutes

#### Si 0, vérifier:
```bash
# Voir les erreurs de sync
psql -d $DATABASE_URL -c "SELECT * FROM solana_sync_logs ORDER BY created_at DESC LIMIT 5;"

# Vérifier la dernière tentative
psql -d $DATABASE_URL -c "SELECT * FROM solana_data_sources;"
```

### 2. Vérifier les tokens collectés

```bash
psql -d $DATABASE_URL -c "SELECT symbol, price, market_cap FROM solana_token_prices LIMIT 10;"
```

**Résultat attendu:**
```
 symbol |   price    | market_cap
--------+------------+------------
 SOL    | 135.50     | 50000000000
 USDC   | 0.99       | 30000000000
 ...
```

### 3. Vérifier les transactions

```bash
psql -d $DATABASE_URL -c "SELECT COUNT(*) FROM solana_transactions WHERE recorded_at > NOW() - INTERVAL '5 minutes';"
```

**Résultat attendu:**
- Devrait afficher plusieurs transactions

### 4. Vérifier les pools

```bash
psql -d $DATABASE_URL -c "SELECT pool_name, liquidity_usd FROM solana_liquidity_pools LIMIT 5;"
```

**Résultat attendu:**
```
     pool_name      | liquidity_usd
--------------------+---------------
 SOL/USDC (Raydium) | 50000000
 COPE/SOL (Raydium) | 20000000
 ...
```

---

## 🌐 Phase 5: Tester les Endpoints API

### Top Gainers
```bash
curl "http://localhost:3000/api/data/gainers?limit=5" | jq
```

### Top Losers
```bash
curl "http://localhost:3000/api/data/losers?limit=5" | jq
```

### Whale Transactions
```bash
curl "http://localhost:3000/api/data/whale-transactions?limit=10" | jq
```

### Prix d'un Token
```bash
curl "http://localhost:3000/api/data/token/EPjFWaLb3odcccccccccccccccccccccccccccccc/price" | jq
```

### Pools
```bash
curl "http://localhost:3000/api/data/pools?limit=10" | jq
```

### Stats de Volume
```bash
curl "http://localhost:3000/api/data/stats/volume" | jq
```

---

## ⚠️ Phase 6: Vérification des Problèmes Courants

### Problème: "No data for token"

**Vérification:**
1. Attendre 60+ secondes après le lancement
2. Vérifier les logs:
   ```bash
   npm start 2>&1 | grep -i "error\|sync\|token"
   ```
3. Vérifier que les tables sont remplies:
   ```bash
   psql -d $DATABASE_URL -c "SELECT COUNT(*) FROM solana_tokens;"
   ```

### Problème: "Database connection failed"

**Vérification:**
1. Tester la connexion DB:
   ```bash
   psql -d $DATABASE_URL -c "SELECT 1"
   ```
2. Vérifier DATABASE_URL:
   ```bash
   echo $DATABASE_URL
   ```
3. Vérifier les credentials

### Problème: "API Key invalid"

**Vérification:**
1. Vérifier la clé Birdeye:
   ```bash
   curl -H "X-API-KEY: $BIRDEYE_API_KEY" https://api.birdeye.so/defi/token_overview?address=EPjFWaLb3...
   ```
2. Vérifier la clé Helius:
   ```bash
   curl https://api.helius.xyz/v0/addresses/EPjFWaLb3...?api-key=$HELIUS_API_KEY
   ```

### Problème: "Sync très lent"

**Solutions:**
1. Augmenter `SYNC_FREQUENCY` à 60000 (60s)
2. Réduire le nombre de tokens dans `WATCH_TOKENS`
3. Vérifier la vitesse Internet:
   ```bash
   ping 8.8.8.8
   speedtest-cli
   ```

---

## 📈 Phase 7: Performance Monitoring

### Vérifier la Mémoire
```bash
# Pendant le fonctionnement
ps aux | grep "node\|npm"
```

**Normal:** < 200MB

### Vérifier le CPU
```bash
# En temps réel
top -p $(pgrep node)
```

**Normal:** 5-15% du CPU

### Vérifier la DB
```bash
# Nombre de connections
psql -d $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Taille des tables
psql -d $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public';"
```

---

## 🎯 Phase 8: Test d'Intégration Complète

### Scénario: Trader sur les Top Gainers

```bash
# 1. Lancer le bot
npm start

# 2. Attendre 1-2 minutes
sleep 120

# 3. Récupérer les top gainers
curl "http://localhost:3000/api/data/gainers?limit=5"

# 4. Pour chaque token, récupérer les holders
for token in $(curl -s "http://localhost:3000/api/data/gainers?limit=3" | jq -r '.gainers[].mint'); do
  echo "Token: $token"
  curl -s "http://localhost:3000/api/data/token/$token/holders" | jq '.holders.top_10_concentration'
done

# 5. Vérifier les whale trades
curl "http://localhost:3000/api/data/whale-transactions?limit=5"
```

---

## ✅ Checklist Finale

Avant de considérer que tout fonctionne:

- [ ] Bot démarre sans erreur
- [ ] Database connectée et accessible
- [ ] Tables Solana créées
- [ ] Données collectées dans les 2 minutes
- [ ] API endpoints répondent
- [ ] Top gainers/losers affichent des données
- [ ] Whale trades affichent des transactions
- [ ] Pas de mémoire qui fuite
- [ ] CPU stable
- [ ] Logs affichent la synchronisation

---

## 📊 Dashboard de Santé

Pour monitorer en continu:

```bash
# Terminal 1: Logs du bot
npm start

# Terminal 2: Monitorer les données
watch -n 5 "psql -d \$DATABASE_URL -c \"SELECT COUNT(*) FROM solana_token_prices WHERE recorded_at > NOW() - INTERVAL '1 minute';\""

# Terminal 3: Tester API
watch -n 10 "curl -s http://localhost:3000/api/data/stats/volume | jq '.stats.active_tokens'"
```

---

## 🎓 Résolution des Problèmes Avancés

### Si rien ne fonctionne:

1. **Vérifier les logs complets:**
   ```bash
   npm start 2>&1 | tee bot.log
   grep -i "error\|fail\|exception" bot.log
   ```

2. **Vérifier l'initialisation:**
   ```bash
   npm start 2>&1 | grep -A5 "Init\|initialize"
   ```

3. **Tester chaque provider séparément:**
   ```javascript
   // test-birdeye.js
   import birdeyeProvider from './services/dataProviders/birdeyeProvider.js';
   const result = await birdeyeProvider.getTokenPrice('EPjFWaLb3...');
   console.log(result);
   ```

---

## 🚀 Prochaine Étape

Une fois que tout fonctionne:

1. Lire **GUIDE_DONNEES_REELLES.md** pour les cas d'usage
2. Intégrer les données avec votre IA
3. Commencer à trader!

---

**Ça y est! Vous êtes prêt à utiliser les vraies données Solana!** 🎉
